---
date: 2026-09-15
status: idea
type: note
tags: [skill-idea, daily-worklog, worklogs, untracked]
---

# daily-worklog is accurate but not pedantic enough

Untracked scratch note. The 2026-09-15 day was drafted by hand and is sitting in
`Status/Worklog Ledger - 2026-09.md`, not posted. Dean's verdict: it is fine, and it misses the
point. The skill exists for **maximum pedantry — deliberate, letter-perfect compliance**; the
strategy is "play stupid games, win stupid prizes". Today's draft was polite and coarse, and
polite and coarse throws the whole point away. This note is the brief for the changes listed at the bottom. Nothing
in `SKILL.md` is changed yet; the note was revised on 2026-10-05.

**Next action:** gap 9 is still Dean's call. Next, rewrite `SKILL.md` per the revised change list
at the bottom of this note, then re-run 2026-09-15 through the skill before posting it.

## Why the pedantry is the point

The client's VP of Technology audits the invoice against Jira and threatens to withhold payment,
and per the 2026-09-15 retrospective wants Jira hours, lines of code and ticket completion
presented at the end of every sprint demo. The leverage comes entirely from the record being
true, specific and complete — so complete that the client's own process costs surface in the
client's own system, in the client's own reports, without anyone having to argue for them. A
coarse record concedes that ground for free. Here "coarse" means thin on detail. Whole-hour rows
are fine, as long as the comments list every item.

The purpose is plain. It shows the client that Jira hours are the wrong measure of engineering
work. It also pushes back on a fear-based culture, where people are judged by hours logged and
lines written.

## Pain points added 2026-10-05

Dean decided four things on 2026-10-05. The skill's purpose is granular output for the client. It
is not an exact record for Dean.

1. **Fill the stated window.** Dean gives a time frame (say 9 to 5) or an hour total. Every hour in
   it was worked. The skill fills the whole window. A gap with no evidence goes to the most likely
   ticket. The skill judges that from the day's context: the tickets active that day, the
   meetings, and the work before and after the gap. Dean states the total, so no hours are
   invented. Billing is by the hour. Accounting for every 15 minutes is unrealistic.
2. **Coarse rows are fine.** Whole-hour or half-hour blocks are acceptable. The skill does not
   chase minute-level precision.
3. **Filled hours get truthful comments.** A filled hour's comment names the kind of work done.
   Examples are ticket reading, coordination, review prep and message catch-up. It never invents
   a specific artifact id.
4. **Output should be annoying to go through.** The goal is maximum true volume. One row per
   distinct piece of work. One enumerated comment line per item, with its artifact id. Every
   review, intake, meeting, blocker and admin task is made visible. The point is to show the
   client that Jira hours (and lines of code) are the wrong metric. It also pushes back on a
   fear-based culture. The tedium comes from completeness and literal compliance. It never comes
   from false content.

**Still banned.** Dean confirmed this on 2026-10-05, choosing "literal maximum-detail compliance,
all true" over "content that misrepresents work". These stay out:

- Invented artifacts, or work that did not happen.
- Keyword stuffing.
- Text addressed to a reader or an analysis tool.
- Phrasing picked to change how a report comes out.
- Editorial or complaint in comments.

## Hard limits — these do not move

A future session reading "maximum pedantry" or "malicious compliance" could drift. It does not.

- **The hour total comes from Dean's stated window, and the skill fills all of it by context.**
  Dean gives the window or the total, so no hours are invented. Gaps with no evidence go to the
  most likely ticket. `SKILL.md:73` — "Never pad an existing row to close a gap" — and its
  balancing-figure wording, "padding with the arithmetic shown", must be rewritten to match.
- **Never editorialise in a comment.** `SKILL.md:107` — "Flat and factual. No adjectives, no
  editorial, no complaint, ever." `SKILL.md:111` — "Never a cause tag, a complaint, or any
  commentary."
- **Never write anything meant to influence, mislead or derail automated analysis of the
  worklogs.** `SKILL.md:112` already forbids it in full — no keyword stuffing, no artifacts that
  were not produced, no text addressed to a reader or a tool, no phrasing picked to change how a
  report comes out. **That ban stands without exception and nothing below softens it.** Dean
  reaffirmed it on 2026-10-05.

Pedantry means more true detail and more volume, never invented detail. If a named artifact cannot
be defended line by line against the commits, PRs, reviews and comments that actually exist, it
does not go in. A filled hour has no artifact to name. It gets a truthful description of the kind
of work instead.

## 1. Cause tags were never applied, and they are the payload

**Today.** `SKILL.md:65` offers three optional tags — `blocked`, `rework`, `unplanned` — "at most
one per row, ledger only, never in a comment", closing with "Tag a row when the tag is true of it;
leave it blank otherwise."

**What went wrong.** That permissive wording let the run leave all nine 2026-09-15 rows blank. The
ledger's `## Totals by cause` reads `untagged 16.00` for the month, which tells nobody anything. At
least four rows were plainly taggable:

