---
name: daily-worklog
description: Close out one working day — Jira worklog rows for the whole day, posted after one confirmation, the day logged in Harvest in the same run, and the month's ledger updated. Use whenever the user says "log my day" (with or without hours), "log my hours for a day", "close out today", "log 8.5 hours for 2026-09-10", "log 9-5 for 2026-10-14", "post my worklogs", "post today's hours", "daily worklog", or gives one day's hours to put in Jira; and for Harvest on its own — "log to harvest", "log today in harvest", "put PTO in Harvest for next week", "fix my Harvest entry for Tuesday", "submit my timesheet", "submit my timesheets for the last two weeks". This skill posts, after one confirmation — time-logging's draft-only rule is superseded for a daily run and is never a reason to hand the posting back. Weekly and monthly reconciliation against the invoice stays with time-logging. A day rebuilt three weeks later is a guess; a day closed out today is a fact.
---

# Daily worklog

Follow the obsidian-vault skill's conventions. One run closes out one day: one table, one question, then Jira, Harvest and the ledger. The run is not finished until the rows are posted and recorded.

**This skill posts.** After one confirmation it writes worklogs to Jira and the day's entry to Harvest. `time-logging` never posts; that rule belongs to that skill and does not apply here, whoever quotes it. Nothing else on a Jira issue is ever touched.

Site: config `jira_site`; absent with one accessible site, use that site and offer to add the key; more than one, ask once and save the answer. Read `Meta/Config.md` once and take every person- and vault-specific value from it: `worklog.account_id`, `git_author`, `github_login`, `day_window` (absent: `day_start` plus 8 hours; both absent: `09:00-17:00`), `billing_unit` (default `1.0`), `ceremony_ticket`, `engagement_epic`, `internal_meetings`, `repos`, `transcript_dirs` (default `~/.claude/projects`); `worklog_routing`, `work_roots`, `timezone`, `harvest.project_id`, `harvest.billable_task_id`, `harvest.pto_task_id`, `folders.daily`, `folders.work`, `folders.meetings`, `folders.status` (missing: `Status`). Never hardcode one of these here.

Eight steps, in order: 1 the window · 2 ledger check, meeting sync, sweep · 3 classify · 4 build rows · 5 present and ask · 6 ledger first, then post · 7 Harvest · 8 record. Several days in one run: all eight once per day, oldest first, one confirmation per day.

## 1. The window

The user gives a window (`9-5`, `08:30-16:30`), an hour total (`8`), or nothing.

- Nothing: the window is `worklog.day_window`.
- An hour total: the window starts at the day window's start and runs that many hours.
- A window converts to hours with lunch inside. `9-5` is 8.00 h.

Never ask for the hours. Only an unparseable figure gets a question. The table header states the window, the hours, the billing unit and where each came from, and the user corrects any of them in the same reply as the yes.

`0` is a holiday, PTO or a non-working day: no sweep, no rows, one line in the ledger's Not billed naming the day and the reason. PTO also gets a Harvest PTO entry (step 7); ask once before writing it.

The figure comes from the user or the config. Never read Harvest or any other tracker to check or set it.

## 2. Ledger check, meeting sync, sweep

**Read the ledger's Rows table first, every run.** `<folders.status>/Worklog Ledger - YYYY-MM.md` for the **work** date's month. Read only the Rows table: never the Soft spots or Not billed bodies, never the previous month's ledger. For the work date:

- **Every row carries an id** (an integer or `pre-existing <id>`): the day is posted. Stop, name the ids, and offer an amendment (step 6).
- **Any row reads `not posted`**: this is a resume. Go to "Resuming" below.

A Jira worklog cannot be deleted through the API, so this check is the only thing between a repeated run and a doubled month.

**Sync meetings.** List the Granola meetings for the date. Run `granola-sync` for any meeting with no note in `folders.meetings`, and say in one line which meetings were added. This sync is granola-sync's write and may happen before the yes. No Granola tool: say so in one line and continue.

**Sweep the whole calendar date**, in config `timezone`, not just the window. Work done outside the window is found this way.

