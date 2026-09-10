# record-testing — design

**Status: approved in brainstorming 2026-09-10. Ready for an implementation plan.**

## Goal

A skill for the `consultant-vault` plugin that records a Playwright walkthrough used as UI-testing evidence for a ticket, and leaves behind what QA and Jira need: a trimmed video, one GIF per acceptance criterion, and a test-run note with the step log, the results, and a draft comment. Recording only happens on test hosts and never includes a login.

## Why

Acceptance checks and V1-versus-V2 parity checks are done by hand through Playwright MCP, and the evidence today is screenshots and chat. A recording plus a step log is reusable in Jira comments, handoffs, and demos, and can be exported for QA by the shareable skill. The idea note from 2026-09-10 (`docs/ideas/`) leaned toward Playwright's own recording; the current Playwright MCP (0.0.80) exposes `browser_start_video` and `browser_stop_video` behind `--caps=devtools`, so recording can be per walkthrough rather than per session.

## Decisions taken in brainstorming

| Question | Decision |
|---|---|
| How the GIF is made | Real video from Playwright MCP's `browser_start_video`, converted with ffmpeg. |
| When to record | The user says "record this" or "and record it", or the walkthrough is verifying a ticket's acceptance criteria or doing a parity check. Exploring is never recorded. |
| Where it lands | One `type: test-run` note per recording in the tickets folder next to the ticket note; files in `Attachments/<KEY>/`. |
| Safety | Record only when the first page's host matches `test_hosts` in config. Login ranges are cut out of everything kept. |
| Clips | One GIF per acceptance criterion at 800 px wide and 8 frames per second, plus the trimmed WebM. |
| Shape | One skill plus a shipped script for the ffmpeg work, with shell tests. |
| Jira | Read-only. The note holds a draft comment; the user posts it and attaches the files. |
| Writing | Plain language throughout; no skill-internal words in any note. |

## Setup

"Set up recording", or the first record attempt with something missing. Each step is one line in chat.

1. The project's Playwright MCP entry needs `--caps=devtools` and `--output-dir <scratch path>`. The skill prints the exact `claude mcp add` command for the user to run, then, after a restart, confirms by checking that `browser_start_video` is available.
2. ffmpeg: the skill asks, then runs `brew install ffmpeg` on yes.
3. `Meta/Config.md` gains `test_hosts`, a list of host patterns such as `*.phenix.uat.uscold.dev` and `lptest.ewmtest.uscold.com`, and `folders.attachments: Attachments`, each added after the user confirms.

## Recording a walkthrough

**Before.** The first page's host must match a `test_hosts` pattern. No match: the walkthrough runs unrecorded and the note says which host and why. Note the wall-clock second, then call `browser_start_video`.

**During.** Every step gets one line in the step log as it happens: seconds since start, what was done in plain words, what was seen. One line per action or check, not per tool call. Acceptance criteria get marks: "AC3 starts" and "AC3 ends, pass" or "fail", with one sentence of what was seen. A login form on screen gets "login starts"; the first app page after it gets "login ends". Nothing else changes during the run.

**After.** `browser_stop_video` returns the WebM path. The skill writes the marks file and runs `scripts/record-testing-clip.sh`. The raw WebM is deleted once the trimmed one exists. Files land in `<folders.attachments>/<KEY>/`, named `<KEY> <what> <env> <date>.webm` and `<KEY> <what> <env> <date> ACn.gif`.

## The script

`scripts/record-testing-clip.sh <webm> <outdir> <marks file>`. The marks file has one line per range: `login 3 20`, `AC1 25 61`, `AC2 61 98`, seconds from the start of the video. The script:

1. Writes `<outdir>/<name>.webm` with every `login` range removed.
2. Writes one `<outdir>/<name> ACn.gif` per AC range: two-pass palette, `fps=8`, `scale=800:-1`.
3. Prints the files it wrote, one per line, and exits 0.
4. Exits 1 with one line on stderr when ffmpeg is missing, the input does not exist, a range is outside the video, or a range overlaps a login range.

Shell tests in `scripts/tests/test-record-testing-clip.sh` build a ten-second synthetic video with ffmpeg and check every case; they print "skipped, no ffmpeg" and exit 0 when ffmpeg is absent.

