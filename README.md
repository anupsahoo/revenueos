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

## Plan & tickets

The shipped code (this repo) is the **M0 prototype** — a working single-tenant
Brief→POC loop. The **enterprise product** (multi-tenant, per-vertical, exec
cockpits, onboarding journeys, 40k users) is planned as
[**10 epics + 35 stories across M1–M6**](https://github.com/anupsahoo/revenueos/milestones).

➡️ **See [`PRODUCT.md`](PRODUCT.md)** for the pictorial product plan: personas &
tenancy, company/system/user onboarding journeys, vertical packs, the
multi-tenant architecture, and the two director cockpits.

## Architecture, end to end (pictorial)

### High-level — request to answer

```mermaid
flowchart LR
  subgraph B["🖥️ Control surface (one screen)"]
    Q["Brief queue"] --> D["Draft + actions"]
    D --> DEC{"Accept / Edit / Reject"}
  end
  B -- "POST /api/draft" --> API["/app/api/draft/"]
  API --> G[["LangGraph agent"]]
  subgraph G["🧠 lib/graph.ts"]
    RET["retrieve"] --> DR["draft"] --> ASM["assemble"]
  end
  RET -. reads .-> LIB[("Template library<br/>lib/mock.ts")]
  DR -->|Claude| LLM(("Anthropic<br/>claude-sonnet-5"))
  DR -. no key .-> FB["Sample fallback"]
  DEC -->|OS event| EV[["Event log<br/>health · reuse · ranking"]]
  EV --> Q
```

### The loop — who does what

```mermaid
sequenceDiagram
  autonumber
  participant CRM as Won opportunity
  participant UI as Control surface
  participant GR as LangGraph agent
  participant SA as Solution Architect
  participant SEAM as Seam watcher
  CRM->>UI: OS event (brief)
  UI->>GR: retrieve + draft
  GR->>GR: score templates (with reasons)
  GR-->>UI: POC plan + handoff + matches
  SA->>UI: accept / edit / reject
  UI->>UI: OS event → reuse ↑, ranking learns
  SEAM->>SEAM: age vs 2-day SLA (live)
  SEAM-->>SA: breach → trigger (draft attached)
```

### Low-level — the agent state machine (`lib/graph.ts`)

```mermaid
stateDiagram-v2
  [*] --> retrieve
  retrieve --> draft: matches[]
  draft --> assemble: plan (Claude or sample)
  assemble --> [*]: + handoff skeleton
```

### Every file, and how it connects

| File | Layer | Role | Business use case | Connects to |
|---|---|---|---|---|
| `app/page.tsx` | Frontend | The one control surface: queue, draft, decisions, seam health, logs | The screen a Solution Architect works from | → `app/api/draft`, `lib/mock`, `Visuals` |
| `app/components/Visuals.tsx` | Frontend | Inline-SVG engine diagram, SLA gauge, sparkline, region bars | Makes the seam's health *visible*, not read | used by `page.tsx` |
| `app/api/draft/route.ts` | API | Runs the agent for a brief | Turns a brief into an editable plan | → `lib/graph` |
| `lib/graph.ts` | Backend (LangGraph) | State machine: retrieve → draft → assemble | The agent that does the volume work | → `lib/retrieval`, `ChatAnthropic`, `lib/mock` |
| `lib/retrieval.ts` | Backend | Explainable scoring + learned boosts | "Reasons over knowledge" — why each template matches | reads `lib/mock` |
| `lib/mock.ts` | Data | Synthetic briefs, template library, sample plans | The seam the real event store/DB replaces | imported everywhere |
| `app/globals.css` | Frontend | Design tokens (light/dark) + components | Consistent, themeable control-room look | used by all UI |
| `app/layout.tsx` | Frontend | App shell, fonts, metadata | — | wraps `page.tsx` |
| `.github/workflows/release-deploy.yml` | Infra | Release → Vercel production deploy | Ship a version on demand | Vercel |

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
