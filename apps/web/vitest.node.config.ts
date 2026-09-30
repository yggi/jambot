// The web tests that opt out of jsdom, in a project of their own so that no worker runs them beside the jsdom tests (see `vitest.config.ts`).
import { configDefaults, defineProject } from 'vitest/config';
import webConfig, { nodeTests } from './vitest.config.ts';

export default defineProject({
  ...webConfig,
  test: {
    ...webConfig.test,
    name: 'web-node',
    environment: 'node',
    pool: 'forks',
    include: nodeTests,
    exclude: configDefaults.exclude,
  },
});
