---
name: wayfinder
description: "Use when the user hands over a plan, spec, ticket or goal for code not yet written and wants to see it as code: a path to a plan file with 'make this plan concrete', 'show me what this plan touches', 'map out this plan', 'which files would this plan change', or the word 'wayfinder'. Use it even when the question looks quick to answer in chat: the answer is one page in the vault with the files, functions and classes the plan touches or creates, along one path of the data, each part marked as in the plan, proposed or open. 'Make this plan concrete' means show the existing plan as code, never rewrite it, so it is not writing-plans'. A plan already written is this skill's, not code-walkthrough's planning offer. Not for writing a new plan ('write a plan for X', 'let's plan X'), carrying one out ('carry out this plan'), or explaining existing code ('how does X work', 'code walkthrough of X'). A proposal shown as decided is worse than an open question."
---

# Wayfinder

Follow the obsidian-vault skill's conventions. Wayfinder takes a plan for code not yet written and shows it on one page: one journey through the code, stop by stop. Each stop says whether it is new, changed, unchanged or built by another ticket. It shows today's code, checked, and a short sketch of the planned code, not checked. Every part of the plan says where it comes from: quoted from the plan, a proposal Wayfinder filled in, or an open question. The page, its data file and a short note go to the vault, written by code-walkthrough's build in plan mode.

- Wayfinder writes no code. It never edits, adds or commits a file in a code repo, and never carries out the plan, even when the goal reads like a task.
- Never write the user's plan file, spec or ticket. Everything Wayfinder adds lives in its data file and on the page.
- Output goes only to the vault: never into a code repo, a `docs/` folder or an outside service, even when the user asks for one. Say once, in the cost message, that the page holds code and local paths, then build to the vault. A copy elsewhere is the user's to make.
- Read only on code repos: every git command runs as `GIT_OPTIONAL_LOCKS=0 git …`. No fetch, no checkout, no stash, no `git worktree add`. `gh` and Jira are read only.
- chalk-talk only draws the map, and the build runs it. Do not follow chalk-talk's own skill, never write a `chalk-talks/` folder or a scene file, and never edit, copy or move chalk-talk.
- This skill uses code-walkthrough's scripts, not its steps. The commands are `node "<this skill's folder>/../code-walkthrough/scripts/walkthrough-build.mjs"` and `node "<this skill's folder>/../code-walkthrough/scripts/walkthrough-look.mjs"`.

## A run

1. **Vault and folder.** Find the vault and read `Meta/Config.md` by obsidian-vault. The folder is `folders.plans`; with no such key, use `Plans`, carry on, and ask about the key in one line of the reply. `active_client` is the data file's `client`. Each `work_roots` entry becomes one `--work-root`. Find chalk-talk as code-walkthrough does: look for `~/.claude/skills/chalk-talk/scripts/build.mjs`, then for `.claude/skills/chalk-talk/scripts/build.mjs` in the current project, and pass the folder that holds `scripts/` as `--chalk`. Found in neither place: `--chalk none`.
2. **Find the inputs.** Use only what the user named or said: the plan file, spec, ticket or goal they gave, or the plan in this conversation. Do not go looking for other plan files in nearby folders. With no input at all, ask once what the plan is, and wait. A goal given in chat is copied word for word into `sources` as a `chat` source.
3. **Look for a walkthrough of the same code**, once per repo, with the files the plan touches:

   ```
   node "<this skill's folder>/../code-walkthrough/scripts/walkthrough-look.mjs" --vault <vault> --folder <folders.walkthroughs, default Walkthroughs> --repo <repo folder name> --repo-path <repo top folder> --file <path from the repo top>...
   ```

   It prints `none` or one line per walkthrough. If one covers the code, use its stops for the unchanged and changed stops, and set `walkthrough` to its note name, taken only from a look-up line you just read. Make no offer to build a walkthrough.
