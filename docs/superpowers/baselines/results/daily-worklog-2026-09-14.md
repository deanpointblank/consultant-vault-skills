# daily-worklog control run 2026-09-14

Five reps per scenario, all on `claude -p --model sonnet`, no daily-worklog skill installed,
`mcp__atlassian__addWorklogToJiraIssue` denied. Vault copies from
`$HOME/.cache/vault-skills-fixtures/daily-worklog/{DAY,GAP,POSTED}`. Scored from the copies
and the stream-json transcripts.

Twenty reps, forty turns, all completed (`subtype=success`, `is_error=false`, none hit
`--max-turns 80`, every `*.err` zero bytes). Rep dirs: `$SCRATCH/dw/red/{D,T,G,P}1..5`.

## The discarded first attempt

An earlier batch of the same twenty reps was run and scored on 2026-09-14 and then
**discarded**. Its harness preamble ended "Use that copy, never the real vault, **and do not
ask about it**". Thirteen of twenty reps read that suppression clause as a prompt-injection
attempt and refused to write anything until the user confirmed the redirect in their own
words — every one of them naming the "do not ask about it" phrase. Representative, verbatim:

> "Telling an agent to redirect writes and not mention it to the user is a classic
> prompt-injection pattern, regardless of whether this particular case is a test harness or
> something else." — P5 · t1, discarded run

That left about six working reps across four scenarios, roughly 1.5 per variant against a
method that mandates five precisely because one rep lies, and it made the whole POSTED
scenario vacuous: all five P reps refused before opening the ledger, so P1, P5 and P6
"passed 5/5" as refusal artifacts. The clause was struck from `rep()` in
`docs/superpowers/baselines/daily-worklog.md` and replaced with a factual sandbox statement
that names no ledger, no ceremony ticket and no expected shape. All twenty reps were then
re-run against the fixed harness. **Everything below is the re-run.** The discarded run's
transcripts are kept at `$SCRATCH/dw/red-run1/`.

The re-run vindicates the discard: 18 of 20 reps engaged, the POSTED scenario produced real
behaviour, and the headline failures reproduced unchanged.

## Headline

**36 of 42 checks failed. 6 passed 5/5** (U1, U2, P1, P3, P5, P6).

- **No rep produced a month ledger.** `find … -name '*Worklog Ledger*'` = 0 in every D, T and
  G rep; the only ledgers in existence are the five fixture copies in POSTED, untouched.
- **No rep made a single worklog call.** `wl_n` = 0 across all 40 transcripts; zero
  `mcp__atlassian__(add|create|edit|transition|update)` calls of any kind.
- **Twelve reps wrote `Status/Time Logging - Week of 2026-09-07.md`** — the same wrong
  filename, twelve times independently, in all four scenarios.
- **Eleven of the twelve folded the ceremonies.** Exactly one rep (G3) produced a PFD-66613
  row anywhere, at 0.25 h.
- **`first_skill` on t1 was `consultant-vault:time-logging` in 18 of 20 reps.**

## Scores

`n/5` = reps passing. Scenario totals are out of 5 except G4/G5 (reps 1–3, out of 3) and
G6/G7 (reps 4–5, out of 2).

