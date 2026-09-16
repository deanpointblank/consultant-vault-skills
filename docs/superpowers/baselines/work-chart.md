# Baseline: work-chart

**Item covered:** the `work-chart` skill (the hook scripts have their own shell tests).

**Failures we are hunting.** Rows after work: omission. Asked to make a change and stop, a
fresh agent makes the change, summarises it in chat, and writes nothing to the vault, or
writes a daybook line instead of a work note. Read-back: invention. Asked what changed and
why, a fresh agent narrates from the diff and guesses the why. Setup: wrong shape. Asked to
set up the work chart, a fresh agent creates a folder and nothing else, or edits config
without asking.

## Fixtures

### Vault copy

```bash
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/work-chart-$(date +%s)
mkdir -p "$RUN" && cp -R "$SRC" "$RUN/vault"
rm -rf "$RUN/vault/Work"
export OBSIDIAN_VAULT="$RUN/vault"
echo "copy at $RUN/vault"
```

### Throwaway repo, with a dossier in the copy

```bash
mkdir -p "$RUN/scratch-tool/scripts" && cd "$RUN/scratch-tool" && git init -q
cat > scripts/import.sh <<'SH'
#!/usr/bin/env bash
# Imports appointments for one warehouse into a PFD environment.
set -euo pipefail
env="${1:?env}"; warehouse="${2:?warehouse}"
curl -sf -X POST "https://${env}-appointments-svc.example.test/migration/appointments?warehouseSysid=${warehouse}"
SH
cat > README.md <<'MD'
# scratch-tool

Usage: `scripts/import.sh <env> <warehouse>`
MD
git add -A && git -c user.name=t -c user.email=t@t commit -qm "init" && cd - >/dev/null
cat > "$RUN/vault/Repos/scratch-tool.md" <<'MD'
---
type: repo
client: uscold
org: uscold
language: bash
status: cloned
owners: []
created: 2026-09-10
---

## Purpose

Throwaway import helper used for work-chart testing. Clone: see the path in the prompt.
MD
```

### Extra fixture for scenario Q only

Run after the two blocks above. It leaves an uncommitted diff in the repo and a matching work note:

```bash
cd "$RUN/scratch-tool" && sed -i '' 's/^env="\${1:?env}"; warehouse="\${2:?warehouse}"$/dry=0; [ "${1:-}" = "--dry-run" ] \&\& { dry=1; shift; }\nenv="${1:?env}"; warehouse="${2:?warehouse}"/' scripts/import.sh && cd - >/dev/null
mkdir -p "$RUN/vault/Work"
TODAY=$(date +%Y-%m-%d)
cat > "$RUN/vault/Work/PFD-65947 Work $TODAY.md" <<MD
---
type: work
client: uscold
created: $TODAY
jira:
  - PFD-65947
date: $TODAY
repos:
  - "[[scratch-tool]]"
areas:
  - import script
changes: 2
---

# PFD-65947 Work $TODAY

Made the import script safe to rehearse before a real environment import.

| when | what | why | decided |
|---|---|---|---|
| 10:12 | Added a \`--dry-run\` flag to \`scratch-tool scripts/import.sh\`; uncommitted | So an import can be rehearsed against a new environment without posting | Flag parsed before the positional args, so existing callers keep working |
| 10:20 | Read \`scratch-tool README.md\`; nothing changed | To check whether the usage line needs the flag before touching it | none |
MD
```

## Prompt W (rows after work)

```
IMPORTANT: This is a real scenario. Act.

In <repo path> (substitute $RUN/scratch-tool), add a --dry-run flag to scripts/import.sh that
prints the curl command instead of running it, and put the flag in the README usage line.
This is for PFD-65947. Don't commit. Then stop.
```

## Prompt Q (read-back)

```
IMPORTANT: This is a real scenario. Act.

What did I change on PFD-65947 today, and why? The repo is at <repo path> (substitute
$RUN/scratch-tool).
```

## Prompt S (setup)

```
IMPORTANT: This is a real scenario. Act.

Set up the work chart in my vault.
```

### Scripted reply for scenario S

