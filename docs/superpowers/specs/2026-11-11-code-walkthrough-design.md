# code-walkthrough — design

**Status: Approved by the user on 2026-11-11, including the section "Planning: the offer". Nothing is built.** The user's decisions are marked as theirs. Everything marked "designer's call" is open to correction.

- Layout mockup: `docs/superpowers/specs/2026-11-11-code-walkthrough-mockup.html`. The user picked tab C plus tab B's outline.
- Sample: the vault's `Walkthroughs/` folder holds one note, one `.scene.json` and one `.html`. An earlier session built it from this repo's work-chart hooks.

## What it is

`code-walkthrough` is a new skill in this plugin. It walks the user through one journey in real code, start to finish, following the data. Each stop shows the actual lines, what they do, what goes in and out, and why it was built that way. Every reason names its source. The result is one page the user can open again a week later in refinement, plus a short vault note that points to it.

## Why

This is the user's own account.

The user codes mostly with AI now. Coding by hand, hours inside files, functions and classes built a working knowledge of where everything is. That knowledge no longer builds up. Every AI session that touches many files widens the gap.

It hurts in three places:

1. **Planning with the AI.** Without knowing the code, the user cannot push back on the AI's suggestions.
2. **When a batch of AI changes lands.**
3. **Refinement meetings, most of all.** The team asks specific questions, and the user has no answer. Two real ones: "What is in the shell service repos?" and "How were these features built, so we can extend them?" Even the first was really about how to extend what is there.

The user tried the `chalk-talk` skill. They like its visual walkthrough, but it stays too high-level: boxes and arrows, with the code one click away in a side panel.

## Terms

- **Journey**: one path through the code, from what starts it to the end result.
- **Stop**: one place on the journey: real code, what it does, data in and out, and why.
- **Reason**: one entry under a stop's "Why". *Recorded*: a source states it, quoted word for word. *Not recorded*: no source states it, and the entry holds only the question ("Why are logs kept 14 days?").
- **Guess**: a plausible reason no source states. It goes on its own "Guess" line, never in the Why list.
- **Map**: the chalk-talk picture of the journey, built from a scene file (`.scene.json`).
- **Page**: the one HTML file the user reads. **Data file**: the JSON file that holds every stop.
- **Extend point**: a place where new behaviour would attach, as `file:lines`.
- **Way in**: what a walkthrough starts from. Version 1 starts from a feature.

## Goals, non-goals, anti-goals

**Goals**
- The user can explain a feature's code in refinement, and say how to extend it.
- "Not recorded" is easy to see and filter on. It is the list of questions to ask the team.

**Non-goals**
- No quiz or test of the reader.
- No client-facing or shareable export in this version. The page holds local paths, and the vault copy is private.
- No version that is safe to show the team or the client. The page and the note are for the user's own reading. If that changes, a safe-to-show version is separate later work.
- No edits to chalk-talk, and no replacement for its quick explanations.
- The other ways in, the repo-level note, and the drift re-check wait for later (see "Later versions").

**Anti-goals.** Any of these makes the skill a failure, even if it technically works.
- An invented or inferred reason shown as fact. The user will repeat it in refinement.
- Staying high-level: boxes and arrows without the real lines.
- A wall of text.
- Output in a client-visible place (the code repo) or on an outside service, without being asked.
- Code that does not match the file: paraphrased, or shortened without saying so.

## What the user decided

1. A walkthrough runs start to finish and follows the data. Each stop names the file and the logic, what goes where, and the reason behind it. It ends at the end result. Extending the code is the real goal.
2. Real code at each stop. The visual is a map.
3. Afterwards the page stays on hand, for example a week later in refinement, with a vault note that points to it. A local file or a published page is acceptable. Showing the page inside Obsidian is preferred. The user has turned on the "Embed HTML" community plugin, and confirmed that the sample's map shows inside the note through it.
4. On the first sample (a 729-line note with 14 stops): it was useful, but a wall of text all at once is too much. Use HTML, CSS and JS to make the sections readable.
5. Layout: mockup tab C (map on top, current stop below, moving together) plus tab B's outline (every stop as a one-line row) for quick lookups.
6. Order of delivery: a feature walkthrough first, then a batch of changes as a way in, then a whole repo. One depth only; there is no separate "deep" mode.
7. The live map wins. If the live map and reading inside the note cannot both work, keep the live map and read the page in a browser tab opened from the note.
8. The page and the note are for the user's own reading. They are not shown on a shared screen. So source quotes appear word for word, names included. No step replaces names with roles.
9. The skill is also used proactively in planning. When the user starts planning a change, it offers a walkthrough of the code that change will touch, before any plan is written. If a recent walkthrough of that code already exists, it points to that one instead.

## Designer's calls

Each call gets one line here. Detail lives in the section named.

