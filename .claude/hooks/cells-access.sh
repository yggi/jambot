#!/bin/sh
# Says whether the install holds the language, `@yggi/cells`, which
# `packages/score` installs from the private repository yggi/cells
# (`pnpm-lock.yaml`). A cloud session's git access covers only the
# repositories attached to it, so in a session without yggi/cells the install
# cannot fetch it. Silent when it is installed; otherwise one line on the cause
# and the fix, and exit 1. Run in the checkout; session-start.sh runs it.
[ -f packages/score/node_modules/@yggi/cells/package.json ] && exit 0
echo 'session-start: @yggi/cells is not installed: this session has no access to the private repository yggi/cells (a cloud session'"'"'s git access covers only the repositories attached to it). Fix: attach yggi/cells to the session (add_repo, or start the session with it selected), then run `pnpm install --frozen-lockfile`.'
exit 1
