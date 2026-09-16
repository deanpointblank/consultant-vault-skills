# Setup wizard — design

**Status: approved in brainstorming 2026-09-16. Ready for an implementation plan.**

## Goal

Give a consultant on a fresh Mac one way to get the plugin working. A shell script checks every tool, app, connector and setting the chosen skills need. It offers to install what is missing and writes the vault pointer. A small read-only skill, `setup-check`, runs the same checks from inside Claude Code and says what to fix.

## Why

The plugin is shared with other consultants. Its skills depend on command-line tools, Claude Code connectors, the Obsidian app, and a vault pointer. Nothing checks these today. `vault-init` only builds the vault: folders, config note and templates.

So failures show up in the middle of a task. `record-testing` finds out that ffmpeg is missing after the walkthrough has started. `granola-sync` stops when no Granola tools are loaded. Each skill explains its own missing piece in its own words, one at a time.

## Terms

- **Skill group**: a set of skills that share needs, such as Recording. The script checks only the groups the user picks.
- **Check**: one test with a clear pass or fail, such as "`ffmpeg` is on PATH".
- **Connector**: an MCP server that gives Claude Code tools for an outside service, such as Granola or Atlassian. It shows up in Claude Code as tools named `mcp__<server>__<tool>`.
- **Vault pointer**: the one-line file `~/.config/vault-skills/vault-path` that holds the vault folder. `$OBSIDIAN_VAULT` wins over it when set (obsidian-vault skill, section 1).
- **Plugin root**: the folder that holds `skills/`, `hooks/` and `scripts/`. The script finds it as the folder above its own `scripts/` folder.
- **Skipped**: a check that was not run because something it needs is missing, such as Homebrew. Skipped is not a pass.

## Decisions taken in brainstorming

| Question | Decision |
|---|---|
| Shape | An interactive shell script, `scripts/setup.sh`, plus a read-only skill, `setup-check`, that runs the same checks from inside Claude. Vault scaffolding stays with `vault-init`. |
| Audience | Any consultant on a fresh Mac. No assumptions about paths, clients or connectors. The script asks which skill groups will be used and checks only those. |
| Missing tool | Show the exact install command, run it only on a yes, then re-check. Missing Homebrew or npm: say how to get them, and mark the tools that need them as skipped. |
| Platform | macOS only. Other systems get "not supported yet". |
| Connectors | Can't be set up from the script. The script prints where to click, waits for Enter, and uses `claude mcp list` when the `claude` command exists. The skill confirms connectors by whether their tools are loaded in the session. |
| Config and notes | The script never edits `Meta/Config.md`, vault notes, or shell profiles. It writes only `~/.config/vault-skills/vault-path`, and asks before replacing it. |
| `--check` with no `--groups` | Checks every group. The skill runs it that way and reports by group, so the user can ignore a group they don't use. |
| Connectors inside Claude | When `$CLAUDECODE` is set (Claude Code sets it for every shell it runs), the script does not run `claude mcp list`. It prints one line saying Claude checks connectors, and the skill does. |
| Wizard look | Follow the `mattpocock-skills` wizard conventions that fit: one stage per step with "Stage n of N", colour only when output is a terminal, `[y/N]` questions that default to no, a closing summary, and safe to stop and re-run. Its `.env` and GitHub-secret helpers do not apply, so the script does not copy its template. |

## Contract

### Skill groups

Core is always checked. The other four are chosen by the user.

Each check below has four parts: how it is checked, what counts as a pass, how to fix it, and when it is skipped. An item that passes is `✓` even when its installer is missing. "Skipped" applies to a missing item whose fix needs something that is also missing, or to a check that cannot run at all (no `claude` command).

#### Core (always)

Needed by every skill and both hooks.

