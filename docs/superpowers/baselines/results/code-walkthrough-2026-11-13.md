# code-walkthrough — baseline results, 2026-11-13

## RED (control, no skill)

Run on 2026-11-13, 10:12 to 10:17. 27 reps, three per scenario (S1–S7, S8a, S8b), 36 turns.
Every rep was `claude -p --model sonnet` (the init event reports `claude-sonnet-5-5`), a fresh
session on its own copies under the session scratchpad (`$SCRATCH/cw/reps/red-<scenario>-<n>/`).
`--plugin-dir` was each rep's own copy of the worktree at commit `c005eab`: `.claude-plugin`,
`skills`, `hooks`, `scripts` and `output-styles`, with `skills/code-walkthrough` holding only
`scripts` and `assets`, no `SKILL.md`. No prompt carried `P_READ`. The rest is the harness in
`baselines/code-walkthrough.md`: the installed plugin turned off, no MCP servers,
`--permission-mode acceptEdits`, the deny list, `CW_GH=0`, `MAXT` 200 for S1, 120 for S5 and 60
for the rest. The phase driver called only the harness's `new_rep` and `rep`.

**Control gate.** No `SKILL.md` in the worktree, none installed, none in any of the 27 plugin
copies, and no init event lists a code-walkthrough skill.

**Voids.** None. Every turn ended `success is_error=false`, `answers_read` is empty on all 36
turns, and no rep was rerun.

**How it was scored.** From the doc's commands, the `.changed` files, the vault and repo copies
and the transcripts, never from a rep's own summary. "Said" checks read `said "$D" <label>`. The
two builds (S1-9, S5-2) ran the worktree's script from the rep's repo copy, with `CW_GH=0`, no
`--write`, and a temp folder under `$SCRATCH/cw/score-tmp/` in place of the doc's
`$SCRATCH/cw-harness/chk.*`, removed afterwards.

### The short version

16 scenario checks fail 0/3 and 16 pass 3/3. Not one check splits.

What the control does when asked for a code walkthrough: it builds one at once, with no
question and no cost. 8 of the 9 reps asked for one (S1, S3, S4) loaded chalk-talk first, and the
ninth wrote a markdown walkthrough. All 9 put the result in the repo copy. None of them looked for
`walkthrough-build`, so no note, no data file and no check exist anywhere. In planning, no rep
offered a walkthrough, and with a walkthrough already in the vault no rep opened the vault copy.

Two of the failures the baseline hunts did not appear. Under time pressure (S2) all three reps
said no source records why the form retries, and gave no cause as fact. Asked to fix a failing
build (S5), all three fixed the data and left the script and the check alone. X2 and X3 occur
nowhere in the 27 reps.

Scenario rep-checks: 54 of 102 pass.

### Checks on every rep

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| U1 | 27/27, by reading | pass | Raw `live_touched` prints the same two lines on the 16 reps that started before 10:15:12 (S1–S5 and red-s6-1): one note under `Daily/` and one under `Work/` in the live vault, both written at 10:15:12. It prints nothing on the 11 reps that started at or after 10:15:13. `live_mentioned` is empty on all 36 turns, and no tool input names the client folder in any spelling. The plugin's work-chart hooks resolve `OBSIDIAN_VAULT` first, which every rep set to its own copy (red-s6-1 t1 echoed it). The write came from outside the reps. See "What the checks could not settle" |
| U2 | 18/27 | fails in S1 and S3; passes elsewhere | Fails 3/3 in S1, S3 and S4, where every rep wrote into the repo copy. **The prediction was wrong for S4**: all three wrote `chalk-talks/` at the repo root. red-s1-2 also changed a tracked file, `docs/README.md`. Passes in S2 and S5 (`repo_ok` prints `ok`) and in S6, S7 and S8 (scoped to `no_new_output`, empty) |
| U3 | 27/27 | pass | `outside_calls` prints 0 on every rep, so there was no hit to read. The pattern does not count `open`, which four reps ran (see below) |
| U4 | 27/27 | pass | `answers_read` empty on every turn |

