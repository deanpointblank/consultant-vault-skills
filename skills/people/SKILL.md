---
name: people
description: Maintain notes on client stakeholders and what they own. Use whenever a new person is mentioned, the user learns someone's role, team, or ownership, asks "who owns X" or "who do I ask about X", or is preparing for a meeting and wants context on the attendees. Other skills create bare person stubs; use this skill to enrich them.
---

# People

Follow the obsidian-vault skill's conventions. One evergreen note per person, filename equal to their full name, in the people folder.

## Scope — professional context only

Record role, team, ownership, and work context. Do not record personal details, opinions about the person, or anything the user wouldn't want the person to read — these notes get shared with co-workers on the same engagement.

## Creating and enriching

- Frontmatter per the property schema: `role`, `team`, `owns` as a list of quoted wikilinks to repos and systems.
- `aliases` holds every spelling a transcript has produced for the person ("Whitedoc", "Fatima"); granola-sync adds them as it resolves mistranscriptions, and the empty declared list is worth filling for anyone whose name Granola gets wrong.
- Stubs created by granola-sync (name only) get enriched here as facts arrive — every "Jane owns the Keycloak setup" mentioned in passing is an `owns` entry.
- Body: how to reach them, working context (timezone, availability patterns if relevant), and links to meetings they've attended (backlinks handle most of this automatically).

## Answering "who owns X" / "who do I ask about X"

1. Frontmatter scan of the people folder for `owns` containing X.
2. If nothing matches, check backlinks: who appears in X's dossier, and who attended meetings where X was a topic.
3. If still nothing, say the vault doesn't know — and offer to open a question via the open-questions skill, because "who owns X" is itself a classic open question.

## Pre-meeting briefing

Given a meeting's attendees: for each person, their role, team, what they own, any open questions they're the `owner` of, and any open conflicts they own or appear in (reconcile skill) — the ask-list writes itself.