1. `<folders.daily>/<date>.md` — the spine. Its `- HH:MM` lines give the day's order and clock times.
2. `<folders.work>/*Work <date>.md` — repo paths, commits and artifact ids; the note's `jira` names the ticket. Read, never write.
3. `<folders.meetings>/` notes dated that day — `meeting_type`, attendees, topics, outcomes.
4. `git log --author=<worklog.git_author>` for the date, with sha, time and subject, in **each path in `worklog.repos` and no other repository**. A configured path with no clone: skip it, never clone it, never use another clone found on disk, and say in the reply that ends the turn: "`<path>` in `worklog.repos` has no clone on disk; git evidence for it was skipped." Say it every time, even when the rows came out fine.
5. Jira and GitHub activity: comments, transitions and issue activity by `worklog.account_id`; PR reviews, review comments, pushes and merges by `worklog.github_login`. Also the user's own worklogs already on that date: work already logged, which counts against the figure and shows in the table as `pre-existing <id>`.
6. Session transcripts, for timing and place only. Run once:

   `python3 <this skill's folder>/scripts/timeline.py --date <date> --tz <timezone> --dirs <worklog.transcript_dirs> --client <worklog.repos and work_roots> --vault <vault folder>`

   It prints one line per 15 minutes with the count of turns the user typed and the group: `client <path>`, `vault`, or `other`. Client turns are work on that repo's ticket. Vault turns are record-keeping (step 3). Other turns are the consultant's own tooling, not client evidence; that time is filled like any gap. A stretch with no transcript is not evidence of no work and never shrinks the day. Never quote transcript content anywhere. No transcripts: say so in one line and continue.

### Resuming `not posted` rows

The earlier yes carries over: the rows exist only because of it, and it covered the Harvest entry too. Do not ask again and do not re-sweep. The rows are fixed; read the day's notes only for what each remaining row needs to post, its start and its comment.

1. Read the user's own worklogs on that date from Jira.
2. A `not posted` row whose ticket, hours and start match an existing worklog takes that worklog's id in the ledger and is not posted.
3. Say in one line which rows matched and which are being posted, then post the rest (step 6), then run steps 7 and 8.

## 3. Classify

One activity and one ticket per piece of evidence.

| Evidence | Activity |
|---|---|
| A work-note row that changed code | `coding` |
| A work-note row that changed no code — it opens with Researched, Compared, Drafted, Asked, Designed or Traced, or, in older notes, starts "Read" and ends "nothing changed"; a trace, a spike, an intake | `research` |
| A PR review, a review comment, a re-review | `review` |
| An environment rebuild, an import run, a release, a branch cut for deployment | `deploy` |
| A client meeting whose title names a ceremony — standup, huddle, refinement, sprint planning, retro — or whose `meeting_type` is `standup` or `refinement` | `ceremony` |
| Any other client meeting or working session | `meeting` |
| A QA report reproduced, seeded, screenshotted or answered | `qa-support` |
| A ticket description written or rewritten, a ticket raised, a board triaged; vault turns (record-keeping) | `admin` |

The title test wins over `meeting_type`: a huddle is still `ceremony`. When two activities fit, the one that produced the artifact wins. Work inside a ceremony's slot stays `ceremony`.

**Internal events.** An event is internal (consultancy, not client) when its title matches `worklog.internal_meetings` or every attendee is consultancy staff. "Stride Standup" with client attendees is a client ceremony. An internal event is never a ceremony, never goes to `worklog.ceremony_ticket`, never goes to Not billed unless the user says so, and is never named in a comment, the table or a soft spot.

Ticket, first match wins:

1. A client ceremony → `worklog.ceremony_ticket`, its own row, even when it discussed a ticket.
2. Evidence carrying a ticket key — the work note's `jira`, a branch, a PR title, a commit prefix, the issue a Jira comment sits on → that key.
3. A PR review with no key in its title → the ticket the PR implements, from its body or linked issue.
4. A `worklog_routing` rule whose `match` appears in the evidence text, case-insensitively → its `ticket`.
5. Engagement-level discovery with no single ticket, such as an on-site architecture session → `worklog.engagement_epic`. Never a home for an unsplit day, and never for record-keeping.
6. An internal event → client work running through its slot is a row on that work's ticket; any part of the slot with no client work is a gap, filled in step 4.
7. Nothing above → filled by context in step 4.

**Record-keeping** (vault turns) is `admin`. When the daily-note lines or work notes say which tickets it was about, spread it across those. When they do not, it goes to the ticket worked on nearest in time.

