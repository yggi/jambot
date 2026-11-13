import { configDefaults, defineProject } from 'vitest/config';

/**
 * The slow tier: the experiments whose `beforeAll` plays hours of music, each past 90 s alone, so they are no part of
 * `pnpm verify` (#666). `pnpm test:slow` runs them (`vitest.slow.config.ts`), under the machine's lock for heavy runs,
 * and so does CI's `slow` job on a ready pull request and nightly. Each file's whole run, four of them at once on four
 * cores, 2026-11-13: E45 392 s, E42 191 s, E41 157 s, E43 140 s, E44 133 s, E38 117 s.
 */
export const slowTests = [
  'experiments/homeostat.test.ts',
  'experiments/lead-loop.test.ts',
  'experiments/bass-loop.test.ts',
  'experiments/harmony-loop.test.ts',
  'experiments/homeostat-sensor.test.ts',
  'experiments/rhythm-learning.test.ts',
];

export default defineProject({
  test: {
    name: 'engine',
    exclude: [...configDefaults.exclude, ...slowTests],
    // Its tests play whole songs over every style, meter and seed, so their time is the CPU's and the machine's
    // load: alone, the slowest (`lead.test.ts`'s grid of styles) takes 6.2 to 7.8 s over 5 runs, past the default
    // 5 s itself. 60 s is about eight times the slowest alone, the timeout of a test that hangs (#325).
    // Measured again in a whole run on four cores, 2026-11-13: `tempo.test.ts`'s slowest took 14.1 s and E17's
    // (`humanise.test.ts`) 7.8 s, each beside three other workers, so four times the slowest under that load.
    testTimeout: 60_000,
    // An experiment plays its hours of music in a `beforeAll`, not as its file is imported: Vitest runs the files it
    // has timed longest first, and an import's time is not timed. The slowest hook left here is E34's
    // (`meter-radio.test.ts`): its file takes 73 s, hook and tests, beside three others (2026-11-13). 15 minutes is
    // about twelve times that, the timeout of a hook that hangs. A hook past 90 s alone moves its file to `slowTests`.
    hookTimeout: 900_000,
    environment: 'node',
    // Its code keeps no state between files and stubs nothing, so the files of a worker share their modules,
    // each evaluated once a worker rather than once a file (#471).
    isolate: false,
  },
});
