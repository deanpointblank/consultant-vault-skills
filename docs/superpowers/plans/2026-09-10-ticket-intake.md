# ticket-intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `ticket-intake` skill to the `consultant-vault` plugin that checks a Jira ticket against the code and the vault before work starts, and writes what it finds into the ticket's note in plain words.

**Architecture:** One `SKILL.md` under `skills/ticket-intake/`, run inline in the main session. It reads Jira through the Atlassian MCP, scans vault frontmatter, resolves the ticket's claims against local clones, and fills the existing `type: ticket` note. Tested with the repo's baseline harness: scenario files, control reps without the skill, reps with the skill, scored from vault diffs.

**Tech Stack:** Markdown skill files (Claude Code plugin), Atlassian MCP (`mcp__atlassian__getJiraIssue`, `mcp__atlassian__searchJiraIssuesUsingJql`, `mcp__atlassian__getAccessibleAtlassianResources`), Obsidian vault as plain markdown, zsh, `general-purpose` subagents for test reps.

**Spec:** `docs/superpowers/specs/2026-09-10-ticket-intake-design.md`

## Global Constraints

- Jira is read-only: the skill never comments, transitions, edits, links, or assigns, "even when asked to 'post' or 'move'".
- Code checks are locate only: "No builds, no installs, no test runs, no clones."
- Plain language: "A reader with 60 seconds learns whether to start and why not. No skill-internal words in any note." Banned in notes: premise, sweep, verdict, provenance, routing.
- Evidence has one form only: `repo path:line`.
- No new frontmatter keys and no new note type. "The check date and the commits read are a line in the body, not properties."
- Every skill-written note follows the obsidian-vault skill's conventions (frontmatter per the property schema, quoted wikilinks, ISO dates).
- Testing follows `docs/superpowers/baselines/README.md`: work on a vault copy, fresh subagent per rep, score from `diff -rq` and by reading files, never from the agent's summary. Three reps per variant, matching the 2026-09-09 batch.
- Iron law from writing-skills: the control reps run and are scored before a line of `SKILL.md` is written.
- Commits end with the attribution lines given in the session's system reminder.
- Work happens on branch `ticket-intake` (already created; the spec is committed there as 293bc04).

---

### Task 1: Scenario files for both tests

**Files:**
- Create: `docs/superpowers/baselines/ticket-intake.md`
- Modify: `docs/superpowers/baselines/README.md` (scenario table, after the `clipper-local` row)

**Interfaces:**
- Produces: the vault-copy recipe (shell block) and the two prompts every later task reuses verbatim; check ids `T1`–`T13` and `B1`–`B4` that the results doc and the skill's refactor step refer to.

- [ ] **Step 1: Pick the "buildable as written" ticket for scenario B**

Run one JQL through the Atlassian MCP (cloudId `uscold.atlassian.net`):

```
parent = PFD-65246 AND status in (Done, Closed) AND description ~ "java" ORDER BY created DESC
```

with `fields: ["summary","description","status"]`, `maxResults: 20`. Choose the issue with the shortest description that cites at least one file path or class name. Tell the user the key and one-line summary and ask for a yes; if they name a different key, use theirs. Record the chosen key as `BKEY` in the scenario file's Fixtures section.

- [ ] **Step 2: Write the scenario file**

Create `docs/superpowers/baselines/ticket-intake.md`:

````markdown
# Baseline: ticket-intake

**Item covered:** a `ticket-intake` skill.

**Failure we are hunting:** omission and wrong shape. Asked to pick up a ticket, a fresh
agent reads the description, maybe opens the cited files, and says "looks buildable" or
starts building. It does not resolve every cited path to the repo it actually lives in, does
not check whether the values the ticket names are stored anywhere, does not read the
duplicate link, does not turn the ticket's own Open Questions into question notes, and
does not check what the vault already says about the subject. What it writes, if anything,
is a status paragraph, not a ticket note a reader can act on in 60 seconds.

## Fixtures

Scenario A uses PFD-65947 with the vault rolled back to the morning of 2026-09-09, before
the hand-written review. Jira cannot be rolled back: the ticket is In Progress and carries
comments dated 2026-09-09 and 2026-09-10. The checks below are about the description's
claims, which are unchanged. A rep that says "already settled in the comments" and does not
resolve the cited paths fails T1.

Scenario B uses `BKEY` = <key chosen in Task 1 step 1>, a Done story under PFD-65246 that
cites real files and was built as written.

