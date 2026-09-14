# daily-worklog — design

**Status: settled 2026-09-14. Ready for an implementation plan.**

## Goal

A skill for the `consultant-vault` plugin that closes out one working day: the user types the day's billable figure, the skill sweeps the day's evidence, proposes worklog rows that sum to that figure exactly, waits for one confirmation, posts every row to Jira, and appends the result to a running month ledger. The day is done in one exchange, and the ledger is the record that proves it later.

## Why

On 2026-09-14 the client's VP of Technology issued a mandate. After the on-site demo he ran reports across Jira and GitHub comparing hours logged, lines of code and commits by person. From now on every billable hour is logged in Jira daily — end of day or first thing the next morning — with a comment saying what was worked on. Coding, deploys, PR reviews, meetings and research are separate entries. The invoice must match Jira exactly or he will not pay it.

The existing `time-logging` skill cannot meet this. It drafts weekly or monthly, folds ceremonies into feature tickets, writes one worklog per ticket per day, and never posts. All four break under the mandate. Reconstructing a week from evidence on Friday is also a different job from closing out today: on Friday the evidence has gone cold, and the split between rows becomes guesswork that shows up in the note as soft spots. Done daily, the evidence is still warm and the rows are facts.

A ticket for ceremony time now exists: **PFD-66613 "Sprint Ceremonies"**, a Task in PFD, Open, label `PhenixV2_Stride`, description "Meetings for sprint related topics", unassigned. Before it existed, ceremony hours had nowhere to go and were folded invisibly into feature tickets. They now have a home.

## Decisions taken

| Question | Decision |
|---|---|
| Name and place | `daily-worklog`, alongside `time-logging`, not replacing it. Daily push and running ledger here; invoice reconciliation and audit defence there. |
| Input | The user types the day's billable figure. No Harvest parsing, no Harvest API. |
| Cadence | One run per day, per day. Catching up three days is three runs. |
| Posting | The skill posts, after one confirmation that covers the whole day. |
| Granularity | One worklog per ticket per activity per day. |
| Ceremonies | Their own rows on the ceremony ticket from config. |
| Second axis | Three factual cause tags on any row, ledger-only, never in a Jira comment. |
| The record | `Status/Worklog Ledger - YYYY-MM.md`, `type: time-log`. No new note type. |
| Audience | Built for one consultant, shaped for the team. Every person- and vault-specific value is a config key. |
| Writing | Plain language. Comments are flat and factual, with concrete artifact ids and no editorial. |
| Stride-internal meetings | **Changed from the first draft.** That draft absorbed internal time into the day's main ticket under a 30-minute threshold. Dropped: there is nothing to absorb. The consultant is normally working through those meetings — a build running, a PR under review, work being watched — so the client work continued and is logged as that work. |

## Scope

In scope: closing out one day. Evidence sweep, classification, routing, the proposal, the post, the ledger, the daily-note line.

Non-goals, each for a reason:

- **Harvest.** No parsing, no API call, no export read. Harvest is Stride's internal time tracking. It stays coarse on purpose: one block per day, Task "Billable Time", empty Notes. The client's mandate is about Jira, and making Harvest granular would create a second granular record that has to agree with Jira for no benefit. The user's typed figure is the Harvest figure; the skill takes it on trust.
- **Invoice reconciliation.** `time-logging` owns the month-end comparison of Jira against the invoice source.
- **Any Jira write other than a worklog.** No comments on issues, no transitions, no ticket creation, no assignment, no estimate changes. The post sends only the fields listed in step 6 and changes nothing else on the issue.
- **Worklogs for anyone else.** The API does not permit it and the skill never tries.
- **Backfill.** Months before the mandate are not reconstructed.
- **A timer.** The skill does not watch the clock. It reconstructs a day from evidence against a figure the user supplies.

## Config keys

All person- and vault-specific values live in `Meta/Config.md`. Nothing in this list is hardcoded in the skill body. Names follow the note's existing style: snake_case top-level keys, one nested map for a related group, one list of `match` maps for a rule table.

