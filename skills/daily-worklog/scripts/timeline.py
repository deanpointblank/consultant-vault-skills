#!/usr/bin/env python3
"""Bucket one day's human-typed Claude Code turns into 15-minute slots.

Usage:
  python3 timeline.py --date 2026-10-14 --tz America/New_York \
      [--dirs ~/.claude/projects ...] [--client ~/Code/acme ...] [--vault ~/Vault]

Prints one line per 15-minute bucket from the first active bucket to the last:
  HH:MM-HH:MM  <count>  <group> [, <group> ...]   or   HH:MM-HH:MM  0  none
A group is "client <root>" (the longest --client path containing the turn's cwd),
"vault", or "other". Only timing and place are printed; no transcript text.

A turn counts only when a person typed it: subagent sidechains, meta entries,
tool results, command echoes, local command output, interrupts, task
notifications and peer messages are skipped. Standard library only.
"""
import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

SKIP_PREFIXES = (
    "<command-", "<local-command-", "<bash-", "<task-notification",
    "<system-reminder", "[Request interrupted", "Caveat:",
)


def norm(path):
    return os.path.realpath(os.path.expanduser(path)).rstrip("/")


def typed_text(entry):
    """Return the typed text of a human turn, or None if the entry is not one."""
    if entry.get("type") != "user" or entry.get("isSidechain") or entry.get("isMeta"):
        return None
    if "toolUseResult" in entry:
        return None
    origin = entry.get("origin")
    if isinstance(origin, dict) and origin.get("kind") != "human":
        return None
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, list):
        if any(isinstance(p, dict) and p.get("type") == "tool_result" for p in content):
            return None
        content = " ".join(p.get("text", "") for p in content
                           if isinstance(p, dict) and p.get("type") == "text")
    if not isinstance(content, str):
        return None
    text = content.lstrip()
    if not text or text.startswith(SKIP_PREFIXES):
        return None
    return text


def group_for(cwd, clients, vault):
    if not cwd:
        return "other"
    c = norm(cwd)
    if vault and (c == vault or c.startswith(vault + "/")):
        return "vault"
    best = None
    for root in clients:
        if c == root or c.startswith(root + "/"):
            if best is None or len(root) > len(best):
                best = root
    if best:
        return "client " + best.replace(os.path.expanduser("~"), "~", 1)
    return "other"


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--date", required=True, help="work date, YYYY-MM-DD")
    ap.add_argument("--tz", required=True, help="IANA timezone, e.g. America/New_York")
    ap.add_argument("--dirs", nargs="+", default=["~/.claude/projects"])
    ap.add_argument("--client", nargs="*", default=[], help="client repo or work root paths")
    ap.add_argument("--vault", default=None, help="vault folder path")
    a = ap.parse_args()

    tz = ZoneInfo(a.tz)
    day = date.fromisoformat(a.date)
    start = datetime(day.year, day.month, day.day, tzinfo=tz)
    end = start + timedelta(days=1)
    clients = [norm(p) for p in a.client]
    vault = norm(a.vault) if a.vault else None

    buckets = defaultdict(Counter)
    files = 0
    for d in a.dirs:
        root_dir = os.path.expanduser(d)
        for root, dirs, names in os.walk(root_dir):
            dirs[:] = [x for x in dirs if x not in ("subagents", "tool-results", "memory")]
            for name in names:
                if not name.endswith(".jsonl"):
                    continue
                path = os.path.join(root, name)
                try:
                    if os.path.getmtime(path) < start.timestamp():
                        continue
                    fh = open(path, encoding="utf-8", errors="replace")
                except OSError:
                    continue
                files += 1
                with fh:
                    for line in fh:
                        if '"user"' not in line:
                            continue
                        try:
                            entry = json.loads(line)
                        except ValueError:
                            continue
                        if typed_text(entry) is None:
                            continue
                        ts = entry.get("timestamp")
                        if not ts:
                            continue
                        try:
                            t = datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(tz)
                        except ValueError:
                            continue
                        if not (start <= t < end):
                            continue
                        slot = (t.hour * 60 + t.minute) // 15
                        buckets[slot][group_for(entry.get("cwd"), clients, vault)] += 1

    print(f"# {a.date} {a.tz}: {files} transcript files read, "
          f"{sum(sum(c.values()) for c in buckets.values())} typed turns")
    if not buckets:
        print("# no typed turns on this date")
        return
    for slot in range(min(buckets), max(buckets) + 1):
        s, e = slot * 15, slot * 15 + 15
        label = f"{s // 60:02d}:{s % 60:02d}-{e // 60 % 24:02d}:{e % 60:02d}"
        c = buckets.get(slot)
        if not c:
            print(f"{label}  0  none")
        else:
            groups = ", ".join(f"{g} {n}" for g, n in c.most_common())
            print(f"{label}  {sum(c.values())}  {groups}")


if __name__ == "__main__":
    sys.exit(main())
