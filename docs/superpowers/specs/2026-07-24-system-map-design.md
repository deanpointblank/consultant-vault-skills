# System Map skill — design (DRAFT)

**Status: DRAFT — brainstorming paused mid-review for rework. Nothing below is final.**
Sections marked ✅ were explicitly decided; sections marked 🟡 were drafted but not yet reviewed.

## Goal

A new skill for the `consultant-vault` plugin that captures the *runtime architecture* of a client engagement into the Obsidian vault — systems, event topics, data stores, and the links between them — so Obsidian's graph view and backlinks become the living system map. Inspired by the uscold-map exploration (`../StrideClients/UsCold/uscold-map/`), but client-agnostic: everything routes through the existing config contract (`Meta/Config.md`) so it moves between engagements untouched.

## Requirements (from brainstorming Q&A) ✅

1. **Background capture, not a command.** As work happens in any client repo, architecture facts get filed into the vault quietly by an agent spun off in the background. The user shouldn't have to invoke anything.
2. **Self-updating.** When a later session reveals that a previously captured detail changed significantly, the agent updates the existing capture — reconciliation, not append-only accumulation.
3. **Trigger mechanism: skill-triggered subagent.** The skill's description makes Claude notice architecture facts mid-session and dispatch a background subagent. (Hook-driven automation explicitly considered and not chosen for now.)
4. **Entity model: systems + topics + data stores.** Each gets its own note (= its own graph node), so the graph shows real shape: `yard → [yard.events] → appointments`, `receipts → [Oracle TRAILR]`. **Flows are deferred** — a later "self-healing / self-correcting" system will identify and maintain data flows; conventions should leave room for `type: flow` without rework.
5. **Confidence: note-level + inline markers.** Frontmatter `verified` (confirmed / partial / inferred) + `last_verified` date per note; shaky individual facts carry lightweight inline markers (⚠ inferred, ⚠ stubbed, ⚠ discrepancy).
6. **Reconciliation: update freely, leave a trace.** The agent corrects notes in place, keeping a short "previously believed … (until YYYY-MM-DD)" trace — the repo-dossier precedent. This deliberately overrides the vault-wide "never overwrite" rule for architecture notes.

## Architecture choice ✅

**Approach B: skill + dedicated plugin agent.**

- The plugin ships a named agent (`agents/architecture-cartographer.md`) alongside the skill.
- Rationale over a self-contained-skill approach (A): cleaner separation, and the agent is directly invocable by a future hook/cron/self-healing system without going through the skill.
- Rejected for now: (A) single skill with inline capture brief; (C) capture-inbox + reconciler pair (most crash-safe, but two moving parts; revisit if background dispatch proves lossy).

## Components (Section 1 — presented, approval pending) 🟡

Four pieces, two new and two amended:

1. **New skill `skills/system-map/`** — the *noticing* half. Description triggers whenever durable architecture facts surface during any client-repo work (how systems connect, pub/sub, data-store reads/writes, ownership, legacy touchpoints, stubs, discrepancies). Recognizes capture-worthy facts, accumulates them during the task, and at a natural pause dispatches the cartographer agent in the background with a structured observation bundle. Never writes the vault itself. Also answers direct map queries ("what still touches Oracle?") via frontmatter scans.
2. **New plugin agent `agents/architecture-cartographer.md`** — the *writing* half. Self-contained system prompt: resolve vault (pointer file / `$OBSIDIAN_VAULT`), read `Meta/Config.md`, find-or-create and reconcile system/topic/data-store notes. All reconciliation intelligence lives here.
3. **Shared contract updates** — `property-schema.md` gains `system`, `topic`, `datastore` types; `Config.md` template gains `folders.architecture: Architecture`; `vault-init` scaffolds `Architecture/Systems|Topics|Data Stores/` and copies templates; README table row.
4. **Templates `skills/system-map/templates/`** — `System.md`, `Topic.md`, `Data Store.md`, override-able from the vault's `Templates/` folder like all plugin templates.