**Cause tags.** Check every row against all three: `blocked` (hours went to waiting on or working around a decision, a person or an environment), `rework` (the same ground covered again because scope changed after the work was done), `unplanned` (the work arrived during the day and was not in the sprint). At most one per row; when two fit, take the one that explains most of the row's hours. Every row gets a short Why, tagged or not ("planned sprint work, first pass, no wait"). Tags go in the ledger, never in a comment.

## 4. Build rows

**Every hour in the window was worked.** Fill all of it, in this order:

1. **Evidence.** Rows built from the sweep.
2. **Blocks.** Cut the window into blocks of `worklog.billing_unit` hours. A block that holds evidence belongs to that work in full. When several pieces share a block, the one completed in it takes the leftover minutes.
3. **Moved.** Real client work with evidence done outside the window fills an empty block inside it. Its hours are never more than the work's real length; its start is set inside the gap; its comment names its real artifacts. Internal work never moves.
4. **Filled.** A block still empty goes to the ticket worked just before or just after it; tie: the ticket with the most evidence that day. The activity follows the kind of work: ticket reading → `research`, review prep → `review`, environment checks → `deploy`, coordination, message catch-up and record-keeping → `admin`.
5. **Beyond the window.** Client work outside the window that found no gap goes to Not billed as hours worked beyond the billed block.

Never ask what a window was. Never propose an `unattributed` row. The one exception: a day with no evidence at all is an empty sweep. Say so and ask one question about the day.

**Rows.** One row per distinct piece of work: one ticket, one activity, one unbroken stretch. Two review sessions on one ticket are two rows, each with its own start. Rows are at least 0.25 h, in 0.25 h steps; the billing unit sets the day total and the block grid, not the row size. A stretch under 0.25 h joins the nearest stretch with the same ticket and activity; with none, it stays its own 0.25 h row. The rows sum to the figure exactly; a residue of 0.25 h or less goes to the largest row. Too many pieces for the figure: join same-ticket, same-activity stretches first, then drop the smallest and list them in soft spots.

Each row has a Basis: `evidence`, `moved` or `filled`.

When the user says a period was not client work, those hours leave the rows and go to Not billed with a soft spot, and the re-presented table shows the new total. That call is the user's, never the calendar's.

## 5. Present and ask

Show the day in this shape:

```
2026-10-14 · window 09:00–17:00 · 8.00 h · billing unit 1.0 h · source: config worklog.day_window

| # | Start | Hours | Ticket   | Activity | Basis    | Cause | Why                                  |
|---|-------|------:|----------|----------|----------|-------|--------------------------------------|
| 1 | 09:00 | 0.25  | ACME-900 | ceremony | evidence |       | sprint standup, planned              |
| 2 | 09:15 | 1.50  | ACME-310 | review   | evidence |       | planned review, first pass, no wait  |
| … |       |       |          |          |          |       |                                      |

Sum: 8.00 h of 8.00 h

Comments
1.
ceremony:
- standup
- ACME-305 started, ACME-310 in review
2.
review:
- …

Harvest: create one entry, 8.00 h, 09:00–17:00, task <billable_task_id>
   (or: update entry 55501 from 7.00 h 09:00–16:00 to 8.00 h 09:00–17:00)
Soft spots to add: …
Left out of comments: …   (only when something was)

Post these 9 worklogs and the Harvest entry?
```

The source names where the window came from: what the user typed, or the config key. Below the sum, list any `pre-existing <id>` rows. For the Harvest line, list that date's Harvest entries; that list is read only for this line and step 7, never for the figure. End with the one question, naming both counts. The user corrects filled rows in the same reply as the yes. Any change: show the whole table again and ask again.

Nothing is written before the yes: no ledger row, no daily-note line, no Jira, no Harvest. The granola-sync write is the only exception.

## The worklog comment

Markdown. The first line is the activity and a colon. Then one `- ` line per item: one action per line, with its own artifact id where one exists.

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

