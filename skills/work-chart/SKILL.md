---
name: work-chart
description: Keep a plain-language record of coding work as it happens, one note per ticket per day: what changed, why, and what was decided. Use whenever code changed in this session and a task finished, tests ran, or a commit was made; whenever a Stop hook reports "Files changed since the last work-chart rows"; whenever the user asks "what did you just do", "why did you change X", or "explain that diff"; and when the user says "set up the work chart". Work nobody wrote down is work the developer cannot explain tomorrow.
---

# Work chart

Follow the obsidian-vault skill's conventions. One note per ticket per day in `folders.work` (key missing: run Setup below first). Filename `KEY Work YYYY-MM-DD.md`; no ticket: `Work - <topic> YYYY-MM-DD.md`. Template: vault templates folder first, else this skill's `templates/Work.md`.

## When rows get written

- A task finished, tests ran, a commit was made, or the user changed subject: write rows for everything since the last row.
- A plan task completed under subagent-driven development: the controller writes the rows from the subagent's report. Subagents never write this note.
- The Stop hook said "Files changed since the last work-chart rows": write the rows, then print the Work line.

Write the rows; do not offer to write them.

## One row per change

Frontmatter per the property schema: `type: work`, `jira` with the ticket first, `date`, `repos` as quoted wikilinks, `areas` as plain words for the parts of the codebase touched ("migration loader", "appointment details API"), `changes` equal to the row count.

First line under the title: one sentence saying what the day's work on this ticket was about. Rewrite it as rows are added.

One table: `when | what | why | decided`.

- One row per logical change (a fix, a refactor, a plan task) or per investigation that concluded something. Not per turn, per file, or per commit.
- `what`: the repo and path of what changed, and the commit when there is one. No code change: start with "Read" and end with "nothing changed".
- `why`: one sentence in the reader's words. The reason, not the ticket key.
- `decided`: the call and its reason, or "none". A call that constrains future work or a reviewer would question also becomes a `proposed` decision note through the decisions skill; the cell links it.
- Everyday words. The words session, ledger, hook, stamp, and controller do not appear in the note.

After writing: update the first line, `changes`, `areas`, `repos`. Daily note: `- HH:MM work on [[KEY Work YYYY-MM-DD]]: N changes`, once per work note per day, then edit the count in place; add the key to the daily note's `jira` list. Record the stamp: run `hooks/work-chart-stamp.sh <repo path>` from the plugin root, which is two directories above this skill's folder. Then end the reply with the Work line:

`Work: <N> changes today on <KEY or topic>; last: <newest row's what, first clause>`

## Answering "what did you just do"

What, why, where to read more; at least three lines. Cite the work note as a wikilink — `[[PFD-65947 Work 2026-09-10]]`, not a file path — so the reader can open it. No rows yet: write them first, then answer.

## Setup

"Set up the work chart", or a first write with no `folders.work` key. Setup creates the place the rows live; it is not a chart over notes that already exist.

1. Add `work: Work` under `folders` in `Meta/Config.md` after the user confirms.
2. Create the folder.
3. Copy this skill's `templates/Work.base` to `<folders.work>/Work.base` unless one exists.
4. Create `~/.config/vault-skills/work-stamp/`.
5. Say in one line whether the plugin's Stop hook is present (`hooks/hooks.json` at the plugin root). Absent: rows are written at pauses only.

The hook is silent unless a vault is configured and the current repo has a dossier; say so when a repo has none.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| One row per file | The reader wants "added the migration", not six paths |
| `why` restates the ticket | The key is in the frontmatter; the reason is what the diff cannot give back |
| "decided: none" on a call a reviewer would question | The handoff's rulings section and the decisions folder both miss it |
| Rows only at the end of the session | The rows should exist before the developer asks, not after |
| Offering instead of writing — "tell me if you want this logged there" | Nothing gets recorded, and the reasoning is gone by the next turn |
| A daybook line instead of a work note | The daily note is the spine; the rows live in the work note it links |
| Skipping the stamp | The hook asks for the same rows again at the next stop |
| A subagent writing its own rows | Two writers, one note; the controller has the report and the diff |
| A last line like "worth a `chmod +x` if it's meant to be run directly" | Caveats go above the Work line, which goes last |
| Citing the note as a path — "from `vault/Work/PFD-65947 Work 2026-09-10.md`" | Nothing to click; `[[PFD-65947 Work 2026-09-10]]` opens it |
| "I read it as 'a chart of my work' and built the Bases dashboard" | A chart at the vault root over notes nobody has written yet; Setup comes first |
| "The term appears nowhere in the vault … so I inferred it from state" | Half-finished files in the vault are not the request; Setup is |
| Guessing, then offering a redo — "say so and I'll redo it" | One question before building beats one rebuild after |
| Adding `work: Work` to `Meta/Config.md` before the user says yes | It is the user's config; step 1 asks, then edits |
