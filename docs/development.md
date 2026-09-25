# Development

## Setup

Requires Node 22.12 or later and pnpm (the version is pinned in
`package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm dev          # web app on http://localhost:5173, prototype at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm verify       # everything CI runs: lint, format check, typecheck, tests, build
```

## Toolchain

- **TypeScript** everywhere. The engine is data-heavy (events, chords, plans,
  score syntax), and types make those shapes explicit. TypeScript is pinned
  to 6.0, because typescript-eslint and svelte-check do not support
  TypeScript 7 yet.
- **pnpm workspaces**, so the engine is its own package with its own lint
  rules. That boundary keeps it portable to Workers and to a future server.
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
- **ESLint + Prettier**, with `eslint-plugin-svelte` and `svelte-check` for
  types in components.
- **GitHub Actions** (`.github/workflows/ci.yml`) runs `lint`,
  `format:check`, `check`, `test` and `build` on every push and pull request.
  Pushes to `main` deploy to GitHub Pages. The workflow does not run at the
  moment, because the Actions minutes are used up (#4).

The house rules for working on the code are in [`AGENTS.md`](../AGENTS.md).
