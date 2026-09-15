---
name: record-testing
description: Record a Playwright walkthrough that verifies a ticket's acceptance criteria or checks V1-versus-V2 parity, and leave the evidence in the vault: a login-free video, one GIF per criterion, and a test-run note with the step log and a draft comment. Use whenever the user says "record this", "record the walkthrough", or "and record it", whenever a Playwright walkthrough is verifying acceptance criteria or doing a parity check for a ticket, and when the user says "set up recording". A check nobody can replay is a check that gets done twice.
---

# Record testing

Follow the obsidian-vault skill's conventions. One test-run note per recording, `KEY Test Run - <what> on <env> YYYY-MM-DD.md` in `folders.tickets` (key missing: `Tickets`). `<env>` is the literal host from the URL under test — `localhost`, `pfd-12345-apps`, and so on — never a paraphrase like "test" or "the test environment"; the frontmatter `env:` field repeats that exact same literal. Files in `<folders.attachments>/<KEY>/` (key missing: `Attachments`; tell the user to add it). Template: vault templates folder first, else this skill's `templates/Test Run.md`. Jira is read-only: the note holds the draft comment; the user posts it and attaches the files.

## Before recording

1. `command -v playwright-cli` must succeed, at 0.1.20 (`playwright-cli --version`). There is no `playwright` on PATH; do not check for one. Missing: say the recording needs `@playwright/cli`, print `npm install -g @playwright/cli@0.1.20`, and run the walkthrough unrecorded.
2. Driving the browser is one bash call per action — about 20 for a two-criterion walkthrough — so without an allowlist entry the user confirms every one. Say so once, before starting: add `"Bash(env -C * playwright-cli *)"` to `permissions.allow` in the project's `.claude/settings.local.json`. Run each call as `env -C <recording dir> playwright-cli …` so it is a single command and the entry matches.
3. ffmpeg must be installed (`command -v ffmpeg`). Missing: ask, then `brew install ffmpeg` on yes. On no: record anyway, keep the raw video in the scratch folder, write the note without clips, and say what to install.
4. The first page's host must match a pattern in config `test_hosts`. No match: run unrecorded; the note names the host and says why. Write nothing under `<folders.attachments>/<KEY>/` for that run — no screenshot, no video, no partial file of any kind. The note's own words are the only evidence an unlisted host gets.
5. Exploring is never recorded. Recording is for verifying acceptance criteria or a parity check for a ticket, or when the user asks.

## Driving the browser

`playwright-cli` is the browser. It is already on PATH — one verb per bash call, nothing to install. Do not `npm install playwright`, do not `npx playwright`, do not write a `.mjs` script against the npm package: that is a different tool and it cannot record.

- Make a recording directory for the run — `mkdir -p "$TMPDIR/rec-<KEY>"` — and pass it to every call: `env -C "$TMPDIR/rec-<KEY>" playwright-cli -s=<KEY> …`. Bash calls reset the working directory, and the CLI drops a `.playwright-cli/` folder into whichever one it finds; unset, that is a client repo. Everything else is an absolute path.
- `-s=<KEY>` on every call, named for the ticket. The session outlives the bash call, and `playwright-cli list` shows it.
- The run in order: `open <url>`, `video-start`, the login, `video-show-actions`, the walkthrough, `video-stop`, `close-all`. If `open` says the browser is not installed, `playwright-cli install-browser chrome`. The verbs in between are `goto`, `fill`, `click`, `find`, `eval`. Targets are CSS selectors — `fill "input[name=u]" qauser`, `click "button[type=submit]"`.
- To see the page, `find <text>`: it prints the matching nodes with `[ref=eN]` inline. `snapshot` prints the whole tree; `find` prints only what matches.
- `video-start <absolute path>.webm --size=1280x800` writes exactly where it is told. `video-stop` prints a path relative to the working directory — ignore it and use the absolute one you passed.
- On the first app page after the login ends, and never before it: `video-show-actions --duration=1500`. It names each action on screen, so one criterion's clip does not look like another's. Before the login it prints what was typed, password included.
- Take the last criterion's end mark before `video-stop`, not after. The file carries a few seconds of frozen last frame while it finalises, and a mark inside that padding gives a clip of a still.
- `close-all` at the end, always.
- `playwright-cli --help` has the rest.

