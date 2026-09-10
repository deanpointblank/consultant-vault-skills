# work-chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `work-chart` skill to the `consultant-vault` plugin: one plain-language work note per ticket per day, a shipped Obsidian Base over them, a terminal line after each batch of rows, and a plugin Stop hook that asks for the rows when the repo changed since the last ones.

**Architecture:** One `SKILL.md` with two templates (`Work.md`, `Work.base`), two shell scripts at the plugin root (`hooks/work-chart-stop.sh`, `hooks/work-chart-stamp.sh`) sharing `hooks/work-chart-lib.sh`, a `hooks/hooks.json` registering the Stop hook, and a shell test file for the scripts. The skill writes rows and the stamp; the hook only reads the stamp and asks. Contract changes: `work` type, `folders.work`, vault-init scaffolding, two lines in handoff.

**Tech Stack:** Markdown skill files (Claude Code plugin), bash (macOS, bsd tools; `jq` preferred with a `sed` fallback), git, Obsidian Bases YAML, `general-purpose` subagents for test reps.

**Spec:** `docs/superpowers/specs/2026-09-10-work-chart-design.md`

## Global Constraints

- Plain language in every note: "No skill words in the note: not 'session', 'ledger', 'hook', 'stamp', 'controller'."
- One row is "one logical change (a fix, a refactor, a plan task) or one investigation that concluded something with no code change. Not a turn, not a file, not a commit."
- Work note frontmatter is exactly `type`, `client`, `created`, `jira`, `date`, `repos`, `areas`, `changes`; `changes` equals the row count.
- Filenames: `KEY Work YYYY-MM-DD.md`, or `Work - <topic> YYYY-MM-DD.md` with no ticket. Folder `folders.work`, default `Work`.
- Daily-note line, verbatim shape: `- HH:MM work on [[PFD-65947 Work 2026-09-10]]: 3 changes`.
- Terminal line, verbatim shape: `Work: <N> changes today on <KEY or topic>; last: <newest row's what, first clause>`.
- Hook block output, verbatim: `{"decision":"block","reason":"Files changed since the last work-chart rows. Use the work-chart skill: write the rows for what changed and why, then print the Work line."}`
- The hook "only reads. The script uses `${CLAUDE_PLUGIN_ROOT}` for its own path, reads `cwd` from stdin rather than trusting the shell's directory, and never writes into the repo or the vault." The skill writes the stamp.
- Hook is silent when `stop_hook_active` is true, when no vault is configured, when `cwd` is outside a git repo, when `<vault>/<folders.repos>/<repo name>.md` is absent, when the repo has no changes, and when the fingerprint equals the stamp.
- Subagents never write the work note; the controller does, from reports.
- Testing follows `docs/superpowers/baselines/README.md` for skill scenarios (vault copy, fresh `general-purpose` rep, three reps per variant, scored from diffs); the hook scripts get shell tests that run before the scripts are written.
- Commits end with the attribution lines given in the session's system reminder.
- Work happens on branch `work-chart` (created from `main`; the spec is committed there as 29e7a56).

---

### Task 1: Scenario file with fixtures

**Files:**
- Create: `docs/superpowers/baselines/work-chart.md`
- Modify: `docs/superpowers/baselines/README.md` (scenario table, after the last row)

**Interfaces:**
- Produces: the vault-copy recipe, the throwaway-repo recipe, prompts W, Q, S, the scripted reply for S, and check ids `W1`–`W8`, `Q1`–`Q3`, `S1`–`S4` that Tasks 2 and 5 score against.

- [ ] **Step 1: Write the scenario file**

Create `docs/superpowers/baselines/work-chart.md`:

`````markdown
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
`````

- [ ] **Step 2: Add the row to the harness README**

After the last row of the scenario table in `docs/superpowers/baselines/README.md`:

```markdown
| [work-chart.md](work-chart.md) | `work-chart` | Omission (no work note), invention (why guessed from the diff), wrong-shape setup |
```

- [ ] **Step 3: Verify the fixtures build**

Run the vault-copy block, the throwaway-repo block, and the scenario-Q block with `SCRATCH` set to the session scratchpad. Expected:

```bash
git -C "$RUN/scratch-tool" status --porcelain      # " M scripts/import.sh"
head -3 "$RUN/vault/Work/PFD-65947 Work $(date +%Y-%m-%d).md"   # ---, type: work, client: uscold
test -f "$RUN/vault/Repos/scratch-tool.md" && echo dossier ok
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/baselines/work-chart.md docs/superpowers/baselines/README.md
git commit -m "Add work-chart baseline scenarios

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 2: RED — control reps without the skill

**Files:**
- Create: `docs/superpowers/baselines/results/work-chart-<YYYY-MM-DD>.md`
- Modify: `docs/superpowers/baselines/work-chart.md` (rationalizations table)

**Interfaces:**
- Consumes: recipes, prompts, scripted reply, and checks from Task 1.
- Produces: per-check pass counts and verbatim rationalizations that Task 4 writes the skill against.

- [ ] **Step 1: Run three control reps per scenario, nine in total**

For each rep: fresh vault copy plus throwaway repo (plus the scenario-Q fixture for Q reps; for S reps also `export HOME=$RUN/home` with `mkdir -p "$RUN/home/.config/vault-skills"` and `printf '%s\n' "$RUN/vault" > "$RUN/home/.config/vault-skills/vault-path"`). Dispatch one `general-purpose` agent whose entire prompt is these lines followed by the scenario's prompt verbatim with `<repo path>` substituted:

```
OBSIDIAN_VAULT is set to <the copy's absolute path>. The consultant-vault plugin is installed. Set OBSIDIAN_VAULT=<the copy's absolute path> in every shell command you run that touches the vault, and treat that folder as the vault for everything.
```

For S reps add: `HOME for this task is <the run's home path>; use it for anything under ~/.config.` Do not mention the skill, the checks, or the expected shape. For S reps, when the rep stops to ask, resume it with the scripted reply. For W and Q, note questions verbatim and score what was produced.

- [ ] **Step 2: Score every rep from its copy**

```bash
diff -rq "$SRC" "$RUN/vault" | sort
git -C "$RUN/scratch-tool" diff --stat
```

Open every changed or new file. W7 and Q1–Q3 and S4 are scored from the rep's final message.

- [ ] **Step 3: Write the results doc**

Create `docs/superpowers/baselines/results/work-chart-<date>.md` with the same shape as the other results docs: a header line, one section per scenario with a `Check | Result | Notes` table and `n/3` per row, a Verbatim section, and a "Checks the control already passes" list. Copy every verbatim line into the scenario file's table.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/baselines/results/work-chart-*.md docs/superpowers/baselines/work-chart.md
git commit -m "Record work-chart control run

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 3: Hook scripts, test-first

**Files:**
- Create: `hooks/tests/test-work-chart-hook.sh`
- Create: `hooks/work-chart-lib.sh`
- Create: `hooks/work-chart-stop.sh`
- Create: `hooks/work-chart-stamp.sh`
- Create: `hooks/hooks.json`

**Interfaces:**
- Produces: `hooks/work-chart-stamp.sh <repo-path>` (writes the stamp; exit 0), which the skill in Task 4 calls; `hooks/work-chart-stop.sh` (stdin: hook JSON; stdout: nothing or the block JSON; exit 0 always); `hooks/work-chart-lib.sh` with `wc_vault`, `wc_repos_folder <vault>`, `wc_fingerprint <top>`, `wc_stamp_path <top>`.

- [ ] **Step 1: Write the failing tests**

Create `hooks/tests/test-work-chart-hook.sh`:

```bash
#!/usr/bin/env bash
# Shell tests for the work-chart Stop hook and stamp script. Run: bash hooks/tests/test-work-chart-hook.sh
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
HOOKS=$(cd "$HERE/.." && pwd)
STOP="$HOOKS/work-chart-stop.sh"
STAMP="$HOOKS/work-chart-stamp.sh"
BLOCK='{"decision":"block","reason":"Files changed since the last work-chart rows. Use the work-chart skill: write the rows for what changed and why, then print the Work line."}'
pass=0; fail=0
ok()   { pass=$((pass+1)); echo "ok   - $1"; }
bad()  { fail=$((fail+1)); echo "FAIL - $1"; }
check() { # name expected actual
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected [$2], got [$3])"; fi
}

T=$(mktemp -d)
export HOME="$T/home"; mkdir -p "$HOME/.config/vault-skills"
unset OBSIDIAN_VAULT
VAULT="$T/vault"; mkdir -p "$VAULT/Meta" "$VAULT/Repos"
printf -- '---\nfolders:\n  repos: Repos\n---\n' > "$VAULT/Meta/Config.md"
REPO="$T/scratch-tool"; mkdir -p "$REPO"; git -C "$REPO" init -q
echo one > "$REPO/a.txt"; git -C "$REPO" add -A; git -C "$REPO" -c user.name=t -c user.email=t@t commit -qm init
NOREPO="$T/plain"; mkdir -p "$NOREPO"
input() { printf '{"session_id":"s","transcript_path":"/dev/null","cwd":"%s","permission_mode":"default","hook_event_name":"Stop","stop_hook_active":%s}' "$1" "$2"; }
snapshot() { find "$VAULT" "$REPO" -type f | sort | xargs shasum | shasum; }

# 1. loop guard
printf '%s\n' "$VAULT" > "$HOME/.config/vault-skills/vault-path"
check "silent when stop_hook_active" "" "$(input "$REPO" true | bash "$STOP")"

# 2. no vault configured
rm "$HOME/.config/vault-skills/vault-path"
echo two >> "$REPO/a.txt"
check "silent with no vault" "" "$(input "$REPO" false | bash "$STOP")"
printf '%s\n' "$VAULT" > "$HOME/.config/vault-skills/vault-path"

# 3. cwd outside a git repo
check "silent outside a repo" "" "$(input "$NOREPO" false | bash "$STOP")"

# 4. repo without a dossier
check "silent without a dossier" "" "$(input "$REPO" false | bash "$STOP")"
printf -- '---\ntype: repo\n---\n' > "$VAULT/Repos/scratch-tool.md"

# 5. changes, no stamp -> block
before=$(snapshot)
check "blocks on changes with no stamp" "$BLOCK" "$(input "$REPO" false | bash "$STOP")"
check "hook wrote nothing" "$before" "$(snapshot)"

# 6. stamp written by the stamp script -> silent
bash "$STAMP" "$REPO"; check "stamp script exit 0" "0" "$?"
check "silent when stamp matches" "" "$(input "$REPO" false | bash "$STOP")"

# 7. further change -> block again
echo three >> "$REPO/a.txt"
check "blocks again after new change" "$BLOCK" "$(input "$REPO" false | bash "$STOP")"

# 8. clean repo -> silent even with a stale stamp
git -C "$REPO" checkout -q -- a.txt
check "silent when the repo is clean" "" "$(input "$REPO" false | bash "$STOP")"

# 9. OBSIDIAN_VAULT wins over the pointer file
export OBSIDIAN_VAULT="$T/othervault"; mkdir -p "$OBSIDIAN_VAULT/Meta" "$OBSIDIAN_VAULT/Repos"
echo four >> "$REPO/a.txt"
check "silent when OBSIDIAN_VAULT vault has no dossier" "" "$(input "$REPO" false | bash "$STOP")"
unset OBSIDIAN_VAULT

# 10. exit code is always 0
input "$REPO" false | bash "$STOP" >/dev/null; check "exit 0 on block" "0" "$?"

echo "passed $pass, failed $fail"
rm -rf "$T"
[ "$fail" -eq 0 ]
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: every `check` after the first prints `FAIL` because the scripts do not exist (bash reports "No such file"), and the final line is `exit 1`.

- [ ] **Step 3: Write the shared library**

Create `hooks/work-chart-lib.sh`:

```bash
#!/usr/bin/env bash
# Shared by work-chart-stop.sh and work-chart-stamp.sh. Source it; do not run it.

# Print the vault path, or nothing. $OBSIDIAN_VAULT first, then the pointer file.
wc_vault() {
  local v="${OBSIDIAN_VAULT:-}"
  if [ -z "$v" ] && [ -f "$HOME/.config/vault-skills/vault-path" ]; then
    v=$(head -n 1 "$HOME/.config/vault-skills/vault-path")
  fi
  [ -n "$v" ] && [ -d "$v" ] && printf '%s' "$v"
}

# Print the repos folder name from Meta/Config.md, default Repos. $1 = vault.
wc_repos_folder() {
  local f
  f=$(awk '/^folders:/{in_f=1; next} in_f && /^[^ ]/{in_f=0} in_f && /^  repos:/{sub(/^  repos:[ ]*/, ""); gsub(/["'"'"']/, ""); print; exit}' "$1/Meta/Config.md" 2>/dev/null)
  printf '%s' "${f:-Repos}"
}

