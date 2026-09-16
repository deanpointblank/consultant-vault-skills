---
name: work-chart
description: Keep a plain-language record of goal-directed work as it happens, one note per ticket or topic per day: what was done, why, and what was decided. That covers code changes in any repo, research, coordination, design, and dead ends. Use whenever work toward a goal finished or was dropped in this session: a task finished, tests ran, a commit was made, or research for a goal ended, answered or not; whenever a Stop hook reports "not yet in the work chart"; whenever the user asks "what did you just do", "why did you change X", or "explain that diff"; and when the user says "set up the work chart". Work nobody wrote down is work the developer cannot explain tomorrow.
---

# Work chart

Follow the obsidian-vault skill's conventions. One note per ticket per day in `folders.work`. No `work` key in `Meta/Config.md`: the folder is `Work` — create it and write the rows there now. The rows never wait for an answer; ask about the config key in one line above the Work line, which is still the last line of the reply. Filename `KEY Work YYYY-MM-DD.md`. No ticket: `Work - <topic> YYYY-MM-DD.md`, with a short plain topic ("pallet weight units"); later work toward the same goal that day goes in the same note. Template: vault templates folder first, else this skill's `templates/Work.md`.

## When rows get written

- A task finished, tests ran, a commit was made, research toward a goal reached an answer or a dead end, or the user changed subject: write rows for everything since the last row.
- Who writes: the agent that did the work. The one exception is a worker dispatched to do one task of a larger plan (subagent-driven development); it leaves the rows to the agent that dispatched it, which writes them from the worker's report. An agent doing the user's work directly writes its own rows, including one that another agent started to act on its own.
- The Stop hook said "… not yet in the work chart": write the rows, run the stamp script, then print the Work line. The message names repos with changes, files outside git, and counts of research calls and outward calls (outward: something other people see, such as a Jira comment or a sent email). The counts say where to look; the rows follow the goal-directed stretches, however many calls each one took. A named repo changed on disk, not necessarily in this conversation: a change made by hand, in an editor, or before this session started gets its row too, and the stamp names it. A change nobody explained: `why` says "not stated", and one line above the Work line asks for it. A research row always states the goal it served.
- The message names no repo with changes and no file outside git, and nothing since the last row had a goal behind it: no row, no work note, no daily-note line. A question is research only when it serves a goal: a ticket, a decision, a change to make. Explaining existing code or a concept on request is a plain question, however many files the answer took to read. Run the stamp script with no arguments so the hook goes quiet, then end the reply with the answer.

Write the rows; do not offer to write them.

## One row per stretch

Frontmatter per the property schema: `type: work`, `jira` with the ticket first (empty with no ticket), `date`, `repos` as quoted wikilinks for every repo touched (`"[[phenix.appointments]]"`), `areas` as plain words for the parts touched ("migration loader", "appointment details API", "Jira triage"), `changes` equal to the row count.

First line under the title: one sentence saying what the day's work on this ticket or topic was about. Rewrite it as rows are added.

One table: `when | what | why | decided`.

- One row per goal-directed stretch, concluded or dropped: a fix, a refactor, a plan task, a piece of research, a question put to someone, a design. Not per turn, per file, or per commit. Two changes with different reasons are two rows even in one edit — the code change and the doc line that announces it each get their own `why`.
- Rows cover the user's work only. Reading this skill, running the stamp script, and working around a tool or sandbox problem in order to record rows are upkeep of this record, not rows.
- `what` for a code change: the repo and path of what changed, and the commit when there is one. A file in no repo: its `~`-shortened path, such as `~/Code/StrideClients/UsCold/scratch/pallet-query.sql`; it adds nothing to `repos`.
- `what` for work that changed no code: open with a plain verb — Researched, Compared, Drafted, Asked, Designed, Traced — and end with the outcome: what was found, or where it stopped.
  - "Researched Flyway baseline options in the vendor docs; found `baselineOnMigrate` covers it."
  - "Traced where `palletCount` is set in USCS-BE; dead end, the value comes from a stored procedure nobody can read."
  - "Asked the product owner in PFD-65947 which weight units to show; waiting."
  - "Designed the multi-repo work-chart hook; spec agreed."
- `why`: one sentence in the reader's words. The reason, not the ticket key.
- `decided`: the call and its reason, or "none". A stretch that stopped starts with "dropped:" (given up) or "open:" (waiting on someone or something) and says why: "dropped: no access to the database", "open: only the billing team can say which rate table applies". A call that constrains future work or a reviewer would question also becomes a `proposed` decision note through the decisions skill; the cell links it.
- Everyday words. The words session, ledger, hook, stamp, and controller do not appear in the note.

After writing: update the first line, `changes`, `areas`, `repos`. Daily note: `- HH:MM work on [[KEY Work YYYY-MM-DD]]: N changes`, once per work note per day, then edit the count in place; add the key to the daily note's `jira` list. Then, in order:

1. Dossier line. For each repo in `repos` that has no note in `folders.repos`, and that no earlier work note from today already lists: one line above the Work line suggests one — "`phenix.appointments` has no dossier note yet; say "dossier phenix.appointments" to start one." Suggest; the dossier gets created only when the user says so.
2. Stamp. Run the stamp script by its full path from wherever you are working, with no `cd`: it is `hooks/work-chart-stamp.sh` under the plugin root, which is two directories above this skill's folder. Its arguments are the full paths of the repos the new rows name, and nothing else; with no such repo, or no rows, it takes no arguments, and that is a valid run. Examples: `<plugin root>/hooks/work-chart-stamp.sh ~/Code/StrideClients/UsCold/phenix.appointments`, or just `<plugin root>/hooks/work-chart-stamp.sh`. The script's path counts as a run when it is the first word of a command: at the start, after `&&`, `||`, `;` or a line break, or after `bash` or `sh`. A `VAR=value` in front of it hides the run.
3. End the reply with the Work line. This holds for every reply that writes or confirms rows, including each answer to the hook's message: the Work line is the last line, and nothing follows it. Notes, caveats, and questions go above it.

