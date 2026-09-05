import { test } from "node:test";
import assert from "node:assert/strict";
import { generateHandoff, handoffCoverage, handoffGaps, handoffToMarkdown } from "./handoff.ts";
import type { Brief, PocPlan, TemplateMatch } from "./mock.ts";

const brief: Brief = {
  id: "br-test", account: "Test Bank", title: "KYC backlog",
  region: "US", segment: "Retail bank", regulator: "OCC",
  problem: "Manual KYC review is three days behind.",
  systems: ["Actimize", "Salesforce"],
  timeline: "8 weeks", success: "Review time under 4 hours",
  arrivedAt: Date.parse("2026-09-01T09:00:00Z"), fromRep: "Sam Reed",
};

const plan: PocPlan = {
  objective: "Prove KYC review under four hours",
  successCriteria: ["Review time under 4 hours"],
  scopeIn: ["Core review workflow"],
  scopeOut: ["Production rollout"],
  templatesUsed: [{ templateId: "tpl-uk-kyc-01", change: "Swap FCA rules for OCC" }],
  integrations: ["Actimize"],
  weekPlan: [{ week: "Week 1", work: "Access and samples" }],
  risks: ["Sample data availability"],
  people: ["Dana Ortiz (lead)"],
};

const matches: TemplateMatch[] = [{ templateId: "tpl-uk-kyc-01", score: 71, reasons: ["Same segment"] }];

test("coverage counts only sections that sourced a line", () => {
  const doc = generateHandoff(brief, plan, matches);
  const c = handoffCoverage(doc);
  assert.equal(c.total, 12);
  // Environments has no source anywhere, so it can never be sourced.
  assert.equal(c.sourced, 11);
  assert.equal(c.rate, 11 / 12);
});

test("an unsourceable section is reported, not invented", () => {
  const doc = generateHandoff(brief, plan, matches);
  const env = doc.sections.find((s) => s.id === "environments");
  assert.ok(env);
  assert.equal(env.lines.length, 0);
  assert.match(env.missing ?? "", /access owner is needed per system/);
  // and it names the systems it does know about
  assert.match(env.missing ?? "", /Actimize, Salesforce/);
});

test("an empty plan degrades to gaps rather than filler", () => {
  const empty: PocPlan = {
    objective: "", successCriteria: [], scopeIn: [], scopeOut: [],
    templatesUsed: [], integrations: [], weekPlan: [], risks: [], people: [],
  };
  const doc = generateHandoff(brief, empty, []);
  const gaps = handoffGaps(doc);
  const titles = gaps.map((g) => g.title);
  assert.ok(titles.includes("Success criteria"));
  assert.ok(titles.includes("People"));
  assert.ok(titles.includes("What this reuses, and what changes"));
  // integrations still fall back to the brief's systems
  assert.deepEqual(doc.sections.find((s) => s.id === "integrations")?.lines, ["Actimize", "Salesforce"]);
  // nothing was fabricated for the empty sections
  for (const g of gaps) assert.ok(g.missing.length > 0);
});

test("generation is deterministic, so two runs diff to nothing", () => {
  const a = handoffToMarkdown(generateHandoff(brief, plan, matches));
  const b = handoffToMarkdown(generateHandoff(brief, plan, matches));
  assert.equal(a, b);
});

test("a changed plan changes the document", () => {
  const before = handoffToMarkdown(generateHandoff(brief, plan, matches));
  const after = handoffToMarkdown(
    generateHandoff(brief, { ...plan, risks: ["Sample data availability", "Regulator interpretation"] }, matches),
  );
  assert.notEqual(before, after);
  assert.match(after, /Regulator interpretation/);
});
