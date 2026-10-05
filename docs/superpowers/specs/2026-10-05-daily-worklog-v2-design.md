# daily-worklog v2 — design

**Status: draft 2026-10-05. Ready for review, then an implementation plan.** Four open questions were
answered on 2026-10-05 and folded into C4, C5, C8 and "What happens to harvest-log".

Inputs: `skills/daily-worklog/SKILL.md` (v1, 187 lines), the pedantry note
(`docs/ideas/2026-09-15-daily-worklog-pedantry-gap.md`, revised 2026-10-05), the retrospective
(`docs/ideas/2026-10-05-daily-worklog-retrospective.md`, findings F1–F15), and the untracked
`skills/harvest-log/SKILL.md`. Line numbers below are v1 `SKILL.md` lines unless marked.

Test scenarios: `docs/superpowers/baselines/daily-worklog-v2.md`.

## Goal

One run closes out one day, start to finish, with no gap questions. The user names a window, an hour
total, or nothing. The skill fills the whole window from the day's evidence and context. It shows one
table, asks one question, then posts to Jira and logs the day in Harvest.

The Jira record is built for volume. Every distinct piece of work is its own row. Every item inside it
is its own comment line, with its artifact id. All of it is true and checkable.

## What does not change

These v1 rules stand as written:

- One confirmation per day before anything is posted or recorded (line 84's "one yes covers the
  whole day"). A resume after a cut reuses that yes (C4).
- The double-post guard: read the ledger before the sweep, stop on a posted day, offer an amendment
  by update (lines 24, 90).
- The eight activities and the classification table (lines 38–51).
- Ladder rungs 2–5 and 7 (lines 56–59, 61).
- The post call's fields and format (line 88).
- Roles, never names; no V1, Oracle or legacy (lines 108–110).
- The full ban on writing anything aimed at automated analysis (line 112). Nothing below softens it.
- Closed or someone else's ticket is a home (line 143).
- The missing-clone rule (line 31) and the vault-missing rule (line 139).

## Changes

Each change names the v1 lines it replaces and states the new rule.

### C1. The window replaces the typed figure

**Replaces:** line 18 ("The user gives the day's billable figure … Unparseable: ask one question")
and line 3's "sum to the billable figure the user types".

**New rule.**

- The user may give a window (`9-5`, `08:30-16:30`), an hour total (`8`), or nothing.
- Nothing given: use config `worklog.day_window`, default `09:00-17:00`.
- An hour total alone: the window starts at the day window's start and runs that many hours.
- A window converts to hours with lunch inside, as in v1. `9-5` is 8.00 h.
- The table header states the window, the hours, the billing unit and where each came from.
  The user corrects any of them in the same reply as the yes.
- `0` still means a holiday, PTO or a non-working day (see C12 for the PTO Harvest entry).
- Only an unparseable figure gets a question.

### C2. Harvest is written, never read for the figure

**Replaces:** line 20 ("Never parse, call or export Harvest or any other time tracker to check it").

**New rule.** The figure comes from the user or the config window. Never read Harvest, or any other
tracker, to check or set it. Step 7 writes the day to Harvest (C12). Reading that date's Harvest
entries is allowed only inside step 7, to avoid a duplicate entry.

### C3. Read less of the ledger

**Replaces:** line 24's "Read the month's ledger first, every run" as practised (whole file, often
twice), and line 116's soft-spot rollover.

**New rule.**

- Read only the Rows table of the work date's month ledger. Never read the Soft spots or Not billed
  bodies; append to them by position.
- Read only the ledger for the work date's month. Never open the previous month's ledger.
- First run of a month: do not copy soft spots forward. Write one line under Soft spots instead:
  `Earlier soft spots: [[Worklog Ledger - YYYY-MM]]`, naming the previous month.
- The ledger keeps exactly the six v1 sections. No per-day comment sections, subtotal rows or
  Harvest check sections. Jira holds the comments. Existing extra sections are left alone, never
  extended.