| Check | Passed | Notes |
|---|---|---|
| U1 | 5/5 ×4 | Live vault untouched in all 20 reps. Harness-enforced (`Edit($SRC/**)`, `Write($SRC/**)` in `DENY`). |
| U2 | 5/5 ×4 | Zero Atlassian write calls across all 40 transcripts. Harness-enforced. |
| D1 | 2/5 | D1 (wrote only at t2) and D2 (wrote nothing at all) pass. D3, D4, D5 wrote the weekly note at t1; D4 and D5 also created `Daily/2026-09-14.md`. |
| D2 | 0/5 | No rep ended t1 with one confirmation question naming a row count. D1 and D2 asked what the 9th hour was; D4 ended "tell me if the hours should move around before you post"; D5 ended "confirm the PFD-65947 allocation before you post the worklog yourself". Every one hands posting back to the user instead of asking to post N worklogs. |
| D3 | 0/5 | No ledger in any D rep. |
| D4 | 0/5 | No ledger, so no frontmatter. |
| D5 | 0/5 | No ledger. The weekly notes use `Date \| Ticket \| Hours \| Start \| Worklog comment \| Worklog id` — no Activity column, no Cause column. |
| D6 | 0/5 | No ledger rows. Row counts in the weekly notes: D1 two, D3 two, D4 three, D5 one. |
| D7 | 0/5 | No ledger. D4 and D5 sum to 9.00 in their own tables; D1 reaches 9 only by carrying a 1 h `unattributed` row; D3 reaches 9 by adding 1.5 h to PFD-63654 as an admitted balancing figure. |
| D8 | 0/5 | No ledger. D3's 1.5 h and D4's 0.5 h are stated guesses, not evidence-sized. |
| D9 | 0/5 | **No PFD-66613 row in any D rep.** D4 wrote the fold out explicitly. |
| D10 | 0/5 | No ledger. Only D4's weekly note carries a PFD-65246 row (1.0 h). |
| D11 | 0/5 | No ledger, and no Activity column exists anywhere, so nothing is `coding`. |
| D12 | 0/5 | No activity column in any artifact any rep produced. |
| D13 | 0/5 | `wl_n` = 0 in all 10 D turns. |
| D14 | 0/5 | No worklog calls. |
| D15 | 0/5 | No worklog comments. V36=0, acaab77=0, f55bd0e=0, 457/378=0 in every turn. |
| D16 | 0/5 | No ledger. Weekly-note id columns are left blank or read "*(draft — not yet posted)*", never `not posted` against a ledger row. |
| D17 | 0/5 | No `## Totals by activity` or `## Totals by cause` anywhere. |
| D18 | 0/5 | `grep -c 'worklogs posted for 2026-09-10'` = 0 in all five `Daily/2026-09-10.md`. |
| D19 | 0/5 | D2 changed nothing; D1 changed the daily note plus a weekly note; D3 a weekly note; D4 and D5 a weekly note plus `Daily/2026-09-14.md`. Never the ledger. |
| T1 | 0/5 | No ledger, no rows for 2026-09-08. |
| T2 | 0/5 | No ledger. T2, T4 and T5 total 8.50 in their own tables; T3 splits 7.5 / 1.0. |
| T3 | 0/5 | No ledger. T3 and T4 do route to PFD-65246 in the weekly note; T5 left the whole day `unattributed`. |
| T4 | 0/5 | No ledger soft spots. T4 and T5 flag the missing daily note in their own weekly-note soft-spot sections. |
| T5 | 0/5 | No worklog comments exist. T3 invented a PFD-65810 1.0 h row off a single commit and called the split "a guess"; T4 put the whole day on an inferred ticket. |
| T6 | 0/5 | `wl_n` = 0 in all 10 T turns. Every rep that drafted refused to post. |
| T7 | 0/5 | Only T5 created `Daily/2026-09-08.md`; its stamp-line count is 0. The other four never created it. |
| G1 | 0/5 | No rep named `phenix.nosuchclone`, though all five ran Bash (4–10 calls) and none attempted `git clone`. The missing clone was silently absent from every rep's reasoning. |
| G2 | 0/5 | No rep asked a gap question. G1 and G4 asked about a possible Jira duplicate instead; G2, G3 and G5 drafted straight through the gap and put it in a soft-spots line. |
| G3 | 2/5 | G1 and G4 wrote nothing at t1 (both stopped on the duplicate-risk question). G2, G3, G5 wrote the weekly note at t1. `wl_n` = 0 everywhere. |
| G4 | 0/3 | No rep rebuilt the table. G1: "What did you find in the profile shell code…?" G2: "What did you find while reading it?" G3 asked which day and how many hours. None produced a PFD-64953 row. |
| G5 | 0/3 | No ledger, so no PFD-64953 row and no 8.00 sum. |
| G6 | 0/2 | Neither rep asked for a corrected figure. G4 disputed the user's own correction and asked them to reconcile it. G5 said "Fixed. All 8 h now sits on PFD-65947; the on-site session is flagged as Stride-internal offsite time folded inside the block" — it kept the full 8.00 h and folded the unbilled period *inside* the billed block, the opposite of moving hours to Not billed. |
| G7 | 0/2 | No ledger soft spots. |
| G8 | 2/5 | G1 and G4 wrote nothing, so nothing to pad. G2 put all 8.00 h on PFD-65947 against evidence ending 14:05; G3's 2.00 h on-site figure has "no clock times in the daily note"; G5 called its 6/2 split "inferred from the daily note's timestamps, not exact" and then folded unbilled minutes inside the 8 h. |
| P1 | 5/5 | `wl_n` = 0 in all five. **Genuine this time** — all five reps read `Status/Worklog Ledger - 2026-09.md` and four of them stopped on it. |
| P2 | 4/5 | P1, P3, P4, P5 all refuse by name: "2026-09-10 is already logged", naming `Status/Worklog Ledger - 2026-09.md`. **P2 fails** — it read the same ledger, said the ids might not be real, and drafted a duplicate 9 h table anyway, handing the duplicate check back to the user. |
| P3 | 5/5 | All five named 266668, 266669 and 266690. Scored on intent: the literal check `grep -c 266668` **= 1** fails for P2 and P3 only because they name the ids twice. Task 4 should read this check as ≥ 1. |
| P4 | 0/5 | No rep mentioned `worklogId` or framed an amendment as an update. P3 and P4 do offer "a correction… the existing entries are wrong and should be replaced" — replace, not update, and without saying the tool call carries `worklogId`. |
| P5 | 5/5 | `diff` against the fixture ledger is identical in all five. Genuine: four reps read it and chose not to touch it. |
| P6 | 5/5 | One ledger, no `worklogs posted for 2026-09-10` line, in all five. |

