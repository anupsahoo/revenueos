// Explainable retrieval over the template library.
// Deterministic structured scoring — every match carries the reasons that
// produced its score, and per-template boosts let the ranking learn from
// accept/reject decisions. This is the "reasons over knowledge" core.

import { TEMPLATES, type Brief, type SolutionTemplate, type TemplateMatch } from "./mock";

// All financial-services regulators are treated as analogues of one another.
const FS_REGULATORS = new Set(["FCA", "OCC", "RBI", "SEBI", "NAIC", "CFPB", "MAS", "APRA", "BaFin", "AMF"]);

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "are", "was", "were", "has", "have", "had",
  "their", "them", "they", "from", "into", "out", "not", "but", "all", "any", "can", "will",
  "want", "wants", "need", "needs", "without", "adding", "before", "after", "every", "each",
  "new", "more", "than", "over", "week", "weeks", "day", "days", "poc", "system", "systems",
]);

function tokens(...parts: string[]): Set<string> {
  const out = new Set<string>();
  for (const p of parts.join(" ").toLowerCase().split(/[^a-z0-9]+/)) {
    if (p.length > 2 && !STOP.has(p)) out.add(p);
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = [];
  for (const t of a) if (b.has(t)) shared.push(t);
  return shared;
}

const DAY = 86_400_000;

export function scoreTemplate(
  brief: Brief,
  t: SolutionTemplate,
  boost = 0
): TemplateMatch {
  let score = 0;
  const reasons: string[] = [];

  // Segment
  if (t.segment === brief.segment) {
    score += 30;
    reasons.push(`Segment match: ${t.segment.toLowerCase()}`);
  }

  // Regulator
  if (t.regulator === brief.regulator) {
    score += 16;
    reasons.push(`Regulator match: ${t.regulator}`);
  } else if (FS_REGULATORS.has(t.regulator) && FS_REGULATORS.has(brief.regulator)) {
    score += 8;
    reasons.push(`Regulator analogue: ${t.regulator} ↔ ${brief.regulator}`);
  }

  // Problem / capability keyword overlap
  const briefWords = tokens(brief.problem, brief.success);
  const tplWords = tokens(t.problem, t.capabilities.join(" "), t.name);
  const shared = overlap(briefWords, tplWords);
  if (shared.length) {
    score += Math.min(shared.length * 7, 26);
    reasons.push(`Problem overlap: ${shared.slice(0, 4).join(", ")}`);
  }

  // System / integration overlap
  const sysShared = brief.systems.filter((s) =>
    t.integrations.some((i) => i.toLowerCase() === s.toLowerCase())
  );
  if (sysShared.length) {
    score += Math.min(sysShared.length * 6, 18);
    reasons.push(`Shares ${sysShared.length} system${sysShared.length > 1 ? "s" : ""}: ${sysShared.join(", ")}`);
  }

  // Recency
  const daysSinceUse = (Date.now() - new Date(t.lastUsed).getTime()) / DAY;
  if (daysSinceUse < 60) {
    score += 5;
    reasons.push(`Recently used (${Math.round(daysSinceUse)}d ago)`);
  }

  // Proven reuse
  if (t.timesReused >= 6) {
    score += 4;
    reasons.push(`Proven: reused ${t.timesReused}×`);
  }

  // Cross-region reuse is the whole point — nudge UK/India origins for US briefs
  if (brief.region !== t.region) {
    score += 3;
    reasons.push(`Cross-region reuse: ${t.region} → ${brief.region}`);
  }

  // Learned boost from prior accept/reject on this template
  if (boost !== 0) {
    score += boost;
    reasons.push(boost > 0 ? `Ranking boost from prior acceptances (+${boost})` : `Ranking penalty from prior rejections (${boost})`);
  }

  return { templateId: t.id, score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

export function retrieve(
  brief: Brief,
  boosts: Record<string, number> = {},
  limit = 3
): TemplateMatch[] {
  return TEMPLATES.map((t) => scoreTemplate(brief, t, boosts[t.id] ?? 0))
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
