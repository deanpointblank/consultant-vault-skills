# Baseline scenarios for candidate skills

RED-phase tests for four candidate `consultant-vault` skills. Each scenario is run
**without** the candidate skill so we can see what an agent does on its own, capture
its rationalizations verbatim, and write the skill against those failures — not
against what we imagine the failures are.

| Scenario | Candidate skill | Failure type we expect |
|---|---|---|
| [reconcile.md](reconcile.md) | `reconcile` | Omission: contradiction noticed but not made queryable |
| [walkthrough-deck.md](walkthrough-deck.md) | `walkthrough` | Wrong shape: one technical note instead of deck + script + evidence |
| [discovery-trace.md](discovery-trace.md) | `discovery-trace` | Wrong shape: prose findings without citations or verification markers |
| [artifact-registry.md](artifact-registry.md) | `artifact-registry` | Omission: page saved but not indexed, or indexed in one place only |
| [daybook-routing.md](daybook-routing.md) | daybook, people, repo-dossier, glossary edits | Omission: ownership, ticket, blocker, jargon not routed |
| [handoff.md](handoff.md) | `handoff` | Wrong shape: narrative instead of the chain's sections |
| [time-logging.md](time-logging.md) | `time-logging` | Wrong shape and unsafe action |
| [shareable-export.md](shareable-export.md) | `shareable` | Partial redaction |
| [gardener-seeding.md](gardener-seeding.md) | vault-gardener edits | Omission: checks not on the list never run |
| [sync-simulated.md](sync-simulated.md) | granola-sync, decisions edits | Knowledge stays prose; decisions never promoted |
| [clipper-local.md](clipper-local.md) | reference-clipper edit | URL-shaped skill refuses or misfiles a local file |
| [runbooks.md](runbooks.md) | `runbook-capture`, `runbook-run` | Wrong shape (no inputs, marks, or expected output), skipped confirms, and no offer on repeat |
| [work-chart.md](work-chart.md) | `work-chart` | Omission (no work note), invention (why guessed from the diff), wrong-shape setup |
| [ticket-intake.md](ticket-intake.md) | `ticket-intake` | Omission and wrong shape: cited paths not resolved, stored-vs-computed not checked, ticket note absent or a status paragraph |
| [record-testing.md](record-testing.md) | `record-testing` | Omission (no recording, no note, no step log) and unsafe action (recording on a host not allowed) |
| [gap-stories.md](gap-stories.md) | `gap-stories` | Wrong shape and unsafe action: stories only in chat, held gaps drafted, a re-scope drafted as a new story, Jira writes without a preview and a yes |

## Harness (same for every scenario)

1. **Work on a copy.** Never run a baseline against the live vault; agents write.
   ```bash
   SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
   RUN=$SCRATCH/baseline-$(date +%s)
   mkdir -p "$RUN" && cp -R "$SRC" "$RUN/vault"
   export OBSIDIAN_VAULT="$RUN/vault"
   ```
2. **Fresh context per rep.** Dispatch a `general-purpose` agent with only the prompt
   in the scenario file, prefixed by `IMPORTANT: This is a real scenario. Act.` Do not
   summarise the vault or hint at the expected shape. The existing plugin skills stay
   installed — that is the real environment the new skill will land in.
3. **Five reps per variant.** One rep lies. Run the control (no new skill) five times
   before writing a line of the skill. After GREEN, run the same five with the skill.
4. **Diff the copy.** `diff -rq "$SRC" "$RUN/vault"` shows every file the agent
   touched. Read each one; do not score from the agent's own summary.
5. **Capture verbatim.** Fill the table at the bottom of each scenario file with the
   agent's exact words for any shortcut it took. Those sentences become the
   rationalization table or the recipe in the skill.
6. **Variance is a metric.** Five reps producing five shapes means the baseline has no
   natural convention to lean on; the skill must supply a full recipe, not a nudge.

## Scoring

Each scenario lists **observable checks** — things you can grep for in the diff. Score
a rep as pass/fail per check, not overall. A check that passes 5/5 in the control is not
a failure the skill needs to address; drop it from the skill's scope.