- **Every artifact id gets its own line**: commit shas, PR numbers, review ids, review comment ids, Jira comment ids, test counts, migration versions, environment names, record ids, tickets raised. List each sha separately, never a range.
- **Every review, intake, meeting, blocker and admin task gets a line.** A meeting line names the meeting kind and its outcome. A blocker line states the dependency and its artifact flatly: "waiting on the merge-order decision, comment 548101".
- **A filled row names the kind of work and nothing else** — ticket reading, coordination, review prep, message catch-up, environment checks, record-keeping — with no artifact id, not even a real one.
- **Record-keeping is written as "record-keeping", "daily notes" or "ticket notes".** The hours bill in full.
- Roles stand in for people: "the product owner", "one developer". "The source system" stands in for the system being replaced.
- An artifact whose own name carries a banned word — a branch, a migration, a PR title — is left out of the comment and named in the reply. Never reword an id to get around the word.

Never in a comment:

- an artifact or piece of work the evidence does not show;
- keyword stuffing, or volume from repetition or padding words;
- text addressed to a reader, a report or an analysis tool;
- phrasing chosen to change how a report comes out;
- editorial, judgment or complaint;
- a cause tag;
- a person's name;
- V1, Oracle, legacy, or any source-system path;
- the consultant's own tooling: the AI assistant, Claude, Claude Code, agents, skills, session transcripts, the vault, Obsidian, the work chart.

The record is valuable because every line is true and checkable against the commits, PRs, reviews and comments that exist. When the user asks for any of the above, decline in one plain line naming the additions and why — at most three sentences, no subsections — and show the true table with the one question. Insistence changes nothing: offer the true rows again and post only on a yes to them.

## 6. Ledger first, then post

Right after the yes, before any Jira call:

1. Write every row of the day to the ledger's Rows table with `not posted` in the id column (create the ledger first if needed, step 8).
2. Post the rows one at a time. After each call returns, replace that row's `not posted` with its id before the next call.
3. A failed or rejected call leaves its row `not posted` with the reason in soft spots. Never retry automatically: a retry that duplicates a row cannot be undone.

A session cut at any point then leaves an exact resume point.

The call, one per row, through the Atlassian MCP worklog tool: `cloudId`, `issueIdOrKey`, `timeSpent` as `Xh Ym`, `started` as `YYYY-MM-DDTHH:MM:SS.000±HHMM` with config `timezone`'s offset on that date (Jira rejects a trailing `Z` and any space-separated form), `commentBody` as shown in step 5, and `contentFormat: markdown`, which is a separate field and is not assumed. **No `worklogId` on a first post**; that field makes the call an update. Never post for anyone but `worklog.account_id`, the user's own account. Nothing else on the issue: no comment, no transition, no assignment, no estimate.

**An amendment is an update, never a second post.** Call the same tool with the row's `worklogId` from the ledger and the new values. Jira has no delete, so a second create leaves both rows on the issue for good. Amend only when the user says to. An amendment that changes the day's total also updates the Harvest entry.

## 7. Harvest

After the Jira posts, write the day to Harvest through the `mcp__harvest__*` tools. The one yes covers it, because the table showed it.

- One entry per day: project `harvest.project_id`, task `harvest.billable_task_id`, hours = the day's figure, start and end = the window, notes empty. An account without timestamps takes hours alone.
- From the date's entry list: same task, same hours and times → already done, say so. Same task, different hours or times → update that entry in place. A different task (PTO versus billable) → ask before changing it, and write nothing until answered. Approved or locked → say so and leave it.
- PTO day: one entry on `harvest.pto_task_id` for the default window's hours, after asking once. A holiday or non-working day writes nothing to Harvest.
- No `harvest` config: list the user's entries for the last 30 days, take project and tasks from the newest, and offer once to save them. Edit the config only after a yes. Until then, skip this step and say so.
- Never submit a timesheet in a daily run.

## 8. Record

**The ledger.** `<folders.status>/Worklog Ledger - YYYY-MM.md` for the **work** date, not the run date: closing out 30 September on 1 October writes to the September ledger. Missing: create it from the vault templates folder, else this skill's `templates/Worklog Ledger.md`, with `period_start` and `period_end` as the month's first and last days, `status: draft`, `client` from config, and `jira` listing the month's tickets. On a month's first run, write one line under Soft spots: `Earlier soft spots: [[Worklog Ledger - YYYY-MM]]`, naming the previous month. Nothing is copied forward.

The ledger has exactly these six parts, in this order, headings spelled as here:

1. **One opening line** — the month, hours billed so far, and the attribution rate (hours on a ticket over hours billed).
2. **`## Rows`** — `| Date | Ticket | Activity | Cause | Hours | Worklog id |`, in date order. Worklog id: an integer; `not posted`; `pre-existing <id>`; or `—` on an old `unattributed` row.
3. **`## Totals by activity`** — one line per activity used, summing to the month's billed hours.
4. **`## Totals by cause`** — one line per tag used plus `untagged`.
5. **`## Soft spots`** — one line each, prefixed with its date, saying what happens if challenged and how to fix it.
6. **`## Not billed`** — holidays, PTO, periods the user said were not client work, hours worked beyond the billed block.

After the posts, recompute the opening line and both totals in full, and append the day's soft spots and Not billed lines at the end of their sections. Earlier days are never rewritten, except to fill a `not posted` id and for an amendment, which keeps its id and place and gains ` (amended YYYY-MM-DD)` after the hours. A cleared soft spot gains ` — cleared YYYY-MM-DD`. Extra sections already in a ledger are left alone, never extended.

**Soft spots: at most one line per kind per day.** One line lists the day's `filled` and `moved` rows, with the real times of the moved work. The other kinds: no daily note, not client work, someone else's or a closed ticket used as a home, a skipped clone, dropped items, a failed post. A config value that failed — a 404 on the GitHub login, a closed ceremony ticket — is named once in the reply with the fix offered, not repeated as a soft spot every day.

**The daily note.** One line under `## Log` in the **work** date's note, `<folders.daily>/<work date>.md`, created if missing. Never the run date's note.

`- HH:MM worklogs posted for 2026-10-14: 8.00 h across 9 rows; Harvest entry 55501 → [[Worklog Ledger - 2026-10]]`

Only `HH:MM` is the time of the run. N counts every row in the day's table, posted or `not posted`. No Harvest entry was written: leave out the Harvest part.

## When something is missing

One line in chat each.

- **No Atlassian MCP or the site unreachable:** the rows stay `not posted` in the ledger; say which still need posting. The next run resumes them.
- **A post fails partway or the run stops:** the ids already obtained are in the ledger. Mark the reason in soft spots, skip Harvest (the resume writes it), still run step 8, and stop.
- **Some or all rows rejected:** each stays `not posted` with the reason in soft spots; the rest still post, and step 8 still runs.
- **A Harvest call fails:** the Jira rows stand. Say so; step 8 runs with no Harvest id.
- **No Granola tool, or no transcripts:** say so and continue.
- **No vault or no config:** point at vault-init and stop. Nothing posts without a ledger.
- **No `worklog.ceremony_ticket` and the day has ceremony evidence:** stop before the table and ask for the key.
- **A repo in `worklog.repos` with no clone:** name it in the reply, skip it, continue.

In every branch the ledger keeps its rows and the daily note gets its line.

A ticket that is Closed or belongs to someone else is a home, not a blocker: post to it, because the work went there and Jira accepts worklogs in every status. Add a soft spot naming the ticket, its status or assignee, and the alternative home, normally the parent epic. Never move hours to a ticket the work was not for, and never raise a ticket to hold hours.

A ceremony is logged at its actual length. One that ran more than double its slot, or a day whose ceremony total passed 2 h, gets a soft spot naming the meeting note and the scheduled length. A ceremony that turned into working a ticket is two rows, split at the time the notes give.

A day with no daily note still gets its rows from the other sources, built as in step 4. Its first soft spot for that day says no daily note exists and names every source the rows came from.

## Harvest-only requests

Requests about Harvest alone ("log today in harvest", "put PTO in Harvest for next week", "fix my Harvest entry for Tuesday", "submit my timesheet") touch no Jira and no ledger. Step 7's rules apply: one entry per day, the date's entries listed first, locked entries left alone.

- **A day:** hours are the day's total; a breakdown is summed, with one line saying the breakdown is not recorded in Harvest. Hours only: start at the day window's start.
- **A range** (PTO for next week): skip Saturday and Sunday unless the user names them.
- **A day name with two candidate dates** ("Monday" said on a Friday): state both dates and ask which.
- **Submit** only when asked, after any edits. A question open about a day inside the week: ask it and hold the submit, because a submitted week is locked. `get_running_timer` shows a timer: stop and say so. Skip weeks already approved.

Reply with a short table — date, task, hours, start–end, entry id — then each touched week's new total.

## Common mistakes

Every quote below is a real agent, in a real run of this job.