4. **Pin the journey and the base.** One clean path of the data: one start, one end, about 4 to 12 stops. A larger plan: pick the first journey for this run and list the rest as next. The base is where today's code is read from:
   - the ref the plan names, such as `origin/release`;
   - otherwise the default branch, when the repo already has it locally: what `GIT_OPTIONAL_LOCKS=0 git -C <repo> rev-parse --verify --quiet --abbrev-ref origin/HEAD` prints (such as `origin/main`); when that prints nothing, the first of `origin/main` and `origin/master` that `GIT_OPTIONAL_LOCKS=0 git -C <repo> rev-parse --verify --quiet <ref>` finds;
   - otherwise the disk: no `base` in the data file, and today's code is read as it is on disk.

   Note the commit: `GIT_OPTIONAL_LOCKS=0 git -C <repo> rev-parse --short=7 <base, or HEAD for the disk>`. Never fetch, and never ask the user to fetch, commit or revert first.
5. **State the cost and ask once**, in one message. Leave out the lines that do not apply:

   ```
   Plan page for <journey>: from <start> to <end result>.
   <repo>: today's code read at `<base>` (commit <abc1234>).
   <repo>: today's code read as it is on disk, at commit <abc1234>, because there is no `origin/main` here.
   About <N> stops, about <2 × N> minutes. Map: <yes, drawn with chalk-talk | no, chalk-talk is not installed>.
   It goes to the vault.
   It goes to the vault. Not `<the place asked for>`: the page holds code and local paths.
   This run covers <the first journey>. Next, one plan page each: <the others>.
   Go ahead?
   ```

   Give the code line once per repo, in the base form or the disk form. Use the plain vault line, or the second one when the user asked for another place. Nothing is written or built before the yes: no working folder, no data file, no build.
6. **Trace.** Read today's code at the base: `GIT_OPTIONAL_LOCKS=0 git -C <repo> show <base>:<file> | sed -n '<a>,<b>p'`, or from disk when there is no base. Copy today blocks with a command, never retyped. For anything new or changed, write a sketch: the real signature in the repo's language, then about 5 to 15 lines of body.
7. **Mark the origin of every part.** Every stop that is new, changed or built by another ticket, every sketch, choice, task, test, risk and out-of-scope line gets a `from`, whose `kind` is one of these:
   - In the source: `plan`, with the source's words quoted word for word and the source named.
   - When the source's own words say proposed, pending, draft or awaiting sign-off, the entry is `review`, never `plan`. Never drop such a line: give it its own entry where it belongs (a choice at the stop it touches, or a test, risk or task), quote the pending statement itself, such as "files over 10 MB are refused", and set its `from.kind` to `review`.
   - A gap the plan leaves (a name, an order, a limit, a table, a step) becomes a `proposal`, with no quote. Never write a gap as a plan step.
   - A choice only the team can make becomes an `open` choice whose text is the question. A short goal nearly always leaves at least one.

   A plan file outside the repo is a `plan-file` source with its absolute path (no `~`). The full rules are in `references/plan-file.md`.
8. **Write the data file.** Read `references/plan-file.md` first. Find the working folder once, in the shell: `echo "${TMPDIR:-/tmp}/wayfinder/<slug>"` (`<slug>`: the short name in lower case, words joined by `-`). Use the printed path as it is for the data file (`<working folder>/<slug>.plan.json`), for `--out`, and for any helper script; outside the vault, a run makes nothing anywhere else. Then build, by Build and check.
9. **Reply**, by Reply.

## Build and check

```
node "<this skill's folder>/../code-walkthrough/scripts/walkthrough-build.mjs" "<working folder>/<slug>.plan.json" --out "<working folder>" --vault <vault> --folder <folders.plans> --chalk <chalk-talk folder | none> --work-root <each work_roots entry> --write
```

Nothing reaches the vault unless every check passes, so build with `--write` from the first round. Exit codes:
- **0**: every check passed. It printed the reply lines, then one `WROTE <path>` per file.
- **1**: a check or a shape rule failed. Each `FAIL <where>: <why>` line says where and what. Shape failures print alone, as `FAIL the plan: …`, before any other check: fix them all, and count that as a round. `references/plan-file.md` lists every line with its fix.
- **2**: the message says what: a bad argument, a refused place, or a data file the build cannot use. Fix that; it is not a round.
- **3**: `SAME DAY <names>`: this journey was already built today. Ask "Replace today's plan, or keep both?" and rerun with `--same-day replace` or `--same-day keep`.

The build writes what it learns back into the data file (`built`, the commits, `cited_files`, `checks`, `map_tool`, `earlier`, and a saved copy of each plan file in `sources`). Never write those by hand.

