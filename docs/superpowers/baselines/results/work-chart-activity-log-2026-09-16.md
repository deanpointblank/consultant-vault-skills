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
