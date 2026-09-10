---
name: record-testing
description: Record a Playwright walkthrough that verifies a ticket's acceptance criteria or checks V1-versus-V2 parity, and leave the evidence in the vault: a login-free video, one GIF per criterion, and a test-run note with the step log and a draft comment. Use whenever the user says "record this", "record the walkthrough", or "and record it", whenever a Playwright walkthrough is verifying acceptance criteria or doing a parity check for a ticket, and when the user says "set up recording". A check nobody can replay is a check that gets done twice.
---

# Record testing

Follow the obsidian-vault skill's conventions. One test-run note per recording, `KEY Test Run - <what> on <env> YYYY-MM-DD.md` in `folders.tickets` (key missing: `Tickets`). Files in `<folders.attachments>/<KEY>/` (key missing: `Attachments`; tell the user to add it). Template: vault templates folder first, else this skill's `templates/Test Run.md`. Jira is read-only: the note holds the draft comment; the user posts it and attaches the files.

## Before recording

1. `browser_start_video` must be available. Missing: say the Playwright MCP entry needs `--caps=devtools` and `--output-dir <scratch>`, print `claude mcp add playwright -- npx @playwright/mcp@latest --ignore-https-errors --caps=devtools --output-dir <scratch>`, and run the walkthrough unrecorded.
2. ffmpeg must be installed (`command -v ffmpeg`). Missing: ask, then `brew install ffmpeg` on yes. On no: record anyway, keep the raw video in the scratch folder, write the note without clips, and say what to install.
3. The first page's host must match a pattern in config `test_hosts`. No match: run unrecorded; the note names the host and says why.
4. Exploring is never recorded. Recording is for verifying acceptance criteria or a parity check for a ticket, or when the user asks.

## During

- Note the wall-clock second (`date +%s`), then call `browser_start_video`.
- Keep a step log as you go, one line per action or check: seconds since the start, what you did in plain words, what you saw. Not one line per tool call.
- Mark each criterion: `AC3 starts` at its first step; `AC3 ends, pass` or `AC3 ends, fail: <one sentence>` at its last.
- A login form on screen: `login starts`. The first app page after it: `login ends`.
- The recording changes nothing about the walkthrough itself.

## After

1. `browser_stop_video` returns a path — that is the raw video, wherever it landed, often the project root rather than the folder you asked for.
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
| Leaving the raw video in the project root | The login is in it, and it is not in the vault |
| Keeping the sign-in in because the video should show the whole run | A password on screen; everything worth watching is there without it |
| One GIF for the whole run | Forty megabytes no Jira comment accepts; one per criterion |
| Saying the video has a part per check | It has none; each check needs its own clip |
| A note that says the checks passed, with nothing to watch | The reader has only your word for it |
| Screenshots standing in when the video fails, without saying so | The user is expecting a video; say it failed and why |
| The daily-note line as the only pointer | Findable for a day; the ticket note is where someone looks later |
| Posting the comment or attaching the files | Read-only; the user posts from the draft |
| A step per tool call | "Clicked", "typed", "snapshot" is noise; one line per action or check |
| Screenshots instead of a recording | A screenshot shows a state, not that the steps produced it |
