# Wayfinder plan mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A plan for code not yet written, shown on the same page as a walkthrough: each stop marked new, changed, unchanged or built by another ticket, with today's code checked at a base ref, a sketch of the planned code, and every part marked as in the plan, awaiting review, a proposal or open. Then the Wayfinder skill that writes the data and runs the build.

**Architecture:** `"mode": "plan"` in the data file switches the shared `code-walkthrough` build and page into plan mode. Plan rules live in a new `scripts/lib/plan.mjs`, called from `shapeErrors`; every other change is a plan-mode branch in an existing file, and a data file with no `mode` takes exactly today's path. A guard test, written first, holds the existing walkthrough output fixed. The skill is a new `skills/wayfinder/` folder that runs `code-walkthrough`'s two commands.

**Tech Stack:** Node 24 built-ins (`node:test`), git (read only), headless Chrome through `dumpDom`, chalk-talk at commit `4f88ead` (never edited), `claude -p --model sonnet` for reps.

**Spec:** `docs/superpowers/specs/2026-11-20-wayfinder-design.md`, slices 2 to 6. Assumes `docs/superpowers/plans/2026-11-20-walkthrough-divider.md` is done.

## Global Constraints

- **Workspace:** the `wayfinder` worktree and branch that the divider plan made. This plan's commits follow that plan's.
- **No push, no merge, no pull request** in any task. Task 16 ends by reporting to the user.
- **Staging:** by exact path only. The untracked files in the main working tree are never staged.
- **Commits:** one per task. `code-walkthrough: ` for build, page and test changes; `wayfinder: ` for Task 15. No `Co-Authored-By` trailer, no Claude attribution.
- **Who does what:** each task names its models; every file edit goes to a subagent with that model. Every dispatch prompt opens with: "You were dispatched to execute a specific task. Ignore session-start skill reminders."
- **Public repo:** roles only; no names, emails, client names, real ticket keys (use `PROJ-123`) or home paths other than `~`.
- **Tests:** `node --test "scripts/tests/*.test.mjs"` from `skills/code-walkthrough`, Chrome and chalk-talk present, nothing skipped. Start: `pass 245`, `fail 0` (after the divider plan). Each task expects the previous total plus its new tests, `fail 0`. The guard test from Task 1 passes after every task.
- **No-mode rule:** with no `mode`, every function returns what it returns today. New model fields, `checks` keys (`sketches`, `planned`, `savedOf.chat`, `savedOf['plan-file']`) and data fields appear only in plan mode.
- **Failure lines:** `plan.test.mjs` asserts the bare string a plan-check function returns; `build.test.mjs` asserts the printed line. Shape failures print `FAIL the plan: <line>` in plan mode (`FAIL the walkthrough: ` stays for walkthroughs).
- **Exit codes (spec):** unknown `mode`, bad `base`, unknown `base` ref: exit 2, as a refusal (stderr `walkthrough-build: <message>` and the usage line). Every plan shape failure, `extend` included: exit 1. Same day: exit 3.
- **Fixture:** `ledgerRepo(root, { ahead = false, remote = false } = {}) -> { path, head, base }` and `samplePlan(repo) -> object` in `helpers.mjs` (Task 2). `samplePlan` is the spec's complete example, word for word, with `repos[0].path = repo.path`. Each failure test below is one edit to it.
- **Decided here** (the spec gives no string, or two that clash): the missing-base message is the checks table's, sent as the exit-2 refusal; `after` with `new_file: true` is a shape failure; `stop s3 code block 1 is a sketch of 1 line; give it 2 or more`; with no base the words say "on disk" (Task 8); the vault schema, config and README lines go in Task 15, with the skill.

## Review Focus

1. **An existing walkthrough data file after the change** builds the same model, note, reply, data file and scene. Pinned: Task 1, `an existing walkthrough builds as before`, green after every task.
2. **A base ref missing locally, and two repos where only one has a base.** Exit 2 with the fetch-it-yourself line, nothing fetched or written; the other repo reads its disk. Pinned: Task 9, `a base the repo does not know is refused` and `two repos, one with a base`; Task 10, `two repos, one with a base, mirror from both`.
3. **A sketch for a new function in an existing file** (`new_file: false`, `after`): no "not on disk" failure, and the page says "NEW · in an existing file". Pinned: Task 3, `the example plan builds`; Task 12, `a plan stop shows its status, origin and task`.
4. **A proposal that could read as decided.** Every proposal is tagged Proposal on the page, "(proposal)" in the note and counted in the reply; a source that says pending gives `review`. Pinned: Tasks 8 and 12; Task 15 scenario (g).
5. **A plan file that changed between builds.** The entry fails "no longer says this" and the saved copy is kept. Pinned: Task 4, `a plan file that no longer holds the quote`.

---

### Task 1: The no-change guard

**Model:** sonnet.

**Files:**
- Modify: `skills/code-walkthrough/scripts/tests/helpers.mjs`, `scripts/tests/no-change.test.mjs`
- Create: `scripts/tests/golden/booking-flow.build.json`

**Interfaces:**
- Consumes: `normalized`, `bookingRepo`, `sampleData` (helpers.mjs).
- Produces: `captureBuild(root: string) -> { model, note, reply, data, scene }`: writes `sampleData` beside a new vault, runs `walkthrough-build.mjs` as `build.test.mjs`'s `run` does (`--chalk none`, `--date 2026-11-11`, `--write`, `HOME` a folder with no chalk-talk, `CW_GH=0`), asserts exit 0, and returns, each through `normalized`: the page's `#walk-data` model, the vault note text, the stdout lines without `WROTE` lines, the written data file, and `sceneFor(sampleData(repo))`.

- [ ] **Step 1:** Add `captureBuild` and the test `an existing walkthrough builds as before`: `captureBuild(tempRoot(t))` deep-equals `golden/booking-flow.build.json`; a missing golden fails.
- [ ] **Step 2:** Make the golden once, before any plan-mode change, with a `node --input-type=module -e` line that writes `JSON.stringify(captureBuild(<temp dir>), null, 2)`. Read it: no temp path, no commit hash.
- [ ] **Step 3:** Run `no-change.test.mjs`. Expected: pass. It is a guard and passes on first run.
- [ ] **Step 4:** Run the tests. Expected: 246 pass, 0 fail.
- [ ] **Step 5:** Commit the three files: `code-walkthrough: the no-change guard covers the build`.

### Task 2: Plan mode, its names, and `extend` refused

**Model:** sonnet.

