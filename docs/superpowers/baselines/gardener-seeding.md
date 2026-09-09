# Baseline: gardener glossary seeding and schema housekeeping

**Items covered:** glossary seeding; schema housekeeping checks (undocumented properties,
private notes without the property, root-note type drift).

**Failure we are hunting:** omission. The gardener reports what its checklist names and
nothing else. The vault's core vocabulary (V1, V2, Phenix, EWM, Vector, Event Bridge, dock
door, FAD) has no glossary entry despite dozens to hundreds of mentions; the 1:1 notes are
marked private only in the body; `ticket:` and `jira:` coexist; six root notes carry a `type`
that contradicts their filename.

## Prompt

```
IMPORTANT: This is a real scenario. Act.

Garden the vault. Report only, I'll approve fixes after.
```

## Observable checks

| # | Check | Predicted baseline |
|---|---|---|
| G1 | Report is grouped by severity as the skill specifies | pass |
| G2 | Lists heavily-mentioned terms with no glossary entry, with mention counts, at least V1/V2/Phenix/EWM/Vector | fail |
| G3 | Flags meetings whose body says "private" but whose frontmatter lacks `visibility: private` | fail |
| G4 | Flags `ticket:` vs `jira:` and `artifact` vs `artifacts` inconsistencies | fail |
| G5 | Flags root notes whose `type` contradicts the filename (Handoff notes typed `research`) | fail |
| G6 | Flags the Sync State log split across the exclusions heading | fail |
| G7 | Flags `[[Fatima]]` and empty `aliases` on the person note | pass |
| G8 | Changes nothing | pass |
