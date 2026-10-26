# record-testing: bold on-screen annotations — design

**Status: approved by Dean 2026-10-26 after a spike. Ready for an implementation plan.** Builds on `2026-09-15-record-testing-cli-swap-design.md`; supersedes nothing.

## Goal

Make a recorded walkthrough readable by a QA reader who never saw it run: a clear caption saying what is being checked, a title card at the start of each criterion, a mouse that is easy to follow, and typing that is visible as it happens.

## Why

The only annotation today is `video-show-actions`. Its callout is small, sits top-right, and prints Playwright vocabulary such as `Click locator('#q')`. After the GIF is scaled from 1280 to 800 px it is hard to read, and it says nothing a QA reader understands.

## What the spike established (2026-10-26, local demo page, `playwright-cli` 0.1.20)

- A `run-code --filename` function that calls `page.addInitScript(init)` and `page.evaluate(init)` adds an overlay to the current page and to every later page. A caption kept in `sessionStorage` survived a full navigation to a second page. No re-injection after `goto` is needed.
- `video-chapter "<title>" --description "<text>" --duration 2500` renders a centred title card. The skill does not use it today.
- `run-code` with `pressSequentially(text, {delay})` shows characters arriving one by one. `playwright-cli type` has no delay option and `fill` drops the value in at once.
- The spike's keystroke badge (top-right) collided with the built-in callout (default top-right).
- The spike's filled red dot partly covered the small buttons it sat on.
- Homebrew ffmpeg here has no `drawtext`, `subtitles` or `libass`, so burning text in after recording is out. Annotations must be in the page while it records.
- `playwright-cli --raw eval` prints the bare JSON value, which is what an automated test needs.
- Found while planning: the spike's re-run guard (`window.__rec`) is set inside a `DOMContentLoaded` callback. Run the overlay twice and two init scripts are registered; on the next page load both run before the guard is set, so every element appears twice. The shipped overlay sets its guard synchronously.

Reference implementation: the spike file, kept in the session scratchpad as `spike/overlay.js`. The shipped file starts from it.

## Decisions

1. **One shipped file**, `scripts/record-testing-overlay.js`, beside `record-testing-clip.sh`. Run as `env -C <rec dir> playwright-cli -s=<KEY> run-code --filename <plugin root>/scripts/record-testing-overlay.js`. API: `window.__rec.caption(text)`; an empty string clears it.
2. **Injected at the same moment as `video-show-actions`**: on the first app page after `login ends`, never before. That rule is the safeguard. The badge also ignores keys typed into `type=password` fields, as defence in depth for an app that bounces back to its login mid-run.
3. **The built-in callout stays** (it highlights the target element) but moves: `video-show-actions --duration=1500 --position=top-left`. Keystroke badge top-right. Caption bottom-centre. Nothing overlaps.
4. **Caption**: at least 32 px, bold (700), light text on a dark background. 32 px at 1280 is about 20 px in the 800 px GIF. Plain words a QA reader understands, set at the start of each criterion and at key steps: `eval "() => window.__rec.caption('AC2: Delete hides the note')"`. No apostrophes in caption text; they end the quoted string.
5. **Cursor**: a hollow ring, about 36 px, thick red border, transparent centre, gliding on `mousemove`, so it never hides the button under it. A click ring on `mousedown` grows and fades over about 600 ms.
6. **Chapter card at each criterion**: take the `AC<n> starts` mark, then `video-chapter "AC<n> – <criterion in plain words>" --description "<what the reader will see>" --duration 2500`. The mark comes first so the card falls inside that criterion's GIF.
7. **Visible typing** for values the criterion is about: `run-code "async page => { await page.locator(SEL).click(); await page.locator(SEL).pressSequentially(TEXT, {delay:120}); }"`. `fill` stays for setup values not worth showing. Never the per-key form for the login.
8. **Safe to run twice and never in the way**: one of each element however often it runs, across page loads; every element `pointer-events: none`.
9. **The skill's "no `.mjs` script against the npm package" line** is narrowed so the shipped overlay file is clearly allowed: it is run through `playwright-cli run-code`, not against the npm package.
10. **Baseline doc**: the injected overlay joins the existing "not scored: overlay-after-login rule" section. Per the 2026-09-15 decision, the gap is documented; no scored check is added after the fact.

## Known limits

- `sessionStorage` is per origin. A caption survives same-host page loads only; after a hop to another host (a single sign-on redirect, say) it is blank until set again.
- Whether `video-chapter` blocks for its `--duration` is not measured. The mark-before-chapter order holds either way.

## Out of scope

Burning text in after recording; any change to `record-testing-clip.sh`; recording against a client environment (that needs Dean's explicit OK); a re-baseline of the skill.
