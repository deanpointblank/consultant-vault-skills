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

## Verified 2026-10-26

One local walkthrough on the baseline fixture site (session `rt-bold`, 1280x800, two criteria), cut by `record-testing-clip.sh` and read as 4x4 contact sheets at 640 px a tile (stricter than the 800 px GIF), plus single-frame cuts where the sheets were too coarse.

1. Caption readable at 800 px, 100-character caption wraps inside its bar: **pass**. The AC1 caption reads in every AC1 frame; the AC2 caption wraps to three lines inside the bar.
2. Cursor ring visible, field under it not hidden: **pass**. The hollow ring sits on `#door` with `D07` readable and on `#dock` with the value readable through it.
3. Keystroke badge and action callout never overlap: **pass**. Callout top-left, badge top-right, clear gap in every frame. The callout covers the page heading, which is the chosen position, not an overlap.
4. Each GIF opens on its chapter card: **pass**. Both GIFs open on the card.
5. `South` appears letter by letter in AC2 and the badge echoes it: **pass on the typing, wrong final value**. The field shows `So…` then `South` arriving one key at a time, and the badge shows `So`, `Sout`, `South`. The prefilled `North` was not cleared (`Control+a` does not select all on macOS), so the field ended `SouthNorth`. The typing example needs a `.clear()` before `pressSequentially`; that goes into the final fix wave.
6. No caption, ring or badge before login, password never in a frame: **pass**. The before-login sheet shows the plain login page; the raw recording shows the password only as masked dots, and the clipped webm drops the login span entirely.

`video-chapter --duration 2500` **blocks** for about 3.0 s before returning. This answers the open Known limits bullet; the mark-before-chapter order held and the card falls inside each criterion's GIF.

Also seen, for the fix wave:

- **Stale caption under the next card.** The AC2 chapter card shows over the AC1 caption for its first frames, because the AC2 caption is set after `video-chapter`. Set or clear the caption before the chapter call.
- **Two cursor markers at once.** At each click the built-in `video-show-actions` pointer (arrow plus a filled red dot) lands on the target while the overlay ring is still on the previous field; the ring catches up about a frame later. For that moment a reader sees two markers on two fields, and the filled dot is what decision 5 set out to avoid. The ring also idles at its last spot through the next chapter card. Confusing at the click instant; worth moving the ring on the same event as the built-in pointer, or fading it when idle.
