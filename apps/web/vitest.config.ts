import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { createRequire } from 'node:module';
import { defineProject } from 'vitest/config';

// The lobby server's `ws`, as Node loads it: resolved for the browser, it
// is a stub, and `websocket.test.ts` runs the real server.
const ws = createRequire(import.meta.resolve('@jambot/lobby')).resolve('ws');

export default defineProject({
  plugins: [svelte(), svelteTesting()],
  resolve: { alias: { ws } },
  // jsdom costs about a second a file, so a test that touches no DOM opts out
  // with `// @vitest-environment node` on its first line. The player's tests
  // stay on jsdom: under node Svelte resolves its server build, and they run
  // twice as slow.
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
