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
