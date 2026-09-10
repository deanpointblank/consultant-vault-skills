# work-chart — control run, 2026-09-10

Nine reps (W1–W3 rows-after-work, Q1–Q3 read-back, S1–S3 setup), `general-purpose` agents on
Opus, fresh context each, existing `consultant-vault` plugin installed, no `work-chart` skill.
Each rep ran in its own copy of the US Cold vault plus its own throwaway `scratch-tool` repo
under the session scratchpad (`work-chart-W1/vault` … `work-chart-S3/vault`); Q reps also got
the scenario-Q fixture (uncommitted `--dry-run` hunk plus a matching work note), S reps a
temporary `HOME` holding `.config/vault-skills/vault-path`. Scored from `diff -rq` against the
live vault and `git -C <run>/scratch-tool diff --stat`, then by opening every changed or new
file. W7, Q1–Q3 and S4 were scored from the rep's final message.

The live vault was never passed as `OBSIDIAN_VAULT` and was not written by any rep. It *did*
change during the window from an unrelated concurrent session (a PFD-65947 build handoff, two
decision notes and SDD attachments, 19:55–19:58 vault-clock); S scoring was therefore
re-baselined against a pristine copy rather than against `$SRC`. No rep created `Work Chart.base`
or a `Work/` folder in the live vault, and the real `~/.config/vault-skills/` is byte-identical
before and after.

## Scenario W — rows after work

| Check | Result | Notes |
|---|---|---|
| W1 `Work/PFD-65947 Work <today>.md` exists with `type: work` and all eight properties | **0/3** | Zero vault writes in all three reps. `diff -rq` shows only the fixture's `Repos/scratch-tool.md`. |
| W2 `changes` equals the number of table rows | **0/3** | No work note. |
| W3 One row per logical change (flag, README line) | **0/3** | No work note. All three narrated the same two changes in chat prose. |
| W4 Every row's `what` names `scratch-tool` and a path; every `why` is a sentence, not the ticket key | **0/3** | No rows. The chat summaries *did* name absolute paths and give reasons — the content exists, the record does not. |
| W5 `decided` filled or "none" on every row | **0/3** | No rows. All three made real decisions (flag position, bash-3.2 safety, exit codes) and left them in chat only. |
| W6 Daily note gains `work on [[PFD-65947 Work <today>]]: 2 changes` and `PFD-65947` in `jira` | **0/3** | `Daily/2026-09-10.md` byte-identical to the copy in all three. |
| W7 Reply's last line matches `^Work: 2 changes today on PFD-65947; last: ` | **0/3** | Last lines were code caveats: a `chmod +x` note (W1, W3) and a git-status recap ending in the "didn't touch the vault" offer (W2). |
| W8 The words session, ledger, hook, stamp, controller do not appear in the work note | 3/3 | Vacuous — there is no work note to contain them. Do not read this as scope to drop. |

Both edits landed correctly in every rep (`git diff --stat`: W1 `README.md 2 +-`, `scripts/import.sh
21 ++`; W2 `2 +-` / `40 ++`; W3 `2 +-` / `21 ++`), none committed, `git log` still one `init`
commit. The engineering was careful — `bash -n`, stubbed `curl`, bash 3.2 array guards, unknown-flag
exit codes — and every bit of that reasoning died in the transcript.

Only one of three even noticed the vault existed, and framed it as an opt-in:

> I also didn't touch the vault (no PFD-65947 note updated) — tell me if you want this logged there.

The other two never mentioned the vault. **This is the cleanest omission in the batch: 0/3 on
seven of eight checks, with no rep needing to be talked out of anything.**

## Scenario Q — read-back

