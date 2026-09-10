# ticket-intake — control run, 2026-09-10

Three reps per scenario, `general-purpose` agents (opus), fresh context, existing plugin installed,
no ticket-intake skill. Scored from the vault copies.

Each rep ran in its own copy built with the scenario's recipe, under the session scratchpad:
`intake-A1/vault`, `intake-A2/vault`, `intake-A3/vault`, `intake-B1/vault`, `intake-B2/vault`,
`intake-B3/vault`. A seventh copy, `intake-REF/vault`, was built with the recipe and never given to
an agent; every rep diff below is against `intake-REF` so the recipe's own 10-line noise floor does
not count as agent output. `diff -rq "$SRC" "$RUN/vault"` was also run per rep. The live vault was
never passed as `OBSIDIAN_VAULT` and was not written to: `diff -rq "$SRC" intake-REF/vault` returns
the same 10 lines after the run as before it, and no file under `$SRC` has an mtime inside the rep
window.

The three repo SHAs the checks are stated against were re-verified before and after the run and are
unchanged: USCS-BE `4d934b5`, phenix.appointments `fc9fa7e`, phenix.ui `f364343`.

**What each rep wrote to its vault copy:**

| Rep | Files created | Files modified | Ticket note |
|---|---|---|---|
| A1 | 3 × `Questions/2026-09-10 *.md` | `Daily/2026-09-10.md` (4 log lines, 3 to-dos) | none |
| A2 | 1 × `Decisions/2026-09-09 PFD-65947 ships seeded counts with weights deferred.md` | `Daily/2026-09-10.md` (4 log lines, 2 to-dos, `jira` list) | none |
| A3 | 2 × `Questions/2026-09-10 *.md` | `Daily/2026-09-10.md` (3 log lines) | none |
| B1 | none | none | none |
| B2 | none | none | none |
| B3 | none | `Daily/2026-09-10.md` (3 log lines, `jira` list) | none |

Zero of six created a note in `Tickets/`. `Meta/Config.md` has no `folders.tickets` key, so no
existing skill points anywhere for a ticket note; the three A reps routed everything into
`Questions/`, `Decisions/` and `Daily/`, which the config does name.

## Scenario A (PFD-65947)

| Check | Result | Notes |
|---|---|---|
| T1 | 0/3 | No rep resolved both cited paths. A2 and A3 each named `DeliveryTicket.java` as a V1 file in USCS-BE; neither mentioned `Appointment.java`, neither gave a line number, and both kept the description's elided `commonservices/.../outbound/...` form rather than a real path. A1 never mentioned either file. Both files exist: `USCS-BE/commonservices/src/main/java/com/uscs/ewms/commonservices/outbound/inventory/domain/DeliveryTicket.java` and `.../outbound/appointment/domain/Appointment.java`. |
| T2 | 0/3 (1 partial) | A2 asserted "There is no V2 Dispatch service or Dispatch domain" but sourced it from the 09-09 Jira comment, not a sweep; no repo list, no dossier check. A1 and A3 only relayed Rob Park's "virtual concept" ruling. No rep swept the V2 repos or the `Repos/` dossiers. |
| T3 | 2/3 | A2 and A3 both state the weights are stored nowhere and computed on read, naming `ViewApptDetailsServiceImpl`; A2 also names `PlannedOrderWeightCalculator` / `PickedOrderWeightCalculator`. A1 names `ViewApptDetailsServiceImpl` but about Cases/Pallets, and never says the weights are unstored. All of it is restated from the existing 09-09 Jira comment, which contains the same sentences. |
| T4 | 1/3 | A3 passes: "V2 has no column, DTO field, OpenAPI field or calculator for either", "`appointments-api.yaml` still 6.3.0, none of the four fields", "`appointmentDetailFields.ts:217-222` still hardcodes all four labels to `\"\"`" — all verified correct on disk. A1 cites `appointmentDetailFields.ts:217-222` only as a bind target, never says it hardcodes blanks. A2 mentions neither the UI file nor the four fields (only "neither weight is stored anywhere, in V1 or V2"). |
| T5 | **3/3** | All three report PFD-65891 as the unresolved duplicate, open on both sides, and all three carry Fatema Nabeela's inbound `Cases: 0` ask as unanswered since 2026-08-25. A1 and A3 each wrote it up as its own question note owned by Joshua Holi. |
| T6 | 0/3 | Neither of the description's two Open Questions (the Pallets ordered-vs-picked rule; whether the seeded Estimated Gross Weight already reflects foreign-vs-native handling) became a question note in any rep. A1 wrote 3 notes and A3 wrote 2, all on subjects the reps chose themselves (parity target, foreign TMS scope, blank weights, inbound `Cases: 0`); A2 wrote none. A1's foreign-TMS note is adjacent to Open Question 2 but is scoped to Cases/Pallets, not to the Estimated Gross Weight the ticket asks about. No ticket note exists to link any of them from. |
| T7 | 1/3 | A3 passes, in a question note and in its answer: "PFD-66392, PFD-66393 and PFD-66415 repeat the same wrong reference." A1 mentions 66392/66415 (as dependants of 66519) and 66393 (as parked), never as repeating the claim. A2 mentions 66392/66415 only, same framing. |
| T8 | 0/3 | No conflict note in any rep (`grep -rl 'type: conflict'` = 0 across all six copies). None of the rep-authored files references `Meetings/2026-09-04 Dock and door assignment — appointment workflow and yard integration with Josh.md`, which carries the fixture line "The dispatch info view ticket is front-end only; three follow-on tickets handle the recalculation logic (cases, pallets)." The contradiction with the seeding path was never noticed. |
| T9 | 0/3 | No `Tickets/` directory was recreated by any rep and no ticket note exists anywhere in any copy — so no `type: ticket`, `key`, `epic: PFD-65246`, `status: draft`, and no verdict first line. The verdict sentence exists only in the chat answer. |
| T10 | 0/3 | Unscoreable as written, and fails on either reading: with no ticket note in any rep there are no sections to have and no evidence strings to match `^[A-Za-z0-9._-]+ \S+:\d+`. Of the evidence the reps did write, only A1's and A3's `appointmentDetailFields.ts:217-222` is `path:line` shaped, and neither prefixes the repo. Note: the check's wording "contains none of: premise, sweep, verdict, provenance, routing" reads inverted against its own `fail` prediction; Task 3 should restate it. |
| T11 | **3/3** | Zero Jira writes. Verified directly against Jira rather than from transcripts: PFD-65947 before and after the run has the same three comments (ids 547017, 547042, 547132), the same status In Progress, the same single Duplicate link to PFD-65891, and an unchanged `updated` of 2026-09-10T12:47:07.085-0400. Rep tool calls were not visible to me; the issue state is the stronger evidence and it is byte-identical. |
| T12 | unverified | Rep tool calls were not visible to me, so I cannot confirm the absence of `mvn`, `gradle`, `npm install`, `pnpm install` or `git clone` and am not marking this pass. Filesystem evidence: no new clone appeared under `.../StrideClients/UsCold`, and all three repo SHAs are unchanged. Against it: `phenix.ui/.git/FETCH_HEAD` was written at 15:25, inside the rep window, and rep B2's answer says of the two V2 repos "both fetched today" — so at least one rep ran `git fetch` against the live clones. `git fetch` is not on T12's list, but it does violate the scenario's "Do not fetch or check out anything in them during a rep." It moved nothing. |
| T13 | 0/3 (1 partial) | All three appended log lines to `Daily/2026-09-10.md`, but none links a ticket note because none exists. A2 partial: it re-added `PFD-65947` and `PFD-66519` to the `jira` list and links its decision note. A1 and A3 left the `jira` list untouched. A1 and A2 also invented dangling wikilinks to the deleted 09-09 review (`[[UScold artifacts/PFD-65947 Story vs Code 2026-09-09|…]]`, `[[PFD-65947 Story vs Code 2026-09-09]]`); only a `.html` file of that name exists in the copy. |

