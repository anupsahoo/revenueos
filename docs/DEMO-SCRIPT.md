# Demo script — eight minutes

Repeatable. The exact brief and the exact prompt are named so the recording can
be done twice and look the same.

**Before you start.** Open https://revenueos-blond.vercel.app in one tab and the
repo in another. Reload the app once so the instance is warm. The brief to use is
**Meridian Trust Bank** (`br-01`), the oldest and the only red one. The chat
prompt to use is **"Which briefs are past SLA right now and who was triggered?"**

---

**0:00 — the seam, in one sentence**

> Five functions carry a deal: Marketing, Sales, PreSales, Delivery, Support. It
> stalls at one seam. Sales wins, a brief goes to PreSales, and a Solution
> Architect has two business days to pick it up and start the POC plan. In the US
> that takes 6.8 days. Not headcount: 21% reuse of prior solutions against 58% in
> the UK and 55% in India. The templates exist. Nothing fetches them.

**0:30 — open `/operator`, declare the data**

Point at the badge: *Synthetic data · event store in-memory (resets on cold
start)*. Say it before they ask. Point at the strip: green, amber, red counts and
the reuse rate. Say: "None of this is typed in. It is computed from an event log,
every 30 seconds."

**1:00 — pick the red brief, watch the agent, open two ⓘ**

Click **Meridian Trust Bank**. While the draft runs, click the ⓘ next to **age**:
*business days since the arrival event, weekends skipped*. Then the ⓘ next to a
**match score**: the full scoring formula. Say: "Every number on this screen can
show you the query that produces it. If it cannot, it does not go on the screen."

**2:30 — read the reasons, edit, accept**

Read one match aloud: the template, the score, and the reasons it fits, in the
retrieval engine's own words. Scroll to the plan. Press **Edit**, change one line
of the objective, press **Save edits**. Then press **Accept**.

**3:30 — refresh, and show the learning**

The toast says the library was re-ranked. Refresh the page. The decision is still
there and the brief shows as accepted, because it is an event, not browser state.
Open a second brief that used the same template and point at the score moving.
Say: "Accept and reject change what the system does next."

**4:30 — the trigger log**

Scroll to the bottom strip. Point at the escalation: timestamp, the account,
*escalated to Dana Ortiz, US Solution Architect*, and the **draft attached**
badge. Say: "Nobody typed that. The seam noticed it had passed two business days
and escalated it with the draft."

**5:30 — ask the seam**

In the right panel click **"Which briefs are past SLA right now and who was
triggered?"** Read the answer, then point at two things: the **sources** line
(it names what it read) and the **Also:** line (one adjacent fact it was not
asked for). Say: "It cannot answer from memory. It only has tools over the event
log, the library and the docs. Ask it the weather and it refuses."

**6:30 — the plan, honestly**

Switch to the repo. Milestones page: M0 shipped as 18 closed issues, M1 to M6
planned as 45 more. Show one issue labelled **`cut`** with its reason. Show `#13`
reopened, because only a skeleton exists and closed should mean done. One
sentence on 10x:
*"The in-memory store breaks first. A cold start loses every decision. That is
issue #53 and the interface for it is already written."*

**7:15 — close**

> The one thing I would not hand to the agent is the Accept. It can retrieve,
> explain and draft. Pressing Accept is a promise to a customer about scope and
> weeks, and the person who makes that promise has to be the one who will be in
> the room when it slips.

**8:00 — stop.**

---

## If something breaks on camera

- **Draft says "sample draft"** — the model was slow or rate-limited and it fell
  back. Say so and carry on; the fallback is deliberate so the demo never dies.
- **Counts look different from this script** — ages are computed live, so a brief
  may have moved from amber to red since. That is the point, not a bug.
- **Ask the seam is inert** — the API key is not set on that deployment. Say so.
