# Property schema

Canonical frontmatter properties for every note type. Use these exact names and value formats — Base views and trend queries match on them literally. Adding new properties is always fine; renaming or repurposing these is not.

## Every note written by a skill

| Property | Format | Example |
|----------|--------|---------|
| `type` | one of: `meeting`, `repo`, `person`, `question`, `decision`, `glossary`, `clipping`, `status-report` | `meeting` |
| `client` | slug from config `clients` | `uscold` |
| `created` | `YYYY-MM-DD` | `2026-07-17` |

## type: meeting

| Property | Format | Notes |
|----------|--------|-------|
| `meeting_type` | value from config `meeting_types` | `standup`, `refinement`, `demo`, `working-session` |
| `date` | `YYYY-MM-DD` | the meeting date, not the sync date |
| `attendees` | list of quoted wikilinks | `- "[[Jane Smith]]"` |
| `topics` | list of plain strings | extracted at capture time; this drives trend queries |
| `source` | `granola` or `manual` | where the note came from |
| `granola_id` | string | Granola's meeting id; dedupe key. Only when `source: granola` |

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

## Conventions

- Dates are always ISO `YYYY-MM-DD`, unquoted.
- Wikilinks in frontmatter must be quoted (`"[[Name]]"`) or Obsidian's YAML parser breaks.
- Lists use YAML block style (one `- item` per line), not inline arrays — easier to edit in Obsidian's properties UI and cleaner in diffs.
- Status-like values are lowercase single words so queries never fight casing.
