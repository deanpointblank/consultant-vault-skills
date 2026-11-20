# code-walkthrough, standalone copy: test record (2026-11-20)

The standalone copy is for teammates who have no notes vault. These scenarios run against a small
sample shop repo ("Demo Shop", three stops: add an item, price it, save the cart). One rep each,
a fresh `claude -p` session on its own copy, no outside services, no signed-in `gh`, no vault
variable set.

## RED

RED means the scenarios ran against the unchanged skill files, which are written for a notes vault.
chalk-talk is installed on the test machine, so reps could draw the map.

Harness note: the first batch of reps was void. A too-wide deny rule blocked every shell command.
The rule was narrowed and all five scenarios were rerun. Only the rerun is recorded here.

Live-vault check after every rep: no change. Repo copies untouched in every rep.

### (a) Walkthrough of adding an item to the cart, then "yes, go ahead"

FAIL. Turn 1 gave a cost message, but asked for a vault path as well as a yes. Turn 2 stopped and
never built anything, so no page, note or data file exists.

- "I found no vault. `home/` is empty and I found no `Meta/Config.md` anywhere I looked. The build needs a vault path."
- "I can't start yet: there is no vault to write to."
- "Reply with 1 and a path, or 2." (option 2: make a vault with a `Meta/Config.md` and build into it)

### (b) "Let's plan a per-customer limit on items in the cart"

FAIL on the look-up. No `walkthrough-look.mjs` call was made, because the rep could not find a vault
to look in. It did make one offer line with minutes before planning, and after "no, just plan it" it
planned with no second offer (those parts pass).

- "I couldn't find a vault with `Meta/Config.md`, so I have no walkthrough to check."
- "On yes, I'll also need the vault's path. On no, I'll go straight to planning."

### (c) Walkthrough, "save the page in the repo's docs/ folder", then "yes, go ahead"

FAIL. Turn 1 did say the page holds code and local paths and does not go in `docs/`, but it named the
vault, not the walkthroughs folder, as the destination. Turn 2 built nothing. No files were written.

- "The walkthrough skill writes only to your vault, never into a code repo. The page holds code and local paths."
- "I can't find your vault. I looked for `Meta/Config.md` in the scratch folders and under your home folder (4 levels deep) and found nothing."
- "I can't build yet because there is no vault. The skill writes only to a vault, and I found none."

### (d) "Why is the cart capped at 50 items? Just tell me why."

PASS against the row. It said no source records why, kept the question for the team, marked its one
guess as a guess, cited no pull request and wrote nothing. It still mentioned the vault (a fail for
row (e)).

- "Vault: I found no vault, so I checked no work, decision or meeting notes."

### (e) Vault and skill names in what the reps said

FAIL in all five reps. Every rep named the vault; three also named `Meta/Config.md`; one named `.obsidian`.

- (a) "I found no vault." / "No folder I was told about has a `Meta/Config.md` or an `.obsidian` folder."
- (b) "I couldn't find a vault with `Meta/Config.md`, so I have no walkthrough to check."
- (c) "I can't find your vault."
- (d) "Vault: I found no vault, so I checked no work, decision or meeting notes."
- (RF1) "I found no `Meta/Config.md` or `.obsidian` folder under your home. Where is the vault?"

### RF1 (walkthroughs folder set inside the repo copy)

FAIL. It did not refuse and did not say the folder is inside a git repo. It asked the cost question
and asked for a vault path. Repo copy untouched, no build ran (those parts pass).

- "I can't start the trace yet, and I also can't find the vault. The skill writes only to the vault and needs your yes first."
- "Two things I need from you: 1. **Go ahead?** (yes or no) 2. **Vault path.**"

### Pattern

One cause in every failing rep: the old files make the vault the only place output can go, so a
person with no vault is stopped and asked for a path. No rep wrote anywhere it should not.

## GREEN


## GREEN, round 1

New `SKILL.md` and `references/data-file.md`, one rep per scenario, model sonnet, all five reps run in parallel. chalk-talk is installed, so (a) and (c) built with the map. Guards kept: no vault variable, deny list, empty `gh` config, `CW_GH=0`. The live-vault check (U1) was empty after every rep. No real walkthroughs folder was created.

| Scenario | Result | Clauses |
|---|---|---|
| (a) | PASS | t1: one cost message (start, end, about 4 stops, about 8 minutes, map line, "Go ahead?"); nothing existed at the walkthroughs folder after t1. t2: parent and `pages/` exist; one `Walkthrough - *.md`, one `*.html`, one `*.walkthrough.json`; build ended exit 0 on the second try (first try: "FAIL map layout: save: arrow cart -> store runs through price", fixed by the rep moving a node); reply's first line starts with the page's full path; `jq -r .client` prints `demo-shop` and the note has `client: demo-shop`; `repo_ok` ok |
| (b) | PASS | t1: ran `walkthrough-look.mjs` on a parent that did not exist, result `none`; one offer line with minutes ("About 10 minutes"), before any plan step; parent still absent. t2: no second offer; planning went on |
| (c) | PASS | t1 said once that the page holds code and local paths and goes to the walkthroughs folder, not `docs/`. After t2: files only under `pages/`; `repo_ok` ok. Note: the reply's first line was a relayed build message ("Move the cart file block to a free row."), the path came on line 2 (the row does not require the path) |
| (d) | PASS | Said no source records why; kept the question for the team; the one guess was labelled "Guess, not a fact"; no pull request cited or guessed ("Tickets, PRs, build notes: none in the repo" is a search note, not a citation); nothing written |
| (e) | PASS | No hit for `vault`, `obsidian`, `Meta/Config`, `open-questions`, `work-chart`, `ticket-intake`, `repo-dossier` or `frames` in anything any rep said or ran. No skill said to be missing. The only matches were the word "skill" ("Per the skill, ...") and the folder name "code-walkthroughs" inside paths |
| RF1 | PASS | Refused, said the folder is inside a git repo; no cost question; `repo_ok` ok; no build ran. Small inaccuracy: the rep also said the environment variable "is not set" when it was set to the in-repo folder. Not a row clause |

Step 7: lookup on a missing parent printed `none`, exit 0.
Step 8: `diff -r` on `scripts/` and `assets/` against the source printed nothing.

No failures this round. No fix round needed.

## GREEN, round 2

One sentence was added to the Reply rule: nothing comes before the page's path, not even a note on what a check round fixed. Scenarios (a) and (c) were rerun once each on the same model. Both replies now start with the page's full path. Both builds wrote their three files under `pages/`, and the check on the live notes folder was empty.

## Installed as a plugin

Two more runs, on the same model, with the plugin loaded as a plugin and no pointer to the skill file.

- "Code walkthrough of adding an item to the cart in <repo>, from addItem to the saved cart." The skill fired from its description and gave the cost message. Nothing was written. Pass.
- "How does addItem work in <repo>?" The skill did not fire; the agent read the file and answered in chat. Pass: the shorter description does not over-trigger on this phrase.
