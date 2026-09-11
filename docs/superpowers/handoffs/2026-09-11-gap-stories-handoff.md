# Gap-stories handoff — 2026-09-11

For the next session, human or agent, to pick up and execute the gap-stories plan cold.

## Where things stand

**On 2026-09-11 the user brainstormed and approved `gap-stories`, the sister skill to ticket-intake. For a ticket intake found "Cannot be built as written", it turns blockers into gaps, finds Jira tickets that already cover each gap, drafts the rest in a `KEY Gap Stories.md` proposal note, and creates a story in Jira only after "create G\<n>" plus a yes to a preview in the same session. The motivating ticket is PFD-66405. The spec and the plan are committed on local `main`; nothing is built, no branch exists yet, nothing is pushed. `main` is ahead of `origin` by 5 commits from this session. The next session executes the plan with superpowers:subagent-driven-development, one subagent per task, review between tasks — the user chose this, in a fresh session.**

## Where everything is

| Item | Where |
|---|---|
| Spec | `docs/superpowers/specs/2026-09-11-gap-stories-design.md` (commits `d2b4127`, `75a2263`, `045e701`) |
| Plan | `docs/superpowers/plans/2026-09-11-gap-stories.md` (commits `21caaa2`, `59adce7`). Six tasks: 1 scenario file, fixtures, block proof (sonnet, haiku checks); 2 RED control reps (sonnet runs, opus scores); 3 write SKILL.md, full text already in the plan (opus); 4 GREEN reps then refactor (sonnet runs, opus scores and edits); 5 ticket-intake line, `type: proposal` schema section, README row and count 22→23, marketplace text (sonnet); 6 trigger test and merge (sonnet runs, haiku scores, main loop merges with the user) |
| Work branch | `gap-stories`, created from `main` in plan Task 1 — not created yet |
| Fixtures | Frozen under `~/.cache/vault-skills-fixtures/gap-stories/` (A = vault as-is; B = order-search question answered as the V2 projection). Built in Task 1 from the live vault, read-only |
| Live vault | `/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes`. PFD-66405 notes: `Tickets/PFD-66405 Order search popup.md` (intake), `Tickets/PFD-66405 Handoff - Chosen Next and Intake Done 2026-09-11.md`, two open question notes in `Questions/` dated 2026-09-11, and `Status/Sprint To-Do Triage - 2026-09-09.md` |
| Memory | `~/.claude/projects/-Users-deanbetty-Code-consultant-vault-skills/memory/gap-stories-skill-2026-09-11.md` |
| Previous handoff | `docs/superpowers/handoffs/2026-09-11-session-handoff.md` (the batch work; still holds the trigger harness recipe and the six-step trigger checklist) |

## Test gate

None yet. No code or skill file changed this session; only the spec, plan, and this note.

Hard rule to repeat: no test rep may write to Jira or to the live vault. Every rep runs through the plan's `rep` harness with Atlassian write tools denied, and the Jira guard runs before and after each batch. Any guard difference stops testing until the user looks.

## Rulings made on the user's behalf

### User rulings

- Draft in the vault first; create in Jira only after approval in chat by story number.
- Input is the ticket-intake note.
- Scope: the ticket's own blockers; the existing-ticket search covers the whole project.
- A gap that depends on an open question is held: no story drafted. For PFD-66405 today that's 2 changes (a re-scope and a link fix) and 2 held gaps; nothing creatable until the acting scrum master answers "V1 live or V2 projection".
- One separate proposal note.
- In Jira the skill only creates approved stories and links from them; it never edits descriptions, changes links, transitions, assigns, or comments.
- Duplicate check: `summary ~` words, skipping Done tickets (confirmed 2026-09-11; `text ~` matched four unrelated tickets).
- New sister skill rather than extending ticket-intake or a general story writer.

None made on the user's behalf.

## Gated

- The user, in plan Task 1: whether test turns may answer yes to a preview. If yes, the create call hits the Jira deny rule and the test checks it fails cleanly. If no, turns t3 and t4 of scenario C are skipped.
- The user: whether to push `main` and when.

## Pick-up list

1. Start a fresh session in this repo.
2. Read this note, then the plan's Global Constraints.
3. Run the plan with superpowers:subagent-driven-development, starting at Task 1.
4. Before Task 2, confirm the Task 1 block proof passed and ask the user the preview gate question.
5. After Task 6, run `/plugin update` and restart so the installed plugin carries gap-stories.

## Related

Spec: `docs/superpowers/specs/2026-09-11-gap-stories-design.md` · plan: `docs/superpowers/plans/2026-09-11-gap-stories.md` · previous handoff: `docs/superpowers/handoffs/2026-09-11-session-handoff.md` · memory: `~/.claude/projects/-Users-deanbetty-Code-consultant-vault-skills/memory/gap-stories-skill-2026-09-11.md`
