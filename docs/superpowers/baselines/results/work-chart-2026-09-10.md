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
