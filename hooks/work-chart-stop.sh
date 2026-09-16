#!/usr/bin/env bash
# work-chart Stop hook. Reads the hook JSON on stdin and this session's activity log.
# Prints one block decision when the work since the last rows is worth a row: an edit,
# an outward call, 5 or more research and shell calls, or a touched repo whose fingerprint
# differs from its stamp. Removes activity logs older than 14 days.
# Never writes to a repo or the vault. Always exits 0.
set -u

TAB=$(printf '\t')

# Print a path with $HOME shortened to ~.
short() {
  case "$1" in
    "$HOME"/*) printf '~%s' "${1#"$HOME"}" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Append $1 to $parts, joined by "; ".
add_part() {
  if [ -z "$parts" ]; then parts="$1"; else parts="$parts; $1"; fi
}

check_stop() {
  local input sid cwd tool path active cmd vault dir log kept first edits outward research
  local seen="" outside="" kind place d top fp stamp changed="" named="" files="" reason when
  parts=""
  . "$(cd "$(dirname "$0")" && pwd)/work-chart-lib.sh" || return 0
  input=$(cat)
  { IFS= read -r sid; IFS= read -r cwd; IFS= read -r tool; IFS= read -r path; IFS= read -r active; IFS= read -r cmd; } <<FIELDS
$(wc_hook_fields "$input")
FIELDS
  [ "$active" = true ] && return 0
  vault=$(wc_vault) || return 0

  dir="$HOME/.config/vault-skills/work-log"
  [ -d "$dir" ] && find "$dir" -type f -name '*.tsv' -mtime +14 -delete 2>/dev/null

  [ -n "$sid" ] || return 0
  log=$(wc_log_path "$sid")
  [ -f "$log" ] || return 0
  kept=$(awk -F'\t' '$2 == "MARK" {buf = ""; next} {buf = buf $0 "\n"} END {printf "%s", buf}' "$log")
  [ -n "$kept" ] || return 0

  set -- $(printf '%s\n' "$kept" | awk -F'\t' '{c[$2]++} END {print c["edit"]+0, c["outward"]+0, c["research"]+c["shell"]+0}')
  edits=$1; outward=$2; research=$3
  first=$(printf '%s\n' "$kept" | head -n 1 | cut -f1)

  # Touched repos (tagged edit or shell) and files outside git, in first-seen order.
  while IFS="$TAB" read -r _ kind _ place; do
    [ -n "$place" ] || continue
    case "$kind" in
      edit)
        d=$(dirname "$place")
        while [ ! -d "$d" ]; do d=$(dirname "$d"); done
        if top=$(git -C "$d" rev-parse --show-toplevel 2>/dev/null); then
          seen="$seen$top${TAB}edit
"
        else
          outside="$outside$place
"
        fi ;;
      shell)
        top=$(git -C "$place" rev-parse --show-toplevel 2>/dev/null) || continue
        seen="$seen$top${TAB}shell
" ;;
    esac
  done <<LINES
$kept
LINES

  # A touched repo is named when it was edited or its fingerprint differs from its stamp.
  while IFS= read -r top; do
    [ -n "$top" ] || continue
    fp=$(wc_fingerprint "$top" "$vault")
    stamp=$(wc_stamp_path "$top")
    if [ -n "$fp" ] && { [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$fp" ]; }; then
      changed=1
    elif ! printf '%s' "$seen" | grep -qxF "$top${TAB}edit"; then
      continue
    fi
    named="${named:+$named, }$(basename "$top") ($(short "$top"))"
  done <<TOPS
$(printf '%s' "$seen" | cut -f1 | awk '!seen[$0]++')
TOPS

  [ "$edits" -gt 0 ] || [ "$outward" -gt 0 ] || [ "$research" -ge 5 ] || [ -n "$changed" ] || return 0

  while IFS= read -r place; do
    [ -n "$place" ] && files="${files:+$files, }$(short "$place")"
  done <<FILES
$(printf '%s' "$outside" | awk '!seen[$0]++')
FILES

  [ -n "$named" ] && add_part "repos with changes: $named"
  [ -n "$files" ] && add_part "files outside git: $files"
  [ "$research" -gt 0 ] && add_part "research calls: $research"
  [ "$outward" -gt 0 ] && add_part "outward calls: $outward"
  when=$(date -r "$first" +%H:%M 2>/dev/null || date -d "@$first" +%H:%M 2>/dev/null)
  reason="Work since $when not yet in the work chart: $parts. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line."

  if [ -z "${WC_NO_JQ:-}" ] && command -v jq >/dev/null 2>&1; then
    jq -cn --arg r "$reason" '{decision: "block", reason: $r}'
  else
    printf '{"decision":"block","reason":"%s"}\n' "$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  fi
}

check_stop 2>/dev/null
exit 0