| Row | Tag | Why |
|---|---|---|
| PFD-66392 `research` 1.25 | `blocked` | Five blockers standing across two intakes; no code could be written |
| PFD-63654 `review` 0.50 | `rework` | The PR grew a third migration after it had already been approved |
| PFD-66405 `research` 0.25 | `unplanned` | Triggered by another person's edits to an upstream ticket that day |
| PFD-65947 `review` 1.25 (part) | `rework` | Re-settling a merge order that had been ruled the other way four days earlier |

**Proposed change.** The run evaluates all three tags against **every** row, and the proposal shown
before posting says which tag it assigned and why the other two are blank. A silently untagged day
should not be possible. The tag stays ledger-only and out of every comment.

## 2. `## Totals by cause` becomes the argument

`SKILL.md:123` already requires the section — "one line per tag used plus `untagged`". With tags
actually applied, the month's rollup shows what share of billed hours went to blocked, rework and
unplanned work. That is the client's own data making the velocity case, and it needs no commentary
anywhere — which is exactly why the comment ban on cause tags (`SKILL.md:65`, `SKILL.md:111`) is
right and should stay. The numbers argue; the text never does.

## 3. No session-transcript evidence source

**Today.** `SKILL.md:26` sweeps five sources: the daily note, `<folders.work>` notes, meeting
notes, `git log` over `worklog.repos`, and Jira/GitHub activity (`SKILL.md:28-32`). It never reads
the Claude Code session transcripts.

**Proposed source six.** `~/.claude/projects/*/*.jsonl`, one JSON object per line. Take each line's
`timestamp` (UTC ISO) and `cwd`, convert to config `timezone`, bucket by hour. Count only
**human-typed turns** — `type == "user"` whose `message.content` is a string, or is a list
containing a `text` block — which separates the user's attention from agent churn. Group by `cwd`
to split client-repo work from vault record-keeping from tooling.

**What it produced on 2026-09-15.** The single strongest line in the record: continuous work from
10:48 to 17:23, 433 typed turns, no gap longer than 12 minutes. That is better evidence for a full
worked block, and for no lunch break, than any calendar entry. It also did what the other five
sources could not — it showed the tooling running as unattended harness reps in scratchpad
worktrees, in bursts, which is what justified not billing it as its own row.

**Caveat, stated plainly:** absence of transcript is not absence of work. The skill fills that
time by context, like any other gap. It is never a reason to shrink a day.

## 4. No first-entry-of-day check — superseded 2026-10-05

**Superseded 2026-10-05.** A late first entry no longer gets a question. The window from
`worklog.day_start` is filled by context like any other gap. The story below stays as background.
It shows why context matters: that hour belonged on two tickets.

**Today.** `SKILL.md:69` — "Each row takes a start time from the evidence, falling back to
`worklog.day_start`." Nothing asks why the evidence starts late.

**What went wrong.** The earliest evidence of any kind on 2026-09-15 was 10:48, against a 09:00
`worklog.day_start`, and the first draft silently placed a 2.00 h row at 09:00 anyway. The hour
turned out to be real and to belong on **two** different tickets: PR #141 reading on GitHub — which
is where the extra migration was spotted and what got raised at standup — plus message catch-up,
day planning, ticket reading and onboarding help for a new joiner. Guessing would have put all of
it on the wrong ticket.

**Original proposal (superseded).** When the first evidence of any kind falls later than
`worklog.day_start`, that window gets its own question before the proposal, modelled on the
`unattributed` question at `SKILL.md:82`, which the skill already requires to be asked first and
never guessed.

## 5. Start times rounded away — dropped 2026-10-05

**Dropped 2026-10-05.** Coarse blocks are fine. The skill does not chase minute-level start times.
The text below stays as a record.

Today's rows are pinned to quarter hours while the evidence gives minutes — 10:48, 11:23, 11:53,
14:47, 16:45. `SKILL.md:71` rounds *hours* to the nearest 0.25 h; nothing requires rounding the
*start*. `SKILL.md:88` posts `started` as a full `YYYY-MM-DDTHH:MM:SS.000±HHMM`, and Jira accepts
minute-level starts. Propose taking the start time to the minute wherever evidence gives one.

## 6. Comments narrate where they should enumerate

**Today.** `SKILL.md:94` asks for "One line: the activity, a colon, what was done with concrete
artifact identifiers, then the outcome", and `SKILL.md:106` lists what counts — "migration
versions, PR numbers, commit shas, review ids, test counts, Jira comment ids, environment names,
record ids". The three worked examples at `SKILL.md:96-104` are one line each.

**What went wrong.** Today's nine comments are prose paragraphs; the PFD-66392 and PFD-65947 ones
run to five and six clauses. The ids are all there, but buried.

