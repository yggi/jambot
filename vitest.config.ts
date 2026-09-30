import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*', 'apps/web/vitest.node.config.ts', 'tooling'],
  },
});
