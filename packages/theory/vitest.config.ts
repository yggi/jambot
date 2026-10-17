import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'theory',
    // Its tests take every case (every motif under every operator, every mode, every cent), so their time is
    // the CPU's and the machine's load: alone, the slowest (`motifs.test.ts`, every motif of a bar under every
    // operator) takes 4.5 to 6.6 s over 5 runs, past the default 5 s itself, and three times that beside other runs.
    // 60 s is nine times the slowest alone, the timeout of a test that hangs (#325).
    testTimeout: 60_000,
    environment: 'node',
  },
});
