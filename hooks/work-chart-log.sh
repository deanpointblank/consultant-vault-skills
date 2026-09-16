#!/usr/bin/env bash
# work-chart PostToolUse hook. Reads the hook JSON on stdin and appends one line to this
# session's activity log when the call counts as work: time, kind, tool, place.
# Never prints, never blocks a tool call, never stores file contents or command text.
# Writes only under ~/.config/vault-skills/work-log/. Always exits 0. Runs on every
# tool call, so it avoids extra processes: under 50 ms a call.
set -u

log_call() {
  local here input vault sid cwd tool path active cmd kind place="" log
  case "$0" in */*) here="${0%/*}" ;; *) here=. ;; esac
  . "$here/work-chart-lib.sh" || return 0
  input=$(cat)
  vault=$(wc_vault) || return 0
  { IFS= read -r sid; IFS= read -r cwd; IFS= read -r tool; IFS= read -r path; IFS= read -r active; IFS= read -r cmd; } <<FIELDS
$(wc_hook_fields "$input")
FIELDS
  [ -n "$sid" ] && [ -n "$tool" ] || return 0
  kind=$(wc_kind "$tool")
  [ -n "$kind" ] || return 0
  # A stamp run is marked wherever the shell sits: the plugin lives outside every work root.
  if [ "$kind" = shell ] && wc_runs_stamp "$cmd"; then
    kind=MARK
  else
    [ "$kind" = shell ] && path="$cwd"
    case "$path" in
      ""|/*) ;;
      *) path="$cwd/$path" ;;
    esac
    wc_in_roots "$cwd" "$vault" || wc_in_roots "$path" "$vault" || return 0
    case "$kind" in
      edit)
        wc_under "$path" "$vault" && return 0
        place="$path" ;;
      research)
        place="$path" ;;
      shell)
        place=$(wc_git_top "$cwd") || place="" ;;
    esac
  fi
  log=$(wc_log_path "$sid")
  [ -d "${log%/*}" ] || mkdir -p "${log%/*}" || return 0
  printf '%s\t%s\t%s\t%s\n' "$(date +%s)" "$kind" "$tool" "$place" >> "$log"
}

log_call >/dev/null 2>&1
exit 0
