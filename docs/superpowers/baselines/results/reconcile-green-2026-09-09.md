# reconcile — GREEN run, 2026-09-09

Same ten prompts as the control, same harness, with the `reconcile` skill and the schema,
config, and cross-link edits in place. Agents were told to read skills from the repo
working copy instead of the installed plugin cache, so **this run tests compliance with the
skill's content, not whether its description triggers it** — that needs the plugin
reinstalled and a second run.

Surface-variant copies were seeded with four open conflict notes (the write-back goal vs
read-cache decision, the 08-25 vs 08-27 timezone rulings, the trigger claim vs discovery, and
the 09-08 on-site sync exception vs the ADR), since the skill can only surface what capture
has filed.

## Variant A — capture (5/5 read the skill)

| Check | Control | GREEN |
|---|---|---|
| A1 schema-valid frontmatter | 3/5 | 5/5 |
| A2 names the contradictions | 5/5 | 5/5 |
| A3 standalone record with `status`, `owner`, both `sources` | 0/5 | **5/5** (3 conflict notes each, 15 total) |
| A4 contradicted note shows the dispute from its side | 2/5 | 5/5 via `sources` backlink |
| A5 `kind` distinguishes the three contradiction types | 0/5 | **5/5**, and all five picked the same kind for each |
| A6 nothing recorded under Decisions in the meeting's favour | 3/5 | **5/5** |
| A7 daily-note log line | 2/5 | 5/5 |

Every conflict note had all four body sections and a filled **Why it matters** (32 to 89
words). Filenames converged on the skill's example shape. Remaining variance is defensible:
one rep set the trigger conflict's `owner` to Dean because the notes assigned Dean to confirm
it (the skill now says that explicitly); reps split between the 08-24 decision and the 08-31
planning note as the second source for the write-back conflict, both correct. Three reps
also filed the REST-only change as a `proposed` decision note, which the control never did.

## Variant B — surface, round 1 (2/5 read the skill)

| Check | Control | GREEN | Of the 2 that read the skill |
|---|---|---|---|
| B1 claims-to-verify from the ADR callout | 5/5 | 5/5 | 2/2 |
| B2 write-back goal vs read-cache decision | 0/5 | 4/5 | 2/2 |
| B3 timezone dispute | 0/5 | 3/5 | 2/2 |
| B6 frontmatter scan before body grep | 1/5 | 4/5 | 2/2 |
| Did not use the private 1:1 | 1/5 | 2/5 | — |

Three reps never opened `reconcile/SKILL.md` even though its description names the prompt's
exact phrasing. Two of them found the conflicts folder anyway by scanning config folders;
the one that started from a body grep for "ADR-001" found only the two conflict notes whose
bodies mention it and missed the timezone one. In this harness the agents chose which skill
files to open, so this is not a clean trigger test; but it shows what happens when the skill
is not loaded: the foundation skill has to carry the scan rule.

The private 1:1 was still cited by three reps because the vault's 1:1 notes carry only an
in-body "private" marker, not the `visibility` property the new rule keys on.

## Refactor after round 1

1. `obsidian-vault` §4 gains one line: "what do I need to raise with X" and pre-meeting
   questions start with a frontmatter scan of open questions and open conflicts before any
   body search. Every rep reads obsidian-vault, so the scan rule no longer depends on the
   reconcile skill being opened.
2. `reconcile` owner rule now reads "the person who made the newer statement, or whoever
   the notes assign to confirm it."
3. Round 2 copies carry `visibility: private` on the six Dean/Chris 1:1 notes to exercise
   the new exclusion rule. **Vault follow-up:** add that property to the live notes; the
   in-body marker does nothing.

## Variant B — surface, round 2 (after refactor; 4/5 read the skill)

| Check | Round 1 | Round 2 |
|---|---|---|
| B2 write-back goal vs read-cache decision | 4/5 | 4/5 |
| B3 timezone dispute | 3/5 | 4/5 |
| B6 frontmatter scan before body grep | 4/5 | **5/5** |
| Did not use the private 1:1 | 2/5 | 4/5 (one skipped it explicitly on the `visibility` flag) |

The rep that never opened the reconcile skill still scanned the conflicts folder from the
obsidian-vault line and surfaced all four conflicts. The single outlier had read the skill
but also loaded a brevity skill that caps lists at five, dropped two conflicts to fit, and
used a line from the private 1:1 that arrived via a grep hit rather than a directory read.

## Refactor after round 2

1. `obsidian-vault`: a grep hit inside a `visibility: private` note is discarded too; check
   frontmatter of every file a search returns.
2. `reconcile` surfacing step 3: every conflict that survives the filter appears even in a
   short answer; collapse to one line each rather than dropping any.

## Variant B — surface, round 3 (final; 3/5 read the skill)

| Check | Control | Round 3 |
|---|---|---|
| B1 claims-to-verify from the ADR callout | 5/5 | 5/5 |
| B2 write-back goal vs read-cache decision | 0/5 | **5/5** |
| B3 timezone dispute | 0/5 | **5/5** |
| B4 both sources linked per conflict | 1/5 | 5/5 |
| B6 frontmatter scan before body grep | 1/5 | **5/5** |
| Did not use the private 1:1 | 1/5 | **5/5** |

Two reps never opened `reconcile/SKILL.md` and still surfaced all four conflicts from the
obsidian-vault scan rule. One rep's grep hit landed inside the private 1:1 and it discarded
the line by the new frontmatter check. One rep loaded the five-item brevity skill and still
listed every conflict, one line each. No new rationalizations appeared.

## Status

- **Capture: bulletproof at 5/5** on the record, kind, Decisions-hygiene, and daily-line checks.
- **Surface: bulletproof at 5/5** once the scan rule lives in the foundation skill.
- **Not yet tested: description-based triggering.** Every GREEN rep was pointed at the
  working copy. Reinstall the plugin from this checkout, then rerun Variant A once with no
  hint beyond the prompt and confirm the agent opens the skill on its own.
- **Vault follow-ups** (live vault, user's call): add `conflicts: Conflicts` to
  `Meta/Config.md`, create the folder, copy `Templates/Conflict.md`, and stamp
  `visibility: private` on the six Dean/Chris 1:1 notes. Backfill the four seeded conflicts
  from the round-2 fixtures if they are still open.

