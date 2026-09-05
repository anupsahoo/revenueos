// Derived views over the event log. Pure functions: each one takes the events
// and returns a value, and reads nothing else. If a number is on screen, it is
// produced here. The JSDoc lines are the text shown behind each ⓘ.

import type { OsEvent } from "./events";

export type Status = "green" | "amber" | "red";
const DAY = 86_400_000;

/** Business days between two instants, skipping Saturday and Sunday. */
export function businessDaysBetween(fromMs: number, toMs: number): number {
  if (toMs <= fromMs) return 0;
  let business = 0;
  const step = 3_600_000;
  for (let t = fromMs; t < toMs; t += step) {
    const d = new Date(t).getDay();
    if (d !== 0 && d !== 6) business += step;
  }
  return business / DAY;
}

/** Business days since this brief's arrival event, computed now. Weekends are skipped because the SLA is stated in business days. */
export function briefAgeDays(events: OsEvent[], briefId: string, now: number = Date.now()): number {
  const arrived = events.find((e) => e.type === "brief.arrived" && e.briefId === briefId);
  if (!arrived) return 0;
  return businessDaysBetween(Date.parse(arrived.ts), now);
}

/** Red at or past the 2-day SLA; amber from 1 day; green below. Derived from the arrival event; nothing is stored. */
export function seamStatus(events: OsEvent[], briefId: string, now: number = Date.now(), slaDays = 2): Status {
  const age = briefAgeDays(events, briefId, now);
  if (age >= slaDays) return "red";
  if (age >= slaDays / 2) return "amber";
  return "green";
}

export interface QueueRow {
  briefId: string; account: string; title: string; segment: string; region: string;
  arrived: string; age: number; status: Status;
  latestDecision?: "accepted" | "edited" | "rejected";
  decidedAt?: string;
}

/** One row per brief.arrived event, with the age and status computed now. */
export function queue(events: OsEvent[], now: number = Date.now(), slaDays = 2): QueueRow[] {
  const arrivals = events.filter((e) => e.type === "brief.arrived");
  return arrivals.map((a) => {
    const decisions = events.filter((e) => e.briefId === a.briefId && (e.type === "draft.accepted" || e.type === "draft.rejected" || e.type === "draft.edited"));
    const last = decisions[decisions.length - 1];
    const p = a.payload as Record<string, string>;
    return {
      briefId: a.briefId,
      account: p.account ?? a.briefId,
      title: p.title ?? "",
      segment: p.segment ?? "",
      region: p.region ?? "",
      arrived: a.ts,
      age: businessDaysBetween(Date.parse(a.ts), now),
      status: seamStatus(events, a.briefId, now, slaDays),
      latestDecision: last ? (last.type.split(".")[1] as "accepted" | "edited" | "rejected") : undefined,
      decidedAt: last?.ts,
    };
  });
}

/** Accepted drafts divided by accepted plus rejected, over the decision events. Moves the moment a decision is recorded. */
export function reuseRate(events: OsEvent[]): { accepted: number; rejected: number; total: number; rate: number } {
  const accepted = events.filter((e) => e.type === "draft.accepted").length;
  const rejected = events.filter((e) => e.type === "draft.rejected").length;
  const total = accepted + rejected;
  return { accepted, rejected, total, rate: total ? accepted / total : 0 };
}

/** Plus 8 for every accept and minus 8 for every reject, on the templates that draft used. Feeds retrieval ranking. */
export function boosts(events: OsEvent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of events) {
    if (e.type !== "draft.accepted" && e.type !== "draft.rejected") continue;
    const ids = (e.payload.templateIds as string[]) ?? [];
    const delta = e.type === "draft.accepted" ? 8 : -8;
    for (const id of ids) out[id] = (out[id] ?? 0) + delta;
  }
  return out;
}

export interface TriggerRow { ts: string; briefId: string; account: string; owner: string; status: string; draftAttached: boolean; }

/** Every escalation the seam fired when a brief passed its SLA, newest first. */
export function triggerLog(events: OsEvent[]): TriggerRow[] {
  const byId = new Map(events.filter((e) => e.type === "brief.arrived").map((e) => [e.briefId, (e.payload as Record<string, string>).account ?? e.briefId]));
  return events
    .filter((e) => e.type === "trigger.fired")
    .map((e) => ({
      ts: e.ts,
      briefId: e.briefId,
      account: byId.get(e.briefId) ?? e.briefId,
      owner: String(e.payload.owner ?? ""),
      status: String(e.payload.status ?? "red"),
      draftAttached: Boolean(e.payload.draftAttached ?? e.payload.draft),
    }))
    .sort((a, b) => b.ts.localeCompare(a.ts));
}

/** Every open brief's status, recomputed from arrival events on each poll. */
export function health(events: OsEvent[], now: number = Date.now(), slaDays = 2): { green: number; amber: number; red: number; worstBriefId?: string; worstAge: number } {
  const open = queue(events, now, slaDays).filter((r) => r.latestDecision !== "accepted" && r.latestDecision !== "rejected");
  const counts = { green: 0, amber: 0, red: 0 };
  let worstBriefId: string | undefined;
  let worstAge = 0;
  for (const r of open) {
    counts[r.status]++;
    if (r.age > worstAge) { worstAge = r.age; worstBriefId = r.briefId; }
  }
  return { ...counts, worstBriefId, worstAge };
}
