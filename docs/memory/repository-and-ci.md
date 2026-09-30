# Repository, CI and license

How the repository is built, gated, deployed and licensed.

## Repository and CI

- The repository is private.
  GitHub Actions minutes are used up (#4), so the CI workflow runs only when started by hand.
  `pnpm verify` locally is the check that counts.
  A red or missing `check` on a pull request says nothing about the code.
- GitHub Pages is deployed by hand, after each merge into `main` (`AGENTS.md`): `pnpm pages deploy` (`tooling/pages.ts`) runs `pnpm verify`, builds `main` for the sub-path `/jambot/` into `apps/web/dist-pages`, checks that every file the site references resolves there and that nothing is fetched from outside it, commits the build to the `gh-pages` branch and pushes it.
  It then waits for the live site to serve that build and checks it again.
  Pages publishes the branch as it is: the repository's Pages source is "Deploy from a branch", `gh-pages`, `/`.
  `pnpm pages build` and `pnpm pages serve` show the site on `http://localhost:4318/jambot/` first, served as Pages serves it (404 for what isn't a file, where `vite preview` would answer with the app).
- `pnpm verify` (`tooling/verify.ts`) runs the typecheck, lint, format check and build side by side, then the tests, which take every core and would time out timing-sensitive tests if beside them.
  If a static stage fails, the tests are skipped, and the output ends with the failed stages, whole.
  Lint and the format check keep a cache by content in `node_modules/.cache`, so a second run checks only the files that changed.
- What makes the tests slow, on the four cores of a Claude Code session: the machine is CPU-bound, so only less work speeds them up, and parallel stages do not.
  `expect()` costs more than most of what a finite check compares: about 20 µs a call, and a check over every case makes millions.
  Such a loop tallies its failures in an array and asserts once at the end (`swing.test.ts`, `events.test.ts`).
  jsdom costs about a second a file, so a web test that touches no DOM starts with `// @vitest-environment node`.
  The web jsdom tests run on `vmThreads`, which creates jsdom once per worker and keeps a context per file: 33 s instead of 15 s.
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
