// Data layer over the static estate (data/estate.json, committed to the repo).
// No database — the JSON is the source of data; these are the query helpers the
// enterprise workspace navigates.

import estate from "@/data/estate.json";
import { statusForAge, type SeamStatus } from "./mock";

export interface Architect { id: string; name: string; vertical: string; region: string; load: number; }
export interface Company { id: string; name: string; region: string; employees: number; users: number; verticals: string[]; }
export interface Project {
  id: string; companyId: string; company: string; vertical: string; name: string;
  stage: string; region: string; valueK: number; contractK: number; sla: number;
  architectId: string; architect: string; regulator: string; segment: string;
}
export interface Brief {
  id: string; projectId: string; companyId: string; company: string; account: string;
  title: string; vertical: string; region: string; segment: string; regulator: string;
  problem: string; systems: string[]; timeline: string; success: string;
  ageDays: number; fromRep: string; architectId: string; architect: string;
  status: "open" | "accepted" | "rejected";
}

const E = estate as unknown as {
  regions: string[]; verticals: string[];
  architects: Architect[]; companies: Company[]; projects: Project[]; briefs: Brief[];
};

export const REGIONS = E.regions;
export const VERTICALS = E.verticals;
export const COMPANIES = E.companies;
export const PROJECTS = E.projects;
export const BRIEFS = E.briefs;
export const ARCHITECTS = E.architects;

export const companyById = (id: string) => COMPANIES.find((c) => c.id === id);
export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
export const briefById = (id: string) => BRIEFS.find((b) => b.id === id);
export const architectById = (id: string) => ARCHITECTS.find((a) => a.id === id);

export const briefsForProject = (projectId: string) => BRIEFS.filter((b) => b.projectId === projectId);
export const projectsForCompany = (companyId: string) => PROJECTS.filter((p) => p.companyId === companyId);

// Worst open-brief age → project SLA status.
export function projectStatus(projectId: string): { status: SeamStatus; worst: number; open: number } {
  const bs = briefsForProject(projectId).filter((b) => b.status === "open");
  const worst = bs.reduce((m, b) => Math.max(m, b.ageDays), 0);
  return { status: statusForAge(worst), worst, open: bs.length };
}

export interface ProjectFilter { companyId?: string; vertical?: string; status?: SeamStatus | "all"; q?: string; }
export function filterProjects(f: ProjectFilter): Project[] {
  const q = (f.q ?? "").toLowerCase().trim();
  return PROJECTS.filter((p) => {
    if (f.companyId && p.companyId !== f.companyId) return false;
    if (f.vertical && f.vertical !== "all" && p.vertical !== f.vertical) return false;
    if (f.status && f.status !== "all" && projectStatus(p.id).status !== f.status) return false;
    if (q && !(`${p.name} ${p.company} ${p.vertical} ${p.architect}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function estateTotals() {
  const openBriefs = BRIEFS.filter((b) => b.status === "open");
  return {
    companies: COMPANIES.length,
    projects: PROJECTS.length,
    briefs: BRIEFS.length,
    architects: ARCHITECTS.length,
    users: COMPANIES.reduce((a, c) => a + c.users, 0),
    openBriefs: openBriefs.length,
    breached: openBriefs.filter((b) => b.ageDays >= 2).length,
    contractM: Math.round(PROJECTS.reduce((a, p) => a + p.contractK, 0) / 1000),
  };
}
