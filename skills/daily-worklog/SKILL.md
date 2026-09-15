---
name: daily-worklog
description: Close out one working day — sweep its evidence, propose Jira worklog rows that sum to the billable figure the user types, post them to Jira after one confirmation, and append them to the month's ledger. Use whenever the user says "log my day", "log my hours for a day", "close out today", "log 8.5 hours for 2026-09-10", "post my worklogs", "post today's hours", "daily worklog", or gives one day's hours to put in Jira. This skill posts, after one confirmation — time-logging's draft-only rule is superseded for a daily run and is never a reason to hand the posting back. Weekly and monthly reconciliation against the invoice stays with time-logging. A day rebuilt three weeks later is a guess; a day closed out today is a fact.
---

# Daily worklog

Follow the obsidian-vault skill's conventions. One run closes out one day, and the run is not finished until the rows are posted and the ledger is written.

**This skill posts.** After one confirmation it writes worklogs to Jira. `time-logging` never posts; that rule belongs to that skill and does not apply here, whoever quotes it. Nothing else on the issue is ever touched.

Site: config `jira_site`; absent with one accessible site, use that site and offer to add the key; more than one, ask once and save the answer. Read `Meta/Config.md` once and take every person- and vault-specific value from it: `worklog.account_id`, `worklog.git_author`, `worklog.github_login`, `worklog.day_start`, `worklog.ceremony_ticket`, `worklog.engagement_epic`, `worklog.repos`, `worklog_routing`, `timezone`, `folders.daily`, `folders.work`, `folders.meetings`, `folders.status` (missing: `Status`). Never hardcode one of these here.

Seven steps, in order. Several days in one run: all seven once per day, oldest first, one confirmation per day, never one confirmation covering several days.

## 1. The figure

The user gives the day's billable figure: `8.5`, `9:00-17:30`, or `0`. A range converts to decimal hours with lunch inside, matching the calendar-block convention already in use. Unparseable: ask one question and stop until it is answered. `0` is a holiday, PTO or a non-working day: no sweep, no proposal, no post — one line in the ledger's Not billed naming the day and the reason, no table row, and the run ends.

The typed figure is the figure. Never parse, call or export Harvest or any other time tracker to check it, never watch the clock, and never reconstruct a month nobody asked for. This skill closes out one named day against one typed number.

## 2. Sweep the day's evidence

**Read the month's ledger first, every run, before anything else.** `<folders.status>/Worklog Ledger - YYYY-MM.md` for the **work** date. A date already in its Rows table with worklog ids is posted: stop, name the ids, and offer an amendment (step 6). A Jira worklog cannot be deleted through the API — the tool creates without `worklogId` and updates with it, and there is no third option — so this file is the only thing between one repeated run and a permanently doubled month.

Then five sources, scoped to that one date in config `timezone`:

1. `<folders.daily>/<date>.md` — the spine. Its `- HH:MM` lines give the day's order and its clock times, which is where row start times and lengths come from.
2. `<folders.work>/*Work <date>.md` — coding depth. The `when | what | why | decided` rows carry the repo paths, commits and artifact ids the comment needs; the note's `jira` names the ticket. Read these notes; never write one.
3. `<folders.meetings>/` notes whose `date` is that date — `meeting_type` separates ceremonies from working sessions; topics and outcomes give the comment its closing clause.
4. `git log --author=<worklog.git_author>` bounded to the date in **each path in `worklog.repos` and no other repository**, with sha, time and subject. A configured path with no clone there: **name that path in the reply, skip it, and continue.** Never clone it, never fall back to another clone found on disk, and never bill an hour off commits from a repo the config did not name. A repo that was skipped is named in the reply every time, even when the day's rows came out fine without it. **Named in the reply means the path is spelled out in the chat message that ends the turn**, not only in a soft spot and not only in the ledger — a sentence of the form "`<path>` in `worklog.repos` has no clone on disk; git evidence for it was skipped." The soft spot is the ledger's record of the gap; the reply is the user's, and the user is the only one who can correct the path. A turn that swept a missing clone and does not say so in its own last message has hidden a hole in the evidence behind a table that looks complete.
5. Jira and GitHub activity: comments, transitions and issue activity by `worklog.account_id`; PR reviews, review comments, pushes and merges by `worklog.github_login`. **Read the user's own worklogs already on that date.** They are not evidence of work to log — they are work already logged, and they count against the typed figure.

## 3. Classify

One activity and one ticket per piece of evidence.

