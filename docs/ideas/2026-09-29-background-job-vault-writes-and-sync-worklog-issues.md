---
date: 2026-09-29
status: idea
type: note
tags: [skill-idea, background-jobs, obsidian-vault, granola-sync, daily-worklog, work-chart, hooks]
---

# Background jobs cannot write the vault, and other issues from one run

On 2026-09-29 a Claude Code background job ran granola-sync, then daily-worklog, for one client
vault. The work-chart hooks were active the whole time. The job finished, but only because of a
hand-built workaround: the harness refused every direct write into the vault, and a worktree
cannot fix that. This note lists sixteen issues from that run, in four groups: vault writes (A),
the work-chart Stop hook (B), daily-worklog evidence and config (C) and granola-sync (D). Each has
what happened, why it matters and a proposed change with the file it would touch. Nothing is
changed yet.

**Next action:** decide A3 first. Either build stage-and-apply into the vault skills, or document
the repo-level guard opt-out as a user decision. Until one of them exists, every background job
that writes to the vault has to be rescued by hand. B1 and B2 also change shape depending on the
answer.

## A. Background jobs cannot write the vault

### A1. The harness refuses direct writes into the vault

**What happened.** In a background job, Edit and Write into the vault were refused by the
harness's worktree-isolation guard: "This background session hasn't isolated its changes yet. Call
EnterWorktree first…". The vault is an untracked folder inside a git repo. Every vault-writing
skill hit the refusal: granola-sync (meeting, decision and question notes, person aliases, Sync
State, the daily note), daily-worklog step 7 (the ledger and the daily-note line) and work-chart
(the work-note rows).

**Why it matters.** `obsidian-vault` section 3 says "automations must work headless". A background
job is the most headless run there is, and its output is the whole point of the job. Right now the
convention is broken for exactly that case.

**Proposed change.** Add a "Background jobs" section to `skills/obsidian-vault/SKILL.md`, next to
section 3. It says the guard exists, says how to tell (`CLAUDE_JOB_DIR` is set), and points at
whichever way out A3 picks.

### A2. A worktree does not help

**What happened.** The refusal message tells the agent to call EnterWorktree. That is a trap here.
The vault folder is untracked, so a worktree built from committed state does not contain it. A
note written inside the worktree never reaches the folder Obsidian watches.

**Why it matters.** Entering a worktree would satisfy the guard and let the writes succeed. The
notes would then sit in a copy nobody reads. That is worse than a refusal, because it looks like
success.

**Proposed change.** State it in the new `skills/obsidian-vault/SKILL.md` section from A1: do not
call EnterWorktree to get around the guard for a vault write, because the vault is not in the
worktree.

### A3. The workaround worked but is hand-made, and the way out is a decision

**What happened.** The run staged every output under `$CLAUDE_JOB_DIR/tmp/<stage>/`, at
vault-relative paths. It took sha256 checksums of the existing notes it would replace. Then a
script did the apply:

- It pre-checks first. It refuses if a listed note has changed since the checksum, or if an
  unlisted note would be overwritten.
- It copies new notes with `cp -n`, so nothing existing is overwritten by accident.
- It replaces only the notes on the list.
- It appends the daily-note lines and the Sync State run line idempotently.
- It is safe to run twice.

The user then ran it, or said "go ahead". The detour cost one extra agent and about five minutes.
The worklog's ledger needed a second staging round.

**Why it matters.** The script was written fresh for this run. Nothing shared exists, so the next
background run has to write it again, and each rewrite is a chance for a mistake like A4. This
issue blocks every other background vault run, so it comes first.

**Proposed change.** Two options. They can coexist, but one has to be chosen as the default.

- **(a) Stage-and-apply built into the vault skills.** When `CLAUDE_JOB_DIR` is set, the default
  write path is the stage folder, not the vault. The plugin ships one shared apply script with the
  checks above. It would touch `skills/obsidian-vault/SKILL.md` (the write path in section 3, plus
  the Background jobs section), a new script under `skills/obsidian-vault/scripts/`, and a
  one-line pointer in the write steps of `skills/granola-sync/SKILL.md` (step 9), `skills/daily-worklog/SKILL.md`
  (step 7) and `skills/work-chart/SKILL.md`. Cost: a script to maintain and one extra yes per run.
  Benefit: works in every vault repo and leaves the guard on.
- **(b) Document the repo-level opt-out.** Put `"worktree": {"bgIsolation": "none"}` in the vault
  repo's `.claude/settings.json`. It would touch `skills/vault-init/SKILL.md` (a step in section 2,
  the interview, that explains the trade-off and asks) and the Background jobs section from A1.
  Cost: it turns the guard off for every background job in that repo, not just vault writes.
  Benefit: one line, no extra yes.

**Rule for either option.** Setting the opt-out is the user's decision. An agent never sets it
itself, not even when asked to "fix the permission problem".

### A4. A shell append slipped through beside a refused edit

**What happened.** One shell append (`>>`) ran in the same parallel batch as a guarded Edit. The
Edit was refused. The append was not. One line landed in a person note that was not part of the
staged set. The guard covers Edit and Write. It does not cover shell writes.

