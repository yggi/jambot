#!/bin/sh
# Installs what `pnpm verify`, `pnpm e2e` and the music-theory skill need
# (dependencies, Playwright's Chromium, music21), so an agent session can
# test from its first command, and fetches `origin/main` and the session's
# own branch, so `git diff origin/main...` works for a review or a pull
# request and the checkout's standing is known (branch-status.sh). Runs when a
# session starts, resumes or compacts, since a resumed cloud session may get a
# fresh container and a compacted one has lost what it read (see
# .claude/settings.json). A no-op in about a second when all is installed.
# Its stdout goes into the agent's context, so it prints two lines, and a third
# first when the install lacks @yggi/cells (cells-access.sh).
cd "$CLAUDE_PROJECT_DIR" || exit 1
# The pre-push hook (.githooks/pre-push); `pnpm install` sets it too.
git config core.hooksPath .githooks
log=$(mktemp)
installed=1
if ! pnpm install --frozen-lockfile --prefer-offline >"$log" 2>&1; then
  tail -20 "$log" >&2
  installed=
fi
# The language, @yggi/cells, comes from a private repository the session may
# not reach. That cause gets its own line on stdout, which the agent reads, and
# the session goes on; any other failed install stops here.
deps='dependencies installed'
if ! sh "$(dirname "$0")/cells-access.sh"; then
  deps='dependencies incomplete, @yggi/cells missing (the line above)'
elif [ -z "$installed" ]; then
  echo 'session-start: pnpm install failed; run it by hand before pnpm verify' >&2
  exit 1
fi
# Chromium for `pnpm e2e`. A no-op where the pinned version's browser is
# installed already, as in the cloud sessions.
browser='chromium ready'
if ! (cd apps/web && pnpm exec playwright install chromium) >"$log" 2>&1; then
  tail -5 "$log" >&2
  browser='chromium not installed, so pnpm e2e fails: run `cd apps/web && pnpm exec playwright install chromium`'
fi
theory='music21 not installed (no uv)'
# music21 for the music-theory skill: uv caches it on the first run.
if command -v uv >/dev/null; then
  if uv run -q .claude/skills/music-theory/oracle.py selftest >"$log" 2>&1; then
    theory='music21 ready'
  else
    theory='music21 selftest failed, see .claude/skills/music-theory/SKILL.md'
  fi
fi
rm -f "$log"
# A cloud checkout may hold only its own branch. The explicit refspec makes
# origin/main exist even then. Failing to fetch is reported, not fatal.
base='origin/main fetched'
if ! timeout 30 git fetch -q origin main:refs/remotes/origin/main 2>/dev/null; then
  base='origin/main not fetched'
fi
branch=$(git symbolic-ref -q --short HEAD)
if [ -n "$branch" ]; then
  timeout 30 git fetch -q origin "$branch:refs/remotes/origin/$branch" 2>/dev/null
fi
boot=$(cat AGENTS.md docs/MEMORY.md | wc -c)
echo "session-start: $deps; $browser; $theory; $base"
echo "$(sh "$(dirname "$0")/branch-status.sh"). Read AGENTS.md, then docs/MEMORY.md ($((boot / 1024)) KB together)."