**Files:**
- Create: `scripts/lib/plan.mjs`, `scripts/tests/plan.test.mjs`
- Modify: `scripts/lib/data.mjs:31`, `scripts/lib/names.mjs`, `scripts/walkthrough-build.mjs:84-91, 137-138, 184`, `scripts/tests/helpers.mjs`
- Test: `plan.test.mjs`, `names.test.mjs`, `look.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces (plan.mjs): `isPlan(data) -> boolean`; `planShapeErrors(data) -> string[]`, called by `shapeErrors` when `isPlan`, and extended by Tasks 3 to 7 in this order: `sketchErrors`, `originErrors`, `taskErrors`, `chainErrors`, `writingErrors`.
- Produces (names.mjs): `noteBaseOf(shortName, mode?) -> string`; `chooseNames({ folderPath, slug, noteBase, date, sameDay, mode })`.
- Produces (helpers.mjs): `ledgerRepo` and `samplePlan` (Global Constraints). `src/routes/invoices.js`: line 1 imports `saveInvoice`, line 2 blank, lines 3–13 exactly the text of `references/data-file.md`'s first block. `src/store.js`: 20 lines, lines 3–5 that file's `totalOf`, lines 16–20 its `saveInvoice`, no other line naming `saveInvoice` or `saveAttachments`. One commit; `refs/remotes/origin/main` set to it (`update-ref`), so `base` is `head`. `docs/plan.md` holds `Attachments are saved in their own table.` `ahead`: one more commit that adds `// a later change` as line 1 of `src/store.js` and rewrites `docs/plan.md` as `Attachments moved.` `remote`: a clone at `<root>/ledger-upstream` with one commit more than `origin/main`, set as `origin`'s URL; the local `origin/main` is not moved.
- Produces (build.test.mjs): `planSetup(t, change, { ahead, remote } = {})`, the plan-mode twin of `setup`: `ledgerRepo`, `samplePlan` written to the temp root, folder `Plans`. `run` takes `--folder` from the context. Later tasks' build tests use it.

- [ ] **Step 1: Write the failing tests.**
  - plan.test `extend is refused in plan mode`: `planShapeErrors({ ...samplePlan(r), extend: [{}] })` includes `a plan has no extend points; put the work in plan.tasks`.
  - names.test `plan names`: `noteBaseOf('invoice attachments', 'plan')` is `Plan - invoice attachments`. On an empty folder, plan names are `invoice-attachments.plan.html`, `invoice-attachments.plan.json`, `Plan - invoice attachments.md`; on a folder holding them, `--same-day keep` gives `invoice-attachments-2026-11-20.plan.html`, `…-2026-11-20.plan.json`, `Plan - invoice attachments 2026-11-20.md`; `--same-day replace` gives the base `.plan.*` names with `replace: true`; no flag gives `clash` listing `invoice-attachments.plan.html`, `invoice-attachments.plan.json`, `Plan - invoice attachments.md`. A walkthrough of the same short name in that folder gets `earlier: null`.
  - look.test `a plan note is never listed`: a folder with only `Plan - x.md` (`type: code-plan`, an embed of `x.plan.html`) and `x.plan.json` prints `none`.
  - build.test `an unknown mode is refused`: `mode: 'draft'` → exit 2, stderr holds `has mode draft; only plan is known`, nothing in the working folder or vault.
  - build.test `plan shape failures print as the plan's`: `samplePlan` plus `extend` → exit 1, stdout holds `FAIL the plan: a plan has no extend points; put the work in plan.tasks`, and every `FAIL` line starts `FAIL the plan: `.
- [ ] **Step 2:** Run them. Expected: fail (no `plan.mjs`, no `mode` gate).
- [ ] **Step 3: Implement.** `dataProblem` returns `has mode <mode>; only plan is known` for any `mode` other than `plan`. `shapeErrors` appends `planShapeErrors(data)` in plan mode. The build's shape prefix and `chooseNames`'s names follow the mode. `look.mjs` does not change.
- [ ] **Step 4:** Run the tests. Expected: 251 pass, 0 fail.
- [ ] **Step 5:** Commit: `code-walkthrough: plan mode, its file names, and no extend points in a plan`.

### Task 3: Status, sketches and the code check

**Model:** opus.

**Files:**
- Modify: `scripts/lib/plan.mjs`, `scripts/lib/data.mjs:44-52`, `scripts/lib/code.mjs:51-93`, `scripts/lib/page.mjs:37-43, 80`, `scripts/lib/note.mjs:42`, `scripts/walkthrough-build.mjs:145, 158, 178`
- Test: `plan.test.mjs`, `code.test.mjs`, `page-model.test.mjs`, `note.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces (plan.mjs): `STATUSES = ['new', 'changed', 'unchanged', 'elsewhere']`; `isSketch(block) -> boolean` (`block?.planned === true`); `sketchErrors(data) -> string[]`.
- Produces (code.mjs): `checkCode(data, opts) -> { blocks, sketches, failures }`; `blocks` counts today blocks only. Sketches skip the text check; in plan mode each sketch's place is checked on disk; Task 9 adds the base.
- Changes: in plan mode `shapeErrors` skips `fieldProblem` on sketches and asks for a Why entry only on `unchanged` and `changed` stops. The build leaves sketches out of `cited_files` and writes `checks.code` as `{ blocks, sketches }` in plan mode, `{ blocks }` otherwise. A sketch's block model has `label: block.file` and rows `{ n: '', text, key: false }`; `firstFile` is its file; the note outline shows `` `src/store.js` (sketch) ``.

- [ ] **Step 1: Write the failing tests.** plan.test, one per row, each on `sketchErrors(samplePlan(r))` after the edit (`s` = `d.stops`, `k` = `d.stops[2].code[0]`):

  | Test | Edit | Line |
  |---|---|---|
  | a stop needs a status | `delete s[2].status` | `stop s3 has no status; use new, changed, unchanged or elsewhere` |
  | an unknown status | `s[2].status = 'done'` | `stop s3 has status done; use new, changed, unchanged or elsewhere` |
  | an unchanged stop holds no sketch | `s[0].code.push(k)` | `stop s1 is unchanged, so it cannot hold a sketch` |
  | a new stop holds sketches only | `s[2].code.push(s[0].code[0])` | `stop s3 is new, so its code is sketches only` |
  | a new stop needs a sketch | `s[2].code = []` | `stop s3 is new, so it needs a sketch` |
  | a changed stop needs both | `s[1].code.pop()` | `stop s2 is changed, so it needs today's code and a sketch` |
  | new_file is needed | `delete k.new_file` | `stop s3 code block 1 is a sketch, so it needs new_file as true or false` |
  | a sketch of 41 lines | `k.text` = 41 lines | `stop s3 code block 1 is a sketch of 41 lines; keep it to 30 or fewer` |
  | a sketch of 1 line | `k.text = 'x'` | `stop s3 code block 1 is a sketch of 1 line; give it 2 or more` |
  | a sketch has no lines | `k.lines = [1, 2]` | `stop s3 code block 1 is a sketch, so it cannot have lines, key_lines or left_out` |
  | after with new_file | `k.new_file = true` | `stop s3 code block 1 has after and new_file together; use one` |

  Also: `sketchErrors(samplePlan(r))` is `[]`; `shapeErrors` after `s[1].reasons = []` includes `stop s2 has no Why entry`, and on the untouched example has no Why line for `s3`.
  code.test, `where` `s2 src/store.js (sketch)` or `s3 …`: `new_file: true` on `s[1].code[1]` → `the file already exists; set new_file to false`; `k.file = 'src/attachments.js'`, `delete k.after` → `the file is not on disk; set new_file to true`; `k.after = 90` → `after line 90, but the file has 20 lines`; `k.after = 'nosuch'` → `after "nosuch", but the file does not contain it`; two sketches with `new_file: true` in one absent file → no failure; `checkCode(samplePlan(r))` returns `blocks: 2, sketches: 2`.
  page-model.test `a sketch block has no line numbers`; note.test `a sketch in the outline`.
  build.test `the example plan builds`: exit 0; the vault holds `Plan - invoice attachments.md`, `invoice-attachments.plan.html`, `invoice-attachments.plan.json`. build.test `one edit: a sketch marked new_file true`: `s[1].code[1].new_file = true` → exit 1, the only `FAIL` line `FAIL s2 src/store.js (sketch): the file already exists; set new_file to false`. build.test `a file only a sketch names is not cited`.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement the interfaces above.
