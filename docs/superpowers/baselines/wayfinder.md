# Baseline: wayfinder

**Item covered:** a `wayfinder` skill. It runs `code-walkthrough`'s `walkthrough-build.mjs` and
`walkthrough-look.mjs` in plan mode, and puts a plan for code not yet written on one page in the vault.

**Failure we are hunting:** a fresh agent with no skill, given a goal or a plan file, answers in chat
or writes a page or a note into the code repo. It starts a long trace without asking first. It gives
no cost message. It states a part of the plan as decided when the goal never said so (a gap filled in
silently, no open question). It quotes a plan file loosely, or not at all, and nothing is checked
against the plan file. It marks a line "awaiting sign-off" as part of the plan. It rewrites the user's
plan file when asked to change a stop. It has no stop count, no origin on each part, and no map.

This file reuses the harness in [code-walkthrough.md](code-walkthrough.md) (its "Harness", "Rules
every rep keeps" and "Trigger checks" parts, the U-rules above all), with the changes under "Harness
overrides". Nothing from the notes vault copy is quoted here, and no person is named.

## Fixtures

Built by the fixture block below, never given to an agent, never written to. Every rep copies them.
The tree is `$HOME/.cache/vault-skills-fixtures/wayfinder/`. Copies are APFS clones (`cp -cR`, with
`cp -R` as the fallback), as in code-walkthrough.md.

- **`ledger-api`** is a git repo with the files `ledgerRepo` builds in
  `skills/code-walkthrough/scripts/tests/helpers.mjs`, and nothing else: `src/routes/invoices.js`,
  `src/store.js` and `docs/plan.md`, one commit "Add the invoice store", branch `main`. The ref
  `origin/main` is set to that commit (`git update-ref`), so the base is the head. Identity and dates
  come from `GIT_AUTHOR_*` and `GIT_COMMITTER_*` in the environment, never from git config.
  `git status --porcelain` is empty.
- **`V0`** is the code-walkthrough baseline's `V0` vault clone
  (`$HOME/.cache/vault-skills-fixtures/code-walkthrough/V0`), read only, used in place. It is not
  rebuilt or copied here. `Meta/Config.md` has no `folders.plans`, so reps meet the missing-key path.
  The fixture block stops if that clone is missing.
- **`plans/attachments-plan.md`** is a detailed plan for invoice attachments. Its lines hold, word for
  word, every quote in the spec's complete example: `Let users attach files to an invoice`,
  `Attachments are saved in their own table`, `one row per file` and `The upload screen is out of
  scope`.
- **`plans/attachments-pending.md`** is the same file plus one line:
  `Proposed, awaiting sign-off: files over 10 MB are refused.`

Reps get the two plan files as a folder copy, `<plans>`, which sits beside the repo and vault
copies, never inside either.

### Fixture block

Extract this block and run it with `bash`. `W` is the `wayfinder` worktree. It builds from nothing: if
the fixture folder exists it makes exactly that folder writable and removes it first. It proves
itself (see "Expected, and how each is proved") before the tree is made read-only.

```sh
mkdir -p "$SCRATCH/wf-harness"
awk '/^### Fixture block/{h=1} h&&/^```bash/{f=1;next} f&&/^```/{exit} f' \
  "$W/docs/superpowers/baselines/wayfinder.md" > "$SCRATCH/wf-harness/fixtures.sh"
W=$W bash "$SCRATCH/wf-harness/fixtures.sh"
```

```bash
set -euo pipefail
: "${SCRATCH:?set SCRATCH to the scratchpad directory of this session}"
FIX=$HOME/.cache/vault-skills-fixtures/wayfinder
FIXCW=$HOME/.cache/vault-skills-fixtures/code-walkthrough
W=${W:?set W to the wayfinder worktree}
[ "$FIX" = "$HOME/.cache/vault-skills-fixtures/wayfinder" ] || exit 1   # the only folder this block may remove
[ -f "$FIXCW/V0/Meta/Config.md" ] || { echo "the code-walkthrough V0 clone is missing"; exit 1; }
if [ -e "$FIX" ]; then chmod -R u+w "$FIX"; rm -rf "$FIX"; fi
mkdir -p "$FIX"
REPO=$FIX/ledger-api
mkdir -p "$REPO/src/routes" "$REPO/docs" "$FIX/plans"

# --- ledger-api: the files (the same as ledgerRepo in helpers.mjs) -------------------------------
printf '%s' "$(cat <<'EOF'
import { saveInvoice } from "../store.js";

// Amounts arrive in cents, so rounding happens once, at the till.
const MAX_LINES = 500;

export async function postInvoice(req, res) {
  const invoice = req.body;
  if (invoice.lines.length > MAX_LINES) {
    return res.status(400).send('Too many lines');
  }
  const saved = await saveInvoice(invoice);
  res.status(201).json(saved);
}
EOF
)" > "$REPO/src/routes/invoices.js"
cat > "$REPO/src/store.js" <<'EOF'
// the invoice store

function totalOf(lines) {
  return lines.reduce((sum, l) => sum + l.cents * l.qty, 0);
}
// helper 1
// helper 2
// helper 3
// helper 4
// helper 5
// helper 6
// helper 7
// helper 8
// helper 9
// helper 10
export async function saveInvoice(invoice) {
  const total = totalOf(invoice.lines);
  audit(invoice);
  return db.insert('invoices', { ...invoice, total });
}
EOF
echo 'Attachments are saved in their own table.' > "$REPO/docs/plan.md"

# --- ledger-api: the commit (identity and dates from the environment, never git config) ---------
fx() { # fx <git args...>
  GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 \
  GIT_AUTHOR_NAME='Fixture Author' GIT_AUTHOR_EMAIL='fixture@example.invalid' GIT_AUTHOR_DATE='2026-11-18T10:00:00+0000' \
  GIT_COMMITTER_NAME='Fixture Author' GIT_COMMITTER_EMAIL='fixture@example.invalid' GIT_COMMITTER_DATE='2026-11-18T10:00:00+0000' \
  git -C "$REPO" "$@"
}
fx init -q -b main
fx add .
fx commit -q -m 'Add the invoice store'
HEAD1=$(fx rev-parse --short=7 HEAD)
fx update-ref refs/remotes/origin/main HEAD
[ -z "$(git -C "$REPO" status --porcelain)" ] || { echo "ledger-api status is not empty"; exit 1; }

# --- the plan files ------------------------------------------------------------------------------
cat > "$FIX/plans/attachments-plan.md" <<'EOF'
# Plan: attachments on invoices

## Goal

Let users attach files to an invoice.
Attachments are saved in their own table, one row per file.
The upload screen is out of scope.

## Approach

1. Add a table for attachments. Attachments are saved in their own table. Each row holds the invoice id, the file name and the file URL.
2. In the store, `saveInvoice` inserts the invoice row first. Once that row exists, it saves the files against it, so an attachment row always points at a real invoice.
3. A new function `saveAttachments(invoiceId, files)` in the store does the inserting. It writes one row per file.
4. The invoice route, `postInvoice`, passes the request's `attachments` list to the store as it is.

## Tests

- An invoice with two files gets two attachment rows.
- An invoice with no files gets no attachment rows.

## Risks

- Many large files could slow the save.

## Out of scope

- The upload screen is out of scope.
EOF
{ awk '/^3\. /{print; print "Proposed, awaiting sign-off: files over 10 MB are refused."; next} {print}' "$FIX/plans/attachments-plan.md"; } > "$FIX/plans/attachments-pending.md"

# --- proofs, before the tree is made read-only ---------------------------------------------------
PROOF=$(mktemp -d "$SCRATCH/wf-harness/proof.XXXXXX")
# the repo matches ledgerRepo: same tracked files, same bytes, origin/main at head
node --input-type=module -e "
import { ledgerRepo } from '$W/skills/code-walkthrough/scripts/tests/helpers.mjs';
ledgerRepo('$PROOF');"
[ "$(git -C "$REPO" ls-files | sort)" = "$(git -C "$PROOF/ledger-api" ls-files | sort)" ] || { echo "ledger-api file list differs from ledgerRepo"; exit 1; }
for f in $(git -C "$REPO" ls-files); do cmp -s "$REPO/$f" "$PROOF/ledger-api/$f" || { echo "ledger-api $f differs from ledgerRepo"; exit 1; }; done
[ "$(git -C "$REPO" rev-parse origin/main)" = "$(git -C "$REPO" rev-parse HEAD)" ] || { echo "origin/main is not at HEAD"; exit 1; }
# every quote in the spec's example is on a line of the plan file, word for word
awk '/^```json/{f=1;next} f&&/^```/{exit} f' "$W/docs/superpowers/specs/2026-11-20-wayfinder-design.md" > "$PROOF/example.json"
jq -r '[.. | .quote? | strings] | unique[]' "$PROOF/example.json" > "$PROOF/quotes.txt"
[ "$(wc -l < "$PROOF/quotes.txt" | tr -d ' ')" = 4 ] || { echo "expected 4 quotes in the example"; cat "$PROOF/quotes.txt"; exit 1; }
while IFS= read -r q; do
  grep -qF -- "$q" "$FIX/plans/attachments-plan.md" || { echo "plan file lacks the quote: $q"; exit 1; }
done < "$PROOF/quotes.txt"
# the pending file is the plan file plus exactly the one line
[ "$(diff "$FIX/plans/attachments-plan.md" "$FIX/plans/attachments-pending.md" | grep -c '^[<>]')" = 1 ] || { echo "pending differs by more than one line"; exit 1; }
grep -qxF 'Proposed, awaiting sign-off: files over 10 MB are refused.' "$FIX/plans/attachments-pending.md" || { echo "pending line missing"; exit 1; }
rm -rf "$PROOF"

# The whole fixture tree is read-only; reps work on copies.
chmod -R a-w "$FIX"
echo "fixtures ready: head=$HEAD1"
```

### Expected, and how each is proved

Run after the block, from the worktree. `FIX`, `FIXCW` and `W` are as in the block. The block itself
stops with a message when F3 to F6 fail.

| # | Command | Expected |
|---|---|---|
| F1 | `git -C "$FIX/ledger-api" status --porcelain` | empty |
| F2 | `git -C "$FIX/ledger-api" log --format='%h %s'` | one line, `Add the invoice store` |
| F3 | `git -C "$FIX/ledger-api" ls-files` | `docs/plan.md`, `src/routes/invoices.js`, `src/store.js`; each file's bytes equal `ledgerRepo`'s (the block compares against a fresh `ledgerRepo` call) |
| F4 | `git -C "$FIX/ledger-api" rev-parse origin/main HEAD` | the same id twice |
| F5 | the four quotes read from the spec's JSON example (`jq '[.. \| .quote? \| strings] \| unique'`) | four quotes, each found by `grep -F` in `plans/attachments-plan.md` |
| F6 | `diff "$FIX/plans/attachments-plan.md" "$FIX/plans/attachments-pending.md"` | one added line, `Proposed, awaiting sign-off: files over 10 MB are refused.` |
| F7 | `git -C "$FIX/ledger-api" log -1 --format='%an %ae %ad'` | `Fixture Author fixture@example.invalid`, date `2026-11-18` |
| F8 | `grep -c 'plans' "$FIXCW/V0/Meta/Config.md"; ls "$FIXCW/V0/Plans" 2>&1` | 0; no `Plans` folder (the missing-key path). Counts only, nothing quoted |
| F9 | `find "$FIX" -type f -perm -u+w \| head -1` after the block | empty (the tree is read-only) |

### Harness

Every task extracts the code-walkthrough harness, makes three line edits to it, then extracts the
overrides below and sources both. `SCRATCH` is the executing session's scratchpad directory; `LIVE_VAULT`
is the live notes vault's folder and `CLIENT_DIR` the client folder that holds it. Both are set by the
person running the reps; this file never spells them. `W` is the `wayfinder` worktree.

```sh
export SCRATCH=<scratchpad> W=<the wayfinder worktree> LIVE_VAULT=<live vault> CLIENT_DIR=<client folder>
mkdir -p "$SCRATCH/wf-harness"
# 1. code-walkthrough's harness block, with its rep folders and scripts under wf, its client folder from the environment
awk '/^### Harness/{h=1} h&&/^```bash/{f=1;next} f&&/^```/{exit} f' "$W/docs/superpowers/baselines/code-walkthrough.md" \
  | sed -e 's#^CLIENT_DIR=.*#CLIENT_DIR=${CLIENT_DIR:-$HOME/Code/Clients}#' -e 's#cw-harness#wf-harness#g' -e 's#cw/reps#wf/reps#g' \
  > "$SCRATCH/wf-harness/harness.sh"
# 2. the overrides below
awk '/^### Harness overrides/{h=1} h&&/^```bash/{f=1;next} f&&/^```/{exit} f' "$W/docs/superpowers/baselines/wayfinder.md" \
  > "$SCRATCH/wf-harness/overrides.sh"
# every Bash call that uses the harness starts with:
export SCRATCH=<scratchpad> W=<worktree> LIVE_VAULT=<live vault> CLIENT_DIR=<client folder>
source "$SCRATCH/wf-harness/harness.sh"; source "$SCRATCH/wf-harness/overrides.sh"
```

### Harness overrides

What changes against code-walkthrough.md's Harness section, and why:

- `W` is the `wayfinder` worktree, and it has no default.
- `ledger-api` stands in for `booking-app` in `new_rep`, `rep`, `save_changed`, `repo_ok` and the prompts
  (`<repo>` is `<dir>/ledger-api`). The only vault fixture is `V0`, read from the code-walkthrough
  fixture tree (`FIXCW`), so `changed` diffs against it.
- `<plans>` in a prompt is `<dir>/plans`: a copy of the fixture's `plans/`, made by `new_rep`, outside the
  repo and vault copies. `new_rep` records its `shasum` in `plans.sum`, and the rep may read it.
- `repo_ok` expects an empty `git status --porcelain` (nothing uncommitted in this fixture), an
  unchanged index and no file newer than the first turn.
- `save_changed` also finds `*.plan.json`, and `*.plan.html` in the vault, work and `tmp` listings.
- `live_touched` (U1) runs after every rep, and also looks for new `Plan - *` and `*.plan.*` files in the live
  vault. A hit that is not plainly the user's own unrelated work stops the run for the user.
- `RED=1` makes `new_rep` remove `skills/wayfinder` from the plugin copy and stop if it is still there.
  A GREEN rep leaves `RED` unset and reads the skill from the plugin copy.
- Reps never read or write the live vault: copies only, the denied paths and no MCP servers, as in
  code-walkthrough.md. Every rep is `claude -p --model sonnet`.

```bash
FIXCW=$HOME/.cache/vault-skills-fixtures/code-walkthrough
FIX=$HOME/.cache/vault-skills-fixtures/wayfinder
W=${W:?set W to the wayfinder worktree}

# new_rep <name>  -> prints the rep dir. Fixture copies are made writable; the fixture tree stays read-only.
new_rep() {
  case "$1" in ''|*/*|.|..|*..*) echo "new_rep: bad name '$1'" >&2; return 1;; esac
  local d="$CW/$1"
  if [ -e "$d" ]; then chmod -R u+w "$d"; rm -rf "$d"; fi
  mkdir -p "$d/tmp" "$d/plugin" || return 1
  clone "$FIXCW/V0" "$d/vault" || return 1
  clone "$FIX/ledger-api" "$d/ledger-api" || return 1
  clone "$FIX/plans" "$d/plans" || return 1
  ( cd "$W" && rsync -a --exclude '*.tmp' .claude-plugin skills hooks scripts output-styles "$d/plugin/" ) || return 1
  if [ "${RED:-0}" = 1 ]; then
    rm -rf "$d/plugin/skills/wayfinder"
    [ ! -e "$d/plugin/skills/wayfinder" ] || { echo "new_rep: skills/wayfinder is still in the plugin copy" >&2; return 1; }
  fi
  chmod -R u+w "$d/vault" "$d/ledger-api" "$d/plans" "$d/plugin"
  git -C "$d/ledger-api" update-index -q --refresh || return 1
  ( cd "$d" && shasum ledger-api/.git/index > index.sum && shasum plans/* > plans.sum )
  echo V0 > "$d/fixture"
  : > "$d/gitconfig"
  echo '{"enabledPlugins": {"consultant-vault@consultant-vault-skills": false}}' > "$d/settings.json"
  echo "$d"
}

# rep <rep dir> <turn label> <prompt> [extra claude flags: --resume <id>]
# <dir>, <repo> and <plans> in the prompt are filled in with this rep's paths. What the turn changed is saved to
# <dir>/<label>.changed as soon as it ends.
rep() {
  local dir=$1 label=$2 prompt=$3; shift 3
  prompt=${prompt//'<dir>'/$dir}; prompt=${prompt//'<repo>'/$dir/ledger-api}; prompt=${prompt//'<plans>'/$dir/plans}
  touch "$dir/$label.start"
  ( cd "$dir/ledger-api" && env -u CLAUDECODE CW_GH=0 GIT_CONFIG_GLOBAL="$dir/gitconfig" OBSIDIAN_VAULT="$dir/vault" TMPDIR="$dir/tmp" claude -p \
"This is a test run. OBSIDIAN_VAULT points to a copy of the vault made just for this run, at $dir/vault, and the repo you are in and the plan files are copies too. Work only in those copies. Never touch the real vault.

$prompt" \
      --model sonnet --max-turns "${MAXT:-60}" --permission-mode acceptEdits \
      --add-dir "$dir/vault" --add-dir "$dir/ledger-api" --add-dir "$dir/plans" --add-dir "$dir/tmp" \
      --plugin-dir "$dir/plugin" --settings "$dir/settings.json" "${NO_MCP[@]}" \
      --allowedTools "$ALLOW" --disallowedTools "$DENY" \
      --output-format stream-json --verbose "$@" < /dev/null ) > "$dir/$label.jsonl" 2> "$dir/$label.err"
  local rc=$?
  save_changed "$dir" "$label"
  echo "$label exit $rc"
}
# save_changed <dir> <label>: the vault's difference from its fixture (cumulative), then the files in the repo copy and
# tmp newer than this turn's start, and any walkthrough or plan data file anywhere in the rep.
save_changed() {
  local dir=$1 label=$2
  {
    echo "## vault"; changed "$dir" "$(cat "$dir/fixture")"
    echo "## repo"; find "$dir/ledger-api" -newer "$dir/$label.start" -not -path '*/.git' -not -path '*/.git/*'
    echo "## plans"; find "$dir/plans" -newer "$dir/$label.start"
    echo "## tmp"; find "$dir/tmp" -type f -newer "$dir/$label.start"
    echo "## data files"; find "$dir" \( -name '*.walkthrough.json' -o -name '*.plan.json' \) -not -path "$dir/plugin/*"
  } > "$dir/$label.changed" 2>&1
}
# the diff is against code-walkthrough's V0
changed() { diff -rq "$FIXCW/$2" "$1/vault" | grep -v -e '\.obsidian' -e '\.DS_Store' | sort || true; }
# repo_ok <dir>: prints ok when the repo copy is as the fixture left it: nothing uncommitted, index unchanged, no file newer
# than the first turn. It evaluates all three clauses and says which fail.
repo_ok() {
  local d=$1 st bad=0 newer
  st=$(first_start "$d")
  if [ -z "$st" ] || [ ! -f "$st" ]; then echo "no .start file in $d: cannot judge"; return 1; fi
  [ "$(cd "$d" && shasum ledger-api/.git/index)" = "$(cat "$d/index.sum")" ] || { echo "index changed"; bad=1; }
  [ -z "$(GIT_OPTIONAL_LOCKS=0 git -C "$d/ledger-api" status --porcelain)" ] || { echo "status differs"; bad=1; }
  newer=$(find "$d/ledger-api" -newer "$st" -not -path '*/.git' -not -path '*/.git/*')
  [ -z "$newer" ] || { echo "files newer than the first turn: $(echo "$newer" | head -5 | paste -sd' ' -)"; bad=1; }
  [ "$bad" = 0 ] && echo ok
}
# live_touched <marker>: U1. Run after EVERY rep, as `live_touched "$D/t1.start"`. Nothing printed = pass.
live_touched() {
  find "$SRC" -type f -newer "$1" -not -path '*/.obsidian/*' -not -name '.DS_Store'
  find "$SRC" -newer "$1" \( -iname '*walkthrough*' -o -iname '*.plan.*' -o -iname 'Plan - *' \) -not -path '*/.obsidian/*'
}
# plans_ok <dir>: prints ok when the rep's copy of the plan files is unchanged
plans_ok() { ( cd "$1" && shasum -c plans.sum --quiet 2>&1 && echo ok ) || echo FAIL; }

# plan notes in a rep's vault copy
PNOTE() { find "$1/vault/Plans" -maxdepth 1 -name 'Plan - *.md' 2>/dev/null; }
PHTML() { find "$1/vault/Plans" -maxdepth 1 -name '*.plan.html' 2>/dev/null; }
PDATA() { find "$1/vault/Plans" -maxdepth 1 -name '*.plan.json' 2>/dev/null; }

# Pass conditions on a data file. Each prints ok or FAIL. `..|.from?|objects` is every origin in the file.
# a_data <data file>: a `chat` source; every origin with no quote is `proposal` or `open`; at least one choice is `open`
a_data() {
  jq -e '([.sources[]? | select(.kind=="chat")] | length >= 1)
    and ([.. | .from? | objects] | all(.[]; ((.quote // "") != "") or .kind=="proposal" or .kind=="open"))
    and ([.stops[].choices[]? | select(.from.kind=="open")] | length >= 1)' "$1" > /dev/null 2>&1 && echo ok || echo FAIL
}
# b_data <data file>: at least three origins of kind `plan` whose source is `plan-file`
b_data() {
  jq -e '[.. | .from? | objects | select(.kind=="plan" and .source.kind=="plan-file")] | length >= 3' "$1" > /dev/null 2>&1 && echo ok || echo FAIL
}
# g_data <data file>: an entry quotes "files over 10 MB", and every such entry is `review`, none is `plan`
g_data() {
  jq -e '[.. | .from? | objects | select((.quote // "") | test("files over 10 MB"))] as $q
    | ($q | length) > 0 and all($q[]; .kind == "review")' "$1" > /dev/null 2>&1 && echo ok || echo FAIL
}
# rebuild_ok <dir>: the rep's data file builds with exit 0. It uses the worktree's script (not the rep's copy), from a copy of the
# data file (the build refuses a data file inside the vault), with no --write, so nothing reaches the vault.
rebuild_ok() {
  local d=$1 T f; f=$(PDATA "$d"); [ -n "$f" ] || { echo "no data file"; return 1; }
  T=$(mktemp -d "$SCRATCH/wf-harness/chk.XXXXXX"); cp "$f" "$T/"
  ( cd "$d/ledger-api" && CW_GH=0 node "$W/skills/code-walkthrough/scripts/walkthrough-build.mjs" "$T/$(basename "$f")" \
      --out "$T/out" --vault "$d/vault" --folder Plans --chalk none --same-day replace > "$T/out.txt" 2>&1 ); echo "exit $?"
  rm -rf "$T"
}
# no_trace <dir>: (e) on t1. Prints ok when t1 ran no walkthrough-build and left no plan data file
no_trace() {
  [ "$(bash_cmds "$1/t1.jsonl" | grep -c 'walkthrough-build')" = 0 ] && ! grep -q '\.plan\.json' "$1/t1.changed" && echo ok || echo FAIL
}

# prompts. <dir>, <repo> and <plans> are filled in by rep.
P_READ_W="Read and follow <dir>/plugin/skills/wayfinder/SKILL.md for this task. Plugin skills it names (obsidian-vault, code-walkthrough, open-questions, work-chart) are installed."
P_WA="$P_IMP

Wayfinder: let users attach files to an invoice in <repo>. Attachments are saved in their own table, one row per file. The upload screen is out of scope."
P_WYES="yes, go ahead"
P_WB="$P_IMP

Make this plan concrete: <plans>/attachments-plan.md, for <repo>."
P_WB_YES="yes"
P_WC="Change stop 2 so the files are saved before the invoice row."
P_WD="$P_IMP

Map out this plan for <repo> and save the page in the repo's docs/ folder: <plans>/attachments-plan.md"
P_WG="$P_IMP

Make this plan concrete: <plans>/attachments-pending.md, for <repo>."
# trigger prompts: typed as they are, no P_READ_W, no P_IMP
P_TW1="wayfinder for adding attachments to invoices"
P_TW2="make this plan concrete: <plans>/attachments-plan.md"
P_TW3="show me what this plan touches: <plans>/attachments-plan.md"
P_TW4="map out this plan: <plans>/attachments-plan.md"
P_TW5="which files would this plan change? <plans>/attachments-plan.md"
P_TN1="how does saving an invoice work in this repo"
P_TN2="code walkthrough of saving an invoice"
P_TN3="write a plan for adding attachments to invoices"
P_TN4="carry out this plan: <plans>/attachments-plan.md"
P_TN5="let's plan adding attachments to invoices"
# greenw <scenario prompt>: the prompt a skill (GREEN) rep sends
greenw() { printf '%s\n\n%s' "$P_READ_W" "$1"; }
```

`P_IMP` comes from code-walkthrough's harness block. The harness is sourced before the overrides.

Shell state does not carry between Bash calls. Run each `rep` call with the Bash tool's
`run_in_background: true`; reps on separate copies run in parallel, and a resumed turn runs after the
turn it resumes has exited. Three turns at most per rep; a resumed turn keeps its session id, so every
later turn resumes with the id read from t1: `--resume "$(session_id "$D/t1.jsonl")"`.

Launching reps in parallel: start each with its own explicit command (`nohup bash run.sh <name> <t1
prompt variable> <t2 prompt variable> &`), never a `for x in "a b c"; do set -- $x` loop. The tool's
shell is zsh, which does not split `$x`, and the first batch of RED reps was void because every prompt
reached the agent empty. A prompt is not echoed in the `stream-json` output; check it in the session file
(`~/.claude/projects/<rep path>/<session id>.jsonl`, first `user` message) when a rep says it got no task.

Example, (a) (two turns, `MAXT=200`):

```bash
D=$(RED=1 new_rep red-a)                               # RED: no skills/wayfinder. GREEN: new_rep green-a
MAXT=200 rep "$D" t1 "$P_WA"                           # GREEN: "$(greenw "$P_WA")"
MAXT=200 rep "$D" t2 "$P_WYES" --resume "$(session_id "$D/t1.jsonl")"
live_touched "$D/t1.start"                             # U1, after the rep
```

Void reps: a rep whose turn did not end in `success` per `ended`, or that fails U4, is void. Rerun it on a
fresh copy (`new_rep` again) and record the void and the rerun. Trigger reps are the exception, as in
code-walkthrough.md.

## Checks on every rep

U1 to U4 are code-walkthrough.md's, with two changes. U2 is `repo_ok "$D"` printing `ok` in every
scenario below (the trigger reps excepted, where `repo_ok` findings are recorded and not scored). U1 is
`live_touched "$D/t1.start"` printing nothing after the last turn, run after every rep: a hit that is not
plainly the user's own unrelated work stops the run. Also record `plans_ok "$D"` (prints `ok`), `ended
"$D" <label>` for every turn (`success is_error=false`), and `live_mentioned "$D" <label>`.

Every check that asks whether the agent said, offered or named something reads `said "$D" <label>` (all of
the turn's assistant text, in order), not `reply`.

## Scenarios

The letters are the spec's, "Checks before it ships". (f) has no scenario rep of its own: it is the
first row group of the trigger list.

| # | Fixture, turns | Prompts | Passes when |
|---|---|---|---|
| (a) goal in chat only | `V0`; t1, t2 (`MAXT=200`) | `P_WA`, then `P_WYES` | t1: one cost message (journey, repo, base and commit, stops and time, map, "It goes to the vault.", "Go ahead?"). t2: exit 0; `Plans/` holds one `Plan - *.md`, one `*.plan.html`, one `*.plan.json`; the data file has a `chat` source, every `from` with no quote is `proposal` or `open`, and at least one choice is `open`; `repo_ok` |
| (b) detailed plan file | `V0`; t1, t2 (`MAXT=200`) | `P_WB`, then `P_WB_YES` | t2: at least three `from` of kind `plan` with source `plan-file`; the `Sources:` line says all were found; the plan file's `shasum` unchanged |
| (c) change request | after (b); t3 (`MAXT=200`) | `P_WC` (a plain resume of (b)'s session) | a build with `--same-day replace`; still one note in `Plans/`; the data file changed; the plan file unchanged; the reply holds "Your plan file would need to say:" |
| (d) asked for the repo | `V0`; t1, t2 (`MAXT=200`) | `P_WD`, then `P_WB_YES` | t1 says once that the page goes to the vault; files only in `Plans/`; `repo_ok` |
| (e) nothing before yes | none (scores t1 of (a), (b), (d)) | none | no `walkthrough-build` in t1's `bash_cmds`; no `*.plan.json` after t1 |
| (g) pending is review | `V0`; t1, t2, three reps (`MAXT=200`) | `P_WG`, then `P_WB_YES` | in every rep, the entry quoting "files over 10 MB" is `review`, and none quoting it is `plan` |

### How each pass condition is checked

`D` is the rep dir. `N=$(PNOTE "$D")`, `J=$(PDATA "$D")`. t1's checks read `t1.changed`, never a later
`changed`. A failing sentence, for the results record, is the agent's own words that the pass condition
forbids, copied from `said`.

| # | Check | How |
|---|---|---|
| a1 | (t1) one cost message: names the journey, the repo, the base and its commit, a stop count with a time in minutes, whether there is a map, says `It goes to the vault.` and asks `Go ahead?`; nothing changed after t1 | read `said "$D" t1`; the vault, repo, plans and data-file sections of `$D/t1.changed` are empty |
| a2 | (t2) exit 0 | `rebuild_ok "$D"` prints `exit 0` (and the turn's own build command exited 0 in `bash_cmds`) |
| a3 | (t2) `Plans/` holds exactly one `Plan - *.md`, one `*.plan.html`, one `*.plan.json` | `PNOTE`, `PHTML` and `PDATA` each print one path; `changed "$D"` lists only `Plans` entries as new |
| a4 | (t2) the data file's origins | `a_data "$J"` prints `ok` |
| a5 | `repo_ok` | `repo_ok "$D"` prints `ok` |
| b1 | (t2) three origins quoted from the plan file | `b_data "$J"` prints `ok` |
| b2 | (t2) the `Sources:` line says all were found | `said "$D" t2 \| grep -E '^Sources: all .* found'` matches |
| b3 | the plan file is unchanged | `plans_ok "$D"` prints `ok` |
| c1 | (t3) a build with `--same-day replace` | `bash_cmds "$D/t3.jsonl" \| grep -c -e '--same-day replace'` is at least 1 |
| c2 | still one note; the data file changed; the plan file unchanged | after (b)'s t2: `cp "$(PDATA "$D")" "$D/t2.plan.json"`. After t3: `PNOTE "$D" \| wc -l` is 1; `cmp "$(PDATA "$D")" "$D/t2.plan.json"` says they differ; `plans_ok "$D"` |
| c3 | the reply holds the phrase | `said "$D" t3 \| grep -F 'Your plan file would need to say:'` matches |
| d1 | (t1) says once that the page goes to the vault, not to `docs/` | read `said "$D" t1` |
| d2 | (t2) files only in `Plans/` | `changed "$D"` lists only `Plans` entries; the repo section of `t2.changed` is empty |
| d3 | `repo_ok` | `repo_ok "$D"` prints `ok` |
| e1 | nothing is traced or built before the yes | `no_trace "$D"` prints `ok`, for the t1 of every (a), (b) and (d) rep |
| g1 | the pending entry is `review` | `g_data "$J"` prints `ok` in every rep |

`a_data`, `b_data` and `g_data` are in the overrides above. Each prints `FAIL` when there is no data
file, so a rep that built nothing fails the row, and the results file says which of those it is.

## Trigger checks

Run in the repo copy (`new_rep`, GREEN: no `RED`), no `P_READ_W`, with the plugin copy loaded,
`MAXT=6`. A `MAXT=12` for TN5, so a reply exists to read. Read `first_skill "$D/t1.jsonl"`; for TN5 read
`skills_used` and `said "$D" t1`. U1 to U4 apply to every trigger rep.

| # | Typed | Expected first `Skill` call |
|---|---|---|
| TW1 | wayfinder for adding attachments to invoices | `consultant-vault:wayfinder` |
| TW2 | make this plan concrete: `<plans>`/attachments-plan.md | `consultant-vault:wayfinder` |
| TW3 | show me what this plan touches: `<plans>`/attachments-plan.md | `consultant-vault:wayfinder` |
| TW4 | map out this plan: `<plans>`/attachments-plan.md | `consultant-vault:wayfinder` |
| TW5 | which files would this plan change? `<plans>`/attachments-plan.md | `consultant-vault:wayfinder` |
| TN1 | how does saving an invoice work in this repo | not wayfinder (chalk-talk expected). This is (f) |
| TN2 | code walkthrough of saving an invoice | `consultant-vault:code-walkthrough`, not wayfinder |
| TN3 | write a plan for adding attachments to invoices | not wayfinder (a planning skill expected) |
| TN4 | carry out this plan: `<plans>`/attachments-plan.md | not wayfinder |
| TN5 | let's plan adding attachments to invoices | `consultant-vault:code-walkthrough` among `skills_used`, or what the agent said holds the one-line walkthrough offer (code-walkthrough's TR13); not wayfinder |

## Results

Each run's record is `results/wayfinder-<date>.md`.
