---
name: reconcile
description: Track contradictions between what someone says and what the vault already records. Use whenever a meeting write-up, daybook capture, or document review would add a "conflicts with", "contradicts", or "needs reconciling" callout; when a stated plan or sprint goal contradicts an accepted decision; when a claim contradicts a verified finding; when two meetings reached different rulings; or when the user asks "what do I need to raise with X", "what's still unresolved", or is preparing for a review or sign-off. A contradiction noted only in a callout is found again by accident.
---

# Reconcile

Follow the obsidian-vault skill's conventions. One note per contradiction in the conflicts folder (`folders.conflicts`; if the key is missing, use `Conflicts`, create it, and tell the user to add the key to `Meta/Config.md`). Template: vault templates folder first, else this skill's `templates/Conflict.md`.

## The record

A contradiction is recorded the moment it is noticed, before any callout is written. The note is what makes it findable later; a callout is not.

Filename: `YYYY-MM-DD Short statement of the conflict.md` — e.g. `2026-09-10 Timestamps at rest - local per Ray vs UTC per 08-27 huddle`.

Frontmatter per the property schema:

- `kind` — `claim-vs-finding` (an assertion the vault has verified otherwise), `ruling-vs-ruling` (two meetings or decisions disagree), or `goal-vs-decision` (a plan or sprint goal contradicts an accepted decision)
- `sources` — exactly two quoted wikilinks: the note carrying the new statement first, the note it contradicts second
- `owner` — who can settle it: the person who made the newer statement, or whoever the notes assign to confirm it
- `jira` — ticket keys involved, if any
- `status: open`

Body sections, in order: **Statement** (what was said, by whom, where), **Record** (what the vault says, linked), **Why it matters** (what breaks if unresolved, and by when), **Resolution** (empty until closed).

## While writing up a meeting or capture

- Write the conflict note first; the meeting note's callout links to it: `> [!warning] Conflicts with the record — see [[2026-09-10 Timestamps at rest - local per Ray vs UTC per 08-27 huddle]]`.
- A statement that contradicts an accepted decision or a verified finding goes under **Notes**, never under **Decisions**. The newer statement is not the current one until the conflict closes.
- A `- [ ]` action to "confirm" or "settle" it is fine if real, but the conflict note carries the state; the checkbox does not.
- Log a line in today's daily note linking the conflict note.

## Surfacing

For "what do I need to raise with X", a pre-meeting briefing, or a review before sign-off:

1. Frontmatter scan of the conflicts folder for `status: open`.
2. Keep those where `owner` is among the attendees, or either `sources` note lists an attendee, or — for a document review — either source concerns the document.
3. Present oldest first, each with both sources linked and its **Why it matters** line. Every conflict that survives the filter appears, even in a short answer: collapse to one line each rather than dropping any.

Do the scan before any body grep for the subject. Conflicts that bear on a document are rarely tagged with its name; grep finds sources after the scan, not instead of it.

## Closing

- Statement was right → supersede the contradicted decision via the decisions skill, or add a dated correction under its own heading to the finding's note. Set `status: resolved`, `resolved_on`, and fill **Resolution** with who settled it and how.
- Statement was wrong → `status: resolved`, **Resolution** records the correction, and the note that carried the statement gets one line pointing at the conflict.
- No longer matters → `status: obsolete` with one line why.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| "Added a callout beside it rather than rewriting history" | The choice is not callout vs rewrite. It is note plus callout. A callout alone is invisible to every query. |
| "Treated the newer statement as current" | Newer is not settled. Listing it under Decisions resolves the conflict silently in one side's favour. |
| "Gave you an action to settle it" | A checkbox has no owner property, no sources, and scrolls away with the meeting. |
| "Grepped for the document name and opened the hits" | Finds only conflicts written into notes about that subject. The ones filed under the topic they are actually about never surface. |
