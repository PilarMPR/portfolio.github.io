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

# check-syntax (R12) — site.js is one flat script with no module graph, so a
# syntax error takes the whole site down and nothing else here would notice.
# Compile it without running it: `new Function(src)` parses but never executes,
# so the browser globals site.js touches at load are irrelevant. Uses whichever
# JS engine is on the box, and says so out loud when there is none rather than
# passing quietly on a check that never ran.
if command -v node >/dev/null 2>&1; then
  node --check shared/site.js || fail=1
elif command -v gjs >/dev/null 2>&1; then
  gjs -c '
    const [ok, bytes] = imports.gi.GLib.file_get_contents("shared/site.js");
    try { new Function(new TextDecoder().decode(bytes)); }
    catch (e) { print("SYNTAX ERROR shared/site.js: " + e.message); imports.system.exit(1); }
  ' || fail=1
else
  echo "SKIPPED syntax check: no node or gjs on PATH — shared/site.js unparsed"
fi

# check-citations (R11) — every `symbol` (shared/site.js:NNN) in CLAUDE.md still
# lands on a line containing that symbol. site.js is machine-rewritten on every
# publish, so a citation written today silently points at unrelated code once
# anything above it grows; on 2026-08-07 a single batch of commits invalidated
# 18 of 19 at once. Only CLAUDE.md is checked — docs/backlog.md pins its numbers
# to a stated commit and is expected to drift.
#
# Pairing: a citation passes if ANY backticked symbol on its line appears at the
# cited line. Binding each number to one specific symbol reads better but is not
# decidable from prose — "one tree on top of `HEAD` ... hardcoded in `GH`
# (site.js:1649)" would bind HEAD. Accepting any symbol on the line costs a
# little precision (a citation landing on its neighbour's line still passes) and
# keeps what matters: when site.js grows, none of the symbols match and it fails.
cites=$(awk '
  NR == FNR { src[FNR] = $0; n = FNR; next }
  index($0, "shared/site.js") == 0 { next }
  {
    ns = 0; nc = 0; delete sym; delete cite
    s = $0
    while (match(s, /`[^`]+`|shared\/site\.js:[0-9]+|:[0-9]+/)) {
      tok = substr(s, RSTART, RLENGTH)
      s   = substr(s, RSTART + RLENGTH)
      if (substr(tok, 1, 1) == "`") {
        t = substr(tok, 2, length(tok) - 2)
        sub(/\(\)$/, "", t)          # `foo()` in prose vs function foo(args) in code
        if (length(t) > 1 && t !~ /^[0-9]+$/) sym[++ns] = t
      } else {
        t = tok; sub(/^.*:/, "", t); cite[++nc] = t + 0
      }
    }
    for (i = 1; i <= nc; i++) {
      ln = cite[i]
      if (ln < 1 || ln > n) {
        printf "CITATION CLAUDE.md:%d -> site.js:%d does not exist (%d lines)\n", FNR, ln, n
        continue
      }
      hit = 0
      for (j = 1; j <= ns; j++) if (index(src[ln], sym[j])) { hit = 1; break }
      if (!hit) {
        list = ""
        for (j = 1; j <= ns; j++) list = list (j > 1 ? ", " : "") sym[j]
        printf "CITATION CLAUDE.md:%d -> site.js:%d mentions none of [%s]; has: %s\n",
               FNR, ln, list, substr(src[ln], 1, 55)
      }
    }
  }
' shared/site.js CLAUDE.md)
if [ -n "$cites" ]; then printf '%s\n' "$cites"; fail=1; fi

# check-counts (R7, R11) — CLAUDE.md quotes figures about the codebase, and those
# rot exactly like line numbers do: a browser publish rewrote shared/theme.css on
# 2026-08-08 and R7's hex count was wrong within minutes of being written. Each
# number below is recomputed and matched against the sentence that states it, so
# the doc cannot quietly drift from the code it describes.
count_says() {   # count_says <actual> <fixed string CLAUDE.md must contain> <what>
  grep -qF "$2" CLAUDE.md || { echo "COUNT $3 is $1, CLAUDE.md does not say so (expected: \"$2\")"; fail=1; }
}
hexp=$(grep -oE '#[0-9a-fA-F]{3,8}\b' shared/portfolio.css | wc -l)
hext=$(grep -oE '#[0-9a-fA-F]{3,8}\b' shared/theme.css | wc -l)
vars=$(grep -oE 'var\(--' shared/portfolio.css | wc -l)
ncit=$(awk 'index($0,"shared/site.js"){s=$0
  while (match(s, /shared\/site\.js:[0-9]+|:[0-9]+/)) { c++; s = substr(s, RSTART + RLENGTH) }} END{print c+0}' CLAUDE.md)
count_says "$hexp" "$hexp literals already survive in \`portfolio.css\`" "portfolio.css hex literals"
count_says "$vars" "against $vars \`var()\` uses"                        "portfolio.css var() uses"
count_says "$hext" "plus $hext in \`shared/theme.css\`"                  "theme.css hex literals"
count_says "$ncit" "re-resolves all $ncit against the file"              "site.js citations in CLAUDE.md"
nsil=$(grep -cE 'catch *\([a-z]*\) *\{ *\}' shared/site.js)
count_says "$nsil" "$nsil silent catches remain elsewhere in the file"   "silent catches in site.js"

exit $fail
