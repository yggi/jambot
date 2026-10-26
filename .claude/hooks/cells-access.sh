#!/bin/sh
# Says whether the install holds the language, `@yggi/cells`, which
# `packages/score` installs from yggi/cells at a tag (`pnpm-lock.yaml`). The
# repository is public, so the install needs no access of its own to it. When
# the package is missing, the install's log, the file named by $1, tells two
# causes apart. A 403 from codeload.github.com is the session's proxy refusing
# GitHub's tarballs, a policy answer that installing again never changes:
# github-tarballs.sh installs them from git instead, and the environment can
# serve them once yggi/cells and yggi/webmidi are among its sources. Any other
# failed fetch was on the network or the proxy, and installing again is the
# fix. Silent when it is installed; otherwise one line on the cause and the
# fix, and exit 1. Run in the checkout; session-start.sh runs it.
[ -f packages/score/node_modules/@yggi/cells/package.json ] && exit 0
if [ -n "$1" ] && grep -q 'ERR_PNPM_FETCH_403.*codeload\.github\.com' "$1"; then
  echo 'session-start: @yggi/cells is not installed: the session'"'"'s proxy refused its tarball from codeload.github.com (403), which installing again does not change, and the install from git (github-tarballs.sh) failed too. Fix: run `sh .claude/hooks/github-tarballs.sh` once git reaches github.com, or attach yggi/cells and yggi/webmidi to the environment'"'"'s sources.'
  exit 1
fi
echo 'session-start: @yggi/cells is not installed: its fetch from yggi/cells, a public repository, failed on the network or the session'"'"'s proxy. Fix: run `pnpm install --frozen-lockfile` again.'
exit 1