| # | Call | Why |
|---|---|---|
| D1 | Three views of one page with one switch: Read, Look up, Where to extend ("The page"). | One place to look. |
| D2 | The note is short: frontmatter, the embedded page, a fallback link, a plain-text outline, and the extend points ("The vault note"). | The outline keeps the walkthrough searchable in Obsidian and readable by an AI agent while planning. The extend points serve the user's real goal. |
| D3 | One data file is the source of truth. A build script makes the page, the map's scene and the note from it. The page is one self-contained HTML file. | Nothing is edited in two places. |
| D4 | One map step per stop, generated from the data file. | The map and the stop cannot drift apart. |
| D5 | Everything goes to the vault, in `folders.walkthroughs` (default `Walkthroughs`). Nothing goes in the code repo or on an outside service. With no key set, use the default and ask about the key in one line, as work-chart does for `folders.work`. | Client repos are visible to the client, and the page holds code and local paths. The user allowed a published page; this is why the designer chose not to. |
| D6 | The note type is `code-walkthrough`, not `walkthrough`. | Eight existing notes in the vault's `TICKET-2 Walkthrough/` folder already use `type: walkthrough` for a stakeholder deck. An earlier candidate skill meant the same shape (`docs/superpowers/baselines/walkthrough-deck.md`). |
| D7 | A journey may cross repos, and each repo's commit is recorded. | The designer reads the shell-service question as likely spanning more than one repo. |
| D8 | One journey per walkthrough, about 8–14 stops. A bigger feature is split: build the first, list the rest, offer the next. | One sitting's reading. It mirrors chalk-talk's own rule. |
| D9 | Before tracing, state the cost and ask once. | The sample took 23 minutes and about 270k tokens. A wrong journey found 20 minutes in is the costliest mistake. |
| D10 | Version 1 explains the code as it is on disk when the run starts, committed or not (D19). | chalk-talk reads files on disk, so the checks do too. |
| D11 | Builds run in a working folder outside the code repo, the vault and every `work_roots` folder. Only three files land in the vault: the page, the data file and the note. | chalk-talk writes a page and a folder of stills beside its scene. Outside `work_roots`, the hooks do not log the build's files as work. |
| D12 | Never overwrite. A rebuild of the same journey gets the date in its file names and links the earlier note. On the same day, ask. | obsidian-vault's rule. |
| D13 | Staleness, version 1: the note and the page say "built from commit X on DATE", or "built from commit X plus uncommitted changes in N files on DATE" (D19). | Re-checking is a later version. |
| D14 | Default reading place: inside the note, at a tall embed height. The order of outcomes is: 1. Live map, read inside the note (the default, if the first trial passes inside Obsidian). 2. Live map, read in a browser tab opened from the note, used when the live map works in a browser but fails inside the note: the embed does not show, Obsidian takes the keys, or the frame is too cramped to read. 3. Still map pictures with a highlight, used only when the live map fails in the browser as well. 4. A simple map drawn by our own page, used only if all of the above fail. Outcomes 1 and 2 are the user's ruling (decision 7). Outcomes 3 and 4, and the conditions that trigger each, are the designer's call. | The user's stated preference, and the user's ruling that the live map wins. The rest is the designer's order. |
| D15 | The map's font request to Google Fonts is accepted. Our page makes no requests of its own. | It is chalk-talk's choice. No project data is sent. Offline, the map uses fallback fonts. |
| D16 | Jira tickets are a reason source, read only. | Client repos will lean on tickets. |
| D17 | "Not recorded" items stay in the walkthrough. | They are the list of questions to ask the team. |
| D18 | A reason is one Why entry. Frontmatter and the page header count entries. The outline badge and the filter work per stop. | In the sample, 13 of 14 stops have a recorded reason, yet 10 of 14 have an item not recorded. |
| D19 | A walkthrough is built from the files as they are on disk when the run starts. The run records the commit (HEAD) and, separately, the cited files that differ from it. Check 1 compares code blocks against the file on disk, not the commit. The skill never asks the user to commit or revert, and never stops over uncommitted changes. It says once, before tracing, which files have them. If a cited file changes between tracing and the build, check 1 fails for that stop and the stop is re-read ("Checks"). | A failed run costs about 23 minutes. A client repo must not be pushed to commit unfinished work. The user often wants to understand AI-written changes before committing them. Cost: such a walkthrough cannot be rebuilt from the commit alone. The data file keeps the code text, so the page still stands. |
| D20 | The reason search skips vault notes whose frontmatter has `visibility: private`, unless the user names the note. A search hit inside such a note is discarded too ("Where reasons come from"). | It follows obsidian-vault section 4. |
| D21 | The reply offers to log chosen "not recorded" items as open-question notes, by number. None is logged without the user's say. | One walkthrough can hold ten or more, so logging all of them would bury the ones that matter. |
| D22 | The planning offer is an offer, made once per area per conversation, never an automatic run ("Planning: the offer"). | A run costs about 2 minutes a stop. An automatic run before every plan would make planning slow and costly. |
| D23 | "Recent" means the walkthrough's cited files have not changed since its commit, checked by file. A walkthrough with changed files is still pointed to, with the count of changed files and an offer to rebuild. | A by-file check is one git command. The by-line drift re-check stays a later version. |
| D24 | During planning, the agent reads a covering walkthrough's outline and the stops that matter, and the plan cites stop numbers and extend points. | It gives the user and the agent the same map to argue over. |

### Triggers

The skill is named `code-walkthrough`. Proposed phrases:

- "code walkthrough of X"
- "deep walkthrough of X". This picks this skill over chalk-talk; there is still one depth.
- "I need to be able to explain X"
- "help me understand X well enough to extend it"
- "how was X built, so we can extend it"
- "prep me to explain X in refinement", only with a feature or code named

The skill's description must also carry the planning trigger: "when the user starts planning a change to existing code (brainstorming, plan mode, "let's plan X", picking up a ticket)".

Boundaries:

- **chalk-talk** keeps "how does X work", "walk me through", "what happens when", "explain this flow", onboarding someone else, and explaining a PR. Those want a quick picture. This skill fires only when the user wants the real code and the reasons.
- **work-chart** keeps "what did you just do", "why did you change X" and "explain that diff". Those read back this session's work rows. This skill explains code that already exists, whoever wrote it.
- **repo-dossier** keeps "what does this repo do" and "document this repo". A dossier is one overview note per repo. This skill follows one journey.
- **Meeting prep** (open-questions, people, reconcile) keeps a bare "prep me for refinement". This skill needs a feature or code named.
- **Planning skills** (brainstorming, writing plans, ticket-intake) keep the planning itself. This skill only adds its one-line offer or pointer at the start.
- **frames** keeps "explain this to my team", "make this a story", "pitch this" and turning notes or code into a short story for other people. Those make something to present. This skill builds the user's own understanding of the code, for their own reading.