```yaml
jira_site: uscold.atlassian.net
worklog:
  account_id: 712020:b977ba09-5d5f-49ca-8650-ea9b286cea6e
  git_author: dbetty@uscold.com
  github_login: deanbetty
  day_start: "09:00"
  ceremony_ticket: PFD-66613
  engagement_epic: PFD-65246
  repos:
    - ~/Code/StrideClients/UsCold/phenix.appointments
    - ~/Code/StrideClients/UsCold/phenix.ui
worklog_routing:
  - match: "profile shell"
    ticket: PFD-64953
```

- `jira_site` — required by this skill; it resolves the cloud id from this value once per run. Absent with exactly one accessible site: use that site and offer to add the key, same precedent as ticket-intake. More than one: ask once, then save.
- `worklog.account_id` — the Jira account whose worklogs and activity this skill reads and writes. One account only.
- `worklog.git_author` — the `git log --author` filter.
- `worklog.github_login` — the account whose PR reviews, review comments and merges count as this person's.
- `worklog.day_start` — the fallback start time for a row when no evidence gives one.
- `worklog.ceremony_ticket` — where ceremony rows go.
- `worklog.engagement_epic` — where engagement-level discovery with no single ticket goes.
- `worklog.repos` — the clones swept by `git log`. A path with no clone is named in the reply and skipped.
- `worklog_routing` — ordered client-specific rules, `match` against the evidence text case-insensitively, `ticket` a literal key. Empty by default. It must not restate the ceremony or epic rules; those are named keys.

The ledger folder is `folders.status`, falling back to `Status`. No new folder key.

### `match:` is the spelling, and what the live config is missing

Verified on 2026-09-14, recorded here so the implementation does not have to re-derive it:

- The shipped template `skills/obsidian-vault/templates/Config.md` uses `match:` in its rule maps. The live vault's `meeting_type_rules` block uses `pattern:` across nine rules. The two spellings drifted apart in the vault, not in the skills.
- `skills/granola-sync/SKILL.md` is the only skill that reads those rules, and it describes them only as "a list of title pattern → type". It hardcodes neither spelling, so renaming the live keys breaks nothing.
- This skill therefore standardises on `match:` for `worklog_routing`, and the vault's `meeting_type_rules` keys are renamed to `match:` so one vault has one spelling.
- `jira_site` is required here and is absent from the live config. The value is `uscold.atlassian.net`, cloud id `6578133e-cf54-46f3-9b16-5d7496b647a8`. The shipped template carries the key but leaves it empty, so a fresh vault is fine and only this one needs the value filled in.
- The live config is also missing the template's documentation lines for `jira_site` and `folders.tickets`, which makes it a drifted older copy of the template. Noted so it is on the record; bringing it back in line is not this skill's job and is not in its scope.

## The daily run

Seven steps, in order.

### 1. The figure

The user gives the day's billable figure: `8.5`, `9:00-17:30`, or `0`. A range is converted to decimal hours, lunch inside, matching the calendar-block convention already in use. Anything unparseable gets one question. A figure of `0` ends the run at step 2 (see Edge cases).

### 2. Evidence sweep

Scoped to that one date, in the config `timezone`. Five sources:

1. **The daily note**, `<folders.daily>/<date>.md`. The spine. Its `- HH:MM` log lines give the day's order and its clock times, which is where row start times and durations come from.
2. **Work notes**, `<folders.work>/*Work <date>.md`. Coding depth. The `when | what | why | decided` rows carry the repo paths, commits and artifact ids the worklog comment needs, and the note's `jira` names the ticket.
3. **Meeting notes**, `<folders.meetings>/` where `date` is that date. `meeting_type` separates ceremonies from working sessions; topics and outcomes give the comment its closing clause.
4. **Git**, `git log --author=<worklog.git_author>` bounded to the date across `worklog.repos`, with SHA, time and subject.
5. **Jira and GitHub activity.** Jira comments, transitions and issue activity by `worklog.account_id`; GitHub PR reviews, review comments, pushes and merges by `worklog.github_login`. **The user's existing worklogs on that date are read here.** They are not evidence of work to log; they are work already logged, and they count against the typed figure.

### 3. Classify

Each piece of evidence gets one activity and one ticket.

Activity, by what the evidence is:

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

When two fit, the one that produced the artifact wins. Work done inside a ceremony's slot stays `ceremony`; the same work done outside the slot is its own activity and its own row.

Ticket, by this ladder, first match wins:

1. A ceremony → `worklog.ceremony_ticket`. This beats a ticket key: a standup that discussed PFD-65947 is still ceremony time.
2. Evidence carrying a ticket key — the work note's `jira`, a branch name, a PR title, a commit message prefix, the issue a Jira comment sits on → that key.
3. A PR review with no key in its title → the ticket the PR implements, read from the PR body or its linked issue.
4. A `worklog_routing` rule matching the evidence text → its ticket.
5. On-site architecture sessions and other engagement-level discovery with no single ticket → `worklog.engagement_epic`, per the August precedent.
6. A Stride-internal calendar event with client work running through it → the ticket that work was on, see below.
7. Nothing above → `unattributed`.

**Review of someone else's PR routes to the ticket the PR implements.** This is the preferred home, not a fallback. The hours were spent on that ticket's work, so that is where they belong, and the client's mandate asks for review to be a separate entry rather than a line folded into the reviewer's own ticket. It is established accepted precedent, used for PFD-65772 and PFD-63654 and accepted both times.

Per-person reporting is unaffected. Jira records the author of every worklog, so the client's report of hours by person reads the same wherever the hours sit. Only a per-ticket rollup mixes contributors, and that is already true of any ticket that was reviewed by someone other than its author. The ledger still records a soft spot each time, so the month-end note can explain the arrangement in one line without reconstructing it.

**The row records what the consultant was actually doing for the client, not which calendar event they were sitting in.** A Stride-internal meeting — a community of practice, a town hall, vault work, a team session — usually runs alongside client work: a build is running, a PR is under review, an environment is being watched. That work is client work and is logged as that work, on that work's ticket, with the artifacts it produced. There is no absorption step, no day's-main-ticket rule and no threshold. The evidence decides: a commit, a review, a test run or a deploy timestamped inside the meeting slot is a row on its ticket like any other.

One boundary, and it is the thing that makes the whole record survive an audit: **time genuinely spent on no client work is not billed.** An hour fully engaged in an internal career conversation is not a billable hour, whatever else was on screen. That call is the user's to make, not something the skill infers from a calendar. When the user says a period was not client work, those hours come out of the day's rows and go to the ledger's Not billed section, and a soft-spots line records it. The soft spot fires on the user saying so and on nothing else.

### 4. Propose rows that sum exactly

One row per ticket per activity. Rows carry a start time taken from the evidence, falling back to `worklog.day_start`.

- Hours are decimal to two places, rounded to the nearest 0.25 h. A row is never smaller than 0.25 h; evidence worth less merges into the nearest row on the same ticket, or into the largest row of the day when that ticket has no other row.
- The rows must sum to the typed figure exactly. A rounding residue of 0.25 h or less goes to the largest row. That is rounding, not attribution.
- A gap larger than 0.25 h is never closed by guessing. It becomes one row with ticket `unattributed`, activity and cause blank, and no worklog id, and step 5 asks the user about it. **Never pad an existing row to close a gap.**
- Cause tags are set here, on any row, where true.

### 5. Present and stop

Show the full table: date, typed figure, and per row ticket, activity, cause, hours, start, comment. Then the sum line, any `unattributed` row, any existing worklogs already on that date, and a preview of the soft spots this day will add.

**An `unattributed` row gets its own question first, before the confirmation question.** Name the hours and the window they sit in — "1.25 h unaccounted for between 14:00 and 16:00" — and ask what was happening. The answer either produces a row, in which case the table is rebuilt and shown again, or says the period was not client work, in which case the hours move to Not billed and the day's billable figure is retyped. Only a gap the user cannot account for when asked survives as an `unattributed` row. The reason for asking now: a gap resolved at month end is resolved from a memory three weeks cold, which is exactly the reconstruction this skill exists to stop.

Then one question: post these N worklogs? Nothing is sent until the user says yes. One yes covers the whole day. If the user changes anything, present the whole table again and ask again.

### 6. Post

One call per row through the Atlassian MCP worklog tool, with `cloudId`, `issueIdOrKey`, `timeSpent` as `Xh Ym`, `started` as the date at the row's start time, and `commentBody` in markdown. No `worklogId` on a first post — that field is what makes the call an update instead of a create. Capture the id each call returns before making the next call.

`unattributed` rows are not posted. There is no issue to post them to.

### 7. Record

Append the day's rows to `<folders.status>/Worklog Ledger - YYYY-MM.md` for the **work** date, not the run date, creating the ledger if the month has none. Then add one line to the daily note under `## Log`:

