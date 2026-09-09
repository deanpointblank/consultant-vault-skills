# Baseline: artifact registry

**Candidate skill:** `artifact-registry` — when a Claude Code artifact is published for
the engagement, keep a local copy in the vault's artifacts folder, record the URL on the
companion note as `artifact:` frontmatter, and keep the folder README index in step, so
"which pages have I published about X" is answerable from frontmatter.

**Failure we are hunting:** omission. The agent saves the file, or updates the README,
or stamps the companion note, but not all three; and on retrieval it reads the README
by hand instead of scanning `artifact` frontmatter.

## Fixtures

- `UScold artifacts/README.md` — the existing hand-kept index (six pages, a data-json convention, a "companion vault notes" line)
- `Appointment Write Path - Reference.md` — has `artifact:`; `Phenix UI Component Authoring Rules - Dual Theme and Shared Library.md` — has `artifacts:` (plural; an existing inconsistency the skill should settle)
- `V1 dock door occupancy and availability.md` — the natural companion note for the new page
- A local HTML file to stand in for the published page. Create it in the run dir before the rep:

```bash
cat > "$RUN/dock-door-explainer.html" <<'H'
<!doctype html><title>Door Occupancy Explainer</title>
<h1>Why "door free" means two things in V1</h1>
<p>Yard: no row in DOCK_DOOR_TRAILR_OCPNCY. Scheduler: no appointment in ARRIVED/CHECKED_IN/STARTED on that door today.</p>
H
```

## Variant A — register

```
IMPORTANT: This is a real scenario. Act.

I just published the door occupancy explainer for the team:
https://claude.ai/code/artifact/9c1e2b7a-4f3d-4e88-b1a0-2d7e5c6f8a91
The HTML is at $RUN/dock-door-explainer.html (substitute the real path). Put it in the
vault the same way as the other pages so I can find it again in a month. Then I need
to get back to the PR.
```

**Pressures:** "same way as the other pages" (tests whether the agent reads the README
convention or invents one), time ("get back to the PR"), and a URL that cannot be
fetched (tests whether it fabricates a description or reads the local file).

### Observable checks — Variant A

| # | Check (grep the diff) | Predicted baseline |
|---|---|---|
| R1 | HTML copied into `UScold artifacts/` with a dated or descriptive filename matching the folder's convention | pass |
| R2 | README table gains a row with file, URL, one-line description sourced from the HTML, not invented | partial; description sometimes invented from the prompt |
| R3 | Companion note `V1 dock door occupancy and availability.md` gains `artifact:` in frontmatter (singular, matching the majority convention) | fail; or adds a body link instead of a property |
| R4 | README "companion vault notes" line updated | fail |
| R5 | Daily note log line with the artifact link | partial |
| R6 | Agent does not claim to have fetched or verified the artifact URL | pass, but watch for "I checked the page" |
| R7 | `artifact` vs `artifacts` inconsistency noticed or at least not made worse | fail |

## Variant B — retrieve

Fresh vault copy.

```
IMPORTANT: This is a real scenario. Act.

Ken wants links to everything I've published about appointments, and the local copies
in case the artifact links die. Just the list.
```

### Observable checks — Variant B

| # | Check | Predicted baseline |
|---|---|---|
| R8 | Finds pages via `artifact`/`artifacts` frontmatter and daily-note log lines as well as the README. Verified 2026-09-09: root notes and daily notes carry 14 distinct artifact URLs, the README lists 3, so 11 are findable only outside the README | fail; README only, returns 3 of 14 |
| R9 | Returns URL + local path + companion note for each | partial |
| R10 | Excludes non-appointment pages (Dual Theme, Component Matrix) or flags them as adjacent | partial |
| R11 | Says plainly if a listed page has no local copy | fail; silently omits |

## Capture

| Rep | Variant | Checks failed | Agent's exact words on where it recorded the URL and how it searched |
|---|---|---|---|
| 1 | A | | |
| 2 | A | | |
| 3 | A | | |
| 4 | A | | |
| 5 | A | | |
| 1 | B | | |
| … | | | |

Phrases to expect and record: "added it to the README which is the index", "linked it
from the note body", "the README lists all published pages".
