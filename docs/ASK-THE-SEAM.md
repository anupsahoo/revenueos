# Ask the seam

A chat box on the operator screen that answers questions about **this running
instance**. It is there because someone will always ask "why did it pick that
template?", "what happens if I refresh?", "what breaks at 10x?" — and I would
rather demonstrate the answer than assert it.

## What it is grounded on

The model gets no free recall about the system. It can only call these tools:

| Tool | Reads |
|---|---|
| `get_events` | the append-only event log (`lib/events.ts`), optionally filtered |
| `get_health` | health, queue, trigger log, reuse rate and ranking boosts, all from `lib/derive.ts` |
| `get_brief` | one brief |
| `get_template` | one template, or the library |
| `explain_match` | re-runs `scoreTemplate()` in `lib/retrieval.ts` and returns the real reasons |
| `read_doc` | one of README.md, PLAN.md, PRODUCT.md, docs/DECISIONS.md, docs/CUT-LIST.md, docs/BUILD-LOG.md, docs/ROADMAP.md |

Nothing else on disk is readable. Every answer shows the sources it used.

## What it refuses

If the tools do not contain the answer, it says so in one sentence and names
what would be needed. It never invents an event, a number or a template id.
Without an API key the panel is inert and says so; it does not fall back to a
made-up answer.

Chat is not written to the event log. The OS event log stays a record of the
seam, not of conversations.

## The "plus one" rule

Answer what was asked in four sentences or fewer, then one line starting
"Also:" with an adjacent fact from the same tool results that the person did not
ask for but would want. Two examples captured from a real run:

**Q: Which briefs are past SLA right now and who was triggered?**
> Only br-01 (Meridian Trust Bank, "KYC document review backlog") is past SLA,
> currently red at ~2.17 days age against a 2-day SLA. The trigger log shows Dana
> Ortiz (US Solution Architect) was triggered for it, with a draft already attached.
>
> Also: four other briefs (br-03, br-02, br-05, br-04) are amber and approaching
> SLA, so they may need attention soon too.

*sources: lib/derive.ts*

**Q: What is the weather in Mumbai today?**
> This system doesn't have access to weather data — it's a tool for querying a
> RevenueOS instance (briefs, templates, event logs, health metrics, and project
> docs). I can't answer this question with the available tools.
>
> Also: I can tell you about brief-to-template matching, seam health, or project
> documentation if that's useful instead.

*sources: no tools needed*
