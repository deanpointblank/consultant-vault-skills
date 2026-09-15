---
name: gap-stories
description: Work out and draft the stories that unblock a Jira ticket that ticket-intake found cannot be built as written, and create approved ones in Jira. Use whenever the user says "fill the gaps for KEY", "what stories do we need to unblock KEY", "bridge the gap", "what tickets are missing for KEY", "draft the missing stories", or "create G2" / "create G1 and G3". "What's blocking KEY" and "can this be built as written" are ticket-intake's. A list of blockers says what is wrong, not which ticket fixes it; without a search first, the board gets a second copy of work it already holds.
---

# Gap stories

Follow the obsidian-vault skill's conventions. A **gap** is one missing piece that stops the build; several blockers can share one. For each gap, find a ticket that already covers it, and draft the rest in one note. Jira gets only what the user approves by number in this session: a new story, and links from it. Everything else is drafted text for the owner of the ticket it touches. Site: config `jira_site`, by ticket-intake's rule.

Filling a gap means naming the ticket that fills it. This skill writes no code and runs no code checks. The note is the deliverable: write it in this turn, then say in chat what it says. Never ask which of two jobs is meant, and never offer to draft later.

## Start from the intake note

The intake note is `KEY *.md` with `type: ticket` in `folders.tickets` (key missing: `Tickets`). Run ticket-intake first when there is no intake note, or when the note's first line under the title is not a one-sentence result. All the evidence comes from that note.

When the Jira ticket's `updated` date is a later day than the note's `Checked YYYY-MM-DD` line, say so in chat and in the Summary, and work from the note as it stands. Running intake again needs the client repos and rewrites the note this skill only adds one line to; do that only when the user asks for it.

If the intake note says "Can be built as written", say so in chat and stop. With no gap note, write nothing. With one, set every gap not yet done to `done YYYY-MM-DD` and its first line to "Can be built as written since YYYY-MM-DD."

## Find the gaps

Candidates: each unticked line under Blockers, each item on its `Also:` line, and each `no` row in "What the ticket says vs what's there". Candidates that one fact would clear together are one gap, including a blocker that is the open question another blocker waits on. Name blockers by number (1 to 5), `Also:` items by a few words, and rows by their first words.

First run: number the gaps G1, G2, … in order of the lowest blocker number each clears; gaps that clear only `Also:` items or rows come after, in note order. A number never changes and is never reused. A gap found on a later run takes the next free number.

## Look for tickets that already cover each gap

Three places for every gap, gaps waiting on a ruling included. Each search is one line in `Tickets searched`, listing every key it returned, including searches that found nothing.

1. **The epic's children.** One JQL, `parent = <epic>`. Read each summary and description. The line lists every child key.
2. **The whole project.** One JQL per gap: `project = <project> AND summary ~ "<words>" AND statusCategory != Done`. The words are ANDed, so use two to four plain nouns for the thing the gap turns on, and leave version and product words out: one extra word loses a real hit. Words the source ticket's own summary uses match it and everything near it; a search that returns half the epic is too general, so narrow it and search again.
3. **Earlier vault proposals.** Notes with `type: proposal` whose `jira` holds the key or the epic. Then grep every `type: proposal` note's body for the key and the gap's nouns.

A match that covers the whole gap makes it a `close`. A match that covers part of it covers that part only: the rest becomes its own gap with the next free number, drafted from what the matched ticket leaves undone. A gap waiting on a ruling records its match and splits only once the ruling lands.

For example: a gap that waits on a ruling and whose search matched KEY keeps KEY in its Existing ticket cell, keeps its number, and stays waiting. When the ruling lands, the part KEY covers becomes a `close`, and the part KEY does not cover becomes a new gap with the next free number.

## One kind per gap

| Kind | When | What gets drafted |
|---|---|---|
| `new` | No ticket covers it | A story |
| `split KEY` | Part of KEY's scope moves into a new story | A story, plus one line for KEY's owner naming the section to remove |
| `re-scope KEY` | KEY exists, but its description is wrong | The replacement description, for KEY's owner |
| `close KEY` | Another ticket already covers it, whole or in part | One line for KEY's owner naming that ticket and the part KEY still carries |
| `link fix` | A Jira link is wrong | The link to remove or add, and why, for the owner of the ticket that carries it |
| `waiting on a ruling` | Its shape depends on an open question | Nothing. The gap links the question note |

