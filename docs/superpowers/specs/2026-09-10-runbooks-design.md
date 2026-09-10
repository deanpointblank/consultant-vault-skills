# runbook-capture and runbook-run — design

**Status: approved in brainstorming 2026-09-10. Ready for an implementation plan.**

## Goal

Two skills for the `consultant-vault` plugin so that a client-specific workflow done once by hand is written down as a runbook the vault owns, and done again by the agent from that runbook with confirmation before anything changes outside the machine. Plus one index note that lists every runbook in one place.

## Why

The steps to create a PFD environment on 2026-09-09 live in two daily notes and a handoff: the terraform run, the curl import, the script that aborts non-interactively, the yard import that was killed for low memory. The vault already holds one runbook (seed PR env feature flags) whose shape works. Nothing brings the scattered steps together, nothing replays a runbook, and nothing lists what runbooks exist.

## Decisions taken in brainstorming

| Question | Decision |
|---|---|
| When to capture | Explicit ("save this as a runbook") plus one offer when a sequence succeeds for the second time and no runbook covers it. |
| How to replay | The agent runs the steps. One yes before each step that changes something outside the machine. Steps only a human can do pause. Read-only steps just run. |
| Drift | A step that no longer works is rewritten to what worked, with one dated trace line. No history section. |
| Shape | Two skills, `runbook-capture` and `runbook-run`, sharing one template and one contract. |
| Index | One markdown note listing every runbook with a wikilink and its first sentence. Not a Base. |
| Writing | Plain language throughout. A reader with 60 seconds knows what the runbook does and can start step 1. No skill-internal words in any note. |

## Shared contract

- New note type `runbook` in `skills/obsidian-vault/references/property-schema.md`:

  | Property | Format | Notes |
  |---|---|---|
  | `topics` | list of plain strings | |
  | `repos` | list of quoted wikilinks | repo dossiers for the scripts and services involved |
  | `status` | `draft`, `verified`, `retired` | draft: captured, never replayed. verified: replayed clean at least once. retired: do not run. |
  | `last_run` | `YYYY-MM-DD` | set by runbook-run |

- Config template gains `folders.runbooks: Runbooks`. vault-init creates the folder, copies the template, and creates the empty index.
- Template `skills/runbook-capture/templates/Runbook.md`, overridable from the vault's templates folder like every shipped template.
- Filename `Runbook - <what it does>.md` in `folders.runbooks`. Key missing from config: use `Runbooks`, create it, tell the user to add the key.

## The runbook note

Title `Runbook - <what it does>`. First line under the title: one sentence, what it does and when you would reach for it. The index quotes this line, so it is the one sentence to keep.

Sections, in this order:

1. **Inputs** — a table: name, example, where to find it. Steps refer to inputs as `<ticket>`, `<warehouse>`, and so on.
2. **Before you start** — one line each: VPN, credentials as a wikilink to the private note that holds them and never the values, which clone must be current.
3. **Steps** — numbered. Each step is one command or one action, then `Expect:` and one line. A step that changes something outside the machine ends with `(changes: <what>)`. A step only the user can do ends with `(you)`. runbook-run reads those two marks and nothing else.
4. **Check it worked** — one or two commands with expected output.
5. **If it goes wrong** — known failures and their fixes, one line each, each linking the daily note or handoff where it was learned.

A rewritten step keeps one line under it: `until YYYY-MM-DD: <old step>`. There is no history section; `last_run` and the daily note carry the run record.

## runbook-capture

**Fires on** "save this as a runbook", "capture that workflow", "make a runbook for X", "write up how we did that". Also the offer: right after a multi-step sequence that touched something outside the machine succeeds, check whether a runbook covers it. None, and a daily note or handoff from another day shows the same hosts, commands, or scripts: offer once, "second time doing this; want it as a runbook?" A runbook exists: no offer; a step that differed from the runbook is rewritten with the dated trace.

**Sources, in order.**

1. The session: the commands actually run, their outputs, and where course was corrected. Steps come from what worked, not what was tried first.
2. Daily notes and handoffs that mention the same hosts, scripts, or environments. Gotchas become "If it goes wrong" lines, each with a wikilink to where it was learned.
3. Repo dossiers for the scripts involved, linked from `repos`, so the runbook does not restate build notes.

**Writing rules.**

- One runbook per outcome ("create a PFD environment"), not per command. A step that is itself a runbook links to it.
- Inputs are anything that changed between the two runs the skill can see, or that the user typed as a value.
- Credentials, tokens, and passwords never appear. The step reads an environment variable; "Before you start" links the private note.
- `Expect:` is the actual output from the session, trimmed to the line that proves the step worked.
- Nothing invented: a step the skill did not see run is not written. A gap the user describes in words becomes a `(you)` step.

**Update, not duplicate.** A runbook for the same outcome exists: merge new gotchas, rewrite differing steps with the trace, leave everything else. The filename is stable so links hold.

