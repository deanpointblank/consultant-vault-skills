# Wayfinder — design

**Status: approved by the user as written, 2026-11-20, every Call: included. Nothing is built.** Every choice the user did not make is marked **Call:**.

The **Call:** marks stay in place: each one now reads as an approved call.

## What it is and why

`code-walkthrough` builds one page that follows one journey through real code, stop by stop. Wayfinder is the inverse. It takes a plan for code not yet written and shows it on the same kind of page: which files, functions and classes the plan touches or creates, along one clean path of how the data moves.

The user's words: the purpose is "to gain a near-intuitive understanding of the proposed plan and be able to more easily critique, change, and discuss the plan intelligently with other devs". Plans are hard to follow; walkthroughs are easy to follow. Planned code needs no proof against disk: "we just want to see which files, functions, and classes we're touching or … creating (as long as it shows a clean throughway of how data is moving)". And some plans "aren't super detailed and just capture the general idea. This would actually make it concrete."

Terms:
- **Walkthrough**: what `code-walkthrough` builds today.
- **Plan page**: what Wayfinder builds: the same page design, in plan mode.
- **Plan mode**: a data file with `"mode": "plan"`. The same build and page handle both.
- **Sketch**: a short planned code block for something new. Never checked against a file.
- **Base**: the git ref (such as `origin/main`) whose code a plan page shows for existing code.
- **Origin**: where a part of the plan comes from: quoted from the plan, a proposal the tool filled in, or an open question.

A throwaway trial fed a real plan into today's build, bent into walkthrough shape. The user found three problems: too little code in the steps, especially for new functions ("we should definitely have something there even if rudimentary"); "What it does" was a dense paragraph that "doesn't really lend itself to being easy to read at all"; and no way "to adjust the size of the map section and the description section … so that we can zoom into the plan". The trial's own list of friction points is answered item by item in the design below.

## Goals, non-goals, anti-goals

**Goals**
- From a plan file, a spec, a ticket, a goal in chat, or any mix, one plan page and a short note in the vault.
- Each stop says whether it is new, changed, unchanged, or built by another ticket, and shows code: today's lines (checked) and a sketch of the plan (not checked).
- Every part of the plan shows its origin. A proposal never reads as decided.
- The build checks that the data chain holds and that every new or changed stop has a task.
- A draggable divider between map and stop, on plan pages and walkthroughs alike.
- The user critiques ("change stop 3 to …"); Wayfinder edits its data file and rebuilds.

**Non-goals**
- Carrying out the plan. Replacing the user's planning skills; Wayfinder works beside them.
- Editing chalk-talk. Refreshing the team's standalone copy of `code-walkthrough` (a later job; see Open items).
- Drawing the round trip as two lanes.

**Anti-goals.** Any of these makes it a failure, even if it runs.
- A proposal that reads as decided.
- A sketch that looks checked.
- Any change in what an existing walkthrough data file builds to, beyond the new divider.

## Constraints found in the code

Paths are under `skills/code-walkthrough/`. Verified 2026-11-20; 237 tests pass (`node --test "scripts/tests/*.test.mjs"` from the skill folder, none skipped).

- `loadData` refuses any `format` but 1 (`scripts/lib/data.mjs:12`). `shapeErrors` (`data.mjs:31-79`) wants a `map_step` and at least one reason on every stop, and refuses a reason whose text starts "guess". It ignores unknown fields, and the build writes the whole object back (`walkthrough-build.mjs:180`), so new fields survive.
- `dataProblem` (`walkthrough-build.mjs:84-91`) refuses a data file with no `journey`, `short_name`, `summary` or `client` (exit 2).
- A stop with no code is legal. Several code blocks per stop are already legal (`references/data-file.md:103`) and shown (`page.mjs:80-83`). So the trial's "one block could not hold far-apart changes" needs only a writing rule.
- Every code block needs `lines` (`fieldProblem`, `data.mjs:23-29`), which `codeRows` (`code.mjs:19`), the block label (`page.mjs:37`) and the note's outline (`note.mjs:42`) read. `checkCode` reads each block from disk and fails a missing file with "the file is gone" (`code.mjs:10`). It already takes an injected `readFile` (`code.mjs:51`).
- Extend points must exist on disk (`code.mjs:83-92`).
- The build lists every cited file in `cited_files` and asks `repoFacts` about it (`walkthrough-build.mjs:145-156`). `repoFacts` reads HEAD and the disk: commit, uncommitted, misnamed (`git.mjs:45-75`). Quotes from `design-doc` and `code-comment` also read the disk (`quotes.mjs:98-113`).
- `READ_ONLY_GIT` allows `rev-parse`, `status`, `log`, `show`, `diff`, `cat-file`, `ls-files` (`git.mjs:5`). Git runs with `GIT_NO_LAZY_FETCH=1` (`git.mjs:24`). `look.mjs:64` already resolves a hash with `rev-parse --verify --end-of-options`.
- `checkQuotes` reads only `stop.reasons` (`quotes.mjs:147`). Saved copies (`sources`) exist only for tickets and pull requests (`quotes.mjs:76-90, 146`).
- `pageModel` copies named fields only (`page.mjs:55-100`), so a new field reaches `assets/page.js` only through `page.mjs`. The page reads its model from `#walk-data`.
- Page wording is in three places, not one: `lib/words.mjs` (header, reply, badges), the fixed labels in `page.js` (`WORDS`, line 16) and the tab names in `page.html:24-26` ("Where to extend").
- Names are fixed: "Walkthrough - " and `.walkthrough.json` (`names.mjs:12, 19, 21`, and `look.mjs:52`); `type: code-walkthrough` (`note.mjs:15`); "read this walkthrough", "The code may have changed since", "Earlier walkthrough", "Where to extend" (`note.mjs:28-47`). The look-up lists only notes of that type (`look.mjs:124`).
- The reply's code line counts blocks, not stops (`words.mjs:66-68`). The header always says "Code matches the files" (`words.mjs:53`).
- `walkthrough-build.mjs` runs `main()` on import (line 213), so tests run it as a child process.
- The build refuses a data file inside the vault (line 128) and exits 3 on a second build the same day without `--same-day` (line 186).
- Outside the skill: note types are listed in `skills/obsidian-vault/references/property-schema.md:9`, and folder keys in `skills/obsidian-vault/templates/Config.md:5-22`. No skill uses a `plans` key, a `Plans` folder or a `code-plan` type today.
- The read view is a grid of three rows: map, bar, stop (`page.css:74-76`, three rules: full, strip, none). The map size choice is stored as `code-walkthrough:map`, through a `store` wrapper that survives a throwing `localStorage` (`page.js:22-25`).