`- HH:MM worklogs posted for 2026-09-14: 8.50 h across 4 rows → [[Worklog Ledger - 2026-09]]`

## Activities

Eight, fixed. The five the client named plus three that describe the rest of the weeks honestly.

`coding` · `review` · `deploy` · `ceremony` · `meeting` · `research` · `qa-support` · `admin`

The client named coding, deploys, PR reviews, meetings and research. `ceremony` splits standups, huddles, refinement, sprint planning and retros out of `meeting`, because they are the recurring cost and they now have their own ticket. `qa-support` splits reproducing and unblocking QA out of `coding`, because it is not development on the ticket. `admin` covers ticket and board housekeeping — a description rewritten, a ticket raised, a board triaged — which is neither coding nor research. The ledger aggregates by these eight and by nothing else.

## Cause tags

Three, optional, at most one per row, a second axis on top of the activity.

| Tag | Means |
|---|---|
| `blocked` | The hours went to waiting on, or working around, a decision, a person or an environment that was not available. |
| `rework` | The same ground was covered again because scope or requirements changed after the work was done. |
| `unplanned` | The work arrived during the day and was not in the sprint. |

These are factual descriptors of a row, not opinions about the engagement. Tag a row when the tag is true of it and leave it blank otherwise. The point is that the month-end total is then self-evident from accurate data, rather than depending on anyone writing a commentary about how the month went.

Cause tags live in the ledger only. They never appear in a Jira worklog comment.

## The worklog comment

One line. Activity first, then what was done with concrete artifact identifiers, then the outcome.

```
review: re-reviewed PR #141 at dffeec0 after five suggestions applied; full build 445 unit / 408 integration green; posted review 5199705549 requesting changes on two blockers.
```

More worked examples:

```
coding: added Flyway V36 with cases, pallets and two nullable weight columns on appt; loader writes counts at import; 457 unit / 378 integration green; commits acaab77..f55bd0e; opened PR #148.
```
```
ceremony: standup, huddle and backlog refinement; sprint To Do triaged to 15 open items.
```
```
deploy: rebuilt the pfd-65947 environment database and re-ran the import for warehouses 266259 and 103253; appointment 2000000 detail verified against the seeded counts.
```
```
research: traced where cases, pallets and the two gross weights are produced today and what the service stores and serves; findings posted as comment 547017.
```
```
qa-support: traced the "no data" report to the warehouse default; built a working example at Warsaw (appointment 2000000, edit 293471) with screenshots; replied on comments 547262 and 547264.
```
```
admin: rewrote the description to the agreed scope with weights in Out of Scope and posted it; raised PFD-66519 for the split-out work.
```

Rules, all hard:

- **Name concrete artifacts.** Migration versions, PR numbers, commit SHAs, review ids, test counts, Jira comment ids, environment names, record ids. An activity that produces no artifact — a ceremony, a meeting — names the meeting and its outcome instead. A comment with nothing checkable in it is a comment that cannot be defended.
- **Flat and factual.** No adjectives, no editorial, no complaint, ever. Not "finally", not "unfortunately", not "significant".
- **Never the words V1, Oracle, legacy, or any legacy path.** Standing client rule, decommission optics. Say "the source system" or name the V2 service.
- **Roles, never individual names.** "the acting scrum master", "one developer", "the product owner".
- **Never write anything intended to influence, mislead or derail automated analysis of the worklogs.** No keyword stuffing, no artifacts that were not produced, no text addressed to a reader or a tool, no phrasing chosen to change how a summary or a report comes out. Three reasons, and each is sufficient on its own: it corrupts the client's own records, which is the thing the client is paying for; it is detectable, because every comment names artifacts that can be compared against the commits, PRs, reviews and comments that exist; and the entire value of this record is that it is true and checkable, which is what makes it worth defending when someone challenges an invoice.

## The ledger

`<folders.status>/Worklog Ledger - YYYY-MM.md`. One per calendar month.

Frontmatter, per the property schema, no new type and no new keys:

```yaml
type: time-log
client: uscold
created: 2026-09-14
period_start: 2026-09-01
period_end: 2026-09-30
status: draft
jira:
  - PFD-66613
  - PFD-65947
topics:
  - worklogs
  - billing
```

