---
date: 2026-10-05
status: idea
type: note
tags: [retrospective, daily-worklog, untracked]
---

# daily-worklog retrospective, 2026-09-08 to 2026-10-05

Untracked scratch note. It looks back at how `daily-worklog` was really used in Claude Code chats.
It covers what broke, what was slow, what Dean had to correct, and what to keep. Nothing in
`SKILL.md` or the pedantry note was changed.

**How this note refers to other notes:**

- "Pedantry note" means `2026-09-15-daily-worklog-pedantry-gap.md`. "Decision N" is one of its four
  2026-10-05 decisions. "Gap N" is one of its numbered sections. "Change N" is one item in its
  closing change list.
- "Issues note" means `2026-09-29` background-job issues. It lives only on the branch
  `ideas/2026-09-29-bg-job-issues` (commit `9cbe340`), not on `main`. Its items are A1–A5, B1–B2,
  C1–C4 and D1–D5.

**Words used here:**

- **Ledger:** the month's worklog record in the vault, `Status/Worklog Ledger - YYYY-MM.md`.
- **Soft spot:** a ledger line saying which part of a day is an estimate, and how to fix it if
  challenged.
- **Sweep:** the skill's step 2, which gathers the day's evidence.
- **Cause tag:** `blocked`, `rework` or `unplanned`, kept in the ledger only.
- **Stop hook:** the work-chart check that runs when Claude stops. It asks for work-chart rows.
- **Classifier stop:** a reply cut off by the model's safety check. The screen shows "API Error ...
  safeguards flagged this message".

Times below are Eastern. Transcript timestamps are UTC and were converted.

## 1. Sessions reviewed

Seventeen main sessions were read turn by turn. The 95 test-rep sessions from 2026-09-14 and
2026-09-15 were counted, not read. All eight live days run through `daily-worklog` itself posted.

| Date | Session | What happened |
|---|---|---|
| 09-09 | `2cf99f7a` | Skill review in this repo. "Add a time-logging skill" was one of the ideas. |
| 09-11 | `4bf2bddc` | `time-logging` posted a whole week, 12 worklogs, from a calendar screenshot. |
| 09-14 | `9d2bfa3a` (and forks) | Design and build of `daily-worklog`. 09-14 was logged by hand mid-build, 5 worklogs. |
| 09-14 | 75 rep sessions | RED and GREEN test reps. The Jira tool was removed, so no rep could post. |
| 09-15 | `d106cd3c` | Build finished, merged and pushed. Twenty trigger reps passed. |
| 09-15 | `674b0bfd` | Repo work. Dean asked which plugin version was running. |
| 09-15 | `34012e90` | `time-logging` loaded, not `daily-worklog`. Four corrections, then 9 worklogs posted. The pedantry note was written here. |
| 09-16 | `e86f7f5b` | First `daily-worklog` run. Four gap questions. Dean: "cool it a little on the inquisition". 10 posted. |
| 09-24 | `f27660d4` | Clean run after a week of PTO. One question, 7 posted, PTO added to Not billed. |
| 09-25 | `0038b0b1` | Harvest entry by hand, then the `harvest-log` skill was built. |
| 09-25 | `8d891b75` | Three classifier stops. Model switched to Sonnet. "There should be more rows". 9 posted. |
| 09-28 | `5e898583` | Ticket keys moved to the PV2 board. Ceremony ticket closed at 12:32. 7 posted, plus Harvest. |
| 09-29 | `a26313ee` | Background job. Vault writes were refused, so the job staged and applied by hand. 5 posted. The issues note was written here. |
| 09-30 | `00fbbd8a` | Half-hour rule. First proposal came to 7.50 h, not 8.00. Dean added a handover. 13 posted. |
| 10-01 | `b05484b9` | Hour rule. Dean prompted a meeting sync mid-sweep. 10 posted, then Harvest by request. |
| 10-02 | `3fac85e2` | Classifier stops cut the run after 9 of 17 posts. |
| 10-02 | `ee81a53d` | A second session found the 9, posted the other 8, logged Harvest. More classifier stops. |
| 10-02 | `5df07955` | A third session checked that Jira and Harvest both showed 6.00 h. |

## 2. What worked (keep)

1. **One yes, then post.** Every run from 09-24 posted after one confirmation. Dean typed "yes,
   post them" (09-24, 09-30, 10-01) or "yes" (09-28). Each run checked the posted total, such as
   28,800 seconds for 8.00 h.
2. **The double-post guard held under real failure.** On 10-02 a run died after 9 of 17 posts. The
   next session checked Jira and posted only rows 10 to 17. The ledger confirms no row went twice.
