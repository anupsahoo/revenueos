// Seed the event log. Briefs do not carry an age; they carry an arrival event
// and the age is computed from it. Everything here is synthetic and flagged.

import type { OsEvent, OsEventType } from "./events";
import { BRIEFS, SLA_DAYS, SOLUTION_ARCHITECT, businessDaysBetween, planFor, handoffSkeleton } from "./mock";
import { retrieve } from "./retrieval";

const DAY = 86_400_000;
const uid = () => { try { return crypto.randomUUID(); } catch { return `evt_${Math.random().toString(36).slice(2, 10)}`; } };
const ev = (type: OsEventType, tsMs: number, actor: string, briefId: string, payload: Record<string, unknown>): OsEvent =>
  ({ id: uid(), ts: new Date(tsMs).toISOString(), type, actor, briefId, payload, synthetic: true });

const OWNER = `${SOLUTION_ARCHITECT}, US Solution Architect`;

export function seedEvents(): OsEvent[] {
  const now = Date.now();
  const out: OsEvent[] = [];

  for (const b of BRIEFS) {
    const arrived = b.arrivedAt;
    const age = businessDaysBetween(arrived, now);

    out.push(ev("brief.arrived", arrived, `${b.fromRep}, US Sales`, b.id, {
      account: b.account, title: b.title, segment: b.segment, regulator: b.regulator,
      region: b.region, systems: b.systems, problem: b.problem, success: b.success, timeline: b.timeline,
    }));

    if (age >= 1) out.push(ev("sla.amber", arrived + 1 * DAY, "system", b.id, { ageAtTransition: 1, slaDays: SLA_DAYS }));

    if (age >= SLA_DAYS) {
      // A draft already existed on these, so the escalation has something to attach.
      const matches = retrieve(b, {});
      const draft = { matches, source: "sample" as const, model: null, plan: planFor(b), handoff: handoffSkeleton(b) };
      out.push(ev("draft.generated", arrived + 0.4 * DAY, "agent", b.id, { matches, source: "sample", model: null }));
      out.push(ev("sla.breached", arrived + SLA_DAYS * DAY, "system", b.id, { ageAtTransition: SLA_DAYS, slaDays: SLA_DAYS }));
      out.push(ev("trigger.fired", arrived + SLA_DAYS * DAY, "system", b.id, {
        owner: OWNER, status: "red", draft, draftAttached: true,
        note: `Brief passed the ${SLA_DAYS}-day SLA and was escalated automatically.`,
      }));
    }
  }

  return out.sort((a, b) => a.ts.localeCompare(b.ts));
}
