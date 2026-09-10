# ticket-intake — design

**Status: approved in brainstorming 2026-09-10. Ready for an implementation plan.**

## Goal

A skill for the `consultant-vault` plugin that reads a Jira ticket before work starts and answers one question in plain words: can this be built as written, and if not, what stands in the way and who clears it. The answer lands in the ticket's vault note and as a five-line chat summary.

## Why

PFD-65947 was written on 2026-08-26 and assigned on 2026-09-09. It cited two "V2" files that live in the V1 repo, assumed a "Dispatch service" that does not exist, and asked for values that nothing stores. A hand-written story-vs-code review found this on the afternoon of 2026-09-09; the question that unblocked the ticket went out at 14:49 and was answered by 16:40. A plan existed at 14:05 the next day. Almost every finding was mechanical: resolve the paths the ticket cites, grep the field names, read the duplicate link, list the ticket's own open questions. Done at 12:35 on 2026-09-09, the same question goes out a day earlier.

## Decisions taken in brainstorming

| Question | Decision |
|---|---|
| Sources to check | Jira, the vault, the code. Not people or environments, except that Jira's reporter and assignee name who answers. |
| Where the result lands | The existing `type: ticket` note, plus a chat summary. Repeat runs update in place. |
| Code depth | Locate only. No builds, no installs, no test runs, no clones. |
| Questions and contradictions | Routed automatically to question and conflict notes, same rule as daybook. |
| Shape | One skill, runs inline in the main session. No subagent. |
| Writing | Plain language throughout. A reader with 60 seconds learns whether to start and why not. No skill-internal words in any note. |

## Trigger and inputs

- Name: `ticket-intake`.
- Fires when the user says "pick up KEY", "start on", "look at", "what's blocking", "can this be built as written", "intake", or pastes a Jira issue URL. A key mentioned in passing does not fire it; daybook handles that.
- Input: one issue key. The Atlassian site comes from config `jira_site` if present; otherwise the skill lists accessible sites, uses the only one, and adds it to config after the user confirms. Same precedent as granola-sync adding a meeting-type rule to config.

## Read-only against Jira

The skill reads issues, comments, links, and history. It never comments, transitions, edits, links, or assigns, even when asked to "post" or "move". The draft comment goes in the note for the user to post. Same rule as time-logging.

## The three checks, in order

Order matters: Jira gives the text, the vault gives the repo dossiers and memory, the code verifies the claims.

### 1. Jira

One issue read with description, comments, issue links, subtasks, parent, sprint, estimate, and changelog. One JQL for the siblings under the same parent.

Findings:
- Each bullet under an "Open Questions" heading in the description. Owner: the reporter, unless the ticket names someone else.
- Links of type Duplicate or Blocks where both sides are unresolved. Read the other issue's summary and description; note anything it asks for that this ticket does not address.
- Open subtasks.
- In a sprint with no estimate.
- A comment that asks a question with no later reply from anyone else.
- Status history: a prior block, a reopen, or repeated description edits.
- Siblings: kept aside until the code check runs; then any sibling that repeats a claim the code check found false is listed.

### 2. Vault, frontmatter first

- Notes with the key in `jira`: handoffs (read the Gated section), open questions, open conflicts, decisions (accepted ones are constraints; proposed ones are unsettled), research and review notes.
- Meeting notes whose `topics` or body match the ticket's nouns, taken from its summary and scope table (screen names, field names, feature names). Quote the sentence that mentions the subject.
- Repo dossiers whose names or paths match the ticket: clone path, build notes, owners.
- Glossary: terms in the ticket the vault does not know. Listed, not routed.
- `Meta/Intake Checks.md`, if it exists: client-specific checks such as migration-number collisions, one per line. Each runs as written. Absent, skipped silently. The workflow-capture skill will own this note later.

### 3. Code, locate only

Three mandatory checks, then two cheap ones.

