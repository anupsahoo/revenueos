# RevenueOS — submission

One seam, closed end to end.

**Live:** https://revenueos-blond.vercel.app
**Repo:** https://github.com/anupsahoo/revenueos
**Version:** v0.2.0

---

## The problem, in four numbers

Marketing → Sales → **PreSales** → Delivery → Support. It stalls at one join.
A won deal becomes a brief, and a Solution Architect has **2 business days** to
pick it up and start the POC plan.

| | |
|---|---|
| The SLA | **2 days** |
| US actual | **6.8 days** |
| US reuse of prior solutions | **21%** |
| UK / India reuse | **58% / 55%** |

It is not a headcount problem. The templates already exist. Nothing fetches them.

## What I built

One screen: the operator loop.

**Brief arrives → retrieve 3 matches → draft the POC plan → a human accepts →
the library re-ranks.** Everything up to the commitment is automated. The
commitment stays with a named human.

Breadth was the trap here, so there is one screen and no second seam.

## The three things worth looking at

**1. Nothing on the screen is stored.** There is an append-only event log and a
set of pure functions over it. Age, status, reuse rate, boosts and triggers are
all derived on read. Every number has an ⓘ that shows the query behind it — and
if a number cannot show its query, it does not go on the screen.
→ `lib/events.ts`, `lib/derive.ts`

**2. Retrieval you can argue with.** Structured scoring with the reasons written
out in words, so a Solution Architect can push back on a match. Nothing below a
score of 40 is shown, and when nothing clears it the screen says so instead of
inventing a match.
→ `lib/retrieval.ts`

**3. A chat box with no memory.** "Ask the seam" has six read-only tools over the
log, the library and the docs. It cites what it read, and it refuses when the
tools do not hold the answer. Ask it the weather.
→ `app/api/ask/route.ts`

## What is real, and what is not

**Real:** the event log and its tests, the retrieval scoring, the three-node
agent, SLA breach detection and the escalation with the draft attached, the
tool-grounded chat and its refusals.

**Not real yet:** the data is synthetic and labelled as such on screen. The event
store is in memory, so a cold start loses every decision — that is the thing that
breaks first at 10×, it is issue #53, and the interface for the swap is already
written in `lib/events.postgres.ts`. No auth, one tenant, no background workers.

46 issues open across six milestones, 18 closed. Nothing is closed unless code
exists behind it — where a stretch item did not get built I labelled it `cut`
with a reason, and I reopened #13 rather than leave a skeleton marked done.

## Where to look

| | |
|---|---|
| The problem I chose and why | [docs/CHALLENGE.md](docs/CHALLENGE.md) |
| What is built vs. what is claimed | [docs/STATUS.md](docs/STATUS.md) |
| Decisions and what each one cost | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Twelve weeks against real issues | [docs/ROADMAP.md](docs/ROADMAP.md) |
| What I cut, and what breaks at 10× | [docs/CUT-LIST.md](docs/CUT-LIST.md) |
| How one engineer runs this with agents | [docs/IC-OPERATING-MODEL.md](docs/IC-OPERATING-MODEL.md) |
| How it was actually built, tools named | [docs/BUILD-LOG.md](docs/BUILD-LOG.md) |
| Honest build time | [docs/TIME-LOG.md](docs/TIME-LOG.md) |
| The grounded chat, in detail | [docs/ASK-THE-SEAM.md](docs/ASK-THE-SEAM.md) |
| Eight-minute demo, timed | [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md) |
| Twelve questions, honest answers | [docs/QA-PREP.md](docs/QA-PREP.md) |
| Ten slides | [docs/slides/](docs/slides/) |

## Run it

```sh
npm install
npm test          # 5 tests over the derive functions
npm run dev       # http://localhost:3000
```

The screen works with no API key — drafting falls back to a deterministic plan
and labels itself "sample draft". Set `ANTHROPIC_API_KEY` for real drafting and
to switch on "Ask the seam".

## The one thing I would never hand to the agent

The accept. Pressing Accept is not a document being finished; it is a promise to
a customer about what we will prove, in how many weeks, under their regulator.
The person who makes that promise has to be the person who will be in the room
when it slips.

Full answer: [docs/THE-DECISION.md](docs/THE-DECISION.md)
