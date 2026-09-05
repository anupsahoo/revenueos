# The decision I would never hand to an agent

**The accept.**

The agent can read the brief, find the three closest things we have built before,
explain why each one fits, and write a POC plan good enough to send. I let it do
all of that. It is faster than me and it does not get bored on the fifteenth
brief.

What it does not do is press Accept.

Pressing Accept is not a document being finished. It is a promise to a customer
about what we will prove, in how many weeks, with which of their systems, under
their regulator. The person who makes that promise has to be the person who will
be in the room when it slips.

There is also a category of thing the agent cannot see. The event log knows this
template was reused eleven times and that this brief is two days old. It does not
know that this bank's security review always runs three weeks longer than they
say, that this account is one bad POC away from leaving, or that we do not really
have the Guidewire people yet — we have one, and she is on holiday in March.
Those are the facts that decide whether a date is real.

So the agent optimises for the best match against what we have already built. A
Solution Architect decides what we are willing to be held to. Those are different
jobs, and the second one carries a name.

That is why the loop is deliberately asymmetric. Everything up to the commitment
is automated. The commitment itself stays with a named human, and it is recorded
as an event with their name on it — so six weeks later, when someone asks why we
promised eight weeks for a claims triage POC, there is an answer, and it belongs
to a person rather than to a model version.

---

**Where this lives in the code.** `app/api/decisions/route.ts` only ever writes
`draft.accepted`, `draft.edited` or `draft.rejected`, each with an actor. No code
path lets the agent produce one. The escalation in
`app/api/seam/health/route.ts` does the opposite of deciding: when a brief passes
its SLA it puts the draft in front of a named person faster, instead of sending
it for them.