Repos the checks need on disk (paths from the repo dossiers in the copy): `USCS-BE`,
`phenix.appointments`, `phenix.ui`. Do not fetch or check out anything in them during a rep.
T1–T4 are stated against `origin/main` of each repo at the time this file was written; record
the three SHAs here with `git -C <clone> rev-parse origin/main` so a later rep on a moved clone
can be judged against the same code:

- USCS-BE: <sha>
- phenix.appointments: <sha>
- phenix.ui: <sha>

### Vault copy

```bash
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/intake-$(date +%s)
mkdir -p "$RUN" && cp -R "$SRC" "$RUN/vault"
cd "$RUN/vault"
# drop every note that names the ticket or its follow-on story, except the ones edited below
grep -rlE 'PFD-65947|PFD-66519' --include='*.md' . \
  | grep -vE '^\./Daily/|Sprint To-Do Triage|People/Rob Park|Meta/Legacy UAT' \
  | while IFS= read -r f; do rm -v "$f"; done
# strip the lines that name them from the notes we keep
for f in 'Sprint To-Do Triage - 2026-09-09.md' Daily/2026-09-09.md Daily/2026-09-10.md \
         'People/Rob Park.md' 'Meta/Legacy UAT Environment.md'; do
  [ -f "$f" ] && sed -i '' -E '/PFD-65947|PFD-66519/d' "$f"
done
rmdir Tickets 2>/dev/null || true
grep -rlE 'PFD-65947|PFD-66519' --include='*.md' . && echo "STILL PRESENT" || echo "clean"
export OBSIDIAN_VAULT="$RUN/vault"
```

The 2026-09-04 meeting note stays; it calls the ticket "front-end only" without naming the
key. That is the contradiction fixture for T8.

## Prompt A

```
IMPORTANT: This is a real scenario. Act.

Pick up PFD-65947. Sprint's tight, so tell me straight whether I can start building it as
written, and if not, what's in the way and who I need to ask.
```

## Prompt B

```
IMPORTANT: This is a real scenario. Act.

Pick up BKEY. Sprint's tight, so tell me straight whether I can start building it as
written, and if not, what's in the way and who I need to ask.
```

## Observable checks, scenario A

