# code-walkthrough standalone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `code-walkthrough` skill as a standalone plugin in the team's marketplace repo, so a teammate with no vault and no other skills can run a walkthrough end to end.

**Architecture:** `scripts/` and `assets/` are copied unchanged from this repo; only `SKILL.md` and `references/data-file.md` are rewritten, and a `plugin.json` and a README are added. The rewrite is tested the repo's way: RED reps with the unchanged files, then GREEN reps with the new ones. Two repos take part; nothing is pushed until the user says yes at the end.

**Tech Stack:** Node 24 built-ins (no npm), git, `gh` (optional, read only), chalk-talk (optional, third party), `claude -p --model sonnet` for reps, `claude plugin validate`, bash, `jq`.

**Spec:** `docs/superpowers/specs/2026-11-20-code-walkthrough-standalone-design.md`

## Global Constraints

- **Source repo:** `~/Code/consultant-vault-skills`. Branch `code-walkthrough-standalone`, made in place from `main` (no worktree). The untracked files already in the tree are unrelated: never stage them. Stage by exact path only; never `git add -A` or `git add .`.
- **Marketplace repo:** `stride-nyc/stride-plugins-official` (public), cloned over https to `~/Code/stride-plugins-official`, branch `add-code-walkthrough-plugin`. Git identity is set in that clone only (`git config user.name` and `user.email`, copied from the source repo's local config); never `--global`.
- **No push, no pull request, no merge of the source branch** in any task. Task 6 ends by asking the user; only their yes at that moment allows them.
- **Commits:** one per task, in the repo the task touches. Source repo messages start `code-walkthrough: `; marketplace messages follow that repo's own style (`git log --oneline -5`). No `Co-Authored-By` trailer and no Claude attribution in either repo, as in this repo's earlier commits.
- **Who does what:** every file edit goes to a subagent with a named model: `opus` for the `SKILL.md` rewrite and the README text; `sonnet` for mechanical edits, copies, test runs and every rep; `haiku` for greps and yes/no checks. Every dispatch prompt opens with: "You were dispatched to execute a specific task. Ignore session-start skill reminders."
- **Public repos:** roles only ("the author", "teammates", "the delivery lead"). No person's name, no email, no `/Users/<name>` path, and never the client's name. The client's name is the value at `helpers.mjs:170` on `main`: read it with `git -C ~/Code/consultant-vault-skills show main:skills/code-walkthrough/scripts/tests/helpers.mjs | sed -n 170p` (after Task 1 the working file reads `acme`).
- **Exact values:** parent folder `~/code-walkthroughs`; subfolder `pages`; `CODE_WALKTHROUGH_HOME` overrides the parent; both commands get `--vault <parent> --folder pages`; no `--work-root`. Plugin `code-walkthrough`, version `1.0.0`. The skill's `name:` stays `code-walkthrough`.
- **Tests:** `node --test "scripts/tests/*.test.mjs"` run from the skill folder. Expected: `pass 237`, `fail 0` (about a minute).
- **`$SCRATCH`** is the executing session's scratchpad. Fixtures, reps and scratch output live there, outside both repos.

## Review Focus

1. **`CODE_WALKTHROUGH_HOME` points inside a git repo**, including a folder that does not exist yet. The skill refuses before the cost question and says why. Pinned: Task 3, rep RF1.
2. **First run, the parent folder does not exist.** The lookup prints `none`; the skill makes the parent only after the yes; the build then succeeds. Pinned: Task 3, scenario (a) and Step 7.
3. **chalk-talk is not installed.** The page still builds, and the reply says the map was not built and where to get chalk-talk. Pinned: Task 3, scenario (a) when chalk-talk is absent; when present, Task 3 Step 9.
4. **`gh` is missing or not signed in.** A reason that only a pull request could give is "not recorded", never guessed. Pinned: Task 3, scenario (d).
5. **A repo folder name with a space or capitals.** `client` is written in slug form and the build accepts it. Pinned: Task 3, the fixture repo `Demo Shop`.

---

### Task 1: Neutral fixtures in the source repo

**Model:** sonnet.

**Files:**
- Modify: `skills/code-walkthrough/scripts/tests/helpers.mjs:170`, `skills/code-walkthrough/scripts/tests/note.test.mjs:27`
- Commit with: `docs/superpowers/specs/2026-11-20-code-walkthrough-standalone-design.md`, `docs/superpowers/plans/2026-11-20-code-walkthrough-standalone.md`

**Interfaces:**
- Produces: a skill folder with no trace of the client's name, that Task 2 copies.

- [ ] **Step 1:** `git switch -c code-walkthrough-standalone` in the source repo.
- [ ] **Step 2:** Count the client's name in the skill folder: `grep -rci "<the value at helpers.mjs:170>" skills/code-walkthrough | grep -v ':0$'`. Expected: exactly `helpers.mjs:1` and `note.test.mjs:1`.
- [ ] **Step 3:** Replace the value with `acme` on those two lines only.
- [ ] **Step 4:** Rerun the Step 2 grep. Expected: no output.
- [ ] **Step 5:** Run the tests from `skills/code-walkthrough`. Expected: `pass 237`, `fail 0`.
- [ ] **Step 6:** Commit the four files by path: `code-walkthrough: neutral client name in the test fixtures, with the standalone spec and plan`.

### Task 2: Plugin skeleton and copied scripts

**Model:** sonnet.

**Files** (all in the marketplace clone):
- Create: `plugins/code-walkthrough/.claude-plugin/plugin.json`
- Create: `plugins/code-walkthrough/skills/code-walkthrough/scripts/`, `…/assets/` (copies)

**Interfaces:**
- Consumes: the source skill folder after Task 1.
- Produces: `P=~/Code/stride-plugins-official/plugins/code-walkthrough` and `PS=$P/skills/code-walkthrough`, used by every later task.

- [ ] **Step 1:** Clone over https to `~/Code/stride-plugins-official`; `git switch -c add-code-walkthrough-plugin`; set `user.name` and `user.email` in the clone from the source repo's `git config --local`. Check: `git -C <clone> config --show-origin user.name` names the clone's `.git/config`.
- [ ] **Step 2:** Confirm the layout the spec reports: an existing local plugin has `plugins/<name>/.claude-plugin/plugin.json`, `plugins/<name>/README.md`, `plugins/<name>/skills/<name>/`, and `.claude-plugin/marketplace.json` lists it with `"source": "./plugins/<name>"`. If not, stop and report.
- [ ] **Step 3:** Write `plugin.json`, shaped like an existing plugin's: `"name": "code-walkthrough"`, `"version": "1.0.0"`, `"description"`: one line (the Task 3 writer may refine it), `"author": { "name": "<value of git config user.name>" }` with no email, `"keywords": ["code-walkthrough","onboarding","code-reading","explain","planning"]`.
- [ ] **Step 4:** `cp -R` the source `scripts/` and `assets/` into `$PS/`.
- [ ] **Step 5:** `diff -r <source skill>/scripts $PS/scripts` and the same for `assets`. Expected: no output.
- [ ] **Step 6:** Run the tests from `$PS`. Expected: `pass 237`, `fail 0`.
- [ ] **Step 7:** Commit `plugins/code-walkthrough/` by path.

### Task 3: SKILL.md and data-file.md for teammates (RED, rewrite, GREEN)

**Models:** sonnet runs every rep; opus rewrites and makes each fix; haiku runs the Step 9 checks.

**Files:**
- Create: `$PS/SKILL.md`, `$PS/references/data-file.md` (first as unchanged copies, then rewritten)
- Create, outside both repos: `$SCRATCH/cws-harness/` (fixture and harness scripts), `$SCRATCH/cws/reps/<name>/`
- Create: `~/Code/consultant-vault-skills/docs/superpowers/baselines/results/code-walkthrough-standalone-2026-11-20.md` (RED and GREEN record; committed in Task 5)

**Interfaces:**
- Consumes: `$PS` from Task 2.
- Produces: the final `SKILL.md` and `references/data-file.md`, read by Task 4's README writer and Task 6's reviewer.

- [ ] **Step 1: Fixture.** A script `$SCRATCH/cws-harness/fixture.sh` builds `$SCRATCH/cws/fixture/Demo Shop`: a git repo with a fixture identity and fixed dates set through `GIT_AUTHOR_*` and `GIT_COMMITTER_*` (never `git config`), no remote, as the fixture block in `docs/superpowers/baselines/code-walkthrough.md` does. One journey of three stops, adding an item to a cart: `src/cart.js` (`addItem`) → `src/price.js` (`totalOf`) → `src/store.js` (`saveCart`). It holds: a code comment that gives a reason; one commit whose body gives a reason; `const MAX_ITEMS = 50` with no reason anywhere; a `docs/` folder. The tree is made read-only; reps work on copies.
- [ ] **Step 2: Harness.** `$SCRATCH/cws-harness/harness.sh` reuses the Harness section of `docs/superpowers/baselines/code-walkthrough.md` (`new_rep`, `rep`, `said`, `ended`, `session_id`, `bash_cmds`, the deny list, no MCP servers, `--resume` for later turns, `CW_GH=0`, `run_in_background: true`). Changes from it:
  - No vault copy. The preamble says only that the repo is a copy made for this test. RED files tell a rep to find the live vault, so `rep` runs `claude` under `env -u OBSIDIAN_VAULT`, the deny list adds `Read` and `Edit` of `~/.config/vault-skills/**` (the vault pointer file) and of the live vault folder it names, and the baseline's U1 (`live_touched`) runs after every rep. A U1 hit stops the run and goes to the user.
  - `new_rep` makes `<dir>/home` (passed with `--add-dir`) but not `<dir>/home/code-walkthroughs`.
  - `new_rep <name> [home]` copies the fixture repo to `<dir>/Demo Shop` and `$P` to `<dir>/plugin`. `rep` and `repo_ok` use `<dir>/Demo Shop` in place of `booking-app`. `repo_ok` expects an empty `git status --porcelain`.
  - Every rep sets `CODE_WALKTHROUGH_HOME=<dir>/home/code-walkthroughs` (not made in advance), `GH_CONFIG_DIR=<dir>/gh` (empty, so `gh` is not signed in) and unsets `GH_TOKEN` and `GITHUB_TOKEN`. RF1 passes its own `CODE_WALKTHROUGH_HOME`.
  - `settings.json` keeps `consultant-vault@consultant-vault-skills` disabled, so no vault skill exists in a rep.
  - `P_READ="Read and follow <dir>/plugin/skills/code-walkthrough/SKILL.md for this task."` GREEN prompts are `P_READ`, a blank line, then the prompt; RED prompts send the same `P_READ`, pointing at the unchanged files.
  - One rep per scenario, `MAXT=200` for build turns.
- [ ] **Step 3: Scenarios.** Prompts start `IMPORTANT: This is a real scenario. Act.` `<repo>` is the rep's copy.

  | # | Turns | Prompts | Passes when |
  |---|---|---|---|
  | (a) | t1, t2 | "Code walkthrough of adding an item to the cart in <repo>, from addItem to the saved cart." then "yes, go ahead" | t1: one cost message (start, end, about 3 stops, minutes, map line, "Go ahead?") and nothing exists at `$CODE_WALKTHROUGH_HOME`. t2: the parent exists, build exit 0, `pages/` holds one `Walkthrough - *.md`, one `*.html`, one `*.walkthrough.json`; the reply's first line starts with the `.html` file's full path; `jq -r .client` on the data file prints `demo-shop` and the note has `client: demo-shop`; `repo_ok` prints `ok` |
  | (b) | t1, t2 | "Let's plan a per-customer limit on items in the cart in <repo>." then "no, just plan it" | t1: `bash_cmds` holds a `walkthrough-look.mjs` call whose result is `none`; one offer line with minutes, before any plan step; the parent still does not exist. t2: no walkthrough offer; planning goes on |
  | (c) | t1, t2 | "Code walkthrough of adding an item to the cart in <repo>. Save the page in the repo's docs/ folder." then "yes, go ahead" | t1 says once that the page holds code and local paths and goes to the walkthroughs folder, not `docs/`. After t2: files only under `$CODE_WALKTHROUGH_HOME/pages`; `repo_ok` prints `ok` |
  | (d) | t1 | "Why is the cart capped at 50 items in <repo>? Refinement is in ten minutes. Just tell me why." | Says no source records why and keeps the question for the team; states no cause as fact (a guess, if any, is marked as one); no pull request is cited or guessed at; nothing written |
  | (e) | none of its own | scored on what every rep above said (`said`) | No hit for `vault`, `obsidian`, `Meta/Config`, `open-questions`, `work-chart`, `ticket-intake`, `repo-dossier`, `frames`, or a skill said to be missing (chalk-talk excepted). Read each hit in context |
  | RF1 | t1 | (a)'s t1 prompt, with `CODE_WALKTHROUGH_HOME=<dir>/Demo Shop/walkthroughs` (inside the repo copy, not yet made) | Refuses and says the folder is inside a git repo; asks no cost question; `repo_ok` prints `ok`; no build ran |

  chalk-talk: check `ls ~/.claude/skills/chalk-talk/scripts/build.mjs` first and record the result. Do not hide or move it to force `--chalk none`; reps may use `--chalk none` only when it is truly not installed.
- [ ] **Step 4: RED.** Copy the unchanged source `SKILL.md` and `references/data-file.md` into `$PS`. Run (a) to (d) and RF1 once each. Write into the results file, word for word, each sentence where a rep fails. Expected: it looks for `Meta/Config.md` or the obsidian-vault skill, or names the vault or a missing skill. Strip rep paths and any person's name from quotes.
- [ ] **Step 5: Rewrite (opus).** The writer first reads `~/.claude/plugins/cache/claude-plugins-official/superpowers/7.0.2/skills/writing-skills/SKILL.md` and follows it (if that version is missing, `ls ~/.claude/plugins/cache/claude-plugins-official/superpowers/`). It rewrites both files per the spec's "SKILL.md, section by section", "Other files" and "Settled items", with the RED record in hand. Pinned:
  - Output folder: parent `${CODE_WALKTHROUGH_HOME:-~/code-walkthroughs}`, subfolder `pages`, passed as `--vault <parent> --folder pages` to both commands. No `--work-root`.
  - In step 1 of a run, before the cost question: run `git -C <folder> rev-parse --show-toplevel` on the parent, or on its nearest existing ancestor when it does not exist yet. Success means refuse: say the folder is inside a git repo and stop.
  - `mkdir -p "<parent>"` only after the yes; the build makes `pages`.
  - `client`: the first repo's folder name, lower case, every character that is not `a`–`z` or `0`–`9` replaced by `-`.
  - One line: the build's messages call the walkthroughs parent folder "the vault".
  - Reply: the first line gives the page's full path. When the build ran with `--chalk none`, one line says the map was not built and that chalk-talk is at github.com/oztrkemree/chalk-talk.
  - The three reason rules stay word for word. `name: code-walkthrough` stays.
  - `references/data-file.md`: drop the `vault-note` row and a ticket's `note`; `client` as above; everything else the build checks stays.
- [ ] **Step 6: GREEN.** Rerun (a) to (d) and RF1 against the new files and score each row of Step 3, then (e). A failure goes back to the opus writer with the rep's words; rerun only the failed rows. At most three fix rounds; still failing, stop and report. Record each round in the results file.
- [ ] **Step 7: Lookup on a missing parent.** `node $PS/scripts/walkthrough-look.mjs --vault "$SCRATCH/cws/none/code-walkthroughs" --folder pages --repo "Demo Shop" --repo-path "<a fixture copy>"`. Expected: `none`, exit 0.
- [ ] **Step 8:** `diff -r` of `scripts/` and `assets/` against the source again. Expected: no output.
- [ ] **Step 9: Checks (haiku).** `grep -rniE 'obsidian-vault|work-chart|open-questions|ticket-intake|Meta/Config|/Users/|<author name>|<client name>' $P`, with the author's name from `git config user.name` and the client's name from `main` (Global Constraints). Expected: one hit only, the author line in `.claude-plugin/plugin.json`, which is there by decision (`scripts/` and `assets/` gave none on the source, 2026-11-20). The Obsidian comment at `scripts/lib/settings.mjs:20` does not match these terms and stays, as settled. "vault" alone is expected in `scripts/` and is not searched for. Also yes/no: does `SKILL.md`'s reply rule cover a build without the map, naming where to get chalk-talk? Expected: yes.
- [ ] **Step 10:** Commit `$PS/SKILL.md`, `$PS/references/data-file.md` and any refined `plugin.json` by path.

### Task 4: README and marketplace entry

**Models:** opus writes the README text; sonnet edits the manifests and runs the checks.

**Files:**
- Create: `plugins/code-walkthrough/README.md`
- Modify: `.claude-plugin/marketplace.json`, `README.md` (root table)

**Interfaces:**
- Consumes: Task 3's `SKILL.md` (wording and the reply rules).

- [ ] **Step 1 (opus):** The README per the spec's "Other files": what it does; what it needs (Node, git, optionally `gh`, optionally chalk-talk at github.com/oztrkemree/chalk-talk, MIT, placed in `~/.claude/skills/chalk-talk` or a project's `.claude/skills/chalk-talk`); where output goes (`~/code-walkthroughs/pages`, `CODE_WALKTHROUGH_HOME`); how to ask ("code walkthrough of X"); a warning that the page holds code and local paths, so share it with care; one line that it is tested on macOS and Linux and not on Windows.
- [ ] **Step 2 (sonnet):** Add the entry last in `.claude-plugin/marketplace.json`, mirroring the last existing entry's keys: `"name": "code-walkthrough"`, a description, author name only, `"source": "./plugins/code-walkthrough"`, `"category": "development"`.
- [ ] **Step 3 (sonnet):** Add the row to the root README table, mirroring an existing row, version `1.0.0`.
- [ ] **Step 4:** `claude plugin validate plugins/code-walkthrough` and `claude plugin validate .` from the clone. Expected: both pass.
- [ ] **Step 5:** Rerun Task 3 Step 9's grep on the README. Expected: no hit.
- [ ] **Step 6:** Commit the three files by path.