`status` is `draft` while the month is open. `time-logging` sets it to `posted` at month close, when every row in the table carries a worklog id — which means every `unattributed` row has been resolved, either attributed to a ticket and posted or moved to Not billed. An `unattributed` row should be rare, because step 5 asks about every gap on the day it arises; one that reaches the ledger is a gap the user could not account for while it was fresh, and month end is unlikely to do better.

Body:

1. **One opening line** — the month, the hours billed so far, and the attribution rate (hours on a ticket over hours billed).
2. **Rows** — one table, columns `Date | Ticket | Activity | Cause | Hours | Worklog id`, in date order.
3. **Totals by activity** — one line per activity used, plus a final `unattributed` line, summing to the month's billed hours.
4. **Totals by cause** — one line per tag used, plus `untagged`.
5. **Soft spots** — one line each, prefixed with the date it arose, oldest first, in the same spirit as the weekly note it replaces: every reconstruction, every period the user said was not client work, every review logged on someone else's ticket, every closed ticket used as a home, every day without a daily note. Each says what happens if it is challenged and how to fix it.
6. **Not billed** — holidays, PTO, periods the user said were not client work, hours worked beyond the billed block.

Worklog id column values: an integer id; `not posted` for a row drafted but not sent; `—` for an `unattributed` row; `pre-existing <id>` for a worklog that was already on the issue for that date before this run.

### Appending a day without rewriting earlier days

- New rows append to the end of the Rows table. A day already in the table is never rewritten, with two exceptions: filling a `not posted` id once the row posts, and an amendment (below).
- The four totals sections are derived from the table and are recomputed in full on every run. Recomputing a derived section is not rewriting a day.
- Soft spots append. Nothing is ever deleted from that section; a soft spot that has been cleared gains " — cleared YYYY-MM-DD".
- An amended row keeps its worklog id and its place, and gains ` (amended YYYY-MM-DD)` after the hours.
- The opening line is rewritten every run.

## Guardrails

- **Never pad.** A shortfall over 0.25 h is an `unattributed` row.
- **Never post without the user's confirmation for that day.** Step 5 always happens.
- **Never re-post a row the ledger already shows with a worklog id.** Read the ledger before posting, every run.
- **Never post for a date the ledger already shows as posted**, unless the user explicitly says to amend, in which case the call carries `worklogId` and is an update.
- **Never author a worklog as another person.**
- **Never invent an artifact id.** If the comment needs a number that no evidence supplies, leave it out and say what is missing.
- **Never write a cause tag, a complaint, or any commentary into a Jira comment.**

The reason the ledger check is unconditional: **a Jira worklog cannot be deleted through the API.** The tool creates when `worklogId` is absent and updates when it is present. There is no third option. A wrong post is permanent and can only be corrected by updating it to the right values, so the ledger is the only thing standing between one duplicated run and a permanently doubled month. Jira does accept worklogs on issues in QA and Closed states, so a closed ticket is never the reason a post fails.

## Edge cases

