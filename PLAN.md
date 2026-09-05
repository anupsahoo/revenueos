# Architecture & Plan

The system is one loop, built depth-first. Not a dashboard, not five screens —
one control surface where a brief becomes an editable POC plan, a person decides,
and the seam watches itself.

> This was written before the build and is kept as the plan of record. Where the
> shipped code diverged, the architecture block below says so. What actually
> exists today is in [`docs/STATUS.md`](docs/STATUS.md); why each choice was made
> is in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Capabilities

- **Event in** — a won opportunity arrives as an `OS event` carrying a brief,
  shaped like a CRM / call-intelligence payload (timestamp, owner, account,
  brief). Multiple varied synthetic briefs to exercise retrieval.
- **The agent does the work** — reads the brief, retrieves candidate templates
  from the library, **explains why each matches**, and drafts a POC plan **and** a
  skeleton of the handoff document Delivery will need. The output is editable and
  sendable — not a summary.
- **A person decides** — the Solution Architect accepts, edits, or rejects the
  draft on screen. The decision is itself an `OS event`: reuse rate moves and
  template ranking learns from acceptance and rejection.
- **The seam watches itself** — brief age is computed against the SLA
  continuously, rolled to green / amber / red, and on breach a trigger fires to a
  named owner with the draft attached. Nothing is entered by hand.
- **One control surface** — the brief queue, seam health, the current draft, the
  trigger log, and the actions, on one screen you can act from.

## Architecture

```
Next.js App Router (one control surface at /)
├─ app/api/events            read the OS event log (append-only = source of truth)
├─ app/api/draft             agent run: retrieve → explain → draft POC plan + handoff
├─ app/api/decisions         accept/edit/reject → new event → ranking + reuse update
├─ app/api/seam/health       brief age vs SLA → green/amber/red, and appends the
│                            amber/breach/trigger events when a threshold is crossed
├─ app/api/ask               "Ask the seam": six read-only tools over the log and docs
├─ lib/graph                 LangGraph agent: retrieve → draft → assemble
├─ lib/retrieval             explainable scoring over the library (+ learned boosts)
├─ lib/events                append-only event store behind one interface
├─ lib/derive                pure functions: age, status, queue, reuse, boosts, triggers
├─ lib/seed                  synthetic briefs → arrival events
└─ lib/mock                  solution templates (multi-region) + briefs — all synthetic
```

**Three things came out differently.** `lib/agent` became `lib/graph.ts` when the
agent moved to a LangGraph state machine. There is no separate `app/api/triggers`
route: triggers are appended by `/api/seam/health` when it detects a threshold
crossing, so the seam writes its own escalations rather than being told to. And
`app/api/ask` was not in this plan at all — it was added once it became clear the
screen needed to answer "why did it pick that template?" without a person reading
the code. The rest shipped as written.

**Event-sourced by design.** Health, reuse rate, and rankings are *computed* from
the event log, never entered — so "health is computed, not reported" holds by
construction.

**Deploys on Vercel.** The event store sits behind one interface with two
implementations: an in-memory + seed store (default — runs anywhere with no
setup, persists across requests while the serverless instance is warm) and a
**Neon / Vercel Postgres** store for durable persistence (one env var, no app
rewrite). Serverless filesystems are ephemeral, so no local SQLite file.

**Retrieval that reasons.** The library is small, so retrieval is transparent
structured scoring — segment, regulator, capability and integration overlap,
region of origin, recency — with a written reason per candidate, optionally
blended with vector similarity. Accept/reject adjusts per-template weights so
ranking improves over time.

## Data shapes

- **Brief** — account, region, segment (retail bank / insurer / capital markets /
  lender), regulator, business problem, systems in use, timeline, success definition.
- **Solution template** — id, name, region of origin, segment, regulator context,
  problem solved, capabilities, integrations, effort, outcome, last used, owner.
- **POC plan** — objective, success criteria, scope in/out, templates drawn on and
  what changes, integrations, week-by-week plan, risks, people needed.

## Roadmap (depth-first, value first)

All six shipped in v0.2.0. Steps 4 and 5 were the ones that needed a second pass:
decisions and health were client-side first, and only became real once every
number was derived from the event log instead of held in React state.

1. ✅ Scaffold, event store, seed library + briefs (synthetic).
2. ✅ Agent: retrieve + explain + draft POC plan & the Delivery handoff.
3. ✅ One control surface: queue, current draft, actions.
4. ✅ Decisions loop: accept/edit/reject → events → reuse + ranking learn.
5. ✅ Seam health computed + trigger on breach with draft attached.
6. ✅ End-to-end polish of the loop.

What comes next is the enterprise build, planned as M1–M6 in
[`PRODUCT.md`](PRODUCT.md) and sequenced in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Design principles

- **The append-only event log is the single source of truth.** Every derived
  number recomputes from it.
- **The agent proposes; the human commits.** The accept/commit at the seam — the
  promise made to a customer about scope and feasibility — stays with the Solution
  Architect, not the agent.

## Decisions

1. **Stack:** Next.js + TypeScript + an AI model, deployed on Vercel. Event store
   in-memory now, Neon / Vercel Postgres for persistence.
2. **Trigger delivery:** in-app trigger log (breach record with the draft
   attached, shown on the control surface).
3. **Retrieval:** explainable structured scoring with a written reason per match;
   ranking learns from accept/reject.
