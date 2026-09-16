#!/usr/bin/env bash
# work-chart Stop hook. Reads the hook JSON on stdin and this session's activity log.
# Prints one block decision when the work since the last rows is worth a row: an edit,
# an outward call, 5 or more research and shell calls, or a touched repo whose fingerprint
# differs from its stamp. Removes activity logs older than 14 days.
# Never writes to a repo or the vault. Always exits 0.
set -u
export GIT_OPTIONAL_LOCKS=0

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
  local input sid cwd tool path active cmd vault dir log parts reason when
  local markline data first edits outward research candidates resolved_list
  local folders topmap joined topsinfo outside files named changed
  local kindtag nr val d folder top wasedited place fp stamp
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

  # Pass 1: find the last MARK line's number (0 when there is none). Pass 2: everything
  # after it in one linear scan -- counts, the first kept line's time, and the unique edit
  # paths / shell places that need a folder resolved. Neither pass forks per line, and
  # neither buffers the kept lines by repeated string concatenation.
  markline=$(awk -F'\t' '$2=="MARK"{n=NR} END{print n+0}' "$log" 2>/dev/null)
  [ -n "$markline" ] || markline=0

  data=$(awk -F'\t' -v mark="$markline" '
    NR<=mark { next }
    {
      if (!gotfirst) { first = $1; gotfirst = 1 }
      c[$2]++
    }
    $2=="edit" && $4!="" && !(ep[$4]++) { print "E\t" NR "\t" $4 }
    $2=="shell" && $4!="" && !(sp[$4]++) { print "S\t" NR "\t" $4 }
    END {
      if (gotfirst) print "F\t" first
      print "C\t" (c["edit"]+0) "\t" (c["outward"]+0) "\t" ((c["research"]+0)+(c["shell"]+0))
    }
  ' "$log" 2>/dev/null)

  first=$(printf '%s\n' "$data" | awk -F'\t' '$1=="F"{print $2; exit}')
  [ -n "$first" ] || return 0
  set -- $(printf '%s\n' "$data" | awk -F'\t' '$1=="C"{print $2, $3, $4; exit}')
  edits=$1; outward=$2; research=$3

  # The unique candidates, in first-seen order (sorted back by the line number awk kept).
  candidates=$(printf '%s\n' "$data" | awk -F'\t' '$1=="E"||$1=="S"' | sort -t "$TAB" -k2,2n)

  # Resolve each candidate to a folder: an edit path's nearest existing ancestor, a shell
  # place as-is. Pure string ops and a directory-exists test -- no forking, once per
  # unique candidate rather than once per kept line.
  resolved_list=""
  while IFS="$TAB" read -r kindtag nr val; do
    [ -n "$val" ] || continue
    if [ "$kindtag" = "E" ]; then
      d="$val"
      while :; do
        case "$d" in
          */*) d="${d%/*}"; [ -n "$d" ] || d="/" ;;
          *) d="/" ;;
        esac
        [ -d "$d" ] && break
        [ "$d" = "/" ] && break
      done
      folder="$d"
    else
      folder="$val"
    fi
    resolved_list="$resolved_list$kindtag${TAB}$val${TAB}$folder
"
  done <<CAND
$candidates
CAND

  # git rev-parse once per unique folder -- the only forking left, and it no longer scales
  # with the number of kept lines (or even the number of unique candidates).
  folders=$(printf '%s' "$resolved_list" | cut -f3 | sort -u)
  topmap=""
  while IFS= read -r folder; do
    [ -n "$folder" ] || continue
    top=$(git -C "$folder" rev-parse --show-toplevel 2>/dev/null)
    topmap="$topmap""T${TAB}$folder${TAB}$top
"
  done <<FOLD
$folders
FOLD

  # Join candidates back to their resolved top (empty when the folder is not a repo).
  # topmap lines come first so the lookup table is complete before any candidate uses it.
  joined=$(
    { printf '%s' "$topmap"; printf '%s' "$resolved_list"; } |
    awk -F'\t' -v OFS='\t' '
      $1=="T" { top[$2]=$3; next }
      { print $1, $2, top[$3] }
    '
  )

  # Files outside git: unique edit paths with no top, in first-seen order.
  outside=$(printf '%s\n' "$joined" | awk -F'\t' '$1=="E" && $3==""{print $2}')

  # Touched repos, in first-seen order, with whether any row for that repo was an edit.
  topsinfo=$(printf '%s\n' "$joined" | awk -F'\t' '
    $3=="" { next }
    {
      if (!(($3) in seen)) { seen[$3]=1; order[++n]=$3 }
      if ($1=="E") editset[$3]=1
    }
    END { for (i=1;i<=n;i++) { t=order[i]; print t "\t" (t in editset ? "1" : "0") } }
  ')

  # A touched repo is named when it was edited or its fingerprint differs from its stamp.
  named=""; changed=""
  while IFS="$TAB" read -r top wasedited; do
    [ -n "$top" ] || continue
    fp=$(wc_fingerprint "$top" "$vault")
    stamp=$(wc_stamp_path "$top")
    if [ -n "$fp" ] && { [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$fp" ]; }; then
      changed=1
    elif [ "$wasedited" != "1" ]; then
      continue
    fi
    named="${named:+$named, }$(basename "$top") ($(short "$top"))"
  done <<TOPS
$topsinfo
TOPS

  [ "$edits" -gt 0 ] || [ "$outward" -gt 0 ] || [ "$research" -ge 5 ] || [ -n "$changed" ] || return 0

  files=""
  while IFS= read -r place; do
    [ -n "$place" ] && files="${files:+$files, }$(short "$place")"
  done <<FILES
$outside
FILES

  [ -n "$named" ] && add_part "repos with changes: $named"
  [ -n "$files" ] && add_part "files outside git: $files"
  [ "$research" -gt 0 ] && add_part "research calls: $research"
  [ "$outward" -gt 0 ] && add_part "outward calls: $outward"
  when=$(date -r "$first" +%H:%M 2>/dev/null || date -d "@$first" +%H:%M 2>/dev/null)
  [ -n "$when" ] || when=$(date +%H:%M)
  reason="Work since $when not yet in the work chart: $parts. Use the work-chart skill: write rows for each goal-directed stretch (dead ends included), run work-chart-stamp.sh with the repos named, then print the Work line."

  if [ -z "${WC_NO_JQ:-}" ] && command -v jq >/dev/null 2>&1; then
    jq -cn --arg r "$reason" '{decision: "block", reason: $r}'
  else
    printf '{"decision":"block","reason":"%s"}\n' "$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  fi
}

check_stop 2>/dev/null
exit 0