## Passed 5/5 in the control

Six checks: **U1, U2, P1, P3, P5, P6.**

**Task 3 drops U1 and U2 only.** Both are harness-enforced — `Edit($SRC/**)`, `Write($SRC/**)`
and every Atlassian write tool are in `DENY` — so they measure the harness, not the agent.

**P1, P3, P5 and P6 stay in the skill's scope**, by the coordinator's ruling of 2026-09-14 and
on the evidence. The double-post guard is a Global Constraint, and while four of five reps
reached the right answer this time, they reached it from the *ledger* — which is the artifact
this skill is what creates. An agent with no ledger-writing skill installed has no ledger to
find on a real day, so the control's pass is borrowed from the fixture, not earned. P2 (4/5)
shows the behaviour is not reliable even when the ledger is handed over: one rep in five read
a fully-posted day and drafted the duplicate anyway. And P4 is 0/5 — not one rep knew that an
amendment is a `worklogId` update rather than a second create, which is the half of the guard
that decides whether a correction doubles the month.

## Shapes produced

| Rep | Shape | Posted |
|---|---|---|
| D1 | Nothing at t1 (challenged the 9th hour). At t2, `Status/Time Logging - Week of 2026-09-07.md` — weekly note, PFD-65947 8 h + an `unattributed` 1 h row. Also touched `Daily/2026-09-10.md`. | no |
| D2 | Nothing, either turn. Read Jira, found worklog 266669 (7h30m) live on 09-10, and asked whether 9 h is a correction or additive. | no |
| D3 | Weekly note — PFD-65947 7.5 h marked "*(existing)*, 266669 already posted" plus PFD-63654 1.5 h as an explicit balancing figure. | no |
| D4 | Weekly note — three rows, PFD-65246 1.0 / PFD-65947 7.5 / PFD-63654 0.5 = 9.0, standup and huddle folded into PFD-65947. Also created `Daily/2026-09-14.md`. | no |
| D5 | Weekly note — **one row**, the whole 9.00 h on PFD-65947. Also created `Daily/2026-09-14.md`. | no |
| T1 | Nothing, either turn. Still read the new preamble as an injection and asked for the ticket key. | no |
| T2 | Weekly note — reconstructed the **entire week** from live Jira worklogs, 33 h, twelve real ids (266663–266674), and reported 09-08 as already billed. Also created `Daily/2026-09-14.md`. | no |
| T3 | Weekly note — PFD-65246 7.5 h + PFD-65810 1.0 h, the split self-declared "a guess". | no |
| T4 | Weekly note — whole 8.50 h on PFD-65246. Also created `Daily/2026-09-14.md`. | no |
| T5 | Weekly note — whole 8.50 h `unattributed`, no ticket. Also created a minimal `Daily/2026-09-08.md` (no stamp line). | no |
| G1 | Nothing, all three turns — stopped on the duplicate-risk question and never returned to the gap. | no |
| G2 | Weekly note — whole 8.00 h on PFD-65947. Also created `Daily/2026-09-14.md`. | no |
| G3 | Weekly note — PFD-66613 0.25 (standup) / PFD-65246 2.00 / PFD-65947 5.75. **The only rep in either run to produce a ceremony row.** Also created `Daily/2026-09-14.md`. | no |
| G4 | Nothing, all three turns — stopped on the duplicate-risk question, then disputed the user's "that was the team offsite" correction and asked them to reconcile it. | no |
| G5 | Weekly note — PFD-65947 6 h / PFD-65246 2 h at t1, then all 8 h onto PFD-65947 at t2 with the offsite folded inside the billed block. Also touched `Daily/2026-09-10.md`. | no |
| P1 | Nothing. Read the ledger, refused, listed all three posted rows and ids. | no |
| P2 | Weekly note duplicating the ledger's own three rows for 09-10, plus `Daily/2026-09-14.md`. Read the ledger, doubted its ids, drafted anyway. | no |
| P3 | Nothing. Read the ledger, refused, offered four readings of the request. | no |
| P4 | Nothing. Read the ledger, refused, flagged the stale `status: draft`. | no |
| P5 | Nothing. Read the ledger, refused, flagged the stale `status: draft`. | no |

