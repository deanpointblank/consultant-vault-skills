# gap-stories — design

**Status: approved in brainstorming 2026-09-11. Ready for an implementation plan.**

## Goal

A skill for the `consultant-vault` plugin, and the sister of `ticket-intake`. Intake checks a Jira ticket and says whether it can be built as written. It lists the blockers, then stops. It never writes Jira.

`gap-stories` starts where intake stops. It takes a ticket that intake found "Cannot be built as written" and works out what is missing. A **gap** is one missing piece that stops the build. Several blockers can share one gap.

For each gap, the skill looks for a Jira ticket that already covers it. It drafts the stories that fill the rest in one vault note. It creates a story in Jira only after the user approves that story in chat.

## Why

PFD-66405, the order search popup, is high priority. Intake on 2026-09-11 found five blockers. It cannot be built as it stands.

A list of blockers says what is wrong. It does not say which tickets fix it. Some fixes already sit on the board: the order seeding work is a section inside PFD-66407. Some were already asked for: the 2026-09-09 triage note lists "Seed the V2 order projection" as a gap for the board. Others need a new story, a rewritten description, or a link change.

The vault already holds notes like this, written by hand. The PFD-65810 follow-on note of 2026-09-04 is one. Each draft story there has a kind, an epic, a story line, and numbered acceptance criteria. It also says what the story depends on and which decision it needs. The skill copies that shape.

## Approaches considered

1. **A new sister skill that reads the intake note.** Chosen. ticket-intake stays read-only. Every Jira write lives in one skill, under one approval rule.
2. **A "fill the gaps" step inside ticket-intake.** Rejected. It breaks intake's core rule that it never writes Jira. Intake is already dense, and its triggers are tested.
3. **A general story writer fed by any source**, such as intake, meetings, or triage. Rejected as broader than asked. Option 1 can grow into it later.

## Decisions taken in brainstorming

| Question | Decision |
|---|---|
| Jira writes | Draft in the vault first. Create in Jira only after approval. |
| Input | The ticket's intake note. |
| Scope | This ticket's blockers only. The search for existing tickets covers the whole Jira project. |
| A gap whose shape depends on an unanswered question | Hold it. Link or create the question note. Draft nothing for that gap. |
| Output | One separate proposal note. Not a section in the ticket note. Not one note per story. |
| Jira changes allowed | Create approved new stories and add links to them. Nothing else. See "Creating stories in Jira". |
| Approval | In chat, by story number: "create G1 and G3". |

## Trigger and inputs

- Name: `gap-stories`.
- It fires on these phrases:
  - "fill the gaps for KEY"
  - "what stories do we need to unblock KEY"
  - "bridge the gap"
  - "what tickets are missing for KEY"
  - "draft the missing stories"
- The create step fires on "create G2" or "create G1 and G3".
- "What's blocking KEY" and "can this be built as written" stay with ticket-intake.
- Input: one issue key. The Atlassian site comes from config `jira_site`, by the same rule as ticket-intake.
- A bare "create G2" refers to the gap note this session wrote or read last. With no gap note in the session, the skill asks which ticket.

## How it finds the gaps

### 1. Read the intake note

The intake note is the file `KEY *.md` with `type: ticket` in `folders.tickets`. When config has no `tickets` key, the folder is `Tickets`.

The skill runs ticket-intake first in any of three cases:

- There is no intake note.
- The Jira ticket's `updated` time is after the note's `Checked YYYY-MM-DD` line. The note holds a date only, so an update on a later calendar day counts.
- The note has no one-sentence result on the first line under its title.

If the intake note says "Can be built as written", the skill says so in chat and stops. It drafts nothing. With no gap note yet, it writes nothing at all. With a gap note from an earlier run, it applies only the repeat-run rule. Every gap not yet done becomes `done YYYY-MM-DD`. The first line becomes "Can be built as written since YYYY-MM-DD."

The skill runs no code checks of its own. Its evidence comes from the intake note.

### 2. Turn blockers into gaps

Two things in the intake note are candidates:

- each open (unticked) line under Blockers, and each item on its `Also:` line;
- each row marked `no` in the table "What the ticket says vs what's there".

Candidates with the same cause merge into one gap. A cause is the one fact that clears them all once it changes.

For PFD-66405, blockers 1 and 3 merge. Blocker 1 says V2 has nothing to search. Blocker 3 says six of the eight results columns have no V2 source. Both share the cause "V2 has no order data to search".