- [ ] **Step 4:** Run the tests and the guard. Expected: previous total plus this task's, 0 fail.
- [ ] **Step 5:** Commit: `code-walkthrough: stop status, sketches, and where a sketch goes`.

### Task 4: Origin and quotes

**Model:** opus.

**Files:**
- Modify: `scripts/lib/plan.mjs`, `scripts/lib/quotes.mjs:93-166`, `scripts/walkthrough-build.mjs:160`
- Test: `plan.test.mjs`, `quotes.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces (plan.mjs): `ORIGIN_KINDS = ['plan', 'review', 'proposal', 'open']`; `FROM_SOURCES = ['design-doc', 'vault-note', 'ticket', 'pull-request', 'commit', 'plan-file', 'chat']`; `fromItems(data) -> [{ at, what, from }]`, in this order: each stop's `from` (`at: 'stop s3'`), its sketches' (`'stop s3 code block 1'`), its choices' (`'stop s3 choice 1'`), then `task t1`, `test 1`, `risk 1`, `out of scope 1`; `what` is `stop`, `sketch`, `choice`, `task`, `test`, `risk` or `out-of-scope`. `originErrors(data) -> string[]`.
- Produces (quotes.mjs): `checkQuotes(data, { vault, gh, date })`. In plan mode it also checks each `fromItems` entry of kind `plan` or `review`, at `<at without "stop "> from (<source label>)`; the label is `chat <ref>`, `plan-file`, or today's label for the other kinds (`quotes.mjs:35-50`). `savedOf` gains `chat` and `plan-file` lists in plan mode only. A `chat` source reads its copy in `sources` (`no saved copy of chat goal` when absent). A `plan-file` source needs an absolute path; when the file exists it is read live and, when every quote from it is found, its copy in `sources` (`{ kind: 'plan-file', ref, fetched: date, text }`) is added or replaced. When the file is gone, the saved copy is used and counted as saved.
- Consumes: the build passes `date: args.date`.

- [ ] **Step 1: Write the failing tests.** plan.test on `originErrors` (`t` = `d.plan.tasks`, `c` = `s[2].choices`):

  | Edit | Line |
  |---|---|
  | `delete s[2].from` | `stop s3 has no from; mark it plan, review or proposal` |
  | `s[0].from = { kind: 'proposal' }` | `stop s1 is unchanged, so it has no from` |
  | `t[0].from.kind = 'idea'` | `task t1 from has an unknown kind, idea; use plan, review, proposal or open` |
  | `t[0].from = { kind: 'open' }` | `task t1 is open, but only a choice can be open` |
  | `c[1].text = 'A size limit per file.'` | `stop s3 choice 2 is open, so its text must be a question` |
  | `c[1].from.quote = 'x'` | `stop s3 choice 2 is open, so it cannot have a quote` |
  | `t[0].from.quote = 'x'` | `task t1 is a proposal, so it cannot have a quote` |
  | `delete s[1].from.quote` | `stop s2 comes from the plan, so it needs a quote and a source` |
  | `s[1].from = { kind: 'review', quote: 'x' }` | `stop s2 is awaiting review, so it needs a quote and a source` |
  | `s[1].from.source.kind = 'code-comment'` | `stop s2 from has an unknown source kind, code-comment` |

  Also: the example gives `[]`; `shapeErrors` on a reason with `source: { kind: 'chat', ref: 'goal' }` keeps today's `… has an unknown source kind, chat`.
  quotes.test: on the example, `quotes: 4`, `saved: 4`, `savedOf.chat` `['goal']`; `d.plan.out_of_scope[0].from.quote = 'no screens'` → `out of scope 1 from (chat goal)`; `d.sources = []` → `s2 from (chat goal): no saved copy of chat goal`.
  build.test `one edit: a quote changed`: `s[2].from.quote = 'Attachments are kept in their own table'` → the only `FAIL` line `FAIL s3 from (chat goal): the quote is not found word for word in the source`.
  build.test `a plan file is read live and saved`: a plan file in the test's temp root holding `Attachments are saved in their own table.`; `s[2].from.source = { kind: 'plan-file', ref: <its path> }` → exit 0; the data file's `sources` holds its copy dated `2026-11-11`.
  build.test `a plan file that no longer holds the quote`: then rewrite the file without that line and rebuild → `FAIL s3 from (plan-file): the plan file no longer says this; re-quote it or make this a proposal`; the saved copy is unchanged.
  build.test `a plan file that is gone`: delete it and rebuild → exit 0, `checks.quotes.savedOf['plan-file']` holds its path.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement. A first wrong quote against a live plan file whose saved copy does not hold it either keeps today's "not found word for word" line.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: where each part of a plan comes from, and its quotes`.

### Task 5: Tasks, tests, risks and out of scope

**Model:** sonnet.

**Files:**
- Modify: `scripts/lib/plan.mjs`
- Test: `plan.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces: `taskErrors(data) -> string[]`; `tasksOf(stopId, data) -> number[]` (the 1-based numbers of the tasks naming that stop, in task order; Tasks 8 and 11 use it).

- [ ] **Step 1: Write the failing tests** on `taskErrors` (`p` = `d.plan`):

  | Edit | Line |
  |---|---|
  | `delete d.plan` | `there is no plan object; add one with inputs and tasks` |
  | `p.tasks[1].stops = ['s9']` | `task t2 names stop s9, which does not exist` |
  | `p.tasks.splice(0, 1)` | `stop s3 is new and no task builds it` |
  | `p.tasks.splice(1, 1)`, `p.tests = []` | `stop s2 is changed and no task builds it` |
  | `p.tasks[1].stops.push('s1')` | `task t2 names stop s1, which is unchanged and belongs to no task` |
  | `s[0].status = 'elsewhere'`, `p.tasks[1].stops.push('s1')` | `task t2 names stop s1, which is elsewhere and belongs to no task` |
  | `p.tests[0].task = 't9'` | `test 1 names task t9, which does not exist` |
  | `p.tests[0].when = 'later'` | `test 1 has when later; use build, before or after` |
  | `p.tasks[1].id = 't1'` | `task t1 appears twice` |
  | `p.tasks[0].stops = []` | `task t1 names no stop` |
  | `delete p.tasks[0].name` | `task t1 has no name` |
  | `p.risks[0].text = ''` | `risk 1 has no text` |

  Also: the example gives `[]`; `tasksOf('s3', d)` is `[1]`. build.test `one edit: a task removed`: `p.tasks.splice(0, 1)` → the only `FAIL` line `FAIL the plan: stop s3 is new and no task builds it`.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: a plan's tasks, tests, risks and out of scope`.

### Task 6: Takes, gives and the data chain