## The test-run note

`KEY Test Run - <what> on <env> YYYY-MM-DD.md` in `folders.tickets`. Frontmatter: `type: test-run`, base trio, `jira` with the key first, `env` (the environment name, such as `pfd-65810`), `result` as `pass`, `fail`, or `partial`, `recording` as a quoted wikilink to the trimmed WebM.

First line under the title: one sentence, what was tested, where, and the result. "AC1 to AC9 on pfd-65810: 7 pass, 2 not testable while the yard flag is on."

1. **Results** — one short section per acceptance criterion: `### AC3 — pass`, the GIF embedded with `![[…]]`, one line of what was seen. A criterion without a clip says why.
2. **Steps** — a table: when as `m:ss`, what was done, what was seen. The lines logged during the run, unchanged.
3. **Not covered** — criteria that could not be tested, one line each with the reason.
4. **Draft comment** — a blockquote for the ticket: the result sentence, one line per criterion, and which GIF to attach for each.
5. **Related** — the ticket note, the daily note, the environment's login note when one exists.

No skill words in the note: not "marks", "clip script", "devtools", "recorder".

**Links.** The ticket note gets a `## Test runs` section if missing, with one line linking the note. Daily note: `- HH:MM recorded [[KEY Test Run - …]]: 7 pass, 2 not testable`, and the key on the daily note's `jira` list.

**Shareable.** The note reads so the shareable skill can export it for QA with only wikilinks removed.

## Failure cases

One line in chat each.

- `browser_start_video` not available: say the devtools flag is missing, print the setup command, run unrecorded.
- ffmpeg missing: keep the raw WebM in the scratch folder, write the note without clips, say what to install. A WebM with a login in it never enters the vault.
- Host not in `test_hosts`: unrecorded; the note names the host.
- Recording ended by a crash or a closed browser: whatever WebM exists is cut from the marks so far; `result: partial`.
- A criterion with no marks: under Not covered, no clip.
- Two keys in one walkthrough: one note per key, one recording each; the skill asks which key a step belongs to only if it cannot tell from the criteria.

## Repo changes

1. `skills/record-testing/SKILL.md`, `skills/record-testing/templates/Test Run.md`.
2. `scripts/record-testing-clip.sh`, `scripts/tests/test-record-testing-clip.sh`.
3. `skills/obsidian-vault/references/property-schema.md`: `test-run` type with `env`, `result`, `recording`; `test-run` in the type list.
4. `skills/obsidian-vault/templates/Config.md`: `test_hosts` (empty list with one explanation bullet) and `attachments: Attachments` in `folders`.
5. `skills/vault-init/SKILL.md`: copy the test-run template.
6. `README.md`: one row, the count, and a "Scripts" line naming the clip script and its tests. `.claude-plugin/marketplace.json`: the count.
7. `skills/handoff/templates/Ticket.md`: unchanged; the skill inserts `## Test runs`.

## Testing

1. **Script**, shell tests first, as above.
2. **Record.** Harness scenario in the client project, where Playwright MCP is configured with `--caps=devtools` and `--output-dir` set for the test. A vault copy whose config has `test_hosts: ["localhost"]` and a static page served from the scratch folder on localhost with two labelled sections. Prompt: verify two acceptance criteria against the page for a named key and record it. Checks: `browser_start_video` and `browser_stop_video` both called; a test-run note with `type: test-run`, `env`, `result`, `recording`; two `### ACn` sections each embedding a GIF that exists; a Steps table whose first column is `m:ss`; a draft comment; the ticket note's Test runs line; the daily-note line; no raw WebM left outside the vault's attachments folder; no skill words.
3. **Refuse.** Same prompt with `test_hosts` empty. Checks: no video calls; the note, if written, says the host was not allowed; nothing under attachments.
4. RED three reps each without the skill, GREEN three with, scored from diffs and files.
5. **Trigger test** after reinstall: the user records a real walkthrough on a PFD environment and checks that the login is absent from both the WebM and the GIFs.

## Later, not now

- Playwright trace on request (`browser_start_tracing`), kept next to the WebM for engineers.
- Per-clip captions burned into the GIF from the step log.
- Attaching files to Jira through the API once the read-only rule has a reason to change.