**Fix the data, never the check.** Fix the data file the build names. Never drop a check by changing a flag such as `--chalk`, never edit a script, and never loosen a quote to make it pass: re-quote the source, or make the entry a proposal. At most three build rounds. Still failing: stop, deliver nothing, and say in plain words what still fails.

## Writing rules

The build enforces these on each stop's `what`, `points` and `today`:
- One plain sentence of at most 30 words, then at most four bullets of at most 20 words each.
- No backticks, no file names and no function names in them: those live in the stop's header and its code. The check matches each cited function name as a whole word, with the same letter case, across the whole plan. So a function with a plain English name, such as `save`, makes that word unusable in every `what`, `points` and `today`; use another word, such as "stores".
- A changed stop says Today and Plan apart: `today` is how it works now, `what` and `points` are the plan.
- `takes` and `gives` are short names of a few words, reused word for word down the chain.

## Reply

Short, and never a retelling of the plan. The build prints the middle lines; put each in as printed, on its own line, with no bullet, indent or rewording. Leave out the lines that do not apply:

```
[[Plan - <short name>]]: <N> stops: <a> new, <b> changed, <c> unchanged, <d> built by another ticket.
<the build's Code: line, as printed>
<the build's Sources: line, as printed>
<the build's Map: line or lines, as printed>
<the build's Plan: line, as printed>
<the build's "Walkthrough of the same code" line, when printed>
Open questions, then questions about today's code:
<the build's numbered questions, as printed>
<P> proposals to confirm; each is tagged Proposal on the page.
`Meta/Config.md` has no `plans` key under `folders`. Add `plans: Plans`?
```

The wikilink is the note's `WROTE` file name without `.md`. With one proposal, the line reads "1 proposal to confirm; it is tagged Proposal on the page." The `Meta/Config.md` line is the last line when step 1 found no key, and the config changes only on a yes. The build's three files are the run's only vault writes: no daily-note line, no other note.

## A change request

When the user asks to change the plan ("change stop 3 to …"), make the change with no question first:
1. Copy the newest `.plan.json` of this journey from the vault folder into the working folder as `<slug>.plan.json`; the build refuses a data file inside the vault. Keep its `short_name` and `journey`.
2. Edit it. The user's words are part of the plan now: save them as a new `chat` source (`ref` `change 1`, then `change 2`) and quote them in the entries the change makes. An entry whose quote says the opposite of the change gets the new quote, or becomes a proposal.
3. Rebuild with the Build and check command plus `--same-day replace`. On a later day the build makes a new dated plan, linked as earlier.
4. Reply as above. The reply ends with "Your plan file would need to say:" and a short list of the lines the user would add or change in their own plan file. Wayfinder never writes to the user's plan file.

## Work chart

A plan page is not a work row, so a run writes none. A run makes many reads, so work-chart's Stop hook may say "not yet in the work chart": run `<plugin root>/hooks/work-chart-stamp.sh` with no arguments, where `<plugin root>` is two folders above this skill's folder.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| "Attachments now save to their own table, one row per file. Both new tests pass." | Wayfinder shows code not yet written; it never writes it. Carrying out the plan is not this skill's |
| "I rewrote `attachments-plan.md` with exact steps" | The plan file is the user's. What makes the plan concrete goes in the data file, and the gaps become proposals there |
| "Open it: `docs/attachments-plan.html` in the repo." | A folder the user mentions is not where the page goes. Say once that it goes to the vault, then build there |
| Building, editing or tracing on the first turn, with no "Go ahead?" | The user has not agreed to the time. Ask once; the yes starts the trace |
| "I kept it marked "Proposed, awaiting sign-off" and did not build it into the steps." | Prose leaves no record the page can show. The data file carries it as an entry whose `from.kind` is `review` |
| Filling a gap ("caps the list at 20", "in one transaction") as a plain step | It reads as decided. Mark it a proposal, or an open question when only the team can decide |
| "Your plan marks it "proposed, awaiting sign-off"" about a plan the user never gave | Use only the inputs the user named or said |
| Following chalk-talk's own skill, or `--chalk none` to get past a map failure | The build runs chalk-talk. Fix the data, never the check |
