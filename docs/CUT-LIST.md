# Cut list

What I left out, why, and what breaks first at ten times the volume.

| Cut | Why | What breaks first at 10x |
|---|---|---|
| **Durable event store** (#53, dup #10, #12) | The loop was worth more than a database in the time I had. The interface, the table shape and the one-env-var swap are written in `lib/events.postgres.ts`. | **This breaks first.** The store is in memory, so a cold start loses every decision and the reuse rate resets to zero. At 10x it also stops fitting comfortably in one instance's heap. |
| **Background workers for agent calls** (#54) | Drafting runs inside the request. Fine for one architect clicking. | The route has a 60-second ceiling. Under concurrent drafting, requests queue behind each other and start timing out. Needs a queue and a worker. |
| **Per-tenant isolation** (#30, #33) | Single tenant on purpose for M0. | Nothing separates one company's events from another's. At 10x this is not a performance problem, it is a data-leak problem, which is why #33 is the one ticket I would never cut. |
| **Retrieval threshold fixed at 40, three results** | Deterministic and explainable beats tunable for a 15-template library. | At roughly 800 templates the fixed threshold either floods (dozens clear 40) or starves (a good synonym match never reaches it). Scoring stays for the explanation; recall needs embeddings in front of it. |
| **Agent evaluation harness** (#51, dup #14) | No time, and I would rather ship the loop than a scoreboard for it. | Drafting quality is unmeasured. At 10x I cannot tell whether a prompt change made 500 drafts better or worse, so I would be tuning blind. |
| **Push instead of polling** | The screen polls `/api/seam/health` every 30 seconds. Simple and visible in a demo. | At 10x it is a poll per open tab per 30 seconds against a route that recomputes the whole log each time. Needs either push or a cached projection. |
| **Second seam** (#15, labelled `cut`) | One loop deep beats two shallow. The brief says so. | Nothing. The Sales to PreSales seam is still the bottleneck at any volume; a second seam adds surface area, not throughput. |
| **Root-cause tags on delays** (#16, labelled `cut`) | Useful analytics, but they do not clear a single brief faster. | Nothing immediately. At 10x they would start to matter for staffing decisions, not for the loop. |
| **Real CRM ingest** (#57, dup #17) | Synthetic arrival events prove the shape. | Real webhooks bring retries, replays and duplicates. The log has no idempotency key on ingest yet, so the same won deal could arrive twice. |
| **Tracing** (#52, dup #18) | Not needed to run one loop. | With many agent runs a day, a bad draft has no trail to explain it. |
| ~~**Full handoff generator** (#13)~~ **built** | Was a skeleton, so I reopened it rather than leave it closed. Then I built it: `lib/handoff.ts` generates the document from the accepted plan and reports the sections it cannot source instead of inventing them. | No longer a cut. The remaining gap is the access owner per system, which fills itself when the CRM connector lands (#57). |

Everything above is either an open issue with a milestone, or labelled `cut`
with a one-line reason on the issue itself. Nothing is closed unless code exists
behind it.