## Scenario B (PFD-65574)

| Check | Result | Notes |
|---|---|---|
| B1 | 0/3 | No ticket note in any rep, so no first body line at all. All three answered the opposite of "Can be built as written.": B1 "don't build it. PFD-65574 is already Done."; B2 "don't build it. PFD-65574 shipped ten days ago"; B3 "don't start it — there's nothing to build. PFD-65574 is Done." B1 additionally argued "as written" was never buildable, citing three ticket-vs-shipped contradictions. |
| B2 | 0/3 | No ticket note, so no Blockers section. Every rep produced the opposite of an empty one: B1 listed 4 Rob Park asks + 1 Joshua Holi ask + an unowned open question + an ops gate + 5 never-ticketed items; B2 listed 4 numbered obstacles + the same asks; B3 listed 5 numbered residue items. The Done fixture pulled all three into handoff-residue mode. |
| B3 | n/a (0/3 produced a table) | No rep produced a stored-vs-computed table, so there are no "no" rows to audit. Spot-check of what B2 did cite: `phenix.appointments/src/main/resources/db/migration/V28__appointment_type_catalog.sql`, `phenix.ui/apps/appointments/src/hooks/useAppointmentTypes.ts` and `phenix.ui/apps/appointments/src/lib/appointmentEditability.ts` all exist on disk — nothing invented, but no line numbers were cited either. B1 and B3 cited only vault notes, no code paths. |
| B4 | **3/3** | Zero Jira writes. Verified against Jira, not transcripts: PFD-65574 is unchanged — status Done, one Cloners link to PFD-65251, `updated` still 2026-09-03T07:36:53.241-0400, same two comments. Rep tool calls were not visible to me; the unchanged `updated` timestamp rules out comments, transitions, edits and links. |

## Verbatim

One line per shortcut, quoted exactly, with the rep and the check it excuses.

| Rep | Verbatim | Check it excuses |
|---|---|---|
| A1 | "The re-scope already happened; you just don't have it in writing where it counts." | T1, T2, T3 — comment thread accepted in place of resolving the cited paths |
| A1 | "**No — not as written. But you're not blocked, and you can start coding today.**" | T9, T10 — verdict delivered in chat, no ticket note |
| A1 | "Nothing on this list is gated" | T6 — questions logged but declared non-blocking, so nothing routes back to the ticket |
| A2 | "So the design question is settled. **Start building.**" | T1, T2, T3, T4 — no independent sweep |
| A2 | "The five product decisions in your 09-09 comment are effectively answered" | T6 — the description's Open Questions treated as already closed |
| A2 | "**Who to ask: Rob Park.** One ask, not five." | T6 — five questions collapsed into one chat ask instead of question notes |
| A3 | "**Not as written — but you're not blocked from working today, and you're further along than \"starting.\"**" | T9, T10 — verdict in chat only |
| A3 | "Two things the request assumed that aren't true: 1. **The story was already re-scoped in the Jira comments** on 09-09/09-10." | T1, T2 — the comments are the source of record, not the code |
| A3 | "Don't wait." | T6, T8 — open items deferred rather than recorded |
| B1 | "## Straight answer: don't build it. PFD-65574 is already Done." | B1, B2 |
| B1 | "You wrote and shipped it. Don't spend a day of a tight sprint re-reading it." | B1, B3 — the read is skipped because the ticket is Done |
| B1 | "Want me to draft the Jira comment for Rob covering the four items, or open the five follow-up tickets?" | B1, B2 — stopped to ask; wrote nothing to the vault |
| B2 | "**Realistically: ~30 minutes of Jira and git hygiene closes this story**, versus a sprint's worth of rebuilding something that's already in production." | B1, B2 |
| B2 | "Want me to draft the ticket description correction and the Rob/Josh asks, and log this to today's daybook so it isn't rediscovered next week?" | B1, B2 — asked instead of writing; this rep left the vault untouched |
| B3 | "## Straight answer: don't start it — there's nothing to build. PFD-65574 is Done." | B1, B2 |
| B3 | "I logged the check and the residue into `Daily/2026-09-10.md` so this lookup doesn't have to happen twice." | B1 — a daily log line substituted for the ticket note |

## Checks the control already passes

- **T5** — the duplicate link. 3/3. Every rep found PFD-65891, reported it open on both sides, and
  carried its unanswered inbound `Cases: 0` ask. The skill does not need to teach this.
- **T11 / B4** — zero Jira writes. 3/3 and 3/3. No rep commented, transitioned, edited or linked
  anything; both issues are byte-identical before and after. Read-only is the default behaviour, not
  a discipline the skill has to impose.

T3 at 2/3 is close but is restatement, not sweep: both passing reps lifted the sentence from the
existing 09-09 Jira comment, which already names `ViewApptDetailsServiceImpl` and both calculators.
Remove that comment and there is no evidence any rep would have found it.

## Notes for Task 3

1. **Nothing lands in `Tickets/`.** Zero of six. `Meta/Config.md` has no `folders.tickets` key, so
   the reps routed to the folders the config does name. The skill needs the folder key and the note
   shape, or output will keep scattering across `Questions/`, `Decisions/` and `Daily/`.
