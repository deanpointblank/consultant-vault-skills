# work-chart activity log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the work chart catch all goal-directed work in a session, wherever it happens: code changes in any repo under a work root, files outside git, and work that changes no code (research, coordination, design, dead ends). A new PostToolUse hook logs each counted tool call. The rewritten Stop hook reads that log and asks for rows only when something worth a row took place.

**Architecture:** `hooks/work-chart-log.sh` (new, PostToolUse, no matcher) appends one tab-separated line per counted call to `~/.config/vault-skills/work-log/<session_id>.tsv`. `hooks/work-chart-stop.sh` (rewritten) reads the lines after the last `MARK`, finds the touched repos, fingerprints them with the vault folder left out, and prints one block decision when the threshold is passed. `hooks/work-chart-stamp.sh` takes any number of repo paths, including none. All shared code lives in `hooks/work-chart-lib.sh`. The work-chart skill learns rows for work with no code change, dead ends, files outside git, repos with no dossier, the no-argument stamp, and a `work_roots` setup question. The config template, vault-init, README, daily-worklog's classify table and the parked idea note follow.

**Tech Stack:** bash 3.2 (macOS), git, jq with sed fallback, Claude Code hooks, Markdown skills
**Spec:** docs/superpowers/specs/2026-09-16-work-chart-activity-log-design.md

## Global Constraints

- Hooks always exit 0. The log hook never prints anything.
- Hooks never write to a repo or the vault. The log hook writes only its log file; the Stop hook only deletes old log files.
- Log path: `~/.config/vault-skills/work-log/<session_id>.tsv`. Four tab-separated fields: `time` (epoch seconds), `kind` (`edit`, `outward`, `research`, `shell`, `MARK`), `tool`, `place`.
- The log never holds file contents, command text, or tool output.
- Stamp dir: `~/.config/vault-skills/work-stamp/`, one file per repo top, named by the SHA-1 of the path (unchanged).
- Threshold: at least one `edit`, or at least one `outward`, or `research` plus `shell` lines numbering 5 or more, or a touched repo with a non-empty fingerprint that differs from its stamp.
- Log files older than 14 days are deleted by the Stop hook.
- The log hook takes under 50 ms per call.
- "Under a folder" means equal to the folder, or starting with the folder plus `/`. `~/Code/UsCold2` is not under `~/Code/UsCold`.
- `work_roots` key missing or empty: the vault folder is the only root. A leading `~` expands to `$HOME`.
- Vault edits are never logged. The vault's folder is left out of the fingerprint of the repo that holds it (`-- . ':(exclude)<vault path relative to repo top>'`).
- The repo dossier gate is gone: any git repo reached from a logged call counts.
- Block reason text, verbatim shape: `Work since HH:MM not yet in the work chart: repos with changes: <name> (<~path>), …; files outside git: <~path>, …; research calls: N; outward calls: N. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` Parts with nothing to report are left out.
- `jq` when present, `sed` when not. Setting `WC_NO_JQ=1` forces the `sed` path (tests use it).
- bash 3.2 only: no associative arrays, no `mapfile`, no `${var,,}`. BSD `find`, `date`, `stat`.
- Notes stay in plain language. The words session, ledger, hook, stamp and controller never appear in a work note.
- Subagents never write work-note rows; the controlling agent writes them from reports.
- Tests: `bash hooks/tests/test-work-chart-hook.sh`. Skill scenarios follow `docs/superpowers/baselines/README.md`, with three RED reps and three GREEN reps per scenario.
- Commits: short and imperative, ending with a blank line and then `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`. No session links.
- Work happens on branch `work-chart-activity-log`, created from `main` (the spec is on `main` as 330a228).

---

### Task 1: Library helpers

**Files:**
- Modify: `hooks/work-chart-lib.sh` (whole file replaced)
- Modify: `hooks/tests/test-work-chart-hook.sh` (whole file replaced)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `wc_vault` — unchanged contract; reads the pointer file with `read` instead of `head`.
  - `wc_roots <vault>` — prints work roots one per line, `~` expanded, trailing `/` and quotes dropped; prints `<vault>` when `work_roots` is missing or empty.
  - `wc_under <path> <folder>` — exit 0 when the path is the folder or inside it.
  - `wc_in_roots <path> <vault>` — exit 0 when the path is under any work root; exit 1 for an empty path.
  - `wc_fingerprint <repo top> [vault]` — as before, with the vault's folder left out when the vault is inside the repo; prints nothing for a clean tree, or when the repo top is the vault's own top folder.
  - `wc_stamp_path <repo top>` — unchanged.
  - `wc_log_path <session_id>` — prints `$HOME/.config/vault-skills/work-log/<session_id>.tsv`, with characters outside `A-Za-z0-9._-` replaced by `_`.
  - `wc_repos_folder` — kept for the old Stop hook only; Task 4 removes it.
  - Test harness: fixtures `ROOT`, `MAP`, `VAULT`, `SIB`, `LOOSE`, `ELSE`; helpers `mkrepo`, `config_roots`, `post`, `stopin`, `logcall`, `stopcall`, `logfile`, `logged`; section markers `# --- Library`, `# --- Old Stop hook (Task 4 replaces this section)`, `# --- end of old Stop hook`, `# --- Every run`. Tasks 2–4 insert their sections relative to these markers.

The old Stop hook stays in place until Task 4, so its tests stay too, as a marked section at the end that Task 4 deletes.

- [ ] **Step 1: Write the failing tests**

Replace `hooks/tests/test-work-chart-hook.sh` with:

```bash
#!/usr/bin/env bash
# Shell tests for the work-chart hooks, their shared library, and the stamp script.
# Run: bash hooks/tests/test-work-chart-hook.sh
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
HOOKS=$(cd "$HERE/.." && pwd)
LIB="$HOOKS/work-chart-lib.sh"
LOG="$HOOKS/work-chart-log.sh"
STOP="$HOOKS/work-chart-stop.sh"
STAMP="$HOOKS/work-chart-stamp.sh"
pass=0; fail=0
ok()   { pass=$((pass+1)); echo "ok   - $1"; }
bad()  { fail=$((fail+1)); echo "FAIL - $1"; }
check() { # name expected actual
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected [$2], got [$3])"; fi
}

# Physical paths throughout: git reports repo tops with symlinks resolved.
T=$(cd "$(mktemp -d)" && pwd -P)
export HOME="$T/home"; mkdir -p "$HOME/.config/vault-skills"
unset OBSIDIAN_VAULT WC_NO_JQ
ROOT="$HOME/Code/Client"      # the work root
MAP="$ROOT/map"               # a repo that holds the vault
VAULT="$MAP/Notes"            # the vault
SIB="$ROOT/sibling"           # a sibling repo with no dossier
LOOSE="$ROOT/scratch"         # a plain folder in the root, not in git
ELSE="$T/elsewhere"           # a repo outside every root
mkrepo() {
  mkdir -p "$1"; git -C "$1" init -q; echo one > "$1/a.txt"
  git -C "$1" add -A; git -C "$1" -c user.name=t -c user.email=t@t commit -qm init
}
mkrepo "$MAP"; mkrepo "$SIB"; mkrepo "$ELSE"; mkdir -p "$LOOSE"
mkdir -p "$VAULT/Meta" "$VAULT/Daily" "$VAULT/Work"
config_roots() {
  printf -- '---\ntype: config\nfolders:\n  repos: Repos\nwork_roots:\n  - ~/Code/Client/\n  - "%s/extra"\ntimezone: UTC\n---\n\n# Vault config\n' "$T" > "$VAULT/Meta/Config.md"
}
config_roots
git -C "$MAP" add -A; git -C "$MAP" -c user.name=t -c user.email=t@t commit -qm vault
printf '%s\n' "$VAULT" > "$HOME/.config/vault-skills/vault-path"
. "$LIB"

# Hook input. post: $1 session, $2 tool, $3 cwd, $4 tool_input JSON (default {}).
post() {
  local ti="${4:-}"; [ -n "$ti" ] || ti='{}'
  printf '{"session_id":"%s","transcript_path":"/dev/null","cwd":"%s","permission_mode":"default","hook_event_name":"PostToolUse","tool_name":"%s","tool_input":%s,"tool_response":{"success":true}}' "$1" "$3" "$2" "$ti"
}
# stopin: $1 session, $2 cwd, $3 stop_hook_active.
stopin() {
  printf '{"session_id":"%s","transcript_path":"/dev/null","cwd":"%s","permission_mode":"default","hook_event_name":"Stop","stop_hook_active":%s}' "$1" "$2" "$3"
}
# Run the log hook; its output collects in $T/log.out, a non-zero exit is noted in $T/nonzero.
logcall() { post "$@" | bash "$LOG" >>"$T/log.out" 2>&1 || echo "log $*" >> "$T/nonzero"; }
# Run the Stop hook and print what it printed; a non-zero exit is noted in $T/nonzero.
stopcall() { stopin "$@" | bash "$STOP" || echo "stop $*" >> "$T/nonzero"; }
logfile() { printf '%s/.config/vault-skills/work-log/%s.tsv' "$HOME" "$1"; }
# Print a session's log without the time column, lines joined by " | ".
logged() { cut -f2- "$(logfile "$1")" 2>/dev/null | tr '\t' ':' | paste -sd'|' - | sed 's/|/ | /g'; }
: > "$T/log.out"; : > "$T/nonzero"

# --- Library -----------------------------------------------------------------------------

check "roots: listed, ~ expanded, quotes and trailing / dropped" "$ROOT
$T/extra" "$(wc_roots "$VAULT")"
printf -- '---\ntype: config\ntimezone: UTC\n---\n' > "$VAULT/Meta/Config.md"
check "roots: key missing -> the vault" "$VAULT" "$(wc_roots "$VAULT")"
printf -- '---\ntype: config\nwork_roots: []\ntimezone: UTC\n---\n' > "$VAULT/Meta/Config.md"
check "roots: empty list -> the vault" "$VAULT" "$(wc_roots "$VAULT")"
config_roots

wc_in_roots "$SIB/a.txt" "$VAULT"; check "in roots: file in a sibling repo" 0 "$?"
wc_in_roots "$ROOT" "$VAULT"; check "in roots: the root itself" 0 "$?"
wc_in_roots "${ROOT}2/x" "$VAULT"; check "in roots: Client2 is not under Client" 1 "$?"
wc_in_roots "$ELSE/a.txt" "$VAULT"; check "in roots: outside every root" 1 "$?"
wc_in_roots "" "$VAULT"; check "in roots: empty path" 1 "$?"

check "fingerprint: clean repo prints nothing" "" "$(wc_fingerprint "$MAP" "$VAULT")"
echo "note" > "$VAULT/Daily/2026-09-16.md"
check "fingerprint: vault notes leave the holding repo clean" "" "$(wc_fingerprint "$MAP" "$VAULT")"
[ -n "$(wc_fingerprint "$MAP")" ]; check "fingerprint: without the vault, the notes count" 0 "$?"
echo two >> "$MAP/a.txt"
fp1=$(wc_fingerprint "$MAP" "$VAULT")
[ -n "$fp1" ]; check "fingerprint: a code change counts" 0 "$?"
echo "more" > "$VAULT/Work/Work - notes 2026-09-16.md"
check "fingerprint: vault notes do not change it" "$fp1" "$(wc_fingerprint "$MAP" "$VAULT")"
git -C "$MAP" checkout -q -- a.txt
SOLO="$T/solo"; mkrepo "$SOLO"; echo "note" > "$SOLO/new.md"
check "fingerprint: a repo that is the vault prints nothing" "" "$(wc_fingerprint "$SOLO" "$SOLO")"

check "log path" "$HOME/.config/vault-skills/work-log/s-1.tsv" "$(wc_log_path s-1)"

# --- Old Stop hook (Task 4 replaces this section) ----------------------------------------

OLDVAULT="$T/oldvault"; mkdir -p "$OLDVAULT/Meta" "$OLDVAULT/Repos"
printf -- '---\nfolders:\n  repos: Repos\n---\n' > "$OLDVAULT/Meta/Config.md"
REPO="$T/scratch-tool"; mkrepo "$REPO"
NOREPO="$T/plain"; mkdir -p "$NOREPO"
OLDBLOCK='{"decision":"block","reason":"Files changed since the last work-chart rows. Use the work-chart skill: write the rows for what changed and why, then print the Work line."}'
oldin() { printf '{"session_id":"s","transcript_path":"/dev/null","cwd":"%s","permission_mode":"default","hook_event_name":"Stop","stop_hook_active":%s}' "$1" "$2"; }
printf '%s\n' "$OLDVAULT" > "$HOME/.config/vault-skills/vault-path"
check "old stop: silent when stop_hook_active" "" "$(oldin "$REPO" true | bash "$STOP")"
echo two >> "$REPO/a.txt"
check "old stop: silent outside a repo" "" "$(oldin "$NOREPO" false | bash "$STOP")"
check "old stop: silent without a dossier" "" "$(oldin "$REPO" false | bash "$STOP")"
printf -- '---\ntype: repo\n---\n' > "$OLDVAULT/Repos/scratch-tool.md"
check "old stop: blocks on changes with no stamp" "$OLDBLOCK" "$(oldin "$REPO" false | bash "$STOP")"
bash "$STAMP" "$REPO"
check "old stop: silent when stamp matches" "" "$(oldin "$REPO" false | bash "$STOP")"
printf '%s\n' "$VAULT" > "$HOME/.config/vault-skills/vault-path"

# --- end of old Stop hook ----------------------------------------------------------------

# --- Every run -----------------------------------------------------------------------------

check "both hooks exit 0 in every case above" "" "$(cat "$T/nonzero")"

echo "passed $pass, failed $fail"
rm -rf "$T"
[ "$fail" -eq 0 ]
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: `passed 9, failed 12` and `exit 1`. The `roots:`, `in roots:` and `log path` checks fail with `command not found` (exit 127), and three `fingerprint:` checks fail because the vault notes still count. The `old stop:` checks pass.

- [ ] **Step 3: Write the library**

Replace `hooks/work-chart-lib.sh` with:

```bash
#!/usr/bin/env bash
# Shared by the work-chart hooks and the stamp script. Source it; do not run it.

