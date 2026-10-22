import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'engine',
    // Its tests play whole songs over every style, meter and seed, so their time is the CPU's and the machine's
    // load: alone, the slowest (`lead.test.ts`'s grid of styles) takes 6.2 to 7.8 s over 5 runs, past the default
    // 5 s itself. 60 s is about eight times the slowest alone, the timeout of a test that hangs (#325).
    testTimeout: 60_000,
    // An experiment plays its hours of music in a `beforeAll`, not as its file is imported: Vitest runs the files it
    // has timed longest first, and an import's time is not timed. The slowest (`bass-loop.test.ts`'s, E41) takes
    // 92 s alone (2026-10-22); 15 minutes is about ten times that, the timeout of a hook that hangs.
    hookTimeout: 900_000,
    environment: 'node',
    // Its code keeps no state between files and stubs nothing, so the files of a worker share their modules,
    // each evaluated once a worker rather than once a file (#471).
    isolate: false,
  },
});
