# Baseline: reference clipper for a local file

**Item covered:** reference-clipper accepts local files, not only URLs.

**Failure we are hunting:** the skill is URL-shaped, so the agent either refuses, pastes the
file wholesale into a root note with an ad-hoc `type`, or leaves the file where it was with
no vault note at all.

## Fixture

A synthetic conventions doc outside the vault, created by the harness:

```bash
cat > "$RUN/Phenix V2 Event Naming Conventions.md" <<'D'
# Phenix V2 Event Naming Conventions (draft 0.3, Heiko, 2026-09-08)
Events are named {aggregate}_{action_past_tense}: appointment_created, appointment_updated.
Every payload carries an `action` discriminator in body and header. Base fields: phenixId,
appointmentNumber, appointmentTime, hypermedia link to the resource. Warehouse id travels in
message metadata, not the body. Old/new diffs are never included; consumers query back.
Topics are registered in the ASB event registry before first publish. Transaction-history
events use their own structure and are out of scope here.
D
```

## Prompt

```
IMPORTANT: This is a real scenario. Act.

Clip $RUN/Phenix V2 Event Naming Conventions.md into the vault (substitute the real path).
It's the conventions doc Heiko sent after the on-site, we'll be referencing it constantly.
```

## Observable checks

| # | Check | Predicted baseline |
|---|---|---|
| C1 | Note lands in `Clippings/` with `type: clipping` | fail; root note or refusal |
| C2 | Provenance property present: a local-source field with the original path, `title`, and the author/date from the doc | fail |
| C3 | Body preserves headings and content; not a summary | pass |
| C4 | Wikilinks to things the vault knows (the 09-08 meeting, Heiko, Event Bridge glossary if any) | partial |
| C5 | Daily note log line with the reason given | partial |
| C6 | Original file is copied into Attachments or its path recorded; not moved out from under the user | 50/50 |
