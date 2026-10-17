import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'engine',
    // Its tests play whole songs over every style, meter and seed, so their time is the CPU's and the machine's
    // load: alone, the slowest (`lead.test.ts`'s grid of styles) takes 6.2 to 7.8 s over 5 runs, past the default
    // 5 s itself. 60 s is about eight times the slowest alone, the timeout of a test that hangs (#325).
    testTimeout: 60_000,
    environment: 'node',
  },
});