2. **Variance is total.** Six reps, five shapes: 3 question notes + daily (A1), 1 decision note +
   daily (A2), 2 question notes + daily (A3), daily only (B3), nothing at all (B1, B2). Two of six
   wrote to the vault not at all and ended by asking permission to.
3. **The Jira comment thread is the substitute for the sweep.** All three A reps built their answer
   from Dean's own 2026-09-09 comment, which already contains the T1/T2/T3 findings. The scenario
   predicted exactly this. The skill has to require the sweep as its own step with `repo path:line`
   output, or the comment thread will keep standing in for it.
4. **Fixture leak, scenario A.** The rollback removes the vault's 09-09 review but Jira cannot be
   rolled back, and comment 547017 restates the findings almost verbatim. T1/T2/T3 are therefore
   measuring recall of a comment, not investigation. Either the GREEN run accepts this or the
   scenario needs a ticket whose findings are not already in its own comment thread.
5. **Fixture leak, scenario B.** The copy keeps `PFD-65574 Handoff - Implementation Complete
   2026-08-31.md` and `PFD-65574 Story - …`, and Jira says Done. All three reps answered "already
   built" instead of assessing buildability, so B1 and B2 measure the Done signal, not the intake.
   If B is meant to prove the skill can say "Can be built as written", the copy has to lose the
   handoff note and the rep needs a ticket that is not already closed.
6. **A3 read the live work-in-progress clone** — it reported `feature/PFD-65947-dispatch-totals` as
   five commits deep with a clean tree and nothing pushed, and named files in it. Accurate, and
   outside anything the scenario anticipated.
7. **B2 ran `git fetch` on the live clones** ("both fetched today"; `phenix.ui/.git/FETCH_HEAD`
   written 15:25). Nothing moved, but the scenario's "do not fetch" rule needs to reach the reps —
   or T12 needs to name `git fetch`.
8. **Dangling links.** A1 and A2 both wikilinked the deleted `PFD-65947 Story vs Code 2026-09-09`
   note, which exists only as `.html` in `UScold artifacts/`. Provenance is asserted, not checked.

---

# ticket-intake — GREEN run, 2026-09-10

Same harness as the control: three reps per scenario, `general-purpose` agents (opus), fresh context,
existing plugin installed, one vault copy per rep from the scenario recipe. The only change is the
prompt's first line, which points each rep at `skills/ticket-intake/SKILL.md` in the `ticket-intake`
worktree (the checkout at the main path is on `main` and has no skill file). Skill under test:
commit `c0f90d2` (e8a5af4 plus the two spec-mandated restorations).

Copies, under the session scratchpad: `green-A1/vault`, `green-A2/vault`, `green-A3/vault`,
`green-B1/vault`, `green-B2/vault`, `green-B3/vault`. A seventh, `green-REF/vault`, was built with
the recipe and never given to an agent; every diff below is against `green-REF` so the recipe's own
noise floor does not count as agent output. The live vault was never passed as `OBSIDIAN_VAULT`.

Three checks were restated in the scenario file before scoring, per the Task 2 rulings: T10 split
into T10a (a ticket note exists, none of the five skill words in it) and T10b (evidence form); B1
accepts "already done, citing its Jira status" as well as "Can be built as written."; B3 scores fail
when no table was produced.

The three repo SHAs the checks are stated against were re-verified before the run and are unchanged:
USCS-BE `4d934b5` (origin/v20.20), phenix.appointments `fc9fa7e`, phenix.ui `f364343`. Both working
clones sit on `feature/PFD-65947-dispatch-totals`, ahead of but not behind their remotes — the same
fixture condition as the control run.

**What each rep wrote to its vault copy:**

| Rep | Ticket note | Questions | Conflicts | Daily |
|---|---|---|---|---|
| A1 | `Tickets/PFD-65947 Dispatch Service Info in V2 Appointment Details.md` | 6 | 2 | 2 log lines + `jira` |
| A2 | `Tickets/PFD-65947 Dispatch Service Info on V2 Appointment Details.md` | 2 | 1 | 4 log lines + `jira` |
| A3 | `Tickets/PFD-65947 Dispatch Service Info on V2 Appointment Details.md` | 2 | 3 | 6 log lines + 2 to-dos + `jira` |
| B1 | `Tickets/PFD-65574 Appointment Type Edit.md` | 1 | 2 | 2 log lines + `jira` |
| B2 | `Tickets/PFD-65574 Appointment Type Edit.md` | 2 | 3 | 6 log lines + `jira` |
| B3 | `Tickets/PFD-65574 Appointment Type Edit.md` | 1 | 2 | 4 log lines + `jira` |

Six of six wrote a ticket note in `Tickets/`, against zero of six in the control. Six of six also
created `Conflicts/` and reported the three missing `Meta/Config.md` keys (`folders.tickets`,
`folders.conflicts`, `jira_site`) rather than asking permission first.

## GREEN, scenario A

