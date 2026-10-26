# record-testing bold annotations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give recorded walkthroughs a bold caption bar, a title card per criterion, a visible mouse ring, a keystroke badge and visible typing, so a QA reader can follow each GIF without the step log.

**Architecture:** One new page script, `scripts/record-testing-overlay.js`, run once through `playwright-cli run-code --filename` right after the login; it registers itself with `addInitScript` so it survives page loads. A shell test proves it against a local two-page site. `skills/record-testing/SKILL.md` learns when to run it and how to caption, chapter and type visibly; the baseline doc names it under the existing unscored overlay-after-login rule. `scripts/record-testing-clip.sh` is not touched.

**Tech Stack:** `playwright-cli` 0.1.20 (`run-code`, `eval`, `video-chapter`, `video-show-actions`); plain browser JavaScript; bash on macOS; `python3 -m http.server` for test pages; ffmpeg (no `drawtext`) for GIFs and contact sheets.

**Spec:** `docs/superpowers/specs/2026-10-26-record-testing-bold-annotations-design.md`

## Global Constraints

- **Branch and worktree:** branch `record-testing-bold-annotations` from `main`, worktree at `.claude/worktrees/record-testing-bold-annotations`. All paths below are relative to that worktree.
- **Commits:** one per task, plus the opening spec-and-plan commit in Task 1 Step 1; plain messages starting `record-testing: `. **No `Co-Authored-By` trailer, no Claude attribution, no session links** — this overrides the trailer that `2026-09-15-record-testing-cli-swap.md` mandates; do not copy it.
- **Author:** `Dean Betty <deanlloyd64@gmail.com>` is already set in the repo's local config, which the worktree shares. Never run `git config`.
- **Staging:** by path only; never `git add -A` or `git add .`. Never stage `docs/ideas/`, `exa-results/`, or `docs/superpowers/handoffs/`.
- **Pushing is Dean-gated.** `git push` appears nowhere in this plan. `claude plugin validate .` runs before any push.
- **The overlay runs at the same moment as `video-show-actions`:** on the first app page after `login ends`, never before.
- **Exact values:** `video-show-actions --duration=1500 --position=top-left`; keystroke badge top-right; caption bottom-centre, `font-size` ≥ 32px, `font-weight` 700, light text on a dark background; cursor ring ≥ 36px wide, transparent centre, thick red border; click ring grows and fades over about 600 ms; `video-chapter … --duration 2500`; `pressSequentially(…, {delay:120})`.
- **Element ids** (Task 1 produces them, Tasks 2 and 4 rely on them): `#__rec_cap`, `#__rec_dot`, `#__rec_keys`, class `.__rec_ring`; API `window.__rec.caption(text: string): void`, empty string clears.
- **`scripts/record-testing-clip.sh` and its tests are not modified.**
- **`$SCRATCH`** is the executing session's scratchpad directory (fall back to `$TMPDIR`); set it once with `export SCRATCH=…` before Task 4.
- **No client environment.** Recording against one needs Dean's explicit OK; this plan uses local pages only. The live vault is never written.
- **Skill text:** everyday words; keep the skill's terse style and length discipline.
- **Model routing:** every subagent prompt opens with "You were dispatched to execute a specific task. Ignore session-start skill reminders." and every Agent call names its model.

  | Task | Implements | Reviews |
  |---|---|---|
  | 1 Overlay and test | sonnet | opus |
  | 2 Skill text | sonnet | opus |
  | 3 Baseline doc | sonnet | haiku (grep check) |
  | 4 End-to-end check | sonnet (drives, cuts, builds sheets) | opus (reads the sheets, writes the verdict) |

## Review Focus

1. **Overlay run twice, then a page load.** Two init scripts are registered; if the guard is set late (the spike sets it inside a `DOMContentLoaded` callback) both run and every element appears twice. Expect one of each. Test in Task 1 (assertion 6).
2. **The click ring lands under the pointer at `mousedown`.** If it took pointer events, the `click` would hit the ring, not the button. Expect the button's handler to fire exactly once. Test in Task 1 (assertion 8).
3. **Per-key typing into a password field with the overlay on.** Expect the badge to stay empty. Test in Task 1 (assertion 7).
4. **The app bounces back to its login mid-run.** The init script is already on every page, so the password guard is what keeps the password out of the badge; the action callout still prints filled values, which is why the login marks and the cut stay. Test: Task 1 assertion 7; skill text: the existing `login starts` / `login ends` marks bullet, which Task 2 leaves in place.
5. **A long caption at 800 px.** A sentence of about 100 characters must wrap inside the bar and stay readable in the GIF. Checked in Task 4's contact sheet. A caption with an apostrophe breaks the `eval` quoting; Task 2 says so in the skill and Task 4 writes one without.