| # | Check | Predicted baseline |
|---|---|---|
| T1 | Both "V2" reference paths (`DeliveryTicket.java`, `Appointment.java` under `commonservices/`) are reported as living in `USCS-BE`, with `repo path:line` evidence | fail |
| T2 | "Dispatch service" reported as absent from every V2 repo and every dossier | partial |
| T3 | Estimated and Shipped Gross Weight reported as having no stored column, computed on read; names `ViewApptDetailsServiceImpl` or a `*WeightCalculator` | partial |
| T4 | V2 reported as having no column, DTO, or API field for the four values, and `appointmentDetailFields.ts` as hardcoding blanks | fail |
| T5 | PFD-65891 reported as a duplicate open on both sides, and its inbound ask noted as unaddressed | partial |
| T6 | The description's two Open Questions become two open-question notes with `owner: "[[Rob Park]]"`, linked from the ticket note | fail |
| T7 | PFD-66392, PFD-66393, PFD-66415 listed as repeating the "Dispatch service" claim | fail |
| T8 | A conflict note pairing the ticket note with the 2026-09-04 meeting note ("front-end only" vs seeding path), owner Rob Park | fail |
| T9 | `Tickets/PFD-65947 <title>.md` exists with `type: ticket`, `key`, `epic: PFD-65246`, `status: draft`, and its first body line is one verdict sentence | fail |
| T10 | The note contains none of: premise, sweep, verdict, provenance, routing; every evidence string matches `^[A-Za-z0-9._-]+ \S+:\d+` | fail |
| T11 | Zero Jira writes: no `addComment`, `transition`, `editJiraIssue`, `createIssueLink` calls in the transcript | pass |
| T12 | Zero builds, installs, or clones: no `mvn`, `gradle`, `npm install`, `pnpm install`, `git clone` in the transcript | pass |
| T13 | `Daily/2026-09-09.md` (or today's) gains one log line linking the ticket note, and `PFD-65947` in its `jira` list | partial |

## Observable checks, scenario B

| # | Check | Predicted baseline |
|---|---|---|
| B1 | The ticket note's first body line is exactly "Can be built as written." | fail |
| B2 | Blockers section is empty or says "none" | partial |
| B3 | Nothing invented: every "no" in the table cites a path that exists on disk at the cited line | pass |
| B4 | Zero Jira writes (as T11) | pass |

## Rationalizations captured (fill during control reps)

| Rep | Verbatim | Check it excuses |
|---|---|---|
| | | |
````

Replace `<key chosen in Task 1 step 1>`, both `BKEY` placeholders in the prompts, and the three `<sha>` placeholders with real values before saving.

- [ ] **Step 3: Add the row to the harness README**

In `docs/superpowers/baselines/README.md`, after the `clipper-local` row of the scenario table, add:

```markdown
| [ticket-intake.md](ticket-intake.md) | `ticket-intake` | Omission and wrong shape: cited paths not resolved, stored-vs-computed not checked, ticket note absent or a status paragraph |
```

- [ ] **Step 4: Verify the vault-copy recipe runs clean**

Run the shell block from the scenario file once. Expected last line: `clean`. Expected: `ls "$RUN/vault/Tickets"` fails with "No such file or directory". Expected: `grep -c "front-end only" "$RUN/vault/Meetings/2026-09-04"*` prints 1 or more (adjust the glob to the meeting note's real filename if it differs; find it with `grep -rl "front-end only" "$RUN/vault"`).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/baselines/ticket-intake.md docs/superpowers/baselines/README.md
git commit -m "Add ticket-intake baseline scenarios

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 2: RED — control reps without the skill

**Files:**
- Create: `docs/superpowers/baselines/results/ticket-intake-<YYYY-MM-DD>.md` (today's date)
- Modify: `docs/superpowers/baselines/ticket-intake.md` (rationalizations table)

**Interfaces:**
- Consumes: the vault-copy recipe, Prompt A, Prompt B, checks T1–T13 and B1–B4 from Task 1.
- Produces: per-check pass counts and verbatim rationalizations that Task 3 writes the skill against.

- [ ] **Step 1: Run three control reps of scenario A**

For each rep: build a fresh vault copy with the recipe, then dispatch one `general-purpose` agent whose entire prompt is Prompt A, preceded by one line: `OBSIDIAN_VAULT is set to <the copy's path>. The consultant-vault plugin is installed.` Do not mention ticket-intake, the checks, or the expected shape. Let the agent finish.

- [ ] **Step 2: Score each rep from the copy, not the summary**

For each rep:

```bash
diff -rq "$SRC" "$RUN/vault" | sort
```

Open every changed or new file. Fill one row per check in the results doc using the table below. For T11 and T12, search the agent's transcript output for the tool names and commands listed in the check.

- [ ] **Step 3: Run three control reps of scenario B and score them the same way**

Same procedure with Prompt B and checks B1–B4.

- [ ] **Step 4: Write the results doc**

Create `docs/superpowers/baselines/results/ticket-intake-<date>.md`:

```markdown
# ticket-intake — control run, <date>

Three reps per scenario, `general-purpose` agents, fresh context, existing plugin installed,
no ticket-intake skill. Scored from the vault copies.

## Scenario A (PFD-65947)

| Check | Result | Notes |
|---|---|---|
| T1 | n/3 | |
| … | | |
| T13 | n/3 | |

## Scenario B (BKEY)

| Check | Result | Notes |
|---|---|---|
| B1 | n/3 | |
| … | | |

## Verbatim

One line per shortcut, quoted exactly, with the rep and the check it excuses.

## Checks the control already passes

List any check at 3/3. Per the harness, the skill does not address these.
```

Copy every verbatim line into the scenario file's "Rationalizations captured" table as well.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/baselines/results/ticket-intake-*.md docs/superpowers/baselines/ticket-intake.md
git commit -m "Record ticket-intake control run

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 3: GREEN — write the skill

**Files:**
- Create: `skills/ticket-intake/SKILL.md`

**Interfaces:**
- Consumes: the results doc from Task 2. Any check the control passed 3/3 is left out of the skill; any verbatim rationalization gets a row in the Common mistakes table.
- Produces: the skill text below. Section names in the ticket note (`What the ticket says vs what's there`, `Blockers`, `Draft comment`) are what Task 4's checks grep for.

- [ ] **Step 1: Write `skills/ticket-intake/SKILL.md`**

Start from this text. Then, before saving, edit the Common mistakes table so every verbatim rationalization from Task 2 has a row, and delete any instruction whose check the control passed 3/3.

````markdown
---
name: ticket-intake
description: Check a Jira ticket against the code and the vault before starting work on it. Use whenever the user says "pick up KEY", "start on KEY", "look at KEY", "what's blocking KEY", "can this be built as written", "intake", or pastes a Jira issue URL. A key mentioned in passing is daybook's job. A ticket that cites a file that is not where it says, or a value nothing stores, costs a day of discovery when nobody checks first.
---

# Ticket intake

Follow the obsidian-vault skill's conventions. Reads Jira, never writes it: no comments, transitions, edits, links, or assignments, even when asked to "post" or "move". Drafts go in the note for the user to post.

Site: config `jira_site` if present. Otherwise list accessible sites; one site, use it and add `jira_site` to config after the user confirms; more than one, ask once and save the answer.

## Three checks, in this order

1. **Jira.** Read the issue with description, comments, issue links, subtasks, parent, sprint, estimate, and changelog. One JQL for siblings under the same parent. Note: each bullet under an "Open Questions" heading (owner: the reporter, unless the ticket names someone); Duplicate or Blocks links unresolved on both sides, and anything the other issue asks for that this one ignores; open subtasks; in a sprint with no estimate; a comment that asks a question with no later reply; a prior block, reopen, or repeated description edits. Hold the siblings until step 3.
2. **Vault, frontmatter first.** Notes with the key in `jira`: handoffs (read Gated), open questions, open conflicts, decisions (accepted is a constraint, proposed is unsettled), research notes. Meeting notes whose `topics` or body match the ticket's nouns (screen, field, and feature names from its summary and scope table): quote the sentence. Repo dossiers matching the ticket's names or paths: clone path, build notes, owners. Glossary misses. `Meta/Intake Checks.md` if it exists: run each line as written.
3. **Code, locate only.** No builds, installs, test runs, or clones. For every path or class the ticket cites: which local clone holds it, whether it exists, and whether that clone is the system the ticket says it is. For every service, module, field, table, or column it says exists: present, present but empty, or absent, per repo. For every value it says is seeded, copied, or available: a stored column, computed on read, or nothing. Then recent commits and TODO lines on the resolved paths, and whether each clone is behind its remote default branch. Now list the siblings that repeat a claim found false.

Every claim about code gets one mark: **yes**, **no**, or **couldn't check**. Evidence in one form: `repo path:line`.

## The ticket note

`KEY Short title.md` in `folders.tickets` (key missing: use `Tickets`, create it, tell the user to add the key). Template: vault templates folder first, else the handoff skill's `templates/Ticket.md`. On create: `type: ticket`, `status: draft`, `key`, `epic` from the parent, `owner` as the assignee's person note (bare stub if none), `jira` with the key first, then the epic, then every linked or sibling key that produced a finding. Existing note: only `jira` changes. No new frontmatter keys; the check date goes in the body.

Write for a reader with 60 seconds. Everyday words. The words premise, sweep, verdict, provenance, and routing do not appear in the note.

First line under the title, one sentence: "Can be built as written." or "Cannot be built as written: " followed by the two or three reasons.

Sections in this order. Summary is in the template; fill it. Insert 2 to 4 after it. Leave 5 to 7 where the template puts them.

1. **Summary** — one short paragraph: what, for whom, how many acceptance criteria, status, reporter, assignee, sprint. Then one line: `Checked YYYY-MM-DD against <repo> <branch> <sha>, <repo> <branch> <sha>.`
2. **What the ticket says vs what's there** — a table with columns `Ticket says | Actually | OK?`. `OK?` is yes, no, or couldn't check. Replaced whole on every run. Nothing to check: one row saying so.
3. **Blockers** — a checklist of plain sentences, no category tags, each ending with who or what clears it, as a wikilink where a note exists. Order: false claims that stop the build, then Jira findings, then vault contradictions, then code readiness. Five in the list; the rest on one line starting `Also:`.
4. **Draft comment** — one blockquote addressed to the reporter: the first-line sentence, each false claim with one line of evidence, the questions that need an answer. No proposed re-scope.
5. **Handoffs** — untouched.
6. **Facts established** — short lines, appended and deduped: repos touched with clone paths; each named field and where its value comes from; siblings sharing a false claim; terms the vault does not know.
7. **Open items** — housekeeping that does not stop the build, one line each: close the duplicate, fix sibling wording, add an estimate, no dossier for a touched repo.

Repeat runs: a blocker still found keeps its checkbox (match by wikilink or evidence, else by the sentence); one no longer found becomes `[x]` with ` — cleared YYYY-MM-DD`; new ones append; nothing is deleted.

## What else gets created

Look first for an existing question or conflict note carrying the key that covers the point; link it instead of creating another.

- A question only a person can answer (an Open Question in the description; a false claim that needs a ruling, not a fix) → open-questions skill, one note per distinct question, owner the reporter unless the ticket names someone. Same answerer and same subject: one note.
- The ticket contradicts a meeting note, an accepted decision, or a verified finding → reconcile skill; `sources` lists the ticket note first and the contradicted note second; owner the reporter.
- Reporter or assignee with no person note → bare stub, per the people skill.
- A false claim that only needs a fix, siblings, unknown terms, a touched repo with no dossier → lines in the note, no new note.
- Daily note: `- HH:MM intake [[KEY Title]]: N blockers`, and the key into its `jira` list.

## Chat summary

Five lines: the first-line sentence; the top three blockers; what was created, as counts, and the first action ("post the draft comment" or "start building") with the note link.

## When something is missing

One line in chat each. No Atlassian MCP or the site is unreachable: say so; if the user pastes the ticket text, run checks 2 and 3 on it and write "Jira not checked" in the Summary. Key not found: stop. No vault or no config: point at vault-init and stop. A dossier names a repo with no local clone: a Blockers line saying to clone it, and that repo's code checks are skipped. The ticket cites nothing checkable: one table row saying so; everything else still runs.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Reading the ticket and calling it buildable | A ticket can read cleanly and cite files that live in the other system, or values nothing stores |
| Trusting a cited path because it looks right | Resolve it and name the repo it is actually in |
| "The comments already settle this" | Comments answer questions; they do not move a file into the repo the ticket claims |
| Category tags and skill words in the Blockers list | The reader has 60 seconds; "the ticket cites a file that is in USCS-BE, not V2" needs no tag |
| Posting the comment to save a step | The skill reads Jira only; the draft is in the note |
| Building or installing to be thorough | Locate only; a build prompt or a missing registry turns a two-minute check into an afternoon |
| A status paragraph instead of the note's sections | The next reader greps for the table and the Blockers list; prose has neither |
````

- [ ] **Step 2: Check the frontmatter and length**

```bash
head -4 skills/ticket-intake/SKILL.md | wc -c    # must be under 1024
wc -w skills/ticket-intake/SKILL.md              # aim under 1000; the recipe is the bulk
claude plugin validate .
```

Expected: validate reports no errors.

- [ ] **Step 3: Commit**

```bash
git add skills/ticket-intake/SKILL.md
git commit -m "Add ticket-intake skill

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 4: GREEN reps, then REFACTOR

**Files:**
- Modify: `docs/superpowers/baselines/results/ticket-intake-<date>.md` (GREEN section)
- Modify: `skills/ticket-intake/SKILL.md` (loophole fixes only)

**Interfaces:**
- Consumes: the skill from Task 3; the recipe, prompts, and checks from Task 1.
- Produces: pass counts per check with the skill; a skill whose failing checks have each been addressed by a specific edit.

- [ ] **Step 1: Run three reps of scenario A with the skill**

Same as Task 2 step 1, with one extra line at the top of the agent prompt, before Prompt A:

```
Read and follow /Users/deanbetty/Code/consultant-vault-skills/skills/ticket-intake/SKILL.md for this task. Plugin skills it names (obsidian-vault, open-questions, reconcile, people, daybook) are installed.
```

- [ ] **Step 2: Score from the copies**

Same as Task 2 step 2. Add a `## GREEN, scenario A` section to the results doc with the same table shape. For T10, run:

```bash
grep -inE 'premise|sweep|verdict|provenance|routing' "$RUN/vault/Tickets/"*.md
```

Expected: no output.

- [ ] **Step 3: Run three reps of scenario B with the skill and score them**

Same procedure with Prompt B. Add `## GREEN, scenario B`.

- [ ] **Step 4: Refactor — one edit per failing check**

For every check under 3/3 in GREEN: quote the rep's exact wording in the results doc, then make one targeted edit to `SKILL.md`. Form follows the failure: a missing element becomes a required slot in the note recipe; a wrong shape becomes a more exact recipe line; a skipped rule becomes a row in Common mistakes with the verbatim excuse. Re-run only the reps for the failing scenario (three) and re-score. Repeat until every check is 3/3 or the results doc says why a check is dropped.

- [ ] **Step 5: Commit**

```bash
git add skills/ticket-intake/SKILL.md docs/superpowers/baselines/results/ticket-intake-*.md
git commit -m "ticket-intake: GREEN run and loophole fixes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 5: Contract and docs updates

**Files:**
- Modify: `skills/obsidian-vault/templates/Config.md` (folders map and explanation list)
- Modify: `README.md` (skills table, after the `time-logging` row; the "seventeen" count in the Install section)
- Modify: `.claude-plugin/marketplace.json` (plugin description)

**Interfaces:**
- Consumes: nothing from earlier tasks beyond the skill's existence.
- Produces: `folders.tickets` and `jira_site` in the shipped config so vault-init scaffolds the folder and the skill finds the site.

- [ ] **Step 1: Config template**

In `skills/obsidian-vault/templates/Config.md`, add `  tickets: Tickets` to the `folders` map directly after `  conflicts: Conflicts`, and add a top-level `jira_site:` line (empty value) directly after `timezone: America/New_York`. In the explanation list below the frontmatter, add two bullets after the `timezone` bullet:

```markdown
- `folders.tickets` — ticket notes, handoffs, and time-logging drafts. Skills that wrote to `Tickets` before this key existed keep working; add the key so they stop telling you to.
- `jira_site` — optional. The Atlassian site skills read Jira from, e.g. `acme.atlassian.net`. ticket-intake fills it in the first time you confirm a site.
```

- [ ] **Step 2: README**

Add this row to the skills table after the `time-logging` row:

```markdown
| `ticket-intake` | Checks a Jira ticket against the code and the vault before work starts: what it says vs what's there, blockers with owners, a draft comment. Never writes Jira. |
```

In the Install section, change "bundles all seventeen skills" to "bundles all eighteen skills".

- [ ] **Step 3: Marketplace description**

In `.claude-plugin/marketplace.json`, replace the plugin `description` value with:

```
Run a consulting engagement out of an Obsidian vault. Eighteen skills covering capture (Granola meeting sync, daybook, open questions, clippings, ticket intake), structure (repo dossiers, glossary, people, decisions, tickets and handoffs), and synthesis (meeting trends, weekly status, time logging, reconciliation, vault hygiene), built on a shared config and property-schema contract.
```

- [ ] **Step 4: Validate**

```bash
claude plugin validate .
python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))" && echo json ok
grep -c 'tickets: Tickets' skills/obsidian-vault/templates/Config.md   # expect 1
```

- [ ] **Step 5: Commit**

```bash
git add skills/obsidian-vault/templates/Config.md README.md .claude-plugin/marketplace.json
git commit -m "Add tickets folder and jira_site to config; document ticket-intake

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
```

---

### Task 6: Trigger test and merge

**Files:**
- Modify: `docs/superpowers/baselines/results/ticket-intake-<date>.md` (trigger section)

**Interfaces:**
- Consumes: everything committed on `ticket-intake`.
- Produces: a branch ready to merge to `main`, with the trigger result recorded.

- [ ] **Step 1: Ask the user to reinstall the plugin from the checkout**

The user runs, in Claude Code:

```
/plugin marketplace add /Users/deanbetty/Code/consultant-vault-skills
/plugin install consultant-vault@consultant-vault-skills
```

then opens a fresh session in any client repo and types only: `pick up PFD-65947`. Do not name the skill. The test passes if the session's first actions are a Jira read and a vault scan, and the reply's first line is the verdict sentence.

- [ ] **Step 2: Record the result**

Add a `## Trigger test` section to the results doc: the date, the exact prompt typed, whether the skill fired, and the first line of the reply. If it did not fire, add the phrase the user typed to the description's trigger list, re-run steps 1 and 2 once, and record both attempts.

- [ ] **Step 3: Commit and hand the branch back**

```bash
git add docs/superpowers/baselines/results/ticket-intake-*.md skills/ticket-intake/SKILL.md
git commit -m "ticket-intake: trigger test result

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018cqr7cKvpnymXVwzGgLrZ2"
git log --oneline main..ticket-intake
```

Then use superpowers:finishing-a-development-branch to decide between merging to `main` and opening a pull request.
