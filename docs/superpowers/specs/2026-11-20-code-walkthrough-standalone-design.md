# code-walkthrough standalone — design

**Status: Approved by the user, 2026-11-20, with every choice as written. Nothing is built.** Plan: `docs/superpowers/plans/2026-11-20-code-walkthrough-standalone.md`.

## What it is

The delivery lead asked the author to share the `code-walkthrough` skill with the team. Teammates have no Obsidian vault and none of this plugin's other skills. So the team gets a standalone copy: the same skill, packed as its own plugin, that runs with nothing else installed.

Terms:
- **Vault version**: the skill as it is today, in `skills/code-walkthrough/` of this repo.
- **Team copy**: the standalone plugin, in the team's plugin marketplace repo.
- **Walkthroughs folder**: where the team copy writes its output (a page, its data file and a short note).

## Goals, non-goals, anti-goals

**Goals**
- A teammate installs it from the team's marketplace repo (`stride-nyc/stride-plugins-official`, public) with `/plugin install code-walkthrough`.
- A walkthrough runs end to end with no vault, no `Meta/Config.md` and no sibling skills.
- `scripts/` and `assets/` are byte-for-byte the same in both copies, proved with `diff -r`.

**Non-goals**
- Changing how the vault version behaves.
- The planned "Wayfinder" skill (a separate project, later).
- The six live-run findings and the speed ideas already on file.
- Shipping chalk-talk (a third-party map-drawing skill) inside the plugin.

**Anti-goals.** Any of these makes it a failure, even if it runs.
- The client's name or a local home path in the team copy.
- Output landing inside a code repo.
- Two versions of the scripts that drift apart.

## Constraints found in the code

