# record-testing on the Playwright CLI — design

**Status: settled 2026-09-15 after a spike. Ready for an implementation plan. Supersedes `2026-09-10-record-testing-design.md`.**

## Goal

Drive the `record-testing` skill's walkthrough with the Playwright CLI (`playwright-cli`) instead of the Playwright MCP server. Everything the skill produces stays the same: a login-free trimmed WebM, one GIF per acceptance criterion, and a test-run note with the step log and a draft comment. Only the transport changes, plus the harness that scores it.

## Why

Artifact paths. The MCP server ignores `--output-dir` for named artifacts, so the raw `.webm` and the screenshots land in the client repo root. The skill has to hunt for them, move them into `<folders.attachments>/<KEY>/`, and clean the repo afterwards. That hunt is written into the skill in four places (`SKILL.md` lines 12, 19, 27, 60), into check V6, and into the 2026-09-10 handoff. The control run of 2026-09-10 hit it in five reps of six.

`playwright-cli video-start <absolute path>` writes where it is told. That removes the hunt, the warning, and the cleanup.

Two smaller gains came with it and are not the driver: the CLI has `video-show-actions`, and it has `state-save` / `state-load`.

## What this supersedes

- `docs/superpowers/specs/2026-09-10-record-testing-design.md` — superseded by this document. Not edited.
- `docs/superpowers/plans/2026-09-10-record-testing.md` — executed and merged. It is history. A fresh plan supersedes it.
- `docs/superpowers/baselines/results/record-testing-2026-09-10.md` — **not edited**. It is a dated record of a run that happened. A re-baseline writes a new results file beside it.

## What the spike established, 2026-09-15

Everything in this section was measured on the machine, against the baseline's own fixture site (the login page plus the two-AC page) served on `localhost:8765`, driven by hand with `playwright-cli`. It is not inferred.

**The output contract holds end to end. PASS.** The hand-driven CLI walkthrough fed the **unmodified** `scripts/record-testing-clip.sh`, which exited 0 and wrote three files: a trimmed `smoke.webm` at 38.9 s, down from 58.9 s raw, and `smoke AC1.gif` and `smoke AC2.gif`, each 800x500, 3.01 s, 24 frames, about 27 KB. The trimmed video was sampled at t=0, 1, 5, 15 and 30: every sample shows the app page, no login frames. **The clip script needs no change and its 16 shell tests are untouched by this work.**

**`video-start <absolute path> --size=WxH` honours the path exactly.** The raw video came out 1280x800 VP8, 58.92 s, at exactly the path given. Nothing landed in a repo root; `/Users/deanbetty/Code/consultant-vault-skills` and the `uscold-map` repo were both checked afterwards and were clean. This is the motivation, answered.

**Wall-clock marks map 1:1 onto video seconds, with no drift.** This was the risk worth chasing, because the raw video read 58.92 s against roughly 50 s of wall clock. A page rendering its own elapsed time was recorded and read back at known video timestamps:

| video t | on-screen clock |
|---|---|
| 0.5 | 0.4 |
| 1.5 | 1.4 |
| 2.5 | 2.4 |
| 3.5 | 3.4 |
| 4.5 | 4.4 |
| 5.5 | 5.4 |
| 6.3 | 5.4 (frozen) |

A constant 0.1 s offset, which is goto-to-paint lag, and no drift. Confirmed independently on the main walkthrough: the login-to-app transition sits between video t=19.2 and t=19.6, against a wall-clock submit at +19 s. **So `date +%s` marks stay correct and the skill's marks model survives the swap unchanged.**

**The tail carries frozen padding.** The excess duration is a repeated last frame, written while `video-stop` finalises the file: about 9 s on a 50 s run, about 1 s on a 6 s run. It does not touch the start, so the login cut is unaffected. Two consequences the implementation must handle:

1. The trimmed video ends on a frozen frame. Acceptable; say so rather than treat it as a bug.
2. The clip script's range validation (`e > dur + 0.5` fails a range) will accept marks that point into the padding, because the padding is part of the duration. A mark past the last real action produces a GIF of a still frame and no error. The skill's marks come from wall clock, so this only bites if the last AC's end mark is taken after `video-stop`.

**Five CLI behaviours the skill does not describe today and must:**