# Print the vault path, or nothing. $OBSIDIAN_VAULT first, then the pointer file.
wc_vault() {
  local v="${OBSIDIAN_VAULT:-}"
  if [ -z "$v" ] && [ -f "$HOME/.config/vault-skills/vault-path" ]; then
    IFS= read -r v < "$HOME/.config/vault-skills/vault-path"
  fi
  [ -n "$v" ] && [ -d "$v" ] && printf '%s' "$v"
}

# Print the repos folder name from Meta/Config.md, default Repos. $1 = vault.
# Used only by the old Stop hook; Task 4 removes it.
wc_repos_folder() {
  local f
  f=$(awk '/^folders:/{in_f=1; next} in_f && /^[^ ]/{in_f=0} in_f && /^  repos:/{sub(/^  repos:[ ]*/, ""); gsub(/["'"'"']/, ""); print; exit}' "$1/Meta/Config.md" 2>/dev/null)
  printf '%s' "${f:-Repos}"
}

# Print the work roots from Meta/Config.md, one per line, with a leading ~ expanded.
# Prints the vault itself when work_roots is missing or empty. $1 = vault.
wc_roots() {
  local r found=""
  while IFS= read -r r; do
    case "$r" in
      "~") r="$HOME" ;;
      "~/"*) r="$HOME/${r#\~/}" ;;
    esac
    [ "$r" = "/" ] || r="${r%/}"
    [ -n "$r" ] || continue
    printf '%s\n' "$r"; found=1
  done <<EOF
$(awk 'NR==1 && /^---[ \t]*$/ {fm=1; next}
  fm && /^---[ \t]*$/ {exit}
  /^work_roots:/ {in_r=1; next}
  in_r && /^[ \t]*$/ {next}
  in_r && /^[ \t]*-[ \t]/ {sub(/^[ \t]*-[ \t]*/, ""); sub(/[ \t]+$/, ""); gsub(/["'"'"']/, ""); print; next}
  in_r {exit}' "$1/Meta/Config.md" 2>/dev/null)
EOF
  [ -n "$found" ] || printf '%s\n' "$1"
}