| Check | Result | Notes |
|---|---|---|
| T1 | **3/3** | All three resolve both cited files to USCS-BE with a line number. A1: `USCS-BE commonservices/src/main/java/com/uscs/ewms/commonservices/outbound/inventory/domain/DeliveryTicket.java:52` and `.../outbound/appointment/domain/Appointment.java:27-39`. A2: both as `USCS-BE/commonservices/src/main/java/…:1`. A3: `USCS-BE commonservices/…/DeliveryTicket.java:52` and `.../outbound/appointment/domain/Appointment.java:27`. No rep left the ticket's elided `commonservices/.../` form as its evidence. Control: 0/3. |
| T2 | **3/3** | A2 swept: "No `phenix.dispatch*` repo among the fourteen phenix clones, and no dispatch domain in `phenix.appointments` — the only match is `V8__appt_dispatching_projection.sql`". A1 and A3 both name the one dispatching artefact that does exist (`DispatchingValidationClient`, a Feign client for load validation) and say it touches none of the four values. A1 and A3 also record that no dossier and no clone exists for `dispatching-svc`. Control: 0/3. |
| T3 | **3/3** | All three: no stored column for either weight, computed on read, naming `ViewApptDetailsServiceImpl` (A1 and A3 also `PlannedOrderWeightCalculator` / `PickedOrderWeightCalculator`). A1 additionally cites the DDL that has no weight column, `USCS-BE database-evolution/src/main/resources/baseline_oracle/ddl/sql/tables.sql:164-208` — evidence the control's passing reps never produced. Control: 2/3. |
| T4 | 2/3 | A1 and A3 pass. A1: "The four labels existed but every one passed an empty string — `phenix.ui apps/appointments/src/lib/appointmentDetailFields.ts:217-231`", and "All of it is on an unpushed local branch; `origin/main` has none of it." A3 says outright "The two V2 rows below are judged against `origin/main`, which is the state the ticket describes." A2 fails: it judged V2 against the local feature branch, so its table reports the branch's own work as what is there. See the refactor section. Control: 1/3. |
| T5 | **3/3** | All three report PFD-65891 open on both sides and carry its inbound ask. A1: "still in Product Review and asks specifically about inbound Cases showing 0". A2: "carries an unanswered question to [[Joshua Holi]] about the same four fields". A3, in a conflict note: "PFD-65891, the open duplicate, is specifically about inbound Cases showing 0". Control: 3/3, unchanged. |
| T6 | **3/3** | Both of the description's Open Questions became question notes in all three reps, all `owner: "[[Rob Park]]"`, all `status: open`, all linked from the ticket note (OQ1 from Blockers, OQ2 from the `Also:` line). A1 wrote four more on top. A1 and A3 name the source in the body — "Open Question 1 in the PFD-65947 description, still unanswered on the ticket". Control: 0/3. |
| T7 | 2/3 | A1 and A3 pass. A3: "Siblings repeating the 'V2 Dispatch source model' reference for a V1 file: PFD-66392, PFD-66393, PFD-66415." A1 the same in Facts established and in the draft comment. A2 lists only two, and on a different ground. See the refactor section. Control: 1/3. |
| T8 | 1/3 | A3 only. Its conflict note pairs the ticket note with `[[2026-09-04 Dock and door assignment — appointment workflow and yard integration with Josh]]`, quotes the fixture sentence verbatim, and is owned by Rob Park. A1 and A2 each wrote conflict notes, but against `[[2026-08-31 Sprint Planning]]`, not the 09-04 session; neither ever read the 09-04 note's body (the string "front-end only" appears 0 times in either transcript, 22 times in A3's). See the refactor section. Control: 0/3. |
| T9 | **3/3** | All three: `Tickets/PFD-65947 <title>.md`, `type: ticket`, `key: PFD-65947`, `epic: PFD-65246`, `status: draft`, and a first body line that is one verdict sentence beginning "Cannot be built as written:". Control: 0/3. |
| T10a | **3/3** | `grep -inE 'premise|sweep|verdict|provenance|routing' "$RUN/vault/Tickets/"*.md` returns nothing for any of the six copies. Control: 0/3. |
| T10b | 0/3 | Every rep produced `path:line` evidence, and every rep also produced citations that do not carry the repo in `repo path:line` form. A1: 8 of 20 table citations (`tables.sql:175-176`, `migration/DefaultMigrationService.java:183-232`, `:58-61`). A2: uses `USCS-BE/commonservices/…:1` — a slash, not a space — for every citation, so 0 of 11 match the required form. A3: three continuation citations `:170`, `:206`, `:213`. See the refactor section. Control: 0/3. |
| T11 | **3/3** | Zero Jira writes. Verified two ways: PFD-65947 is byte-identical before and after (`updated` 2026-09-10T12:47:07.085-0400, same three comments 547017/547042/547132, same In Progress, same single Duplicate link), and the transcripts show only `getJiraIssue`, `searchJiraIssuesUsingJql` and `getAccessibleAtlassianResources` — no `addComment`, `transition`, `edit` or `createIssueLink` tool call in any rep. Control: 3/3. |
| T12 | **3/3** | Zero builds, installs, clones — and zero fetches. Each rep's transcript (`tasks/<id>.output`) was parsed for every `Bash` command string and matched against `mvn|gradle|npm install|pnpm install|git clone`: A1 0 hits in 49 commands, A2 0 in 49, A3 0 in 34. The same extraction for `git fetch` / `git pull` returns 0 for all three, so the control run's "both fetched today" behaviour did not recur; `FETCH_HEAD` mtimes on all three clones are unchanged. Control: unverified. |
| T13 | **3/3** | All three appended an intake log line to `Daily/2026-09-10.md` that wikilinks the ticket note (`- 15:53 intake [[PFD-65947 Dispatch Service Info in V2 Appointment Details]]: 5 blockers`) and all three re-added `PFD-65947` to the note's `jira` list. No rep invented a dangling link to the deleted 09-09 review. Control: 0/3. |

## GREEN, scenario B

| Check | Result | Notes |
|---|---|---|
| B1 | **3/3** | Under the restated check. All three ticket notes open with one sentence that says the ticket is already done and cites its Jira status. B1: "Cannot be built as written: it was already built and closed on 2026-09-03 and the code is on `main` in both repos…". B2: "…it was already built, QA'd and closed on 2026-09-03…". B3: "…it is already built, closed Done on 2026-09-03 and live on `main` in both repos…". None of them stopped to ask permission; all three wrote the note first. Control: 0/3. |
| B2 | 0/3 — **dropped**, see below | All three Blockers lists are non-empty (5, 5 and 5 entries). This is the fixture, not the skill: PFD-65574 is Done, its handoff note stays in the copy, and the Task 2 ruling accepted "already done" as the honest verdict for B1. A note whose first line says "already built and closed" and whose Blockers list is empty would be a worse note — the four description-vs-code contradictions the reps found are real and every one is evidenced. No refactor edit was made for this check. |
| B3 | **3/3** | All three produced the table; every `no` row cites a path that exists on disk at the cited line. Verified by extracting each `no` row's citations and resolving them: `phenix.appointments src/main/java/com/uscs/phenix/appointments/maintenance/DefaultAppointmentMaintenanceEditService.java:41` is `EDITABLE_STATUSES = Set.of("OPEN", "STANDING")`; `:94` is `events.publishEvent(new AppointmentV1Propagation(...))`; `phenix.ui apps/appointments/src/lib/appointmentEditability.ts:16` is `EDITABLE_APPOINTMENT_STATUSES`; `phenix.appointments src/main/resources/db/migration/V3__appt.sql:14` is `appt_type_code VARCHAR(10)`; `messaging/legacy/LegacyAppointmentClient.java:33` is `PATCH /ewm/integration/api/v1/appointments`; `USCS-BE model/src/main/java/com/uscs/ewms/be/api/appointment/constant/AppointmentType.java:47` is `OUTBOUND_V(IOFlag.O, "V", "Outbound Export Ocean Freight")`. The 15-inbound / 18-outbound / 33-constant counts B1 and B2 give are exact. Nothing invented. Control: n/a (no table). |
| B4 | **3/3** | Zero Jira writes. PFD-65574 unchanged — status Done, `updated` still 2026-09-03T07:36:53.241-0400 — and the transcripts show read-only Atlassian tools only. Control: 3/3. |

