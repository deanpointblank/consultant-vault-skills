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

OTHER="$T/other-vault"; mkdir -p "$OTHER"
check "vault: OBSIDIAN_VAULT wins over the pointer file" "$OTHER" "$(OBSIDIAN_VAULT="$OTHER" wc_vault)"
check "vault: pointer file used when OBSIDIAN_VAULT is unset" "$VAULT" "$(wc_vault)"

# runs: $1 = command; prints MARK when wc_runs_stamp says it runs the stamp script, else shell.
runs() { if wc_runs_stamp "$1"; then echo MARK; else echo shell; fi; }
check "runs stamp: quoted first word with a space" MARK "$(runs '"/Users/me/My Plugins/hooks/work-chart-stamp.sh" /r')"
check "runs stamp: bash then single-quoted path with a space" MARK "$(runs "bash '/a b/work-chart-stamp.sh'")"
check "runs stamp: quoted other script with a space, stamp only an argument" shell "$(runs '"/a b/other.sh" work-chart-stamp.sh')"
check "runs stamp: quoted path with a space after cd &&" MARK "$(runs 'cd /p && "/a b/work-chart-stamp.sh"')"
check "runs stamp: unclosed quote is not a run" shell "$(runs '"/a b/work-chart-stamp.sh')"

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

# An edit counts only when its own path is under a root; the session's cwd is not enough.
MEM="$T/claude/projects/p/memory"
logcall c16 Write "$VAULT" "{\"file_path\":\"$MEM/note.md\",\"content\":\"x\"}"
logcall c16 Edit "$SIB" "{\"file_path\":\"$ELSE/a.txt\"}"
logcall c16 Edit "$ELSE" "{\"file_path\":\"a.txt\"}"
check "log: edit outside every root from a cwd inside -> nothing" "" "$(logged c16)"
logcall c16 Edit "$SIB" "{\"file_path\":\"a.txt\"}"
logcall c16 Read "$SIB" "{\"file_path\":\"$ELSE/a.txt\"}"
logcall c16 Edit "$ELSE" "{\"file_path\":\"$SIB/a.txt\"}"
check "log: relative edit resolved against cwd; read outside from inside -> research; edit inside from outside -> edit" "edit:Edit:$SIB/a.txt | research:Read:$ELSE/a.txt | edit:Edit:$SIB/a.txt" "$(logged c16)"
WC_NO_JQ=1 logcall c17 Write "$VAULT" "{\"file_path\":\"$MEM/note.md\",\"content\":\"x\"}"
WC_NO_JQ=1 logcall c17 Edit "$SIB" "{\"file_path\":\"$ELSE/a.txt\"}"
WC_NO_JQ=1 logcall c17 Edit "$ELSE" "{\"file_path\":\"a.txt\"}"
check "log: sed fallback, edit outside every root from a cwd inside -> nothing" "" "$(logged c17)"
WC_NO_JQ=1 logcall c17 Edit "$SIB" "{\"file_path\":\"a.txt\"}"
WC_NO_JQ=1 logcall c17 Read "$SIB" "{\"file_path\":\"$ELSE/a.txt\"}"
WC_NO_JQ=1 logcall c17 Edit "$ELSE" "{\"file_path\":\"$SIB/a.txt\"}"
check "log: sed fallback, relative edit resolved; read outside from inside -> research; edit inside from outside -> edit" "edit:Edit:$SIB/a.txt | research:Read:$ELSE/a.txt | edit:Edit:$SIB/a.txt" "$(logged c17)"

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

# A quoted script path with a space in it.
Q1="{\"command\":\"\\\"/Users/me/My Plugins/hooks/work-chart-stamp.sh\\\" /r\"}"
Q2="{\"command\":\"bash '/a b/work-chart-stamp.sh'\"}"
Q3="{\"command\":\"\\\"/a b/other.sh\\\" work-chart-stamp.sh\"}"
logcall c18 Bash "$SIB" "$Q1"; logcall c18 Bash "$SIB" "$Q2"; logcall c18 Bash "$SIB" "$Q3"
check "log: quoted stamp path with a space -> MARK; quoted other script -> shell" "MARK:Bash: | MARK:Bash: | shell:Bash:$SIB" "$(logged c18)"
WC_NO_JQ=1 logcall c19 Bash "$SIB" "$Q1"; WC_NO_JQ=1 logcall c19 Bash "$SIB" "$Q2"; WC_NO_JQ=1 logcall c19 Bash "$SIB" "$Q3"
check "log: sed fallback, quoted stamp path with a space -> MARK; quoted other script -> shell" "MARK:Bash: | MARK:Bash: | shell:Bash:$SIB" "$(logged c19)"