# Print a fingerprint of the working tree state, or nothing when the tree is clean. $1 = repo top.
wc_fingerprint() {
  local out
  out=$( { git -C "$1" status --porcelain; git -C "$1" diff --stat; git -C "$1" diff --cached --stat; } 2>/dev/null )
  [ -n "$out" ] && printf '%s' "$out" | shasum | cut -d' ' -f1
}

# Print the stamp file path for a repo. $1 = repo top.
wc_stamp_path() {
  printf '%s/.config/vault-skills/work-stamp/%s' "$HOME" "$(printf '%s' "$1" | shasum | cut -d' ' -f1)"
}
```

- [ ] **Step 4: Write the Stop hook**

Create `hooks/work-chart-stop.sh` and `chmod +x` it:

```bash
#!/usr/bin/env bash
# work-chart Stop hook. Reads the hook JSON on stdin. Prints a block decision only when the
# current repo has changes that differ from the stamp the work-chart skill last wrote.
# Never writes to the repo, the vault, or the stamp. Always exits 0.
set -u
. "$(cd "$(dirname "$0")" && pwd)/work-chart-lib.sh"

input=$(cat)
field() { # $1 = key; prints its string/bool value
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r --arg k "$1" '.[$k] // empty' 2>/dev/null
  else
    printf '%s' "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" | head -n 1
  fi
}

[ "$(field stop_hook_active)" = "true" ] && exit 0
vault=$(wc_vault) || true
[ -n "$vault" ] || exit 0
cwd=$(field cwd)
[ -n "$cwd" ] && [ -d "$cwd" ] || exit 0
top=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$vault/$(wc_repos_folder "$vault")/$(basename "$top").md" ] || exit 0
fp=$(wc_fingerprint "$top")
[ -n "$fp" ] || exit 0
stamp=$(wc_stamp_path "$top")
[ -f "$stamp" ] && [ "$(cat "$stamp")" = "$fp" ] && exit 0
printf '%s\n' '{"decision":"block","reason":"Files changed since the last work-chart rows. Use the work-chart skill: write the rows for what changed and why, then print the Work line."}'
exit 0
```

- [ ] **Step 5: Write the stamp script**

Create `hooks/work-chart-stamp.sh` and `chmod +x` it:

```bash
#!/usr/bin/env bash
# Records the current working-tree fingerprint for a repo so the Stop hook stays silent
# until something else changes. Run by the work-chart skill after it writes rows.
# Usage: work-chart-stamp.sh <path inside the repo>
set -u
. "$(cd "$(dirname "$0")" && pwd)/work-chart-lib.sh"
top=$(git -C "${1:?path inside the repo}" rev-parse --show-toplevel 2>/dev/null) || { echo "not a git repo: $1" >&2; exit 1; }
stamp=$(wc_stamp_path "$top")
mkdir -p "$(dirname "$stamp")"
wc_fingerprint "$top" > "$stamp"
exit 0
```

- [ ] **Step 6: Register the hook**

Create `hooks/hooks.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/work-chart-stop.sh" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
claude plugin validate .
```

Expected: `passed 13, failed 0`, `exit 0`, validate clean. A failing check names the case; fix the script, not the test, unless the test contradicts the spec.

- [ ] **Step 8: Commit**

```bash
git add hooks/
git commit -m "Add work-chart Stop hook, stamp script, and shell tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 4: GREEN — write the skill and its templates

**Files:**
- Create: `skills/work-chart/SKILL.md`
- Create: `skills/work-chart/templates/Work.md`
- Create: `skills/work-chart/templates/Work.base`

**Interfaces:**
- Consumes: the results doc from Task 2 (verbatims, checks passed 3/3); `hooks/work-chart-stamp.sh` from Task 3.
- Produces: the note shape and terminal line that Task 5 scores; the Setup steps that Task 6's vault-init edit mirrors.

- [ ] **Step 1: Write the note template**

Create `skills/work-chart/templates/Work.md`:

```markdown
---
type: work
client:
created:
jira:
date:
repos:
areas:
changes: 0
---

#

One sentence: what today's work on this ticket was about.

| when | what | why | decided |
|---|---|---|---|
```

- [ ] **Step 2: Write the Base**

Create `skills/work-chart/templates/Work.base`:

