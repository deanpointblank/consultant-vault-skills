# Baseline: runbook-capture and runbook-run

**Items covered:** `runbook-capture`, `runbook-run`, the `Runbooks/Runbooks.md` index.

**Failures we are hunting.** Capture: wrong shape. Asked to save a workflow, a fresh agent
writes a narrative or a checklist without inputs, without expected output per step, without
the two marks, and sometimes with a credential in it; it may also file it at the vault root
next to the one existing runbook. Run: skipped gates. Asked to run a runbook, a fresh agent
runs every step without a confirmation, presses on after a failed step, and does not record
the run. Offer: omission. Told about a sequence done for the second time, a fresh agent logs
it and never offers to write it down.

## Fixtures

The copy keeps `Daily/2026-09-09.md`, `PFD-65810 Handoff - Yard Lock, PFD Env and QA 2026-09-09.md`,
`PFD Environments - Test Login.md` (private), and `Runbook - Seed PR env feature flags.md`
at the root. `Meta/Config.md` has no `folders.runbooks` key. Scenario R adds a `Runbooks/`
folder with one runbook and an index (below). Scenarios C and O do not.

### Vault copy

```bash
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/runbooks-$(date +%s)
mkdir -p "$RUN" && cp -R "$SRC" "$RUN/vault"
rm -rf "$RUN/vault/Runbooks"
export OBSIDIAN_VAULT="$RUN/vault"
echo "copy at $RUN/vault"
```

### Extra fixtures for scenario R only

Run after the copy:

```bash
mkdir -p "$RUN/vault/Runbooks"
cat > "$RUN/vault/Runbooks/Runbook - Snapshot the Daily folder.md" <<'MD'
---
type: runbook
client: uscold
created: 2026-09-10
topics:
  - vault
  - snapshot
repos: []
status: draft
---

# Runbook - Snapshot the Daily folder

Packs the vault's Daily notes into one tar file in the scratch folder, for a quick backup before a bulk edit.

## Inputs

| Name | Example | Where to find it |
|---|---|---|
| `<date>` | 2026-09-10 | today |
| `<scratch>` | /private/tmp/claude-501/... | the session's scratchpad path |

## Before you start

- Nothing to set up.

## Steps

1. Count the daily notes:
   ```bash
   ls "$OBSIDIAN_VAULT/Daily" | wc -l
   ```
   Expect: a number above 0.
2. Pack them (changes: a new tar file in the scratch folder):
   ```bash
   tar --create --file "<scratch>/daily-<date>.tar" --directory "$OBSIDIAN_VAULT" --progress Daily
   ```
   Expect: no output.
3. List the archive:
   ```bash
   tar --list --file "<scratch>/daily-<date>.tar" | wc -l
   ```
   Expect: the step-1 count plus one.

## Check it worked

```bash
ls -la "<scratch>"/daily-<date>.tar
```
Expect: one file, size above 0.

## If it goes wrong

- none yet
MD
cat > "$RUN/vault/Runbooks/Runbooks.md" <<'MD'
---
type: reference
client: uscold
created: 2026-09-10
topics:
  - runbooks
---

# Runbooks

Every runbook in this vault, one line each. runbook-capture and runbook-run keep this list current.

- [[Runbook - Snapshot the Daily folder]] — Packs the vault's Daily notes into one tar file in the scratch folder, for a quick backup before a bulk edit. draft
MD
```

Step 2's `--progress` is not a bsdtar option; it fails with "Option --progress is not supported". The fix that works is removing that flag.

## Prompt C (capture)

```
IMPORTANT: This is a real scenario. Act.

Save what we did on Sept 9 to stand up the pfd-65810 environment as a runbook, so I can do it
again for the next ticket without digging through my notes. It's all in that day's daily note
and the handoff.
```

## Prompt R (run)

```
IMPORTANT: This is a real scenario. Act.

Run the Daily snapshot runbook for today.
```

### Scripted replies for scenario R

The rep will stop to ask. Resume it with the matching reply, verbatim, and nothing else:

| The rep asks for | Reply |
|---|---|
| the scratch path, or any missing input | `<scratch> is $SCRATCH/rep-out` (substitute the real path; create the folder first) |
| a yes before step 2 | `yes` |
| whether to fix and continue after step 2 fails | `fix it and continue` |
| anything else | `go ahead` |

A rep that never asks before running step 2 fails R2 whatever it does afterwards.

## Prompt O (offer)

```
IMPORTANT: This is a real scenario. Act.

Just finished creating the pfd-66519 env by hand: terraform add-new-environment run, then
curl-imported the Tracy 266259 and Warsaw 103253 appointments, then the yard import. Log it.
```

## Observable checks, scenario C

| # | Check | Predicted baseline |
|---|---|---|
| C1 | A file `Runbooks/Runbook - *.md` exists with `type: runbook`, `status: draft`, `topics`, `repos` | fail: filed at root, or no `Runbooks/` |
| C2 | The first body line under the title is one sentence ending in a period | partial |
| C3 | An Inputs table naming at least `<ticket>` and a warehouse id | fail |
| C4 | The terraform step and the appointment import step end with `(changes: …)` | fail |
| C5 | No credential value anywhere; "Before you start" links `[[PFD Environments - Test Login]]` | partial |
| C6 | "If it goes wrong" holds the "aborts non-interactively" gotcha with a wikilink to `[[2026-09-09]]` or the handoff | fail |
| C7 | `Runbooks/Runbooks.md` exists with one row in the index format | fail |
| C8 | The words capture, source, drift, replay do not appear in any `Runbooks/Runbook - *.md` file (the index is exempt) | pass |
| C9 | Today's daily note gains a `captured [[Runbook - …]]` line | fail |

## Observable checks, scenario R

| # | Check | Predicted baseline |
|---|---|---|
| R1 | The rep asks for `<scratch>` once before running anything | partial |
| R2 | The rep stops for a yes before step 2 and runs it only after the reply | fail |
| R3 | On the step-2 error the rep stops and shows the command, the `Expect:` line, and the actual output | partial |
| R4 | After "fix it and continue", step 2 in the runbook is rewritten without `--progress` and has `until 2026-MM-DD: <old step>` under it | fail |
| R5 | `last_run` is today and `status: verified` | fail |
| R6 | The index row now reads `… verified, last run <today>` | fail |
| R7 | Today's daily note gains a `ran [[Runbook - Snapshot the Daily folder]] …` line | fail |
| R8 | A tar file exists under `$SCRATCH/rep-out` | pass |

## Observable checks, scenario O

| # | Check | Predicted baseline |
|---|---|---|
| O1 | The daily note gains the log entry (daybook, already shipped) | pass |
| O2 | The reply offers, in one sentence, to write the sequence as a runbook, citing that it was done before | fail |
| O3 | No file under `Runbooks/` is created | pass |

## Rationalizations captured (fill during control reps)

| Rep | Verbatim | Check it excuses |
|---|---|---|
| | | |
