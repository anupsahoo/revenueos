import { NextResponse } from "next/server";
import { store } from "@/lib/events";
import { health, queue, triggerLog, reuseRate } from "@/lib/derive";
import { SLA_DAYS, SOLUTION_ARCHITECT } from "@/lib/mock";

export const runtime = "nodejs";

const OWNER = `${SOLUTION_ARCHITECT}, US Solution Architect`;

// Reading health also lets the seam watch itself: any brief that has crossed
// into amber or red since the last recorded sla.* event gets the transition
// appended, and a breach also fires a trigger with the draft attached.
// Idempotent — it never fires twice for the same brief and status.
export async function GET() {
  const now = Date.now();
  let events = await store.all();

  for (const row of queue(events, now, SLA_DAYS)) {
    if (row.latestDecision === "accepted" || row.latestDecision === "rejected") continue;
    const seen = events.filter((e) => e.briefId === row.briefId);
    const hasAmber = seen.some((e) => e.type === "sla.amber");
    const hasRed = seen.some((e) => e.type === "sla.breached");

    if ((row.status === "amber" || row.status === "red") && !hasAmber) {
      await store.append({ type: "sla.amber", actor: "system", briefId: row.briefId, synthetic: false, payload: { ageAtTransition: row.age, slaDays: SLA_DAYS } });
    }
    if (row.status === "red" && !hasRed) {
      await store.append({ type: "sla.breached", actor: "system", briefId: row.briefId, synthetic: false, payload: { ageAtTransition: row.age, slaDays: SLA_DAYS } });
      const drafts = seen.filter((e) => e.type === "draft.generated");
      const latest = drafts[drafts.length - 1];
      await store.append({
        type: "trigger.fired", actor: "system", briefId: row.briefId, synthetic: false,
        payload: {
          owner: OWNER, status: "red",
          draft: latest?.payload ?? null,
          draftAttached: Boolean(latest),
          note: `Brief passed the ${SLA_DAYS}-day SLA and was escalated automatically.`,
        },
      });
    }
  }

  events = await store.all();
  return NextResponse.json({
    now: new Date(now).toISOString(),
    slaDays: SLA_DAYS,
    health: health(events, now, SLA_DAYS),
    queue: queue(events, now, SLA_DAYS),
    triggers: triggerLog(events),
    reuse: reuseRate(events),
  });
}