**chalk-talk's change mode exists as reported.** Read in `~/.claude/skills/chalk-talk/references/scene-spec.md` (lines 43, 69, 92, 157-179), `SKILL.md:225-235`, and `assets/template.html`, pinned at commit `4f88ead`:
- Nodes and edges take `"change": "added" | "changed" | "removed"`: a green ring and `NEW` tag, amber and `CHANGED`, or a red ghost and `REMOVED`. Any other value is a warning and is dropped (`template.html:928`).
- A top-level `"diff": { "title", "base", "head" }` names the change. Without it, a chip top right still sums the marks (`+2 ~1`) under the word "Changes".
- `D`, the `#diff` button, or a click on the chip flips between after (default) and before. Before hides added things and anything attached to them.
- `lib/map.mjs` already passes every node and edge field through (`withCode`, `map.mjs:54-67`), so `change` reaches the map today. It builds the top level from named fields only (`map.mjs:77`), so `diff` and `eyebrow` are dropped. The map's "HOW IT WORKS" is chalk-talk's default `eyebrow` (`scene-spec.md:32`).
- The flip is out of reach in the embedded map. The `#diff` button sits in chalk-talk's caption bar (`template.html:604-614`), which the walkthrough hides (`page.mjs:118`, `settings.mjs:12`). `page.js` stops every key in the frame, `D` included (`page.js:328`), and every tap on the board (`page.js:336-348`). The map is a `srcdoc` frame, so `?diff=before` cannot be passed.
- chalk-talk has no "planned" proof status. An arrow that cites a missing file is `broken`; one with no code and no `inferred` is `unproven`. Both fail the walkthrough build (`map.mjs:137-138`). So a planned arrow can only be `inferred`, and it keeps chalk-talk's `?` mark beside its `NEW` tag.
- chalk-talk reads `code` from disk, through the scene's `root` (`scripts/build.mjs:76, 84-86`), never from a git ref.
- Node and edge ids share one name space in chalk-talk (`template.html:839`).

## Approaches considered

1. **Plan mode in the shared build and page. Picked by the user.** One data format, one set of checks, one page design. Walkthroughs get the divider for free. Cost: every script change also changes what the team copy mirrors, and plan code sits beside walkthrough code in the same files.
2. **A separate Wayfinder build that imports the shared lib.** Walkthrough code stays untouched. But the page, names, note and words all need plan versions, so most of the lib is forked or given options anyway, and two pages drift apart.
3. **Instructions only, on the unchanged build.** This is what the trial was. It fell short on every point above: no sketches, planned arrows counted as guesses, proposals tagged "Guess", walkthrough wording throughout, no status on a stop, nowhere for tasks, tests, risks or out of scope, no data-chain check, and code read only from a stale disk.

## The design

### How plan mode is selected

`"mode": "plan"` in the data file. With no `mode`, nothing changes. Any other value is refused (exit 2): "has mode X; only plan is known". **Call:** exit codes follow today's split. A data file the build cannot use (an unknown `mode`, a bad `base` value, a `base` ref the repo does not know) exits 2. `extend` in plan mode and every other plan shape failure print `FAIL` lines and exit 1, as shape failures do today. The same-day case stays exit 3. **Call:** a field, not a flag, and `format` stays 1, so every existing data file is untouched. **Call:** the known risk is accepted: a stale copy of the scripts (the team copy before its refresh) would build a plan file as a walkthrough, under walkthrough names; its sketches would then fail the code check.

### The data file in plan mode

New or changed fields. Everything else keeps today's rules. **Call:** everything that is not a stop goes in one top-level `plan` object.