Evidence: the September ledger is 48 KB with about 65 soft-spot lines; 63 rolled into October (F3).

### C4. Resuming `not posted` rows matches Jira first

**Replaces:** line 24's "carry those `not posted` rows unchanged into step 5, and post exactly those".

**New rule.** A date with `not posted` rows is a resume. Do not sweep. Read the user's own worklogs on
that date from Jira first. A `not posted` row whose ticket, start and hours match an existing worklog
gets that worklog's id, and is not posted. Post the remaining rows. Do not ask again: the earlier yes
carries over, because the rows exist only because of it. That yes also covered the Harvest entry, so
steps 7 and 8 run as usual. Say in one line which rows matched and which are being posted.

The user confirmed this on 2026-10-05.

Why: C11 writes rows before posting. A session cut between a successful post and its id write would
otherwise post that row twice.

### C5. Sweep: meetings synced first, transcripts added, whole date read

**Replaces:** lines 26–32 (five sources) and line 30's reliance on synced notes only.

**New rules.**

1. **Sync meetings first.** Before the sweep, list Granola meetings for the date. Any meeting with no
   note in `folders.meetings` is synced with `granola-sync` first. Say in one line which meetings
   were added. No Granola tool: say so in one line and continue. The sync is granola-sync's write,
   not this skill's, so it may happen before the yes. (F4: the user asked for this on four days.)
