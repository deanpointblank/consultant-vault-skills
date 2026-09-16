---
date: 2026-09-15
status: done
type: note
tags: [skill-idea, work-chart, hooks, untracked]
---

# work-chart hook only watches the repo the CLI was opened in

Parked here on 2026-09-15. Done 2026-09-16: designed in [the activity-log spec](../superpowers/specs/2026-09-16-work-chart-activity-log-design.md) and built from [its plan](../superpowers/plans/2026-09-16-work-chart-activity-log.md).

## What's verified

Read 2026-09-15, straight from the code:

- `hooks/hooks.json` registers one Stop hook, `${CLAUDE_PLUGIN_ROOT}/hooks/work-chart-stop.sh`. It is the only hook the plugin has.
- `work-chart-stop.sh` reads the `cwd` field from the Stop payload, runs `git rev-parse --show-toplevel` on it, and fingerprints that one tree: `git status --porcelain` plus `diff --stat` plus `diff --cached --stat`, hashed together.
- It exits early unless a dossier note exists at `<vault>/<repos folder>/<repo basename>.md`. The repos folder comes from `Meta/Config.md`, default `Repos`.
- The stamp is per repo, stored at `~/.config/vault-skills/work-stamp/<sha1 of repo path>`. Per-repo state already works and needs no redesign.

## The problem

The user often opens the CLI in the vault directory, `.../uscold-map/US_Cold_Notes`, while the session's real code changes land in other client repos. The hook fingerprints the vault's own repo, `uscold-map`, and never looks at those other repos. On top of that, `uscold-map` has no dossier note of its own, so the hook stays silent there too. Two separate ways to miss the same session.

## Direction, not decided

Fingerprint every repo that has a dossier note in the vault's Repos folder, instead of only the repo that contains `cwd`. Block with the full list of dirty repos, not just one.

Open questions, not answered here:

- How does the hook find those repos on disk? A Repos note may not record a path at all.
- How does it avoid a slow Stop hook once many repos are being scanned on every stop?
- Should it also catch repos that have real changes but no dossier note?

**Next action:** decide the repo-discovery approach, then extend `hooks/tests/test-work-chart-hook.sh` to cover the multi-repo case before changing the hook itself.
