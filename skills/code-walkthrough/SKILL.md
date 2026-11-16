---
name: code-walkthrough
description: Walk through one journey in real code so the user can explain and extend it. Each stop shows the actual lines and why, every reason quoted from its source or marked not recorded. One page in the vault plus a short note. When the user plans to change or add to existing code ("let's plan X", picking up a ticket), use it at the start, alongside brainstorming or plan mode; it points to a walkthrough or offers one, and builds only on a yes. Also use whenever the user says "code walkthrough of X", "deep walkthrough of X", "I need to be able to explain X", "help me understand X well enough to extend it", "how was X built, so we can extend it", or "prep me to explain X in refinement" with a feature or code named. Not for "prep me for refinement" with nothing named. "How does X work", "walk me through" and explaining a PR are chalk-talk's; "explain that diff" is work-chart's; "what does this repo do" is repo-dossier's; "explain this to my team" is frames'. An unrecorded reason said as fact is worse than none.
---

# Code walkthrough

Follow the obsidian-vault skill's conventions. A walkthrough follows one journey through real code, start to finish, following the data: each stop shows the actual lines, what they do, data in and out, and why, and the walkthrough names where the code would be extended. It ends as three files in the vault, written by the build: a page, its data file and a short note. The page and the note are for the user's own reading.

- Output goes only to the vault: never into a code repo or onto an outside service, even when the user mentions a handy place such as a folder in the repo. Asked outright for another place, say once, in the cost message, that the page holds code and local paths, then build to the vault. A copy elsewhere is the user's to make.
- Read only on code repos: every git command runs as `GIT_OPTIONAL_LOCKS=0 git …`. No checkout, no stash, no `git worktree add`. `gh` and Jira are read only.
- In a walkthrough, chalk-talk only draws the map, and the build runs it. Do not follow chalk-talk's own skill, never write a `chalk-talks/` folder, and never edit chalk-talk or copy it into this plugin.
- The commands are `node "<this skill's folder>/scripts/walkthrough-build.mjs"` and `node "<this skill's folder>/scripts/walkthrough-look.mjs"`.

What was asked decides where to start:
- To understand, explain or extend a feature or a path through code, in any of the description's phrases: A run, which starts with the cost question.
- Planning a change to a code repo: Planning: the offer, ahead of the planning skill's own steps.
- A single "why" about one choice in the code (one value, one rule, one call): answer it in chat by the rule in Reasons, from the places it lists. No run, no file.

## Planning: the offer

When the user starts planning a change to a code repo (brainstorming a feature, plan mode, "let's plan X", picking up a ticket), add one step before any plan is written. It replaces and reorders nothing in brainstorming, writing plans or ticket-intake.

Skip the step, and say nothing about walkthroughs, for:
- an area the user declined in this conversation (the area is the change being planned and every follow-up to it);
- a walkthrough run under way.

A walkthrough the user asks for outright is a run all the same.

Otherwise look first, whatever the size of the change, once per repo the change touches, with the vault and folder found as in step 1 of A run:

```
node "<this skill's folder>/scripts/walkthrough-look.mjs" --vault <vault> --folder <folders.walkthroughs> --repo <repo folder name> --repo-path <repo top folder>
```

`--repo` is the repo's folder name, as in `[[name]]` on its notes. `--repo-path` is its top folder (`git rev-parse --show-toplevel`). It prints `none`, or one line per walkthrough of that repo, newest first. For each line, open the data file beside the note (its page's name with `.html` swapped for `.walkthrough.json`): the walkthrough covers the change when its `cited_files` include files the change will touch.

- **One covers it.** Say so in one line: the wikilink, its commit, its date, and how its look line ends. Read the note's outline and the stops that matter in the data file. Say which stops and extend points the change touches ("stop 4", "`src/billing/Invoice.java:40-58`"), and cite them in the plan.
- **It covers it, but its line ends otherwise** (`N of M cited files changed since`, `its commit is no longer in the repo`, `its commit was not recorded`, `its cited files could not be checked`): do all of the above, then say what the line said and offer a rebuild with the time: "Rebuild it first? About <2 × its stops> minutes." Yes: A rebuild (end of A run); the yes answers the cost question. No: plan with it as it is. A rebuild is never offered as a new walkthrough.
- **None covers it, and the change is brand-new code with nothing existing to walk through, or adds no behaviour** (a reworded comment, a renamed variable, new wording for a label). A new rule, check or branch adds behaviour, however few lines it takes, because it has to fit the code around it. In these two cases make no offer and say nothing about walkthroughs, not even why there is none; go straight to planning.
- **None covers it, for any other change.** Offer one in a single line with the time, then wait for the answer before any plan: "No walkthrough covers the booking save path yet. Want one before we plan? About <2 × N stops> minutes."
  - Yes: A run, the journey being the path the change will touch. The yes answers the cost question, so step 4 only confirms the journey. Then planning resumes with the walkthrough to hand.
  - No: plan on, with no further offer or mention of one for that area in this conversation.