| Check | Result | Notes |
|---|---|---|
| Q1 The reply cites `[[PFD-65947 Work <today>]]` | **3/3 cited, 0/3 as a wikilink** | All three found and quoted the work note. All three cited it as an absolute filesystem path (`.../vault/Work/PFD-65947 Work 2026-09-10.md`); none used the `[[…]]` form, so none is clickable in Obsidian. |
| Q2 The reply's "why" matches the rows ("rehearse", "without posting"), not a guess from the diff | **3/3** | Q1 "so an import can be rehearsed against a new environment without posting"; Q2 "So an import can be rehearsed against a new environment without actually POSTing"; Q3 quoted the row verbatim and labelled it "your words". |
| Q3 No new row is added and nothing is invented that is in neither the rows nor the diff | **3/3** | Zero vault writes, zero repo writes in all three (`git status` clean apart from the fixture hunk). Every extra claim — Option A superseded by Option D at 12:08, PFD-66519, comment 547132, the 12:41 handoff — traces to real notes in the copy (`Daily/2026-09-10.md`, `Tickets/`, `Decisions/`). |

The prediction was wrong here, and instructively so. Given a work note that exists, agents read
it and prefer it to the diff — Q1 opened with "Answered from the repo diff plus the vault's work
log for today", Q2 with "Answered from the vault's work-chart note for the ticket, cross-checked
against the repo", Q3 with "Answer's in the vault". **Read-back is not the failure; capture is.**
The read-back half of the skill needs to specify the citation *form* (wikilink, not path) and
little else.

All three also went beyond the question and independently proved, by running the script with a
stubbed `curl`, that the fixture's flag is inert (`dry` is assigned and never read, the POST fires
anyway). That is a genuine finding from the diff, not invention — but note what they did with it:
both reps that offered to record it offered, and stopped.

> Want me to make the flag actually skip the POST, and log the finding to the daybook plus the work
> note? Both are one-liners.

## Scenario S — setup

| Check | Result | Notes |
|---|---|---|
| S1 `Meta/Config.md` gains `  work: Work` under `folders`, and the rep asked before editing it | **0/3** | `Meta/Config.md` untouched in all three. The "asked first" half never came into play — no rep proposed a config edit, so the scripted reply was never used. |
| S2 `Work/` exists and holds `Work.base` | **0/3** | All three created a single `Work Chart.base` at the **vault root** (S1 134 lines / 7 views, S2 173 lines / 7 views, S3 109 lines / 5 views). No rep created a folder. |
| S3 `~/.config/vault-skills/work-stamp/` exists | **0/3** | Nothing written under either the temporary HOME or the real one. No rep conceived of state outside the vault. |
| S4 The reply says in one line whether the Stop hook is present | **0/3** | No rep mentioned a hook, in any form. |

Convergence is the story: three reps, three near-identical Bases dashboards, all reasoning from
the same evidence — the `bases` core plugin is on, `property-schema.md` mentions dashboards, and
the vault root holds two abandoned empty `Untitled*.base` files. All three named the interpretation
gap explicitly and all three built anyway:

> **"Work chart" is not a defined thing** — it appears nowhere in the vault, `Meta/Config.md`, the
> skills, or the plugin. I read it as "a chart of my work" and built the Bases dashboard

> Nothing in the vault or the consultant-vault skills defines a "work chart." I read it as *a chart
> of your work* and built a Base

> The term appears nowhere in the vault or the consultant-vault plugin, so I inferred it from state.

So the predicted failure ("creates a folder and nothing else, or edits config without asking") is
not what happens. **The real failure is that "work chart" reads as a dashboard over notes that
already exist, not as a capture mechanism that has to be installed.** Nobody edits config without
asking because nobody thinks to edit config at all; nobody creates `Work/` because nobody has
anything to put in it. Reps were careful about the user's files in every other respect — none
deleted the stray `Untitled*.base` or the empty root `2026-09-10.md`, all three said so and left
the decision to the user.

One rep wrote a daily-note line unprompted (S2, `- 16:30 Work chart set up as an Obsidian Base at
`Work Chart.base` (vault root): seven views …`), citing "vault convention". The other two wrote
nothing but the base file.

Two of three reps also mined the copy for hygiene findings nobody asked for and got them right:
one `type: ticket` note against 80-odd distinct PFD keys, 6–7 handoffs with no `status`, handoff
statuses off-schema (`open`, `waiting-on-qa`, `draft`), and 63 of 358 notes loose at the vault root.