An open question is a `type: question` note with `status: open`, or a question in the intake note with no note yet. Create that note through open-questions, one note per question. A question that already has a note is linked, never edited: only the person who owes the answer answers it. When the question note says `status: answered`, draft the gap from its answer.

## The gap note

`KEY Gap Stories.md` in `folders.tickets` (key missing: use `Tickets`, create it, tell the user to add the key). Frontmatter: `type: proposal`, `client`, `created`, `status: draft`, and `jira`: the source key, then the epic, then every key in the Existing ticket column, then every key created. No other keys, and no key in `jira` past the first two that is not in a gaps-table row. `status` stays `draft`.

Write for a reader with 60 seconds: short sentences, everyday words, no skill words, what is missing and who acts next. First line under the title: "Buildable after N stories and M rulings." N counts the gaps with a drafted block, whatever their kind. M counts the gaps waiting on a ruling. Write "changes" for "stories" when any drafted block is not `new` or `split`. A count of one drops the plural: "1 story", "1 change", "1 ruling".

Sections in this order, each a `##` heading:

1. **Summary.** A link to the intake note and the date it was checked. Then this block, one line per search, with one `- "<words>"` line for every gap, so four gaps make four of them:
   ```
   Tickets searched:
   - epic <epic key> children: <keys>
   - "<words>": <keys>, or no match
   - vault proposals: [[<note>]] item <n>, or none
   ```
2. **The gaps.** A table: `# | Gap | Kind | Blockers it clears | Existing ticket | State`. Existing ticket is the key a search matched, or "none"; for a `link fix` it is the ticket at the other end of the wrong link, never the source key, and when the source key is at neither end, the ticket the link is wrong on. State is `drafted`, `waiting on [[<question note>]]`, `created <key>`, or `done YYYY-MM-DD`.
3. **Stories.** One block per drafted gap. A gap waiting on a ruling gets no heading here at all:
   - Heading `### G<n> — <short title>`. After a create, the new key joins the heading.
   - One line: the kind, the epic, and the ticket it blocks.
   - **Story.** As a …, I want …, so that ….
   - **Acceptance criteria.** A numbered list.
   - **Depends on.** Other gaps or tickets.
   - **Evidence.** Copied from the intake note, in its form: the clone's name, one space, the path from the repo root, a colon, the line — `phenix.ui apps/appointments/src/lib/appointmentDetailFields.ts:217`.

   `re-scope`, `link fix`, and `close` blocks hold their text for the owner in place of Story and criteria. A `split` block holds both. All of it is ready to paste into Jira: roles, not names, and no wikilinks.
4. **Waiting on a ruling.** One line per held gap: the question note link, who owes the answer (its `owner`), what each answer would change, and any ticket a search matched for that gap with the piece it leaves undone.
5. **Build order.** A numbered order across the drafted stories and the source ticket.

## Other writes

- The intake note: one line under Facts established that links `[[KEY Gap Stories]]`. Write it once, and change nothing else in that note.
- The daily note: `- HH:MM gap stories [[KEY Gap Stories]]: N drafted, M waiting`, and the key into its `jira` list.

## Repeat runs

Update the note in place. Keep every gap row and every block. A held gap whose question is now answered gets its story, and its State becomes `drafted`. A drafted story keeps its text unless the blockers it clears have changed. A created story keeps its key and its text. A gap the latest intake no longer finds becomes `done YYYY-MM-DD`. A new gap takes the next free number. Rewrite the first line, Summary, and Build order. The daily note gets one new line per run.

## Creating stories in Jira

Only on "create G<n>" or "create G<n> and G<m>". Bare, it means the gap note this session wrote or read last; with none, ask which ticket. For each number:

