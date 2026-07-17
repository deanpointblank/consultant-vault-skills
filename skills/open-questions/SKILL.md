---
name: open-questions
description: Track questions that need answers from client stakeholders. Use whenever the user says "open question", "need to verify", "need to ask", "not sure if/whether", or wonders about something only a colleague can answer; and whenever they ask "what's still open", "what should I ask X", or are preparing for a meeting where open questions could get answered. An unlogged question is a question asked twice.
---

# Open questions

Follow the obsidian-vault skill's conventions. One note per question in the questions folder.

## Capturing

- Filename: `YYYY-MM-DD Short question.md` — the short form should be readable as a wikilink, e.g. `2026-07-17 Which org owns MDM-YMS`.
- Frontmatter per the property schema: `status: open`, `owner` as a quoted wikilink when the user knows who can answer, `answered_on` omitted until closed.
- Body: the full question, the context that raised it, and links to where it came up (daily note, meeting note, repo).
- Add a log line to today's daily note linking the new question note.

## Answering

When the user reports an answer ("Jane confirmed the EDI repos live in the legacy org"):

1. Find the matching open question — frontmatter scan for `status: open`, then match on title and body.
2. Set `status: answered` and `answered_on`, and write the answer under an `## Answer` heading with who provided it.
3. Propagate: if the answer changes facts recorded elsewhere (a repo dossier's `org`, a glossary definition), update those notes or offer to.

If no matching question exists, capture answer and question together as a single already-answered note — the record still has value.

## Reviewing

- "What's open" → frontmatter scan for `status: open`, grouped by `owner`, oldest first. Flag anything older than two weeks.
- Before a meeting → filter open questions whose `owner` is among the attendees and present them as an ask-list.
