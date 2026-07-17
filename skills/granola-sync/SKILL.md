---
name: granola-sync
description: Pull meetings from Granola into the Obsidian vault as structured markdown notes. Use whenever the user says "sync my meetings", "pull granola", or "get today's standup into the vault", references a recent meeting that isn't in the vault yet, or when another task needs meeting content that hasn't been synced. Meetings only become searchable, linkable, and trend-analyzable once synced — when in doubt, sync.
---

# Granola sync

Follow the obsidian-vault skill's conventions for vault resolution, config, and file writes.

## Prerequisites

This skill reads meetings through the Granola MCP server. If no Granola tools are available, stop and tell the user to connect the Granola MCP for Claude Code — do not attempt to read Granola's local files; its local database is encrypted and file-level access will not work.

## Sync state

Last-sync time lives in `<vault>/Meta/Sync State.md` frontmatter as `granola_last_sync` (ISO datetime). If the file is missing, ask how far back to sync (default: 7 days). Update it only after a successful run.

## Per meeting

For each meeting since the last sync:

1. **Dedupe** — scan frontmatter in the meetings folder for a matching `granola_id`; skip if found.
2. **Classify** `meeting_type` from the title and calendar context: standup/daily → `standup`; refinement/grooming/backlog → `refinement`; demo/review/showcase → `demo`; otherwise → `working-session`. If genuinely ambiguous, use `unclassified` and flag it in the sync report — never block a sync on classification.
3. **Template** — use `<vault>/<folders.templates>/Meeting - <Type>.md` if present, else this skill's `templates/`. The per-type sections are what make meetings comparable over time; keep them even when a section ends up brief.
4. **Frontmatter** per the property schema: `meeting_type`, `date` (the meeting date, not today), `attendees` as quoted wikilinks, `topics`, `source: granola`, `granola_id`.
5. **Attendees** — for any attendee without a person note, create a stub (`type: person`, `client`, name only). Stubs let backlinks accumulate before anyone fills in details.
6. **Topics** — 3 to 7 short noun phrases from the summary. These drive trend queries, so prefer stable, recurring nouns over one-off phrasing: "EDIBridge auth" rather than "the discussion about the auth problem". Reuse phrasing from earlier meetings' topics when the subject is the same.
7. **Body** — fill the template sections from Granola's summary and notes. Action items become `- [ ]` tasks. Do not paste the full transcript; summarize and note that the transcript exists in Granola. Include the transcript only on explicit request.
8. **Write** to `<folders.meetings>/YYYY-MM-DD Title.md`.

## Report

End every sync with: how many synced, how many skipped as duplicates, and any left `unclassified` (with a one-line prompt to classify them now).
