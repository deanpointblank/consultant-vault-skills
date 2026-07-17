---
name: repo-dossier
description: Create and maintain a standardized note for each client repository. Use whenever the user clones or first mentions a repo, says "dossier" or "document this repo", asks what a repo does, learns something new about a repo's build, owners, or dependencies, or wants an overview of onboarding progress across repos. Any new fact about a repo belongs in its dossier, not just in chat.
---

# Repo dossier

Follow the obsidian-vault skill's conventions. One evergreen note per repository, filename equal to the repo name, in the repos folder. Template: vault templates folder first, else this skill's `templates/Repo.md`.

## Creating

Frontmatter per the property schema: `org`, `language`, `status: cloned`, `owners` as quoted wikilinks (empty list until known).

When a local clone is available, populate from it rather than asking the user:

- **Purpose** — from the README's opening; one or two sentences in your own words.
- **Stack** — from manifests (`package.json`, `pom.xml`, `go.mod`, `*.csproj`, `requirements.txt`) and Dockerfiles.
- **Entry points** — main/startup files, exposed ports, key routes or handlers.
- **Build and run** — the actual commands that work, including any environment prerequisites discovered the hard way.
- **Depends on** — grep the codebase for the names of the other client repos; sibling dependencies are the most valuable onboarding fact and the least documented.

Anything not determinable from the clone stays as an empty section — an honest gap beats a plausible guess.

## Updating

- Merge new facts into the right section; never rewrite prose the user wrote by hand.
- When a fact is superseded ("turns out it deploys via the terraform repo, not its own pipeline"), correct it and keep a struck-through or "previously believed" trace in Notes — the wrong assumption is often useful context later.
- Status transitions: `cloned` at creation, `building` once a build has been verified locally, `understood` only when the user says so.

## Progress overview

"How's my onboarding going" → frontmatter scan of the repos folder; present a table of repo, status, and owners, and call out repos still at `cloned`.
