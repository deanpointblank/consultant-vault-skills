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
