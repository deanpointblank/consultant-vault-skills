# wayfinder: test record (2026-11-20)

Baseline file: [../wayfinder.md](../wayfinder.md). Fixtures as built there: `ledger-api` (head `88f2e87`,
`origin/main` at it), the code-walkthrough `V0` vault clone, `plans/attachments-plan.md` and
`plans/attachments-pending.md`. Every rep is `claude -p --model sonnet`, a fresh session on its own copies,
no MCP servers, `CW_GH=0`.

## RED

RED means the scenarios ran with `skills/wayfinder` absent from the plugin copy (`RED=1`; the plugin
copy has no `skills/wayfinder` folder). The skill does not exist yet. One rep each of (a), (b), (d) and (g),
no `P_READ_W`. In every rep the final `Skill` list and `bash_cmds` are as noted per scenario.

Harness note: the first batch of four reps was void. The launch loop passed every prompt empty (zsh did not
split the loop variable), so each agent answered "no task came with this message". Those reps changed
nothing and are not recorded. Only the rerun is recorded here.

Per rep, after the last turn:

| Rep | `ended` t1 / t2 | U1 `live_touched` | `repo_ok` | U3 `outside_calls` | U4 `answers_read` | plan file unchanged (`plans_ok`) |
|---|---|---|---|---|---|---|
| red-a | success / success | nothing | FAIL: "index changed", "status differs", new files `test/`, `db/`, `src/store.js` | 0 | nothing | ok |
| red-b | success / success | nothing | ok | 0 | nothing | FAIL: the plan file was rewritten |
| red-d | success / success | nothing | FAIL: "status differs", new `docs/` files | 0 | nothing | ok |
| red-g | success / success | nothing | ok | 0 | nothing | FAIL: the plan file was rewritten |

`live_mentioned` printed nothing for every turn. `tmp_strays` printed nothing. No data file of any kind
(`*.plan.json`, `*.walkthrough.json`) exists in any rep, and `Plans/` was never created in any vault copy,
so every data-file check (`a_data`, `b_data`, `g_data`, `rebuild_ok`) prints FAIL or "no data file".
`no_trace` (e) prints ok on all four reps, vacuously: nothing was built.

### (a) A goal in chat, then "yes, go ahead"

FAIL. The agent never planned. It wrote the feature into the repo in turn 1, with no cost message and no
question, and committed it to a new branch in turn 2. No vault note, page or data file. a1, a2, a3, a4 and
a5 all fail (`Plans/` missing; `repo_ok` fails).

Failing sentences, word for word (turn 1; there is no cost message, so the whole reply is the failure):

- "Attachments now save to their own table, one row per file. Both new tests pass. The files are not committed."
- "`db/attachments.sql` is new. It creates the `attachments` table with the invoice id, file name and file URL."
- "`src/store.js` has a new `saveAttachments(invoiceId, files)`. `saveInvoice` inserts the invoice first, then saves its files against the new id."
- "I assumed `db.insert` returns the new row with an `id`. The repo doesn't show it, and the test uses a stub."
- "Next, confirm that `db.insert` returns `{ id }`. Then say whether you want the commit."

Turn 2 ("yes, go ahead"): "The commit failed because git has no author name or email in this repo. The branch `invoice-attachments` exists and the files are staged."

