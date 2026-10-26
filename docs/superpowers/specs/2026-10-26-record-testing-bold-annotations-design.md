# record-testing: bold on-screen annotations — design

**Status: approved by Dean 2026-10-26 after a spike; built, reviewed, and verified again 2026-10-26 after the review fixes. Pushing is Dean's call.** Builds on `2026-09-15-record-testing-cli-swap-design.md`; supersedes nothing.

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
3. **The built-in callout stays** (it highlights the target element) but moves: `video-show-actions --duration=1500 --position=top-left --cursor=none`, so the overlay's ring is the only cursor. Keystroke badge top-right. Caption bottom-centre. Nothing overlaps.
4. **Caption**: at least 32 px, bold (700), light text on a dark background. 32 px at 1280 is about 20 px in the 800 px GIF. Plain words a QA reader understands, set at the start of each criterion and at key steps: `eval "() => window.__rec.caption('AC2: Delete hides the note')"`. No apostrophes, double quotes, `$` or backticks in caption, chapter or typed text; the command is one double-quoted bash string.
5. **Cursor**: a hollow ring, about 36 px, thick red border, transparent centre, gliding on `mousemove`, so it never hides the button under it. A click ring on `mousedown` grows and fades over about 600 ms.
6. **Chapter card at each criterion**: take the `AC<n> starts` mark, set that criterion's caption, then `video-chapter "AC<n> – <criterion in plain words>" --description "<what the reader will see>" --duration=2500`. The mark comes first so the card falls inside that criterion's GIF; the caption comes before the card so the card never sits over the previous caption.
7. **Visible typing** for values the criterion is about: `run-code "async page => { const f = page.locator(SEL); await f.click(); await f.clear(); await f.pressSequentially(TEXT, {delay:120}); }"`. `fill` stays for setup values not worth showing. Never the per-key form for the login.
8. **Safe to run twice and never in the way**: one of each element however often it runs, across page loads; every element `pointer-events: none`.
9. **The skill's "no `.mjs` script against the npm package" line** is narrowed so the shipped overlay file is clearly allowed: it is run through `playwright-cli run-code`, not against the npm package.
10. **Baseline doc**: the injected overlay joins the existing "not scored: overlay-after-login rule" section. Per the 2026-09-15 decision, the gap is documented; no scored check is added after the fact.

## Known limits

- `sessionStorage` is per origin. A caption survives same-host page loads only; after a hop to another host (a single sign-on redirect, say) it is blank until set again.
- `video-chapter --duration=2500` blocks for about 3 s before it returns (measured twice, 3.0 s each time). The mark, caption, card order holds either way.
- A caption that wraps to three lines (about 100 characters at 1280 px) is tall enough to cover controls near the bottom of the screen. Keep captions short when the criterion is about something low on the page.
- The action callout still draws a small filled dot where the next action lands, alongside its target highlight, even with `--cursor=none`. It fades within the 1.5 s callout; the ring moves to the target when the action itself runs.

## Out of scope

Burning text in after recording; any change to `record-testing-clip.sh`; recording against a client environment (that needs Dean's explicit OK); a re-baseline of the skill.

## Verified 2026-10-26

One local walkthrough on the baseline fixture site (session `rt-bold`, 1280x800, two criteria), cut by `record-testing-clip.sh` and read as 4x4 contact sheets at 640 px a tile (stricter than the 800 px GIF), plus single-frame cuts where the sheets were too coarse.

1. Caption readable at 800 px, 100-character caption wraps inside its bar: **pass**. The AC1 caption reads in every AC1 frame; the AC2 caption wraps to three lines inside the bar.
2. Cursor ring visible, field under it not hidden: **pass**. The hollow ring sits on `#door` with `D07` readable and on `#dock` with the value readable through it.
3. Keystroke badge and action callout never overlap: **pass**. Callout top-left, badge top-right, clear gap in every frame. The callout covers the page heading, which is the chosen position, not an overlap.
4. Each GIF opens on its chapter card: **pass**. Both GIFs open on the card.
5. (superseded below) `South` appears letter by letter in AC2 and the badge echoes it: **pass on the typing, wrong final value**. The field shows `So…` then `South` arriving one key at a time, and the badge shows `So`, `Sout`, `South`. The prefilled `North` was not cleared (`Control+a` does not select all on macOS), so the field ended `SouthNorth`. The typing example needs a `.clear()` before `pressSequentially`; that goes into the final fix wave.
6. No caption, ring or badge before login, password never in a frame: **pass**. The before-login sheet shows the plain login page; the raw recording shows the password only as masked dots, and the clipped webm drops the login span entirely.

`video-chapter --duration 2500` **blocks** for about 3.0 s before returning. This answers the open Known limits bullet; the mark-before-chapter order held and the card falls inside each criterion's GIF.

Also seen, for the fix wave:

- (superseded below) **Stale caption under the next card.** The AC2 chapter card shows over the AC1 caption for its first frames, because the AC2 caption is set after `video-chapter`. Set or clear the caption before the chapter call.
- (superseded below) **Two cursor markers at once.** At each click the built-in `video-show-actions` pointer (arrow plus a filled red dot) lands on the target while the overlay ring is still on the previous field; the ring catches up about a frame later. For that moment a reader sees two markers on two fields, and the filled dot is what decision 5 set out to avoid. The ring also idles at its last spot through the next chapter card. Confusing at the click instant; worth moving the ring on the same event as the built-in pointer, or fading it when idle.

## Verified again 2026-10-26 after the review fixes

A second local walkthrough on the same fixture site (session `rt-bold2`, 1280x800, two criteria) following the fixed skill text word for word: overlay path quoted, `video-show-actions --duration=1500 --position=top-left --cursor=none`, mark then caption then `video-chapter … --duration=2500`, `.clear()` before `pressSequentially`. Cut by `record-testing-clip.sh` and read as 4x4 contact sheets at 640 px a tile, plus 5 fps frame cuts around each click and the typing.

1. Caption readable, 100-character caption wraps inside its bar: **pass**. The AC2 caption wraps to three lines inside the bar.
2. Cursor ring visible, field under it not hidden: **pass**. `D07`, `North` and `South` all read through the ring.
3. Keystroke badge and action callout never overlap: **pass**. Callout top-left, badge top-right in every frame.
4. Each GIF opens on its chapter card: **pass**. The card is up from the second frame of each GIF (about 1 s in, the caption call sits between the mark and the card).
5. `South` appears letter by letter and the badge echoes it: **pass**. The field empties, then shows `S`, `Sou`, `South`; the badge shows `⟨Delete⟩` for the clear, then `S`, `Sou`, `South`.
6. No caption, ring or badge before login, password never in a frame: **pass**. The before-login sheet is the plain login page; the password shows only as masked dots, and the clipped webm starts on the app page.

- `.clear()` gives `South` as the final value: **pass**. `#dock` reads `"South"` after clicking away.
- The ring is the only cursor and is at the target when the click lands: **pass**. No arrow pointer in any frame. At the dock click and the heading click the ring snaps to the click point on the same frame as the click ring. During the 1.5 s callout before each action it still sits on the previous spot.
- The caption under each card is that criterion's own: **pass**. The AC2 card sits over the AC2 caption. The first frame of the AC2 GIF, before the card, still shows the AC1 caption for about a second.
- The callout's target highlight with `--cursor=none`: **still shows**. A light-blue box on the target and a small filled dot at the hit point, both fading within the callout (see Known limits).