1. **Kind.** Only `new` and `split` gaps are created. For the other kinds, point at the drafted text for that ticket's owner, or name the open question.
2. **Duplicates.** One JQL per story: `project = <project> AND summary ~ "<three or more words from its title>" AND statusCategory != Done`. Use the words that tell this story apart from the ticket it unblocks, not the words the two share. The source key and the split source never count. Any other match stops that story; show the match in chat.
3. **Preview.** Project from the source key; issue type Story; parent the epic; summary the heading title; description the story line and the criteria; labels copied from the source ticket; links "blocks" the source key, and "relates to" the split source or the ticket the story depends on. No assignee, sprint, estimate, or priority. Ask for a yes.
4. **Approval.** A yes to that preview, in this session, covers the stories in it and nothing else.
5. **Record.** Each new key goes into the State, the story heading, and `jira`. The daily note gets `- HH:MM created <new key> from [[KEY Gap Stories]] G<n>`, and the key joins its `jira` list. Chat gets one line per new key, with its URL.

Jira text names roles, not people, and carries no Claude attribution and no session link. Descriptions, existing links, status, assignee, and comments on existing tickets stay as they are; changes to them are drafted text for the owner.

## Chat summary

Five lines at most: the first-line sentence; up to three gaps, each with its number, kind, and state; which numbers can be created, and the note link. When none can be created, say which role acts on the drafted text.

## When something fails

One line in chat each. No Atlassian MCP, or the site is unreachable: write the note from the intake note and the vault, put "Jira not checked" on the Jira lines under `Tickets searched`, say in the Summary that the `updated` check was skipped, and say creating is unavailable. No intake note and Jira unreachable: stop. A create fails partway: record the ones that worked, leave the failed story `drafted`, and put the error in chat. No vault or no config: point at vault-init and stop.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Drafting a held gap because the answer seems obvious | The hold is the user's rule. The likely answer belongs in the question note |
| Drafting a re-scope as a new story | It duplicates a ticket the team already sized |
| Creating on "looks good", or on a yes from an earlier session | Only "create G…" plus a yes to the preview, in this session, creates anything |
| Fixing the block cycle or rewriting a description "since we're in Jira anyway" | This skill creates and links. Everything else is drafted text for the ticket's owner |
| Skipping the vault proposal search | It re-invents a gap a triage note already listed |
| Stories only in chat | The note is the deliverable. Chat points at it |
| Drafting from the Jira description instead of the intake note | The intake note holds the checked evidence; the description holds the claims it disproved |
| Counting the source ticket or the split source as a duplicate | Those two always match the words. Only a third ticket stops a create |
| "Why I didn't write code: the only way to 'fill' the remaining gap today would be a live V1/Oracle read at request time" | Filling a gap is naming the ticket that fills it. No run of this skill writes code |
| "I updated the vault ticket note and the open-questions note to reflect this. One question (V1 vs. V2) is now answered" | A question closes when the person who owes the answer gives it. Answering it here loses the ruling the board is waiting for |
| "- [x] V2 has nothing to search. Cleared 2026-09-15: [[PFD-66644]] … owns the projection" | Ticking the intake note's blockers deletes the evidence this skill reads. The cover belongs in the gaps table; the intake note gets one added line |
| "Next action: want me to draft an updated Jira comment on PFD-66405 for your review" | The drafting is this turn's work. An offer to draft later leaves the board with nothing |
| "So 'filling the gaps' splits into two different things, and I don't want to guess which you mean" | It is one thing: the stories that unblock the ticket. Write the note, then say what it says |
| "I haven't rechecked whether an order-search button exists in phenix.ui yet … I'd want to re-verify before claiming it's fixed" | Re-checking the code is intake's run. Copy its evidence lines and give the note's date |
| "Which do you want me to do: draft the updated PFD-66405 description for your review, or draft a ping to Rob…" | Both, in the note. The replacement description and the question to ask are two sections, not a choice |
| "Bottom line: PFD-66405 still can't be built today… The real gap left is a decision, not code" | A ruling is one gap. The rest still get their rows, their kind, and their drafted text |
| "I checked the ticket against live Jira instead of taking the … framing at face value" | Checking the ticket is done and written down. This run turns those blockers into gaps |
| "What I did: re-ran full intake … then rewrote the ticket note" | A rewritten intake note loses the checked evidence. Say the ticket moved since the note's date and work from the note |
| "Next action: open Tickets/PFD-66405 Order search popup.md in the vault, review the rewritten draft comment" | The gap note is what the reader opens. Pointing at the intake note means no gap note was written |
| "I didn't touch Jira — no write access, and posting is your call anyway" | The rule is this skill's, not the tool list's. With write access the answer is the same: only what the user approved by number |
