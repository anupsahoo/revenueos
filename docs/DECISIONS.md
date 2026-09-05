# Decisions

The calls I made building this, and what each one cost me.

> `[ANUP]` markers in this file, for me to fill in: **D3** (why a state machine over a free-form loop, in my words), **D7** (the human commit point — this one has to be mine), **D8** (why vendor-neutral wording), **D12** (whether I would keep the skills box in a real product).

---

### D1 · The event log is the only source of truth
**Context.** The first version kept decisions in React state. A refresh forgot them, and I could not point at where a number came from.
**Decision.** One append-only log (`lib/events.ts`). Every number on screen is a pure function over it (`lib/derive.ts`).
**Why.** The brief says health is computed, not reported. If I cannot name the query, the number should not be on screen.
**What I gave up.** Speed. Reading a number is now a function call over an array, not a variable.
**Revisit.** When the log passes roughly 100k events per tenant, derive-on-read stops being free and I add a materialised view.

### D2 · Deterministic scoring, not embeddings
**Context.** The library is 15 templates.
**Decision.** Structured scoring in `lib/retrieval.ts`: segment 30, regulator 16 (analogue 8), problem overlap up to 26, shared systems up to 18, recency 5, proven reuse 4, cross-region 3, plus a learned ±8. Threshold 40.
**Why.** Reuse is only worth something if a solutions engineer believes the match. A written reason beats a cosine score they cannot argue with.
**What I gave up.** Recall on wording I did not anticipate. A brief that says "customer due diligence" does not hit "KYC".
**Revisit.** Past roughly 200 templates, or the first time a good match is missed on synonyms. Then embeddings for recall, this scorer for the explanation. Not the other way round.

### D3 · A three-node state machine, not a free-form agent loop
**Context.** The agent has one job: retrieve, draft, assemble.
**Decision.** LangGraph with three nodes and fixed edges (`lib/graph.ts`).
**Why.** The path is known. A loop that decides its own next step buys nothing here and costs predictability. `[ANUP: add your own line on why you distrust open-ended loops for a scored demo]`
**What I gave up.** The agent cannot go and fetch something I did not anticipate.
**Revisit.** When a step legitimately needs to branch, for example a brief with no match that should trigger a clarifying question back to Sales.

### D4 · Drafting has a deterministic fallback
**Context.** The demo must run on a laptop with no API key.
**Decision.** No key or no model set, and the draft comes from `planFor()` in `lib/mock.ts`. The screen says "sample draft" instead of "drafted by AI model".
**Why.** A demo that dies without a secret is not a demo. And the label keeps it honest.
**What I gave up.** The fallback plan is generic. It proves the loop, not the quality of the writing.
**Revisit.** Never remove it. It is also the failure path in production.

### D5 · In-memory store now, Postgres behind one env var
**Context.** Vercel functions have no durable local disk.
**Decision.** `MemoryEventStore` seeded on cold start. `lib/events.postgres.ts` holds the interface, the table shape and the swap note, and adds no dependency. Tracked as #53.
**Why.** I would rather ship the loop and be honest about the limit than spend the day on a database.
**What I gave up.** State survives a refresh only while the instance is warm. The screen says so.
**Revisit.** First real user. It is the first ticket after M0 in practice, whatever its milestone number says.

### D6 · Age is in business days
**Context.** The SLA in the brief is two business days.
**Decision.** `businessDaysBetween()` skips Saturday and Sunday. Age is computed from the arrival event every time it is read.
**Why.** A brief that lands Friday afternoon is not late on Monday morning. Using calendar days would have manufactured breaches.
**What I gave up.** Holidays. A UK bank holiday still counts as a working day here.
**Revisit.** When the second region goes live, because the calendar stops being shared.

### D7 · The human commits, the agent proposes
**Context.** The agent can write a plan that reads as finished.
**Decision.** Accept stays with the US Solution Architect. The agent never sends.
**Why.** A POC plan is a promise about scope and feasibility to a customer. `[ANUP: your words here — this is the paragraph they will read closest]`
**What I gave up.** Throughput. A confident draft still waits for a person.
**Revisit.** Possibly never for accept. Auto-send on the lowest-risk, highest-match briefs is the only version I would consider, and only with an eval harness (#51) in place first.

### D8 · Vendor-neutral wording in the product, named in the build log
**Context.** The product surfaces name an AI model in several places.
**Decision.** The UI and the repo docs say "AI model". `docs/BUILD-LOG.md` names the exact tools and models.
**Why.** `[ANUP: your reason]` The build log is where the assessment asks for the method, so that is where the names belong.
**What I gave up.** A reader of the UI cannot tell which model wrote a draft. The response carries it if they ask.
**Revisit.** If model choice becomes a customer-facing feature.

### D9 · One screen, not five
**Context.** I had built a portfolio screen, two cockpits and an onboarding screen.
**Decision.** Deleted them. The operator loop is the only screen and the front door.
**Why.** The brief is explicit: five screens at thirty percent is worse than one loop at ninety. The other screens described capability I had not built.
**What I gave up.** The cockpits looked impressive in a screenshot.
**Revisit.** M4 (#44, #45, #46), once there is real multi-tenant data behind them.

### D10 · The chat box may only use tools
**Context.** A chat box that answers from model memory would undo the honesty of everything else.
**Decision.** `/api/ask` exposes six read-only tools and no free recall. Every answer cites sources and refuses when the tools do not hold the answer.
**Why.** In the Q&A the panel will try to catch the system inventing something. I would rather they try and fail.
**What I gave up.** It cannot answer general questions, and it needs a key.
**Revisit.** If I add tools, each one needs the same "cite what you read" discipline.

### D11 · Synthetic data is labelled where it is shown
**Context.** Every name and number here is invented.
**Decision.** Seed events carry `synthetic: true`, and the strip carries a badge that also states the store is in memory.
**Why.** The brief scores declaring synthetic data without being asked. It also pre-empts the first question in the demo.
**What I gave up.** A little screen space.
**Revisit.** When real events arrive, the flag becomes the thing that separates seeded from live.

### D12 · Skills needed against bench strength
**Context.** Not in the brief. I added it because a PreSales lead needs to know if a won deal is off their strengths.
**Decision.** Each brief lists the skills it needs against a bench inventory, with a prepare plan on a gap.
**Why.** Reuse answers "have we built this". Skills answers "can we staff it". Both decide whether a POC date is real. `[ANUP: whether you would keep this in a real product, or whether it belongs in a resourcing tool]`
**What I gave up.** Scope. It is the one thing on the screen the brief did not ask for.
**Revisit.** If it distracts from the loop in the demo, it moves behind a tab.
