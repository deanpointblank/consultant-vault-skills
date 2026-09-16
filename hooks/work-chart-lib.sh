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

# Print the repos folder name from Meta/Config.md, default Repos. $1 = vault.
# Used only by the old Stop hook; Task 4 removes it.
wc_repos_folder() {
  local f
  f=$(awk '/^folders:/{in_f=1; next} in_f && /^[^ ]/{in_f=0} in_f && /^  repos:/{sub(/^  repos:[ ]*/, ""); gsub(/["'"'"']/, ""); print; exit}' "$1/Meta/Config.md" 2>/dev/null)
  printf '%s' "${f:-Repos}"
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
