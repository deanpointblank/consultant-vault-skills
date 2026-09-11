#!/usr/bin/env bash
# Lists every meeting note whose text contains any of the given nouns, one line per matching sentence.
# Usage: ticket-intake-meetings.sh <vault> <noun>...
# Output, sorted by note name:  - [[<note>]]: "<sentence>" (<nouns that matched>)
#   or one line "no meeting note matches: <nouns>". Matching ignores case. The meetings folder
#   comes from folders.meetings in <vault>/Meta/Config.md, default Meetings.
# Exit 1 with one stderr line when the vault or the folder is missing; exit 2 on usage.
set -u
vault="${1:-}"; [ "$#" -ge 1 ] && shift
[ -n "$vault" ] && [ "$#" -ge 1 ] || { printf 'usage: ticket-intake-meetings.sh <vault> <noun>...\n' >&2; exit 2; }
[ -d "$vault" ] || { printf 'vault not found: %s\n' "$vault" >&2; exit 1; }
folder=$(awk '/^folders:/{f=1; next} f && /^[^ ]/{f=0} f && /^  meetings:/{sub(/^  meetings:[ ]*/, ""); gsub(/["'"'"']/, ""); print; exit}' "$vault/Meta/Config.md" 2>/dev/null)
dir="$vault/${folder:-Meetings}"
[ -d "$dir" ] || { printf 'meetings folder not found: %s\n' "$dir" >&2; exit 1; }
perl -CSD -e '
  my ($dir, @nouns) = @ARGV;
  opendir(my $dh, $dir) or exit 1;
  my @files = sort grep { /\.md$/ } readdir($dh);
  closedir $dh;
  my $any = 0;
  for my $f (@files) {
    open(my $fh, "<:encoding(UTF-8)", "$dir/$f") or next;
    my $text = do { local $/; <$fh> };
    close $fh;
    (my $title = $f) =~ s/\.md$//;
    my %seen;
    for my $s (split /\n+|(?<=[.!?])\s+/, $text) {
      $s =~ s/^\s+|\s+$//g;
      next if $s eq "";
      my @hit = grep { index(lc $s, lc $_) >= 0 } @nouns;
      next unless @hit;
      my $line = "- [[$title]]: \"$s\" (" . join(", ", @hit) . ")";
      next if $seen{$line}++;
      print "$line\n";
      $any = 1;
    }
  }
  print "no meeting note matches: " . join(", ", @nouns) . "\n" unless $any;
' "$dir" "$@"