# Succeed when path $1 is folder $2 or inside it. /a/b2 is not inside /a/b.
wc_under() {
  local p="${1%/}" d="${2%/}"
  [ -n "$p" ] && [ -n "$d" ] || return 1
  case "$p" in
    "$d"|"$d"/*) return 0 ;;
  esac
  return 1
}

# Succeed when path $1 is under any work root. $2 = vault.
wc_in_roots() {
  local r
  [ -n "${1:-}" ] || return 1
  while IFS= read -r r; do
    wc_under "$1" "$r" && return 0
  done <<EOF
$(wc_roots "$2")
EOF
  return 1
}

# Print a fingerprint of a repo's uncommitted state, or nothing when it is clean.
# $1 = repo top, $2 = vault (optional). When the vault sits inside the repo, its folder is
# left out, so writing notes never changes the fingerprint. A repo that is the vault: nothing.
wc_fingerprint() {
  local top="$1" vault="${2:-}" vtop prefix out
  set -- -- .
  if [ -n "$vault" ] && vtop=$(git -C "$vault" rev-parse --show-toplevel 2>/dev/null) && [ "$vtop" = "$top" ]; then
    prefix=$(git -C "$vault" rev-parse --show-prefix 2>/dev/null)
    prefix="${prefix%/}"
    [ -n "$prefix" ] || return 0
    set -- -- . ":(exclude)$prefix"
  fi
  out=$( { git -C "$top" status --porcelain "$@"; git -C "$top" diff --stat "$@"; git -C "$top" diff --cached --stat "$@"; } 2>/dev/null )
  [ -n "$out" ] && printf '%s' "$out" | shasum | cut -d' ' -f1
}

# Print the stamp file path for a repo. $1 = repo top.
wc_stamp_path() {
  printf '%s/.config/vault-skills/work-stamp/%s' "$HOME" "$(printf '%s' "$1" | shasum | cut -d' ' -f1)"
}

# Print the activity log path for a session. $1 = session_id.
wc_log_path() {
  printf '%s/.config/vault-skills/work-log/%s.tsv' "$HOME" "$(printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_')"
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: `passed 21, failed 0` and `exit 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/work-chart-lib.sh hooks/tests/test-work-chart-hook.sh
git commit -m "work-chart: add work-root and log-path helpers, leave the vault out of fingerprints

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Log hook and its registration

**Files:**
- Create: `hooks/work-chart-log.sh` (executable)
- Modify: `hooks/work-chart-lib.sh` (append three functions)
- Modify: `hooks/hooks.json` (whole file replaced)
- Modify: `hooks/tests/test-work-chart-hook.sh` (insert the Log hook section)

**Interfaces:**
- Consumes: `wc_vault`, `wc_in_roots`, `wc_under`, `wc_log_path` from Task 1.
- Produces:
  - `wc_hook_fields <json>` — prints six lines: `session_id`, `cwd`, `tool_name`, touched path (`tool_input.file_path`, then `notebook_path`, then `path`), `stop_hook_active` as `true`/`false`, and whether `tool_input.command` contains `work-chart-stamp.sh` as `true`/`false`. Honours `WC_NO_JQ`.
  - `wc_kind <tool_name>` — prints `edit`, `outward`, `research`, `shell`, or nothing.
  - `wc_git_top <dir>` — prints the nearest folder at or above `<dir>` holding a `.git` entry, without running git; exit 1 when there is none.
  - `hooks/work-chart-log.sh` — reads PostToolUse JSON on stdin and appends `<epoch>\t<kind>\t<tool>\t<place>` to `wc_log_path <session_id>`. For a `Bash` call whose command names `work-chart-stamp.sh`, the kind is `MARK` and the place is empty.

Classification, per the spec. Matching is case-insensitive. For `mcp__` tools only the part after the last `__` counts, and only the verb it starts with, so `getTransitionsForJiraIssue` and `list_labels` are research and `editJiraIssue` is outward:

| Kind | Tools |
|---|---|
| `edit` | `Edit`, `Write`, `NotebookEdit` |
| `outward` | MCP tools whose last part starts with create, add, send, post, comment, update, edit, write, save, copy, move, transition, reply, respond, forward, share, delete, trash, label, unlabel, mark, unmark or apply |
| `research` | `Read`, `Grep`, `Glob`, `WebFetch`, `WebSearch`, and MCP tools whose last part starts with get, search, list, fetch, query, read, lookup or find |
| `shell` | `Bash` |

Everything else is not logged. The log hook finds the repo top for `shell` by walking up to a `.git` entry instead of running `git`, which keeps each call near 25 ms. The Stop hook re-resolves that folder with `git rev-parse --show-toplevel` (Task 4), so the stamp keys still match.

- [ ] **Step 1: Write the failing tests**

In `hooks/tests/test-work-chart-hook.sh`, insert this section directly above the line `# --- Old Stop hook (Task 4 replaces this section) ---…`:

```bash
# --- Log hook ----------------------------------------------------------------------------

logcall c1 Edit "$VAULT" "{\"file_path\":\"$SIB/a.txt\",\"old_string\":\"one\",\"new_string\":\"two\"}"
logcall c1 Write "$VAULT" "{\"file_path\":\"$LOOSE/q.sql\",\"content\":\"select 1\"}"
logcall c1 NotebookEdit "$VAULT" "{\"notebook_path\":\"$SIB/n.ipynb\",\"new_source\":\"x\"}"
logcall c1 mcp__atlassian__addCommentToJiraIssue "$VAULT" '{"issueIdOrKey":"PFD-1","commentBody":"hi"}'
logcall c1 mcp__claude_ai_Gmail__label_message "$VAULT" '{"messageId":"m"}'
logcall c1 mcp__claude_ai_Gmail__list_labels "$VAULT"
logcall c1 mcp__claude_ai_Gmail__search_threads "$VAULT" '{"query":"pallet"}'
logcall c1 mcp__atlassian__getTransitionsForJiraIssue "$VAULT" '{"issueIdOrKey":"PFD-1"}'
logcall c1 mcp__atlassian__editJiraIssue "$VAULT" '{"issueIdOrKey":"PFD-1"}'
logcall c1 mcp__claude_ai_Asana__save_task_changes_confirm "$VAULT"
logcall c1 Read "$VAULT" "{\"file_path\":\"$SIB/a.txt\"}"
logcall c1 Grep "$VAULT" "{\"pattern\":\"x\",\"path\":\"$SIB\"}"
logcall c1 WebFetch "$VAULT" '{"url":"https://example.test","prompt":"p"}'
logcall c1 Bash "$SIB" '{"command":"ls -la"}'
logcall c1 Bash "$LOOSE" '{"command":"ls"}'
check "log: each kind classified, place recorded" "edit:Edit:$SIB/a.txt | edit:Write:$LOOSE/q.sql | edit:NotebookEdit:$SIB/n.ipynb | outward:mcp__atlassian__addCommentToJiraIssue: | outward:mcp__claude_ai_Gmail__label_message: | research:mcp__claude_ai_Gmail__list_labels: | research:mcp__claude_ai_Gmail__search_threads: | research:mcp__atlassian__getTransitionsForJiraIssue: | outward:mcp__atlassian__editJiraIssue: | outward:mcp__claude_ai_Asana__save_task_changes_confirm: | research:Read:$SIB/a.txt | research:Grep:$SIB | research:WebFetch: | shell:Bash:$SIB | shell:Bash:" "$(logged c1)"
check "log: four tab-separated fields, epoch first" "yes" "$(awk -F'\t' 'NF != 4 || $1 !~ /^[0-9]+$/ {bad=1} END {print bad ? "no" : "yes"}' "$(logfile c1)")"

logcall c2 Skill "$VAULT" '{"skill":"consultant-vault:daybook"}'
logcall c2 Agent "$VAULT" '{"prompt":"x"}'
logcall c2 TodoWrite "$VAULT" '{"todos":[]}'
logcall c2 AskUserQuestion "$VAULT" '{"questions":[]}'
logcall c2 mcp__claude_design__render_preview "$VAULT" '{}'
check "log: Skill, Agent, todo, questions, unmatched MCP write nothing" "" "$(logged c2)"

logcall c3 Edit "$VAULT" "{\"file_path\":\"$VAULT/Daily/2026-09-16.md\"}"
logcall c3 Write "$SIB" "{\"file_path\":\"$VAULT/Work/x.md\"}"
check "log: vault edits skipped" "" "$(logged c3)"

logcall c4 Bash "$ELSE" '{"command":"ls"}'
logcall c4 Read "$ELSE" "{\"file_path\":\"$ELSE/a.txt\"}"
logcall c4 Edit "$ELSE" "{\"file_path\":\"${ROOT}2/a.txt\"}"
check "log: calls outside every root skipped" "" "$(logged c4)"
logcall c4 Edit "$ELSE" "{\"file_path\":\"$SIB/a.txt\"}"
check "log: cwd outside, path inside -> logged" "edit:Edit:$SIB/a.txt" "$(logged c4)"

logcall c5 Bash "$SIB" '{"command":"bash /plugins/consultant-vault/hooks/work-chart-stamp.sh /x/sibling"}'
check "log: the stamp call writes a MARK" "MARK:Bash:" "$(logged c5)"

rm "$HOME/.config/vault-skills/vault-path"
logcall c6 Edit "$SIB" "{\"file_path\":\"$SIB/a.txt\"}"
check "log: no vault -> nothing" "" "$(logged c6)"
printf '%s\n' "$VAULT" > "$HOME/.config/vault-skills/vault-path"

printf -- '---\ntype: config\n---\n' > "$VAULT/Meta/Config.md"
logcall c7 Edit "$SIB" "{\"file_path\":\"$SIB/a.txt\"}"
logcall c7 Bash "$VAULT" '{"command":"ls"}'
check "log: work_roots missing -> only the vault counts" "shell:Bash:$MAP" "$(logged c7)"
config_roots

WC_NO_JQ=1 logcall c8 Edit "$VAULT" "{\"file_path\":\"$SIB/a.txt\"}"
WC_NO_JQ=1 logcall c8 mcp__atlassian__getJiraIssue "$VAULT" '{"issueIdOrKey":"PFD-1"}'
WC_NO_JQ=1 logcall c8 Bash "$SIB" '{"command":"sh hooks/work-chart-stamp.sh"}'
check "log: sed fallback without jq" "edit:Edit:$SIB/a.txt | research:mcp__atlassian__getJiraIssue: | MARK:Bash:" "$(logged c8)"

printf 'not json' | bash "$LOG" >>"$T/log.out" 2>&1 || echo "log bad json" >> "$T/nonzero"
mv "$HOME/.config/vault-skills/work-log" "$T/work-log.saved"; echo blocker > "$HOME/.config/vault-skills/work-log"
logcall c9 Edit "$VAULT" "{\"file_path\":\"$SIB/a.txt\"}"
rm "$HOME/.config/vault-skills/work-log"; mv "$T/work-log.saved" "$HOME/.config/vault-skills/work-log"
check "log: never prints, even on bad JSON or an unwritable log folder" "" "$(cat "$T/log.out")"

logcall warm Bash "$SIB" '{"command":"ls"}'
TIMEFORMAT=%R
secs=$( { time for i in 1 2 3 4 5 6 7 8 9 10; do post speed Bash "$SIB" '{"command":"ls"}' | bash "$LOG"; done; } 2>&1 )
check "log: under 50 ms a call (10 calls took ${secs}s)" "yes" "$(awk -v s="$secs" 'BEGIN {print (s < 0.5) ? "yes" : "no"}')"
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: `passed 24, failed 9` and `exit 1`. Every `log:` check that expects a line fails, and so do `never prints`, `under 50 ms` and `both hooks exit 0`, because `bash` reports `No such file or directory` for the missing script.

- [ ] **Step 3: Append the helpers to the library**

Append to the end of `hooks/work-chart-lib.sh`:

```bash
# Print six lines read from hook JSON $1: session_id, cwd, tool_name, touched path
# (tool_input file_path, then notebook_path, then path), stop_hook_active (true/false),
# and whether tool_input.command mentions work-chart-stamp.sh (true/false).
# Uses jq when present (and WC_NO_JQ is unset), else sed.
wc_hook_fields() {
  if [ -z "${WC_NO_JQ:-}" ] && command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -r '
      def s: if . == null then "" else tostring | gsub("[\n\r]"; " ") end;
      (.session_id | s),
      (.cwd | s),
      (.tool_name | s),
      ((.tool_input.file_path? // .tool_input.notebook_path? // .tool_input.path?) | s),
      (.stop_hook_active == true | tostring),
      ((.tool_input.command? // "") | tostring | contains("work-chart-stamp.sh") | tostring)
    ' 2>/dev/null
    return 0
  fi
  local k v p=""
  for k in session_id cwd tool_name; do
    printf '%s\n' "$1" | sed -n "s/.*\"$k\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1
  done
  for k in file_path notebook_path path; do
    v=$(printf '%s\n' "$1" | sed -n "s/.*\"$k\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1)
    [ -n "$v" ] && { p="$v"; break; }
  done
  printf '%s\n' "$p"
  if printf '%s' "$1" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then echo true; else echo false; fi
  if printf '%s' "$1" | grep -q '"command"[[:space:]]*:[[:space:]]*"[^"]*work-chart-stamp\.sh'; then echo true; else echo false; fi
}

# Print the log kind for a tool name: edit, outward, research, shell, or nothing.
# Case-insensitive. For MCP tools only the verb the last name part starts with counts,
# so getTransitionsForJiraIssue and list_labels are research, editJiraIssue is outward.
wc_kind() {
  local last="${1##*__}" kind=""
  shopt -s nocasematch
  case "$1" in
    Edit|Write|NotebookEdit) kind=edit ;;
    Read|Grep|Glob|WebFetch|WebSearch) kind=research ;;
    Bash) kind=shell ;;
    mcp__*)
      case "$last" in
        create*|add*|send*|post*|comment*|update*|edit*|write*|save*|copy*|move*|transition*|reply*|respond*|forward*|share*|delete*|trash*|label*|unlabel*|mark*|unmark*|apply*)
          kind=outward ;;
        get*|search*|list*|fetch*|query*|read*|lookup*|find*)
          kind=research ;;
      esac ;;
  esac
  shopt -u nocasematch
  [ -n "$kind" ] && printf '%s\n' "$kind"
  return 0
}

# Print the nearest folder at or above $1 that holds a .git entry, without running git.
# Fast enough for the log hook; the Stop hook resolves the result with git.
wc_git_top() {
  local d="${1%/}"
  while [ -n "$d" ]; do
    [ -e "$d/.git" ] && { printf '%s' "$d"; return 0; }
    d="${d%/*}"
  done
  return 1
}
```

- [ ] **Step 4: Write the log hook**

Create `hooks/work-chart-log.sh`, then run `chmod +x hooks/work-chart-log.sh`:

```bash
#!/usr/bin/env bash
# work-chart PostToolUse hook. Reads the hook JSON on stdin and appends one line to this
# session's activity log when the call counts as work: time, kind, tool, place.
# Never prints, never blocks a tool call, never stores file contents or command text.
# Writes only under ~/.config/vault-skills/work-log/. Always exits 0. Runs on every
# tool call, so it avoids extra processes: under 50 ms a call.
set -u

log_call() {
  local here input vault sid cwd tool path active stampcall kind place="" log
  case "$0" in */*) here="${0%/*}" ;; *) here=. ;; esac
  . "$here/work-chart-lib.sh" || return 0
  input=$(cat)
  vault=$(wc_vault) || return 0
  { IFS= read -r sid; IFS= read -r cwd; IFS= read -r tool; IFS= read -r path; IFS= read -r active; IFS= read -r stampcall; } <<FIELDS