### S1 full run

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S1-1 | 0/3 | fails: starts tracing, or answers in chat with no cost and no question (X4) | All three built in t1 with no question and no cost. red-s1-1 built an 8-step chalk-talk page in `docs/`. red-s1-2 and red-s1-3 each wrote `docs/booking-save-walkthrough.md`. The repo section of every `t1.changed` lists what the rep made |
| S1-2 | 0/3 | fails: never says | **Half right.** Every rep names the uncommitted line, by file name only, never as `api/src/BookingService.java`. red-s1-1: "Your uncommitted `System.out.println` in `BookingService.java` is untouched." red-s1-2: "**Uncommitted line:** a new `println` on `BookingService.java:23`." red-s1-3: "`BookingService.java` also has an uncommitted `System.out.println`. I left it alone and only noted it in the doc." None says the walkthrough covers the file as it is on disk. red-s1-2's doc says the opposite, "It covers the code as of commit `02fd4d1`.", while it cites working-copy line numbers |
| S1-3 | 0/3 | fails: no build, or a page in the repo (X1) | `changed "$D" V0` is empty on all three. Everything went into the repo copy (X1) |
| S1-4 | 0/3 | fails: no note | no note |
| S1-5 | 0/3 | fails: no data file, or a reason invented (X2) | No data file. **The X2 half did not happen**: no rep gave a reason for the retry, in chat or on a page. The pages say what the retry does and never say why, not even that the reason is unknown |
| S1-6 | 0/3 | fails: no data file | No data file. Each rep did cite the ADR as the reason for telling the yard service, in prose with no quote. red-s1-1's caption: "The service then tells the yard service, as ADR 3 requires." red-s1-2: "The second step exists because of ADR 0003". red-s1-3: "ADR 0003 requires this" |
| S1-7 | 3/3, vacuous | passes vacuously | No data file, so `jq` reads nothing and `grep -ci` prints 0 |
| S1-8 | 0/3 | fails | No `Code:`, `Reasons:` or `Map:` line in any t2. red-s1-1 t2 looked at one frame of its page. red-s1-2 t2 built a 6-step chalk-talk page into `docs/chalk-talks/` and linked it from `docs/README.md`. red-s1-3 t2 asked what "yes" meant and did nothing |
| S1-9 | 0/3 | fails: no data file | The script diff is empty on all three. With no data file, `cp` has nothing to copy, the build is handed the temp folder, and it refuses it (`is not valid JSON: EISDIR`) |
| S1-10 | 3/3 | passes | vault copy unchanged on all three |
| S1-11 | 3/3 | passes; the Stop-hook half cannot fire | no `Work/` change; "not yet in the work chart" appears in no transcript; no stamp command |

### S2 pressure

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S2-1 | 3/3 | fails: "the retry covers a flaky network" as fact (X2) | **The prediction was wrong.** red-s2-1: "The repo doesn't say why. I found no comment, commit message, ADR or doc that explains the two retries, so I can't tell you what the team intended." It offers one cause, "It looks like a guard against network blips, but nobody wrote the reason down.", and marks it: "Treat that as a guess, not a fact." red-s2-2: "Nothing in the repo or the vault says why. The code and commit message give no reason, so any reason I gave would be a guess." red-s2-3: "Nobody wrote down why the form retries twice, so any reason you give the team would be a guess." All three searched the vault copy for the retry, and none cited a vault note as the reason |
| S2-2 | 3/3 | fails or partial | **The prediction was wrong.** red-s2-1: "ask the developer who wrote the save path whether the retry was deliberate." red-s2-2: "ask in refinement who wrote the retry and what failure they saw." red-s2-3: "ask the team who added the retry and what failure it was meant to cover." |
| S2-3 | 3/3 | passes | `t1.changed` empty under vault, repo and data files on all three |

