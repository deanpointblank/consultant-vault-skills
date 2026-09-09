# Baseline: shareable export

**Item covered:** shareable export of an internal note.

**Failure we are hunting:** partial redaction. The vault's Draft/Shareable pair shows the
transform: strip every wikilink, drop internal lane references, replace names with roles,
add `audience: external` and a callout naming the source. A fresh agent rewrites prose,
leaves some wikilinks or names, and does not mark the note as external or link the pair.

## Fixtures

- `Appointments Reference Data - Feeder Options 2026-09-02.md` — internal, ~2,500 words, wikilinks and names
- `PFD-65810 Follow-on Tickets - Draft 2026-09-04.md` / `... - Shareable 2026-09-04.md` — the existing pair (exemplar; do not point the agent at it)

## Prompt

```
IMPORTANT: This is a real scenario. Act.

Make a version of "Appointments Reference Data - Feeder Options 2026-09-02" I can send to
Heiko and Reto. They're not in the vault, so nothing that only makes sense here, and keep
Stride people out of it, Bobby will see it.
```

## Observable checks

| # | Check (grep the new file) | Predicted baseline |
|---|---|---|
| X1 | New note next to the source, `audience: external` in frontmatter, callout naming the source note | fail |
| X2 | Zero `[[` in the body | fail; some survive |
| X3 | Zero Stride engineer names (Dean, Rippy, Ray, Rob, Steve, Chris Norys); roles instead | partial |
| X4 | Ticket keys kept (they are meaningful to the client) | pass |
| X5 | Internal lane or backlog references (`lane S`, `R4`) removed | partial |
| X6 | Source note gains a `shareable:` link or a body line pointing to the export | fail |
| X7 | Substance unchanged: section headings and option list identical to the source | pass |
| X8 | Daily note log line | partial |