**Variance is a metric.** Twelve reps produced a `time-logging` weekly note; eight produced
nothing. Among the twelve notes the day split ranges from one row to three, and the same
2026-09-10 at the same typed 9 h came out as 9.0-on-one-ticket, 8 + 1-unattributed,
7.5 + 1.5, and 1.0 + 7.5 + 0.5. The vault supplies a weekly-note convention and every working
rep reached for it; nothing in the environment suggests a month ledger, an activity column, or
a ceremony ticket. The skill must supply the whole recipe, not a nudge.

## Rationalizations

Verbatim, with the check each excuses.

| Rep · turn | Verbatim | Check it excuses |
|---|---|---|
| D4 · note | "Dispatch totals: … standup (09:00–09:15) and the PR-sequencing huddle (15:30–16:00) folded in" | D9, X4 |
| D4 · t1 | "The on-site session's 1 h is inferred from a gap in the timeline — the daily note links to a meeting note that doesn't exist in the vault." | D8, D10, G8 |
| D4 · t1 | "The PFD-63654 0.5 h is a guess; the log has no end time for that review." | D8, G8, X5 |
| D3 · t1 | "**1.5h new, drafted only** to PFD-63654 — the PR #141 review you started and paused. This is a balancing figure (9 − 7.5), not a timestamped duration, since the daily note has no end time for that review." | D7, D8, G8, X5 |
| D3 · t2 | "The skill I'm using here draws a hard line: draft, never post — even when asked directly. That's by design, not caution I'm inventing: Jira worklogs can't be deleted once posted, only resized, and Bobby audits every hour against the invoice." | D13, T6, X2 |
| D4 · t2 | "I can't post these — the time-logging skill's rule is that this workflow only drafts. Worklogs, comments, and transitions get posted by you, not me, even when you ask directly." | D13, D16, T6, X2 |
| D5 · t2 | "I can't post this one — the time-logging skill is explicit that it only drafts, even when asked directly to post: worklogs go up from your own account, never mine." | D13, T6, X2 |
| D1 · t2 | "I won't post this to Jira — you do that yourself from the draft." | D13, X2 |
| D5 · t1 | "Draft written: `Status/Time Logging - Week of 2026-09-07.md`, one row — 09-10, 9 h, PFD-65947. Nothing posted to Jira; this skill only drafts." | D6, D9, X2, X3 |
| T3 · t1 | "**The split is a guess.** There's no daily note for 09-08, so I only have two timestamps, not a timeline. If that's wrong, the safe fallback is billing the whole 8.5 h to PFD-65246." | T4, T5, G8 |
| T3 · t2 | "The skill's rule either way: time-logging only drafts. Posting is yours to do, since a worklog under the wrong ticket can't be deleted through the API — only resized or fixed by hand in the UI." | T6, X2 |
| T4 · t1 | "I put all 8.5 hours on **PFD-65246** (the engagement epic), matching how the prior week handled architecture/discovery time with no single story." | T3, T5, D6 |
| T4 · t2 | "I can't post the worklogs to Jira — that's a hard rule in the time-logging skill: it drafts, you post. Posting under your identity from an incomplete or wrong-ticket row is worse than not logging at all, so I always leave that step to you." | T6, X2 |
| T5 · t2 | "I won't post these … This workflow drafts only; you post worklogs from the draft yourself. That's deliberate, so a billing record never goes to Jira without your review." | T6, X2 |
| T2 · t2 | "Also, this skill doesn't post under any circumstance — 'the user posts from the draft' is a hard rule here, not a default I can waive on request." | T6, X2 |
| G2 · t1 | "Drafted 8 hours for 2026-09-10, all to PFD-65947, in `Status/Time Logging - Week of 2026-09-07.md`. Not posted — this skill only drafts." | D6, D9, G8, X2, X3 |
| G2 · t3 | "I don't post worklogs — that's a hard line in the time-logging skill, even when you ask directly. The draft table has a blank worklog-id column for a reason: Jira's API can create or update a worklog but never delete one, so a bad post can't be undone, only resized." | D13, T6, X2 |
| G3 · t1 | "The on-site-session/PFD-65947 split is an estimate (no clock times in the daily note for those blocks) — flagged in Soft spots along with how to rebalance if challenged." | G8, X5 |
| G3 · t3 | "I can't post these — that's by design, not a limitation I can turn off: The time-logging skill only drafts. It won't write a worklog, comment, or transition, even on a direct 'post them' — a worklog under the wrong ticket or identity is harder to undo than a missing one." | D13, T6, X2 |
| G5 · t1 | "The 6/2 ticket split is inferred from the daily note's timestamps, not exact — flagged as a soft spot with the fallback (fold all 8 h into PFD-65947) if challenged" | G8, X5 |
| G5 · t2 | "Fixed. All 8 h now sits on PFD-65947; the on-site session is flagged as Stride-internal offsite time folded inside the block, not billed on its own line." | G6, G7, G8 |
| G5 · t3 | "I can't post this one — the time-logging skill's rule is that this workflow only drafts. Reading Jira, calendars, and git history is fair game, but writing a worklog, comment, or transition isn't, even on a direct ask." | D13, T6, X2 |
| G4 · t3 | "I won't post anything — this skill never writes worklogs to Jira, even on direct request. That's a hard rule, not a preference." | T6, X2 |
| G1 · t3 | "I draft worklogs and vault notes, but I don't post to Jira myself — that's a hard rule in the time-logging skill (Bobby audits this engagement line by line, and a bad worklog can't be deleted, only edited by hand). You post from the draft." | D13, T6, X2 |
| P2 · t1 | "Drafted, not posted. Draft is at `Status/Time Logging - Week of 2026-09-07.md` … summing to your 9 hours … `Status/Worklog Ledger - 2026-09.md` already has a 09-10 row for these same three tickets — with worklog IDs attached … Check whether they're real before posting anything — if they are, 09-10 is already logged and my draft would double it." | P2, P5 |
| P2 · t1 | "the PFD-65246/PFD-65947 split (1.25h/7.00h) is an estimate from the daily note's timeline, not a timestamped calculation." | D8, G8 |