---

### Task 1: The overlay script and its test

**Files:**
- Create: `scripts/record-testing-overlay.js`
- Create: `scripts/tests/test-record-testing-overlay.sh`
- Add (copied from the main checkout, where they sit untracked): `docs/superpowers/specs/2026-10-26-record-testing-bold-annotations-design.md`, `docs/superpowers/plans/2026-10-26-record-testing-bold-annotations.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a file whose whole content is one function `async page => { … }`, run by `playwright-cli -s=<KEY> run-code --filename <abs path>/scripts/record-testing-overlay.js`. In the page: `window.__rec.caption(text: string): void`; elements `#__rec_cap`, `#__rec_dot`, `#__rec_keys`, `.__rec_ring`, all `pointer-events: none`. Caption text is kept in `sessionStorage` under `__rec_cap`.

- [ ] **Step 1: Create the worktree and commit the spec and plan**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git worktree add .claude/worktrees/record-testing-bold-annotations -b record-testing-bold-annotations main
W=.claude/worktrees/record-testing-bold-annotations
cp docs/superpowers/specs/2026-10-26-record-testing-bold-annotations-design.md "$W/docs/superpowers/specs/"
cp docs/superpowers/plans/2026-10-26-record-testing-bold-annotations.md "$W/docs/superpowers/plans/"
cd "$W"
git add docs/superpowers/specs/2026-10-26-record-testing-bold-annotations-design.md docs/superpowers/plans/2026-10-26-record-testing-bold-annotations.md
git commit -m "record-testing: bold annotations design and plan"
```

Expected: one commit, two files. The untracked originals in the main checkout stay where they are; delete them there before merging the branch, or the merge stops on "untracked working tree files would be overwritten".

- [ ] **Step 2: Write the failing test `scripts/tests/test-record-testing-overlay.sh`**

Same shape as `scripts/tests/test-record-testing-clip.sh`: `set -u`, `ok`/`bad`/`check` helpers, `passed N, failed M` summary, exit non-zero on any failure. Run as `bash scripts/tests/test-record-testing-overlay.sh`.

Setup:
- `command -v playwright-cli` fails → print `skipped, no playwright-cli` and exit 0.
- `T=$(mktemp -d)`; site in `$T/site`, recording dir `$T/rec`. Free port from `python3 -c 'import socket;s=socket.socket();s.bind(("",0));print(s.getsockname()[1])'`; serve with `python3 -m http.server "$PORT"` in the background; wait until `curl -sf` answers.
- Session name `S=rt-overlay-$$`. Every call is `env -C "$T/rec" playwright-cli -s="$S" --raw …`, so output is the bare JSON value (`1`, `"none"`, `""`).
- `trap` on EXIT: `env -C "$T/rec" playwright-cli -s="$S" close` (its own session only, checked 2026-10-26 — **not** `close-all`, which would also end a live recording session; the `env -C` keeps `.playwright-cli/` out of the repo), kill the server, then `rm -rf "$T"`.
- Pages: `a.html` with `<input id=t>`, `<input id=p type=password>`, `<button id=b onclick="window.n=(window.n||0)+1">Go</button>`; `b.html` with one paragraph.
- `open http://localhost:$PORT/a.html`, then `run-code --filename "$OVL"` where `OVL="$(cd "$HERE/.." && pwd)/record-testing-overlay.js"`.

Assertions, in order (`check "<name>" <expected> <actual>`):

1. `overlay run exits 0` — `0` vs the `run-code` exit code.
2. `one caption bar` — `1` vs `eval "() => document.querySelectorAll('#__rec_cap').length"`.
3. `nothing takes pointer events` — `"none none none"` vs `eval` joining `getComputedStyle(el).pointerEvents` for `#__rec_cap`, `#__rec_dot`, `#__rec_keys` with spaces.
4. `caption is big and bold` — `yes` vs a shell test that `eval` of `parseFloat(getComputedStyle(cap).fontSize) >= 32 && getComputedStyle(cap).fontWeight === '700'` printed `true`.
5. `cursor ring is hollow` — `yes` vs `eval` of `getComputedStyle(dot).backgroundColor === 'rgba(0, 0, 0, 0)' && parseFloat(getComputedStyle(dot).width) >= 36` printed `true`.
6. Caption and run-twice:
   - `eval "() => window.__rec.caption('hello page two')"`, `goto …/b.html`; `caption survives a page load` — `"hello page two"` vs `#__rec_cap` `textContent`.
   - `run-code --filename "$OVL"` again, then `goto …/a.html`; `one of each after a second run and a page load` — `"1 1 1"` vs the counts of `#__rec_cap`, `#__rec_dot`, `#__rec_keys` joined with spaces.
   - `eval "() => window.__rec.caption('')"`; `empty caption hides the bar` — `"none"` vs computed `display` of `#__rec_cap`.
