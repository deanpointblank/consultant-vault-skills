# work-chart activity log — design

**Status: approved in brainstorming 2026-09-16. Ready for an implementation plan. Supersedes the Stop hook section and the "Tracked" and "Passive" decisions of 2026-09-10-work-chart-design.md; everything else there stands.**

## Goal

Make the work chart catch all goal-directed work in a session, wherever it happens. That means code changes in any client repo, files outside git, and work that changes no code: research, coordination, design, and dead ends. A second hook logs each tool call as it happens. The Stop hook reads that log and asks for rows only when something worth a row took place.

## Why

The user starts nearly every session in the vault folder `~/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes`. That folder sits inside the git repo `uscold-map`. The client repos are its siblings under `~/Code/StrideClients/UsCold/`.

The current Stop hook looks only at the repo that contains the session's starting folder (`cwd`). It also stays silent unless that repo has a dossier note, and `uscold-map` has none. So the hook never fires. Repo dossiers also record no disk path, so the hook cannot find the sibling repos from the vault.

The user also wants rows for work the current hook cannot see:

- repos with no dossier note,
- work with no Jira key,
- file edits outside any git repo,
- work that changes no code: research, coordination, architecting,
- effort toward a goal that hit a dead end.

The problem was parked in `docs/ideas/2026-09-15-work-chart-hook-multi-repo.md`.

## Terms

- **Activity log**: a per-session file of one line per tool call worth counting. The new log hook writes it; the Stop hook reads it.
- **Work root**: a folder whose contents count as work. A call is logged only when it touches a work root.
- **Fingerprint**: a hash of a repo's uncommitted state, as today.
- **Stamp**: the fingerprint saved when rows were last written for a repo, as today.
- **MARK**: a log line meaning "rows were written up to here".
- **Outward call**: a tool call that changes something other people see, such as a Jira comment or a sent email.

## Decisions taken in brainstorming

| Question | Decision |
|---|---|
| What counts as a row | Any goal-directed stretch: concluded work, and effort toward a goal that went nowhere (dead ends). A no-goal Q&A reply gets no row. |
| How activity is seen | Approach A, activity log: a PostToolUse hook logs each tool call; the Stop hook reads it. Rejected: B, reading the session transcript (its format is unpublished); C, scanning every repo folder at each stop (slow, and misses research). |
| When the hook asks | When the work since the last rows passes a threshold: any edit, any outward call, or 5 or more research and shell calls. Or when a touched repo's fingerprint differs from its stamp. |
| Which sessions | New config key `work_roots`, a list of folders. A call is logged when the session's `cwd` or the touched path is under a root. Key missing: the vault folder alone is the root. |
| Repo dossier gate | Removed. Any git repo reached from a logged call counts. |
| Vault edits | Still not rows. The log hook skips edits under the vault path. The vault's own folder is left out of the repo fingerprint. |
| Known gap | Hand edits in a repo the session never touched are not caught. A periodic folder scan is under "Later, not now". |

## Contract

### Config

`Meta/Config.md` gains a top-level list, in the same YAML shape as the other lists:

```yaml
work_roots:
  - ~/Code/StrideClients/UsCold
```

- A leading `~` is expanded to `$HOME`.
- Key missing or list empty: the vault folder is the only root.
- Setup suggests one root: the parent folder of the vault's git repo top. For this vault that is `~/Code/StrideClients/UsCold`.

### `hooks/hooks.json`

