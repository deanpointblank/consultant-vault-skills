---
name: glossary
description: Maintain a glossary of client and domain jargon. Use whenever an unfamiliar acronym or internal term appears in any context, the user asks "what does X mean" or says "add X to the glossary", or a meeting or daybook capture contains a term the vault doesn't know yet. Client platforms and logistics domains are acronym-dense; a term captured once saves every future lookup.
---

# Glossary

Follow the obsidian-vault skill's conventions. One evergreen note per term in the glossary folder.

## Creating a term

- Filename: the expanded name when known (`Yard Management System.md`), with the acronym in frontmatter `aliases: [YMS]` — Obsidian aliases make `[[YMS]]` resolve to the full note.
- Before creating, check both existing filenames and existing aliases; a term already captured under its expansion must not be duplicated under its acronym.
- Frontmatter: `type: glossary` plus the standard properties.
- Body order matters: a one-sentence definition first (that's what shows in hover previews), then detail, then **Where encountered** with links to the meetings, repos, or docs it came from, then **Related terms** as wikilinks.
- When the client's internal meaning differs from the industry meaning, say both explicitly — "at this client, X means…" is exactly the kind of knowledge that evaporates between engagements.

## Honesty rule

If the meaning is inferred from context rather than confirmed, mark the definition "unconfirmed" and offer to open a question via the open-questions skill. A confidently wrong glossary is worse than none.

## Answering "what does X mean"

Check the glossary (names and aliases) before answering from general knowledge, and prefer the vault's client-specific definition when both exist. If the term isn't captured, answer if you can — and capture it.
