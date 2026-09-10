# work-chart — design

**Status: approved in grilling 2026-09-10. Ready for an implementation plan.**

## Goal

A skill for the `consultant-vault` plugin that keeps a plain-language record of coding work as it happens: what the task was, what changed and why, and what was decided. One note per ticket per day in a `Work/` folder, a Base view over them, a terminal line after every batch of rows, and a Stop hook so the rows get written even when auto mode did a lot and nobody paused. The developer can answer "what did you just do?" from it right away, and "what happened on this ticket?" days later.

## Why

Subagent-driven and auto-mode sessions produce diffs the developer did not watch being made. Handoff records end-of-session state per ticket; daybook records findings; decisions records rulings. Nothing records the work itself at the granularity of "this change, for this reason", and nothing does it during the session. Without that the developer's map of the codebase lags behind the code.

## Decisions taken in grilling

| Question | Decision |
|---|---|
| Reader and moment | Right after auto mode finishes, before committing; and days later per ticket. |
| One row is | One logical change (a fix, a refactor, a plan task) or one investigation that concluded something with no code change. Not a turn, not a file, not a commit. |
| Decisions | Small calls stay in the row. A call that constrains future work or a reviewer would question also becomes a `proposed` decision note through the decisions skill; the row links it. |
| Home | One note per ticket per day in `folders.work`, `type: work`. The daily note gets one line per work note. The ticket note is not edited; Obsidian backlinks join them. |
| Tracked | Code changes plus concluded investigations. Vault edits are not rows; the skills that make them log them. |
| Friendly view | A shipped Obsidian Base, `Work/Work.base`, with four views. No published artifact. |
| Passive | The skill writes at natural pauses and when a plan task completes, and a plugin-shipped Stop hook fires when uncommitted changes differ from a per-repo stamp. Silent unless a vault is configured and the current repo has a dossier. In subagent-driven work the controller writes rows from each report; subagents never do. |
| Terminal line | After rows are written: `Work: 3 changes today on PFD-65947; last: V36 migration added`. |
| Chat read-back | "What did you just do?" and "why did you change X?" are answered from the rows plus the diff, citing the work note. |
| Handoff | Links the day's work notes under Related and takes "what shipped" from their rows. |
| Setup | "Set up the work chart" scaffolds an existing vault. vault-init does the same for new vaults. |
| Name | `work-chart`. Plain language throughout; no skill-internal words in any note. |

## Contract

- New note type `work` in `skills/obsidian-vault/references/property-schema.md`:

  | Property | Format | Notes |
  |---|---|---|
  | `jira` | list of ticket keys | the ticket worked first; empty for work with no ticket |
  | `date` | `YYYY-MM-DD` | the day the work happened |
  | `repos` | list of quoted wikilinks | repo dossiers touched |
  | `areas` | list of plain strings | parts of the codebase touched, in the reader's words: "migration loader", "appointment details API" |
  | `changes` | integer | number of rows |

- Config template gains `folders.work: Work`.
- Filename `KEY Work YYYY-MM-DD.md`, or `Work - <topic> YYYY-MM-DD.md` when there is no ticket. Key missing from config: use `Work`, create it, tell the user to add the key.
- Template `skills/work-chart/templates/Work.md`, overridable from the vault's templates folder.
- Base `skills/work-chart/templates/Work.base`, copied to `<folders.work>/Work.base` by setup. Views: Today (`date` is today), By ticket (grouped by `jira`), By repo (grouped by `repos`), By area (grouped by `areas`). Columns: file name, `date`, `jira`, `repos`, `areas`, `changes`.
- Hook files in the plugin: `hooks/hooks.json` and `hooks/work-chart-stop.sh`.
- Stamp directory `~/.config/vault-skills/work-stamp/`, one file per repo named by a hash of the repo's top-level path.

## The work note

Title `KEY Work YYYY-MM-DD` or `Work - <topic> YYYY-MM-DD`. First line under the title: one sentence saying what the day's work on this ticket was about, rewritten as rows are added.

Then one table, four columns:

| when | what | why | decided |
|---|---|---|---|
| 14:05 | Added Flyway `V36` with four nullable columns to `appt`. `phenix.appointments db/migration/V36__appt_totals.sql`, commit `a1b2c3d` | The ticket needs Cases and Pallets stored; weights are carried but blank per Option D | Columns nullable rather than defaulted to 0, so "not seeded" and "zero" stay distinguishable |
| 14:40 | Read `OrderDAOImpl.java:104-128` and `PalletAndCaseCountHelper.java:41-46` in `USCS-BE`; nothing changed | To confirm the native count SQL before copying it into the loader | none |

Row rules:

- `what` names the repo and path of what changed, and the commit when there is one. A row with no code change starts with "Read" and ends with "nothing changed".
- `why` is one sentence in the reader's words. Not the ticket key; the reason.
- `decided` is the call made and the reason, or "none". A call that constrains future work or a reviewer would question becomes a `proposed` decision note via the decisions skill, and the cell links it: `[[2026-09-10 Nullable totals columns]]`.
- `changes` in the frontmatter equals the row count. `areas` and `repos` grow as rows are added; nothing is removed.
- No skill words in the note: not "session", "ledger", "hook", "stamp", "controller".

## Writing moments

1. **Natural pause**: a task finished, tests ran, a commit was made, the user asked something unrelated. Write the rows for everything since the last row.
2. **Plan task complete** in subagent-driven work: the controller writes the rows from the subagent's report file. Subagents never write the work note.
3. **The Stop hook says so**: write the rows, then print the terminal line.

After writing, in all three cases: update the first line, `changes`, `areas`, `repos`; add the daily-note line `- HH:MM work on [[PFD-65947 Work 2026-09-10]]: 3 changes` (once per work note per day, then edit the count in place); add the key to the daily note's `jira` list; print the terminal line.

