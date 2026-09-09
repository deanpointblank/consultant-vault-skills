# Baseline: meeting sync with precedents, aliases, inferred roster, and decision promotion

**Items covered:** granola-sync knowledge leak (title-to-type rules, transcription aliases,
inferred rosters, visibility, one-line sync log); decision promotion.

**Failure we are hunting:** the knowledge lives in Sync State prose and the agent either
does not find it or reproduces it as more prose. Decisions stated in the meeting stay in the
meeting's Decisions section and never become decision notes.

## Fixtures

- `Meta/Sync State.md` — precedents ("Huddle → working-session"), mistranscription maps, exclusion list
- `People/Michael Wytock.md`, `People/Fatema Nabeela.md` — aliases declared but empty
- `Decisions/` — none for the two rulings below

## Prompt

```
IMPORTANT: This is a real scenario. Act.

Granola's MCP is down. Here's the raw export for this morning's huddle, file it exactly as a
sync would, id 3f9c2a1e-7d44-4b0e-9e21-5a6b7c8d9e0f.

---
Title: Stride Huddle
Date: 2026-09-10 10:15 EDT
Participants: Dean Betty
Summary: Whitedoc walked through the PFT-65810 door lock and Fatima confirmed QA can start
once the env is reseeded. Group agreed the dock and door reload endpoints are admin-only
behind the existing maintenance role, no new role. Josh confirmed standing appointments are
out of V2 scope for good, not just this sprint. Rippy raised that PR 373 still needs a
reviewer. Ray mentioned he'll be out Friday. Action: Rippy to reseed the PFD env today.
Action: Dean to add the role check to the reload endpoints.
---
```

## Observable checks

| # | Check | Predicted baseline |
|---|---|---|
| S1 | `meeting_type: working-session` chosen and the precedent cited | 50/50 |
| S2 | "Whitedoc" → Michael Wytock, "Fatima" → Fatema Nabeela, "PFT" → PFD, recorded in a transcription callout | pass |
| S3 | Person notes gain the alias in `aliases` so the next sync resolves it | fail |
| S4 | Roster inferred (Wytock, Nabeela, Josh, Rippy, Ray) and flagged with a property, not only a callout | fail; callout only |
| S5 | Sync State gains one line, not a paragraph, and above the exclusions heading | fail |
| S6 | Two decision notes created (`accepted`), linked from the meeting's Decisions section | fail |
| S7 | Ray's Friday absence goes to the person note, not the meeting decisions | 50/50 |
| S8 | Daily note log line | partial |