# A stamp run counts wherever the shell sits: the plugin lives outside every work root.
logcall c12 Bash "$ELSE" '{"command":"/plugins/consultant-vault/hooks/work-chart-stamp.sh /x/sibling"}'
logcall c12 Bash "$ELSE" '{"command":"ls"}'
check "log: stamp call outside every root -> MARK; other calls there -> nothing" "MARK:Bash:" "$(logged c12)"
WC_NO_JQ=1 logcall c13 Bash "$ELSE" '{"command":"/plugins/consultant-vault/hooks/work-chart-stamp.sh /x/sibling"}'
WC_NO_JQ=1 logcall c13 Bash "$ELSE" '{"command":"ls"}'
check "log: sed fallback, stamp call outside every root -> MARK; other calls there -> nothing" "MARK:Bash:" "$(logged c13)"

# Line breaks separate commands, like ; does.
logcall c14 Bash "$SIB" '{"command":"export X=1\ncd /p\n/p/hooks/work-chart-stamp.sh /r"}'
logcall c14 Bash "$SIB" '{"command":"cat /p/hooks/work-chart-stamp.sh\necho hi"}'
check "log: multi-line command runs the stamp -> MARK; only mentions it -> shell" "MARK:Bash: | shell:Bash:$SIB" "$(logged c14)"
WC_NO_JQ=1 logcall c15 Bash "$SIB" '{"command":"export X=1\ncd /p\n/p/hooks/work-chart-stamp.sh /r"}'
WC_NO_JQ=1 logcall c15 Bash "$SIB" '{"command":"cat /p/hooks/work-chart-stamp.sh\necho hi"}'
check "log: sed fallback, multi-line command runs the stamp -> MARK; only mentions it -> shell" "MARK:Bash: | shell:Bash:$SIB" "$(logged c15)"

rm "$HOME/.config/vault-skills/vault-path"
logcall c6 Edit "$SIB" "{\"file_path\":\"$SIB/a.txt\"}"
logcall c6 Bash "$ELSE" '{"command":"/p/hooks/work-chart-stamp.sh /r"}'
check "log: no vault -> nothing, not even a stamp call" "" "$(logged c6)"
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

put bad1 bogus edit Edit "$SIB/a.txt"
result=$(stopcall bad1 "$VAULT" false)
case "$result" in
  '{"decision":"block","reason":"Work since '[0-9][0-9]:[0-9][0-9]' not yet in the work chart: '*)
    ok "stop: malformed first-line time falls back to the current time" ;;
  *)
    bad "stop: malformed first-line time falls back to the current time (got [$result])" ;;
esac
git -C "$SIB" checkout -q -- a.txt

PBASE=1789580000
PLOG=$(logfile perf1)
mkdir -p "$(dirname "$PLOG")"
{
  for ((i=1; i<=500; i++)); do printf '%s\tedit\tEdit\t%s\n' "$((PBASE+i))" "$SIB/a.txt"; done
  for ((i=1; i<=500; i++)); do printf '%s\tedit\tWrite\t%s\n' "$((PBASE+500+i))" "$LOOSE/out.txt"; done
  for ((i=1; i<=500; i++)); do printf '%s\tresearch\tWebFetch\t\n' "$((PBASE+1000+i))"; done
  for ((i=1; i<=500; i++)); do printf '%s\tshell\tBash\t%s\n' "$((PBASE+1500+i))" "$SIB"; done
} > "$PLOG"
TIMEFORMAT=%R
secs=$( { time stopcall perf1 "$VAULT" false > "$T/perf.out"; } 2>&1 )
presult=$(cat "$T/perf.out")
pexpected=$(block "$((PBASE+1))" "$REASON_SIB; files outside git: ~/Code/Client/scratch/out.txt; research calls: 1000")
check "stop: 2000 lines after MARK, reason still correct" "$pexpected" "$presult"
check "stop: 2000 lines after MARK finishes under 1s (took ${secs}s)" "yes" "$(awk -v s="$secs" 'BEGIN{print (s<1)?"yes":"no"}')"

# --- Every run -----------------------------------------------------------------------------

check "both hooks exit 0 in every case above" "" "$(cat "$T/nonzero")"

echo "passed $pass, failed $fail"
rm -rf "$T"
[ "$fail" -eq 0 ]
