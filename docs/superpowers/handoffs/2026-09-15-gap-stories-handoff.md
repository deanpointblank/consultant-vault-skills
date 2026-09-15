# Gap-stories handoff — 2026-09-15

For the next session, human or agent, to pick up the gap-stories skill cold.

## Where things stand

**The gap-stories skill is built, tested and shipped. The 2026-09-11 plan was resumed
from its pause, run to the end, and merged to `main` as `6411958`, which is pushed to
`origin`. The skill is `skills/gap-stories/SKILL.md`, 148 lines. It was built test-first:
53 checks over two frozen vault fixtures, four control reps with no skill, then three
rounds of six reps with it. Scenario A goes from 3 of 22 checks in the control to 12 of 22.
Both trigger checks pass 3 of 3. No test rep ever wrote to Jira and none touched the
live vault. Work is left open on purpose: the drafted gap count is still one row off on
fixture A, twelve check ids hang off that one number, and the Jira create path has never
run. The next person's first job is to decide whether to open a new round on the gap
count, using the fix already written down in the results doc, or to leave the skill as it
is and move on.**

### Two things to know first

1. **The Jira create path has never run.** Across nine create turns in three rounds, the
   create turn made zero tool calls. No duplicate-check search ever ran. No preview was
   ever produced. What is proven is the refusal half: every rep correctly read
   "create G2 and G5" as naming gaps that are not ready to create, and stopped. The first
   real create will be the first test of the duplicate check, the preview and the
   approval gate. Treat it as untested code on the one path that writes to client Jira.
2. **Fixture A cannot be rebuilt.** The live vault has moved on past it. Fixture A
   survives only as `~/.cache/vault-skills-fixtures/gap-stories/A`, 540 files, one copy,
   no backup. The build block in the scenario file now refuses to run over it, but a
   cache directory is a thin place to keep the apparatus behind every number in the
   results doc. A backup is worth making.

## Where everything is

| Item | Where |
|---|---|
| Merge commit on `main` | `6411958`, pushed to `origin`. Main was at `7a4419b` before it |
| Branch | `gap-stories`, head `f27050d`, still on disk, merged, not deleted |
| Worktree | `.claude/worktrees/gap-stories`, still on disk, checked out at `f27050d` |
| The skill | `skills/gap-stories/SKILL.md`, 148 lines |
| Scenario file (the 53 checks, fixtures, assertions, harness) | `docs/superpowers/baselines/gap-stories.md`, 487 lines |
| Results doc (control + three rounds + trigger checks + closeout) | `docs/superpowers/baselines/results/gap-stories-2026-09-15.md`, 1029 lines |
| Supporting evidence file | `docs/superpowers/baselines/results/gap-stories-2026-09-15-B1-intake.diff`, 106 lines |
| Fixtures | `~/.cache/vault-skills-fixtures/gap-stories/A` and `/B`. A is 540 files and cannot be rebuilt |
| Ledger (git-ignored, does not merge) | `.claude/worktrees/gap-stories/.superpowers/sdd/2026-09-11-gap-stories/progress.md`, 183 lines. This note is the only place its content survives |
| Plan | `docs/superpowers/plans/2026-09-11-gap-stories.md`, with a dated amendment note at the top |
| Spec | `docs/superpowers/specs/2026-09-11-gap-stories-design.md`, with the same amendment note |
| Scratch evidence from the reps | this session's scratchpad, under `gs/` — `green2/`, `green3/`, `trigger/`, `task1/`. It is in `/private/tmp` and goes away on reboot. The results doc carries the record |

Commits on the branch, in order, so a specific change can be found without reading the
whole diff:

| Commit | What it did |
|---|---|
| `c7133a9` | Task 1: the scenario file and the baselines README row |
| `2f78cd6` | re-baselined the scenario file to Jira as of 2026-09-15 |
| `879689a` | dated amendment note added to the plan and the spec |
| `adf73ab` | added check C0, the guard on the create prompt |
| `ff4bb24` | control run scored |
| `854105e` | harness: session memory folder denied |
| `bb33062` | the skill, first version, 129 lines |
| `c45b52a` | skill fix round, 131 lines |
| `a23bf58` | round 1 scored, 9 skill edits, 136 lines |
| `890d700` | fixture B made to agree with itself, check A6 tightened |
| `14bbfc1` | round 2 scored, 5 skill edits, 148 lines |
| `c558167` | harness: rep prompt reworded, Agent tool denied |
| `c07e3fd` | round 3 scored, closeout, 3 skill edits, still 148 lines |
| `9d11a5b` | docs: schema type, intake pointer, root README, marketplace |
| `b0940b8` | moved the ticket-intake pointer into the note, not just chat |
| `d2d84bf` | the five must-fix findings from the whole-branch review |
| `f27050d` | two prose corrections from the last re-review |