| Evidence | Activity |
|---|---|
| A work-note row that changed code | `coding` |
| A work-note row starting "Read" and ending "nothing changed"; a trace, a spike, an intake | `research` |
| A PR review, a review comment, a re-review | `review` |
| An environment rebuild, an import run, a release, a branch cut for deployment | `deploy` |
| A meeting whose `meeting_type` is `standup` or `refinement`, or whose title names a ceremony | `ceremony` |
| Any other meeting or working session | `meeting` |
| A QA report reproduced, seeded, screenshotted or answered | `qa-support` |
| A ticket description written or rewritten, a ticket raised, a board triaged | `admin` |

Eight activities, fixed: `coding` · `review` · `deploy` · `ceremony` · `meeting` · `research` · `qa-support` · `admin`. When two fit, the one that produced the artifact wins. Work done inside a ceremony's slot stays `ceremony`; the same work outside the slot is its own activity and its own row.

Ticket, by this ladder, first match wins:

1. A ceremony → `worklog.ceremony_ticket`, always its own row. This beats a ticket key: a standup that discussed a ticket is still ceremony time, and it is never folded into the day's feature ticket.
2. Evidence carrying a ticket key — the work note's `jira`, a branch name, a PR title, a commit message prefix, the issue a Jira comment sits on → that key.
3. A PR review with no key in its title → the ticket the PR implements, from the PR body or its linked issue. This is the preferred home, not a fallback: the hours went to that ticket's work, and Jira records the worklog's author either way, so per-person reporting is unchanged. Record a soft spot each time.
4. A `worklog_routing` rule whose `match` appears in the evidence text, case-insensitively → its `ticket`.
5. Engagement-level discovery with no single ticket, such as an on-site architecture session → `worklog.engagement_epic`. This is the fifth rung, not a home for a day that was not split.
6. An internal calendar event with client work running through it → the ticket that work was on (see below).
7. Nothing above → `unattributed`.

**The row records what the user was doing for the client, not which calendar event they sat in.** An internal meeting usually runs alongside client work: a build running, a PR under review, an environment being watched. A commit, a review, a test run or a deploy timestamped inside the slot is a row on its own ticket like any other. There is no absorption step, no day's-main-ticket rule and no threshold. The one boundary: **time genuinely spent on no client work is not billed**, and that call is the user's, never inferred from a calendar. When the user says a period was not client work, those hours leave the rows, go to Not billed, and get a soft-spots line.

Cause tags, optional, at most one per row, ledger only, never in a comment: `blocked` (hours went to waiting on or working around a decision, a person or an environment), `rework` (the same ground covered again because scope changed after the work was done), `unplanned` (the work arrived during the day and was not in the sprint). Tag a row when the tag is true of it; leave it blank otherwise.

## 4. Propose rows that sum exactly

One row per ticket per activity per day. Each row takes a start time from the evidence, falling back to `worklog.day_start`.

- Hours are decimal to two places, rounded to the nearest 0.25 h, never below 0.25 h. Evidence worth less merges into the nearest row on the same ticket, or into the largest row of the day when that ticket has no other row.
- The rows sum to the typed figure exactly. A residue of 0.25 h or less goes to the largest row; that is rounding, not attribution.
- A gap larger than 0.25 h is never closed by guessing. It becomes one row, ticket `unattributed`, activity and cause blank, no worklog id, and step 5 asks about it. **Never pad an existing row to close a gap**, and never size a row by subtraction from the typed figure — a balancing figure is padding with the arithmetic shown.
- Evidence exceeding the figure never raises the day's total. Merge same-ticket, same-activity evidence into one row, drop the smallest items until the sum matches, and list what was dropped in the day's soft spots.

## 5. Present and stop

Show the whole table — date, typed figure, and per row ticket, activity, cause, hours, start, comment — then the sum line, any `unattributed` row, any worklog already on that date as `pre-existing <id>`, and a preview of the soft spots the day will add.

A day already partly posted by hand: the worklogs the sweep found count against the typed figure, appear in the table as `pre-existing <id>`, and are appended to the ledger as rows. The proposal covers only the remainder, and no row is created that duplicates one already there.

**An `unattributed` row gets its own question first, before the confirmation question.** Name the hours and the window — "1.25 h unaccounted for between 14:00 and 16:00" — and ask what was happening. Rebuild the table from the answer and show it again, or, if the answer is that the period was not client work, move the hours to Not billed and ask for the corrected figure. Only a gap the user cannot account for survives as an `unattributed` row. Never guess the answer, and never skip the question because the gap looks small.

