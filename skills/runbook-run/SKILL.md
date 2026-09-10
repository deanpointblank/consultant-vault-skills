---
name: runbook-run
description: Carry out a runbook from the vault step by step, with a confirmation before each step that changes something outside the machine. Use whenever the user says "run the X runbook", "do the X workflow for KEY", or asks for an outcome a runbook's title or topics cover, such as "set up a PFD env for PFD-66519". A runbook nobody runs is a note; one the agent runs is the workflow.
---

# Runbook run

Follow the obsidian-vault skill's conventions. Find the runbook in `folders.runbooks` (missing key: `Runbooks`) by title, then by `topics`. No match: one line saying so, and offer runbook-capture if the user is about to do it by hand. Two matches: list both, ask which.

## Before step 1

1. `status: retired`: refuse in one line, quoting the reason if the note gives one.
2. Fill the Inputs table from what the user said. Everything still missing goes in one question. No defaults are guessed.
3. A repo in `repos` whose dossier names no local clone: stop and say which.
4. Show the "Before you start" lines and wait for a yes. VPN and credentials are the user's to confirm, not the skill's to check.

## Running

Steps in order, one at a time. Substitute inputs before showing or running anything.

- Plain step: run it, compare the output to `Expect:`, move on.
- `(changes: <what>)`: show the exact command with inputs filled in, get a yes, then run. "Just run it all" at the start is not a yes for this step; ask anyway.
- `(you)`: show the exact action, wait for "done".
- Output does not match `Expect:`: stop. Show the command, the `Expect:` line, and the actual output. One question: fix and continue, or stop here. A fix that works rewrites the step to what worked and keeps one line under it: `until YYYY-MM-DD: <old step>`. The same step failing twice in one run: stop for good.

Never run two runbooks at once. Never edit a step that worked.

## After the last step

Run "Check it worked". Set `last_run` to today; set `status: verified` on the first clean run. Update the runbook's row in `<folders.runbooks>/Runbooks.md` to `<status>, last run YYYY-MM-DD`. Daily note: `- HH:MM ran [[Runbook - X]] for <input>: ok, step 2 rewritten` or `: stopped at step 2`. Reply in three lines: what now exists, what was rewritten, the daily-note line.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Running the changing step because the user said "just run it all" | One yes per `(changes:)` step; a target that moved since the runbook was written is what the yes catches |
| Running the steps by hand because nothing is enforcing the marks | The mark in the step is the gate, not a setting somewhere; by hand or not, the yes comes first |
| Running a `(changes:)` step unconfirmed because there is nobody to ask | Nobody to ask means the run stops there and says where it stopped; unconfirmed is not the fallback |
| Resolving a missing input yourself — from a similar earlier run, or by reading "Where to find it" (this session's scratch folder, today's clone, the usual host) as an answer | That column tells the user where to look; it is not the agent's licence to assume. Quietly resolved is still guessed, and the wrong warehouse id builds the wrong environment — ask, before step 1 |
| Pressing on after a mismatch "since it probably worked" | A later step builds on the failed one; stop and show |
| Fixing the failed step yourself because the fix is cosmetic, or plainly what the step meant | The fix is usually right; what the stop buys is the user choosing whether this run carries on |
| Carrying on because the failed command left nothing behind | A clean failure is still a step that did not work, and the summary at the end is not the stop |
| Rewriting the step without the `until` line | The next reader cannot tell why the step changed or when |
| Skipping "Check it worked" because every step passed | Steps passing is not the outcome existing |
| Leaving `status: draft` after a clean run | The index says draft; the next person re-verifies by hand |
| Picking your own status word because the schema has no runbook type | `verified` and `last_run` are the words here; `tested`, or a status with no date, and nobody can tell which runbooks still work |
| Writing the index row in your own words | "verified 2026-09-10" reads fine and matches nothing; the row is `<status>, last run YYYY-MM-DD` |