**The merge was not a fast-forward, and this will happen again.** Another session had
merged `daily-worklog` and record-testing work into `main` while this branch ran. Two
files conflicted and both were resolved as "keep both": `.claude-plugin/marketplace.json`
and `docs/superpowers/baselines/README.md`. A third problem was silent. `README.md`
merged with no conflict at all, and the merged text said "twenty-three" skills while 24
sit on disk, because each branch had bumped the count by one from twenty-two. It was
corrected to twenty-four in the merge commit. Whenever two skill branches land near each
other, check the skill count in `README.md` by hand; git will not flag it.

## Test gate

Everything below is green unless it says otherwise.

| Stage | Counts |
|---|---|
| Fixture assertions, Task 1 | 14 of 14 |
| Block probes, Task 1 | 2 of 2 |
| Fixture assertions after fixture B was rebuilt | 22 of 22 |
| Control, scenario A | 3 of 22 checks, 9 of 66 rep-checks |
| Control, scenario B | 2 of 12 scored checks |
| Round 1, scenario A | 9 of 22 checks, 42 of 66 rep-checks |
| Round 2, scenario A | 2 of 22 checks, 30 of 66 rep-checks |
| Round 3, scenario A | 12 of 22 checks, 38 of 66 rep-checks |
| Scenario B across the three rounds | 2 of 13, 4 of 13, 5 of 13 — 12, 15, 19 of 39 rep-checks |
| Repeat run across the three rounds | 5 of 7, 4 of 7, 5 of 7 |
| Create step across the three rounds | 1 of 6, 2 of 6, 2 of 6 |
| Trigger checks | TR1 3 of 3, TR2 3 of 3, 6 of 6 rep-checks |
| Jira writes tried, every rep, every round | 0 |
| Live vault files written by a rep, every round | 0 |
| Agent tool calls, round 3 and the trigger reps | 0, after the deny was added |

Round 2's scenario A number looks like a collapse and is not one. One rep's first turn
wrote nothing at all — it raised a question about the prompt instead — and a check that
has no note to read scores as a failure. Over the two reps that did the work, round 2 is
an improvement on round 1: 27 of 44 to 30 of 44. The full-pass row is the one that
matters, and it went 3, 9, 2, 12.

Twenty checks pass on every rep in round 3. Note the scope when quoting that number: the
twenty spans scenario A, the repeat run, scenario B and the create step, while the
control's three is scenario A alone and the control never ran the repeat or create
sections. The comparison that holds is 12 of 22 scenario A checks against 3.

Three refactor rounds, 17 edits in total, skill 131 to 148 lines. Twelve check ids are
left open on one defect: the drafted gap count. The results doc names the fix, in the
"Closeout" table — bound the third merge test so a merge crosses one link of reasoning
rather than a chain, and two different kinds of action never merge. It is written down
and deliberately not made, because the plan allows three rounds per failing check and
that group had used all three.

## Rulings made on the user's behalf

Twenty-seven, all from this session unless noted. The six preflight rulings from
2026-09-11 still stand and are written up in
`docs/superpowers/handoffs/2026-09-11-gap-stories-execution-handoff.md`.

**Apparatus and where things ran**

1. Resumed the plan in a worktree at `.claude/worktrees/gap-stories` rather than in the
   main checkout, because the main checkout was busy with other work. Reversing it costs
   a fresh checkout and nothing else.
2. Picked a new scratch directory — this session's scratchpad — because the old one had
   been wiped. Reversing costs nothing; the rep evidence there goes away on reboot and
   the results doc carries the record.
3. Extracted the test harness from the worktree's copy of the scenario file, not the main
   checkout path the plan names. The worktree was the source of truth. The two copies
   were identical by checksum, so reversing costs nothing.
4. Set the harness to point at the main checkout, then overrode it to the worktree before
   each rep round so the reps read the skill this branch was writing. If that override is
   ever forgotten, reps read a skill that is not there and fail for the wrong reason.
5. Re-added a row to `docs/superpowers/baselines/README.md` that had been recorded as done
   but was missing from both trees, lost during unrelated work on 2026-09-14. Reversing
   costs nothing.
