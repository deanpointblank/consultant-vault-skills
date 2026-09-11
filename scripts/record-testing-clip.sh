#!/usr/bin/env bash
# Cuts a recorded walkthrough into a login-free video and one GIF per acceptance criterion.
# Usage: record-testing-clip.sh <video.webm> <outdir> <marks>
#   marks: one range per line, "<label> <start-seconds> <end-seconds>"; label "login" ranges
#   are removed from the video and must not overlap any other range; every other label gets a GIF.
# Prints the files written, one per line. Exit 1 with one stderr line on any problem.
set -u
die() { printf '%s\n' "$1" >&2; exit 1; }
in="${1:-}"; out="${2:-}"; marks="${3:-}"
command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1 || die "ffmpeg not found; install it with: brew install ffmpeg"
[ -f "$in" ] || die "input not found: $in"
[ -f "$marks" ] || die "marks file not found: $marks"
mkdir -p "$out" 2>/dev/null || die "cannot create $out"
name=$(basename "$in"); name="${name%.*}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in" 2>/dev/null) || die "cannot read duration of $in"

# read and validate ranges
logins=(); acs=()
while read -r label s e rest; do
  [ -z "${label:-}" ] && continue
  case "$s$e" in *[!0-9.]*|"") die "bad range: $label $s $e";; esac
  awk -v s="$s" -v e="$e" -v d="$dur" 'BEGIN{ if (s+0 >= e+0 || e+0 > d+0.5) exit 1 }' || die "range outside the video: $label $s $e (video is ${dur}s)"
  if [ "$label" = "login" ]; then logins+=("$s $e"); else acs+=("$label $s $e"); fi
done < "$marks"
for ac in "${acs[@]:-}"; do
  [ -z "$ac" ] && continue
  set -- $ac; al=$1; as=$2; ae=$3
  for lg in "${logins[@]:-}"; do
    [ -z "$lg" ] && continue
    set -- $lg; ls=$1; le=$2
    awk -v as="$as" -v ae="$ae" -v ls="$ls" -v le="$le" 'BEGIN{ if (as+0 < le+0 && ls+0 < ae+0) exit 1 }' || die "range $al overlaps a login range"
  done
done

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
written=()

# 1. trimmed video: keep everything outside login ranges, in order
keep=$(printf '%s\n' "${logins[@]:-}" | awk -v d="$dur" 'NF==2{print}' | sort -n | awk -v d="$dur" '
  BEGIN{pos=0}
  {if ($1 > pos) print pos, $1; if ($2 > pos) pos=$2}
  END{if (pos < d) print pos, d}')
i=0; : > "$tmp/list.txt"
while read -r ks ke; do
  [ -z "${ks:-}" ] && continue
  i=$((i+1))
  ffmpeg -v error -y -ss "$ks" -to "$ke" -i "$in" -c:v libvpx -b:v 1M -an "$tmp/part$i.webm" 2>/dev/null || die "ffmpeg failed cutting $ks-$ke"
  printf "file '%s'\n" "$tmp/part$i.webm" >> "$tmp/list.txt"
done <<< "$keep"
[ "$i" -gt 0 ] || die "nothing left after removing login ranges"
if [ "$i" -eq 1 ]; then
  cp "$tmp/part1.webm" "$out/$name.webm" 2>/dev/null || die "cannot write $out/$name.webm"
else
  ffmpeg -v error -y -f concat -safe 0 -i "$tmp/list.txt" -c copy "$out/$name.webm" 2>/dev/null || die "ffmpeg failed joining parts"
fi
written+=("$out/$name.webm")

# 2. one GIF per non-login range, two-pass palette, 800 px wide (never upscaled), 8 fps
for ac in "${acs[@]:-}"; do
  [ -z "$ac" ] && continue
  set -- $ac; al=$1; as=$2; ae=$3
  vf="fps=8,scale='min(800,iw)':-1:flags=lanczos"
  ffmpeg -v error -y -ss "$as" -to "$ae" -i "$in" -vf "$vf,palettegen=stats_mode=diff" -update 1 "$tmp/$al.png" 2>/dev/null || die "ffmpeg failed building palette for $al"
  ffmpeg -v error -y -ss "$as" -to "$ae" -i "$in" -i "$tmp/$al.png" -filter_complex "$vf[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" "$out/$name $al.gif" 2>/dev/null || die "ffmpeg failed writing $al"
  written+=("$out/$name $al.gif")
done

printf '%s\n' "${written[@]}"
exit 0