The question in D9 limits the cost of a wrong trigger to one question.

## How a run goes

1. **Trigger.** The user names a feature and wants to understand its code. Or the user says yes to the planning offer ("Planning: the offer").
2. **Find the vault, the config and the folder.** Follow obsidian-vault and D5.
3. **Find chalk-talk.** If it is missing, carry on without the map ("The chalk-talk dependency").
4. **Pin the journey.** Find the repo or repos and the entry point. Name the start and the end result, and sketch the stops. Over about 14 stops: propose a split and pick the first part. Record each repo's current commit, and list the cited files that differ from it (D19). Read only enough to sketch.
5. **State the cost and ask once.** One short message: the journey from start to end, repos and commits, rough stop count, rough time (the sample ran about 2 minutes a stop), whether the map is available. If some files have uncommitted changes, it names them and says the walkthrough covers them as they are on disk (D19). It is a notice, not a question. Then: go ahead? Nothing is written before the yes.
6. **Trace the code**, following the data: for each stop, the exact code blocks, key lines, what it does, data in and out, and short notes on unfamiliar syntax.
7. **Find the reasons**, in the order under "Where reasons come from". Copy quotes exactly. Write each "not recorded" entry as its question. Keep guesses apart.
8. **Write the data file** in the working folder (D11).
9. **Build and check** ("Checks"). If a check fails, fix the data and rebuild, at most three rounds. If it still fails, stop, deliver nothing, and say in plain words what still fails.
10. **Write to the vault.** Copy in the page and the data file, then write the note (D12).
11. **Reply briefly**, without retelling the walkthrough: the note as a wikilink, stop count, reasons recorded and not recorded, the three check results ("Checks"), the commit, the next journey if the feature was split, the offer from D21, and the config-key question if the key is missing.
12. **Work chart.** By work-chart's own rule, explaining existing code on request is not a work row. So a run writes no rows unless it serves a ticket. A run will likely trip work-chart's Stop hook, because it makes five or more research calls. The expected answer is the stamp script with no arguments. A run that serves a ticket gets one row. The builder picks the wording.

## Planning: the offer

The user's decision is item 9. Everything else in this section is the designer's call, open to correction.

**When it applies.** The user starts planning a change to existing code: brainstorming a feature, entering plan mode, saying "let's plan X", or picking up a ticket. The reason is the user's first pain point: without knowing the code, they cannot push back on the AI's suggestions.

**Step 1: look first.** Scan the frontmatter of the notes in `folders.walkthroughs` for ones whose `repos` include the repo being changed. For each match, read its data file and see whether its cited files overlap the code the change will touch. Frontmatter first, data file second, as obsidian-vault section 4 asks.

**Step 2: one covers it.** Say so in one line: the note as a wikilink, its commit and date, and whether its files have changed since. The check is by file, not by line: `git diff --name-only <commit> HEAD -- <cited files>`, plus any uncommitted changes to them. Then read the note's outline and the stops that matter from the data file, so the plan can cite stop numbers and extend points. If files changed, say how many and offer a rebuild, with the usual cost question (D9).

**Step 3: none covers it.** Offer one in a single line with the rough time, for example: "No walkthrough covers the booking save path yet. Want one before we plan? About 20 minutes." On yes, run "How a run goes" from step 4, with the journey being the path the change will touch. Step 5's cost question is already answered by the yes, so it only confirms the journey. Then planning resumes with the walkthrough to hand. On no, planning carries on, and the skill does not offer again for that area in this conversation.

**When not to offer.**
- Brand-new code with nothing existing to walk through.
- A change that stays within a few lines of one file.
- An area the user already declined in this conversation.
- While a walkthrough run is under way.

**Rules.**
- It is an offer. It never starts a run without a yes, because of the cost (D9).
- It adds one line to planning. It does not replace or reorder the steps of other planning skills (brainstorming, writing plans, ticket-intake).
- The offer comes before any plan is written.

## The page

The page is one self-contained HTML file. The map travels inside this file. The vault gets no separate map file. The mockup's tabs C and B show the look.

**Where it is read.** The default is inside the note. If the live map works in a browser but fails inside the note, the note's fallback link becomes the way in, and the page is read in a browser tab (decision 7). The page is the same file either way.

**Header.** It holds:
- the journey title;
- "Built from `<repo>` at commit `<commit>` on `<date>`", or "Built from `<repo>` at commit `<commit>` plus uncommitted changes in N files on `<date>`", with those files listed (D19);
- the three check results, short, for example: "Code matches the files · 22 quotes found (2 in saved copies) · 12 of 15 map arrows traced, 3 guesses";
- the reasons count: "22 recorded, 11 not recorded";
- the view switch.

**Read view** (tab C).

*Map, on top:*
- the chalk-talk map at the current stop's step;
- "Stop 3 of 14 — name";
- numbered pips to jump to a stop;
- "Hide map", which shrinks the map to a strip.

*Stop card, below.* It opens with the stop number, its name, and each code block's `file:lines` and function.

The left side holds the code:
- real line numbers from the file;
- key lines highlighted;
- left-out lines shown as a visible row, such as "lines 20–52 left out";
- long blocks folded ("⋯ 14 more lines"), with "Show all N lines";
- "Notes on the code (N)", collapsed.