- **Use `find <text>`, not `snapshot`.** `find` prints the matching nodes with `[ref=eN]` inline. `snapshot` writes a `.yml` into `.playwright-cli/` and prints only its path, so every look costs an extra file read.
- **CSS selectors work as targets.** `fill "input[name=u]" qauser`, `click "button[type=submit]"`. No snapshot round trip for elements you already know.
- **Sessions survive across separate bash invocations** through `-s=<name>`. `playwright-cli list` shows live sessions; `close-all` ends them. Agent bash calls reset cwd between invocations, so every call needs its own `cd` and absolute paths.
- **`video-stop` prints the path relative to cwd** — it printed `../rec/smoke.webm`. The skill must use the absolute path it passed to `video-start`, not the printed one.
- **`.playwright-cli/` is created in cwd**, holding `page-*.yml` snapshots and `console-*.log`. The swap trades one stray for another, but the new one is predictable and lands in a directory we choose.

**Verb set confirmed present:** `open`, `goto`, `click`, `dblclick`, `fill`, `type`, `hover`, `select`, `check`, `uncheck`, `press`, `upload`, `drag`, `snapshot`, `find`, `eval`, `screenshot`, `resize`, `tab-*`, `go-back` / `go-forward`, `reload`, `console`, `requests` / `request`, `route`, `state-save`, `state-load`, `cookie-*`, `localstorage-*`, `video-start`, `video-stop`, `video-chapter`, `video-show-actions`, `video-hide-actions`, `recording-start` / `recording-stop`, `tracing-start` / `tracing-stop`, `list`, `close`, `close-all`, `kill-all`. Global flags: `--json`, `--raw`, `--version`, `--help [command]`. Headless is the default and records fine; `open --headed` opts into a visible browser.

**`video-show-actions` was measured on the same fixture, later the same day.** Options: `--duration` in milliseconds, default 500; `--position`, one of `top-left`, `top`, `top-right`, `bottom-left`, `bottom`, `bottom-right`, default `top-right`; `--cursor`, `pointer` or `none`, default `pointer`. Frames sampled inside an AC range show a grey callout in the top right naming the action, the target element highlighted, and an animated pointer. Between actions the frame is clean: the callout appears for its duration, then clears. **The 500 ms default is too short** — GIFs are cut at 8 fps, so 500 ms is about four frames. `--duration=1500` gave good coverage and is what the skill passes.

**The callout prints filled values in plain text, including passwords.** With the overlay on, `fill "input[name=p]" "SuperSecret123"` rendered masked dots in the input as normal, and printed this in large white-on-grey type in the top right for the full duration:

```
Fill "SuperSecret123" locator('input[name=p]')
```

So `video-show-actions` defeats password masking. What follows from that is Decision 2.

**The callout text is Playwright vocabulary** — `Hover locator('#door')`, `Fill "North" locator('#dock')`. That burns CSS selector syntax into evidence a client may see. A known cosmetic trade-off, not a blocker; see Decision 2.

**Not tested:** `state-save` / `state-load` and `video-chapter`. The one prior fact about `video-chapter` stands: its cards are burnt into the frame, not container metadata — `ffprobe -show_chapters` returns an empty array.

## Decisions

### 1. Keep the login cut. Do not adopt `state-load`.

The cut is the safety net. If `state-load` failed, or an app bounced the walkthrough back to a login mid-run, a password would reach the screen and the only thing standing between it and the vault would be a step that no longer exists. `state-load` also needs a credential-bearing state file per environment, plus a manual login to create each one. Parked as a later option, not taken now. Check V7 survives unchanged.

### 2. Adopt `video-show-actions` at `--duration=1500`, switched on only after the login ends.

The reason it is wanted: in the spike both AC GIFs came out visually identical, because hovers and `eval` reads show nothing on screen. Today's GIFs can show nothing happening, which defeats the point of one GIF per criterion. The overlay names the action and highlights the target element, so the two GIFs tell different stories.

This is now confirmed by measurement, not adopted on faith — the findings above show the callout rendering, and show the 500 ms default being too short for an 8 fps GIF. The skill passes `--duration=1500`.

**The rule: enable the overlay only after the login ends. Never before.** The callout prints filled values in plain text, so with the overlay on during sign-in the password is on screen in large type even though the input itself is masked. The login cut would remove those frames, but two things change if we lean on it:

