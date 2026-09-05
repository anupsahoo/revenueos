// The agent that does the work: given a brief and the retrieved templates, it
// drafts an editable POC plan. Uses Claude when ANTHROPIC_API_KEY is set;
// otherwise falls back to the deterministic sample plan so the app always runs.

import Anthropic from "@anthropic-ai/sdk";
import { planFor, templateById, type Brief, type PocPlan, type TemplateMatch } from "./mock";

export type DraftSource = "claude" | "sample";

export interface DraftResult {
  plan: PocPlan;
  source: DraftSource;
  model?: string;
}

const SYSTEM = `You are a senior pre-sales Solution Architect at an enterprise software company that sells to banks and insurers. You turn a won-deal brief into a concrete, editable Proof-of-Concept (POC) plan that a colleague could send to the customer with light edits.

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
      return `- id: ${t.id}\n  name: ${t.name}\n  region: ${t.region}\n  segment: ${t.segment}\n  regulator: ${t.regulator}\n  problem: ${t.problem}\n  capabilities: ${t.capabilities.join(", ")}\n  integrations: ${t.integrations.join(", ")}\n  effortWeeks: ${t.effortWeeks}\n  outcome: ${t.outcome}`;
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
  "successCriteria": string[],           // 3-5 measurable items
  "scopeIn": string[],                    // 3-5 items
  "scopeOut": string[],                   // 2-4 items
  "templatesUsed": [{"templateId": string, "change": string}],
  "integrations": string[],
  "weekPlan": [{"week": string, "work": string}],   // 4-6 weeks
  "risks": string[],                      // 3-4 items
  "people": string[]                      // roles needed
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

export async function draftPoc(brief: Brief, matches: TemplateMatch[]): Promise<DraftResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { plan: planFor(brief), source: "sample" };
  }
  const model = process.env.LLM_MODEL || "claude-opus-5";
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "low" }, // keep the demo snappy; raise for depth
      messages: [{ role: "user", content: userPrompt(brief, matches) }],
    });

    let text = "";
    for (const block of response.content) if (block.type === "text") text += block.text;
    text = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    const plan = coercePlan(JSON.parse(text));
    if (!plan) return { plan: planFor(brief), source: "sample" };
    return { plan, source: "claude", model };
  } catch {
    // Any API/parse failure → deterministic sample so the loop never breaks.
    return { plan: planFor(brief), source: "sample" };
  }
}