The Stop entry stays. A `PostToolUse` entry with no matcher is added, so it runs after every tool call.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/work-chart-log.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/work-chart-stop.sh" }
        ]
      }
    ]
  }
}
```

### Activity log file

- Path: `~/.config/vault-skills/work-log/<session_id>.tsv`.
- One tab-separated line per logged call, four fields:

  | Field | Value |
  |---|---|
  | time | epoch seconds |
  | kind | `edit`, `outward`, `research`, `shell`, or `MARK` |
  | tool | the tool name, such as `Edit` or `mcp__atlassian__addCommentToJiraIssue` |
  | place | the file path for `edit` and `research` calls that have one; the git top of `cwd` for `shell`; otherwise empty |

- Example:

  ```
  1789567500	edit	Edit	/Users/deanbetty/Code/StrideClients/UsCold/phenix.appointments/src/Appt.java
  1789567530	shell	Bash	/Users/deanbetty/Code/StrideClients/UsCold/phenix.appointments
  1789567610	research	WebFetch	
  1789567700	MARK	Bash	
  ```

- The log never holds file contents, command text, or tool output.

### `hooks/work-chart-log.sh` (new, PostToolUse)

Reads the hook JSON on stdin. It uses `session_id`, `cwd`, `tool_name` and `tool_input`. Steps:

1. No vault configured: exit 0.
2. Find the touched path. Use `tool_input.file_path`, then `notebook_path`, then `path`, whichever is present. For `Bash`, the touched path is `cwd`.
3. Neither `cwd` nor the touched path is under a work root: exit 0. A `Bash` call that runs `work-chart-stamp.sh` (step 6) is the exception: it writes its `MARK` before this check, wherever `cwd` is, because the plugin lives outside every work root.
4. Classify the call by `tool_name`:

   | Kind | Tools |
   |---|---|
   | `edit` | `Edit`, `Write`, `NotebookEdit` |
   | `outward` | MCP tools (names starting `mcp__`) whose last name part starts with create, add, send, post, comment, update, edit, write, save, copy, move, transition, reply, respond, forward, share, delete, trash, label, unlabel, mark, unmark, or apply. Examples: Jira, Confluence, Slack, Gmail, Drive, Calendar, Asana. |
   | `research` | `Read`, `Grep`, `Glob`, `WebFetch`, `WebSearch`, and MCP tools whose last name part starts with get, search, list, fetch, query, read, lookup, or find |
   | `shell` | `Bash` |

   Matching is case-insensitive and looks only at the verb the name starts with, so `getTransitionsForJiraIssue` and `list_labels` are research and `editJiraIssue` is outward. Everything else is not logged: `Skill`, `Agent`, `AskUserQuestion`, the todo tools, and MCP tools that match neither list.
5. An `edit` whose path is under the vault: exit 0.
6. A `Bash` call writes a `MARK` line instead of a `shell` line only when it runs `work-chart-stamp.sh`, not merely mentions it: split the command on `&&`, `||`, `;` and line breaks, and a segment runs it when, after trimming leading spaces, its first word — or the word after a leading `bash` or `sh` — ends in `work-chart-stamp.sh`, quotes allowed around it. The command is only checked, never stored.
7. Append one line to the log file, creating the folder when needed. For `shell`, the place is the git top of `cwd`, found by walking up to the nearest `.git` entry (faster than running git), or empty when `cwd` is not in a repo. The Stop hook resolves it again with git.
8. Any failure, such as an unwritable folder or bad JSON: exit 0.

Rules for the whole script:

- Always exits 0. Never prints anything, so it can never block or change a tool call.
- Takes under 50 ms per call.
- Uses `jq` when present, and the same `sed` fallback as the current Stop hook when not.
- "Under a folder" means equal to the folder or starting with the folder plus `/`. So `~/Code/UsCold2` is not under `~/Code/UsCold`.

### `hooks/work-chart-stop.sh` (rewritten)

Reads the hook JSON on stdin. Steps:

1. `stop_hook_active` is true: exit 0.
2. No vault configured: exit 0.
3. Read this session's log. Keep only the lines after the last `MARK`, or all lines when there is no `MARK`. No lines left: exit 0.
4. Collect the touched repos: the git top of each `edit` path, and each non-empty `shell` place. An `edit` path that is in no repo goes on a separate list, "files outside git".
5. For each touched repo, compute the fingerprint: `git status --porcelain`, `git diff --stat` and `git diff --cached --stat`, hashed. When the vault is inside that repo, leave the vault's folder out with a pathspec exclude on the vault's path relative to the repo top. For `uscold-map` that is `-- . ':(exclude)US_Cold_Notes'`. Compare it with the repo's stamp.
6. Ask for rows when any of these holds:
   - there is at least one `edit` line,
   - there is at least one `outward` line,
   - `research` lines plus `shell` lines number 5 or more,
   - a touched repo has a non-empty fingerprint that differs from its stamp.

   Otherwise exit 0.
7. Print one block decision: `{"decision":"block","reason":"..."}`. The reason reads, in order:
   - `Work since HH:MM not yet in the work chart:`, where HH:MM is the local time of the first line kept in step 3,
   - repos with changes, by folder name and `~`-shortened path,
   - files outside git, `~`-shortened,
   - the research call count, which counts `research` and `shell` lines,
   - the outward call count,
   - `Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.`

   Parts with nothing to report are left out. Example:

   ```
   Work since 14:05 not yet in the work chart: repos with changes: phenix.appointments (~/Code/StrideClients/UsCold/phenix.appointments); files outside git: ~/Code/StrideClients/UsCold/scratch/pallet-query.sql; research calls: 7; outward calls: 1. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.
   ```

8. Delete log files older than 14 days from the log folder.

Rules for the whole script: never writes to a repo or the vault; always exits 0.

### `hooks/work-chart-stamp.sh` (changed)

Usage: `work-chart-stamp.sh [repo path ...]`.

- For each path given, find its repo top and save that repo's fingerprint, with the vault's folder left out, as its stamp. A path anywhere inside a repo is fine.
- No arguments is valid. The script does nothing and exits 0. The `MARK` comes from the log hook seeing the call, not from this script.
- A path that is not in a git repo: print a message on stderr, carry on with the rest, and exit 1 at the end.

### `hooks/work-chart-lib.sh`

Keeps `wc_vault` and `wc_stamp_path`. Adds or changes:

| Function | Does |
|---|---|
| `wc_roots <vault>` | Prints the work roots one per line, `~` expanded. Prints the vault path when `work_roots` is missing or empty. |
| `wc_in_roots <path> <vault>` | Succeeds when the path is under any work root. |
| `wc_fingerprint <repo top> <vault>` | As today, but leaves the vault's folder out when the vault is inside the repo. Prints nothing for a clean tree. |
| `wc_log_path <session_id>` | Prints the session's log file path. |

`wc_repos_folder` is no longer used by the hooks. The plan decides whether to keep it or remove it.

## Skill changes

`skills/work-chart/SKILL.md` changes as follows.

**What a row is.** One goal-directed stretch is one row, whether it concluded or was dropped. A reply to a question with no goal behind it gets no row. The skill still runs the stamp script with no arguments, so the hook goes quiet.

**`what` with no code change.** It opens with a plain verb (Researched, Compared, Drafted, Asked, Designed, Traced) and ends with the outcome. This replaces the old "Read … nothing changed" rule. Examples:

- "Researched Flyway baseline options in the vendor docs; found `baselineOnMigrate` covers it."
- "Traced where `palletCount` is set in USCS-BE; dead end, the value comes from a stored procedure nobody can read."
- "Asked the product owner in PFD-65947 which weight units to show; waiting."
- "Designed the multi-repo work-chart hook; spec agreed."

**Dead ends.** `decided` says why the work stopped, such as "dropped: no access to the database", or "none".

**Files outside git.** `what` shows the `~`-shortened path. `repos` is not changed for them.

**Repos with no dossier.** They still go in `repos` as a quoted wikilink, such as `"[[phenix.appointments]]"`. The skill adds one line above the Work line suggesting a dossier. It does this once per repo per day: only when no earlier work note from today already lists that repo.

**No ticket.** The note is `Work - <topic> YYYY-MM-DD.md`, with a short plain topic. Later work toward the same goal that day goes in the same note.

**Stamp step.** After writing rows, run `work-chart-stamp.sh` with every repo named in the new rows. No repos is fine: run it with no arguments.

**Setup gains two things.**

- Ask to add `work_roots` to `Meta/Config.md`, suggesting the parent folder of the vault's git repo top.
- Say in one line whether each of the two hooks is present in the installed plugin.

**New Common-mistakes rows.**

| Mistake | What goes wrong |
|---|---|
| Skipping a dead end | The day's record hides effort that was spent, and the next person repeats it |
| Writing a row for a question with no goal | The chart fills with noise nobody will read |
| Deciding no row is needed but skipping the stamp | The hook asks again at the next stop |
| Leaving a repo with no dossier out of `repos` | The By repo view misses the work |

**Unchanged.** The columns, the frontmatter, the daily-note line, the Work line, and the rule that subagents never write rows.

## Failure cases

One line each.

- No vault, or the call is outside every work root: both hooks are silent. The one exception is a stamp run outside every root, which still writes its `MARK`.
- Log folder cannot be written: the log hook gives up silently and never blocks a tool call.
- No `jq`: both hooks use the `sed` fallback.
- Subagent calls land in the same session log; the controlling agent writes the rows from the subagents' reports.
- Long session: only the lines after the last `MARK` are read.
- A repo with changes from before the session and no stamp: the first touch asks for rows; rows say "not stated" for changes nobody explained.
- A stamp saved by the old script, for a repo that holds the vault: the fingerprint differs once, so the hook asks once, then the new stamp holds.
- A shell command that works in another folder by path (such as `git -C ../other-repo`) is logged against `cwd`'s repo; the other repo counts only when an edit reached it.

## Repo changes

1. `hooks/hooks.json`: the `PostToolUse` entry.
2. `hooks/work-chart-lib.sh`: the functions above.
3. `hooks/work-chart-log.sh`: new.
4. `hooks/work-chart-stop.sh`: rewritten. `hooks/work-chart-stamp.sh`: many repos, or none.
5. `hooks/tests/test-work-chart-hook.sh`: the tests below.
6. `skills/work-chart/SKILL.md`: the skill changes above.
7. `skills/obsidian-vault/templates/Config.md`: `work_roots` and one explanation bullet. `skills/vault-init/SKILL.md`: asks for `work_roots`. `README.md` Hooks paragraph: two hooks, what each does, and scope set by `work_roots`.
8. `docs/ideas/2026-09-15-work-chart-hook-multi-repo.md`: status done, with a link to this spec.
9. `docs/superpowers/baselines/work-chart.md`: the new scenarios.

## Testing

### Shell tests

Written first, before the scripts change. They go in `hooks/tests/test-work-chart-hook.sh` and replace the dossier test. Each uses fake stdin JSON, a scratch vault, and scratch repos.

1. The log script classifies each kind: `edit`, `outward`, `research`, `shell`; a `Skill` call writes nothing.
2. The log script skips edits under the vault.
3. The log script skips calls where neither `cwd` nor the path is under a work root.
4. A Bash call running `work-chart-stamp.sh` writes a `MARK` line, also when `cwd` is outside every work root and when the call sits on a later line of a multi-line command.
5. The log script never prints anything.
6. Four research calls: the Stop hook is silent. Five: it blocks.
7. One edit: it blocks.
8. A session started in the vault that edits a sibling repo with no dossier: it blocks and names the repo.
9. An edit to a file outside git: the reason names the file.
10. A file changed on disk by a shell command (only a `shell` line logged) in a touched repo: it blocks through the fingerprint.
11. Writing vault notes does not change the fingerprint of the repo that holds the vault.
12. A `MARK` with nothing after it: silent.
13. Log files older than 14 days are removed.
14. The log script runs in under 50 ms.
15. `work_roots` missing: the vault is the only root.
16. Loop guard on, or no vault: silent.
17. Both hooks exit 0 in every case above.

### Skill scenarios

Per `docs/superpowers/baselines/README.md`, three RED reps without the change and three GREEN reps with it.

1. **Research-only dead end.** The rep researches a question and finds no answer. Check: a row exists, `what` opens with a plain verb, `decided` says why it stopped.
2. **Question with no goal.** The rep answers a plain question. Check: no row, and the stamp script ran.
3. **Vault-started session, sibling repo.** The session starts in the vault folder and edits a sibling repo with no dossier. Check: rows name that repo in `repos`, and a dossier suggestion line appears.

### Live check

Reinstall the plugin. Start a session in `US_Cold_Notes`. Change a file in `phenix.appointments`. The hook fires once and the rows appear.

## Later, not now

- A periodic scan of `work_roots` to catch hand edits in repos the session never touched.
- Routing to a different vault per root, for the user's own repos (consultant-vault-skills, Prototypes).
- A gardener check for topic names drifting across no-ticket notes.
