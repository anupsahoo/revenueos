// Large, DETERMINISTIC synthetic dataset (seeded RNG → identical on server &
// client, so no hydration mismatch). Models an enterprise at scale:
// ~2025 companies across 10 domains and 7 regions, ~5k projects, thousands of
// SLAs and contracts. Everything below is fabricated. Aggregations feed the
// visual dashboards.

export type Status = "green" | "amber" | "red";

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20250909);
const pick = <T>(a: T[]) => a[Math.floor(rand() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

export const DOMAINS = ["Banking", "Insurance", "Retail", "Healthcare", "Telecom", "Manufacturing", "Public Sector", "Energy", "Logistics", "Media"];
export const REGIONS = ["US", "UK", "EU", "India", "Middle East", "APAC", "LATAM"];
export const STAGES = ["Lead", "Qualified", "POC", "Deploy", "Live", "Renewal"];
const NAME_A = ["Apex", "Nimbus", "Orbit", "Vertex", "Helix", "Quantum", "Summit", "Pioneer", "Vanguard", "Zenith", "Atlas", "Meridian", "Cobalt", "Sterling", "Beacon", "Cardinal", "Delta", "Ember", "Fathom", "Griffin", "Ironwood", "Juniper", "Kestrel", "Lumen"];
const NAME_B = ["Systems", "Financial", "Health", "Retail", "Cloud", "Labs", "Group", "Networks", "Dynamics", "Digital", "Partners", "Technologies", "Solutions", "Analytics", "Ventures", "Global"];

export interface Company { id: number; name: string; domain: string; region: string; employees: number; }
export interface Project {
  id: number; companyId: number; domain: string; region: string; stage: string;
  valueK: number; sla: number; actual: number; status: Status; contractK: number; renewMonth: number;
}

const NUM_COMPANIES = 2025;

const companies: Company[] = [];
for (let i = 0; i < NUM_COMPANIES; i++) {
  companies.push({ id: i, name: `${pick(NAME_A)} ${pick(NAME_B)}`, domain: pick(DOMAINS), region: pick(REGIONS), employees: int(180, 82000) });
}

const projects: Project[] = [];
let pid = 0;
for (const c of companies) {
  const n = int(1, 4);
  for (let k = 0; k < n; k++) {
    const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(Math.pow(rand(), 1.4) * STAGES.length))];
    const sla = pick([2, 2, 2, 3, 5]);
    const actual = Math.max(0.4, sla * (0.5 + rand() * 2.2));
    const status: Status = actual > sla ? "red" : actual > sla * 0.75 ? "amber" : "green";
    projects.push({
      id: pid++, companyId: c.id, domain: c.domain, region: c.region, stage,
      valueK: int(40, 4200), sla, actual: Math.round(actual * 10) / 10, status,
      contractK: int(30, 3800), renewMonth: int(0, 11),
    });
  }
}

// ---- Aggregations -----------------------------------------------------------
const sum = <T>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export const TOTALS = {
  companies: companies.length,
  projects: projects.length,
  people: sum(companies, (c) => c.employees),
  pipelineM: Math.round(sum(projects, (p) => p.valueK) / 1000),
  wonM: Math.round(sum(projects.filter((p) => p.stage === "Live" || p.stage === "Renewal"), (p) => p.valueK) / 1000),
  slaCompliance: pct(projects.filter((p) => p.status !== "red").length, projects.length),
  breached: projects.filter((p) => p.status === "red").length,
  contractsM: Math.round(sum(projects, (p) => p.contractK) / 1000),
};

export const BY_DOMAIN = DOMAINS.map((d) => {
  const ps = projects.filter((p) => p.domain === d);
  return {
    domain: d,
    companies: companies.filter((c) => c.domain === d).length,
    projects: ps.length,
    pipelineM: Math.round(sum(ps, (p) => p.valueK) / 1000),
    breach: pct(ps.filter((p) => p.status === "red").length, ps.length),
    reuse: 30 + Math.round(rand() * 45),
  };
}).sort((a, b) => b.pipelineM - a.pipelineM);

export const BY_REGION = REGIONS.map((r) => {
  const ps = projects.filter((p) => p.region === r);
  return {
    region: r,
    projects: ps.length,
    pipelineM: Math.round(sum(ps, (p) => p.valueK) / 1000),
    green: ps.filter((p) => p.status === "green").length,
    amber: ps.filter((p) => p.status === "amber").length,
    red: ps.filter((p) => p.status === "red").length,
  };
}).sort((a, b) => b.pipelineM - a.pipelineM);

export const FUNNEL = STAGES.map((s) => {
  const ps = projects.filter((p) => p.stage === s);
  return { stage: s, count: ps.length, valueM: Math.round(sum(ps, (p) => p.valueK) / 1000) };
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const TREND = MONTHS.map((m, i) => {
  const base = 60 + i * 6;
  return {
    month: m,
    pipeline: base + Math.round(rand() * 30),
    won: Math.round((base * (0.42 + rand() * 0.18))),
    compliance: 74 + Math.round(Math.sin(i / 2) * 6 + rand() * 6),
  };
});

// domain × stage health matrix (share of red)
export const DOMAIN_STAGE = DOMAINS.map((d) => ({
  domain: d,
  cells: STAGES.map((s) => {
    const ps = projects.filter((p) => p.domain === d && p.stage === s);
    const red = pct(ps.filter((p) => p.status === "red").length, ps.length);
    const status: Status = red > 34 ? "red" : red > 18 ? "amber" : "green";
    return status;
  }),
}));

// scatter sample: value vs SLA attainment, colored by status
export const SCATTER = projects.filter((_, i) => i % 37 === 0).slice(0, 160).map((p) => ({
  value: p.valueK, attain: Math.round((p.sla / p.actual) * 100), domain: p.domain, status: p.status,
}));

// architect / capacity distribution (histogram buckets)
export const CAPACITY = (() => {
  const buckets = [0, 0, 0, 0, 0]; // <40, 40-60, 60-80, 80-95, 95+
  const N = 2400;
  for (let i = 0; i < N; i++) {
    const load = Math.min(100, Math.max(5, 55 + (rand() - 0.4) * 70));
    const b = load < 40 ? 0 : load < 60 ? 1 : load < 80 ? 2 : load < 95 ? 3 : 4;
    buckets[b]++;
  }
  return [
    { band: "<40%", people: buckets[0], tone: "green" },
    { band: "40–60%", people: buckets[1], tone: "green" },
    { band: "60–80%", people: buckets[2], tone: "amber" },
    { band: "80–95%", people: buckets[3], tone: "amber" },
    { band: "95%+", people: buckets[4], tone: "red" },
  ];
})();

export const TOP_COMPANIES = [...companies]
  .map((c) => ({ ...c, value: sum(projects.filter((p) => p.companyId === c.id), (p) => p.valueK) }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 12);
