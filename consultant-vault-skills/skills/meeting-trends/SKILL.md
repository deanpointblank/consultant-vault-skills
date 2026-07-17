---
name: meeting-trends
description: Analyze how meetings evolve over time — recurring topics, persistent blockers, action-item carryover, and how discussion of a subject changes across standups, refinements, demos, and working sessions. Use whenever the user asks about trends or patterns, "how often has X come up", "what keeps blocking us", "how has X evolved", or wants any retrospective view over synced meetings.
---

# Meeting trends

Follow the obsidian-vault skill's conventions — especially the two-pass read rule, which is mandatory here:

1. **Pass one, frontmatter only**: scan the meetings folder's frontmatter, filtering on `meeting_type`, `date` range, and `topics`.
2. **Pass two, bodies**: read the full text of only the notes that survived the filter.

Never bulk-read meeting bodies to answer a trend question; a season of meetings won't fit and doesn't need to.

## Analyses

- **Topic frequency** — how often each topic appears per week or per meeting, and whether it's rising, falling, or chronic.
- **Blocker recurrence** — the same blocker surfacing across multiple standups is the single most useful signal this skill produces; flag anything appearing three or more times.
- **Action-item carryover** — unchecked tasks that reappear meeting after meeting.
- **Topic evolution** — for one subject ("how has EDIBridge evolved across refinements"), a chronological narrative built from the relevant sections of each matching meeting.

## Rules

- Compare within one `meeting_type` unless the user asks otherwise — the per-type templates exist so that like compares with like.
- Every claim cites its sources: link the `[[YYYY-MM-DD Title]]` notes a finding came from. A trend the user can't click through to verify is an assertion, not an analysis.
- If coverage is thin — few meetings synced, or many missing `topics` — say so up front and scale the confidence of conclusions accordingly. Offer a granola-sync backfill instead of overclaiming from sparse data.
- `unclassified` meetings are excluded from per-type analyses; note how many were excluded.