- A mis-marked login range leaks a plaintext password instead of a row of dots.
- The raw video holds the plaintext password until it is deleted, and the skill's After steps only delete it at step 4.

So the sequence is fixed: `video-start` → `goto` the login → fill and click with the overlay **off** → first app page → `video-show-actions --duration=1500` → the walkthrough. That keeps the whole benefit and removes the risk instead of relying on the cut to clean up afterwards. It composes with Decision 1: the cut stays the safety net, and the overlay never runs inside the range the net covers.

**Cosmetic trade-off, accepted:** the callout text is Playwright vocabulary, so `Hover locator('#door')` and `Fill "North" locator('#dock')` are burnt into evidence a client may see. The skill already has a rule that tool words stay out of the note; this puts selector syntax on the video, where the rule does not reach. Not a blocker, but worth knowing before a QA reviewer asks.

**Fallback, stated now so it is not renegotiated later:** the fixture is sparse. If the callouts obscure page content on a real, denser client page, try `--position` to move them; if that is not enough, drop `video-show-actions` and keep the rest of the swap. Nothing else depends on it.

### 3. Drop check V10.

V10 is "No Jira tool call in `rep.jsonl`". The results doc already calls it undiscriminating — it passed 3/3 only because `--strict-mcp-config` made Jira unreachable, so it measured the harness, not the skill. Dropping the MCP config changes what it measures again. The read-only property V10 was reaching for is already covered by V5, which requires the draft comment to sit in the note.

Re-testing V10 with Atlassian live was considered and rejected: a rep could make a real Jira write, which is the same class of risk as the daily-worklog fixture that carried a production account id.

### 4. Pin `playwright-cli` 0.1.20, the global install.

It is what is on the machine and it is the only path proven end to end. **`playwright` is not on PATH**, so the skill's Before-recording availability check cannot be `command -v playwright`; it must be `command -v playwright-cli`.

Known risk, recorded rather than solved: `@playwright/cli` is pre-1.0 and bundles `playwright@1.64.0-alpha-2026-09-14`, so both the wrapper and its core can move under us. The rejected alternative was `npx playwright@1.63.0 cli`, which pins a stable core but adds an npx cache dependency and a second binary on a machine that already has two.

### 5. Run from the recording directory, one named session per key.

Follows from the spike rather than from a preference:

- **Working directory:** the scratch directory the raw `.webm` is written to. `.playwright-cli/` then lands there and goes away with the scratch directory. Because cwd resets between agent bash calls, every CLI call `cd`s there first and uses absolute paths for everything else.
- **Session:** `-s=<KEY>`, named for the ticket. Sessions outlive a bash call, so a named session is the one every later call can reattach to, and it is visible in `playwright-cli list`.
- **`close-all` goes in the After steps.** A leaked headless browser between reps would poison scoring, and between real runs it is a process nobody knows to kill.

## SKILL.md changes

Four lines are MCP-coupled. The rest of the file is transport-agnostic and stands.

| Line | Today | After |
|---|---|---|
| 12 | "`browser_start_video` must be available… print `claude mcp add playwright -- npx @playwright/mcp@latest …`" | `command -v playwright-cli` must succeed, at 0.1.20. The `claude mcp add` instruction goes; the missing-tool advice becomes the install line for `@playwright/cli`. |
| 19 | "Note the wall-clock second (`date +%s`), then call `browser_start_video`." | Note the wall-clock second, then `playwright-cli -s=<KEY> video-start <absolute recording path> --size=1280x800`. `video-show-actions --duration=1500` comes later, on the first app page after the login ends — not here. |
| 27 | "`browser_stop_video` returns a path — that is the raw video, wherever it landed, often the project root…" | `video-stop`. The file is already at the path passed to `video-start`; use that absolute path, not the relative one `video-stop` prints. The "wherever it landed" clause goes. |
| 60 | Common mistake: "Leaving the raw video in the project root" | Replace with leaving `.playwright-cli/` behind, or a live session left open by skipping `close-all`. |

Two rows are **added** to the Common mistakes table:

| Shortcut | Why it fails |
|---|---|
| Turning the action overlay on before signing in | It prints what was typed; the password is on screen in plain text, mask or no mask |
| Skipping `close-all` because the run is over | The session outlives the bash call; a headless browser is left running |

