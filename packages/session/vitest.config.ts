import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'session',
    environment: 'node',
    // A pure package keeps no state between files and stubs nothing, so the files of a worker share their modules,
    // each evaluated once a worker rather than once a file (#471).
    isolate: false,
  },
});
