// The Brief→POC agent, built as a LangGraph state machine.
//
//   START ─▶ retrieve ─▶ draft ─▶ handoff ─▶ END
//
// - retrieve: explainable structured scoring over the template library.
// - draft:    an AI model writes the editable POC plan;
//             deterministic sample fallback when the model is not configured.
// - handoff:  assembles the Delivery handoff skeleton.
//
// Runs server-side only (imported from the /api/draft route).

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { retrieve } from "./retrieval";
import { planFor, handoffSkeleton, templateById, type Brief, type PocPlan, type TemplateMatch } from "./mock";

export type DraftSource = "ai" | "sample";

const SYSTEM = `You are a senior pre-sales Solution Architect at an enterprise software company that sells to banks and insurers. You turn a won-deal brief into a concrete, editable Proof-of-Concept (POC) plan a colleague could send to the customer with light edits.

Rules:
- Reuse the supplied solution templates. Say exactly what changes for THIS customer (their systems, their regulator, their region).
- Be specific and financial-services literate. No filler, no summaries of the brief.
- Scope must be honest: what the POC will and will not prove.
- Only reference template ids from the list you are given.
- Respond with ONLY a JSON object, no prose, no markdown fences.`;

function userPrompt(brief: Brief, matches: TemplateMatch[]): string {
  const templates = matches
    .map((m) => {
      const t = templateById(m.templateId);
      if (!t) return "";
      return `- id: ${t.id}\n  name: ${t.name}\n  region: ${t.region}\n  segment: ${t.segment}\n  regulator: ${t.regulator}\n  problem: ${t.problem}\n  capabilities: ${t.capabilities.join(", ")}\n  integrations: ${t.integrations.join(", ")}\n  outcome: ${t.outcome}`;
    })
    .join("\n");

  return `BRIEF
Account: ${brief.account}
Region: ${brief.region}
Segment: ${brief.segment}
Regulator: ${brief.regulator}
Problem: ${brief.problem}
Systems in use: ${brief.systems.join(", ")}
Timeline: ${brief.timeline}
Success looks like: ${brief.success}

RETRIEVED TEMPLATES (reuse these)
${templates}

Return JSON with exactly these keys:
{
  "objective": string,
  "successCriteria": string[],
  "scopeIn": string[],
  "scopeOut": string[],
  "templatesUsed": [{"templateId": string, "change": string}],
  "integrations": string[],
  "weekPlan": [{"week": string, "work": string}],
  "risks": string[],
  "people": string[]
}`;
}

function coercePlan(raw: unknown): PocPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  if (typeof p.objective !== "string" || !Array.isArray(p.successCriteria)) return null;
  return {
    objective: p.objective,
    successCriteria: arr(p.successCriteria) as string[],
    scopeIn: arr(p.scopeIn) as string[],
    scopeOut: arr(p.scopeOut) as string[],
    templatesUsed: arr(p.templatesUsed) as PocPlan["templatesUsed"],
    integrations: arr(p.integrations) as string[],
    weekPlan: arr(p.weekPlan) as PocPlan["weekPlan"],
    risks: arr(p.risks) as string[],
    people: arr(p.people) as string[],
  };
}

// ---- Graph state ------------------------------------------------------------

const GraphState = Annotation.Root({
  brief: Annotation<Brief>(),
  boosts: Annotation<Record<string, number>>(),
  matches: Annotation<TemplateMatch[]>(),
  plan: Annotation<PocPlan>(),
  handoff: Annotation<{ section: string; note: string }[]>(),
  source: Annotation<DraftSource>(),
  model: Annotation<string | null>(),
});
type State = typeof GraphState.State;

async function retrieveNode(s: State): Promise<Partial<State>> {
  return { matches: retrieve(s.brief, s.boosts ?? {}) };
}

async function draftNode(s: State): Promise<Partial<State>> {
  const model = process.env.LLM_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) {
    return { plan: planFor(s.brief), source: "sample", model: null };
  }
  try {
    const llm = new ChatAnthropic({ model, maxTokens: 4000 });
    const res = await llm.invoke([new SystemMessage(SYSTEM), new HumanMessage(userPrompt(s.brief, s.matches))]);
    const raw = res.content;
    let text =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
        ? raw.map((p) => (typeof p === "string" ? p : ((p as { text?: string }).text ?? ""))).join("")
        : "";
    text = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const plan = coercePlan(JSON.parse(text));
    if (!plan) return { plan: planFor(s.brief), source: "sample", model: null };
    return { plan, source: "ai", model };
  } catch {
    return { plan: planFor(s.brief), source: "sample", model: null };
  }
}

async function handoffNode(s: State): Promise<Partial<State>> {
  return { handoff: handoffSkeleton(s.brief) };
}

const workflow = new StateGraph(GraphState)
  .addNode("retrieve", retrieveNode)
  .addNode("draft", draftNode)
  .addNode("assemble", handoffNode)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "draft")
  .addEdge("draft", "assemble")
  .addEdge("assemble", END);

const compiled = workflow.compile();

export interface BriefToPocResult {
  matches: TemplateMatch[];
  plan: PocPlan;
  handoff: { section: string; note: string }[];
  source: DraftSource;
  model: string | null;
}

export async function runBriefToPoc(brief: Brief, boosts: Record<string, number> = {}): Promise<BriefToPocResult> {
  const out = await compiled.invoke({ brief, boosts });
  return {
    matches: out.matches ?? [],
    plan: out.plan ?? planFor(brief),
    handoff: out.handoff ?? handoffSkeleton(brief),
    source: out.source ?? "sample",
    model: out.model ?? null,
  };
}