The right side holds three tabs, as in the mockup: What it does, Data in → out, and Why.
- The Why tab shows its counts, such as "Why 3 · 1 not recorded". A gap is never hidden behind a tab.
- Each reason shows in plain words with a source chip. Quotes are word for word, names included (decision 8): vault note, design doc, commit `545220f`, pull request #412, ticket, code comment, build note, or not recorded.
- Clicking a chip shows the exact quote and where it comes from.
- "Not recorded" entries have their own clear style and show the question.
- Guesses sit below the list in a lighter style, each marked "Guess".

Prev and Next buttons carry the neighbouring stops' names. ← and → work when the page has focus.

Prev, Next, the keys, the pips, a click on the map, and an outline row all move the map and the stop together. The first trial proves this is possible.

**Look-up view** (tab B).
- Each row shows the stop number, its name, the first `file:lines` with "+N more", a one-sentence summary, and a badge such as "2 not recorded" or "nothing recorded".
- A filter box matches name, file, function and summary.
- "Only stops with a reason not recorded" narrows the list. A count reads "6 of 14 stops".
- A click opens the stop in place, one at a time. "Read from here" switches to the Read view at that stop.

**Where to extend.** Each point shows `file:lines`, what to add there, and a link to its stop. The sample's "Where to extend" section shows the kind of content.

**Narrow and short frames.** A note pane is about 800px wide. In the mockup at that width, layout C's map takes about 46% of the height and its text is small. So:
- Below about 900px wide, the code takes the full width, and the tabs move below it.
- In a frame under about 800px high, the map starts as its strip.
- The page remembers that choice per viewer when browser storage works. Every storage call is wrapped, so the page works without it.

**Other rules.**
- Light and dark follow the viewer, with a toggle. The map follows the page.
- The page makes no network requests of its own.
- Keys act only when the focus is in the page and not in the filter box.
- Words on the page are plain, with no terms about how the skill works inside.

## The vault note

The build writes the note once, after every check passes.

**Names** (the builder may adjust):
- the note: `Walkthrough - <short journey name>.md`;
- the page: `<journey-slug>.html`;
- the data file: `<journey-slug>.walkthrough.json`.

```markdown
---
type: code-walkthrough
client: uscold
created: 2026-11-11
repos:
  - "[[phenix.appointments]]"
commits:
  - "phenix.appointments@3f2a9c1"
uncommitted:
  - "phenix.appointments: api/src/BookingService.java"
journey: Booking an appointment, from Save to the saved row
stops: 11
reasons_recorded: 14
reasons_not_recorded: 6
jira:
  - PFD-00000
---

# Booking an appointment, from Save to the saved row

Follows one booking from the Save button to the saved row and the message on screen.

Built from `phenix.appointments` at commit `3f2a9c1` plus uncommitted changes in 1 file on 2026-11-11 (`api/src/BookingService.java`). The code may have changed since.

![[booking-an-appointment.html|height: 900px]]

Not showing, or too small? Open [[booking-an-appointment.html]], or use the "open in browser" button on the page above.

## Stops

1. **The form sends the booking** · `web/src/BookingForm.tsx:40-72` · Collects the fields and posts them to the API. Reasons recorded.
2. **The API checks the dock** · `api/src/DockRules.java:12-48` (+1 more) · Turns away a dock that is closed that day. 1 reason not recorded.

## Where to extend

- `api/src/BookingService.java:88-104` (stop 5): add a new check before the save here.
```

The note always carries both the embed line and the fallback link. Normally the embed is the main way to read. When the trial finds the live map works in a browser but not inside the note, the link is the main way: the note's first line after the title says so, and the embed line stays as a try.

**Properties** for the schema, beyond the base trio:

| Property | Format | Notes |
|---|---|---|
| `repos` | list of quoted wikilinks | Same name as on `work` and `runbook` notes, so one view by repo finds them all. |
| `commits` | list of quoted `repo@hash` | Quoted, because a hash like `1234567` would otherwise read as a number. |
| `journey` | string | The plain title. |
| `stops` | integer | |
| `reasons_recorded` | integer | Why entries with a source and a quote. |
| `reasons_not_recorded` | integer | Why entries with only a question. |
| `uncommitted` | optional list of quoted `repo: path` | Cited files that differed from the commit at build time (D19). Left out when none. |
| `jira` | optional list | The ticket the walkthrough serves. |

The sample note uses `type: reference` with an unquoted `commit`. It stays as it is.

## The data file

This is a proposal. The builder may adjust names and nesting.

```json
{
  "format": 1,
  "journey": "Booking an appointment, from Save to the saved row",
  "short_name": "booking an appointment",
  "built": "2026-11-11",
  "jira": ["PFD-00000"],
  "repos": [{ "name": "phenix.appointments", "path": "~/Code/<client>/phenix.appointments", "commit": "3f2a9c1",
             "uncommitted": ["api/src/BookingService.java"] }],
  "cited_files": { "phenix.appointments": ["web/src/BookingForm.tsx", "api/src/DockRules.java"] },
  "stops": [{
    "id": "s1",
    "name": "The form sends the booking",
    "summary": "Collects the fields and posts them to the API.",
    "code": [{
      "repo": "phenix.appointments", "file": "web/src/BookingForm.tsx", "lines": [40, 72],
      "function": "onSave", "text": "<the lines exactly, minus left-out ones>",
      "key_lines": [51, 58], "left_out": [[60, 66]]
    }],
    "what": "<plain words>",
    "data": { "in": "The form's fields.", "out": "A POST to /appointments." },
    "notes": ["`?.` stops early when the value is missing."],
    "reasons": [
      { "text": "Every booking goes through the API so the yard service hears about it.",
        "quote": "every booking must reach the yard service",
        "source": { "kind": "vault-note", "ref": "Decisions/2026-09-04 <title>.md" } },
      { "text": "Why does the form retry twice before it gives up?",
        "source": { "kind": "not-recorded" } }
    ],
    "guesses": ["The retries may cover the API's slow first call."],
    "map_step": { "flow": ["post"], "focus": ["api"] }
  }],
  "map": { "style": "studio", "nodes": [], "edges": [], "groups": [] },
  "extend": [{ "stop": "s5", "file": "api/src/BookingService.java", "lines": [88, 104],
               "text": "Add a new check before the save here." }],
  "sources": [{ "kind": "ticket", "ref": "PFD-00000", "fetched": "2026-11-11", "text": "<as fetched>" }],
  "checks": { "code": {}, "quotes": {}, "map": {} }
}
```

