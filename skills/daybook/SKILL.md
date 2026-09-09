---
name: daybook
description: Capture engineering findings, gotchas, workarounds, and follow-ups into the daily note as the user works. Use whenever the user says "log this", "log it", "note that down", or "add to my daybook", shares a discovery worth remembering, or hits a blocker — even mid-task while working on something else. A capture is one append; never make the user re-explain something later that they told you once.
---

# Daybook

Follow the obsidian-vault skill's daily-note conventions: entries go under `## Log` in today's daily note as `- HH:MM entry text`.

## Writing an entry

- Rewrite tersely but keep the technical specifics — the exact error message, flag, version, or path is usually the whole point of logging it.
- Wikilink every repo, person, and glossary term mentioned: `[[hcserver]] won't build without the internal npm registry`.
- Blockers get a `#blocker` tag at the end of the entry.
- An entry that names a ticket key adds that key to the daily note's `jira` list (create the property if absent), so a ticket's days are a frontmatter query.
- Follow-up actions become task entries: `- [ ] chase down the registry credentials`. Weekly-status scans for both.
- Several findings in one message become separate entries — one fact per line keeps them individually linkable and greppable.
- Log what the user said, not commentary about it. No "interesting finding:" prefixes, no editorializing.

## Routing — the daily note is the spine, not the destination

Some captures belong in a dedicated note, with the log entry linking to it so the chronological record stays complete:

- A question only a colleague can answer → open-questions skill creates the question note; log `- HH:MM opened [[2026-07-17 Which org owns MDM-YMS]]`.
- New jargon or an unfamiliar acronym → glossary skill; log a line linking the term.
- A decision was made → decisions skill; log a line linking the decision note.
- Something said or found contradicts a recorded decision or finding → reconcile skill; log a line linking the conflict note.

Do the routing without asking when the category is clear; mention what you created in your reply.
