#!/bin/sh
# Installs what `pnpm verify` and the music-theory skill need (dependencies,
# Playwright's Chromium for the end-to-end checks, music21), so an agent
# session can test from its first command. Runs when a session starts or
# resumes, since a resumed cloud session may get a fresh container (see
# .claude/settings.json). A no-op in about a second when all is installed.
# Its stdout goes into the agent's context, so it prints one line.
cd "$CLAUDE_PROJECT_DIR" || exit 1
log=$(mktemp)
if ! pnpm install --frozen-lockfile --prefer-offline >"$log" 2>&1; then
  tail -20 "$log" >&2
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
echo "session-start: dependencies installed; $browser; $theory"
