#!/usr/bin/env bash
# Shell tests for record-testing-clip.sh. Run: bash scripts/tests/test-record-testing-clip.sh
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
CLIP="$(cd "$HERE/.." && pwd)/record-testing-clip.sh"
pass=0; fail=0
ok()  { pass=$((pass+1)); echo "ok   - $1"; }
bad() { fail=$((fail+1)); echo "FAIL - $1"; }
check() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected [$2], got [$3])"; fi; }

if ! command -v ffmpeg >/dev/null 2>&1; then echo "skipped, no ffmpeg"; exit 0; fi

T=$(mktemp -d)
IN="$T/PFD-1 walk pfd-1 2026-09-10.webm"
ffmpeg -v error -y -f lavfi -i "testsrc=duration=10:size=320x240:rate=10" -c:v libvpx -b:v 300k "$IN"
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1" | cut -d. -f1; }
check "fixture is 10 s" "10" "$(dur "$IN")"

# 1. happy path: login 0-2 cut; two AC clips
OUT="$T/out1"; mkdir -p "$OUT"
printf 'login 0 2\nAC1 3 5\nAC2 6 9\n' > "$T/m1"
listing=$(bash "$CLIP" "$IN" "$OUT" "$T/m1"); rc=$?
check "happy path exit 0" "0" "$rc"
check "trimmed webm written" "yes" "$([ -s "$OUT/PFD-1 walk pfd-1 2026-09-10.webm" ] && echo yes || echo no)"
check "trimmed webm is about 8 s" "8" "$(dur "$OUT/PFD-1 walk pfd-1 2026-09-10.webm")"
check "AC1 gif written" "yes" "$([ -s "$OUT/PFD-1 walk pfd-1 2026-09-10 AC1.gif" ] && echo yes || echo no)"
check "AC2 gif written" "yes" "$([ -s "$OUT/PFD-1 walk pfd-1 2026-09-10 AC2.gif" ] && echo yes || echo no)"
check "gif width is 320 (never upscaled past source)" "320" "$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT/PFD-1 walk pfd-1 2026-09-10 AC1.gif")"
check "listing has three lines" "3" "$(printf '%s\n' "$listing" | grep -c .)"

# 2. no login range: trimmed webm keeps full length
OUT="$T/out2"; mkdir -p "$OUT"; printf 'AC1 1 4\n' > "$T/m2"
bash "$CLIP" "$IN" "$OUT" "$T/m2" >/dev/null; check "no-login exit 0" "0" "$?"
check "no-login webm keeps 10 s" "10" "$(dur "$OUT/PFD-1 walk pfd-1 2026-09-10.webm")"

# 3. missing input
err=$(bash "$CLIP" "$T/nope.webm" "$T/out3" "$T/m2" 2>&1 >/dev/null); rc=$?
check "missing input exit 1" "1" "$rc"; check "missing input one stderr line" "1" "$(printf '%s\n' "$err" | grep -c .)"

# 4. range past the end
printf 'AC1 8 14\n' > "$T/m4"; mkdir -p "$T/out4"
bash "$CLIP" "$IN" "$T/out4" "$T/m4" 2>/dev/null >/dev/null; check "range past end exit 1" "1" "$?"

# 5. AC overlapping login
printf 'login 0 4\nAC1 3 6\n' > "$T/m5"; mkdir -p "$T/out5"
bash "$CLIP" "$IN" "$T/out5" "$T/m5" 2>/dev/null >/dev/null; check "AC overlapping login exit 1" "1" "$?"
check "nothing written on overlap" "0" "$(ls "$T/out5" | wc -l | tr -d ' ')"

# 6. ffmpeg missing
mkdir -p "$T/out6"
PATH="/nonexistent" /bin/bash "$CLIP" "$IN" "$T/out6" "$T/m2" 2>/dev/null >/dev/null; check "no ffmpeg exit 1" "1" "$?"

echo "passed $pass, failed $fail"
rm -rf "$T"
[ "$fail" -eq 0 ]
