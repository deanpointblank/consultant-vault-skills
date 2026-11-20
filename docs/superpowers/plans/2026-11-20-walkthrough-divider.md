# Walkthrough divider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A draggable divider between the map and the stop on every page `code-walkthrough` builds, so the reader can give the map or the description more room.

**Architecture:** Only the three page assets change: one element in `page.html`, a fourth grid row in `page.css`, and a small block in `page.js` that reuses the existing `store` wrapper. No script in `scripts/lib/` changes, so the page model, the note, the reply and the map stay as they are. A guard test, written first, proves the rendered page is unchanged apart from the divider.

**Tech Stack:** Node 24 built-ins (`node:test`), headless Chrome through `dumpDom` (`scripts/tests/helpers.mjs`), chalk-talk at commit `4f88ead` for the map tests.

**Spec:** `docs/superpowers/specs/2026-11-20-wayfinder-design.md`, section "The divider (both modes)" and slice 1.

## Global Constraints

- **Workspace:** one branch, `wayfinder`, made from `code-walkthrough-standalone` in a git worktree with the superpowers:using-git-worktrees skill (Task 1). This plan's commits come first on it; the plan-mode plan (`2026-11-20-wayfinder-plan-mode.md`) follows on the same branch.
- **No push, no merge, no pull request** in any task. The last task ends by reporting to the user.
- **Staging:** by exact path only, never `git add -A` or `git add .`. The untracked files in the main working tree are unrelated and never staged, except the spec and the two plans, which Task 1 copies into the worktree and commits.
- **Commits:** one per task, message starting `code-walkthrough: `. No `Co-Authored-By` trailer and no Claude attribution.
- **Who does what:** every file edit goes to a subagent with a named model (see Model routing). Every dispatch prompt opens with: "You were dispatched to execute a specific task. Ignore session-start skill reminders."
- **Public repo:** roles only ("the author", "the user"); no names, emails, client names, real ticket keys or home paths other than `~`.
- **Tests:** `node --test "scripts/tests/*.test.mjs"` from `skills/code-walkthrough`. Baseline `pass 237`, `fail 0`, with Chrome and chalk-talk present. A run that skips the Chrome tests does not count.
- **Exact values (spec):** element `<div id="split" role="separator" aria-orientation="horizontal" aria-label="Map size" tabindex="0">` between `#map-wrap` and `#bar`, `aria-valuemin="20"`, `aria-valuemax="80"`, `aria-valuenow` = the map's share in percent, default 46. Full rows `minmax(180px, var(--map-h, 46%)) 6px auto minmax(0, 1fr)`. Limits 20 and 80. Up/Down 5 points, Page Up/Page Down 15, Home/End the limits, Enter and double-click reset to 46. Stored key `code-walkthrough:split`, through `store`.
- **Decided here (the spec is silent or loose):**
  - Strip and no-map keep the divider in the grid, hidden: strip rows `var(--strip) 0 auto minmax(0, 1fr)`, no-map rows `0 auto minmax(0, 1fr)`, and `#split { visibility: hidden }` in both, so it takes no space and cannot take focus. `page.js` does not remove it.
  - The share is a whole number. Up and Page Up shrink the map; Down and Page Down grow it. A stored value that is not a whole or decimal number from 20 to 80 means the default: it is not clamped. Reset stores `46`.
  - Narrow screens (under 900px wide) change nothing for the divider.
  - `setPointerCapture` is wrapped in `try`, as a synthetic event may have no live pointer.
  - `html[data-dragging]` turns off `#map-frame`'s pointer events and the page's text selection; it is removed on `pointerup`, `pointercancel` and `lostpointercapture`.

## Review Focus

1. **Storage that throws** (private window, blocked site data): the divider still moves and nothing errors. Pinned: Task 3, `the divider with storage that throws`.
2. **A stored value that is out of range or not a number**: the page opens at the default, 46. Pinned: Task 3, `the divider share is remembered, and a bad value means the default`.
3. **Strip and no-map pages**: the divider takes no room and no focus, and Hide map works as before. Pinned: Task 2, `the divider hides with the strip and without a map`.
4. **Left and Right while the divider has focus** still move the stop. Pinned: Task 2, `the divider moves with keys, within 20 and 80`.
5. **A drag released over the map frame**: the drag ends and the frame takes taps again. Pinned: Task 3, `the divider drags and resets on double-click` (pointerup dispatched with the frame under the pointer).

---

### Task 1: Workspace and the no-change guard

**Model:** sonnet.

**Files:**
- Modify: `skills/code-walkthrough/scripts/tests/helpers.mjs`
- Create: `skills/code-walkthrough/scripts/tests/no-change.test.mjs`, `skills/code-walkthrough/scripts/tests/golden/booking-flow.app.html`
- Commit with: the spec and both plans, copied from the main working tree