1. **Path resolution.** Every file path, class name, or module the ticket cites is searched in every local clone named by a dossier. Record the repo it lives in, whether it exists, and whether that repo is the system the ticket says it is (a "V2" reference found only in the V1 repo is a false claim).
2. **Name existence.** Every service, module, field, table, or column the ticket says exists is grepped per repo. Each is marked present, present but empty (a hardcoded blank, an unused column), or absent.
3. **Where each value comes from.** Every field the ticket says is seeded, copied, or available is traced to a stored column (migrations, schema), a computation (a calculator, a helper, a query on read), or nothing.
4. Recent commits and TODO or FIXME lines on the resolved paths.
5. Whether each local clone is behind its remote default branch.

Each claim the ticket makes about code ends up with one of three marks: **yes** (found as described), **no** (found otherwise, with evidence), **couldn't check** (nothing to grep, or the clone is missing).

Evidence has one form only: `repo path:line`.

## The ticket note

### File and frontmatter

- `KEY Short title.md` in `folders.tickets`. Created from the ticket template when missing.
- On create: `type: ticket`, `client`, `created`, `key`, `epic` from the parent, `status: draft`, `owner` as a quoted wikilink to the assignee's person note. `jira` lists the key first, then the epic, then every linked or sibling key that produced a finding.
- On an existing note: frontmatter untouched except additions to `jira`.
- No new frontmatter keys. The check date and the commits read are a line in the body, not properties.

### Body

The first line under the title is the answer, one sentence: "Can be built as written." or "Cannot be built as written: the two V2 files it cites are V1 files, and nothing stores the weights."

Sections in this order. Summary exists in the template; intake fills it. Sections 2 to 4 are intake's and are inserted after Summary. Sections 5 to 7 come from the template and keep their place.

1. **Summary.** One short paragraph in everyday words: what, for whom, how many acceptance criteria, status, reporter, assignee, sprint. Then one line: "Checked 2026-09-10 against phenix.appointments main abc123, phenix.ui main def456."
2. **What the ticket says vs what's there.** A table with three columns: "Ticket says", "Actually", "OK?". "OK?" is yes, no, or couldn't check. Replaced wholesale on every run; it is a dated snapshot.
3. **Blockers.** A checklist of plain sentences, no category tags. Each line ends with who or what clears it, as a wikilink where a note exists: "The ticket cites two V2 files that live in USCS-BE. Ask [[Rob Park]]." False claims that stop the build come first, then Jira findings, then vault contradictions, then code readiness. The top five stay in the list; more go under one line starting "Also:".
4. **Draft comment.** One blockquote addressed to the reporter: the verdict sentence, each false claim with one line of evidence, the questions that need an answer. No proposed re-scope.
5. **Handoffs.** Unchanged.
6. **Facts established.** Short lines, appended and deduped: repos touched with clone paths; each named field and where its value comes from; sibling tickets sharing a false claim; terms the vault does not know.
7. **Open items.** Housekeeping that does not stop the build, one line each: close the duplicate, fix sibling wording, add an estimate, no dossier for a touched repo.

### Repeat runs

- Blockers still detected keep their checkbox state. A line matches its earlier self by its wikilink or evidence; failing both, by the sentence.
- Blockers no longer detected become `[x]` with " — cleared YYYY-MM-DD" appended. Nothing is deleted.
- New blockers append.
- Summary is rewritten; Facts established is appended.

## Other notes created

Before creating anything, scan for an existing question or conflict note carrying the key that already covers the point. Link it instead.

| Finding | What happens |
|---|---|
| A question only a person can answer (an Open Question in the description; a false claim that needs a ruling, not a fix) | One open-question note per distinct question, via the open-questions skill. Owner: the reporter unless the ticket names someone. Questions sharing an answerer and a subject merge into one note. |
| The ticket contradicts a vault record (meeting note, accepted decision, verified finding) | One conflict note via the reconcile skill. `sources`: the ticket note first, the contradicted note second. Owner: the reporter. |
| Reporter or assignee with no person note | Bare person stub, per the people convention. |
| A false claim that only needs a fix | A Blockers line and a line in the draft comment. No note. |
| Sibling tickets sharing a false claim | An Open items line. No note. |
| Unknown terms | Listed under Facts established. No glossary entry; a ticket's use of a term is not a definition. |
| A touched repo with no dossier | An Open items line. No dossier created. |

