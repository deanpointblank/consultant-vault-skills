#!/usr/bin/env bash
# Records the current fingerprint of each repo given, so the Stop hook stays quiet until
# something else changes there. Run by the work-chart skill after it writes rows.
# Usage: work-chart-stamp.sh [path inside a repo ...]
# No paths is fine: it does nothing and exits 0 (the log hook sees the call and marks the log).
# A path in no git repo: a message on stderr, the rest still stamped, exit 1 at the end.
set -u
export GIT_OPTIONAL_LOCKS=0
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