The time is about 2 minutes a stop, from a rough count of the stops. Never start a run without a yes.

## A run

1. **Vault and folder.** Find the vault and read `Meta/Config.md` by obsidian-vault. The folder is `folders.walkthroughs`; with no such key, use `Walkthroughs`, carry on, and ask about the key in one line of the reply, as work-chart does for `folders.work`. `active_client` is the data file's `client`. Each `work_roots` entry becomes one `--work-root`.
2. **chalk-talk.** Look for `~/.claude/skills/chalk-talk/scripts/build.mjs`, then for `.claude/skills/chalk-talk/scripts/build.mjs` in the current project. Pass the folder that holds `scripts/`, such as `~/.claude/skills/chalk-talk`, as `--chalk`. Found in neither place: `--chalk none`.
3. **Pin the journey.** Find the repo or repos and the entry point, name the start and the end result, and sketch the stops. Read only enough to sketch. One journey per walkthrough: one start, one end result, about 8–14 stops. A request that names several journeys (creating, editing and deleting an order), or a sketch over 14 stops: pick the first for this run and list the rest as next. Note each repo's commit (`GIT_OPTIONAL_LOCKS=0 git -C <repo> rev-parse --short=7 HEAD`) and which files on the journey have uncommitted changes (`GIT_OPTIONAL_LOCKS=0 git -C <repo> status --porcelain`). Never ask the user to commit or revert first, and never stop over uncommitted changes.
4. **State the cost and ask once**, in one message. Leave out the lines that do not apply:

   ```
   Walkthrough of <journey>: from <start> to <end result>.
   <repo> at commit <abc1234>.   (one line per repo)
   About <N> stops, about <2 × N> minutes. Map: <yes, drawn with chalk-talk | no, chalk-talk is not installed>.
   Uncommitted changes in `<path from the repo root>`: the walkthrough covers it as it is on disk now.
   It goes to the vault, not `<the place asked for>`: the page holds code and local paths.
   This run covers <the first journey>. Next, one walkthrough each: <the others>.
   Go ahead?
   ```

   Nothing is written before the yes: no working folder, no data file.
5. **Trace, following the data.** For each stop: the code blocks exactly as on disk, its key lines, what it does, data in and out, and short notes on syntax a reader may not know. Then where the code would be extended: for each place a likely change would go, the file and lines, what to add there, and its stop.
6. **Find the reasons**, by Reasons.
7. **Write the data file**, with its stops and its extend points. Read `references/data-file.md` first. Find the working folder once, in the shell: `echo "${TMPDIR:-/tmp}/code-walkthrough/<slug>"` (`<slug>`: the short name in lower case, words joined by `-`). Use the printed path as it is for the data file (`<working folder>/<slug>.walkthrough.json`), for `--out`, and for any helper script you write; outside the vault, a run makes nothing anywhere else. The build refuses a working folder under a repo, the vault or a `work_roots` folder.
8. **Build, check and write**, by Build and check.
9. **Reply**, by Reply.

**A rebuild** of a walkthrough already in the vault runs the same steps from a copy. Copy its `.walkthrough.json` into the working folder. Keep its `short_name` and `journey`: the build finds the earlier note by that name and links it. Set each `repos[].path` to the repo's top folder, then re-trace the stops whose files changed, with their reasons and extend points. A yes to a rebuild offer answers the cost question.

## Reasons

Code holds no "why". The rule is firm, and it is the user's:
- A recorded reason quotes its source word for word, names included, and says which source.
- When no source states the reason, the entry is "not recorded" and holds only the question: "Why are logs kept 14 days?"
- A plausible guess goes only in the stop's `guesses`, shown apart and marked Guess, never in the Why list.

Every choice at a stop that a teammate could ask about (a limit, a timeout, a rule, the order of calls) gets a Why entry, recorded or not recorded. A source counts only when it is about this code (this repo, its tickets, this feature) and says why the code is the way it is. A line that says what the code does is not a reason, whatever kind of source it is in.

Look in these places, in this order, and cite every one that states a reason, in this order:
1. **The vault.** Work notes (their `why` and `decided` columns), decision notes, ticket and handoff notes for the repo or the ticket, and meeting notes. Skip a note whose frontmatter has `visibility: private`, and discard a search hit inside one, unless the user named that note.
2. **Design docs in the repo:** specs, plans, ADRs and README sections.
3. **Commits, pull requests, and the Jira tickets they name:** `git log`, `git blame`, `gh pr view`. Jira is read only. For a ticket, look in its vault ticket note before keeping a saved copy.
4. **Comments in the code.**
5. **Build notes** left by AI coding sessions in the repo or its worktrees, such as `.superpowers/sdd/<plan>/task-N-report.md`, cited by file.