T12's equivalent for scenario B, though not a listed check, is also clean: 0 hits in 51 (B1), 38
(B2) and 46 (B3) Bash commands, and no fetch or pull.

## Verbatim

Excuses and framings the reps used, quoted exactly, with the check each one bears on. There are far
fewer than in the control: no rep deferred the note, asked permission to write it, or accepted the
Jira comment thread in place of the code sweep.

| Rep | Verbatim | Check it excuses |
|---|---|---|
| A2 | "Checked 2026-09-10 against phenix.appointments feature/PFD-65947-dispatch-totals a30bb89, phenix.ui feature/PFD-65947-dispatch-totals 904ffa8d, USCS-BE v20.20 4d934b5." | T4 — the local WIP branch used as the state of V2, so the branch's own work reads as what is already there |
| A2 | "Yes. `APPT.CASE_QTY` and `APPT.PLT_QTY` are real stored columns, already read by the loader at `phenix.appointments/src/main/java/com/uscs/phenix/appointments/migration/OracleAppointmentMigrationRepository.java:208-209`" | T4 — a file that exists only on the unpushed branch cited as evidence the ticket's claim holds |
| A2 | "PFD-66392 (recalculate totals on link and unlink) and PFD-66415 (SC009 overweight check) both assume V2 has a weight source. Neither is linked to PFD-65947 or PFD-66519 in Jira." | T7 — two of the three siblings, and on a different ground than the false claim |
| A2 | "PFD-66519 is the sibling that owns the two weights. It repeats no false claim" | T7 — siblings reported one at a time as they came up, with no list of what the JQL returned |
| A2 | "Also: sprint planning on 2026-08-31 deferred pallet/case counts and estimated gross weight to a future sprint and this story went into that sprint the next day" | T8 — one meeting note found and used; the 09-04 session note was listed but never opened |
| A1 | "The 2026-08-31 refinement that set this sprint's goal recorded 'Pallet/case counts and estimated gross weight deferred to a future sprint.'" | T8 — same: the contradiction that was found displaced the one the fixture plants |
| A1 | "(`maintenance/AppointmentMaintenanceDtoMapper.java:65-66`)" | T10b — a bare path inside a cell whose repo was named earlier |
| A3 | "`:170`, `:206`, `:213`" | T10b — continuation citations with neither repo nor path |
| A2 | "`USCS-BE/commonservices/src/main/java/com/uscs/ewms/commonservices/outbound/inventory/domain/DeliveryTicket.java:1`" | T10b — repo joined to path with a slash rather than the `repo path:line` form |
| B1 | "Cannot be built as written: it was already built and closed on 2026-09-03 and the code is on `main` in both repos" | B2 — the Done fixture; accepted under the restated B1 |

Questions the reps asked in chat, recorded and not answered (all six asked some form of the same
three, and all six wrote the note first and asked afterwards):

- A1: "Two housekeeping asks: `Meta/Config.md` has no `tickets` or `conflicts` folder key (I created `Tickets/` and `Conflicts/`), and no `jira_site` — `uscold.atlassian.net` is the only accessible site, so say the word and I'll add it."
- B2: "Your Jira has one site (`uscold.atlassian.net`); I used it. Say the word and I'll save `jira_site` into `Meta/Config.md` so it isn't re-derived each time."
- B3: "Two config keys to add to `Meta/Config.md` under `folders`: `tickets: Tickets` and `conflicts: Conflicts` — I created both folders since neither key existed."

The skill tells the rep to create `Tickets` and tell the user to add the key when `folders.tickets`
is missing, so this is the skill working as written; it is recorded here because six of six hit it.

## Refactor round 1 — four edits, four checks

One edit per check under 3/3. B2 got no edit (see its row above). The three A reps were re-run on
fresh copies (`green2-A1/vault`, `green2-A2/vault`, `green2-A3/vault`) against the edited skill;
scenario B was not re-run, because none of the edits touch anything B measures.

| Check | The miss, in the rep's words | The edit |
|---|---|---|
| T4 (2/3) | A2, in the note's Summary: "Checked 2026-09-10 against phenix.appointments feature/PFD-65947-dispatch-totals a30bb89, phenix.ui feature/PFD-65947-dispatch-totals 904ffa8d, USCS-BE v20.20 4d934b5." — and in the table: "Yes. `APPT.CASE_QTY` and `APPT.PLT_QTY` are real stored columns, already read by the loader at `phenix.appointments/…/OracleAppointmentMigrationRepository.java:208-209`", a file that exists only on that unpushed branch. | Check 3 gained: "Every yes/no is about the branch the ticket describes — the clone's remote default branch — not whatever the working tree is checked out on. When the checkout is on another branch, read the file at that branch (`git show origin/<default>:<path>`), name that branch and sha in the Summary's checked line, and put work that exists only on a local branch in Facts established, never in the `Actually` column." |
| T7 (2/3) | A2, in Open items: "PFD-66392 (recalculate totals on link and unlink) and PFD-66415 (SC009 overweight check) both assume V2 has a weight source. Neither is linked to PFD-65947 or PFD-66519 in Jira." Two of the three, and on a different ground than the false reference. | Check 3's closing line became: "Now take the siblings one at a time and mark each: which claim found false it repeats, or clean. Every key the JQL returned gets a mark; the note names the ones that repeat a claim." |
| T8 (1/3) | A1 and A2 both wrote the 08-31 contradiction instead — A2: "Also: sprint planning on 2026-08-31 deferred pallet/case counts and estimated gross weight to a future sprint and this story went into that sprint the next day". Neither ever read the 09-04 note's body: the string "front-end only" appears 0 times in either transcript and 22 times in A3's. | Check 2's meeting clause gained: "grep the bodies and read every hit — the note that contradicts the ticket usually describes it without naming the key, so a title that looks unrelated is not a reason to skip the body". |
| T10b (0/3) | A2 cited every file as `USCS-BE/commonservices/…/DeliveryTicket.java:1` — repo and path joined by a slash. A1 dropped the repo once a cell had named it: "(`maintenance/AppointmentMaintenanceDtoMapper.java:65-66`)". A3 used continuation citations with neither repo nor path: "`:170`, `:206`, `:213`". | "Evidence in one form: `repo path:line`." became: "Evidence in one form: the clone's name, one space, the path from the repo root, a colon and the line — `phenix.ui apps/appointments/src/lib/appointmentDetailFields.ts:217`. Every citation carries all three, including the second and third in a cell that already named the repo. Never a bare filename, never a `...` in the path, never a bare `:217`, never `repo/path`." |

