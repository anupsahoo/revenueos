# RevenueOS — Brief→POC-Plan Loop

An operating system for a revenue handoff. When Sales wins a deal, the
Sales→PreSales handoff (the "seam") is cleared by an AI agent, a person decides,
the system learns from that decision, and the seam watches its own SLA health.

## The loop

```
Won opportunity  ─▶  OS event (brief)  ─▶  Agent retrieves templates + drafts
   (CRM-shaped)                              POC plan & handoff skeleton
                                                     │
                                                     ▼
   Seam health  ◀──  OS events  ◀──  Solution Architect accepts / edits / rejects
   (age vs SLA,                             (decision is itself an event;
    green/amber/red,                         reuse rate + template ranking learn)
    trigger on breach)
```

## The problem it solves

A B2B platform sells to banks and insurers. Deals stall at one seam: when a
brief reaches PreSales, a solutions engineer must pick it up and start the POC
plan, but prior solution templates aren't retrievable at that moment — so every
POC is built from scratch and briefs sit idle against their SLA.

This loop makes those templates **retrievable, explainable, and reusable** at the
instant a brief arrives, and measures reuse going up.

## Principles

- **Every handoff is an event** — timestamped and owned; the event log is the source of truth.
- **Health is computed, not reported** — SLA state is derived from events, never typed in.
- **Agents do the volume work; people decide** — the agent drafts and explains; a person commits.

## Stack

- **Next.js (App Router) + TypeScript** — one repo, one control surface, API routes.
- **Anthropic Claude** agent (tool-calling) for retrieval-explanation + drafting.
- **SQLite** append-only event store + template library (no external accounts to run).
- **Explainable retrieval** over a seeded library that **learns from accept/reject**.

All data in this repo is synthetic.

## Status

🟡 Scaffold + architecture. See [`PLAN.md`](PLAN.md). The working system lands next.

## Run

_Added with the first working slice._ Target: `npm install && npm run dev`.
