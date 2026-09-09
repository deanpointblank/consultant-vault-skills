---
name: decisions
description: Record architecture and project decisions in lightweight ADR style. Use whenever the user says "we decided", "log this decision", or "let's go with", when a meeting or working session produces a decision, when a proposed approach is being weighed, or when the user asks "why did we do it that way". A decision captured with its context today is the answer to "why is it like this" six months from now.
---

# Decisions

Follow the obsidian-vault skill's conventions. One note per decision, `YYYY-MM-DD Title.md`, in the decisions folder. Template: vault templates folder first, else this skill's `templates/Decision.md`.

## Recording

- Frontmatter per the property schema: `status` (`proposed` until it's actually agreed, then `accepted`), `decided_on`, `supersedes` when replacing an earlier decision.
- **Context**: the situation that forced a choice — constraints, deadlines, who was involved.
- **Options considered**: including the rejected ones and why they lost. The rejected options are the valuable part; the chosen one is usually obvious in hindsight, the rejections never are.
- **Decision**: one clear statement of what was chosen.
- **Consequences**: what this commits the team to, and any known trade-offs accepted.
- Wikilink the repos, people, and meetings involved, and add a log line to today's daily note.

## From meetings

A line under a meeting note's Decisions section that commits the team is a decision note, created during the sync or write-up, not on request afterwards. Status updates and observations stay in the meeting. The meeting's line links to the note; the note's Context links the meeting.

## Superseding

When a new decision replaces an old one: set the old note's `status: superseded`, link both directions (`supersedes` on the new, a "Superseded by" line on the old). Never edit the old decision's content to match the new reality — its value is that it records what was believed at the time.

## Answering "why did we…"

Search decision titles and bodies for the subject, prefer `accepted` over `superseded`, and answer with the decision plus its context, linking the note. If a superseded decision matches better, present the chain — the history of a reversal is usually the real answer.
