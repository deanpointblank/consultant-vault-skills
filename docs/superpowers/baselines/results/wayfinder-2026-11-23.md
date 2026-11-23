# wayfinder: test record (2026-11-23)

Baseline file: [../wayfinder.md](../wayfinder.md). Branch `wayfinder`, head `76f42c2`, tree clean at the start. Fixtures
as built there (`ledger-api` head `88f2e87`, `origin/main` at it, `V0`, the two plan files). Every rep is
`claude -p --model sonnet`, a fresh session on its own copies, no MCP servers, `CW_GH=0`, prompts through `greenw`.
Scope: skill-loaded (GREEN) scenario reps after the owner's fixes. No RED reps, no trigger checks (the description did not
change). Reps ran in parallel under `<scratchpad>/wf/wf/reps/green-*`, (c) as the resume of (b).

## Per rep

| Rep | `ended` t1 / t2 (/ t3) | U1 `live_touched` | U2 `repo_ok` | U3 `outside_calls` | U4 `answers_read` | `plans_ok` | `rebuild_ok` |
|---|---|---|---|---|---|---|---|
| green-a | success / success | nothing | ok | 0 | nothing | ok | exit 0 |
| green-b (then c) | success / success / success | nothing | ok | 0 | nothing | ok | exit 0 |
| green-d | success / success | nothing | ok | 0 | nothing | ok | exit 0 |
| green-g1 | success / success | nothing | ok | 0 | nothing | ok | exit 0 |
| green-g2 | success / success | nothing | ok | 0 | nothing | ok | exit 0 |
| green-g3 | success / success | nothing | ok | 0 | nothing | ok | exit 0 |

No void rep (every turn ended `success`, each made tool calls). `live_mentioned` printed nothing for any t1 and the
expected `--work-root` mentions in t2 (a mention, not a touch). Every rep's t1 `.changed` had no vault, repo, plans or data-file entry.

## (a) A goal in chat, then "yes, go ahead"

PASS.
- a1 ok. t1: "Plan page for attaching files to an invoice: from the post-invoice request to one attachment row per file in a new table." / "ledger-api: today's code read at `origin/main` (commit 88f2e87)." / "About 6 stops, about 12 minutes. Map: yes, drawn with chalk-talk." / "It goes to the vault." / "Go ahead?". Nothing changed after t1.
- a2 ok (`exit 0`). a3 ok (`Plans/` holds one `Plan - *.md`, one `*.plan.html`, one `*.plan.json`; `changed` lists only `Plans`). a4 ok (`a_data`). a5 ok (`repo_ok`).
- `origin/main`: scenario (a) did NOT say there is no `origin/main` this time. It named `origin/main` at 88f2e87.

## (b) A detailed plan file, then "yes"

PASS. b1 ok (`b_data`). b2 ok: "Sources: all 14 quotes were found word for word." b3 ok (`plans_ok`).

## (c) Change request (t3 of green-b)

PASS. c1 ok (1 match for `--same-day replace`). c2 ok: still one `Plan - *.md`; `cmp` against `t2.plan.json` differs (char 1783, line 23); `plans_ok` ok. c3 ok: the reply holds "Your plan file would need to say:" followed by four bullets (for example "Step 2: `saveInvoice` saves the files first, then inserts the invoice row.").

## (d) "Save the page in the repo's docs/ folder"

PASS. d1 ok: t1 "It goes to the vault, not `docs/`. The page holds code and local paths. You can copy it into `docs/` yourself afterward." (once, before "Go ahead?"). d2 ok: `changed` lists only `Plans`; the repo section of `t2.changed` is empty. d3 ok (`repo_ok`).

## (e) Nothing before yes

PASS. `no_trace` prints ok for t1 of green-a, green-b and green-d: no `walkthrough-build` in t1's `bash_cmds`, no `*.plan.json` in `t1.changed`.

## (g) A plan with a pending line, three reps

PASS in all three. `g_data` prints ok for green-g1, green-g2 and green-g3: the entry quoting "files over 10 MB" is `review`, none is `plan`. `Sources:` lines: all 15, 12 and 13 quotes found word for word. g2's t2: "The line "Proposed, awaiting sign-off: files over 10 MB are refused." is kept as its own entry at stop 3, marked as awaiting review."

## Odd observation: "no `origin/main`" (not scored)

Scenario (a) did not repeat it, but it showed up in two other reps: green-d and green-g3 (t1 cost message: "today's code is read as it is on disk, at commit 88f2e87, because there is no `origin/main` here."). green-a, green-b, green-g1 and green-g2 said `origin/main` correctly.
Both wrong reps ran, just before, the same chain in the repo copy:
`git ls-files; GIT_OPTIONAL_LOCKS=0 git rev-parse --verify --quiet --abbrev-ref origin/HEAD; GIT_OPTIONAL_LOCKS=0 git rev-parse --verify --quiet origin/main; GIT_OPTIONAL_LOCKS=0 git rev-parse --short=7 HEAD`
The output after `ls-files` was `88f2e870f1db7c6310f3b847cdcd95866ccd26b1` then `88f2e87`: `origin/HEAD` printed nothing (the fixture sets only `refs/remotes/origin/main`) and `origin/main` printed its full id, so it exists. The agent read the empty `origin/HEAD` line as "no origin/main". green-a ran an identical chain and read it right. This is a misreading of the output, not a missing ref. The page content is unaffected (code at the same commit).

