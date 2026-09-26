#!/bin/sh
# Installs what `pnpm verify` and the music-theory skill need, so an agent
# session can test from its first command. Runs at session start (see
# .claude/settings.json); a no-op when everything is already installed.
set -e
cd "$CLAUDE_PROJECT_DIR"
pnpm install --frozen-lockfile --prefer-offline
# music21 for the music-theory skill: uv caches it on the first run.
if command -v uv >/dev/null; then
  uv run -q .claude/skills/music-theory/oracle.py selftest >/dev/null ||
    echo 'music-theory: the music21 selftest failed; see its SKILL.md' >&2
fi
