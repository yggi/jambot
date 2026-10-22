import { availableParallelism } from 'node:os';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*', 'apps/web/vitest.node.config.ts', 'tooling'],
    // A worker for every core, not Vitest's one fewer: `pnpm verify` runs the tests alone, after its other stages,
    // and its slowest files take a core each for a minute or more (#471).
    maxWorkers: availableParallelism(),
  },
});
