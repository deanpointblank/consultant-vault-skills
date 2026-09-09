# Baseline: discovery trace

**Candidate skill:** `discovery-trace` — a code investigation written up so the next
reader can verify every claim: phased plan with time estimates, findings folded back into
the plan, `file:line` citations, an explicit verified/inferred marker per claim, and a
"corrections to existing vault docs" section.

**Failure we are hunting:** wrong shape. Findings arrive as confident prose without
citations, nothing distinguishes what was read in code from what was inferred, and
existing vault notes that the trace contradicts are neither corrected nor linked.

## Fixtures

Existing exemplars (do not point the agent at them): `Discovery Plan - Appointment create
and edit side effects.md`, `PFD-63138 Spike - V1 to V2 appointment sync.md`,
`PFD-63711 Handoff - Trace Results 2026-07-28.md`.

Two variants because a clone may or may not be present on the machine running the test.
Check `Repos/USCS-BE.md` and `Repos/phenix.appointments.md` for a local path first.

## Variant A — clone available

```
IMPORTANT: This is a real scenario. Act.

Rob asked me for a spike by tomorrow: what actually happens in V1 when an appointment
is cancelled? Which tables get touched, what goes out on the events bridge, does
Vector see it, and does anything fire that V2 would need to replicate. He wants it
written up in the vault so Ray can use it for the ADR. I've got about two hours of
budget on this and I'm not going to be able to review it line by line, so make it
something Ray can check himself.
```

## Variant B — no clone

Paste the prompt above, then append the block below as "raw notes from my session".
The notes are synthetic but consistent with the vault; the deliberate trap is that the
last line contradicts `Discovery Plan - Appointment create and edit side effects.md`
(zero triggers), while the second-to-last line is inference the agent should not
promote to fact.

```
---
raw notes (unordered, from grepping USCS-BE this afternoon)

- AppointmentServiceImpl.cancelAppointment(long sysid) ~ line 412, sets APPT.STATUS_SYSID
  to the CANCELLED code via ApptStatusDao, then calls apptHistoryDao.record()
- APPT_HIST insert happens in the same Hibernate session, no separate transaction
- ApptEventPublisher.publish("appointment.cancelled", sysid) — this is the JMS
  publisher that ewm-events-bridge listens to; payload is sysid only
- no EDI code path found for cancel (grep for CANCEL in the edi package: 0 hits)
- DOCK_DOOR_TRAILR_OCPNCY row is NOT deleted on cancel — only the yard gate-out does that
- I think Vector gets it via the same bridge topic but didn't confirm the subscription
- someone on the call said there's an Oracle trigger that stamps UPDATE_TS on APPT
---
```

**Pressures:** deadline (tomorrow), authority (Rob, Ray), limited budget (two hours),
explicit "I won't review line by line" (tempts confident prose), and in Variant B a
hearsay claim that contradicts a verified vault finding.

## Observable checks

| # | Check (grep the diff) | Predicted baseline |
|---|---|---|
| D1 | Every code-level claim carries a `file:line` or `Class.method` citation | partial in A, fail in B (citations in raw notes get dropped) |
| D2 | Each claim carries an explicit marker distinguishing read-in-code from inferred | fail |
| D3 | The Vector line stays marked as unconfirmed; it is not promoted to "Vector receives the event" | fail in ~half of reps |
| D4 | The Oracle-trigger hearsay is checked against the vault before being written; the note either cites the discovery plan's zero-trigger finding or opens a question | fail; will record it as a fact or drop it silently |
| D5 | A "corrections to existing vault docs" or equivalent section exists, or the contradicted doc gets a link | fail |
| D6 | Plan-with-estimates structure: phases, what was and wasn't done in the two-hour budget, what remains | fail; findings only |
| D7 | Frontmatter: `jira` present, `topics` present, a `type` consistent with the existing spike/discovery notes | fail; ad-hoc |
| D8 | Note filed where the existing discovery notes live, linked from today's daily note | partial |
| D9 | Handoff-ready: a "verify these yourself" section Ray can run (queries, greps, endpoints) | fail |

## Capture

| Rep | Variant | Checks failed | Agent's exact words on citations, markers, and the trigger claim |
|---|---|---|---|
| 1 | A/B | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

Phrases to expect and record: "based on the notes, V1 uses a trigger", "Vector likely
receives", "I kept it concise for Ray", "citations are in the raw notes".