Division of labor: **the skill notices and batches; the agent resolves, writes, and reconciles; the contracts keep it portable across clients.**

## Data model sketch (NOT yet presented or reviewed) 🟡

### Note types & frontmatter

All notes carry the base trio (`type`, `client`, `created`) plus:

- **`type: system`** — `system_type` (service | frontend | function | external | job), `team` (string), `owners` (quoted wikilinks to People), `repos` (quoted wikilinks to repo dossiers), `calls` (wikilinks → systems), `publishes` / `subscribes` (wikilinks → topics), `reads` / `writes` (wikilinks → data stores), `verified`, `last_verified`. Body: Purpose (plain-English, uscold-map style), Tech, APIs, Integrations (per-edge detail: protocol, endpoints, auth), Legacy touchpoints, Notes.
- **`type: topic`** — `broker` (string), `verified`, `last_verified`. Body: events carried, provisioning status, discrepancies. **Publishers/subscribers are NOT duplicated here** — they come free via backlinks from system notes.
- **`type: datastore`** — `technology` (string), `verified`, `last_verified`. Body: schemas/tables of interest, ownership, migration notes. Granularity: one note per database/schema by default; a table gets its own note only when it's a genuine integration point (e.g., shared legacy `TRAILR`).

### Key conventions

- **Edges declared on the system side only.** Topics and stores get their connections via backlinks — single source of truth, no bidirectional sync drift.
- External systems (AS/400, USPS, …) are systems with `system_type: external`.
- Folder layout: `Architecture/` (config key `folders.architecture`) with fixed subfolders `Systems/`, `Topics/`, `Data Stores/` — enables path-based graph color groups.
- Name collisions with `Repos/` (e.g., `phenix.yard` repo vs system): expected; architecture notes use folder-qualified links when ambiguous. *(Needs a firmer decision.)*

## Dispatch & reconciliation sketch (NOT yet presented or reviewed) 🟡

### Skill-side dispatch protocol

- Capture-worthy = durable architecture facts, not task minutiae.
- Batch: one background dispatch per natural pause covering all pending facts, each with entity, fact, evidence (file:line / meeting / user statement), confidence hint, date.
- Concurrency guard: only one cartographer in flight; queue further facts until it returns (two agents editing the same note = conflict).

### Agent-side reconciliation rules

- Find-or-create by name + frontmatter aliases.
- Merge new facts into the right section; dedupe against existing content.
- Contradiction with equal/lower confidence → ⚠ discrepancy marker + keep both; contradiction with higher confidence (code-confirmed beats inferred) → replace + "previously believed … (until DATE)" trace.
- Never silently downgrade a `confirmed` fact based on inference.
- Bump `last_verified` on re-confirmation even when nothing changed.
- Writes only inside the architecture folder (outbound wikilinks to People/Repos are fine; unresolved links are fine and intentional).
- Optional: append a one-line `🗺️ map updated: …` entry to the daily note for observability of quiet background writes. *(Undecided.)*

### Error handling

- Vault unresolvable / config missing → agent exits with a clear message; main session surfaces one line pointing at vault-init. Never guess conventions.

## Open items / flagged for rework

- **User paused here to rework parts of the design.** Specific concerns not yet stated.
- Section 1 (components) was presented but not yet approved.
- Data model + dispatch/reconciliation sections drafted above but never presented.
- Naming: skill `system-map`, agent `architecture-cartographer` — placeholders, open to rename.
- Repo-vs-system wikilink ambiguity needs a firm convention.
- Daily-note observability line: yes/no.
- Graph-view guidance (suggested color groups): ship as a one-time `Architecture/About this map.md` note, README docs, or skip.

## Process state

Brainstorming checklist position: approaches chosen (B), design presentation paused at Section 1 of 3. Remaining: finish design review → finalize this spec → user spec review → writing-plans.
