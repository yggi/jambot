// The tooling tests: they run git in throwaway repositories, so they start without a repository in the environment.
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'tooling',
    setupFiles: ['./git-env.setup.ts'],
    // A test here shells out (git, tsc, eslint, prepare.sh) a dozen times, so its time is bounded by the machine's load,
    // not by what it checks: alone, the slowest take 3 to 4 s, past vitest's default of 5 s beside another agent's run
    // (#353). 30 s is the timeout of a test that hangs.
    testTimeout: 30_000,
  },
});
