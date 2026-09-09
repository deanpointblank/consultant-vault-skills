# Baseline: handoff

**Item covered:** a `handoff` skill and template.

**Failure we are hunting:** wrong shape. The vault holds 16 handoff notes with a stable
section order; a fresh agent writes a free-form status summary, omits the where-everything-is
table, buries the rulings, and does not set `supersedes` or link the chain.

## Fixtures

- `PFD-65810 Handoff - PRs Open and Follow-ons 2026-09-04.md` — the previous handoff in the chain
- `PFD-65810 Handoff - Implementation Complete 2026-09-03.md`
- `Daily/2026-09-09.md` — today's entries about the same ticket

## Prompt

```
IMPORTANT: This is a real scenario. Act.

End of day, write the handoff for PFD-65810 so I can pick it up cold tomorrow. Where things
are: backend PRs #144 and #145 merged to main this morning, phenix.ui #373 rebased on main
and force-pushed as 4a5538eb, then Rob rewrote the ticket with AC7 to AC9 (yard-site door
lock) and I built that on #373 as d6797b52, 780 UI tests green, Jira comment 546994 posted.
Still open: #373 needs Rippy's review, the PFD env hasn't been reseeded since V35 so QA
can't see the door lock yet, and Fatema asked whether AC8 applies to outbound too, I said
yes without checking with Rob. Things I decided on my own today: yard signal hardcoded true
for Warsaw until the yard service exposes it; field label stays "Door" not "Dock door";
skipped the AC9 test because V2 has no Avl Doors link. Tomorrow: chase Rippy, reseed the
env, confirm AC8 with Rob, then start PFD-66381 prep.
```

## Observable checks

| # | Check | Predicted baseline |
|---|---|---|
| H1 | Filed as `PFD-65810 Handoff - <topic> 2026-09-09.md` at the vault root with `type: handoff`, `jira`, `status`, `topics` matching the existing chain | partial |
| H2 | Opens with a bold one-paragraph "where things stand" naming what it supersedes | fail |
| H3 | Where-everything-is **table**: PRs, SHAs, branches, Jira comment id | fail; prose |
| H4 | Test-gate line with the literal count | pass |
| H5 | A "Rulings made on Dean's behalf / reversible" section containing exactly the three unilateral decisions | fail; merged into narrative |
| H6 | A "Gated / waiting on" section separating Rippy-review, env reseed, and the AC8 question | partial |
| H7 | Numbered pick-up list with one action per line | pass |
| H8 | `supersedes:` set to the 09-04 handoff and that note gets a "superseded by" line or moves to Archive | fail |
| H9 | Links the daily note, people, and the ticket's story doc rather than restating them | partial |
| H10 | The AC8 answer given without checking is surfaced as an open question note owned by Rob, not buried | fail |
