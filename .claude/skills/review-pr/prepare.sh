#!/bin/sh
# Prepares a pull request for review: fetches it and main, checks it out in
# its own worktree, installs, runs `pnpm verify` there, and prints a summary.
# Usage: prepare.sh <pull request number | branch> [worktree directory]
# The worktree stays for reading and probing; the summary says how to
# remove it.
set -u
target=${1:?usage: prepare.sh <pull request number | branch> [worktree directory]}
repo=$(git rev-parse --show-toplevel) || exit 1
cd "$repo" || exit 1

case $target in
  *[!0-9]*) source="$target" ref="refs/remotes/origin/$target" name=$(printf %s "$target" | tr / -) ;;
  *) source="pull/$target/head" ref="refs/remotes/origin/pr/$target" name="pr-$target" ;;
esac
dir=${2:-${TMPDIR:-/tmp}/jambot-review-$name}

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
if pnpm install --frozen-lockfile --prefer-offline >"$log" 2>&1 && pnpm verify >>"$log" 2>&1; then
  verdict='passes'
else
  verdict='FAILS'
fi
tests=$(grep -E '^ +Tests ' "$log" | tail -1 | sed 's/^ *//; s/  */ /g')

base=$(git merge-base origin/main HEAD)
echo "Reviewing $target at $(git rev-parse --short HEAD), in $dir"
echo "Base: origin/main at $(git rev-parse --short origin/main); merge base $(git rev-parse --short "$base")"
echo
git log --oneline "$base..HEAD"
echo
git diff --compact-summary "$base...HEAD"
echo
echo "pnpm verify $verdict${tests:+ ($tests)}; full log: $log"
[ "$verdict" = passes ] || tail -30 "$log"
echo
echo "Diff: git -C $dir diff $base...HEAD"
echo "Done: git worktree remove --force $dir && rm -f $log"
