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
