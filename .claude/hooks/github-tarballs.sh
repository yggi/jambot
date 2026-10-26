#!/bin/sh
# Installs from git what the lockfile fetches as tarballs from
# codeload.github.com (`@yggi/cells`, `@yggi/webmidi`), for a session whose
# proxy refuses those fetches with a 403 while it serves git reads of the same
# public repositories. For each such tarball it fetches the lockfile's commit,
# packs it with `npm pack` (the package's `files`, as pnpm packs a git
# dependency), and points that one `resolution:` line of pnpm-lock.yaml at the
# packed file for one frozen install. The package's id in the lockfile, and so
# its directory under node_modules/.pnpm, stays as it is, so a later
# `pnpm install --frozen-lockfile` finds it installed and fetches nothing. The
# lockfile is put back however the install ends. Exits 1 when a fetch, a pack
# or the install fails. Run in the checkout; session-start.sh runs it.
# JAMBOT_GITHUB stands for https://github.com in its tests.
set -e
github=${JAMBOT_GITHUB:-https://github.com}
work=$(mktemp -d)
cp pnpm-lock.yaml "$work/lock.yaml"
trap 'cp "$work/lock.yaml" pnpm-lock.yaml; rm -rf "$work"' EXIT
codeload='https://codeload\.github\.com/[^/]*/[^/]*/tar\.gz/[0-9a-f]*'
for url in $(grep -o "tarball: $codeload" "$work/lock.yaml" | grep -o "$codeload" | sort -u); do
  path=${url#https://codeload.github.com/}
  repo=${path%/tar.gz/*}
  commit=${path##*/}
  git init -q "$work/$commit"
  git -C "$work/$commit" fetch -q --depth 1 "$github/$repo" "$commit"
  git -C "$work/$commit" checkout -q FETCH_HEAD
  packed=$(cd "$work/$commit" && npm pack --ignore-scripts --silent --pack-destination "$work")
  sed "s|tarball: $url}|tarball: file:$work/$packed}|" pnpm-lock.yaml >"$work/edited.yaml"
  cp "$work/edited.yaml" pnpm-lock.yaml
done
pnpm install --frozen-lockfile --prefer-offline
