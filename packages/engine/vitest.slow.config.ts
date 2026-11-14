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
    // The slowest hook is E42's (`lead-loop.test.ts`): its file takes 191 s beside three others (2026-11-13) and
    // about 160 s alone (2026-11-14). An hour is about twenty times that, the timeout of a hook that hangs on a
    // slower machine (E45's took 614 s alone on one before it left the tier, #666); the tests after it take the
    // engine's 60 s.
    hookTimeout: 3_600_000,
  },
});
