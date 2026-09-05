# RevenueOS — Brief→POC-Plan Loop

### ▶ Live demo: **https://revenueos-blond.vercel.app**

_Runs on Vercel with synthetic data — no login, no setup. Click a brief in the
queue, watch the agent draft an editable POC plan, accept/edit/reject it, and see
the seam tick toward its SLA and fire a breach trigger on its own._

---

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

- **Next.js (App Router) + TypeScript**, deployed on **Vercel** — one repo, one control surface, API routes.
- **Anthropic Claude** agent (tool-calling) for retrieval-explanation + drafting.
- **Append-only event store** behind one interface — in-memory + seed for demo/local (no accounts to run), swappable to **Neon / Vercel Postgres** for persistence.
- **Explainable retrieval** over a seeded library that **learns from accept/reject**.

All data in this repo is synthetic.

## Status

🟢 Live on Vercel — [revenueos-blond.vercel.app](https://revenueos-blond.vercel.app).
Working control surface with the agent wired in: explainable retrieval and POC
drafting run behind the UI (`/api/draft`); seam health, reuse and triggers are
computed live. The public demo drafts with a deterministic sample plan; set
`ANTHROPIC_API_KEY` to draft with Claude. Persistent event store (Neon/Postgres)
is the next step — see [`PLAN.md`](PLAN.md).

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/anupsahoo/revenueos)

Zero-config (Next.js). Optionally add `ANTHROPIC_API_KEY` (and
`LLM_MODEL=claude-sonnet-5`) in project env vars to enable Claude drafting.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Runs with no configuration — POC drafting falls back to a deterministic sample
plan. To draft with Claude, set an API key (see [`.env.example`](.env.example)):

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY
```

`npm run build` produces the Vercel production build.
