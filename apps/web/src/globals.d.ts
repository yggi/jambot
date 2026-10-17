// The globals vite's `define` makes (vite.config.ts, vitest.config.ts).

/** What this build is: commit, branch, date, dependencies (src/buildInfo.ts). */
declare const __BUILD__: import('./buildInfo.ts').BuildInfo;
