import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

const pureSources = ['packages/engine/src/**', 'packages/session/src/**', 'packages/theory/src/**'];

// What a pure package's own code may not reach for. Their type check
// already has no DOM and no Node types, but the clock and Math.random are
// ECMAScript, so only lint keeps them out. The rest is named here too, so
// the rule reads whole and holds if a `lib` or `types` entry is added.
const impureGlobals = [
  ['Date', 'The clock is the transport’s; the engine is given positions.'],
  ['performance', 'The clock is the transport’s; the engine is given positions.'],
  ['crypto', 'Randomness goes through random.ts, keyed by seed and position.'],
  ...['setTimeout', 'setInterval', 'setImmediate', 'requestAnimationFrame'].map((name) => [
    name,
    'Timers belong to the transport, not the pure packages.',
  ]),
  ...['window', 'document', 'navigator', 'AudioContext', 'OfflineAudioContext'].map((name) => [
    name,
    'Pure packages use no DOM and no Web Audio.',
  ]),
].map(([name, message]) => ({ name, message }));

export default defineConfig(
  { ignores: ['prototype/', '**/dist/', '**/dist-pages/', 'coverage/'] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    ignores: pureSources,
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Pure packages run in browsers, workers and on the root node alike: no
    // DOM, no Node APIs.
    files: pureSources,
    languageOptions: { globals: globals['shared-node-browser'] },
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['node:*'], message: 'Pure packages use no Node APIs.' }] },
      ],
    },
  },
  {
    // tonal is a second opinion in tests, never part of the theory itself,
    // and only tests may use an unkeyed random or the clock.
    files: pureSources,
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'Pure packages use no Node APIs.' },
            { group: ['tonal', '@tonaljs/*'], message: 'tonal is for tests only.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...impureGlobals],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Randomness goes through random.ts, keyed by seed and position.',
        },
      ],
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
);