Then one question, naming the count: post these N worklogs? Nothing is sent until the user says yes, and nothing is written to the vault either — the ledger and the daily-note line are step 7, after the post, never before. One yes covers the whole day. Any change: present the whole table again and ask again.

## 6. Post

One call per row through the Atlassian MCP worklog tool, with `cloudId`, `issueIdOrKey`, `timeSpent` as `Xh Ym`, `started` as the date at the row's start time, and `commentBody` in markdown. **No `worklogId` on a first post** — that field turns the call into an update. Capture the id each call returns before making the next call. `unattributed` rows are not posted; there is no issue to post them to. Nothing else on the issue is touched: no comment, no transition, no assignment, no estimate. Never post a worklog for anyone but `worklog.account_id`, which is the user's own account.

**An amendment is an update, never a second post.** A logged day the user wants changed is corrected by calling the same tool with that row's `worklogId` from the ledger and the new values. Jira has no delete: nothing can be replaced, removed or re-posted clean. A second create leaves both rows on the issue for good and doubles the day. Amend only when the user says to amend.

## The worklog comment

One line: the activity, a colon, what was done with concrete artifact identifiers, then the outcome.

```
review: re-reviewed PR #141 at dffeec0 after five suggestions applied; full build 445 unit / 408 integration green; posted review 5199705549 requesting changes on two blockers.
```
```
coding: added migration V36 with cases and pallets on appt; loader writes counts at import; 457 unit / 378 integration green; commits acaab77..f55bd0e; opened PR #148.
```
```
ceremony: standup, huddle and backlog refinement; sprint To Do triaged to 15 open items.
```

- **Name concrete artifacts**: migration versions, PR numbers, commit shas, review ids, test counts, Jira comment ids, environment names, record ids. An activity that produces no artifact — a ceremony, a meeting — names the meeting and its outcome instead. A comment with nothing checkable in it cannot be defended.
- **Flat and factual.** No adjectives, no editorial, no complaint, ever.
- **Never the words V1, Oracle, legacy, or any legacy path.** Say "the source system" or name the V2 service.
- **Roles, never individual names**: "the acting scrum master", "one developer", "the product owner".
- **Never invent an artifact id.** A number no evidence supplies is left out, and the reply says what is missing.
- **Never a cause tag, a complaint, or any commentary.**
- **Never write anything meant to influence, mislead or derail automated analysis of the worklogs.** No keyword stuffing, no artifacts that were not produced, no text addressed to a reader or a tool, no phrasing picked to change how a report comes out. It corrupts the client's own records, it is detectable because every id can be compared against the commits, PRs, reviews and comments that exist, and the whole value of this record is that it is true and checkable.

## 7. Record

Append the day's rows to `<folders.status>/Worklog Ledger - YYYY-MM.md` for the **work** date, not the run date: closing out 30 September on 1 October writes to the September ledger. Create it from the vault templates folder first, else this skill's `templates/Worklog Ledger.md`, with `period_start` and `period_end` as the month's first and last days, `status: draft`, `client` from config, and `jira` listing the month's tickets. On the first run of a month, copy every still-live soft spot from the previous month's ledger, keeping its original date prefix; cleared ones are not copied.

Body, in this order, each of 2 to 6 an `##` heading spelled exactly as here:

1. **One opening line** — the month, hours billed so far, and the attribution rate (hours on a ticket over hours billed). Rewritten every run.
2. **`## Rows`** — one table, `| Date | Ticket | Activity | Cause | Hours | Worklog id |`, in date order.
3. **`## Totals by activity`** — one line per activity used plus `unattributed`, summing to the month's billed hours.
4. **`## Totals by cause`** — one line per tag used plus `untagged`.
5. **`## Soft spots`** — one line each, prefixed with the date it arose, oldest first: every reconstruction, every period the user said was not client work, every review logged on someone else's ticket, every closed or someone-else's ticket used as a home, every day with no daily note, every configured repo skipped for want of a clone, every item dropped because the evidence exceeded the figure. Each says what happens if it is challenged and how to fix it.
6. **`## Not billed`** — holidays, PTO, periods the user said were not client work, hours worked beyond the billed block.

Worklog id column: an integer; `not posted` for a row drafted but not sent; `—` for an `unattributed` row; `pre-existing <id>` for a worklog already on the issue for that date before this run.

Appending a day never rewrites an earlier one. Two exceptions: filling a `not posted` id once the row posts, and an amendment, which keeps its id and its place and gains ` (amended YYYY-MM-DD)` after the hours. The four totals sections are derived and recomputed in full every run. Soft spots only ever append; a cleared one gains ` — cleared YYYY-MM-DD`.

