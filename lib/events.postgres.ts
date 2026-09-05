// Durable event store — INTERFACE STUB, not built in M0.
//
// The swap is one environment variable. When DATABASE_URL is set, point
// `store` in lib/events.ts at PostgresEventStore instead of MemoryEventStore.
// Nothing else in the app changes, because everything reads through the
// EventStore interface and derives from the returned events.
//
//   create table os_events (
//     id         text primary key,
//     ts         timestamptz not null,
//     type       text not null,
//     actor      text not null,
//     brief_id   text not null,
//     payload    jsonb not null,
//     synthetic  boolean not null default false
//   );
//   create index on os_events (brief_id, ts);
//   create index on os_events (type, ts);
//
// Append-only: no updates, no deletes. Reads are the derive functions in
// lib/derive.ts, which already take an OsEvent[] and nothing else.
//
// Tracked as issue #53 (durable per-tenant event store). Deliberately not built
// in M0 — see docs/CUT-LIST.md. No dependency is added for it.

import type { EventStore } from "./events";

export const PostgresEventStore: EventStore | null = null;
