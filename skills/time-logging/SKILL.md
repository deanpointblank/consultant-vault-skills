---
name: time-logging
description: Draft the week's or month's billable hours as per-day, per-ticket worklog rows reconciled against the invoice source. Use whenever the user says "time logging", "log my hours", "worklogs", "reconcile against Harvest", "what did I bill", or mentions an invoice audit against Jira. Hours that cannot be shown against a ticket are hours the client can refuse to pay.
---

# Time logging

Follow the obsidian-vault skill's conventions. One note per period, filename `Time Logging - Week of YYYY-MM-DD.md` (the Monday) or `Time Logging - Month YYYY Reconciliation.md`, in the tickets folder. Template: vault templates folder first, else this skill's `templates/Time Logging.md`.

## Never post

This skill drafts. Reading calendars, Jira worklogs, Granola, and git history is expected; writing a worklog, a comment, or a transition is not, even when the user asks for "logging". The user posts from the draft, and the draft's table has a column for the ids that come back.

## What daily-worklog owns

daily-worklog closes out one day: it sweeps the day's evidence, posts the rows after one
confirmation, and owns the month ledger `Worklog Ledger - YYYY-MM.md` in the status folder.
This skill does the weekly and monthly invoice reconciliation and the audit defence, and
**reads that ledger instead of reconstructing the period from evidence**. The rows, the
worklog ids and the soft spots are already there; the period note adds the invoice
comparison, the attribution rate and the Not-in-Jira account, and sets the ledger's `status`
to `posted` at month close, when every row carries a worklog id.

Four rules below are superseded for daily work:

| This skill's rule | For daily work | Still true here |
|---|---|---|
| Draft weekly or monthly | Superseded. One run per day. | This note is still per week or per month. |
| Ceremonies fold into the day's main ticket | Retired from 2026-09-14 onward — the ceremony ticket exists now. | The month-end note still explains folded hours for days posted that way before 2026-09-14. |
| One worklog per ticket per day | Superseded. One per ticket per activity per day. | The month-end note may group rows back to one line per ticket per day if the client asks for that shape; the worklogs stay split. |
| Never post | Superseded there, after confirmation. | This skill still never posts. It reads ids from the ledger. |

One rule differs rather than being superseded: daily-worklog treats a Closed or someone
else's ticket as the right home, because that is where the work went and Jira attributes the
worklog to its author regardless. The soft spot is still recorded, and this skill still names
the alternative home at month end.

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

- One worklog per ticket per activity per day, as daily-worklog posts them; group rows back to one line per ticket per day in this note only if the client asks for that shape. Days posted before 2026-09-14 are one per ticket per day and stay that way.
- Ceremonies get their own rows on the ceremony ticket from config `worklog.ceremony_ticket`. Days before 2026-09-14 have them folded into the day's main ticket; say so in Not in Jira rather than restating them.
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