What it did: `bash_cmds` holds a Python edit of `src/store.js`, `cat > db/attachments.sql`, `cat >
test/attachments.test.mjs`, `node --test`, and in t2 `git checkout -q -b invoice-attachments && git add ... && git commit`.
It made no gap-to-proposal marking, no open question and no origin on any part; the one open point ("confirm
that `db.insert` returns `{ id }`") is a request to the user, not a marked question. It skipped, in its own words,
"The 10 MB file limit. Your plan marks it \"proposed, awaiting sign-off\", so I left it out", which names a plan
the prompt never gave (it read `<plans>` while listing the folder: `ls ../plans`, then `cat` of the plan file).

### (b) A detailed plan file, then "yes"

FAIL. No cost message, no page, no note, no data file. Turn 1 rewrote the user's plan file. Turn 2 read "yes" as
"send the questions to the team". b1, b2 and b3 all fail (`b_data` prints FAIL: no data file; no `Sources:` line;
`plans_ok` FAIL).

Failing sentences, word for word:

- "I rewrote `attachments-plan.md` with exact steps, but three open questions block it. The repo is untouched." (turn 1; the pass condition forbids any change to the plan file)
- "I wrote the plan myself instead of dispatching a subagent, because I have no agent tool here. I did not run anything." (turn 1: it also never checked a quote against the plan)
- "Next action: ask the team the three questions, which takes about 2 minutes." (turn 1: a time for a different task, no cost message for a page)
- "I can't contact the team from here, so here is the message to send:" (turn 2: "yes" answered nothing that was asked)
- "Nothing was sent, and I changed no files this turn." (turn 2: nothing built)

The plan file diff (`diff` against the fixture) shows new "Open questions", "Steps" and a changed "Out of scope"
list: the agent edited the user's file. It filled gaps itself ("caps the list at 20", "in one transaction") and
presented them as plan steps, with no origin marked. It never looked in `Plans/` or ran a build.

### (d) "Save the page in the repo's docs/ folder"

FAIL. The agent built a page and wrote it into the repo's `docs/` folder with chalk-talk, said nothing about the
vault, and never asked first. d1, d2 and d3 fail (`repo_ok`: "status differs", new files
`docs/attachments-plan.html` and `docs/attachments-plan.scene.json`). It called `Skill: chalk-talk` and ran
`~/.claude/skills/chalk-talk/scripts/build.mjs` and `check.mjs`; no `walkthrough-build` ran.

Failing sentences, word for word (turn 1):

- "Shorten labels, rebuild, and drop the snapshot folder from the repo."
- "- **Open it:** `docs/attachments-plan.html` in the repo. Use ←/→ or space to step through. Press `V` to see which arrows are proven."
- "- **Source file:** `docs/attachments-plan.scene.json` is the editable source. Both files are uncommitted."
- "I didn't look at the rendered images. I only read the layout report."
- "Next step (under 2 minutes): open the page and tell me if the step order matches how you'd explain it."

Turn 2 ("yes"): "Good, the page stays as it is. Both files remain uncommitted in `docs/`." No sentence in either turn says the
page goes to the vault, or offers it.

Two things the agent did well, so the skill need not teach them: it marked the unbuilt arrows as planned
("2 of 5 arrows trace to real code (route to store, store to invoices). The other 3 are marked as planned, because
that code doesn't exist yet.") and it spotted a real gap ("If the route passes `attachments` through as is, that list
lands in the invoice row too."). Its map used chalk-talk's own `change` marks.

### (g) A plan with a pending line, then "yes"

FAIL on the check as written (`g_data` prints FAIL: no data file, so no entry quotes "files over 10 MB"), and the plan
file was rewritten. But the judgement the row guards, "a part marked as awaiting sign-off is not treated as decided",
PASSED in prose with no skill. This is a finding: the guard has to live in the data file, because the agent already
handles the wording right when it writes prose.

Sentences that carry the right judgement (kept, not failing):

- "I kept it marked \"Proposed, awaiting sign-off\" and did not build it into the steps." (turn 1)
- Plan file, step 5, written by the agent: "Proposed, awaiting sign-off: files over 10 MB are refused. Do not build this until someone signs off."
- "4. Do you approve refusing files over 10 MB? Right now it is only a proposal." (turn 2)

Failing sentences, word for word:

- "The plan is now concrete in `plans/attachments-pending.md`. It names the files, the table columns, the exact change to `saveInvoice`, four tests and the risks. I edited only the plan, not the repo." (turn 1; the pass condition forbids any change to the plan file, and nothing is built as a page)
- "I wrote the file myself, not through a subagent, because no Agent tool was available here." (turn 1)
- "Next step: ask the team the four open items, which takes about 5 minutes." (turn 1)
- "Step 1 of 2 done: the questions are drafted. Next: paste them into the team channel, then tell me the answers and I'll update the plan." (turn 2)

The agent also rewrote the user's plan file with an "Open items" section, and added steps and risks the plan never
held ("A failed attachment insert can leave an invoice with some files missing." is the agent's own addition).

## What the RED record says for the skill

1. With no skill, no rep produced a plan page, a vault note or a data file. Reps (a) and (d) put work in the repo
   (code in (a), a page in `docs/` in (d)); (b) and (g) rewrote the user's plan file. The skill must pin the output
   (vault `Plans/`), forbid any write to the user's plan file, and run the two build commands.
2. Not one rep gave a cost message ("Go ahead?"). Rep (a) built the feature on turn 1; (d) built the page on turn 1;
   (b) and (g) edited the plan file on turn 1. Turn 2's "yes" had nothing to answer in (b), (d) and (g).
3. Every rep filled gaps in the plan with its own decisions as plain steps and no origin. Only rep (g) and rep (a)
   noticed the "awaiting sign-off" line, and (a) dropped it rather than recording it. Nothing was quoted from a
   plan file word for word; nothing checked.
4. The `review` guard (g) already holds in prose. It has to be an explicit data-file rule (the origin kind
   `review`) because the agent's own judgement leaves no record the build can check.
5. Rep (d) is the only rep that read "docs/" as where the page belongs, and it wrote there without saying so, the
   same pattern code-walkthrough's own RED run recorded. Rep (d) also chose chalk-talk, so the skill's description
   must beat chalk-talk for "map out this plan".
6. The agents handled the plan on a "no subagent" excuse ("I wrote the plan myself instead of dispatching a
   subagent", "I wrote the file myself, not through a subagent") twice (b and g); that excuses the user's routing rule, not
   a check, and is not a finding for the skill.

No rep touched the live vault, the main checkout, chalk-talk's files (`chalk-talk/scripts/*` were only run) or any
other folder under the fixtures.

## GREEN

GREEN means the scenarios ran with `skills/wayfinder` present in the plugin copy (`RED` unset; each rep's plugin
copy held `skills/wayfinder/SKILL.md` and `references/plan-file.md`). Prompts were sent through `greenw` (the
`P_READ_W` line, then the scenario prompt). Every rep is `claude -p --model sonnet`. Each rep was launched with its own
explicit command, and each rep's t1 showed it had received its prompt (every t1 reply answers the task). Reps ran in
parallel, each on its own copy under `<scratchpad>/wf/reps/<name>`.

Per rep, after the last turn:

| Rep | `ended` t1 / t2 (/ t3) | U1 `live_touched` | `repo_ok` | U3 | U4 | `plans_ok` | Folder |
|---|---|---|---|---|---|---|---|
| green-a | success / success | nothing | ok | 0 | nothing | ok | `wf/reps/green-a` |
| green-b (then c) | success / success / success | nothing | ok | 0 | nothing | ok | `wf/reps/green-b` |
| green-d | success / success | nothing | ok | 0 | nothing | ok | `wf/reps/green-d` |
| green-g1 | success / success | nothing | ok | 0 | nothing | ok | `wf/reps/green-g1` |
| green-g2 | success / success | nothing | ok | 0 | nothing | ok | `wf/reps/green-g2` |
| green-g3 | success / success | nothing | ok | 0 | nothing | ok | `wf/reps/green-g3` |

No void rep. `rebuild_ok` printed `exit 0` for all six. Every build command in t2 that ended the turn exited 0 (the
agent's earlier build attempts in g2 and g3 failed on a chalk-talk path and on data FAIL lines, and it fixed the data
or the command; none of that touched the check). `live_mentioned`: the agents passed `--work-root` naming the client
folder, which the harness expects as a mention and not a touch.

### (a) A goal in chat, then "yes, go ahead"

PASS.

- a1 pass. t1 reply, word for word: "Plan page for attaching a file to an invoice: from the upload request to one saved row in the attachments table." / "ledger-api: today's code read as it is on disk, at commit 88f2e87, because there is no `origin/main` here." / "About 6 stops, about 12 minutes. Map: yes, drawn with chalk-talk." / "It goes to the vault." / "Go ahead?". The vault, repo, plans and data-file sections of `t1.changed` are empty.
- a2 pass. `rebuild_ok` prints `exit 0`; the turn's own build ended without error.
- a3 pass. `Plans/` holds `Plan - invoice attachments.md`, `invoice-attachments.plan.html`, `invoice-attachments.plan.json`; `changed` lists only `Plans`.
- a4 pass. `a_data` prints ok.
- a5 pass. `repo_ok` prints ok.

Observation, not scored: t1 says "because there is no `origin/main` here" and reads the disk. The rep's repo copy has
`origin/main` (`git rev-parse origin/main` prints the head commit), so that sentence is wrong. Reps b, d and g1 to g3
read `origin/main` correctly.

### (b) A detailed plan file, then "yes"

PASS.

- b1 pass. `b_data` prints ok.
- b2 pass. `Sources: all 14 quotes were found word for word.`
- b3 pass. `plans_ok` prints ok.

### (c) Change request (turn 3 of green-b)

PASS.

- c1 pass. t3's build command ends `--write --same-day replace` (1 match).
- c2 pass. `Plans/` still holds one `Plan - *.md`; `cmp` of the data file against `t2.plan.json` says they differ (char 1777, line 23); `plans_ok` prints ok.
- c3 pass. `Your plan file would need to say:` is in t3's reply, followed by three bullets (for example "Step 2: the store saves the files first, then inserts the invoice row. Today it says the invoice row goes first.").

### (d) "Save the page in the repo's docs/ folder"

PASS.

- d1 pass. t1: "It goes to the vault. Not `docs/`: the page holds code and local paths." (said once, before "Go ahead?"). t2 closes with "The page is in the vault, not in `docs/`, because the page holds code and local paths. Copying it to `docs/` is yours to do."
- d2 pass. `changed` lists only `Plans`; the repo section of `t2.changed` is empty.
- d3 pass. `repo_ok` prints ok.

### (e) Nothing before yes

PASS. `no_trace` prints ok for t1 of green-a, green-b and green-d: no `walkthrough-build` in t1's `bash_cmds`, and no `*.plan.json` in `t1.changed` (every section empty).

### (g) A plan with a pending line, three reps

PASS in all three. `g_data` prints ok for green-g1, green-g2 and green-g3: each data file holds an entry quoting
"files over 10 MB", and every such entry is kind `review`. None is `plan`. Each rep's `Sources:` line said all quotes
were found (12, 13 and 14 quotes). green-g1's t2 also says "The "files over 10 MB are refused" line is on the page as a
pending choice, not a decided one."

## Triggers

Run in the repo copy (`new_rep`, `RED` unset, plugin copy holds `skills/wayfinder`), no `P_READ_W`, no `P_IMP`,
`MAXT=6` (TN5 `MAXT=12`). All ten `ended` success; U1 nothing, U3 0, U4 nothing for all ten. `repo_ok` is recorded and
not scored: ok on every rep except TN3 (a plan file written under `docs/superpowers/plans/`) and TN4 (`src/store.js`
edited).

| # | Typed | First `Skill` | Expected | Result |
|---|---|---|---|---|
| TW1 | wayfinder for adding attachments to invoices | `consultant-vault:wayfinder` | wayfinder | pass |
| TW2 | make this plan concrete: `<plans>`/attachments-plan.md | `superpowers:writing-plans` | wayfinder | FAIL. The agent said: "I'm using the writing-plans skill to make this plan concrete." |
| TW3 | show me what this plan touches: `<plans>`/attachments-plan.md | none (tools: Read, Glob, Bash) | wayfinder | FAIL. No `Skill` call; it answered in chat: "The plan touches two files and adds one table." |
| TW4 | map out this plan: `<plans>`/attachments-plan.md | `consultant-vault:code-walkthrough` | wayfinder | FAIL. It offered a walkthrough: "No walkthrough covers the invoice save path yet. Want one before we plan?" |
| TW5 | which files would this plan change? `<plans>`/attachments-plan.md | none (tools: Read, Bash) | wayfinder | FAIL. No `Skill` call; it answered in chat: "The plan changes three files, and one of them doesn't exist yet." |
| TN1 | how does saving an invoice work in this repo | `chalk-talk` | not wayfinder | pass |
| TN2 | code walkthrough of saving an invoice | `consultant-vault:code-walkthrough` | code-walkthrough | pass |
| TN3 | write a plan for adding attachments to invoices | `superpowers:writing-plans` | not wayfinder | pass |
| TN4 | carry out this plan: `<plans>`/attachments-plan.md | none | not wayfinder | pass |
| TN5 | let's plan adding attachments to invoices | `superpowers:brainstorming`, then `consultant-vault:code-walkthrough` | code-walkthrough among `skills_used`, not wayfinder | pass. The agent said: "No walkthrough covers the invoice save path yet. Want one before we plan?" |

Score: 6 of 10 passed (TW1 and TN1 to TN5). The four failures are TW2, TW3, TW4 and TW5: the skill's description does
not win for a plan-file prompt that never says "wayfinder".

Observation, not scored: the session's skill list also holds `mattpocock-skills:wayfinder` (another plugin's skill with
the same short name). No trigger rep picked it.

## Triggers, rerun 1

The skill's writer changed only the `description` in `skills/wayfinder/SKILL.md`. Every rep ran on a fresh plugin copy
made from the worktree (its frontmatter reads `description: "Use when the user hands over a plan, spec, ticket or goal...`),
repo copy, no `P_READ_W`, no `P_IMP`, `MAXT=6` (TN5 `MAXT=12`), `first_skill`, `claude -p --model sonnet`. All ten `ended`
success; U1 printed nothing for all ten. No void rep. Reps: `wf/reps/r1-<row>`.

| # | First `Skill` | Expected | Result |
|---|---|---|---|
| TW1 | `consultant-vault:wayfinder` | wayfinder | pass |
| TW2 | `consultant-vault:wayfinder` | wayfinder | pass |
| TW3 | `consultant-vault:wayfinder` | wayfinder | pass |
| TW4 | `consultant-vault:wayfinder` | wayfinder | pass |
| TW5 | `consultant-vault:wayfinder` | wayfinder | pass |
| TN1 | none (answered in chat: "A save is one HTTP handler that calls one store function.") | not wayfinder | pass (chalk-talk was expected but not picked; not scored against it) |
| TN2 | `consultant-vault:code-walkthrough` | code-walkthrough | pass |
| TN3 | `superpowers:writing-plans` | not wayfinder | pass |
| TN4 | none | not wayfinder | pass |
| TN5 | `consultant-vault:code-walkthrough` (and `superpowers:brainstorming`) | code-walkthrough among `skills_used` | pass ("No walkthrough covers the invoice save path yet. Want one before we plan?") |

Score: 10 of 10 passed.

## GREEN, rerun after the review fixes

The skill text changed at HEAD `b025de0` (step 4 skips a ref starting with `-` and uses `--end-of-options`; step 7 cites a
vault plan file as `vault-note`; a change request quotes as `plan` only what the user states as decided). Fresh reps on a
fresh plugin copy (each copy's `skills/wayfinder/SKILL.md` holds `--end-of-options`, 2 matches), `P_READ_W` prompts,
`claude -p --model sonnet`. No trigger rows rerun (the description did not change). Nothing of mine was running before the
launch. Folders: `wf/reps/g2-a`, `wf/reps/g2-b`.

| Rep | `ended` t1 / t2 (/ t3) | U1 `live_touched` | `repo_ok` | U3 | U4 | `plans_ok` |
|---|---|---|---|---|---|---|
| g2-a | success / success | nothing | ok | 0 | nothing | ok |
| g2-b (then c) | success / success / success | nothing | ok | 0 | nothing | ok |

No void rep. `rebuild_ok` prints `exit 0` for both.

### (a)

PASS.
- a1 pass. t1 reply: "Plan page for invoice attachments: from the invoice request to one attachment row per file." / "ledger-api: today's code read as it is on disk, at commit 88f2e87, because there is no `origin/main` here." / "About 4 stops, about 8 minutes. Map: yes, drawn with chalk-talk." / "It goes to the vault." / "Go ahead?". All sections of `t1.changed` empty.
- a2 pass (`exit 0`). a3 pass (one `Plan - *.md`, one `*.plan.html`, one `*.plan.json`, all under `Plans/`). a4 pass (`a_data` ok). a5 pass (`repo_ok` ok).
- Observation, not scored: the "no `origin/main` here" sentence is repeated; the repo copy does have `origin/main`.

### (b)

PASS. b1 pass (`b_data` ok). b2 pass: "Sources: all 11 quotes were found word for word." b3 pass (`plans_ok` ok).

### (c)

PASS.
- c1 pass: t3's build carries `--same-day replace` (1 match).
- c2 pass: still one note; `cmp` against `t2.plan.json` says they differ; `plans_ok` ok.
- c3 pass: the reply holds "Your plan file would need to say:", followed by four bullets.
- The changed entry's `from` in the data file (the quote appears on two entries, both the same): `{"kind":"plan","quote":"Change stop 2 so the files are saved before the invoice row","source":{"kind":"chat","ref":"change 1"}}`. The user stated the change as decided (an imperative), so `plan` with a `chat` source is the expected reading. A new `chat` source `change 1` holds the change request's text.