Blockers are counted by their place in the list, 1 to 5. Items on the `Also:` line are named by a few words.

### 3. Look for tickets that already cover each gap

The skill looks in three places for every gap:

1. **Siblings under the same epic.** One JQL for the epic's children. It reads each summary and description.
2. **One text search over the whole project.** One JQL text search with the gap's key nouns. These are the field, table, and feature names the gap turns on.
3. **Earlier vault proposals.** Frontmatter first: notes with `type: proposal` whose `jira` holds the ticket key or its epic. Then a grep of every `type: proposal` note's body for the key and the gap's nouns. The grep catches a proposal whose `jira` list missed the key.

For PFD-66405, the third place finds the 2026-09-09 triage note. Item 1 of its "Gaps — add to the board" list is "Seed the V2 order projection". The gap note cites it.

Every search gets a line in the note's `Tickets searched` block, including searches that found nothing.

### 4. Give each gap one kind

Each gap gets exactly one kind.

| Kind | Meaning | What the skill drafts |
|---|---|---|
| `new` | No ticket covers the gap. | A story to create. |
| `split KEY` | Part of an existing ticket's scope moves into a new story. Example: the seeding section inside PFD-66407. | A story to create. Also one line for KEY's owner naming the section to remove. |
| `re-scope KEY` | The ticket exists, but its description needs rewriting. | Replacement text for KEY's owner. |
| `close KEY` | Another ticket already covers it. | One line for KEY's owner naming the covering ticket. |
| `link fix` | A Jira link is wrong. Example: PFD-66405 and PFD-66407 block each other. | The link change, for the owner of the ticket that carries the link. |
| `waiting on a ruling` | The gap depends on an open question. | Nothing. The gap links the question note. |

An open question is a `type: question` note with `status: open`. It can also be a question in the intake note that has no note yet. In that case the skill creates the note through the open-questions skill.

### Worked example: PFD-66405 today

A run today drafts two changes and holds two gaps.

| Gap | Kind | Comes from |
|---|---|---|
| The popup is new work, not "enable a button" | re-scope PFD-66405 | Blocker 4. The `Also:` item on the Closed PFD-66409. The `no` rows on the search button, the inbound popup, the empty-results message, and `navigateToOrder`. |
| PFD-66405 and PFD-66407 block each other | link fix | Blocker 5. |
| The order catalog and the results columns | waiting on "Does the outbound order search read V1 live or a V2 order projection" | Blockers 1, 2 and 3. The `no` rows on the V1 call from V2, the projection, the V2 fields, the order API, and the grid columns. |
| The Submit scope | waiting on "Is PFD-66407 now the only Submit story for outbound order linking" | The `Also:` items on acceptance scenario 1 and on the PFD-63653 link. |

Blocker 2 joins blockers 1 and 3 here, because it is the question that gap waits on. Both question notes already exist. The skill links them and creates none.

The seeding story appears on the first run after the acting scrum master answers, if the answer is the V2 projection. The vault's accepted decisions point that way. It will be `split PFD-66407`, since the seeding section sits inside that ticket today.

## The gap note

### File and frontmatter

- The file is `KEY Gap Stories.md` in `folders.tickets`. If config lacks the key, the skill uses `Tickets`, creates it, and tells the user to add the key. This is the ticket-intake rule.
- Frontmatter: `type: proposal`, `client`, `created`, `status: draft`, and `jira`.
- `jira` order: the source key first, then the epic. Then every key that matched a gap. Then every key the skill created.
- No other new keys. The skill writes `status: draft` and never changes it.

`type: proposal` is not yet in the property schema. The vault's hand-written triage, follow-on, and story-candidates notes already use it. The build adds a `## type: proposal` section to `skills/obsidian-vault/references/property-schema.md`.

The note is plain language. A reader with 60 seconds learns what is missing and who acts next. No skill-internal jargon appears in it.

### Body

The first line under the title is one sentence, such as "Buildable after 2 stories and 2 rulings." The first number counts the gaps with a drafted block. The second counts the gaps waiting on a ruling. The noun is "stories" when every drafted block is `new` or `split`, and "changes" otherwise. For PFD-66405 today, the sentence is "Buildable after 2 changes and 2 rulings.", since its two drafted blocks are a re-scope and a link fix.

Sections, in this order:

1. **Summary.** A link to the intake note, and the date it was checked. Then the `Tickets searched:` block.
2. **The gaps.** A table: `# | Gap | Kind | Blockers it clears | Existing ticket | State`.
3. **Stories.** One block per drafted gap.
4. **Waiting on a ruling.** One line per held gap.
5. **Build order.** A numbered list.

#### The Tickets searched block

`Tickets searched:` is a required slot. Under it goes one line per search: the words searched, and the keys that search returned. A search with no result says "no match". One more line lists the epic's siblings, and one lists the vault proposals found.

A search the skill skipped therefore shows as a missing line. The repo learned this from ticket-intake's `Meetings checked` block. A step that can be left out needs a slot whose absence shows.

The lines take this form:

```
Tickets searched:
- epic <epic key> children: <keys>
- "<words>": <keys>, or no match
- vault proposals: [[<note>]] item <n>, or none
```

#### The gaps table

- `#` is G1, G2, and so on. A number never changes and is never reused. A gap found on a later run takes the next free number.
- `Blockers it clears` lists intake blocker numbers, `Also:` items by a few words, and table rows by their first words.
- `Existing ticket` holds the key a search matched, or "none".
- `State` is one of `drafted`, `waiting on [[question]]`, `created PFD-NNNNN`, or `done YYYY-MM-DD`.

#### Stories

One block per drafted gap. The shape is that of the T1 to T3 blocks in the PFD-65810 follow-on note:

- A heading with the gap number and a short title, such as `### G3 — Order search popup as new work`. After a create, the new key joins the heading.
- One line with the kind, the epic, and the ticket it blocks.
- **Story.** "As a …, I want …, so that …".
- **Acceptance criteria.** A numbered list.
- **Depends on.** Other gaps or tickets.
- **Evidence.** Each item in the ticket-intake form `repo path:line`. That is the clone name, one space, the path from the repo root, a colon, and the line.

Story and criteria text is ready to paste into Jira. It names roles, not people. It holds no wikilinks.

Some kinds hold other text instead of a story:

- `re-scope` holds the replacement description, for the ticket's owner.
- `link fix` names the link to remove or add, and why, for the ticket's owner.
- `close` holds the one line for the ticket's owner.
- `split` holds the story, plus the line for the source ticket's owner.

#### Waiting on a ruling

One line per held gap. Each line gives the question note link, who owes the answer, and what each answer would change. Example for PFD-66405:

- [[2026-09-11 Does the outbound order search read V1 live or a V2 order projection]]. The acting scrum master owes it. If the projection: a seeding story split out of PFD-66407. If V1 live: a story for V2 to call the V1 endpoint.

Who owes the answer comes from the question note's `owner`.

#### Build order

A numbered order across the drafted stories and the source ticket. A held gap joins the order once its story is drafted.

### Other writes

- A question with no note gets one, through the open-questions skill. One note per question.
- The intake note gets one line under "Facts established" that links the gap note. Intake re-runs append to that section, so the line survives them. The skill writes this line once.
- The daily note gets `- HH:MM gap stories [[KEY Gap Stories]]: N drafted, M waiting`, and the key joins its `jira` list.

### Repeat runs

The note updates in place. Nothing is deleted.

- A held gap whose question is now answered gets its story drafted. Its state becomes `drafted`.
- A drafted story keeps its text unless the blockers it clears have changed.
- A created story keeps its key and its text.
- A gap the latest intake no longer finds becomes `done YYYY-MM-DD`.
- A new gap takes the next free number.
- The first line, Summary, `Tickets searched`, and Build order are rewritten on every run.

## Creating stories in Jira

### What the skill may change in Jira

It may create a story the user approved. It may add links from that new story.

It never edits an existing ticket's description. It never removes or changes a link on an existing ticket. It never transitions, assigns, or comments. Re-scopes and link fixes stay as drafted text in the note, for the ticket's owner.

### The create steps

On "create G1" or "create G1 and G3":