```yaml
filters:
  and:
    - type == "work"
properties:
  date:
    displayName: Date
  jira:
    displayName: Ticket
  repos:
    displayName: Repos
  areas:
    displayName: Areas
  changes:
    displayName: Changes
views:
  - type: table
    name: Today
    filters:
      and:
        - date == today()
    order:
      - file.name
      - jira
      - repos
      - areas
      - changes
  - type: table
    name: By ticket
    groupBy:
      property: jira
      direction: ASC
    order:
      - file.name
      - date
      - areas
      - changes
  - type: table
    name: By repo
    groupBy:
      property: repos
      direction: ASC
    order:
      - file.name
      - date
      - jira
      - areas
      - changes
  - type: table
    name: By area
    groupBy:
      property: areas
      direction: ASC
    order:
      - file.name
      - date
      - jira
      - repos
      - changes
```

Obsidian is not available in the harness; Task 7's trigger test is where the user confirms the four views render, and fixes the YAML against Obsidian's Bases documentation if one does not.

- [ ] **Step 3: Write `skills/work-chart/SKILL.md`**

Start from this text. Before saving, add a Common-mistakes row for every verbatim rationalization from Task 2 not already covered, and delete any instruction whose check the control passed 3/3.

````markdown
---
name: work-chart
description: Keep a plain-language record of coding work as it happens, one note per ticket per day: what changed, why, and what was decided. Use whenever code changed in this session and a task finished, tests ran, or a commit was made; whenever a Stop hook reports "Files changed since the last work-chart rows"; whenever the user asks "what did you just do", "why did you change X", or "explain that diff"; and when the user says "set up the work chart". Work nobody wrote down is work the developer cannot explain tomorrow.
---

# Work chart

Follow the obsidian-vault skill's conventions. One note per ticket per day in `folders.work` (key missing: run Setup below first). Filename `KEY Work YYYY-MM-DD.md`; no ticket: `Work - <topic> YYYY-MM-DD.md`. Template: vault templates folder first, else this skill's `templates/Work.md`.

## When rows get written

- A task finished, tests ran, a commit was made, or the user changed subject: write rows for everything since the last row.
- A plan task completed under subagent-driven development: the controller writes the rows from the subagent's report. Subagents never write this note.
- The Stop hook said "Files changed since the last work-chart rows": write the rows, then print the Work line.

## One row per change

Frontmatter per the property schema: `type: work`, `jira` with the ticket first, `date`, `repos` as quoted wikilinks, `areas` as plain words for the parts of the codebase touched ("migration loader", "appointment details API"), `changes` equal to the row count.

First line under the title: one sentence saying what the day's work on this ticket was about. Rewrite it as rows are added.

One table: `when | what | why | decided`.

- One row per logical change (a fix, a refactor, a plan task) or per investigation that concluded something. Not per turn, per file, or per commit.
- `what`: the repo and path of what changed, and the commit when there is one. No code change: start with "Read" and end with "nothing changed".
- `why`: one sentence in the reader's words. The reason, not the ticket key.
- `decided`: the call and its reason, or "none". A call that constrains future work or a reviewer would question also becomes a `proposed` decision note through the decisions skill; the cell links it.
- Everyday words. The words session, ledger, hook, stamp, and controller do not appear in the note.

After writing: update the first line, `changes`, `areas`, `repos`. Daily note: `- HH:MM work on [[KEY Work YYYY-MM-DD]]: N changes`, once per work note per day, then edit the count in place; add the key to the daily note's `jira` list. Record the stamp: run `hooks/work-chart-stamp.sh <repo path>` from the plugin root, which is two directories above this skill's folder. Then end the reply with the Work line:

`Work: <N> changes today on <KEY or topic>; last: <newest row's what, first clause>`

## Answering "what did you just do"

Answer from today's rows for the ticket plus `git diff`, citing the work note: what, why, where to read more, at least three lines. No rows yet: write them first, then answer. Nothing changed since the last rows: answer from the rows and add nothing.

## Setup

"Set up the work chart", or a first write with no `folders.work` key:

1. Add `work: Work` under `folders` in `Meta/Config.md` after the user confirms.
2. Create the folder.
3. Copy this skill's `templates/Work.base` to `<folders.work>/Work.base` unless one exists.
4. Create `~/.config/vault-skills/work-stamp/`.
5. Say in one line whether the plugin's Stop hook is present (`hooks/hooks.json` at the plugin root). Absent: rows are written at pauses only.

