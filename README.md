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
| `meeting-trends` | Recurring topics, persistent blockers, and topic evolution across synced meetings. |
| `weekly-status` | Client-ready weekly update drafted from the week's captures. |
| `vault-gardener` | Hygiene checks and approved-only fixes. Never deletes. |

## Install

This repo is a Claude Code plugin marketplace containing one plugin, `consultant-vault`, which bundles all thirteen skills. From Claude Code:

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

## Setup

Ask Claude Code to set up your vault (this triggers `vault-init`). It will ask for your vault path, client slug, timezone, and daily-note date format, then scaffold folders, config, and templates. Machine-specific state lives in `~/.config/vault-skills/vault-path` (or `$OBSIDIAN_VAULT`); everything else lives in your vault at `Meta/Config.md`, editable in Obsidian.

## Design principles

- **Plain file writes.** Skills write markdown directly into the vault; Obsidian picks it up instantly. Nothing requires Obsidian to be running, so scheduled syncs work headless. The Obsidian CLI is an optional nicety.
- **One config contract.** Skills never hardcode folders, clients, or formats — they read `Meta/Config.md`. Rotating clients or renaming folders is a config edit.
- **One property schema.** Every note type's frontmatter is defined in `obsidian-vault/references/property-schema.md`. Consistent properties are what make Bases dashboards and trend queries possible — and what keep notes from different consultants' setups mutually queryable.
- **Frontmatter first.** Cross-note questions scan properties before reading bodies, so the system stays fast and cheap as the vault grows.
- **Template override.** Copy any shipped template into your vault's `Templates/` folder and edit it there; skills prefer yours and updates never clobber it.
