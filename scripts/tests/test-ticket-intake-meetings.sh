#!/usr/bin/env bash
# Shell tests for ticket-intake-meetings.sh. Run: bash scripts/tests/test-ticket-intake-meetings.sh
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
SCRIPT="$(cd "$HERE/.." && pwd)/ticket-intake-meetings.sh"
pass=0; fail=0
ok()  { pass=$((pass+1)); echo "ok   - $1"; }
bad() { fail=$((fail+1)); echo "FAIL - $1"; }
check() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected [$2], got [$3])"; fi; }

T=$(mktemp -d)
V="$T/vault"; mkdir -p "$V/Meta" "$V/Meetings"
printf -- '---\ntype: config\nfolders:\n  daily: Daily\n  meetings: Meetings\n---\n' > "$V/Meta/Config.md"
cat > "$V/Meetings/2026-09-04 Dock and door assignment with Josh.md" <<'MD'
---
type: meeting
topics:
  - docks and doors
---

# Dock and door assignment

**Receipt linking and other tickets.** PFD-66325 should be completed first. The dispatch info view ticket is front-end only; three follow-on tickets handle the recalculation logic (cases, pallets). QA note: the tester flags accessibility issues.
MD
cat > "$V/Meetings/2026-07-15 Pairing Time.md" <<'MD'
---
type: meeting
---

# Pairing

Rob asked whether Dispatch totals come from V1. Nobody knew.
MD
cat > "$V/Meetings/2026-08-01 Standup.md" <<'MD'
---
type: meeting
---

# Standup

Nothing about the subject here.
MD

# 1. usage
bash "$SCRIPT" "$V" 2>"$T/e1" >/dev/null; check "no nouns exit 2" "2" "$?"
check "no nouns one stderr line" "1" "$(grep -c . "$T/e1")"

# 2. missing vault
bash "$SCRIPT" "$T/nope" dispatch 2>"$T/e2" >/dev/null; check "missing vault exit 1" "1" "$?"
check "missing vault one stderr line" "1" "$(grep -c . "$T/e2")"

# 3. one noun, two notes, case-insensitive, sorted by note name
out=$(bash "$SCRIPT" "$V" dispatch); rc=$?
check "hit exit 0" "0" "$rc"
check "two hit lines" "2" "$(printf '%s\n' "$out" | grep -c .)"
check "first hit is the July note" "yes" "$(printf '%s\n' "$out" | head -1 | grep -q '^- \[\[2026-07-15 Pairing Time\]\]' && echo yes || echo no)"
check "hit quotes only the matching sentence" 'The dispatch info view ticket is front-end only; three follow-on tickets handle the recalculation logic (cases, pallets).' "$(printf '%s\n' "$out" | sed -n 2p | sed 's/^- \[\[[^]]*\]\]: "\(.*\)" (.*)$/\1/')"
check "hit names the noun that matched" "(dispatch)" "$(printf '%s\n' "$out" | sed -n 2p | grep -o '([a-z, ]*)$')"
check "no line for the unmatched note" "0" "$(printf '%s\n' "$out" | grep -c 'Standup')"
check "unrelated sentence not quoted" "0" "$(printf '%s\n' "$out" | grep -c 'accessibility')"

# 4. two nouns in the same sentence: one line, both nouns listed
out=$(bash "$SCRIPT" "$V" dispatch pallet)
check "same sentence once" "1" "$(printf '%s\n' "$out" | grep -c 'front-end only')"
check "both nouns listed" "(dispatch, pallet)" "$(printf '%s\n' "$out" | grep 'front-end only' | grep -o '([a-z, ]*)$')"

# 5. no hits
out=$(bash "$SCRIPT" "$V" zzzz yyyy); rc=$?
check "no hits exit 0" "0" "$rc"
check "no hits says so" "no meeting note matches: zzzz, yyyy" "$out"

# 6. folders.meetings from config
mkdir -p "$V/Mtgs"; mv "$V/Meetings/2026-07-15 Pairing Time.md" "$V/Mtgs/"
printf -- '---\nfolders:\n  meetings: Mtgs\n---\n' > "$V/Meta/Config.md"
out=$(bash "$SCRIPT" "$V" dispatch)
check "reads folders.meetings" "1" "$(printf '%s\n' "$out" | grep -c 'Pairing Time')"
check "ignores the default folder when config names another" "0" "$(printf '%s\n' "$out" | grep -c 'Dock and door')"

# 7. no config: default Meetings
rm "$V/Meta/Config.md"
out=$(bash "$SCRIPT" "$V" dispatch)
check "no config falls back to Meetings" "1" "$(printf '%s\n' "$out" | grep -c 'Dock and door')"

echo "passed $pass, failed $fail"
rm -rf "$T"
[ "$fail" -eq 0 ]
