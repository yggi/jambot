# Memory

Persistent facts and a cheatsheet. Start here, and follow the links for depth.
A fact goes next to what it describes: a doc comment in the module, or a line in the module's header.
What doesn't fit there goes to the topic file below, and this page keeps only the cheatsheet and the pointers.
It is read at the start of every session, so it stays small (`tooling/reading-list.ts` caps it and `AGENTS.md`).

## Cheatsheet

```sh
pnpm install
pnpm dev          # web app with hot reload; the prototype is at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm verify       # lint, format check, typecheck, tests, build: run before pushing
pnpm e2e          # the app in Chromium: when what it plays, or when, changes
pnpm lobby        # the lobby server for sessions across machines, on 8787
pnpm lobby:deploy # the lobby server to Fly.io (needs flyctl and FLY_API_TOKEN; the lobby-deploy skill)
pnpm ratchet      # the catalogues over main's history: evidence, rules, aliases
pnpm pages deploy # publish main to GitHub Pages, and check the live site
```

- Agent sessions (Claude Code) install dependencies and Playwright's Chromium, warm music21 and fetch `origin/main` and their own branch at start, resume and compaction through `.claude/hooks/session-start.sh`.
  It also says how far the branch is behind `origin/main`, whether main already holds it, and whether its remote branch moved (`branch-status.sh`).
  And `.claude/settings.json` allows the checks and the music-theory scripts without a prompt.
  Other agents run `pnpm install --frozen-lockfile` first.
- Every `git push` of a branch runs `pnpm verify` first, through git's pre-push hook (`.githooks/pre-push`, about 85 s, the tests 60 s of it), and is blocked if it fails.
  `pnpm install` and `session-start.sh` set `core.hooksPath` to it.
  It refuses a dirty tracked tree and a commit other than the one checked out, since it checks the tree, so commit before pushing.
  A tree that passed is remembered, so a retried push does not rerun it.
  A failed run's whole output stays in the git directory, as `jambot-verify-failed.log`, which the message names.
  A diff against `origin/main` of only `*.md` files runs the format check and the tooling tests alone.
  The GitHub MCP tools that write files (`push_files`, `create_or_update_file`, `delete_file`) skip git, and so the hook: `.claude/settings.json` denies them.
- To review a pull request, use the `review-pr` skill: `.claude/skills/review-pr/prepare.sh <number>` fetches it and `main`, checks it out in its own worktree and runs `pnpm verify` there.
  It says when `main` has moved on and where a merge would conflict, and `--from <commit>` scopes it to part of a pull request.
  A branch behind `main` may not have the script yet: pipe `main`'s copy from `git show origin/main:.claude/skills/review-pr/prepare.sh` to `sh -s --`.
  `git fetch origin pull/<n>/head` works through the session proxy.

## Cell studio, the sister project

- [yggi/cell-studio](https://github.com/yggi/cell-studio) started as a spike out of Jambot, to research and define the language: cells, on top of Strudel.
- The direction is to bring the two back together for eternal jam sessions: cells as the score language, Cell studio's engine as the player, Jambot as the composer, and a shared repository of cell fragments ([brief](briefs/eternal-jam.md)).
- Until the handshake (#309) settles the syntax, a new score form (#287, #306, #275, #265) is checked against cells first, and its meaning is kept rather than a spelling of its own.
- Its words and Jambot's part in places (`^`, `_`, `shift`, `cycle=`, Euclid's rotation): read [`cell-studio`](memory/cell-studio.md) before porting a form either way.

## Topics

Read a topic file when you work in its area.
Each is a page of facts, one sentence to a line, and `docs/INDEX.md` lists them.

- [`engine`](memory/engine.md): the levels, the band, the Muse, the style, swing and the clock.
- [`web-app`](memory/web-app.md): the screen, its components and what the end-to-end checks rely on.
- [`session`](memory/session.md): host and client mode, the fault kit, the timing panel.
- [`midi`](memory/midi.md): ports, panic and the drum note maps.
- [`theory`](memory/theory.md): reading names, the helix, Strudel, music21 and tonal.
- [`score-language`](memory/score-language.md): the score's layers, drums, meter and pitch syntax.
- [`analyzer`](memory/analyzer.md): the parser and its ladder.
- [`testing`](memory/testing.md): showing a gate fire, the checks behind the house rules, and running them beside agents.
- [`ratchet`](memory/ratchet.md): the method's catalogues and pawl.
- [`prototype`](memory/prototype.md): running the prototype and what it does.
- [`repository-and-ci`](memory/repository-and-ci.md): CI, Pages, toolchain pins and the license.
- [`terms`](memory/terms.md): root node, rendering node, dough.
- [`cell-studio`](memory/cell-studio.md): the sister project, how to read it, and where its words and Jambot's correspond and part.
- [`hardware`](memory/hardware.md): the live setup.
