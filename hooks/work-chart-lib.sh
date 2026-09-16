#!/usr/bin/env bash
# Shared by the work-chart hooks and the stamp script. Source it; do not run it.

# Print the vault path, or nothing. $OBSIDIAN_VAULT first, then the pointer file.
wc_vault() {
  local v="${OBSIDIAN_VAULT:-}"
  if [ -z "$v" ] && [ -f "$HOME/.config/vault-skills/vault-path" ]; then
    IFS= read -r v < "$HOME/.config/vault-skills/vault-path"
  fi
  [ -n "$v" ] && [ -d "$v" ] && printf '%s' "$v"
}

# Print the work roots from Meta/Config.md, one per line, with a leading ~ expanded.
# Prints the vault itself when work_roots is missing or empty. $1 = vault.
wc_roots() {
  local r found=""
  while IFS= read -r r; do
    case "$r" in
      "~") r="$HOME" ;;
      "~/"*) r="$HOME/${r#\~/}" ;;
    esac
    [ "$r" = "/" ] || r="${r%/}"
    [ -n "$r" ] || continue
    printf '%s\n' "$r"; found=1
  done <<EOF
$(awk 'NR==1 && /^---[ \t]*$/ {fm=1; next}
  fm && /^---[ \t]*$/ {exit}
  /^work_roots:/ {in_r=1; next}
  in_r && /^[ \t]*$/ {next}
  in_r && /^[ \t]*-[ \t]/ {sub(/^[ \t]*-[ \t]*/, ""); sub(/[ \t]+$/, ""); gsub(/["'"'"']/, ""); print; next}
  in_r {exit}' "$1/Meta/Config.md" 2>/dev/null)
EOF
  [ -n "$found" ] || printf '%s\n' "$1"
}

# Succeed when path $1 is folder $2 or inside it. /a/b2 is not inside /a/b.
wc_under() {
  local p="${1%/}" d="${2%/}"
  [ -n "$p" ] && [ -n "$d" ] || return 1
  case "$p" in
    "$d"|"$d"/*) return 0 ;;
  esac
  return 1
}

# Succeed when path $1 is under any work root. $2 = vault.
wc_in_roots() {
  local r
  [ -n "${1:-}" ] || return 1
  while IFS= read -r r; do
    wc_under "$1" "$r" && return 0
  done <<EOF
$(wc_roots "$2")
EOF
  return 1
}

# Print a fingerprint of a repo's uncommitted state, or nothing when it is clean.
# $1 = repo top, $2 = vault (optional). When the vault sits inside the repo, its folder is
# left out, so writing notes never changes the fingerprint. A repo that is the vault: nothing.
wc_fingerprint() {
  local top="$1" vault="${2:-}" vtop prefix out
  set -- -- .
  if [ -n "$vault" ] && vtop=$(git -C "$vault" rev-parse --show-toplevel 2>/dev/null) && [ "$vtop" = "$top" ]; then
    prefix=$(git -C "$vault" rev-parse --show-prefix 2>/dev/null)
    prefix="${prefix%/}"
    [ -n "$prefix" ] || return 0
    set -- -- . ":(exclude)$prefix"
  fi
  out=$( { git -C "$top" status --porcelain "$@"; git -C "$top" diff --stat "$@"; git -C "$top" diff --cached --stat "$@"; } 2>/dev/null )
  [ -n "$out" ] && printf '%s' "$out" | shasum | cut -d' ' -f1
}

# Print the stamp file path for a repo. $1 = repo top.
wc_stamp_path() {
  printf '%s/.config/vault-skills/work-stamp/%s' "$HOME" "$(printf '%s' "$1" | shasum | cut -d' ' -f1)"
}

# Print the activity log path for a session. $1 = session_id.
wc_log_path() {
  printf '%s/.config/vault-skills/work-log/%s.tsv' "$HOME" "$(printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_')"
}

# Print six lines read from hook JSON $1: session_id, cwd, tool_name, touched path
# (tool_input file_path, then notebook_path, then path), stop_hook_active (true/false),
# and the tool_input.command text, sanitized and with escaped quotes (\") unescaped.
# Callers pass the sixth line to wc_runs_stamp to tell a call that runs
# work-chart-stamp.sh from one that merely mentions it. Uses jq when present (and
# WC_NO_JQ is unset), else sed.
wc_hook_fields() {
  if [ -z "${WC_NO_JQ:-}" ] && command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -r '
      def s: if . == null then "" else tostring | gsub("[\n\r\t]"; " ") end;
      (.session_id | s),
      (.cwd | s),
      (.tool_name | s),
      ((.tool_input.file_path? // .tool_input.notebook_path? // .tool_input.path?) | s),
      (.stop_hook_active == true | tostring),
      ((.tool_input.command? // "") | s)
    ' 2>/dev/null
    return 0
  fi
  local k v p="" cmd
  for k in session_id cwd tool_name; do
    printf '%s\n' "$1" | sed -n "s/.*\"$k\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1
  done
  for k in file_path notebook_path path; do
    v=$(printf '%s\n' "$1" | sed -n "s/.*\"$k\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1)
    [ -n "$v" ] && { p="$v"; break; }
  done
  printf '%s\n' "$p"
  if printf '%s' "$1" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then echo true; else echo false; fi
  # The command value can hold escaped quotes (\"); match past them, then unescape.
  cmd=$(printf '%s\n' "$1" | sed -n -E 's/.*"command"[[:space:]]*:[[:space:]]*"((\\.|[^"\\])*)".*/\1/p' | head -n 1)
  printf '%s\n' "${cmd//\\\"/\"}"
}

