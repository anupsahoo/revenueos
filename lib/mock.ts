// Synthetic data for the RevenueOS control-surface prototype.
// Everything here is fabricated. This module is the seam the backend replaces:
// the same types will later be served by the event store + Claude agent.

export type Region = "UK" | "US" | "India" | "Middle East";
export type Segment = "Retail bank" | "Insurer" | "Capital markets" | "Lender";
export type SeamStatus = "green" | "amber" | "red";

export interface SolutionTemplate {
  id: string;
  name: string;
  region: Region;
  segment: Segment;
  regulator: string;
  problem: string;
  capabilities: string[];
  integrations: string[];
  effortWeeks: number;
  outcome: string;
  lastUsed: string; // ISO date
  owner: string;
  timesReused: number;
}

export interface Brief {
  id: string;
  account: string;
  region: Region;
  segment: Segment;
  regulator: string;
  problem: string;
  systems: string[];
  timeline: string;
  success: string;
  ageDays: number; // synthetic age against the 2-day SLA
  fromRep: string; // Sales owner who handed it off
  arrived: string; // human label
}

export interface TemplateMatch {
  templateId: string;
  score: number; // 0..100
  reasons: string[];
}

export interface PocPlan {
  objective: string;
  successCriteria: string[];
  scopeIn: string[];
  scopeOut: string[];
  templatesUsed: { templateId: string; change: string }[];
  integrations: string[];
  weekPlan: { week: string; work: string }[];
  risks: string[];
  people: string[];
}

export const SLA_DAYS = 2;
export const SOLUTION_ARCHITECT = "Dana Ortiz";

export function statusForAge(ageDays: number): SeamStatus {
  if (ageDays >= SLA_DAYS) return "red";
  if (ageDays >= 1) return "amber";
  return "green";
}

// ---- Template library (8 templates, 3 regions) ------------------------------

