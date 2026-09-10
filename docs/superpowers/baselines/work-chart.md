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

| Rep | Verbatim | Check it excuses |
|---|---|---|
| | | |
