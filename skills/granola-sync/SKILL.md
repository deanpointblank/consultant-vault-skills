---
name: granola-sync
description: Pull meetings from Granola into the Obsidian vault as structured markdown notes. Use whenever the user says "sync my meetings", "pull granola", or "get today's standup into the vault", references a recent meeting that isn't in the vault yet, or when another task needs meeting content that hasn't been synced. Meetings only become searchable, linkable, and trend-analyzable once synced — when in doubt, sync.
---

# Granola sync

Follow the obsidian-vault skill's conventions for vault resolution, config, and file writes.

## Prerequisites

This skill reads meetings through the Granola MCP server. If no Granola tools are available, stop and tell the user to connect the Granola MCP for Claude Code — do not attempt to read Granola's local files; its local database is encrypted and file-level access will not work.

## Sync state

Last-sync time lives in `<vault>/Meta/Sync State.md` frontmatter as `granola_last_sync` (ISO datetime), with `granola_excluded` listing meeting ids deliberately removed from the vault; check it alongside the `granola_id` dedupe, because a deleted note cannot dedupe itself. If the file is missing, ask how far back to sync (default: 7 days). Update `granola_last_sync` only after a run that actually queried Granola.

## Per meeting

For each meeting since the last sync:

1. **Dedupe** — scan frontmatter in the meetings folder for a matching `granola_id`; skip if found.
2. **Classify** `meeting_type`. First match the title against `meeting_type_rules` in config (a list of title pattern → type). If nothing matches: standup/daily → `standup`; refinement/grooming/backlog → `refinement`; demo/review/showcase → `demo`; otherwise → `working-session`. When a title's type comes from a precedent (an earlier note, a sync-log line, your own call this run) rather than from config, add the rule to config in the same run; the sync log is not where precedents live. If genuinely ambiguous, use `unclassified` and flag it in the sync report — never block a sync on classification.
3. **Template** — use `<vault>/<folders.templates>/Meeting - <Type>.md` if present, else this skill's `templates/`. The per-type sections are what make meetings comparable over time; keep them even when a section ends up brief.
4. **Frontmatter** per the property schema: `meeting_type`, `date` (the meeting date, not today), `attendees` as quoted wikilinks, `topics`, `source: granola`, `granola_id`.
5. **Attendees** — resolve names through person notes and their `aliases`. A mistranscription that clearly maps to a known person ("Whitedoc" → Michael Wytock) is added to that person's `aliases` so the next sync resolves it without judgment; record the mapping in a transcription callout in the note. For any attendee without a person note, create a stub (`type: person`, `client`, name only). When Granola lists fewer participants than the summary names, infer the roster from the content, set `attendees_confirmed: false`, and name the inferred people in a callout. A 1:1, or a meeting carrying HR, billing, or personnel content, gets `visibility: private`.
6. **Topics** — 3 to 7 short noun phrases from the summary. These drive trend queries, so prefer stable, recurring nouns over one-off phrasing: "EDIBridge auth" rather than "the discussion about the auth problem". Reuse phrasing from earlier meetings' topics when the subject is the same.
7. **Body** — fill the template sections from Granola's summary and notes. Action items become `- [ ]` tasks. Do not paste the full transcript; summarize and note that the transcript exists in Granola. Include the transcript only on explicit request. A statement that contradicts an accepted decision or a verified finding is recorded via the reconcile skill before its callout is written, and stays out of the Decisions section. A personal fact about an attendee (out Friday, new role) goes to their person note, not the meeting body.
8. **Decisions** — every line under the meeting's Decisions section that commits the team to something (a rule, a scope boundary, an approach) becomes a decision note via the decisions skill, `status: accepted` when the room agreed it, and the meeting's line links to it. Status updates and observations are not decisions. Creating these notes is part of the sync; it is not a follow-up the user has to ask for.
9. **Write** to `<folders.meetings>/YYYY-MM-DD Title.md`, and log one line in the daily note for the meeting date linking the note.

## Report

End every sync with: how many synced, how many skipped as duplicates, and any left `unclassified` (with a one-line prompt to classify them now).

Sync State keeps one line per run under `## Runs`, above `## Excluded from sync`: date, synced count, skipped count, stubs created. Identity questions, contradictions, and corrections do not go in the run line; they go to the meeting note, a person note, or a conflict note, where a query can find them.