export const TEMPLATES: SolutionTemplate[] = [
  {
    id: "tpl-uk-kyc-01",
    name: "KYC Document Review Copilot",
    region: "UK",
    segment: "Retail bank",
    regulator: "FCA",
    problem: "Manual review of onboarding documents created a multi-day KYC backlog.",
    capabilities: ["Document extraction", "Identity match", "Risk flagging", "Audit trail"],
    integrations: ["Actimize", "SharePoint", "Salesforce"],
    effortWeeks: 6,
    outcome: "Review time cut from 3 days to 4 hours in POC; 92% straight-through.",
    lastUsed: "2026-06-18",
    owner: "Priya Shah (UK PreSales)",
    timesReused: 7,
  },
  {
    id: "tpl-in-kyc-02",
    name: "KYC Onboarding Accelerator",
    region: "India",
    segment: "Retail bank",
    regulator: "RBI",
    problem: "High-volume retail onboarding needed CKYC-compliant automated checks.",
    capabilities: ["Document extraction", "CKYC lookup", "Risk scoring", "Case routing"],
    integrations: ["Finacle", "CKYC Registry", "ServiceNow"],
    effortWeeks: 7,
    outcome: "Cleared a 14-day onboarding backlog in the POC window.",
    lastUsed: "2026-07-02",
    owner: "Arjun Nair (India PreSales)",
    timesReused: 6,
  },
  {
    id: "tpl-uk-claims-03",
    name: "Claims Triage Assistant",
    region: "UK",
    segment: "Insurer",
    regulator: "FCA",
    problem: "First-notice-of-loss claims were queued for days before assignment.",
    capabilities: ["Claim classification", "Severity scoring", "Fraud pre-screen", "Routing"],
    integrations: ["Guidewire", "Twilio", "Snowflake"],
    effortWeeks: 8,
    outcome: "Auto-triaged 78% of FNOL claims within minutes in POC.",
    lastUsed: "2026-05-29",
    owner: "Tom Blake (UK PreSales)",
    timesReused: 5,
  },
  {
    id: "tpl-in-reg-04",
    name: "Regulatory Reporting Drafter",
    region: "India",
    segment: "Capital markets",
    regulator: "SEBI",
    problem: "Quarterly regulatory filings were assembled by hand from many systems.",
    capabilities: ["Data reconciliation", "Narrative drafting", "Validation checks", "Sign-off workflow"],
    integrations: ["Murex", "Oracle GL", "Confluence"],
    effortWeeks: 9,
    outcome: "Draft filing produced in hours with a full validation log.",
    lastUsed: "2026-06-11",
    owner: "Meera Iyer (India PreSales)",
    timesReused: 4,
  },
  {
    id: "tpl-uk-cs-05",
    name: "Customer Service Copilot",
    region: "UK",
    segment: "Retail bank",
    regulator: "FCA",
    problem: "Contact-centre agents lacked grounded answers for account queries.",
    capabilities: ["Grounded retrieval", "Policy citation", "Draft replies", "Escalation routing"],
    integrations: ["Zendesk", "Salesforce", "Confluence"],
    effortWeeks: 5,
    outcome: "Handle time down 34% with cited answers in POC.",
    lastUsed: "2026-07-20",
    owner: "Priya Shah (UK PreSales)",
    timesReused: 8,
  },
  {
    id: "tpl-in-fraud-06",
    name: "Fraud Alert Triage",
    region: "India",
    segment: "Retail bank",
    regulator: "RBI",
    problem: "Analysts were overwhelmed by low-quality transaction fraud alerts.",
    capabilities: ["Alert enrichment", "Risk scoring", "Case narrative", "Disposition suggestion"],
    integrations: ["Actimize", "Kafka", "ServiceNow"],
    effortWeeks: 7,
    outcome: "False-positive review load down 61% in POC.",
    lastUsed: "2026-06-27",
    owner: "Arjun Nair (India PreSales)",
    timesReused: 6,
  },
  {
    id: "tpl-in-loan-07",
    name: "Loan Underwriting Assistant",
    region: "India",
    segment: "Lender",
    regulator: "RBI",
    problem: "Underwriters spent hours assembling borrower context across systems.",
    capabilities: ["Document extraction", "Affordability checks", "Policy reasoning", "Decision memo"],
    integrations: ["Finacle", "Experian", "Salesforce"],
    effortWeeks: 8,
    outcome: "Underwriting prep cut from 5 hours to 40 minutes in POC.",
    lastUsed: "2026-07-14",
    owner: "Meera Iyer (India PreSales)",
    timesReused: 5,
  },
  {
    id: "tpl-uk-loan-08",
    name: "Affordability & Underwriting Copilot",
    region: "UK",
    segment: "Lender",
    regulator: "FCA",
    problem: "Consumer-credit affordability assessments were slow and inconsistent.",
    capabilities: ["Affordability checks", "Policy reasoning", "Decision memo", "Audit trail"],
    integrations: ["Experian", "Snowflake", "SharePoint"],
    effortWeeks: 7,
    outcome: "Consistent affordability memos generated in minutes in POC.",
    lastUsed: "2026-05-16",
    owner: "Tom Blake (UK PreSales)",
    timesReused: 4,
  },
];

// ---- Briefs (varied ages to exercise seam health) ---------------------------

