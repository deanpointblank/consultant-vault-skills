# record-testing on the Playwright CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the `record-testing` skill's walkthrough with `playwright-cli` instead of the Playwright MCP server, rewrite the baseline harness and its checks to score a Bash-only rep, and re-baseline the skill — control first, then the skill — so the swap is measured rather than assumed.

**Architecture:** Two files change: `skills/record-testing/SKILL.md` (four MCP-coupled lines, two added Common-mistakes rows, and one new section that teaches the CLI driving, because the skill today names no browsing tool at all) and `docs/superpowers/baselines/record-testing.md` (the MCP config section goes, the run command loses `--mcp-config`, and scoring reads Bash tool inputs instead of MCP tool names). Checks V1, V6 and X1 are rewritten, V10 is dropped, nine survive untouched. `scripts/record-testing-clip.sh` is not touched: the spike fed it a CLI-driven recording and it produced the same trimmed WebM and per-criterion GIFs it always did.

**Tech Stack:** Markdown skill files (Claude Code plugin); `playwright-cli` 0.1.20 (`@playwright/cli`, bundling `playwright@1.64.0-alpha-2026-09-14`) at `~/.nvm/versions/node/v24.14.0/bin/playwright-cli`; ffmpeg 9.0.1 at `/opt/homebrew/bin/ffmpeg`; bash on macOS (BSD tools, `jq` present); Python's `http.server` for the fixture site; `claude -p --output-format stream-json` for reps; the baseline harness rules in `docs/superpowers/baselines/README.md`.

**Spec:** `docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md`

## Global Constraints

Every one of these is settled in the spec. Every task's requirements include them, whether or not the task repeats them.