The daily note gets one log line, `- HH:MM intake [[KEY Title]]: N blockers`, and the key is added to its `jira` list.

## Chat summary

Five lines, same plain rule as the note:

1. The verdict sentence.
2. First blocker.
3. Second blocker.
4. Third blocker.
5. What was created, as counts, and the first action: "post the draft comment" or "start building". Then the note link.

## Repo changes beyond the skill

1. `skills/obsidian-vault/templates/Config.md`: add `tickets: Tickets` to `folders` (missing today; handoff and time-logging both fall back to it) and an optional `jira_site` key with a one-line explanation. vault-init already creates every folder in the map.
2. `skills/handoff/templates/Ticket.md`: unchanged. Intake inserts its sections, so handoff-created notes do not carry empty headings.
3. `skills/obsidian-vault/references/property-schema.md`: unchanged. No new type, no new keys.
4. `README.md`: one table row. `.claude-plugin/marketplace.json`: the skill count in the plugin description is stale at thirteen and becomes eighteen.
5. `skills/vault-init/SKILL.md`: no change needed; it reads the folder map.

## Failure cases

Each is one line in chat.

- Atlassian MCP absent or the site unreachable: say so. If the user pastes the ticket text, run the vault and code checks on it; the note marks the Jira checks as not run.
- Key not found: stop.
- Vault unresolvable or config missing: point at vault-init and stop.
- A dossier names a repo with no local clone: one Blockers line saying to clone it; that repo's code checks are skipped. Never clone.
- The ticket cites no paths, names, or fields: the table holds one line saying so; everything else still runs.
- More than one Atlassian site: ask once, save the answer to config.

## Testing

Follows `docs/superpowers/baselines/README.md`.

1. **Scenario `docs/superpowers/baselines/ticket-intake.md`.** Prompt: "pick up PFD-65947". Vault copy with every note carrying PFD-65947 removed and the 2026-09-09 and 2026-09-10 daily-note lines about it stripped, so the copy looks like the morning of 2026-09-09. Check table, one row per expected finding:
   - the two "V2" reference paths resolve to USCS-BE
   - no "Dispatch service" in any V2 repo or dossier
   - the two weights have no stored column; V1 computes them on read
   - V2 has no column, DTO, or API field for the four; the UI hardcodes blanks
   - PFD-65891 is a duplicate, open on both sides, and raises inbound
   - the two Open Questions in the description, each with the reporter as owner
   - sibling tickets in the epic repeat the "Dispatch service" claim
   - the 2026-09-04 meeting note says "front-end only", contradicting the seeding path
   - plus: the first line of the note is the verdict sentence; no skill-internal words appear; evidence is in the fixed form.
2. **Scenario: buildable as written.** A small ticket the user picks during implementation. Expected: a one-line verdict, an empty Blockers list, nothing invented.
3. **RED**: five reps without the skill. **GREEN**: five reps with it. Score from `diff -rq` against the source copy and by reading the ticket note; never from the agent's summary.
4. **Risk**: the PFD-65947 build started 2026-09-10, so local clones may have moved. The checks pin to `origin/main` at a named commit, and the expected findings are stated against that commit.
5. **Trigger test** after reinstalling the plugin from the checkout, same open item as the 2026-09-09 batch.

## Later, not now

- A client-specific checks note (Flyway version collisions, clone freshness rules) belongs to the workflow-capture skill. Intake reads it when it exists.
- Putting the plain-language rule into the obsidian-vault foundation skill so every skill inherits it. Separate change.
- A people check for who owns the affected systems. Excluded for now; Jira's reporter and assignee name the answerers.
