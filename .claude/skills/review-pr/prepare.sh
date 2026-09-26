#!/bin/sh
# Prepares a pull request for review: fetches it and main, checks it out in
# its own worktree, installs, runs `pnpm verify` there, and `pnpm e2e` when
# there are end-to-end tests, and prints a summary: the commits, every
# changed file, both results with their test counts, and whether main has
# moved on since the pull request branched, with the files a merge would
# conflict in. The worktree stays for reading and probing; the summary says
# how to remove it.
#
# Usage:
#   prepare.sh <pull request number | branch> [--from <commit>] [worktree directory]
# --from scopes the commits and the diff to what the pull request did after
# <commit>, leaving out what came in from main, to review part of a pull
# request. Verify still runs on the whole head.
#
# A checkout without this script (a branch behind main) can run main's copy:
#   git show origin/main:.claude/skills/review-pr/prepare.sh | sh -s -- <args>
# JAMBOT_VERIFY replaces install and verify, and JAMBOT_E2E the end-to-end
# tests, for tooling/review-pr.test.ts.
set -u
usage='usage: prepare.sh <pull request number | branch> [--from <commit>] [worktree directory]'
target=${1:?$usage}
shift
from=''
if [ "${1:-}" = --from ]; then
  from=${2:?$usage}
  shift 2
fi
repo=$(git rev-parse --show-toplevel) || exit 1
cd "$repo" || exit 1

case $target in
  *[!0-9]*) source="$target" ref="refs/remotes/origin/$target" name=$(printf %s "$target" | tr / -) ;;
  *) source="pull/$target/head" ref="refs/remotes/origin/pr/$target" name="pr-$target" ;;
esac
dir=${1:-${TMPDIR:-/tmp}/jambot-review-$name}

git fetch -q origin main:refs/remotes/origin/main "+$source:$ref" || {
  echo "prepare: could not fetch $source or main" >&2
  exit 1
}
if [ -e "$dir" ]; then
  git -C "$dir" checkout -q --detach "$ref" || exit 1
else
  git worktree add -q --detach "$dir" "$ref" || exit 1
fi

log="$dir.verify.log"
cd "$dir" || exit 1
if sh -c "${JAMBOT_VERIFY:-pnpm install --frozen-lockfile --prefer-offline && pnpm verify}" >"$log" 2>&1; then
  verdict='passes'
else
  verdict='FAILS'
fi
unit=$(grep -E '^ +Tests ' "$log" | tail -1 | sed 's/^ *//; s/  */ /g')

# The end-to-end tests, when the repository has them, run apart from verify.
e2e=${JAMBOT_E2E:-}
[ -z "$e2e" ] && grep -q '"e2e":' package.json 2>/dev/null && e2e='pnpm e2e'
if [ -n "$e2e" ]; then
  if sh -c "$e2e" >>"$log" 2>&1; then e2e_verdict='passes'; else e2e_verdict='FAILS'; fi
  # Playwright's summary lines start with a count.
  e2e_tests=$(grep -E '^ +[0-9]+ (passed|failed|flaky)' "$log" | sed 's/^ *//' | paste -sd ';' - | sed 's/;/; /g')
fi

base=$(git merge-base origin/main HEAD)
behind=$(git rev-list --count "$base..origin/main")
echo "Reviewing $target at $(git rev-parse --short HEAD), in $dir"
echo "Base: origin/main at $(git rev-parse --short origin/main); merge base $(git rev-parse --short "$base")"
if [ "$behind" -gt 0 ]; then
  s=s
  [ "$behind" -eq 1 ] && s=''
  if conflicts=$(git merge-tree --write-tree --name-only --no-messages origin/main HEAD); then
    echo "Behind main by $behind commit$s; merges with main cleanly"
  else
    echo "Behind main by $behind commit$s; conflicts with main in: $(echo "$conflicts" | tail -n +2 | paste -sd ' ' -)"
  fi
fi
commits="$base..HEAD"
range="$base...HEAD"
if [ -n "$from" ]; then
  # Main may have been merged in since <commit>: leave its commits out, and
  # diff against <commit> with main merged into it. Where that merge
  # conflicts, limit the diff to the files the scoped commits touched.
  commits="HEAD ^$from ^origin/main"
  if scoped=$(git merge-tree --write-tree --name-only --no-messages "$from" origin/main); then
    range="$(echo "$scoped" | head -1) HEAD"
  else
    touched="$log.touched"
    # shellcheck disable=SC2086
    git log --format= --name-only $commits | sort -u >"$touched"
    both=$(git diff --name-only "$(git merge-base "$from" origin/main)" origin/main |
      sort | comm -12 - "$touched" | paste -sd ' ' -)
    range="$from HEAD -- $(paste -sd ' ' - <"$touched")"
    rm -f "$touched"
    echo "Note: $(git rev-parse --short "$from") does not merge with main cleanly, so the diff is limited to the files these commits touched, and may show main's changes in: ${both:-none of them}"
  fi
  # shellcheck disable=SC2086
  echo "Scope: $(git rev-parse --short "$from")..HEAD ($(git rev-list --count $commits) of $(git rev-list --count "$base..HEAD") commits)"
fi
echo
# shellcheck disable=SC2086
git log --oneline $commits
echo
# shellcheck disable=SC2086
git diff --stat=100 $range
echo
echo "pnpm verify $verdict${unit:+ ($unit)}; full log: $log"
[ -n "$e2e" ] && echo "pnpm e2e $e2e_verdict${e2e_tests:+ ($e2e_tests)}"
[ "$verdict" = passes ] && [ "${e2e_verdict:-passes}" = passes ] || tail -30 "$log"
echo
echo "Diff: git -C $dir diff $range"
echo "Done: git worktree remove --force $dir && rm -f $log"