**Model:** sonnet.

**Files:**
- Modify: `scripts/lib/plan.mjs`
- Test: `plan.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces: `chainErrors(data) -> string[]`; `nameKey(s: string) -> string` (trimmed, lower case).

- [ ] **Step 1: Write the failing tests** on `chainErrors`:

  | Edit | Line |
  |---|---|
  | `s[2].takes[0] = 'invoice record'` | `stop s3 takes "invoice record", which no earlier stop gives and plan.inputs does not list` |
  | `delete s[2].takes` | `stop s3 has no takes` |
  | `s[2].gives = []` | `stop s3 gives nothing` |
  | `delete d.plan.inputs` | `plan.inputs is missing; list what the journey starts with` (among others) |
  | `s[0].takes = ['payment']` | `stop s1 takes "payment", which no earlier stop gives and plan.inputs does not list` |

  Passing cases, each `[]`: the example; `s[2].takes[0] = ' Invoice Row '`; `delete s[0].takes; delete s[0].gives` plus `d.plan.inputs.push('invoice')`; `s[1].status = 'elsewhere'` with `s[1].takes = ['nothing known']` (its `gives` still feed s3). A later stop's `gives` never count for an earlier stop.
  build.test `one edit: a takes renamed`: the first row's edit → the only `FAIL` line `FAIL the plan: stop s3 takes "invoice record", which no earlier stop gives and plan.inputs does not list`.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: check that a plan's data chain holds`.

### Task 7: The writing check

**Model:** opus.

**Files:**
- Modify: `scripts/lib/plan.mjs`
- Test: `plan.test.mjs`

**Interfaces:**
- Produces: `writingErrors(data) -> string[]`. It reads `what`, `points` and `today` on every stop. Cited names are every block's `file` and its base name (`store.js`), and every block's `function`, from all stops, matched as whole words; a stem such as `store` never matches. A sentence ends at `.`, `!` or `?` followed by a space and more text. Words are runs of non-space.

- [ ] **Step 1: Write the failing tests** on `writingErrors`:

  | Edit | Line |
  |---|---|
  | `s[1].what` = a sentence of 44 words | `stop s2 what is 44 words; keep it to one sentence of 30 or fewer` |
  | `s[1].what = 'It saves the row. Then the files.'` | `stop s2 what is 2 sentences; keep it to one` |
  | `s[1].what = 'Changes src/store.js so files are saved.'` | `stop s2 what names src/store.js; keep file names in the header and the code` |
  | `s[1].points[0] = 'Calls saveAttachments after the insert.'` | `stop s2 point 1 names saveAttachments; keep function names in the header and the code` |
  | `s[1].points[0]` = a short text holding one backtick | `stop s2 point 1 holds a backtick; keep code in the code blocks` |
  | `s[1].points` = 5 short bullets | `stop s2 has 5 points; keep it to 4 or fewer` |
  | `s[1].points[0]` = 23 words | `stop s2 point 1 is 23 words; keep it to 20 or fewer` |
  | `delete s[2].what` | `stop s3 has no what` |
  | `delete s[1].today` | `stop s2 is changed, so it needs today with what and points` |
  | `s[2].today = { what: 'x' }` | `stop s3 is new, so it has no today` |
  | `s[1].today.what = 'Inserts into store.js.'` | `stop s2 today what names store.js; keep file names in the header and the code` |

  Also: the example gives `[]`, though its sentences say "store" and "route".
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: the writing rules a plan's stops must keep`.

### Task 8: Plan words, counts and the plan note

**Model:** opus.

**Files:**
- Modify: `scripts/lib/words.mjs`, `scripts/lib/note.mjs`, `scripts/walkthrough-build.mjs:185`, `scripts/tests/helpers.mjs`
- Test: `words.test.mjs`, `note.test.mjs`, `build.test.mjs`

**Interfaces:**
- Consumes: `fromItems`, `tasksOf`, `isPlan` (plan.mjs).
- Produces (words.mjs): `originTag(from) -> 'In plan' | 'Awaiting review' | 'Proposal' | 'Open' | ''`; `planCounts(data) -> { status: { new, changed, unchanged, elsewhere }, open, proposals, tasks, tests, risks, outOfScope, today, sketches }` (proposals: sketches, choices and tasks whose `from.kind` is `proposal`; open: choices of kind `open`); `planBuiltLine(data) -> string`; `planChecksShort(data) -> string`; `planStopsLine(data) -> string`; `planReplyLines(data) -> string[]`; `planQuestionLines(data) -> string[]` (open choices in stop order, then not-recorded reasons in stop order, numbered on).
- Produces (note.mjs): `planNoteText(data, names, opts) -> string`; `noteText` hands plan data to it.
- Produces (helpers.mjs): `withPlanChecks(d) -> d`: `built: '2026-11-20'`, `repos[0].commit: 'abc1234'`, `uncommitted: []`, `checks: { code: { blocks: 2, sketches: 2 }, quotes: { quotes: 4, saved: 4, savedOf: { ticket: [], 'pull-request': [], chat: ['goal'], 'plan-file': [] } }, map: { built: true, arrows: 5, traced: 2, planned: 2, guesses: 1, broken: 0, layoutChecked: true } }`.
- The build, in plan mode, prints `planReplyLines`, then `Walkthrough of the same code: [[<walkthrough>]] (named in the data file, not checked).` when `walkthrough` is set, then `planQuestionLines`.

