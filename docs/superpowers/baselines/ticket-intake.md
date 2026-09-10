# Baseline: ticket-intake

**Item covered:** a `ticket-intake` skill.

**Failure we are hunting:** omission and wrong shape. Asked to pick up a ticket, a fresh
agent reads the description, maybe opens the cited files, and says "looks buildable" or
starts building. It does not resolve every cited path to the repo it actually lives in, does
not check whether the values the ticket names are stored anywhere, does not read the
duplicate link, does not turn the ticket's own Open Questions into question notes, and
does not check what the vault already says about the subject. What it writes, if anything,
is a status paragraph, not a ticket note a reader can act on in 60 seconds.

## Fixtures

Scenario A uses PFD-65947 with the vault rolled back to the morning of 2026-09-09, before
the hand-written review. Jira cannot be rolled back: the ticket is In Progress and carries
comments dated 2026-09-09 and 2026-09-10. The checks below are about the description's
claims, which are unchanged. A rep that says "already settled in the comments" and does not
resolve the cited paths fails T1.

Scenario B uses `BKEY` = PFD-65574 — "Editing an Existing Appointment: Appointment Type
(Inbound & Outbound)" — a Done story under PFD-65246 that cites real files and was built as
written. Its description cites `../../src/main/resources/openapi/appointments-api.yaml` and
the `AppointmentType` / `AppointmentTypeFilter` types; all three resolve on disk in
`phenix.appointments`.

Repos the checks need on disk (paths from the repo dossiers in the copy): `USCS-BE`,
`phenix.appointments`, `phenix.ui`. Do not fetch or check out anything in them during a rep.
T1–T4 are stated against `origin/main` of each repo at the time this file was written; record
the three SHAs here with `git -C <clone> rev-parse origin/main` so a later rep on a moved clone
can be judged against the same code:

- USCS-BE: 4d934b5655e301fc1b6839ac738ca621340935c6 (this repo has no `main`; its default
  branch is `v20.20`, so the SHA is `git -C <clone> rev-parse origin/v20.20`)
- phenix.appointments: fc9fa7e579ca5d92e06c171803e6ae9ee689b0e9
- phenix.ui: f364343dd887f08d8e01c1d7fc11ecc3d8f35905

### Vault copy

```bash
SRC=/Users/deanbetty/Code/StrideClients/UsCold/uscold-map/US_Cold_Notes
RUN=$SCRATCH/intake-$(date +%s)
mkdir -p "$RUN" && cp -R "$SRC" "$RUN/vault"
cd "$RUN/vault"
# drop every note that names the ticket or its follow-on story, except the ones edited below
grep -rlE 'PFD-65947|PFD-66519' --include='*.md' . \
  | grep -vE '^(\./)?Daily/|Sprint To-Do Triage|People/Rob Park|Meta/Legacy UAT' \
  | while IFS= read -r f; do rm -v "$f"; done
# strip the lines that name them from the notes we keep
for f in 'Sprint To-Do Triage - 2026-09-09.md' Daily/2026-09-09.md Daily/2026-09-10.md \
         'People/Rob Park.md' 'Meta/Legacy UAT Environment.md'; do
  [ -f "$f" ] && sed -i '' -E '/PFD-65947|PFD-66519/d' "$f"
done
rmdir Tickets 2>/dev/null || true
grep -rlE 'PFD-65947|PFD-66519' --include='*.md' . && echo "STILL PRESENT" || echo "clean"
export OBSIDIAN_VAULT="$RUN/vault"
```

The 2026-09-04 meeting note stays; it calls the ticket "front-end only" without naming the
key. That is the contradiction fixture for T8.

## Prompt A

```
IMPORTANT: This is a real scenario. Act.

Pick up PFD-65947. Sprint's tight, so tell me straight whether I can start building it as
written, and if not, what's in the way and who I need to ask.
```

## Prompt B

```
IMPORTANT: This is a real scenario. Act.

Pick up PFD-65574. Sprint's tight, so tell me straight whether I can start building it as
written, and if not, what's in the way and who I need to ask.
```

## Observable checks, scenario A

| # | Check | Predicted baseline |
|---|---|---|
| T1 | Both "V2" reference paths (`DeliveryTicket.java`, `Appointment.java` under `commonservices/`) are reported as living in `USCS-BE`, with `repo path:line` evidence | fail |
| T2 | "Dispatch service" reported as absent from every V2 repo and every dossier | partial |
| T3 | Estimated and Shipped Gross Weight reported as having no stored column, computed on read; names `ViewApptDetailsServiceImpl` or a `*WeightCalculator` | partial |
| T4 | V2 reported as having no column, DTO, or API field for the four values, and `appointmentDetailFields.ts` as hardcoding blanks | fail |
| T5 | PFD-65891 reported as a duplicate open on both sides, and its inbound ask noted as unaddressed | partial |
| T6 | The description's two Open Questions become two open-question notes with `owner: "[[Rob Park]]"`, linked from the ticket note | fail |
| T7 | PFD-66392, PFD-66393, PFD-66415 listed as repeating the "Dispatch service" claim | fail |
| T8 | A conflict note pairing the ticket note with the 2026-09-04 meeting note ("front-end only" vs seeding path), owner Rob Park | fail |
| T9 | `Tickets/PFD-65947 <title>.md` exists with `type: ticket`, `key`, `epic: PFD-65246`, `status: draft`, and its first body line is one verdict sentence | fail |
| T10 | The note contains none of: premise, sweep, verdict, provenance, routing; every evidence string matches `^[A-Za-z0-9._-]+ \S+:\d+` | fail |
| T11 | Zero Jira writes: no `addComment`, `transition`, `editJiraIssue`, `createIssueLink` calls in the transcript | pass |
| T12 | Zero builds, installs, or clones: no `mvn`, `gradle`, `npm install`, `pnpm install`, `git clone` in the transcript | pass |
| T13 | `Daily/2026-09-09.md` (or today's) gains one log line linking the ticket note, and `PFD-65947` in its `jira` list | partial |

## Observable checks, scenario B

| # | Check | Predicted baseline |
|---|---|---|
| B1 | The ticket note's first body line is exactly "Can be built as written." | fail |
| B2 | Blockers section is empty or says "none" | partial |
| B3 | Nothing invented: every "no" in the table cites a path that exists on disk at the cited line | pass |
| B4 | Zero Jira writes (as T11) | pass |

## Rationalizations captured (fill during control reps)

| Rep | Verbatim | Check it excuses |
|---|---|---|
| | | |
