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
  // `virtual:pwa-register` is vite-plugin-pwa's, not loaded here: a stand-in with no update to offer
  resolve: {
    alias: { ws, 'virtual:pwa-register': join(import.meta.dirname, 'src/pwa-register.stub.ts') },
  },
  define: {
    __BUILD__: JSON.stringify({
      name: '@jambot/web',
      version: '0.0.0',
      commit: '0123456789abcdef0123456789abcdef01234567',
      branch: 'main',
      builtAt: '2026-10-17T14:03:59.000Z',
      dependencies: [{ name: '@yggi/cells', version: 'v0.2.0' }],
    }),
  },
  // jsdom costs about a second a file, so a test that touches no DOM opts out
  // with `// @vitest-environment node` on its first line. The player's tests
  // stay on jsdom: under node Svelte resolves its server build, and they run
  // twice as slow. `vmThreads` creates jsdom once per worker and still gives
  // every file its own context: the web suite runs in 15 s instead of 33 s,
  // and `isolate: false`, at 19 s, would share state between files.
  test: {
    name: 'web',
    environment: 'jsdom',
    // The player's tests drive their own clock through minutes of playing, so their time is the CPU's and the
    // machine's load: alone, the slowest (`player.test.ts`, a control moved after a bar line) takes 3.2 to 3.7 s
    // over 5 runs, the hidden tab 2.2 to 3.1 s, and past the default 5 s beside other runs (#320, #325).
    // 30 s is eight times the slowest alone, and ten times the hidden tab's, the timeout of a test that hangs.
    testTimeout: 30_000,
    pool: 'vmThreads',
    // A test that opts out of jsdom runs in the other project, `vitest.node.config.ts`:
    // under `vmThreads` a worker keeps a compiled module across files, and a node test
    // compiles Svelte's own `.svelte.js` for the server, so a later jsdom test in that
    // worker would get props that never update.
    exclude: [...configDefaults.exclude, ...nodeTests],
    setupFiles: ['./src/test-setup.ts'],
  },
});
