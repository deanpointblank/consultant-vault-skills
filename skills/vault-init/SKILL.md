---
name: vault-init
description: One-time setup that scaffolds an Obsidian vault for the consultant-vault-skills collection. Use whenever someone is setting up these skills for the first time, says "set up my vault", "initialize the vault skills", or "onboard me", reports that the config note is missing, or when any vault skill fails because expected folders or config don't exist.
---

# Vault init

Scaffold everything the other vault skills depend on. When this finishes, every other skill in the collection should work without further setup.

## 1. Locate the vault

Ask for the vault path if `$OBSIDIAN_VAULT` and `~/.config/vault-skills/vault-path` are both unset. Verify the path exists and contains a `.obsidian/` directory — if it doesn't, warn that this may not be a vault root and confirm before continuing. Write the pointer file, and mention the env var as an alternative for people who prefer it.

## 2. Interview — never copy the config template blind

The config template ships with example values (client, timezone), not defaults. Ask, one at a time:

1. **Client slug** for the current engagement (lowercase, no spaces — it becomes a frontmatter value)
2. **Timezone** (offer a guess from the system clock, confirm)
3. **Daily note date format** — tell the user where to find it: Obsidian → Settings → Daily notes → Date format. This must match exactly or skill entries and app-created daily notes split into different files.
4. **Folder names** — show the defaults from `../obsidian-vault/templates/Config.md` and ask if any should change. Most people keep defaults; don't belabor it.

## 3. Scaffold

- Create every folder from the (possibly renamed) `folders` map, plus `Meta/`.
- Write `Meta/Config.md` based on the template with the interview answers substituted.
- Copy default note templates into the vault's templates folder, skipping any that already exist: meeting templates from `../granola-sync/templates/`, the repo template from `../repo-dossier/templates/`, the decision template from `../decisions/templates/`, the conflict template from `../reconcile/templates/`, the handoff and ticket templates from `../handoff/templates/`, the time-logging template from `../time-logging/templates/`.
- Copy `../work-chart/templates/Work.base` into the work folder as `Work.base`, skipping if one exists, and create `~/.config/vault-skills/work-stamp/`.

## 4. Verify and report

Write a scratch file into the vault, read it back, delete it — this catches path and permission problems now instead of during a real capture. Re-read `Meta/Config.md` to confirm the frontmatter parses. Then summarize what was created and suggest first steps: sync recent meetings with granola-sync, or create a repo dossier for the repo they're currently working in.

## Edge cases

- Config already exists: switch to update mode — show current values, ask what to change, rewrite only those. Never silently overwrite.
- Re-running init is safe by design; every step skips what already exists.
