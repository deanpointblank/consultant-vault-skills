---
name: handoff
description: Write the end-of-session state of a ticket so the next session, human or agent, can resume cold. Use whenever the user says "write the handoff", "hand this off", "where are we on", "so I can pick it up tomorrow", or ends a working session on a ticket with pull requests, branches, rulings, or gated items in flight. A handoff that lives only in chat is gone by morning.
---

# Handoff

Follow the obsidian-vault skill's conventions. One note per session per ticket, filename `KEY Handoff - Topic YYYY-MM-DD.md`, in the tickets folder next to the ticket note (`folders.tickets`; if the key is missing, use `Tickets`, create it, and tell the user to add the key). Template: vault templates folder first, else this skill's `templates/Handoff.md`.

## The record

Frontmatter per the property schema: `type: handoff`, `jira` (the ticket key first, related keys after), `status: current`, `supersedes` as a quoted wikilink to the previous handoff for the same ticket, `topics`.

Body sections, in this order. Keep the headings; leave a section as one line saying "none" rather than dropping it.

1. **Where things stand** — one bold paragraph: what shipped, what is blocked, what the next person does first.
2. **Where everything is** — a table, not prose: pull requests with numbers and head SHAs, branches, worktrees, migration versions, Jira comment ids, the story doc path. Everything someone would otherwise have to rediscover.
3. **Test gate** — the literal counts and whether they were green, per repo.
4. **Rulings made on the user's behalf** — every decision taken without the person who normally decides, each with its rationale and what reversing it costs. Each one is also a `proposed` decision note via the decisions skill; this section links them.
5. **Gated** — what is waiting on someone else, one line each, naming the person. An answer given to a colleague without checking is an open question note owned by the person who should have answered, linked here.
6. **Pick-up list** — numbered, one action per line, in the order to do them.
7. **Related** — one line of wikilinks: the ticket note, the daily note, the previous handoff, the people involved.

## The chain

- Set `supersedes` to the previous handoff for the ticket and set that note's `status: superseded`. The previous note keeps its content; only its status changes.
- If no ticket note exists for the key, create one from the ticket template (`type: ticket`) with the key, summary, and a link to this handoff, so every handoff for the ticket is reachable from one place.
- Log a line in today's daily note linking the handoff.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Narrative in place of the table | The next reader greps for a SHA and finds a sentence |
| Rulings folded into "what happened today" | A decision nobody ratified reads as a fact by next week |
| "Said yes to Fatema, will confirm" as a line item | Nothing tracks it; the question note does |
| New frontmatter keys for this note (`decided_by`, `ratified_by`) | Every invented key is one more the gardener has to reconcile |