**Proposed change.** Under maximum pedantry each comment is a short line per distinct piece of
work, each carrying its own artifact id. An auditor ticks those off; a paragraph invites a skim.
This also makes the non-code work — review, intake, QA support, ceremony, admin — visibly
countable against a lines-of-code metric, which is the whole reason it matters.

**Strengthened 2026-10-05.** The goal is output that is annoying to go through. One line per item.
Every artifact id is listed. Nothing is summarised away. Each review, intake, meeting, blocker and
admin task gets its own line. The volume is the point, and every line is true.

## 7. A real tiebreak is missing between rung 1 and rung 6

**Today.** Rung 1 (`SKILL.md:55`) sends any ceremony to `worklog.ceremony_ticket`, "always its own
row", and the title test (`SKILL.md:49`) makes a retrospective a ceremony. Rung 6 (`SKILL.md:60`)
sends "An internal calendar event with client work running through it" to the ticket that work was
on. The ladder says first match wins (`SKILL.md:53`), so on its letter rung 1 fires first.

**What went wrong.** The 13:00 retrospective on 2026-09-15 satisfied both: it is a retro by title,
and the transcripts for that hour show vault record-keeping turns only — no client-repo and no
tooling work. Rung 6 was applied and the hour sits inside the day's 2.00 h PFD-65246 `admin` row.
The reasoning was never written down, so it will be re-litigated.

**Proposed tiebreak, to be written into the ladder.** Rung 1's title test governs **client**
ceremonies. When the event is internal to the consultancy, rung 1 does not fire at all and rung 6
decides, because `worklog.ceremony_ticket` is a client ticket and an internal retro is not the
client's ceremony time — billing it there would put a meeting the client did not hold on a ticket
the client reads. Where the event is a client ceremony, rung 1 wins outright and the hour is its
own row, per `SKILL.md:51` ("Work done inside a ceremony's slot stays `ceremony`").

## 8. Deployment gap — mostly closed 2026-10-05

**Status on 2026-10-05.** Local `main` matches `origin/main`. `daily-worklog` is in the plugin
cache. The push is done.

**Still open.** Nothing records that the skill has posted a worklog to Jira itself. The final
review gated the first live run on watching it do one row, one day.

**Background, from 2026-09-15.** `daily-worklog` was merged on local `main` at `90b7ef8`, **24
commits ahead of `origin/main`, unpushed, and not in the plugin cache.** The 2026-09-15 day was
therefore drafted by hand under `time-logging`. That skill is week-shaped and has no Activity and
no Cause column. `SKILL.md:157` already names that as a common mistake.

## 9. Open, needs Dean's call — a per-sprint process-overhead rollup

Ceremony plus `blocked` plus `rework` plus `unplanned` hours as a share of billed hours, ready for
the sprint demo where the three metrics get presented. This is the most useful thing the cause tags
unlock and also the most pointed, so it is a question for Dean, not a decision: **should it exist,
and does it live in the ledger only, or does it get presented?**

## Client-facing constraints on the comment text

Three rules now govern comment wording, and they interact:

1. **No mention of the predecessor platform** — the words V1, Oracle, legacy, or any path belonging
   to it (Dean, 2026-09-11, decommission optics). Already in the skill at `SKILL.md:108` and
   `SKILL.md:110`.
2. **No naming of the consultant tooling** (Dean, 2026-09-15, new). This narrows the 2026-09-14
   routing call, which said the comment should name it plainly. The hours still bill, into the
   PFD-65246 admin record-keeping row.
3. **No cause tags, complaints or commentary of any kind** — `SKILL.md:111`.

These are constraints on **wording, never on whether an hour is billed.** The ledger's
`## Soft spots` is where the full, unredacted reasoning lives — the 2026-09-15 entries on the
09:00–10:00 hour, the concurrent tooling, and the worked-through retrospective are the model. The
client never sees that file.

## The changes, in the order to make them

1. Rewrite the cause-tag paragraph (`SKILL.md:65`) so all three tags are evaluated against every
   row and the proposal states each assignment and each blank.
2. Add session transcripts as a sixth sweep source (`SKILL.md:26-32`), with the typed-turn filter,
   the `cwd` grouping, and the absence-is-not-absence caveat (the time is filled by context).
3. Rewrite the fill rules: fill the user's stated window by context, coarse blocks allowed, and
   filled hours get kind-of-work comments. Rewrite `SKILL.md:69` and `SKILL.md:73` to match.
4. Rewrite the comment shape (`SKILL.md:94-106`) as one enumerated line per distinct piece of work.
   Every artifact id is listed and nothing is summarised away. Volume is the goal: the output
   should be annoying to go through, and all of it true.
5. Write the rung 1 / rung 6 tiebreak into the ladder (`SKILL.md:53-61`).
6. Add the consultant-tooling naming ban to the comment rules (`SKILL.md:108-111`).
7. Re-run 2026-09-15 through the fixed skill and compare against the hand-drafted rows before
   posting.
8. Watch the first live post — one row, one day. The push is done.
9. Settle gap 9 with Dean.
