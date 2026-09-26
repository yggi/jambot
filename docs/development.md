# Development

## Setup

Requires Node 22.12 or later and pnpm (the version is pinned in
`package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm dev          # web app on http://localhost:5173, prototype at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm exec playwright install chromium   # once, for the end-to-end checks
pnpm verify       # lint, format, typecheck, tests, build: before every push
pnpm e2e          # the app in Chromium: when what it plays, or when, changes
pnpm pages deploy # publish main to GitHub Pages (see below)
```

## Toolchain

- **TypeScript** everywhere. The engine is data-heavy (events, chords, plans,
  score syntax), and types make those shapes explicit. TypeScript is pinned
  to 6.0, because typescript-eslint and svelte-check do not support
  TypeScript 7 yet.
- **pnpm workspaces**, so the engine is its own package with its own lint
  rules. That boundary keeps it portable to Workers and to the root node.
  Packages export their TypeScript sources directly, with no build step
  between workspace packages.
- **Vite** builds the web app. **Svelte 5** (plain Svelte, not SvelteKit,
  since there is no routing or server rendering) renders the UI. Runes give
  fine-grained updates, which suits a display that changes every 16th note.
- **PWA** via `vite-plugin-pwa`: the app installs and runs offline, which
  matters on stage. Keeping the output lean is a guideline: small
  dependencies, no heavy frameworks, system fonts, nothing fetched from
  elsewhere.
- **Vitest** runs all tests from the root. The engine tests run in Node,
  and the web tests in jsdom with Testing Library.
- **Playwright** runs the end-to-end checks (`apps/web/e2e/*.e2e.ts`):
  the built app in Chromium, with its audio measured. They record every
  sound source the app starts, with its kind and time, so they check the
  timing exactly (every onset on the 16th grid, or on thirds of a step when
  swung, with the triplet offbeat) and that no event plays twice. They tap
  the output to hear that the band sounds and that Stop silences it at
  once, and count Workers to see that a quick double click leaves nothing
  running. Each check has been seen to fail against a broken app. `@playwright/test` is
  pinned to 1.56.1, the version whose Chromium (build 1194) the cloud
  sessions have installed, so they need no download. Elsewhere,
  `pnpm exec playwright install chromium` fetches that build once. They
  take about 20 s and need a browser, so they are a command of their own,
  not part of `pnpm verify`; `AGENTS.md` says when to run them.
- **ESLint + Prettier**, with `eslint-plugin-svelte` and `svelte-check` for
  types in components. In the pure packages, lint refuses what their type
  check lets through: `Math.random`, the clock, timers, the DOM, Web Audio,
  Node APIs and tonal (tests may use tonal, a random and the clock).
  `tooling/lint.test.ts` shows each rule firing.
- **GitHub Actions** (`.github/workflows/ci.yml`) runs `lint`,
  `format:check`, `check`, `test`, `e2e` and `build`. While the Actions
  minutes are used up (#4), it runs only when started by hand
  (`workflow_dispatch`); on every push and pull request it would fail in
  seconds.
- **GitHub Pages** is deployed by hand, with no Actions of ours:
  `pnpm pages deploy` (`tooling/pages.ts`) builds the app for its
  sub-path, checks the build, commits it to the `gh-pages` branch and
  checks the live site once Pages has published it. The check follows every
  reference from `index.html` and `prototype.html` through HTML, CSS, the
  web manifest and the service worker, and fails on one that leaves the
  sub-path, fetches from another host or finds no file.
  `tooling/pages.test.ts` shows each case failing, and
  `apps/web/e2e/pages.e2e.ts` opens the app and the prototype on the
  sub-path in Chromium, online and offline.

The house rules for working on the code are in [`AGENTS.md`](../AGENTS.md).