7. Keystroke badge — the badge clears after 1.5 s, so type and read in one `run-code` call:
   - `run-code "async page => { await page.locator('#p').pressSequentially('xy'); return await page.evaluate(() => document.querySelector('#__rec_keys').textContent); }"`; `password keys stay off the badge` — `""`.
   - The same against `#t`; `text keys show on the badge` — `yes` vs whether the output contains `xy`.
8. Click ring — in one `run-code`: get `#b`'s bounding box, `page.mouse.click` its centre, then return `` `${await page.evaluate(() => document.querySelectorAll('.__rec_ring').length)} ${await page.evaluate(() => window.n)}` ``; `click ring shows and the click lands` — `"1 1"`.

- [ ] **Step 3: Run it and watch it fail**

Run: `bash scripts/tests/test-record-testing-overlay.sh`
Expected: `FAIL - overlay run exits 0` (no overlay file yet), later checks fail, last line `passed 0, failed …`, non-zero exit.

- [ ] **Step 4: Write `scripts/record-testing-overlay.js`**

Start from the spike, `/private/tmp/claude-501/-Users-deanbetty-Code-StrideClients-UsCold-uscold-map-US-Cold-Notes/8ad2e4ec-77af-4c10-94a2-54077675cffe/scratchpad/spike/overlay.js` (if that scratch folder is gone, the spec's Decisions describe everything it did). Keep its shape: `const init = () => {…}; await page.addInitScript(init); await page.evaluate(init);`, `mousemove` / `mousedown` / `keydown` listeners in capture phase, the `type === 'password'` guard, `sessionStorage` for the caption. Change:
- Guard **synchronously** at the top of `init`: return if `window.__rec_on` is set, else set it, before any deferral. Also skip element creation if `#__rec_cap` already exists.
- Caption: `font: 700 32px/1.3 system-ui, sans-serif`, `rgba(0,0,0,.85)` background, white text, `max-width: 90%`, bottom-centre.
- Cursor `#__rec_dot`: 36px, `background: transparent`, `border: 5px solid #f22`, centred on the pointer, glides with `transition: left .45s, top .45s`.
- Click ring: starts about 20px, grows to about 90px and fades over 0.6 s, removed after 700 ms.
- Badge `#__rec_keys`: top-right, yellow, bold monospace, clears 1.5 s after the last key.
- A one-line comment at the top: what the file is and that it runs only after the login ends.

- [ ] **Step 5: Run the test and see it pass**

Run: `bash scripts/tests/test-record-testing-overlay.sh`
Expected: every line `ok`, last line `passed 11, failed 0`, exit 0. Then `playwright-cli list` shows no `rt-overlay-*` session, and `bash scripts/tests/test-record-testing-clip.sh` still ends `failed 0`.

- [ ] **Step 6: Commit**

```bash
git add scripts/record-testing-overlay.js scripts/tests/test-record-testing-overlay.sh
git commit -m "record-testing: bold on-screen overlay with caption, cursor ring and key badge"
```

---

### Task 2: Teach the skill the overlay, chapters, captions and visible typing

**Files:**
- Modify: `skills/record-testing/SKILL.md:20` (the "Do not … `.mjs`" sentence), `:24` (run order), `:27` (the `video-show-actions` bullet), `## During` (`:33-38`), `## Common mistakes` (`:76` and two new rows)

**Interfaces:**
- Consumes: `scripts/record-testing-overlay.js`, `window.__rec.caption(text)` from Task 1.
- Produces: the run order and caption/chapter/typing commands Task 4 follows word for word.

- [ ] **Step 1: Driving the browser**

Line 20, replace everything from `do not write a .mjs script` to the end of the line with:

```markdown
do not write your own script against the npm package: that is a different tool and it cannot record. The one script the skill runs is the overlay it ships, through `run-code --filename`.
```

Line 24 becomes: `` The run in order: `open <url>`, `video-start`, the login, the overlay and `video-show-actions`, the walkthrough, `video-stop`, `close-all`. `` (rest of the line unchanged, except the verb list gains `run-code` and `video-chapter`).

Line 27 becomes:

```markdown
- On the first app page after the login ends, and never before it, two calls: `run-code --filename <plugin root>/scripts/record-testing-overlay.js`, then `video-show-actions --duration=1500 --position=top-left`. The overlay adds a caption bar, a red ring that follows the mouse, and a badge showing keys as they are typed; it stays on through later page loads. The action callout names each action and highlights its target. Before the login it prints what was typed, password included.
```

- [ ] **Step 2: During**

Replace the `Mark each criterion` bullet and add two after it:

```markdown
- Mark each criterion: `AC3 starts`, then straight away `video-chapter "AC3 – <the criterion in plain words>" --description "<what the reader will see>" --duration 2500`; `AC3 ends, pass` or `AC3 ends, fail: <one sentence>` at its last step. The mark comes before the card, so the card is in that criterion's GIF.
- Captions say what is being checked, in words a tester knows: `eval "() => window.__rec.caption('AC3: Delete hides the note')"`. Set one at the start of each criterion and at key steps; `''` clears it. No apostrophes: they end the quote, so write "does not".
- Typing the criterion is about is typed where it can be seen: `run-code "async page => { await page.locator('#dock').click(); await page.locator('#dock').pressSequentially('South', {delay:120}); }"`. `fill` stays for setup values. Never this for the login.
```

- [ ] **Step 3: Common mistakes**

Row at line 76 becomes: `| Turning the overlay or the action callout on before signing in | The callout prints what was typed; the password is on screen in plain text, mask or no mask |`. Add:

```markdown
| Taking the `ACn starts` mark after the chapter card | The card falls outside that criterion's GIF |
| `fill` for the value the criterion is about | It appears all at once; nobody sees it typed |
```

- [ ] **Step 4: Check the text**

Run:
```bash
grep -c 'record-testing-overlay.js' skills/record-testing/SKILL.md
grep -c 'position=top-left' skills/record-testing/SKILL.md
grep -c 'video-chapter "AC' skills/record-testing/SKILL.md
grep -c 'apostrophes' skills/record-testing/SKILL.md
grep -c '\.mjs' skills/record-testing/SKILL.md
wc -l < skills/record-testing/SKILL.md
claude plugin validate .
```
Expected: `1`, `1`, `1`, `1`, `0`, a line count of about 90 (was 86), and the plugin reported valid.

- [ ] **Step 5: Commit**

```bash
git add skills/record-testing/SKILL.md
git commit -m "record-testing: run the overlay after login, chapter and caption each criterion, type visibly"
```

---

### Task 3: Name the overlay in the baseline's unscored rule

**Files:**
- Modify: `docs/superpowers/baselines/record-testing.md:289-301`

**Interfaces:**
- Consumes: the overlay's name and timing from Tasks 1 and 2.
- Produces: nothing later tasks use.

- [ ] **Step 1: Extend the section**

Keep the heading. After the first paragraph (ends "…covering this rule."), add:

```markdown
Since 2026-10-26 the same rule covers the injected overlay, `scripts/record-testing-overlay.js`, which the skill runs in the same step as `video-show-actions`. Its keystroke badge ignores keys typed into password fields, and `scripts/tests/test-record-testing-overlay.sh` checks that, but nothing scores when a rep ran it. A rep that ran the overlay before signing in would still score 12/12.
```

Leave the 2026-09-15 paragraph as it is. Add no check, no check id, no results file.

- [ ] **Step 2: Check**

Run: `grep -c 'record-testing-overlay.js' docs/superpowers/baselines/record-testing.md; grep -cE '^\| (V1[0-9]|X[4-9])' docs/superpowers/baselines/record-testing.md`
Expected: `1`, then `0`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/baselines/record-testing.md
git commit -m "record-testing: baseline names the overlay under the unscored after-login rule"
```

---

### Task 4: Record one walkthrough end to end and look at the frames

**Files:**
- Modify: `docs/superpowers/specs/2026-10-26-record-testing-bold-annotations-design.md` (append `## Verified <date>`)
- Scratch only, never committed: `$SCRATCH/rt-bold/` (site, recording dir, GIFs, sheets)

**Interfaces:**
- Consumes: Task 1's overlay, Task 2's skill text, the baseline's fixture site.
- Produces: a pass/fail verdict per check below, written into the spec.

- [ ] **Step 1: Stand up the fixture site**

Run the baseline's "Static site with a login page" block (`docs/superpowers/baselines/record-testing.md`, the two `cat > … <<'H'` pages and the `http.server 8765` line) with `RUN=$SCRATCH/rt-bold`. Expected: `site up`. No vault copy; this run writes nothing under any vault.

- [ ] **Step 2: Record it by the skill**

Follow `skills/record-testing/SKILL.md` Driving and During, session `-s=rt-bold`, recording dir `$SCRATCH/rt-bold/rec`, video `$SCRATCH/rt-bold/rec/raw.webm --size=1280x800`. Two criteria on `index.html`:
- AC1: the door field is read-only. Chapter card, caption, `hover "#door"` (puts the ring on it; `click` would hang, because the field is disabled), then `eval "() => document.querySelector('#door').disabled"` → `true` as the evidence.
- AC2: the dock can be changed. Chapter card, caption, then type `South` into `#dock` with the visible-typing `run-code` form.
- One caption of about 100 characters with no apostrophe, for example `AC2: The dock field accepts a new value and keeps it after you click away from the field`.

Sign in with `fill` (username `qauser`, password `NotARealPassword1`). Note whether `video-chapter` returned at once or after 2.5 s. Write the marks file (`login …`, `AC1 …`, `AC2 …`), `video-stop`, `close-all`.

- [ ] **Step 3: Cut and build contact sheets**

```bash
bash scripts/record-testing-clip.sh "$SCRATCH/rt-bold/rec/raw.webm" "$SCRATCH/rt-bold/out" "$SCRATCH/rt-bold/marks"
for g in "$SCRATCH"/rt-bold/out/*.gif; do ffmpeg -v error -y -i "$g" -vf "fps=1,scale=640:-1,tile=4x4" -frames:v 1 "${g%.gif} sheet.png"; done
ffmpeg -v error -y -ss 0 -to <login end> -i "$SCRATCH/rt-bold/rec/raw.webm" -vf "fps=1,scale=640:-1,tile=4x4" -frames:v 1 "$SCRATCH/rt-bold/out/before-login sheet.png"
```
Expected: the clip script exits 0 and lists one webm and two GIFs; three sheets exist.

- [ ] **Step 4: Read the sheets and judge (opus)**

Each must hold, or the task fails and goes back to Task 1 or 2:
1. Caption readable in both GIF sheets at 800 px; the 100-character caption wraps inside its bar.
2. The cursor ring is visible and the field under it is not hidden.
3. The keystroke badge (top-right) and the action callout (top-left) never overlap.
4. Each GIF opens on its chapter card.
5. `South` appears letter by letter in AC2, and the badge echoes it.
6. The before-login sheet shows no caption, ring or badge, and the password never appears in any frame.

- [ ] **Step 5: Record the verdict and commit**

Append to the spec, under `## Verified <YYYY-MM-DD>`: one line per check above with pass or fail, plus whether `video-chapter` blocks. Text only; sheets stay in scratch. Stop the site (`kill $(cat $SCRATCH/rt-bold/site.pid)`), confirm `playwright-cli list` shows no `rt-bold` session.

```bash
git add docs/superpowers/specs/2026-10-26-record-testing-bold-annotations-design.md
git commit -m "record-testing: bold annotations verified on a local walkthrough"
```

- [ ] **Step 6: Final checks, then hand back**

Run: `bash scripts/tests/test-record-testing-overlay.sh; bash scripts/tests/test-record-testing-clip.sh; claude plugin validate .; git status --porcelain`
Expected: both test files end `failed 0`, the plugin is valid, the worktree is clean. Hand the branch back to Dean; pushing and merging are his call.

## Self-review

- **Spec coverage:** decisions 1, 8 → Task 1; 2, 3 → Tasks 1 (guard, ids) and 2 (timing, `--position`); 4, 5 → Task 1 assertions 4–5 and Task 4 checks 1–2; 6, 7 → Task 2 and Task 4 checks 4–5; 9 → Task 2 Step 1; 10 → Task 3. Known limits are spec-only, no task.
- **Names:** `#__rec_cap`, `#__rec_dot`, `#__rec_keys`, `.__rec_ring`, `window.__rec.caption`, `window.__rec_on` used the same way in Tasks 1, 2 and 4.
- **Review Focus:** items 1–3 are Task 1 assertions 6–8; item 4 is assertion 7 plus the unchanged login-marks bullet; item 5 is Task 4 check 1 and the Task 2 apostrophe line.
- **Proportion:** no code bodies beyond copy the spec fixes; the spike file is the reference implementation.