The hook is silent unless a vault is configured and the current repo has a dossier; say so when a repo has none.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| One row per file | The reader wants "added the migration", not six paths |
| `why` restates the ticket | The key is in the frontmatter; the reason is what the diff cannot give back |
| "decided: none" on a call a reviewer would question | The handoff's rulings section and the decisions folder both miss it |
| Rows only at the end of the session | The rows should exist before the developer asks, not after |
| A daybook line instead of a work note | The daily note is the spine; the rows live in the work note it links |
| Skipping the stamp | The hook asks for the same rows again at the next stop |
| A subagent writing its own rows | Two writers, one note; the controller has the report and the diff |
````

- [ ] **Step 4: Check and validate**

```bash
head -4 skills/work-chart/SKILL.md | wc -c    # under 1024
wc -w skills/work-chart/SKILL.md              # aim under 800
claude plugin validate .
```

- [ ] **Step 5: Commit**

```bash
git add skills/work-chart/
git commit -m "Add work-chart skill, note template, and Base

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 5: GREEN reps, then REFACTOR

**Files:**
- Modify: `docs/superpowers/baselines/results/work-chart-<date>.md` (GREEN sections)
- Modify: `skills/work-chart/SKILL.md` (loophole fixes only)

**Interfaces:**
- Consumes: the skill and templates from Task 4; the stamp script from Task 3; recipes, prompts, and checks from Task 1.
- Produces: pass counts with the skill; a skill whose failing checks were each addressed by one edit.

- [ ] **Step 1: Run three reps per scenario with the skill**

Same as Task 2 step 1, with one extra line first in each rep's prompt:

```
Read and follow <checkout>/skills/work-chart/SKILL.md when it applies; the plugin root for its hook scripts is <checkout>. Plugin skills it names (obsidian-vault, daybook, decisions) are installed.
```

where `<checkout>` is the absolute path of the git checkout or worktree holding this branch.

- [ ] **Step 2: Score from the copies**

Same as Task 2 step 2. For W reps also `ls "$HOME/.config/vault-skills/work-stamp/"` (with the rep's HOME) to see that a stamp was written; note it, it is not a scored check. Add `## GREEN, scenario W`, `## GREEN, scenario Q`, `## GREEN, scenario S` to the results doc.

- [ ] **Step 3: Refactor, one edit per failing check**

For every check under 3/3: quote the rep's exact wording in the results doc, make one targeted edit to `SKILL.md`, re-run that scenario's three reps, re-score. Stop when every check is 3/3 or the results doc says why a check is dropped. Cap: three rounds.

- [ ] **Step 4: Commit**

```bash
git add skills/work-chart/SKILL.md docs/superpowers/baselines/results/work-chart-*.md
git commit -m "work-chart: GREEN run and loophole fixes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 6: Contract and docs updates

**Files:**
- Modify: `skills/obsidian-vault/references/property-schema.md` (type list; new `work` section before `## Conventions`)
- Modify: `skills/obsidian-vault/templates/Config.md` (folders map; explanation list)
- Modify: `skills/vault-init/SKILL.md` (Base copy; stamp directory)
- Modify: `skills/handoff/SKILL.md` (two lines)
- Modify: `README.md` (skills table; count; Hooks paragraph)
- Modify: `.claude-plugin/marketplace.json` (description)

**Interfaces:**
- Consumes: the work note shape from Task 4; the hook from Task 3.
- Produces: the contract every other skill reads.

- [ ] **Step 1: Property schema**

Add `work` to the `type` row's list (after `time-log`, keeping the rest of the list as it is on this branch). Add directly before `## Conventions`:

```markdown
## type: work

One note per ticket per day, filename `KEY Work YYYY-MM-DD.md` (or `Work - <topic> YYYY-MM-DD.md` with no ticket) in the work folder. Rows of what changed, why, and what was decided, written by work-chart as the work happens. `Work.base` in the same folder lists them.

| Property | Format | Notes |
|----------|--------|-------|
| `jira` | list of ticket keys | the ticket worked first; empty for work with no ticket |
| `date` | `YYYY-MM-DD` | the day the work happened |
| `repos` | list of quoted wikilinks | repo dossiers touched |
| `areas` | list of plain strings | parts of the codebase touched, in the reader's words |
| `changes` | integer | number of rows in the note |
```

