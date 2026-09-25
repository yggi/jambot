import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
  { ignores: ['prototype/', '**/dist/', 'coverage/'] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    ignores: ['packages/engine/src/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // The engine runs in browsers, workers and servers alike: no DOM, no Node APIs.
    files: ['packages/engine/src/**'],
    languageOptions: { globals: globals['shared-node-browser'] },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
);
