---
name: vault-gardener
description: Vault hygiene — find and fix inconsistencies before they rot the knowledge base. Use whenever the user asks to clean up, review, audit, or garden the vault, on a recurring weekly maintenance pass, or when another skill notices widespread frontmatter drift. Small inconsistencies compound; a monthly-groomed vault stays queryable, an ungroomed one quietly stops answering.
---

# Vault gardener

Follow the obsidian-vault skill's conventions. This skill runs in two strictly separated phases: **report first, change nothing; apply only what the user approves.**

## Checks (all read-only)

- Notes missing required frontmatter (`type`, `client`, `created`).
- Property values off-schema: status typos, wrong casing, dates not in ISO format, unquoted wikilinks in frontmatter.
- Meetings still `unclassified`.
- Open questions older than 14 days — stale, not wrong, but worth surfacing.
- Orphan notes: no inbound wikilinks anywhere in the vault (grep for `[[Name` across all folders).
- Broken wikilinks: targets that don't exist. Distinguish genuine breakage from person and glossary stubs waiting to be created — the latter are suggestions, not errors.
- Glossary collisions: a term existing as both a filename and another note's alias.
- Glossary coverage: capitalised terms and acronyms mentioned in ten or more notes with no glossary filename or alias. Report the top fifteen with mention counts; the project's own core vocabulary is the usual gap, because nobody looks it up.
- Private notes: bodies that say "private" or "do not share" without `visibility: private` in frontmatter. The body marker filters nothing.
- Property drift: one concept under two keys (`ticket` and `jira`, `artifact` and `artifacts`). Report both counts and name the majority form.
- Type drift: notes whose filename genre word (Handoff, Story, Spike, Runbook, Review) disagrees with `type`.
- Sync State integrity: run lines that landed below the exclusions heading, and flags in the run log that a later note has already resolved.

## Report

Group findings by severity: schema violations (break queries — fix soon), stale items (need a human decision), cosmetic. For each finding, name the file and the proposed fix. Keep it scannable; a wall of findings gets ignored.

## Applying fixes

- Batch by category and confirm each batch, not each file.
- Mechanical fixes (casing, date format, quoting) are safe to apply wholesale once approved.
- Anything judgment-shaped — merging duplicates, classifying meetings, closing stale questions — gets decided item by item with the user.
- **Never delete.** Retired notes move to the archive folder with their history intact. If the archive folder doesn't exist, create it.
- Re-run the checks after applying and confirm the findings cleared.