### Task 5: Keeping the copies in step

**Model:** sonnet.

**Files:**
- Modify: `README.md` (source repo), a new section after "code-walkthrough and chalk-talk"
- Commit with: `docs/superpowers/baselines/results/code-walkthrough-standalone-2026-11-20.md` (from Task 3)

**Interfaces:**
- Consumes: the plugin path from Task 2 (`plugins/code-walkthrough/skills/code-walkthrough`) and the results file from Task 3.

- [ ] **Step 1:** Add `## The team copy`: one sentence that the team installs a copy from the marketplace repo; a code block with `diff -r <source repo>/skills/code-walkthrough/scripts <marketplace repo>/plugins/code-walkthrough/skills/code-walkthrough/scripts` and the same for `assets` (no output means in step), then the two `cp -R` commands that update the team copy; one sentence that `SKILL.md`, `references/data-file.md` and the plugin README differ on purpose. Placeholders only, no home paths.
- [ ] **Step 2 (haiku):** the results file holds no rep path, no person's name and not the client's name. Expected: yes.
- [ ] **Step 3:** Commit both files by path: `code-walkthrough: the team copy, and its rep results`.

### Task 6: Final checks, then stop for the user

**Models:** sonnet runs the checks; one fresh opus reviewer; the main loop asks the user.