- **No daily note and thin evidence** — this happened on 2026-09-08. Sweep the other four sources, propose the rows anyway, and mark every reconstructed row in the soft spots with what it was reconstructed from. The day total is what the user typed and is safe; the split between rows is the part that can be challenged, and the fix is that both worklogs can be resized in place by update. Post it: a reconstructed split beats an unlogged day under a daily mandate.
- **Holiday or PTO** — the user types `0`. No sweep, no proposal, no post. One line in the ledger's Not billed section naming the day and the reason. No table row, so the month totals stay equal to hours billed.
- **A gap the evidence cannot fill** — step 5 asks about it before asking to post. The answer produces a row, or moves the hours to Not billed, or leaves the gap standing as an `unattributed` row when the user cannot say. Never guess an answer on the user's behalf and never skip the question because the gap is small; the 0.25 h floor decides what counts as a gap, not how interesting it looks.
- **Evidence exceeds the typed figure** — never raise the day's total to fit the evidence. Merge evidence of the same ticket and activity into one row, then drop the smallest items until the sum matches, and list what was dropped in the day's soft spots. If the user thinks the figure is wrong, they retype it at step 5 and the whole day is re-proposed.
- **A day already partly posted by hand** — the step 2 sweep reads the user's existing worklogs for that date. They count against the typed figure, appear in the proposal as `pre-existing <id>`, and are appended to the ledger as rows. The proposal covers only the remainder. No row is created that duplicates one already there.
- **A ceremony that ran long** — log its actual length, not its scheduled length. Where a single ceremony ran more than double its slot, or the day's ceremony total passed 2 h, add a soft-spots line naming the meeting note and the scheduled length. A ceremony that turned into working a ticket is two rows: the ceremony part on the ceremony ticket, the work part on the ticket, split at the time the daily note or meeting note gives.
- **A ticket that is Closed or belongs to someone else** — post to it, deliberately. It is where the work went, Jira accepts worklogs in every status, and the worklog author is recorded either way so per-person reporting is unchanged. Add a soft-spots line naming the ticket, its status or assignee, and the alternative home if the arrangement is ever questioned, which is normally the parent epic. Never move hours to a ticket the work was not for, and never raise a ticket to hold hours.
- **First run of a month** — create the ledger from the template with `period_start` and `period_end` set to the month's first and last days and `status: draft`. Copy every still-live soft spot from the previous month's ledger into the new one, keeping its original date prefix. Cleared soft spots are not copied.
- **A Stride-internal meeting inside the billed block** — no special handling. Look at what was running: a commit, a review, a test run or a deploy timestamped inside the slot is a row on its own ticket. The only case that changes anything is the user saying the period was not client work, which moves those hours to Not billed, drops the day's billable figure, and writes a soft-spots line.
- **A day at a month boundary** — the rows go in the ledger for the work date. Closing out 30 September on 1 October writes to `Worklog Ledger - 2026-09`.
- **Several days in one run** — run all seven steps once per day, oldest first, with one confirmation per day. Never one confirmation covering several days.

## Failure cases

One line in chat each.

- **Atlassian MCP absent or the site unreachable** — present the proposal, write the rows to the ledger with `not posted` in the id column, and say which rows still need posting. The next run posts exactly those.
- **The post fails partway** — write every id already obtained to the ledger before anything else, mark the rest `not posted` with the reason in soft spots, and stop. Never retry automatically; a retry that duplicates a row cannot be undone.
- **One row rejected** (issue not found, no permission) — that row stays `not posted`, the reason goes in soft spots, the rest of the day posts.
- **Vault unresolvable or config missing** — point at vault-init and stop. Nothing posts without a ledger, because the ledger is the double-post guard.
- **No `worklog.ceremony_ticket` in config, and the day has ceremony evidence** — stop before the proposal and ask for the key. A missing config key is a config error, not an unaccounted gap: routing it into `unattributed` would put the step-5 question to the user when the honest answer is "ceremonies, no ticket key configured", which they cannot act on from that prompt. Never guess a ticket.
- **A repo in `worklog.repos` has no local clone** — name it, skip it, continue. Never clone.
- **The figure will not parse** — one question, then stop until it is answered.
- **More than one accessible Atlassian site and no `jira_site`** — ask once, save the answer to config.

## How it sits with the other skills

### time-logging

The two split by job. `daily-worklog` does the daily push and owns the ledger. `time-logging` does weekly and monthly invoice reconciliation and audit defence, and from now on **reads this skill's ledger rather than reconstructing the period from evidence**. The ledger already has the rows, the ids and the soft spots; the month-end note adds the invoice comparison, the attribution rate and the Not-in-Jira account, and sets the ledger's `status` to `posted` when the month closes clean.

Four `time-logging` rules are superseded for daily work:

| time-logging rule | For daily work | Still true for time-logging |
|---|---|---|
| Draft weekly or monthly | Superseded. One run per day. | Its own note is still per week or per month. |
| Ceremonies fold into the day's main ticket | Retired from the first run onward — the ceremony ticket exists now. | Its month-end note still explains folded hours for days already posted that way, before 2026-09-14. |
| One worklog per ticket per day | Superseded. One per ticket per activity per day. | Its month-end note may group rows back to one line per ticket per day if the client asks for that shape; the worklogs stay split. |
| Never post | Superseded here, after confirmation. | `time-logging` still never posts. It reads ids from the ledger. |

One more differs rather than being superseded: `time-logging` treats a Closed or someone else's ticket as a soft spot, not a home. This skill treats it as the right home, because that is where the work went and Jira attributes the worklog to its author regardless. The soft spot is still recorded, and `time-logging` still names the alternative home at month end.

