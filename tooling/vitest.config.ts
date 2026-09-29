// The tooling tests: they run git in throwaway repositories, so they start without a repository in the environment.
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'tooling',
    setupFiles: ['./git-env.setup.ts'],
  },
});
