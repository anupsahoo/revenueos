# STATUS — what is built vs what is claimed

Phase 0 audit. Read-only. No code changed in this session. All data in the repo is synthetic and labelled synthetic.

I checked the challenge in `docs/CHALLENGE.md` against the current code, the 64 GitHub issues, and the commit log. This is blunt on purpose.

## Snapshot
- Repo has one API route: `app/api/draft/route.ts`. Nothing else under `app/api`.
- Two separate synthetic datasets that do not agree with each other:
  - `lib/dataset.ts` (about 2,025 companies) feeds `/`, `/sales`, `/presales`.
  - `data/estate.json` (12 companies, 225 projects, 451 briefs, 60 architects) feeds `/operator`.
- Local production build: success (`npm run build`, verified this session).
- Live Vercel: latest Production deployment is Ready but about 9 hours old, so it predates today's operator-workspace rewrite and the enterprise-scale visuals. Deploys are release-triggered only, and no release was cut, so the live site is behind `main`.
- `package.json` dependencies: `@anthropic-ai/sdk`, `@langchain/anthropic`, `@langchain/core`, `@langchain/langgraph`, `next`, `react`, `react-dom`, `recharts`, `zod`. Dev: `@types/node`, `@types/react`, `@types/react-dom`, `typescript`. No Postgres/Neon, no LangSmith, no webhook library.

## Requirements R1–R6

### R1 — Event in
- **Claimed:** a won opportunity arrives as an OS event carrying the brief, timestamp and owner; `PLAN.md:29` lists `app/api/events` as an append-only log.
- **Actual:** there is no event. Briefs are static rows: 451 in `data/estate.json`, plus 3 legacy briefs in `lib/mock.ts:194-236`. They are read synchronously, not "arriving". No timestamp/owner event envelope. No `app/api/events` route.
- **Gap:** the "event in" mechanism does not exist. Brief count and variety are fine; the event shape and arrival are missing.

### R2 — An agent does the work
- **Claimed:** retrieve templates, explain each match, draft a POC plan plus a handoff skeleton.
- **Actual:** works. `lib/retrieval.ts` scores an 8-template library (`lib/mock.ts` `TEMPLATES`, UK and India origins) and returns a written reason per match. `lib/graph.ts` runs a LangGraph path (retrieve → draft → assemble); the draft node calls an AI model and falls back to a deterministic sample plan (`planFor` in `lib/mock.ts`) when the model is not configured. `handoffSkeleton` (`lib/mock.ts`) produces the Delivery skeleton. `app/api/draft/route.ts` wires it and returns matches, plan, handoff, source.
- **Gap:** strongest area. Two caveats: AI drafting was slow in testing (about 40s) and fell back to the sample under rate limits; and the retrieval library is 8 templates, the minimum. Otherwise meets R2.

### R3 — A person decides
- **Claimed:** the US Solution Architect accepts, edits or rejects; the decision is an OS event; reuse rate moves; template ranking learns.
- **Actual:** accept/edit/reject exist (`app/operator/page.tsx:57-63`, `decide()`). Decisions live in React `useState` (`app/operator/page.tsx:24`). Ranking boosts live in a `useRef` (`app/operator/page.tsx:28`) and are sent to `/api/draft`. Nothing is written server-side. A refresh loses all of it. The decision is not recorded as an event. The operator screen no longer shows a reuse rate that moves.
- **Gap:** decisions are ephemeral client state, not events. Learning is session-only and cannot be verified after refresh. Reuse rate is not shown on the operator screen.

### R4 — The seam watches itself
- **Claimed:** brief age vs a two-day SLA computed continuously; green/amber/red; on breach a trigger fires to a named owner with the draft attached; everything computed from events.
- **Actual:** brief age is a static `ageDays` field (`lib/estate.ts:19`, values in `data/estate.json`; also `lib/mock.ts:35`). `statusForAge()` (`lib/mock.ts:61-64`) reads that field. It is not computed from an arrival timestamp against the clock. No trigger record is written on breach; there is only a status pill. CSS for a trigger card exists (`app/globals.css:265`) but no code produces trigger records.
- **Gap:** weakest scored area. Age is typed-in data, not computed. No trigger, no named-owner escalation, no draft attached on breach.

### R5 — One control surface
- **Claimed:** one screen with the brief queue, seam health, current draft, trigger log, and actions.
- **Actual:** `/operator` (`app/operator/page.tsx`) is a real, actionable screen: searchable project and brief browser, brief detail, retrieved templates, editable draft, accept/edit/reject, an SLA gauge. But it is not the front door, it has no trigger log, and the app is spread across five screens (`/`, `/sales`, `/presales`, `/onboarding`, `/operator`).
- **Gap:** the loop screen is good and actionable, but R5 wants one control surface with the trigger log on it. The challenge explicitly warns that breadth scores worse than one deep loop.