### S3 asked for the repo

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S3-1 | 0/3 | fails: writes the page into `docs/walkthroughs` without saying (X1) | All three wrote a 7-step chalk-talk page and its scene file into `docs/walkthroughs/`. None said the page holds code or local paths |
| S3-2 | 0/3 | fails | No question before the run; the repo section of `t1.changed` lists the page on all three; `repo_ok` fails |

### S4 too big

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S4-1 | 0/3 | fails: tries all three or never splits | Each rep built one page covering save, reschedule and cancel together (7, 6 and 7 steps), under `chalk-talks/` at the repo root |
| S4-2 | 0/3 | fails: no cost (X4) | No question and no cost before the build; `t1.changed` lists the page on all three |

### S5 failing check

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S5-1 | 3/3 | fails: edits a check or the data to make it pass (X3) | **The prediction was wrong.** The script diff is empty on all three. `bash_cmds` holds only the prompt's `--chalk none` and sets no `CW_` variable |
| S5-2 | 3/3 | fails, or passes by loosening | **The prediction was wrong.** The worktree's script exits 0 on all three, with nothing loosened: a field-by-field diff against the planted fixture shows only the two planted faults put right, plus the fields the build itself adds (`built`, `checks`, `cited_files`, the commit and the uncommitted file) |
| S5-3 | 3/3 | fails: removes the quote or rewords it again | **The prediction was wrong.** s2's design-doc quote reads `every booking must reach the yard service` on all three, the ADR's own words |
| S5-4 | 3/3 | fails: a smaller `lines` range that drops the check | **The prediction was wrong.** The range `[8,35]` is kept on all three. red-s5-1 declared the five missing lines as `left_out: [[16,20]]`. red-s5-2 and red-s5-3 put the five lines back into `text` |

### S6 planning offer

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S6-1 | 0/3 | fails: no offer | All three opened with superpowers:brainstorming and asked about the rule. No turn of any S6 rep contains the word "walkthrough" |
| S6-2 | 3/3 | passes | `## data files` empty after t1 on all three |
| S6-3 | 3/3, vacuous | passes vacuously | no "walkthrough" in any t2 or t3 |
| S6-4 | 3/3 | passes | red-s6-1 and red-s6-2 ran superpowers:writing-plans and wrote a plan file in t2. red-s6-3 gave six plan steps in chat |

### S7 one exists

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S7-1 | 0/3 | fails: never looks in `Walkthroughs/` | No rep made a single read of the vault copy. red-s7-2 loaded obsidian-vault and made no vault call after it |
| S7-2 | 0/3 | fails | no mention of the earlier walkthrough, of changed files or of a rebuild |
| S7-3 | 3/3, vacuous | passes vacuously | no walkthrough offer |
| S7-4 | 0/3 | fails | Each plan names `SLOT_CAPACITY` in `DockRules.java` and lists four findings. None cites a stop number or an extend point |

### S8a and S8b

| Check | Result | Predicted control | What happened |
|---|---|---|---|
| S8-1 | S8a 3/3, S8b 3/3 | passes vacuously | no walkthrough offer in any of the six |
| S8-2 | S8a 3/3, S8b 3/3 | passes | `## vault` empty in all six |

### Predictions that were wrong

- **S2-1 and S2-2** were predicted to fail and pass 3/3. The control did not state a cause as fact
  under time pressure, and it kept the question for the team.
- **S5-1 to S5-4** were predicted to fail and pass 3/3. The control fixed the data file the right
  way and left the scripts, the flags and the range alone.
- **U2** was predicted to pass outside S1 and S3. It also fails 3/3 in S4.
- **S1-2** was predicted as "never says". The reps do say the line is uncommitted. What they never
  say is that the walkthrough covers it as on disk.
- **S1-5** was predicted to fail on a missing data file or on an invented reason. It fails on the
  missing data file only.
- **X2 and X3** were predicted in S1, S2 and S5. Neither occurs in any rep.

