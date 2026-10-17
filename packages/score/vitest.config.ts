import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'score',
    // Its tests read back every bar, chord and numeral, so their time is the CPU's and the machine's load: alone,
    // the slowest (E32's numerals, `seam.test.ts`'s chords) take 1.7 to 2.4 s over 5 runs, and past the default 5 s
    // beside other runs. 20 s is about eight times the slowest alone, the timeout of a test that hangs (#325).
    testTimeout: 20_000,
    environment: 'node',
  },
});