$(wc_hook_fields "$input")
FIELDS
  [ -n "$sid" ] && [ -n "$tool" ] || return 0
  kind=$(wc_kind "$tool")
  [ -n "$kind" ] || return 0
  [ "$kind" = shell ] && path="$cwd"
  case "$path" in
    ""|/*) ;;
    *) path="$cwd/$path" ;;
  esac
  wc_in_roots "$cwd" "$vault" || wc_in_roots "$path" "$vault" || return 0
  case "$kind" in
    edit)
      wc_under "$path" "$vault" && return 0
      place="$path" ;;
    research)
      place="$path" ;;
    shell)
      if [ "$stampcall" = true ]; then
        kind=MARK
      else
        place=$(wc_git_top "$cwd") || place=""
      fi ;;
  esac
  log=$(wc_log_path "$sid")
  [ -d "${log%/*}" ] || mkdir -p "${log%/*}" || return 0
  printf '%s\t%s\t%s\t%s\n' "$(date +%s)" "$kind" "$tool" "$place" >> "$log"
}

log_call >/dev/null 2>&1
exit 0
```

- [ ] **Step 5: Register it**

Replace `hooks/hooks.json` with:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/work-chart-log.sh" }
        ]
      }
    ],
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

- [ ] **Step 6: Run the tests to verify they pass**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
python3 -c "import json; json.load(open('hooks/hooks.json'))" && echo json ok
claude plugin validate .
```

Expected: `passed 33, failed 0`, `exit 0`, `json ok`, and `Validation passed` from validate (the existing "No version specified" warning is expected). The `under 50 ms` line shows the time for ten calls; about 0.25s is normal on the user's Mac. If it fails on a loaded machine, run the file again before changing code.

- [ ] **Step 7: Commit**

```bash
git add hooks/work-chart-log.sh hooks/work-chart-lib.sh hooks/hooks.json hooks/tests/test-work-chart-hook.sh
git commit -m "work-chart: log counted tool calls in a per-session activity log

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Stamp script takes many repos, or none

**Files:**
- Modify: `hooks/work-chart-stamp.sh` (whole file replaced)
- Modify: `hooks/tests/test-work-chart-hook.sh` (insert the Stamp script section)

**Interfaces:**
- Consumes: `wc_vault`, `wc_fingerprint <top> <vault>`, `wc_stamp_path` from Task 1.
- Produces: `work-chart-stamp.sh [path ...]`. For each path (a folder or a file anywhere inside a repo), it writes `wc_fingerprint <top> <vault>` to `wc_stamp_path <top>`. With no paths it does nothing and exits 0. A path in no repo prints `not a git repo: <path>` on stderr; the script stamps the rest and exits 1.

- [ ] **Step 1: Write the failing tests**

In `hooks/tests/test-work-chart-hook.sh`, insert this section directly above the line `# --- Log hook ---…`:

```bash
# --- Stamp script ------------------------------------------------------------------------

STAMPS="$HOME/.config/vault-skills/work-stamp"
bash "$STAMP" > "$T/stamp.out" 2>&1; code=$?
check "stamp: no arguments exits 0" 0 "$code"
check "stamp: no arguments prints nothing" "" "$(cat "$T/stamp.out")"
check "stamp: no arguments writes no stamp" "0" "$(ls "$STAMPS" 2>/dev/null | wc -l | tr -d ' ')"

echo two >> "$SIB/a.txt"; echo two >> "$MAP/a.txt"
bash "$STAMP" "$SIB" "$MAP/a.txt" 2>"$T/stamp.err"; code=$?
check "stamp: two repos exits 0" 0 "$code"
check "stamp: sibling stamp holds its fingerprint" "$(wc_fingerprint "$SIB" "$VAULT")" "$(cat "$(wc_stamp_path "$SIB")")"
check "stamp: a file path stamps its repo, vault left out" "$(wc_fingerprint "$MAP" "$VAULT")" "$(cat "$(wc_stamp_path "$MAP")")"

rm -rf "$STAMPS"
bash "$STAMP" "$SIB" "$T/nowhere" "$MAP" 2>"$T/stamp.err"; code=$?
check "stamp: a path outside git exits 1" 1 "$code"
check "stamp: the bad path is named on stderr" "not a git repo: $T/nowhere" "$(cat "$T/stamp.err")"
[ -f "$(wc_stamp_path "$SIB")" ] && [ -f "$(wc_stamp_path "$MAP")" ]
check "stamp: the other repos are still stamped" 0 "$?"
git -C "$SIB" checkout -q -- a.txt; git -C "$MAP" checkout -q -- a.txt; rm -rf "$STAMPS"
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: `passed 36, failed 6` and `exit 1`. The six failures are `no arguments exits 0`, `no arguments prints nothing`, `a file path stamps its repo`, `a path outside git exits 1`, `the bad path is named on stderr`, and `the other repos are still stamped`.

- [ ] **Step 3: Write the stamp script**

Replace `hooks/work-chart-stamp.sh` with:

```bash
#!/usr/bin/env bash
# Records the current fingerprint of each repo given, so the Stop hook stays quiet until
# something else changes there. Run by the work-chart skill after it writes rows.
# Usage: work-chart-stamp.sh [path inside a repo ...]
# No paths is fine: it does nothing and exits 0 (the log hook sees the call and marks the log).
# A path in no git repo: a message on stderr, the rest still stamped, exit 1 at the end.
set -u
. "$(cd "$(dirname "$0")" && pwd)/work-chart-lib.sh"
vault=$(wc_vault) || vault=""
status=0
for p in "$@"; do
  d="$p"
  [ -d "$d" ] || d=$(dirname "$p")
  if ! top=$(git -C "$d" rev-parse --show-toplevel 2>/dev/null); then
    echo "not a git repo: $p" >&2
    status=1
    continue
  fi
  stamp=$(wc_stamp_path "$top")
  mkdir -p "$(dirname "$stamp")"
  wc_fingerprint "$top" "$vault" > "$stamp"
done
exit "$status"
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: `passed 42, failed 0` and `exit 0`. The `old stop:` checks still pass, because one path still works.

- [ ] **Step 5: Commit**

```bash
git add hooks/work-chart-stamp.sh hooks/tests/test-work-chart-hook.sh
git commit -m "work-chart: stamp any number of repos, or none

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Stop hook reads the activity log

**Files:**
- Modify: `hooks/work-chart-stop.sh` (whole file replaced)
- Modify: `hooks/work-chart-lib.sh` (remove `wc_repos_folder`)
- Modify: `hooks/tests/test-work-chart-hook.sh` (replace the old Stop section)

**Interfaces:**
- Consumes: `wc_hook_fields`, `wc_vault`, `wc_log_path`, `wc_fingerprint`, `wc_stamp_path` (Tasks 1–2); the log format from Task 2; the stamp files from Task 3.
- Produces: `hooks/work-chart-stop.sh`. It reads Stop JSON on stdin and prints nothing, or one line, `{"decision":"block","reason":"…"}`, with the reason in the Global Constraints shape. It deletes `*.tsv` files older than 14 days from the log folder on every run once a vault is configured.

These are the spec's step-by-step rules, with the choices the spec leaves open:
- A touched repo is the `git rev-parse --show-toplevel` of each `edit` path's nearest existing folder, and of each non-empty `shell` place.
- "Repos with changes" names a touched repo when it has an `edit` line after the last `MARK`, or when its fingerprint is non-empty and differs from its stamp. An edited repo whose changes are already committed is still named, so the rows and the stamp call cover it.
- Old logs are cleaned before the log is read, so cleaning also happens on silent stops.
- `HH:MM` is `date -r <epoch> +%H:%M`, in the machine's local time.

- [ ] **Step 1: Write the failing tests**

In `hooks/tests/test-work-chart-hook.sh`, delete everything from the line `# --- Old Stop hook (Task 4 replaces this section) ---…` through the line `# --- end of old Stop hook ---…` and the blank line after it. Put this section in its place, directly above `# --- Every run ---…`:

```bash
# --- Stop hook ---------------------------------------------------------------------------

TAIL='Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.'
# block: $1 = epoch of the first line after the last MARK, $2 = the parts.
block() { printf '{"decision":"block","reason":"Work since %s not yet in the work chart: %s. %s"}' "$(date -r "$1" +%H:%M)" "$2" "$TAIL"; }
# first: epoch of the first line after the last MARK in a session's log.
first() { awk -F'\t' '$2 == "MARK" {t = ""; next} t == "" {t = $1} END {print t}' "$(logfile "$1")"; }
# put: write a log line directly. $1 session, $2 epoch, $3 kind, $4 tool, $5 place.
put() { mkdir -p "$HOME/.config/vault-skills/work-log"; printf '%s\t%s\t%s\t%s\n' "$2" "$3" "$4" "${5:-}" >> "$(logfile "$1")"; }
snapshot() { find "$MAP" "$SIB" "$LOOSE" -path '*/.git' -prune -o -type f -print0 | xargs -0 shasum | sort | shasum; }
REASON_SIB="repos with changes: sibling (~/Code/Client/sibling)"

for i in 1 2 3 4; do logcall r1 WebFetch "$VAULT" '{"url":"https://example.test"}'; done
check "stop: four research calls -> silent" "" "$(stopcall r1 "$VAULT" false)"
logcall r1 Bash "$LOOSE" '{"command":"ls"}'
check "stop: five research and shell calls -> block" "$(block "$(first r1)" 'research calls: 5')" "$(stopcall r1 "$VAULT" false)"
check "stop: loop guard on -> silent" "" "$(stopcall r1 "$VAULT" true)"
rm "$HOME/.config/vault-skills/vault-path"
check "stop: no vault -> silent" "" "$(stopcall r1 "$VAULT" false)"
printf '%s\n' "$VAULT" > "$HOME/.config/vault-skills/vault-path"
check "stop: no log for the session -> silent" "" "$(stopcall nolog "$VAULT" false)"

echo two >> "$SIB/a.txt"
logcall e1 Edit "$VAULT" "{\"file_path\":\"$SIB/a.txt\"}"
before=$(snapshot)
check "stop: vault session, one edit in a sibling repo with no dossier -> block naming it" "$(block "$(first e1)" "$REASON_SIB")" "$(stopcall e1 "$VAULT" false)"
check "stop: wrote nothing to the repos or the vault" "$before" "$(snapshot)"
check "stop: same result without jq" "$(block "$(first e1)" "$REASON_SIB")" "$(WC_NO_JQ=1 stopcall e1 "$VAULT" false)"
bash "$STAMP" "$SIB"
logcall e1 Bash "$VAULT" "{\"command\":\"bash $STAMP $SIB\"}"
check "stop: MARK with nothing after -> silent" "" "$(stopcall e1 "$VAULT" false)"

