import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [svelte(), svelteTesting()],
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