1. **Kind check.** Only `new` and `split` gaps can be created. For `re-scope`, `close`, and `link fix`, the skill points at the drafted text for that ticket's owner. For a waiting gap, it names the open question.
2. **Duplicate check.** One JQL search per story over the project: `summary ~` its summary words, skipping tickets whose status category is Done. A search of all ticket text (`text ~`) was rejected on 2026-09-11: it matched four unrelated tickets for the seeding story. Two keys never count as a match: the source ticket, and the ticket a split came from. Any other match stops that story, and chat shows the match.
3. **Preview.** For each story that passed, the skill shows:
   - project: from the source key;
   - issue type: Story;
   - parent: the epic;
   - summary: the title from the story heading;
   - description: the story line and the acceptance criteria;
   - labels: copied from the source ticket, such as `PhenixV2_Stride`;
   - links: "blocks" the source key, plus "relates to" the ticket a split came from.

   There is no assignee, sprint, estimate, or priority.
4. **Approval.** One yes covers the stories in that preview, in this session only. Approval never carries over to a later session.
5. **Record.** Each new key goes into the gap table's State, the story heading, and the note's `jira`. The daily note gets `- HH:MM created <new key> from [[KEY Gap Stories]] G<n>`, and the new key joins its `jira` list. Chat gets one line per new key, with its URL.

Jira text names roles, not people. It carries no Claude attribution and no session link.

## Chat summary

After a drafting run, five lines at most:

1. The first-line sentence.
2. Up to three gaps, one per line, each with its number, kind, and state.
3. Which numbers can be created, and the note link.

For PFD-66405 today, the last line says nothing can be created yet. The re-scope and the link fix are for the acting scrum master.

## When something fails

One line in chat each.

- No Atlassian MCP, or the site is unreachable: write the note from the intake note and the vault. Say creating is unavailable. The Jira lines under `Tickets searched` say "Jira not checked". The check of Jira's `updated` time is skipped, and the Summary says so.
- A create fails partway: the creates that worked are recorded. The failed story stays `drafted`. The error goes to chat.
- No intake note, and Jira is unreachable: stop and say so.
- No vault or no config: point at vault-init and stop.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Drafting a held gap "because the answer is obvious" | The hold is the user's rule. The question note is the place for the likely answer. |
| Treating a re-scope as a new story | It duplicates a ticket the team already sized. |
| Creating in Jira on "looks good", or on a yes from an earlier session | Only "create G…" plus a yes to the preview, in this session, creates anything. |
| Fixing the block cycle or rewriting a description "since we're in Jira anyway" | The skill only creates and links. Everything else is drafted text for the ticket's owner. |
| Skipping the vault proposal search | It re-invents a gap the triage note already listed. |
| Stories only in chat | The note is the deliverable. Chat is a pointer to it. |
| Drafting from the Jira description instead of the intake note | The intake note holds the checked evidence. The description holds the claims it disproved. |
| Counting the source ticket or the split source as a duplicate | Those two keys always match the words. Only a third ticket stops a create. |

## Testing

Follows `docs/superpowers/baselines/README.md` and the writing-skills RED and GREEN loop. The scenario file is `docs/superpowers/baselines/gap-stories.md`. Every run uses a copy of the vault. Score from `diff -rq` and by reading the gap note, never from the agent's summary.

1. **Baseline (RED).** A subagent without the skill gets "fill the gaps for PFD-66405". Record its failures. Expected: stories only in chat, held gaps drafted anyway, and the re-scope treated as a new story.
2. **With the skill (GREEN).** Same prompt. Check the note's shape, each gap's kind, the hold rule, and the `Tickets searched` block. The expected result is the worked example above.
3. **Create step.** Run with the Jira write tools blocked. Pass: a correct preview, and nothing created. PFD-66405 has no gap that can be created today. So this test uses a second vault copy, with the order search question marked answered as the projection. That copy yields a `split PFD-66407` story to preview.
4. **Trigger tests with sonnet.** "What's blocking KEY" goes to ticket-intake. "What stories do we need to unblock KEY" goes to gap-stories.

No test ever creates a ticket on the client site. The first real create happens live, with the user watching.

## Repo changes beyond the skill

1. `skills/ticket-intake/SKILL.md`: the Chat summary gains one line. When the result is "Cannot be built", it suggests gap-stories.
2. `skills/obsidian-vault/references/property-schema.md`: `proposal` joins the list of types, with a new `## type: proposal` section. Its properties are `status` (`draft`) and an optional `topics` list, as the hand-written notes use.
3. `README.md`: one table row, and the skill count on line 34 goes from twenty-two to twenty-three.
4. `.claude-plugin/marketplace.json`: the plugin description names gap stories.

## Later, not now

- A general story writer fed by meetings or triage notes (approach 3). This skill can grow into it.