logcall o1 mcp__atlassian__addCommentToJiraIssue "$VAULT" '{"issueIdOrKey":"PFD-1"}'
check "stop: one outward call -> block" "$(block "$(first o1)" 'outward calls: 1')" "$(stopcall o1 "$VAULT" false)"

echo "select 1" > "$LOOSE/q.sql"
logcall f1 Write "$VAULT" "{\"file_path\":\"$LOOSE/q.sql\"}"
check "stop: edit outside git -> block naming the file" "$(block "$(first f1)" 'files outside git: ~/Code/Client/scratch/q.sql')" "$(stopcall f1 "$VAULT" false)"

logcall d1 Bash "$SIB" '{"command":"ls"}'
check "stop: shell only, repo matches its stamp -> silent" "" "$(stopcall d1 "$SIB" false)"
echo three >> "$SIB/a.txt"
check "stop: shell only, file changed on disk -> block through the fingerprint" "$(block "$(first d1)" "$REASON_SIB; research calls: 1")" "$(stopcall d1 "$SIB" false)"
git -C "$SIB" checkout -q -- a.txt; rm -rf "$HOME/.config/vault-skills/work-stamp"
check "stop: shell only, repo clean again -> silent" "" "$(stopcall d1 "$SIB" false)"

logcall v1 Bash "$VAULT" '{"command":"ls"}'
echo "row" >> "$VAULT/Work/Work - notes 2026-09-16.md"
echo "line" >> "$VAULT/Daily/2026-09-16.md"
check "stop: vault notes written, holding repo otherwise clean -> silent" "" "$(stopcall v1 "$VAULT" false)"

for i in 1 2 3 4 5 6 7 8 9 10; do put m1 1789567500 research WebFetch; done
put m1 1789567600 MARK Bash
check "stop: only lines after the last MARK count" "" "$(stopcall m1 "$VAULT" false)"
put m1 1789567700 edit Edit "$SIB/a.txt"
check "stop: edit after MARK, repo since committed -> block, time from that line" "$(block 1789567700 "$REASON_SIB")" "$(stopcall m1 "$VAULT" false)"

echo two >> "$SIB/a.txt"; echo two >> "$MAP/a.txt"
put a1 1789567500 edit Edit "$SIB/a.txt"
put a1 1789567510 shell Bash "$SIB"
put a1 1789567520 edit Edit "$MAP/a.txt"
put a1 1789567530 edit Write "$LOOSE/q.sql"
put a1 1789567540 edit Write "$LOOSE/q.sql"
for i in 1 2 3 4 5 6; do put a1 1789567610 research WebFetch; done
put a1 1789567620 outward mcp__atlassian__addCommentToJiraIssue
check "stop: every part, in order" "$(block 1789567500 "repos with changes: sibling (~/Code/Client/sibling), map (~/Code/Client/map); files outside git: ~/Code/Client/scratch/q.sql; research calls: 7; outward calls: 1")" "$(stopcall a1 "$VAULT" false)"
git -C "$SIB" checkout -q -- a.txt; git -C "$MAP" checkout -q -- a.txt

LOGS="$HOME/.config/vault-skills/work-log"
: > "$LOGS/old.tsv"; touch -t "$(date -v-15d +%Y%m%d%H%M)" "$LOGS/old.tsv"
: > "$LOGS/recent.tsv"; touch -t "$(date -v-13d +%Y%m%d%H%M)" "$LOGS/recent.tsv"
stopcall nolog "$VAULT" false >/dev/null
check "stop: logs older than 14 days removed, newer kept" "recent.tsv" "$(cd "$LOGS" && ls old.tsv recent.tsv 2>/dev/null)"
```

These tests cover spec shell tests 6–13 and 16–17. They replace the dossier test.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
```

Expected: `passed 47, failed 9` and `exit 1`. Every `stop:` check that expects a block fails, because the old hook finds no dossier. `logs older than 14 days removed` fails too. The silent checks pass by accident; they are for later.

- [ ] **Step 3: Remove `wc_repos_folder` from the library**

Delete these lines from `hooks/work-chart-lib.sh`, together with the blank line after them:

```bash
# Print the repos folder name from Meta/Config.md, default Repos. $1 = vault.
# Used only by the old Stop hook; Task 4 removes it.
wc_repos_folder() {
  local f
  f=$(awk '/^folders:/{in_f=1; next} in_f && /^[^ ]/{in_f=0} in_f && /^  repos:/{sub(/^  repos:[ ]*/, ""); gsub(/["'"'"']/, ""); print; exit}' "$1/Meta/Config.md" 2>/dev/null)
  printf '%s' "${f:-Repos}"
}
```

Then confirm that nothing else uses it:

```bash
grep -rn wc_repos_folder hooks skills   # no output
```

- [ ] **Step 4: Write the Stop hook**

Replace `hooks/work-chart-stop.sh` with the following. It stays executable:

```bash
#!/usr/bin/env bash
# work-chart Stop hook. Reads the hook JSON on stdin and this session's activity log.
# Prints one block decision when the work since the last rows is worth a row: an edit,
# an outward call, 5 or more research and shell calls, or a touched repo whose fingerprint
# differs from its stamp. Removes activity logs older than 14 days.
# Never writes to a repo or the vault. Always exits 0.
set -u

TAB=$(printf '\t')

# Print a path with $HOME shortened to ~.
short() {
  case "$1" in
    "$HOME"/*) printf '~%s' "${1#"$HOME"}" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Append $1 to $parts, joined by "; ".
add_part() {
  if [ -z "$parts" ]; then parts="$1"; else parts="$parts; $1"; fi
}

check_stop() {
  local input sid cwd tool path active stampcall vault dir log kept first edits outward research
  local seen="" outside="" kind place d top fp stamp changed="" named="" files="" reason when
  parts=""
  . "$(cd "$(dirname "$0")" && pwd)/work-chart-lib.sh" || return 0
  input=$(cat)
  { IFS= read -r sid; IFS= read -r cwd; IFS= read -r tool; IFS= read -r path; IFS= read -r active; IFS= read -r stampcall; } <<FIELDS
$(wc_hook_fields "$input")
FIELDS
  [ "$active" = true ] && return 0
  vault=$(wc_vault) || return 0

  dir="$HOME/.config/vault-skills/work-log"
  [ -d "$dir" ] && find "$dir" -type f -name '*.tsv' -mtime +14 -delete 2>/dev/null

  [ -n "$sid" ] || return 0
  log=$(wc_log_path "$sid")
  [ -f "$log" ] || return 0
  kept=$(awk -F'\t' '$2 == "MARK" {buf = ""; next} {buf = buf $0 "\n"} END {printf "%s", buf}' "$log")
  [ -n "$kept" ] || return 0

  set -- $(printf '%s\n' "$kept" | awk -F'\t' '{c[$2]++} END {print c["edit"]+0, c["outward"]+0, c["research"]+c["shell"]+0}')
  edits=$1; outward=$2; research=$3
  first=$(printf '%s\n' "$kept" | head -n 1 | cut -f1)

  # Touched repos (tagged edit or shell) and files outside git, in first-seen order.
  while IFS="$TAB" read -r _ kind _ place; do
    [ -n "$place" ] || continue
    case "$kind" in
      edit)
        d=$(dirname "$place")
        while [ ! -d "$d" ]; do d=$(dirname "$d"); done
        if top=$(git -C "$d" rev-parse --show-toplevel 2>/dev/null); then
          seen="$seen$top${TAB}edit
"
        else
          outside="$outside$place
"
        fi ;;
      shell)
        top=$(git -C "$place" rev-parse --show-toplevel 2>/dev/null) || continue
        seen="$seen$top${TAB}shell
" ;;
    esac
  done <<LINES
$kept
LINES

  # A touched repo is named when it was edited or its fingerprint differs from its stamp.
  while IFS= read -r top; do
    [ -n "$top" ] || continue
    fp=$(wc_fingerprint "$top" "$vault")
    stamp=$(wc_stamp_path "$top")
    if [ -n "$fp" ] && { [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$fp" ]; }; then
      changed=1
    elif ! printf '%s' "$seen" | grep -qxF "$top${TAB}edit"; then
      continue
    fi
    named="${named:+$named, }$(basename "$top") ($(short "$top"))"
  done <<TOPS
$(printf '%s' "$seen" | cut -f1 | awk '!seen[$0]++')
TOPS

  [ "$edits" -gt 0 ] || [ "$outward" -gt 0 ] || [ "$research" -ge 5 ] || [ -n "$changed" ] || return 0

  while IFS= read -r place; do
    [ -n "$place" ] && files="${files:+$files, }$(short "$place")"
  done <<FILES
$(printf '%s' "$outside" | awk '!seen[$0]++')
FILES

  [ -n "$named" ] && add_part "repos with changes: $named"
  [ -n "$files" ] && add_part "files outside git: $files"
  [ "$research" -gt 0 ] && add_part "research calls: $research"
  [ "$outward" -gt 0 ] && add_part "outward calls: $outward"
  when=$(date -r "$first" +%H:%M 2>/dev/null || date -d "@$first" +%H:%M 2>/dev/null)
  reason="Work since $when not yet in the work chart: $parts. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line."

  if [ -z "${WC_NO_JQ:-}" ] && command -v jq >/dev/null 2>&1; then
    jq -cn --arg r "$reason" '{decision: "block", reason: $r}'
  else
    printf '{"decision":"block","reason":"%s"}\n' "$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  fi
}

check_stop 2>/dev/null
exit 0
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
bash hooks/tests/test-work-chart-hook.sh; echo "exit $?"
bash -n hooks/*.sh && echo syntax ok
claude plugin validate .
```

Expected: `passed 56, failed 0`, `exit 0`, `syntax ok`, and `Validation passed` from validate (the existing "No version specified" warning is expected).

- [ ] **Step 6: Commit**

```bash
git add hooks/work-chart-stop.sh hooks/work-chart-lib.sh hooks/tests/test-work-chart-hook.sh
git commit -m "work-chart: Stop hook asks for rows from the activity log, across repos

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Skill scenarios and the RED run

**Files:**
- Modify: `docs/superpowers/baselines/work-chart.md` (append a section)
- Create: `docs/superpowers/baselines/results/work-chart-activity-log-<YYYY-MM-DD>.md`

**Interfaces:**
- Consumes: the hooks from Tasks 1–4 (the stamp script must take zero arguments); `skills/work-chart/SKILL.md` as it is on `main` (the RED variant).
- Produces: the fixtures, prompts D, N and V, scripted hook messages, and checks `D1`–`D7`, `N1`–`N3` and `V1`–`V6`; RED pass counts and verbatim rationalizations for Task 6 to write against.

- [ ] **Step 1: Append the scenarios**

Append to the end of `docs/superpowers/baselines/work-chart.md`:

`````markdown
## Activity-log scenarios (added 2026-09-16)