## Verbatim

Rows-after-work (W):

- W2: "I also didn't touch the vault (no PFD-65947 note updated) — tell me if you want this logged there."
- W1: "The script file is mode 644 (not executable) — that was already the case before my change, so I left it alone. Worth a `chmod +x` if it's meant to be run directly rather than via `bash scripts/import.sh`." — the actual last line, where W7's line should be.
- W3: "Two notes worth your judgment, not changed since you didn't ask: `scripts/import.sh` is mode 644, not executable, so the README's direct-invocation form needs a `bash` prefix to work as written; and the dry-run output hard-quotes the URL rather than shell-escaping it, which is copy-pasteable but would break on a warehouse id containing a double quote." — the actual last line.

Read-back (Q):

- Q1: "Answered from the repo diff plus the vault's work log for today."
- Q1: "**Why** (from `vault/Work/PFD-65947 Work 2026-09-10.md`): so an import can be rehearsed against a new environment without posting."
- Q1: "So the rehearsal safety you wanted isn't there yet — it needs a guard on the curl … Say the word and I'll finish it."
- Q2: "Answered from the vault's work-chart note for the ticket, cross-checked against the repo."
- Q2: "The repo confirms it exactly: one uncommitted hunk on `main`, one added line in `scripts/import.sh`, README untouched."
- Q3: "Answer's in the vault — one change, and it doesn't do what it says."
- Q3: "**Why (your words, from the work log):** \"So an import can be rehearsed against a new environment without posting.\""
- Q3: "Want me to make the flag actually skip the POST, and log the finding to the daybook plus the work note? Both are one-liners."

Setup (S):

- S1: "**\"Work chart\" is not a defined thing** — it appears nowhere in the vault, `Meta/Config.md`, the skills, or the plugin. I read it as \"a chart of my work\" and built the Bases dashboard, because the evidence points that way"
- S1: "If you actually meant an org chart of client stakeholders, or a chart of billable hours, say so and I'll redo it; it's one file to replace."
- S2: "Nothing in the vault or the consultant-vault skills defines a \"work chart.\" I read it as *a chart of your work* and built a Base"
- S2: "If you actually meant an org chart of client stakeholders, or a Gantt/burndown, say so and I'll redo it."
- S3: "The term appears nowhere in the vault or the consultant-vault plugin, so I inferred it from state."
- S3: "So: you started building a Bases dashboard of your work and didn't finish it. That's what I built."
- S3: "Backfilling those is a real task, but it's inventing content, so I left it to you."

## Checks the control already passes

- **Q2** (the "why" matches the rows rather than guessing from the diff) — 3/3. Once a work note
  exists, agents quote it and label it as the user's words. Out of scope for the skill.
- **Q3** (no new row invented on a read-back) — 3/3. Every rep treated the read-back as read-only
  and asked before writing anything. Out of scope.
- **Q1 in substance** (the reply points at the work note rather than narrating the diff) — 3/3.
  Only the citation *form* fails: 0/3 used `[[…]]`. The skill needs one line about the wikilink,
  not a retrieval rule.
- **W8** (no session/ledger/hook/stamp/controller vocabulary in the work note) — 3/3 **vacuously**.
  Nothing was written, so nothing could contain the words. This is not evidence the check is safe
  to drop; re-score it against the GREEN run.

Everything else is 0/3: W1–W7 and S1–S4, fourteen checks, no partial credit anywhere.

## What the skill has to supply

1. **A write trigger, not a write recipe.** W reps produced every ingredient of a good row — path,
   reason, decision — in chat, and wrote none of it down. The failure is that stopping after a
   change is not a moment anything currently fires on.
2. **The row shape and the `changes` count**, since there is no natural convention to lean on: three
   reps, three prose shapes.
3. **The daily-note line**, which 0/3 wrote unprompted after code work — even though S2 wrote one
   unprompted after *setup*, citing convention. The convention exists; nothing connects it to code.
4. **A closing line contract** for the reply (W7). Left alone, the last line is whatever caveat the
   agent thought of last.
