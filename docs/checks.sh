#!/usr/bin/env bash
# Zero-dependency sanity checks for the portfolio site. No output = all clear.
# Run from the repo root:  bash docs/checks.sh
# See the "Working agreement" section of CLAUDE.md for what these enforce.
set -u
cd "$(dirname "$0")/.." || exit 1
export LC_ALL=C
fail=0

# check-handlers (R2) — every function called from an on*= attribute, in markup
# or in a site.js template literal, is actually declared in site.js. These names
# exist only as strings; nothing else in this repo can catch a missed rename.
while read -r fn; do
  grep -qE "(function|const|let|var)[[:space:]]+$fn\b" shared/site.js \
    || { echo "UNDECLARED HANDLER: $fn"; fail=1; }
done < <(grep -ohE '\bon[a-z]+="[^"]*"' index.html projects/*.html shared/site.js \
  | grep -oE '[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*\(' | tr -d ' (' | sort -u)

# check-sentinels (R3) — every page keeps the elements site.js grabs at load
# with no null check. Removing one throws and kills the whole script.
for f in index.html projects/*.html; do
  for id in cursor nav nav-logo fmt-bar lightbox de-toast; do
    grep -q "id=\"$id\"" "$f" || { echo "MISSING #$id in $f"; fail=1; }
  done
done

exit $fail