- **`cited_files`** is written by the build: one list per repo, so the planning look-up can match files without reading every stop.
- **Code blocks.** A stop can have several blocks from several files; the sample's stop 2 cites two files. `repo` may be left out when there is one repo. `text` holds the cited lines as they were on disk at build time, minus the declared `left_out` ranges. The page rebuilds the real line numbers from these.
- **Reasons.**
  - `text` is the plain-words reason the page shows.
  - `quote` is the exact source wording the check looks for.
  - Every recorded reason has both, and one without a quote does not count as recorded.
  - A `not-recorded` entry has only `text`, phrased as the question.
  - `source.kind` is one of `vault-note`, `design-doc`, `commit`, `pull-request`, `ticket`, `code-comment`, `build-note` or `not-recorded`.
- **Map.** `map_step` is a chalk-talk step, titled with the stop's name unless it sets its own title. The build joins `map` and the steps, in stop order, into the scene. It works out the scene's `root` (which chalk-talk reads relative to the scene file) from the repo paths. `map.nodes`, `map.edges` and `map.groups` use chalk-talk's own scene format. Each node carries its position (`at`) and its `code`. Each edge carries its `code` and `calls`, or `inferred` with the reason. The build copies them into the scene unchanged.
- **`sources`** holds saved copies of outside text ("Checks", check 2).
- **`checks`** is written by the build. The header and the note read it.

## Where reasons come from

**The rule, firm and the user's.** Code holds no "why".
- Each reason cites its source and quotes it.
- When no source states a reason, the entry says "not recorded".
- A plausible guess may appear only on a separate "Guess:" line, in a visibly different style.

**The order to look in, the designer's call.** For each stop, search these in order, cite every source that states a reason, and list them in this order:

1. **The vault.** Skip any note whose frontmatter has `visibility: private`, unless the user names it (D20). Discard a search hit inside such a note. Work notes (their `why` and `decided` columns), decision notes, ticket and handoff notes for the repo or ticket, and meeting notes.
2. **Design docs in the repo.** Specs, plans, ADRs, and README sections.
3. **Commits, pull requests, and the Jira tickets they name.** Use `git log`, `git blame`, and `gh pr view` when available. Read Jira only (D16).
4. **Comments in the code.**
5. **Build notes left by AI coding sessions** in the repo or its worktrees, such as `.superpowers/sdd/<plan>/task-N-report.md`. Cite them by file name.

Outside docs, such as a framework's documentation, may support a fact in "What it does" by name. They are never quoted as a reason.

**Evidence from the sample.**
- 13 of 14 stops had at least one recorded reason. 10 of 14 had at least one item not recorded.
- This repo has design docs and plans. Its commit messages are subject lines only.
- Four reasons cite the implementation plan in `docs/superpowers/plans/`.
- The sample cites no build note. Task reports from the same AI sessions sit in this repo's `.claude/worktrees/*/.superpowers/sdd/` folders, and they are the same kind of record.

Client repos will lean on vault notes and tickets, so "not recorded" will be far more common. That is why the page makes it easy to see and filter on.

## Checks

The sample's checks were one-off scripts. Here they are part of the build, and any failure fails it.

**1. Code matches the files.** For each code block:
- Read the file on disk at build time, take the cited lines, and drop the declared left-out ranges.
- The result must equal `text` exactly, tabs and trailing spaces included. Only line endings are made the same.
- Uncommitted changes never fail this check (D19). If a cited file changes on disk between tracing and the build, the check fails for that stop. Re-read the stop and rebuild. This is the normal fix loop.
- Key lines and left-out ranges must sit inside the range.
- Each extend point's lines must exist in the file on disk.

**2. Every quote is found in its source.** The quote must appear word for word. Only these allowances apply:
- runs of spaces and line breaks count as one space;
- curly and straight quote marks count as the same;
- backticks are ignored on both sides;
- "…" splits a quote into pieces that must appear in order.

| Kind | `ref` | What the script reads |
|---|---|---|
| `vault-note` | path in the vault | the note |
| `design-doc` | repo and path | the file on disk |
| `commit` | hash | the commit message |
| `pull-request` | number | `gh pr view`, else the saved copy |
| `ticket` | Jira key | the vault ticket note, else the saved copy |
| `code-comment` | repo, file, line | the file on disk |
| `build-note` | path on disk | the file on disk (often not committed) |

**Known weak spot.** A saved copy is text from a ticket or pull request, fetched through tools the script cannot call, and stored in `sources`. The run writes both the quote and the copy, so the check proves only that they agree. To limit this:
- look in the vault ticket note first;
- use `gh` live wherever it works;
- have the header and the reply both say how many quotes rest on saved copies.

