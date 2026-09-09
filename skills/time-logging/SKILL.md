---
name: time-logging
description: Draft the week's or month's billable hours as per-day, per-ticket worklog rows reconciled against the invoice source. Use whenever the user says "time logging", "log my hours", "worklogs", "reconcile against Harvest", "what did I bill", or mentions an invoice audit against Jira. Hours that cannot be shown against a ticket are hours the client can refuse to pay.
---

# Time logging

Follow the obsidian-vault skill's conventions. One note per period, filename `Time Logging - Week of YYYY-MM-DD.md` (the Monday) or `Time Logging - Month YYYY Reconciliation.md`, in the tickets folder. Template: vault templates folder first, else this skill's `templates/Time Logging.md`.

## Never post

This skill drafts. Reading calendars, Jira worklogs, Granola, and git history is expected; writing a worklog, a comment, or a transition is not, even when the user asks for "logging". The user posts from the draft, and the draft's table has a column for the ids that come back.

## The record

Frontmatter per the property schema: `type: time-log`, `period_start`, `period_end`, `status: draft` until every row has a worklog id, then `posted`; `jira` lists every ticket in the table.

Body sections, in this order:

1. **Source of truth** — what the billed figure per day comes from: the invoice export (Harvest or equivalent) when it exists, otherwise the calendar's billable blocks, otherwise "assumed" with the assumption stated. Name which one applies to this period.
2. **Per-day allocation** — one table, one row per ticket per day: date, ticket, hours, start time, worklog comment, worklog id (blank until posted). A subtotal row per day. Each day's rows sum to that day's billed figure exactly; a day that cannot be made to sum gets a row named "unattributed" rather than padded hours on a ticket.
3. **Evidence** — per day, the daily-note timestamps, meeting notes, commits, and Jira activity that back the rows. A row with no evidence says so.
4. **Soft spots** — every reconstruction, inference, closed ticket used as a home, or day without a daily note, each with what happens if it is challenged and how to fix it.
5. **Not in Jira** — ceremonies folded into ticket rows, internal time left unbilled, holidays.
6. **Check against the export** — when the invoice export exists, the per-day comparison; when it does not, the command or script to run once it lands.

## Rules that survive audits

- One worklog per ticket per day; two tasks on the same ticket merge into one row.
- Ceremonies (standup, huddle, refinement) fold into the day's main ticket; they do not get their own row unless the client asks for it.
- A ticket that is Closed or belongs to someone else is a soft spot, not a home. Say which open ticket should carry the hours and, if none exists, which one to raise and who should raise it.
- Attribution rate (ticketed hours over billed hours) goes in the summary line at the top, next to the target the client set.
- Log a line in the daily note linking the draft.

## Common mistakes

| Shortcut | Why it fails |
|---|---|
| Narrative per day instead of the table | The auditor compares rows to worklogs; prose has no rows |
| Padding a day to eight hours | The invoice and the worklogs then disagree by exactly the padding |
| "Posted the worklogs for you" | The note said draft; a worklog under the wrong identity or ticket is worse than none |
| A new `type` for this note (`reference`, `proposal`) | Frontmatter queries for the period's time logs find nothing |
