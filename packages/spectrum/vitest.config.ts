import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'spectrum',
    // Its tests read every note through noise and every shift, so their time is the CPU's and the machine's load:
    // alone, the slowest (`adaptive.test.ts`'s low note in noise) takes 1.9 to 2.5 s over 5 runs, and past the
    // default 5 s beside other runs. 20 s is eight times the slowest alone, the timeout of a test that hangs (#325).
    testTimeout: 20_000,
    environment: 'node',
    // A pure package keeps no state between files and stubs nothing, so the files of a worker share their modules,
    // each evaluated once a worker rather than once a file (#471).
    isolate: false,
  },
});