**Index.** Create `Runbooks/Runbooks.md` if missing. Add the row on create. Rewrite the row's sentence when the first line changed.

**After writing.** Daily note: `- HH:MM captured [[Runbook - Create a PFD environment]]`. Chat reply: two lines, the link, and the count of steps and inputs.

## runbook-run

**Fires on** "run the X runbook for KEY", "do the X workflow", or a request that matches a runbook's title or topics, such as "set up a PFD env for PFD-66519". No match: one line saying so, and an offer of runbook-capture if the user is about to do it by hand.

**Before the first step.**

1. `status: retired`: refuse in one line saying why.
2. Fill the Inputs table from what the user said. Ask once for everything missing, in one question.
3. Show the "Before you start" lines and wait for a yes. VPN and credentials are the user's to confirm.

**Running.** Steps in order, one at a time.

- Plain step: run it, compare the output to `Expect:`, move on.
- `(changes: <what>)`: show the exact command with inputs filled in, get a yes, run.
- `(you)`: show the exact action, wait for "done".
- Output does not match `Expect:`: stop. Show the command, the expected line, and the actual output. One question: fix and continue, or stop here. A fix that works rewrites the step with the dated trace. Two failures on the same step in one run: stop for good.

**After the last step.** Run "Check it worked". Set `last_run` to today, and `status: verified` on the first clean run. Update the index row's status and date. Daily note: `- HH:MM ran [[Runbook - Create a PFD environment]] for PFD-66519: ok, step 3 rewritten`. Chat reply: three lines, what now exists, what was rewritten, the daily-note line.

**Never** skips a `(changes:)` confirm, even when told "just run it all". Never runs two runbooks at once. Never edits a step that worked.

## The index

`Runbooks/Runbooks.md`, `type: reference`, `topics: [runbooks]`. One-line intro, then one bullet per runbook, alphabetical:

```
- [[Runbook - Create a PFD environment]] — Builds a pfd-NNNNN env from a ticket key and imports its appointments. verified, last run 2026-09-10
- [[Runbook - Seed PR env feature flags]] — Fixes "missing a Phenix ID or timezone" on a fresh PR env. draft
```

Written by runbook-capture (create, add row, fix sentence), runbook-run (status and date), vault-init (empty note with the folder). vault-gardener gains one check: every runbook has a row, every row resolves, every sentence matches its note's first line. The existing seed-flags runbook lacks `status` and `last_run`; the gardener reports it, nothing here edits it.

## Repo changes

1. `skills/runbook-capture/SKILL.md` and `skills/runbook-capture/templates/Runbook.md`.
2. `skills/runbook-run/SKILL.md`.
3. `skills/obsidian-vault/references/property-schema.md`: the `runbook` type table above; `runbook` added to the `type` list.
4. `skills/obsidian-vault/templates/Config.md`: `runbooks: Runbooks` in `folders`, with one explanation bullet.
5. `skills/vault-init/SKILL.md`: copy the runbook template; create the empty index in the runbooks folder.
6. `skills/vault-gardener/SKILL.md`: the index check.
7. `README.md`: two rows and the skill count. `.claude-plugin/marketplace.json`: the count.

## Failure cases

One line in chat each.

- Capture with nothing run this session and no description from the user: say there is nothing to capture.
- Capture where a command's output was not seen: the step is written with `Expect:` left as "not seen; fill in on first run".
- Run where the runbook cites a repo whose dossier names no local clone: stop before step 1 and say which.
- Run where an input cannot be filled: the one question covers it; no defaults are guessed.
- Two runbooks match the request: list both, ask which.

## Testing

Follows `docs/superpowers/baselines/README.md`: vault copy, fresh `general-purpose` agent per rep, three reps per variant, scored from `diff -rq` and by reading files.

1. **Capture.** Prompt describes the 2026-09-09 PFD-env creation in the user's words, with `Daily/2026-09-09.md` and the 2026-09-09 handoff in the copy. Checks: one runbook in `Runbooks/` with `type: runbook`; first line is one sentence; Inputs table with ticket and warehouse; the terraform and import steps carry `(changes:)`; no credential values, and "Before you start" links the test-login note; the "aborts non-interactively" gotcha appears under "If it goes wrong" with a wikilink to the daily note; index created with one row; daily note line.
2. **Run.** A runbook in the copy whose step 2 has a flag that no longer exists (use a harmless local command so the rep can really run it). Checks: inputs asked once; yes requested before the `(changes:)` step; stop on mismatch with command, expected, actual shown; step rewritten with `until YYYY-MM-DD:`; `last_run` and `status: verified` set; index row updated; daily note line.
3. **Offer.** A sequence done in the prompt that a daily note in the copy shows was done before. Checks: offered once; nothing written until the user says yes.
4. RED three reps each without the skills, GREEN three with, per the harness.

## Later, not now

- `Meta/Intake Checks.md` for ticket-intake becomes a runbook once runbook-capture exists.
- A runbook step that dispatches another runbook by name.