Outside docs, such as a framework's documentation, may back a fact in "What it does" by name; they are never a reason. The search per stop may go to cheaper subagents (`haiku`); they return quotes with their sources, never reasons in their own words.

## Build and check

```
node "<this skill's folder>/scripts/walkthrough-build.mjs" "<working folder>/<slug>.walkthrough.json" --out "<working folder>" --vault <vault> --folder <folders.walkthroughs> --chalk <chalk-talk folder | none> --work-root <each work_roots entry> --write
```

Nothing reaches the vault unless every check passes, so build with `--write` from the first round. Exit codes:
- **0**: every check passed. It printed the reply lines (`Code:`, `Reasons:`, `Map:`, a second `Map:` line when Chrome is missing, and the numbered not-recorded questions), then one `WROTE <path>` per file.
- **1**: a check or a shape rule failed. Each `FAIL <where>: <why>` line says where (a stop, a reason, the map, the walkthrough) and what is wrong. Nothing reached the vault; after a check failure, the data file holds the build's own fields. Shape failures print alone, before any other check: fix them all, and count that as a round.
- **2**: the message says what: a bad argument, a refused place, or a data file the build cannot use (such as one with no `client`). Fix that; it is not a check round.
- **3**: `SAME DAY <names>`: this journey was already built today. Ask "Replace today's walkthrough, or keep both?" and rerun with `--same-day replace` or `--same-day keep`.

The build writes what it learns back into the data file (`built`, the commits, the uncommitted files, `cited_files`, `checks`, `map_tool`, `earlier`). Never write those by hand.

**Fix the data, never the check.** This holds for any walkthrough build that fails, whoever started it and whatever its command: fix the data file it names, and never drop a check by changing a flag such as `--chalk`. Fixing a data file that already exists needs no cost question.
- Code differs from the file: re-read the lines and copy them again. Lines dropped from `text` are declared in `left_out`.
- Quote not found: copy it again from the source, or make the entry not recorded, with its question.
- Broken map arrow: cite the right lines, or mark the arrow `inferred` with the reason.
- `FAIL map layout: …`: move a block to a free cell or shorten a label, as the line says. Never drop the map with `--chalk none`.

At most three rounds. Still failing: stop, deliver nothing, and say in plain words what still fails.

## Reply

Short, and never a retelling of the walkthrough. Leave out the lines that do not apply:

```
[[Walkthrough - <short name>]]: <N> stops, <R> reasons recorded, <Q> not recorded.
<the build's Code: line, as printed>
<the build's Reasons: line, as printed>
<the build's Map: line or lines, as printed>
Built from commit <abc1234>, with `<uncommitted path>` as it is on disk.
Next journey: <the next one step 3 listed>. Want it? About <2 × its stops> minutes.   (only when step 3 split the request; otherwise offer no other walkthrough)
Not recorded, questions for the team:
<the build's numbered questions, as printed>
Want any logged as open questions? Say the numbers.
`Meta/Config.md` has no `walkthroughs` key under `folders`. Add `walkthroughs: Walkthroughs`?   (always the last line when step 1 found no key)
```

The wikilink is the note's `WROTE` file name without `.md`. `<R>` and `<Q>` are the note's `reasons_recorded` and `reasons_not_recorded`, and the list holds every not-recorded question, in stop order. A question becomes an open-question note, through the open-questions skill, only when the user gives its number. The config changes only on a yes. Apart from a ticket's work row and what work-chart writes with it, the build's three files are the run's only vault writes: no daily-note line, no other note.

## Work chart

Explaining existing code on request is not a work row, so a run writes none. A run makes many reads, so work-chart's Stop hook may say "not yet in the work chart": run `<plugin root>/hooks/work-chart-stamp.sh` with no arguments, where `<plugin root>` is two folders above this skill's folder. A run that serves a ticket gets one row, through the work-chart skill: "Walked through <journey> for <KEY>: [[Walkthrough - …]]".

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| "I skipped the animated chalk-talk page because you asked for something in `docs/`. I can build it from the same trace if you want it." | A folder the user mentions is not where a walkthrough goes: the page holds code and local paths. The build writes the page, its data file and the note to the vault |
| Starting the trace before asking "Go ahead?" | The user has not agreed to the time it takes. Ask "Go ahead?" first; the yes starts the trace |
| Loosening a check, editing a script, or shortening code without declaring `left_out` | The page then shows code that is not the file, or a reason nobody recorded. Fix the data |
| A guess in the Why list | The user repeats it in refinement as fact. It goes in `guesses`, marked Guess |
| A second planning offer after a no | One offer per area per conversation. After a no, plan, and mention no walkthrough unless the user asks for one |
