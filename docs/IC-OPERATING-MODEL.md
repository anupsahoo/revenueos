# How this gets built

One engineer, several AI agents, and a set of rules that keep the output honest.
This is how the work actually ran, not how I would describe it on a slide.

## The decomposition rule

One ticket is one agent session is one series of commits. A ticket that cannot
be stated as a single change to the system gets split before anyone starts. The
event log work was four commits, not one, because it was four ideas: the log, the
derived views, the routes, then the screen reading from them.

I keep sessions short and single-purpose because an agent with one job produces a
diff I can actually review. An agent with four jobs produces a diff I skim, and
skimming is where bad code enters.

## What I do

- Write the ticket and the acceptance test before the session starts. "grep
  returns nothing", "npm test passes", "accept then refresh and it is still
  there". Acceptance in a form a machine can check.
- Own the decisions in `docs/DECISIONS.md`. The agent can implement a state
  machine. It should not be the one deciding the human keeps the accept.
- Review the diff, not the description. I read what changed.
- Stop the session when the answer is "I would need to store this to show it".
  Then the number comes off the screen instead.

## What the agents do

- Implement the ticket, write the tests, write the ⓘ derivation text, and append
  the `docs/TIME-LOG.md` row with retries recorded.
- Say what failed. The time log has two build fixes in the event-log session
  because there were two, not because it reads well.

## How quality is held

Four rules do most of the work:

1. **Derive or delete.** If a number on screen has no function in
   `lib/derive.ts`, it comes off the screen. This killed a "people" tile that
   was a sum over invented data.
2. **Tests on the arithmetic.** `lib/derive.test.ts` covers a weekend, the amber
   and red thresholds, reuse with no decisions, and boosts after one accept and
   one reject. Small, and enough to catch the mistakes I actually make.
3. **Synthetic is labelled.** Seed events carry the flag and the screen says so.
4. **History is evidence.** Commits are never rewritten. If something was wrong,
   there is a commit fixing it and a line in the log saying so.

## How progress is projected

Issues closed per sprint against the twelve-week plan in `docs/ROADMAP.md`, read
off the milestones page. A ticket is closed only when code exists behind it. When
something is dropped it gets the `cut` label and one line saying why, so the
board stays a true picture rather than a tidy one. That is why #13 is open again:
only a skeleton existed, and closed would have been a lie. It is closed now, because the generator is built.
