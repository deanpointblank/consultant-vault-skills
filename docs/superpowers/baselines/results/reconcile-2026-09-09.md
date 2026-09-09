# reconcile — control run, 2026-09-09

Ten reps (A1–A5 capture, B1–B5 surface), `general-purpose` agents, fresh context each,
existing `consultant-vault` plugin installed, no `reconcile` skill. Each rep ran in its own
copy of the US Cold vault under the session scratchpad (`reconcile-A1/vault` … `reconcile-B5/vault`).
Scored from `diff -rq` against the live vault, then by reading every changed file. The live
vault was not touched (git status identical before and after).

## Variant A — capture

| Check | A1 | A2 | A3 | A4 | A5 | Pass |
|---|---|---|---|---|---|---|
| A1 schema-valid frontmatter | ✓ | ✓ | ✓ | ~ empty `granola_id` | ✗ `source: manual notes`, empty `granola_id` | 3/5 |
| A2 names the contradictions | ✓ all 3 | ✓ all 3 | ✓ all 3 | ✓ all 3 | ✓ all 3 | **5/5** |
| A3 queryable record outside the meeting note (`status: open`, both sources, `owner`) | ✗ | ✗ (appended prose to the decision) | ~ question note for the timezone conflict only | ✗ | ✗ | **0/5 full, 1/5 partial** |
| A4 contradicted note shows the dispute from its own side | ✗ | ✓ body edit | ✓ via question backlink | ✗ | ✗ | 2/5 |
| A5 distinguishes claim-vs-finding / ruling-vs-ruling / goal-vs-decision | prose only | prose only | prose only | prose only | prose only | 0/5 structured |
| A6 nothing silently resolved in the meeting's favour | ✗ write-back recorded under `## Decisions`; "treat it as current" | ✓ | ✓ | ✗ write-back recorded under `## Decisions` | ✓ | 3/5 |
| A7 daily-note log line linking what was created | ✗ | ✗ | ✓ log + task | ✓ new daily note | ✗ | 2/5 |

**Shape convergence.** All five produced `Goal / Notes / Decisions / Action items` with a
`> [!warning]` callout under each contradicted claim, and all five carried the contradiction
into a Dean-owned `- [ ]` action item. The granola-sync working-session template is doing that
work. Variance is entirely in the *extra* record: none (A1, A5), prose appended to the decision
(A2), a question note (A3), a daily line (A4). Five reps, four answers: the skill must specify
the record, not nudge toward one.

**The consistent failure is A3.** Agents treat the choice as binary: rewrite the old record
(refused, correctly) or annotate the meeting note (done). A standalone tracked record appeared
once, and only for one of the three conflicts.

**Verbatim rationalizations** (from the agents' own summaries):

- A1: "I treated Rippy's as the newer, current statement." — then listed it under `## Decisions`.
- A1: "recorded them verbatim as what was said and added callouts next to each rather than rewriting history"
- A2: "wrote each as what was said, then added a callout with the vault's evidence rather than silently overwriting anything"
- A4: "recorded both positions verbatim, marked the timestamp decision as not agreed rather than superseding anything … and gave you an action to settle it"
- A5: "put a warning callout beside it rather than rewriting any existing record"
- A3: "logged an open question owned by Ray instead of touching the existing 8/24 decision"

The pattern: "callout rather than rewrite" is the whole decision space; "gave you an action"
is where the conflict goes to die. Under time pressure, three of five also skipped the daily
log line every existing skill mandates.

**Scenario bug.** The prompt dated the call 2026-09-10 while the clock said 09-09. All five
noticed; A3 refiled under 09-09, the others kept 09-10 with a callout. Harmless but noisy —
fixed in `reconcile.md` by dropping the explicit date.

## Variant B — surface

| Check | B1 | B2 | B3 | B4 | B5 | Pass |
|---|---|---|---|---|---|---|
| B1 surfaces the two "claims to verify" from the 09-01 ADR meeting callout | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** |
| B2 surfaces the write-back-goal vs read-cache-decision contradiction (only in Sync State + 08-17 meeting) | ✗ | ✗ | ✗ | ✗ | ✗ | **0/5** |
| B2′ surfaces the 09-08 on-site "sync exception" vs ADR contradiction (flagged in a meeting body 1 day old) | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |
| B3 surfaces the timezone disagreement and the `proposed` decision with empty `decided_on` | ✗ | ✗ | ✗ | ✗ | ✗ | **0/5** |
| B4 cites both sides with wikilinks | ~ dates | ~ dates | ~ mixed | ~ mixed | ✓ | 1/5 full |
| B5 filters to what Ray owns; drops Josh/Rob design questions | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |
| B6 frontmatter pass before bodies | ~ scanned Questions/Decisions | ✗ | ✗ | ✗ | ✗ | 1/5 |

**Retrieval was grep, not schema.** Every rep grepped bodies for `ADR-001`, opened the nine
hits, and built the agenda from those. That finds contradictions written *into* ADR-related
notes (B1, B2′) and misses every contradiction that lives elsewhere: the write-back goal
conflict (B2) is three weeks old and recorded only in Sync State and an 08-17 meeting; the
timezone dispute (B3) is directly relevant to Ray's timestamp-sync design but no note ties it
to the string "ADR-001". Zero of five surfaced either.

Four of five said explicitly that frontmatter was not useful: "Frontmatter wasn't decisive
here since the question keyed on a single term" (B5), "body grep did the filtering" (B2).
That is true *because no property carries conflict state*. There was nothing to scan.

**Privacy leak.** Four of five (B1, B2, B3, B5) opened `Meetings/2026-09-03 Dean Chris 1-1`,
which is marked private in-note, and B3 quoted its content before adding "Do not raise."
An in-body marker does not filter reads; a `visibility: private` property would.

**Quality note.** The agendas themselves were strong and consistent (five reps, same top-three
items, same priority order). The skill does not need to teach agenda-writing. It needs to make
the conflicts findable.

## What the skill has to supply

1. **A record shape** (positive recipe, not a prohibition): `type: conflict`, `status: open`,
   `kind` ∈ {claim-vs-finding, ruling-vs-ruling, goal-vs-decision}, `sources` (two quoted
   wikilinks), `owner`, `jira`. One note per conflict, filed in a conflicts folder from config.
2. **A capture trigger inside meeting write-up**: when a warning callout would be written,
   the conflict note is written first and the callout links to it.
3. **A surfacing rule**: pre-meeting briefing = frontmatter scan of `status: open` conflicts
   where `owner` or `sources` intersect the attendees — not a grep for the meeting's subject.
4. **A closure path**: resolving a conflict either supersedes a decision (decisions skill)
   or marks a claim wrong and appends the correction to the note that carried it.
5. **Schema additions the run exposed**: `visibility: private` on meetings; `jira` blessed
   vault-wide; `source` values enforced (`manual`, not `manual notes`).

Checks that passed 5/5 in the control and are out of scope for the skill: noticing
contradictions (A2), surfacing callouts already tied to the subject (B1), filtering to the
right owner (B5).