## During

- Note the wall-clock second (`date +%s`), then `video-start` with an absolute path inside the recording directory, `--size=1280x800`.
- Keep a step log as you go, one line per action or check: seconds since the start, what you did in plain words, what you saw. Not one line per tool call.
- Mark each criterion: `AC3 starts` at its first step; `AC3 ends, pass` or `AC3 ends, fail: <one sentence>` at its last.
- A login form on screen: `login starts`. The first app page after it: `login ends`.
- The recording changes nothing about the walkthrough itself.

## After

1. `video-stop`, then `close-all`. The raw video is at the absolute path given to `video-start`; the path `video-stop` prints back is relative to the working directory, so ignore it. The file's last second or two is a frozen frame, which is how it finalises and not a fault.
2. Write the marks file, one range per line in seconds from the start: `login 3 20`, `AC1 25 61`.
3. Run `scripts/record-testing-clip.sh <video> <outdir> <marks>` from the plugin root (two directories above this skill's folder). It writes the video with login ranges removed and one GIF per criterion.
4. Move the outputs into `<folders.attachments>/<KEY>/` as `KEY <what> <env> <date>.webm` and `KEY <what> <env> <date> ACn.gif`. Delete the raw video. A video with a login in it never enters the vault.
5. Write the note, add a `## Test runs` line on the ticket note (create the section, and the ticket note from its template, if missing), and log `- HH:MM recorded [[KEY Test Run - …]]: <result sentence>` in the daily note with the key in its `jira` list.

## The note

Frontmatter per the property schema: `type: test-run`, `jira` with the key first, `env`, `result` as pass, fail, or partial, `recording` as a quoted wikilink to the trimmed video.

Write for a reader with 60 seconds. Everyday words. The words marks, clip script, devtools, and recorder do not appear in the note.

First line under the title: one sentence, what was tested, where, the result.

1. **Results** — `### ACn — pass` or `fail`, the GIF embedded with `![[…]]`, one line of what was seen. No clip: say why.
2. **Steps** — the table `when | what was done | what was seen`, `when` as `m:ss`. The lines from the run, unchanged.
3. **Not covered** — criteria that could not be tested, one line each with the reason.
4. **Draft comment** — a blockquote: the result sentence, one line per criterion, which GIF to attach for each.
5. **Related** — the ticket note, the daily note, the environment's login note when one exists.

## When something goes wrong

- Browser closed or crashed mid-run: stop the video if possible, cut from the marks so far, `result: partial`.
- A criterion with no marks: Not covered, no clip.
- Two keys in one walkthrough: one note and one recording per key.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Recording an exploratory session "just in case" | Files nobody wanted, with a login in them |
| Rewriting the step log afterwards from memory | The log is the evidence; the note copies it unchanged |
| Moving the raw video into the vault to save a step | The login is in it |
| Leaving `.playwright-cli/` behind in a repo | The call ran from somewhere else; the stray lands wherever it was |
| Turning the action overlay on before signing in | It prints what was typed; the password is on screen in plain text, mask or no mask |
| Skipping `close-all` because the run is over | The session outlives the bash call; a headless browser is left running |
| Keeping the sign-in in because the video should show the whole run | A password on screen; everything worth watching is there without it |
| One GIF for the whole run | Forty megabytes no Jira comment accepts; one per criterion |
| Saying the video has a part per check | It has none; each check needs its own clip |
| A note that says the checks passed, with nothing to watch | The reader has only your word for it |
| Screenshots standing in when the video fails, without saying so | The user is expecting a video; say it failed and why |
| The daily-note line as the only pointer | Findable for a day; the ticket note is where someone looks later |
| Posting the comment or attaching the files | Read-only; the user posts from the draft |
| A step per tool call | "Clicked", "typed", "snapshot" is noise; one line per action or check |
| Screenshots instead of a recording | A screenshot shows a state, not that the steps produced it |
