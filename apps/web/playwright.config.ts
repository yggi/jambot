import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end checks: the built app in Chromium, with its audio measured.
 * The browser is Playwright's Chromium, pinned with @playwright/test; the
 * session hook installs it (`pnpm exec playwright install chromium`).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.e2e.ts',
  // One page at a time, so each has the audio clock to itself.
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    env: { BASE_PATH: '/' },
  },
});