export const BRIEFS: Brief[] = [
  {
    id: "brief-meridian",
    account: "Meridian Trust Bank",
    region: "US",
    segment: "Retail bank",
    regulator: "OCC",
    problem:
      "Onboarding operations are drowning in manual KYC document review; new-account SLAs are slipping and the backlog is growing week over week.",
    systems: ["Salesforce", "Actimize", "SharePoint"],
    timeline: "POC in 6 weeks, exec review at week 4",
    success: "Cut KYC document review time by 70% with a defensible audit trail.",
    ageDays: 3.1,
    fromRep: "Marcus Webb (US Sales)",
    arrived: "3 days ago",
  },
  {
    id: "brief-atlas",
    account: "Atlas Mutual Insurance",
    region: "US",
    segment: "Insurer",
    regulator: "NAIC",
    problem:
      "First-notice-of-loss claims sit unassigned for days. They want faster triage and fraud pre-screening without adding adjusters.",
    systems: ["Guidewire", "Snowflake", "Twilio"],
    timeline: "POC in 8 weeks",
    success: "Auto-triage the majority of FNOL claims within minutes, fraud pre-screened.",
    ageDays: 1.4,
    fromRep: "Elena Ruiz (US Sales)",
    arrived: "34 hours ago",
  },
  {
    id: "brief-cascade",
    account: "Cascade Lending",
    region: "US",
    segment: "Lender",
    regulator: "CFPB",
    problem:
      "Underwriters spend hours assembling borrower context before a decision. They want an assistant that prepares a decision memo from source documents.",
    systems: ["nCino", "Experian", "Salesforce"],
    timeline: "POC in 6 weeks",
    success: "Reduce underwriting prep time by 80% with consistent, auditable memos.",
    ageDays: 0.4,
    fromRep: "Priyanka Rao (US Sales)",
    arrived: "10 hours ago",
  },
];

// ---- Retrieval (explainable, deterministic mock) ----------------------------

const MATCHES: Record<string, TemplateMatch[]> = {
  "brief-meridian": [
    {
      templateId: "tpl-uk-kyc-01",
      score: 94,
      reasons: [
        "Same problem: KYC document review backlog",
        "Segment match: retail bank",
        "Regulator analogue: FCA ↔ OCC (both prudential onboarding rules)",
        "Shares 2 of 3 systems: Salesforce, Actimize",
      ],
    },
    {
      templateId: "tpl-in-kyc-02",
      score: 88,
      reasons: [
        "Same problem: high-volume KYC onboarding",
        "Segment match: retail bank",
        "Proven backlog clearance in the POC window",
      ],
    },
    {
      templateId: "tpl-in-fraud-06",
      score: 61,
      reasons: [
        "Adjacent capability: risk scoring + case narrative",
        "Shares system: Actimize",
        "Different primary problem (fraud, not onboarding)",
      ],
    },
  ],
  "brief-atlas": [
    {
      templateId: "tpl-uk-claims-03",
      score: 92,
      reasons: [
        "Same problem: FNOL claims triage",
        "Segment match: insurer",
        "Shares 2 systems: Guidewire, Snowflake",
        "Includes fraud pre-screen the customer asked for",
      ],
    },
    {
      templateId: "tpl-in-fraud-06",
      score: 66,
      reasons: ["Adjacent capability: fraud pre-screen", "Different segment (retail bank)"],
    },
  ],
  "brief-cascade": [
    {
      templateId: "tpl-in-loan-07",
      score: 90,
      reasons: [
        "Same problem: underwriting prep + decision memo",
        "Segment match: lender",
        "Shares system: Experian",
      ],
    },
    {
      templateId: "tpl-uk-loan-08",
      score: 85,
      reasons: ["Same capability set: affordability + decision memo", "Segment match: lender"],
    },
  ],
};

export function matchesFor(briefId: string): TemplateMatch[] {
  return MATCHES[briefId] ?? [];
}

export function templateById(id: string): SolutionTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

// ---- Draft POC plan (what the agent produces) -------------------------------