Then one line under `## Log` in the **work** date's daily note — `<folders.daily>/<work date>.md`, the same date the rows are for — creating that note if the day has none. Never the run date's note: closing out 10 September on 14 September writes the line into 10 September's note, and putting it in today's note instead leaves the day it describes with no record and stamps a day nobody logged.

`- HH:MM worklogs posted for 2026-09-14: 8.50 h across 4 rows → [[Worklog Ledger - 2026-09]]`

The note and the date inside the line are both the work date. Only `HH:MM` is the time of the run.

## When something is missing

One line in chat each. **No Atlassian MCP or the site unreachable:** present the proposal, write the rows to the ledger with `not posted` in the id column, say which rows still need posting; the next run posts exactly those. **The post fails partway:** write every id already obtained to the ledger before anything else, mark the rest `not posted` with the reason in soft spots, and stop — never retry automatically, because a retry that duplicates a row cannot be undone. **One row rejected, several rows rejected, or every row in the day rejected:** each rejected row stays `not posted` with the reason in soft spots; whatever is not rejected still posts, and when every row is rejected none does — that is not a reason to stop short of step 7. **No vault or no config:** point at vault-init and stop; nothing posts without a ledger. **No `worklog.ceremony_ticket` and the day has ceremony evidence:** stop before the proposal and ask for the key — a missing config key is a config error, not an unaccounted gap. **A repo in `worklog.repos` with no clone:** name it, skip it, continue. **More than one accessible site and no `jira_site`:** ask once, save the answer.

In every branch above — nothing reachable, a partial failure, one row rejected or every row in the day rejected — step 7 still runs: the ledger still gets its rows, `not posted` where nothing posted, and the daily note still gets its `## Log` line. That line's N is every row in the day's table, posted or `not posted`, never a count of only the rows that posted; a day where every post was refused still gets its ledger rows and its daily-note line, exactly like a day that posted clean.

A ticket that is Closed or belongs to someone else is a home, not a blocker: post to it, because that is where the work went and Jira accepts worklogs in every status. Add a soft-spots line naming the ticket, its status or assignee, and the alternative home, normally the parent epic. Never move hours to a ticket the work was not for, and never raise a ticket to hold hours.

A ceremony is logged at its actual length, not its scheduled length. One that ran more than double its slot, or a day whose ceremony total passed 2 h, gets a soft-spots line naming the meeting note and the scheduled length. A ceremony that turned into working a ticket is two rows, split at the time the daily or meeting note gives.

A day with no daily note and thin evidence still gets rows: sweep the other four sources, propose, mark every reconstructed row in soft spots with what it was reconstructed from, and post. The day total is what the user typed and is safe; the split is the challengeable part, and both worklogs can be resized in place by update. A reconstructed split beats an unlogged day.

**A day with no daily note always gets its own soft-spots line, before any other line for that day**, saying that no daily note exists and naming every source the split was rebuilt from — the meeting notes, the commits, the existing worklogs, the PR activity. That line is not optional and is not replaced by a line about something else that went wrong on the day; a reconstruction nobody recorded reads as a timed split six months later, and the one thing that makes it defensible is the sentence saying it was rebuilt and from what.

## Common mistakes

Every quote below is a real agent, in a real run of this job, without this skill.

