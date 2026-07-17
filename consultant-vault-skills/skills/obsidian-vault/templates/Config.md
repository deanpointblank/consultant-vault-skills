---
type: config
active_client: uscold
clients:
  - uscold
folders:
  daily: Daily
  meetings: Meetings
  repos: Repos
  people: People
  questions: Questions
  decisions: Decisions
  glossary: Glossary
  clippings: Clippings
  status: Status
  archive: Archive
  templates: Templates
daily_note_format: YYYY-MM-DD
meeting_types:
  - standup
  - refinement
  - demo
  - working-session
timezone: America/New_York
---

# Vault config

Skills read the frontmatter above at the start of every task. Edit values here, in Obsidian — never inside a skill.

- `active_client` — stamped as `client` on every note a skill creates. Change it when you rotate engagements, and keep the old slug in `clients` so past notes stay queryable.
- `folders` — rename these to match your vault. Skills construct every path from these values, so a rename here is all it takes to restructure.
- `daily_note_format` — must match Settings → Daily notes → Date format in Obsidian, otherwise skill-written entries and app-created daily notes land in different files.
- `meeting_types` — the allowed values for `meeting_type` on meeting notes. Keep the list short: trends are computed within a type, so two names for the same kind of meeting splits your data.
- `timezone` — used when constructing daily-note filenames and timestamps from automations that may run in UTC.

To customize a note template, copy it from the skill's `templates/` folder into your vault's `Templates/` folder and edit it there. Skills check your vault first and fall back to the shipped default, so updates to the skills never clobber your changes.
