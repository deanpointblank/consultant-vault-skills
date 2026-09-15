# consultant-vault-skills

Agent skills for running a consulting engagement out of an Obsidian vault with Claude Code. Capture as you work, structure what you learn, and get synthesis back out — meetings, findings, open questions, decisions, and repo knowledge, all as plain markdown files you own.

## Skills

| Skill | What it does |
|-------|--------------|
| `obsidian-vault` | Foundation: vault resolution, config contract, file-write and frontmatter conventions. Everything else builds on this. |
| `vault-init` | One-time interactive setup: pointer file, config note, folders, default templates. |
| `granola-sync` | Pulls meetings from Granola (via its MCP) into typed, templated meeting notes. |
| `daybook` | Appends findings, gotchas, and follow-ups to the daily note as you work. |
| `open-questions` | Tracks questions for client stakeholders from capture through answer. |
| `reference-clipper` | Saves external docs and specs into the vault as clean markdown. |
| `repo-dossier` | One standardized note per client repository, populated from the local clone. |
| `glossary` | Client and domain jargon, with acronym aliases and provenance. |
| `people` | Stakeholders, roles, and ownership. Professional context only. |
| `decisions` | Lightweight ADRs with context, rejected options, and supersession chains. |
| `handoff` | End-of-session state of a ticket in a fixed shape, chained by `supersedes`, so the next session resumes cold. |
| `shareable` | External-safe copy of an internal note: wikilinks stripped, names to roles, linked both ways to its source. |
| `time-logging` | Per-day, per-ticket worklog draft reconciled against the invoice source, with evidence and soft spots. Never posts. |
| `daily-worklog` | Closes out one day: sweeps its evidence, proposes Jira worklog rows that sum to the figure you type, posts them after one confirmation, and appends them to the month's ledger. |
| `runbook-capture` | Writes a client workflow into a runbook note: inputs, numbered steps with expected output, gotchas linked to where they were learned. Keeps the runbook index. |
| `runbook-run` | Carries out a runbook step by step, confirming before each step that changes something outside the machine. Rewrites a failed step in place with a dated trace. |
| `work-chart` | One plain-language work note per ticket per day: what changed, why, what was decided. A Base over them, a `Work:` line after each batch of rows, and a Stop hook that asks for rows when the repo changed. |
| `ticket-intake` | Checks a Jira ticket against the code and the vault before work starts: what it says vs what's there, blockers with owners, a draft comment. Never writes Jira. |
| `record-testing` | Records a Playwright walkthrough that checks a ticket's acceptance criteria: a login-free video, one GIF per criterion, and a test-run note with the step log and a draft comment. Never writes Jira. |
| `reconcile` | Contradictions between what was said and what the vault records, with owner and status, surfaced before the meeting where they can be settled. |
| `meeting-trends` | Recurring topics, persistent blockers, and topic evolution across synced meetings. |
| `weekly-status` | Client-ready weekly update drafted from the week's captures. |
| `vault-gardener` | Hygiene checks and approved-only fixes. Never deletes. |

## Install

This repo is a Claude Code plugin marketplace containing one plugin, `consultant-vault`, which bundles all twenty-three skills. From Claude Code:

```
/plugin marketplace add <owner>/consultant-vault-skills
/plugin install consultant-vault@consultant-vault-skills
```

Replace `<owner>` with the GitHub org or user hosting this repo. For a private repo, your normal git credentials are used — make sure `gh auth status` is happy first. To test changes before pushing, add the marketplace from a local checkout instead:

```
/plugin marketplace add ./consultant-vault-skills
```

Skills trigger automatically from their descriptions; to invoke one by name, plugin skills are namespaced: `/consultant-vault:daybook`.

**Team setup**: to have a project prompt everyone on it to install the marketplace, add it to the repo's `.claude/settings.json` under `extraKnownMarketplaces`, with `consultant-vault@consultant-vault-skills` in `enabledPlugins`.

**Manual alternative**: copy `skills/` into `.claude/skills/` (project) or `~/.claude/skills/` (user). You lose marketplace updates, but the skills work identically.

## Updates

The plugin intentionally has no pinned `version`: every commit to this repo counts as a new version, so `/plugin update` (and background auto-update) picks up changes as they land. Before pushing, validate with `claude plugin validate .` from the repo root.

## Hooks

The plugin ships one Stop hook, `hooks/work-chart-stop.sh`. At the end of a turn it checks whether the current repo has uncommitted changes that differ from the last time work-chart wrote rows. If so it asks Claude to write the rows. It is silent when no vault is configured on the machine, when the current directory is not a client repo with a dossier in the vault, and when nothing changed. It never writes to the repo or the vault. Tests: `bash hooks/tests/test-work-chart-hook.sh`.

## Output style

The plugin ships one output style, `output-styles/plain-english.md`: action-first replies in plain English, sentences that average 15 words, everyday words, terms defined where they first appear, state restated every turn. It keeps Claude Code's coding instructions and changes only how replies read. Turn it on with `/config` → Output style → Plain English, or `"outputStyle": "Plain English"` in your settings. It covers everything the `i-have-adhd` plugin did, so disable that one if you use both. Wording test: `docs/superpowers/baselines/results/plain-english-2026-09-10.md`.

## Setup

Ask Claude Code to set up your vault (this triggers `vault-init`). It will ask for your vault path, client slug, timezone, and daily-note date format, then scaffold folders, config, and templates. Machine-specific state lives in `~/.config/vault-skills/vault-path` (or `$OBSIDIAN_VAULT`); everything else lives in your vault at `Meta/Config.md`, editable in Obsidian.

## Design principles

- **Plain file writes.** Skills write markdown directly into the vault; Obsidian picks it up instantly. Nothing requires Obsidian to be running, so scheduled syncs work headless. The Obsidian CLI is an optional nicety.
- **One config contract.** Skills never hardcode folders, clients, or formats — they read `Meta/Config.md`. Rotating clients or renaming folders is a config edit.
- **One property schema.** Every note type's frontmatter is defined in `obsidian-vault/references/property-schema.md`. Consistent properties are what make Bases dashboards and trend queries possible — and what keep notes from different consultants' setups mutually queryable.
- **Frontmatter first.** Cross-note questions scan properties before reading bodies, so the system stays fast and cheap as the vault grows.
- **Template override.** Copy any shipped template into your vault's `Templates/` folder and edit it there; skills prefer yours and updates never clobber it.
