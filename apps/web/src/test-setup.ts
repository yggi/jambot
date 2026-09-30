// Loaded once for every component test: `@testing-library/jest-dom`'s matchers.
import '@testing-library/jest-dom/vitest';

// jsdom has no layout, so nothing resizes: a stand-in for what `bind:clientWidth` observes with.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
