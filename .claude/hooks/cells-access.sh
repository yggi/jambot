#!/bin/sh
# Says whether the install holds the language, `@yggi/cells`, which
# `packages/score` installs from yggi/cells at a tag (`pnpm-lock.yaml`). The
# repository is public, so the install needs no access of its own to it: when
# the package is missing, its fetch failed on the way, on the network or the
# session's proxy, and installing again is the fix. Silent when it is
# installed; otherwise one line on the cause and the fix, and exit 1. Run in
# the checkout; session-start.sh runs it.
[ -f packages/score/node_modules/@yggi/cells/package.json ] && exit 0
echo 'session-start: @yggi/cells is not installed: its fetch from yggi/cells, a public repository, failed on the network or the session'"'"'s proxy. Fix: run `pnpm install --frozen-lockfile` again.'
exit 1
