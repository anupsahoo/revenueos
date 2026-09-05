// Synthetic seed data for the PreSales handoff loop. All fabricated, labelled
// synthetic in the UI. Desk scale on purpose: a queue of ~16 briefs and a
// library of 15 reusable solution templates.

export type Region = "UK" | "US" | "India" | "Middle East";
export type Segment = "Retail bank" | "Insurer" | "Capital markets" | "Lender";
export type SeamStatus = "green" | "amber" | "red";

export interface SolutionTemplate {
  id: string; name: string; region: Region; segment: Segment; regulator: string;
  problem: string; capabilities: string[]; integrations: string[];
  effortWeeks: number; outcome: string; lastUsed: string; owner: string; timesReused: number;
}

export interface Brief {
  id: string; account: string; title: string; region: Region; segment: Segment; regulator: string;
  problem: string; systems: string[]; timeline: string; success: string;
  arrivedAt: number; fromRep: string;
}

// Business-days elapsed between two instants, skipping Sat/Sun. Age is computed
// from the brief's arrival time against the clock — not a stored number.
export function businessDaysBetween(fromMs: number, toMs: number): number {
  if (toMs <= fromMs) return 0;
  let business = 0;
  const step = 3600_000; // 1h
  for (let t = fromMs; t < toMs; t += step) {
    const d = new Date(t).getDay();
    if (d !== 0 && d !== 6) business += step;
  }
  return business / 86_400_000;
}
export const briefAge = (b: Brief) => businessDaysBetween(b.arrivedAt, Date.now());
export function arrivedLabel(b: Brief): string {
  const h = (Date.now() - b.arrivedAt) / 3_600_000;
  return h < 24 ? `${Math.round(h)}h ago` : `${(h / 24).toFixed(1)}d ago`;
}

export interface TemplateMatch { templateId: string; score: number; reasons: string[]; }

export interface PocPlan {
  objective: string; successCriteria: string[]; scopeIn: string[]; scopeOut: string[];
  templatesUsed: { templateId: string; change: string }[]; integrations: string[];
  weekPlan: { week: string; work: string }[]; risks: string[]; people: string[];
}

export const SLA_DAYS = 2;
export const SOLUTION_ARCHITECT = "Dana Ortiz";
// One import-time reference so arrival times (and therefore ages) are identical
// on server and client render — no hydration mismatch. The live clock takes over
// on the client after mount.
export const REF = Date.now();

