---
name: reference-clipper
description: Save external reference material — vendor docs, API references, specs, wiki pages, articles — into the vault as clean markdown. Use whenever the user shares a URL with "clip this", "save this", or "add this to my vault", or references external documentation they'll clearly need again during the engagement.
---

# Reference clipper

Follow the obsidian-vault skill's conventions. Clippings are evergreen notes in the clippings folder.

## Clipping

1. Fetch the page and convert to markdown, preserving the heading structure. Strip navigation, footers, cookie banners, and sidebars — keep only the substantive content.
2. Filename: the page title, cleaned of forbidden characters.
3. Frontmatter per the property schema: `type: clipping`, `source_url`, `title`, plus the standard `client` and `created`.
4. Wikilink entities the vault already knows — repos, glossary terms, people — so the clipping joins the graph instead of sitting inert.
5. Add a one-line entry to today's daily note noting what was clipped and why, if the user gave a reason.

## Edge cases

- **Auth-walled or paywalled pages**: create a stub note with the URL, the title, and whatever summary the user provides. Say plainly that the content couldn't be fetched — never fabricate a summary of a page you couldn't read.
- **Very long pages**: clip the sections relevant to the stated need and link the source for the rest, noting which sections were kept.
- **Already clipped**: if a note with the same `source_url` exists, update it rather than duplicating — and mention the page changed since last clip if it visibly did.
