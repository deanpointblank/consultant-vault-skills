---
name: shareable
description: Produce an external-safe copy of an internal vault note for a client stakeholder, another team, or anyone without the vault. Use whenever the user says "make a version I can send", "shareable", "for Heiko", "Bobby will see it", "strip the internal stuff", or asks to export, forward, or publish a note outside the engagement team. The internal note and its export drift apart the moment they are two hand-edited files.
---

# Shareable

Follow the obsidian-vault skill's conventions. The export is a second note next to the source, never an edit of the source.

## The transform

Filename: the source filename with ` - Shareable` inserted before the date, or appended if there is no date: `Feeder Options - Shareable 2026-09-02.md`.

Frontmatter: copy the source's, then set `audience: external`, `source` as a quoted wikilink to the source note, and `recipients` as a list of plain names. Body opens with one callout naming the source and saying the callout is vault-only and gets dropped when the text is sent.

Then, in order:

1. Every `[[wikilink]]` becomes plain text. Things the reader has access to (repos, tickets, table names) keep their names; things they do not (vault notes, meeting notes) are restated in a clause or dropped.
2. Names of engagement-team members become roles: "the Stride lead", "the principal engineer", "the author". Client staff the recipient knows may stay by name.
3. Internal planning references go: lane and backlog codes, sprint-internal sequencing, tool or AI attribution, links to artifacts or exports.
4. Interactive or vault-specific language (toggle, board, artifact) becomes static prose.
5. Substance is unchanged: same headings, same options, same numbers. Anything added (a "since then" note) is dated and marked as added.
6. Run the check before finishing: a grep of the body for `[[`, the engagement firm's name, team-member first names, and the artifact host returns nothing outside the opening callout. Say in the reply that it ran and what it found.

## After

- The source note gains one line at the end: "Shareable copy: [[...]]" so the pair is linked both ways.
- Log a line in today's daily note.
- When the source changes later, regenerate the export from the source rather than patching it; the callout's date says which version it reflects.