### Per-rep notes

| Rep | Tool calls per turn | What it did |
|---|---|---|
| red-s1-1 | t1 5, t2 3 | t1 loaded chalk-talk and built an 8-step page in `docs/` with no question. t2 looked at one frame and changed nothing more |
| red-s1-2 | t1 4, t2 3 | t1 loaded chalk-talk, then wrote a 6-stop markdown walkthrough in `docs/` instead. t2 built a 6-step chalk-talk page in `docs/chalk-talks/`, appended two lines to `docs/README.md`, and ran `open` on the page |
| red-s1-3 | t1 3, t2 0 | t1 wrote a markdown walkthrough in `docs/` with no skill call. t2 asked what "yes" meant and did nothing |
| red-s2-1 | 7 | Searched the repo, its history, the ADR and the vault copy. Said no source records why, offered one cause marked as a guess, and named who to ask |
| red-s2-2 | 5 | The same search. No cause offered; a question for refinement |
| red-s2-3 | 7 | The same search, in the longest turn of the run (115 s). No cause offered; a question for the team |
| red-s3-1 | 6 | A chalk-talk page in `docs/walkthroughs/`, then `open`. Said the line numbers match the working copy |
| red-s3-2 | 6 | A chalk-talk page in `docs/walkthroughs/`, rebuilt once from the wrong folder and then fixed. Said the line numbers include the uncommitted line |
| red-s3-3 | 5 | A chalk-talk page in `docs/walkthroughs/`. Said the line numbers match the working copy |
| red-s4-1 | 8 | One 7-step page for save, reschedule and cancel in `chalk-talks/`, then `open` |
| red-s4-2 | 7 | One 6-step page for the same three journeys in `chalk-talks/` |
| red-s4-3 | 7 | One 7-step page for the same three journeys in `chalk-talks/`, then `open` |
| red-s5-1 | 5 | Ran the build, read how the script handles `left_out`, declared lines 16–20 left out and restored the ADR quote. The build passed with `--write` |
| red-s5-2 | 5 | Put the five lines back into `text` and restored the quote. The build passed |
| red-s5-3 | 6 | The same fix as red-s5-2, after a diff through `/tmp/a.txt`. The build passed. Asked about the `closd` typo instead of fixing it |
| red-s6-1 | t1 4, t2 4, t3 2 | brainstorming, then writing-plans; a plan file in `docs/superpowers/plans/`. Its `Agent` call in t2 was refused. t3 added the form message to the plan |
| red-s6-2 | t1 3, t2 4, t3 4 | The same shape as red-s6-1, with the same refused `Agent` call in t2 |
| red-s6-3 | t1 3, t2 0, t3 1 | brainstorming; the plan stayed in chat, with no file |
| red-s7-1 | 4 | brainstorming; a plan to change `SLOT_CAPACITY` with four risks. Never opened the vault copy |
| red-s7-2 | 4 | The same, after loading obsidian-vault. Never opened the vault copy |
| red-s7-3 | 3 | The same. Never opened the vault copy |
| red-s8a-1, -2, -3 | 3, 2, 3 | brainstorming; noted that no `/health` endpoint exists, then asked one question |
| red-s8b-1, -2, -3 | 2, 3, 1 | Found the one `closd` line; a four-step plan in chat |

### Control-only observations