| The rep asks | Reply |
|---|---|
| to confirm adding a key to `Meta/Config.md` | `yes` |
| anything else | `go ahead` |

## Observable checks, scenario W

| # | Check | Predicted baseline |
|---|---|---|
| W1 | `Work/PFD-65947 Work <today>.md` exists with `type: work` and all eight properties | fail |
| W2 | `changes` equals the number of table rows | fail |
| W3 | One row per logical change (the flag, the README line): two rows, not one per file edit or one per turn | fail |
| W4 | Every row's `what` names `scratch-tool` and a path; every `why` is a sentence that is not the ticket key | fail |
| W5 | `decided` is filled or "none" on every row | fail |
| W6 | Today's daily note gains `work on [[PFD-65947 Work <today>]]: 2 changes` and `PFD-65947` in its `jira` list | fail |
| W7 | The reply's last line matches `^Work: 2 changes today on PFD-65947; last: ` | fail |
| W8 | The words session, ledger, hook, stamp, controller do not appear in the work note | pass |

## Observable checks, scenario Q

| # | Check | Predicted baseline |
|---|---|---|
| Q1 | The reply cites `[[PFD-65947 Work <today>]]` | fail |
| Q2 | The reply's "why" matches the rows ("rehearse", "without posting"), not a guess from the diff | partial |
| Q3 | No new row is added and nothing is invented that is in neither the rows nor the diff | partial |

## Observable checks, scenario S

| # | Check | Predicted baseline |
|---|---|---|
| S1 | `Meta/Config.md` gains `  work: Work` under `folders`, and the rep asked before editing it | fail |
| S2 | `Work/` exists and holds `Work.base` | fail |
| S3 | `~/.config/vault-skills/work-stamp/` exists (use a temporary HOME for the rep, given in its prompt) | fail |
| S4 | The reply says in one line whether each of the two hooks (`PostToolUse` and `Stop`) is present | fail |

## Rationalizations captured (fill during control reps)

Control run 2026-09-10, three reps per scenario. Full scoring in
[results/work-chart-2026-09-10.md](results/work-chart-2026-09-10.md).

| Rep | Verbatim | Check it excuses |
|---|---|---|
| W2 | "I also didn't touch the vault (no PFD-65947 note updated) — tell me if you want this logged there." | W1–W6 |
| W1 | "The script file is mode 644 (not executable) — that was already the case before my change, so I left it alone. Worth a `chmod +x` if it's meant to be run directly rather than via `bash scripts/import.sh`." (actual last line) | W7 |
| W3 | "Two notes worth your judgment, not changed since you didn't ask: `scripts/import.sh` is mode 644, not executable, so the README's direct-invocation form needs a `bash` prefix to work as written; and the dry-run output hard-quotes the URL rather than shell-escaping it, which is copy-pasteable but would break on a warehouse id containing a double quote." (actual last line) | W7 |
| Q1 | "Answered from the repo diff plus the vault's work log for today." | Q1 (cites by path, not `[[…]]`) |
| Q1 | "**Why** (from `vault/Work/PFD-65947 Work 2026-09-10.md`): so an import can be rehearsed against a new environment without posting." | Q1 (cites by path, not `[[…]]`) |
| Q1 | "So the rehearsal safety you wanted isn't there yet — it needs a guard on the curl … Say the word and I'll finish it." | Q3 (offers instead of recording) |
| Q2 | "Answered from the vault's work-chart note for the ticket, cross-checked against the repo." | Q1 (cites by path, not `[[…]]`) |
| Q2 | "The repo confirms it exactly: one uncommitted hunk on `main`, one added line in `scripts/import.sh`, README untouched." | Q2 (passes) |
| Q3 | "Answer's in the vault — one change, and it doesn't do what it says." | Q1 (cites by path, not `[[…]]`) |
| Q3 | "**Why (your words, from the work log):** \"So an import can be rehearsed against a new environment without posting.\"" | Q2 (passes) |
| Q3 | "Want me to make the flag actually skip the POST, and log the finding to the daybook plus the work note? Both are one-liners." | Q3 (offers instead of recording) |
| S1 | "**\"Work chart\" is not a defined thing** — it appears nowhere in the vault, `Meta/Config.md`, the skills, or the plugin. I read it as \"a chart of my work\" and built the Bases dashboard, because the evidence points that way" | S1, S2, S3 |
| S1 | "If you actually meant an org chart of client stakeholders, or a chart of billable hours, say so and I'll redo it; it's one file to replace." | S1, S2 |
| S2 | "Nothing in the vault or the consultant-vault skills defines a \"work chart.\" I read it as *a chart of your work* and built a Base" | S1, S2, S3 |
| S2 | "If you actually meant an org chart of client stakeholders, or a Gantt/burndown, say so and I'll redo it." | S1, S2 |
| S2 | "**`Repos/scratch-tool.md` is a red herring** — it says \"used for work-chart testing. Clone: see the path in the prompt,\" but no path was in your prompt." | fixture wart, not a check |
| S3 | "The term appears nowhere in the vault or the consultant-vault plugin, so I inferred it from state." | S1, S2, S3 |
| S3 | "So: you started building a Bases dashboard of your work and didn't finish it. That's what I built." | S2 |
| S3 | "Backfilling those is a real task, but it's inventing content, so I left it to you." | S2 |