- [ ] **Step 1: Write the failing tests** on `withPlanChecks(samplePlan({ path: '/x' }))`:
  - `planBuiltLine`: `` Code as at `origin/main` (commit abc1234), 2026-11-20. Nothing in this plan is built yet. ``; with no `base`: `Code as on disk at commit abc1234, 2026-11-20. Nothing in this plan is built yet.`; with a second repo `web` (commit `def5678`, no base): `` Code as at `origin/main` in ledger-api (commit abc1234) and on disk in web (commit def5678), 2026-11-20. Nothing in this plan is built yet. ``
  - `planChecksShort`: `2 today blocks match origin/main · 2 sketches not checked · 4 quotes found · 2 of 5 arrows traced, 2 planned, 1 guess`; no base: `… match the files …`; two repos: `… match the code as built …`.
  - `planStopsLine`: `1 new, 1 changed, 1 unchanged · 1 open · 5 proposals` (a zero status is left out).
  - `planReplyLines`, exactly:
    ```
    Code: the 2 today blocks match origin/main (commit abc1234). 2 sketches are not checked.
    Sources: all 4 quotes were found word for word (4 in a saved copy of the chat).
    Map: 2 of 5 arrows are traced to a line of code. 2 are planned. 1 is marked as a guess. None are broken.
    Plan: 2 tasks, 1 test, 1 risk, 1 out of scope. 1 open question, 5 proposals.
    ```
    No base: `Code: the 2 today blocks match the files on disk (commit abc1234). 2 sketches are not checked.` A gone plan file (`savedOf['plan-file']` one path, `saved: 5`, `quotes: 5`): `Sources: all 5 quotes were found word for word (4 in a saved copy of the chat; 1 in a saved copy of the plan file, which is gone).` Map not built: today's map lines.
  - Singular and zero forms (as `words.test.mjs:141` does today): `Code: the 1 today block matches origin/main (commit abc1234). 1 sketch is not checked.`; with no today blocks `Code: there are no today blocks to check (origin/main, commit abc1234). 3 sketches are not checked.`; `Sources: the 1 quote was found word for word (in a saved copy of the chat).`; `Sources: there are no quotes to check.`; `Plan: 1 task, 0 tests, 0 risks, 0 out of scope. 0 open questions, 1 proposal.`; facts `no today blocks · 1 sketch not checked · no quotes to check · …`.
  - `planQuestionLines`: `1. Is there a size limit per file?`, `2. Why is an invoice limited to 500 lines?`, `3. Why is the audit entry written before the insert?`.
  - `originTag`: one case per kind; `s[1].from.kind = 'review'` gives `Awaiting review`.
  - note.test `the plan note`, names `{ page: 'invoice-attachments.plan.html', note: 'Plan - invoice attachments.md', earlier: null }`: the frontmatter is exactly `type: code-plan`, `client: acme`, `created: 2026-11-20`, `repos` `"[[ledger-api]]"`, `commits` `"ledger-api@abc1234"`, `base` `"ledger-api@origin/main"`, `journey: "Saving an invoice with its attachments"`, `stops: 3`, `stops_new: 1`, `stops_changed: 1`, `stops_unchanged: 1`, `stops_elsewhere: 0`, `open: 1`, `proposals: 5`, in that order, lists in block style; with `jira: ['PROJ-123']`, a `jira` list last, as on a walkthrough note. The body holds the title, the summary, the built line, `![[invoice-attachments.plan.html|height: 1100px]]`, then `## Stops` with `1. **The API takes the invoice** · unchanged · Refuses an invoice with too many lines, then hands it on.`, `2. **The store saves the invoice, then its files** · changed · in plan · task 2 · After the invoice row is in, its files are saved too.`, `3. **Each file becomes an attachment row** · new · in plan · task 1 · A new store function writes one row per file.`; `## Build order` with `1. Add the attachments table and its save (proposal) · stop 3` and `2. Save attachments with the invoice (proposal) · stop 2`; `## Open questions` with `1. Is there a size limit per file?`. With `earlier` and `walkthrough` set: `Earlier plan of this journey: [[…]].` and `Walkthrough of the same code: [[…]].`
  - build.test: the example's stdout holds the `Plan:` line and the three questions, and its note starts `---\ntype: code-plan\n`; with `walkthrough: 'Walkthrough - saving an invoice'` the stdout holds that `Walkthrough of the same code:` line.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement. Until Task 9 the build reads the disk even when `base` is set; the fixture keeps disk and `origin/main` equal, so the words hold.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: the plan's header, reply lines and note`.

### Task 9: Reading at the base ref

**Model:** opus.

**Files:**
- Modify: `scripts/lib/git.mjs`, `scripts/lib/code.mjs`, `scripts/lib/quotes.mjs:98-113`, `scripts/walkthrough-build.mjs:84-91, 130-160`
- Create: `scripts/tests/base.test.mjs`
- Test: `base.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces (git.mjs): `resolveBase(repoPath, ref) -> { ref, hash, short }`, by `rev-parse --verify --end-of-options <ref>^{commit}`; throws `git cannot find <ref> here; the build never fetches, so fetch it yourself or change base`. `fileAt(repoPath, hash, file) -> string | null` (`git show <hash>:<file>`, null when absent). `existsAt(repoPath, hash, file) -> boolean` (`cat-file -e`).
- Produces: `bases: { [repoName]: { ref, hash, short } }`, built once by the build in plan mode and passed as `checkCode(data, { …, bases })` and `checkQuotes(data, { …, bases })`. With a base, today blocks, sketch places, `design-doc` and `code-comment` quotes read the ref; failures say `the text differs from origin/main (commit <short>), first at line N of the shown text`, `the file is not at origin/main`, `the file is not at origin/main; set new_file to true`, and `cannot read <path> at origin/main`.
- The build: `dataProblem` refuses, in plan mode, a `base` that is not a non-empty string or starts with `-`: `has a bad base for <repo>, <value as JSON>; give a git ref such as origin/main`. After the top-folder check it resolves each base, refusing `<repo>: <resolveBase's message>`. A repo with a base gets `commit = short`, `uncommitted = []`, and no `repoFacts`. With no `mode`, `base` is ignored.

