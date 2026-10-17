import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

const pureSources = [
  'packages/analyzer/src/**',
  'packages/engine/src/**',
  'packages/score/src/**',
  'packages/session/src/**',
  'packages/spectrum/src/**',
  'packages/theory/src/**',
];

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

/** The screens a screen may not import, by the side of the door they are on. */
const THE_BAND = [
  { name: './Band.svelte', message: 'The door and the band do not know each other.' },
];
const THE_DOOR = [
  { name: './Door.svelte', message: 'The door and the band do not know each other.' },
];
const THE_DOORS_VIEWS = ['Lobby', 'Tune', 'Meter', 'TimingTest'].map((view) => ({
  name: `./${view}.svelte`,
  message: 'The lobby and the extras are views of the door, and only the door shows them.',
}));

/** What keeps a screen presentational: the screens it may not know, and the page's own objects it may only name. */
const screenImports = (paths) => [
  'error',
  {
    paths,
    patterns: [
      {
        group: [
          '**/session/*',
          '**/device.*',
          '**/instruments.*',
          '**/metronome.*',
          '**/player.*',
          '**/profile.*',
        ],
        allowTypeImports: true,
        message:
          'A screen takes what it shows as props and sends intents: the page runs the player, the device and the sessions.',
      },
    ],
  },
];

export default defineConfig(
  // `.claude/worktrees/` holds the checkouts Claude Code agents work in, each a repository of its own.
  { ignores: ['prototype/', '**/dist/', '**/dist-pages/', 'coverage/', '.claude/worktrees/'] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    ignores: pureSources,
    languageOptions: { globals: { ...globals.browser, ...globals.node, __BUILD__: 'readonly' } },
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
    // tonal and @strudel/mini are second opinions in tests, never part of a
    // package itself (L4: Strudel is AGPL, an oracle for conformance tests
    // only), and only tests may use an unkeyed random or the clock.
    files: pureSources,
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'Pure packages use no Node APIs.' },
            { group: ['tonal', '@tonaljs/*'], message: 'tonal is for tests only.' },
            { group: ['@strudel/*'], message: '@strudel/mini is for conformance tests only (L4).' },
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
      'no-restricted-syntax': [
        'error',
        {
          // `chance` and `pick` quantise a draw before it meets a probability
          // or a weight, which absorbs a last-bit difference `Math.pow` or
          // `Math.sin` may give on another engine (random.ts). A raw
          // comparison skips that gate (#45).
          selector:
            'BinaryExpression[operator=/^[<>]=?$/] > CallExpression[callee.name=/^(draw|heldDraw)$/]',
          message: 'A draw goes through chance() or pick(), never a raw comparison.',
        },
      ],
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    // The web app's screens, the door and the band, are presentational: they
    // take props and send intents. The page holds the player, the device and
    // the sessions, and a screen names their types at most, never runs them.
    // The door and the band do not know each other, and the door's views (the
    // lobby and the extras) are the door's alone.
    files: ['apps/web/src/screens/**/*.svelte'],
    ignores: ['apps/web/src/screens/Door.svelte'],
    rules: {
      'no-restricted-imports': screenImports([...THE_BAND, ...THE_DOOR, ...THE_DOORS_VIEWS]),
    },
  },
  {
    files: ['apps/web/src/screens/Door.svelte'],
    rules: { 'no-restricted-imports': screenImports(THE_BAND) },
  },
);
