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
