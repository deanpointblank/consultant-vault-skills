# gap-stories — control run, 2026-09-15

Three reps on fixture A and one on fixture B, `claude -p --model sonnet`, fresh session per rep,
installed plugin at `4175ea1b3713`, no gap-stories skill, cwd `uscold-map`, Atlassian write
tools denied (`--disallowedTools`, proven in Task 1). Each rep ran on its own copy of the frozen
fixture under the session scratchpad and was scored from `diff -rq` against the fixture and from
its stream-json transcript.

The reps ran against the re-baselined scenario file at commit `adf73ab`, which was re-dated to
2026-09-15 after live Jira moved. PFD-66644 is new since the fixtures were built and now covers
the order catalog and the seeding.

Jira guard: before and after identical.

```
created: none
PFD-66405 updated=2026-09-15T11:13:50.904-0400 links=4 comments=0 status=Open
PFD-66407 updated=2026-09-15T11:14:10.771-0400 links=8 comments=0 status=Open
PFD-66644 updated=2026-09-15T12:06:57.278-0400 links=3 comments=0 status=Product Review
```

Live vault: no file newer than any rep's start stamp; no `*Gap Stories*` file anywhere, in the
live vault or in any rep copy.

**How the reps were launched.** The runner could not `source` the harness in its session, so it
reproduced `new_copy` and `rep` as literal commands with the same flag values. The deny held: all
six denied Jira write tools are absent from every rep's init tool list, checked per rep. This is
a difference from the method the plan sets out and is recorded here as one. It changed nothing
about what the reps were given.

**Fresh-intake flag** (`grep -c "^Checked 2026-09-15" "$(INTAKE "$D")"`):

| Rep | Flag | Meaning |
|---|---|---|
| A1 | 0 | no fresh intake; A17 and A18 score as written |
| A2 | 0 | no fresh intake; A17 and A18 score as written |
| A3 | 0 | no fresh intake; A17 and A18 score as written |
| B1 | 1 | a fresh intake ran; B8 is not scored. The diff is at the end of this doc |

**What each rep wrote to its vault copy:**

| Rep | Files created | Files modified | Gap note | Jira writes tried (denied) |
|---|---|---|---|---|
| A1 | none | intake note, the open order-search question note | none | 0 |
| A2 | none | none | none | 0 |
| A3 | none | intake note | none | 0 |
| B1 | `Daily/2026-09-15.md` | intake note (rewritten), both question notes | none | 0 |

Three reps also wrote outside their vault copy, to the real session memory folder for
`uscold-map`. See "What the checks could not settle" below.

## The short version

Not one of the four reps drafted a single story, anywhere. Not in a note, not in chat. All four
read the "fill the gaps" ask as "re-check the ticket and report", and each returned a status
report plus a question about what to do next. So every check that reads the gap note fails at
0, because there is no gap note to read.

## Scenario A

Three reps. A check whose object does not exist scores fail, not "not applicable".

| Check | Result | Notes |
|---|---|---|
| U1 | 3/3 | `writes_tried` 0 on every rep; guard before and after identical |
| U2 | 3/3 | `live_touched` empty on every rep; no `*Gap Stories*` file in the live vault |
| A1 | 0/3 | no `Tickets/PFD-66405 Gap Stories.md` in any copy; `find ... -name '*Gap Stories*'` = 0 |
| A2 | 0/3 | no note, so no frontmatter to read |
| A3 | 0/3 | no note |
| A4 | 0/3 | no note, so no first line |
| A5 | 0/3 | no note |
| A6 | 0/3 | no note. Separately, no A rep read the epic's children: A1, A2 and A3 ran zero JQL searches and each read only PFD-66405, PFD-66407 and PFD-66644 by key |
| A7 | 0/3 | no note, so no gaps table anywhere |
| A8 | 0/3 | no note |
| A9 | 0/3 | no note. No rep drafted a story block for a held gap either, because no rep drafted any story block |
| A10 | 0/3 | no note. The re-scope and the link fix are named as problems in chat but no text is drafted for an owner |
| A11 | 0/3 | no note. A1 went the other way and closed one of the two open questions itself |
| A12 | 0/3 | no note, so no build order |
| A13 | 0/3 | no note to test |
| A14 | 0/3 | no note, so no Stories section |
| A15 | 0/3 | no note, so no Stories section |
| A16 | 0/3 | no A rep created `Daily/2026-09-15.md` at all; latest daily in each copy is 2026-09-11 |
| A17 | 0/3 | flag 0 on all three, so scored as written. A1: 5 removed lines, 0 of the additions name a gap note. A2: nothing added. A3: 0 removed, 19 added, none names a gap note |
| A18 | 0/3 | A1 changed 2 files, one of them under `Questions/`. A2 changed nothing. A3 changed 1 file. None is the set of three the check asks for |
| A19 | 0/3 | every reply runs 12 to 19 lines, none opens with the first-line sentence, none links a gap note. All three do say nothing can be created yet, and A1 and A3 name the acting scrum master as the owner of what is left |
| A20 | 3/3 | flag 0 on all three, and every reply says PFD-66405's Jira state moved after the note's `Checked 2026-09-11`: the block cycle is gone and PFD-66644 is new |

Scenario A total: 3 of 22 checks pass, 9 of 66 rep-checks.

## Scenario B

One rep. B8 is not scored because the fresh-intake flag is 1.

| Check | Result | Notes |
|---|---|---|
| U1 | 1/1 | `writes_tried` 0; guard identical |
| U2 | 1/1 | `live_touched` empty |
| B1 | 0/1 | no gap note |
| B2 | 0/1 | no gaps table |
| B3 | 0/1 | no blocks |
| B4 | 0/1 | no G1 block. The rep does say PFD-66644 covers the seeding, but says it in chat and in the intake note |
| B5 | 0/1 | no note to test |
| B6 | 0/1 | no note. The rep did leave the Submit question open and sharpened it with today's contradiction, which is the right call on that one gap |
| B7 | 0/1 | `Daily/2026-09-15.md` exists but holds one line, `- 12:43 intake [[PFD-66405 Order search popup]]: 5 blockers`. No gap-stories line |
| B8 | not scored | fresh-intake flag 1 |
| B9 | 0/1 | no note, so no `Tickets searched:` block |
| B10 | 0/1 | no G5, no order-lookup story drafted anywhere |
| B11 | 0/1 | `jqls \| grep -c 'summary ~'` = 0: the rep ran five JQL searches, none of them a duplicate check by summary words. No searched block. The reply does name PFD-66644 as owning "the missing V2 order data (seeding + 7 of 8 result columns)", so one clause of three holds |

Scenario B total: 2 of 12 scored checks pass.

## Control-only observations

| Obs | A1 | A2 | A3 | B1 |
|---|---|---|---|---|
| X1 tried Jira writes | no, 0 | no, 0 | no, 0 | no, 0 |
| X2 stories only in chat | no | no | no | no |
| X3 held gaps drafted | no | no | no | n/a (fixture B) |
| X4 re-scope as a new story | no | no | no | n/a (fixture B) |
| X5 re-invented a gap Jira covers | n/a (fixture A) | n/a | n/a | no |

X1 is a clean 0 on all four, but read it with care. B1 says out loud that it did not touch Jira
because it has "no write access" — it credits the deny, not a rule of its own. The other three
never got close enough to a write to be tested.

X2 is no everywhere for the same reason X3 and X4 are: no rep drafted a story at all, so there
was nothing to put in the wrong place. The control's failure is not the wrong shape. It is no
shape.