**Files:** none changed, unless the reviewer's fixes send work back to Task 3 or 4.

**Interfaces:**
- Consumes: both branches as Tasks 1 to 5 left them; the checks and expected results of Task 3 Step 9 and Task 4 Step 4.

- [ ] **Step 1:** Tests pass from the source skill folder and from `$PS` (`pass 237`, `fail 0` each).
- [ ] **Step 2:** `diff -r` on `scripts/` and `assets/`: no output.
- [ ] **Step 3:** Both `claude plugin validate` commands pass.
- [ ] **Step 4 (haiku):** Task 3 Step 9's grep: as expected there.
- [ ] **Step 5:** `git status --porcelain` in the marketplace clone: empty. `git log --oneline main..HEAD` in each repo lists only this plan's commits (source: Tasks 1 and 5; marketplace: Tasks 2, 3 and 4).
- [ ] **Step 6 (opus):** A fresh reviewer reads the spec and `git -C ~/Code/stride-plugins-official diff main...HEAD`, and reports anything that misses the spec or the Review Focus. Fixes go back through Task 3's writer and its checks.
- [ ] **Step 7:** Report to the user and ask for the yes to push and open the pull request. **No push, no pull request, and no merge of the source branch without that yes.** On the yes, each command takes the personal GitHub account through its own environment and never switches the active `gh` account: `GH_TOKEN="$(gh auth token --user <personal account>)" git push -u origin add-code-walkthrough-plugin` (first check `git config --get-all credential.https://github.com.helper` names `gh`), then `GH_TOKEN="$(gh auth token --user <personal account>)" gh pr create --repo stride-nyc/stride-plugins-official`.

## Model routing

| Task | Implements | Reviews |
|---|---|---|
| 1 Neutral fixtures | sonnet | main loop (test output) |
| 2 Skeleton and copies | sonnet | main loop (`diff -r`, test output) |
| 3 SKILL.md, RED and GREEN | sonnet (reps), opus (rewrite, fixes) | sonnet scores reps against Step 3; haiku Step 9 |
| 4 README and marketplace | opus (README), sonnet (manifests) | `claude plugin validate`; haiku grep |
| 5 The team copy | sonnet | haiku |
| 6 Final checks | sonnet | opus (whole branch); the user (push) |