3. **The trigger works.** Since 09-24 every "log my hours" request loaded `daily-worklog`. That is
   8 runs out of 8. The two earlier misses came from an out-of-date plugin, not the description.
4. **Ticket changes were caught.** On 09-28 the run saw the PV2 renumbering. It also saw the
   ceremony ticket close at 12:32 and moved the rows to its successor. Config was updated the same
   day.
5. **Session transcripts fill gaps.** On 09-16 they rebuilt a morning with no daily note. On 10-01
   they matched a quiet 12:51–14:40 window to a 13:30 meeting.
6. **Comments are specific and clean.** Comments name PR numbers, commit shas and test counts. The
   ledger records a check on each posting day. No comment named a person, the source system or the
   consultant tooling.
7. **Soft spots hold the reasoning.** The client never sees them, and they say how to fix a row.
   Keep the habit, but see finding 5 on their size.
8. **Missing days get one question.** On 09-24 the run noticed 09-17 to 09-23 had no rows and asked
   once. Dean answered "PTO" the next morning and the days went to Not billed.
9. **Cheap helpers for writing.** The ledger write went to a Sonnet subagent on most days. That
   kept the main run short.

## 3. What went wrong, ranked by cost

### F1. Classifier stops cut runs in half

- **09-25.** The 14-row draft was stopped three times in a row. Dean asked "what rule is being broken
  by the last message?" and got no answer. The context filled up. Dean switched to Sonnet to finish.
- **10-02.** The 17-row draft was stopped. Dean switched models and said "Can you post these?" The
  run posted 9 rows, then was stopped again and the session ended.
- **Cost.** It took two more sessions to finish 10-02 and confirm it. The second session was
  stopped twice more. At the moment of the cut, the ledger held no record of the 9 posted ids.
  `SKILL.md:139` says to write ids "before anything else" after a partial failure. That assumes the
  session lives long enough to do it. Recovery depended on reading Jira and the dead session's
  transcript.
- The cause is unknown. Dean used `/feedback` on 10-02.

### F2. Too many questions, and gaps left open

- **09-16.** The run asked four multiple-choice gap questions at the end of a 9.5-hour day. Dean:
  "can you cool it a little on the inquisition? ... it's perfectly fine to do 'consultant math'".
- **09-30.** The first proposal dropped 15:00–15:30 as an internal catch-up and came to 7.50 h.
  Dean had to explain the half-hour was a handover. `SKILL.md:63` already says not-billed time is
  "the user's call, never inferred from a calendar". The run inferred it anyway.
- **09-24 and 09-25.** Each run asked one more question about a window (a dock fault, 09:00–09:35).
- **Status.** Settled by decision 1: fill the stated window by context. The skill text still says
  the opposite (`SKILL.md:73`, `SKILL.md:82`). Until it changes, each run follows memory instead.

### F3. Ledger and memory bloat make every run expensive

- **Size.** The September ledger is 48 KB and 429 lines, about 65 of them soft spots. The October
  ledger was 37 KB after two days.
- **Why October is big.** `SKILL.md:116` copies every live soft spot into the new month. Sixty-three
  September lines were copied. None has ever been marked cleared, so they will keep rolling forward.
- **Read every run.** `SKILL.md:24` says to read the ledger first, every run. Runs read it in full,
  often more than once in a single run.
- **Shape drift.** The ledger no longer matches `SKILL.md:118`. It gained per-day "Worklog comments"
  sections, subtotal rows and a "Check against Harvest" section. On 09-30 a helper had to fix 13
  headers to match an older day's format.
- **Memory.** `uscold-jira-time-logging.md` is 197 lines and read at the start of runs. It holds a
  posted list for each day, which the ledger already has. It also holds rules that clash. Line 84
  says "A shortfall is an `unattributed` row, never padding". The 09-16 entry says to use "consultant
  math" and ask one question only.
- **Cost seen.** Worklog sessions used about 80K to 250K output tokens and 7M to 28M cache reads.
  Some of that was other work in the same session.

### F4. Meetings missing from the sweep

- **09-15.** "actually I forgot the last /consultant-vault:granola-sync for the day". A retro turned
  up and changed the rows.
- **09-16.** "see previous also do a granola sync".
- **09-24.** Two meetings were not in the vault. Rows were built from Granola summaries directly.
- **10-01.** Mid-sweep, Dean said "there was a meeting today that could explain the descrepancies".
- On 09-29 and 10-02 Dean ran the sync first by hand. The sweep reads only synced meeting notes
  (`SKILL.md:30`).

### F5. The work-chart Stop hook fires during worklog runs