## The Stop hook

`hooks/hooks.json`:

```json
{
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/work-chart-stop.sh" } ] }
    ]
  }
}
```

`hooks/work-chart-stop.sh` reads the hook's JSON from stdin and:

1. Exits 0 with no output when `stop_hook_active` is true.
2. Exits 0 with no output when no vault is configured: neither `$OBSIDIAN_VAULT` nor `~/.config/vault-skills/vault-path` resolves to a directory.
3. Exits 0 with no output when `cwd` is not inside a git repository.
4. Reads `folders.repos` from `<vault>/Meta/Config.md` (default `Repos`) and exits 0 with no output when `<vault>/<folders.repos>/<repo name>.md` does not exist, where the repo name is the basename of `git rev-parse --show-toplevel`.
5. Computes a fingerprint: `git status --porcelain` and `git diff --stat` and `git diff --cached --stat`, hashed. Compares it to the stamp file for this repo. Equal, or no changes at all: exits 0 with no output.
6. Otherwise prints `{"decision":"block","reason":"Files changed since the last work-chart rows. Use the work-chart skill: write the rows for what changed and why, then print the Work line."}` and exits 0.

The skill, not the hook, writes the stamp: after writing rows it runs the same fingerprint and saves it. The hook only reads. The script uses `${CLAUDE_PLUGIN_ROOT}` for its own path, reads `cwd` from stdin rather than trusting the shell's directory, and never writes into the repo or the vault.

## Terminal line and chat read-back

The terminal line is the last line of the reply after rows are written: `Work: <N> changes today on <KEY or topic>; last: <the newest row's what, first clause>`.

"What did you just do?", "why did you change X?", "explain that diff": answer from the rows for the ticket and day, citing the work note, and from `git diff` for the specifics. Three lines minimum: what, why, where to read more. Rows exist for it: cite them. No rows yet: write them first, then answer.

## Handoff

`skills/handoff/SKILL.md` gains two lines: the Related section links every work note for the ticket from the days since the previous handoff, and "Where things stand" takes its "what shipped" from those rows rather than from memory.

## Setup

"Set up the work chart", "init the work chart", or a first write finding no `folders.work` key:

1. Add `work: Work` under `folders` in `Meta/Config.md` after confirming with the user, same precedent as granola-sync adding a rule.
2. Create the folder.
3. Copy `Work.base` into it, skipping if one exists.
4. Create `~/.config/vault-skills/work-stamp/`.
5. Say in one line whether the plugin's hook is active (`hooks/hooks.json` present in the installed plugin) and, if not, that rows will be written at pauses only.

vault-init performs steps 2 to 4 for a new vault and includes `work` in the folder map it shows.

## Repo changes

1. `skills/work-chart/SKILL.md`, `skills/work-chart/templates/Work.md`, `skills/work-chart/templates/Work.base`.
2. `hooks/hooks.json`, `hooks/work-chart-stop.sh` at the plugin root.
3. `skills/obsidian-vault/references/property-schema.md`: `work` type; `work` in the type list.
4. `skills/obsidian-vault/templates/Config.md`: `work: Work` in `folders`, one explanation bullet.
5. `skills/vault-init/SKILL.md`: folder, Base, stamp directory.
6. `skills/handoff/SKILL.md`: the two lines above.
7. `README.md`: one row, the count, and a "Hooks" paragraph saying the plugin ships one Stop hook, what it checks, and that it is silent outside client repos. `.claude-plugin/marketplace.json`: the count.

## Failure cases

One line in chat each.

- No vault configured: the skill says so and points at vault-init; the hook is silent.
- Repo has no dossier: the hook is silent; the skill still writes rows when asked or at a pause, and says the hook will not fire for this repo until a dossier exists.
- The work note for today exists: rows append; the first line, counts, and lists update.
- Two tickets in one sitting: two work notes, rows routed by the ticket each change was for; a change for neither goes to the topic note.
- Nothing changed since the last rows and the user asks "what did you just do?": answer from the rows; no new row.

## Testing

Follows `docs/superpowers/baselines/README.md` for the skill scenarios; the hook script gets shell tests.

1. **Rows after work.** A throwaway git repo in the scratch folder with a dossier note for it in the vault copy. The rep is asked to make a small two-file change and stop. Checks: `Work/<KEY> Work <today>.md` exists with `type: work`, all eight properties, `changes` equal to the row count, one row per logical change with repo path and a `why`, `decided` filled or "none"; daily-note line; terminal line as the reply's last line; no skill words.
2. **Read-back.** A vault copy with a work note for PFD-65947 and the matching diff in the throwaway repo. Prompt: "what did I change on PFD-65947 today and why?" Checks: the answer cites the work note, names the rows' why, and invents nothing not in the rows or the diff.
3. **Setup.** A copy without `folders.work`. Prompt: "set up the work chart". Checks: config key added, folder and Base created, stamp directory created, hook status line in the reply.
4. **Hook script**, shell tests with a fake stdin JSON: silent when `stop_hook_active`; silent with no vault; silent outside a repo; silent when the repo has no dossier; silent when the fingerprint matches the stamp; blocks with the exact reason when it differs; never writes a file.
5. RED three reps each for scenarios 1 to 3 without the skill, GREEN three with, per the harness.
6. **Trigger test** after reinstalling the plugin: the user makes a change in a client repo, ends the turn, and sees the hook fire once and the rows appear; then opens `Work/Work.base` in Obsidian and confirms the four views render.

## Later, not now

- A canvas per repo with one card per change, as the visual map on top of the Base.
- An "ask about this change" affordance in the page, if a page ever exists.
- Gardener check for `areas` vocabulary drift ("migration loader" vs "loader").