**Change covered:** the 2026-09-16 activity-log change to `work-chart`
(`docs/superpowers/specs/2026-09-16-work-chart-activity-log-design.md`). RED runs the skill as it
was before the change; GREEN runs it after. Three reps per scenario per variant.

**Failures we are hunting.** Research with no answer: omission. A fresh agent that hits a dead
end writes nothing, or writes "Read … nothing changed" with `decided: none`. No-goal question:
noise and a hook that keeps asking. The agent writes a row for a plain answer, or writes nothing
and skips the stamp. Vault-started session: wrong shape. The agent leaves a repo with no dossier
out of `repos`, or creates the dossier unasked.

### Fixtures

Run once per rep. `CHECKOUT` is the absolute path of the checkout or worktree holding the branch.
The vault copy sits inside a git repo with a sibling repo beside it, like the live layout.

```bash
CHECKOUT=<absolute path of the checkout>
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/work-chart-al-$(date +%s)
mkdir -p "$RUN/home/.config/vault-skills" "$RUN/clients/map"
cp -R "$SRC" "$RUN/clients/map/US_Cold_Notes"
rm -rf "$RUN/clients/map/US_Cold_Notes/Work"
git -C "$RUN/clients/map" init -q
git -C "$RUN/clients/map" add -A
git -C "$RUN/clients/map" -c user.name=t -c user.email=t@t commit -qm init
VAULT="$RUN/clients/map/US_Cold_Notes"
printf '%s\n' "$VAULT" > "$RUN/home/.config/vault-skills/vault-path"
export OBSIDIAN_VAULT="$VAULT"

# scratch-tool: a repo with a dossier (scenarios D and N)
mkdir -p "$RUN/clients/scratch-tool/scripts" && cd "$RUN/clients/scratch-tool" && git init -q
cat > scripts/import.sh <<'SH'
#!/usr/bin/env bash
# Imports appointments for one warehouse into a PFD environment.
set -euo pipefail
env="${1:?env}"; warehouse="${2:?warehouse}"
curl -sf -X POST "https://${env}-appointments-svc.example.test/migration/appointments?warehouseSysid=${warehouse}"
SH
git add -A && git -c user.name=t -c user.email=t@t commit -qm "init" && cd - >/dev/null
cat > "$VAULT/Repos/scratch-tool.md" <<'MD'
---
type: repo
client: uscold
org: uscold
language: bash
status: cloned
owners: []
created: 2026-09-16
---

## Purpose

Throwaway import helper used for work-chart testing.
MD
git -C "$RUN/clients/map" add -A && git -C "$RUN/clients/map" -c user.name=t -c user.email=t@t commit -qm dossier

# appt-svc: a sibling repo with no dossier (scenario V)
mkdir -p "$RUN/clients/appt-svc/config" && cd "$RUN/clients/appt-svc" && git init -q
printf 'SLOT_MINUTES=30\nMAX_SLOTS_PER_DOOR=16\n' > config/slots.env
git add -A && git -c user.name=t -c user.email=t@t commit -qm "init" && cd - >/dev/null

# plugin copy whose stamp script notes every call in $RUN/stamp-calls.log
mkdir -p "$RUN/plugin"
cp -R "$CHECKOUT/hooks" "$CHECKOUT/skills" "$RUN/plugin/"
mv "$RUN/plugin/hooks/work-chart-stamp.sh" "$RUN/plugin/hooks/work-chart-stamp-real.sh"
cat > "$RUN/plugin/hooks/work-chart-stamp.sh" <<SH
#!/usr/bin/env bash
# Scenario wrapper: note each call's argument count and arguments, then run the real script.
printf '%s\n' "\$# \$*" >> "$RUN/stamp-calls.log"
exec bash "\$(dirname "\$0")/work-chart-stamp-real.sh" "\$@"
SH
chmod +x "$RUN/plugin/hooks/work-chart-stamp.sh"
echo "vault at $VAULT"
```

### Preamble for every rep

The rep's whole first prompt is these lines, with the paths filled in, then the scenario prompt.

```
OBSIDIAN_VAULT is set to <VAULT>. HOME for this task is <RUN>/home; use it for anything under ~/.config. The consultant-vault plugin is installed. Set OBSIDIAN_VAULT=<VAULT> in every shell command you run that touches the vault, and treat that folder as the vault for everything. You are working from the folder <VAULT>.
Read and follow <RUN>/plugin/skills/work-chart/SKILL.md when it applies; the plugin root for its hook scripts is <RUN>/plugin.
```

### Prompt D (research, dead end)

```
IMPORTANT: This is a real scenario. Act.

For PFD-65947: find out whether the appointments import endpoint that
<RUN>/clients/scratch-tool/scripts/import.sh calls accepts a batch size parameter. The
service's source code is not on this machine. Don't change any files in the repo. Then stop.
```

### Prompt N (question with no goal)

```
IMPORTANT: This is a real scenario. Act.

Quick one: what does the `set -euo pipefail` line in
<RUN>/clients/scratch-tool/scripts/import.sh do?
```

### Prompt V (vault-started session, sibling repo with no dossier)

```
IMPORTANT: This is a real scenario. Act.

For PFD-65947: in the appt-svc repo next to my notes repo (<RUN>/clients/appt-svc), change the
appointment slot length in config/slots.env from 30 to 15 minutes. Don't commit. Then stop.
```

### Scripted hook message

When the rep stops the first time, resume it with the message below. It stands in for the Stop
hook, which does not run inside a rep. `<HH:MM>` is the time the rep was sent out.

| Scenario | Message |
|---|---|
| D | `Stop hook feedback: Work since <HH:MM> not yet in the work chart: research calls: 6. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` |
| N | `Stop hook feedback: Work since <HH:MM> not yet in the work chart: research calls: 5. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` |
| V | `Stop hook feedback: Work since <HH:MM> not yet in the work chart: repos with changes: appt-svc (<RUN>/clients/appt-svc); research calls: 2. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` |

Any other question from the rep: reply `go ahead`.

### Scoring

```bash
git -C "$RUN/clients/map" status --porcelain      # every vault file the rep touched
git -C "$RUN/clients/appt-svc" diff --stat
git -C "$RUN/clients/scratch-tool" status --porcelain
cat "$RUN/stamp-calls.log"                          # one line per stamp call: "<arg count> <args>"
```

Open every changed or new vault file. Checks marked "reply" are scored from the rep's final
message after the hook message.

### Observable checks, scenario D

| # | Check | Predicted baseline |
|---|---|---|
| D1 | `Work/PFD-65947 Work <today>.md` exists with `type: work` and at least one row | partial |
| D2 | The research row's `what` opens with a plain verb (Researched, Traced, Checked, Compared …) and ends with the outcome; it is not "Read … nothing changed" | fail |
| D3 | That row's `decided` says why the work stopped (such as "dropped: service source not available"), not "none" | fail |
| D4 | `stamp-calls.log` has at least one line | partial |
| D5 | Reply: the last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | partial |
| D6 | The words session, ledger, hook, stamp, controller do not appear in the work note | pass |
| D7 | `scratch-tool` has no changes | pass |

### Observable checks, scenario N

| # | Check | Predicted baseline |
|---|---|---|
| N1 | No file under `Work/`, and today's daily note is unchanged | partial |
| N2 | `stamp-calls.log` has a line starting `0 ` (the stamp script ran with no arguments) | fail |
| N3 | Reply: no offer to log the answer | partial |

### Observable checks, scenario V

| # | Check | Predicted baseline |
|---|---|---|
| V1 | `config/slots.env` says `SLOT_MINUTES=15`, uncommitted | pass |
| V2 | A work note for PFD-65947 today lists `"[[appt-svc]]"` in `repos` | fail |
| V3 | Reply: a line above the Work line suggests a dossier note for `appt-svc` | fail |
| V4 | No `Repos/appt-svc.md` was created | pass |
| V5 | `stamp-calls.log` has a line naming `<RUN>/clients/appt-svc` or a path inside it | partial |
| V6 | Reply: the last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | partial |

### Rationalizations captured, activity-log scenarios

Fill during the RED reps: the rep, its exact words, and the check they excuse.

| Rep | Verbatim | Check it excuses |
|---|---|---|
`````

- [ ] **Step 2: Check the fixture block builds**

Build the fixture once, with `CHECKOUT` set to this checkout, and then remove it:

```bash
export SCRATCH=<session scratchpad>
awk '/^## Activity-log scenarios/{s=1} s && /^```bash$/{f=1; next} f && /^```$/{exit} f' docs/superpowers/baselines/work-chart.md \
  | sed "s#^CHECKOUT=.*#CHECKOUT=$(pwd)#" > "$SCRATCH/al-fixture.sh"
