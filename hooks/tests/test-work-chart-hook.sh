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

logcall ctab Edit "$VAULT" "{\"file_path\":\"$SIB/a\tb.txt\"}"
check "log: a tab in the path still yields four fields" "yes" "$(awk -F'\t' 'NF != 4 {bad=1} END {print bad ? "no" : "yes"}' "$(logfile ctab)")"

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

logcall c10 Bash "$SIB" '{"command":"git add hooks/work-chart-stamp.sh"}'
logcall c10 Bash "$SIB" '{"command":"grep -n x hooks/work-chart-stamp.sh"}'
logcall c10 Bash "$SIB" '{"command":"hooks/work-chart-stamp.sh /r"}'
logcall c10 Bash "$SIB" "{\"command\":\"bash \\\"/p/hooks/work-chart-stamp.sh\\\" /r\"}"
logcall c10 Bash "$SIB" '{"command":"cd /p && bash hooks/work-chart-stamp.sh /r"}'
logcall c10 Bash "$SIB" "{\"command\":\"sh '/p/work-chart-stamp.sh'\"}"
check "log: MARK only when the command runs the stamp script, not merely mentions it" "shell:Bash:$SIB | shell:Bash:$SIB | MARK:Bash: | MARK:Bash: | MARK:Bash: | MARK:Bash:" "$(logged c10)"

WC_NO_JQ=1 logcall c11 Bash "$SIB" '{"command":"git add hooks/work-chart-stamp.sh"}'
WC_NO_JQ=1 logcall c11 Bash "$SIB" '{"command":"grep -n x hooks/work-chart-stamp.sh"}'
WC_NO_JQ=1 logcall c11 Bash "$SIB" '{"command":"hooks/work-chart-stamp.sh /r"}'
WC_NO_JQ=1 logcall c11 Bash "$SIB" "{\"command\":\"bash \\\"/p/hooks/work-chart-stamp.sh\\\" /r\"}"
WC_NO_JQ=1 logcall c11 Bash "$SIB" '{"command":"cd /p && bash hooks/work-chart-stamp.sh /r"}'
WC_NO_JQ=1 logcall c11 Bash "$SIB" "{\"command\":\"sh '/p/work-chart-stamp.sh'\"}"
check "log: sed fallback, MARK only when the command runs the stamp script" "shell:Bash:$SIB | shell:Bash:$SIB | MARK:Bash: | MARK:Bash: | MARK:Bash: | MARK:Bash:" "$(logged c11)"

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