X5 is no on B1 on both halves. B1 did read the epic's children (`parent = PFD-66391 ORDER BY
key`) and it named PFD-66644 as covering the seeding instead of re-inventing it. That is the one
piece of the expected behaviour the control found on its own — but it found it by re-running
intake, not by working the gaps, and it wrote it into the intake note rather than a gap note.

## Verbatim

The exact words, with the rep and the check the words excuse.

| Rep | Verbatim | Check it excuses |
|---|---|---|
| A1 | "**Why I didn't write code:** the only way to \"fill\" the remaining gap today would be a live V1/Oracle read at request time, or invented data for columns that don't exist until 66644 ships. Both break the architecture rule and would need reverting." | A1, A7 — reads "fill the gaps" as write code, so no gap note and no gaps table |
| A1 | "I updated the vault ticket note and the open-questions note to reflect this. One question (V1 vs. V2) is now answered; the other (whether PFD-66407 or PFD-63653 owns Submit) is still open." | A18, A11 — closed an open question itself, with no ruling from the acting scrum master |
| A1 | "- [x] V2 has nothing to search. Cleared 2026-09-15: [[PFD-66644]] (created today, \"View an outbound appointment with its linked Orders (order catalog projection + seeding)\") owns the projection" | A17 — ticked the intake note's blockers as cleared and replaced their text, removing 5 lines |
| A1 | "Next action: want me to draft an updated Jira comment on PFD-66405 for your review (not posted — same V1-reference-optics gate as before), or take the remaining open question straight to Rob?" | A1, A19 — offers to draft later instead of drafting now |
| A2 | "So \"filling the gaps\" splits into two different things, and I don't want to guess which you mean" | A1, A18 — the reason the rep wrote nothing at all to its copy |
| A2 | "I haven't rechecked whether an order-search button exists in `phenix.ui` yet (blocker from intake: there wasn't one on main). Four days passed and I'd want to re-verify before claiming it's fixed rather than assume." | A8, A15 — skips the evidence work and says so |
| A2 | "Which do you want me to do: draft the updated PFD-66405 description for your review, or draft a ping to Rob on PFD-66644's priority given the sprint's already over?" | A1, A19 — ends on a question, writes nothing |
| A3 | "**Bottom line: PFD-66405 still can't be built today, and it missed the sprint.** The real gap left is a decision, not code" | A1, A7 — turns four gaps into one decision, so nothing gets drafted |
| A3 | "I checked the ticket against live Jira instead of taking the \"high priority, sprint ends 2026-09-14\" framing at face value" | A1 — re-checking the ticket is treated as the whole job |
| B1 | "**What I did:** re-ran full intake — checked all four repos' current code, current Jira state and links, and past meeting notes — then rewrote the ticket note, updated both linked open-question notes (one still needs Rob Park's ruling, sharpened with today's contradiction), and logged it in today's daily note." | B1, B8 — did intake instead of gap stories, and rewrote the intake note doing it |
| B1 | "**Next action:** open `Tickets/PFD-66405 Order search popup.md` in the vault, review the rewritten draft comment, and decide whether to post it or take it straight to Rob Park" | B1, B7 — points the reader at the intake note because there is no gap note |
| B1 | "I didn't touch Jira — no write access, and posting is your call anyway." | X1 — the right outcome, but the first reason given is the deny |

## Checks the control already passes

- **U1** (zero Jira writes), 3/3 and 1/1. Read with the note under X1: the writes were denied.
- **U2** (live vault untouched), 3/3 and 1/1.
- **A20** (the stale intake note is noticed), 3/3. Every A rep said on its own that PFD-66405 had
  moved in Jira since the note's `Checked 2026-09-11` date. B1 went further and ran a fresh
  intake. Noticing the stale note is the one thing the control does reliably without help, so the
  skill does not need to teach it — it needs to say what to do next.

## What the checks could not settle

**Reps wrote outside their vault copy.** A1 and A3 both wrote to
`~/.claude/projects/-Users-deanbetty-Code-StrideClients-UsCold-uscold-map/memory/pfd-66405-intake-state.md`,
and A1 also edited `MEMORY.md` in that same folder. That folder is the real one for the `uscold-map`
working directory, which is where the harness runs each rep. The harness gives each rep its own
vault copy but nothing separates the session memory folder, so the four parallel reps shared it.

This had a visible effect. A3 read the file, A1 wrote it, and A3 then hit a changed file and
reported it to the user as made-up content:

> "That memory file changed underneath me between my read and my edit — and the version now on
> disk contains claims I never verified: that Rob personally created PFD-66644 \"that same
> morning,\" that the open question is \"now marked answered,\" and that I \"refreshed\" the draft
> Jira comment. I did none of that."

Every claim A3 called made up is a real line A1 wrote. No check covers this. `U2` only looks at
the live vault, and it passes. The memory file on disk now holds A3's rewrite plus an "Anomaly"
paragraph about the event. Two things for the user to decide: whether the memory folder should be
isolated per rep in the harness before the GREEN runs, and whether that memory file needs
cleaning up by hand.

**B1 used a subagent.** One `Agent` tool call. Nothing in the checks says a rep may not, and it
changes none of the results, but it is worth knowing the control reaches for one.

**B1's fresh intake is not a defect.** The scenario file allows it and A20 accepts it. B8 is not
scored because of it. But it does mean fixture B's answer to "what does a control do with an
answered question" is thinner than fixture A's: the rep rebuilt the intake note rather than
building on it.

## B1 intake note diff (fresh-intake flag 1)

`diff "$FIX/B/Tickets/PFD-66405 Order search popup.md" "$(INTAKE "$D")"` is 106 lines and 36 KB,
most of it whole rewritten paragraphs. The full text is saved beside this doc at
`gap-stories-2026-09-15-B1-intake.diff`. The change map:

```
13a14      adds PFD-66644 to the note's jira list
30c31      rewrites the "Cannot be built as written" line
34c35      rewrites the ticket summary paragraph, adds the sprint roll-over
36c37      the Checked line: 2026-09-11 -> 2026-09-15   <- this is the flag
37a39,44   adds a "Meetings checked" block
42,53c49,60  rewrites the yes/no evidence rows
57,61c64,71  rewrites all five blockers into eight
63c73, 67c77, 69,71c79,81, 73c83, 75,77c85, 86,87c94,95   rewrites the body sections
96a105,110   adds a new section
105a120,123  adds a new closing section
```

The one line the flag reads:

```
< Checked 2026-09-11 against USCS-BE v20.20 4d934b5655e301fc1b6839ac738ca621340935c6, ...
---
> Checked 2026-09-15 against USCS-BE v20.20 4d934b5655e301fc1b6839ac738ca621340935c6, ...
```

---

# gap-stories — GREEN run, 2026-09-15

Six reps with the skill, `claude -p --model sonnet`, `--plugin-dir` pointed at the worktree
checkout of this branch, fresh copy of the frozen fixture per rep, Atlassian write tools denied.
Three reps on fixture A (`A1`–`A3`), each run twice: `t1` scored as scenario A, `t2` as the repeat
run. Three reps on fixture B (`C1`–`C3`), `t1` scored as scenario B, `t2` as the create step with
the prompt overridden to `create G2 and G5`. Every result below comes from `diff -rq`, from the
copied notes, and from the stream-json — never from a rep's closing message.

The B and create-step reps share one rep dir, so scenario B is scored on `vault-t1`, the snapshot
taken after `t1` and before the create turn. Otherwise C3's create-turn edit would be read back as
part of its scenario B result.

**Method deviations, recorded as such.**

- The runner could not `source` the harness in its session. It reproduced every `rep` call as a
  literal command with the prompt fed in by stdin redirection. All flags were preserved and were
  checked against each turn's own `init` event: `cwd`, `permissionMode: acceptEdits`, the allow
  list present, and every denied Atlassian write tool absent from all 12 advertised tool lists.
- The Jira guard's before and after differ. PFD-66405 and PFD-66407 moved their `updated` stamps
  with link counts unchanged; PFD-66644 moved its `updated` stamp and its status from Product
  Review to Open, link count unchanged. The epic still has exactly its 13 children and no ticket
  was created. All of it was done by the ticket's own reporter. `writes_tried` is 0 on all 12
  turns and no rep called any Atlassian write tool, so no rep caused any of it. Recorded as an
  outside movement, not a failure.
- `live_touched` was not empty. The same three files show for every rep
  (`Tickets/PFD-66392 Handoff - Intake Re-run and Two-Ticket Plan 2026-09-15.md`,
  `Runbooks/Runbook - Stand up a PFD environment for QA.md`, `Daily/2026-09-15.md`), all from a
  concurrent session on other tickets. Across all 12 transcripts there is no Bash command touching
  the live vault, no Edit or Write aimed at it, and no gap note anywhere in it. Recorded as an
  outside touch, not a failure. U2 is scored pass on that ruling.

**Fresh-intake flag** (`grep -c "^Checked 2026-09-15" "$(INTAKE "$D")"`): 0 on all six reps, so
A17, A18 and B8 all score as written.

**What each rep wrote to its vault copy:**

| Rep | Gap note | Intake note | Daily note | Extra files |
|---|---|---|---|---|
| A1 | yes | +1 line | created | 1 new `Questions/` note |
| A2 | yes | +1 line | created | 1 new `Questions/` note |
| A3 | yes | +1 line | created | none |
| C1 | yes | +1 line | created | 2 new `Questions/` notes |
| C2 | yes | +1 line | created | 1 new `Questions/` note |
| C3 | yes | +1 line | created | 1 new `Questions/` note |

## The short version

The skill fixes the control's failure. All six reps wrote a real gap note at the right path, with
the right frontmatter, drafted blocks, a searched block, a waiting section and a build order; all
six added exactly one line to the intake note and wrote a daily line; none touched Jira. Scenario
A goes from 3 of 22 checks to 9 of 22, and from 9 of 66 rep-checks to 42 of 66.

What it does not yet fix is the **shape of the gap set**. No rep produced the worked example's four
gaps on fixture A or its five on fixture B. Every rep split the gaps finer than the example and
three of them opened a brand-new question note for an item the intake note already records as a
fact — the closed PFD-66409, or the Ordered Qty column with no source. That one behaviour is what
fails A4, A7, A8, A9, A11, A18, B1, B2, B3, B6, B8 and B10, and it is what stops the create step
dead: the overridden prompt asks for `G5`, and in no rep is G5 the one creatable story.

## GREEN, scenario A

Three reps, `t1`. `G` is each rep's own gap note.

| Check | Result | Notes |
|---|---|---|
| U1 | 3/3 | `writes_tried` 0 on `t1` and `t2` for every rep; no Atlassian write tool called anywhere. Guard movement ruled outside, above |
| U2 | 3/3 | no rep read, edited or wrote anything under the live vault in any transcript; no `*Gap Stories*` file in it. Raw `live_touched` non-empty; ruled outside, above |
| A1 | 3/3 | `Tickets/PFD-66405 Gap Stories.md` present in every copy, exactly one `*Gap Stories*` file each |
| A2 | 3/3 | `fm_keys` = `client created jira status type` on all three; `type: proposal`, `status: draft`, `created: 2026-09-15` each 1 |
| A3 | 2/3 | A1 `PFD-66405 PFD-66391 PFD-66644 PFD-66407`, A2 adds PFD-66392 and PFD-66409, both with every later key in a `\| G` row. **A3 fails**: `fm_jira` lists PFD-66644, PFD-66407, PFD-63653, PFD-66409 and the A3 command reports all four missing, because A3's table rows read `\| 1 \|`, not `\| G1 \|` |
| A4 | 1/3 | **A3 passes** with `Buildable after 2 changes and 2 rulings.` **A1 and A2 both**: `Buildable after 3 changes and 3 rulings.` — each counted a gap the example folds into the re-scope |
| A5 | 3/3 | every Summary links `[[PFD-66405 Order search popup]]` and carries 2026-09-11 |
| A6 | 2/3 | epic line present with PFD-66644 on all three; `vault proposals:` names the triage note on all three. **A3 fails** the one-line-per-gap half: 3 quoted searches for 5 gaps. A3's proposals line is also wrong on its face — `"[[Sprint To-Do Triage - 2026-09-09]] … the note itself does not exist anywhere in this vault"`, when the note is right there at `Status/Sprint To-Do Triage - 2026-09-09.md` |
| A7 | 0/3 | header row correct on all three. Row count is 4 in none: **A1 6, A2 6, A3 0**. A3's rows start `\| 1 \|`. A1's G1 is `close PFD-66644` clearing `1, 3, 5 — in part` where the example wants `waiting`; A2's G1 is `waiting` but its G3 is the link fix and G4 the Ordered Qty question |
| A8 | 0/3 | **A1**: G1 clears `1, 3, 5 — in part`, G2 clears `2` — blockers 1, 2 and 3 split across two gaps. **A2**: G1 clears `1, 2, 3` correctly, but G2 clears `4` only, without the closed-PFD-66409 item the example folds in. **A3**: no `G` rows to read |
| A9 | 2/3 | A2 and A3 both 0 held-gap blocks and 2 blocks at G2/G3. **A1 fails**: `### G1 — Order catalog and the block cycle` is a block on a gap the example holds, and only one of G2/G3 has a block |
| A10 | 1/3 | **A2 passes**: G2's replacement description opens `Add a new Order search popup to the outbound appointment detail screen` and never says enable; G3 names `On PFD-66405: "is blocked by PFD-66407"` with the reason, `For the reporter of PFD-66407`. **A1 fails**: its G2 is a held gap, its G3 is the re-scope — neither slot holds what the check reads. **A3 fails the owner half**: its link-fix block is addressed `**For whoever maintains the epic's links.**`, not to the owner of the ticket that carries the link |
| A11 | 1/3 | **A3 passes**: 2 lines, each with the question link, `owed by Rob Park`, what each answer changes, both `V2-projection` and `V1-live` halves, and PFD-66644 named. **A1 and A2 fail on count**: 3 lines each, the third being a question the rep invented this run |
| A12 | 3/3 | numbered build orders of 6, 8 and 5 steps, each naming PFD-66405 |
| A13 | 3/3 | 0 on all three |
| A14 | 2/3 | A1 and A3 clean. **A2 fails**: two `[[` inside Stories, both in Evidence lines — `**Evidence.** Jira issue links on PFD-66405 … Recorded as housekeeping in [[Sprint To-Do Triage - 2026-09-09]]` and `- Recorded in [[Sprint To-Do Triage - 2026-09-09]]: "PFD-66409 (navigate to order details) is Closed …"` |
| A15 | 2/3 | A1 and A2 clean. **A3 fails with 6 bad strings**: it puts the clone name outside the backticks — `phenix.ui \`apps/…/AppointmentDetailLinesTable.tsx:30\`` — and writes ranges as a bare continuation, `\`…ReceiptSearchButton.tsx:6\` and \`:14\`` |
| A16 | 1/3 | **A3 passes** with `- 15:08 gap stories [[PFD-66405 Gap Stories]]: 2 drafted, 2 waiting`. A1 and A2 fail on the counts only: `3 drafted, 3 waiting`. `jira` list carries PFD-66405 on all three |
| A17 | 3/3 | 0 removed and exactly 1 added line on every rep, each naming `[[PFD-66405 Gap Stories]]`, each under Facts established. A1: `- These blockers were turned into gaps on 2026-09-15: [[PFD-66405 Gap Stories]].` |
| A18 | 1/3 | **A3 passes**: exactly the gap note, the intake note and the daily note. **A1 fails**: also `Questions/2026-09-15 Is PFD-66409 still the navigation story or does it need reopening.md`. **A2 fails**: also `Questions/2026-09-15 Should the order search grid show Ordered Qty.md` |
| A19 | 0/3 | replies run 14, 10 and 8 non-blank lines against a limit of five. None opens with the first-line sentence. A1 and A2 also narrate their own machinery: A2 opens `"Drafting the PFD-66405 gap stories now, running in the background. … I'll report back when it's done."` and A1 spends a paragraph on `"while the subagent was drafting, PFD-66644 was edited live in Jira"`. All three do link the note and say nothing can be created |
| A20 | 3/3 | flag 0 on all three and every Summary says the ticket moved after the note's date. A1: `"The ticket has moved since that check: PFD-66405 was last updated 2026-09-15, a later day than the note's check line."` |

Scenario A total: **9 of 22 checks pass, 42 of 66 rep-checks** (control: 3 of 22, 9 of 66).

## GREEN, repeat run

`t2` on each A copy, fresh session, same copy. `gn-run1.md` is the gap note as it stood after `t1`.

| Check | Result | Notes |
|---|---|---|
| U1 | 3/3 | `writes_tried` 0 on every `t2` |
| U2 | 3/3 | as above |
| R1 | 3/3 | no `G` number or kind changed on any rep. On A3 the comparison is empty on both sides, because A3 has no `\| G<n> \|` rows at all — a pass that proves nothing |
| R2 | 0/3 | row counts unchanged from `t1` and so wrong for the same reason: A1 6, A2 6, A3 0. Exactly one `*Gap Stories*` file per copy on all three, so the second half holds |
| R3 | 0/3 | every rep deleted a held gap's line on the repeat run. **A1** dropped its G5 line, `- **G5** — [[2026-09-15 Is PFD-66409 still the navigation story or does it need reopening]] …`. **A2** dropped two, including its G1 line for the order-search question, plus a paragraph from a Stories block. **A3** dropped both of its waiting lines and rewrote them |
| R4 | 3/3 | `grep -c 'PFD-66405 Gap Stories'` on the intake note is 1 on all three: the second run added nothing |
| R5 | 3/3 | exactly 2 daily lines on all three. A1's second: `- 15:23 gap stories [[PFD-66405 Gap Stories]]: repeat run, no gap or state change; …` |

Repeat run total: **5 of 7 checks pass, 15 of 21 rep-checks.**

## GREEN, scenario B

`t1` of each create rep, scored on `vault-t1`. Fresh-intake flag 0 on all three, so B8 scores.

| Check | Result | Notes |
|---|---|---|
| U1 | 3/3 | `writes_tried` 0 on `t1` and `t2` |
| U2 | 3/3 | as scenario A |
| B1 | 1/3 | **C2 passes** exactly: `Buildable after 4 changes and 1 ruling.` **C1**: `Buildable after 3 changes and 3 rulings.` **C3**: `Buildable after 4 changes and 3 rulings.` |
| B2 | 0/3 | row count is 5 in none: C1 6, C2 6, C3 7. C2 gets G1 to G4 right — `close PFD-66407 … PFD-66644 … drafted`, `re-scope PFD-66405`, `link fix`, `waiting` — then puts a second `link fix` at G5 and the creatable story at G6. C1's G1 is `close PFD-66644`, not `close PFD-66407`, and it has no `new` gap at all. C3 splits blockers 1, 2 and 3 into four gaps and its G5 is the popup UI |
| B3 | 0/3 | `### G(1\|2\|3\|5)` is 3 on all three, never 4; `### G4` is 0 on all three, which is the half that holds |
| B4 | 0/3 | expected `1 0`. **C1 prints `3 0`** — three lines under G1 name PFD-66644 where the recipe wants one. **C2 prints `2 0`**. **C3 prints `1 2`**: its G1 is a `new` gap with a full `**Story.**` and `**Acceptance criteria.**` block |
| B5 | 1/3 | plain words 0 on all three. **C3 passes** all of A13, A14, A15. **C1 fails** A14 (2 `[[` in Stories) and A15 (2 bad strings). **C2 fails** A15 with 7, all bare range continuations: `\`…V33__appt_order_projection.sql:2\` to \`:5\`` |
| B6 | 1/3 | **C2 passes** with exactly one line, the Submit question. C1 and C3 both have 3, having opened extra questions |
| B7 | 1/3 | **C2 passes**: `- 15:10 gap stories [[PFD-66405 Gap Stories]]: 4 drafted, 1 waiting`. **C1** has the right form and the wrong counts. **C3 wrote no clock time at all**: `- gap stories [[PFD-66405 Gap Stories]]: 4 drafted, 3 waiting` |
| B8 | 0/3 | the intake note is right on all three — 0 removed, exactly 1 added line naming the gap note, and the answered question note untouched. All three fail on the extra file: C1 wrote two new `Questions/` notes, C2 and C3 one each |
| B9 | 0/3 | the epic line is present on all three and the quoted-search count clears 5 on C1 and C2. The `vault proposals:` half fails on all three: C1 has three such lines where the check counts one, C2 writes them as `- vault proposals (G1): …` so the pattern misses, and C3 writes `- vault proposals: none` on a fixture whose triage note exists |
| B10 | 0/3 | no rep drafted the V2 eligible-orders route as G5. **C1** has no story block at all — its G5 is `waiting on a ruling`. **C2** drafted the story, correctly scoped and with criteria naming the fields, but numbered it **G6**, and its criteria describe seeding the catalog rather than a read route. **C3's G5** is the popup UI, which is PFD-66405's own scope |
| B11 | 2/3 | `summary ~` searches: C1 6, C2 7, C3 6. **C1 and C2 pass**: the searched block records PFD-66644 against a quoted search and the reply names it as covering the catalog and the seeding — C1, `"G1 — close PFD-66644: it seeds the V2 order projection and settles V1-vs-projection"`. **C3 fails**: no quoted-search line in its searched block names PFD-66644, because C3 found it from the epic children only |

Scenario B total: **2 of 13 checks pass, 12 of 39 rep-checks** (control: 2 of 12 scored).

## GREEN, create step

`t2`, resumed on `t1`'s session, prompt `create G2 and G5`. C6 and C7 are skipped by the user:
the Task 1 gate answer was no, so no turn ever sent a yes and no create was attempted.

| Check | Result | Notes |
|---|---|---|
| C0 | 3/3 | `1 0` on all three resumed session files: the overridden prompt reached every turn and `create G1 and G2` was never sent |
| C1 | 2/3 | **C1 passes**: `"G2 is \`re-scope PFD-66405\`: not a new ticket, it's a rewrite of PFD-66405's own description. The replacement text is already drafted in [[PFD-66405 Gap Stories]] under G2, ready for PFD-66405's owner to paste in."` **C2 passes** with the same shape. **C3 fails**: its reply never mentions G2, because on C3's own numbering G2 is a held gap, not a re-scope |
| C2 | 0/3 | `jqls "$D/t2.jsonl" \| grep -c 'summary ~'` is **0 on all three**. C1 and C2 made no tool call at all on the create turn; C3 made one `Edit`. No duplicate check ran because no rep reached a preview |
| C3 | 0/3 | no rep produced a preview, so there are no fields to read. The cause is the numbering, not the create rules: on C1 G5 is a held gap, on C2 G5 is a link fix, and on C3 G5 was the popup UI that the turn then re-labelled |
| C4 | 0/3 | no preview text exists to test |
| C5 | 0/3 | `writes_tried` 0 on all three and the vault is byte-identical before and after on C1 and C2, so nothing was written. All three fail the first clause, `reply asks for a yes`: C1 and C2 end by pointing at drafted text with no preview to approve, and **C3 fails the vault clause too** — its create turn edited the gap note instead, changing G5's kind from `new` to `re-scope PFD-66405`, replacing its story block, and rewriting two build-order steps |
| C6 | skipped by the user | gate answer no, 2026-09-15 |
| C7 | skipped by the user | gate answer no, 2026-09-15 |

Create step total: **1 of 6 scored checks pass, 8 of 18 rep-checks.**

## Plain-words check

`grep -ciwE 'premise|sweep|verdict|provenance|routing'` is 0 on all six gap notes and 0 on
`skills/gap-stories/SKILL.md`.

## The one failure behind most of the others

Every rep found more gaps than the worked example, and found them the same way: an item the intake
note already records as a settled fact became a gap of its own, with a brand-new question note to
hold it.

- **A1** turned the closed PFD-66409 into `Questions/2026-09-15 Is PFD-66409 still the navigation
  story or does it need reopening.md` and made it G5 — then wrote in the note itself that
  PFD-66409's own comment thread `"already carries the answer in substance"`.
- **A2** turned the Ordered Qty column into `Questions/2026-09-15 Should the order search grid show
  Ordered Qty.md` and made it G4, although the intake note's own row already settles it:
  `"V1's own popup shows Customer, Order #, Ship Date, PO #, Customer Load Id, DT # and Shipment ID,
  but no Ordered Qty"`.
- **C1** opened two, for Ordered Qty and for PFD-66409.
- **C3** opened one for Ordered Qty, and split blockers 1, 2 and 3 into four separate gaps.

The example folds both of those into the `re-scope PFD-66405` gap, where they are corrections to
the ticket's own text, not questions anyone owes an answer to. Each extra gap adds a row (A7, B2),
a waiting line (A11, B6), a count to the first line (A4, B1) and a daily line (A16, B7), writes a
file the run should not write (A18, B8), and shifts the numbers so that the create step's `G5` is
no longer the creatable story (C2 to C5).

## Refactor

One targeted edit per failing check group. No rep was re-run — the reps are done — so each edit is
reasoned from what the transcript shows the run actually read and did.

| # | Answers | Edit | Why this wording |
|---|---|---|---|
| 1 | A4, A7, A8, A11, A18, B1, B2, B3, B6, B8, and the numbering that blocks C2–C5 | In **Find the gaps**, three sentences: an `Also:` item or a `no` row the same fix clears belongs to that gap; a wrong claim in the ticket's own text is part of the re-scope, not a question; only a question the intake note itself leaves open is a `waiting` gap | The runs did not break a stated rule — the rule was not there. The skill said candidates "one fact would clear together are one gap" and left it to judgment which items those are. The three sentences name the exact two items every rep got wrong |
| 2 | A18, B8 | In **One kind per gap**, narrowed the question-note rule: create a note only for a question the intake note leaves open with no note yet; a question invented to hold a gap is not one | Line 49 read `Create that note through open-questions, one note per question`, which licensed exactly what A1, A2, C1 and C3 did. The narrowing removes the licence without removing the real case |
| 3 | A3, A7, R2 | In **The gaps**, one clause: the `#` cell holds the number with its G | A3 read the column header `#` literally and wrote `\| 1 \|`. Nothing in the note recipe said otherwise; the G form appeared only in the Find-the-gaps prose |
| 4 | A15, B5 | In **Evidence**, one clause: one whole citation per line inside one pair of backticks, no bare `\`:14\`` continuation, the clone's name inside the backticks | Both failures are the same shape written two ways. A3 put the clone name outside; C1 and C2 wrote ranges as a second backticked fragment. The example line already showed the right form — the rule now says the two things that break it |
| 5 | A14, B5 | A Common-mistakes row quoting A2's Evidence wikilink | The skill said "no wikilinks" once, in a sentence about pasting into Jira, and both reps that broke it did so in an Evidence line, which does not feel like paste-ready text. The row names that exact spot |
| 6 | A16, B7 | In **Other writes**, one clause: HH:MM is the clock time and nothing follows the counts | C3 copied the recipe line and dropped the placeholder rather than filling it. Naming HH:MM as the clock time closes that |
| 7 | A19 | Tightened **Chat summary** (no table, no headings, no extra findings) plus a Common-mistakes row quoting A2's progress message | Every reply broke the five-line limit the same way: a table or an extra findings section, and in A2's case a whole message announcing the work before doing it. The limit was stated; what counts against it was not |
| 8 | B1, B3, B6 on C3 | A Common-mistakes row quoting C3's refusal of the answered question | C3 read `status: answered` and overrode it from its own reasoning. Line 49 told it to draft from the answer; the row makes the excuse itself the thing that is wrong |
| 9 | the `SKILL.md:46` ambiguity flagged in the brief | `for the owner of the ticket that carries it` → `addressed to the owner of the ticket this gap's Existing ticket cell names` | A3 tripped on it: its link-fix block is addressed `**For whoever maintains the epic's links.**` The Existing ticket cell for a `link fix` is already defined in the note recipe, so pointing at it is exact |

**Round count.** Each of these is round 1. No check has had three rounds, and none is left open on
the three-round rule.

**Checks these edits do not answer, and why.**

- **A9, A10 on A1** and **B4, B10** are failures of which gap gets which kind, not of a missing
  rule. A1 made the order-data gap a `close` on fixture A, where its ruling is open; C1 made it a
  `close PFD-66644` instead of `close PFD-66407` on fixture B. The skill already carries the rule —
  "A gap waiting on a ruling records its match and splits only once the ruling lands", with a worked
  example. Edits 1 and 2 shrink the gap set back to the example's, which is the precondition for
  these; whether that is enough cannot be told without a rep, so they stay as round 1 and are
  reported unresolved rather than patched twice.
- **C2, C3, C4, C5** could not be tested at all. The overridden prompt names `G5` by number, and in
  no rep was G5 the creatable story, so every create turn stopped at the kind check — which is
  correct behaviour for the numbering it had. There is no evidence of a defect in the create rules
  themselves, so no edit was made against them. They become testable once edits 1 and 2 bring the
  numbering back to the worked example.
- **R3** is a real defect with no clean loophole to name: each repeat run rewrote its waiting lines
  rather than keeping them. The Repeat-runs section already says "Keep every gap row and every
  block" and names the waiting case. Rewriting a line is not obviously deleting it, so the next
  round should change form — a slot the run fills rather than prose it must obey — not words.

## What the checks could not settle

- **Subagent use.** A1, A2 and C2 each dispatched one `Agent` call to do the drafting. Nothing in
  the checks forbids it, and all three still wrote a correct note. It does show up in A19: A1 and A2
  both spend reply lines narrating what their subagent did, which is part of why the replies run
  long.
- **The gap set has no single right answer the checks can prove.** The worked example is four gaps
  on A and five on B. Six reps produced six different sets, and several of the extra gaps are
  defensible readings of the same intake note. The checks score against the example, so they score
  those as failures; that is the right call for a baseline, but it means A7 and B2 measure agreement
  with one grouping, not correctness in the abstract.
- **A3's missing triage note.** A3 wrote that `Sprint To-Do Triage - 2026-09-09` "does not exist
  anywhere in this vault". It does, at `Status/Sprint To-Do Triage - 2026-09-09.md`. A6 still scores
  a pass for A3 because the check greps for the note's name on the proposals line and finds it. The
  check cannot tell a hit from a denial of a hit. Worth knowing before A6 is trusted.
- **C3 doubted the fixture.** C3 read the answered question note and called it fabricated, citing the
  2026-09-11 daily note and handoff. That reasoning is sound about the fixture as built — the
  fixture appends an answer without touching the day's other notes — so C3 found a real
  inconsistency in the test data, then drew the wrong conclusion from it. Edit 8 addresses the
  conclusion. The fixture's own gap is the user's call.

---

# gap-stories — GREEN round 2, 2026-09-15

Same six-rep shape as round 1, against the skill carrying round 1's nine edits (136 lines at the
time of the run) and against two fixed pieces of test apparatus.

**What changed in the apparatus since round 1.**

1. **Fixture B was rebuilt to agree with itself.** It used to mark the order-search question
   answered while the 2026-09-11 daily note and the PFD-66405 handoff still called it open. Three
   files now differ between A and B instead of one, and two sums were added for the two new ones.
   Fixture A is untouched and its four sums are unchanged. This is the round-1 finding C3 raised
   when it called the answer fabricated; C3 was right about the data.
2. **A6 was tightened.** It could be passed by a run that named the triage note while denying the
   note exists — round 1's A3 did exactly that. A6 now also runs a command that fails a proposals
   line saying the note is missing, could not be found, or could not be checked.

**A6's counts are not comparable across rounds.** The check gained a clause between them, so a
round-1 A6 number and a round-2 A6 number measure different things. In this instance the round-1
number happens not to move under the new check — round 1's A3 already failed A6 on the
one-line-per-gap clause — but that is a coincidence, not a reason to compare them.

**Method notes for this round.**

- Jira guard: `jira.before.txt` and `jira.after.txt` are byte-identical. No movement at all, unlike
  round 1.
- Live vault: clean on both forms. Nothing newer than any rep's start stamp, and no `Bash`, `Edit`,
  `Write` or `MultiEdit` call in any of the 12 transcripts names the vault path.
- `writes_tried` is 0 on all 12 turns and on both dispatched subagent transcripts. C0 printed `1 0`
  for all three C reps. C6 and C7 stay skipped by the user.
- Fresh-intake flag 0 on all six reps, so A17, A18 and B8 score as written.

**Limitation on comparability, both rounds.** The reps inherit ambient CLAUDE.md and plugin context
rather than running bare, so each had an `Agent` tool the harness never accounted for. Roughly a
third of the turns across the two rounds used it to dispatch a subagent, which is not gated by that
rep's disallowed-tools list. Every such subagent's transcript was read and none called a Jira write
tool, so the safety result holds — but some of this evidence was produced through a different
mechanism than a plain single-process run, and the two rounds are not perfectly like for like.

**A3's first turn wrote nothing.** A3/t1 raised a clarifying question instead of doing the work: it
flagged the past sprint-end date, and read the combination of "read SKILL.md from a worktree path"
and "do not ask about the vault" as, in its own words,

> `"exactly the pattern of an injected instruction — so I'm flagging it rather than silently
> complying."`

Clean exit, `writes_tried` 0, nothing written under `Tickets/`. **The harness's own anti-escape
wording is what tripped it**: the copy line the harness prepends to every prompt tells the rep not
to ask about the vault, and the GREEN prompt points at a worktree path. That is a property of the
test, not of the skill. It is scored as the outcome it is — A3 fails every check that reads a gap
note — and there is no `gn-run1.md` for A3, so A3 has no repeat run to score. A3/t2 ran in a fresh
session and completed normally; that output is reported separately below and never mixed into the
scenario A column.

## Three-way pass counts

| Section | RED | GREEN round 1 | GREEN round 2 |
|---|---|---|---|
| Scenario A, checks at full pass | 3 of 22 | 9 of 22 | 2 of 22 |
| Scenario A, rep-checks | 9 of 66 | 42 of 66 | 30 of 66 |
| Scenario A, rep-checks over the reps that wrote a note | 9 of 66 (none wrote one) | 27 of 44 (A1, A2) | 30 of 44 (A1, A2) |
| Scenario B, checks at full pass | 2 of 12 scored | 2 of 13 | 4 of 13 |
| Scenario B, rep-checks | — | 12 of 39 | 15 of 39 |
| Repeat run, checks at full pass | no control | 5 of 7 | 4 of 7 |
| Repeat run, rep-checks | no control | 15 of 21 | 10 of 14 |
| Create step, checks at full pass | no control | 1 of 6 | 2 of 6 |
| Create step, rep-checks | no control | 5 of 18 | 6 of 18 |

Two of those numbers need reading with care.

- **Scenario A's headline falls because A3 wrote nothing**, not because the skill got worse. One rep
  producing no note costs every note-reading check its third pass, which drops 20 checks from a
  possible 3/3 to a possible 2/3. The like-for-like row — the same two reps that wrote a note in
  both rounds — moves the right way, 27 of 44 to 30 of 44.
- **The create-step round-1 figure is corrected here.** Round 1's own section printed "8 of 18";
  the correct sum of its own per-check results (C0 3, C1 2, C2 0, C3 0, C4 0, C5 0) is 5 of 18. The
  per-check results in that section were right; only the total was wrong.

## GREEN round 2, scenario A

Three reps, `t1`. A3/t1 produced no gap note, so every check whose object is that note fails for
A3; `changed "$D" A` after A3/t1 is empty.

| Check | R1 | R2 | Notes on round 2 |
|---|---|---|---|
| U1 | 3/3 | 3/3 | `writes_tried` 0 on every turn and on both subagents; guard byte-identical |
| U2 | 3/3 | 3/3 | clean on both forms this round, with no ruling needed |
| A1 | 3/3 | 2/3 | A1 and A2 each one note at the right path. **A3: none** |
| A2 | 3/3 | 2/3 | `client created jira status type`, `proposal`, `draft`, today's date — both notes |
| A3 | 2/3 | 1/3 | **A2 passes.** **A1 fails**: `fm_jira` is `PFD-66405 PFD-66391 PFD-66644 PFD-66409` — PFD-66407 is missing, though the check requires it |
| A4 | 1/3 | 0/3 | A1 and A2 both `Buildable after 4 changes and 2 rulings.` where the example wants `2 changes and 2 rulings` |
| A5 | 3/3 | 2/3 | both notes link the intake note and carry 2026-09-11 |
| A6 | 2/3 | 2/3 | scored on the new check, **not comparable with round 1**. A1 and A2 pass all four clauses including the new one: `deny` prints 0 for both. A3 has no note |
| A7 | 0/3 | 0/3 | header correct on both notes; rows are **6 and 6**, never 4 |
| A8 | 0/3 | 0/3 | both reps split blockers 1, 2 and 3 in the same place. A1's G1 clears `1, 3` and its G2 clears `2`; A2's G1 clears `1, 3` and its G2 clears `2` |
| A9 | 2/3 | 0/3 | `### G(1\|4)` is **2** on both and `### G(2\|3)` is **1** on both. A knock-on of the numbering: on both reps G1 is a drafted `new` story and G4 is a drafted `close`, where the example holds G1 and drafts G2 |
| A10 | 1/3 | 0/3 | same knock-on: on both reps G2 is the held ruling and G3 is the re-scope, so the G2 and G3 slots the check reads hold the wrong kinds. The re-scope text itself is right on both — A2's opens `Nothing exists to enable — no button, no popup, no "no search results" pattern anywhere in phenix.ui to copy` |
| A11 | 1/3 | 2/3 | **improved.** A1 and A2 both have exactly 2 lines, each with the question link, `owed by [[Rob Park]]` / `owed by Rob Park`, what each answer changes, and PFD-66644 named in the projection half |
| A12 | 3/3 | 2/3 | 5 numbered steps on both, each naming PFD-66405 |
| A13 | 3/3 | 2/3 | 0 on both notes |
| A14 | 2/3 | 2/3 | A1 and A2 both clean — round 1's A2 failure does not repeat |
| A15 | 2/3 | 2/3 | **0 bad strings on both.** Round 1's A3 failure — the clone name outside the backticks and bare `` `:14` `` continuations — does not repeat |
| A16 | 1/3 | 0/3 | form is right on both (`- 16:12 gap stories [[PFD-66405 Gap Stories]]: 4 drafted, 2 waiting`); the counts are wrong because the gap set is |
| A17 | 3/3 | 1/3 | **A1 passes**, 0 removed and 1 added: `- [[PFD-66405 Gap Stories]]`. **A2 fails**: it added **two** lines in one run — `- [[PFD-66405 Gap Stories]] drafts the gaps found here into stories, rulings, and a link fix.` and `- Gap stories for the five blockers and the Also: line worked out in [[PFD-66405 Gap Stories]].` |
| A18 | 1/3 | 2/3 | **improved.** A1 and A2 each changed exactly the gap note, the intake note and the daily note. **Neither wrote a `Questions/` file** — the round-1 behaviour that failed both |
| A19 | 0/3 | 0/3 | **much closer.** Non-blank lines 14, 10, 8 in round 1; **6, 9, 5** in round 2. A1 is one line over, and that line is a greeting: `Gap note written for PFD-66405. Summary:` before the first-line sentence. A2 still narrates: `"One line was also added to the intake note linking it (I had to fix this myself — the drafting agent reported adding that line but hadn't)"` |
| A20 | 3/3 | 2/3 | A1: `"Jira's \`updated\` on PFD-66405 is 2026-09-15T15:42 — later than the note's check date."` A2 the same. A3's reply raises the sprint date but never the ticket's `updated` against the note's `Checked` |

Scenario A total: **2 of 22 checks, 30 of 66 rep-checks**; over A1 and A2 only, **30 of 44** against
round 1's 27 of 44.

### A3's second turn, reported separately

A3/t2 ran the same prompt in a fresh session on the same copy and completed. It is not scenario A
and is not counted above, but it is the only look at what A3 does when it does the work:
6 gap rows, `Buildable after 2 changes and 3 rulings.`, evidence form clean (0 bad strings), and a
new `Questions/2026-09-15 Confirm the order-details destination in V2.md` — the round-1 behaviour
edit 2 was meant to stop, still present on fixture A. Its proposals line is
`- vault proposals: [[Sprint To-Do Triage - 2026-09-09]] item 1, or none`, the recipe's own
placeholder pasted through.

## GREEN round 2, repeat run

A1 and A2 only. A3 has no `gn-run1.md`, because its first turn wrote no note, so there was nothing
to repeat; its `t2` was a first run and is excluded.

| Check | R1 (3 reps) | R2 (2 reps) | Notes on round 2 |
|---|---|---|---|
| U1 | 3/3 | 2/2 | `writes_tried` 0 on both `t2` turns |
| U2 | 3/3 | 2/2 | clean |
| R1 | 3/3 | 2/2 | no G number or kind changed on either rep, and unlike round 1's A3 both comparisons have rows in them |
| R2 | 0/3 | 0/2 | 6 rows on both, unchanged from `t1`. Exactly one `*Gap Stories*` file each |
| R3 | 0/3 | 1/2 | **A2 passes clean**: 0 lines removed from Stories, 0 from Waiting. **A1 fails badly**: 18 Stories lines and 2 Waiting lines removed, including two whole blocks — `### G4 — PFD-66644 already breaks the block cycle` and `### G6 — PFD-66409 already ships navigate-to-order` — plus both waiting lines rewritten. A1's `t2` is the turn that dispatched a subagent |
| R4 | 3/3 | 1/2 | **A1 passes** with 1. **A2 fails** with 2 — the same two-line defect as A17, so the second run inherited it rather than adding to it |
| R5 | 3/3 | 2/2 | exactly 2 daily lines on both |

Repeat run total: **4 of 7 checks, 10 of 14 rep-checks** — the same per-rep rate as round 1's
15 of 21.

## GREEN round 2, scenario B

`t1` of each create rep, scored on `vault-t1`. Fixture B now agrees with itself.

| Check | R1 | R2 | Notes on round 2 |
|---|---|---|---|
| U1 | 3/3 | 3/3 | 0 everywhere |
| U2 | 3/3 | 3/3 | clean |
| B1 | 1/3 | 0/3 | **all three now get the ruling count right** and none gets the change count: `Buildable after 3 changes and 1 ruling.` (C1), `6 changes and 1 ruling` (C2), `3 changes and 1 ruling` (C3). The example wants 4 and 1 |
| B2 | 0/3 | 0/3 | rows 4, 7, 4; the example wants 5. C1 and C3 now under-count as well as mis-group |
| B3 | 0/3 | 0/3 | `### G(1\|2\|3\|5)` is 3, 4, 2. **C2 reaches 4 but fails the second clause**: it has a `### G4 — Build the popup as new work`, and G4 is meant to be the held gap |
| B4 | 0/3 | 0/3 | C1 prints `1 2` — one line names PFD-66644, but its G1 is a `new` gap carrying `**Story.**` and `**Acceptance criteria.**`. C2 prints `2 2`. C3 prints `4 0` |
| B5 | 1/3 | 1/3 | **C3 passes all of A13, A14, A15.** C1 fails A14 with 2 wikilinks inside its replacement-description block quote. **C2 fails both halves of A14**: 1 wikilink and 2 person-name hits — `Rob Park's ruling ([[2026-09-11 Does the outbound order search read V1 live or a V2 order projection]], answered 2026-09-11)` sits inside the Stories section |
| B6 | 1/3 | **3/3** | **fixed.** Exactly one waiting line on every rep, and it is the Submit question on every rep. No rep re-opened the answered order-search question, and no rep invented a third. The two causes round 1 identified — the self-contradicting fixture and the missing rule — are both gone |
| B7 | 1/3 | 0/3 | form right on all three, counts wrong on all three. Round 1's C3 defect — a daily line with no clock time — does not repeat |
| B8 | 0/3 | **3/3** | **fixed.** Every rep changed exactly the gap note, the intake note and the daily note. 0 removed and 1 added line in the intake note on all three. The answered question note is untouched on all three. **No rep wrote a `Questions/` file** |
| B9 | 0/3 | 1/3 | **C2 passes** all four clauses. **C1 fails** the one-line-per-gap clause, 4 quoted searches for 4 gaps where 5 are wanted, and its proposals line is the placeholder — `- vault proposals: [[Sprint To-Do Triage - 2026-09-09]] item 1, or none`. **C3 fails**: `- vault proposals: none`, on a fixture where the triage note is present |
| B10 | 0/3 | 0/3 | no rep drafted the route story as G5. C1 and C3 have no G5 at all; C2's G5 is `close PFD-66644` |
| B11 | 2/3 | 1/3 | JQL and searched-block halves pass on all three (`summary ~` counts 4, 6, 4; PFD-66644 recorded against a quoted search 2, 2, 1 times). **C3 passes** the reply half: `"G1, close PFD-66644 (drafted): the new ticket already covers most of the old seeding blockers"`. **C2 fails** it by saying the opposite — `"despite PFD-66644 sounding like it does"`. **C1 fails** it because its whole reply is one stray paragraph about a memory file it could not edit, with no summary in it at all |

Scenario B total: **4 of 13 checks, 15 of 39 rep-checks**, against round 1's 2 of 13 and 12 of 39.

## GREEN round 2, create step

| Check | R1 | R2 | Notes on round 2 |
|---|---|---|---|
| C0 | 3/3 | 3/3 | `1 0` on all three resumed session files |
| C1 | 2/3 | **3/3** | **fixed.** All three now name G2 as a re-scope and point at its drafted text. C3: `"G2 is a re-scope, not a new or split gap — only those two kinds get created in Jira. The fix already sits in the note … ready to paste into PFD-66405's own description, for its owner to apply."` |
| C2 | 0/3 | 0/3 | `jqls "$D/t2.jsonl" \| grep -c 'summary ~'` is 0 on all three. C1's turn made one `Read` call; C2's and C3's made none |
| C3 | 0/3 | 0/3 | no preview anywhere. G5 does not exist in C1's or C3's note, and is a `close` in C2's |
| C4 | 0/3 | 0/3 | no preview text to test |
| C5 | 0/3 | 0/3 | **improved but still fails.** `writes_tried` 0 on all three and `diff -rq vault-t1 vault` is now **empty on all three** — round 1's C3 edited its gap note on the create turn and no longer does. All three still fail `reply asks for a yes`, because no preview was reached. All three do offer the right alternative: C3, `"If you meant G4 (the one gap that is createable), say \"create G4\" and I'll run the duplicate check and show you the preview before anything gets made."` |
| C6 | skipped | skipped | gate answer no |
| C7 | skipped | skipped | gate answer no |

Create step total: **2 of 6 checks, 6 of 18 rep-checks**, against round 1's 1 of 6 and 5 of 18.

## Did the dominant round-1 cause move?

Partly, and the half that matters most did not.

**What moved.** The extra `Questions/` note is gone where the skill could reach it. Round 1: five of
six reps wrote one. Round 2: none of the three B reps, and neither A rep that did the work. A18 goes
1/3 to 2/3 and B8 goes 0/3 to 3/3 on that alone.

**What did not move: the gap count.** Round 1 produced 6, 6, 5 gaps on fixture A and 6, 6, 7 on B.
Round 2 produced 6, 6 (and 6 on A3's second turn) and 4, 7, 4. The example wants 4 and 5. Every A
rep in both rounds splits in the same place, and it is a place the skill already had a rule for:

> A1's table: `| G1 | V2 has no read path over eligible (unlinked) orders to search | new | 1, 3 …`
> and `| G2 | Search backing unsettled: V1 live versus a V2 projection | waiting on a ruling | 2 …`

> A2's table: `| G1 | V2 has no source of eligible … orders to search, and no API operation to read
> one | new | 1, 3 |` and `| G2 | The ticket says the search reads V1's endpoint; PFD-66407 assumes
> a seeded V2 projection … | waiting on a ruling | 2 |`

Blocker 2 is the open question blockers 1 and 3 wait on. The skill has said since before round 1
that such a blocker is part of the same gap — "including a blocker that is the open question another
blocker waits on" — and six reps across two rounds have read that sentence and split anyway.

The `Also:` item also still gets its own row, but here round 1's edit half-landed: A2's G6 is
`re-scope PFD-66405`, which is the kind the edit asked for, sitting in a row of its own rather than
folded into G3. The rule changed the kind and not the grouping.

That is the signal the coordinator asked for, and it says the same thing R3 said in round 1:
**more wording will not fix this.** Round 2's edit for it is a change of form.

## Refactor, round 2

Five edits. `SKILL.md` goes from 136 to 148 lines. Plain-words check 0 on the skill and 0 on every
round-2 gap note.

| # | Round | Answers | Edit | Reasoning from the transcripts |
|---|---|---|---|---|
| A | **2 of 3** | A4, A7, A8, A9, A10, A16, B1, B2, B3, B4, B7, B10, and the numbering that blocks C2–C5 | Replaced the judgment sentence in **Find the gaps** with a three-step merge the run performs before numbering: an open-question blocker never gets its own row and carries the kind `waiting on a ruling`; an `Also:` item or `no` row never gets its own row when another gap's drafted text covers it; any remaining pair one answer settles is one row. Closes with "A run that ends with a row per blocker did not merge" | **Change of form, not of wording**, as concluded above. The old text stated the conclusion ("are one gap") and left the run to spot the case. Every rep's table shows it spotting the opposite. The merge is written as three yes-or-no tests applied in a fixed order to a list the run already has, with the exact blockers-1-2-3 case named in the test itself, so there is nothing left to judge. The closing line gives the run a way to tell it did it wrong |
| B | 1 of 3 | A17, R4 | **Other writes**: grep the intake note for `KEY Gap Stories` first; one hit or more, change nothing; no hit, add the one line | A2 added two Facts-established lines in a single run and then carried both into its repeat run. The old text said "Write it once", which a run reads as "write one line", not "check whether one is already there". The grep turns it into a condition the run can evaluate |
| C | **2 of 3** | A19 | **Chat summary** rewritten as five numbered slots with "nothing before or after them", "count them before sending", and "no greeting" | Round 1's edit moved the replies from 14/10/8 lines to 6/9/5 — it worked, and stopped one line short. A1's sixth line is a greeting, `Gap note written for PFD-66405. Summary:`, placed before the first-line sentence; A2's overflow is a narration line about its own subagent. Naming the slots, and naming the greeting as one of the things that is not a slot, is what the two overflows have in common |
| D | 1 of 3 | A6, B9 | **Summary** recipe: the `or no match` / `or none` alternations removed from the code block, with a sentence saying when each applies and that proposal notes sit anywhere in the vault | Two reps wrote the recipe's alternation through verbatim — `- vault proposals: [[Sprint To-Do Triage - 2026-09-09]] item 1, or none` — and C3 wrote `- vault proposals: none` on a copy that has the note. A block a run copies is a block that must not contain a choice |
| E | **2 of 3** | A14, B5 | **Stories** recipe: read the finished section back before moving on — no `[[`, no person's name, `"the acting scrum master"` never `"Rob Park"` | Round 1's mistakes row halved the wikilink failures but C2 put both a wikilink and `Rob Park` twice into a Stories block. A row in a table at the end of the skill is read before the work; a read-back is a step inside the work, at the point where the text exists to check |

Two Common-mistakes rows were added alongside edits A, B and D, each quoting the round-2 failure it
answers: the G1/G2 split of blockers 1, 2 and 3; the pasted-through `or none` placeholder; and the
second Facts-established line.

## Checks now on round 3 of 3

These have had two edits and must change form again, or be left open, next round: **A4, A7, A8, A9,
A10, A16, B1, B2, B3, B4, B7, B10** (all one group, the gap count), **A19**, **A14 / B5**.

## Checks left open, and why

- **C2, C3, C4, C5.** Still untestable, for the same reason as round 1 and with more evidence for it:
  the create prompt names `G5`, and G5 is not the creatable story in any of six reps across two
  rounds. Every create turn stopped at the kind check, correctly for its own numbering, and all
  three round-2 turns named the number that *is* createable. No edit was made against the create
  rules because nothing in the evidence points at them. They unlock if and when edit A lands.
- **R3.** Left open a second round, deliberately. Round 1 concluded it needed a change of form and
  round 2 does not spend that change: A2 now passes R3 clean, and A1's failure came on the one turn
  in the batch that dispatched a subagent to rewrite the note. Until it is known whether R3 fails
  without a subagent in the loop, an edit would be aimed at the wrong thing.
- **A3 (the check), A17 on A2, B11 on C1.** Single-rep failures with no shared cause; edit B covers
  A17. A1's missing PFD-66407 from `jira` and C1's replyless reply are recorded and not yet edited
  against, because one rep each is not yet a pattern.

## What this round could not settle

- **A3/t1 is a test artifact, not a skill result.** The harness prepends "Use that copy, never the
  real vault, and do not ask about it" to every prompt, and the GREEN prompt points the rep at a
  SKILL.md inside a worktree. A3 read the pair as an injection attempt and stopped. That is arguably
  the right instinct in general, and it is not something the skill can or should fix. It cost
  scenario A a full third of its rep-checks this round. If the batch is re-run, the copy line is
  worth rewording first.
- **Subagent dispatch is unaccounted for in the harness.** Two round-2 turns and three round-1 turns
  dispatched one. None called a Jira write tool. But A1's repeat run is the only R3 failure this
  round and it is also the only repeat turn that used one, which is suggestive and not provable from
  five instances.
- **B1's change count may be measuring the gap count twice.** All three B reps now get "1 ruling"
  right and none gets the change count, and the change count is just the number of drafted gaps. B1,
  B7, A4 and A16 all fail on arithmetic over a gap set that is the real defect. They are counted as
  four failing checks here; they may be one.