- The build takes `--vault <parent folder>` and `--folder <subfolder>`, and refuses a subfolder equal to the parent (`walkthrough-build.mjs:121`). Output needs a parent plus a subfolder. Any folder works as the parent; it need not be an Obsidian vault. The parent must exist (line 118); the build creates the subfolder.
- The build refuses a data file with no `client` string (line 86).
- The lookup command (`walkthrough-look.mjs`) finds earlier walkthroughs by reading the short note the build writes: its `type` and its `repos` list in `[[name]]` form (`lib/look.mjs:124`). So the note stays as it is, Obsidian link marks included. With a missing folder, the lookup prints `none`.
- The map needs chalk-talk, at `~/.claude/skills/chalk-talk` or `.claude/skills/chalk-talk` in the project. Without it, the page builds with no map.
- The scripts are plain Node with nothing to install. 237 tests pass with the skill folder copied out alone (the author's check, 2026-11-20, Node 24.14, `node --test "scripts/tests/*.test.mjs"` from the skill folder).
- The marketplace repo holds each local plugin as `plugins/<name>/.claude-plugin/plugin.json`, `plugins/<name>/README.md` and `plugins/<name>/skills/<name>/…`, plus one entry in `.claude-plugin/marketplace.json` (`"source": "./plugins/<name>"`) and one row in the README table. Earlier pull requests there ran `claude plugin validate`.

## Approaches

**How to build it**
1. **Same scripts, new instructions. Picked.** Copy `scripts/` and `assets/` unchanged. Rewrite only `SKILL.md` and `references/data-file.md`, and add a README and `plugin.json`. Keeping the copies in step costs one copy command. Trade-off: the short note keeps Obsidian link marks that read oddly in a plain editor; teammates read the HTML page instead.
2. Rewrite the scripts for plain folders. A cleaner note, but two versions of the code to maintain.
3. Make the vault version itself work without a vault. One copy only, but it changes a tested skill and every scenario must be re-run.

**Where it lives**
1. **Inside the marketplace repo, at `plugins/code-walkthrough/`. Picked**, and confirmed by the user. The team owns it, and nobody installs from the author's personal repo. Each later update is a pull request.
2. A pointer entry in the marketplace to a folder in the author's repo. No pull request per update, but teammates install from a personal repo.
3. A repo of its own. More to create and keep.

## The design

### Layout in the marketplace repo

```
plugins/code-walkthrough/
  .claude-plugin/plugin.json
  README.md
  skills/code-walkthrough/
    SKILL.md
    assets/                  copied unchanged
    references/data-file.md  rewritten
    scripts/                 copied unchanged (both commands, lib/, tests/)
```

### SKILL.md, section by section

- **Description.** Drop the lines that route to skills teammates lack (chalk-talk's own triggers, work-chart, repo-dossier, frames). "One page in the vault" becomes "one page in your walkthroughs folder". Keep the trigger phrases and the last sentence.
- **Opening.** No "follow the obsidian-vault skill". "Three files in the vault" becomes the walkthroughs folder.
- **Output folder.** No config file. The parent is `~/code-walkthroughs` and the subfolder is `pages`; the environment variable `CODE_WALKTHROUGH_HOME` overrides the parent. The skill creates the parent on the first yes (the build makes the subfolder), and passes them as `--vault` and `--folder` to both commands.
- **`client` in the data file.** The folder name of the first repo, in slug form: lower case, and anything that is not a letter or digit becomes `-` (`Demo Shop` gives `demo-shop`). The note's frontmatter writes `client` unquoted, and the slug form keeps an odd folder name from breaking it. No question asked.
- **No `work_roots`**, so no `--work-root` flags.
- **Where output goes.** "Only to the vault" becomes "only to the walkthroughs folder, never into a code repo or an outside service". The build guards only its working folder and data file, so the instructions carry this rule, including: refuse a walkthroughs folder that sits inside a git repo. The cost message's "It goes to the vault" line changes to match.
- **Reasons.** The vault drops out as a place to look, and so does "look in its vault ticket note". The order becomes: design docs in the repo; commits, pull requests and the tickets they name; code comments; AI build notes. The three reason rules (quote the source word for word; "not recorded" holds only the question; guesses shown apart) stay word for word.
- **Planning offer.** Stays. "Ticket-intake" becomes "any planning skill". The lookup still prints `[[note name]]`; the skill names the page by its path instead.
- **Build and check.** Same commands and exit codes, with the new flags. Wording about "the vault" becomes the walkthroughs folder. One line says the build's messages call the walkthroughs parent folder "the vault".
- **Reply.** The first line gives the page's full file path instead of a `[[wikilink]]`. The "log as open questions" line, the `Meta/Config.md` line and the paragraph on vault writes (open-questions, work row, daily note) go. The numbered not-recorded questions stay.
- **Work chart section.** Goes.
- **Common mistakes.** Reword the row that names the vault.
- **chalk-talk rules.** Stay as they are.

### Other files

- **`references/data-file.md`.** `client` is the first repo's folder name in slug form, as above. Drop what applies only to vault notes (the `vault-note` source kind, a ticket's `note` field). Keep everything else the build checks.
- **README.** What it does. What it needs: Node, git, optionally `gh`, optionally chalk-talk (github.com/oztrkemree/chalk-talk, MIT) and where to put it. Where output goes. How to ask for one ("code walkthrough of X"). A warning that the page holds code and local paths, so share it with care.
- **`plugin.json`.** Name `code-walkthrough`, a one-line description, version `1.0.0`, keywords. The author field gives a name only, no email.

### One change in the source repo first

The test fixtures hold the client's name in two places: `scripts/tests/helpers.mjs:170` and `scripts/tests/note.test.mjs:27`. Change both to `acme` in the vault version, run the tests, then copy. Both copies stay identical.

### Keeping the copies in step

No sync script. A short section in this repo's README gives two commands: `diff -r` on `scripts/` and `assets/` between the two checkouts, and the `cp -R` that updates the team copy.

## Checks before it ships

- Tests pass in the vault version after the fixture change, and again in the copied plugin folder.
- `diff -r` shows no difference in `scripts/` and `assets/`.
- `claude plugin validate` passes for the plugin and for the marketplace file.
- A search of the plugin folder finds no person's name (apart from the author line in `plugin.json`), no home path, no client term, and no mention of the vault skills (obsidian-vault, work-chart, open-questions, ticket-intake, `Meta/Config.md`).
- Scenario runs of the new `SKILL.md`, each with a fresh agent and no vault:
  - (a) A run asks the cost question and builds to the default folder.
  - (b) The planning offer appears once and takes a no.
  - (c) Asked to write into the repo's `docs/`, it keeps output in the walkthroughs folder.
  - (d) A reason with no source stays "not recorded".
  - (e) The reply names no vault and no missing skill.

## Delivery

A branch on the marketplace repo, pushed with the author's personal GitHub account, which has maintain access, so no fork. The account is passed per command; the machine's active account is not switched. Git identity is set in that clone only. The branch is pushed and the pull request opened only after the user says yes at that moment.

Left to the builder: the exact wording of the new `SKILL.md`, the README and the plugin description.

## Settled items

Ruled by the user, 2026-11-20:
- **Where it lives:** inside the marketplace repo.
- **Author line:** a name only, no email.
- **Default folder:** `~/code-walkthroughs/pages`.
- **The build's messages say "vault"** (`walkthrough-build.mjs:118`, `121`, `126`, `203`; usage line 15). The scripts stay unchanged. The team `SKILL.md` gets one line saying the build's messages call the walkthroughs parent folder "the vault".
- **A comment names Obsidian** (`scripts/lib/settings.mjs:20`, the Embed HTML plugin). Left as it is.
- **Vault-only source kinds stay in the code.** `vault-note` and a ticket's `note` field are still accepted by the build (`scripts/lib/data.mjs:4`, `scripts/lib/quotes.mjs:97`). Left as they are; `data-file.md` stops describing them.
- **`client` in slug form**, as under "SKILL.md, section by section".

Still to confirm when built: the 237-test count (plan Tasks 1 and 2) and the marketplace repo's layout (plan Tasks 2 and 4).
