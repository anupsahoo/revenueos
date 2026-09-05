import { test } from "node:test";
import assert from "node:assert/strict";
import { businessDaysBetween, briefAgeDays, seamStatus, reuseRate, boosts } from "./derive.ts";
import type { OsEvent } from "./events.ts";

const DAY = 86_400_000;
let n = 0;
const mk = (type: OsEvent["type"], briefId: string, tsMs: number, payload: Record<string, unknown> = {}): OsEvent =>
  ({ id: `e${n++}`, ts: new Date(tsMs).toISOString(), type, actor: "test", briefId, payload, synthetic: true });

// A Friday 09:00 UTC and the following Monday 09:00 UTC.
const FRI = Date.UTC(2026, 8, 4, 9, 0, 0);   // 2026-09-04 is a Friday
const MON = FRI + 3 * DAY;                    // Monday

test("age skips the weekend", () => {
  // Friday 09:00 → Monday 09:00 is 3 calendar days but 1 business day.
  const d = businessDaysBetween(FRI, MON);
  assert.ok(Math.abs(d - 1) < 0.05, `expected ~1 business day, got ${d}`);
});

test("brief age comes from the arrival event", () => {
  const events = [mk("brief.arrived", "b1", FRI)];
  const age = briefAgeDays(events, "b1", FRI + 1 * DAY); // Saturday → still 1 business day of Friday
  assert.ok(age <= 1.01, `expected <= 1, got ${age}`);
  assert.equal(briefAgeDays(events, "missing", MON), 0);
});

test("amber and red thresholds", () => {
  const base = Date.UTC(2026, 8, 1, 9, 0, 0); // Tuesday
  const events = [mk("brief.arrived", "b1", base)];
  assert.equal(seamStatus(events, "b1", base + 2 * 3_600_000), "green"); // 2h
  assert.equal(seamStatus(events, "b1", base + 1.2 * DAY), "amber");     // >= 1 day
  assert.equal(seamStatus(events, "b1", base + 2.1 * DAY), "red");       // >= 2 days
});

test("reuse rate is zero with no decisions", () => {
  const r = reuseRate([mk("brief.arrived", "b1", FRI)]);
  assert.equal(r.total, 0);
  assert.equal(r.rate, 0);
});

test("reuse rate and boosts after one accept and one reject", () => {
  const events = [
    mk("brief.arrived", "b1", FRI),
    mk("brief.arrived", "b2", FRI),
    mk("draft.accepted", "b1", MON, { templateIds: ["t1", "t2"] }),
    mk("draft.rejected", "b2", MON, { templateIds: ["t2"] }),
  ];
  const r = reuseRate(events);
  assert.equal(r.accepted, 1);
  assert.equal(r.rejected, 1);
  assert.equal(r.rate, 0.5);

  const b = boosts(events);
  assert.equal(b.t1, 8);
  assert.equal(b.t2, 0); // +8 then −8
});
