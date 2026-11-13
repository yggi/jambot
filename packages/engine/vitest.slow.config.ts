// The engine's slow tier, a project of its own so that `pnpm verify` leaves it out and `pnpm test:slow` runs it alone (see `vitest.config.ts`).
import { defineProject } from 'vitest/config';
import engineConfig, { slowTests } from './vitest.config.ts';

export default defineProject({
  ...engineConfig,
  test: {
    ...engineConfig.test,
    name: 'engine-slow',
    include: slowTests,
    exclude: [],
    // The slowest hook is E45's (`homeostat.test.ts`): its file takes 392 s beside three others (2026-11-13), and
    // 614 s alone on a slower machine (2026-11-11, #666). An hour is about six times that, the timeout of a hook that
    // hangs; the tests after it take the engine's 60 s.
    hookTimeout: 3_600_000,
  },
});
