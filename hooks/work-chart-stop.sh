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