2. **Source six: session transcripts.** Read Claude Code session transcripts under
   `worklog.transcript_dirs` (default `~/.claude/projects`). Use them for timing and place only:
   - Count only human-typed turns. Skip command echoes, local command output, interrupts, tool
     results and subagent sidechains.
   - Convert UTC timestamps to config `timezone`.
   - Group each turn by its `cwd`: a client repo (under `worklog.repos` or `work_roots`), the vault,
     or other.
   - Client-repo turns are evidence of work on that repo's ticket.
   - Vault turns are record-keeping, activity `admin`. The time is spread across the tickets the
     notes were about. The tickets come from the day's notes and daily-note lines. It is never billed
     to `worklog.engagement_epic`.
   - Vault turns about no particular ticket go to the ticket worked on nearest in time.
   - Other turns (the consultant's own tooling) are not client evidence. That time is filled by
     context like any gap.
   - No transcript for a stretch is not evidence of no work. It never shrinks the day.
   - Transcript content is never quoted in a comment.
3. **A shipped script.** `skills/daily-worklog/scripts/timeline.py`, Python 3 standard library only.
   Input: a date, a timezone, the transcript dirs, and the path groups. Output: one line per
   15 minutes with typed-turn count and group. Each run calls it once. (F12: every run wrote a fresh
   script, and the method counted command echoes as typed turns.)
4. **Read the whole calendar date.** Every source is read for the full date, not just the window.
   This is how work done after the window is found (C7).

### C6. The ladder tiebreak for internal meetings

**Replaces:** line 55 (rung 1) and line 60 (rung 6), which conflict on an internal retro.

**New rule.**

- Rung 1 fires only for a **client** ceremony. An internal (consultancy) event never goes to
  `worklog.ceremony_ticket`, whatever its title says.
- An event is internal when its title matches `worklog.internal_meetings`, or when every attendee is
  consultancy staff. A title like "Stride Standup" with client attendees is a client ceremony.
- An internal event goes to rung 6. Client work running through its slot is a row on that work's
  ticket. Any part of the slot with no client work is a gap, filled by context (C7).
- The event itself is never named in a comment.
- An internal slot is never moved to Not billed unless the user says so (line 63 stands).

Evidence: the 2026-09-15 retro (pedantry gap 7); the 09-30 run dropped a handover half-hour as
"internal catch-up" and the user had to correct it (F2); 09-25 misread a client meeting as internal
(F9).

### C7. Fill the window by context

**Replaces:** line 69 ("falling back to `worklog.day_start`"), line 73 ("A gap larger than 0.25 h is
never closed by guessing … Never pad an existing row"), line 74 (evidence beyond the figure is
dropped), line 82 (the `unattributed` question), and lines 147–149 where they treat a thin day as
"reconstruction".

**New rule.** Every hour in the window was worked. The skill fills all of it, in this order:

1. **Evidence.** Rows built from evidence, as in v1.
2. **The block rule.** The window is cut into blocks of `worklog.billing_unit` hours. A block that
   holds evidence belongs to that work in full. When several pieces of work share a block, the one
   completed in it takes the leftover minutes. (From the 09-30 half-hour rule, made general.)
3. **Moved client work.** Real client work done outside the window may fill an empty block inside
   it. Only client work with evidence moves. Internal work never moves. The moved hours are never
   more than the work's real length. The row's start is set inside the gap. Its comment names the
   real artifacts.
4. **Context.** A block still empty goes to the most likely ticket. Prefer the ticket worked just
   before or just after the gap. Tie: the ticket with the most evidence that day.
5. **Leftover.** Client work outside the window that found no gap goes to Not billed, as "hours
   worked beyond the billed block" (line 125).

Rules for filled and moved rows:

- **Mark them.** The proposal table has a `Basis` column: `evidence`, `filled` or `moved`. A wrong
  guess is visible at a glance and corrected in the same reply as the yes (F9).
- **Filled rows may be coarse.** Whole-unit rows are fine.
- **Filled comments name the kind of work only:** ticket reading, coordination, review prep,
  message catch-up, environment checks, record-keeping. The activity follows the kind.
- **Filled comment lines carry no artifact id**, not even a real one. An id would claim evidence the
  hour does not have.
- **No gap questions.** Never ask what a window was. `unattributed` is no longer proposed. The value
  stays valid in old ledger rows.
- **One exception:** a day with no evidence at all is an empty sweep, not a gap. Say so and ask one
  question about the day.
- The user may still say a period was not client work. Those hours leave the rows and go to Not
  billed, with a soft spot, and the new total is shown in the re-presented table (line 63 stands).

### C8. One row per distinct piece of work

**Replaces:** line 69 ("One row per ticket per activity per day") and line 71's merge rule.

**New rule.**

- A distinct piece of work is one ticket, one activity, one unbroken stretch of time. Two separate
  review sessions on one ticket are two rows, each with its own start.
- Rows are at least 0.25 h, in 0.25 h steps. A stretch under 0.25 h joins the nearest stretch with
  the same ticket and activity. With none, it stays its own 0.25 h row and the block rule sizes it.
- The rows sum to the figure exactly. A residue of 0.25 h or less goes to the largest row, as in v1.
- Too many pieces for the figure: join same-ticket, same-activity stretches first. Then drop the
  smallest and list them in soft spots.

**Billing unit versus row size.** "We bill by the hour" sets the day's total and the block grid. It
does not force whole-hour rows. The ledger shows this is how the user applied it: 10-01 and 10-02,
after the hour rule, posted rows of 0.25 h to 1.75 h, and 10-02 had 17 rows. The user confirmed this
reading on 2026-10-05: the day total is whole hours, and rows go in 0.25 h steps.

### C9. Cause tags on every row

**Replaces:** line 65 ("optional … Tag a row when the tag is true of it; leave it blank otherwise").

**New rule.** Every row is checked against all three tags: `blocked`, `rework`, `unplanned`. At most
one tag per row; when two fit, take the one that explains most of the row's hours. The proposal
table has a `Cause` column and a short `Why` column for every row, including rows left untagged
("planned sprint work, first pass, no wait"). Tags stay ledger-only, never in a comment.

Evidence: September closed 72% untagged (F13); the 09-15 run left nine rows blank (pedantry gap 1).

### C10. Present: one table, one question

**Replaces:** lines 76–84.

**New rule.**

- Header: date, window, hours, billing unit, and their source.
- Table columns: `# | Start | Hours | Ticket | Activity | Basis | Cause | Why`. Each row's full
  comment follows the table, under its row number.
- Then: the sum line, any `pre-existing <id>` rows, the Harvest line (C12), and the soft spots the
  day will add.
- One question naming both counts: "Post these N worklogs and the Harvest entry?"
- No gap question. The user corrects filled rows in the same reply as the yes.
- Any change: show the whole table again and ask again.
- Nothing is written before the yes: no ledger row, no daily-note line, no Jira, no Harvest. The
  granola-sync write (C5) is the only exception.

### C11. The ledger is written before the first post

**Replaces:** line 84 ("the ledger and the daily-note line are step 7, after the post, never
before") and line 139's "write every id already obtained to the ledger before anything else".

**New rule.** Right after the yes, before any Jira call:

1. Write every row of the day to the ledger's Rows table with `not posted` in the id column.
2. Post the rows one at a time. After each call returns, replace that row's `not posted` with its
   id before the next call.
3. A failed or rejected call leaves its row `not posted`. Never retry automatically.

A session cut at any point leaves an exact resume point. C4 picks it up. Totals, soft spots and the
daily-note line come after the posts (step 8).

Evidence: on 10-02 a classifier stop cut the run after 9 of 17 posts, with none of the 9 ids in the
ledger. Recovery took two more sessions and a read of the dead transcript (F1).

### C12. Harvest becomes step 7

**Replaces:** line 20's ban, and the separate `harvest-log` skill (see "What happens to harvest-log").

**New rule.** After the Jira posts, write the day to Harvest through the `mcp__harvest__*` tools.
The one yes covers it, because the proposal showed it.

- Config `harvest:` — `project_id`, `billable_task_id`, `pto_task_id`. Absent: list the user's
  entries for the last 30 days, take project and task from the newest, and offer once to save them.
  Edit the config only after a yes. Until then, skip the Harvest step and say so.
- One entry per day: project `project_id`, task `billable_task_id`, hours = the day's figure,
  start and end = the window, notes empty. An account without timestamps takes hours alone.
- Before writing, list that date's entries:
  - Same task, same hours and times: already done; say so.
  - Same task, different hours or times: a correction; update that entry in place.
  - A different task (PTO versus billable): ask before changing it.
  - Approved or locked: say so and leave it.
- PTO day (`0` with PTO as the reason): propose one PTO entry for the default window's hours and ask
  once. A holiday or non-working day writes nothing to Harvest.
- An amendment that changes the day's total also updates the Harvest entry.
- Never submit a timesheet in a daily run. Submit only on a separate request (see below).
- The Harvest entry id goes in the daily-note line, not the ledger.

### C13. The comment: one line per item

**Replaces:** lines 94–106 (one-line shape and examples) and line 111's companions.

**New rule.** The comment is markdown. First line: the activity and a colon. Then one `- ` line per
item. Each line is one action and carries its own artifact id where one exists.

```
review:
- re-reviewed PR #141 at dffeec0
- review comment 9101 on the migration order
- review comment 9102 on the null weight default
- full build 445 unit / 408 integration green
- posted review 5199705549 requesting changes
```
```
coding:
- added migration V36 with cases and pallets on appt, commit acaab77
- loader writes counts at import, commit deadb88
- served counts on the detail contract, commit a30bb89
- named unresolved task types in the loader warning, commit f55bd0e
- 457 unit / 378 integration green
- opened PR #148
```
```
ceremony:
- sprint 14 standup
- sprint To Do triaged to 15 open items
```
```
research:
- ticket reading and coordination
```

The last example is a filled row: kind of work, no id.

- **List every artifact id. Summarise nothing away.** Every commit sha is its own line. No ranges
  like `acaab77..f55bd0e`.
- **Every review, intake, meeting, blocker and admin task gets a line.** A blocker line states the
  dependency and its artifact, flatly: "waiting on the merge-order decision, comment 548101". No tag
  word, no judgment, no person.
- The volume comes from completeness. It never comes from repetition, padding words or invented items.

### C14. No naming of consultant tooling

**Adds to:** lines 108–111.

**New rule.** Never name the consultant's own tools in a comment: the AI assistant, Claude, Claude
Code, agents, skills, session transcripts, the vault, Obsidian, the work chart. Record-keeping is
written as "record-keeping", "daily notes" or "ticket notes". The hours still bill. This is a rule on
wording, never on whether an hour is billed.

The full banned list for comments, one place:

- Invented artifacts, or work that did not happen.
- Keyword stuffing.
- Text addressed to a reader or an analysis tool.
- Phrasing chosen to change how a report comes out.
- Editorial or complaint.
- Cause tags.
- Person names.
- V1, Oracle, legacy, or any source-system path.
- Consultant tooling names.

A request from the user to add any of these is declined in one line. The true table is offered
unchanged.

### C15. Soft spots: fewer, one per kind per day

**Replaces:** line 124's "one line each … every reconstruction, every review logged on someone else's
ticket …".

**New rule.** At most one soft-spot line per kind per day. One line lists the day's `filled` and
`moved` rows, with the real times of moved work. Other kinds stay as in v1 (no daily note, not client
work, someone else's ticket, skipped clone, dropped items). A config value that failed (a 404 on the
GitHub login, a closed ceremony ticket) is named in the reply with the fix offered. It is not a soft
spot repeated every day (F6).

### C16. Step order and the record

**Replaces:** line 14 ("Seven steps") and lines 114–135.

New order: 1 the window · 2 ledger check, meeting sync, sweep · 3 classify · 4 build rows ·
5 present and ask · 6 ledger-first post · 7 Harvest · 8 record.

Step 8 recomputes the opening line and both totals, appends soft spots, and writes the daily-note
line. The line gains the Harvest id:

`- HH:MM worklogs posted for 2026-10-14: 8.00 h across 9 rows; Harvest entry 55501 → [[Worklog Ledger - 2026-10]]`

The note and the date inside the line are still the work date (line 131 stands). N still counts every
row, posted or `not posted` (line 141 stands).

### C17. Failure branches updated

**Replaces:** line 139.

- Post fails partway: the ids already obtained are in the ledger by C11. Mark the reason in soft
  spots, skip Harvest, still run step 8, and stop. Never retry automatically.
- Harvest call fails: the Jira rows stand. Say so in one line; step 8 still runs with no Harvest id.
- No Granola tool, or no transcripts: one line each, and continue.
- No `worklog.ceremony_ticket` with ceremony evidence: still stop and ask (v1 rule stands).

### C18. Common mistakes table

**Replaces:** rows at lines 161, 162, 163, 165, 166 and 182, which now contradict C7.

Remove those six rows. Add rows for the v2 failures, quoted from real runs:

| Shortcut | Why it fails |
|---|---|
| Four gap questions at the end of a 9.5-hour day ("cool it a little on the inquisition") | The window is filled by context and filled rows are marked. Never ask what a window was |
| Dropping 15:00–15:30 as an internal catch-up, so the day came to 7.50 h | Not-billed is the user's call, never the calendar's. An internal slot is filled like any gap |
| "One thing I won't do: move the Stride-internal after-5 work into the client log" (on client work) | Real client work after the window fills a gap inside it. Only internal work stays out |
| Six rows for a full day ("there should be more rows") | One row per distinct piece of work, one comment line per item |
| `commits acaab77..f55bd0e` | A range summarises. Every sha is its own line |
| "prep for PR #215" on a filled hour | A filled line names the kind of work and no id, even a real one |
| All rows tagged blank with no reason | Every row is checked against all three tags, and the table says why |
| Posting all rows, then writing the ledger | A cut session leaves posted rows with no record. Write `not posted` rows first |

### C19. Description

**Replaces:** line 3.

Add: "log my day" with no hours uses the default window; Harvest is logged in the same run; trigger
phrases "log today in harvest", "fix my Harvest entry for Tuesday", "submit my timesheet". Drop "sum
to the billable figure the user types". Keep the time-logging supersession sentence.

## Config keys added

In `Meta/Config.md` and `skills/obsidian-vault/templates/Config.md`, each with one explanation bullet:

```yaml
worklog:
  day_window: "09:00-17:00"     # used when the user gives no hours
  billing_unit: 1.0             # hours; sets the block grid and the day total's unit
  internal_meetings: []         # title matches for consultancy-internal events
  transcript_dirs:
    - ~/.claude/projects
harvest:
  project_id:
  billable_task_id:
  pto_task_id:
```

- `worklog.day_start` is kept for old configs. When `day_window` is absent, the window is
  `day_start` plus 8 hours. The template drops `day_start`.
- `harvest.day_start` from harvest-log is dropped. The window replaces it.

## What happens to harvest-log

It is retired before it is ever committed. One owner for Harvest writes stops two rule sets drifting
apart, which is what F8 describes.

- Its day-entry rules move into step 7 (C12): config, one entry per day, list-first checks, locked
  entries.
- Its other jobs move into a short "Harvest-only requests" section of `daily-worklog`, with the same
  rules:
  - log or fix a single day in Harvest without Jira;
  - PTO for a range of days, skipping weekends unless named;
  - submit timesheets, only when asked, holding a week with an open question, stopping on a running
    timer, skipping approved weeks.
- A day name with two candidate dates gets both dates stated and one question (from harvest-log).
- The user confirmed on 2026-10-05 that the untracked `skills/harvest-log/` folder is deleted. The
  rewrite step deletes it once its content is in `daily-worklog`. Nothing deletes it before then.

## Deferred, and why

| Item | Why deferred |
|---|---|
| Per-sprint process-overhead rollup (pedantry gap 9) | Still the user's call. Nothing in v2 depends on it |
| Background-job stage folder for ledger writes (issues note A5) | That note lives on an unmerged branch. Revisit when it lands |
| Full config checks at run start (issues note C1, C2) | v2 names a failing value once with a fix. A full check pass is a separate change |
| Pruning the user's memory note (retro rec. 4) | Memory is the user's, not the skill's. Suggest it in the handoff |
| Correcting the pedantry note's stale lines (retro rec. 13, F15) | Doc housekeeping, not part of the skill. One edit, any time |
| Classifier-stop cause (F1) | Unknown. C11 limits the damage; finding the cause needs the feedback reply |
| A per-day comment file beside the ledger (retro rec. 4) | Jira already holds every comment. Add only if an audit needs it offline |
| Whether a worklog run gets a work-chart row (retro rec. 8, F5) | Needs the user; listed below |

## Open questions for the user

1. **Work-chart Stop hook.** Should the hook skip a worklog run, since the ledger is its record? Or
   should the run write one work-chart row at the end of step 8? Runs have done both (F5).
2. **Stale config values.** May the run set `worklog.github_login` to the working login and
   `worklog.engagement_epic` to `PV2-1194`? Both have been flagged every day since 09-28 (F6).
3. **2026-09-15.** Amend it by update after v2 ships, or leave it as posted?
4. **PTO in Harvest.** Is a PTO day logged as the default window's hours?
5. **Classifier stops.** Did the `/feedback` report on 10-02 get a reply?

## Testing

`docs/superpowers/baselines/daily-worklog-v2.md` holds eight scenarios with inline fake evidence. RED
runs them against v1 `SKILL.md`. GREEN runs them against v2. Every rep is a sonnet subagent. Five reps
per scenario, per the baselines README.
