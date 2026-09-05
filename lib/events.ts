// Append-only event log — the single source of truth. Every number the UI shows
// is derived from these events (see lib/derive.ts). In-memory for the demo
// (resets on cold start); the Postgres swap is one env var, see events.postgres.ts.

export type OsEventType =
  | "brief.arrived"     // R1: won opportunity → brief enters the seam
  | "draft.generated"   // R2: agent produced a draft (matches + reasons + source ai|sample)
  | "draft.accepted"    // R3
  | "draft.edited"      // R3 (carries the diff summary)
  | "draft.rejected"    // R3 (carries an optional reason)
  | "sla.amber"         // R4: computed transition
  | "sla.breached"      // R4: computed transition
  | "trigger.fired";    // R4: escalation to a named owner, draft attached

export const OS_EVENT_TYPES: OsEventType[] = [
  "brief.arrived", "draft.generated", "draft.accepted", "draft.edited", "draft.rejected", "sla.amber", "sla.breached", "trigger.fired",
];

export interface OsEvent {
  id: string;
  ts: string;            // ISO 8601, UTC
  type: OsEventType;
  actor: string;         // "system" | "agent" | a named person
  briefId: string;
  payload: Record<string, unknown>;
  synthetic: boolean;    // true for seed data — always shown in UI
}

export interface EventStore {
  append(e: Omit<OsEvent, "id" | "ts">): Promise<OsEvent>;
  list(filter?: { briefId?: string; type?: OsEventType; since?: string }): Promise<OsEvent[]>;
  all(): Promise<OsEvent[]>;
}

import { seedEvents } from "./seed";

// Module-level singleton, seeded once on first access.
let LOG: OsEvent[] | null = null;
function log(): OsEvent[] {
  if (!LOG) LOG = seedEvents();
  return LOG;
}

const uid = () => { try { return crypto.randomUUID(); } catch { return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; } };

export const MemoryEventStore: EventStore = {
  async append(e) {
    const ev: OsEvent = { ...e, id: uid(), ts: new Date().toISOString() };
    log().push(ev);
    return ev;
  },
  async list(filter) {
    return log().filter((e) =>
      (!filter?.briefId || e.briefId === filter.briefId) &&
      (!filter?.type || e.type === filter.type) &&
      (!filter?.since || e.ts >= filter.since)
    );
  },
  async all() {
    return [...log()];
  },
};

// The one store the app uses. Swap here when Postgres lands (see events.postgres.ts).
export const store: EventStore = MemoryEventStore;