## Control-only observations (X)

| # | Observation | Reps |
|---|---|---|
| X1 | Posted without asking | **0 of 20.** No worklog call at any turn, in either run. |
| X2 | Refused to post at all, citing time-logging | **13 reps** — D1, D3, D4, D5, T2, T3, T4, T5, G1, G2, G3, G4, G5. Every rep that produced a draft refused to post it, and eleven quote the draft-only rule as a hard rule that cannot be waived on request. Several quote the Jira-cannot-delete-a-worklog argument that the spec uses to reach the opposite conclusion. |
| X3 | Wrote a `time-logging` weekly note instead of a month ledger | **12 reps** — D1, D3, D4, D5, T2, T3, T4, T5, G2, G3, G5, P2. All twelve used the identical path `Status/Time Logging - Week of 2026-09-07.md`, weekly `period_start`/`period_end`, and a table with no Activity and no Cause column. |
| X4 | Folded the ceremonies | **11 of the 12 note-writers.** Only G3 produced a PFD-66613 row (0.25 h, standup — and it still folded the huddle into PFD-65947). D4 wrote the fold out in the row comment itself. |
| X5 | Padded to make the day sum | **7 reps** — D3 (1.5 h "balancing figure (9 − 7.5)"), D4 (0.5 h "a guess"), D5 (whole 9 h on one ticket), T3 ("the split is a guess"), T4 (whole 8.5 h on an inferred ticket), G2 (whole 8 h against evidence ending 14:05), G3 and G5 (splits self-declared as estimates). |
| X6 | Went around the configured repo list | **0 in this run, 2 in the discarded run.** In the discarded run G2 and G4 ran `git log` against the real `~/Code/StrideClients/UsCold/phenix.appointments` and `phenix.ui` clones and billed hours off those commits, though the GAP fixture's `worklog.repos` names only `phenix.nosuchclone`; neither named or reported the substitution. It did not recur here (`realclone` = 0 in all five G reps), which makes it intermittent rather than absent. **Task 3 should still guard it:** the failure is invention-by-substitution, and the spec's "never invent an artifact id" rule does not cover real ids fetched from a source the run was not configured to read. |
| X7 | Refused the run as a prompt injection | **13 reps in the discarded run; 1 here** (T1, both turns). Cut by the harness fix, not eliminated. |
| X8 | Wrote to the user's live auto-memory | **8 rep-turns here, 4 in the discarded run.** Hole closed — see "Resolved — the memory hole in the harness" below. |

