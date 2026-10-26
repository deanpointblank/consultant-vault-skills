#!/usr/bin/env bash
# Shell tests for record-testing-overlay.js. Run: bash scripts/tests/test-record-testing-overlay.sh
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
OVL="$(cd "$HERE/.." && pwd)/record-testing-overlay.js"
pass=0; fail=0
ok()  { pass=$((pass+1)); echo "ok   - $1"; }
bad() { fail=$((fail+1)); echo "FAIL - $1"; }
check() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected [$2], got [$3])"; fi; }

if ! command -v playwright-cli >/dev/null 2>&1; then echo "skipped, no playwright-cli"; exit 0; fi

T=$(mktemp -d)
mkdir -p "$T/site" "$T/rec"
S="rt-overlay-$$"
PID=""
cleanup() {
  env -C "$T/rec" playwright-cli -s="$S" close >/dev/null 2>&1
  [ -n "$PID" ] && kill "$PID" 2>/dev/null
  rm -rf "$T"
}
trap cleanup EXIT

cat > "$T/site/a.html" <<'H'
<!doctype html><title>a</title><input id=t><input id=p type=password><button id=b onclick="window.n=(window.n||0)+1">Go</button>
H
echo '<!doctype html><title>b</title><p>page two</p>' > "$T/site/b.html"
echo '<!doctype html><title>c</title><iframe name=f src="b.html"></iframe>' > "$T/site/c.html"

PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("",0));print(s.getsockname()[1])')
( cd "$T/site" && exec python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
disown 2>/dev/null
PID=$!
for _ in $(seq 1 50); do curl -sf "http://localhost:$PORT/a.html" >/dev/null && break; sleep 0.2; done
URL="http://localhost:$PORT"

pw() { env -C "$T/rec" playwright-cli -s="$S" --raw "$@"; }

pw open "$URL/a.html" >/dev/null 2>&1
pw run-code --filename "$OVL" >/dev/null 2>&1; rc=$?
check "overlay run exits 0" "0" "$rc"
check "one caption bar" "1" "$(pw eval "() => document.querySelectorAll('#__rec_cap').length" 2>&1)"
check "nothing takes pointer events" '"none none none"' "$(pw eval "() => ['#__rec_cap','#__rec_dot','#__rec_keys'].map(s => getComputedStyle(document.querySelector(s)).pointerEvents).join(' ')" 2>&1)"
r=$(pw eval "() => { const c = getComputedStyle(document.querySelector('#__rec_cap')); return parseFloat(c.fontSize) >= 32 && c.fontWeight === '700'; }" 2>&1)
check "caption is big and bold" "yes" "$([ "$r" = true ] && echo yes || echo no)"
r=$(pw eval "() => { const d = getComputedStyle(document.querySelector('#__rec_dot')); return d.backgroundColor === 'rgba(0, 0, 0, 0)' && parseFloat(d.width) >= 36; }" 2>&1)
check "cursor ring is hollow" "yes" "$([ "$r" = true ] && echo yes || echo no)"

pw eval "() => window.__rec.caption('hello page two')" >/dev/null 2>&1
pw goto "$URL/b.html" >/dev/null 2>&1
check "caption survives a page load" '"hello page two"' "$(pw eval "() => document.querySelector('#__rec_cap').textContent" 2>&1)"
pw run-code --filename "$OVL" >/dev/null 2>&1
pw goto "$URL/a.html" >/dev/null 2>&1
check "one of each after a second run and a page load" '"1 1 1"' "$(pw eval "() => ['#__rec_cap','#__rec_dot','#__rec_keys'].map(s => document.querySelectorAll(s).length).join(' ')" 2>&1)"
pw eval "() => window.__rec.caption('')" >/dev/null 2>&1
check "empty caption hides the bar" '"none"' "$(pw eval "() => getComputedStyle(document.querySelector('#__rec_cap')).display" 2>&1)"

check "password keys stay off the badge" '""' "$(pw run-code "async page => { await page.locator('#p').pressSequentially('xy'); return await page.evaluate(() => document.querySelector('#__rec_keys').textContent); }" 2>&1)"
out=$(pw run-code "async page => { await page.locator('#t').pressSequentially('xy'); return await page.evaluate(() => document.querySelector('#__rec_keys').textContent); }" 2>&1)
case "$out" in *xy*) r=yes;; *) r=no;; esac
check "text keys show on the badge" "yes" "$r"

check "click ring shows and the click lands" '"1 1"' "$(pw run-code 'async page => { const b = await page.locator("#b").boundingBox(); await page.mouse.click(b.x + b.width/2, b.y + b.height/2); return `${await page.evaluate(() => document.querySelectorAll(".__rec_ring").length)} ${await page.evaluate(() => window.n)}`; }' 2>&1)"

pw eval "() => window.__rec.caption('hi')" >/dev/null 2>&1
pw goto "$URL/c.html" >/dev/null 2>&1
check "no overlay inside an iframe" "0" "$(pw run-code "async page => { await page.waitForTimeout(500); const f = page.frames().find(x => x !== page.mainFrame()); return await f.evaluate(() => document.querySelectorAll('#__rec_cap').length); }" 2>&1)"

echo "passed $pass, failed $fail"
[ "$fail" -eq 0 ]
