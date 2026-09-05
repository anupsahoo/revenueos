import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { store } from "@/lib/events";
import { health, queue, triggerLog, reuseRate, boosts } from "@/lib/derive";
import { BRIEFS, TEMPLATES, SLA_DAYS, templateById } from "@/lib/mock";
import { scoreTemplate } from "@/lib/retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

const keyed = () => !!process.env.ANTHROPIC_API_KEY && !!process.env.LLM_MODEL;

export async function GET() {
  return NextResponse.json({ keyed: keyed() });
}

const DOCS = ["README.md", "PLAN.md", "PRODUCT.md", "docs/DECISIONS.md", "docs/CUT-LIST.md", "docs/BUILD-LOG.md", "docs/ROADMAP.md"];

const SYSTEM = `You answer questions about one running RevenueOS instance. Use only the tools. Cite the event ids or file names you used. Format: answer in 4 short sentences or fewer, then a line starting "Also:" with one adjacent fact from the same tool results that the person did not ask for but would want. If the tools do not contain the answer, say so in one sentence and name what would be needed. Never invent events, numbers, or template ids.`;

const TOOLS: Anthropic.Tool[] = [
  { name: "get_events", description: "Read the append-only event log. Optional filters.", input_schema: { type: "object", properties: { briefId: { type: "string" }, type: { type: "string" }, since: { type: "string" } } } },
  { name: "get_health", description: "Seam health counts, the queue with computed ages and statuses, the trigger log and the reuse rate. All derived from the event log.", input_schema: { type: "object", properties: {} } },
  { name: "get_brief", description: "One brief by id.", input_schema: { type: "object", properties: { briefId: { type: "string" } }, required: ["briefId"] } },
  { name: "get_template", description: "One solution template by id, or all of them if no id is given.", input_schema: { type: "object", properties: { templateId: { type: "string" } } } },
  { name: "explain_match", description: "Re-run the retrieval scoring for one brief against one template and return the score and the reasons.", input_schema: { type: "object", properties: { briefId: { type: "string" }, templateId: { type: "string" } }, required: ["briefId", "templateId"] } },
  { name: "read_doc", description: `Read one project document. Allowed: ${DOCS.join(", ")}`, input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
];

async function runTool(name: string, input: Record<string, unknown>): Promise<{ result: unknown; source: string }> {
  const events = await store.all();
  const now = Date.now();
  switch (name) {
    case "get_events": {
      const evs = await store.list({ briefId: input.briefId as string | undefined, type: input.type as never, since: input.since as string | undefined });
      const slim = evs.slice(-40).map((e) => ({ id: e.id, ts: e.ts, type: e.type, actor: e.actor, briefId: e.briefId, synthetic: e.synthetic, payload: e.payload }));
      return { result: slim, source: `events(${slim.length})` };
    }
    case "get_health":
      return { result: { slaDays: SLA_DAYS, health: health(events, now), queue: queue(events, now), triggers: triggerLog(events), reuse: reuseRate(events), boosts: boosts(events) }, source: "lib/derive.ts" };
    case "get_brief": {
      const b = BRIEFS.find((x) => x.id === input.briefId);
      return { result: b ?? { error: "unknown briefId" }, source: `brief ${input.briefId}` };
    }
    case "get_template": {
      const t = input.templateId ? templateById(input.templateId as string) : TEMPLATES;
      return { result: t ?? { error: "unknown templateId" }, source: input.templateId ? `template ${input.templateId}` : "template library" };
    }
    case "explain_match": {
      const b = BRIEFS.find((x) => x.id === input.briefId);
      const t = templateById(input.templateId as string);
      if (!b || !t) return { result: { error: "unknown brief or template" }, source: "explain_match" };
      const m = scoreTemplate(b, t, boosts(events)[t.id] ?? 0);
      return { result: m, source: `explain_match ${b.id}/${t.id}` };
    }
    case "read_doc": {
      const nameIn = String(input.name ?? "");
      if (!DOCS.includes(nameIn)) return { result: { error: `not allowed. Allowed: ${DOCS.join(", ")}` }, source: "read_doc" };
      try {
        const text = fs.readFileSync(path.join(process.cwd(), nameIn), "utf8");
        return { result: text.slice(0, 12000), source: nameIn };
      } catch {
        return { result: { error: `${nameIn} does not exist yet` }, source: nameIn };
      }
    }
    default:
      return { result: { error: "unknown tool" }, source: name };
  }
}

export async function POST(req: Request) {
  if (!keyed()) return NextResponse.json({ inert: true }, { status: 200 });
  let body: { question?: string } = {};
  try { body = await req.json(); } catch {}
  const question = (body.question || "").toString().slice(0, 500);
  if (!question.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  const client = new Anthropic();
  const model = process.env.LLM_MODEL as string;
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  const sources: string[] = [];

  try {
    for (let hop = 0; hop < 6; hop++) {
      const res = await client.messages.create({ model, max_tokens: 1200, system: SYSTEM, tools: TOOLS, messages });
      if (res.stop_reason === "tool_use") {
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of res.content) {
          if (block.type !== "tool_use") continue;
          const { result, source } = await runTool(block.name, (block.input ?? {}) as Record<string, unknown>);
          sources.push(source);
          results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result).slice(0, 20000) });
        }
        messages.push({ role: "assistant", content: res.content });
        messages.push({ role: "user", content: results });
        continue;
      }
      const answer = res.content.filter((b) => b.type === "text").map((b) => (b as Anthropic.TextBlock).text).join("").trim();
      return NextResponse.json({ answer, sources: sources.length ? Array.from(new Set(sources)).join(" · ") : "no tools needed" });
    }
    return NextResponse.json({ answer: "I could not settle that within the tool budget.", sources: Array.from(new Set(sources)).join(" · ") });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