**Why it matters.** The apply script only knows the notes on its list. A write made by another
route is invisible to its checks. Using a shell write to get around a refused edit defeats the
guard and the safety of the staged flow together.

**Proposed change.** Add two rules to the Background jobs section of `skills/obsidian-vault/SKILL.md`:
never put a vault write in the same parallel batch as a guarded edit, and never use a shell write to
get around a refused edit.

### A5. daily-worklog has no branch for "vault not writable"

**What happened.** The "When something is missing" section of `skills/daily-worklog/SKILL.md`
covers no Atlassian, a partial post, rejected rows, no config and missing clones. It has nothing for
a vault that exists but cannot be written to. The nearest branch, "No vault or no config", says to
point at vault-init and stop, and "nothing posts without a ledger".

**Why it matters.** Read literally, that branch leaves the day unlogged. Worse, the ledger is the
only thing that stops a repeated run from posting the same day twice, because Jira cannot delete a
worklog. A ledger that is staged but not yet applied gives a second run nothing to read.

**Proposed change.** Add a branch to "When something is missing": post the worklogs after the yes,
stage the ledger rows and the daily-note line, and say in the reply which step still has to land.
Step 7 is never skipped. If a second run for the same day starts before the stage has landed, it
checks the stage folder for a pending ledger first.

## B. work-chart Stop hook in background jobs

### B1. The Stop hook fires at every pause, including while subagents run

**What happened.** The hook fired at every pause. That included pauses while the job was only
waiting on background subagents. It fired three times in one run, reporting 49, 70 and 25 research
calls.

**Why it matters.** Each firing asks for work-chart rows. In the middle of a job, most of that work
has no conclusion yet, so the rows would be written too early or written again.

**Proposed change.** When background agents are still running, the hook should hold until the task
ends. If the hook input cannot say whether agents are running, the skill can carry the rule: say in
`skills/work-chart/SKILL.md` ("When rows get written") that a job with agents still running answers
the hook once, at the end. It would touch `hooks/work-chart-stop.sh` and add a case to
`hooks/tests/test-work-chart-hook.sh`.

### B2. Rows were staged and the stamp was run before they reached the vault

**What happened.** Each firing needed rows written. The vault was unwritable, so the rows were staged
in the job folder. The stamp script was run anyway, so the hook would go quiet. That happened
before the rows reached the vault.

**Why it matters.** The stamp says "these changes are written down". While the rows sat in a
staging folder, that was not yet true. If the apply step had never been run, the record would say
the work was charted when it was not.

**Proposed change.** The hook accepts staged rows, and the stamp waits until the rows have landed.
In `skills/work-chart/SKILL.md`, the "After writing" list gets a rule: with a stage folder in play,
run the stamp only after the apply step. In `hooks/work-chart-stop.sh`, when the job folder holds
staged rows, name them in the message instead of asking for rows again. Both depend on A3.

## C. daily-worklog evidence and config

### C1. The configured GitHub login did not exist on the client's org

**What happened.** Config `worklog.github_login` held a login that does not exist on the client's
GitHub organisation. The account's real login there is different. That is why GitHub's events API
returned 404 on two earlier days, and why `gh search prs --author=<login>` failed. With the real
login, the feed worked.

**Why it matters.** Step 2, source 5, reads PR reviews, comments, pushes and merges by that login.
A wrong login gives an empty feed that looks like a quiet day. The evidence is thinner than it
should be and nobody is told.

**Proposed change.** On each run, check the configured login against the author of a recent PR in
`worklog.repos`, or against `gh api user`, and name any mismatch in the reply. This goes in step 2 of
`skills/daily-worklog/SKILL.md`. `skills/vault-init/SKILL.md` (section 2) asks for the login per
GitHub org, and the `github_login` line in `skills/obsidian-vault/templates/Config.md` says the same.

### C2. Ticket keys moved to a new Jira board mid-month

**What happened.** The configured `worklog.engagement_epic` still holds the old key. The old key
redirects, so nothing breaks, but each day's worklog goes to the new key by hand. The ledger
carries a soft spot for it.

**Why it matters.** The skill has to depend on config, but config can go stale without any error.
A by-hand fix each day is easy to forget, and a forgotten one posts to a key that only works
because of a redirect.

**Proposed change.** On each run, resolve every configured key (`worklog.ceremony_ticket`,
`worklog.engagement_epic`, and the tickets in `worklog_routing`) with getJiraIssue. Post to the key
it returns, and offer to update the config. This goes in the opening paragraph of
`skills/daily-worklog/SKILL.md` (where config is read) and in step 3, rung 5 of the ladder.

### C3. The session-transcript method over-counted and under-separated

**What happened.** The transcript method in the skill's supporting notes counts human-typed turns and
groups them by `cwd`. It counted `<local-command-stdout>` and `<bash-stdout>` echoes and
"[Request interrupted by user]" as typed turns: 41 raw against 35 real. All repo work ran through
agents started from the vault folder, so every turn's `cwd` was the vault. Nothing was separated.