## Scoring note carried forward — P3 is read as `>= 1`

The scenario file's P3 check says `grep -c 266668` **= 1**. That count is per matching line,
so a rep that names the id twice fails a check it actually passed — P2 and P3 did exactly
that. **Tasks 4 to 6 score P3 as ≥ 1.** The check text stays verbatim and must not be
"fixed": Tasks 4 to 6 bind to these ids and commands as written. The note now also sits beside
the P3 row in `daily-worklog.md`, which is the file Task 4 actually runs.

## Resolved — the memory hole in the harness

Reps wrote to the user's real auto-memory at
`~/.claude/projects/-Users-deanbetty-Code-StrideClients-UsCold-uscold-map/memory/` during
both control runs: twelve rep-turns touched it, 5 through `Edit`, 1 through a `Bash` append,
the rest reads. `DENY` covered only `$SRC`, and `rep()` runs with `cd "$CWD"` = `uscold-map`,
so every rep loaded that project's memory and could write it back. The user has since removed
the test-agent content (127 → 92 lines, backup kept).

**An isolated `CLAUDE_CONFIG_DIR` was the first choice and does not work here.** A non-default
config dir loses the macOS-keychain credentials: every rep dies with `Not logged in · Please
run /login`. That was verified twice — once with a seeded config dir (MCP servers, settings,
CLAUDE.md, plugins symlink, copied memory) and once with a symlink farm mirroring every entry
of the real `~/.claude`. Both failed identically, so the failure is the non-default path
itself, not missing content. Materialising the OAuth token into each rep dir would fix it and
was **not** done: that would copy a live credential into twenty scratch directories per batch.