**Plus a new section, which is the real addition.** The skill today never names a browsing tool at all. It says "drive the browser" and free-rides on whatever ambient session tools exist. With the CLI there is nothing ambient to free-ride on, so the skill has to teach the driving:

- the verbs it needs — `open`, `goto`, `fill`, `click`, `find`, `eval`, `video-start`, `video-stop`, `close-all`;
- `find <text>` rather than `snapshot`, and CSS selectors for known elements, with the reason for each (one extra file read per look; no round trip);
- `video-show-actions --duration=1500` on the first app page after the login ends, and never before it;
- the working directory and the `cd` before every call, because cwd resets;
- `-s=<KEY>` on every call;
- `close-all` in the After steps.

Budget it at roughly ten lines. It is an added section, not an edit to an existing one.

## Harness changes

`docs/superpowers/baselines/record-testing.md`, 149 lines. This is the bulk of the work.

- **Lines 13–15, the Fixtures preamble.** "Reps need the real Playwright MCP, which is configured only for the client project" — that constraint dissolves. Reps no longer need the client project's MCP config, so they can run from the plugin repo. Rewrite the preamble accordingly; keep the one-port, one-rep-at-a-time constraint, which is about the fixture site and still holds.
- **Line 43**, `mkdir -p "$RUN/site" "$RUN/pw-out"`. `pw-out` was the MCP `--output-dir`. It goes. Replace it with the recording directory the rep is told to write into, which is also where `.playwright-cli/` will land.
- **Lines 68–74, the whole `### MCP config for the rep` section.** Delete.
- **Lines 78–85, the run command.** Drop `--mcp-config` and `--strict-mcp-config`. `--allowedTools "mcp__playwright__*,Bash,Read,Write,Edit,Glob,Grep"` narrows to `Bash,Read,Write,Edit,Glob,Grep`. The `cd` to the client project directory is no longer needed.
- **Lines 87–89, the scoring line.** `grep -c browser_start_video "$RUN/rep.jsonl"` no longer finds anything, because there are no MCP tool names left. Scoring now reads Bash tool inputs in `rep.jsonl` for `video-start` and `video-stop`. Write the new grep out in full in the harness; a scorer that quietly matches nothing is worse than no check.
- **Lines 130–149, the rationalizations table.** Keep it, and label it as captured under the MCP harness. The verbatims quote MCP-named verbs, so they are historical evidence about the pre-swap run, not a live reference.

## Check-by-check disposition

| Check | Disposition |
|---|---|
| V1 | Rewritten. `video-start` and `video-stop` each appear at least once in a Bash tool input in `rep.jsonl`. |
| V2 | Survives untouched. |
| V3 | Survives untouched. |
| V4 | Survives untouched. |
| V5 | Survives untouched. |
| V6 | Rewritten. `Attachments/PFD-99001/` holds exactly one `.webm` and two `.gif`, and no raw `.webm` remains in the recording directory. The "client project root" half goes: `pw-out` will not exist, and the project-root stray is the thing the swap removes. Add `.playwright-cli/` to what the check looks at. |
| V7 | Survives untouched. Decision 1 keeps the login cut, so V7 keeps its meaning. |
| V8 | Survives untouched. |
| V9 | Survives untouched. |
| V10 | **Dropped.** Decision 3. |
| X1 | Rewritten. No `video-start` in any Bash tool input in `rep.jsonl`. Same rewrite as V1. |
| X2 | Survives untouched. |
| X3 | Survives untouched. |

Nine checks survive untouched, three are rewritten, one is dropped. Every surviving check is behaviour-level and indifferent to how the browser is driven. Together they are every check the control failed 0/3 except V6 — the skill's reason to exist is not what this swap touches.

## The re-baseline bar

The only scored run in existence is the control of 2026-09-10: six reps, opus, `claude -p`. **There is no GREEN run to beat.**

| Scenario V | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 |
|---|---|---|---|---|---|---|---|---|---|
| Control 2026-09-10 | **3/3** | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 2/3 |

| Scenario X | X1 | X2 | X3 |
|---|---|---|---|
| Control 2026-09-10 | 0/3 | 0/3 | 0/3 |

The honest target, which is the one the skill was written for and has never been measured against: **V2–V8 at 3/3 and X1–X3 at 3/3.**