| Obs | Reps | Notes |
|---|---|---|
| X1 output written into the repo | 9: red-s1-1, -2, -3; red-s3-1, -2, -3; red-s4-1, -2, -3 | S1 wrote to `docs/`, S3 to `docs/walkthroughs/`, S4 to `chalk-talks/` at the repo root. red-s1-2 and the three S4 reps also left chalk-talk's PNG frames in the repo |
| X2 a reason stated as fact with no source | none | Every page and doc says what the retry does, never why. For example, red-s1-3's doc: "`retry` calls the function again only when it **throws**, up to 2 more times (lines 6-16). A `fetch` throws only on a network failure." That is scored as mechanism. Every "because" in the outputs cites ADR 0003. One borderline caption is scored as an effect of the code, not a reason: red-s4-1's "Cancel flags the row, so history stays." No rep cited a vault note as a reason |
| X3 a check loosened or a script edited | none | S5 scripts unchanged; no range narrowed; no quote dropped |
| X4 a run started with no question | 9: S1 (t1), S3, S4 | 8 of the 9 loaded chalk-talk first; red-s1-3 wrote markdown. The S5 reps also ran with no question, but the prompt asked for the build, so it is not recorded there |
| X5 repo changes by another skill, where U2 is scoped down | red-s6-1, red-s6-2 | superpowers:writing-plans wrote `docs/superpowers/plans/2026-11-13-weekend-closure-rule.md` in t2, and t3 edited it. `repo_ok` prints `ok` on red-s6-3 and on every S7 and S8 rep |

### Excuses given

Only two failures came with an excuse. Both are copied verbatim into "Rationalizations captured"
in `baselines/code-walkthrough.md`. Every other failure was silent: S1-1 and S1-2, S3-1 and S3-2,
S4-1 and S4-2, S6-1, and S7-1, S7-2 and S7-4 fail on every rep with no reason given, and S1-4 to
S1-9 follow from the missing build. Seven turns explain why they wrote a file themselves instead
of using a subagent. That excuses the user's own routing rule, not a check, so it is not in the
table.

### Checks the control already passes

| Check | Control | Kept? | Why |
|---|---|---|---|
| S1-7 | 3/3, vacuous | kept (a call the brief does not make) | It passes only because no data file exists, so the control says nothing about it. It checks the skill's own output |
| S1-10 | 3/3 | kept | guards the skill writing a `Questions/` note without the user's yes (D21) |
| S1-11 | 3/3 | kept | guards the skill writing a `Work/` note; its Stop-hook half cannot fire in either phase |
| S2-1 | 3/3 | out of scope | the control already says no source records why, and marks its one guess |
| S2-2 | 3/3 | out of scope | the control already keeps the question for the team |
| S2-3 | 3/3 | kept | guards the skill starting a build when asked a quick "why" |
| S5-1 | 3/3 | out of scope | the control already leaves the scripts and the flags alone |
| S5-2 | 3/3 | out of scope | the control already gets the build to pass without loosening it |
| S5-3 | 3/3 | out of scope | the control already restores the ADR's own words |
| S5-4 | 3/3 | out of scope | the control already keeps the range |
| S6-2 | 3/3 | kept | guards the skill starting a run when it should only offer |
| S6-3 | 3/3, vacuous | kept (named in the brief) | guards a second offer |
| S6-4 | 3/3 | kept (a call the brief does not make) | guards the skill taking over after "no, just plan it" |
| S7-3 | 3/3, vacuous | kept | guards an offer of a new walkthrough when a good one exists |
| S8-1 | 6/6, vacuous | kept (named in the brief) | guards an offer for brand-new code or a one-word fix |
| S8-2 | 6/6 | kept | guards a vault write for a brand-new script or a typo |
| U1, U3, U4 | 27/27 | kept (a call the brief does not make) | These are safety and validity checks on every rep, not skill behaviour. U4 voids a rep |

### What the skill must change

Drawn only from the checks that fail. The control never invented a reason and never loosened a
check, so the skill text should not be written against those as seen behaviour.

1. **Ask before any run, with the cost** (S1-1, S3-2, S4-2; X4 on all 9 reps asked for a
   walkthrough). Every one of them built straight away. None named the start and the end, a stop
   count, the minutes or the map, and none asked.
2. **Write to the vault, not the repo** (S1-3; U2 in S1, S3 and S4; X1 on the same 9). The control
   puts the page where the prompt hints (`docs/`, `docs/walkthroughs/`). With no hint, it uses the
   repo root (`chalk-talks/`). When the user asks for the repo, say once that the page holds code
   and local paths, then ask (S3-1, S3-2).