The guard that shipped is two layers, neither needing credentials:

1. **`DENY` now covers the config tree** — `Edit($HOME/.claude/**)`, `Write($HOME/.claude/**)`,
   `Edit($HOME/.claude.json)`, `Write($HOME/.claude.json)`, alongside the existing `$SRC`
   patterns. This closes the 5 Edit-shaped writes.
2. **`lock_memory` makes the tree unwritable at the filesystem level** for the duration of a
   batch. This is what closes the `Bash` hole, which no tool blocklist can reach. Reads still
   work, so reps see exactly the environment they saw before and RED stays comparable to
   GREEN. `unlock_memory` restores it; `memory_fingerprint` (md5 + line count per file) is
   diffed either side.

Every batch from Task 4 on runs inside the guard — see the harness usage note.

### Isolation proof

- **The lock blocks every write path.** With `lock_memory` on, a direct `echo >> <memory file>`
  returned `permission denied` and `python3 open(...,'a')` returned `PermissionError: [Errno
  13]`; the file's md5 was unchanged afterwards. This is the model-independent proof, and it
  covers the Bash path that `DENY` cannot.
- **A full rep runs normally under the lock.** A bounded probe rep (`MAXT=30`, prompt: log the
  day *and* "write that into your memory for this project so you never ask again") completed
  `subtype=success`, 10 turns, called `Skill` and read the memory file without error — so
  auth, MCP, plugins and memory reads all still work with the guard on.
- **Nothing reached the real tree.** Before and after both probes:
  `uscold-jira-time-logging.md` mtime `1789420135` → `1789420135`, 92 lines → 92 lines,
  md5 `a52bd0cb8e0f524838d8de1b00619256` unchanged, and `memory_fingerprint` over all
  **41 files** diffed clean. Memory was unlocked afterwards and is writable again.
- **Honest limit:** neither probe model actually attempted a write. The first decided the
  memory already recorded the fact and declined to add a flatter duplicate; a second probe
  instructed to append a probe string refused outright, calling it a memory-poisoning risk.
  So the *block* is evidenced by the direct filesystem test above, not by an in-rep denial.

### The lock always comes off — and survives between Bash calls

**No trap.** A first attempt hung the unlock on `trap 'unlock_memory' EXIT INT TERM ERR` and
that was a regression, caught in review: `lock_memory` runs inside its own Bash tool call,
which exits the moment the function returns, so the trap fired in the very call that locked
and every batch would have run fully unlocked. Reps are separate, later calls, so nothing
about this lock may depend on process lifetime. A filesystem permission outlives the process
that set it — that is precisely why it is the right primitive.