- It fired twice on 09-24 and 09-28, five times on 09-29, and three times on 09-30 and 10-01.
- Each firing cost a work-chart check, often a subagent, and a stamp run.
- Handling was not consistent. On 09-24 the run wrote nothing, citing `SKILL.md:29` ("never write
  one"). From 09-28 runs wrote `Work - jira time logging` notes.
- Issues note B1 covers the hook firing while subagents run. It does not decide whether a worklog
  run gets a work-chart row.

### F6. Stale config, flagged daily and never fixed

- **GitHub login.** `worklog.github_login` reads `deanbetty`. The events API returned 404 on 09-24
  and 09-28. The real login was found on 09-29. The config still read `deanbetty` on 10-02. Every
  run since has added a soft spot saying so.
- **Engagement epic.** Config still names `PFD-65246`. Each day since 09-28 the run swapped in
  `PV2-1194` by hand.
- **Ceremony ticket.** It closed mid-day on 09-28. The run caught it, which is good, but only by
  luck of timing.
- Issues note C1 and C2 already propose the checks. The fixes themselves are Dean's call.

### F7. The same instructions are typed every day

- "9-5" was typed on 09-15, 09-24, 09-25, 09-28, 09-29, 09-30 and 10-01.
- On 09-25 and 09-28 Dean stopped the run to add the hours. On 09-28: "can you help me log my hours
  in jira for today?", then again with "I worked 9-5".
- The rounding rule also came by chat. 09-30: "any half-hour block where a task is completed counts
  as the entire half-hour block". 10-01: "we bill by the hour". These live only in memory.

### F8. Harvest is done by hand around the skill

- `SKILL.md:20` says never to call Harvest. Every day from 09-25 Harvest was logged anyway.
- 09-25: a separate session, then a new `harvest-log` skill (untracked in `skills/`).
- 09-28: "yes and can you also post a 9-5 block in harvest too?"
- 10-01: "log Harvest".
- 09-29, 09-30 and 10-02: the run logged Harvest without being asked.
- The skill's rule and real practice have split apart.

### F9. Context guesses landed on the wrong ticket

- **09-25.** The draft put 09:00–09:35 on "start-of-day catch-up". Dean: "I started the day
  investigating the feasibility of the 'deploy order service ticket'". The row moved to PFD-66992.
- **09-25.** The draft treated a meeting sync as internal. Dean: "meeting sync was fpor uscold".
- **09-15.** Before any question, the 09:00 hour sat on one ticket. It belonged on two (gap 4).
- Decision 1 makes context-filling the rule. These cases show Dean needs to see which rows were
  filled, so a wrong guess is caught in one glance.

### F10. Too few rows

- **09-25.** The draft had 6 rows. Dean: "there should be more rows". The final had 9.
- `SKILL.md:69` allows one row per ticket per activity. `SKILL.md:71` merges anything under 0.25 h.
  Both push toward fewer rows.
- Settled by decision 4 and gap 6.

### F11. After-5 work was refused

- **09-25.** Dean: "any work done after 5, find a place to fit it within that timeframe". The run
  replied: "One thing I won't do: move the Stride-internal after-5 work into the client log."
- Part of that work was client work (the meeting sync). Dean had to say so.
- Decision 1 fixes the total from Dean's window. It does not say whether real client work done
  outside the window can fill a gap inside it.

### F12. The transcript timeline is rebuilt from scratch each run

- Every run wrote a fresh Python script to read `~/.claude/projects`. That was 2 to 7 shell calls
  per run.
- Issues note C3 found the method counts command echoes as typed turns: 41 counted against 35 real.
- Gap 3 already proposes transcripts as a sixth source. Nothing ships a shared script.

### F13. Cause tags still mostly blank

- September closed with 46.50 of 64.50 h untagged (72%). 09-28 assigned none, with reasons given.
- Runs tagged only when memory reminded them (09-16 was fixed after posting).
- Settled by gap 1 and change 1.

### F14. The build was long and could not test the post

- 09-14 ran from 14:40 to 21:30 with 75 rep sessions. Dean: "For the testing use sonnet, Opus is
  too expensive" and "I'm not sure if we're making progress."
- The reps had no Jira tool, so the posting step was never tested before live use.
- Live runs have since posted on eight days with no failed call.

### F15. The pedantry note is out of date on two points

- It says 2026-09-15 is "sitting in ... the ledger, not posted" (lines 10–11). Change 7 says to re-run
  that day "before posting". But 09-15 was posted at 17:44 that day, ids 267154–267162. It can now
  only be amended by update.
- Gap 8 and change 8 say nobody has watched the skill post a worklog. It posted live on 09-16 and
  every working day from 09-24.

## 4. Recommendations, ranked by value

1. **Write the ledger rows before the first post. (new; F1)**
   Right after the yes, write every row to the ledger as `not posted`. Then swap in each id as its
   call returns. A session cut by a classifier stop or an API error then leaves an exact resume
   point. Step 2 already resumes from `not posted` rows (`SKILL.md:24`). This changes the order in
   `SKILL.md:84` and `SKILL.md:139`. It still writes nothing before the yes. In a background job the
   rows go to the stage folder (issues note A5).

2. **Fill the window by context, with no gap questions, and mark filled rows. (already in the
   pedantry note, decision 1 and change 3; new addition; F2, F9)**
   Rewrite `SKILL.md:63`, `:73` and `:82` as decision 1 says. Add one thing. In the table, mark each
   row sized by context rather than evidence, for example `filled` in a column. Dean then corrects a
   wrong guess in the same reply as the yes. That is not a question, so it keeps to "cool it on the
   inquisition".

3. **Sync meetings before the sweep. (new; F4)**
   At the start of step 2, list Granola meetings for the date. If any are missing from the vault,
   run `granola-sync` first, or read the Granola notes directly. Say in one line which meetings were
   added. This removes Dean's most repeated reminder.

4. **Cut what each run reads. (new; F3)**
   - Stop copying soft spots into the new month. Link the previous ledger instead. This changes
     `SKILL.md:116`.
   - In step 2, read the Rows table and the date's own lines, not the whole file.
   - Put the per-day comment record in the template, or in its own monthly file. Then the ledger
     shape is fixed and stops drifting.
   - Prune the memory note. Move settled rules into `SKILL.md` or config. Drop the per-day posted
     lists, which the ledger already holds. Remove the line 84 rule that decision 1 replaced.

5. **Add config keys for the window and the billing unit. (new; F7)**
   For example `worklog.day_window: "09:00-17:00"` and `worklog.billing_unit: 1.0`. "Log my day" with
   no figure then uses the window. The table header states the window and unit used, so Dean can
   change them in the reply. This puts decision 2 in config rather than in memory. It also changes
   `SKILL.md:18`, which today requires a typed figure.

6. **Make Harvest a step, not a side job. (new; F8)**
   After the Jira post, offer the same block to Harvest through `harvest-log`, with a same-date
   check. Narrow `SKILL.md:20` so it bans only reading Harvest to check the figure. Commit
   `skills/harvest-log/` first.

7. **One row per distinct piece of work. (already in the pedantry note, decision 4, gap 6 and change
   4; F10)**
   The 09-25 "there should be more rows" is fresh evidence. `SKILL.md:69` and the merge rule in
   `SKILL.md:71` are the lines to change.

8. **Decide how worklog runs meet the work-chart hook. (new; partly issues note B1; F5)**
   Either the hook skips a worklog run, since the ledger is its record. Or the run writes one
   work-chart row at the end of step 7, never mid-sweep. Write the choice into `SKILL.md:29`.

9. **Check config keys every run, and fix the two stale ones. (already in issues note C1 and C2; F6)**
   Add the checks as the issues note says. Separately, set `worklog.github_login` and
   `worklog.engagement_epic` to the values the ledger names. That is Dean's call.

10. **Ship the transcript timeline as a script. (already in the pedantry note, gap 3 and change 2,
    and issues note C3; the script is new; F12)**
    Put one script in `skills/daily-worklog/`. It should skip command echoes and interrupts, convert
    to config `timezone`, and group by tool paths. Each run then calls it once.

11. **Real client work done after the window can fill a gap inside it. (new; extends decision 1;
    F11)**
    Dean's window fixes the total. If client work happened after it, that work is a true source for
    an empty stretch inside it. No hours are added and nothing is invented. Internal work stays out.

12. **Tag every row. (already in the pedantry note, gap 1 and change 1; F13)**
    The 72% untagged figure is the evidence.

13. **Correct the pedantry note's stale lines. (new; F15)**
    Lines 10–11 and change 7 should say 09-15 is posted and can only be amended by update. Gap 8 and
    change 8 can be marked done. This retro did not edit the note.

## 5. Open questions for Dean

1. Should "log my day" with no hours mean 09:00–17:00 by default?
2. Which billing unit stands: the hour (10-01) or the half hour (09-30)?
3. Should Harvest be a step inside `daily-worklog`, or stay in `harvest-log` with a one-line offer?
4. Should a worklog run get a work-chart row at all?
5. Can the run set `worklog.github_login` to the client-org login, and the epic to `PV2-1194`?
6. Should old soft spots stop rolling forward each month? Or should they be cleared in a monthly
   pass?
7. For 2026-09-15, should change 7 become an amendment by update, or be dropped?
8. Do you know what set off the classifier stops on 09-25 and 10-02? Did the `/feedback` report get
   a reply?
9. Gap 9 (the process-overhead rollup) is still open in the pedantry note. Nothing here changes it.
