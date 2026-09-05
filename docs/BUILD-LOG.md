# Build log — how AI built this

> `[ANUP]` markers: **earlier prompt versions** (D3 in this file), **your own build hours** in the time table, **what failed first for you** on the Friday evening session.
>
> This is the one document that names vendors and models. Everywhere else in the repo the wording stays neutral, on purpose.

## 1. Decomposition

I split the brief into its own six requirements and made each a ticket: R1 event
in, R2 the agent, R3 the person decides, R4 the seam watches itself, R5 one
control surface, R6 the method. Those became issues #1 to #9 and I built them
depth-first, one loop rather than five screens.

R5, the screen, was ticket #2 rather than last. I design the surface first because
the surface is the specification: once I could see the queue, the draft and the
three buttons, the shape of the event model was obvious. The event log (#11) came
later and replaced the browser state the first screen had used.

## 2. Tools and models

| Layer | What |
|---|---|
| Coding | **Claude Code** (Anthropic CLI), model **Claude Opus 4.8**, then **Claude Opus 5** after a mid-build switch. It wrote most of the code in this repo; I directed it, reviewed the diffs and owned the decisions in `docs/DECISIONS.md`. |
| Agent framework | **@langchain/langgraph** (three-node state machine) and **@langchain/anthropic** (`ChatAnthropic`) in `lib/graph.ts` |
| Chat grounding | **@anthropic-ai/sdk** tool use in `app/api/ask/route.ts` |
| Drafting model | whatever `LLM_MODEL` is set to. The deployment runs **claude-sonnet-5**. No key and it falls back to a deterministic plan. |
| App | **Next.js 15**, TypeScript, deployed on **Vercel** |
| Tests | `node --test` on TypeScript directly (`lib/derive.test.ts`) |

## 3. The instruction I iterated most

The agent system prompt in `lib/graph.ts`:

> You are a senior pre-sales Solution Architect at an enterprise software company that sells to banks and insurers. You turn a won-deal brief into a concrete, editable Proof-of-Concept (POC) plan a colleague could send to the customer with light edits.
>
> Rules:
> - Reuse the supplied solution templates. Say exactly what changes for THIS customer (their systems, their regulator, their region).
> - Be specific and financial-services literate. No filler, no summaries of the brief.
> - Scope must be honest: what the POC will and will not prove.
> - **Only reference template ids from the list you are given.**
> - **Respond with ONLY a JSON object, no prose, no markdown fences.**

The two bold lines were added for concrete failures. `[ANUP: the earlier versions you tried]`

**"Only reference template ids from the list you are given"** — the model invented
plausible template ids that were not in the library. That broke two things: the
"templates used" block rendered ids with no name, and ranking boosts are keyed on
template id, so a decision would have credited a template that does not exist.

**"Respond with ONLY a JSON object"** — the model returned a sentence and then
fenced JSON. `JSON.parse` threw, and the run fell back to the sample plan without
saying why. I added the instruction, plus a fence-stripping regex and
`coercePlan()`, so a bad parse degrades to the sample instead of crashing. That
is also why the screen carries a source badge: you can always see whether you are
reading an AI draft or the fallback.

## 4. What failed first

1. LangGraph refused to compile the graph: *"handoff is already being used as a state attribute (a.k.a. a channel), cannot also be used as a node name."* I had named both the node and the state channel `handoff`. Renamed the node to `assemble`.
2. `await` inside a non-async state updater in the screen. Syntax error, one build.
3. Strict TypeScript rejected the id helper `globalThis.crypto?.randomUUID ? …` as an always-true condition. Replaced with try/catch.
4. A rename with BSD `sed` silently skipped the `QueueRow` field because `\b` is not supported, so the type check failed until I fixed that line by hand.
5. Drafting fell back to the sample plan under slow or rate-limited calls, about 40 seconds, during repeated testing. Not a crash, but it is why the fallback and the badge exist.
6. The in-memory store resets between requests under dev hot-reload. It holds within a warm instance. Found while testing the Phase 2 acceptance, and it is stated on screen.

## 5. What I discarded

- **Client-side decisions and a static `ageDays` field.** The first screen kept decisions in React state and read a seeded age. A refresh forgot everything and no number could name its source. Both are gone: decisions are events, age is computed from the arrival event.
- **An entire multi-screen version.** A portfolio command centre, a sales cockpit, a pre-sales cockpit, onboarding screens, a Recharts chart kit and a generated dataset of 2,025 companies and about 5,000 projects (323 KB). Deleted. The brief is explicit that five screens at thirty percent is worse than one loop at ninety, and those screens implied capability I had not built.
- **`lib/agent.ts`**, superseded by the LangGraph version in `lib/graph.ts`.
- For the record: the commit history was rewritten once, early on, to take vendor names out of the messages. That happened before I set the no-rewrite rule. From that point the history is append-only and nothing has been amended.

## 6. Time

From `docs/TIME-LOG.md`, not rounded in my favour.

| Who | Recorded |
|---|---|
| AI coding assistant (Claude Code) | about 2h45 across the audit and the event-log work, plus this documentation session |
| Anup | `[ANUP: your Friday evening and Saturday morning hours]` |

The totals row in `docs/TIME-LOG.md` is the honest answer to "how long did it
take". I have not estimated anyone else's hours for them.