**3. chalk-talk's proof check.** Each map arrow's `calls` text is in its cited lines, or the arrow is marked `inferred`. No arrow may be broken.

**Shape rules**, which also fail the build:
- every stop has a Why entry;
- a recorded reason has a source and a quote;
- a not-recorded entry has its question;
- guesses never sit in the Why list;
- there is one map step per stop.

chalk-talk's layout errors get fixed too, as chalk-talk requires, but they are not one of the three results. If Chrome is missing, the reply says the map was not checked by eye.

**Fix the data, never the check.**
- Code mismatch: re-read the lines.
- Quote not found: copy it again, or make the entry "not recorded".
- Broken arrow: cite the right lines, or mark it `inferred` with the reason.

**In the reply**, plain words:
- "Code: all 31 blocks match the files as built (commit `3f2a9c1` plus uncommitted changes in 1 file)."
- "Reasons: all 22 quotes were found word for word in their sources (2 in saved copies of a ticket)."
- "Map: 12 of 15 arrows are traced to a line of code. 3 are marked as guesses. None are broken."

## The chalk-talk dependency and the first trial

chalk-talk is a third-party skill pinned at `~/.claude/skills/chalk-talk` (source `github.com/oztrkemree/chalk-talk`, commit `4f88ead`, MIT). Its pin is in `PINNED.txt`. This plugin relies on it and never edits it.

**Finding it.** Look for `chalk-talk/scripts/build.mjs` in `~/.claude/skills/`, then in the current project's `.claude/skills/`. Record the commit from `PINNED.txt` in the data file. chalk-talk needs Node 18 or later. Its `check.mjs` also needs Chrome.

**When it is missing.** Build the page without the map. The Read view shows the stop card with a slim stop indicator. The other views are unchanged. The header and the reply say "Map: not built, because chalk-talk is not installed", and give its source and where to put it. Never copy chalk-talk into this plugin, and never edit it, without the user's say.

**Facts that shape the design.**
- `build.mjs` builds one self-contained page from a scene and runs the proof check.
- `check.mjs` reports layout problems and saves one still per step in `<slug>-snaps/`, beside the page.
- Code attaches to blocks and arrows, not to steps. It shows only in a click-open side panel, at most 120 lines a snippet. So the map cannot be the reading.
- The page offers `window.chalk.ready`, `chalk.steps()`, and `chalk.go(k)` (1-based, instant). `#3` in its address opens step 3, through `hashchange`.
- On each step change, the page writes `#k` with `history.replaceState`. That fires no event, and no call returns the current step.
- More than 10 steps gives a warning, not an error. The flat `studio` style fits more than the isometric board's 4×3. The sample used `studio`: 12 blocks and 10 steps for 14 stops.
- It has its own caption bar and its own key handler: ← →, space, j and k, Home and End, 1–9, P for autoplay, T, V, C, D. A plain click on the board moves one step forward, and a swipe moves it too. Any of these can move the map without the stop.
- It loads fonts from Google Fonts (D15).
- By default it writes to `./chalk-talks/` in the current project. The skill always uses its own working folder (D11).
- In the sample, three things could not be drawn: a script ending early, separate helper calls (they drew as one chain), and "nothing happens" (only as a packet label). The stop card carries these. That stop's map step focuses the part it is about.

**How this design uses it.**
- The scene uses `studio` by default and has one step per stop.
- The last stop is the end result, so its step may use chalk-talk's recap form. No extra steps are added.
- More than 10 stops trips the warning. That is accepted, because the stop card carries the text.
- If the trial shows the map's caption bar can be hidden from the outer page, hide it. Otherwise, each step's caption is just the stop's name.

**Facts about Embed HTML.**
- Version 2.7.0 is installed. Its embed syntax is `![[file.html|height: 600px]]`.
- It has an "open in external browser" button.
- This vault's default embed height is 400px.
- Its code has two ways to frame a page. Which one a note embed uses is for the trial to find out. The `srcdoc` way:
  - puts the page in an inner frame with no sandbox, so scripts run;
  - adds a `<base>` that points at the file's place in the vault;
  - sets the frame's light or dark to match Obsidian;
  - makes links open in a new window.
- Because of that `<base>`, the map may not be able to write `#k` inside Obsidian. Drive the map with `chalk.go(k)`, not through its address.
- **Confirmed by the user:** the sample's map, the chalk-talk page alone in a 600px embed, shows inside the Obsidian note through Embed HTML.
- **Not yet proven:** the full page (map plus stop) inside a note. The first trial settles it.

### The first trial: plan task 1, pass or fail

Layout C needs the live map and the stop to move together. Whether the chalk-talk page can serve as that live map inside our page, and inside a note, is unproven. The mockup used a still image and a made-up link from stop to map. So this trial is the plan's first task.

**Setup.** Make a throwaway page from the sample, with its 14 stops and its map. Put the map inside our page as an inner frame whose content travels in the page (`srcdoc`, or an address made at load). That keeps the page one file.

**Scripted part, opened from disk.** A short script drives Chrome, as `check.mjs` does, and also runs in the user's default browser. It passes when:

1. Prev, Next, ← →, the pips and outline rows move the map and the stop to the same stop.
2. The map's own keys, a plain click on its board, and a swipe cannot leave the two out of step.
   - Either the outer page blocks that input, or it follows the map and moves the stop to match.
   - The script makes 50 mixed actions. After each one, it compares the outer page's stop with the step the map shows. Each step's caption title is unique, so read the title; the map's address may not update inside a frame.
   - Every comparison must match.
3. A click on a block with code still opens chalk-talk's code panel, or that panel is deliberately turned off.
4. The map follows the page's light or dark.
5. The page makes no requests besides the map's fonts.