- [ ] **Step 2: Config template**

Add `  work: Work` to `folders` directly after `  conflicts: Conflicts`. Add to the explanation list after the `folders` bullet:

```markdown
- `folders.work` — one work note per ticket per day, plus `Work.base`. work-chart writes here; handoff reads it.
```

- [ ] **Step 3: vault-init**

In `skills/vault-init/SKILL.md`, add a bullet directly after the "Copy default note templates" bullet:

```markdown
- Copy `../work-chart/templates/Work.base` into the work folder as `Work.base`, skipping if one exists, and create `~/.config/vault-skills/work-stamp/`.
```

- [ ] **Step 4: handoff**

In `skills/handoff/SKILL.md`, in the numbered body sections: append to item 1 ("Where things stand") the sentence `What shipped comes from the ticket's work notes for the days since the previous handoff, not from memory.`; append to item 7 ("Related") the phrase `, and every work note for the ticket since the previous handoff`.

- [ ] **Step 5: README and marketplace**

Add after the `time-logging` row of the skills table:

```markdown
| `work-chart` | One plain-language work note per ticket per day: what changed, why, what was decided. A Base over them, a `Work:` line after each batch of rows, and a Stop hook that asks for rows when the repo changed. |
```

Add a section after "## Updates":

```markdown
## Hooks

The plugin ships one Stop hook, `hooks/work-chart-stop.sh`. At the end of a turn it checks whether the current repo has uncommitted changes that differ from the last time work-chart wrote rows. If so it asks Claude to write the rows. It is silent when no vault is configured on the machine, when the current directory is not a client repo with a dossier in the vault, and when nothing changed. It never writes to the repo or the vault. Tests: `bash hooks/tests/test-work-chart-hook.sh`.
```

Set the count in the Install sentence and the marketplace `description` to the number of directories under `skills/` on this branch, spelled out, and add "work chart" to the capture list in the marketplace description. If `main` has moved when this branch merges, whoever merges second re-applies the same rule.

- [ ] **Step 6: Validate**

```bash
claude plugin validate .
python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))" && echo json ok
grep -c 'work: Work' skills/obsidian-vault/templates/Config.md          # 1
grep -c 'type: work' skills/obsidian-vault/references/property-schema.md   # 1
grep -c 'work notes' skills/handoff/SKILL.md                              # 1 or more
bash hooks/tests/test-work-chart-hook.sh | tail -1                        # passed 13, failed 0
```

- [ ] **Step 7: Commit**

```bash
git add skills/obsidian-vault/references/property-schema.md skills/obsidian-vault/templates/Config.md skills/vault-init/SKILL.md skills/handoff/SKILL.md README.md .claude-plugin/marketplace.json
git commit -m "Add work type, folder, Base scaffolding, handoff link, and hook docs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 7: Trigger test and merge

**Files:**
- Modify: `docs/superpowers/baselines/results/work-chart-<date>.md` (trigger section)
- Modify, if a view fails: `skills/work-chart/templates/Work.base`

**Interfaces:**
- Consumes: everything committed on `work-chart`.
- Produces: a branch ready to merge, with the trigger and Base results recorded.

- [ ] **Step 1: Ask the user to reinstall the plugin and run three checks**

In Claude Code:

```
/plugin marketplace add /Users/deanbetty/Code/consultant-vault-skills
/plugin install consultant-vault@consultant-vault-skills
```

Then: (1) in a fresh session in the vault's project, type only `set up the work chart`; passes if config, folder, Base, and the hook line all happen. (2) In a client repo, make a one-line change and end the turn with an unrelated question; passes if the hook fires once, rows appear in `Work/`, and the reply ends with the `Work:` line. (3) Open `Work/Work.base` in Obsidian; passes if all four views render with the new note in Today.

- [ ] **Step 2: Record the result; fix the Base if needed**

Add `## Trigger test` to the results doc with the date, each prompt, and the outcome. If a Base view does not render, edit `Work.base` against Obsidian's Bases documentation until it does, and record the change.

- [ ] **Step 3: Commit and hand the branch back**

```bash
git add docs/superpowers/baselines/results/work-chart-*.md skills/work-chart/templates/Work.base
git commit -m "work-chart: trigger test result

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
git log --oneline main..work-chart
```

Then use superpowers:finishing-a-development-branch to decide between merging to `main` and opening a pull request.
