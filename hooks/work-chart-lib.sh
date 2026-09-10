#!/usr/bin/env bash
# Shared by work-chart-stop.sh and work-chart-stamp.sh. Source it; do not run it.

# Print the vault path, or nothing. $OBSIDIAN_VAULT first, then the pointer file.
wc_vault() {
  local v="${OBSIDIAN_VAULT:-}"
  if [ -z "$v" ] && [ -f "$HOME/.config/vault-skills/vault-path" ]; then
    v=$(head -n 1 "$HOME/.config/vault-skills/vault-path")
  fi
  [ -n "$v" ] && [ -d "$v" ] && printf '%s' "$v"
}

# Print the repos folder name from Meta/Config.md, default Repos. $1 = vault.
wc_repos_folder() {
  local f
  f=$(awk '/^folders:/{in_f=1; next} in_f && /^[^ ]/{in_f=0} in_f && /^  repos:/{sub(/^  repos:[ ]*/, ""); gsub(/["'"'"']/, ""); print; exit}' "$1/Meta/Config.md" 2>/dev/null)
  printf '%s' "${f:-Repos}"
}

# Print a fingerprint of the working tree state, or nothing when the tree is clean. $1 = repo top.
wc_fingerprint() {
  local out
  out=$( { git -C "$1" status --porcelain; git -C "$1" diff --stat; git -C "$1" diff --cached --stat; } 2>/dev/null )
  [ -n "$out" ] && printf '%s' "$out" | shasum | cut -d' ' -f1
}

# Print the stamp file path for a repo. $1 = repo top.
wc_stamp_path() {
  printf '%s/.config/vault-skills/work-stamp/%s' "$HOME" "$(printf '%s' "$1" | shasum | cut -d' ' -f1)"
}
