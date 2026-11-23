# The plan file

Wayfinder's data file is code-walkthrough's data file with `"mode": "plan"`: `<working folder>/<slug>.plan.json`, where `<working folder>` is the path `echo "${TMPDIR:-/tmp}/wayfinder/<slug>"` prints in the shell, used as printed. Anything this file does not change keeps the rules in [code-walkthrough's data file](../../code-walkthrough/references/data-file.md): its top level, stops, code blocks, reasons and map. The build checks the file, adds what it learns, and copies it into the vault beside the page and the note.

A complete example: one repo read at `origin/main`, a goal from chat, three stops. Stop 1 is unchanged, stop 2 is changed, and stop 3 is a new function in an existing file.

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

## Top level

- `format`: always `1`. `mode`: always `"plan"`.
- `journey`, `short_name`, `summary`, `client`, `jira`: as for a walkthrough. The files are named from `short_name`: `Plan - invoice attachments.md`, `invoice-attachments.plan.html`, `invoice-attachments.plan.json`.
- `repos`: `{ name, path, base }` per repo. `base` is optional: the git ref today's code is read at, such as `origin/main`. It must not start with `-`, and the repo must already hold it locally, because the build never fetches. With no `base`, today's code is read from disk.
- `sources`: saved copies.
  - `chat`: `{ kind: "chat", ref: "goal", fetched: "YYYY-MM-DD", text }`, with `text` the user's words copied word for word. A change request adds `change 1`, then `change 2`.
  - `ticket` and `pull-request` work as for a walkthrough.
  - Never write a `plan-file` entry: the build saves a copy of each plan file itself.
- `plan`: everything that is not a stop.
  - `inputs`: short names of what the journey starts with. The chain check starts from these.
  - `tasks`: `[{ id: "t1", name, stops: [stop ids], from }]`, in build order. A task names only new and changed stops. Every new or changed stop is in at least one task.
  - `tests`: `[{ text, task, when, from }]`. `task` and `when` are optional. `when` is `"build"` (the default), `"before"` (a check before the build) or `"after"` (after deploy).
  - `risks`, `out_of_scope`: `[{ text, from }]`.
- `walkthrough` (optional): the note name of a walkthrough of the same code, taken from a look-up line just read. The build prints it and does not check it.
- `map`: as a walkthrough's, plus the map rules below.
- `extend`: never in a plan. The work goes in `plan.tasks`.

The build fills `built`, `repos[].commit`, `repos[].uncommitted`, `cited_files`, `checks`, `map_tool`, `earlier`, and the `plan-file` copies in `sources`. Never write them by hand.

## A stop

A stop keeps a walkthrough's `id`, `name`, `summary`, `code`, `data`, `notes`, `guesses` and `map_step`. What changes depends on its `status`:

| Field | `new` | `changed` | `unchanged` | `elsewhere` (another ticket) |
|---|---|---|---|---|
| `from` | needed | needed | never | needed |
| `code` | sketches only, at least one | at least one today block and at least one sketch | today blocks only | any mix, or none |
| `what` | needed: the plan | needed: the plan | needed: how it works | needed |
| `points` | optional: the plan | optional: the plan | optional | optional |
| `today` | never | needed: `{ what, points }`, how it works now | never | never |
| `takes`, `gives` | needed; `gives` not empty | needed; `gives` not empty | optional; checked when present | `gives` count for later stops; `takes` are not checked |
| `reasons` | none needed | at least one | at least one | none needed |
| `choices` | `[{ text, from }]`: the plan's decisions at this stop | same | same | same |
| `ticket` | | | | optional free text, such as `PROJ-123` |

`reasons` and `guesses` are only about today's code, with a walkthrough's source kinds. A plan is never a reason. A not-recorded question counts as a reason.

## Code blocks

**A today block** is a walkthrough's code block, copied from the base: `GIT_OPTIONAL_LOCKS=0 git -C <repo> show --end-of-options <base>:<file> | sed -n '<a>,<b>p'`. Its line numbers are the base file's. With no base, copy it from disk.

**A sketch** is `{ planned: true, file, new_file, function, text, from }`, with an optional `after`:
- `new_file`: `true` when the file is not at the base (or not on disk, with no base), and `false` when it is. At the base, only a regular file counts as a file: a folder, a link or a submodule is "not at" the base.
- `after`: only in a file that exists. A line number, or a piece of text the file holds. Never together with `new_file: true`.
- `text`: 2 to 30 lines. The real signature in the repo's language, then about 5 to 15 lines of body.
- No `lines`, `key_lines` or `left_out`.
- A file that changes in far-apart places gets one sketch per place.

## Origins

Every `from` has the shape `{ kind, quote, source }`:

| `kind` | Use it for | `quote` and `source` |
|---|---|---|
| `plan` | the source states it as decided | both; the quote is the source's words, word for word |
| `review` | the source states it, but marks it as waiting for the team | both |
| `proposal` | Wayfinder filled it in: a gap the plan leaves | neither |
| `open` | choices only: a question only the team can answer; the choice's `text` ends with `?` | neither |

When the source's own words say proposed, pending, draft or awaiting sign-off, the entry is `review`, never `plan`. Such a line is never dropped. It gets its own entry where it belongs, and the quote holds the pending statement itself, not only the marker words. For a plan file line `Proposed, awaiting sign-off: files over 10 MB are refused.`:

```
{ "text": "Files over 10 MB are refused.",
  "from": { "kind": "review", "quote": "Proposed, awaiting sign-off: files over 10 MB are refused.",
            "source": { "kind": "plan-file", "ref": "<the plan file's absolute path>" } } }
```

The proposal count on the page and in the reply is every sketch, choice and task marked `proposal`. A planned arrow carries no `from`; its stop's covers it.

Quotes follow the walkthrough rules: word for word, starting and ending on whole words. Where a quote can come from:

| `source.kind` | `ref` | The build reads |
|---|---|---|
| `chat` | `"goal"`, `"change 1"` | the saved copy in `sources` with the same `ref`. It proves only that the quote matches the copy Wayfinder saved |
| `plan-file` | an absolute path, with no `~` | the file, at every build, and it saves a copy in `sources`. If the file is gone, it uses the saved copy and the reply says so. A file in the vault is refused: cite it as `vault-note` |
| `design-doc` | `{ "repo"?, "path" }`, from the repo root | the file at the base, or on disk with no base. A plan or spec in the repo that is not committed at the base cannot be read there: cite it as `plan-file`, with its absolute path |
| `vault-note`, `ticket`, `pull-request`, `commit` | as for a reason | as for a reason |

`code-comment`, `build-note` and `not-recorded` are for reasons only.

## Writing rules

The build enforces these on each stop's `what`, `points` and `today`:
- `what` is one plain sentence of at most 30 words. `points` holds at most four bullets of at most 20 words each.
- No backticks, no file names and no function names: those live in the stop's header and its code. The check matches every cited file path, every file's base name (such as `store.js`) and every cited `function` name, from all the plan's code blocks, as whole words with the same letter case. So a function with a plain English name, such as `save`, makes that word unusable in every `what`, `points` and `today` of the plan.
- A changed stop says Today and Plan apart: `today` is how it works now, and `what` and `points` are the plan.
- `takes` and `gives` are short names of a few words, reused word for word down the chain. They are matched after trimming and lower-casing.

## Map rules

The build does not check these, so keep them by hand:
- Blocks and arrows take chalk-talk's `change`, as `added` or `changed` only. Nothing the plan removes is drawn.
- Blocks of `unchanged` and `elsewhere` stops carry no `change`. An `elsewhere` block's `sub` says "another ticket".
- A block's `code` cites a file that is at the base. A block for something new has no `code`.
- A planned arrow carries `planned: "<what will make this call>"`, and no `code`, `calls` or `inferred`. The map shows it as new, with chalk-talk's `?` mark.
- An arrow in today's code cites `code` and `calls`, or carries `inferred`, as on a walkthrough.

## Every FAIL line, and its fix

`<id>` is a stop or task id, `<n>` a number counted from 1, `<base>` the repo's `base`. The build names each part as the page shows it: `stop s3`, `stop s3 code block 1`, `stop s3 choice 2`, `task t1`, `test 1`, `risk 1`, `out of scope 1`.

### Shape: `FAIL the plan: <line>` (exit 1)

These print alone, before any other check. Fix them all, and count that as one round.

**Status and code**

| Line | Fix |
|---|---|
| `stop <id> has no status; use new, changed, unchanged or elsewhere` | Set `status` |
| `stop <id> has status <x>; use new, changed, unchanged or elsewhere` | Use one of the four |
| `stop <id> is unchanged, so it cannot hold a sketch` | Drop the sketch, or make the stop `changed` |
| `stop <id> is new, so its code is sketches only` | Drop the today blocks, or make the stop `changed` |
| `stop <id> is new, so it needs a sketch` | Add a sketch |
| `stop <id> is changed, so it needs today's code and a sketch` | Add the one that is missing |
| `stop <id> appears twice` | Give each stop its own id |
| `stop <id> has no map step` | Add `map_step` |
| `stop <id> code block <n> has no file name` | Set `file` (today blocks and sketches) |
| `stop <id> code block <n> has no text` | Set `text` (today blocks and sketches) |
| `stop <id> code block <n> needs lines as two whole numbers, first line 1 or more and not after the last` | A today block needs `lines: [a, b]` |
| `stop <id> code block <n> needs a repo, because there are several repos` | Add `repo` |
| `stop <id> code block <n> names an unknown repo, <name>` | Use a `name` from `repos` |

**Sketches** (each line starts `stop <id> code block <n>`)

| Line | Fix |
|---|---|
| `… is a sketch, so it needs new_file as true or false` | Set `new_file` |
| `… is a sketch of <n> lines; keep it to 30 or fewer` | Cut the body |
| `… is a sketch of 1 line; give it 2 or more` (or `of 0 lines`) | Give it a signature and a body |
| `… is a sketch, so it cannot have lines, key_lines or left_out` | Remove them |
| `… has after and new_file together; use one` | A new file has no `after` |
| `… needs after as a whole number, 1 or more, or as text from the file` | Give a line number of 1 or more, or text the file holds |
| `… is a sketch, so its file must be a path from the repo top` | Use a path from the repo top, with no `..` and no leading `/` or `./` |

**Origins**

| Line | Fix |
|---|---|
| `stop <id> is unchanged, so it has no from` | Remove the stop's `from` |
| `<part> has no from; mark it plan, review or proposal` | Add `from`. A choice may also be `open` |
| `<part> from has an unknown kind, <kind>; use plan, review, proposal or open` | Use one of the four |
| `<part> is open, but only a choice can be open` | Make it a proposal, or move the question into a choice |
| `<part> is open, so its text must be a question` | End the text with the question and `?` |
| `<part> is open, so it cannot have a quote` | Remove the quote, or make it `plan` or `review` if the source states it |
| `<part> is a proposal, so it cannot have a quote` | Remove the quote, or make it `plan` or `review` if the source states it |
| `<part> comes from the plan, so it needs a quote and a source` | Quote the source and name it, or make it a proposal |
| `<part> is awaiting review, so it needs a quote and a source` | Quote the source and name it |
| `<part> from has an unknown source kind, <kind>` | Use `chat`, `plan-file`, `design-doc`, `vault-note`, `ticket`, `pull-request` or `commit` |

**Reasons** (each line starts `stop <id>`)

| Line | Fix |
|---|---|
| `… has no Why entry` | An unchanged or changed stop needs a reason about today's code, or a not-recorded question |
| `… Why entry <n> is a guess; guesses go in the guesses list` | Move it to `guesses` |
| `… Why entry <n> needs a source` | Add `source` |
| `… Why entry <n> has an unknown source kind, <kind>` | Use a walkthrough reason kind |
| `… Why entry <n> needs a quote` | Quote the source, or make it not recorded |
| `… Why entry <n> is not recorded, so its text must be a question` | The text is the question alone, ending `?` |
| `… Why entry <n> is not recorded, so it cannot have a quote` | Remove the quote |
| `… Why entry <n> needs a repo, because there are several repos` | Add `repo` to the source's `ref` |
| `… Why entry <n> names an unknown repo, <name>` | Use a `name` from `repos` |

**Tasks, tests, risks and out of scope**

| Line | Fix |
|---|---|
| `there is no plan object; add one with inputs and tasks` | Add `plan` |
| `task <id> appears twice` | Give each task its own id |
| `task <id> has no name` | Name it |
| `task <id> names no stop` | List its stops |
| `task <id> names stop <s>, which does not exist` | Use a real stop id |
| `task <id> names stop <s>, which is <status> and belongs to no task` | Take unchanged and elsewhere stops out of tasks |
| `stop <id> is new and no task builds it` (or `is changed`) | Add the stop to a task |
| `test <n> names task <id>, which does not exist` | Use a real task id, or drop `task` |
| `test <n> has when <x>; use build, before or after` | Use one of the three |
| `test <n> has no text`, `risk <n> has no text`, `out of scope <n> has no text` | Write the text |

**Takes and gives**

| Line | Fix |
|---|---|
| `plan.inputs is missing; list what the journey starts with` | Add `plan.inputs` |
| `stop <id> has no takes` | Add `takes` |
| `stop <id> gives nothing` | Add at least one name to `gives` |
| `stop <id> takes "<name>", which no earlier stop gives and plan.inputs does not list` | Reuse an earlier stop's name word for word, add it to `plan.inputs`, or fix the stop order |

**Writing** (`<at>` is `stop <id>` or `stop <id> today`)

| Line | Fix |
|---|---|
| `<at> has no what` | Write one sentence |
| `<at> what is <n> words; keep it to one sentence of 30 or fewer` | Shorten it |
| `<at> what is <n> sentences; keep it to one` | One sentence; the rest goes in `points` |
| `<at> has <n> points; keep it to 4 or fewer` | Cut bullets |
| `<at> point <n> is <w> words; keep it to 20 or fewer` | Shorten it |
| `<at> what names <file>; keep file names in the header and the code` (also `<at> point <n> names …`) | Say what the part does, not where it is |
| `<at> what names <function>; keep function names in the header and the code` (also for a point) | Use a plain word that is not a cited function's name |
| `<at> what holds a backtick; keep code in the code blocks` (also for a point) | Remove the backticks and the code |
| `stop <id> is changed, so it needs today with what and points` | Add `today: { what, points }` |
| `stop <id> is <status>, so it has no today` | Remove `today` |

**Extend**

| Line | Fix |
|---|---|
| `a plan has no extend points; put the work in plan.tasks` | Remove `extend` (its own `extend point …` lines go with it) |

### Checks: `FAIL <where>: <why>` (exit 1)

**The repo** (a repo with no base)

| Line | Fix |
|---|---|
| `FAIL <repo>: <path> is not a git repo` | Set the repo's `path` to its top folder |

**Today blocks**: `FAIL <stop id> <file>:<a>-<b>: …`

| Why | Fix |
|---|---|
| `the file is not at <base>` | The base holds no regular file by that name (missing, or a folder, link or submodule). Cite the file as git names it at the base, or make the code a sketch |
| `the file is gone` | No base: the file is not on disk. Cite the right path |
| `the file has <n> lines` | Re-read the file and fix `lines` |
| `line <k> is outside <a>-<b>`, `left-out lines <x>-<y> are outside <a>-<b>` | Keep `key_lines` and `left_out` inside `lines` |
| `the text differs from <base> (commit <abc1234>), first at line <n> of the shown text` | Copy the lines again from `git show <base>:<file>`; declare dropped lines in `left_out` |
| `the text differs from the file, first at line <n> of the shown text` | No base: copy the lines again from disk |
| `git names this file differently; use the path as git names it, …` | No base: copy the path from `git ls-files` |

**Sketch places**: `FAIL <stop id> <file> (sketch): …`

| Why | Fix |
|---|---|
| `the file already exists; set new_file to false` | Set `new_file: false` |
| `the file is not at <base>; set new_file to true` (or `is not on disk`) | Set `new_file: true` and drop `after`, or fix the path |
| `after line <n>, but the file has <m> lines` | Use a line inside the file |
| `after "<text>", but the file does not contain it` | Copy text the file holds |

**Quotes**: `FAIL <where> (<source>): …`. `<where>` is `<stop id> reason <n>` for a reason, or the part's name without `stop ` plus `from` for an origin: `s3 from`, `s3 choice 2 from`, `s2 code block 2 from`, `task t1 from`, `out of scope 1 from`. `<source>` is `chat goal`, `plan-file`, `design doc <path>`, `vault note <path>`, `ticket <key>`, `pull request #<n>` or `commit <hash>`.

| Why | Fix |
|---|---|
| `the quote is not found word for word in the source` | Copy the quote again from the source, or make the entry a proposal |
| `the plan file no longer says this; re-quote it or make this a proposal` | The plan file changed since the last build. Re-quote it, or make the entry a proposal. Never edit the plan file |
| `no saved copy of chat <ref>` | Add the `chat` source with that exact `ref`, or fix the `ref` |
| `<ref> must be an absolute path` | Give the plan file's absolute path, with no `~` |
| `<ref> is in the vault; cite it as vault-note` | Make the source `vault-note`, with the note's path from the vault top |
| `the source has no file path` (or `no note path`, `no file name`, `no ticket key`, `no pull request number`) | Fill in the source's `ref` |
| `cannot read <path>: no such file, and there is no saved copy` | Fix the plan file's path |
| `cannot read <path>: <reason>` | Fix the path |
| `cannot read <file> at <base>` | The doc is not committed at the base. Cite it as `plan-file`, with its absolute path |
| `<path> is outside the vault`, `<path> is a private note and the user did not name it` | Cite another source, or make the entry a proposal |
| `no saved copy of ticket <key>`, `no saved copy of pull request #<n>` | Save the ticket or pull request in `sources` |
| `bad commit hash: it must be 4 to 40 hex characters`, `git cannot read commit <hash> in <repo>` | Copy the hash again |
| `line <n> is not in <file>: the file has <m> lines` | Fix the reason's line number |
| `no repo named <name>`, `a repo name is needed when there are several repos` | Fix or add `repo` in the source's `ref` |

**The map**

| Line | Fix |
|---|---|
| `FAIL map arrow <id>: it is planned, so it cannot cite code yet` | Remove `code` and `calls` from the planned arrow |
| `FAIL map block <id>: its code path must stay inside the repo` (or `map arrow`) | Cite a path from the repo root, with no `..` and no leading `/` or `./` |
| `FAIL map block <id>: the file is not at <base>` (or `map arrow`) | Cite a file at the base. A block for something new has no `code` |
| `FAIL map arrow <id>: it points at no code and is not marked as a guess` | Cite `code`, or mark it `inferred`, or `planned` if the plan adds it |
| `FAIL map arrow <id>: its cited code was not found` (or chalk-talk's own reason) | Cite the right lines, or mark the arrow `inferred` with the reason |
| `FAIL map arrow <id>: chalk-talk did not check it` | Cite `code`, or mark it `inferred` or `planned` |
| `FAIL map block <id>: with several repos, its code must name its repo, as { repo, file, lines }` (or `map arrow`) | Use the object form |
| `FAIL map block <id>: its code names an unknown repo, <name>`, `… its code has no file name` (or `map arrow`) | Fix `code` |
| `FAIL map: the data has no map`, `FAIL map: the map needs its blocks as a list` (or `arrows`, `groups`) | Add the map, with lists |
| `FAIL map: the data names no repo`, `FAIL map: every repo needs a name and a folder` | Fix `repos` |
| `FAIL map: chalk-talk could not build the map: <reason>`, `… did not finish building the map in 10 minutes`, `FAIL map: chalk-talk built a page with no readable map in it` | Fix what the reason names. Never drop the map with `--chalk none` |
| `FAIL map layout: <chalk-talk's message>` | Move a block to a free cell or shorten a label, as the line says. `change` tags make labels wider |
| `FAIL map layout: chalk-talk could not check the map: <reason>`, `… chalk-talk's layout check did not finish in 10 minutes` | Say so to the user; never drop the check |

**The vault, and the rest**

| Line | Fix |
|---|---|
| `FAIL <file name>: it is already in the vault, so nothing was written` | Something with that name is already in the plans folder. Tell the user; never delete it |
| `FAIL build: <message>` | An error the build did not expect. Tell the user what it says |

### Refusals: `walkthrough-build: <message>` (exit 2)

Not a check round: fix what it says and build again.

| Message | Fix |
|---|---|
| `<data file> has mode <x>; only plan is known` | Set `mode` to `"plan"` |
| `<data file> has a bad base for <repo>, <value>; give a git ref such as origin/main` | Give a ref that does not start with `-`, or drop `base` |
| `<repo>: git cannot find <ref> here; the build never fetches, so fetch it yourself or change base` | Never fetch. Pick the base again by step 4 of the skill, or drop `base` to read the disk, and tell the user which |
| `<repo>: <path> is not a git repo` | Set the repo's `path` to its top folder |
| `<data file> is inside the vault, and the build rewrites its data file; copy the data file to the working folder and build from the copy` | Build from the copy in the working folder |
| `--out <path> is inside <place>; use a working folder outside the vault, the repos and the work folders` | Use the working folder the `echo` printed |
| `<data file> has no <journey, short_name, summary or client>` | Fill it in |

`SAME DAY <names>` (exit 3): this journey was already built today. On a first build, ask the user "Replace today's plan, or keep both?". A change request always builds with `--same-day replace`.
