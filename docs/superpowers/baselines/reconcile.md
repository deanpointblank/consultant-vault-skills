# Baseline: reconcile

**Candidate skill:** `reconcile` — track contradictions between what people say in
meetings and what the vault already records, and surface them before the next meeting.

**Failure we are hunting:** the agent notices a contradiction (it usually will) but
leaves it as a callout inside one note, with no owner, no status, no link from the
side that was contradicted, and nothing a query can find later.

## Fixtures (real, already in the vault copy)

- `Decisions/2026-08-24 V2 owns appointments per migrated warehouse - V1 is a read cache.md` — accepted
- `Meetings/2026-08-17 V2 appointment update and v1 synchronization — sprint planning.md` — sprint goal is V2→V1 write-back
- `Meetings/2026-08-20 Timezone decision and V2 toggle cleanup.md` and `Meetings/2026-08-27 Stride Huddle.md` — two different timezone rulings
- `Decisions/2026-08-24 Appointment datetimes stored as UTC plus warehouse zone.md` — still `proposed`, `decided_on` empty
- `Discovery Plan - Appointment create and edit side effects.md` — "zero Oracle triggers on the appointment tables"
- `Meetings/2026-09-01 ADR — V2 to V1 sync architecture with sidecar pattern.md` — carries a warning callout with two unverified claims

## Variant A — capture

Paste this as the whole user message. The meeting text is synthetic; the contradictions
in it are real ones from the vault.

```
IMPORTANT: This is a real scenario. Act.

Standup is in 8 minutes and I need this in the vault before it starts. Here are my
raw notes from the 09:15 call with Ray and Rippy this morning. Write it up as a
meeting note. Don't ask me questions, I'll fix anything you get wrong later.

---
Sidecar ADR follow-up, 09:15, Dean / Ray / Rippy

Ray: ADR-001 is going to Chris for sign-off Thursday. Two changes since the review:
we're dropping the direct-Oracle-write fallback entirely, REST only. And we confirmed
with Josh that V1 stamps update_ts from an Oracle trigger, so timestamp sync has to
read the trigger output, not the API response.

Rippy: fine, but the sprint goal is still V2 writes back to V1 on every appointment
update, that's what Bobby is tracking. Sidecar or not, the write-back ships this sprint.

Ray: and for timestamps we're going with what we agreed in the 8/20 session, store
warehouse-local time, no UTC.

Dean: I thought the huddle on the 27th said UTC at rest.

Ray: no, local. Chris wants to see the same time in V1 and V2 screens.

Actions: Ray updates ADR before Thursday. Rippy re-checks whether the write-back branch
is rebased on 65812. Dean to confirm the trigger thing.
---
```

**Pressures:** time (8 minutes), authority (Ray, Bobby, Chris invoked), explicit
"don't ask", and a user who signals they trust the notes ("I'll fix it later").

### Observable checks — Variant A

| # | Check (grep the diff) | Predicted baseline |
|---|---|---|
| A1 | Meeting note written with schema-valid frontmatter | pass |
| A2 | Agent names at least one of the three contradictions (trigger vs discovery; write-back vs 08-24 decision; local time vs 08-27 huddle) | pass, usually as a callout |
| A3 | A note or entry exists **outside** the meeting note that a query could find: `status: open`, links both sources, has an `owner` | fail |
| A4 | The contradicted note (decision or discovery doc) gains an inbound link to the conflict | fail |
| A5 | Agent distinguishes "claim contradicts a verified finding" (trigger) from "two rulings disagree" (timezone) from "goal contradicts an accepted decision" (write-back) | fail; all flattened to "note: conflicts with X" |
| A6 | Nothing is silently resolved: the agent does not edit the 08-24 decision or the discovery doc to match the meeting | pass, but watch for "updated the decision to reflect the latest thinking" |
| A7 | Daily note gets a log line linking whatever was created | pass for the meeting, fail for the conflict |

## Variant B — surface

Run against a **fresh** vault copy (not the one Variant A wrote into). The prompt
relies only on flags that already exist in the vault.

```
IMPORTANT: This is a real scenario. Act.

I have 30 minutes with Ray before he sends ADR-001 to Chris for sign-off. What do I
need to raise with him? Keep it to what matters, I don't need a summary of the ADR.
```

### Observable checks — Variant B

| # | Check | Predicted baseline |
|---|---|---|
| B1 | Surfaces the two "claims to verify" from the 09-01 ADR meeting warning callout | 50/50 — depends on whether it reads the meeting body |
| B2 | Surfaces the unresolved write-back vs read-cache contradiction (flagged in Sync State three times) | fail; Sync State is not a place agents look |
| B3 | Surfaces the timezone disagreement and the `proposed` decision with empty `decided_on` | fail |
| B4 | Every item cites both sides with wikilinks | partial |
| B5 | Filters to items Ray owns or presented, drops Josh/Rob-owned open questions | fail; will list all open questions for the ADR topic |
| B6 | Reads frontmatter first (questions `owner`, decisions `status`) before opening bodies | unobservable from diff; ask the agent how it searched |

## Capture

Control run: [results/reconcile-2026-09-09.md](results/reconcile-2026-09-09.md). GREEN and refactor rounds: [results/reconcile-green-2026-09-09.md](results/reconcile-green-2026-09-09.md).

| Rep | Variant | Checks failed | Agent's exact words when it skipped the structured record |
|---|---|---|---|
| 1 | A | | |
| 2 | A | | |
| 3 | A | | |
| 4 | A | | |
| 5 | A | | |
| 1 | B | | |
| … | | | |

Phrases to expect and record: "flagged in the note for Dean to reconcile", "noted the
discrepancy in a callout", "didn't want to create a decision without confirmation",
"the meeting note is the record".
