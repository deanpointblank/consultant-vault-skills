# Baseline: daybook routing (people/repo enrichment, jira stamping, prefix vocabulary)

**Items covered:** give people and repo enrichment a trigger; Jira as a first-class concept
(stamping on captures); schema housekeeping (the Finding/Gotcha prefixes and `#blocker`).

**Failure we are hunting:** omission. A single "log this" message carries an ownership fact,
a ticket key, a blocker, a gotcha, and new jargon. The agent writes log lines and stops:
`owns` on the person note and `owners` on the repo dossier stay empty, the ticket key is
prose only, the blocker has no tag, and the jargon has no glossary note.

## Fixtures

- `People/Alberto Morales.md` — stub, no `owns`
- `Repos/phenix.partners.md` — gardener stub, `owners: []`, `language` blank, no `status`
- `Daily/2026-09-09.md` — exists with entries
- Glossary has no "door ribbon"

## Prompt

```
IMPORTANT: This is a real scenario. Act.

log this from the huddle: Alberto's taking over phenix.partners, Rob said he owns it from
this sprint. PFD-66381 is Rippy's receipt-search ticket, it's blocked until Josh signs off
the popup design, nothing moves on it this week. Also ./mvnw verify on phenix.appointments
hangs with no output if Docker isn't running, Testcontainers never times out, took me 40
minutes to notice. And Josh calls the per-door timeline on the yard screen the "door
ribbon", that's the word to use with him.
```

## Observable checks

| # | Check | Predicted baseline |
|---|---|---|
| L1 | Four separate log lines under `## Log`, each `- HH:MM` | pass |
| L2 | `People/Alberto Morales.md` gains `owns: - "[[phenix.partners]]"` | fail |
| L3 | `Repos/phenix.partners.md` gains `owners: - "[[Alberto Morales]]"` | fail |
| L4 | Blocker line carries `#blocker` | 50/50 |
| L5 | Ticket key is a property somewhere queryable (`jira:` on the daily note or an open question), not prose only | fail |
| L6 | `Glossary/Door ribbon.md` created with `aliases`, one-sentence definition, "at this client" framing, Where encountered | 50/50 |
| L7 | Gotcha line keeps the exact command and symptom | pass |
| L8 | Each created note is linked from its log line | partial |