- **Binary:** `playwright-cli` 0.1.20, the global install at `~/.nvm/versions/node/v24.14.0/bin/playwright-cli`. `playwright` is NOT on PATH — the availability check is `command -v playwright-cli`, never `command -v playwright`.
- **Action overlay:** `video-show-actions --duration=1500`, switched on **only after the login ends**, never before. The callout prints filled values in plain text, passwords included.
- **Session:** `-s=<KEY>` on every CLI call, named for the ticket.
- **Working directory:** the scratch recording directory. Every bash call `cd`s there first, because agent bash calls reset cwd. Absolute paths for everything else.
- **`close-all` in the After steps.**
- **The login cut stays.** `state-save` / `state-load` are parked, not adopted.
- **`scripts/record-testing-clip.sh` and its 16 shell tests are NOT modified.** Proven unchanged end to end by the spike.
- **`docs/superpowers/baselines/results/record-testing-2026-09-10.md` is NOT edited.** A re-baseline writes a new dated file beside it.
- **Nothing is pushed.** Commits per task are fine; `git push` appears nowhere in this plan.
- **Check ids are fixed:** `V1`–`V9` and `X1`–`X3`. `V10` is dropped in Task 3 and no later task may reintroduce it. No task invents a new id; findings that are not checks are recorded as observations.
- **Reps carry the same labels as checks**, which the 2026-09-10 harness and results doc already do: the three scenario-V reps are called V1, V2, V3 and the three scenario-X reps X1, X2, X3, while V1–V9 and X1–X3 are also the check ids. A check table's rows are checks and its columns are reps. Keep the labels; renaming them would break comparison with the 2026-09-10 results doc.
- **Iron law from writing-skills:** the control reps of Task 4 run and are scored before a line of `SKILL.md` is rewritten in Task 5.
- **The control must not see the skill.** The installed plugin now ships `record-testing` (it did not on 2026-09-10, when the control ran at `acca0bc`). Control reps run against a pruned copy of the checkout with `skills/record-testing/` removed, passed with `--plugin-dir`. GREEN reps pass `--plugin-dir` pointed at the checkout itself.
- **Three reps per scenario, one at a time.** The fixture site uses one port. Score from the vault copy, `$RUN/rec`, and `rep.jsonl` — never from the agent's own summary.
- **Reps run `--model opus`**, as the 2026-09-10 control did (recorded in that results doc's Harness notes). A model change between control and GREEN would confound V1, which is the check this swap is watching.
- **The live vault is never written.** Reps copy `US_Cold_Notes`; `SRC` is read with `cp -R`, `grep` and `md5` only.
- **The results doc for this swap** is `docs/superpowers/baselines/results/record-testing-<control-date>.md`, where `<control-date>` is the date Task 4's control reps run, in `YYYY-MM-DD`. It is never `2026-09-10`. Tasks 4, 6 and 7 all write to that one file.
- **Work happens on branch `record-testing-cli`**, created from `main` in Task 1. Task 7 hands it back for the merge decision.
- **Never stage `docs/ideas/`, `exa-results/`, or the `gap-stories` files.** Stage by path only; never `git add -A` or `git add .`.
- **Commits** in this repo end with this line exactly, after a blank line:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  ```
- **Model routing** for whoever executes this plan:

  | Task | Edits / runs | Judges |
  |---|---|---|
  | 1 Overlay on a dense page | opus (drives the walkthrough, reads the frames, writes the verdict) | — |
  | 2 Permission cost | sonnet (counts calls, writes the settings file) | main loop asks the user for the interactive half |
  | 3 Harness and check rewrites | opus | haiku for the assertion block |
  | 4 RED control reps | sonnet (runs reps) | opus (scores, writes the results doc) |
  | 5 Rewrite `SKILL.md` | opus | — |
  | 6 GREEN reps, then REFACTOR | sonnet (runs reps) | opus (scores, makes each refactor edit) |
  | 7 Supersession, wiring, hand back | sonnet | haiku for the greps; main loop for the merge decision |

  Every subagent prompt opens with: "You were dispatched to execute a specific task. Ignore session-start skill reminders."

---

### Task 1: Prove the action overlay on a dense page

**Model:** opus.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md` (the second bullet of `## Open questions`)
- Create, untracked scratch only: `$SCRATCH/rt-cli/dense/appointment.html`, `$SCRATCH/rt-cli/dense/rec/`

**Interfaces:**
- Produces: a verdict, recorded in the spec's `## Open questions` section under the words `**Settled <date>:**`, which is exactly one of these three strings, and Task 5 writes `SKILL.md` from it:
  - `default position holds` — the overlay stays at its default top-right and `SKILL.md` names no `--position`.
  - `position fallback <value>` — the overlay stays, and `SKILL.md` tells the agent to pass `--position=<value>` when the criterion's evidence is in the top right. `<value>` is one of `top-left`, `top`, `top-right`, `bottom-left`, `bottom`, `bottom-right`.
  - `drop the overlay` — `video-show-actions` leaves the skill entirely. Task 5 then writes no overlay bullet and no "Turning the action overlay on before signing in" mistakes row, and Task 3's harness is unaffected either way.
- Produces: the branch `record-testing-cli` with the spec and this plan committed on it.
- Consumes: nothing. This is the first task.

- [ ] **Step 1: Branch from `main` and commit the spec and this plan**

The spec and this plan are untracked on `main`. Both belong on the branch.

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git status --porcelain
```

Expect roughly: `?? docs/ideas/`, `?? docs/superpowers/baselines/gap-stories.md`, `?? docs/superpowers/handoffs/2026-09-11-gap-stories-execution-handoff.md`, `?? docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md`, `?? exa-results/`, and this plan file. Then:

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git switch -c record-testing-cli main
git add docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md docs/superpowers/plans/2026-09-15-record-testing-cli-swap.md
git commit -m "Add the record-testing CLI swap spec and plan

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git status --porcelain | grep -c 'record-testing-cli-swap'
```

Expected: `0` — both files are committed and nothing of theirs is left untracked. The gap-stories and ideas files stay untracked; never stage them.

- [ ] **Step 2: Build a dense page and serve it**

The fixture the spike used is two static sections with nothing in the corners. The open question is whether the callout covers content on a real page, so the page needs content where the callout lands. This one puts a summary card in the top right, a table down the middle, and an action bar along the bottom, so both the default position and the obvious fallback have something to obscure.

```bash
mkdir -p "$SCRATCH/rt-cli/dense/rec"
cat > "$SCRATCH/rt-cli/dense/appointment.html" <<'H'
<!doctype html><title>Appointment 2322 — Warsaw</title>
<style>
 body{font:14px system-ui;margin:0}
 nav{background:#123;color:#fff;padding:10px 16px}
 .wrap{display:flex;gap:16px;padding:16px}
 main{flex:1}
 aside{width:280px;border:1px solid #ccc;padding:12px;background:#f7f7f7}
 table{border-collapse:collapse;width:100%}
 td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}
 footer{position:fixed;bottom:0;left:0;right:0;background:#eee;border-top:1px solid #ccc;padding:10px 16px}
</style>
<nav>Phenix · Appointments · <b>2322</b></nav>
<div class="wrap">
<main>
 <h1>Appointment 2322</h1>
 <label>Door <input id="door" value="D07" disabled></label>
 <label>Dock <input id="dock" value="North"></label>
 <h2>Lines</h2>
 <table id="lines"><tr><th>Line</th><th>Item</th><th>Cases</th><th>Pallets</th></tr>
 <tr><td>1</td><td>Frozen peas 10kg</td><td>240</td><td>4</td></tr>
 <tr><td>2</td><td>Frozen corn 10kg</td><td>180</td><td>3</td></tr>
 <tr><td>3</td><td>Beef patties 5kg</td><td>320</td><td>5</td></tr>
 <tr><td>4</td><td>Chicken thighs 5kg</td><td>210</td><td>3</td></tr>
 <tr><td>5</td><td>Cod fillets 2kg</td><td>150</td><td>2</td></tr>
 <tr><td>6</td><td>Ice cream tubs</td><td>190</td><td>3</td></tr>
 <tr><td>7</td><td>Pastry sheets</td><td>160</td><td>2</td></tr>
 <tr><td>8</td><td>Berries mixed</td><td>140</td><td>2</td></tr>
 <tr><td>9</td><td>Potato fries 10kg</td><td>226</td><td>3</td></tr>
 <tr><td>10</td><td>Spinach 5kg</td><td>200</td><td>2</td></tr>
 </table>
</main>
<aside id="summary"><h2>Summary</h2>
 <p>Cases <span id="cases">2016</span></p>
 <p>Pallets <span id="pallets">29</span></p>
 <p>Carrier <span id="carrier">Tracy Freight</span></p>
 <p>Status <span id="status">Scheduled</span></p>
</aside>
</div>
<footer><button id="save">Save</button> <button id="cancel">Cancel</button> <span id="msg">No unsaved changes</span></footer>
H
( cd "$SCRATCH/rt-cli/dense" && exec python3 -m http.server 8766 >/dev/null 2>&1 ) & echo $! > "$SCRATCH/rt-cli/dense/site.pid"
sleep 1; curl -sf http://localhost:8766/appointment.html >/dev/null && echo "dense site up"
```

Expected: `dense site up`. Port 8766, not 8765 — 8765 belongs to the harness fixture and nothing else may hold it.

- [ ] **Step 3: Record the page with the overlay at its default position**

One verb per bash call, `cd` first on every call, session `-s=DENSE`.

```bash
R="$SCRATCH/rt-cli/dense/rec"
cd "$R" && playwright-cli -s=DENSE open
cd "$R" && playwright-cli -s=DENSE video-start "$R/topright.webm" --size=1280x800
cd "$R" && playwright-cli -s=DENSE goto http://localhost:8766/appointment.html
cd "$R" && playwright-cli -s=DENSE video-show-actions --duration=1500
cd "$R" && playwright-cli -s=DENSE find Summary
cd "$R" && playwright-cli -s=DENSE hover "#cases"
cd "$R" && playwright-cli -s=DENSE eval "document.querySelector('#cases').textContent"
cd "$R" && playwright-cli -s=DENSE hover "#pallets"
cd "$R" && playwright-cli -s=DENSE hover "#dock"
cd "$R" && playwright-cli -s=DENSE fill "#dock" South
cd "$R" && playwright-cli -s=DENSE video-stop
cd "$R" && playwright-cli -s=DENSE close-all
ls -l "$R/topright.webm"
```

Expected: `eval` prints `2016`; `topright.webm` exists and is non-empty. Write down the wall-clock second of the `hover "#cases"` call and of the `fill "#dock"` call as you go — they are the marks in step 5.

- [ ] **Step 4: Read frames and judge the top-right default**

```bash
R="$SCRATCH/rt-cli/dense/rec"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$R/topright.webm"
for t in 2 3 4 6 8; do ffmpeg -v error -ss $t -i "$R/topright.webm" -frames:v 1 -y "$R/tr-$t.png"; done
ls "$R"/tr-*.png
```

Expected: a duration around 12 to 20 seconds, and five PNGs. Read each PNG with the Read tool. The judgement is one question, asked of the frames where a callout is visible: **is the Summary card's `Cases 2016` still legible?** Record which frames show a callout and what it covers.

- [ ] **Step 5: Cut the GIF the way the skill would, and judge at GIF scale**

A frame at full size is not the artifact. The artifact is an 800px 8fps GIF, which is what a reviewer sees.

Write the marks file with the two seconds noted in step 3 — the second the `hover "#cases"`
call ran, and the second the `fill "#dock"` call ran, both counted from the `video-start` call.
With, say, 3 and 9:

```bash
R="$SCRATCH/rt-cli/dense/rec"
printf 'AC1 3 9\n' > "$R/marks"
cat "$R/marks"
mkdir -p "$R/out"
bash /Users/deanbetty/Code/consultant-vault-skills/scripts/record-testing-clip.sh "$R/topright.webm" "$R/out" "$R/marks"
ls "$R/out"
ffmpeg -v error -i "$R/out/topright AC1.gif" -frames:v 3 -y "$R/gif-%d.png"
```

Expected: the clip script exits 0 and prints the files it wrote; `$R/out` holds `topright.webm` and `topright AC1.gif`; three PNGs come out of the GIF. Read the three PNGs. Same question: is `Cases 2016` legible with the callout on screen?

The marks are seconds from the start of the video, whole numbers, and the end mark must be at or before the `video-stop` second — the tail of the file carries a frozen last frame while it finalises, and a mark inside that padding yields a GIF of a still.

- [ ] **Step 6: If the default obscures the evidence, repeat once at the fallback position**

Skip this step if step 5's GIF left `Cases 2016` legible. Otherwise re-run steps 3 to 5 with two changes: the video path is `"$R/bottomleft.webm"` and the overlay call is

```bash
cd "$R" && playwright-cli -s=DENSE video-show-actions --duration=1500 --position=bottom-left
```

Then judge the same way, with the question changed to match what is under the callout there: **are the last table rows and the action bar still legible?** The positions available are `top-left`, `top`, `top-right`, `bottom-left`, `bottom`, `bottom-right`; `bottom-left` is the first to try because the summary card is top right and the table runs down the left.

- [ ] **Step 7: Write the verdict into the spec**

In `docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md`, find the `## Open questions` section and its second paragraph, which begins **`Whether the action overlay obscures content on a real client page.`** Leave that paragraph exactly as it is and insert directly after it, as a new paragraph:

```markdown
**Settled <today's date>:** <one of `default position holds`, `position fallback <value>`, `drop the overlay`>. Measured on a dense fixture page — top nav, a top-right summary card, a ten-row table, a bottom action bar — recorded with `video-show-actions --duration=1500` and cut to an 800px 8fps GIF by the unmodified clip script. <One or two sentences: which frames carried a callout, what it covered, and whether the criterion's evidence stayed legible.> A real client page is confirmed against this rule by the live run in Task 7.
```

The verdict string must be one of the three exactly; Task 5 reads it and branches on it. Do not add a fourth option and do not hedge between two.

- [ ] **Step 8: Stop the site, and commit**

```bash
kill "$(cat "$SCRATCH/rt-cli/dense/site.pid")"
cd /Users/deanbetty/Code/consultant-vault-skills
playwright-cli list
git add docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md
git commit -m "Settle the action-overlay position question on a dense page

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git status --porcelain -- docs/superpowers/specs/
```

Expected: `playwright-cli list` shows no live session (step 3 ended with `close-all`), and the last command prints nothing.

---

### Task 2: Measure the permission cost of a CLI walkthrough

**Model:** sonnet. The main loop asks the user for step 4.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md` (the first bullet of `## Open questions`)
- Create, never committed: `/Users/deanbetty/Code/consultant-vault-skills/.claude/settings.local.json`

**Interfaces:**
- Consumes: the dense fixture recipe from Task 1 step 2 (port 8766), rebuilt here if it is gone.
- Produces: a verdict recorded in the spec's `## Open questions` section under `**Settled <date>:**`, holding two values Task 5 uses verbatim:
  - `<N>`, the number of `playwright-cli` bash calls in one full two-criterion walkthrough;
  - the invocation form, exactly one of `compound form` (the skill keeps `cd "$REC" && playwright-cli …` and one allowlist entry covers it) or `env -C form` (the skill invokes `env -C "$REC" playwright-cli …` so the call is a single command).
- Produces: nothing tracked. `.claude/` is excluded by `.git/info/exclude` line 9, so the settings file cannot be committed by accident.

- [ ] **Step 1: Record the starting point — there is no allowlist anywhere**

```bash
jq '.permissions.allow // [] | length' ~/.claude/settings.json
ls /Users/deanbetty/Code/consultant-vault-skills/.claude/ 2>/dev/null
test -e /Users/deanbetty/Code/consultant-vault-skills/.claude/settings.json && echo EXISTS || echo absent
test -e /Users/deanbetty/Code/consultant-vault-skills/.claude/settings.local.json && echo EXISTS || echo absent
```

Expected: `0`, then `worktrees` only, then `absent`, `absent`. There is nothing to remove or edit. **Do not edit `~/.claude/settings.json`** — the allowlist half of this experiment is a new project-local file, created in step 3.

- [ ] **Step 2: Count the calls in one full walkthrough**

The spike's minimal two-criterion walkthrough with a login is **15 CLI calls**, in this order: `open`, `video-start`, `goto`, `find`, `fill` (username), `fill` (password), `click` (submit), `find`, `eval`, `hover`, `find`, `hover`, `hover`, `video-stop`, `close-all`. With the action overlay it is **16**, because `video-show-actions` is one more call after the login. That is the floor, on a fixture of two static sections with nothing to navigate.

Now count it on the dense page, which has navigation and a table. Rebuild the dense fixture if it is gone — the block is Task 1 step 2, port 8766 — then drive a two-criterion walkthrough over it with the login page from the harness fixture standing in front of it, one verb per bash call, and count the calls:

```bash
R="$SCRATCH/rt-cli/perm"; mkdir -p "$R"
: > "$R/calls.log"
# For every CLI call you make, append its verb: echo <verb> >> "$R/calls.log"
wc -l < "$R/calls.log"
```

Expected: a number at or above 16. Record it as `<N>`. A real client walkthrough will be higher again; say so in the verdict rather than presenting `<N>` as a ceiling.

- [ ] **Step 3: Create the project allowlist entry**

```bash
mkdir -p /Users/deanbetty/Code/consultant-vault-skills/.claude
cat > /Users/deanbetty/Code/consultant-vault-skills/.claude/settings.local.json <<'J'
{
  "permissions": {
    "allow": [
      "Bash(playwright-cli:*)"
    ]
  }
}
J
jq . /Users/deanbetty/Code/consultant-vault-skills/.claude/settings.local.json
cd /Users/deanbetty/Code/consultant-vault-skills && git check-ignore -v .claude/settings.local.json
cd /Users/deanbetty/Code/consultant-vault-skills && git status --porcelain -- .claude
```

Expected: the JSON parses; `git check-ignore` prints `.git/info/exclude:9:.claude/	.claude/settings.local.json`; `git status` prints nothing. This entry is a local convenience for this machine. **The plan does not commit it and no task stages it.** A user of the skill on another machine adds their own, in the project they are working in.

- [ ] **Step 4: Ask the user to run the walkthrough interactively, twice (main loop)**

Prompts only appear in an interactive session; a `claude -p` rep with `--permission-mode acceptEdits` never shows one, so this half cannot be measured by a subagent. Ask:

> The CLI swap makes every browser action a Bash call — about 16 for the smallest two-criterion walkthrough. In an interactive session, that is a permission prompt each time unless `playwright-cli` is allowlisted. Would you run the fixture walkthrough twice for me: once with `.claude/settings.local.json` moved aside, and once with it in place, and tell me whether the prompts stopped? Answering no leaves the count measured and the prompt behaviour taken on the prediction.

If the answer is yes, give them the walkthrough: the dense site on port 8766, and the twelve calls from Task 1 step 3. What matters is whether the second run prompts at all, and whether a call written as `cd "$R" && playwright-cli …` is covered by `Bash(playwright-cli:*)` or whether only a single-command form is.

If the compound form still prompts, the fallback is the single-command form, which was verified on this machine: `env -C /usr/bin pwd` prints `/usr/bin`, so `env -C "$REC" playwright-cli -s=<KEY> …` runs in the recording directory without a `cd` and without a `&&`. That satisfies the spec's Decision 5 — the requirement is that the CLI runs with the recording directory as its working directory, not that the word `cd` appears.

If the answer is no: record `not measured interactively` in the verdict, and pick `compound form`. The count alone carries the Before-recording instruction.

- [ ] **Step 5: Write the verdict into the spec**

In `docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md`, find the `## Open questions` section and its first paragraph, which begins **`Permission cost. Not measured.`** Leave that paragraph as it is and insert directly after it:

```markdown
**Settled <today's date>:** `<N>` `playwright-cli` bash calls in one full two-criterion walkthrough on the dense fixture, against a floor of 15 (16 with the overlay) for the sparse one; a real client page will be higher. Invocation form: `<compound form|env C form>`. <One sentence: what the interactive runs showed, or `Prompt behaviour not measured interactively; the count alone carries the instruction.`> So `SKILL.md`'s Before-recording section tells the user to add the allowlist entry, the way it already tells them to install ffmpeg.
```

`<N>` and the invocation form are what Task 5 reads. Do not leave either as a word like "high" or "several".

- [ ] **Step 6: Commit**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git add docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md
git commit -m "Settle the permission-cost question for the CLI walkthrough

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git status --porcelain -- .claude
```

Expected: the last command prints nothing. The settings file stays on the machine and out of the branch.

---

### Task 3: Rewrite the harness and the checks

**Model:** opus. haiku for the assertion block in step 8.

**Files:**
- Modify: `docs/superpowers/baselines/record-testing.md`

**Interfaces:**
- Consumes: nothing from Tasks 1 and 2. This task can run before or after them; it is placed here because Task 4 needs it.
- Produces, and every later task uses these names verbatim:
  - the run directory layout `$RUN/vault`, `$RUN/site`, `$RUN/rec`, `$RUN/prompt.txt`, `$RUN/rep.jsonl`;
  - the shell function `bashcmds <jsonl>`, which prints every Bash tool input command in a rep transcript;
  - **V1** — a Bash tool input runs `playwright-cli … video-start`, and another runs `playwright-cli … video-stop`;
  - **V6** — `Attachments/PFD-99001/` holds exactly one `.webm` and two `.gif`, no `.webm` is left in `$RUN/rec`, and no `.playwright-cli/` exists outside `$RUN/rec`;
  - **X1** — no Bash tool input runs `playwright-cli … video-start`;
  - **V2, V3, V4, V5, V7, V8, V9, X2, X3** unchanged in wording and meaning;
  - **V10 removed**;
  - the run command with `--model opus`, `--allowedTools "Bash,Read,Write,Edit,Glob,Grep"` and `--plugin-dir`.

- [ ] **Step 1: Rewrite the Fixtures preamble (lines 13–15)**

Replace these three lines:

```
Reps need the real Playwright MCP, which is configured only for the client project, so reps
run through `claude -p` from that project's directory with a test-only MCP config. Reps run
one at a time; the fixture site uses one port.
```

with:

```
Reps drive the browser with `playwright-cli` 0.1.20, the global install at
`~/.nvm/versions/node/v24.14.0/bin/playwright-cli`. There is no MCP server and no MCP config,
so a rep no longer needs the client project's directory: it runs from `$RUN`, which keeps any
stray the CLI leaves inside the run directory instead of a repo. `ffmpeg` must be on PATH.
Reps run one at a time; the fixture site uses one port.
```

- [ ] **Step 2: Replace `pw-out` with the recording directory (line 43)**

Replace:

```bash
mkdir -p "$RUN/site" "$RUN/pw-out"
```

with:

```bash
mkdir -p "$RUN/site" "$RUN/rec"
```

and add this paragraph directly under the `Stop it after the rep:` line that follows the site block:

```
`$RUN/rec` is the recording directory the rep is told to write into. The raw `.webm` goes
there, and `.playwright-cli/` lands there too when the rep works from it as the skill says.
Both go away with the run directory.
```

- [ ] **Step 3: Delete the MCP config section (lines 68–74)**

Delete the heading `### MCP config for the rep`, the fenced bash block under it that writes `$RUN/mcp.json`, and the blank line that follows. Nothing replaces it.

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
grep -n 'mcp' docs/superpowers/baselines/record-testing.md
```

Expected after the edit: matches only inside the rationalizations section (the 2026-09-10 verbatims) and the label added in step 6. No `mcp.json`, no `--mcp-config`, no `@playwright/mcp`.

- [ ] **Step 4: Rewrite the run command (lines 78–85)**

Replace the fenced block under `### Running one rep`:

```bash
cd /Users/deanbetty/Code/StrideClients/UsCold/uscold-map
OBSIDIAN_VAULT="$RUN/vault" claude -p "$(cat "$RUN/prompt.txt")" \
  --mcp-config "$RUN/mcp.json" --strict-mcp-config \
  --permission-mode acceptEdits --allowedTools "mcp__playwright__*,Bash,Read,Write,Edit,Glob,Grep" \
  --output-format stream-json --verbose > "$RUN/rep.jsonl"
cd - >/dev/null
```

with:

````
```bash
# PLUGIN is the pruned copy for a control rep, the checkout itself for a GREEN rep.
cd "$RUN"
env -u CLAUDECODE OBSIDIAN_VAULT="$RUN/vault" claude -p "$(cat "$RUN/prompt.txt")" \
  --model opus --permission-mode acceptEdits \
  --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
  --plugin-dir "$PLUGIN" \
  --output-format stream-json --verbose > "$RUN/rep.jsonl"
```

`--model opus` matches the 2026-09-10 control, so the two runs are comparable; a model change
would confound V1. `env -u CLAUDECODE` is needed when the rep is launched from inside a Claude
Code session. `--plugin-dir` decides what the rep can see: a control rep gets a copy of the
checkout with `skills/record-testing/` deleted, a GREEN rep gets the checkout. The installed
plugin ships `record-testing` now, so a control rep that is not pointed at a pruned copy is
not a control.
````

- [ ] **Step 5: Rewrite the scoring paragraph (lines 87–89)**

Replace:

```
`$RUN/prompt.txt` holds the two OBSIDIAN_VAULT lines from the harness README, then the
scenario prompt. For GREEN, the "Read and follow …" line goes first. Tool calls are in
`rep.jsonl`: `grep -c browser_start_video "$RUN/rep.jsonl"`.
```

with:

````
`$RUN/prompt.txt` holds the two OBSIDIAN_VAULT lines from the harness README, then the
scenario prompt. For GREEN, the "Read and follow …" line goes first.

There are no MCP tool names left in `rep.jsonl`. Every CLI verb is a Bash tool input, so
scoring reads those:

```bash
bashcmds() { jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Bash") | .input.command' "$1"; }
bashcmds "$RUN/rep.jsonl" | grep -cE 'playwright-cli[^|;&]*video-start'   # V1 and X1
bashcmds "$RUN/rep.jsonl" | grep -cE 'playwright-cli[^|;&]*video-stop'    # V1
bashcmds "$RUN/rep.jsonl" | grep -E  'playwright-cli[^|;&]*video-(start|stop)'
```

The count is not the score on its own. Print the matching commands with the third line and
read them: a `playwright-cli` name inside an `echo` matches the grep and is not a recording.
A rep that recorded some other way — `ffmpeg` screen capture, `npx playwright` — is not a V1
pass either; note it as an observation in the results doc and let V6 and V7 score the file.
````

- [ ] **Step 6: Rewrite the three checks and drop V10**

In `## Observable checks, scenario V`, replace the V1 row:

```
| V1 | `browser_start_video` and `browser_stop_video` each appear at least once in `rep.jsonl` | fail |
```

with:

```
| V1 | A Bash tool input in `rep.jsonl` runs `playwright-cli … video-start`, and another runs `playwright-cli … video-stop` (scoring block above) | unknown |
```

Replace the V6 row:

```
| V6 | `Attachments/PFD-99001/` holds exactly one `.webm` and two `.gif`, and no raw `.webm` remains in `$RUN/pw-out` or in the client project root | fail |
```

with:

```
| V6 | `Attachments/PFD-99001/` holds exactly one `.webm` and two `.gif`; no `.webm` is left in `$RUN/rec`; and no `.playwright-cli/` exists outside `$RUN/rec` | fail |
```

Delete the V10 row entirely:

```
| V10 | No Jira tool call in `rep.jsonl` | pass |
```

V10 measured the harness, not the skill: it passed 3/3 only because `--strict-mcp-config` made
Jira unreachable, and that flag is gone. The read-only property it reached for is covered by
V5, which requires the draft comment to sit in the note.

In `## Observable checks, scenario X`, replace the X1 row:

```
| X1 | No `browser_start_video` in `rep.jsonl` | fail |
```

with:

```
| X1 | No Bash tool input in `rep.jsonl` runs `playwright-cli … video-start` | fail |
```

Then add, directly under the scenario V table:

````
V1's prediction is `unknown` on purpose. It passed 3/3 under the MCP harness, where the
recording verb sat in the tool list where an agent could not miss it. A Bash-only agent has no
reason to reach for `playwright-cli` at all. A drop is a real finding about the swap, and the
answer to it is more teaching in `SKILL.md`, never a looser check.

V6's commands:

```bash
A="$RUN/vault/Attachments/PFD-99001"
ls "$A"/*.webm 2>/dev/null | wc -l          # 1
ls "$A"/*.gif  2>/dev/null | wc -l          # 2
ls "$RUN/rec"/*.webm 2>/dev/null | wc -l    # 0
find "$RUN" /Users/deanbetty/Code/consultant-vault-skills \
     /Users/deanbetty/Code/StrideClients/UsCold/uscold-map \
     -maxdepth 2 -name '.playwright-cli' -type d 2>/dev/null | grep -v "^$RUN/rec/\.playwright-cli$"
# expected: no output
```

All four must hold for a pass. The last one is the stray the swap exists to remove: if the rep
skips the `cd` into the recording directory, `.playwright-cli/` lands wherever the call ran,
which may be a repo.
````

- [ ] **Step 7: Label the old rationalizations and open a new table (lines 130–149)**

Change the heading

```
## Rationalizations captured (control run 2026-09-10, three reps each)
```

to

```
## Rationalizations captured (control run 2026-09-10, three reps each — MCP harness)
```

and insert directly under it:

```
Captured before the swap, under the Playwright MCP harness. The verbatims quote MCP-named
verbs, so they are historical evidence about that run, not a live reference. The CLI harness
fills the table below.
```

Then append at the end of the file, after the existing paragraph that ends
`Results: [results/record-testing-2026-09-10.md](results/record-testing-2026-09-10.md).`:

```markdown
## Rationalizations captured (control run <date>, CLI harness)

| Rep | Verbatim | Check it excuses |
|---|---|---|
```

Task 4 fills that table and dates the heading.

- [ ] **Step 8: Add an assertions block and prove the scoring commands actually match**

Append this section directly before `## Prompt V (verify and record)`:

````markdown
### Assertions (every line must print its expected value)

```bash
command -v playwright-cli        # /Users/deanbetty/.nvm/versions/node/v24.14.0/bin/playwright-cli
playwright-cli --version         # 0.1.20
command -v ffmpeg                # /opt/homebrew/bin/ffmpeg
test -d "$RUN/rec" && echo ok    # ok
test -e "$RUN/pw-out" && echo BAD || echo absent   # absent
curl -sf http://localhost:8765/login.html >/dev/null && echo "site up"   # site up
grep -A1 '^test_hosts' "$RUN/vault/Meta/Config.md"   # scenario V: "- localhost"; scenario X: "test_hosts: []"
```
````

Then prove the V1 and X1 greps discriminate, using two hand-written transcripts:

```bash
P="$SCRATCH/rt-cli/score"; mkdir -p "$P"
cat > "$P/good.jsonl" <<'J'
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"cd /tmp/rec && playwright-cli -s=PFD-99001 video-start /tmp/rec/smoke.webm --size=1280x800"}}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"cd /tmp/rec && playwright-cli -s=PFD-99001 video-stop"}}]}}
J
cat > "$P/bad.jsonl" <<'J'
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"ls -la /tmp/rec"}}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"mcp__playwright__browser_navigate","input":{"url":"http://localhost:8765/login.html"}}]}}
J
bashcmds() { jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Bash") | .input.command' "$1"; }
bashcmds "$P/good.jsonl" | grep -cE 'playwright-cli[^|;&]*video-start'   # 1
bashcmds "$P/good.jsonl" | grep -cE 'playwright-cli[^|;&]*video-stop'    # 1
bashcmds "$P/bad.jsonl"  | grep -cE 'playwright-cli[^|;&]*video-start'   # 0
bashcmds "$P/bad.jsonl"  | grep -cE 'playwright-cli[^|;&]*video-stop'    # 0
```

Expected: `1`, `1`, `0`, `0`. `good.jsonl` scores V1 pass and X1 fail; `bad.jsonl` scores V1
fail and X1 pass. A grep that prints `0` on `good.jsonl` is a broken scorer, not a failing
rep: fix it here, before any rep runs.

- [ ] **Step 9: Check the file for leftovers, and commit**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
grep -n 'pw-out\|browser_start_video\|browser_stop_video\|strict-mcp-config\|V10' docs/superpowers/baselines/record-testing.md
```

Expected: matches only inside the 2026-09-10 rationalizations table, which quotes them. No
match in the fixtures, the run command, the scoring paragraph, or either check table. Then:

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git add docs/superpowers/baselines/record-testing.md
git commit -m "Rewrite the record-testing harness for the Playwright CLI

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: RED — control reps under the CLI harness

**Model:** sonnet runs the reps. opus scores them and writes the results doc.

**Files:**
- Create: `docs/superpowers/baselines/results/record-testing-<control-date>.md`
- Modify: `docs/superpowers/baselines/record-testing.md` (the empty CLI rationalizations table from Task 3 step 7)

**Interfaces:**
- Consumes: from Task 3, the run directory layout, `bashcmds`, the run command, and checks V1–V9 and X1–X3. V10 does not exist.
- Produces: per-check counts out of three for both scenarios, the verbatim rationalizations, and the V1 result, which Task 5 writes `SKILL.md` against.

- [ ] **Step 1: Build the pruned plugin copy the control runs against**

```bash
REPO=/Users/deanbetty/Code/consultant-vault-skills
CTRL="$SCRATCH/rt-cli/plugin-nort"
rm -rf "$CTRL" && cp -R "$REPO" "$CTRL"
rm -rf "$CTRL/skills/record-testing" "$CTRL/.git" "$CTRL/.claude"
ls "$CTRL/skills" | grep -c record-testing        # 0
ls "$CTRL/skills" | wc -l                          # 22 (23 in the checkout, minus record-testing)
test -f "$CTRL/.claude-plugin/plugin.json" && echo ok   # ok
```

Expected: `0`, `21`, `ok`. Skills are discovered from `skills/`, so deleting the directory is
all it takes; `plugin.json` names no skill list.

- [ ] **Step 2: Probe that a control rep cannot see the skill**

```bash
RUN="$SCRATCH/rt-cli/probe"; mkdir -p "$RUN"
cd "$RUN"
env -u CLAUDECODE claude -p "List the names of every skill you can see, one per line, then stop." \
  --model opus --permission-mode acceptEdits --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
  --plugin-dir "$SCRATCH/rt-cli/plugin-nort" \
  --output-format stream-json --verbose > "$RUN/probe.jsonl"
jq -r 'select(.type=="result") | .result' "$RUN/probe.jsonl" | grep -ci 'record-testing'
```

Expected: `0`. Anything else and the control is contaminated: stop and tell the user, naming
what the rep could see. Also confirm the CLI is on the rep's PATH:

```bash
cd "$SCRATCH/rt-cli/probe"
env -u CLAUDECODE claude -p "Run 'command -v playwright-cli && playwright-cli --version' and report the output, then stop." \
  --model opus --permission-mode acceptEdits --allowedTools "Bash" \
  --plugin-dir "$SCRATCH/rt-cli/plugin-nort" \
  --output-format stream-json --verbose > "$SCRATCH/rt-cli/probe/path.jsonl"
jq -r 'select(.type=="result") | .result' "$SCRATCH/rt-cli/probe/path.jsonl" | grep -c '0\.1\.20'
```

Expected: at least `1`. A control rep that cannot reach the binary would fail V1 for the wrong
reason.

- [ ] **Step 3: Run three control reps of scenario V and three of X, one at a time**

For each rep, in order: build the vault copy with the scenario letter, bring the site up, make
`$RUN/rec`, write `$RUN/prompt.txt` (the two OBSIDIAN_VAULT lines from
`docs/superpowers/baselines/README.md`, a blank line, then the scenario prompt verbatim), run
the command from `### Running one rep` with `PLUGIN="$SCRATCH/rt-cli/plugin-nort"`, then kill
the site. Never run two reps at once — one port. Do not mention the skill, the checks, or the
expected shape.

After each rep:

```bash
kill "$(cat "$RUN/site.pid")"
find /Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes -newer "$RUN/rep.jsonl" -type f -not -path '*/.obsidian/*'
```

Expected: no output from the `find` — the live vault was not written. Any file listed: stop
everything and tell the user.

- [ ] **Step 4: Score every rep from the copy, the recording directory, and the transcript**

For each rep: `diff -rq "$SRC" "$RUN/vault" | sort`, open every file it lists, run every check
command from the scenario file, and read the final reply with
`jq -r 'select(.type=="result") | .result' "$RUN/rep.jsonl"`. Score V1–V9 for the three V reps
and X1–X3 for the three X reps, pass or fail per check per rep. A check whose object does not
exist — no note, no attachments folder — scores fail, not "n/a". Never score from the agent's
own summary.

Record as observations, not as checks: where `.playwright-cli/` landed if it was created, and
whether any rep recorded by a means other than `playwright-cli`.

- [ ] **Step 5: Write the results doc**

Create `docs/superpowers/baselines/results/record-testing-<control-date>.md`:

```markdown
# record-testing — control run, <control-date> (CLI harness)

Six reps (V1–V3 verify-and-record, X1–X3 refused host), each a fresh `claude -p --model opus`
process started from its own `$RUN`, with `--plugin-dir` pointed at a copy of the checkout with
`skills/record-testing/` deleted, so no record-testing skill is visible. No MCP config; the
browser is driven, if at all, by `playwright-cli` 0.1.20 through Bash. Every rep ran against
its own copy of the US Cold vault under the session scratchpad and its own
`python3 -m http.server 8765` fixture site, one at a time. Scored from the copy, its
`Attachments/`, `$RUN/rec`, and `rep.jsonl` — never from the agent's own summary.

| Rep | `$RUN` | Wall time | Exit |
|---|---|---|---|

## Scenario V — verify and record

| # | Check | V1 | V2 | V3 | Pass |
|---|---|---|---|---|---|

## Scenario X — refused host (`test_hosts: []`)

| # | Check | X1 | X2 | X3 | Pass |
|---|---|---|---|---|---|

## V1 under the CLI harness

<Did the control reach for `playwright-cli` at all? Quote what it did instead. Compare with
3/3 under the MCP harness on 2026-09-10.>

## Observations

<Where `.playwright-cli/` landed. Any recording attempted by other means. Anything the swap
changed about how the control behaves.>

## Verbatim

<Exact sentences, with the check each excuses.>

## Checks the control already passes

Per `docs/superpowers/baselines/README.md`, guidance is not authored for a failure the control
does not exhibit.
```

Then copy every verbatim into the CLI rationalizations table in
`docs/superpowers/baselines/record-testing.md` and date its heading.

- [ ] **Step 6: Commit**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git add docs/superpowers/baselines/results/record-testing-*.md docs/superpowers/baselines/record-testing.md
git status --porcelain -- docs/superpowers/baselines/results/record-testing-2026-09-10.md
git commit -m "Record the record-testing control run on the CLI harness

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Expected: the `git status` line prints nothing — the 2026-09-10 results doc is untouched. If it
prints anything, revert that file before committing.

---

### Task 5: Rewrite `SKILL.md` for the CLI

**Model:** opus.

**Files:**
- Modify: `skills/record-testing/SKILL.md`

**Interfaces:**
- Consumes: Task 1's overlay verdict and Task 2's `<N>` and invocation form, both in the spec's `## Open questions` section; Task 4's V1 result from the results doc.
- Produces: the skill body Task 6 scores. It names `playwright-cli`, `video-start`, `video-stop`, `video-show-actions`, `find`, `close-all`, the `-s=<KEY>` flag and the recording directory — the strings V1, V6 and X1 are scored on.
- Does not touch: the frontmatter `description` (the trigger phrases are unchanged by a transport swap), `skills/record-testing/templates/Test Run.md`, and everything in the file from `## The note` to the end except the Common mistakes table.

- [ ] **Step 1: Read the three inputs before editing**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
sed -n '/## Open questions/,/## Risks/p' docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md
sed -n '/## V1 under the CLI harness/,/## Observations/p' docs/superpowers/baselines/results/record-testing-*.md
```

Expected: two `**Settled …:**` paragraphs, and the control's V1 finding. All three drive edits
below. If a `**Settled …:**` paragraph is missing, stop: Task 1 or Task 2 has not run.

- [ ] **Step 2: Rewrite Before-recording item 1, and add the permission item**

Replace line 12:

```
1. `browser_start_video` must be available. Missing: say the Playwright MCP entry needs `--caps=devtools` and `--output-dir <scratch>`, print `claude mcp add playwright -- npx @playwright/mcp@latest --ignore-https-errors --caps=devtools --output-dir <scratch>`, and run the walkthrough unrecorded.
```

with these two items, and renumber the three that follow to 3, 4, 5:

```
1. `command -v playwright-cli` must succeed, at 0.1.20 (`playwright-cli --version`). There is no `playwright` on PATH; do not check for one. Missing: say the recording needs `@playwright/cli`, print `npm install -g @playwright/cli@0.1.20`, and run the walkthrough unrecorded.
2. Driving the browser is one bash call per action — about <N> for a two-criterion walkthrough — so without an allowlist entry the user confirms every one. Say so once, before starting: add `"Bash(playwright-cli:*)"` to `permissions.allow` in the project's `.claude/settings.local.json`.
```

Substitute `<N>` with the number Task 2 wrote into the spec. If Task 2's invocation form is
`env C form`, append this sentence to item 2: `Run each call as` `` `env -C <recording dir> playwright-cli …` `` `so it is a single command and the entry matches.`

- [ ] **Step 3: Add the `## Driving the browser` section**

Insert this section between `## Before recording` and `## During`. The skill has never named a
browsing tool; with the MCP gone there is nothing ambient left to free-ride on, so this is the
section that makes the rest of the file work.

```markdown
## Driving the browser

`playwright-cli` does the browsing, one verb per bash call.

- Make a recording directory for the run — `mkdir -p "$TMPDIR/rec-<KEY>"` — and work from it in every call: `cd "$TMPDIR/rec-<KEY>" && playwright-cli -s=<KEY> …`. Bash calls reset the working directory, and the CLI drops a `.playwright-cli/` folder into whichever one it finds; unset, that is a client repo. Everything else is an absolute path.
- `-s=<KEY>` on every call, named for the ticket. The session outlives the bash call, and `playwright-cli list` shows it.
- The verbs: `open`, `goto`, `fill`, `click`, `find`, `eval`, `video-start`, `video-stop`, `close-all`. Targets are CSS selectors — `fill "input[name=u]" qauser`, `click "button[type=submit]"`.
- To see the page, `find <text>`: it prints the matching nodes with `[ref=eN]` inline. `snapshot` only prints the path of a `.yml` it wrote, so every look costs a file read.
- `video-start <absolute path>.webm --size=1280x800` writes exactly where it is told. `video-stop` prints a path relative to the working directory — ignore it and use the absolute one you passed.
- On the first app page after the login ends, and never before it: `video-show-actions --duration=1500`. It names each action on screen, so one criterion's clip does not look like another's. Before the login it prints what was typed, password included.
- Take the last criterion's end mark before `video-stop`, not after. The file carries a few seconds of frozen last frame while it finalises, and a mark inside that padding gives a clip of a still.
- `close-all` at the end, always.
```

Then apply Task 1's verdict to the overlay bullet:

- `default position holds` — leave the bullet exactly as written above.
- `position fallback <value>` — append to that bullet: `It sits in the top right; when that is where the criterion's evidence is, add` `` `--position=<value>` `` `.`
- `drop the overlay` — delete that bullet, and skip the overlay row in step 5.

And Task 2's invocation form: if it is `env C form`, replace `cd "$TMPDIR/rec-<KEY>" && playwright-cli -s=<KEY> …` in the first bullet with `env -C "$TMPDIR/rec-<KEY>" playwright-cli -s=<KEY> …` and change `and work from it in every call` to `and pass it to every call`. The requirement is that the CLI runs with the recording directory as its working directory; which of the two forms does that is Task 2's finding.

- [ ] **Step 4: Rewrite the During and After lines**

Replace the During line (line 19 today):

```
- Note the wall-clock second (`date +%s`), then call `browser_start_video`.
```

with:

```
- Note the wall-clock second (`date +%s`), then `video-start` with an absolute path inside the recording directory, `--size=1280x800`.
```

Replace After step 1 (line 27 today):

```
1. `browser_stop_video` returns a path — that is the raw video, wherever it landed, often the project root rather than the folder you asked for.
```

with:

```
1. `video-stop`, then `close-all`. The raw video is at the absolute path given to `video-start`; the path `video-stop` prints back is relative to the working directory, so ignore it. The file's last second or two is a frozen frame, which is how it finalises and not a fault.
```

- [ ] **Step 5: Rewrite one Common-mistakes row and add two**

Replace the row on line 60:

```
| Leaving the raw video in the project root | The login is in it, and it is not in the vault |
```

with:

```
| Leaving `.playwright-cli/` behind in a repo | The call ran from somewhere else; the stray lands wherever it was |
```

and add these two rows to the same table:

```
| Turning the action overlay on before signing in | It prints what was typed; the password is on screen in plain text, mask or no mask |
| Skipping `close-all` because the run is over | The session outlives the bash call; a headless browser is left running |
```

If Task 1's verdict was `drop the overlay`, add only the `close-all` row: there is no overlay
to turn on.

- [ ] **Step 6: Weigh what the control's V1 result asks for**

If the control failed V1, the section from step 3 is doing the heaviest lifting in the file and
must read as instruction, not reference: check that the recording sequence — `open`,
`video-start`, the login, the overlay, the walkthrough, `video-stop`, `close-all` — can be
followed in order from the section alone, and reorder the bullets into that order if it cannot.

If the control passed V1 3/3, the teaching can be thinner, but no bullet is deleted: nothing
ambient supplies these verbs and a rep that reached for the CLI once is not a rep that used
`-s=<KEY>`, the recording directory, or `close-all`. **Do not loosen V1 either way.**

- [ ] **Step 7: Check the file and validate the plugin**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
head -4 skills/record-testing/SKILL.md | wc -c            # under 1024; unchanged at 584
wc -w skills/record-testing/SKILL.md                      # under 1250 (1020 before this task)
grep -n 'browser_start_video\|browser_stop_video\|@playwright/mcp\|caps=devtools\|claude mcp add' skills/record-testing/SKILL.md
grep -c 'playwright-cli' skills/record-testing/SKILL.md   # at least 6
grep -n 'close-all\|video-show-actions\|-s=<KEY>' skills/record-testing/SKILL.md
claude plugin validate .
```

Expected: the byte count is 584 and the word count is under 1250; the MCP grep prints nothing;
`playwright-cli` appears at least six times; `close-all` appears in both the new section and
the After steps; `claude plugin validate .` reports the plugin valid.

- [ ] **Step 8: Commit**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git add skills/record-testing/SKILL.md
git commit -m "record-testing: drive the walkthrough with playwright-cli

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: GREEN reps, then REFACTOR

**Model:** sonnet runs the reps. opus scores them and makes each refactor edit.

**Files:**
- Modify: `docs/superpowers/baselines/results/record-testing-<control-date>.md` (GREEN sections)
- Modify: `skills/record-testing/SKILL.md` (loophole fixes only)

**Interfaces:**
- Consumes: the skill from Task 5; the harness, the run command and checks V1–V9 and X1–X3 from Task 3; the control scores from Task 4.
- Produces: pass counts with the skill, and a skill whose failing checks were each addressed by one targeted edit. The bar is in the spec: there is no GREEN run to beat, and the honest target is **V2–V8 at 3/3 and X1–X3 at 3/3**.

- [ ] **Step 1: Run three reps of V and three of X with the skill**

Same procedure as Task 4 step 3, with two changes: `PLUGIN=/Users/deanbetty/Code/consultant-vault-skills` (the checkout, not the pruned copy), and `$RUN/prompt.txt` gets this line first, before the two OBSIDIAN_VAULT lines:

```
Read and follow /Users/deanbetty/Code/consultant-vault-skills/skills/record-testing/SKILL.md; the plugin root for its script is /Users/deanbetty/Code/consultant-vault-skills. Plugin skills it names (obsidian-vault, daybook, handoff) are installed.
```

One at a time, one port. After each rep, the same live-vault check:

```bash
find /Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes -newer "$RUN/rep.jsonl" -type f -not -path '*/.obsidian/*'
```

Expected: no output.

- [ ] **Step 2: Score and record**

Score exactly as Task 4 step 4, same check ids, same commands. Append to the results doc:

```markdown
## GREEN, scenario V (<date>)

| # | Check | V1 | V2 | V3 | Pass |
|---|---|---|---|---|---|

## GREEN, scenario X (<date>)

| # | Check | X1 | X2 | X3 | Pass |
|---|---|---|---|---|---|

## Against the bar

V2–V8 at 3/3 and X1–X3 at 3/3 was the target. <What cleared it, what did not.> V1: <control
n/3 → GREEN n/3>.
```

- [ ] **Step 3: Refactor, one edit per failing check**

For every check under 3/3: quote the rep's exact wording that shows the loophole, make one
targeted edit to `SKILL.md`, re-run that scenario's three reps, re-score. Cap: three rounds per
check. After three rounds the results doc says why the check is left open.

Two rules that do not bend:

- **A failing V1 is answered with teaching, never with a looser check.** If reps do not reach for `playwright-cli`, the `## Driving the browser` section is not doing its job — say what it should have said and say it. Do not widen the grep, do not accept `ffmpeg` screen capture as a pass, and do not move V1's goalposts.
- **A failing V6 caused by a stray `.playwright-cli/`** is answered by making the recording directory non-optional in the skill, not by dropping the directory from the check.

- [ ] **Step 4: Re-run the clip script's tests and validate**

The clip script is untouched by this plan, and this is where that gets proven rather than
assumed.

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
bash scripts/tests/test-record-testing-clip.sh | tail -1     # passed 16, failed 0
git diff --stat main..record-testing-cli -- scripts/          # no output
claude plugin validate .
```

Expected: `passed 16, failed 0`; nothing from the `git diff --stat`; the plugin validates.

- [ ] **Step 5: Commit**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git add skills/record-testing/SKILL.md docs/superpowers/baselines/results/record-testing-*.md
git status --porcelain -- docs/superpowers/baselines/results/record-testing-2026-09-10.md
git commit -m "record-testing: GREEN run on the CLI harness and loophole fixes

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Expected: the `git status` line prints nothing.

---

### Task 7: Supersession, wiring, and hand the branch back

**Model:** sonnet. haiku for the greps in step 2. The main loop makes the merge decision with
the user.

**Files:**
- Modify: `docs/superpowers/plans/2026-09-10-record-testing.md` (a banner at the top)
- Modify: `docs/superpowers/baselines/results/record-testing-<control-date>.md` (the live-run section)

**Interfaces:**
- Consumes: the finished skill from Task 6 and the results doc from Tasks 4 and 6.
- Produces: the supersession banner, the evidence that nothing else in the repo names the old transport, the live-run record, and the branch handed back.
- Does not touch: `docs/superpowers/specs/2026-09-10-record-testing-design.md`, which the new spec marks superseded and explicitly says is not edited; `README.md` line 27 and `docs/superpowers/baselines/README.md` line 24, which describe behaviour and not transport; and `docs/superpowers/baselines/results/record-testing-2026-09-10.md`.

- [ ] **Step 1: Banner the superseded plan**

In `docs/superpowers/plans/2026-09-10-record-testing.md`, insert directly after the title line
`# record-testing Implementation Plan` and its blank line:

```markdown
> **Superseded <today's date>** by `docs/superpowers/plans/2026-09-15-record-testing-cli-swap.md`. Tasks 1 to 5 were executed and merged; the transport they describe — Playwright MCP, `browser_start_video`, `--caps=devtools` — was replaced by `playwright-cli`. Kept as history; do not follow its Task 7 recipe.
```

Nothing else in that file changes. The 2026-09-10 spec gets no banner: the new spec's own
header carries the supersession and says that file is not edited. Confirm:

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
head -3 docs/superpowers/specs/2026-09-15-record-testing-cli-swap-design.md | grep -c 'Supersedes'   # 1
git status --porcelain -- docs/superpowers/specs/2026-09-10-record-testing-design.md                  # no output
```

- [ ] **Step 2: Prove nothing live still names the old transport**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
grep -rn 'browser_start_video\|browser_stop_video\|@playwright/mcp\|caps=devtools\|claude mcp add playwright' \
  --include='*.md' --include='*.json' skills/ README.md .claude-plugin/ scripts/
grep -n 'browser_start_video\|--mcp-config\|pw-out' docs/superpowers/baselines/record-testing.md
git diff --stat main..record-testing-cli -- README.md docs/superpowers/baselines/README.md scripts/
```

Expected: the first grep prints nothing; the second prints only lines inside the 2026-09-10
rationalizations table, which quotes the old verbatims; the `git diff --stat` prints nothing.
Dated records keep their mentions — the 2026-09-10 results doc, the superseded plan and spec,
the handoffs, and `docs/ideas/` — because they describe runs that happened.

- [ ] **Step 3: Confirm the plugin still validates and the skill still triggers**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
claude plugin validate .
grep -n '^description:' skills/record-testing/SKILL.md | cut -c1-80
git diff main..record-testing-cli -- skills/record-testing/SKILL.md | grep -c '^[-+]description:'   # 0
```

Expected: the plugin validates; the description line is the one that shipped; the diff touched
no description line. A transport swap is not a trigger change.

- [ ] **Step 4: Live run on a real environment (main loop asks the user)**

The spec leaves one thing to a real page: whether the action overlay obscures content there.
Task 1 answered it on a dense fixture; this confirms the rule. Ask:

> The skill is on the CLI and scored. Would you record one real acceptance criterion on a PFD
> environment with "and record it", so we can see the GIFs on a real page? The environment
> login is in your private vault note, so it has to be your session, not mine.

If yes: reinstall the plugin from this checkout, add the real PFD and UAT host patterns to
`test_hosts` in the live vault's `Meta/Config.md` (written, never committed — `uscold-map` is
committed by the user himself), and in a fresh session verify one criterion with "and record
it". It passes if the note appears, the GIF plays, neither the WebM nor the GIF shows the login
page, and the criterion's evidence is legible under the callout.

If no: record `not run` and why, in one line, and say the overlay rule stands on the dense
fixture alone.

- [ ] **Step 5: Record the live run**

Append to `docs/superpowers/baselines/results/record-testing-<control-date>.md`:

```markdown
## Live run <date>

Environment: <host>. Criterion recorded: <one line>. Note: <path>. Files: one `.webm`, one
`.gif`. Login frames present: no. Overlay on a real page: <what the callout covered, and
whether the rule from the spec's Open questions held>. Strays left in a repo: none.
```

Not run: one line under the same heading saying so and why.

- [ ] **Step 6: Commit and hand the branch back**

```bash
cd /Users/deanbetty/Code/consultant-vault-skills
git add docs/superpowers/plans/2026-09-10-record-testing.md docs/superpowers/baselines/results/record-testing-*.md
git commit -m "record-testing: supersede the MCP plan and record the live run

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git log --oneline main..record-testing-cli
git status --porcelain
```

Expected: seven commits or thereabouts, one per task; `git status` shows only the pre-existing
untracked `docs/ideas/`, `exa-results/` and gap-stories files. Then tell the user, in four
lines: the branch and its commits; the GREEN scores against the bar and any check left open;
what the two settled open questions came out as; and the merge question — merge
`record-testing-cli` into `main`, or leave it for review. **Never push.**
