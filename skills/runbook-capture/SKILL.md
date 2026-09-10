---
name: runbook-capture
description: Write a client-specific workflow into the vault as a runbook the next run can follow. Use whenever the user says "save this as a runbook", "capture that workflow", "make a runbook for", or "write up how we did that", and right after a multi-step sequence that changed an environment, a service, or files outside the vault succeeds for the second time with no runbook covering it. Steps that live in two daily notes and a handoff are steps nobody finds next month.
---

# Runbook capture

Follow the obsidian-vault skill's conventions. One runbook per outcome ("create a PFD environment"), not per command. Filename `Runbook - <what it does>.md` in `folders.runbooks` (key missing: use `Runbooks`, create it, tell the user to add the key). Template: vault templates folder first, else this skill's `templates/Runbook.md`.

## When to offer, when to write

- The user asks: write it.
- A sequence that changed an environment, a service, or files outside the vault just succeeded, no runbook covers it, and a daily note or handoff from another day shows the same hosts, commands, or scripts: offer once, "second time doing this; want it as a runbook?" Write only on yes.
- A runbook already covers it: no offer. A step that differed from the runbook is rewritten with the dated trace below.

## Where the steps come from, in order

1. This session: commands actually run, their outputs, and where course was corrected. Steps are what worked, not what was tried first.
2. Daily notes and handoffs naming the same hosts, scripts, or environments. A command recorded there counts as seen. Their gotchas become "If it goes wrong" lines, each with a wikilink to the note it was learned in.
3. Repo dossiers for the scripts involved, listed in `repos`, so the runbook links the repo instead of restating its build notes.

## The note

Frontmatter per the property schema: `type: runbook`, `topics`, `repos` as quoted wikilinks, `status: draft`. No `last_run` until a run sets it.

Write for a reader with 60 seconds. Everyday words.

Title `Runbook - <what it does>`. First line under the title: one sentence, what it does and when you would reach for it, and nothing after it — which notes it was written from belongs in the steps' wikilinks, not here. The index quotes this line.

1. **Inputs** — a table: name, example, where to find it. An input is anything that differed between the runs you can see, or a value the user typed: ticket key, warehouse id, environment name. Steps say `<ticket>`, `<warehouse>`.
2. **Before you start** — one line each: VPN, credentials as a wikilink to the private note that holds them, which clone must be current. A credential value never appears anywhere in the note; the step reads an environment variable.
3. **Steps** — numbered, one command or one action each, then `Expect:` and the actual output trimmed to the line that proves it worked. A step that changes something outside the machine ends with `(changes: <what>)`. A step only the user can do ends with `(you)`. A step that is both — a workflow the user dispatches, a console button that builds or deletes something — carries both, `(you) (changes: <what>)`; `(you)` on its own says the step changes nothing. A step nobody saw run and the user did not describe is not written; a gap the user describes in words is a `(you)` step. Output not seen: `Expect: not seen; fill in on first run`. A step that is itself a runbook links to it.
4. **Check it worked** — one or two commands with expected output.
5. **If it goes wrong** — known failures and their fixes, one line each, with the wikilink to where each was learned.

## Update, not duplicate

A runbook for the same outcome exists: add new "If it goes wrong" lines, rewrite only the steps that differed and keep one line under each: `until YYYY-MM-DD: <old step>`. Leave everything else. Never rename the file; links depend on it.

## The index

`<folders.runbooks>/Runbooks.md` (`type: reference`, `topics: [runbooks]`), created if missing with one intro line: "Every runbook in this vault, one line each. runbook-capture and runbook-run keep this list current." One bullet per runbook, alphabetical: `- [[Runbook - X]] — <first line>. <status>` and, when set, `, last run YYYY-MM-DD`. Add the row on create; rewrite the sentence when the first line changed.

## After writing

Daily note: `- HH:MM captured [[Runbook - X]]`. Reply in two lines: the link, and the count of steps and inputs.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Steps as first tried, not as they worked | The next run repeats the detour |
| A password in a step "so it runs unattended" | The vault is plain text; the private note and an env var are the pattern |
| One runbook per command | Nobody replays "run curl"; they replay "create the env" |
| Steps in prose | runbook-run reads numbered steps and the two marks; a paragraph has neither |
| Rewriting a step that worked because a newer way exists | Only a failed step is rewritten; a better way is a line under "If it goes wrong" |
| A second runbook for the same outcome with today's date | Links to the first break; update it |
| Filed at the vault root next to the old runbook | The index and runbook-run look in the runbooks folder |
| The runbook already in the vault used as the model | It was written before these rules — no inputs table, no marks, no failure section, no index row |
| A new section for what nobody wrote down that day | The step already carries it: `Expect: not seen; fill in on first run` |
| A gotcha left inside the step it happens to hit — "It is interactive and asks about pulling upstream commits first" | The step says what to do; "If it goes wrong" is where the reader looks once it did. Every gotcha the notes record gets its own line there, with its wikilink |
| Writing it because the sequence obviously repeated | The repeat starts the offer, not the note; nothing is written before the yes |
| Asking for the values you had to guess after the note exists | They belong in the offer; a runbook built on guesses is wrong from line one |
