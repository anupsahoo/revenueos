# TIME-LOG

An honest record of build time. Every session appends one row before its final commit. Anup fills his own rows for his own build sessions. The total at the bottom is the real answer to "how long did it take".

The actor is kept vendor-neutral here by standing decision. The specific tools and models used are named in `docs/BUILD-LOG.md` (R6 requires it there).

| Date | Time (IST) | Actor | Phase | Duration | Notes |
|---|---|---|---|---|---|
| 2026-09-05 | approx., single session | AI coding assistant | Phase 0: read-only audit → docs/PROBLEM.md + docs/STATUS.md | ~0h45 (approx.) | read-only, no code changed; verified the 5 prior findings with file:line; times approximate, not clock-tracked |
| 2026-09-05 | approx., single session | AI coding assistant | Phase 2: event log, derive functions + tests, decisions and SLA transitions as events, operator screen reads from the log | ~2h00 (approx.) | 2 build fixes: a rename that missed the QueueRow field, and a type error on the id helper. Found the in-memory store resets between requests under dev hot-reload; it holds within a warm instance, which is the documented limitation. Times approximate, not clock-tracked. |
| 2026-09-05 | approx., single session | AI coding assistant | Phases 1, 3, 4, 5a, 5b: issue truth pass, grounded chat with tools, decisions/roadmap/operating model, build log, cut list | ~2h30 (approx.) | Ask-the-seam tool loop worked first try; added Next file tracing so the docs travel with the function. Times approximate, not clock-tracked. |
| 2026-09-06 | approx., single session | AI coding assistant | Phases 6 and 7: demo script, ten-slide deck, common questions, overview page, v0.2.0 release | ~1h15 (approx.) | Keynote and PowerPoint both hung on first-run dialogs, so the PDF is rendered headlessly from an HTML mirror of the deck instead. Corrected a stale issue count (48 → 46 open) found while writing the overview page. Times approximate, not clock-tracked. |
| 2026-09-06 | approx., single session | AI coding assistant | Documentation pass and repository hygiene: purge of reference material from history, docs/PROBLEM.md, README rebuild, PLAN/PRODUCT/STATUS reconciled, DECISIONS/THE-DECISION/BUILD-LOG completed, v0.2.1 | ~1h30 (approx.) | Found the assignment reference PDFs and a condensed copy tracked in the public repo; purged with git-filter-repo and the release re-cut. GitHub still serves the pre-purge commit by direct SHA until it garbage-collects, which is noted as open. Times approximate, not clock-tracked. |
| 2026-09-06 | approx., single session | AI coding assistant | #13 full handoff document generator: `lib/handoff.ts`, five tests, wired through the graph, the accept event and the screen | ~1h00 (approx.) | Had to make the module pure — a value import from `lib/mock` broke `node --test`, so the template lookup is a parameter now, which is the better design anyway. Verified end to end against a live AI draft: 11 of 12 sections sourced, 1 honest gap. Times approximate, not clock-tracked. |

**Total recorded so far:** about **9h00** of AI-assisted build time (Phase 0 ~0h45, Phase 2 ~2h00, Phases 1/3/4/5 ~2h30, Phases 6/7 ~1h15, documentation and repo hygiene ~1h30, #13 handoff generator ~1h00).

That total is the answer to "how long did it take", and it is not rounded down.
Every row was written at the end of the session it describes, including the
sessions that went badly.
