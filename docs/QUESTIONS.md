# Questions people ask

Twelve questions I expect about this system, the honest answer to each, and
where in the code it lives. The "break something" ones are first, because those
are the ones that come first.

### 1. I press Accept and refresh. What happens?
The decision is still there. It is a `draft.accepted` event in the log, not
browser state, and the queue row is recomputed from the log on load.
→ `app/api/decisions/route.ts`, `queue()` in `lib/derive.ts`

### 2. And if the server restarts?
You lose it. The store is in memory, so a cold start reseeds and every decision
and the reuse rate go back to zero. That is on the screen in the badge, and the
Postgres swap is written as an interface, not built.
→ `lib/events.ts`, `lib/events.postgres.ts`, issue #53

### 3. Give it a brief it has never seen.
Post one to `/api/draft` with a new id and it runs: retrieval scores it against
the 15 templates, and the agent drafts from whatever clears 40. If nothing
clears, you get a dashed "no template cleared the 40 threshold" box and the
sample plan, labelled as such.
→ `lib/retrieval.ts`, `draftNode()` in `lib/graph.ts`

### 4. What if no template matches?
The plan still comes back, from the deterministic fallback, and the source badge
says "sample draft" rather than "drafted by AI model". Nothing pretends a match
existed.
→ `planFor()` in `lib/mock.ts`, the `nomatch` branch in `app/page.tsx`

### 5. Two people decide on the same brief at once.
Both writes land; the log is append-only and takes both. The queue then shows the
latest decision, so the second one wins. There is no locking and no conflict
detection. I would add an expected-version check on append before this is real.
→ `MemoryEventStore.append()` in `lib/events.ts`, `queue()` in `lib/derive.ts`

### 6. A template has a stale `lastUsed`. What happens to the score?
It quietly loses the recency component, 5 points out of a possible 100, and the
"Recently used" reason disappears from the explanation. It does not fall out of
the results; it just ranks lower. Nothing warns you the library is going stale,
which I would add.
→ `scoreTemplate()` in `lib/retrieval.ts`

### 7. Where does the 2.2 days come from? Prove it.
Click the ⓘ. It is business days between the `brief.arrived` event and now,
weekends skipped, computed on read. Nothing stores an age.
→ `briefAgeDays()` and `businessDaysBetween()` in `lib/derive.ts`, tested in `lib/derive.test.ts`

### 8. The chat box: is it just making that up?
No. It has six read-only tools and no free recall, it cites the sources it read,
and it refuses when the tools do not hold the answer. Ask it the weather.
→ `app/api/ask/route.ts`, `docs/ASK-THE-SEAM.md`

### 9. Does accept or reject actually change anything?
Yes. Boosts are derived from the decision events, plus 8 on accept and minus 8 on
reject for the templates that draft used, and the draft route reads them from the
log and ignores anything the client sends.
→ `boosts()` in `lib/derive.ts`, `app/api/draft/route.ts`

### 10. Why not embeddings?
Fifteen templates. A written reason a Solution Architect can argue with is worth
more than a similarity score they cannot. Past roughly 200 templates, or the
first missed synonym, I put embeddings in front for recall and keep this scorer
for the explanation.
→ `docs/DECISIONS.md` D2

### 11. What breaks first at ten times the volume?
The in-memory store, then the 60-second drafting route with no worker behind it.
After that, the fixed threshold of 40 on a much larger library.
→ `docs/CUT-LIST.md`, issues #53, #54

### 12. How much of this did AI write, and how long did it take?
Most of the code, directed by me, with the method in the build log and visible in
the commits. Recorded time is in the time log and is not rounded down.
→ `docs/BUILD-LOG.md`, `docs/TIME-LOG.md`