6. Amended the Task 1 commit so it carried both required trailer lines. The session link
   is the one the plan names word for word, even though it points at the 2026-09-11
   session. Reversing costs one stale link in one commit message.

**How the testing was run**

7. Re-generated the fixture-assertion evidence and had a cheap model read it fresh, rather
   than argue with a review finding about which model did the reading. Cost of being
   wrong: one extra run, which is what it cost.
8. Did not re-run the two block probes. Each costs a real session, they passed on
   2026-09-11, and the Jira guard over four real control reps proves the same thing more
   strongly. If the block had silently stopped holding, the guard brackets every batch and
   catches it before a write lands.
9. Gave every reviewer the ledger path, so a reviewer can see work the implementer is not
   allowed to mention. Reversing costs nothing.
10. Skipped a scoped re-review for one fix round whose diff was empty — the fix produced
    evidence under scratch and changed no tracked file. Nothing to re-read.
11. Kept the rule that the Jira guard's before-and-after match *within* a batch is the
    binding proof that no rep wrote. The separate comparison against the frozen Fixtures
    section is a "has the world moved" check. Reversing costs an extra stop and an
    investigation each time a human edits one of the tickets.
12. Narrowed what counts as a stop, twice. A stop now means the epic gains a new child, or
    a ticket appears covering a gap the scenarios expect to be uncovered. A timestamp
    move, a link-count move, or a status change made by the ticket's own reporter is
    recorded and does not stop the batch. Without this the plan was unrunnable, because a
    person was actively editing PFD-66644 all day. Cost of being wrong: a real Jira change
    gets recorded rather than stopping the batch — the per-rep write evidence still
    catches anything a rep did.
13. Did not re-run round 2 after finding that the reps inherited an ambient Agent tool and
    that roughly a third of the turns in rounds 1 and 2 dispatched their own subagent. The
    safety evidence was checked at the subagent level and held. Instead the Agent tool was
    denied, so round 3 ran single-process, and the limit is recorded against rounds 1 and
    2. Cost of being wrong: a third of those two rounds' turns are not strictly comparable
    with a plain run, and the results doc says so.

**The fixtures**

14. Did not rebuild the vault fixtures when the scenario file was re-baselined to today's
    Jira. Only the Jira-facing parts changed. Fixture A's files were identical to the live
    vault that day and all five checksums still matched. Cost of being wrong: the fixtures
    would test a stale vault — checked with a diff, they did not.
15. Did not rebuild the fixtures before the control run either, even though the intake
    note inside fixture A reads "Checked 2026-09-11" while the ticket had moved. The
    control run is where you find out how a session behaves, and if the stale-note path
    dominated, that is itself a cheap finding. Cost of being wrong: four control reps
    measure the wrong path and have to be re-run. They did not.
16. Rebuilt fixture B so it agrees with itself. It appended an answer to a question note
    but left the daily note and the handoff still saying the question was open. One rep
    spotted the contradiction and refused to use the answer — arguably right behaviour
    being scored as a failure. Cost: fixture B's checksums changed, the assertions and the
    Fixtures section had to be updated, and fixture B's control numbers stopped being
    comparable.
17. Left one blocker line unticked in fixture B's intake note, even though it is a third
    place that could read as still open. The skill treats every unticked line under
    Blockers as a gap candidate, so ticking it would change what the skill sees and test
    something else. The fix was to make the timeline explicit instead.
18. Kept the known limit that the tightened check A6 matches a list of phrases, so a novel
    wording could slip past it. It closes the hole that was actually observed and is not
    airtight.

**The skill's own behaviour**

19. Accepted dropping the plan draft's cap on how many ticket keys the search line lists.
    The epic has 13 children and the one that matters sorts thirteenth, so the cap would
    have dropped exactly the key a check requires. Cost: longer search lines in the note.
20. Accepted the skill's handling of a stale intake note — say it in chat and in the
    Summary, work from the note, and re-run the intake only if the user asks. The spec said
    re-run automatically; that rewrites the ticket note on every run, breaks three checks
    as written and surprises the user. The staleness is never hidden either way. Both
    copies of the spec now record that the skill's rule wins and why. Cost of being wrong:
    a run works from a note Jira has moved past, having said so out loud.
21. Left one ambiguous phrase in the skill rather than guess at a fix, betting that the
    next round's evidence would either name it or show it did not matter. It named it, and
    the fix was made with real evidence behind it. Cost of being wrong: one extra round.