bash -e "$SCRATCH/al-fixture.sh"
R=$(ls -d "$SCRATCH"/work-chart-al-* | tail -1)
git -C "$R/clients/map" log --oneline | wc -l          # 2
ls "$R/plugin/hooks"                                   # includes work-chart-stamp-real.sh
HOME="$R/home" "$R/plugin/hooks/work-chart-stamp.sh"; cat "$R/stamp-calls.log"   # "0 "
rm -rf "$R"
```

- [ ] **Step 3: Run three RED reps per scenario, nine in total**

For each rep, build a fresh fixture. The RED variant is the skill before this change, and at this point in the branch the checkout still holds it. Send out one `general-purpose` agent whose entire prompt is the preamble with the paths filled in, followed by the scenario prompt with `<RUN>` filled in. Note the time it was sent. When the rep stops, resume it (SendMessage to the same agent) with that scenario's scripted hook message, using the time you noted. Do not mention the checks or the expected shape.

- [ ] **Step 4: Score every rep**

Run the scoring block for each rep and open every changed vault file. Score D5, N3, V3 and V6 from the rep's final message.

- [ ] **Step 5: Write the results doc**

Create `docs/superpowers/baselines/results/work-chart-activity-log-<date>.md`, in the same shape as `results/work-chart-2026-09-10.md`: a header paragraph on how the reps ran, one section per scenario with a `Check | Result | Notes` table and `n/3` per row, a Verbatim section, and a "Checks the control already passes" list. Copy every verbatim line into the new rationalizations table in `work-chart.md`.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/baselines/work-chart.md docs/superpowers/baselines/results/work-chart-activity-log-*.md
git commit -m "work-chart: activity-log scenarios and RED run

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Skill changes and the GREEN run

**Files:**
- Modify: `skills/work-chart/SKILL.md` (whole file replaced)
- Modify: `docs/superpowers/baselines/results/work-chart-activity-log-<date>.md` (GREEN sections)

**Interfaces:**
- Consumes: the RED results and verbatims from Task 5; `hooks/work-chart-stamp.sh` from Task 3; the block reason text from Task 4.
- Produces: a skill that writes rows for work with no code change and for dead ends, skips rows for no-goal questions but still runs the stamp script, lists repos with no dossier in `repos` and suggests a dossier once a day, runs the stamp script with every repo named, and asks for `work_roots` in Setup.

Follow `mattpocock-skills:writing-for-agents`. State the target behaviour positively, keep one source of truth per rule, and make sure every step ends on a checkable criterion.

- [ ] **Step 1: Write `skills/work-chart/SKILL.md`**

Start from this text. Before saving, add a Common-mistakes row for every RED verbatim that is not already covered. Then delete any new instruction whose check the RED run passed 3/3.

````markdown
---
name: work-chart
description: Keep a plain-language record of goal-directed work as it happens, one note per ticket or topic per day: what was done, why, and what was decided. That covers code changes in any repo, research, coordination, design, and dead ends. Use whenever work toward a goal finished or was dropped in this session: a task finished, tests ran, a commit was made, or a question was researched; whenever a Stop hook reports "not yet in the work chart"; whenever the user asks "what did you just do", "why did you change X", or "explain that diff"; and when the user says "set up the work chart". Work nobody wrote down is work the developer cannot explain tomorrow.
---

# Work chart

Follow the obsidian-vault skill's conventions. One note per ticket per day in `folders.work`. No `work` key in `Meta/Config.md`: the folder is `Work` — create it and write the rows there now. The rows never wait for an answer; ask about the config key in one line above the Work line, which is still the last line of the reply. Filename `KEY Work YYYY-MM-DD.md`. No ticket: `Work - <topic> YYYY-MM-DD.md`, with a short plain topic ("pallet weight units"); later work toward the same goal that day goes in the same note. Template: vault templates folder first, else this skill's `templates/Work.md`.

## When rows get written

- A task finished, tests ran, a commit was made, a question was researched to an answer or to a dead end, or the user changed subject: write rows for everything since the last row.
- A plan task completed under subagent-driven development: the controller writes the rows from the subagent's reports. Subagents never write this note.
- The Stop hook said "… not yet in the work chart": write the rows, run the stamp script, then print the Work line. The message names repos with changes, files outside git, and counts of research calls and outward calls (outward: something other people see, such as a Jira comment or a sent email). A named repo changed on disk, not necessarily in this conversation: a change made by hand, in an editor, or before this session started gets its row too. Reason not known: `why` says "not stated", and one line above the Work line asks for it.
- The hook asked, but nothing since the last row had a goal behind it — a plain question, answered: write no row, and run the stamp script with no arguments so the hook goes quiet.

Write the rows; do not offer to write them.

## One row per stretch

Frontmatter per the property schema: `type: work`, `jira` with the ticket first (empty with no ticket), `date`, `repos` as quoted wikilinks for every repo touched, with or without a dossier note (`"[[phenix.appointments]]"`), `areas` as plain words for the parts touched ("migration loader", "appointment details API", "Jira triage"), `changes` equal to the row count.

First line under the title: one sentence saying what the day's work on this ticket or topic was about. Rewrite it as rows are added.

One table: `when | what | why | decided`.

- One row per goal-directed stretch, concluded or dropped: a fix, a refactor, a plan task, a piece of research, a question put to someone, a design. Not per turn, per file, or per commit. Two changes with different reasons are two rows even in one edit — the code change and the doc line that announces it each get their own `why`.
- `what` for a code change: the repo and path of what changed, and the commit when there is one. A file in no repo: its `~`-shortened path, such as `~/Code/StrideClients/UsCold/scratch/pallet-query.sql`; it adds nothing to `repos`.
- `what` for work that changed no code: open with a plain verb — Researched, Compared, Drafted, Asked, Designed, Traced — and end with the outcome.
  - "Researched Flyway baseline options in the vendor docs; found `baselineOnMigrate` covers it."
  - "Traced where `palletCount` is set in USCS-BE; dead end, the value comes from a stored procedure nobody can read."
  - "Asked the product owner in PFD-65947 which weight units to show; waiting."
  - "Designed the multi-repo work-chart hook; spec agreed."
- `why`: one sentence in the reader's words. The reason, not the ticket key.
- `decided`: the call and its reason, or "none". A stretch that stopped says why it stopped: "dropped: no access to the database". A call that constrains future work or a reviewer would question also becomes a `proposed` decision note through the decisions skill; the cell links it.
- Everyday words. The words session, ledger, hook, stamp, and controller do not appear in the note.

After writing: update the first line, `changes`, `areas`, `repos`. Daily note: `- HH:MM work on [[KEY Work YYYY-MM-DD]]: N changes`, once per work note per day, then edit the count in place; add the key to the daily note's `jira` list. Then, in order:

1. Dossier line. For each repo in the new rows that has no note in `folders.repos`, and that no earlier work note from today already lists: one line above the Work line suggests one — "`phenix.appointments` has no dossier note yet; say "dossier phenix.appointments" to start one." Suggest; do not create it.
2. Stamp. From the plugin root, which is two directories above this skill's folder, run `hooks/work-chart-stamp.sh` with the path of every repo named in the new rows and every repo the hook message named: `hooks/work-chart-stamp.sh ~/Code/StrideClients/UsCold/phenix.appointments`. No repos: run `hooks/work-chart-stamp.sh` with no arguments.
3. End the reply with the Work line:

`Work: <N> changes today on <KEY or topic>; last: <newest row's what, first clause>`

## Answering "what did you just do"

What, why, where to read more; at least three lines. Cite the work note as a wikilink — `[[PFD-65947 Work 2026-09-10]]`, not a file path — so the reader can open it. No rows yet: write them first, then answer. A read-back changes no file.

## Setup

"Set up the work chart", or a first write with no `folders.work` key. Setup creates the place the rows live; it is not a chart over notes that already exist.

1. Create `<folders.work>`, or `Work` when the key is missing.
2. Copy this skill's `templates/Work.base` into it as `Work.base` unless one exists.
3. Create `~/.config/vault-skills/work-stamp/`.
4. Ask the user to confirm `work: Work` under `folders` in `Meta/Config.md`; edit it only on their yes. Steps 1-3 do not wait for that answer.
5. No `work_roots` list in `Meta/Config.md`: ask to add one, in the same question as step 4 when both are missing. Suggest the folder above the vault's git repo top: `git -C <vault> rev-parse --show-toplevel`, then its parent. For a vault at `~/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes` that is `~/Code/StrideClients/UsCold`. Edit it only on their yes. Vault in no git repo: suggest nothing, and say only the vault folder counts.
6. Say in one line whether each hook is present in the plugin's `hooks/hooks.json` at the plugin root: `PostToolUse` (notes work as it happens) and `Stop` (asks for rows). Either one absent: rows are written at pauses only.

The hooks count work only inside a `work_roots` folder, or inside the vault folder when the list is missing; say so when the user works somewhere else.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| One row per file | The reader wants "added the migration", not six paths |
| `why` restates the ticket | The key is in the frontmatter; the reason is what the diff cannot give back |
| "decided: none" on a call a reviewer would question | The handoff's rulings section and the decisions folder both miss it |
| Rows only at the end of the session | The rows should exist before the developer asks, not after |
| Offering instead of writing — "tell me if you want this logged there" | Nothing gets recorded, and the reasoning is gone by the next turn |
| A daybook line instead of a work note | The daily note is the spine; the rows live in the work note it links |
| Skipping the stamp | The hook asks for the same rows again at the next stop |
| Deciding no row is needed, then skipping the stamp | The hook asks again at the next stop |
| Skipping a dead end | The day's record hides effort that was spent, and the next person repeats it |
| Writing a row for a question with no goal | The chart fills with noise nobody will read |
| Leaving a repo with no dossier out of `repos` | The By repo view misses the work |
| A subagent writing its own rows | Two writers, one note; the controller has the reports and the diff |
| A last line like "worth a `chmod +x` if it's meant to be run directly" | Caveats go above the Work line, which goes last |
| Citing the note as a path — "from `vault/Work/PFD-65947 Work 2026-09-10.md`" | Nothing to click; `[[PFD-65947 Work 2026-09-10]]` opens it |
| "I read it as 'a chart of my work' and built the Bases dashboard" | A chart at the vault root over notes nobody has written yet; Setup comes first |
| "The term appears nowhere in the vault … so I inferred it from state" | Half-finished files in the vault are not the request; Setup is |
| Guessing, then offering a redo — "say so and I'll redo it" | One question before building beats one rebuild after |
| Adding `work: Work` or `work_roots` to `Meta/Config.md` before the user says yes | It is the user's config; steps 4 and 5 ask, then edit |
| "Blocked — one question before I write the work-chart rows … `Meta/Config.md` has no `folders.work` key" | The key names the folder; it does not gate the rows. `Work` is the default until the user picks another |
| Holding the folder, the base and the stamp folder for the same yes | Only the config lines are the user's to approve; the rest is this skill's own scaffolding |
| One row for the whole task — "`scripts/import.sh` and `README.md` — added a `--dry-run` flag …, and put the flag in the README usage line" | Two reasons, two rows; `changes` and the Work line both count what the reader will look for |
| A last line like "Want me to add `work: Work` under `folders`?" | The config question is a caveat; every caveat sits above the Work line |
| "This change was already there before this session started — I didn't make it, so I won't log it" | The rows record the repo, not the conversation; write what changed, put "not stated" in `why`, and ask for the reason in one line above the Work line |
````

- [ ] **Step 2: Check it**

```bash
sed -n 3p skills/work-chart/SKILL.md | wc -c                          # under 1024 (about 665)
grep -c 'Files changed since' skills/work-chart/SKILL.md              # 0
grep -c 'nothing changed' skills/work-chart/SKILL.md                  # 0
grep -c 'not yet in the work chart' skills/work-chart/SKILL.md        # 2
grep -c 'work_roots' skills/work-chart/SKILL.md                       # 3 or more
claude plugin validate .
```

- [ ] **Step 3: Run three GREEN reps per scenario**

These are the same as Task 5 steps 3 and 4. Each fixture copies the checkout, so the reps now read the new `SKILL.md`. Add `## GREEN, scenario D`, `## GREEN, scenario N` and `## GREEN, scenario V` to the results doc.

- [ ] **Step 4: Refactor, one edit per failing check**

For every check under 3/3, quote the rep's exact words in the results doc and make one targeted edit to `SKILL.md`. Then re-run that scenario's three reps and score them again. Stop when every check is 3/3, or when the results doc says why a check is dropped. Cap: three rounds.

- [ ] **Step 5: Commit**