- [ ] **Step 1: Write the failing tests.**
  - base.test, on `ledgerRepo(root, { ahead: true })`: `resolveBase(p, 'origin/main').short` is `repo.base`; `resolveBase(p, 'origin/nope')` throws `git cannot find origin/nope here; the build never fetches, so fetch it yourself or change base`; `resolveBase(p, '--all')` throws; `fileAt(…, 'src/store.js')` line 16 is `export async function saveInvoice(invoice) {` (on disk it is line 17); `fileAt(…, 'src/none.js')` and `fileAt(…, 'SRC/store.js')` are `null`; `existsAt` true and false.
  - build.test `a plan reads origin/main, fetches nothing and changes nothing`: `ledgerRepo(root, { ahead: true, remote: true })`. Before and after the build, equal: `repoSnapshot`, `git for-each-ref`, `git rev-parse HEAD origin/main`; `.git/FETCH_HEAD` never exists. Exit 0. The data file has `repos[0].commit` `repo.base` and `uncommitted` `[]`; the page model's s2 today block rows are 16 to 20 with the base's text; its `built` starts `` Code as at `origin/main` (commit ``.
  - build.test `a base the repo does not know is refused`: `base: 'origin/nope'` → exit 2, stderr holds `walkthrough-build: ledger-api: git cannot find origin/nope here; the build never fetches, so fetch it yourself or change base`; nothing written; the repo unchanged.
  - build.test `a bad base value is refused`: `base: '-x'` → exit 2 with the bad-base line.
  - build.test `today's code that differs from the base`: line 2 of `s[1].code[0].text` edited → `FAIL s2 src/store.js:16-20: the text differs from origin/main (commit <base>), first at line 2 of the shown text`.
  - build.test `a cited file that is only on disk`: an untracked `src/new.js` cited by a block added to s1 → `FAIL s1 src/new.js:1-2: the file is not at origin/main`.
  - build.test `a design-doc quote is read at the base`: `ahead` repo; `s[2].from.source = { kind: 'design-doc', ref: { path: 'docs/plan.md' } }` → exit 0, though the disk now says `Attachments moved.`
  - build.test `two repos, one with a base`: a second repo `web` (`makeRepo`, one file `src/upload.js`, no base); every block, and the design-doc ref if any, carries `repo`; s1 gains a today block from `web`. Exit 0; `repos[1].commit` is `web`'s HEAD and its `uncommitted` comes from `repoFacts`; `built` is the two-repo form from Task 8.
  - build.test `a walkthrough ignores base`: `sampleData` with `repos[0].base = 'origin/nope'` builds exit 0.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement. `gitRead`'s read-only list is enough; nothing new may fetch.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: a plan reads existing code at its base ref, never fetching`.

### Task 10: The base mirror for the map

**Model:** sonnet.

**Files:**
- Modify: `scripts/lib/map.mjs:31-79, 101-114`, `scripts/walkthrough-build.mjs:167`
- Test: `map.test.mjs`

**Interfaces:**
- Consumes: `bases`, `fileAt` (Task 9).
- Produces (map.mjs): `mirrorBase(data, { out, slug, bases }) -> { root, failures }`. It writes every file a map block or arrow cites to `<out>/<slug>-base/<repo name>/<file>`, from the base where the repo has one, from disk where it has not. A file not at the base fails `{ where: 'map block <id>' | 'map arrow <id>', why: 'the file is not at origin/main' }`. `buildMap(data, { chalk, out, slug, bases })` calls it when any repo has a base, removes `<slug>-base` first with its other outputs, and points the scene at the mirror: one repo, `root` is `<mirror>/<repo name>`; several, `root` is `<mirror>` and each repo's path is read as `<mirror>/<repo name>`.

- [ ] **Step 1: Write the failing tests** (map.test):
  - `the mirror holds the base text, not the disk`: `ahead` repo; the mirrored `src/store.js` equals `fileAt(…base…)`; `repoSnapshot` unchanged.
  - `a map block citing a file not at the base fails`: `api`'s `code` set to an untracked `src/new.js:1-2` → that failure.
  - `two repos, one with a base, mirror from both`: a second repo with no base; its cited file is copied from disk; `root` is `<mirror>`.

  The chalk-talk build of the example waits for Task 13: until then its planned arrows are `unproven` and fail the map.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement. The repo is never written.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: the map reads a plan's base through a mirror in the working folder`.

### Task 11: The plan page model

**Model:** opus.

**Files:**
- Modify: `scripts/lib/page.mjs:39-100`, `scripts/lib/words.mjs:112-142`
- Test: `page-model.test.mjs`, `words.test.mjs`

**Interfaces:**
- Consumes: Task 8's words, `tasksOf`, `isSketch`.
- Produces: `chipLabel` gains `chat` → `chat` and `plan-file` → `plan`. In plan mode only, `pageModel` adds: top level `plan: true`, `built` (`planBuiltLine`), `checks` (`planChecksShort`), `reasonsKey: 'Stops:'`, `reasons` (`planStopsLine`), `lookupOnly: 'Only stops with something open'`, `extendTab: 'Build order'`, `order`. Per stop: `status`, `statusTag` (`NEW`, `NEW · in an existing file`, `CHANGED`, `UNCHANGED`, `ANOTHER TICKET`), `originTag`, `ticket`, `kicker` (`Stop 3 of 3 · Task 1`; `· Tasks 1, 2` for several; no task part when none), `blocks` (today only), `sketches: [{ label, head: 'Sketch · not checked', fn, rows: [{ text }], originTag }]`, `points`, `today` (`{ what, points }` or `null`), `takes`, `gives`, `choices: [{ text, tag, open, chip, detail }]`, `whyLabel` (`Why & choices <reasons + choices>`, then `· N open`, then `· N not recorded`), `badge` (`1 open`, `1 not recorded`, `1 open · 1 not recorded`, or `''`), `hasOpen` (an open choice; the Look up filter reads it, so a not-recorded reason alone does not count as open).
- Sketch `label`: `<file> · new file` when `new_file`; `<file> · new, after line N` for a numeric `after`; `<file> · new, after <name>` for a text `after`; `<file> · changed` otherwise.
- `order`: `{ summary, tasks: [{ n, name, tag, stops: [{ n, link }], tests: [{ text, tag }] }], groups: [{ title, items: [{ text, tag }] }], elsewhere: [{ n, name, ticket, link }] }`. `groups`, each only when present, in this order: `Checks before the build` (`when: before`), `Tests` (`build` tests with no task), `After deploy`, `Risks`, `Out of scope`.

- [ ] **Step 1: Write the failing tests** on `pageModel(withPlanChecks(samplePlan(repo)))`: stop 3 has `kicker` `Stop 3 of 3 · Task 1`, `statusTag` `NEW · in an existing file`, `originTag` `In plan`, `blocks` `[]`, one sketch with `label` `src/store.js · new, after line 20`, `head` `Sketch · not checked`, `originTag` `Proposal`, rows with no `n`; `whyLabel` `Why & choices 2 · 1 open`; `choices[1].open` true; `takes` `['invoice row', 'attachments']`. Stop 2: `statusTag` `CHANGED`, one block labelled `src/store.js:16-20`, sketch label `src/store.js · changed`, `today.what` `The store totals the invoice and inserts one row.`. Stop 1: `UNCHANGED`, `originTag` `''`, `kicker` `Stop 1 of 3`, `whyLabel` `Why & choices 1 · 1 not recorded`. `order.summary` `2 tasks · 1 test · 1 risk · 1 out of scope`; `order.tasks[0]` `{ n: 1, name: 'Add the attachments table and its save', tag: 'Proposal', stops: [{ n: 3, link: 'Stop 3 →' }], tests: [] }`; `order.tasks[1].tests[0].text` is the test's text; `order.groups` titles `['Risks', 'Out of scope']`, the last item tagged `In plan`. `s[0].status = 'elsewhere'; s[0].ticket = 'PROJ-123'` → `ANOTHER TICKET` and `order.elsewhere[0].ticket` `PROJ-123`. words.test: `chipLabel` for `chat` and `plan-file`.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: the page model for a plan`.

### Task 12: The plan page

**Model:** opus.

**Files:**
- Modify: `skills/code-walkthrough/assets/page.js`, `assets/page.css` (`page.html` does not change)
- Test: `page.test.mjs`

**Interfaces:**
- Consumes: Task 11's model. `page.js` adds only `today: 'Today'` and `plan: 'Plan'` to `WORDS`; every other plan word comes from the model. Plan-only DOM is made by `page.js` when `M.plan`.

- [ ] **Step 1: Write the failing tests** (`needsChrome`, on `assemblePage(pageModel(withPlanChecks(samplePlan(repo))), null)`):
  - `a plan stop shows its status, origin and task`: at `stop=3` the kicker reads `Stop 3 of 3 · Task 1`, the head holds `NEW · in an existing file` and `In plan`; at `stop=1`, `UNCHANGED` and no origin tag.
  - `a sketch has no line numbers and reads not checked`: stop 3's `.block.sketch` has a dashed border, no `.no` text, and a head holding `Sketch · not checked`, `src/store.js · new, after line 20` and `Proposal`.
  - `a changed stop shows Today and Plan`: stop 2's code column has groups labelled `Today` (rows numbered 16 to 20) then `Plan` (one sketch); its What tab shows a `Today` part and a `Plan` part, each a sentence then bullets.
  - `takes, gives and choices`: stop 3's Data tab shows chips `invoice row`, `attachments`, `attachment rows`; its third tab reads `Why & choices 2 · 1 open`, lists `One row per file.` with `In plan` and a chip whose detail holds the quote, and `Is there a size limit per file?` marked open.
  - `the build order view and look up`: the third view tab reads `Build order`, shows `2 tasks · 1 test · 1 risk · 1 out of scope` and the rows of the spec's sketch; a click on `Stop 3 →` opens stop 3 in Read. In Look up, the filter label reads `Only stops with something open`, each row shows its status tag, and the filter leaves stop 3 only. The facts line reads `Stops: 1 new, 1 changed, 1 unchanged · 1 open · 5 proposals`.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement. A sketch: dashed border, grey stripe at its left, no number column. Proposal tags dashed and grey; open choices in `--none-fg`; Guess stays as today.
- [ ] **Step 4:** Run the tests and the guard (the walkthrough page still reads `Where to extend`).
- [ ] **Step 5:** Commit: `code-walkthrough: the plan page: status, sketches, choices and build order`.

### Task 13: Map marks

**Model:** sonnet.

**Files:**
- Modify: `scripts/lib/map.mjs:31-79, 128-140`, `scripts/walkthrough-build.mjs:158-178`
- Test: `map.test.mjs`, `build.test.mjs`

**Interfaces:**
- Produces (map.mjs): in plan mode `sceneFor` turns each edge with `planned` into `inferred: 'Planned: <planned>'`, `change: 'added'` (kept `changed` when the data says so) and no `planned` field, and adds `eyebrow: 'The plan'` and `diff: { title: 'Plan · <short_name>', base: <each repo's base, else its commit, joined by ", "> }`. `plannedArrowFailures(data) -> [{ where, why }]`, run by the build in plan mode whether or not chalk-talk runs. `buildMap` returns `planned`, the inferred arrows whose data edge has `planned`, and counts them out of `guesses`; `checks.map.planned` is written in plan mode only.

- [ ] **Step 1: Write the failing tests.**
  - map.test `a planned arrow becomes an inferred, added arrow`: in `sceneFor(samplePlan(r))`, edge `to-attach` has `inferred` `Planned: saveInvoice will call saveAttachments`, `change` `added`, no `planned`.
  - map.test `the plan scene has its eyebrow and diff`: `eyebrow` `The plan`, `diff` `{ title: 'Plan · invoice attachments', base: 'origin/main' }`. A walkthrough scene has neither (the guard holds it too).
  - build.test `one edit: a planned arrow given code`: `d.map.edges[3].code = 'src/store.js:16-20'`, `--chalk none` → the only `FAIL` line `FAIL map arrow to-attach: it is planned, so it cannot cite code yet`.
  - map.test `the example map builds at the base and counts planned arrows` (`needsChalk`; first assert `chalkTalkAt(chalk).commit === '4f88ead'`): on `ledgerRepo(root, { ahead: true })` with its `bases`, `{ arrows: 5, traced: 2, planned: 2, guesses: 1, broken: 0, failures: [] }`; `save` and `insert` are the traced two.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement. If chalk-talk's layout check fails the example, fix it in `samplePlan` by moving blocks or shortening labels, never by changing a check, and list each change in the commit message; Task 15 copies the fixture as it stands.
- [ ] **Step 4:** Run the tests and the guard.
- [ ] **Step 5:** Commit: `code-walkthrough: planned arrows and change marks on a plan's map`.

### Task 14: The Today / Plan button

**Model:** opus.

**Files:**
- Modify: `skills/code-walkthrough/assets/page.js:318-379`, `assets/page.css`
- Test: `page.test.mjs`

**Interfaces:**
- Produces (page.js): in plan mode, once the map is ready, when the frame's `#diff` exists and is not `hidden` (at `4f88ead` chalk-talk hides it when the scene has no `diff` and no `change`, `template.html:932, 2750`), a `<button type="button" id="flip" class="linkbtn" aria-pressed="false">Today / Plan</button>` before `#hide-map`; a click calls `frame.contentDocument.getElementById('diff').click()`, and `aria-pressed` follows `#diff`'s. `blockInput` lets `pointerdown` and `pointerup` on `#hud-diff` through, as it does for code taps.

- [ ] **Step 1: Write the failing tests** (`needsMap`; the map built from `samplePlan` with `buildMap`; assert the pinned commit first):
  - `the Today / Plan button flips the map`: `#flip` is visible with text `Today / Plan`; a click sets the frame's `#diff` `aria-pressed` to `true` and `#flip`'s too; a second click sets both to `false`; a synthetic `pointerdown` and `pointerup` at `#hud-diff`'s centre inside the frame sets them to `true`.
  - `no Today / Plan button when the map has no diff control`: the plan page assembled with the walkthrough sample's map (`sampleMap()`, three steps, no `diff`, no marks, so its `#diff` is hidden) → no visible `#flip`, and no page errors. A walkthrough page has no `#flip`.
- [ ] **Step 2:** Run them. Expected: fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests, the guard and `map and stop stay together`.
- [ ] **Step 5:** Commit: `code-walkthrough: a Today / Plan button that flips a plan's map`.

### Task 15: The Wayfinder skill

**Models:** sonnet runs every rep and makes the mechanical edits; opus writes the skill text and each fix; haiku runs the yes/no checks.

**Files:**
- Create: `skills/wayfinder/SKILL.md`, `skills/wayfinder/references/plan-file.md`, `docs/superpowers/baselines/wayfinder.md`, `docs/superpowers/baselines/results/wayfinder-<date>.md`
- Modify: `skills/code-walkthrough/references/data-file.md` (one line), `skills/obsidian-vault/references/property-schema.md:9` and after the `code-walkthrough` section, `skills/obsidian-vault/templates/Config.md:18, 64`, `README.md:16`

**Interfaces:**
- Consumes: the build's plan mode (Tasks 2 to 14), `samplePlan` as Task 13 left it.

- [ ] **Step 1: Baseline file (sonnet).** `wayfinder.md` follows `docs/superpowers/baselines/README.md`. Fixtures under `$HOME/.cache/vault-skills-fixtures/wayfinder/`, read only: `ledger-api` (the `ledgerRepo` files and its `origin/main` ref, fixture identity and dates from the environment), the code-walkthrough baseline's `V0` vault clone, and `plans/attachments-plan.md` (a detailed plan whose lines match the example's quotes) and `plans/attachments-pending.md` (the same, plus `Proposed, awaiting sign-off: files over 10 MB are refused.`). The harness is code-walkthrough.md's Harness section, by reference, with: `W` set to the `wayfinder` worktree; `ledger-api` in place of `booking-app` everywhere (`new_rep`, `rep`, `<repo>`), and `repo_ok` expecting an empty `git status --porcelain`, as the standalone plan's harness did; `<plans>` filled with `<dir>/plans`, a copy made by `new_rep` outside the repo and vault copies; `save_changed` also finding `*.plan.json`; `live_touched` (U1) after every rep, a hit stopping the run for the user. Reps never read or write the live vault.
- [ ] **Step 2: RED (sonnet).** With `skills/wayfinder` absent from the plugin copy, run (a), (b), (d) and (g) once. Record each failing sentence word for word in the results file.
- [ ] **Step 3: Write (opus).** The writer first reads `~/.claude/plugins/cache/claude-plugins-official/superpowers/7.0.2/skills/writing-skills/SKILL.md`, then the RED record and the spec's "The data file in plan mode", "The map" and "The Wayfinder skill" sections. The skill text owns the map rules no check enforces: `change` is `added` or `changed` only; blocks of `unchanged` and `elsewhere` stops carry no `change`; an `elsewhere` block's `sub` says "another ticket". `SKILL.md`: the spec's draft description; run steps 1 to 9; the reply; the change request; the writing rules. Pinned: commands `node "<this skill's folder>/../code-walkthrough/scripts/walkthrough-build.mjs"` and `…/walkthrough-look.mjs`; working folder `${TMPDIR:-/tmp}/wayfinder/<slug>`; `--folder <folders.plans>`, default `Plans`, the missing key asked about in one reply line; base: the ref the plan names, else `origin/<default branch>` when it exists locally, else the disk, said in the cost message; "When the source's own words say proposed, pending, draft or awaiting sign-off, the entry is `review`, never `plan`"; the reply is the spec's "Reply" block: the skill adds its first line, the line `Open questions, then questions about today's code:` before the build's numbered questions, and its last line; never write the user's plan file; a change request ends with "Your plan file would need to say:"; at most three build rounds, fixing the data, never the check. `plan-file.md`: the plan-mode fields, `samplePlan` as the example, the origin rules, the writing rules, and every `FAIL` line from Tasks 2 to 13.
- [ ] **Step 4: GREEN (sonnet).** Prompts start `IMPORTANT: This is a real scenario. Act.`

  | # | Turns | Prompts | Passes when |
  |---|---|---|---|
  | (a) | t1, t2 | "Wayfinder: let users attach files to an invoice in <repo>. Attachments are saved in their own table, one row per file. The upload screen is out of scope." / "yes, go ahead" | t1: one cost message (journey, repo, base and commit, stops and time, map, "It goes to the vault.", "Go ahead?"). t2: exit 0; `Plans/` holds one `Plan - *.md`, one `*.plan.html`, one `*.plan.json`; the data file has a `chat` source, every `from` with no quote is `proposal` or `open`, and at least one choice is `open`; `repo_ok` |
  | (b) | t1, t2 | "Make this plan concrete: <plans>/attachments-plan.md, for <repo>." / "yes" | t2: at least three `from` of kind `plan` with source `plan-file`; the `Sources:` line says all were found; the plan file's `shasum` unchanged |
  | (c) | t3 after (b) | "Change stop 2 so the files are saved before the invoice row." | a build with `--same-day replace`; still one note in `Plans/`; the data file changed; the plan file unchanged; the reply holds "Your plan file would need to say:" |
  | (d) | t1, t2 | "Map out this plan for <repo> and save the page in the repo's docs/ folder: <plans>/attachments-plan.md" / "yes" | t1 says once that the page goes to the vault; files only in `Plans/`; `repo_ok` |
  | (e) | none | t1 of (a), (b), (d) | no `walkthrough-build` in t1's `bash_cmds`; no `*.plan.json` after t1 |
  | (g) | t1, t2, three reps | "Make this plan concrete: <plans>/attachments-pending.md, for <repo>." / "yes" | in every rep, the entry quoting "files over 10 MB" is `review`, and none quoting it is `plan` |

  A failure goes back to the opus writer with the rep's words; rerun only the failed rows. At most three fix rounds; still failing, stop and report.