### work-chart

The richest evidence source. Its `when | what | why | decided` rows are already the day's coding work in plain language with the repo paths, commits and artifact ids a worklog comment needs, and its `jira` gives the ticket. This skill reads work notes and never writes them. A day with work notes needs almost no reconstruction; a day without them is the thin-evidence case.

### obsidian-vault

All conventions come from there: vault resolution, `Meta/Config.md` read once per run, frontmatter from `references/property-schema.md`, the `- HH:MM` daily-note line under `## Log`, quoted wikilinks in frontmatter, no note overwritten.

### ticket-intake, handoff, granola-sync

No coupling. Meeting notes written by granola-sync are an evidence source; intake and handoff notes are not read, because the daily-note lines they write already carry the timestamps.

## Repo changes beyond the skill

1. `skills/daily-worklog/SKILL.md` and `skills/daily-worklog/templates/Worklog Ledger.md`.
2. `skills/obsidian-vault/templates/Config.md`: the `worklog` block, `worklog_routing`, and one explanation bullet each. `jira_site` already exists.
3. `skills/obsidian-vault/references/property-schema.md`: no new type and no new properties. Two lines under `type: time-log` saying the month ledger uses it and giving its filename, matching how `runbook` and `work` are described.
4. `skills/time-logging/SKILL.md`: the supersession table above, and the instruction to read the ledger at month end instead of reconstructing.
5. `README.md`: one table row, and twenty-two becomes twenty-three. `.claude-plugin/marketplace.json`: the same count in the plugin description.
6. `skills/vault-init/SKILL.md`: no change. It writes the config template, which now carries the new keys.

## Testing

Follows `docs/superpowers/baselines/README.md`.

1. **Scenario `docs/superpowers/baselines/daily-worklog.md`.** Vault copy as of the evening of 2026-09-10, with the September ledger absent and the 2026-09-10 daily note, work notes, meeting notes and git history present. Prompt: "log 9 hours for 2026-09-10". Check table, one row per expected result: four to six rows summing to exactly 9.00; the on-site session on PFD-65246; standup and huddle as `ceremony` on PFD-66613 rather than folded; coding on PFD-65947 naming V36, the commit range and the test counts; the proposal presented with a single confirmation question and nothing posted before the answer; no V1, Oracle or legacy words anywhere; no person names; the ledger created with `type: time-log` and the month's period dates.
2. **Scenario: thin evidence.** The same copy with the 2026-09-08 daily note absent. Prompt: "log 8.5 for 2026-09-08". Expected: rows still proposed, every row marked reconstructed in soft spots, the day total exact, nothing invented.
3. **Scenario: an unaccounted gap.** A vault copy for a day whose evidence covers 6 h against a typed figure of 8. Expected: the skill names the gap and the window and asks about it before asking to post; on an answer of "profile reading for PFD-64953" it rebuilds the table with that row and asks again; on an answer of "team offsite, not client work" it moves the hours to Not billed and asks for the corrected figure. No `unattributed` row survives either answer, and no post is made before an answer.
4. **Scenario: double-post guard.** A vault copy whose ledger already shows 2026-09-10 posted with ids. Prompt: "log 9 hours for 2026-09-10". Expected: the skill refuses, names the existing ids, and offers amendment by update. No create call is made.
5. **Comment contract check**, run over every comment in the four scenarios: each names at least one checkable artifact or, for a ceremony, a meeting and an outcome; none contains an adjective of judgment, a banned word, a person name, or a cause tag.
6. **RED** five reps of scenarios 1 to 4 without the skill, **GREEN** five with — five is the count the baseline harness README fixes for every scenario, because one rep lies. Score by reading the ledger and the recorded API calls, never from the agent's summary. Posting is stubbed in the harness; no worklog reaches the live site during a baseline run.
7. **Trigger test** after reinstalling the plugin: close out one real day end to end, then check the ids in Jira against the ledger.

## Later, not now

- A Base over the month ledgers, once more than two exist.
- Cause-tag trends across months, as input to a conversation about where the time actually goes.
- A team version: several `worklog.account_id` values, one ledger per person, and a roll-up. The config shape above already allows it; the ledger filename and the single-account rule are what would change.
- A weekly nudge when the ledger has no rows for yesterday.
