import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

const pureSources = ['packages/engine/src/**', 'packages/theory/src/**'];

export default defineConfig(
  { ignores: ['prototype/', '**/dist/', 'coverage/'] },
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
    // DOM, no Node APIs. Their tests may read the prototype through
    // @jambot/prototype-reference.
    files: pureSources,
    languageOptions: { globals: globals['shared-node-browser'] },
  },
  {
    files: pureSources,
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'Pure packages use no Node APIs.' },
            {
              group: ['@jambot/prototype-reference'],
              message: 'The prototype is a test reference only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
);