| Shortcut | Why it fails |
|---|---|
| "Draft written: `Status/Time Logging - Week of 2026-09-07.md`, one row — 09-10, 9 h … Nothing posted to Jira; this skill only drafts" | That is time-logging's note and its table has no Activity and no Cause column. This skill's record is one ledger per month, appended a day at a time, and the day is not closed until the rows are posted |
| "standup (09:00–09:15) and the PR-sequencing huddle (15:30–16:00) folded in" | The ceremony ticket exists now; folded hours are invisible to the report the client runs, and ending the fold is the whole point of the ticket |
| One worklog per ticket per day | The client asked for coding, deploys, reviews, meetings and research as separate entries |
| "I put all 8.5 hours on … the engagement epic, matching how the prior week handled architecture/discovery time with no single story" | The epic is rung five of the ladder. Evidence carrying a ticket key outranks it, and a whole day on the epic is an unsplit day, not a routing decision |
| "1.5h new … This is a balancing figure (9 − 7.5), not a timestamped duration, since the daily note has no end time for that review" | A balancing figure is padding with the arithmetic shown. A shortfall over 0.25 h is an `unattributed` row and a question |
| "The … 0.5 h is a guess; the log has no end time for that review" | No end time is missing evidence. Size the row from evidence or leave the hours unattributed; never size it from what is left over |
| "The on-site session's 1 h is inferred from a gap in the timeline — the daily note links to a meeting note that doesn't exist in the vault" | A gap is step 5's question, not a row to quietly fill. Ask what was happening in that window before asking to post |
| "**The split is a guess.** There's no daily note for 09-08 … the safe fallback is billing the whole 8.5 h to [one ticket]" | Thin evidence does not licence one row. Propose the split, mark every reconstructed row in soft spots, and post; the total is what the user typed and the split can be resized in place |
| "the split is an estimate (no clock times in the daily note for those blocks) — flagged in Soft spots along with how to rebalance if challenged" | A soft spot records a reconstruction. It does not licence a guess while the user is right there to be asked |
| "Drafted 8 hours for … all to [one ticket]" when the evidence stops at 14:05 | Four unevidenced hours are a gap. Ask about the window; never stretch the last row across it |
| "Fixed. All 8 h now sits on [one ticket]; the on-site session is flagged as … offsite time folded inside the block, not billed on its own line" | The user said it was not client work, so it is not billed at all. The hours leave the rows, go to Not billed, and the corrected figure is asked for — folding them inside the block bills them anyway |
| "I won't post this to Jira — you do that yourself from the draft" | This skill posts, after one confirmation. time-logging is the one that never posts |
| "I can't post these — the time-logging skill's rule is that this workflow only drafts. Worklogs, comments, and transitions get posted by you, not me" | That is the other skill's rule, quoted while running this one. Check which skill is running before obeying its constraints |
| "this skill doesn't post under any circumstance — 'the user posts from the draft' is a hard rule here, not a default I can waive on request" | Nothing here needs waiving: for a daily run the rule is ask once, then post every row |
| "That's a hard rule, not a preference" / "by design, not a limitation I can turn off" | Certainty about the wrong rule. The mandate is a daily post; refusing it leaves the day unlogged |
| "Jira worklogs can't be deleted once posted, only resized … so I draft, never post" | The same fact is why the ledger is read first and why a correction is an update. It is an argument for care, never for leaving the day unlogged |
| "worklogs go up from your own account, never mine" | Every row posts as `worklog.account_id`, which is the user's own account. Nothing here authors a worklog as anyone else |
| "Posting under your identity from an incomplete or wrong-ticket row is worse than not logging at all" | Under a daily mandate the unlogged day is the worse failure, and a wrong row is updated in place. Show the table, ask, post |
| "Reading Jira, calendars, and git history is fair game, but writing a worklog, comment, or transition isn't" | The worklog write is the deliverable. The comment and the transition stay off-limits, which is a different rule |
| "I draft worklogs and vault notes, but I don't post to Jira myself — that's a hard rule … audits this engagement line by line, and a bad worklog can't be deleted" | An audited engagement is the reason to log daily with checkable comments, not a reason to hand the posting back |
| "the ledger already has a 09-10 row for these same three tickets — with worklog IDs attached … Check whether they're real before posting anything — if they are, 09-10 is already logged and my draft would double it" | The ledger is the record, not a rumour to be verified by the user. A date carrying ids is posted: stop, name the ids, offer the amendment. Never draft the duplicate and hand the check back |
| "a correction … the existing entries are wrong and should be replaced" | There is nothing to replace. Jira cannot delete a worklog; an amendment is one update call carrying that row's `worklogId` |
| Sending `worklogId` on a first post | That makes it an update of an existing worklog instead of a new one |
| Skipping the ledger read because this run is a fresh one | There is no delete; the month doubles permanently. Read the ledger first, every run |
| Posting without asking, because the user said "log my day" | "Log" is the request; the yes is the permission, and a worklog cannot be deleted |
| Guessing what the missing 1.5 h was | Ask, in the same turn, before the confirmation question. A gap resolved at month end is resolved from a three-week-old memory |
| Running `git log` in whatever clone is on disk when a configured path is missing | The hours then come off commits the run was never configured to read, and nobody is told. Name the missing path, skip it, continue |
| A comment like "worked on the appointment service" | Nothing in it can be checked against a commit, a PR or a review |
| A cause tag or a complaint in the comment | The comment is the client's record; the tags are the ledger's |
| Naming a person or the source system in a comment | Standing client rules: roles only, and no decommission-optics words |
| Writing a comment to shape how a report reads | It corrupts the client's records, it is detectable against the artifacts, and it destroys the only thing that makes the record worth defending |