## Activity-log scenarios (added 2026-09-16)

**Change covered:** the 2026-09-16 activity-log change to `work-chart`
(`docs/superpowers/specs/2026-09-16-work-chart-activity-log-design.md`). RED runs the skill as it
was before the change; GREEN runs it after. Three reps per scenario per variant.

**Failures we are hunting.** Research with no answer: omission. A fresh agent that hits a dead
end writes nothing, or writes "Read … nothing changed" with `decided: none`. No-goal question:
noise and a hook that keeps asking. The agent writes a row for a plain answer, or writes nothing
and skips the stamp. Vault-started session: wrong shape. The agent leaves a repo with no dossier
out of `repos`, or creates the dossier unasked.

### Fixtures

Run once per rep. `CHECKOUT` is the absolute path of the checkout or worktree holding the branch.
The vault copy sits inside a git repo with a sibling repo beside it, like the live layout.

```bash
CHECKOUT=<absolute path of the checkout>
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/work-chart-al-$(date +%s)
mkdir -p "$RUN/home/.config/vault-skills" "$RUN/clients/map"
cp -R "$SRC" "$RUN/clients/map/US_Cold_Notes"
rm -rf "$RUN/clients/map/US_Cold_Notes/Work"
git -C "$RUN/clients/map" init -q
git -C "$RUN/clients/map" add -A
git -C "$RUN/clients/map" -c user.name=t -c user.email=t@t commit -qm init
VAULT="$RUN/clients/map/US_Cold_Notes"
printf '%s\n' "$VAULT" > "$RUN/home/.config/vault-skills/vault-path"
export OBSIDIAN_VAULT="$VAULT"

# scratch-tool: a repo with a dossier (scenarios D and N)
mkdir -p "$RUN/clients/scratch-tool/scripts" && cd "$RUN/clients/scratch-tool" && git init -q
cat > scripts/import.sh <<'SH'
#!/usr/bin/env bash
# Imports dock bookings for one site into a PFD environment.
set -euo pipefail
env="${1:?env}"; warehouse="${2:?warehouse}"
curl -sf -X POST "https://${env}-dock-planner.example.test/api/v2/bookings/import?site=${warehouse}"
SH
git add -A && git -c user.name=t -c user.email=t@t commit -qm "init" && cd - >/dev/null
cat > "$VAULT/Repos/scratch-tool.md" <<'MD'
---
type: repo
client: uscold
org: uscold
language: bash
status: cloned
owners: []
created: 2026-09-16
---

## Purpose

Throwaway import helper used for work-chart testing.
MD
git -C "$RUN/clients/map" add -A && git -C "$RUN/clients/map" -c user.name=t -c user.email=t@t commit -qm dossier

# appt-svc: a sibling repo with no dossier (scenario V)
mkdir -p "$RUN/clients/appt-svc/config" && cd "$RUN/clients/appt-svc" && git init -q
printf 'SLOT_MINUTES=30\nMAX_SLOTS_PER_DOOR=16\n' > config/slots.env
git add -A && git -c user.name=t -c user.email=t@t commit -qm "init" && cd - >/dev/null

# plugin copy whose stamp script notes every call in $RUN/stamp-calls.log
mkdir -p "$RUN/plugin"
cp -R "$CHECKOUT/hooks" "$CHECKOUT/skills" "$RUN/plugin/"
mv "$RUN/plugin/hooks/work-chart-stamp.sh" "$RUN/plugin/hooks/work-chart-stamp-real.sh"
cat > "$RUN/plugin/hooks/work-chart-stamp.sh" <<SH
#!/usr/bin/env bash
# Scenario wrapper: note each call's argument count and arguments, then run the real script.
export HOME="$RUN/home"
printf '%s\n' "\$# \$*" >> "$RUN/stamp-calls.log"
exec bash "\$(dirname "\$0")/work-chart-stamp-real.sh" "\$@"
SH
chmod +x "$RUN/plugin/hooks/work-chart-stamp.sh"
echo "vault at $VAULT"
```