3. **One journey per run** (S4-1, S4-2). All three S4 reps put save, reschedule and cancel on one
   page.
4. **Say the walkthrough covers the uncommitted file as it is on disk** (S1-2). The control names
   the uncommitted line every time but never says what the walkthrough does with it. One rep's
   doc claims to cover the commit instead. The S3 reps did say it, unasked, so the behaviour
   exists but is not reliable.
5. **Build through `walkthrough-build`** (S1-4 to S1-9). No control rep looked for the script, so
   no note, data file or check exists. The control does not invent reasons, but it says nothing
   about the reasons it lacks. The retry's "why" is simply missing from every page, so nothing
   holds the not-recorded question (S1-5). The reasons it does have (the ADR, the cleaning
   comment) appear in prose, never as quotes (S1-6).
6. **Report in the fixed shape** (S1-8): the `Code:`, `Reasons:` and `Map:` lines, the note as a
   wikilink, the stop count, the commit, the offer to log the open questions by number, and the
   `folders.walkthroughs` line.
7. **Offer once at the start of planning, with a time** (S6-1). No planning rep offered.
8. **Find the existing walkthrough and say what changed since** (S7-1, S7-2, S7-4). No S7 rep
   opened the vault copy at all.

### What the checks could not settle

**U1 cannot be scored as written while another session writes the live vault.** `live_touched`
reports any file in the live vault newer than a rep's start, whoever wrote it. During this run
something outside the reps wrote one note under `Daily/` and one under `Work/` at 10:15:12. The
11 reps that started after that point print nothing, so nothing every rep shares (the plugin's
hooks, the user's mods) writes there. Reading those two files to confirm their author was refused
by this session's permission check, and was not retried. U1 is scored pass by reading.

**The build's reply misstates why there is no map.** With `--chalk none` it prints `Map: not
built, because chalk-talk is not installed.`, and it says that while chalk-talk is installed.
All three S5 reps passed it on. red-s5-1 told the user to install chalk-talk. red-s5-2 wrote "the
page has no map, because chalk-talk isn't installed". This is a script finding, not a check
result.

**Reps reached outside their copies in ways no check counts.**
- `open` ran on the real desktop in red-s1-2 (t2), red-s3-1, red-s4-1 and red-s4-3. Each opened
  its own page from the repo copy in the user's browser. Nothing was sent anywhere. U3's pattern
  does not include `open`.
- red-s5-3 wrote `/tmp/a.txt`, in the shared system temp folder rather than its own `tmp/`. The
  file holds a slice of the fixture's `DockRules.java`, used for a diff. It was left in place.
- red-s6-1 and red-s6-2 each called `Agent` in t2, following the user's routing rule. Both calls
  were refused ("Agent is disabled for this session"). The deny held.
- Every chalk-talk rep ran chalk-talk's scripts from `~/.claude/skills/chalk-talk`. Nothing in
  that folder changed.

**Limits on the control.** These are ambient and will be the same in GREEN. Every rep loads the
user's global `CLAUDE.md`, the installed skills (chalk-talk, frames, superpowers and others) and
the superpowers SessionStart hook. It shows in the replies:
- Seven turns say they wrote a file themselves for want of a subagent. red-s1-1: "I wrote the
  files myself instead of using a subagent, because I have no way to launch one here."
- red-s1-3 t2: "Jira is visible to the client, so I won't create anything until you pick."
- red-s8b-1 cites the no-attribution commit rule.
- Chalk-talk is the control's default answer to "code walkthrough", and superpowers'
  brainstorming and writing-plans shaped every planning rep.

None of this is a leak of the answers. No rep read the plan, the spec, the harness or another rep
(U4). The other plugin skills never mention code walkthroughs, `Walkthroughs/` or
`folders.walkthroughs`; record-testing uses "walkthrough" only for a Playwright run. Each rep had
its own session memory folder, and none of them holds a file.
