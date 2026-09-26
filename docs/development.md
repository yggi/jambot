# Development

## Setup

Requires Node 22.12 or later and pnpm (the version is pinned in
`package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm dev          # web app on http://localhost:5173, prototype at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm exec playwright install chromium   # once, for the end-to-end checks
pnpm verify       # everything CI runs: lint, format check, typecheck, tests, build, e2e
pnpm e2e          # the end-to-end checks alone: the built app in Chromium
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
  dependencies, no heavy frameworks, fonts bundled rather than fetched.
- **Vitest** runs all tests from the root. The engine tests run in Node,
  and the web tests in jsdom with Testing Library.
- **Playwright** runs the end-to-end checks (`apps/web/e2e/*.e2e.ts`):
  the built app in Chromium, with its audio measured. They record the time
  every sound source starts, so they check the timing exactly (every onset
  on the 16th grid, or on thirds of a step when swung), and they tap the
  output to hear that the band sounds and stops. `@playwright/test` is
  pinned to 1.56.1, the version whose Chromium (build 1194) the cloud
  sessions have installed, so they need no download. Elsewhere,
  `pnpm exec playwright install chromium` fetches that build once.
- **ESLint + Prettier**, with `eslint-plugin-svelte` and `svelte-check` for
  types in components.
- **GitHub Actions** (`.github/workflows/ci.yml`) runs `lint`,
  `format:check`, `check`, `test`, `build` and `e2e` on every push and pull
  request.
  Pushes to `main` deploy to GitHub Pages. The workflow does not run at the
  moment, because the Actions minutes are used up (#4).

The house rules for working on the code are in [`AGENTS.md`](../AGENTS.md).
