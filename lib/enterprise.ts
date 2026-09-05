// Synthetic multi-tenant data for the enterprise cockpits & onboarding.
// Companies (tenants) → verticals → metrics. All fabricated.

import type { SeamStatus } from "./mock";

export interface StageHealth { stage: string; status: SeamStatus; }

export interface Vertical {
  id: string;
  name: string;
  icon: string;
  pipelineM: number;      // $M in pipeline
  wonQtrM: number;        // $M won this quarter
  forecastM: number;      // $M forecast
  deals: number;
  openBriefs: number;
  breached: number;
  avgPickup: number;      // days
  sla: number;            // days
  reuse: number;          // %
  pocThroughput: number;  // POCs / month
  architects: number;
  load: number;           // 0..100 capacity load
  atRisk: number;         // # at-risk deals
  stages: StageHealth[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  users: number;
  projects: number;
  verticals: Vertical[];
}

export interface Architect { name: string; vertical: string; load: number; open: number; drafts: number; }

export interface Onboarding {
  id: string;
  kind: "company" | "system" | "user" | "vertical";
  title: string;
  sub: string;
  owner: string;
  steps: string[];
  current: number; // index of current step (== steps.length → done)
}

const S = (stage: string, status: SeamStatus): StageHealth => ({ stage, status });
const STAGES = ["Brief→POC", "POC→Deploy", "Deploy→Live", "Live→Renew"];

function vert(
  id: string, name: string, icon: string,
  m: Omit<Partial<Vertical>, "stages"> & { stages: SeamStatus[] }
): Vertical {
  return {
    id, name, icon,
    pipelineM: m.pipelineM ?? 0, wonQtrM: m.wonQtrM ?? 0, forecastM: m.forecastM ?? 0,
    deals: m.deals ?? 0, openBriefs: m.openBriefs ?? 0, breached: m.breached ?? 0,
    avgPickup: m.avgPickup ?? 0, sla: m.sla ?? 2, reuse: m.reuse ?? 0,
    pocThroughput: m.pocThroughput ?? 0, architects: m.architects ?? 0, load: m.load ?? 0,
    atRisk: m.atRisk ?? 0,
    stages: STAGES.map((st, i) => S(st, m.stages[i])),
  };
}

export const COMPANIES: Company[] = [
  {
    id: "apex", name: "Apex Software", industry: "Enterprise B2B SaaS", users: 18400, projects: 22,
    verticals: [
      vert("banking", "Banking", "🏦", { pipelineM: 240, wonQtrM: 52, forecastM: 190, deals: 38, openBriefs: 14, breached: 6, avgPickup: 6.8, sla: 2, reuse: 21, pocThroughput: 9, architects: 12, load: 92, atRisk: 7, stages: ["red", "amber", "green", "amber"] }),
      vert("retail", "Retail", "🛍️", { pipelineM: 128, wonQtrM: 41, forecastM: 110, deals: 51, openBriefs: 5, breached: 0, avgPickup: 1.6, sla: 2, reuse: 58, pocThroughput: 16, architects: 9, load: 61, atRisk: 2, stages: ["green", "green", "amber", "green"] }),
      vert("healthcare", "Healthcare", "🩺", { pipelineM: 176, wonQtrM: 33, forecastM: 140, deals: 27, openBriefs: 9, breached: 3, avgPickup: 3.4, sla: 2, reuse: 34, pocThroughput: 7, architects: 8, load: 78, atRisk: 4, stages: ["amber", "amber", "green", "red"] }),
      vert("insurance", "Insurance", "☂️", { pipelineM: 96, wonQtrM: 22, forecastM: 78, deals: 19, openBriefs: 6, breached: 1, avgPickup: 2.3, sla: 2, reuse: 44, pocThroughput: 6, architects: 6, load: 70, atRisk: 3, stages: ["amber", "green", "green", "amber"] }),
    ],
  },
  {
    id: "nimbus", name: "Nimbus Cloud", industry: "Cloud infrastructure", users: 11200, projects: 14,
    verticals: [
      vert("banking", "Banking", "🏦", { pipelineM: 180, wonQtrM: 44, forecastM: 150, deals: 29, openBriefs: 8, breached: 2, avgPickup: 3.1, sla: 2, reuse: 39, pocThroughput: 8, architects: 10, load: 74, atRisk: 4, stages: ["amber", "green", "green", "green"] }),
      vert("retail", "Retail", "🛍️", { pipelineM: 150, wonQtrM: 49, forecastM: 132, deals: 44, openBriefs: 4, breached: 0, avgPickup: 1.4, sla: 2, reuse: 62, pocThroughput: 18, architects: 11, load: 55, atRisk: 1, stages: ["green", "green", "green", "amber"] }),
      vert("healthcare", "Healthcare", "🩺", { pipelineM: 120, wonQtrM: 28, forecastM: 96, deals: 21, openBriefs: 7, breached: 2, avgPickup: 2.9, sla: 2, reuse: 41, pocThroughput: 6, architects: 7, load: 69, atRisk: 3, stages: ["amber", "amber", "green", "amber"] }),
    ],
  },
  {
    id: "orbit", name: "Orbit Systems", industry: "Data & analytics", users: 9800, projects: 11,
    verticals: [
      vert("banking", "Banking", "🏦", { pipelineM: 210, wonQtrM: 39, forecastM: 165, deals: 33, openBriefs: 11, breached: 4, avgPickup: 5.2, sla: 2, reuse: 27, pocThroughput: 7, architects: 9, load: 88, atRisk: 6, stages: ["red", "amber", "amber", "green"] }),
      vert("retail", "Retail", "🛍️", { pipelineM: 98, wonQtrM: 31, forecastM: 84, deals: 37, openBriefs: 3, breached: 0, avgPickup: 1.7, sla: 2, reuse: 55, pocThroughput: 14, architects: 8, load: 58, atRisk: 1, stages: ["green", "green", "amber", "green"] }),
      vert("healthcare", "Healthcare", "🩺", { pipelineM: 140, wonQtrM: 25, forecastM: 108, deals: 18, openBriefs: 8, breached: 3, avgPickup: 3.8, sla: 2, reuse: 30, pocThroughput: 5, architects: 6, load: 81, atRisk: 4, stages: ["amber", "red", "green", "amber"] }),
    ],
  },
];

export function companyById(id: string): Company {
  return COMPANIES.find((c) => c.id === id) ?? COMPANIES[0];
}

// ---- Architect capacity (Pre-Sales cockpit) --------------------------------
export const ARCHITECTS: Architect[] = [
  { name: "Dana Ortiz", vertical: "Banking", load: 96, open: 9, drafts: 4 },
  { name: "Marc Lee", vertical: "Banking", load: 88, open: 7, drafts: 3 },
  { name: "Ivy Chen", vertical: "Healthcare", load: 82, open: 6, drafts: 2 },
  { name: "Raj Patel", vertical: "Retail", load: 54, open: 3, drafts: 3 },
  { name: "Sara Kim", vertical: "Retail", load: 61, open: 4, drafts: 4 },
  { name: "Tom Blake", vertical: "Insurance", load: 73, open: 5, drafts: 2 },
  { name: "Priya Shah", vertical: "Healthcare", load: 79, open: 6, drafts: 3 },
  { name: "Leo Marin", vertical: "Banking", load: 91, open: 8, drafts: 2 },
];

// ---- Onboarding journeys (in-flight) ---------------------------------------
export const ONBOARDINGS: Onboarding[] = [
  {
    id: "ob-healthcare", kind: "vertical", title: "Healthcare team onboarding", sub: "Apex Software · new vertical",
    owner: "Tenant Admin", current: 3,
    steps: ["Create vertical", "Load Healthcare pack", "Assign roles", "Connect systems", "Seed templates", "Go live"],
  },
  {
    id: "ob-nimbus", kind: "company", title: "Nimbus Cloud onboarding", sub: "New company (tenant)",
    owner: "Platform Admin", current: 4,
    steps: ["Provision tenant", "Org structure", "Connect systems", "Invite admins", "Choose packs", "Dry-run", "Go live"],
  },
  {
    id: "ob-hubspot", kind: "system", title: "HubSpot connector", sub: "Banking · won-opportunity events",
    owner: "Tenant Admin", current: 3,
    steps: ["Pick source", "Authenticate", "Map events→seams", "Send test event", "Validate", "Enable"],
  },
  {
    id: "ob-users", kind: "user", title: "Retail team — 240 users", sub: "Bulk invite via SCIM",
    owner: "Tenant Admin", current: 2,
    steps: ["Invite", "SSO accept", "Assign roles", "Checklist", "Active"],
  },
];

export function portfolio(company: Company) {
  const v = company.verticals;
  const sum = (f: (x: Vertical) => number) => v.reduce((a, x) => a + f(x), 0);
  const wAvg = (f: (x: Vertical) => number) => Math.round(sum((x) => f(x) * x.deals) / Math.max(sum((x) => x.deals), 1));
  return {
    pipelineM: sum((x) => x.pipelineM),
    wonQtrM: sum((x) => x.wonQtrM),
    forecastM: sum((x) => x.forecastM),
    openBriefs: sum((x) => x.openBriefs),
    breached: sum((x) => x.breached),
    atRisk: sum((x) => x.atRisk),
    reuse: wAvg((x) => x.reuse),
    throughput: sum((x) => x.pocThroughput),
    architects: sum((x) => x.architects),
  };
}
