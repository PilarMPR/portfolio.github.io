#!/usr/bin/env bash
# L2, the safe-push loop, as a script instead of a rule someone remembers.
#   bash docs/safe-push.sh          verify, then push
#   bash docs/safe-push.sh -n       verify only, never push
#
# The site publishes to main straight from the browser, so origin moves with no
# local action — twice on 2026-08-08 alone, once 17 commits deep. Every step
# below exists because skipping it has cost something. It refuses rather than
# resolves: a rebase is a judgement call about someone else's content (R8), and
# this script will not make it for you.
set -u
cd "$(dirname "$0")/.." || exit 1
export LC_ALL=C
DRY=0; [ "${1:-}" = "-n" ] || [ "${1:-}" = "--dry-run" ] && DRY=1
die() { echo "REFUSED: $*"; exit 1; }

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "main" ] || die "on branch '$branch', not main"

# 1. Nothing uncommitted — otherwise you push a different tree than you tested.
[ -z "$(git status --porcelain)" ] || {
  git status --short
  die "working tree is dirty; commit or stash before pushing"
}

# 2. Has the browser published while you worked? Assume yes until proven no.
git fetch origin --quiet || die "could not fetch origin"
behind=$(git rev-list --count HEAD..origin/main)
ahead=$(git rev-list --count origin/main..HEAD)

[ "$behind" -eq 0 ] || {
  echo "origin/main is $behind commit(s) ahead of you:"
  git log --oneline HEAD..origin/main | sed 's/^/    /'
  echo
  echo "Rebase onto it, then re-run:  git pull --rebase origin main"
  echo "If a page conflicts, the user published while you worked — keep THEIR"
  echo "content and re-apply only your structural change (R1)."
  die "local main is behind origin/main"
}
[ "$ahead" -gt 0 ] || { echo "nothing to push; origin/main is up to date"; exit 0; }

# 3. Static checks, then the real engine. Both must be clean before anything
#    reaches a public site.
bash docs/checks.sh || die "docs/checks.sh failed"
bash docs/smoke.sh  || die "docs/smoke.sh failed"

# 4. R9 — docs/ ships publicly via GitHub Pages. Last look before it does.
#    The bracket classes keep the pattern from matching itself, so scanning a
#    diff that adds this very script does not report the script as a leak. Do
#    not spell any token prefix literally anywhere in this file, comments
#    included — that is exactly how this check first failed.
leaked=$(git diff "origin/main..HEAD" | grep -nE '^\+.*(gh[p]_|github[_]pat_|[/]home[/][a-z]+[/])' || true)
[ -z "$leaked" ] || { echo "$leaked"; die "possible secret or local path in the outgoing diff (R9)"; }

echo "$ahead commit(s) to push:"
git log --oneline origin/main..HEAD | sed 's/^/    /'
git diff --stat origin/main..HEAD | sed 's/^/    /'

[ "$DRY" -eq 0 ] || { echo; echo "dry run — not pushing"; exit 0; }

# 5. Plain push, always. Never a force variant (R8): after a fetch, even
#    --force-with-lease will happily overwrite a browser commit.
git push origin main || die "push rejected — re-run this script; never force"
echo "pushed; origin/main is now $(git rev-parse --short origin/main)"
