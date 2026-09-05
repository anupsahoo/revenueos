import { NextResponse } from "next/server";
import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const runtime = "nodejs";
export const maxDuration = 45;

const keyed = () => !!process.env.ANTHROPIC_API_KEY && !!process.env.LLM_MODEL;

// GET → whether the assistant is available (drives the inert state in the UI).
export async function GET() {
  return NextResponse.json({ keyed: keyed() });
}

const SYSTEM = `You are "Ask the seam", a read-only explainer sitting next to a PreSales handoff console. You answer questions about how this screen works and what the numbers mean, using only the context provided. Rules:
- At most 4 short sentences.
- Then, on a new line, one "Also:" sentence with a useful related point.
- Be concrete and honest. If something is synthetic or not built, say so plainly.
- No marketing language.`;

export async function POST(req: Request) {
  if (!keyed()) return NextResponse.json({ inert: true }, { status: 200 });
  let body: { question?: string; context?: unknown } = {};
  try { body = await req.json(); } catch {}
  const question = (body.question || "").toString().slice(0, 500);
  if (!question.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  const context = `CONTEXT (all synthetic):
${JSON.stringify(body.context ?? {}, null, 0)}

Facts you may use:
- SLA for PreSales pickup is 2 business days. US actual in the brief is 6.8 days. Reuse baseline is 21% (UK 58%, India 55%).
- Brief age is computed from each brief's arrival time in business days, not stored.
- Match score = structured scoring in lib/retrieval.ts (segment 30, regulator 16/analogue 8, problem overlap up to 26, shared systems up to 18, recency 5, proven reuse 4, cross-region 3, plus a learned +/-8 per prior accept/reject), threshold 40.
- Reuse rate = accepted / (accepted + rejected) decisions this session.
- The event store is in-memory and resets on cold start (not built as a database).
- Cut from M0: second seam, root-cause tags. Tracked later: durable store, HubSpot webhook, eval harness, tracing.`;

  try {
    const llm = new ChatAnthropic({ model: process.env.LLM_MODEL as string, maxTokens: 400 });
    const res = await llm.invoke([new SystemMessage(SYSTEM), new HumanMessage(`${context}\n\nQuestion: ${question}`)]);
    const raw = res.content;
    const answer = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((p) => (typeof p === "string" ? p : (p as { text?: string }).text ?? "")).join("") : "";
    return NextResponse.json({ answer: answer.trim(), sources: "lib/retrieval.ts · decision events · lib/mock.ts" });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
