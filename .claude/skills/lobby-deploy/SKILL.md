---
name: lobby-deploy
description:
  Deploy the lobby server (`apps/lobby`) to Fly.io from a Claude Code session,
  and check that it answers. Use when asked to deploy, redeploy or check the
  hosted lobby, or after a merge into `main` that changes `apps/lobby` or the
  packages it runs (`session`, `theory`, `engine`).
---

# Deploy the lobby to Fly.io

GitHub Actions can't do this while its minutes are used up (#4), so a session
does. The command is the one a workflow would run later, `pnpm lobby:deploy`
(`apps/lobby/fly.toml`, `apps/lobby/Dockerfile`). Everything about the server,
its one machine and its health check, is in
[`docs/briefs/host-mode.md`](../../../docs/briefs/host-mode.md).

## Before you start

The session needs `FLY_API_TOKEN` in its environment: a token from
`fly tokens create deploy -a jambot-lobby`, which the owner stores in the cloud
environment's settings, never in the chat. Check that it is set without printing
it:

```sh
[ -n "$FLY_API_TOKEN" ] && echo set || echo missing
```

If it is missing, stop and say so: the owner adds it to the environment and
starts a new session, since a running one doesn't pick it up. Don't ask for the
token in the chat and don't write it to a file.

A deploy token can deploy the app but not create it. If
`fly status -a jambot-lobby` says the app doesn't exist, the owner runs
`fly apps create jambot-lobby` once, from their own machine; then go on.

## 1. flyctl

```sh
command -v fly || { curl -L https://fly.io/install.sh | sh; export PATH="$HOME/.fly/bin:$PATH"; }
fly version
```

## 2. From `main`, verified

Deploy what `main` holds, as `pnpm pages deploy` does.

```sh
git fetch -q origin main
git status --porcelain                                     # empty
git merge-base --is-ancestor HEAD origin/main && echo ok   # ok
pnpm install --frozen-lockfile
pnpm verify
```

If HEAD isn't on `origin/main`, check out `origin/main` first. Don't deploy a
branch that hasn't been merged; the lobby would then differ from what the tests
on `main` hold.

## 3. Deploy

From the repository's root:

```sh
pnpm lobby:deploy
```

It builds the container on Fly's builders and starts one machine. `--ha=false`
in the script keeps it to one, and `fly.toml` never stops it: a session lives in
that machine's memory.

## 4. Check it

```sh
fly status -a jambot-lobby
curl -fsS https://jambot-lobby.fly.dev/health   # {"ok":true,"sessions":0,"sockets":0}
```

`ok` must be `true`, and `fly status` must show one machine, started, with its
check passing. Report what the two commands printed. If the deploy or the check
fails, say which step and show its output; `fly logs -a jambot-lobby --no-tail`
has the server's side. Don't retry in a loop.

## After the lobby, the site

The Pages build names this lobby by default (`tooling/pages.ts`, from the app
name in `fly.toml`). When the change is one the site should show, run
`pnpm pages deploy` after this.