| Where | Field | Type and rule |
|---|---|---|
| top | `mode` | `"plan"`. |
| top | `plan.inputs` | list of short names the journey starts with. The data chain check reads it. **Call:** they belong to the journey, not to a repo. |
| top | `plan.tasks` | `[{ id: "t1", name, stops: [stop ids], from }]`, in build order. **Call:** `stops` may name `new` and `changed` stops only. A task that names an `unchanged` or `elsewhere` stop is a shape failure. A `new` or `changed` stop belongs to one or more tasks. |
| top | `plan.tests` | `[{ text, task?, when?, from }]`; `when` is `"build"` (default), `"before"` (before the build) or `"after"` (after deploy). **Call:** pre-build and post-deploy checks live here. **Call:** the page labels them "Tests" (`build`), "Checks before the build" (`before`) and "After deploy" (`after`). |
| top | `plan.risks`, `plan.out_of_scope` | `[{ text, from }]`. |
| top | `walkthrough` | optional: the note name of a walkthrough of the same code. **Call:** the build prints it and does not verify it. The skill fills it only from a look-up line it just read. |
| top | `extend` | refused in plan mode: "a plan has no extend points; put the work in plan.tasks". **Call.** |
| `repos[]` | `base` | optional git ref, such as `origin/main`. Must not start with `-`. Without it, the disk, as today. **Call:** a plan may span several repos in the first version (the trial did). `base` is per repo and optional per repo. The look-up runs once per repo, as code-walkthrough's own instructions say. A `base` ref the repo does not know locally is a refusal (exit 2) that says so and tells the user to fetch it themselves or drop `base`; the build never fetches. |
| `sources[]` | kind `chat` | `{ kind: "chat", ref: "goal", fetched, text }`: the user's words from chat, saved by the skill. |
| stop | `status` | `"new"`, `"changed"`, `"unchanged"` or `"elsewhere"` (built by another ticket; optional `ticket`, free text shown as given, with no pattern check). **Call:** the name `elsewhere`, shown as "Another ticket". **Call:** `unchanged` and `elsewhere` stops belong to no task. |
| stop | `from` | the origin of the stop as a whole. Needed on new, changed and elsewhere stops; unchanged stops are facts. |
| stop | `takes`, `gives` | lists of short names (a few words each), beside the free-text `data.in` and `data.out`. **Call:** both are required on every `new` and `changed` stop, and `gives` must not be empty. On `unchanged` stops they are optional; when present they take part in the chain check. An `elsewhere` stop's `gives` count for later stops; its `takes` are not checked. A missing `takes` on a new or changed stop is a shape failure with its own line. |
| stop | `what`, `points` | one plain sentence, then up to four short bullets. For a changed stop, they describe the plan. |
| stop | `today` | changed stops only: `{ what, points }`, how it works now. |
| stop | `choices` | the plan's decisions at this stop: `[{ text, from }]`. |
| stop | `reasons`, `guesses` | as today, but only about existing code. **Call:** at least one reason on unchanged and changed stops; none needed on new and elsewhere stops. An empty `reasons` list on an unchanged or changed stop fails as today, even if the stop has a guess; a not-recorded question counts as an entry. **Call:** guesses stay, tagged Guess, because they are about today's code, never the plan (see Open items). |
| stop `code` | by status | unchanged: today blocks only. Changed: at least one today block and one sketch. New: sketches only. Elsewhere: any mix, or none. |
| code block | `planned` | `true` marks a sketch. A sketch has `file`, `new_file` (true or false), `function`, `text` and `from`, an optional `after`, and no `lines`, `key_lines` or `left_out`. **Call:** `new_file: true` is accepted on every sketch whose file is absent at the base (or on disk when there is no base), however many sketches target that file. `after` is allowed only for a file that exists at the base, and names a function or a line there; `after` with `new_file: true` is a shape failure. Sketches are not checked for order; the page shows them in stop order. |
| map edge | `planned` | text saying what will make the call; in place of `code` and `inferred`. **Call:** a planned arrow carries no origin of its own; its stop's covers it. |

**Origin (`from`).** One shape everywhere: `{ kind, quote?, source? }`.
- `plan`: in the user's plan. Needs `quote` and `source`; the quote is checked word for word, as reasons are.
- `review`: in the plan, but marked there as waiting for the team's review. Same rules as `plan`. **Call.**
- `proposal`: the tool filled it in. No quote. **Call:** the proposal count in the header and reply is every sketch, choice and task whose origin is `proposal`. Arrows are never counted; they take their stop's origin. Tests and risks are tagged on the page but not counted.