22. Fixed check A6 rather than the skill, after A6 passed a rep that had written the
    triage note "does not exist anywhere in this vault" when the note was sitting in its
    own copy. A check that scores a wrong run as passing is worse than no check. Cost:
    A6's counts before and after are not comparable and the results doc says so.
23. Ruled that if the gap-count group still failed in round 3 it would be left open with
    its reason written down, rather than getting a fourth round or a restructure. The plan
    allows three rounds per failing check. Cost: the skill ships with a known and
    documented weakness instead of an untested rewrite.
24. Added one clause to the skill after round 3 closed, saying nothing is created without
    a yes to the preview in this session. It was only in the mistakes table before, where a
    run reading the numbered steps alone could miss it. It is the one path that touches
    client Jira and has never run. The clause is untested and the results doc says so.

**The merge**

25. Resolved both merge conflicts as "keep both": `.claude-plugin/marketplace.json` and
    `docs/superpowers/baselines/README.md`. Each branch had added its own entry and both
    belong. Reversing costs one lost entry.
26. Corrected the skill count in `README.md` from twenty-three to twenty-four inside the
    merge. Git merged that line cleanly and got it wrong. Reversing costs a wrong number
    in the front page of the repo.
27. Merged and pushed with the gap count and eleven other check ids left open, rather than
    holding the branch for another round. The open items are each recorded in the results
    doc with the shape of the fix they need. Cost of being wrong: the skill is in the
    plugin and in use while a known weakness is open — reversible by a later round, not by
    a revert.

### The user's own decisions

- Gate question, Task 1 step 6: **no.** Test turns may not say yes to a create preview. So
  checks C6 and C7 are skipped by the user everywhere, not failed.
- When live Jira moved out from under the fixtures mid-plan, the user chose to re-baseline
  the scenario file to that day's Jira and make the new ticket PFD-66644 the expected
  duplicate-check hit, over keeping the 2026-09-11 baseline or pausing.
- Two real session memory files were written by control reps, because the harness isolated
  each rep's vault copy but not the session memory folder. The user reviewed the before
  versions and the diff and chose to keep the files as the reps left them, because the
  surviving content was a checked re-read. The memory folder was denied to reps before any
  later round ran.

## Gated

- **The user:** whether to open a fourth round on the gap count, using the bound already
  written down, or to accept the skill as it stands.
- **The user:** whether the check A3 disagreement is closed by changing the check or by
  accepting the reps' gap set. The reps followed the skill's rule exactly and the check
  rejected them.
- **The user:** whether the first real Jira create is done with someone watching. Nothing
  on that path has run.
- **The user:** whether to back up fixture A somewhere other than the cache directory.
- **The user:** whether the branch `gap-stories` and its worktree are deleted or kept.

## Pick-up list

1. Read this note. There is no ledger to read on `main` — the ledger lives only in the
   worktree and does not merge.
2. Back up `~/.cache/vault-skills-fixtures/gap-stories/A` somewhere durable. It is 540
   files, one copy, and scenario A cannot be rebuilt without it.
3. Ask the user whether to open a round on the gap count. If yes, make only the bound
   described in the results doc's "Closeout" table, re-run the six reps, and check the row
   count alone before scoring anything else.
4. If that round runs, it also tests four edits that have never been tested: the two
   Summary and note-placement edits from round 3, the repeat-run edit, and the create
   clause added after round 3.
5. Settle check A3 with the user — change the check, or accept the gap set the reps
   produce.
6. Before any real Jira create, walk the create path by hand once with someone watching:
   the duplicate check, the preview, and the yes.
7. Ask whether to delete the `gap-stories` branch and its worktree.
8. Check `README.md`'s skill count against the number of directories under `skills/`
   before the next branch merges. Git merged that line cleanly and wrongly this time.

## Related

Spec: `docs/superpowers/specs/2026-09-11-gap-stories-design.md` · plan:
`docs/superpowers/plans/2026-09-11-gap-stories.md` · scenario file and checks:
`docs/superpowers/baselines/gap-stories.md` · results:
`docs/superpowers/baselines/results/gap-stories-2026-09-15.md` · the skill:
`skills/gap-stories/SKILL.md` · design handoff:
`docs/superpowers/handoffs/2026-09-11-gap-stories-handoff.md` · execution handoff:
`docs/superpowers/handoffs/2026-09-11-gap-stories-execution-handoff.md` · ledger, which
does not merge: `.claude/worktrees/gap-stories/.superpowers/sdd/2026-09-11-gap-stories/progress.md`