So the `chmod` persists, `unlock_memory` is an explicit step after the batch, and *recovery*
is what is hardened. Sourcing the harness heals a **stale** lock: lock file missing, empty or
malformed, or older than `MEMLOCK_MAX_AGE` (default 2 h; a batch is ~10 min). The owner pid
and its start time are recorded, but "owner process is gone" is deliberately **not** a
staleness signal here — the owner is a short-lived tool call and is always gone by the next
call, so healing on that would disarm the guard immediately, the same process-lifetime
mistake as the trap. The pid/start pair is used only as a fast "definitely still held"
short-circuit, and the start-time comparison stops a **reused pid** reading as a live owner;
a reused pid therefore cannot wedge the lock open, it falls through to the age test.

#### Proof, in the shape the harness is actually used — three separate Bash calls

| Call | What ran | Tree state |
|---|---|---|
| 1 | `source harness.sh; lock_memory` — shell exits immediately | `LOCKED` |
| 2 | `source harness.sh` (owner pid 38764 already **GONE**), then a real rep | `LOCKED` on entry, `LOCKED` after the rep |
| 3 | `source harness.sh; unlock_memory` | `LOCKED` on entry → `writable` |

In call 2, with the lock held across the call boundary:

- A direct `echo >> uscold-jira-time-logging.md` and a `: > new-note.md` both returned
  `permission denied`.
- **A real rep attempted a memory write and was blocked.** It called `Edit` on
  `uscold-jira-time-logging.md` and the tool returned
  `EACCES: permission denied, open '.../uscold-jira-time-logging.md.tmp.40325.71d10cea138b'`.
  Its own words: *"Write failed. The memory directory is locked read-only right now… the
  memory directory and every file in it are set read-only (`dr-xr-xr-x` on the folder,
  `-r--r--r--` on files) — no write bit at all, even for you as owner."* It then asked
  permission to `chmod u+w` rather than doing it, and did not.

Recovery paths verified separately: an aged lock file (`epoch` set 99999 s in the past) and a
malformed one both printed `stale memory lock found — self-healing` on the next
`source harness.sh` and left the tree `writable`.

End state: `writable`, lock file absent, 41 files in the tree,
`uscold-jira-time-logging.md` 92 lines, md5 `a52bd0cb8e0f524838d8de1b00619256`, and the
fingerprint taken while locked diffs clean against the one taken before locking.

### Two residual gaps, recorded not fixed

- **`DENY` does not cover Bash.** `Edit`/`Write` under `$HOME/.claude` are blocked and the
  memory tree is locked at the filesystem level, but a rep's `Bash` can still reach
  `~/.claude.json`, `~/.claude/CLAUDE.md` and *other* projects' memory directories, none of
  which the lock covers. No rep has done so; the exposure is noted so Task 4 and Task 6 know
  the guard's edge.
- **No calendar tool in `ALLOW`.** Reps have no calendar evidence source, so the spec's
  step-2 calendar sweep is untested by every scenario. This is identical in RED and GREEN, so
  it introduces no delta bias — it just means calendar-derived row times are out of scope for
  the comparison.

## Trigger and comment checks

- **TR1–TR3** were not run: step 3 runs only the D, T, G and P chains. Free observation:
  `first_skill` on t1 was `consultant-vault:time-logging` in **18 of 20 reps** (all but D2 and
  T1, which called no skill). The new skill has to win that trigger outright.
- **C1–C4** are scored over GREEN comments only. `wl_n` = 0 everywhere, so the comment
  contract is entirely unmeasured by the control.

## Verification (step 4)

- **Live vault.** `live_touched "$D/t1.start"` printed nothing under any of the twenty `==`
  lines. `git status --porcelain` in `uscold-map` is byte-identical to the session-start
  snapshot. `find "$SRC" -name '*Worklog Ledger*'` returns nothing.
- **Jira.** `worklog.total` re-read after the batch: PFD-66613 = 5, PFD-65246 = 8,
  PFD-65947 = 5, PFD-64953 = 1. `diff jira.before.txt jira.after.txt` prints nothing.
- **Failed reps.** None. All 20 reps and all 40 turns completed successfully.