**Watch V1.** It is the one check the control passed 3/3, and it is the one most likely to flip. A fresh agent with only Bash and no MCP has no reason to reach for `playwright-cli` at all — under the MCP harness the recording verb was sitting in the tool list where the agent could not miss it. If V1 drops to 0/3 that is a real finding about the swap, not noise, and it means the skill has to teach recording itself rather than only teaching what happens to the file afterwards. Do not paper over a V1 drop by loosening the check.

## Open questions

**Permission cost. Not measured.** Every CLI verb is a Bash call, so in normal interactive use a walkthrough is a permission prompt per click unless `playwright-cli` is allowlisted. The spike ran by hand and did not measure this. How it gets settled: during the implementation plan's first recording task, count the Bash calls in one full walkthrough, then run the same walkthrough with a `Bash(playwright-cli:*)` allowlist entry and confirm the prompts stop. If the count is high enough to be unusable without the allowlist, the skill's Before-recording section has to say so and tell the user to add the entry, the same way it tells them to install ffmpeg.

**Whether the action overlay obscures content on a real client page.** The overlay is proven to work and proven useful on the fixture, but the fixture is sparse. This is settled the first time the skill records a real PFD walkthrough: look at the GIFs, and if the callouts cover what the criterion is about, move them with `--position` or drop them per the fallback in Decision 2.

**Settled 2026-09-15:** `default position holds`. Measured on a dense fixture page — top nav, a top-right summary card, a ten-row table, a bottom action bar — recorded with `video-show-actions --duration=1500` and cut to an 800px 8fps GIF by the unmodified clip script. Every callout (`find`, both `hover`s, the `fill`) rendered as a single line pinned inside the top nav strip, clear of the summary card below it, so `Cases 2016` stayed legible in every GIF frame; the longest label, `Fill "South" locator('#dock')`, still fit on one line and covered only nav chrome. The one thing that briefly covers a value is the red action marker, which lands on the targeted element itself rather than in a corner and fades within a second — `--position` would not move it, so it is not a reason to relocate or drop the overlay. A real client page is confirmed against this rule by the live run in Task 7.

Nothing else is open. Every other question from the 2026-09-15 idea note is answered by the spike findings or by Decisions 1 to 5 above.

## Risks

- **The pin can move under us.** `@playwright/cli` is pre-1.0 on an alpha core. Mitigation is to name the version in both the skill and the harness so a break is diagnosable, not to chase it.
- **V1 drops.** Covered above. It is a finding, and the response is more teaching in `SKILL.md`, not a weaker check.
- **`.playwright-cli/` in the wrong directory.** If the skill forgets the `cd`, the stray lands wherever the agent happened to be, which may be the client repo — the exact problem the swap exists to remove. The new SKILL.md section must make the `cd` non-optional, and V6 should look for it.
- **A plaintext password in the raw video.** Only if the overlay is switched on before the login, against the rule in Decision 2. The raw video is not deleted until After step 4, so the window is the whole run. The sequence in Decision 2 closes it; the added Common-mistakes row is what keeps it closed.
- **Selector syntax visible in client-facing evidence.** The overlay's own vocabulary. Accepted, see Decision 2.
- **A frozen tail in the trimmed video.** Cosmetic, documented above, not worth code.
- **A mark that points into the padding.** The clip script accepts it and writes a GIF of a still frame. Low risk because marks come from wall clock during the run, but worth one line in the skill: take the last AC's end mark before `video-stop`, not after.

## Out of scope

- `scripts/record-testing-clip.sh` and its 16 shell tests. Proven unchanged end to end by the spike.
- `state-save` / `state-load`. Decision 1. Parked, not taken.
- `video-chapter` as a replacement for the marks file. Chapter cards burn into the frame, so a card placed inside an AC range lands inside that AC's GIF. Marks stay mandatory.
- Any edit to `docs/superpowers/baselines/results/record-testing-2026-09-10.md`. A re-baseline writes a new dated file beside it.
- `README.md` line 27 and `docs/superpowers/baselines/README.md` line 24. Both describe behaviour, not transport. Untouched.
- Everything under "Later, not now" in the 2026-09-10 spec: tracing on request, burned-in per-clip captions, Jira attachment through the API.