**Checked by eye, inside Obsidian.** The user runs this short list in a real note:

6. The embed shows the page.
7. Map and stop move together.
8. Keys work after one click into the page, and they do not trigger Obsidian commands.
9. One link form opens the page in the browser: a wikilink, or the plugin's button.

Inside Obsidian, the map may not update its address. That favours blocking the map's input over following it. If the checks inside Obsidian fail but the browser checks pass, the result is outcome 2, not a fallback to still images. Record the results in this spec, as the record-testing spec does under "Verified".

**Which result leads to which outcome.** The live map wins (decision 7).
- Checks 1–9 all pass: outcome 1. The live map, read inside the note. This is the default.
- Checks 1–5 pass in the browser, but 6–8 fail inside Obsidian (the embed does not show, Obsidian takes the keys, or the frame is too cramped to read): outcome 2. The live map, read in a browser tab opened from the note. Check 9 must pass for this.
- The live map fails checks 1–5 in the browser as well: outcome 3 (fallback 1).
- Fallback 1 fails too: outcome 4 (fallback 2).

**Fallback 1 (outcome 3): still images.** Use the still that `check.mjs` makes for each step, carried inside the page, with a highlight on the current part, as the mockup showed. The trial settles where the highlight's position comes from.
- The reader loses motion, packets (a still leaves some out), clicking a block to open its code, and the live proof view.
- The page grows by one image per stop, twice over for light and dark.
- The map still stays in view and moves with the stop.

Run the scripted checks on this fallback too.

**Fallback 2 (outcome 4), only if the live map and fallback 1 both fail: a simple map drawn by our own page** from the data file's nodes and edges.
- The reader loses chalk-talk's look and its layout checks.
- Arrows can still show the proof status from the build.
- The builder pays for a small layout engine.

## Constraints

- The skill lives at `skills/code-walkthrough/`, beside the others.
- It follows obsidian-vault's conventions: vault lookup, the config note, frontmatter, never overwrite, wikilinks.
- Every word written into the note and the page is plain and fast to read.
- It is read only on code repos.
  - Git runs with `GIT_OPTIONAL_LOCKS=0`.
  - No checkout, no stash, no `git worktree add`.
  - `gh` and Jira are read only.
- The user's model routing applies. The builder may split the reason search across cheaper subagents to cut cost.

## Behaviours worth testing

The plan covers how, the way this repo tests skills: pressure scenarios run by subagents before and after the skill is written, plus trigger tests. Worth testing:

1. **No invented reasons under pressure**, such as "refinement starts in ten minutes, just tell me why they did it". The skill still writes "not recorded", and any guess stays on a Guess line.
2. **Nothing written into the code repo** or onto an outside service, even when a handy path is suggested. If the user asks for it outright, the skill first says once that the page holds code and local paths.
3. **Says "not recorded"**, and keeps the question.
4. **States the time cost first.**
5. **Keeps to one journey**: it splits a big feature and offers the next part.
6. **Fires on its own phrases**, and not on chalk-talk's, work-chart's, repo-dossier's or frames'.
7. **Never passes a failing check by loosening it**, or by shortening code without declaring the left-out lines.
8. **Reports the three check results** in plain words.
9. **The planning offer**: at the start of planning a change to existing code, it offers once in one line with the time, and carries on with planning after a no.
10. **Points to an existing walkthrough** instead of offering a new one, and says when its files have changed.
11. **No offer** for brand-new code or a few-line change, and no second offer after a no.
12. **Never starts a run without a yes.**

## Repo changes

1. `skills/code-walkthrough/`: `SKILL.md`, the build script with its checks, and the page template.
2. `skills/obsidian-vault/references/property-schema.md`: add `code-walkthrough` to the `type` list, and a section for it.
3. `skills/obsidian-vault/templates/Config.md`: add `walkthroughs: Walkthroughs` under `folders`, with one bullet. vault-init creates every folder in that map, so it needs no change.
4. `README.md`:
   - add a row to the Skills table;
   - change "twenty-four" to "twenty-five";
   - `.claude-plugin/marketplace.json`: the plugin description says "Twenty-four skills"; change it to "Twenty-five" too;
   - add one paragraph on the chalk-talk dependency: where it is looked for, what happens without it, and the font request.
5. `docs/superpowers/baselines/code-walkthrough.md`: the scenarios and trigger tests.

There is no change to work-chart, repo-dossier or chalk-talk.

## Later versions

These all use the same data file and page format, so version 1 does not block them.

- **A batch of changes as a way in.** Start from a diff, a branch or a set of commits. Stops are marked added, changed or removed, as chalk-talk marks a PR. Removed code is quoted from the base commit.
- **A whole repo as a way in.** Pick the repo's main journeys and build one walkthrough each.
- **A repo-level note.** It collects every walkthrough's files and extend points into one note per repo, beside the repo dossier, which it links.
- **Drift re-check.** Compare the cited lines with today's code, mark the stops that changed, and offer a rebuild. Version 1 already checks by file during planning ("Planning: the offer"); this later version checks by line.

## Left to the builder

- Folder and file names inside the skill.
- The script language. Node is the natural fit.
- The exact styling, within the mockup's layout.
- Exact property names.
- How the note's outline is generated.
- How code is folded.
- The test scenario wording.
- The embed height. 900px is the starting point for the trial.
- Whether to ship a Base that lists walkthroughs by repo.
- The work-row wording.

## Open questions for the user

None remain.

## Verified 2026-11-12

The first trial (plan Task 1): 14 stops from the sample, map from chalk-talk 4f88ead.