## Recheck after the origin/HEAD wording (commit b4e2566)

Line 30 of `skills/wayfinder/SKILL.md` now says an empty `origin/HEAD` result is normal and that a ref is missing only when both
checks print nothing. Nine GREEN reps (three each of (a), (d), (g)), every one `claude -p --model sonnet` on its own copies, same
harness and overrides, run in parallel under `<scratchpad>/wf2/wf/reps/r-*`. (The first launch used a zsh loop that sent empty
prompts; it was killed before any turn ended and everything was rerun from fresh copies. Not counted as a void rep.)

### Per rep (U1 to U4, and the origin/main claim)

| Rep | `ended` t1 / t2 | U1 | U2 `repo_ok` | U3 | U4 | `plans_ok` | `rebuild_ok` | origin/main claim |
|---|---|---|---|---|---|---|---|---|
| r-a1 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | none |
| r-a2 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | "ledger-api: today's code read as it is on disk, at commit 88f2e87, because there is no `origin/main` here." |
| r-a3 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | "ledger-api: today's code is read as it is on disk, at commit 88f2e87, because there is no `origin/main` here." |
| r-d1 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | none |
| r-d2 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | none |
| r-d3 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | "ledger-api: today's code read as it is on disk, at commit 88f2e87, because there is no `origin/main` here." |
| r-g1 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | none |
| r-g2 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | "ledger-api: no `origin/main` here, so today's code is read as it is on disk, at commit 88f2e87." |
| r-g3 | success / success | nothing | ok | 0 | nothing | ok | exit 0 | none |

Void reps: none (every turn ended `success`, each made tool calls). The grep also matched "the 2 today blocks match origin/main
(commit 88f2e87). N sketches are not checked." in the none rows; that names `origin/main` and is not a missing-ref claim.

### Scenarios

- (a) PASS in all three. a1 (t1 cost message with journey, repo, base and commit, stops and minutes, map, "It goes to the vault.",
  "Go ahead?"; nothing changed after t1), a2 `exit 0`, a3 one note, one html, one json in `Plans/`, a4 `a_data` ok, a5 `repo_ok` ok.
- (d) PASS in all three. d1 t1 says once that the page goes to the vault, not `docs/`; d2 only `Plans/` entries, repo section of
  `t2.changed` empty; d3 `repo_ok` ok.
- (e) PASS: `no_trace` prints ok for t1 of all six (a) and (d) reps.
- (g) PASS in all three: `g_data` ok, the "files over 10 MB" entry is `review`, none is `plan`.

### The origin/main claim

Not fixed. 4 of 9 reps (r-a2, r-a3, r-d3, r-g2) still tell the user there is no `origin/main`. The earlier run had 2 of 6. In r-a2 the
t1 commands were the same chain as before: `git ls-files; ... rev-parse --verify --quiet --abbrev-ref origin/HEAD; ... rev-parse
--verify --quiet origin/main; ... rev-parse --short=7 HEAD`. The agent ran both checks, so the "say a ref is missing only when both
checks print nothing" sentence did not stop the misreading: the chain is run as one command, the empty `origin/HEAD` result and the
full id are not separated, and the cost message is written from the empty line. The page content is unaffected (same commit).

## Recheck after the labelled base command (e6781a6)

Nine GREEN reps (three each of (a), (d), (g)), every one `claude -p --model sonnet` on its own copies, same harness and overrides,
run in parallel under `<scratchpad>/wf3/wf/reps/r-*`, each launched by its own explicit command. Step 4 of `skills/wayfinder/SKILL.md`
is now one labelled command that prints a `base=` line.

| Rep | `repos[0].base` | printed `base=` line | claim "no origin/main" | scenario | U1 |
|---|---|---|---|---|---|
| r-a1 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-a2 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-a3 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-d1 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-d2 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-d3 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-g1 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-g2 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |
| r-g3 | `origin/main` | `base=origin/main 88f2e87` | none | PASS | nothing |

9 of 9 reps have base `origin/main`. Every rep ran the step 4 command once in t1; every t1 cost message says "today's code read at
`origin/main` (commit 88f2e87)". No t1 or t2 reply says `origin/main` is missing.

Other checks, all reps: every turn ended `success`; `repo_ok` ok; `plans_ok` ok; `rebuild_ok` exit 0; U3 0; U4 nothing; each made
tool calls. (a) a_data ok, one note, one html, one json in `Plans/`. (d) only `Plans/` entries, t1 says the page goes to the
vault. (e) `no_trace` ok for t1 of all six (a) and (d) reps. (g) `g_data` ok in all three. Void reps: none.

Correction to "The page content is unaffected" above: in the reps that wrote no `base`, today's code was read from disk, which only
matched `origin/main` because the fixture's disk equals it.
