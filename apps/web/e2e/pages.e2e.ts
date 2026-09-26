import { type Page, expect, test } from '@playwright/test';

/**
 * The site as GitHub Pages serves it: under a sub-path, from the build
 * `pnpm pages build` makes, by a server that answers 404 for anything that
 * isn't a file (`tooling/pages.ts`).
 */
const site = 'http://localhost:4318/jambot/';

/** Every request the page makes that leaves the site, and every one that fails. */
function watch(page: Page) {
  const outside: string[] = [];
  const failed: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(site) && !/^(data|blob):/.test(url)) outside.push(url);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) =>
    failed.push(`${request.failure()?.errorText} ${request.url()}`),
  );
  page.on('pageerror', (error) => errors.push(String(error)));
  return { outside, failed, errors };
}

test('the app and the prototype load under the sub-path, and fetch nothing outside it', async ({
  page,
}) => {
  const seen = watch(page);
  await page.goto(site);
  await expect(page.getByRole('button', { name: 'Start the band' })).toBeVisible();
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe(site);

  await page.goto(`${site}prototype.html`);
  await expect(page).toHaveTitle('Jambot prototype');
  await expect(page.getByRole('button', { name: 'Start the band' })).toBeVisible();
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(font).toMatch(/^system-ui/);

  expect(seen).toEqual({ outside: [], failed: [], errors: [] });
});

test('the prototype opens offline, from the service worker', async ({ page, context }) => {
  const seen = watch(page);
  await page.goto(site);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.goto(`${site}prototype.html`);
  await expect(page).toHaveTitle('Jambot prototype');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  expect(seen.errors).toEqual([]);
});