const PLANS: Record<string, PocPlan> = {
  "brief-meridian": {
    objective:
      "Prove that an AI copilot can cut Meridian Trust Bank's KYC document review time by 70% while producing a defensible, examiner-ready audit trail.",
    successCriteria: [
      "≥70% reduction in average document review time vs. current baseline",
      "≥90% straight-through on low-risk cases with human review on the rest",
      "Complete audit trail: every extraction and decision traceable to source",
      "Zero PII leaves the bank's environment",
    ],
    scopeIn: [
      "Passport, driver's licence and proof-of-address extraction",
      "Identity match against Salesforce account records",
      "Risk flagging with reason codes and Actimize hand-off",
      "Reviewer workbench with accept/override and audit log",
    ],
    scopeOut: [
      "Full production rollout and change management",
      "Non-KYC onboarding steps (funding, card issuance)",
      "Model retraining pipeline",
    ],
    templatesUsed: [
      { templateId: "tpl-uk-kyc-01", change: "Swap FCA rule pack for OCC; re-point SharePoint to Meridian tenant" },
      { templateId: "tpl-in-kyc-02", change: "Reuse backlog-clearance batch flow; drop CKYC registry lookup (US)" },
    ],
    integrations: ["Salesforce (accounts)", "Actimize (risk hand-off)", "SharePoint (document store)"],
    weekPlan: [
      { week: "Week 1", work: "Environment access, data samples, OCC rule pack, success baseline agreed" },
      { week: "Week 2", work: "Document extraction + identity match on Meridian samples" },
      { week: "Week 3", work: "Risk flagging + Actimize hand-off; reviewer workbench" },
      { week: "Week 4", work: "Exec review: measured time reduction + audit trail walkthrough" },
      { week: "Week 5", work: "Hardening, edge cases, straight-through tuning" },
      { week: "Week 6", work: "Results readout, production scoping, go/no-go" },
    ],
    risks: [
      "OCC rule interpretation differs from FCA pack — needs compliance sign-off early",
      "Document sample quality; secure representative set by week 1",
      "Actimize sandbox access can slow week 3 — request now",
    ],
    people: ["US Solution Architect (lead)", "1 ML engineer", "Meridian KYC SME", "Meridian IT/security contact"],
  },
};

const GENERIC_PLAN = (b: Brief): PocPlan => ({
  objective: `Prove measurable value for ${b.account}: ${b.success}`,
  successCriteria: [b.success, "Auditable trail for every AI decision", "No sensitive data leaves the environment"],
  scopeIn: ["Core workflow for the stated problem", "Reviewer workbench with accept/override", "Integration to the primary system of record"],
  scopeOut: ["Full production rollout", "Adjacent workflows outside the stated problem"],
  templatesUsed: matchesFor(b.id).slice(0, 2).map((m) => ({
    templateId: m.templateId,
    change: "Re-point integrations and regulator rule pack to the customer's environment",
  })),
  integrations: b.systems,
  weekPlan: [
    { week: "Week 1", work: "Access, data samples, success baseline agreed" },
    { week: "Week 2-3", work: "Core workflow on customer samples" },
    { week: "Week 4", work: "Exec review with measured results" },
    { week: "Week 5-6", work: "Hardening and production scoping" },
  ],
  risks: ["Data sample availability", "Regulator rule interpretation", "Sandbox access to systems of record"],
  people: ["US Solution Architect (lead)", "1 ML engineer", `${b.account} SME`, `${b.account} IT/security contact`],
});

export function planFor(brief: Brief): PocPlan {
  return PLANS[brief.id] ?? GENERIC_PLAN(brief);
}

// Skeleton of the handoff document Delivery will need.
export function handoffSkeleton(brief: Brief): { section: string; note: string }[] {
  return [
    { section: "Account & context", note: `${brief.account} — ${brief.segment}, ${brief.region}, regulator ${brief.regulator}` },
    { section: "Problem statement", note: brief.problem },
    { section: "Agreed success criteria", note: "Pulled from the POC plan; confirm with customer sponsor" },
    { section: "Environments & access", note: `Systems: ${brief.systems.join(", ")} — access owners TBD` },
    { section: "Data handling & security", note: "Data residency, PII controls, retention — confirm with security" },
    { section: "Solution architecture", note: "Reused templates + customer-specific changes (see POC plan)" },
    { section: "Delivery team & RACI", note: "To be staffed at handoff" },
    { section: "Risks & dependencies", note: "Carried from POC plan; owner per risk" },
  ];
}