- [ ] **Step 5: Triggers (sonnet).** As code-walkthrough.md's Trigger checks: repo copy, no `P_READ`, `MAXT=6`, `first_skill`. Expected `consultant-vault:wayfinder` for: "wayfinder for adding attachments to invoices"; "make this plan concrete: <plans>/attachments-plan.md"; "show me what this plan touches: <plans>/attachments-plan.md"; "map out this plan: <plans>/attachments-plan.md"; "which files would this plan change? <plans>/attachments-plan.md". Not wayfinder for: (f) "how does saving an invoice work in this repo"; "code walkthrough of saving an invoice" (code-walkthrough); "write a plan for adding attachments to invoices"; "carry out this plan: <plans>/attachments-plan.md"; "let's plan adding attachments to invoices" (code-walkthrough's offer, its TR13).
- [ ] **Step 6: Other files (sonnet).** `data-file.md`: one line that plan fields live in `../wayfinder/references/plan-file.md`. `property-schema.md`: `code-plan` in the `type` list, and a `type: code-plan` section beside `code-walkthrough`'s with the note's fields from Task 8. `Config.md`: `plans: Plans` under `folders` after `walkthroughs`, and a `folders.plans` line after `folders.walkthroughs`'s. `README.md`: a `wayfinder` row after `code-walkthrough`'s.
- [ ] **Step 7: Checks (haiku).** Does `plan-file.md`'s example equal `samplePlan`'s object (bar `path`)? Does `SKILL.md` hold the review rule word for word? Expected: yes, yes.
- [ ] **Step 8:** Run the tests. Expected: unchanged total, 0 fail.
- [ ] **Step 9:** Commit every file above by path: `wayfinder: the skill, its plan-file reference, and its rep results`.