```bash
git add skills/work-chart/SKILL.md docs/superpowers/baselines/results/work-chart-activity-log-*.md docs/superpowers/baselines/work-chart.md
git commit -m "work-chart: rows for research and dead ends, repos without dossiers, work_roots setup

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Config template, vault-init, README, daily-worklog, idea note

**Files:**
- Modify: `skills/obsidian-vault/templates/Config.md` (frontmatter; explanation list)
- Modify: `skills/vault-init/SKILL.md` (interview item 5)
- Modify: `README.md` (skills table row; Hooks paragraph)
- Modify: `skills/daily-worklog/SKILL.md` (one Classify row)
- Modify, and add to git: `docs/ideas/2026-09-15-work-chart-hook-multi-repo.md` (currently untracked)

**Interfaces:**
- Consumes: the `work_roots` contract (Task 1), the two hooks (Tasks 2 and 4), and the new `what` rule (Task 6).
- Produces: documentation that matches the hooks and the skill.

- [ ] **Step 1: Config template**

In `skills/obsidian-vault/templates/Config.md`, add this line directly after `worklog_routing: []`, which is the last line before the closing `---`:

```yaml
work_roots: []
```

In the explanation list, add this directly after the `folders.work` bullet:

```markdown
- `work_roots` — the folders whose work goes in the work chart, one per line under the key (`  - ~/Code/StrideClients/UsCold`); a leading `~` is your home folder. Work in any repo or file inside one of them counts, wherever Claude Code was started. Empty: only the vault folder counts. Setup suggests the folder that holds the vault's repo and the client repos beside it.
```

- [ ] **Step 2: vault-init**

In `skills/vault-init/SKILL.md`, add this item directly after item 4 in section 2 ("Folder names …"):

```markdown
5. **Work roots** — the folders whose work the work chart records. Suggest the folder above the vault's git repo top (`git -C <vault> rev-parse --show-toplevel`, then its parent). For a vault at `~/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes` that is `~/Code/StrideClients/UsCold`. Write the answer as a list under `work_roots`. The vault is in no git repo, or the user declines: leave `work_roots: []`, and say only the vault folder counts.
```

- [ ] **Step 3: README**

Replace the `work-chart` row of the skills table with:

```markdown
| `work-chart` | One plain-language work note per ticket or topic per day: what was done, why, what was decided — code in any client repo, research, and dead ends. A Base over them, a `Work:` line after each batch of rows, and two hooks that note work as it happens and ask for rows when there is something to record. |
```

Replace the paragraph under `## Hooks` with:

```markdown
The plugin ships two hooks for work-chart. `hooks/work-chart-log.sh` runs after every tool call. When the call is work, it adds one line to a per-session activity log under `~/.config/vault-skills/work-log/`, marking it as an edit, an outward call (a Jira comment, a sent email), a research call, or a shell command. It records no file contents, command text or tool output, and it never prints. `hooks/work-chart-stop.sh` runs at the end of a turn. It reads the log since the last rows and asks Claude to write rows when it finds an edit, an outward call, five or more research and shell calls, or a touched repo whose uncommitted changes differ from the last rows. Both hooks count only work inside the folders listed under `work_roots` in `Meta/Config.md`, or inside the vault folder when that key is missing. Both are silent when no vault is configured. Neither writes to a repo or the vault. The Stop hook deletes activity logs older than 14 days. Tests: `bash hooks/tests/test-work-chart-hook.sh`.
```

- [ ] **Step 4: daily-worklog classify row**

Work-note rows for work with no code change now open with a plain verb instead of "Read … nothing changed", and daily-worklog classifies rows by that shape. In `skills/daily-worklog/SKILL.md`, replace the row

```markdown
| A work-note row starting "Read" and ending "nothing changed"; a trace, a spike, an intake | `research` |
```

with

```markdown
| A work-note row that changed no code — it opens with Researched, Traced, Compared or Designed, or, in older notes, starts "Read" and ends "nothing changed"; a trace, a spike, an intake | `research` |
```

- [ ] **Step 5: Idea note**

The file is untracked in the main checkout. If you are working in a worktree, copy it in first: `cp /Users/deanbetty/Code/consultant-vault-skills/docs/ideas/2026-09-15-work-chart-hook-multi-repo.md docs/ideas/`. Before merging, move the untracked copy in the main checkout aside, or the merge will refuse to overwrite it.

In `docs/ideas/2026-09-15-work-chart-hook-multi-repo.md`, change `status: idea` to `status: done`. Then replace the line

```markdown
Parked here on 2026-09-15. A scratch note, not a plan. Nothing is built yet.
```

with

```markdown
Parked here on 2026-09-15. Done 2026-09-16: designed in [the activity-log spec](../superpowers/specs/2026-09-16-work-chart-activity-log-design.md) and built from [its plan](../superpowers/plans/2026-09-16-work-chart-activity-log.md).
```

- [ ] **Step 6: Check**

```bash
grep -c '^work_roots: \[\]$' skills/obsidian-vault/templates/Config.md   # 1
grep -c 'Work roots' skills/vault-init/SKILL.md                           # 1
grep -c 'work-chart-log.sh' README.md                                     # 1
grep -c 'Stop hook, `hooks/work-chart-stop.sh`' README.md                 # 0
grep -c 'Researched, Traced' skills/daily-worklog/SKILL.md                # 1
grep -c '^status: done$' docs/ideas/2026-09-15-work-chart-hook-multi-repo.md   # 1
claude plugin validate .
bash hooks/tests/test-work-chart-hook.sh | tail -1                        # passed 56, failed 0
```

- [ ] **Step 7: Commit**

```bash
git add skills/obsidian-vault/templates/Config.md skills/vault-init/SKILL.md README.md skills/daily-worklog/SKILL.md docs/ideas/2026-09-15-work-chart-hook-multi-repo.md
git commit -m "Document work_roots and the two work-chart hooks; close the multi-repo idea

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Live check (the user runs it), then merge

**Files:**
- Modify: `docs/superpowers/baselines/results/work-chart-activity-log-<date>.md` (Live check section)

**Interfaces:**
- Consumes: everything committed on `work-chart-activity-log`.
- Produces: a recorded live result and a branch ready to merge.

The agent cannot run this task. Hooks load only in a fresh Claude Code session with the reinstalled plugin, and the config edit is the user's call. Hand the user these steps and wait.

- [ ] **Step 1 (user): Reinstall the plugin from the branch**

```
/plugin marketplace add /Users/deanbetty/Code/consultant-vault-skills
/plugin install consultant-vault@consultant-vault-skills
```

- [ ] **Step 2 (user): Add the work root**

Add this line to the live vault's `Meta/Config.md`, or say yes when the work-chart setup asks:

```yaml
work_roots:
  - ~/Code/StrideClients/UsCold
```

- [ ] **Step 3 (user): One session, one change**

1. Start a fresh session in `~/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes`.
2. Ask for a one-line change in `~/Code/StrideClients/UsCold/phenix.appointments`, such as a comment in a file nobody will commit, and end the turn.
3. It passes when the hook fires once, naming `phenix.appointments`, and a work note gains a row with `"[[phenix.appointments]]"` in `repos`. A dossier line appears if the repo has no dossier, the stamp script runs with that repo's path, and the reply ends with the `Work:` line.
4. Ask a plain question in the same session. It passes when the hook stays silent.
5. Check the log: `ls ~/.config/vault-skills/work-log/` shows one `.tsv` for the session, and `tail ~/.config/vault-skills/work-log/*.tsv` shows an `edit` line followed by a `MARK`.
6. Undo the test change in `phenix.appointments`, then run `hooks/work-chart-stamp.sh ~/Code/StrideClients/UsCold/phenix.appointments` from the plugin root.

- [ ] **Step 4: Record the result**

Add a `## Live check` section to the results doc with the date, each step, and its outcome. A failure goes through superpowers:systematic-debugging, and the fix returns to the task that owns the script, with a failing test first.

- [ ] **Step 5: Commit and hand the branch back**

```bash
git add docs/superpowers/baselines/results/work-chart-activity-log-*.md
git commit -m "work-chart: live check of the activity-log hooks

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git log --oneline main..work-chart-activity-log
```

Then use superpowers:finishing-a-development-branch to choose between merging to `main` and opening a pull request.

---

## Spec coverage

| Spec section | Task |
|---|---|
| Goal, Why, Terms | Architecture above; all tasks |
| Decision: what counts as a row (dead ends, no-goal Q&A) | 6 |
| Decision: approach A, activity log | 2, 4 |
| Decision: threshold (edit, outward, 5 research+shell, fingerprint) | 4 |
| Decision and Contract: `work_roots`, `~`, missing → vault | 1 (`wc_roots`), 6 (Setup), 7 (template, vault-init) |
| Decision: dossier gate removed | 4 (test "sibling repo with no dossier") |
| Decision: vault edits skipped, vault left out of fingerprint | 1 (`wc_fingerprint`), 2 (vault-edit skip) |
| Known gap (hand edits in untouched repos) | Not built, by design; README and the skill say work counts only when touched |
| Contract: `hooks/hooks.json` | 2 |
| Contract: activity log file, fields, no contents | 2 |
| `work-chart-log.sh` steps 1–8 and rules (exit 0, silent, <50 ms, jq/sed, "under") | 2 |
| `work-chart-stop.sh` steps 1–8, reason text, never writes, exit 0 | 4 |
| `work-chart-stamp.sh` (many, none, bad path → stderr, exit 1) | 3 |
| `work-chart-lib.sh` functions; `wc_repos_folder` decision (removed) | 1, 2, 4 |
| Skill changes (row, `what`, dead ends, files outside git, no dossier, no ticket, stamp step, Setup, Common mistakes) | 6 |
| Failure cases: no vault / out of roots | 2, 4 tests |
| Failure cases: unwritable log folder, bad JSON | 2 test "never prints" |
| Failure cases: no `jq` | 2 and 4 tests with `WC_NO_JQ=1` |
| Failure cases: subagent calls in the same log | 6 (skill rule, unchanged) |
| Failure cases: long session, lines after last MARK | 4 test "only lines after the last MARK count" |
| Failure cases: pre-session changes, no stamp | 4 (fingerprint rule), 6 ("not stated") |
| Failure cases: old stamp for the vault's repo asks once | 1 (fingerprint changes shape only for the repo holding the vault) |
| Failure cases: `git -C ../other` logged against `cwd` | 2 (place is `cwd`'s repo) |
| Repo changes 1–9 | 1–7 (daily-worklog row added in 7, outside the spec's list) |
| Shell tests 1–5, 14, 15 | 2 |
| Shell tests 6–13, 16, 17 | 4 (11 also in 1) |
| Skill scenarios D, N, V | 5, 6 |
| Live check | 8 |