**Interfaces:**
- Produces (helpers.mjs): `pageSample(repo) -> object` (`sampleData(repo)` plus `built: '2026-11-11'`, `repos[0].commit = repo.head`, `repos[0].uncommitted = []`, and the `checks` that `withChecks` in `page.test.mjs` writes by default); `normalized(value, repo) -> same shape` (every `repo.head` becomes `<head>`, every `repo.path` becomes `<repo>`); `appDom(dump: string) -> string` (from `<div id="app">` up to `<script type="application/json" id="walk-data">`); `captureApp(root: string) -> Promise<string>` (builds `bookingRepo(root)`, assembles `pageModel(pageSample(repo))` with no map, runs `dumpDom` at 1280×900 with a `head` script that sets `localStorage['code-walkthrough:theme'] = 'light'` (the theme button sits in `#app`, and its label would follow the machine's setting), returns `normalized(appDom(dump))`). The plan-mode plan reuses all four.

- [ ] **Step 1:** Make the worktree with superpowers:using-git-worktrees: branch `wayfinder` from `code-walkthrough-standalone`. Copy in `docs/superpowers/specs/2026-11-20-wayfinder-design.md` and both `docs/superpowers/plans/2026-11-20-*` files named in this plan's header.
- [ ] **Step 2:** Run the tests. Expected: `pass 237`, `fail 0`.
- [ ] **Step 3:** Add the four helpers and `no-change.test.mjs` with two tests:
  - `a walkthrough page renders as before, apart from the divider` (`needsChrome`, defined as in `page.test.mjs`): `captureApp(tempRoot(t))` with any `<div id="split"…></div>` removed equals `golden/booking-flow.app.html`. Missing golden file fails the test.
  - `the map keeps its height when no size is stored` (`needsMap`): on `assemblePage(pageModel(pageSample(repo)), <built map>)`, `#map-frame`'s height is within 1px of `max(180, 0.46 × #read height)`.
- [ ] **Step 4:** Make the golden once, on the unchanged assets: `node --input-type=module -e` that imports `captureApp` and writes its result to `golden/booking-flow.app.html`. Read the file: it holds no temp path and no commit hash.
- [ ] **Step 5:** Run `node --test scripts/tests/no-change.test.mjs`. Expected: both pass. These are guards: they pass on first run, on purpose.
- [ ] **Step 6:** Run the tests. Expected: `pass 239`, `fail 0`.
- [ ] **Step 7:** Commit the spec, both plans, `helpers.mjs`, `no-change.test.mjs` and the golden by path: `code-walkthrough: a no-change guard for the walkthrough page, with the Wayfinder spec and plans`.

### Task 2: The divider: markup, rows and keys

**Model:** sonnet.

**Files:**
- Modify: `skills/code-walkthrough/assets/page.html:32-33`, `assets/page.css:74-82`, `assets/page.js`
- Test: `skills/code-walkthrough/scripts/tests/page.test.mjs`

**Interfaces:**
- Produces (page.js, inside the IIFE): `KEY_SPLIT = 'code-walkthrough:split'`, `SPLIT = { min: 20, max: 80, start: 46 }`, `setSplit(share: number, { save = true } = {}) -> void` (clamps, sets `--map-h` on `#read`, `aria-valuenow`, and stores when `save`). Task 3 calls `setSplit`.

- [ ] **Step 1: Write the failing tests** in `page.test.mjs`, after `narrow and short frames`, on `assemblePage(pageModel(sample()), sampleMap())`:
  - `the divider sits between the map and the bar, with its ARIA values` (`needsMap`): `#split` is `#map-wrap`'s next sibling and `#bar`'s previous one; `role`, `aria-orientation`, `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `tabindex` are `separator`, `horizontal`, `Map size`, `20`, `80`, `46`, `0`; its height is 6px.
  - `the divider moves with keys, within 20 and 80` (`needsMap`): with `#split` focused, the keys in turn give `aria-valuenow`: `ArrowDown` 51, `PageDown` 66, `End` 80, `ArrowDown` 80, `Home` 20, `ArrowUp` 20, `PageUp` 20, `Enter` 46. After `End`, `#map-frame`'s height is within 2px of 80% of `#read`'s height. `localStorage['code-walkthrough:split']` is `'46'` after `Enter`. `ArrowRight` on the focused divider moves `data-stop` from 1 to 2. Run again at `size: [800, 1000]` (narrow, tall): `data-narrow` is `'1'`, and `End` gives 80.
  - `the divider hides with the strip and without a map` (`needsMap`, one test): after a `#hide-map` click, `#split` is `visibility: hidden`, takes 0px, and `#split.focus()` leaves `document.activeElement` elsewhere; a second click shows it again. On `assemblePage(pageModel(sample()), null)` it is hidden the same way.
- [ ] **Step 2:** Run `node --test scripts/tests/page.test.mjs`. Expected: the three new tests fail (no `#split`).
- [ ] **Step 3: Implement.** The element per Global Constraints. The three rules at `page.css:74-76` take the rows in Global Constraints. `#split`: `cursor: row-resize`, `touch-action: none`, a 2px centre line in `--border-strong`, `--accent` on hover and focus. Hidden rules for strip and none. In `page.js`, the keys on `#split` only, each with `preventDefault`; Left and Right are left to the document handler.
- [ ] **Step 4:** Run `page.test.mjs`, then the guard `no-change.test.mjs`. Expected: all pass.
- [ ] **Step 5:** Run the tests. Expected: `pass 242`, `fail 0`.
- [ ] **Step 6:** Commit `assets/page.html`, `assets/page.css`, `assets/page.js`, `page.test.mjs`: `code-walkthrough: a divider between the map and the stop, moved by keys`.

### Task 3: The divider: drag, double-click and the remembered share

**Model:** sonnet.

**Files:**
- Modify: `skills/code-walkthrough/assets/page.js`, `assets/page.css`
- Test: `skills/code-walkthrough/scripts/tests/page.test.mjs`

**Interfaces:**
- Consumes: `KEY_SPLIT`, `SPLIT`, `setSplit` from Task 2; `store` (`page.js:22-25`).

- [ ] **Step 1: Write the failing tests** (all `needsMap`):
  - `the divider drags and resets on double-click`: dispatch `PointerEvent`s with `pointerId: 1` on `#split`: `pointerdown` → `html` has `data-dragging`; `pointermove` at `#read.top + 0.7 × height` → `aria-valuenow` `'70'`; `pointermove` at 95% → `'80'`; at 5% → `'20'`; `pointerup` with `clientY` over the map frame → no `data-dragging`, `#map-frame`'s `pointer-events` is not `none`, stored `'20'`. A `dblclick` → `'46'`.
  - `the divider share is remembered, and a bad value means the default`: a `head` script sets `localStorage['code-walkthrough:split']` before the page runs. `'30'` → `aria-valuenow` `'30'` and the frame near 30%; each of `'95'`, `'5'`, `'abc'`, `''` → `'46'`.
  - `the divider with storage that throws` (`head: BREAK_STORAGE`): `data-ready` is `'1'`; `End` gives `'80'`; `dblclick` gives `'46'`; `run` sees no page errors.
- [ ] **Step 2:** Run `page.test.mjs`. Expected: the three new tests fail.
- [ ] **Step 3: Implement** `pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`lostpointercapture`/`dblclick` on `#split` and the start-up read of `KEY_SPLIT`, per Global Constraints. Store on `pointerup`, never on each move. The `html[data-dragging]` rules go in `page.css`.
- [ ] **Step 4:** Run `page.test.mjs` and `no-change.test.mjs`. Expected: all pass.
- [ ] **Step 5:** Run the tests. Expected: `pass 245`, `fail 0`.
- [ ] **Step 6:** Commit `assets/page.js`, `assets/page.css`, `page.test.mjs`: `code-walkthrough: drag the divider, reset it, and remember its place`.

### Task 4: Final checks, then report

**Models:** sonnet runs the checks; haiku answers the yes/no checks; the main loop reports.

**Files:** none changed.

- [ ] **Step 1:** Run the tests. Expected: `pass 245`, `fail 0`, nothing skipped.
- [ ] **Step 2 (haiku):** `git diff code-walkthrough-standalone...wayfinder --stat` lists only the three assets, `helpers.mjs`, `page.test.mjs`, `no-change.test.mjs`, the golden, the spec and the two plans. `git diff code-walkthrough-standalone...wayfinder -- skills/code-walkthrough/scripts/lib skills/code-walkthrough/scripts/*.mjs` is empty. Expected: yes, yes.
- [ ] **Step 3:** The manual check for the user, under two minutes. From `skills/code-walkthrough` in the worktree:
  ```bash
  node --input-type=module -e "
  import fs from 'node:fs';
  import { bookingRepo, pageSample, chalkDir } from './scripts/tests/helpers.mjs';
  import { buildMap } from './scripts/lib/map.mjs';
  import { pageModel, assemblePage } from './scripts/lib/page.mjs';
  const root = process.env.SCRATCH + '/divider-check'; fs.rmSync(root, { recursive: true, force: true });
  const repo = bookingRepo(root), d = pageSample(repo);
  const m = buildMap(d, { chalk: chalkDir(), out: root + '/out', slug: 'booking-flow' });
  fs.writeFileSync(root + '/page.html', assemblePage(pageModel(d), m.html));"
  open "$SCRATCH/divider-check/page.html"
  ```
  The user drags the line under the map, double-clicks it, reloads, and tries Hide map.
- [ ] **Step 4:** Report to the user: the commits (`git log --oneline code-walkthrough-standalone..wayfinder`), the test count, and the manual check above. Say that the team copy is now out of step with this repo until its refresh, which is a separate job. Stop.

## Model routing

| Task | Implements | Reviews |
|---|---|---|
| 1 Workspace and guard | sonnet | main loop (test output, golden read) |
| 2 Markup, rows, keys | sonnet | sonnet (test run), main loop (diff) |
| 3 Drag, reset, storage | sonnet | sonnet (test run), main loop (diff) |
| 4 Final checks | sonnet, haiku | the user (manual check) |