| Item | Check | Pass | Fix | Skipped when |
|---|---|---|---|---|
| Apple command-line tools (for git) | `xcode-select -p` and `git --version` | both exit 0 | `xcode-select --install` (opens an Apple dialog) | never |
| `perl` | `command -v perl` | found | comes with macOS; if missing, `xcode-select --install` | never |
| `shasum` | `command -v shasum` | found | comes with macOS; if missing, `xcode-select --install` | never |
| `bash` | `command -v bash` | found | comes with macOS | never |
| `jq` (optional) | `command -v jq` | found | `brew install jq` | Homebrew missing |
| Obsidian app | `$SETUP_APPS_DIR/Obsidian.app` exists (default `/Applications`), else `mdfind "kMDItemCFBundleIdentifier == 'md.obsidian'"` prints a path | either one | `brew install --cask obsidian`, or download from obsidian.md | Homebrew missing (the download link is still shown) |
| `obsidian` command (optional) | `command -v obsidian` | found | turn on the command line option in Obsidian's settings | Obsidian app missing |
| Vault pointer | `$OBSIDIAN_VAULT`, else the first line of `~/.config/vault-skills/vault-path`, names a folder that exists | yes | the vault pointer stage of the script | never |
| Config note | `<vault>/Meta/Config.md` exists | yes | open Claude Code in the vault and say *set up my vault* | no vault pointer |
| Plugin enabled | `claude plugin list` shows `consultant-vault@consultant-vault-skills` as enabled | yes | `/plugin install consultant-vault@consultant-vault-skills` in Claude Code | no `claude` command |

Where each is needed:

- git: the work-chart hooks (`hooks/work-chart-lib.sh`), ticket-intake (reads clones), daily-worklog (`git log`).
- perl: `scripts/ticket-intake-meetings.sh`.
- shasum: the work-chart hooks (fingerprints and stamp names).
- jq: the work-chart hooks. They fall back to `sed` when it is missing, so a missing `jq` is a note, not a failure.
- The `obsidian` command is optional: the obsidian-vault skill never needs it for a write.
- `awk` and `sed` are also used by the hooks and scripts. They ship with macOS and are not checked.

Optional items print `–` (not installed, fine) instead of `✗`, and never change the `--check` exit code.

#### Meetings

For granola-sync, and the meeting parts of meeting-trends, time-logging and ticket-intake.

| Item | Check | Pass | Fix | Skipped when |
|---|---|---|---|---|
| Granola app | `$SETUP_APPS_DIR/Granola.app` exists, else `mdfind "kMDItemCFBundleIdentifier == 'com.granola.app'"` prints a path | either one | `brew install --cask granola`, or download from granola.ai | Homebrew missing (the download link is still shown) |
| Granola connector | a `claude mcp list` line contains `granola` (any case) and `Connected` | yes | see "Connector walkthrough" | no `claude` command, or running inside Claude |

#### Jira

For ticket-intake, gap-stories and daily-worklog. time-logging reads Jira too.

| Item | Check | Pass | Fix | Skipped when |
|---|---|---|---|---|
| Atlassian connector | a `claude mcp list` line contains `atlassian` (any case) and `Connected` | yes | see "Connector walkthrough" | no `claude` command, or running inside Claude |

The config values `jira_site` and `worklog.*` are not the script's job. ticket-intake and daily-worklog ask for `jira_site`, and `worklog.*` is filled in the config note. The summary says so in one line.

#### Recording

For record-testing.

| Item | Check | Pass | Fix | Skipped when |
|---|---|---|---|---|
| `ffmpeg` and `ffprobe` | `command -v ffmpeg` and `command -v ffprobe` | both found | `brew install ffmpeg` (one install gives both) | Homebrew missing |
| `playwright-cli` 0.1.20 | `command -v playwright-cli`, then `playwright-cli --version` | prints `0.1.20` | `npm install -g @playwright/cli@0.1.20` | npm missing |
| Browser | `$SETUP_APPS_DIR/Google Chrome.app` exists | yes | `playwright-cli install-browser chrome` | `playwright-cli` missing |
| Permission rule (note only) | not checked | – | the script prints the rule record-testing asks for: `"Bash(env -C * playwright-cli *)"` in `permissions.allow` of the project's `.claude/settings.local.json` | – |

The script never writes the permission rule. That file belongs to a client project.

#### Work chart

For work-chart and its two hooks.

| Item | Check | Pass | Fix | Skipped when |
|---|---|---|---|---|
| Hooks listed | `<plugin root>/hooks/hooks.json` names `work-chart-log.sh` and `work-chart-stop.sh` | both | update the plugin: `/plugin update` in Claude Code | never |
| Hook scripts | both files exist under `<plugin root>/hooks/` and can be run | both | update the plugin | never |

When the plugin root is not under `~/.claude/plugins/`, the script adds one line: "Checked this copy of the plugin. Claude Code runs the installed copy, which may differ."

Which folders the work chart watches (`work_roots`) is set by vault-init and by the work-chart skill's setup, not by the script. The summary says so in one line.

### `scripts/setup.sh`

Usage: `scripts/setup.sh [--check] [--groups a,b] [--help]`.