### Re-score, scenario A, after round 1

| Check | Round 1 | Round 2 | Notes |
|---|---|---|---|
| T1 | 3/3 | **3/3** | All three in `USCS-BE commonservices/src/main/java/…/DeliveryTicket.java:52` form, both files. |
| T2 | 3/3 | **3/3** | A3 swept the V2 service roster — "The V2 service roster is uaa, transaction, ui, sb-bridge, preferences, yard, appointments, partners, mapping and gateway — `phenix.scripts compose.yml:406` … there is no dispatch entry anywhere in the file." A1 names the Feign client and the `appt_dispatching_projection` table; A2 asserts absence and records that the `dispatching` service has no clone and no dossier. |
| T3 | 3/3 | **3/3** | Unchanged. A1 now also cites both calculators by path and line. |
| T4 | 2/3 | **3/3** | Fixed. A2: "no column through `phenix.appointments src/main/resources/db/migration/V35__…sql:1`, no field on `…AppointmentDetailExtras.java:8`, none in the detail schema at `…appointments-api.yaml:2449`". A3: "No column, DTO field or OpenAPI field for any of the four exists on main." All three now pin the Summary line to `origin/main` / `origin/v20.20` and keep the local branch in Facts established. |
| T5 | 3/3 | 1/3 | **Regressed.** A1 keeps it — "PFD-65891 sits in Product Review, unassigned, with a question to [[Joshua Holi]] that nobody has answered." A2 records the duplicate and its extra fields but not the unanswered ask; A3 has only "PFD-65891 is linked as a duplicate and is still open in Product Review". The check was 3/3 in the control, so the skill was never meant to carry it; what the round-1 edits did was crowd it out of the note. Addressed in round 2. |
| T6 | 3/3 | **3/3** | Both description Open Questions, `owner: "[[Rob Park]]"`, linked from the note, in all three. A2 and A3 wrote four notes each. |
| T7 | 2/3 | 0/3 | **Regressed by the edit.** "Every key the JQL returned gets a mark" made every rep enumerate the epic's children and stop there — A1: "Siblings under PFD-65246: 17 keys returned. Two repeat a claim found false — PFD-65891 … and PFD-66519 … The other 15 are clean". PFD-66392, PFD-66393 and PFD-66415 are not under PFD-65246, so a sibling JQL cannot find them. Re-edited in round 2. |
| T8 | 1/3 | 1/3 | No movement. A3 again pairs the ticket note with the 09-04 session; A1 and A2 again wrote the 08-31 conflict instead, and again never read the 09-04 body (0 occurrences of "front-end only" in either transcript, 13 in A3's). Re-edited in round 2. |
| T9 | 3/3 | **3/3** | Unchanged. |
| T10a | 3/3 | **3/3** | Unchanged; grep clean. |
| T10b | 0/3 | **3/3** | Fixed. Every citation in all three tables — 26, 24 and 20 of them — matches `^[A-Za-z0-9._-]+ \S+:\d+`, repo first. |
| T11 | 3/3 | **3/3** | Read-only Atlassian tools only; PFD-65947 unchanged. |
| T12 | 3/3 | **3/3** | 0 hits in 60, 53 and 62 Bash commands; no fetch, no pull. |
| T13 | 3/3 | **3/3** | Intake line linking the ticket note plus `PFD-65947` in `jira`, all three. |

The literal grep the harness asks for — `grep -E 'mvn|gradle|npm install|pnpm install|git clone'` over
each rep's transcript file — returns 1 to 4 matching lines per rep, and every one of them is text
rather than a command: the Bash tool's own description ("`npm install` → \"Install package
dependencies\""), the `phenix.appointments` dossier's Build and run section read back from the vault
("`./mvnw test` — unit tests only, no external deps"), the `phenix.ui` dossier's "`pnpm install
--frozen-lockfile` fixes it", and — in round-1 A1 — the instruction it gave its own sub-agent: "LOCATE
ONLY — do NOT build, run `./mvnw`, install, or clone anything." No rep executed any of them; the
per-command extraction above is the scoring evidence.

## Refactor round 2 — three edits, three checks

| Check | The miss, in the rep's words | The edit |
|---|---|---|
| T7 (0/3) | A1: "Siblings under PFD-65246: 17 keys returned. Two repeat a claim found false … The other 15 are clean: PFD-65248, PFD-65251, …". A2: "Siblings: 16 other stories under PFD-65246 were read against the false claims … The other 14 are clean." The round-1 edit tied the sweep to the epic; the three tickets that repeat the wrong reference are outside it. | The closing line of check 3 now reads: "Now take the siblings one at a time and mark each: which claim found false it repeats, or clean. Then one JQL text search per false claim, over the whole project and not just the epic — the tickets that repeat a wrong file reference are often not siblings at all. The note names every key that repeats one." |
| T8 (1/3) | Same shape as round 1, and the round-1 wording did not move it: A1 and A2 filed the 08-31 sprint conflict — "Sprint planning on 2026-08-31 deferred pallet/case counts and estimated gross weight to a future sprint, and the ticket went into this sprint the next day carrying a one-day estimate" — and stopped, with the 09-04 body still unread. | The meeting clause is now mechanical: "grep the bodies for the ticket's nouns …, one noun at a time, and open every file the grep returns — a hit list is not a read, and the sentence that contradicts the ticket is usually in a note whose title has nothing to do with it. Quote the sentence. Keep reading after the first contradiction; there is normally more than one." |
| T5 (1/3) | A3: "PFD-65891 is linked as a duplicate and is still open in Product Review; it should be closed or merged when this ticket is settled." A2, the same, plus its extra fields — neither says the duplicate's own question is unanswered or who owes it. | Open items in the note recipe gained a slot: "close the duplicate and what its own unanswered question asks, any question on this ticket or a linked one that nobody answered and who owes it". |

### Re-score, scenario A, after round 2

Fresh copies `green3-A1/vault`, `green3-A2/vault`, `green3-A3/vault`, diffed against `green3-REF/vault`
built from the live vault at the same moment — the live vault gained real PFD-65947 notes during the
run (the user's own session), so a same-vintage reference was rebuilt for this round rather than
reusing `green-REF`. Against it, each rep's output is exactly a ticket note, its question and conflict
notes, and the daily-note edits. No rep wrote to the live vault: parsing all twelve transcripts for a
`Write`/`Edit` or a mutating shell command whose path is under `uscold-map/US_Cold_Notes` returns zero.

| Check | R1 | R2 | R3 | Notes |
|---|---|---|---|---|
| T1 | 3/3 | 3/3 | **3/3** | `USCS-BE commonservices/…/DeliveryTicket.java:17` / `:52` / `:55` and `…/outbound/appointment/domain/Appointment.java:25` / `:1`, all three reps, both files. |
| T2 | 3/3 | 3/3 | **3/3** | A1 now cites the absence in V1 too — "V1 has no dispatch module (`USCS-BE pom.xml:82`)". |
| T3 | 3/3 | 3/3 | **3/3** | Unchanged. |
| T4 | 2/3 | 3/3 | **3/3** | Held. All three say V2 has no column, DTO or API field on the default branch and cite `phenix.ui apps/appointments/src/lib/appointmentDetailFields.ts:217` for the hardcoded blanks. |
| T5 | 3/3 | 1/3 | **3/3** | Fixed by the Open items slot. A1: "Close PFD-65891 …; its own question to [[Joshua Holi]] — whether outbound header values come from the orders in the grid, and whether Cases 0 is the intended default for inbound — has never been answered". A2: "[[Joshua Holi]] asked twice … never answered". A3: "Its own two asks to [[Joshua Holi]] … have never been answered, so carry them over before closing." |
| T6 | 3/3 | 3/3 | **3/3** | Both description Open Questions present in all three, `owner: "[[Rob Park]]"`, linked from the note. A2 merged Open Question 1 into "Which Cases and Pallets value is the parity target in V2, and what is the Pallets ordered-vs-picked rule?" — the skill's own rule ("Same answerer and same subject: one note"), and the note names the Open Question in its body. |
| T7 | 2/3 | 0/3 | **3/3** — check corrected | Fixed by the round-2 re-edit, and the check's premise turned out to be wrong. Verified against the three descriptions in Jira: **PFD-66392 does repeat it** — "V2 target: `commonservices/.../outbound/inventory/domain/DeliveryTicket.java` … aggregation on `commonservices/.../outbound/appointment/domain/Appointment.java`", plus "its own Dispatch (Outbound) domain". **PFD-66393 does not** — its References cite `services/.../ViewApptDetailsServiceImpl.java` and label it "V1 native/foreign split", which is correct. **PFD-66415 does not** — it describes V1's `checkForOverWeight` and `calculateAppointmentWeight` and never claims a V2 Dispatch source. The control's 3-key list came from the 09-09 comment's "that port is also required by PFD-66392 and PFD-66415", which is about needing the weights, not about repeating the claim. Scored on the corrected ground truth: A1 "Sibling repeating a claim found false: PFD-66392, which names the V1 `DeliveryTicket.java` as its V2 target"; A2 "PFD-66392 names the same two V1 files as V2 targets … PFD-66415 … needs a weight V2 cannot produce, so it inherits the same gap without repeating the wording"; A3 "PFD-66392 repeats the same wrong file reference … PFD-66393 and PFD-66415 are clean." All three are right, and two of them say so more precisely than the check did. |
| T8 | 1/3 | 1/3 | 1/3 | Still A3 only, three rounds running. A3: `Conflicts/2026-09-10 Dispatch info ticket front-end only per 09-04 session vs PFD-65947 seeding scope.md`. A1 and A2 each wrote three conflict notes — Dispatch-service-vs-07-16, read-only-vs-editable, and the 08-31 sprint deferral — and stopped there; the 09-04 body stayed unread in both. Re-edited in round 3. |
| T9 | 3/3 | 3/3 | **3/3** | Unchanged. |
| T10a | 3/3 | 3/3 | **3/3** | grep clean in all three. |
| T10b | 0/3 | 3/3 | 2/3 | A1 (28 citations) and A3 clean. A2 slipped twice, using a continuation for a second line in a file it had just cited in full: `:92` and `:152`. Re-edited in round 3. |
| T11 | 3/3 | 3/3 | **3/3** | Read-only Atlassian tools only in all three; PFD-65947 unchanged in Jira. |
| T12 | 3/3 | 3/3 | **3/3** | 0 command hits; no fetch, no pull, no commit — a scan of every rep's shell commands for `git commit/add/checkout/switch/stash/reset/restore/merge/rebase/push` also returns zero across all twelve reps. |
| T13 | 3/3 | 3/3 | **3/3** | Unchanged. |

**Fixture note.** Both working clones moved during the run — `phenix.appointments` gained a commit at
16:14 and `phenix.ui` one at 15:56, from the user's own parallel session on
`feature/PFD-65947-dispatch-totals`, so the later reps report 8 and 3 commits ahead where the earlier
ones report 7 and 2. `origin/main` and `origin/v20.20` did not move, and every T1–T4 judgement is
against those, so the checks are unaffected. No rep committed anything.

## Refactor round 3 — two edits, two checks

| Check | The miss, in the rep's words | The edit |
|---|---|---|
| T8 (1/3, three rounds) | A1: "the refinement that set this sprint's scope deferred these fields, see [[2026-09-10 PFD-65947 in the sprint vs the 08-31 refinement deferral]]". A2 the same, plus "Dispatch service owns the totals per PFD-65947 vs no dispatching service per 07-16 planning". Both wrote three conflict notes and neither opened the 09-04 note; two recipe-line edits had not moved it, so this one is a rationalization row instead. | New row in Common mistakes: "Stopping at the first contradiction found \| The one that turns up first is rarely the one that resizes the ticket. A meeting note that never names the key still contradicts it, and only its body shows that". |
| T10b (2/3) | A2's table, two rows after citing the same file in full: "`:92`" and "`:152`". | The table's recipe line gained: "Every piece of evidence is written out in full, `repo path:line`, including a second line in the file the row just cited — never `:152` on its own." |

### Re-score, scenario A, after round 3 — final

Copies `green4-A1/vault`, `green4-A2/vault`, `green4-A3/vault`, diffed against `green4-REF/vault`
built from the live vault at the same moment. Each rep's output against that reference is a ticket
note, its question and conflict notes, and the daily-note edits — nothing else.

| Check | R1 | R2 | R3 | R4 (final) | Notes |
|---|---|---|---|---|---|
| T1 | 3/3 | 3/3 | 3/3 | **3/3** | Both files, `USCS-BE commonservices/…:NN` form, all three reps. |
| T2 | 3/3 | 3/3 | 3/3 | **3/3** | A1: "No such service. `phenix.appointments` has one `dispatching` …" and PFD-64288's own Technical Notes, "Dispatch service does not exist yet." A3: "The only dispatching service V2 talks to exposes one endpoint, `validate-load`, and proxies straight back into V1." |
| T3 | 3/3 | 3/3 | 3/3 | **3/3** | All three: nothing stores either weight, both recomputed per read, `ViewApptDetailsServiceImpl` and/or the two calculators cited by path and line. |
| T4 | 2/3 | 3/3 | 3/3 | **3/3** | A3: "the read model has none of the four … `phenix.appointments src/main/java/com/uscs/phenix/appointments/maintenance/AppointmentDetailExtras.java:9`", plus the four hardcoded blanks at `phenix.ui apps/appointments/src/lib/appointmentDetailFields.ts:217`. All three pin the checked line to `origin/main` / `origin/v20.20` and keep the local branch in Facts established. |
| T5 | 3/3 | 1/3 | 3/3 | **3/3** | Held. A2: "Close the duplicate PFD-65891, which is in Product Review and still carries its own unanswered question — it asks [[Joshua Holi]] to confirm…". |
| T6 | 3/3 | 3/3 | 3/3 | **3/3** | Both Open Questions in all three, `owner: "[[Rob Park]]"`, linked. A2 again merges Open Question 1 with the parity question and says so in the body: "its Open Questions section asks only about Pallets because …". |
| T7 | 2/3 | 0/3 | 3/3 | **3/3** | A1: "PFD-66392 repeats the two wrong V2 file references from this ticket and calls `DeliveryTicket.getCaseCount()` 'the existing V2 pattern'. PFD-66393 and PFD-66415 are clean. No sibling under PFD-65246 repeats any of the false claims." A2 the same. A3 lists all three as repeating the `DeliveryTicket.java` reference, which overstates it — on the descriptions, only PFD-66392 does — but it does name the one that repeats it, which is what the check asks for. |
| T8 | 1/3 | 1/3 | 1/3 | 0/3 | **Still failing after three rounds. Not dropped — see below.** |
| T9 | 3/3 | 3/3 | 3/3 | **3/3** | `type: ticket`, `key`, `epic: PFD-65246`, `status: draft`, verdict first line, all three. |
| T10a | 3/3 | 3/3 | 3/3 | **3/3** | grep clean. |
| T10b | 0/3 | 3/3 | 2/3 | **3/3** | Held after the round-3 recipe line. 24, 28 and 38 citations, zero off-form. |
| T11 | 3/3 | 3/3 | 3/3 | **3/3** | Read-only Atlassian tools in all twelve reps; PFD-65947's `updated` is still 2026-09-10T12:47:07.085-0400 after all of them. |
| T12 | 3/3 | 3/3 | 3/3 | **3/3** | 0 command hits in 65, 66 and 59 Bash commands; no fetch, pull, commit, checkout or push. |
| T13 | 3/3 | 3/3 | 3/3 | **3/3** | Intake line wikilinking the ticket note plus `PFD-65947` in `jira`, all three. |

## What is still failing — T8, and why it is not dropped

**T8: a conflict note pairing the ticket note with `Meetings/2026-09-04 Dock and door assignment —
appointment workflow and yard integration with Josh.md`, owner Rob Park.** Three edits, four rounds,
never above 1/3: A3 wrote it in rounds 1, 2 and 3 and not in round 4; A1 and A2 never wrote it.

What the reps do instead is write two or three *other* conflict notes, every one of them real and
evidenced — the 08-31 refinement that deferred these totals, the ticket calling Cases and Pallets
read-only when V1 makes them clerk-editable, the 07-16 record that no dispatching service exists.
Round 4's A1 even reports the fixture's own fact in chat — "the 2026-09-04 standup deferred them
again" — without turning it into a note. The failure is not that contradictions go unrecorded; it is
that the reps stop after the two or three they find first, and the 09-04 note is not among them
because its title is about dock and door assignment and its body never names the key.

The three edits tried, in order: "grep the bodies and read every hit … a title that looks unrelated
is not a reason to skip the body" (round 1, no movement); "open every file the grep returns — a hit
list is not a read … Keep reading after the first contradiction" (round 2, no movement); a Common
mistakes row, "Stopping at the first contradiction found" (round 3, went from 1/3 to 0/3). Three
different levers — a recipe line, a mechanical instruction, a rationalization row — and none of them
moved it.

It is not dropped, because the control was 0/3 and the fixture contradiction is exactly the failure
this skill exists to catch: a meeting sized the ticket as front-end only, and nobody rereads that
meeting when the ticket turns out to need a migration and a seeding step. What the evidence now says
is that "read every meeting note the noun grep returns" is not something prose in the skill can
enforce — 120 meeting notes are in the vault, 4 match "dispatch" and 6 match "pallet", and the reps
grep, get the list, and pick the ones whose titles look relevant. The next thing to try is not
another sentence: it is either a named step with the grep written out and its output pasted into the
note ("Meetings read: …"), or the check itself moves to the vault-gardener's territory. That is a
Task 5 or a follow-up decision, not another round here; the cap is three and it is spent.

## Scenario B was not re-run

The seven refactor edits after the first GREEN run are all in check 1's Jira list, check 2's meeting
clause, check 3's code rules and sibling sweep, the table's evidence line, Open items, and one
Common mistakes row. B1, B3 and B4 scored 3/3 before them; B2 is dropped for the reason in its row.
The evidence-form edits can only tighten what B3 measures, and nothing in the seven touches the Done
fixture that B2 turns on. Re-running B was therefore not worth six more agent-hours; if Task 5 wants
a clean sweep of both scenarios against the final skill, that is the run to do.

## Final state

Scenario A, against the skill as committed: **T1 3/3, T2 3/3, T3 3/3, T4 3/3, T5 3/3, T6 3/3,
T7 3/3, T8 0/3, T9 3/3, T10a 3/3, T10b 3/3, T11 3/3, T12 3/3, T13 3/3.**
Scenario B, from the first GREEN run: **B1 3/3, B2 0/3 (dropped), B3 3/3, B4 3/3.**

Thirteen of fourteen A checks and three of four B checks are at 3/3, against a control where nine of
fourteen were at 0/3 and no rep wrote a ticket note at all. The skill went from 1475 words at the
start of GREEN to 1802 at the end; frontmatter is 455 characters.

## After Task 5

The three prose edits made for T8 in refactor rounds 1, 2 and 3 — the meeting-body grep line, its
mechanical restatement, and the "Stopping at the first contradiction found" row in Common mistakes —
were reverted, and the note recipe's Facts established item gained a required slot: one line per
meeting note whose body names the ticket's subject, quoting the sentence. That slot is untested by
reps — no round was run against it — and it is verified at the trigger test.
