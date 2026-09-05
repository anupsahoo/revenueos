// Generates a connected, realistic enterprise estate as a static JSON file
// committed to the repo (no database). Deterministic (seeded).
// Run: node scripts/generate-data.mjs  → writes data/estate.json
import { writeFileSync, mkdirSync } from "node:fs";

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20260909);
const pick = (a) => a[Math.floor(r() * a.length)];
const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const some = (a, n) => { const c = [...a]; const o = []; for (let i = 0; i < n && c.length; i++) o.push(c.splice(Math.floor(r() * c.length), 1)[0]); return o; };

const REGIONS = ["US", "UK", "EU", "India", "Middle East", "APAC"];
const VERTICALS = ["Banking", "Insurance", "Lending", "Capital Markets", "Wealth"];
const NAME_A = ["Apex", "Nimbus", "Orbit", "Vertex", "Helix", "Summit", "Vanguard", "Meridian", "Sterling", "Beacon", "Cardinal", "Cobalt", "Griffin", "Juniper", "Kestrel", "Lumen", "Atlas", "Zenith"];
const NAME_B = ["Financial", "Bank", "Mutual", "Capital", "Trust", "Credit", "Assurance", "Markets", "Holdings", "Partners"];
const FIRST = ["Dana", "Marc", "Ivy", "Raj", "Sara", "Tom", "Priya", "Leo", "Ana", "Sam", "Neha", "Omar", "Lena", "Kai", "Zoe", "Ben", "Mei", "Ravi", "Nora", "Jon"];
const LAST = ["Ortiz", "Lee", "Chen", "Patel", "Kim", "Blake", "Shah", "Marin", "Costa", "Nair", "Reed", "Diaz", "Park", "Roy", "Vale", "Hughes", "Iyer", "Frost", "Mori", "Webb"];

const VMETA = {
  Banking: { segment: "Retail bank", regs: ["OCC", "FCA", "RBI"], sys: ["Salesforce", "Actimize", "Finacle", "SharePoint"],
    briefs: [
      { t: "KYC document review backlog", p: "Manual KYC review of onboarding documents is creating a multi-day backlog and new-account SLAs are slipping.", s: "Cut KYC review time by 70% with a defensible audit trail." },
      { t: "Fraud alert triage overload", p: "Analysts are overwhelmed by low-quality transaction fraud alerts and true positives are missed.", s: "Cut false-positive review load by 60% and surface true positives faster." },
      { t: "Account servicing copilot", p: "Contact-centre agents lack grounded answers for account queries, driving long handle times.", s: "Reduce handle time by 30% with cited, policy-grounded answers." },
    ] },
  Insurance: { segment: "Insurer", regs: ["NAIC", "FCA"], sys: ["Guidewire", "Snowflake", "Twilio"],
    briefs: [
      { t: "FNOL claims triage", p: "First-notice-of-loss claims sit unassigned for days; they want faster triage and fraud pre-screening without adding adjusters.", s: "Auto-triage the majority of FNOL claims within minutes, fraud pre-screened." },
      { t: "Claims fraud pre-screen", p: "Suspicious claims are found late in the cycle, after payments are committed.", s: "Flag high-risk claims at intake with explainable reasons." },
    ] },
  Lending: { segment: "Lender", regs: ["CFPB", "FCA", "RBI"], sys: ["nCino", "Experian", "Salesforce"],
    briefs: [
      { t: "Underwriting prep assistant", p: "Underwriters spend hours assembling borrower context before a decision.", s: "Reduce underwriting prep time by 80% with consistent, auditable memos." },
      { t: "Affordability assessment", p: "Consumer-credit affordability assessments are slow and inconsistent across officers.", s: "Generate consistent affordability memos in minutes with an audit trail." },
    ] },
  "Capital Markets": { segment: "Capital markets", regs: ["SEBI", "FCA"], sys: ["Murex", "Oracle GL", "Confluence"],
    briefs: [
      { t: "Regulatory reporting drafter", p: "Quarterly regulatory filings are assembled by hand from many systems.", s: "Produce a draft filing in hours with a full validation log." },
    ] },
  Wealth: { segment: "Retail bank", regs: ["SEC", "FCA"], sys: ["Salesforce", "Snowflake", "SharePoint"],
    briefs: [
      { t: "Advisor prep copilot", p: "Advisors spend hours preparing for client reviews across fragmented systems.", s: "Cut review prep time by 60% with a grounded client brief." },
    ] },
};
const REPS = ["Marcus Webb", "Elena Ruiz", "Priyanka Rao", "David Cole", "Aisha Khan", "Ben Ford", "Lucia Marin"];
const STAGES = ["Qualified", "POC", "Deploy", "Live", "Renewal"];

