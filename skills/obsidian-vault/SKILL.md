---
name: obsidian-vault
description: Foundational conventions for the consultant knowledge vault in Obsidian. ALWAYS consult this skill before reading from or writing to the vault in any way — creating notes, appending to a daily note, capturing a quick thought, searching past notes, setting properties, or building Base views — even when the user doesn't mention Obsidian by name. Trigger on phrases like "log this", "note that down", "add to my vault", "check my notes", or whenever another vault skill (granola-sync, daybook, open-questions, weekly-status) is in use.
---

# Obsidian vault conventions

This skill defines how every vault skill finds, reads, and writes the user's Obsidian vault. The other skills in this collection assume these conventions; follow them exactly so a note written by one skill stays queryable by all the others.

## 1. Resolve the vault location

Machine-specific settings live outside the vault. Resolve the vault path in this order:

1. The `$OBSIDIAN_VAULT` environment variable
2. The single-line pointer file `~/.config/vault-skills/vault-path`
3. If neither exists, ask the user for the path and offer to write the pointer file

Never hardcode a vault path in any skill, script, or note.

## 2. Read the config note

All user preferences live in `<vault>/Meta/Config.md` as YAML frontmatter (see `templates/Config.md` for the schema and defaults). Read it once at the start of a task and reuse the values — don't re-read it for every operation.

The values you will need constantly:

- `folders` — where each note type lives (daily, meetings, repos, people, questions, decisions, glossary, clippings, conflicts)
- `daily_note_format` — the user's Obsidian daily-note filename format
- `active_client` — stamped as `client` on every note you create
- `meeting_types` — the allowed values for the `meeting_type` property

If the config note is missing, tell the user to run vault-init rather than guessing at conventions.

## 3. Write notes as plain files

Write markdown files directly into the vault with standard file tools. Obsidian watches the filesystem, so notes appear and get indexed immediately. Never require the Obsidian CLI or a running Obsidian instance for a write path — automations must work headless.

Rules that keep the vault coherent:

- Construct every path from config: `<vault>/<folders.meetings>/<filename>.md`.
- Every note you create starts with YAML frontmatter containing at minimum `type`, `client`, and `created`. Before writing a note type for the first time in a session, read `references/property-schema.md` and use the exact property names it defines — Base views and trend queries match on them literally.
- Filenames: `YYYY-MM-DD Title.md` for dated notes (meetings, decisions); plain `Title.md` for evergreen notes (repos, people, glossary). Avoid characters Obsidian rejects: `* " \ / < > : | ?`
- Never overwrite an existing note. If the target exists, append to it or ask.
- Daily notes: the file is `<folders.daily>/<today formatted per daily_note_format>.md`. Create it if absent. Append entries as `- HH:MM entry text` under a `## Log` heading, creating the heading if needed.
- Link entities instead of restating them: `[[EDIBridge]]`, `[[Jane Smith]]`. Backlinks are how the vault connects; a mention without a wikilink is invisible to the graph.

## 4. Read frontmatter first, bodies second

The vault will grow to hundreds of notes. When answering questions that span many notes (trends, status summaries, "what's still open"), work in two passes:

1. Scan only the YAML frontmatter of candidate files — properties are cheap and structured.
2. Read the full body of only the notes that survive the filter.

Use `grep`/`rg` scoped to the relevant config folder for text search. Never bulk-read a folder of note bodies when frontmatter can answer the question.

Skip notes with `visibility: private` when compiling briefings, status reports, or trend analyses, unless the user names the note. A grep hit inside such a note is discarded too; check the frontmatter of every file a search returns before using a line from it.

"What do I need to raise with X", pre-meeting prep, and review-before-sign-off questions start with a frontmatter scan of the questions and conflicts folders for `status: open` items owned by or naming the people involved (open-questions and reconcile skills), before any body search for the subject.

## 5. Obsidian CLI (optional enhancement)

If the `obsidian` CLI is installed (`command -v obsidian`) and the app is running, you may use it for interactive niceties — opening a freshly created note for the user, or link-aware searches. Treat it as unavailable by default: every skill must be able to complete its task with plain file operations alone. When you do use it, run `obsidian help` for the current command surface rather than relying on memorized syntax.

## Reference files

- `references/property-schema.md` — canonical frontmatter properties per note type. Read before creating any note type for the first time in a session.
- `templates/Config.md` — the config note schema with defaults. Written into the vault by vault-init; also serves as documentation of every config value.