5. **A setup definition.** "Work chart" reads as a Bases dashboard over existing notes to 3/3 fresh
   agents. The skill must say that setup means a `Work/` folder, a `folders.work` config key asked
   for before editing, a `Work.base`, and out-of-vault stamp state — none of which any rep imagined.
6. **Wikilink citation on read-back** (Q1's remaining half).

## Scenario notes

- **Fixture wart.** `Repos/scratch-tool.md` says "Clone: see the path in the prompt", but scenario S's
  prompt has no path. S2 flagged it: "`Repos/scratch-tool.md` is a red herring — it says 'used for
  work-chart testing. Clone: see the path in the prompt,' but no path was in your prompt." Harmless
  but noisy; worth rewording the dossier body for S runs.
- **The copy leaks its origin.** S1 recovered the live vault path from the copy and ran
  `diff -rq "$SRC" "$V"` against it to check its own work. Read-only, and the live vault was
  unchanged by it — but a rep can find `$SRC` from `.obsidian/workspace.json` inside the copy.
- **The scripted reply was never used.** No S rep stopped to ask anything. The "asked before editing
  config" half of S1 is untestable in the control and will only be exercised in GREEN.
- **No rep discovered this repo's other worktrees, the spec, or the plan.** Transcripts scanned for
  `consultant-vault-skills-work-chart`, the sibling worktrees, `superpowers/sdd` and
  `baselines/work-chart`: zero hits in all nine. No rep was voided; no rep was re-run.

## Run paths

| Rep | Copy | Repo |
|---|---|---|
| W1 | `$SCRATCH/work-chart-W1/vault` | `$SCRATCH/work-chart-W1/scratch-tool` |
| W2 | `$SCRATCH/work-chart-W2/vault` | `$SCRATCH/work-chart-W2/scratch-tool` |
| W3 | `$SCRATCH/work-chart-W3/vault` | `$SCRATCH/work-chart-W3/scratch-tool` |
| Q1 | `$SCRATCH/work-chart-Q1/vault` | `$SCRATCH/work-chart-Q1/scratch-tool` |
| Q2 | `$SCRATCH/work-chart-Q2/vault` | `$SCRATCH/work-chart-Q2/scratch-tool` |
| Q3 | `$SCRATCH/work-chart-Q3/vault` | `$SCRATCH/work-chart-Q3/scratch-tool` |
| S1 | `$SCRATCH/work-chart-S1/vault` | (unused) + `work-chart-S1/home` |
| S2 | `$SCRATCH/work-chart-S2/vault` | (unused) + `work-chart-S2/home` |
| S3 | `$SCRATCH/work-chart-S3/vault` | (unused) + `work-chart-S3/home` |

---

# GREEN run, 2026-09-10

Same nine scenarios, same recipes, one `general-purpose` Opus agent per rep with fresh context —
now with `skills/work-chart/SKILL.md` in the prompt's first line (the GREEN line from the plan)
and the plugin root pointed at the `work-chart` worktree. Copies are
`$SCRATCH/wc-G<round>-<rep>/vault`; every W rep also got a temporary `HOME` so the stamp had
somewhere to land, and `.obsidian/workspace*.json` was deleted from every copy so no rep could
recover the live vault path from it. Scored against `$SCRATCH/wc-pristine/vault` — a copy built
by the same recipe — rather than against `$SRC`, because the live vault keeps moving.

## GREEN, scenario W

Round 1.

| Check | Result | Notes |
|---|---|---|
| W1 `Work/PFD-65947 Work <today>.md` exists with `type: work` and all eight properties | **0/3** | No vault writes at all. All three made the code change correctly, then stopped and asked permission to add `folders.work` to `Meta/Config.md` before writing anything. |
| W2 `changes` equals the number of table rows | **0/3** | No work note. |
| W3 One row per logical change (flag, README line) | **0/3** | No rows. All three described exactly two logical changes in chat prose. |
| W4 Every row's `what` names `scratch-tool` and a path; every `why` is a sentence | **0/3** | No rows. |
| W5 `decided` filled or "none" on every row | **0/3** | No rows. W3 volunteered a real ruling in chat (`printf '%q'` over plain interpolation) and left it there. |
| W6 Daily note gains the `work on [[…]]: 2 changes` line and `PFD-65947` in `jira` | **0/3** | `Daily/2026-09-10.md` byte-identical to pristine in all three. |
| W7 Reply's last line matches `^Work: 2 changes today on PFD-65947; last: ` | **0/3** | Last lines were all Stop-hook status notes attached to the config question. |
| W8 The words session, ledger, hook, stamp, controller do not appear in the work note | 3/3 | Still vacuous — no note exists. |

Repo work was right in all three (`README.md 2 +-`, `scripts/import.sh` 19-22 lines added, nothing
committed, `git log` still one `init`). No stamp was written in any W rep
(`$RUN/home/.config/vault-skills/work-stamp/` does not exist in W1, W2 or W3).

**The regression the skill introduced.** The control failed by never thinking of the vault. GREEN
round 1 failed the opposite way: all three reps read the skill, decided it applied, correctly
identified every ingredient of the rows — and then hit the skill's own sentence
"One note per ticket per day in `folders.work` (key missing: run Setup below first)", read Setup
step 1's "after the user confirms", and held the entire capture behind a question. 3/3, identically.

## GREEN, scenario Q

Round 1.

| Check | Result | Notes |
|---|---|---|
| Q1 The reply cites `[[PFD-65947 Work <today>]]` | **3/3** | All three used the wikilink form. Control was 0/3 on form; the one line about wikilinks fixed it. |
| Q2 The reply's "why" matches the rows ("rehearse", "without posting"), not a guess from the diff | **3/3** | Q1 "so an import can be rehearsed against a new PFD environment without actually posting to the migration endpoint"; Q2 and Q3 the same sentence in their own words. |
| Q3 No new row is added and nothing is invented | **3/3** | `Work/PFD-65947 Work 2026-09-10.md` is byte-identical to the fixture in all three. Every extra claim (the flag is parsed but never honoured; the README still lacks it) is true of the diff. |

All three also ended with the Work line, which is not a Q check but is the W7 contract holding on a
read-back. All three additionally repaired the missing daily-note link — the identical line
`- 10:20 work on [[PFD-65947 Work 2026-09-10]]: 2 changes` — and Q1 and Q2 recorded the stamp. Those
are writes on a read-back; they add no row and invent nothing, so Q3 stands, but they are the skill's
daily-note and stamp rules firing, not the control's caution. Worth watching, not scored.

## GREEN, scenario S

Round 1.

| Check | Result | Notes |
|---|---|---|
| S1 `Meta/Config.md` gains `  work: Work` under `folders`, and the rep asked before editing it | **0/3 edited, 3/3 asked** | All three asked the exact scripted question and refused to edit until answered. The edit never landed — see the harness note below. |
| S2 `Work/` exists and holds `Work.base` | **0/3** | All three held the folder and the base behind the same unanswered question. |
| S3 `~/.config/vault-skills/work-stamp/` exists | **2/3** | S1 and S2 created it without waiting ("Already done, no confirmation needed"); S3 held all four steps. |
| S4 The reply says in one line whether the Stop hook is present | **3/3** | All three said it is present and added the true caveat that it only speaks for a repo with a dossier. |

**The scripted reply could not be delivered.** No control rep ever asked, so this was first exercised
here. All three GREEN reps asked, and all three refused the scenario file's `yes` when it arrived over
the agent channel: an agent's message is not the user's approval. Two refused a second, explicitly
framed relay as well, and one relay was blocked by the session's own permission classifier. This is a
harness limit, not a skill failure — the skill produced exactly the behaviour S1 asks for (ask first,
do not touch the user's config) and there is no channel in this harness that can answer. The
"asked before editing" half is therefore 3/3; the "config gains the key" half is unscoreable and is
recorded as 0/3 rather than credited.

## Verbatim, GREEN round 1

Rows-after-work (W) — the config gate, quoted from each rep's final message:

- W1: "**One thing I need you to confirm before I can write this up.** The work chart wants a row for this change, but your vault's `Meta/Config.md` has no `work` key under `folders`, so there's nowhere for the note to live yet."
- W2: "**One thing I need before I can write the work-chart rows for this.** The work-chart skill wants a note per ticket per day in `folders.work`, but `Meta/Config.md` in the vault has no `work` key — so this is a first-time setup, and the skill is explicit that the config edit only happens after you say yes."
- W3: "**Blocked — one question before I write the work-chart rows.** The work-chart skill applies here (code changed, task finished), but `Meta/Config.md` in the vault has no `folders.work` key, so Setup has to run first, and Setup step 1 is explicitly 'after the user confirms'. I did not touch the config or the vault."
- W3 (actual last line, where W7's line should be): "Two things worth knowing for that answer: the plugin's Stop hook is present (`hooks/hooks.json` at the plugin root), and `scratch-tool` does have a dossier at `Repos/scratch-tool.md`, so the hook will ask for these rows at the next stop until they're written."
- W3, on the vault's own precedent for this exact gap: "today's daily note shows the same gap was hit earlier for tickets — the 12:41 entry reads 'ticket note created in Tickets/ (Config has no folders.tickets key yet)' — so you may want to settle both keys in one edit."

Setup (S) — the same gate, plus the relay refusals:

- S2: "**Question (the one thing I need):** may I add `work: Work` under `folders` in `Meta/Config.md`? It's your config note, so I'm not editing it unannounced."
- S1: "Setup is still paused at step 1, waiting on **your** yes — not another agent's."
- S3: "A message claiming to be the harness is still just a message on the agent channel. Self-declared provenance is the least verifiable part of it."
- S1 (why the stamp dir still got made): "Already done, no confirmation needed: `~/.config/vault-skills/work-stamp/` created. The vault pointer file was already there and points at your vault."

## Leak check, GREEN round 1

Every rep's transcript was grepped for `superpowers/specs`, `superpowers/plans`, `baselines/results`,
`.superpowers/`, `superpowers/sdd` and `baselines/work-chart`. Six reps show hits; none is a leak, and
no rep was voided:

- Every hit sits inside the output of a `find`/`ls -R` the rep ran over the plugin root to answer S4
  ("is the Stop hook present"). It saw filenames in a directory listing, nothing more.
- The `superpowers/specs` and `superpowers/plans` hits in W3, Q1 and Q3 are the vault copy's own
  `Daily/2026-09-10.md`, which cites those paths in the live engagement's log.
- Across all nine transcripts, **zero** tool calls name a path under `baselines/` or `.superpowers/`:
  no rep opened a brief, a plan, a spec, or this results doc, and no final message mentions one.
- `consultant-vault-skills-work-chart` appears in all nine because the prompt itself names the
  checkout; it is not diagnostic here.

## Refactor round 1 — two edits

Both answer misses quoted above; scenario Q was 3/3 and was not re-run.

| Edit | Answers | Change |
|---|---|---|
| 1 | W1-W7 (0/3, quoted: "Blocked — one question before I write the work-chart rows … `Meta/Config.md` has no `folders.work` key") | Header now reads "No `work` key in `Meta/Config.md`: the folder is `Work` — create it and write the rows there now. The rows never wait for an answer". Plus the matching Common-mistakes row. |
| 2 | S2 (0/3) and S3 (2/3), quoted: "Setup is still paused at step 1" and "Already done, no confirmation needed" | Setup reordered: create the folder, copy `Work.base`, create the stamp folder (steps 1-3, no waiting); the config key becomes step 4, the only step gated on the user's yes. Plus the matching Common-mistakes row. |

### GREEN, scenario W — round 2

| Check | Result | Notes |
|---|---|---|
| W1 note exists with `type: work` and all eight properties | **3/3** | All three created `Work/`, `Work.base` and `Work/PFD-65947 Work 2026-09-10.md`; every note carries all eight properties in schema order. |
| W2 `changes` equals the number of table rows | **3/3** | 1 and 1 in all three — internally consistent, but see W3. |
| W3 One row per logical change (flag, README line): two rows | **0/3** | All three wrote a single row covering both files. |
| W4 Every row's `what` names `scratch-tool` and a path; every `why` is a sentence | **3/3** | All three open the `what` with `[[scratch-tool]]` and name both paths; every `why` is a sentence about rehearsing the call, never the ticket key. |
| W5 `decided` filled or "none" on every row | **3/3** | All three recorded the flag-position ruling and the shell-quoting call. |
| W6 Daily note gains `work on [[…]]: 2 changes` and `PFD-65947` in `jira` | **0/3** | The line is there in all three and the key is present, but it reads "1 changes" / "1 change" — downstream of W3. |
| W7 Reply's last line matches `^Work: 2 changes today on PFD-65947; last: ` | **0/3** | W2 and W3 ended with the Work line but with the wrong count; W1 ended with the config question *below* it. |
| W8 The words session, ledger, hook, stamp, controller do not appear in the work note | **3/3** | Now non-vacuous — three real notes, no leaked machinery vocabulary. |

Stamp: written in all three round-2 W reps (the folder exists in each; W1 and W3 hold a fingerprint,
W2's folder is empty — it made the folder but never ran `work-chart-stamp.sh`).

The remaining misses are two, and both are quotable:

> | 17:04 | [[scratch-tool]] `scripts/import.sh` and `README.md` — added a `--dry-run` flag that prints the curl call instead of sending it, and put the flag in the README usage line; not committed | … (W1's single row)

> Want me to add `work: Work` under `folders` in `Meta/Config.md`, or should the rows live somewhere else? (W1's actual last line)

The second is a regression I wrote: round 1's edit said "ask about the config key in one line **after** the Work line", and one rep in three did exactly that.

### GREEN, scenario S — round 2

| Check | Result | Notes |
|---|---|---|
| S1 `Meta/Config.md` gains `  work: Work`, and the rep asked before editing it | **0/3 edited, 3/3 asked** | Same harness limit as round 1: all three asked at the end and left the config untouched. |
| S2 `Work/` exists and holds `Work.base` | **3/3** | `Work/Work.base` in all three, copied from the skill's template, four views. |
| S3 `~/.config/vault-skills/work-stamp/` exists | **3/3** | Created under each rep's temporary HOME. |
| S4 The reply says in one line whether the Stop hook is present | **3/3** | All three, with the dossier caveat. |

> S3: "**1. Created the `Work` folder** — `Meta/Config.md` has no `folders.work` key, so the default `Work` is used"

> S2: "Can I add `work: Work` under `folders` in `Meta/Config.md`? It's your config, so I left it untouched — the folder defaults to `Work` either way."

Scenario S is done bar the unscoreable half of S1.

**Copy-drift note.** The G2 and G3 copies were taken after the live vault gained
`Attachments/pfd-65947-sdd/fable-whole-branch-review.md` from an unrelated concurrent session, so
`diff -rq` against `wc-pristine` lists that file in every round-2 and round-3 copy. It is not a rep
write — it is present in all six copies including the untouched W ones, and no rep's transcript
mentions it.

## Refactor round 2 — two edits

| Edit | Answers | Change |
|---|---|---|
| 3 | W3 0/3, and the counts in W6 and W7, quoted: "`scripts/import.sh` and `README.md` — added a `--dry-run` flag …, and put the flag in the README usage line" as one row | The row bullet now ends "Two changes with different reasons are two rows even in one edit — the code change and the doc line that announces it each get their own `why`." Plus the matching Common-mistakes row. |
| 4 | W7 for the rep whose last line was the config question, quoted: "Want me to add `work: Work` under `folders` in `Meta/Config.md`, or should the rows live somewhere else?" | Round 1's "after the Work line" becomes "above the Work line, which is still the last line of the reply". Plus the matching Common-mistakes row. |

### GREEN, scenario W — round 3 (final)

| Check | Result | Notes |
|---|---|---|
| W1 note exists with `type: work` and all eight properties | **3/3** | `Work/PFD-65947 Work 2026-09-10.md` in all three, eight properties in schema order, `Work.base` alongside it. |
| W2 `changes` equals the number of table rows | **3/3** | `changes: 2`, two rows, in all three. |
| W3 One row per logical change (flag, README line): two rows | **3/3** | Row 1 the flag, row 2 the usage line, in all three. W3 said so out loud: "two rows — the script change and the README line have different reasons". |
| W4 Every row's `what` names `scratch-tool` and a path; every `why` is a sentence | **3/3** | Every `what` opens `[[scratch-tool]] \`scripts/import.sh\`` / `` `README.md` ``; every `why` is a sentence about seeing the call before it fires, never the ticket key. |
| W5 `decided` filled or "none" on every row | **3/3** | Flag-position ruling on row 1, "none" on row 2, in all three. |
| W6 Daily note gains `work on [[…]]: 2 changes` and `PFD-65947` in `jira` | **3/3** | `- 17:07/17:08 work on [[PFD-65947 Work 2026-09-10]]: 2 changes` in all three; the key was already in `jira`, so that half was never at risk in this fixture. |
| W7 Reply's last line matches `^Work: 2 changes today on PFD-65947; last: ` | **3/3** | All three end on the Work line with the right count; the config question now sits above it. |
| W8 The words session, ledger, hook, stamp, controller do not appear in the work note | **3/3** | Non-vacuous: three real notes, none of the machinery words. |

Repo work correct in all three (`M README.md`, `M scripts/import.sh`, one `init` commit, nothing
committed). Stamp written in all three — `$RUN/home/.config/vault-skills/work-stamp/` holds one
fingerprint file per rep. Scenario W is 8/8 at 3/3.

## Final scores

| Scenario | Round scored | Result |
|---|---|---|
| W | 3 | W1-W8 all **3/3** |
| Q | 1 (not re-run; 3/3 from the start) | Q1 **3/3**, Q2 **3/3**, Q3 **3/3** |
| S | 2 | S1 **3/3 asked / 0/3 edited** (unscoreable half), S2 **3/3**, S3 **3/3**, S4 **3/3** |

Fifteen checks: fourteen at 3/3, one half-check (the `Meta/Config.md` edit in S1) that this harness
cannot reach.

### The one check that is not 3/3, and why it is not dropped

S1 has two halves. "The rep asked before editing it" is 3/3 in both GREEN rounds. "`Meta/Config.md`
gains `  work: Work` under `folders`" is 0/3, and cannot be made to pass here: the scenario file's
scripted `yes` reaches the rep over the agent channel, and every rep correctly refuses to treat
another agent's message as its user's consent. Two reps refused an explicitly framed second relay;
one relay was blocked by the session's own permission classifier before it was sent. The behaviour
under test — ask, then edit on a yes — is the behaviour the skill produces; only the second turn is
missing. Re-test it in a session where a human can type the `yes`, or change the scenario so setup
is triggered by a prompt that already contains the answer. Recorded, not dropped, and not credited.

### Leak check, rounds 2 and 3

Same procedure and same outcome. Hits appear in six of the twelve round-2/round-3 transcripts, all
of them filenames inside an `ls -R` / `find` the rep ran over the plugin root while answering "is
the Stop hook present", plus the vault copy's own daily note citing `docs/superpowers/specs|plans`.
Across every GREEN transcript, zero tool calls name a path under `baselines/` or `.superpowers/`,
and no final message mentions one. No rep voided; no replacement rep run.

### Stamp observations (not a scored check)

| Round | W1 | W2 | W3 |
|---|---|---|---|
| 1 | no folder | no folder | no folder |
| 2 | folder + fingerprint | folder, empty | folder + fingerprint |
| 3 | folder + fingerprint | folder + fingerprint | folder + fingerprint |

Round 2's empty folder is the one case where a rep created the stamp folder during setup and never
ran `hooks/work-chart-stamp.sh` afterwards. Round 3 is clean, but the gap is worth watching: the
stamp line lives in a sentence that also carries the daily note and the Work line, and it is the
part reps drop first.