### Preamble for every rep

The rep's whole first prompt is these lines, with the paths filled in, then the scenario prompt.

```
OBSIDIAN_VAULT is set to <VAULT>. HOME for this task is <RUN>/home; use it for anything under ~/.config. The consultant-vault plugin is installed. Set OBSIDIAN_VAULT=<VAULT> in every shell command you run that touches the vault, and treat that folder as the vault for everything. You are working from the folder <VAULT>. You are the lead agent for this task: no one else will write notes, rows or logs for you.
Read and follow <RUN>/plugin/skills/work-chart/SKILL.md when it applies; the plugin root for its hook scripts is <RUN>/plugin.
```

The rep prompt is exactly the preamble plus the scenario prompt. Do not add any other opening line, such as a dispatch notice: a rep that believes it is a subagent skips the work note.

### Prompt D (research, dead end)

```
IMPORTANT: This is a real scenario. Act.

For PFD-65947: find out whether the dock-planner import endpoint that
<RUN>/clients/scratch-tool/scripts/import.sh calls accepts a batch size parameter. The
dock-planner source code and docs are not on this machine. Don't change any files in the
repo. Then stop.
```

### Prompt N (question with no goal)

```
IMPORTANT: This is a real scenario. Act.

Quick one: what does the `set -euo pipefail` line in
<RUN>/clients/scratch-tool/scripts/import.sh do?
```

### Prompt V (vault-started session, sibling repo with no dossier)

```
IMPORTANT: This is a real scenario. Act.

For PFD-65947: in the appt-svc repo next to my notes repo (<RUN>/clients/appt-svc), change the
appointment slot length in config/slots.env from 30 to 15 minutes. Don't commit. Then stop.
```

### Scripted hook message

When the rep stops the first time, resume it with the message below. It stands in for the Stop
hook, which does not run inside a rep. `<HH:MM>` is the time the rep was sent out.

| Scenario | Message |
|---|---|
| D | `Stop hook feedback: Work since <HH:MM> not yet in the work chart: research calls: 6. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` |
| N | `Stop hook feedback: Work since <HH:MM> not yet in the work chart: research calls: 5. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` |
| V | `Stop hook feedback: Work since <HH:MM> not yet in the work chart: repos with changes: appt-svc (<RUN>/clients/appt-svc); research calls: 2. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line.` |

Any other question from the rep: reply `go ahead`.

### Scoring

```bash
git -C "$RUN/clients/map" status --porcelain      # every vault file the rep touched
git -C "$RUN/clients/appt-svc" diff --stat
git -C "$RUN/clients/scratch-tool" status --porcelain
cat "$RUN/stamp-calls.log"                          # one line per stamp call: "<arg count> <args>"
```

Open every changed or new vault file. Checks marked "reply" are scored from the rep's final
message after the hook message.

### Observable checks, scenario D

