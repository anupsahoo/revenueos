# Engineering Challenge — Intellect Design Arena · AI-Native IC Engineering Lead, GTM Engineering
*Condensed from `Engineering_Challenge_Candidate.docx.pdf` (5 pages). Numbers and rules quoted exactly; prose shortened.*

## About
Technical stage, replaces a whiteboard interview. **One working day, eight hours; the time-box is part of the test — they ask how long it took and expect an honest answer.** Five deliverables sent to the recruiter within 24 hours of the end of the build day. Panel reviews within 3 working days; if it clears the bar, a **45-minute demo and Q&A**. Work stays the candidate's property. Clarifying questions go to the recruiter before the build day; they answer clarifying, not design, questions. If ambiguous: make a call, state it in the build log, move on.

## 1. The challenge in three lines
A B2B software company sells to banks and insurers. Its deals stall at one specific handoff. Build a working system that clears that handoff: an event comes in, an AI agent does the work, a person decides, the system learns, and the handoff watches its own health. No dependencies, no accounts, no company knowledge. Synthetic data is expected.

## 2. Scenario
Five functions in sequence: Marketing → Sales → PreSales (demo + POC) → Delivery → Support. Four regions: UK, US, Middle East, India. The company is rebuilding this as **RevenueOS** on four rules: every handoff is an event (timestamp + owner, nothing off-system); health is computed, not reported (actual vs SLA continuously → green/amber/red on its own); agents do the volume work, people decide; the tool stack is the source of truth (nobody types numbers into a spreadsheet).

## 3. The bottleneck
Sales wins → brief goes to PreSales → a solutions engineer must pick it up and start the POC plan. **SLA for pickup: two business days. US actual: 6.8 days.**

| Metric | US | Company average |
|---|---|---|
| Open opportunities per solutions engineer | 9.4 | 6.2 |
| POC turnaround | 31 days | 19 days |
| Briefs in backlog | 14 | 4 |
| Handoff documents complete at signing | 82% | 94% |
| Reuse of prior solutions | 21% | UK 58%, India 55% |

Root cause is not headcount: US PreSales builds every POC from scratch because solution templates that already exist in UK and India are not retrievable at the moment a brief arrives. Nothing fetches them.

## 4. Vocabulary
Seam · OS event · Brief · Solution template · Template library · Trigger (automatic escalation to a named person when a seam breaches its SLA, with context attached).

## 5. What to build — the Brief-to-POC-Plan loop
- **R1 Event in.** Won opportunity arrives as an OS event carrying the brief; CRM/call-intel-shaped (timestamp, owner, account, brief). ≥ 3 synthetic briefs, varied enough to exercise retrieval.
- **R2 An agent does the work.** Reads the brief, retrieves candidate templates from a library you build, **explains why each matches**, drafts a POC plan **plus** a skeleton of the handoff document Delivery needs. Library ≥ 8 templates across ≥ 2 regions, realistic FS use cases (KYC document review, loan underwriting assistance, claims triage, regulatory reporting, customer service copilots, fraud alert triage). **Output must be something a solutions engineer could edit and send. A summary of the brief is not an output.**
- **R3 A person decides.** A named role (the US Solution Architect) accepts, edits or rejects on screen. That decision is itself an OS event and feeds back: reuse rate moves, template ranking learns.
- **R4 The seam watches itself.** Brief age vs two-day SLA computed continuously → green/amber/red; on breach a trigger fires to a named owner with the draft attached. **Nothing is entered by hand. Everything is computed from the events.**
- **R5 One control surface.** One screen: queue of briefs, health of the seam, current draft, trigger log, actions. If a person cannot act from it, it is a dashboard, and dashboards do not score.
- **R6 Built with AI.** Use AI to build it and show the method: decomposition, tools and models, what you asked, what they got wrong, what you threw away.

**Stretch (optional, no penalty):** root-cause category per delay; second seam (prospect silent after demo → Sales flags Marketing within 2 days); variance by region; evaluation harness; a real integration.

## 6. Suggested data shapes (guidance)
Brief: account, region, segment (retail bank / insurer / capital markets / lender), regulator (OCC, FCA, RBI…), problem in 2–3 sentences, systems, timeline, what a successful POC proves. Solution template: id, name, region of origin, segment, regulator context, problem solved, capabilities, integrations, effort in weeks, outcome, date last used, owner. POC plan: objective, success criteria, scope in/out, templates drawn on and what changes, integrations, week-by-week plan, risks, people.

## 7. Integration reference (none required)
CRM: HubSpot (free tier, webhooks on deal-stage change — easiest real one), Attio, Salesforce Dev Edition, Pipedrive. Call intel: Gong (mock payload), Fireflies/Otter. Enrichment: Apollo, Clay, Clearbit. Intent: 6sense, Bombora, Warmly, RB2B. Forecast: Clari. Triggers: Slack/Teams webhooks, Resend/SendGrid/Postmark. Knowledge: Notion, Drive, Confluence, any DB. Plumbing: n8n, Zapier, Make, Temporal. Agents: LangGraph, OpenAI Agents SDK, Anthropic Agent SDK, CrewAI, Pydantic AI, Vercel AI SDK. Retrieval: pgvector, Chroma, Qdrant, Weaviate, Neo4j.

## 8. Rules
Any stack; justify in one paragraph. Synthetic data fine — declare it. Hosted or local. Time-box: honour the eight hours; a well-cut eight-hour build beats an unfinished sixteen-hour one, and you will be asked how long it took. Invent plausible product capabilities where needed and say so.

## 9. Deliverables (five)
1. The running system — live, or a recording ≤ 8 minutes.
2. The repository, commit history intact.
3. Build log, one page: how AI built this — decomposition, tools, the prompt/instruction iterated most, what failed first, what you discarded.
4. Cut list, half a page: what you left out, why, and what breaks first at 10× the volume.
5. One paragraph: the decision in this loop you would never hand to an agent, and why.

## 10. Demo and Q&A
45 minutes. They run the system, feed it a brief it has not seen, break something, ask what happens next. Repository open.

## 11. Assessment
| Criterion | Weight | What scores |
|---|---|---|
| Built with AI at speed | 35% | AI wrote most of the code, you directed it, method visible in commits and build log |
| Agent does the work | 30% | Draft usable as written; accept/edit/reject change future behaviour |
| Reasons over knowledge | 20% | Library structured, retrieval explainable, reuse measured |
| Seam watches itself | 15% | Health computed from events, trigger fires to a named person with context |

Cross-cutting: used the roles, SLAs and numbers given rather than inventing new ones; honest, specific cuts; declared synthetic data without being asked.

## 12. What does not score
A dashboard with numbers typed into it. An agent that summarises, classifies or "surfaces insights". Breadth — five screens at 30% is worse than one loop at 90%. A build that could have been done the same way in 2023.