**Awaiting review or decided.** **Call:** the state is a label declared by whoever writes the data file. The build cannot tell `review` from `plan` by the quote. Two guards stand in for that: a writing rule in the skill (when the source's own words say proposed, pending, draft or awaiting sign-off, the entry is `review`, never `plan`), and one scenario test of the skill text for exactly this.
- `open`: only on choices. The choice's `text` is the question and ends with `?`. No quote.

Quote sources are today's kinds (`design-doc` for a plan or spec in the repo, `vault-note`, `ticket`, `pull-request`, `commit`) plus two. `plan-file` takes an absolute path to a file outside the vault, read as `build-note` is (**Call:** a new kind, so the chip says "plan", not "build note"). **Call:** the file may sit inside the repo when it is not committed at the plan's base ref, because it cannot be read as `design-doc` there and plans are usually written before they are committed. A plan file inside the vault is refused; it is cited as `vault-note`. **Call:** at each build a `plan-file` source is read live when the file exists, and a copy is saved in `sources` with the date, as tickets are. If the file is gone, the saved copy is used and the reply says so. If the file exists but no longer holds the quote, the build fails that entry with "the plan file no longer says this"; the fix is to re-quote it or make the entry a proposal. This holds on a change-request rebuild too. `chat` reads the saved copy in `sources`; it proves only that the quote matches the copy the tool saved. Reasons keep today's kinds only: a plan is no reason for existing code.

**Sketches.** **Call:** "rudimentary" means the real signature in the real language, then about 5 to 15 lines of body. The build fails a sketch under 2 or over 30 lines. A changed stop holds its today blocks (checked) and its sketches. A file that changes in several far-apart places gets one block per place.

**Writing rules the build enforces** (plan mode only; **Call:** enforced, not advised). `what` is one sentence of at most 30 words. `points` holds at most four bullets of at most 20 words each. Neither holds a backtick, a cited file name, or a cited `function` name: those live in the stop's header and its code. **Call:** the check covers `what`, `points` and `today` only. `summary` and choice texts are not checked in the first version.

A complete small example, ready to become a fixture. Stop 1 is unchanged, stop 2 changed, stop 3 a new function in an existing file. The repo files match `references/data-file.md`'s example. `recap` on `map_step` is an existing field, documented at `references/data-file.md:144` (example at line 59): only the last stop sets it.

```json
{
  "format": 1, "mode": "plan",
  "journey": "Saving an invoice with its attachments", "short_name": "invoice attachments",
  "summary": "An invoice and its attached files are saved together.", "client": "acme",
  "repos": [{ "name": "ledger-api", "path": "~/Code/acme/ledger-api", "base": "origin/main" }],
  "sources": [{ "kind": "chat", "ref": "goal", "fetched": "2026-11-20",
    "text": "Let users attach files to an invoice. Attachments are saved in their own table, one row per file. The upload screen is out of scope." }],
  "plan": {
    "inputs": ["invoice request"],
    "tasks": [
      { "id": "t1", "name": "Add the attachments table and its save", "stops": ["s3"], "from": { "kind": "proposal" } },
      { "id": "t2", "name": "Save attachments with the invoice", "stops": ["s2"], "from": { "kind": "proposal" } }
    ],
    "tests": [{ "text": "An invoice with two files gets two attachment rows.", "task": "t2", "from": { "kind": "proposal" } }],
    "risks": [{ "text": "Many large files could slow the save.", "from": { "kind": "proposal" } }],
    "out_of_scope": [{ "text": "The upload screen.", "from": { "kind": "plan", "quote": "The upload screen is out of scope", "source": { "kind": "chat", "ref": "goal" } } }]
  },
  "stops": [
    { "id": "s1", "name": "The API takes the invoice", "status": "unchanged",
      "summary": "Refuses an invoice with too many lines, then hands it on.",
      "code": [{ "file": "src/routes/invoices.js", "lines": [6, 13], "function": "postInvoice",
        "text": "export async function postInvoice(req, res) {\n  const invoice = req.body;\n  if (invoice.lines.length > MAX_LINES) {\n    return res.status(400).send('Too many lines');\n  }\n  const saved = await saveInvoice(invoice);\n  res.status(201).json(saved);\n}", "key_lines": [8] }],
      "what": "The route checks the invoice and passes it to the store.", "points": ["Refuses more than 500 lines."],
      "data": { "in": "The request body.", "out": "The invoice." }, "takes": ["invoice request"], "gives": ["invoice"],
      "reasons": [{ "text": "Why is an invoice limited to 500 lines?", "source": { "kind": "not-recorded" } }],
      "guesses": [], "choices": [], "map_step": { "flow": ["send"], "focus": ["api"] } },
    { "id": "s2", "name": "The store saves the invoice, then its files", "status": "changed",
      "from": { "kind": "plan", "quote": "Let users attach files to an invoice", "source": { "kind": "chat", "ref": "goal" } },
      "summary": "After the invoice row is in, its files are saved too.",
      "code": [
        { "file": "src/store.js", "lines": [16, 20], "function": "saveInvoice",
          "text": "export async function saveInvoice(invoice) {\n  const total = totalOf(invoice.lines);\n  audit(invoice);\n  return db.insert('invoices', { ...invoice, total });\n}", "key_lines": [19] },
        { "planned": true, "file": "src/store.js", "new_file": false, "function": "saveInvoice", "from": { "kind": "proposal" },
          "text": "export async function saveInvoice(invoice) {\n  const total = totalOf(invoice.lines);\n  audit(invoice);\n  const row = await db.insert('invoices', { ...invoice, total });\n  await saveAttachments(row.id, invoice.attachments ?? []);\n  return row;\n}" }
      ],
      "today": { "what": "The store totals the invoice and inserts one row.", "points": ["Writes an audit entry first."] },
      "what": "The store inserts the invoice row, then saves its files against it.", "points": ["No files means no extra work."],
      "data": { "in": "The invoice.", "out": "The invoice row and its files." }, "takes": ["invoice"], "gives": ["invoice row", "attachments"],
      "reasons": [{ "text": "Why is the audit entry written before the insert?", "source": { "kind": "not-recorded" } }],
      "guesses": [], "choices": [{ "text": "Files are saved after the invoice row, in the same call.", "from": { "kind": "proposal" } }],
      "map_step": { "flow": ["save", "insert"], "focus": ["store"] } },
    { "id": "s3", "name": "Each file becomes an attachment row", "status": "new",
      "from": { "kind": "plan", "quote": "Attachments are saved in their own table", "source": { "kind": "chat", "ref": "goal" } },
      "summary": "A new store function writes one row per file.",
      "code": [{ "planned": true, "file": "src/store.js", "new_file": false, "after": 20, "function": "saveAttachments", "from": { "kind": "proposal" },
        "text": "export async function saveAttachments(invoiceId, files) {\n  for (const f of files) {\n    await db.insert('invoice_attachments', { invoiceId, name: f.name, url: f.url });\n  }\n}" }],
      "what": "Each attached file is saved as its own row, tied to the invoice.", "points": ["Runs only after the invoice row exists."],
      "data": { "in": "The invoice row and its files.", "out": "One row per file." }, "takes": ["invoice row", "attachments"], "gives": ["attachment rows"],
      "reasons": [], "guesses": [],
      "choices": [
        { "text": "One row per file.", "from": { "kind": "plan", "quote": "one row per file", "source": { "kind": "chat", "ref": "goal" } } },
        { "text": "Is there a size limit per file?", "from": { "kind": "open" } }
      ],
      "map_step": { "flow": ["to-attach", "attach-db"], "focus": ["attach"], "recap": true } }
  ],
  "map": { "style": "studio",
    "nodes": [
      { "id": "client", "kind": "actor", "label": "Billing app", "at": [0, 0] },
      { "id": "api", "kind": "box", "label": "Invoice API", "at": [1, 0], "code": "src/routes/invoices.js:6-13" },
      { "id": "store", "kind": "box", "label": "Invoice store", "at": [2, 0], "code": "src/store.js:16-20", "change": "changed" },
      { "id": "attach", "kind": "pill", "label": "Save attachments", "at": [2, 1], "change": "added" },
      { "id": "db", "kind": "db", "label": "Invoices database", "at": [3, 0] }
    ],
    "edges": [
      { "id": "send", "from": "client", "to": "api", "label": "POST /invoices", "inferred": "an HTTP call from outside this repo" },
      { "id": "save", "from": "api", "to": "store", "label": "save", "code": "src/routes/invoices.js:6-13", "calls": "saveInvoice(" },
      { "id": "insert", "from": "store", "to": "db", "label": "insert invoice", "code": "src/store.js:16-20", "calls": "db.insert(", "change": "changed" },
      { "id": "to-attach", "from": "store", "to": "attach", "label": "files", "planned": "saveInvoice will call saveAttachments" },
      { "id": "attach-db", "from": "attach", "to": "db", "label": "insert rows", "planned": "saveAttachments will insert one row per file" }
    ] }
}
```

### Checks in plan mode

Every check that runs today still runs on existing code. Shape failures print as `FAIL the plan: …` and stop the build before the other checks, as today.

| Check | Runs on | A failure the user sees |
|---|---|---|
| Status | every stop | `FAIL the plan: stop s3 has no status; use new, changed, unchanged or elsewhere` |
| Code fits status | every stop | `… stop s1 is unchanged, so it cannot hold a sketch` · `… stop s3 is new, so its code is sketches only` · `… stop s2 is changed, so it needs today's code and a sketch` |
| Origin | stops, sketches, choices, tasks, tests, risks, out of scope | `… stop s3 choice 2 is open, so its text must be a question` · `… task t1 is a proposal, so it cannot have a quote` · `… stop s2 comes from the plan, so it needs a quote and a source` |
| Sketch shape | each sketch | `… stop s3 code block 1 is a sketch, so it needs new_file as true or false` · `… is a sketch of 41 lines; keep it to 30 or fewer` |
| Writing | `what`, `points`, `today` | `… stop s2 what names src/store.js; keep file names in the header and the code` · `… stop s2 what is 44 words; keep it to one sentence of 30 or fewer` |
| Why | unchanged, changed | `… stop s2 has no Why entry` (today's line, now skipped on new and elsewhere stops) |
| Tasks (**Call:** both task failures) | `plan.tasks`, `plan.tests` | `… task t2 names stop s9, which does not exist` · `… stop s3 is new and no task builds it` (also for changed stops) · `… task t2 names stop s1, which is unchanged and belongs to no task` (also for elsewhere) · `… test 1 names task t9, which does not exist` |
| Takes and gives | new and changed stops | `… stop s3 has no takes` · `… stop s3 gives nothing` |
| Data chain | `takes` of each stop that has them (not elsewhere stops) | `… stop s3 takes "invoice row", which no earlier stop gives and plan.inputs does not list` |
| Existing code | today blocks, at the base | `FAIL s2 src/store.js:16-20: the text differs from origin/main (commit abc1234), first at line 2 of the shown text` · `… the file is not at origin/main` (the same wording for a map block that cites a file not at the base, though it is on disk) |
| Sketch place | each sketch, at the base | `FAIL s3 src/store.js (sketch): the file is not at origin/main; set new_file to true` · `… the file already exists; set new_file to false` · `… after line 90, but the file has 41 lines` · `… has after and new_file together; use one` |
| Base | each repo with `base` | `FAIL ledger-api: git cannot find origin/main here; the build never fetches, so fetch it yourself or change base` |
| Quotes | reasons and every `from` | `FAIL s3 from (chat goal): the quote is not found word for word in the source` · `FAIL s3 from (plan-file): the plan file no longer says this; re-quote it or make this a proposal` |
| Map | arrows | `FAIL map arrow to-attach: it is planned, so it cannot cite code yet` |

**Call:** the data-chain check is plan mode only. A stop passes when each of its `takes` names something in `plan.inputs` or in the `gives` of an earlier stop (an `elsewhere` stop's `gives` count), matched after trimming and lower-casing. The starting set is `plan.inputs`.

Skipped in plan mode: the disk check of sketches, replaced by the existence check above. The `uncommitted` facts when a repo has a base. Extend points (refused).

**The base.** The build resolves each repo's `base` once (a repo with no `base` is skipped): `git rev-parse --verify --end-of-options <base>^{commit}`, keeping the full hash. It sets `repos[].commit` to the short hash and `repos[].uncommitted` to `[]`, and skips `repoFacts`. Today blocks, `design-doc` and `code-comment` quotes, and sketch places are read with `git show <hash>:<file>` and `git cat-file -e`, through `gitRead`. Nothing is fetched. A file that git names differently fails as "not at <base>". chalk-talk reads map code only from disk, so when any repo has a base the build writes every map-cited file into `<out>/<slug>-base/<repo>/<file>`, one subfolder per repo, (from the base where the repo has one, from disk where it has not) and points the scene's `root` there. **Call:** this mirror lives only in the working folder; the repo is never written.

With no base, everything reads the disk as today, sketch places included, and the built line reads "Code as on disk at commit abc1234", with today's uncommitted list.

### The map

- Nodes and edges carry chalk-talk's own `change`. Use `added` and `changed` only; nothing a plan removes is drawn in v1 (**Call**). **Call:** blocks of `unchanged` and `elsewhere` stops carry no `change` mark. An `elsewhere` block's sub-label says "another ticket".
- A planned arrow carries `planned: "<what will make this call>"` and no `code`. In the scene, `map.mjs` turns it into `inferred: "Planned: <text>"` and sets `change: "added"` unless the data sets `changed`. The arrow shows `NEW` plus chalk-talk's `?` mark.
- `map.mjs` counts arrows by status, as today. An `inferred` arrow whose data edge has `planned` counts as planned, not as a guess. The new count is `planned`.
- In plan mode the scene also gets `eyebrow: "The plan"` and `diff: { "title": "Plan · <short name>", "base": "<base or commit>" }`. With no `mode`, the scene is exactly as today.
- Before and after. **Call:** plan pages add a "Today / Plan" button to the page's bar. It clicks the frame's `#diff` button (`frame.contentDocument.getElementById('diff').click()`). `page.js` also lets a tap on the chip (`#hud-diff`) through, as it lets taps on code through. This leans on an id outside chalk-talk's `window.chalk` API, so it gets a browser test that needs Chrome and chalk-talk. (`needsMap` is the existing skip guard in `scripts/tests/page.test.mjs:24`, used on the page's browser tests, e.g. line 487: it skips when there is no Chrome or no chalk-talk. It is a test option, not a helper.) **Call:** the button is shown only when the embedded map has the `#diff` control, checked when the page loads; otherwise it is hidden and the marks alone show. The browser test asserts the button is present when the map has change marks and chalk-talk is at the pinned commit.
- `change` labels make labels wider, so new layout failures are likely. They are fixed the usual way: move blocks or shorten labels.

### The page

Shared by both modes: the header, the map, the bar and pips, the divider, the stop card's layout, the Look up view, the theme, keys, and storage.

What a plan page adds per stop:
- In the header, a **status tag** (NEW, CHANGED, UNCHANGED, ANOTHER TICKET). A new stop whose sketches all sit in existing files reads "NEW · in an existing file". The stop's **origin tag**: "In plan", "Awaiting review" or "Proposal". The kicker names the task: "Stop 3 of 3 · Task 1" ("Tasks 1, 2" for several). **Call:** it shows a task only when a task covers the stop. An `elsewhere` stop shows "Another ticket" plus its `ticket` text when given.
- In the code column, a changed stop shows two labelled groups, **Today** (checked blocks, line numbers, as today) and **Plan** (sketches). A sketch has a dashed border, a grey stripe, no line numbers, and the label "Sketch · not checked". Its head reads `src/store.js · new, after line 20` or `src/x.js · new file`, plus its origin tag.
- "What it does": the sentence, then the bullets. A changed stop shows "Today" and "Plan" as two labelled parts.
- "Data in → out": the `takes` and `gives` names as chips beside the free text.
- The third tab is "Why & choices" (**Call:** the name) with a count, such as "· 1 open". It lists reasons (today's chips), then choices: "In plan" or "Awaiting review" with the quote chip, "Proposal" dashed and grey, "Open" in the not-recorded colour. Guesses keep the Guess tag and are only about today's code.

```
STOP 3 OF 3 · TASK 1                 [NEW · in an existing file]  [In plan]
Each file becomes an attachment row
src/store.js  saveAttachments
┌╌ SKETCH · not checked ╌╌╌╌╌╌╌╌╌ src/store.js · new, after line 20 · Proposal ╌┐
╎ export async function saveAttachments(invoiceId, files) {                    ╎
╎   for (const f of files) { … }                                               ╎
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
[ What it does | Data in → out | Why & choices 2 · 1 open ]
Each attached file is saved as its own row, tied to the invoice.
 • Runs only after the invoice row exists.
```

**Header.** The built line becomes "Code as at `origin/main` (commit abc1234), 2026-11-20. Nothing in this plan is built yet." The facts line becomes "2 today blocks match origin/main · 2 sketches not checked · 4 quotes found · 2 of 5 arrows traced, 2 planned, 1 guess" and "Stops: 1 new, 1 changed, 1 unchanged · 1 open · 5 proposals" (the example's counts: 2 tasks, 2 sketches, 1 choice; see the proposal rule under Origin).

**Views.** Read, Look up, and **Build order**, which takes the place of "Where to extend" (**Call:** a view, in that tab's place). The Look up filter becomes "Only stops with something open", and each outline row shows the status tag and the task.

```
Build order                          2 tasks · 1 test · 1 risk · 1 out of scope
1. Add the attachments table and its save   [Proposal]    Stop 3 →
2. Save attachments with the invoice        [Proposal]    Stop 2 →
   Test: An invoice with two files gets two attachment rows.  [Proposal]
Checks before the build · Tests · After deploy        (each only when present)
Risks          Many large files could slow the save.  [Proposal]
Out of scope   The upload screen.  [In plan]
Another ticket (stops marked elsewhere, with their tickets)
```

### The divider (both modes)

- **Call:** a `<div id="split" role="separator" aria-orientation="horizontal" aria-label="Map size" tabindex="0">` between `#map-wrap` and `#bar`, with `aria-valuemin="20"`, `aria-valuemax="80"` and `aria-valuenow` set to the map's share in percent.
- All three `grid-template-rows` rules gain the row. Full: `minmax(180px, var(--map-h, 46%)) 6px auto minmax(0, 1fr)`; with no `--map-h` set, the page looks as today. Strip and no-map hide the divider.
- Dragging: `pointerdown` takes pointer capture and sets `html[data-dragging]`, which turns off the frame's pointer events and text selection. `pointermove` sets `--map-h` as a share of `#read`'s height. **Call:** the limits are 20% and 80%.
- **Call:** keys: Up and Down move it 5 points, Page Up and Page Down 15, Home and End go to the limits, Enter resets. Double-click resets to 46%. Left and Right still move the stop.
- **Call:** the share is remembered per viewer in `localStorage` under `code-walkthrough:split` as a number, through the existing `store` wrapper. A missing or bad value means the default.
- What must not change: the default look, the strip, the Hide map button and its key, the stop keys, and the data. Pages already built keep no divider until rebuilt.

### Names, note, folder and look-up

|  | Walkthrough | Plan |
|---|---|---|
| Note | `Walkthrough - <short name>.md` | `Plan - <short name>.md` |
| Page | `<slug>.html` | `<slug>.plan.html` |
| Data file | `<slug>.walkthrough.json` | `<slug>.plan.json` |
| Note `type` | `code-walkthrough` | `code-plan` |
| Folder | `folders.walkthroughs`, default `Walkthroughs` | `folders.plans`, default `Plans` |
| Working folder | `${TMPDIR:-/tmp}/code-walkthrough/<slug>` | `${TMPDIR:-/tmp}/wayfinder/<slug>` |

**Call:** note type `code-plan`, data suffix `.plan.json`, key `folders.plans`, default `Plans` (no other skill uses that key or folder today). **Call:** the page name carries `.plan` too, so plans and walkthroughs cannot collide even if the user points both keys at one folder. The look-up lists only `type: code-walkthrough` (`look.mjs:124`), so it never lists a plan, and it stays unchanged. Earlier plans of the same journey link as today, through `chooseNames`.

The plan note: frontmatter `type: code-plan`, `client`, `created`, `repos`, `commits`, `base` (`name@ref`), `journey`, `stops`, `stops_new`, `stops_changed`, `stops_unchanged`, `stops_elsewhere`, `open`, `proposals`, and `jira` when given. The body has the title, the summary, the built line, the embed, "Earlier plan of this journey" and "Walkthrough of the same code" links, then `## Stops` (each line: name, status, origin, task, summary), `## Build order` (each task with its origin), and `## Open questions` (numbered). A proposal is marked "(proposal)" in the note too.

**Call, kept small:** a plan links to a walkthrough of the same code through its `walkthrough` field. No link goes the other way, because the build never rewrites a walkthrough. The link is printed, not verified.

### The Wayfinder skill, `skills/wayfinder/`

`SKILL.md`, plus `references/plan-file.md` (the plan-mode fields, the example above, the origin rules and the writing rules). It runs `code-walkthrough`'s two commands from `../code-walkthrough/scripts/`.

**Description (draft).** "Make a plan for code not yet written concrete on one page: which files, functions and classes it touches or creates, along one path of how the data moves, each part marked as in the plan, proposed, or open. Use when the user says 'wayfinder', 'make this plan concrete', 'show me what this plan touches', 'map out this plan', 'which files would this plan change', or hands over a plan, spec, ticket or goal to see as code before it is built. Explaining existing code is code-walkthrough's. Writing the plan is the planning skills'. Carrying it out is not this skill's. A proposal shown as decided is worse than an open question."

**Run steps.**
1. Vault and folder: `folders.plans`, default `Plans`, with the missing key asked about in one reply line, as code-walkthrough does. Find chalk-talk as code-walkthrough step 2 does.
2. Find the inputs: the plan file, spec, ticket or goal named, or the plan in this conversation. If there are none, ask once. Copy a chat goal into `sources` as `chat`.
3. Look for a walkthrough of the same code with `walkthrough-look.mjs` and the files the plan touches. If one covers it, use its stops and set `walkthrough`, only from a look-up line just read. **Call:** make no offer to build one. The look-up runs once per repo.
4. Pin the journey: one clean path of the data, one start and one end, about 4 to 12 stops (**Call**); split anything larger. Pick the base. **Call:** the ref the plan names; otherwise `origin/<default branch>` when it exists locally; otherwise the disk. Say which.
5. Ask the cost question once, in code-walkthrough's form: journey, repo, base and commit, stop count and time, map yes or no, and "It goes to the vault." Nothing is written before the yes.
6. Trace: existing code read at the base (`git show`), and a sketch for anything new or changed.
7. Mark the origin of every part. Quote the source word for word, or mark it a proposal. A gap the plan leaves becomes a proposal; a choice only the team can make becomes an open question. **Call:** when the source's own words say proposed, pending, draft or awaiting sign-off, the entry is `review`, never `plan`.
8. Write the data file. Build with `--folder <folders.plans>` and `--write`, by code-walkthrough's Build and check rules: fix the data, never the check, and at most three rounds.
9. Reply.

**Reply.** The build prints the four middle lines (`words.mjs`); the skill adds the first and last. For the example:
```
[[Plan - invoice attachments]]: 3 stops: 1 new, 1 changed, 1 unchanged, 0 built by another ticket.
Code: the 2 today blocks match origin/main (commit abc1234). 2 sketches are not checked.
Sources: all 4 quotes were found word for word (4 in a saved copy of the chat).
Map: 2 of 5 arrows are traced to a line of code. 2 are planned. 1 is marked as a guess. None are broken.
Plan: 2 tasks, 1 test, 1 risk, 1 out of scope. 1 open question, 5 proposals.
Open questions, then questions about today's code:
1. Is there a size limit per file?
2. Why is an invoice limited to 500 lines?
3. Why is the audit entry written before the insert?
5 proposals to confirm; each is tagged Proposal on the page.
```
"Sources" replaces "Reasons" in plan mode and counts every quote, reasons and origins alike.

**Writing rules** (also in `references/plan-file.md`): one plain sentence, then a few short bullets. No file names, signatures or backticks in sentences. A changed stop says Today and Plan apart. Short `takes` and `gives` names, reused word for word down the chain.

**A change request** ("change stop 3 to …"): copy the `.plan.json` from the vault into the working folder (the build refuses one inside the vault), edit it, and rebuild with `--same-day replace`. **Call:** no question first, since the user asked for the change; on a later day it becomes a new dated plan linked as earlier. **Call:** Wayfinder never writes to the user's plan file. The reply ends with "Your plan file would need to say:" and a short list. **Call:** the user's words are saved as a new `chat` source (`change 1`, then `change 2`). Only a change stated as decided is quoted as `plan`; a tentative one ("what if …", "maybe …") becomes a proposal or an open choice, with no quote. An entry whose old quote says the opposite gets the new quote, or becomes a proposal.

### File by file

| File | Change | Rough size |
|---|---|---|
| `scripts/lib/plan.mjs` (new) | plan shape, origin, writing, tasks and chain checks (**Call:** a new file, called from `shapeErrors`) | 150 |
| `scripts/lib/data.mjs` | `mode` gate, sketch-aware `fieldProblem`, reasons optional on new and elsewhere stops | +20 |
| `scripts/lib/git.mjs` | `resolveBase`, `fileAt` (`git show`), `existsAt` (`cat-file -e`) | +25 |
| `scripts/lib/code.mjs` | sketches skipped by the text check, the existence and `after` checks, reading at the base | +40 |
| `scripts/lib/quotes.mjs` | `from` items, `chat` and `plan-file`, reading at the base | +30 |
| `scripts/lib/map.mjs` | planned arrows, the `planned` count, `diff` and `eyebrow`, the base mirror | +40 |
| `scripts/lib/names.mjs`, `note.mjs` | names by mode; the plan note | +10, +45 |
| `scripts/lib/words.mjs` | plan header, reply lines, tags, counts | +70 |
| `scripts/lib/page.mjs` | plan fields in the model, the sketch block model, build order | +60 |
| `scripts/walkthrough-build.mjs` | mode check, base flow, planned files left out of `cited_files`, wiring | +35 |
| `assets/page.html`, `page.css`, `page.js` | slice 1: the divider and its `code-walkthrough:split` setting (with browser tests). Later slices: plan tags, sketches, choices, Build order view, Today / Plan button | +15, +70, +170 |
| `references/data-file.md` | one line: plan fields live in `../wayfinder/references/plan-file.md` | +2 |
| `skills/obsidian-vault/references/property-schema.md` | `code-plan` in the `type` list (line 9) and a `type: code-plan` section beside `code-walkthrough`'s (line 140) | +15 |
| `skills/obsidian-vault/templates/Config.md` | `plans: Plans` under `folders` (beside line 18) and its line in the key list (beside line 64) | +2 |
| `README.md` | a Wayfinder row in the skill table | +1 |
| `skills/wayfinder/SKILL.md`, `references/plan-file.md` | new | 150, 160 |

Tests: a new `plan.test.mjs` (every shape, origin, writing, task and chain failure line) and `base.test.mjs` (reading at a ref, a missing ref, no fetch). Extended: `code`, `quotes`, `map` (planned count, `diff`, mirror), `names`, `note`, `words`, `page-model`, `page` (divider and plan page in Chrome), `build` (a plan build end to end, exit codes, same-day replace), and `helpers.mjs` (the example above as `samplePlan`, plus a repo with `origin/main` behind the disk). Scenario tests: a new `docs/superpowers/baselines/wayfinder.md`, following `docs/superpowers/baselines/README.md`, run on sonnet.

### Slices, in order

Each ships alone; plan mode reaches no user until the last.
1. **The divider.** `assets/page.js`, `assets/page.css` and `assets/page.html`, and their browser tests. The new stored setting is `code-walkthrough:split`. It helps walkthroughs today.
2. **Plan data and checks.** `mode`, `plan.mjs`, sketches, origin quotes, names, note, reply words, and the vault schema and config lines. A sketch has no `lines`, so this slice also makes the block label and rows (`page.mjs:37-43`) and the note's outline line (`note.mjs:42`) sketch-safe. Beyond that, the page shows plan data plainly until slice 4.
3. **The base.** `git.mjs`, reading at a ref in code and quotes, the map mirror.
4. **The plan page.** Model, tags, sketches, choices, Build order.
5. **Map marks.** Planned arrows, counts, `diff` and `eyebrow`, the Today / Plan button.
6. **The Wayfinder skill.** RED reps first, then `SKILL.md` and `plan-file.md`, then GREEN reps and trigger checks.

## Checks before it ships

- The 237 tests pass, plus the new ones, with Chrome and chalk-talk present (none skipped).
- **No-change check for the anti-goal:** in this repo, an existing walkthrough data file (no `mode`) builds to the same page models, notes, reply lines and scenes before and after the work. The only page difference is the divider. Nothing in the team copy changes until its refresh, so its own tests keep passing.
- The example above builds with exit 0. Then, one at a time: a stop's `takes` renamed, a task removed, a sketch marked `new_file: true`, a quote changed, and a planned arrow given `code`. Each gives exactly its failure line.
- A repo whose `origin/main` is behind the disk: the page shows the ref's lines and commit, and git shows no fetch and no change.
- In Chrome: drag, keys, double-click and reload for the divider, and storage that throws; a sketch has no line numbers and reads "not checked"; the Today / Plan button is present when the map has change marks and chalk-talk is at the pinned commit, and flips the map.
- Scenario reps on sonnet: (a) a goal in chat only: gaps become proposals, with at least one open question; (b) a detailed plan file: its quotes are checked; (c) "change stop 2 to …": data edited and rebuilt, the plan file untouched; (d) asked to put the page in the repo: it goes to the vault; (e) no trace before "Go ahead?"; (f) "how does X work" does not trigger Wayfinder; (g) a plan whose source says a part is pending or awaiting sign-off: the entry is `review`, not `plan`.
- A search of the new files finds no person's name, client term, ticket key or home path.

## Open items

Where the code contradicts the decisions or the gathered facts:
1. **The format check** is in `loadData` (`data.mjs:12`), not in `shapeErrors`.
2. **Several blocks per stop** are already legal (`data-file.md:103`). Friction 12 needed a writing rule, not a code change.
3. **Change marks** already reach the map; only `diff` and `eyebrow` are dropped, and the flip is out of reach (see Constraints).
4. **The base reaches past code blocks:** to quotes, `repoFacts`, `builtLine`, and the map, which reads disk only. Hence the mirror folder.
5. **A planned arrow has no proof status of its own**; on the map it differs from a guess only by its `NEW` tag.
6. **Page wording is not all in `words.mjs`** (`page.html:24-26`, `page.js:16`).
7. **`.walkthrough.json` is also hard-coded in `look.mjs:52`.** It stays: look-up is walkthroughs only.
8. **"Proposal not Guess".** This design keeps Guess for guesses about today's code and uses Proposal for everything the tool adds to the plan. If the user meant no Guess tag at all on plan pages, `guesses` would be refused in plan mode instead.

Still open:
- **The team copy** mirrors `scripts/` and `assets/` byte for byte. Slice 1 already puts it out of step, so a `diff -r` between the two copies will show differences from slice 1 until the refresh. Refresh it with the README's commands after each slice, or once at the end; that refresh is a separate job.
- Whether Wayfinder should be offered after a planning skill writes a plan. **Call:** not in v1.
