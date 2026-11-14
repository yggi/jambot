# Repository, CI and license

How the repository is built, gated, deployed and licensed.

## Repository and CI

- The repository is public, so GitHub's standard runners cost it nothing; the family's rule for spending Actions minutes, [CI-BUDGET.md](https://github.com/yggi/music-commons/blob/main/CI-BUDGET.md) in music-commons, still switches a private repository's runs off (#4).
  So the heavy runs (the end-to-end checks, the soaks) go to Actions, where each has a runner to itself, rather than queue for the shared machine's lock (#471).
- Agent sessions (Claude Code) install dependencies and Playwright's Chromium, warm music21 and fetch `origin/main` and their own branch at start, resume and compaction through `.claude/hooks/session-start.sh`.
  It also says how far the branch is behind `origin/main`, whether main already holds it, and whether its remote branch moved (`branch-status.sh`).
  And `.claude/settings.json` allows the checks and the music-theory scripts without a prompt.
  When the install lacks `@yggi/cells`, its fetch from the public yggi/cells failed on the network or the proxy, and the hook's first line says so: run `pnpm install --frozen-lockfile` again.
  The hook installs only the checkout the session opened; `pnpm verify` installs first where `node_modules` is missing, as in a git worktree, and says so.
  It installs first, too, where the install is not what `pnpm-lock.yaml` says (`installOf` in `tooling/verify.ts`: pnpm's copy of the lockfile it installed from, `node_modules/.pnpm/lock.yaml`, differs), as after `main` moved the cells pin under a checkout that stayed open: tests then fail on numbers read off the older cells, with nothing wrong in the code.
- The gate is `pnpm verify`, where it costs no minutes: every `git push` of a branch runs it first, through git's pre-push hook (`.githooks/pre-push`), and is blocked if it fails.
  Its tests take the machine's lock for heavy runs (`tooling/heavy.ts`, shared with `pnpm e2e`, the soaks and `pnpm test:slow`), so a second verify on the machine, from another worktree, waits for the first rather than time it out, and says every minute who holds the lock (#666).
  The lock is the family's (`music-heavy.lock` in the temporary directory, moved by `MUSIC_HEAVY_LOCK`): cells and Cell studio take the same one for their tests, so a session over several of them never tests two at once.
  `pnpm install` and `session-start.sh` set `core.hooksPath` to it.
  It refuses a dirty tracked tree and a commit other than the one checked out, since it checks the tree, so commit before pushing.
  A tree that passed is remembered in the git directory (`jambot-verified`), with its count of tests, by the hook and by a `pnpm verify` run by hand, so neither a retried push nor one right after a verify runs it again, and the hook still prints the count.
  The tree is that of every file verify saw, untracked ones too, so a commit that leaves out a new file verify passed with is verified again.
  A push it lets through prints one line with the count of tests passed, and verify's last line names it too, for the pull request to quote.
  A failed run's whole output stays in the git directory, as `jambot-verify-failed.log`, which the message names.
  A diff against `origin/main` of only `*.md` files runs the format check and the tooling tests alone (`pnpm verify --docs`, which installs first and prints its summary line too).
  No tracked file keeps a line git left as a conflict marker (`tooling/conflict-markers.ts`, lifted from yggi/webmidi): it runs in verify and in the docs check alike, since Prettier formats a marker in markdown as ordinary text and a hand-resolved merge of the changelog or the memory could otherwise push one.
  The GitHub MCP tools that write files (`push_files`, `create_or_update_file`, `delete_file`) skip git, and so the hook: `.claude/settings.json` denies them.
  The pull request names the commit that passed it, in its Verified section.
- CI (`.github/workflows/ci.yml`) is a witness to that, not the gate: `check` (`pnpm verify`), `slow` (`pnpm test:slow`, the experiments left out of the gate) and `e2e` (`pnpm e2e` in two shards, `e2e-shard`, on two runners: about half the wall time; `e2e` passes when both did), side by side, on a pull request when it is opened, pushed to, reopened or taken out of draft.
  A draft runs nothing, and a newer push cancels the run still going, so a pull request stays a draft while it moves.
  Nightly on `main` both run, and so do the radio and the session soaks (`soak`, 30 minutes each, on a served build), their readouts kept as the run's artifacts; the session soak fails where its bound breaks (#462).
  By hand (Actions → CI → Run workflow, or `actions_run_trigger` on `ci.yml`) any branch gets `check` and `e2e`, and the soaks with `soak` ticked; runs by hand are never cancelled, so several on one branch give a pass rate.
  The review-pr skill reuses CI's `check` and `e2e` on a head they passed rather than run them a third time; it runs them itself only where CI hasn't passed that commit.
  A pull request that changes `*.md` files alone, as the pre-push hook reads it, runs `pnpm verify --docs` in `check` and skips `e2e`'s steps, both jobs still named and green, so the review's reuse holds for it.
  `git fetch origin pull/<n>/head` works through the session proxy.
  No check is required to merge.
- While Actions is blocked, a run fails within seconds, with no runner and no step: a red or missing `check` then says nothing about the code.
  `node tools/measure/actions.mjs --status yggi/jambot`, in music-commons, tells a blocked repository from one where Actions runs.
  The evidence is the verified commit the pull request names; when minutes are back, one run of a blocked check on a pull request still open is enough.
  Pages is deployed by a merge (below), and the lobby by the `lobby-deploy` skill.
- GitHub Pages is deployed by each merge into `main` (`AGENTS.md`) but one of `*.md` files alone, which changes nothing the site serves (`paths-ignore`): the push runs `.github/workflows/deploy.yml`, one at a time and never cancelled, which runs `pnpm pages deploy` there (by hand too, Actions → Deploy → Run workflow, and from a clone when Actions is blocked). `pnpm pages deploy` (`tooling/pages.ts`) runs `pnpm verify`, builds `main` for the sub-path `/jambot/` into `apps/web/dist-pages`, checks that every file the site references resolves there and that nothing is fetched from outside it, commits the build to the `gh-pages` branch and pushes it.
  On a merge, the deploy skips `pnpm verify` when CI already passed it on the same tree: `tooling/witness.ts` finds the pull request merged as the commit deployed, and passes its head to `pnpm pages deploy --tests-passed-on <head>` when that head has the commit's tree, CI's latest `check` on it is `success`, and the pull request changes more than `*.md` files.
  In every other case (a deploy by hand, no such pull request, another tree, a `check` missing or not green, GitHub unreadable) it runs `pnpm verify`, and the log's `pages: tests:` line says which and why; from a clone the flag is refused, so a clone runs every test.
  A head that held `main` when it was merged (`main` merged into it, and CI green on that) has the merge's tree, so the deploy skips the tests it passed.
  It then waits for the live site to serve that build and checks it again.
  Pages publishes the branch as it is: the repository's Pages source is "Deploy from a branch", `gh-pages`, `/`.
  `pnpm pages build` and `pnpm pages serve` show the site on `http://localhost:4318/jambot/` first, served as Pages serves it (404 for what isn't a file, where `vite preview` would answer with the app).
- `pnpm verify` (`tooling/verify.ts`) runs the typecheck, lint, format check and build side by side, then the tests, which take every core and would time out timing-sensitive tests if beside them, and so run under the machine's lock.
  If a static stage fails, the tests are skipped, and the output ends with the failed stages, whole.
  Lint and the format check keep a cache by content in `node_modules/.cache`, so a second run checks only the files that changed.
- What makes the tests slow, on the four cores of a Claude Code session: the machine is CPU-bound, so only less work speeds them up, and parallel stages do not.
  `expect()` costs more than most of what a finite check compares: about 20 µs a call, and a check over every case makes millions.
  Such a loop tallies its failures in an array and asserts once at the end (`swing.test.ts`, `events.test.ts`).
  jsdom costs about a second a file, so a web test that touches no DOM starts with `// @vitest-environment node`.
  The web jsdom tests run on `vmThreads`, which creates jsdom once per worker and keeps a context per file: 15 s instead of 33 s.
  A worker there keeps a compiled module across files, and a node test compiles Svelte's own `.svelte.js` for the server, so a later jsdom test in that worker got props that never updated, under load, about one full run in two.
  `apps/web/vitest.config.ts` therefore leaves the node tests to a second project, `web-node` (`vitest.node.config.ts`), found by that first line.
  The player's tests keep jsdom: under node Svelte resolves its server build, and they run twice as slow.
  The tooling tests that need a git repository build it once and copy it for each test.
- `pnpm deploy` is a reserved pnpm command, which is why the deploy is `pnpm pages deploy`.
- `pnpm ci` is a reserved pnpm command, which is why the all-in-one script is called `verify`.
- TypeScript is pinned to 6.0, because typescript-eslint and svelte-check do not support TypeScript 7 yet.
- The web app's base path comes from `BASE_PATH` (`pnpm pages` sets `/<repo>/`, from the `origin` remote).
  It defaults to `/`.
- The service worker answers every navigation it doesn't precache with the app's `index.html`, so a page it doesn't precache opens as the app, not as itself.
  `apps/web/e2e/pages.e2e.ts` opens the prototype offline to hold that it is precached.
- The app and the prototype use system fonts and fetch nothing from outside the site (#58).
- No module exports a function named `then`: a module namespace with a `then` is a thenable, and `await import()` of it never settles.
  So the score's `then` is `thenOp` in code (U5).

## License

- Jambot is MIT ([`LICENSE`](../../LICENSE)), as are quintenzirkel and lib-aeiou, so code moves freely between the sister projects.
  Every `package.json` says so.
- The cells language, `@yggi/cells` ([yggi/cells](https://github.com/yggi/cells)), is MIT too, and a git dependency on a public repository: `pnpm install` fetches it with no credentials, in a session and in CI alike.
- The build runs a license gate (`tooling/licenses.ts`, wired in `apps/web/vite.config.ts`).
  It fails on any package the app ships that isn't under a permissive license or lacks its license text, and writes `licenses.txt`: Jambot's license, then each shipped package's.
  Today that is the Svelte runtime, Vite's preload polyfill, workbox's runtime and the service worker's loader (Apache-2.0).
- Taking in a copyleft package, such as Strudel, is a decision, not a side effect of an import.
  MIT code may go into an AGPL build, but that build is then AGPL as a whole.
  Exporting Strudel code as text is not affected.
- The license covers the code and the docs.
  It does not cover training data, model weights or what the band plays.
  Lakh MIDI and Groove MIDI are CC-BY-4.0 (attribution); POP909 has a license of its own, to read before use.
- Static assets aren't modules, so the gate doesn't see them.
  None comes from elsewhere: the app and the prototype use system fonts (#58).