Group names for `--groups`: `meetings`, `jira`, `recording`, `workchart`. Core is always on and is not named. An unknown name prints the valid names and exits 2.

#### Flow

Each step is one stage, headed "Stage n of N".

1. **macOS check.** `uname -s`, or `$SETUP_UNAME` when set, must be `Darwin`. Anything else: print "This setup supports macOS only. Other systems are not supported yet." and exit 1.
2. **Group choice.** A numbered list: 1 Meetings, 2 Jira, 3 Recording, 4 Work chart, with one plain line on what each is for. The user types numbers separated by spaces or commas, or `all`. Empty answer: Core only. Core is always on and is shown as such. `--groups` skips this question.
3. **Tool checks.** One line per item: `✓ ffmpeg`, `✗ ffmpeg — not installed`, `– jq — optional, not installed`, or `skipped: ffmpeg — needs Homebrew`.
4. **Installs.** For each `✗` that has an install command: show the command, ask `Run it now? [y/N]`. On yes, run it, then re-check and print the new mark. On no, leave the `✗`. Apple's dialog (`xcode-select --install`) finishes outside the script, so the script waits for Enter before re-checking.
   - No Homebrew: say "Homebrew is missing. Get it from https://brew.sh, then run this script again." Tools installed with Homebrew are marked skipped.
   - No npm: say "npm is missing. It comes with Node.js: `brew install node`, or nodejs.org." `playwright-cli` is marked skipped. The `brew install node` offer follows the usual yes/no rule when Homebrew is present.
5. **Connector walkthrough.** Only for the chosen groups that need a connector (Meetings, Jira).
   - Print the steps: open Claude Code, type `/mcp`, and connect Granola or Atlassian. Where the connector is not listed at all, print the command that adds it, for the user to run: `claude mcp add --transport http granola https://mcp.granola.ai/mcp` or `claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2`. Then sign in through `/mcp`. The script never runs these commands.
   - Wait for Enter.
   - `claude` command present and `$CLAUDECODE` unset: run `claude mcp list` (it takes a few seconds; say so first) and mark each connector `✓` or `✗`. A line that says `Needs authentication` is `✗ — sign in with /mcp in Claude Code`.
   - No `claude` command: mark the connectors skipped and say "Can't check connectors from here. In Claude Code, say *check my setup*."
6. **Vault pointer.**
   - `$OBSIDIAN_VAULT` set: show it and say it is used before the pointer file. Ask whether to also write the pointer file (`[y/N]`).
   - A pointer file exists: show the folder it names. Ask `Replace it? [y/N]`. No: keep it and move on.
   - Ask for the vault folder. A leading `~` is expanded. The folder must exist; if not, say so and ask again. An empty answer skips this stage.
   - No `.obsidian` folder inside: warn "This folder has no .obsidian folder, so it may not be a vault." and ask `Use it anyway? [y/N]`.
   - Write the pointer: create `~/.config/vault-skills/` if needed, write the path as one line to a temporary file in that folder, then move it into place.
7. **Summary.** Three lists: ready (`✓`), skipped (with the reason), missing (with its one fix). Then the config reminders for Jira and Work chart, when chosen. Last line: "Next: open Claude Code in your vault and say *set up my vault*." When the config note already exists, the last line is instead "Next: open Claude Code in your vault and start working."

#### Flags

- `--check`: no questions, no installs, no writes. Runs stages 1, 3 and the `claude mcp list` part of 5, and the vault pointer and config note checks from Core. Groups come from `--groups`, or all groups when it is left out. Prints one line per item, then the missing list. Exit 0 when every non-optional check for the chosen groups passes. Exit 1 otherwise, and also when any check is skipped, since a skipped check is not a pass. Two exceptions never change the exit code: optional items, and connector checks when `$CLAUDECODE` is set (Claude checks those).
- `--groups a,b`: choose groups without the question. Works with and without `--check`.
- `--help`: print usage, the group names, and what the script writes. Exit 0.

#### Rules

