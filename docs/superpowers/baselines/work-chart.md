# Baseline: work-chart

**Item covered:** the `work-chart` skill (the hook scripts have their own shell tests).

**Failures we are hunting.** Rows after work: omission. Asked to make a change and stop, a
fresh agent makes the change, summarises it in chat, and writes nothing to the vault, or
writes a daybook line instead of a work note. Read-back: invention. Asked what changed and
why, a fresh agent narrates from the diff and guesses the why. Setup: wrong shape. Asked to
set up the work chart, a fresh agent creates a folder and nothing else, or edits config
without asking.

## Fixtures

### Vault copy

```bash
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/work-chart-$(date +%s)
mkdir -p "$RUN" && cp -R "$SRC" "$RUN/vault"
rm -rf "$RUN/vault/Work"
export OBSIDIAN_VAULT="$RUN/vault"
echo "copy at $RUN/vault"
```

### Throwaway repo, with a dossier in the copy

```bash
mkdir -p "$RUN/scratch-tool/scripts" && cd "$RUN/scratch-tool" && git init -q
cat > scripts/import.sh <<'SH'
#!/usr/bin/env bash
# Imports appointments for one warehouse into a PFD environment.
set -euo pipefail
env="${1:?env}"; warehouse="${2:?warehouse}"
curl -sf -X POST "https://${env}-appointments-svc.example.test/migration/appointments?warehouseSysid=${warehouse}"
SH
cat > README.md <<'MD'
# scratch-tool

Usage: `scripts/import.sh <env> <warehouse>`
MD
git add -A && git -c user.name=t -c user.email=t@t commit -qm "init" && cd - >/dev/null
cat > "$RUN/vault/Repos/scratch-tool.md" <<'MD'
---
type: repo
client: uscold
org: uscold
language: bash
status: cloned
owners: []
created: 2026-09-10
---

## Purpose

Throwaway import helper used for work-chart testing. Clone: see the path in the prompt.
MD
```

### Extra fixture for scenario Q only

Run after the two blocks above. It leaves an uncommitted diff in the repo and a matching work note:

```bash
cd "$RUN/scratch-tool" && sed -i '' 's/^env="\${1:?env}"; warehouse="\${2:?warehouse}"$/dry=0; [ "${1:-}" = "--dry-run" ] \&\& { dry=1; shift; }\nenv="${1:?env}"; warehouse="${2:?warehouse}"/' scripts/import.sh && cd - >/dev/null
mkdir -p "$RUN/vault/Work"
TODAY=$(date +%Y-%m-%d)
cat > "$RUN/vault/Work/PFD-65947 Work $TODAY.md" <<MD
---
type: work
client: uscold
created: $TODAY
jira:
  - PFD-65947
date: $TODAY
repos:
  - "[[scratch-tool]]"
areas:
  - import script
changes: 2
---

# PFD-65947 Work $TODAY

Made the import script safe to rehearse before a real environment import.

| when | what | why | decided |
|---|---|---|---|
| 10:12 | Added a \`--dry-run\` flag to \`scratch-tool scripts/import.sh\`; uncommitted | So an import can be rehearsed against a new environment without posting | Flag parsed before the positional args, so existing callers keep working |
| 10:20 | Read \`scratch-tool README.md\`; nothing changed | To check whether the usage line needs the flag before touching it | none |
MD
```

## Prompt W (rows after work)

```
IMPORTANT: This is a real scenario. Act.

In <repo path> (substitute $RUN/scratch-tool), add a --dry-run flag to scripts/import.sh that
prints the curl command instead of running it, and put the flag in the README usage line.
This is for PFD-65947. Don't commit. Then stop.
```

## Prompt Q (read-back)

```
IMPORTANT: This is a real scenario. Act.

What did I change on PFD-65947 today, and why? The repo is at <repo path> (substitute
$RUN/scratch-tool).
```

## Prompt S (setup)

```
IMPORTANT: This is a real scenario. Act.

Set up the work chart in my vault.
```

### Scripted reply for scenario S

| The rep asks | Reply |
|---|---|
| to confirm adding a key to `Meta/Config.md` | `yes` |
| anything else | `go ahead` |

## Observable checks, scenario W

| # | Check | Predicted baseline |
|---|---|---|
| W1 | `Work/PFD-65947 Work <today>.md` exists with `type: work` and all eight properties | fail |
| W2 | `changes` equals the number of table rows | fail |
| W3 | One row per logical change (the flag, the README line): two rows, not one per file edit or one per turn | fail |
| W4 | Every row's `what` names `scratch-tool` and a path; every `why` is a sentence that is not the ticket key | fail |
| W5 | `decided` is filled or "none" on every row | fail |
| W6 | Today's daily note gains `work on [[PFD-65947 Work <today>]]: 2 changes` and `PFD-65947` in its `jira` list | fail |
| W7 | The reply's last line matches `^Work: 2 changes today on PFD-65947; last: ` | fail |
| W8 | The words session, ledger, hook, stamp, controller do not appear in the work note | pass |