// architects
const architects = [];
let aid = 0;
for (let i = 0; i < 60; i++) {
  architects.push({ id: `arch-${aid++}`, name: `${pick(FIRST)} ${pick(LAST)}`, vertical: pick(VERTICALS), region: pick(REGIONS), load: int(38, 99) });
}
const archByVertical = (v) => architects.filter((a) => a.vertical === v);

const companies = [];
const projects = [];
const briefs = [];
let cid = 0, pid = 0, bid = 0;

const NUM_COMPANIES = 12;
for (let i = 0; i < NUM_COMPANIES; i++) {
  const name = `${pick(NAME_A)} ${pick(NAME_B)}`;
  const region = pick(REGIONS);
  const verticals = some(VERTICALS, int(2, 4));
  const employees = int(2000, 84000);
  const company = { id: `co-${cid++}`, name, region, employees, users: Math.round(employees * (0.05 + r() * 0.25)), verticals };
  companies.push(company);

  const nProjects = int(8, 34);
  for (let k = 0; k < nProjects; k++) {
    const vertical = pick(verticals);
    const meta = VMETA[vertical];
    const arch = pick(archByVertical(vertical).length ? archByVertical(vertical) : architects);
    const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(Math.pow(r(), 1.2) * STAGES.length))];
    const sla = 2;
    const bt = pick(meta.briefs);
    const projRegion = pick(REGIONS);
    const proj = {
      id: `pr-${pid++}`, companyId: company.id, company: name, vertical,
      name: `${bt.t} — ${name}`, stage, region: projRegion,
      valueK: int(60, 4200), contractK: int(40, 3600), sla,
      architectId: arch.id, architect: arch.name,
      regulator: pick(meta.regs), segment: meta.segment,
    };
    projects.push(proj);

    const nBriefs = int(1, 3);
    for (let b = 0; b < nBriefs; b++) {
      const t = pick(meta.briefs);
      const ageDays = Math.round((0.3 + r() * 3.6) * 10) / 10;
      const status = b === 0 && r() < 0.18 ? "accepted" : b === 0 && r() < 0.06 ? "rejected" : "open";
      briefs.push({
        id: `br-${bid++}`, projectId: proj.id, companyId: company.id, company: name,
        account: name, title: t.t, vertical, region: projRegion,
        segment: meta.segment, regulator: proj.regulator,
        problem: t.p, systems: some(meta.sys, int(2, 3)),
        timeline: `POC in ${int(6, 10)} weeks`, success: t.s,
        ageDays, fromRep: pick(REPS), architectId: arch.id, architect: arch.name, status,
      });
    }
  }
}

const estate = {
  meta: { generatedFrom: "scripts/generate-data.mjs", note: "synthetic, static, committed to the repo" },
  regions: REGIONS, verticals: VERTICALS,
  architects, companies, projects, briefs,
};

mkdirSync("data", { recursive: true });
writeFileSync("data/estate.json", JSON.stringify(estate));
console.log(`companies=${companies.length} projects=${projects.length} briefs=${briefs.length} architects=${architects.length}`);
console.log("per-company project counts:", companies.map((c) => projects.filter((p) => p.companyId === c.id).length).join(", "));
