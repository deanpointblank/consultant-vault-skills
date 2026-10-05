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
  conflicts: Conflicts
  runbooks: Runbooks
  work: Work
  tickets: Tickets
  status: Status
  archive: Archive
  templates: Templates
daily_note_format: YYYY-MM-DD
meeting_types:
  - standup
  - refinement
  - demo
  - working-session
meeting_type_rules:
  - match: "Sprint Planning"
    type: refinement
  - match: "Huddle"
    type: working-session
timezone: America/New_York
jira_site:
worklog:
  account_id:
  git_author:
  github_login:
  day_window: "09:00-17:00"
  billing_unit: 1.0
  ceremony_ticket:
  engagement_epic:
  internal_meetings: []
  repos: []
  transcript_dirs:
    - ~/.claude/projects
worklog_routing: []
work_roots: []
harvest:
  project_id:
  billable_task_id:
  pto_task_id:
---

# Vault config

Skills read the frontmatter above at the start of every task. Edit values here, in Obsidian — never inside a skill.

- `active_client` — stamped as `client` on every note a skill creates. Change it when you rotate engagements, and keep the old slug in `clients` so past notes stay queryable.
- `folders` — rename these to match your vault. Skills construct every path from these values, so a rename here is all it takes to restructure.
- `folders.runbooks` — runbooks and their index. runbook-capture writes here; runbook-run reads and updates.
- `folders.work` — one work note per ticket per day, plus `Work.base`. work-chart writes here; handoff reads it.
- `work_roots` — the folders whose work goes in the work chart, one per line under the key (`  - ~/Code/StrideClients/UsCold`); a leading `~` is your home folder. Work in any repo or file inside one of them counts, wherever Claude Code was started. Empty: only the vault folder counts. Setup suggests the folder that holds the vault's repo and the client repos beside it.
- `daily_note_format` — must match Settings → Daily notes → Date format in Obsidian, otherwise skill-written entries and app-created daily notes land in different files.
- `meeting_types` — the allowed values for `meeting_type` on meeting notes. Keep the list short: trends are computed within a type, so two names for the same kind of meeting splits your data.
- `meeting_type_rules` — title substrings that decide `meeting_type` before any guessing. granola-sync adds a rule the first time it settles a recurring title, so precedents live here.
- `timezone` — used when constructing daily-note filenames and timestamps from automations that may run in UTC.
- `folders.tickets` — ticket notes, handoffs, and time-logging drafts. Skills that wrote to `Tickets` before this key existed keep working; add the key so they stop telling you to.
- `jira_site` — the Atlassian site skills read Jira from, e.g. `acme.atlassian.net`. ticket-intake fills it in the first time you confirm a site; daily-worklog requires it and resolves the cloud id from it once per run.
- `worklog` — everything daily-worklog needs that is specific to one person or one engagement. `account_id` is the Jira account whose worklogs and activity it reads and writes, one account only; `git_author` is the `git log --author` filter; `github_login` is the account whose PR reviews, review comments and merges count as yours; `day_window` is the working window used when you give no hours, and the hours it covers are the day's billed figure (an older config with only `day_start` gets `day_start` plus 8 hours); `billing_unit` is the block size in hours that sets the day total's unit and the grid the day is filled on, while rows still go in 0.25 h steps; `ceremony_ticket` is where standup, huddle, refinement and retro hours go; `engagement_epic` is where engagement-level discovery with no single ticket goes; `internal_meetings` is the list of title matches for your own consultancy's events, which never go on the ceremony ticket; `repos` is the list of clones swept by `git log`, and a path with no clone is named in the reply and skipped; `transcript_dirs` is where Claude Code session transcripts live, read for timing only.
- `harvest` — where daily-worklog writes the day's Harvest entry. `project_id` is the Harvest project, `billable_task_id` the task for a working day, `pto_task_id` the task for PTO. Empty: daily-worklog finds them from your recent entries and offers to fill them in.
- `worklog_routing` — ordered client-specific rules, each a `match` string tested case-insensitively against the evidence text and a `ticket` key it routes to. Empty by default. Do not restate the ceremony or epic rules here; they are named keys.

To customize a note template, copy it from the skill's `templates/` folder into your vault's `Templates/` folder and edit it there. Skills check your vault first and fall back to the shipped default, so updates to the skills never clobber your changes.