- Safe to run again. Each run checks first and offers only what is still missing.
- Runs on the bash that ships with macOS (3.2): no `mapfile`, no `declare -A`, no `${var,,}`.
- Writes nothing outside `~/.config/vault-skills/`. The installers it runs on a yes write where they always do (Homebrew, npm, Apple's installer).
- Runs an install command only after a yes, one command per yes.
- Ctrl-C stops the script with one line, "Stopped. Run it again to carry on." Steps already done stay done. The pointer is never half-written, because it is moved into place whole.
- Plain words. One line per failure, with its fix on that line or the next.
- Colour and symbols are plain text when output is not a terminal, so `--check` output reads well inside Claude.
- A failed install prints its last 10 lines, marks the item `✗`, and carries on.

### `skills/setup-check/SKILL.md`

**Triggers** (for the description):

- "check my setup", "is the plugin set up", "what do I still need to install".
- "why isn't X working", when the cause may be a missing tool, connector or vault pointer.
- Another vault skill failing because a tool, connector, pointer or config note is missing.

"Set up my vault" stays with vault-init.

**Steps:**

1. Run `bash <plugin root>/scripts/setup.sh --check` with the full path. The plugin root is two folders above this skill's folder.
2. Check connectors by tool availability in this session: Granola is connected when any `mcp__*granola*` tool is loaded; Atlassian is connected when any `mcp__*atlassian*` tool is loaded. Match the name in any case, since the server name differs between setups. Never call a connector tool just to test it.
3. Reply briefly, by group. One line per missing item, with its one fix. A group that is all `✓` gets one line. When the user asked about one skill, lead with that skill's group.
4. Fixes point to the right place:
   - tools and apps: "run `<plugin root>/scripts/setup.sh` in a terminal; it offers to install them";
   - connectors: "type `/mcp` in Claude Code and connect it";
   - vault pointer or config note: "say *set up my vault*".
5. Never install, never write the pointer, never edit settings. Offering the command is the whole job.

**Rules:** plain words, short reply, no tables unless four or more items are missing. The skill writes nothing to the vault.

**Common mistakes** (for the skill's table):

| Mistake | What goes wrong |
|---|---|
| Running the install command for the user | The skill promised read-only; installs need the user's yes in a terminal |
| Calling a Granola or Jira tool to see if it works | A test call can be slow or change something; a loaded tool name is enough |
| Reporting a group the user never uses as broken | The user fixes things they don't need; say which skills the group is for |
| Running `setup.sh` with a relative path | The shell's folder is not the plugin root, so the script is not found |

### Other changes

- `README.md`: a new "First-time setup" section after "Install", leading with `scripts/setup.sh` (where to find it in the installed plugin, the groups, `--check`), then "say *set up my vault*". The skills table gains a `setup-check` row. "twenty-four skills" becomes "twenty-five skills". The existing "Setup" section points to the new section for tools.
- `skills/vault-init/SKILL.md`: one line at the top of step 1: when tools are missing or no vault pointer exists, suggest running `<plugin root>/scripts/setup.sh` first; carry on either way.
- `.claude-plugin/marketplace.json`: the plugin description says "Twenty-four skills" and lists them by kind. Change it to "Twenty-five skills" and add "setup checks". `.claude-plugin/plugin.json` has no count or list and does not change.

## Failure cases

One line each.

- Not macOS: print "not supported yet" and exit 1.
- No Homebrew: say where to get it; tools installed with Homebrew are skipped; no crash.
- No npm: say how to get it; `playwright-cli` is skipped.
- An install fails: show its last 10 lines, mark `✗`, carry on.
- `playwright-cli` present at another version: mark `✗ — version X, needs 0.1.20` and offer `npm install -g @playwright/cli@0.1.20`.
- No `claude` command: skip the connector and plugin checks; say to use *check my setup* in Claude Code.
- Run from inside Claude Code: connectors are left to the skill; the script says so in one line.
- `claude mcp list` fails or hangs past 30 seconds: mark connectors skipped and carry on.
- Vault folder does not exist: ask again, or skip on an empty answer.
- No `.obsidian` folder: warn, and allow on a yes.
- A pointer already exists: show it, and replace only on a yes.
- `$OBSIDIAN_VAULT` points to a missing folder: mark the vault pointer `✗` and say to fix or unset the variable; the script does not edit shell profiles.
- Ctrl-C: stop with one line; a re-run starts again and skips what is done.
- The script never touches `Meta/Config.md`, vault notes, shell profiles, or project settings files.
- Not yet verified: that `playwright-cli install-browser chrome` installs Google Chrome under `/Applications`, which is what the browser check looks for. The live check covers it.
- Not yet verified: the exact wording of Obsidian's setting for the `obsidian` command. The plan checks it in the app before writing the fix line.

## Repo changes

1. `scripts/setup.sh`: new, executable.
2. `scripts/tests/test-setup.sh`: new.
3. `skills/setup-check/SKILL.md`: new.
4. `docs/superpowers/baselines/setup-check.md`: the scenarios below. `docs/superpowers/baselines/README.md`: one table row for it.
5. `README.md`: "First-time setup" section, skills table row, skill count.
6. `skills/vault-init/SKILL.md`: the one line above.
7. `.claude-plugin/marketplace.json`: skill count and list.

## Testing

### Shell tests

Written first, before the script. They go in `scripts/tests/test-setup.sh`, in the same `check` style as `scripts/tests/test-record-testing-clip.sh`.

Each test uses:

- a temporary `HOME`;
- a `PATH` made of a fake-tools folder plus a folder of links to only the basic commands the script needs. The real `/usr/bin` and `/opt/homebrew/bin` are left out, because this Mac has `jq`, `git`, `ffmpeg` and others there;
- fake tools as small scripts: `brew`, `npm`, `ffmpeg`, `ffprobe`, `playwright-cli` (prints a set version), `git`, `xcode-select`, `mdfind` (prints nothing), `claude` (prints a set `mcp list` and `plugin list`). A fake installer appends its arguments to a log file in the test's temporary folder;
- `SETUP_UNAME` to fake the system name, and `SETUP_APPS_DIR` pointing to a temporary folder with or without `Obsidian.app`, `Granola.app` and `Google Chrome.app`;
- `CLAUDECODE` unset, except in test 9;
- answers fed on stdin.

Tests:

1. `--check` with every tool, app, connector and a valid pointer and config note: exit 0, and every line is `✓` or `–`.
2. `--check --groups recording` with `ffmpeg` missing: exit 1, and the output names `brew install ffmpeg`.
3. `--check --groups meetings` with `ffmpeg` missing: `ffmpeg` is not mentioned.
4. Interactive, recording chosen, `ffmpeg` missing, answer no: the brew log is empty. Answer yes: the brew log holds `install ffmpeg`, and the item is re-checked (the fake brew adds a fake `ffmpeg`, and the line turns `✓`).
5. Vault pointer: written for a real folder; kept when the replace question gets no; refused for a missing folder, which is asked again.
6. No `brew` on PATH, recording chosen, `ffmpeg` missing, `jq` present: `ffmpeg` is marked skipped with the brew.sh line, `jq` is `✓`, the script finishes, and `--check` exits 1.
7. `SETUP_UNAME=Linux`: the not-supported message, exit 1.
8. After every test above, nothing exists outside the temporary `HOME` and the test's temporary folder: a listing of the repo (`git status --porcelain`) is unchanged, and the real `~/.config/vault-skills/` is untouched.
9. `CLAUDECODE=1` with a fake `claude` whose `mcp list` would fail: `claude mcp list` is not run, and connectors do not change the exit code.
10. `playwright-cli` at `0.1.19`: `✗` with `npm install -g @playwright/cli@0.1.20`.
11. `--groups foo`: exit 2 with the valid names.
12. `--check` answers no questions: it finishes with stdin closed.
13. The script passes `bash -n` under `/bin/bash`.

### Skill scenarios

Per `docs/superpowers/baselines/README.md`, with sonnet reps: three RED reps without the skill and three GREEN reps with it.

1. **"Check my setup" with ffmpeg missing.** Check: the reply names ffmpeg and `brew install ffmpeg` or the script; no install command ran; nothing was written.
2. **"Record this" fails on a missing tool.** The rep is asked to record a walkthrough, and `playwright-cli` or `ffmpeg` is missing. Check: the reply steers the user to `scripts/setup.sh` for the install; no install command ran.

Harness notes, from earlier runs:

- Rep prompts must not open with a dispatch notice. Reps that saw one refused the task.
- Reps may load the installed plugin's skills through the Skill tool. Point each GREEN rep at the fixture's `skills/setup-check/SKILL.md` by path.
- This Mac has ffmpeg and `playwright-cli` installed. The fixture plugin copy runs `setup.sh` with a trimmed `PATH` (the same fake-tools setup as the shell tests), so the tools look missing, and the fixture checks the fake installer log to prove nothing ran.

### Live check (user)

Run `scripts/setup.sh`, choose all groups. Every group ends `✓`, or with a clear next step. Then say *check my setup* in Claude Code and compare.

## Later, not now

- Linux.
- Windows.
- Adding connectors from the script, if Claude Code gains a way to sign in from the command line.
- A `--fix` mode for the skill.
- Checking GitHub access for daily-worklog. It reads pull request activity by `worklog.github_login`, but its skill file names no tool for that, so the script checks nothing for it yet.
