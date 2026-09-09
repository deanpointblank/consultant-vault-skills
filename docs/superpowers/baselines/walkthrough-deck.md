# Baseline: walkthrough deck

**Candidate skill:** `walkthrough` — a stakeholder-facing walkthrough as a numbered
folder: orientation, how to read it, the substance in zones, a presenter script for the
hard part, and an evidence appendix mapping every claim to the file that proves it.

**Failure we are hunting:** wrong shape. The agent writes one long technical note, in
engineer register, with names instead of roles, no presenter script, and no evidence
appendix — then files it at the vault root with an ad-hoc `type`.

## Fixtures

Existing exemplar (do **not** point the agent at it; observe whether it finds and
reuses the pattern on its own): `PFD-63711 Walkthrough/00 Start Here.md` … `07 The PoC Design.md`.

Source material the walkthrough should draw on:

- `V1 dock door occupancy and availability.md` — the two unrelated meanings of "door free"
- `V1 dock door and staging location sources.md`
- `Decisions/2026-09-04 PFD-65810 ships dock, door and staging fields without availability checking.md`
- `Meetings/2026-09-03 Dock and door availability — V1 complexity and V2 strategy with Dean.md`
- `Meetings/2026-09-04 Dock and door assignment — appointment workflow and yard integration with Josh.md`
- `Questions/2026-09-03 What does the V1 available-doors picker actually filter on.md` and the three sibling questions opened the same day
- `Daily/2026-09-03.md` 17:07 and 17:40 entries

## Prompt

```
IMPORTANT: This is a real scenario. Act.

On-site Thursday I have 25 minutes with Josh and Bobby to explain why dock/door
availability got split out of PFD-65810 and what V2 will and won't do about door
occupancy. Bobby will push back — he thinks "just call the yard service" is fine and
he's already annoyed about velocity. Josh knows the V1 screens but not the code.

Put together what I need to walk them through it. Everything I know is in the vault.
I don't want to reread the discovery notes, I want something I can stand up and
present from. Keep the names of engineers out of it; Bobby reads these.
```

**Pressures:** authority and hostility (Bobby), mixed audience (Josh non-technical,
Bobby executive), time-boxed session, explicit "I don't want to reread" (tempts a
summary rather than a presentable structure), and a confidentiality constraint that
tests whether the agent redacts names.

## Observable checks

| # | Check (grep the diff) | Predicted baseline |
|---|---|---|
| W1 | Output is a folder of numbered notes, not one note | fail; single note at root |
| W2 | Contains an orientation page: what this is, reading order, the one-sentence version | fail |
| W3 | Contains a presenter script: what to say, in what order, and how to handle "just call the yard service" | fail; will be a bullet list of talking points at best |
| W4 | Contains an evidence appendix mapping each claim to a file, table, or query name from the discovery notes (`DOCK_DOOR_TRAILR_OCPNCY`, `ApptAvlDoorsDaoImpl`) | fail; claims restated without provenance |
| W5 | Register: no unexpanded acronyms, no code identifiers in the presented zones (they belong in the appendix only) | fail |
| W6 | No engineer names in the presented pages; roles instead ("the Stride lead", "the principal engineer") | partial; will drop some, keep wikilinks |
| W7 | Frontmatter uses a consistent `type` across the folder and carries `jira: [PFD-65810]` | fail; ad-hoc type or none |
| W8 | Links back to the decision and open questions rather than restating them | partial |
| W9 | Agent finds the PFD-63711 walkthrough and reuses its shape | fail; it will not look for a precedent |

Also record the **length** of the output in words. Baseline typically overshoots the
25-minute slot; a good walkthrough sizes the script to the time.

## Capture

| Rep | Checks failed | Words | Agent's exact words on structure and register choices |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

Phrases to expect and record: "I've summarised the key points", "kept it to one note so
it's easy to share", "you can expand on this verbally", "left the technical details in
for Josh".