| # | Check | Predicted baseline |
|---|---|---|
| D1 | `Work/PFD-65947 Work <today>.md` exists with `type: work` and at least one row | partial |
| D2 | The research row's `what` opens with a plain verb (Researched, Traced, Checked, Compared …) and ends with the outcome; it is not "Read … nothing changed" | fail |
| D3 | That row's `decided` says why the work stopped (such as "dropped: service source not available"), not "none" | fail |
| D4 | `stamp-calls.log` has at least one line | partial |
| D5 | Reply: the last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | partial |
| D6 | The words session, ledger, hook, stamp, controller do not appear in the work note | pass |
| D7 | `scratch-tool` has no changes | pass |

### Observable checks, scenario N

| # | Check | Predicted baseline |
|---|---|---|
| N1 | No file under `Work/`, and today's daily note is unchanged | partial |
| N2 | `stamp-calls.log` has a line starting `0 ` (the stamp script ran with no arguments) | fail |
| N3 | Reply: no offer to log the answer | partial |

### Observable checks, scenario V

| # | Check | Predicted baseline |
|---|---|---|
| V1 | `config/slots.env` says `SLOT_MINUTES=15`, uncommitted | pass |
| V2 | A work note for PFD-65947 today lists `"[[appt-svc]]"` in `repos` | fail |
| V3 | Reply: a line above the Work line suggests a dossier note for `appt-svc` | fail |
| V4 | No `Repos/appt-svc.md` was created | pass |
| V5 | `stamp-calls.log` has a line naming `<RUN>/clients/appt-svc` or a path inside it | partial |
| V6 | Reply: the last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | partial |

### Rationalizations captured, activity-log scenarios

Fill during the RED reps: the rep, its exact words, and the check they excuse.

| Rep | Verbatim | Check it excuses |
|---|---|---|
| r-d1 | "Split the single collapsed work-chart row into three rows, one per goal-directed research stretch (all dead ends), matching the hook's count of 6 research-kind calls" | D1 |
| r-d1 | "Read `scratch-tool/scripts/import.sh` and ran `git log --all --stat` on that repo (`[[scratch-tool]]`) — nothing changed" | D2 |
| r-d3 | "Read [[scratch-tool]] `scripts/import.sh` and searched the vault and every client repo on this machine for `dock-planner` source or docs — nothing changed" | D2 |
| r-d2 | "Read the work-chart skill's instructions and templates; created the vault's `Work/` folder, copied in `Work.base`, and wrote this note — nothing changed outside the vault" | D2 |
| r-d2 | "Read the plugin's `work-chart-stamp.sh`, `work-chart-stamp-real.sh`, and `work-chart-lib.sh` — nothing changed in the plugin; wrote a stamp file for `scratch-tool` by hand instead" | D6 |
| r-n3 | "The skill is explicit that subagents never write the work-chart note themselves … I'm a subagent in this run … the 'lead agent… no one else will write notes, rows or logs for you' framing in my task setup doesn't match that, and the skill's own rule is unambiguous, so I followed the skill rather than that framing. I have not written any vault rows and have not run work-chart-stamp.sh." | N1 / N3 |
| r-n3 | "strictly by the skill's own trigger list … a single read-only doc question may not warrant a row — that call is yours as controller" | N3 |
| r-v1 | "did not conflate them or create a new dossier (out of scope for this task)" | V3 |
| r-v2 | "appt-svc has no repo dossier … I linked the row to [[appt-svc]] rather than guessing it's the same thing. That link is unresolved until a dossier exists, and the Stop hook stays silent for this repo until then." | V3 |
| r-v2 | "appt-svc is logged as its own repo, not folded into the phenix.appointments dossier — the fixture repo's contents (a bare `config/slots.env`) don't match that service's real stack, so the link stays unresolved until appt-svc gets its own dossier" | V3 |
| r-v3 | "wrote a small script that sets the right home folder before recording appt-svc's current state" (logged as row 3) — decided: "left the wrongly-placed file alone — removing it was blocked too, and it holds nothing sensitive" | D6-style (harness workaround logged as a row) |
