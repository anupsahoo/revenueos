// The handoff document Delivery receives when a POC plan is accepted.
//
// Every line in it is traced to where it came from: the brief, the accepted
// plan, or the templates retrieval matched. A section with no source is NOT
// filled with plausible text — it is marked `missing` and says what Delivery has
// to go and find. That is the whole point: a document that quietly invents an
// access owner is worse than one that admits it does not know.
//
// Generation is pure and deterministic. The same brief and plan always produce
// the same markdown, byte for byte, so a regenerated document can be diffed
// against the one that was sent.

import type { Brief, PocPlan, TemplateMatch } from "./mock";

/** Just enough of a template to name it. Passed in so this module stays pure. */
export interface TemplateRef { name: string; region: string; effortWeeks: number }
export type TemplateLookup = (id: string) => TemplateRef | undefined;

export interface HandoffSection {
  id: string;
  title: string;
  /** Lines that were sourced. Empty when the section is missing. */
  lines: string[];
  /** Where the lines came from — this is what the ⓘ shows. */
  source: string;
  /** Set when nothing could be sourced: what Delivery has to find, and from whom. */
  missing?: string;
}

export interface HandoffDoc {
  briefId: string;
  account: string;
  title: string;
  sections: HandoffSection[];
}

const bullet = (s: string) => s.trim().replace(/\s+/g, " ");

/**
 * Coverage = sections carrying at least one sourced line ÷ total sections.
 * Derived on read from the document; never stored.
 */
export function handoffCoverage(doc: HandoffDoc): { sourced: number; total: number; rate: number } {
  const total = doc.sections.length;
  const sourced = doc.sections.filter((s) => s.lines.length > 0).length;
  return { sourced, total, rate: total === 0 ? 0 : sourced / total };
}

/** Sections still needing a human, in document order. */
export function handoffGaps(doc: HandoffDoc): { title: string; missing: string }[] {
  return doc.sections
    .filter((s) => s.lines.length === 0 && s.missing)
    .map((s) => ({ title: s.title, missing: s.missing as string }));
}

export function generateHandoff(
  brief: Brief,
  plan: PocPlan,
  matches: TemplateMatch[],
  lookup: TemplateLookup = () => undefined,
): HandoffDoc {
  const s = (
    id: string,
    title: string,
    lines: string[],
    source: string,
    missing: string,
  ): HandoffSection => {
    const kept = lines.map(bullet).filter(Boolean);
    return kept.length > 0
      ? { id, title, lines: kept, source }
      : { id, title, lines: [], source, missing };
  };

  const reuse = matches.map((m) => {
    const t = lookup(m.templateId);
    const change = plan.templatesUsed.find((u) => u.templateId === m.templateId)?.change;
    const name = t ? `${t.name} (${t.region}, ${t.effortWeeks}w)` : m.templateId;
    return change ? `${name} — changes for this customer: ${change}` : `${name} — what changes here is not stated in the plan`;
  });

  return {
    briefId: brief.id,
    account: brief.account,
    title: brief.title,
    sections: [
      s("context", "Account & context",
        [`${brief.account} — ${brief.segment}, ${brief.region}, regulator ${brief.regulator}`,
         `Handed over by ${brief.fromRep}`,
         `Customer timeline: ${brief.timeline}`],
        "brief.account, .segment, .region, .regulator, .fromRep, .timeline",
        "no account context on the brief"),

      s("problem", "Problem statement",
        [brief.problem],
        "brief.problem",
        "the brief carries no problem statement — go back to the AE before kickoff"),

      s("objective", "Objective agreed with the customer",
        [plan.objective],
        "the accepted plan, objective",
        "the accepted plan has no objective — do not start until one is agreed"),

      s("success", "Success criteria",
        plan.successCriteria,
        "the accepted plan, successCriteria",
        "no success criteria in the accepted plan; confirm with the customer sponsor before kickoff"),

      s("scope", "Scope",
        [...plan.scopeIn.map((x) => `IN — ${x}`), ...plan.scopeOut.map((x) => `OUT — ${x}`)],
        "the accepted plan, scopeIn and scopeOut",
        "scope is not stated in the accepted plan"),

      s("reuse", "What this reuses, and what changes",
        reuse,
        "retrieval matches + the accepted plan, templatesUsed",
        "no template cleared the retrieval threshold, so this POC is being built from scratch — say so at kickoff"),

      s("integrations", "Systems & integrations",
        plan.integrations.length ? plan.integrations : brief.systems,
        "the accepted plan, integrations (falls back to brief.systems)",
        "no systems named on the brief or the plan"),

      // Deliberately unsourceable today. Neither the brief nor the plan carries a
      // named access owner, so this section always reports the gap rather than
      // inventing a name. It fills itself once the CRM connector lands (#57).
      s("environments", "Environments & access owners", [],
        "not derivable — no source in the brief or the plan",
        brief.systems.length
          ? `an access owner is needed per system (${brief.systems.join(", ")}). Not on the brief or the plan — Delivery must confirm with the customer's IT contact before week 1.`
          : "no systems named, so no access owners to confirm. Go back to the AE."),

      s("data", "Data handling & security",
        [`Regulator in scope: ${brief.regulator}`,
         `Region: ${brief.region} — confirm residency requirements apply`],
        "brief.regulator, brief.region",
        "no regulator or region on the brief"),

      s("plan", "Week-by-week plan",
        plan.weekPlan.map((w) => `${w.week}: ${w.work}`),
        "the accepted plan, weekPlan",
        "the accepted plan has no week-by-week breakdown"),

      s("risks", "Risks & dependencies",
        plan.risks,
        "the accepted plan, risks",
        "no risks recorded on the plan — that is itself a risk; review before kickoff"),

      s("team", "People",
        plan.people,
        "the accepted plan, people",
        "nobody is named on the plan; the POC has no owner until this is filled"),
    ],
  };
}

/**
 * Deterministic markdown. Stable section order and stable line order, so two
 * generations of the same plan diff to nothing and a changed plan diffs to
 * exactly what changed.
 */
export function handoffToMarkdown(doc: HandoffDoc): string {
  const cov = handoffCoverage(doc);
  const out: string[] = [
    `# Delivery handoff — ${doc.account}`,
    "",
    `**Brief** ${doc.briefId} · ${doc.title}`,
    `**Sections sourced** ${cov.sourced} of ${cov.total}`,
    "",
    "> Generated from the accepted POC plan. Sections marked *needs a human* had",
    "> no source in the brief or the plan and were deliberately left unfilled.",
    "",
  ];
  for (const sec of doc.sections) {
    out.push(`## ${sec.title}`);
    if (sec.lines.length) {
      for (const l of sec.lines) out.push(`- ${l}`);
      out.push("", `_Source: ${sec.source}_`);
    } else {
      out.push(`**Needs a human.** ${sec.missing}`);
    }
    out.push("");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
