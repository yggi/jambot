import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { configDefaults, defineProject } from 'vitest/config';

// The lobby server's `ws`, as Node loads it: resolved for the browser, it
// is a stub, and `websocket.test.ts` runs the real server.
const ws = createRequire(import.meta.resolve('@jambot/lobby')).resolve('ws');

/** The tests that opt out of jsdom with `// @vitest-environment node` on their first line. */
export const nodeTests = readdirSync(join(import.meta.dirname, 'src'), {
  recursive: true,
  encoding: 'utf8',
})
  .filter((file) => file.endsWith('.test.ts'))
  .map((file) => `src/${file}`)
  .filter((file) =>
    readFileSync(join(import.meta.dirname, file), 'utf8').startsWith('// @vitest-environment node'),
  );

export default defineProject({
  plugins: [svelte(), svelteTesting()],
  resolve: { alias: { ws } },
  // jsdom costs about a second a file, so a test that touches no DOM opts out
  // with `// @vitest-environment node` on its first line. The player's tests
  // stay on jsdom: under node Svelte resolves its server build, and they run
  // twice as slow. `vmThreads` creates jsdom once per worker and still gives
  // every file its own context: the web suite runs in 15 s instead of 33 s,
  // and `isolate: false`, at 19 s, would share state between files.
  test: {
    name: 'web',
    environment: 'jsdom',
    pool: 'vmThreads',
    // A test that opts out of jsdom runs in the other project, `vitest.node.config.ts`:
    // under `vmThreads` a worker keeps a compiled module across files, and a node test
    // compiles Svelte's own `.svelte.js` for the server, so a later jsdom test in that
    // worker would get props that never update.
    exclude: [...configDefaults.exclude, ...nodeTests],
    setupFiles: ['./src/test-setup.ts'],
  },
});