`Work: <N> changes today on <KEY or topic>; last: <newest row's what, first clause>`

## Answering "what did you just do"

What, why, where to read more; at least three lines. Cite the work note as a wikilink — `[[PFD-65947 Work 2026-09-10]]`, not a file path — so the reader can open it. No rows yet: write them first, then answer. A read-back changes no file.

## Setup

"Set up the work chart", or a first write with no `folders.work` key. Setup creates the place the rows live; it is not a chart over notes that already exist.

1. Create `<folders.work>`, or `Work` when the key is missing.
2. Copy this skill's `templates/Work.base` into it as `Work.base` unless one exists.
3. Create `~/.config/vault-skills/work-stamp/`.
4. Ask the user to confirm `work: Work` under `folders` in `Meta/Config.md`; edit it only on their yes. Steps 1-3 do not wait for that answer.
5. No `work_roots` list in `Meta/Config.md`: ask to add one, in the same question as step 4 when both are missing. Suggest the folder above the vault's git repo top: `git -C <vault> rev-parse --show-toplevel`, then its parent. For a vault at `~/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes` that is `~/Code/StrideClients/UsCold`. Edit it only on their yes. Vault in no git repo: suggest nothing, and say only the vault folder counts.
6. Say in one line whether each hook is present in the plugin's `hooks/hooks.json` at the plugin root: `PostToolUse` (notes work as it happens) and `Stop` (asks for rows). Either one absent: rows are written at pauses only.

The hooks count work only inside a `work_roots` folder, or inside the vault folder when the list is missing; say so when the user works somewhere else.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| One row per file | The reader wants "added the migration", not six paths |
| Rows "matching the hook's count of 6 research-kind calls" | The counts point at the work; the stretches set the rows |
| "Read `scripts/import.sh` and ran `git log --all --stat` on that repo …" | Says what was opened, not what was learned; open with the verb and end with the outcome |
| "decided: none — dead end …" | The stop reason belongs after "dropped:" or "open:", where a reader scanning the column sees it first |
| A row for "Read the work-chart skill's instructions and templates" | Upkeep of the record, not the user's work; it also drags banned words into the note |
| `why` restates the ticket | The key is in the frontmatter; the reason is what the diff cannot give back |
| "decided: none" on a call a reviewer would question | The handoff's rulings section and the decisions folder both miss it |
| Rows only at the end of the session | The rows should exist before the developer asks, not after |
| Offering instead of writing — "tell me if you want this logged there" | Nothing gets recorded, and the reasoning is gone by the next turn |
| A daybook line instead of a work note | The daily note is the spine; the rows live in the work note it links |
| Skipping the stamp, including after deciding no row is needed | The hook asks for the same rows again at the next stop |
| Naming the repo in the stamp after a question with no goal | It marks that repo's changes as recorded when no row holds them |
| Writing the stamp file by hand | Only a run of the script counts; the hook asks again |
| Writing a row for a question with no goal | The chart fills with noise nobody will read |
| Noticing a repo has no dossier and stopping there — "out of scope for this task" | The one-line suggestion is the step; the user decides |
| The wrong writer: a plan-task worker writing its own rows; any other agent refusing — "Subagents never write this note … I'm a subagent in this run" — or handing the call on — "that call is yours as controller" | A plan-task worker's dispatcher has the reports and the diff; every other agent that did the work decides and writes: rows, or no rows and a stamp with no arguments |
| A line after the Work line — "worth a `chmod +x` if it's meant to be run directly", "Want me to add `work: Work` under `folders`?" | Caveats and questions go above the Work line, which goes last (step 3) |
| Citing the note as a path — "from `vault/Work/PFD-65947 Work 2026-09-10.md`" | Nothing to click; `[[PFD-65947 Work 2026-09-10]]` opens it |
| "I read it as 'a chart of my work' and built the Bases dashboard" | A chart at the vault root over notes nobody has written yet; Setup comes first |
| "The term appears nowhere in the vault … so I inferred it from state" | Half-finished files in the vault are not the request; Setup is |
| Guessing, then offering a redo — "say so and I'll redo it" | One question before building beats one rebuild after |
| Adding `work: Work` or `work_roots` to `Meta/Config.md` before the user says yes | It is the user's config; steps 4 and 5 ask, then edit |
| "Blocked — one question before I write the work-chart rows … `Meta/Config.md` has no `folders.work` key" | The key names the folder; it does not gate the rows. `Work` is the default until the user picks another |
| Holding the folder, the base and the stamp folder for the same yes | Only the config lines are the user's to approve; the rest is this skill's own scaffolding |
| One row for the whole task — "`scripts/import.sh` and `README.md` — added a `--dry-run` flag …, and put the flag in the README usage line" | Two reasons, two rows; `changes` and the Work line both count what the reader will look for |
| "This change was already there before this session started — I didn't make it, so I won't log it" | The rows record the repo, not the conversation; write what changed, put "not stated" in `why`, and ask for the reason in one line above the Work line |
