# Property schema

Canonical frontmatter properties for every note type. Use these exact names and value formats — Base views and trend queries match on them literally. Adding new properties is always fine; renaming or repurposing these is not.

## Every note written by a skill

| Property | Format | Example |
|----------|--------|---------|
| `type` | one of: `daily`, `meeting`, `repo`, `person`, `question`, `decision`, `glossary`, `clipping`, `status-report`, `conflict`, `ticket`, `handoff`, `time-log`, `runbook`, `reference`, `work` | `meeting` |
| `client` | slug from config `clients` | `uscold` |
| `created` | `YYYY-MM-DD` | `2026-07-17` |
| `jira` | optional list of ticket keys | `- PFD-65810` |
| `visibility` | optional; `private` excludes the note from briefings, status reports, and trend analyses unless the user names it | `private` |

## type: meeting

| Property | Format | Notes |
|----------|--------|-------|
| `meeting_type` | value from config `meeting_types` | `standup`, `refinement`, `demo`, `working-session` |
| `date` | `YYYY-MM-DD` | the meeting date, not the sync date |
| `attendees` | list of quoted wikilinks | `- "[[Jane Smith]]"` |
| `topics` | list of plain strings | extracted at capture time; this drives trend queries |
| `source` | `granola` or `manual` | where the note came from |
| `granola_id` | string | Granola's meeting id; dedupe key. Only when `source: granola` |
| `attendees_confirmed` | `false` | present only when the roster was inferred from content rather than supplied by the source |

## type: repo

| Property | Format | Notes |
|----------|--------|-------|
| `org` | string | GitHub organization |
| `language` | string | primary language |
| `status` | `cloned`, `building`, `understood` | onboarding progress — drives the dashboard Base |
| `owners` | list of quoted wikilinks | who to ask about it |

## type: question

| Property | Format | Notes |
|----------|--------|-------|
| `status` | `open`, `answered`, `obsolete` | lowercase, single word |
| `owner` | quoted wikilink | who can answer it |
| `answered_on` | `YYYY-MM-DD` | set only when status leaves `open` |

## type: decision

| Property | Format | Notes |
|----------|--------|-------|
| `status` | `proposed`, `accepted`, `superseded` | |
| `decided_on` | `YYYY-MM-DD` | |
| `supersedes` | quoted wikilink | link to the decision this replaces, if any |

## type: ticket

One note per Jira ticket the engagement works, filename `KEY Short title.md` in the tickets folder. Handoffs, stories, spikes, and reviews for a ticket link here instead of restating its state.

| Property | Format | Notes |
|----------|--------|-------|
| `key` | string | the Jira key, e.g. `PFD-65810` |
| `epic` | string | parent key, if any |
| `status` | `draft`, `in-progress`, `review`, `done` | the vault's view, not a mirror of Jira |
| `owner` | quoted wikilink | who is driving it |

## type: handoff

| Property | Format | Notes |
|----------|--------|-------|
| `status` | `current`, `superseded` | one current handoff per ticket |
| `supersedes` | quoted wikilink | the previous handoff for the same ticket |
| `topics` | list of plain strings | |

## type: time-log

| Property | Format | Notes |
|----------|--------|-------|
| `period_start` | `YYYY-MM-DD` | |
| `period_end` | `YYYY-MM-DD` | |
| `status` | `draft`, `posted` | `posted` only when every row has a worklog id |

## type: conflict

| Property | Format | Notes |
|----------|--------|-------|
| `kind` | `claim-vs-finding`, `ruling-vs-ruling`, `goal-vs-decision` | what sort of contradiction |
| `status` | `open`, `resolved`, `obsolete` | lowercase, single word |
| `sources` | list of exactly two quoted wikilinks | new statement first, contradicted record second |
| `owner` | quoted wikilink | who can settle it |
| `resolved_on` | `YYYY-MM-DD` | set only when status leaves `open` |

## type: person

| Property | Format | Notes |
|----------|--------|-------|
| `role` | string | |
| `team` | string | |
| `owns` | list of quoted wikilinks | systems and repos they own |

## type: clipping

| Property | Format | Notes |
|----------|--------|-------|
| `source_url` | string | original URL |
| `title` | string | original page title |

## type: status-report

| Property | Format | Notes |
|----------|--------|-------|
| `period_start` | `YYYY-MM-DD` | |
| `period_end` | `YYYY-MM-DD` | |

## type: runbook

One note per workflow outcome, filename `Runbook - <what it does>.md` in the runbooks folder. Written by runbook-capture, run and updated by runbook-run, listed in `Runbooks.md` in the same folder.

| Property | Format | Notes |
|----------|--------|-------|
| `topics` | list of plain strings | |
| `repos` | list of quoted wikilinks | repo dossiers for the scripts and services involved |
| `status` | `draft`, `verified`, `retired` | draft: written, never run. verified: run clean at least once. retired: do not run |
| `last_run` | `YYYY-MM-DD` | set by runbook-run |

## type: reference

Free-form notes that other notes point at: an index, an environment sheet, a login note. No properties beyond the base trio and optional `topics` and `visibility`.

## type: work

One note per ticket per day, filename `KEY Work YYYY-MM-DD.md` (or `Work - <topic> YYYY-MM-DD.md` with no ticket) in the work folder. Rows of what changed, why, and what was decided, written by work-chart as the work happens. `Work.base` in the same folder lists them.

| Property | Format | Notes |
|----------|--------|-------|
| `jira` | list of ticket keys | the ticket worked first; empty for work with no ticket |
| `date` | `YYYY-MM-DD` | the day the work happened |
| `repos` | list of quoted wikilinks | repo dossiers touched |
| `areas` | list of plain strings | parts of the codebase touched, in the reader's words |
| `changes` | integer | number of rows in the note |

## Conventions

- Dates are always ISO `YYYY-MM-DD`, unquoted.
- Wikilinks in frontmatter must be quoted (`"[[Name]]"`) or Obsidian's YAML parser breaks.
- Lists use YAML block style (one `- item` per line), not inline arrays — easier to edit in Obsidian's properties UI and cleaner in diffs.
- Status-like values are lowercase single words so queries never fight casing.
