---
name: ticket-intake
description: Check a Jira ticket against the code and the vault before starting work on it. Use whenever the user says "pick up KEY", "start on KEY", "look at KEY", "what's blocking KEY", "can this be built as written", "intake", or pastes a Jira issue URL. A key mentioned in passing is daybook's job. A ticket that cites a file that is not where it says, or a value nothing stores, costs a day of discovery when nobody checks first.
---

# Ticket intake

Follow the obsidian-vault skill's conventions. Reads Jira, never writes it: no comments, transitions, edits, links, or assignments, even when asked to "post" or "move". Drafts go in the note for the user to post.

Site: config `jira_site` if present. Otherwise list accessible sites; one site, use it and add `jira_site` to config after the user confirms; more than one, ask once and save the answer.

## Three checks, in this order

1. **Jira.** Read the issue with description, comments, issue links, subtasks, parent, sprint, estimate, and changelog. One JQL for siblings under the same parent. Note: each bullet under an "Open Questions" heading (owner: the reporter, unless the ticket names someone); open subtasks; in a sprint with no estimate; a comment that asks a question with no later reply; a prior block, reopen, or repeated description edits. Hold the siblings until step 3.
2. **Vault, frontmatter first.** Notes with the key in `jira`: handoffs (read Gated), open questions, open conflicts, decisions (accepted is a constraint, proposed is unsettled), research notes. Meeting notes whose `topics` or body match the ticket's nouns (screen, field, and feature names from its summary and scope table): quote the sentence. Repo dossiers matching the ticket's names or paths: clone path, build notes, owners. Glossary misses. `Meta/Intake Checks.md` if it exists: run each line as written.
3. **Code, locate only.** No builds, installs, test runs, or clones. Every yes/no is about the branch the ticket describes — the clone's remote default branch — not whatever the working tree is checked out on. When the checkout is on another branch, read the file at that branch (`git show origin/<default>:<path>`), name that branch and sha in the Summary's checked line, and put work that exists only on a local branch in Facts established, never in the `Actually` column. For every path or class the ticket cites: which local clone holds it, whether it exists, and whether that clone is the system the ticket says it is. For every service, module, field, table, or column it says exists: present, present but empty, or absent, per repo. For every value it says is seeded, copied, or available: a stored column, computed on read, or nothing. Then recent commits and TODO lines on the resolved paths, and whether each clone is behind its remote default branch, judged from local refs without fetching. Now take the siblings one at a time and mark each: which claim found false it repeats, or clean. Then one JQL text search per false claim, over the whole project and not just the epic — the tickets that repeat a wrong file reference are often not siblings at all. The note names every key that repeats one.

Every claim about code gets one mark: **yes**, **no**, or **couldn't check**. Evidence in one form: the clone's name, one space, the path from the repo root, a colon and the line — `phenix.ui apps/appointments/src/lib/appointmentDetailFields.ts:217`. Every citation carries all three, including the second and third in a cell that already named the repo. Never a bare filename, never a `...` in the path, never a bare `:217`, never `repo/path`.

## The ticket note

`KEY Short title.md` in `folders.tickets` (key missing: use `Tickets`, create it, tell the user to add the key). Template: vault templates folder first, else the handoff skill's `templates/Ticket.md`. On create: `type: ticket`, `status: draft`, `key`, `epic` from the parent, `owner` as the assignee's person note (bare stub if none), `jira` with the key first, then the epic, then every linked or sibling key that produced a finding. Existing note: only `jira` changes. No new frontmatter keys; the check date goes in the body.

Write for a reader with 60 seconds. Everyday words. The words premise, sweep, verdict, provenance, and routing do not appear in the note.

First line under the title, one sentence: "Can be built as written." or "Cannot be built as written: " followed by the two or three reasons.

Sections in this order. Summary is in the template; fill it. Insert 2 to 4 after it. Leave 5 to 7 where the template puts them.

1. **Summary** — one short paragraph: what, for whom, how many acceptance criteria, status, reporter, assignee, sprint. Then one line: `Checked YYYY-MM-DD against <repo> <branch> <sha>, <repo> <branch> <sha>.`
2. **What the ticket says vs what's there** — a table with columns `Ticket says | Actually | OK?`. `OK?` is yes, no, or couldn't check. Every piece of evidence is written out in full, `repo path:line`, including a second line in the file the row just cited — never `:152` on its own. Replaced whole on every run. Nothing to check: one row saying so.
3. **Blockers** — a checklist of plain sentences, no category tags, each ending with who or what clears it, as a wikilink where a note exists. Order: false claims that stop the build, then Jira findings, then vault contradictions, then code readiness. Five in the list; the rest on one line starting `Also:`.
4. **Draft comment** — one blockquote addressed to the reporter: the first-line sentence, each false claim with one line of evidence, the questions that need an answer. No proposed re-scope.
5. **Handoffs** — untouched.
6. **Facts established** — short lines, appended and deduped: repos touched with clone paths; each named field and where its value comes from; siblings sharing a false claim; terms the vault does not know; one line per meeting note whose body names the ticket's subject, quoting the sentence.
7. **Open items** — housekeeping that does not stop the build, one line each: close the duplicate and what its own unanswered question asks, any question on this ticket or a linked one that nobody answered and who owes it, fix sibling wording, add an estimate, no dossier for a touched repo.

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
| "The comments already settle this", "the re-scope already happened" | Comments answer questions; they do not move a file into the repo the ticket claims, and a scope agreed in a thread is not the code |
| "It's Done, so there's nothing to check" | Status is not evidence. Run the three checks anyway and let the note say what shipped against what the ticket asked for |
| Asking whether to write the note | The note is the deliverable. Write it, then say in chat what it says |
| The answer in chat, or a line in the daily note, instead of the note | Both are pointers. Tomorrow the reader opens the ticket note, not this transcript |
| Calling a finding non-blocking, so it needs no note | Blocking decides where it sits in the list, not whether it gets written down |
| Treating the description's Open Questions as already answered | An Open Question closes when someone answers it on the ticket, not when a nearby comment sounds like agreement |
| One ask because one person answers them all | One note per question; the same person can owe five answers, and four of them get lost in a single ask |
| Category tags and skill words in the Blockers list | The reader has 60 seconds; "the ticket cites a file that is in USCS-BE, not V2" needs no tag |
| Building or installing to be thorough | Locate only; a build prompt or a missing registry turns a two-minute check into an afternoon |
| A status paragraph instead of the note's sections | The next reader greps for the table and the Blockers list; prose has neither |