**Why it matters.** The counts are evidence for how long the user was at work. Echoes inflate them.
A `cwd` that is always the vault cannot tell client repo work from record-keeping.

**Proposed change.** Exclude those markers from the typed-turn count. Group by the paths found in
tool inputs, not by `cwd`. Where no path can be found, say so and leave the turn ungrouped. The
method is not in `skills/daily-worklog/SKILL.md` yet (step 2 lists five sources), so the fix goes in
with the sixth source when it is added, in step 2.

### C4. Stride-internal meetings inside the billed block

**What happened.** Two Stride-only meetings fell inside the billed block, an internal one-to-one and
an internal retrospective. Both needed a judgment call. Both were handled in soft spots. The
one-to-one window was billed to the ticket whose build ran through it. The retrospective was logged
as the sprint's retrospective.

**Why it matters.** The ladder in step 3 has a rung for an internal event with client work running
through it (rung 6) and a rung for ceremonies (rung 1). It does not show how the two meet in a real
day.

**Proposed change.** No rule change. Add these two as worked examples in step 3 of
`skills/daily-worklog/SKILL.md`, after the paragraph that starts "The row records what the user was
doing for the client".

## D. granola-sync

### D1. The attendee rule does not say whether invitees count

**What happened.** Step 5 covers Granola listing fewer people than the summary names. It does not
cover the opposite: a calendar invite far larger than the group that spoke. One day's standup note
listed only the three speakers, with `attendees_confirmed: false`. The next day's note listed all
fifteen invitees.

**Why it matters.** Any query by attendee gives different answers depending on which way the run
went that day.

**Proposed change.** Say in step 5 of `skills/granola-sync/SKILL.md` whether invitees count as
attendees, and mirror the rule in the `attendees_confirmed` row of
`skills/obsidian-vault/references/property-schema.md`. This is the user's call. One option: attendees
are the people who spoke or are named in the summary, and the rest of the invite list goes in a
callout.

### D2. Private meetings versus person notes

**What happened.** Step 7 sends a personal fact about an attendee to their person note. The vault's
standing practice is not to enrich person notes from private or Stride-internal meetings. The two
rules met when a departing teammate's last day appeared only in private meetings. It stayed off that
person's note.

**Why it matters.** The skill does not say which rule wins. The next run may choose the other way
and put private information on a note that other skills read.

**Proposed change.** State the winner in step 7 of `skills/granola-sync/SKILL.md`. Suggested: the
privacy rule wins, and the fact stays in the private meeting note until the user says otherwise.
That is the user's call.

### D3. Parallel writers mixed names between meetings

**What happened.** The coordinator split four meetings across four writer agents. It put a name from
one meeting into another meeting's brief. Review caught it.

**Why it matters.** A wrong name in a note is a wrong fact in the vault. It can spread to person
notes and later summaries. Nothing in the skill stops the mistake or checks for it.

**Proposed change.** Add a "Several meetings in one run" section to `skills/granola-sync/SKILL.md`,
with two rules. First, build each writer's name list from its own meeting's summary and no other.
Second, after writing, check that every un-linked name in a note appears in that meeting's summary.

### D4. The transcript tool can be refused, but the query tool still answers

**What happened.** A writer agent's `get_meeting_transcript` call was refused ("paid tiers only").
`query_granola_meetings` still answered transcript-level questions, such as who spoke and the exact
wording, when the query named the meeting's title and date.

**Why it matters.** The skill's Prerequisites section assumes the tools work. A writer that hits the
refusal has no fallback, and might guess a roster or a quote.

**Proposed change.** Add a line to Prerequisites in `skills/granola-sync/SKILL.md`: if the
transcript tool is refused, use `query_granola_meetings` with the meeting's title and date in the
query text for roster and quote checks. Do not guess.

### D5. What worked: open conflicts are checked against new meetings

**What happened.** A retro ruling closed an open conflict the same day. The sync checked open
conflicts against the new meetings, and one pass wrote all three notes: the conflict note, the
superseded decision and the new decision.

**Why it matters.** This is the behaviour worth keeping. Today it is not written down in
`skills/granola-sync/SKILL.md`. Step 7 mentions the reconcile skill only for new contradictions. It
could be lost the next time the skill is edited.

**Proposed change.** Add one line to step 7 of `skills/granola-sync/SKILL.md`: scan open conflicts
against each new meeting's attendees and topics, and close any the meeting settles in the same run,
using the closing rules in `skills/reconcile/SKILL.md` and the supersede rule in
`skills/decisions/SKILL.md`.

## The order to make the changes

1. Decide A3.
2. Write the two rules from A4 and the warning from A2. They are small and hold whichever way A3 goes.
3. Build the option chosen in A3.
4. Add the A5 branch to daily-worklog.
5. Fix B1 and B2 in the hook, its test and the work-chart skill.
6. Add the config checks from C1 and C2.
7. Fix the transcript method (C3) when the sixth source is added.
8. Make the granola-sync edits D1 to D4, and write down D5.
9. Add the C4 examples.
