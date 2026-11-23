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
