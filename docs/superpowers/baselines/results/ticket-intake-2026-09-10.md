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
