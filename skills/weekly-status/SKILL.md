---
name: weekly-status
description: Draft a client-ready weekly status update from the week's daily notes, meetings, decisions, and questions. Use whenever the user asks for a status update or client report, "what did I do this week", or an end-of-week or end-of-sprint summary — and when they ask what's slipping or what to flag to the client.
---

# Weekly status

Follow the obsidian-vault skill's conventions. Default period: Monday through today; confirm the range before drafting.

## Gathering (frontmatter first)

- **Daily notes** in range: `## Log` entries, `#blocker` tags, and tasks — separating completed (`- [x]`) from open.
- **Meetings** in range: frontmatter only (types, topics, dates); open bodies only when a specific item needs detail.
- **Decisions** with `decided_on` in range.
- **Questions** opened and answered in range.
- Filter everything to `client: <active_client>` — a co-worker mid-rotation between engagements will thank you.

## Drafting

Sections: **Summary** (2-3 sentences), **Completed**, **In progress**, **Blockers and risks**, **Next week**.

Client-ready means:

- Outcome-oriented: "EDI integration environment now builds locally" rather than "fought npm registry auth for two days" — though persistent blockers do get named plainly in the blockers section.
- No internal shorthand: expand wikilinks to plain names, translate jargon using the glossary's definitions, spell out acronyms on first use.
- Honest: nothing in the vault supports a claim, the claim doesn't go in. Gaps in the record become "not captured" rather than invented progress.

## Delivering

Show the draft in chat for edits. On approval, save two renditions if the user wants a record: the vault copy in the status folder as `YYYY-MM-DD Status.md` (`type: status-report`, `period_start`, `period_end`, wikilinks intact) and a plain-text version with links stripped for pasting into email or Slack.