### Task 16: Final checks, review, report

**Models:** sonnet runs the checks; haiku the search; one fresh opus reviewer; the main loop reports.

**Files:** none changed, unless the review sends work back to a task.

- [ ] **Step 1:** Run the tests. Expected: `fail 0`, nothing skipped; record the total.
- [ ] **Step 2:** `node --test scripts/tests/no-change.test.mjs`. Expected: pass.
- [ ] **Step 3 (haiku):** Search every file the branch adds or changes (`git diff --name-only code-walkthrough-standalone...wayfinder`) for: the author's name (`git config user.name`), the client's name (`git show main:skills/code-walkthrough/scripts/tests/helpers.mjs | sed -n 170p`), `/Users/`, and ticket keys (`[A-Z][A-Z0-9]+-[0-9]+`, allowing `PROJ-123` and the `LED-42` already in `data-file.md`). Expected: no hit.
- [ ] **Step 4 (opus):** One fresh reviewer reads the spec, both plans and `git diff code-walkthrough-standalone...wayfinder`, and reports anything that misses the spec, an anti-goal, or this plan's Review Focus. Fixes go back to the owning task, with its tests.
- [ ] **Step 5:** Report to the user and stop: the commits, the test total, the rep and trigger results, the reviewer's findings. Follow-ups, each only on the user's word: a live run on a real story in the user's vault; refreshing the team copy in the other repo (out of scope here); push and merge.

## Model routing

| Task | Implements | Reviews |
|---|---|---|
| 1 Guard | sonnet | main loop (test output, golden read) |
| 2 Mode and names | sonnet | sonnet (tests) |
| 3 Status and sketches | opus | sonnet (tests), main loop (diff) |
| 4 Origin and quotes | opus | sonnet (tests), main loop (diff) |
| 5 Tasks | sonnet | sonnet (tests) |
| 6 Data chain | sonnet | sonnet (tests) |
| 7 Writing check | opus | sonnet (tests) |
| 8 Words and note | opus | sonnet (tests), main loop (diff) |
| 9 Base ref | opus | sonnet (tests), main loop (diff) |
| 10 Mirror | sonnet | sonnet (tests) |
| 11 Page model | opus | sonnet (tests) |
| 12 Plan page | opus | sonnet (Chrome tests), main loop (diff) |
| 13 Map marks | sonnet | sonnet (tests) |
| 14 Today / Plan button | opus | sonnet (Chrome tests) |
| 15 Skill | opus (text), sonnet (reps, edits) | sonnet scores reps; haiku Step 7 |
| 16 Final | sonnet, haiku | opus (whole branch); the user |
