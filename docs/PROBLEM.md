# The problem this is built against

The scenario is fictional and the data is synthetic. The numbers below are the
ones the design was held to, so they are quoted rather than invented as I went.

## The company

A B2B software company sells to banks and insurers. Five functions carry a deal
in sequence:

**Marketing → Sales → PreSales (demo + POC) → Delivery → Support**

It operates in four regions: UK, US, Middle East, India. It is rebuilding the
way these functions hand work to each other, on four rules:

1. **Every handoff is an event** — timestamp and owner, nothing off-system.
2. **Health is computed, not reported** — actual against SLA, continuously, going
   green / amber / red on its own.
3. **Agents do the volume work; people decide.**
4. **The tool stack is the source of truth** — nobody types numbers into a
   spreadsheet.

## The bottleneck

Sales wins a deal → a brief goes to PreSales → a solutions engineer has to pick
it up and start the POC plan.

**SLA for pickup: two business days. US actual: 6.8 days.**

| Metric | US | Company average |
|---|---|---|
| Open opportunities per solutions engineer | 9.4 | 6.2 |
| POC turnaround | 31 days | 19 days |
| Briefs in backlog | 14 | 4 |
| Handoff documents complete at signing | 82% | 94% |
| Reuse of prior solutions | 21% | UK 58%, India 55% |

The root cause is not headcount. US PreSales builds every POC from scratch
because the solution templates that already exist in the UK and India are not
retrievable at the moment a brief arrives. Nothing fetches them.

## Vocabulary

| Term | Meaning |
|---|---|
| **Seam** | The join between two functions where work is handed over. |
| **OS event** | An immutable record of something that happened at a seam. |
| **Brief** | What Sales hands PreSales when a deal is won. |
| **Solution template** | A prior POC or solution, structured so it can be found again. |
| **Template library** | The set of those templates, across regions. |
| **Trigger** | An automatic escalation to a named person when a seam breaches its SLA, with the context attached. |

## What the loop has to do

**R1 · Event in.** A won opportunity arrives as an OS event carrying the brief,
shaped like a CRM or call-intelligence payload — timestamp, owner, account,
brief. Enough varied briefs to exercise retrieval properly.

**R2 · An agent does the work.** It reads the brief, retrieves candidate
templates from the library, **explains why each one matches**, and drafts a POC
plan **plus** a skeleton of the handoff document Delivery needs. The library
spans at least two regions and realistic financial-services use cases: KYC
document review, loan underwriting assistance, claims triage, regulatory
reporting, customer service copilots, fraud alert triage. The output has to be
something a solutions engineer could edit and send. A summary of the brief is
not an output.

**R3 · A person decides.** A named role — the US Solution Architect — accepts,
edits or rejects on screen. That decision is itself an OS event, and it feeds
back: the reuse rate moves and template ranking learns.

**R4 · The seam watches itself.** Brief age against the two-day SLA, computed
continuously into green / amber / red. On breach, a trigger fires to a named
owner with the draft attached. Nothing is entered by hand; everything is
computed from the events.

**R5 · One control surface.** One screen: the queue of briefs, the health of the
seam, the current draft, the trigger log, and the actions. If a person cannot
act from it, it is a dashboard — and a dashboard does not solve this.

**R6 · Built with AI, visibly.** Use AI to build it and show the method:
decomposition, tools and models, what was asked, what came back wrong, what was
thrown away.

## Data shapes

**Brief** — account, region, segment (retail bank / insurer / capital markets /
lender), regulator (OCC, FCA, RBI…), the problem in two or three sentences,
systems in use, timeline, and what a successful POC proves.

**Solution template** — id, name, region of origin, segment, regulator context,
problem solved, capabilities, integrations, effort in weeks, outcome, date last
used, owner.

**POC plan** — objective, success criteria, scope in and out, the templates drawn
on and what changes, integrations, a week-by-week plan, risks, and the people
needed.

## Explicitly out of scope

Optional extensions I considered and did not build: a root-cause category per
delay, a second seam (prospect goes silent after a demo → Sales flags Marketing
within two days), variance by region, an evaluation harness, and a real
integration. Each is in [CUT-LIST.md](CUT-LIST.md) with the reason.

## What would not count as solving this

- A dashboard with numbers typed into it.
- An agent that summarises, classifies or "surfaces insights".
- Breadth. Five screens each a third finished is worse than one loop that works.
- A build that could have been done the same way in 2023.

That last line is why this repo has one screen, and why every number on it can
show the query behind it.