### R6 — Built with AI
- **Claimed:** README and PRODUCT describe the AI build (wording is vendor-neutral by standing decision).
- **Actual:** commit history is intact and shows an incremental build. Messages are plain and vendor-neutral, so the AI method is not visible in the commits. There is no `docs/BUILD-LOG.md`. `docs/TIME-LOG.md` starts this session. Note for the record: the commit history was rewritten once earlier to remove vendor names, before these honesty rules applied; from here it is append-only.
- **Gap:** R6 wants the method visible in commits and a build log that names the tools and models. The build log does not exist yet. It is the rule-7 exception where tools and models must be named.

## The five prior-audit findings

1. **CONFIRMED.** Decisions in `useState` (`app/operator/page.tsx:24`); ranking boosts in a `useRef` (`app/operator/page.tsx:28`); nothing persisted server-side; a refresh loses all of it. Line numbers still match after the operator rewrite.
2. **CONFIRMED, location corrected.** Static `ageDays` now lives in `data/estate.json` and is typed at `lib/estate.ts:19` (the operator screen uses estate briefs), and still exists at `lib/mock.ts:35` for the 3 legacy briefs. `statusForAge()` (`lib/mock.ts:61`) reads it. Not computed from an arrival timestamp.
3. **CONFIRMED.** No trigger record is written on breach; only a status label. The earlier operator page had a trigger log; the rewrite removed it.
4. **CONFIRMED.** `app/api/draft/route.ts` is the only route. `PLAN.md:29-36` describes `/api/events`, `/api/decisions`, `/api/seam/health`, `/api/triggers`, `lib/events`, `lib/agent`. None exist. `lib/agent.ts` was removed earlier; `lib/graph.ts` is the agent now.
5. **CONFIRMED.** #10, #11, #12, #14, #15, #16, #17, #18 are closed with no code behind them. No Postgres/Neon or LangSmith dependency in `package.json`, no webhook route, no eval script, no second seam. They were closed as "reorganised into the enterprise backlog", but closed still reads as done, which breaks the honesty rule. **#13 "Full handoff document generator" is partial:** `handoffSkeleton()` (`lib/mock.ts`) and the `assemble` node (`lib/graph.ts`) produce a skeleton, not a full generator, so "closed" is not honest for it either. Fix: reopen these or relabel them `cut` with a one-line reason.

## Other defects recorded
- **Default route.** `/` renders the Portfolio Command Centre (`app/page.tsx:10`, `Portfolio()`), not the operator loop. The loop is at `/operator`.
- **`People` number is wrong and not event-derived.** `app/page.tsx:24` renders `` `${(TOTALS.people / 1000).toFixed(0)}k` ``. `TOTALS.people` is a sum over the 2,025-company set (`lib/dataset.ts:64`), roughly 83 million, so it prints like `83534k`. It should read about `83.5M`. It also breaks rule 4: I cannot point at an event-log query that produces it.
- **Datasets disagree.** `/` claims 2,025 companies; `/operator` shows 12. Same product, two numbers.

## Marks at risk

| Requirement | Weight | Marks at risk now | Fix phase |
|---|---|---|---|
| R6 Built with AI | 35% | Build log missing; method not visible in the clean commits | Phase 6 (build log, names tools/models) |
| R2 Agent does the work | 30% | Low risk; drafting works. Risk is slow/fallback drafting and a minimum-size library | Phase 3 (harden drafting, widen library) |
| R3 Person decides (shares the 30%) | 30% | Decisions are not events; learning lost on refresh; reuse not shown | Phase 2 (decisions as events, persist) |
| R2/R3 Reasons over knowledge | 20% | Retrieval is explainable and works; reuse is not measured on screen | Phase 2 / Phase 3 |
| R4 Seam watches itself | 15% | Highest risk; age is static, no trigger fires | Phase 2 (computed age from events, trigger record) |
| R1 Event in | scored across R3/R4 | No OS event exists | Phase 2 (event store + event shape) |
| R5 One control surface | scored across all | Loop is not the front door; no trigger log; five screens | Phase 4 (make the loop the surface, add trigger log) |
| Cross-cutting | — | `People` defect, dataset mismatch, issues closed without code | Phase 1 (fix numbers, reconcile data, reopen/relabel issues) |