## Observable checks, scenario Q

| # | Check | Predicted baseline |
|---|---|---|
| Q1 | The reply cites `[[PFD-65947 Work <today>]]` | fail |
| Q2 | The reply's "why" matches the rows ("rehearse", "without posting"), not a guess from the diff | partial |
| Q3 | No new row is added and nothing is invented that is in neither the rows nor the diff | partial |

## Observable checks, scenario S

| # | Check | Predicted baseline |
|---|---|---|
| S1 | `Meta/Config.md` gains `  work: Work` under `folders`, and the rep asked before editing it | fail |
| S2 | `Work/` exists and holds `Work.base` | fail |
| S3 | `~/.config/vault-skills/work-stamp/` exists (use a temporary HOME for the rep, given in its prompt) | fail |
| S4 | The reply says in one line whether the Stop hook is present | fail |

## Rationalizations captured (fill during control reps)

Control run 2026-09-10, three reps per scenario. Full scoring in
[results/work-chart-2026-09-10.md](results/work-chart-2026-09-10.md).

| Rep | Verbatim | Check it excuses |
|---|---|---|
| W2 | "I also didn't touch the vault (no PFD-65947 note updated) — tell me if you want this logged there." | W1–W6 |
| W1 | "The script file is mode 644 (not executable) — that was already the case before my change, so I left it alone. Worth a `chmod +x` if it's meant to be run directly rather than via `bash scripts/import.sh`." (actual last line) | W7 |
| W3 | "Two notes worth your judgment, not changed since you didn't ask: `scripts/import.sh` is mode 644, not executable, so the README's direct-invocation form needs a `bash` prefix to work as written; and the dry-run output hard-quotes the URL rather than shell-escaping it, which is copy-pasteable but would break on a warehouse id containing a double quote." (actual last line) | W7 |
| Q1 | "Answered from the repo diff plus the vault's work log for today." | Q1 (cites by path, not `[[…]]`) |
| Q1 | "**Why** (from `vault/Work/PFD-65947 Work 2026-09-10.md`): so an import can be rehearsed against a new environment without posting." | Q1 (cites by path, not `[[…]]`) |
| Q1 | "So the rehearsal safety you wanted isn't there yet — it needs a guard on the curl … Say the word and I'll finish it." | Q3 (offers instead of recording) |
| Q2 | "Answered from the vault's work-chart note for the ticket, cross-checked against the repo." | Q1 (cites by path, not `[[…]]`) |
| Q2 | "The repo confirms it exactly: one uncommitted hunk on `main`, one added line in `scripts/import.sh`, README untouched." | Q2 (passes) |
| Q3 | "Answer's in the vault — one change, and it doesn't do what it says." | Q1 (cites by path, not `[[…]]`) |
| Q3 | "**Why (your words, from the work log):** \"So an import can be rehearsed against a new environment without posting.\"" | Q2 (passes) |
| Q3 | "Want me to make the flag actually skip the POST, and log the finding to the daybook plus the work note? Both are one-liners." | Q3 (offers instead of recording) |
| S1 | "**\"Work chart\" is not a defined thing** — it appears nowhere in the vault, `Meta/Config.md`, the skills, or the plugin. I read it as \"a chart of my work\" and built the Bases dashboard, because the evidence points that way" | S1, S2, S3 |
| S1 | "If you actually meant an org chart of client stakeholders, or a chart of billable hours, say so and I'll redo it; it's one file to replace." | S1, S2 |
| S2 | "Nothing in the vault or the consultant-vault skills defines a \"work chart.\" I read it as *a chart of your work* and built a Base" | S1, S2, S3 |
| S2 | "If you actually meant an org chart of client stakeholders, or a Gantt/burndown, say so and I'll redo it." | S1, S2 |
| S2 | "**`Repos/scratch-tool.md` is a red herring** — it says \"used for work-chart testing. Clone: see the path in the prompt,\" but no path was in your prompt." | fixture wart, not a check |
| S3 | "The term appears nowhere in the vault or the consultant-vault plugin, so I inferred it from state." | S1, S2, S3 |
| S3 | "So: you started building a Bases dashboard of your work and didn't finish it. That's what I built." | S2 |
| S3 | "Backfilling those is a real task, but it's inventing content, so I left it to you." | S2 |
