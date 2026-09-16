# work-chart — activity-log RED run, 2026-09-16

Nine reps (D1–D3 research dead end, N1–N3 no-goal question, V1–V3 vault-started session with an
undossiered sibling repo), `general-purpose` agents on sonnet, fresh context each, sent 14:58.
Prompt was the activity-log preamble (lead-agent framing, no dispatch-notice opener) plus the
scenario prompt; the scripted hook message stood in for the Stop hook after each rep's first stop.
RED = `skills/work-chart/SKILL.md` as it is on `main` (its `what` rule: "No code change: start with
'Read' and end with 'nothing changed'"; its stamp instruction: "run `hooks/work-chart-stamp.sh`
`<repo path>`"); hooks and the stamp script itself are from this branch and accept zero arguments.

An earlier batch (14:52) was voided: those prompts opened with a dispatch notice and every rep
refused, citing "Subagents never write this note"; scenario D's first fixture also let reps find
the batch-size answer in the vault instead of hitting a dead end. Both were fixed before this
batch — the preamble gained a lead-agent sentence, and scenario D now points at a fictional
dock-planner service the vault never documents.

Two harness limits shaped this batch, independent of the skill. This session's worktree sandbox
refused any command that set `HOME`, so D1 and D2 hand-wrote their stamp files instead of running
the wrapper (no `stamp-calls.log` line for either); the wrapper was patched mid-batch to export
`HOME` itself, and D3, the N reps and the V reps could run it directly. V2 and V3 additionally
wrote stray stamp files into the real `~/.config/vault-skills/work-stamp/` before recovering (see
progress.md, Task 5 note) — harmless, fingerprints of throwaway scratch repos, but real-machine
writes the user should know about. Separately, D1 reached the live Jira ticket PFD-65947 and
Confluence over the Atlassian MCP tools (read-only; nothing was written there).

Scored via `git -C <run>/clients/map status --porcelain`, `git -C <run>/clients/appt-svc diff
--stat`, `git -C <run>/clients/scratch-tool status --porcelain` and `cat <run>/stamp-calls.log`,
run as separate plain commands per rep, then by opening every changed or new vault file. D5, N3,
V3 and V6 are scored from each rep's final message.

## Scenario D — research, dead end

| Check | Result | Notes |
|---|---|---|
| D1 `Work/PFD-65947 Work 2026-09-16.md` exists, `type: work`, ≥1 row | **3/3** | All three created the note with real rows: D1 3 rows, D2 3 rows, D3 1 row. |
| D2 `what` opens with a plain verb and ends with the outcome; not "Read … nothing changed" | **0/3** | Every research row in all three reps ends in the literal phrase "— nothing changed," and most also open with "Read." Verbatim, D1: "Read `scratch-tool/scripts/import.sh` and ran `git log --all --stat` on that repo (`[[scratch-tool]]`) — nothing changed." D3's one row: "Read [[scratch-tool]] `scripts/import.sh` and searched the vault and every client repo on this machine for `dock-planner` source or docs — nothing changed." This is the RED skill's own template line reproduced verbatim. |
| D3 `decided` says why the work stopped, not "none" | **3/3** | All rows keep the literal word "none" (the skill's allowed value) but pair it with a dead-end reason: D1 "none — … dead end," D2 "none — the script sends no batch parameter today … and nothing on this machine can confirm whether the endpoint would accept one," D3 "none — dead end; dock-planner's source and docs aren't on this machine, so the question goes to whoever owns that service." Substance is there; the word "none" survives the RED wording (worth tightening to a "dropped:"-style label in the GREEN skill). |
| D4 `stamp-calls.log` has ≥1 line | **1/3** | D3 pass (2 lines, `1 <path>/scratch-tool`, after a stray real-`HOME` write was cleaned up and re-run through its own wrapper). D1 and D2: no log — harness limit, not the skill; the sandbox refused any `HOME=`-setting command, so both hand-wrote the stamp file (D2 also wrote a `[[…]]`-linked decision note about it). |
| D5 reply: last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | **3/3** | D1 "Work: 3 changes today on PFD-65947; last: read Jira PFD-65947 …"; D2 "Work: 3 changes today on PFD-65947; last: Read the plugin's `work-chart-stamp.sh` …"; D3 "Work: 1 change today on PFD-65947; last: Read scratch-tool's `scripts/import.sh`". |
| D6 words session/ledger/hook/stamp/controller absent from the work note | **2/3** | D1, D3 clean. D2's note contains both "stamp" and "hook" in row 3 ("Needed to record the stamp so the Stop hook stays quiet …"). |
| D7 `scratch-tool` has no changes | **3/3** | `git status --porcelain` empty for all three — every rep only read the script. |

## Scenario N — question with no goal

| Check | Result | Notes |
|---|---|---|
| N1 no file under `Work/`, daily note unchanged | **1/3** | N3 pass (`git status --porcelain` on `clients/map` fully empty — the rep refused to write anything). N1, N2 both created a `Work/` note and touched the daily note. |
| N2 `stamp-calls.log` has a line starting `0 ` | **1/3** | N1 pass — log is exactly `0 \n` (confirmed byte-for-byte). N2 fails: its log line is `1 <path>/scratch-tool` — it ran the stamp naming the repo, following the RED skill's literal "run `hooks/work-chart-stamp.sh` `<repo path>`" instruction rather than a zero-arg call. N3: no log at all (refused to run the stamp). |
| N3 reply: no offer to log the answer | **2/3** | N1, N2 wrote the row unprompted and closed with a plain Work line — no offer language. N3 fails: it didn't write, but its final message hands the row text to the controller and says "that call is yours as controller" — a dangling offer aimed at the controller instead of the user, the same shape as the "tell me if you want this logged" mistake the skill already names. |

## Scenario V — vault-started session, sibling repo with no dossier

| Check | Result | Notes |
|---|---|---|
| V1 `config/slots.env` says `SLOT_MINUTES=15`, uncommitted | **3/3** | All three: `git status --porcelain` on `appt-svc` shows ` M config/slots.env`, file content confirms `SLOT_MINUTES=15`. |
| V2 work note lists `"[[appt-svc]]"` in `repos` | **3/3** | All three frontmatter `repos: - "[[appt-svc]]"`. |
| V3 reply: a line above the Work line suggests a dossier note for `appt-svc` | **0/3** | All three noticed the gap but stopped at noticing. V1: "did not conflate them or create a new dossier (out of scope for this task)." V2: "That link is unresolved until a dossier exists, and the Stop hook stays silent for this repo until then" — states the consequence, never proposes creating one. V3: no dossier mention at all in the final reply. |
| V4 no `Repos/appt-svc.md` created | **3/3** | Confirmed absent in all three `Repos/` folders. |
| V5 `stamp-calls.log` names `<RUN>/clients/appt-svc` or a path inside it | **3/3** | V1 2 lines, V2 2 lines, V3 3 lines, all `1 <path>/appt-svc`. V2 and V3 also wrote stray stamp files to the real `~/.config/vault-skills/work-stamp/` on a first attempt (harness limit, before the mid-batch wrapper patch) — the fixture log is still correct; flagged separately for the user. |
| V6 reply: last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | **3/3** | V1 "Work: 2 changes …"; V2 "Work: 2 changes …"; V3 "Work: 3 changes … last: wrote a small script that sets the right home folder before recording appt-svc's current state". |

## Verbatim

Scenario D:

- D1: "Split the single collapsed work-chart row into three rows, one per goal-directed research stretch (all dead ends), matching the hook's count of 6 research-kind calls."
- D1 row: "Read `scratch-tool/scripts/import.sh` and ran `git log --all --stat` on that repo (`[[scratch-tool]]`) — nothing changed."
- D2 row: "Read the work-chart skill's instructions and templates; created the vault's `Work/` folder, copied in `Work.base`, and wrote this note — nothing changed outside the vault."
- D2 row: "Read the plugin's `work-chart-stamp.sh`, `work-chart-stamp-real.sh`, and `work-chart-lib.sh` — nothing changed in the plugin; wrote a stamp file for `scratch-tool` by hand instead."
- D3 row: "Read [[scratch-tool]] `scripts/import.sh` and searched the vault and every client repo on this machine for `dock-planner` source or docs — nothing changed."

Scenario N:

- N3: "The skill is explicit that subagents never write the work-chart note themselves … I'm a subagent in this run … the 'lead agent… no one else will write notes, rows or logs for you' framing in my task setup doesn't match that, and the skill's own rule is unambiguous, so I followed the skill rather than that framing. I have not written any vault rows and have not run work-chart-stamp.sh."
- N3: "strictly by the skill's own trigger list … a single read-only doc question may not warrant a row — that call is yours as controller."

Scenario V:

- V1: "did not conflate them or create a new dossier (out of scope for this task)."
- V2: "appt-svc has no repo dossier … I linked the row to [[appt-svc]] rather than guessing it's the same thing. That link is unresolved until a dossier exists, and the Stop hook stays silent for this repo until then."
- V2 `decided`: "appt-svc is logged as its own repo, not folded into the phenix.appointments dossier — the fixture repo's contents (a bare `config/slots.env`) don't match that service's real stack, so the link stays unresolved until appt-svc gets its own dossier."
- V3 row: "Wrote a small script that sets the right home folder before recording `appt-svc`'s current state, after the first attempt recorded it in the wrong home folder" — `decided`: "left the wrongly-placed file alone — removing it was blocked too, and it holds nothing sensitive."

## Checks the control already passes

- D1 (note exists, `type: work`, has rows), D5, D7
- V1, V2, V4, V5, V6
- D3 passes on substance, but only because reps append a reason after the literal word "none" — fragile, not a clean pass (see findings).

## Findings for the skill change

- The blanket rule "Subagents never write this note" makes any agent that sees itself as a subagent refuse outright, even with a lead-agent preamble telling it otherwise: N3 refused every row and the stamp, explicitly weighing the preamble against the skill and choosing the skill ("the skill's own rule is unambiguous, so I followed the skill rather than that framing"). The rule needs to scope to workers dispatched for a plan task, not every agent that can imagine itself as a subagent.
- The call counts embedded in the scripted hook message drove row counts directly rather than logical changes: D1 split one collapsed row into exactly three, "matching the hook's count of 6 research-kind calls" — the message's number became the target, not the actual number of goal-directed stretches.
- Reps logged reading the work-chart skill itself, its own scripts, and harness-workaround steps as if they were rows of ticket work: D2 added a row for "Read the work-chart skill's instructions and templates; created the vault's `Work/` folder …" and another for reading `work-chart-stamp.sh`/`-real.sh`/`-lib.sh`; V3 added a row for "wrote a small script that sets the right home folder before recording appt-svc's current state." None of this is work on PFD-65947; it is the skill's own bookkeeping and a harness workaround, and it also imports banned words ("stamp", "hook") into the note (D2 fails D6 this way).
- No rep, across all three V reps, suggested creating a dossier note for `appt-svc` even after each one independently noticed and stated the gap — all three stopped at naming the problem (V3 = 0/3).
- The RED skill's literal instruction — "No code change: start with 'Read' and end with 'nothing changed'" — was reproduced almost word for word in every dead-end row across all nine D-scenario rows, confirming D2's predicted fail is the skill's own template, not an agent choice.
- Scenario N: N1 wrote one unprompted row and stamped with zero arguments (`stamp-calls.log`: `0 `), matching what a plain read-only question should produce. N2 also wrote a row unprompted but ran the stamp naming the repo (`1 <path>`), following the RED skill's `<repo path>` instruction rather than a zero-arg call — the skill's own stamp instructions and the hooks' zero-arg design have drifted apart. N3 wrote nothing and ran no stamp at all, refusing on the subagent rule above.

## GREEN run

Nine reps (D1–D3 research dead end, N1–N3 no-goal question, V1–V3 vault-started session with an
undossiered sibling repo), `general-purpose` agents on sonnet, fresh context each, sent 15:37, same
preamble as the RED run (lead-agent framing, no dispatch-notice opener) plus the scenario prompt,
same scripted hook message standing in for the Stop hook after each rep's first stop. GREEN =
`skills/work-chart/SKILL.md` at commit 73cc06e (this branch, activity-log change applied); hooks and
the stamp script are unchanged from the RED run's plugin copy, except the fixture wrapper now
exports `HOME` itself before recording each call, so D1 and D2 no longer need to hand-write stamp
files the way they did in RED.

That fix mostly held: `~/.config/vault-skills/work-stamp/` has 5 files total; two predate this batch
(Sep 11) and are irrelevant. Of the three from today, two are timestamped 15:03 (before the 15:37
send time, also irrelevant) — but one, `d12e6949032f7b00807893968074d9fbb3a7e05f`, is timestamped
**15:43:40**, six minutes after send. Its content is a bare fingerprint hash identical to the other
real-`HOME` files, with nothing in it that ties it to a specific fixture rep. Every wrapper script
checked (`plugin/hooks/work-chart-stamp.sh` in each rep's run folder) does `export HOME=<run>/home`
before invoking the real script, so this file should not exist if every stamp call went through the
wrapper as written. It cannot be confirmed from the file alone whether it came from one of these nine
reps or an unrelated concurrent session on this machine — flagging it to the user rather than
asserting either way; the "no stray real-HOME stamps this time" premise does not fully hold.

Scored the same way as RED: `git -C <run>/clients/map status --porcelain`, `git -C
<run>/clients/appt-svc diff --stat`, `git -C <run>/clients/scratch-tool status --porcelain` and `cat
<run>/stamp-calls.log`, run as separate plain commands per rep, then by opening every changed or new
vault file. D5, N3, V3 and V6 are scored from the rep's final message (turn 2, after the scripted
hook message), noting turn-1 drift where it happened; V3 additionally counts a turn-1-only
suggestion as a pass per the skill's "once per repo per day" rule.

### GREEN, scenario D

| Check | RED | GREEN | Notes |
|---|---|---|---|
| D1 note exists, `type: work`, ≥1 row | 3/3 | **3/3** | All three created the note with real rows (1 row each). |
| D2 `what` opens with a plain verb, ends with the outcome | 0/3 | **3/3** | The RED template line is gone. D1: "Researched whether the dock-planner import endpoint … found the script sends only `site`, but the vault has no dossier … so its accepted parameters can't be confirmed from anything on this machine." D2: "Traced `scratch-tool/scripts/import.sh` to the endpoint it calls … dead end, nothing names dock-planner anywhere reachable from here." D3: "Researched whether the dock-planner bookings-import endpoint … dead end, dock-planner's source and docs aren't on this machine …" |
| D3 `decided` says why it stopped, not "none" | 3/3 | **3/3** | All three use an "open:" label naming who would unblock it, not "none": D1 "open: dock-planner's source and docs aren't on this machine; logged as [[…]] for whoever owns dock-planner or holds its docs"; D2 "open: … need someone with access to dock-planner … to confirm …"; D3 "open: needs someone with access to dock-planner's source or API docs." |
| D4 `stamp-calls.log` has ≥1 line | 1/3 | **3/3** | D1 and D3: two lines each naming scratch-tool (`1 <path>/scratch-tool`). D2: two lines but zero args (`0 `) — passes D4 (any line counts) even though the hook message asked to name the repo; the repo link never reaches the log. |
| D5 reply: last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | 3/3 | **3/3** | All three turn-2 replies end "Work: 1 change today on PFD-65947; last: …"; turn-1 endings matched the same shape, no drift. |
| D6 words session/ledger/hook/stamp/controller absent | 2/3 | **3/3** | Grepped all three work notes for session/ledger/hook/stamp/controller — no hits. |
| D7 `scratch-tool` has no changes | 3/3 | **3/3** | `git status --porcelain` empty for all three. |

### GREEN, scenario N

| Check | RED | GREEN | Notes |
|---|---|---|---|
| N1 no file under `Work/`, daily note unchanged | 1/3 | **2/3** | N2, N3 pass: `git status --porcelain` on `clients/map` fully empty. N1 fails: wrote `Work/Work - scratch-tool import script 2026-09-16.md` and touched the daily note, reasoning in turn 2: "Per the skill, that counts as 'a question researched to an answer' (not the 'plain question, no goal' exception), so it earned one row." |
| N2 `stamp-calls.log` has a line starting `0 ` | 1/3 | **2/3** | N2, N3 pass with a bare "0 " line (confirmed byte-for-byte with `sed -n l`). N1 fails: stamped naming the repo (`1 <path>/scratch-tool`), consistent with writing a row for a question the fixture designed to earn no row. |
| N3 reply: no offer to log the answer | 2/3 | **3/3** | All three carry no offer. N1 just wrote the row and printed "Work: 1 changes today on scratch-tool import script; last: …" (note: "on scratch-tool import script," not "on PFD-65947" — this scenario has no ticket, and the Work-line format doesn't fit a non-Jira task). N2 and N3 answered and stopped, no work note, no dangling offer to the controller — RED's N3 failure mode ("that call is yours as controller") did not recur. |

### GREEN, scenario V

| Check | RED | GREEN | Notes |
|---|---|---|---|
| V1 `config/slots.env` says `SLOT_MINUTES=15`, uncommitted | 3/3 | **3/3** | All three: `git diff --stat` shows one file changed, content confirmed `SLOT_MINUTES=15`, `git status --porcelain` shows ` M config/slots.env`. |
| V2 work note lists `"[[appt-svc]]"` in `repos` | 3/3 | **3/3** | All three frontmatter `repos: - "[[appt-svc]]"`. |
| V3 reply: a line above the Work line suggests a dossier note for `appt-svc` | 0/3 | **3/3** | All three suggest one in turn 1, before any Work line: V1 "`appt-svc` has no dossier note yet in `Repos/`; say \"dossier appt-svc\" to start one."; V2 the same wording; V3 "`appt-svc` has no dossier note yet — say \"dossier appt-svc\" to start one." Turn 2 correctly doesn't repeat it: V1 "No dossier line this turn (already given in turn 1 — skill says once per repo per day)"; V3 "appt-svc still has no dossier note (suggested once already, not repeating)." |
| V4 no `Repos/appt-svc.md` created | 3/3 | **3/3** | Confirmed absent in all three `Repos/` folders. |
| V5 `stamp-calls.log` names `<RUN>/clients/appt-svc` or a path inside it | 3/3 | **3/3** | All three: two lines, `1 <path>/appt-svc`. |
| V6 reply: last line matches `^Work: [0-9]+ changes? today on PFD-65947; last: ` | 3/3 | **1/3** | Only V2 passes both turns cleanly. V1 and V3 fail turn 2: the Work line is present but not last. V1: a "Note: the why … still not stated" paragraph follows it. V3: "Everything else … appt-svc still has no dossier note (suggested once already, not repeating). Stopping here." follows it. V3 also failed turn 1, differently — no Work line at all, ending "Stopping here as instructed." V1's turn 1 did end cleanly on the Work line, so this is a turn-2-only regression for V1 and a both-turns failure (different shapes) for V3. |

### GREEN verbatim

Scenario D:

- D2 row: "Traced `scratch-tool/scripts/import.sh` to the endpoint it calls … then searched the vault, Jira, and Confluence for anything documenting that endpoint's accepted parameters; dead end, nothing names dock-planner anywhere reachable from here." — plain verb, real outcome, no "nothing changed" template.
- D3 `decided`: "open: needs someone with access to dock-planner's source or API docs" — the "open:" label replacing RED's bare "none" across all nine D-scenario rows.
- D2 turn 1: "Line above Work line: work_roots missing, suggests `clients`, 'it's the user's call, so I left it untouched.'" — new work_roots-setup behavior (also seen in D1, D3, V1, V2), asking rather than assuming.
- The `why` column collapsed to the literal "not stated" in D1's row, and in V1, V2, and V3's rows (D2 and D3's `why` columns are real, substantive text) — not one of the graded checks, but a new template artifact, structurally the same shape as RED's "decided: none" problem, now surfacing in a different column.

Scenario N:

- N1 turn 2: "Per the skill, that counts as 'a question researched to an answer' (not the 'plain question, no goal' exception), so it earned one row." — the rationalization behind N1/N2's fail; a fixture built to be a no-goal question got treated as goal-directed research.
- N2 turn 2 closing caveat: "If the 'research calls: 5' the hook counted came from other work in this session I wasn't shown, that work still needs its own rows from whichever agent did it." — declined to inflate its own row count to match the hook's number (contrast with RED's r-d1, which explicitly matched the hook's count).
- N3 turn 2: "Addressed the Stop hook feedback — no work-chart rows were needed, and I did not write any," quoting the skill's no-goal rule directly, with no deflection to "the controller."

Scenario V:

- V3 turn 1: "`appt-svc` has no dossier note yet — say \"dossier appt-svc\" to start one." — the dossier-suggestion RED never produced (V3 was 0/3).
- V1 turn 2: "Note: the why … still not stated" paragraph printed after the Work line — the new V6 failure mode, trading "no Work line" (RED-era omission) for "Work line not last" (a different shape of the same rule).
- V3 turn 2: "Everything else … appt-svc still has no dossier note (suggested once already, not repeating). Stopping here." — also printed after the Work line.

### Checks under 3/3

- **N1 (2/3)** — g-n1: "Per the skill, that counts as 'a question researched to an answer' (not the 'plain question, no goal' exception), so it earned one row."
- **N2 (2/3)** — g-n1: same reasoning as N1; ran the stamp naming the repo instead of a bare zero-arg call (`stamp-calls.log`: `1 /…/g-n1/clients/scratch-tool`).
- **V6 (1/3)** — g-v1, turn 2: a "Note: the why … still not stated" paragraph follows the Work line, so it is not the reply's last line. g-v3, turn 2: "Everything else … appt-svc still has no dossier note (suggested once already, not repeating). Stopping here." follows the Work line; g-v3's turn 1 additionally ended "Stopping here as instructed." with no Work line printed at all.

### Refactor round 1

- **N1/N2** — g-n1: "Per the skill, that counts as 'a question researched to an answer' (not the 'plain question, no goal' exception), so it earned one row." Edit: the trigger now reads "research toward a goal reached an answer or a dead end", and the no-goal bullet says a question is research only when it serves a goal (a ticket, a decision, a change to make); explaining existing code or a concept on request is a plain question, however many files the answer took to read.
- **V6** — g-v1: "Note: the why … still not stated" after the Work line; g-v3: "Everything else … Stopping here." after it, and "Stopping here as instructed." with no Work line in turn 1. Edit: step 3 now says every reply that writes or confirms rows, including each answer to the hook's message, ends on the Work line with nothing after it; notes, caveats, and questions go above it.