// ---- Template library (15, across UK + India) -------------------------------
export const TEMPLATES: SolutionTemplate[] = [
  { id: "tpl-uk-kyc-01", name: "KYC Document Review Copilot", region: "UK", segment: "Retail bank", regulator: "FCA", problem: "Manual KYC review of onboarding documents created a multi-day backlog.", capabilities: ["Document extraction", "Identity match", "Risk flagging", "Audit trail"], integrations: ["Actimize", "SharePoint", "Salesforce"], effortWeeks: 6, outcome: "Review time cut from 3 days to 4 hours; 92% straight-through.", lastUsed: "2026-06-18", owner: "Priya Shah (UK)", timesReused: 7 },
  { id: "tpl-in-kyc-02", name: "KYC Onboarding Accelerator", region: "India", segment: "Retail bank", regulator: "RBI", problem: "High-volume retail onboarding needed compliant automated checks.", capabilities: ["Document extraction", "Registry lookup", "Risk scoring", "Case routing"], integrations: ["Finacle", "ServiceNow"], effortWeeks: 7, outcome: "Cleared a 14-day onboarding backlog in the POC window.", lastUsed: "2026-07-02", owner: "Arjun Nair (India)", timesReused: 6 },
  { id: "tpl-uk-claims-03", name: "Claims Triage Assistant", region: "UK", segment: "Insurer", regulator: "FCA", problem: "First-notice-of-loss claims queued for days before assignment.", capabilities: ["Claim classification", "Severity scoring", "Fraud pre-screen", "Routing"], integrations: ["Guidewire", "Twilio", "Snowflake"], effortWeeks: 8, outcome: "Auto-triaged 78% of FNOL claims within minutes.", lastUsed: "2026-05-29", owner: "Tom Blake (UK)", timesReused: 5 },
  { id: "tpl-in-reg-04", name: "Regulatory Reporting Drafter", region: "India", segment: "Capital markets", regulator: "SEBI", problem: "Quarterly regulatory filings assembled by hand from many systems.", capabilities: ["Data reconciliation", "Narrative drafting", "Validation checks", "Sign-off"], integrations: ["Murex", "Oracle GL", "Confluence"], effortWeeks: 9, outcome: "Draft filing produced in hours with a validation log.", lastUsed: "2026-06-11", owner: "Meera Iyer (India)", timesReused: 4 },
  { id: "tpl-uk-cs-05", name: "Customer Service Copilot", region: "UK", segment: "Retail bank", regulator: "FCA", problem: "Contact-centre agents lacked grounded answers for account queries.", capabilities: ["Grounded retrieval", "Policy citation", "Draft replies", "Escalation"], integrations: ["Zendesk", "Salesforce", "Confluence"], effortWeeks: 5, outcome: "Handle time down 34% with cited answers.", lastUsed: "2026-07-20", owner: "Priya Shah (UK)", timesReused: 8 },
  { id: "tpl-in-fraud-06", name: "Fraud Alert Triage", region: "India", segment: "Retail bank", regulator: "RBI", problem: "Analysts overwhelmed by low-quality transaction fraud alerts.", capabilities: ["Alert enrichment", "Risk scoring", "Case narrative", "Disposition"], integrations: ["Actimize", "Kafka", "ServiceNow"], effortWeeks: 7, outcome: "False-positive review load down 61%.", lastUsed: "2026-06-27", owner: "Arjun Nair (India)", timesReused: 6 },
  { id: "tpl-in-loan-07", name: "Loan Underwriting Assistant", region: "India", segment: "Lender", regulator: "RBI", problem: "Underwriters spent hours assembling borrower context.", capabilities: ["Document extraction", "Affordability checks", "Policy reasoning", "Decision memo"], integrations: ["Finacle", "Experian", "Salesforce"], effortWeeks: 8, outcome: "Underwriting prep cut from 5 hours to 40 minutes.", lastUsed: "2026-07-14", owner: "Meera Iyer (India)", timesReused: 5 },
  { id: "tpl-uk-loan-08", name: "Affordability & Underwriting Copilot", region: "UK", segment: "Lender", regulator: "FCA", problem: "Consumer-credit affordability assessments slow and inconsistent.", capabilities: ["Affordability checks", "Policy reasoning", "Decision memo", "Audit trail"], integrations: ["Experian", "Snowflake", "SharePoint"], effortWeeks: 7, outcome: "Consistent affordability memos in minutes.", lastUsed: "2026-05-16", owner: "Tom Blake (UK)", timesReused: 4 },
  { id: "tpl-uk-aml-09", name: "AML Transaction Monitoring", region: "UK", segment: "Retail bank", regulator: "FCA", problem: "Transaction-monitoring alerts had high false positives and slow review.", capabilities: ["Alert scoring", "Network analysis", "SAR narrative", "Audit trail"], integrations: ["Actimize", "Snowflake"], effortWeeks: 8, outcome: "Alert review time down 48%, SAR drafts auto-prepared.", lastUsed: "2026-07-05", owner: "Priya Shah (UK)", timesReused: 5 },
  { id: "tpl-in-mort-10", name: "Mortgage Origination Assistant", region: "India", segment: "Lender", regulator: "RBI", problem: "Mortgage origination paperwork slowed approvals.", capabilities: ["Document extraction", "Eligibility checks", "Decision memo"], integrations: ["Finacle", "Experian"], effortWeeks: 7, outcome: "Origination prep time down 55%.", lastUsed: "2026-06-02", owner: "Arjun Nair (India)", timesReused: 3 },
  { id: "tpl-uk-wealth-11", name: "Wealth Advisor Copilot", region: "UK", segment: "Retail bank", regulator: "FCA", problem: "Advisors spent hours preparing for client reviews.", capabilities: ["Grounded retrieval", "Portfolio summary", "Suitability notes"], integrations: ["Salesforce", "Snowflake", "SharePoint"], effortWeeks: 6, outcome: "Review prep time down 60% with grounded briefs.", lastUsed: "2026-07-18", owner: "Tom Blake (UK)", timesReused: 4 },
  { id: "tpl-uk-complaints-12", name: "Complaints Handling Copilot", region: "UK", segment: "Insurer", regulator: "FCA", problem: "Complaint handling was slow and inconsistent against FCA timelines.", capabilities: ["Case summarisation", "Policy citation", "Draft response", "Deadline tracking"], integrations: ["Zendesk", "Guidewire"], effortWeeks: 5, outcome: "First-response time down 40%, within FCA deadlines.", lastUsed: "2026-06-21", owner: "Priya Shah (UK)", timesReused: 4 },
  { id: "tpl-in-trade-13", name: "Trade Surveillance Assistant", region: "India", segment: "Capital markets", regulator: "SEBI", problem: "Trade surveillance alerts needed faster, explainable review.", capabilities: ["Alert scoring", "Pattern detection", "Case narrative"], integrations: ["Murex", "Kafka"], effortWeeks: 8, outcome: "Alert review throughput up 2x with explainable cases.", lastUsed: "2026-05-24", owner: "Meera Iyer (India)", timesReused: 3 },
  { id: "tpl-in-collections-14", name: "Collections Prioritisation", region: "India", segment: "Lender", regulator: "RBI", problem: "Collections effort was spread evenly rather than by likelihood to pay.", capabilities: ["Risk scoring", "Next-best-action", "Contact drafting"], integrations: ["Finacle", "Twilio"], effortWeeks: 6, outcome: "Recovery rate up 18% in the POC segment.", lastUsed: "2026-07-09", owner: "Arjun Nair (India)", timesReused: 3 },
  { id: "tpl-uk-policy-15", name: "Policy Servicing Copilot", region: "UK", segment: "Insurer", regulator: "FCA", problem: "Policy-servicing requests were slow and manual.", capabilities: ["Request classification", "Grounded answers", "Draft actions"], integrations: ["Guidewire", "Zendesk"], effortWeeks: 5, outcome: "Servicing turnaround down 45%.", lastUsed: "2026-06-30", owner: "Tom Blake (UK)", timesReused: 4 },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

// ---- Brief queue (16, US PreSales) ------------------------------------------
const DAY_MS = 86_400_000;
// `days` seeds the arrival time (now − days). Age is then computed from arrivedAt
// against the clock, in business days, wherever it is shown.
const B = (id: string, account: string, title: string, segment: Segment, regulator: string, problem: string, systems: string[], success: string, days: number, fromRep: string): Brief =>
  ({ id, account, title, region: "US", segment, regulator, problem, systems, timeline: "POC in 6-8 weeks", success, arrivedAt: REF - days * DAY_MS, fromRep });

export const BRIEFS: Brief[] = [
  B("br-01", "Meridian Trust Bank", "KYC document review backlog", "Retail bank", "OCC", "Onboarding operations are drowning in manual KYC document review. New-account SLAs are slipping and the backlog grows week over week.", ["Salesforce", "Actimize", "SharePoint"], "Cut KYC review time by 70% with a defensible audit trail.", 3.1, "Marcus Webb"),
  B("br-02", "Summit National Bank", "Fraud alert triage overload", "Retail bank", "OCC", "Analysts are buried under low-quality transaction fraud alerts and true positives slip through.", ["Actimize", "Snowflake"], "Cut false-positive review load by 60% and surface true positives faster.", 2.6, "Elena Ruiz"),
  B("br-03", "Cardinal Wealth", "Advisor review prep", "Retail bank", "SEC", "Advisors spend hours preparing for client reviews across fragmented systems.", ["Salesforce", "Snowflake"], "Cut review prep time by 60% with a grounded client brief.", 2.9, "David Cole"),
  B("br-04", "Pioneer Credit Union", "Collections prioritisation", "Lender", "CFPB", "Collections effort is spread evenly instead of by likelihood to pay, so recovery lags.", ["nCino", "Twilio"], "Lift recovery rate with risk-ranked, next-best-action outreach.", 2.1, "Aisha Khan"),
  B("br-05", "Kestrel Trust", "KYC onboarding automation", "Retail bank", "OCC", "High-volume account onboarding needs compliant automated checks without more staff.", ["Salesforce", "SharePoint"], "Clear the onboarding backlog and keep a full audit trail.", 2.4, "Ben Ford"),
  B("br-06", "Atlas Mutual Insurance", "FNOL claims triage", "Insurer", "NAIC", "First-notice-of-loss claims sit unassigned for days. They want faster triage and fraud pre-screening without adding adjusters.", ["Guidewire", "Snowflake", "Twilio"], "Auto-triage most FNOL claims within minutes, fraud pre-screened.", 1.4, "Elena Ruiz"),
  B("br-07", "Vanguard Savings", "AML transaction monitoring", "Retail bank", "OCC", "Transaction-monitoring alerts have high false positives and slow, manual review.", ["Actimize", "Snowflake"], "Cut alert review time and auto-prepare SAR drafts.", 1.7, "Marcus Webb"),
  B("br-08", "Cobalt Bank", "Complaints handling", "Retail bank", "CFPB", "Complaint handling is slow and inconsistent against regulatory timelines.", ["Zendesk", "Salesforce"], "Cut first-response time and stay within deadlines.", 1.9, "Priyanka Rao"),
  B("br-09", "Delta Capital", "Regulatory reporting", "Capital markets", "SEC", "Quarterly regulatory filings are assembled by hand from many systems.", ["Oracle GL", "Confluence"], "Produce a draft filing in hours with a validation log.", 1.1, "David Cole"),
  B("br-10", "Ironwood Bank", "Service copilot", "Retail bank", "OCC", "Contact-centre agents lack grounded answers, driving long handle times.", ["Zendesk", "Salesforce"], "Reduce handle time by 30% with cited, policy-grounded answers.", 1.3, "Aisha Khan"),
  B("br-11", "Cascade Lending", "Underwriting prep", "Lender", "CFPB", "Underwriters spend hours assembling borrower context before a decision.", ["nCino", "Experian", "Salesforce"], "Reduce underwriting prep time by 80% with auditable memos.", 0.4, "Priyanka Rao"),
  B("br-12", "Harbor Life", "Policy servicing", "Insurer", "NAIC", "Policy-servicing requests are slow and manual.", ["Guidewire", "Zendesk"], "Cut servicing turnaround by 45%.", 0.8, "Ben Ford"),
  B("br-13", "Sterling Insurance", "Claims fraud pre-screen", "Insurer", "NAIC", "Suspicious claims are found late, after payments are committed.", ["Guidewire", "Snowflake"], "Flag high-risk claims at intake with explainable reasons.", 0.6, "Lucia Marin"),
  B("br-14", "Griffin Markets", "Trade surveillance", "Capital markets", "SEC", "Trade surveillance alerts need faster, explainable review.", ["Kafka", "Snowflake"], "Double alert review throughput with explainable cases.", 0.5, "Lucia Marin"),
  B("br-15", "Juniper Lending", "Affordability assessment", "Lender", "CFPB", "Consumer-credit affordability assessments are slow and inconsistent across officers.", ["Experian", "Salesforce"], "Generate consistent affordability memos in minutes.", 0.7, "Marcus Webb"),
  B("br-16", "Beacon Mortgage", "Mortgage origination", "Lender", "CFPB", "Mortgage origination paperwork slows approvals.", ["nCino", "Experian"], "Cut origination prep time by 55%.", 0.3, "Elena Ruiz"),
];

export const briefById = (id: string) => BRIEFS.find((b) => b.id === id);

// ---- Deterministic sample POC plan (fallback when the AI model is off) -------
export function planFor(b: Brief): PocPlan {
  return {
    objective: `Prove measurable value for ${b.account}: ${b.success}`,
    successCriteria: [b.success, "Auditable trail for every AI decision", "No sensitive data leaves the environment"],
    scopeIn: ["Core workflow for the stated problem", "Reviewer workbench with accept/override", "Integration to the primary system of record"],
    scopeOut: ["Full production rollout", "Adjacent workflows outside the stated problem"],
    templatesUsed: [],
    integrations: b.systems,
    weekPlan: [
      { week: "Week 1", work: "Access, data samples, success baseline agreed" },
      { week: "Week 2-3", work: "Core workflow built on customer samples" },
      { week: "Week 4", work: "Exec review with measured results" },
      { week: "Week 5-6", work: "Hardening and production scoping" },
    ],
    risks: ["Representative data sample availability", "Regulator rule interpretation", "Sandbox access to systems of record"],
    people: [`${SOLUTION_ARCHITECT} (US Solution Architect, lead)`, "1 ML engineer", `${b.account} SME`, `${b.account} IT/security contact`],
  };
}


// ---- Skills: what the project needs vs what the team has ---------------------
// Bench strength, 0-100. Our strength is Salesforce / Commerce / retail; the
// insurance, claims, capital-markets and underwriting skills are thinner.
export const SKILL_INVENTORY: Record<string, number> = {
  "Salesforce": 92, "Commerce Cloud": 88, "Retail banking": 84, "Contact centre / CX": 80,
  "Data engineering": 74, "ML / AI": 68, "Compliance & audit": 66, "Document AI": 62,
  "Actimize": 60, "Experian integration": 58, "KYC / AML": 55, "Fraud analytics": 52,
  "Credit / underwriting": 41, "Claims processing": 38, "Guidewire (claims)": 33,
  "Regulatory reporting": 30, "Capital markets": 28,
};

export const REQUIRED_SKILLS: Record<string, string[]> = {
  "br-01": ["KYC / AML", "Document AI", "Actimize", "Compliance & audit"],
  "br-02": ["Fraud analytics", "Actimize", "ML / AI"],
  "br-03": ["Salesforce", "Data engineering", "Compliance & audit"],
  "br-04": ["Credit / underwriting", "ML / AI", "Contact centre / CX"],
  "br-05": ["KYC / AML", "Document AI", "Salesforce"],
  "br-06": ["Guidewire (claims)", "Claims processing", "Fraud analytics"],
  "br-07": ["KYC / AML", "Actimize", "Data engineering"],
  "br-08": ["Contact centre / CX", "Compliance & audit", "Salesforce"],
  "br-09": ["Regulatory reporting", "Capital markets", "Data engineering"],
  "br-10": ["Contact centre / CX", "Salesforce", "ML / AI"],
  "br-11": ["Credit / underwriting", "Document AI", "Experian integration"],
  "br-12": ["Guidewire (claims)", "Contact centre / CX", "Compliance & audit"],
  "br-13": ["Claims processing", "Fraud analytics", "ML / AI"],
  "br-14": ["Capital markets", "ML / AI", "Data engineering"],
  "br-15": ["Credit / underwriting", "Experian integration", "Compliance & audit"],
  "br-16": ["Credit / underwriting", "Document AI", "Experian integration"],
};

export const skillAvail = (s: string) => SKILL_INVENTORY[s] ?? 0;
export function skillStatus(avail: number): SeamStatus { return avail >= 70 ? "green" : avail >= 40 ? "amber" : "red"; }
export function requiredSkills(briefId: string): string[] { return REQUIRED_SKILLS[briefId] ?? []; }
export function skillCoverage(briefId: string): number {
  const ss = requiredSkills(briefId);
  if (!ss.length) return 0;
  return Math.round(ss.reduce((a, s) => a + skillAvail(s), 0) / ss.length);
}

// A simple, human plan to close a skill gap ahead of time.
export function skillPrepPlan(skill: string): { steps: string[]; weeks: number } {
  const av = skillAvail(skill);
  const weeks = av < 40 ? 8 : av < 70 ? 5 : 3;
  return {
    weeks,
    steps: [
      `Upskill 2 solution architects in ${skill} — short course plus shadowing a live deal`,
      av < 40 ? `Hire 1 ${skill} specialist, or line up a delivery partner to cover the first projects` : `Cross-train from an adjacent team that already has some ${skill}`,
      `Turn the first win into a reusable template, so the next brief that needs ${skill} is fast`,
    ],
  };
}