# Print the log kind for a tool name: edit, outward, research, shell, or nothing.
# Case-insensitive. For MCP tools only the verb the last name part starts with counts,
# so getTransitionsForJiraIssue and list_labels are research, editJiraIssue is outward.
wc_kind() {
  local last="${1##*__}" kind=""
  shopt -s nocasematch
  case "$1" in
    Edit|Write|NotebookEdit) kind=edit ;;
    Read|Grep|Glob|WebFetch|WebSearch) kind=research ;;
    Bash) kind=shell ;;
    mcp__*)
      case "$last" in
        create*|add*|send*|post*|comment*|update*|edit*|write*|save*|copy*|move*|transition*|reply*|respond*|forward*|share*|delete*|trash*|label*|unlabel*|mark*|unmark*|apply*)
          kind=outward ;;
        get*|search*|list*|fetch*|query*|read*|lookup*|find*)
          kind=research ;;
      esac ;;
  esac
  shopt -u nocasematch
  [ -n "$kind" ] && printf '%s\n' "$kind"
  return 0
}

# Print the nearest folder at or above $1 that holds a .git entry, without running git.
# Fast enough for the log hook; the Stop hook resolves the result with git.
wc_git_top() {
  local d="${1%/}"
  while [ -n "$d" ]; do
    [ -e "$d/.git" ] && { printf '%s' "$d"; return 0; }
    d="${d%/*}"
  done
  return 1
}

# Succeed when command $1 runs work-chart-stamp.sh, not merely mentions it (as an
# argument to grep, git add, and the like). Splits the command into segments on
# && || and ;. A segment runs the script when, after trimming leading spaces, its
# first word -- or the word after a leading bash or sh -- ends in
# work-chart-stamp.sh, with surrounding single or double quotes allowed.
wc_runs_stamp() {
  local cmd="$1" seg first rest word
  cmd="${cmd//&&/;}"
  cmd="${cmd//||/;}"
  cmd="${cmd//;/$'\n'}"
  while IFS= read -r seg; do
    seg="${seg#"${seg%%[! ]*}"}"
    [ -n "$seg" ] || continue
    first="${seg%% *}"
    case "$seg" in
      *" "*) rest="${seg#* }" ;;
      *) rest="" ;;
    esac
    case "$first" in
      \"*\") first="${first#\"}"; first="${first%\"}" ;;
      \'*\') first="${first#\'}"; first="${first%\'}" ;;
    esac
    case "$first" in
      bash|sh)
        rest="${rest#"${rest%%[! ]*}"}"
        word="${rest%% *}" ;;
      *)
        word="$first" ;;
    esac
    case "$word" in
      \"*\") word="${word#\"}"; word="${word%\"}" ;;
      \'*\') word="${word#\'}"; word="${word%\'}" ;;
    esac
    case "$word" in
      *work-chart-stamp.sh) return 0 ;;
    esac
  done <<EOF
$cmd
EOF
  return 1
}