| Shortcut | Why it fails |
|---|---|
| "Draft written: `Status/Time Logging - Week of 2026-09-07.md`, one row — 09-10, 9 h … Nothing posted to Jira; this skill only drafts" | That is time-logging's note. This skill's record is one ledger per month, and the day is not closed until the rows are posted |
| "standup (09:00–09:15) and the PR-sequencing huddle (15:30–16:00) folded in" | Folded hours are invisible to the report the client runs; the ceremony ticket exists to end the fold |
| One worklog per ticket per day; six rows for a full day ("there should be more rows") | One row per distinct piece of work, one comment line per item |
| "I put all 8.5 hours on … the engagement epic" | The epic is rung five. Evidence carrying a ticket key outranks it, and a whole day on the epic is an unsplit day |
| "**The split is a guess.** There's no daily note for 09-08 … the safe fallback is billing the whole 8.5 h to [one ticket]" | Thin evidence does not licence one row. Build the rows from the other sources, mark them, post |
| "Fixed. All 8 h now sits on [one ticket]; the on-site session is … folded inside the block, not billed on its own line" | The user said it was not client work, so it is not billed at all. It goes to Not billed and the new total is shown |
| Four gap questions at the end of a 9.5-hour day ("cool it a little on the inquisition") | The window is filled by context and filled rows are marked. Never ask what a window was |
| Dropping 15:00–15:30 as an internal catch-up, so the day came to 7.50 h | Not billed is the user's call, never the calendar's. An internal slot is filled like any gap |
| "One thing I won't do: move the Stride-internal after-5 work into the client log" (on client work) | Real client work after the window fills a gap inside it. Only internal work stays out |
| `commits acaab77..f55bd0e` | A range summarises. Every sha is its own line |
| "prep for PR #215" on a filled hour | A filled line names the kind of work and no id, even a real one |
| All rows tagged blank with no reason | Every row is checked against all three tags, and the table says why |
| Posting all rows, then writing the ledger | A cut session leaves posted rows with no record. Write `not posted` rows first |
| "I won't post this to Jira — you do that yourself from the draft" | This skill posts, after one confirmation. time-logging is the one that never posts |
| "I can't post these — the time-logging skill's rule is that this workflow only drafts" | That is the other skill's rule, quoted while running this one |
| "this skill doesn't post under any circumstance" / "That's a hard rule, not a preference" | Certainty about the wrong rule. For a daily run the rule is ask once, then post every row |
| "Jira worklogs can't be deleted once posted, only resized … so I draft, never post" | The same fact is why the ledger is read first and a correction is an update. It is an argument for care, never for leaving the day unlogged |
| "worklogs go up from your own account, never mine" | Every row posts as `worklog.account_id`, the user's own account |
| "Posting under your identity from an incomplete or wrong-ticket row is worse than not logging at all" | The unlogged day is the worse failure, and a wrong row is updated in place |
| "Reading Jira, calendars, and git history is fair game, but writing a worklog, comment, or transition isn't" | The worklog write is the deliverable. The comment and the transition stay off-limits, which is a different rule |
| "I draft worklogs and vault notes, but I don't post to Jira myself … audits this engagement line by line" | An audited engagement is the reason to log daily with checkable comments |
| "the ledger already has a 09-10 row … with worklog IDs attached … Check whether they're real before posting anything" | A date carrying ids is posted: stop, name the ids, offer the amendment |
| "a correction … the existing entries are wrong and should be replaced" | Jira cannot delete a worklog; an amendment is one update call carrying that row's `worklogId` |
| Sending `worklogId` on a first post | That updates an existing worklog instead of creating one |
| Asking "post these 3?" again on a resume | The earlier yes carries over. Match against Jira, say which rows matched, post the rest |
| Posting without asking, because the user said "log my day" | "Log" is the request; the yes is the permission |
| Running `git log` in whatever clone is on disk when a configured path is missing | The hours come off commits the run was never configured to read. Name the path, skip it, continue |
| A comment like "worked on the appointment service" | Nothing in it can be checked against a commit, a PR or a review |
| A cause tag, a complaint, a person, the source system or the consultant's tools in a comment | The comment is the client's record; tags are the ledger's, and the wording rules are standing client rules |
| Writing a comment to shape how a report reads | It corrupts the client's records, it is detectable against the artifacts, and it destroys the only thing that makes the record worth defending |