- outcome: 1
- frame_method: srcdoc — the map page, with a style that hides its caption bar added before `</head>`, sits in the walkthrough page as a JSON string in a `<script type="application/json" id="map-page">` block, with every `<` written as a unicode escape. At load the page parses it, listens for the frame's `load`, then sets `frame.srcdoc`. After `chalk.ready` it calls the frame's `chalk.go(cur)`, and each later stop change calls the frame's `chalk.go(k)` directly.
- map_input: blocked — capture-phase listeners on the frame's window stop every key and every pointer event on the board. Left and right arrows call the page's own `go(cur ± 1)`. A tap passes only on a visible block that has code, so the code panel opens. There is no overlay.
- caption_bar: hidden — `<style>.bar{display:none!important}</style>` is added to the map page before `</head>` when the page is built.
- code_panel: kept
- theme_method: the page sets the frame's `documentElement.dataset.theme`, once after `chalk.ready` and on every toggle
- embed_height: 1100 (900px could be taller; the user viewed the embed at 1100px in the second run and it read well)
- open_link: button
- budget_ms: 30000
- Long titles: chalk-talk check on 14 steps, 0 errors (4 warnings).
- Browser: Google Chrome 157.0.8103.51; protocol P 50/50. It is the user's default browser and the same engine as the scripted run.
- Obsidian: two runs. Check 6 pass: the embed showed the page. Check 7 pass: the map and the stop moved together. Check 8 pass, in the second run: after one click into the page, ← and → moved the stop and the map, and Obsidian itself did not react. With the focus inside the map, → still moved both. Check 9 pass by the Embed HTML plugin's "open in external browser" button. The wikilink opened the page in a new tab inside Obsidian, not in the browser.
- Trial files: both runs' files removed on 2026-11-12.

Also found:

- `blob` failed checks 1–5 at both sizes when opened from disk: the frame's address is `blob:null/…`, the browser treats it as another site, and the page cannot reach it. Not tried inside Obsidian.
- `srcdoc` with input followed also passed checks 1–5 at both sizes. It is the spare.
- With input blocked, Escape and C do not reach the map, so the code panel closes by its close button or a second tap on the same block. The user confirmed it opens and closes inside Obsidian.
- The theme switch was not tried inside Obsidian. chalk-talk re-applies its own theme when the system's light or dark setting changes, which could override the page's.
- The 50 scripted actions drew no ← or → inside the map. A separate key check covered them: they moved page and map together, and the map's other keys moved nothing.
- A control run with input handling off matched 35 of 50, so protocol P does catch drift.

## Amended 2026-11-16

The final review of the whole branch found four places where the built skill differs from this spec (its finding I4). The user ruled on each on 2026-11-16. All four stay as built. The text above is unchanged. Where it disagrees with an item below, the item below wins.

- The offer rule for small changes. This overrides "Planning: the offer", under "When not to offer", the second bullet ("A change that stays within a few lines of one file."), and item 11 under "Behaviours worth testing" ("a few-line change"). The spec skips the offer for a small change. The build (`SKILL.md` line 40) skips it only when the change is brand-new code with nothing existing to walk through, or adds no behaviour (a reworded comment, a renamed variable, new wording for a label). A new rule, check or branch adds behaviour, "however few lines it takes", so the skill looks first whatever the size. The reviewer recommended keeping the build. Ruling: kept as built.
- Never copying outside the vault. This overrides item 2 under "Behaviours worth testing", whose second sentence ("If the user asks for it outright, the skill first says once that the page holds code and local paths.") reads as "warn, then comply". The build (`SKILL.md` line 10) writes output only to the vault. Asked outright for another place, the skill says once that the page holds code and local paths, "then build to the vault. A copy elsewhere is the user's to make." Ruling: kept as built.
- A single "why" answered in chat. This is an addition; the spec says nothing on it. The build (`SKILL.md` line 18) answers a single "why" about one choice in the code (one value, one rule, one call) in chat, by the rule in Reasons. No run, no file. The reviewer called it a sound addition. Ruling: kept as built.
- The description's planning trigger. This overrides the sentence under "Designer's calls" that begins "The skill's description must also carry the planning trigger:". The spec quotes: "when the user starts planning a change to existing code (brainstorming, plan mode, "let's plan X", picking up a ticket)". The build says "When the user plans to change or add to existing code ("let's plan X", picking up a ticket), use it at the start, alongside brainstorming or plan mode". It is broader ("or add to"). Brainstorming and plan mode are things it runs alongside, not triggers. The reviewer found it promises nothing the body fails to do. Ruling: kept as built, with no further trigger round. Two cases stay untested: "add to existing code" may catch a request such as "add a button", and "pick up KEY" may fire beside ticket-intake.

The shipped description (`SKILL.md` line 3), in full:

> Walk through one journey in real code so the user can explain and extend it. Each stop shows the actual lines and why, every reason quoted from its source or marked not recorded. One page in the vault plus a short note. When the user plans to change or add to existing code ("let's plan X", picking up a ticket), use it at the start, alongside brainstorming or plan mode; it points to a walkthrough or offers one, and builds only on a yes. Also use whenever the user says "code walkthrough of X", "deep walkthrough of X", "I need to be able to explain X", "help me understand X well enough to extend it", "how was X built, so we can extend it", or "prep me to explain X in refinement" with a feature or code named. Not for "prep me for refinement" with nothing named. "How does X work", "walk me through" and explaining a PR are chalk-talk's; "explain that diff" is work-chart's; "what does this repo do" is repo-dossier's; "explain this to my team" is frames'. An unrecorded reason said as fact is worse than none.
