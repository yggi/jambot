import { type Page, expect, test } from '@playwright/test';
import { type Start, listen, starts } from './audio.ts';

/**
 * Host and client mode across two pages of one browser, over the tabs'
 * BroadcastChannel lobby and over the lobby server: what the client
 * sounds, against what the host sounds, on the clock both pages share.
 */

/** The lobby server `playwright.config.ts` starts. */
const LOBBY = 'ws://localhost:4319';

const host = async (page: Page, session: string, lobby = '') => {
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Session name').fill(session);
  await page.getByRole('button', { name: 'Host a session' }).click();
  await expect(page.getByText(/^Hosting/)).toBeVisible();
};

const join = async (page: Page, session: string, name: string, lobby = '') => {
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Session name').fill(session);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByText(/^Playing in/)).toBeVisible();
};

/** A kick is a sine starting at 440 Hz, whose pitch only glides. */
const kicks = async (page: Page) =>
  (await starts(page))
    .filter((s: Start) => s.kind === 'sine' && s.frequency === 440)
    .map((s) => s.heard!);

/**
 * The host starts the band at full energy, the client joins, and after
 * twelve seconds each kick the client sounded is set against the host's
 * nearest, on the clock both pages share.
 */
async function inStep(page: Page, client: Page, session: string, lobby = '') {
  const hostErrors = await listen(page);
  const clientErrors = await listen(client);

  await host(page, session, lobby);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, session, 'Ada', lobby);
  await expect(page.getByText('1 joined: Ada.')).toBeVisible();
  await expect(client.getByText('The host is playing.')).toBeVisible();
  // A client's controls rest: the host leads.
  await expect(client.getByRole('button', { name: 'Start the band' })).toBeDisabled();

  await client.waitForTimeout(12000);
  const hosted = await kicks(page);
  const followed = await kicks(client);
  expect([...hosted, ...followed].every((t) => t !== null)).toBe(true);
  // Each kick the client sounded, against the host's nearest. A kick one
  // page played and the other dropped, in a stall of a browser running two
  // bands, has none near it.
  const gaps = followed
    .map((t) =>
      hosted.reduce((best, h) => (Math.abs(t - h) < Math.abs(best) ? t - h : best), Infinity),
    )
    .filter((g) => Math.abs(g) < 50);
  const sorted = gaps.map(Math.abs).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  console.log(
    `${lobby || 'tabs'}: client against host, ${gaps.length} of ${followed.length} kicks (the host sounded ${hosted.length}): ` +
      `median ${median.toFixed(2)} ms, worst ${sorted.at(-1)!.toFixed(2)} ms, ` +
      `each ${gaps.map((g) => g.toFixed(1)).join(' ')}`,
  );
  // The client sounds every kick the host sounds from when it joined; how
  // many that is depends on the song, whose seed each run draws afresh.
  const since = hosted.filter((h) => h >= followed[0]! - 50);
  expect(followed.length).toBeGreaterThanOrEqual(5);
  expect(gaps.length).toBeGreaterThanOrEqual(since.length - 1);
  expect(gaps.length).toBeGreaterThanOrEqual(followed.length - 1);
  // Measured in headless Chromium: a median of 0.1 to 0.3 ms, every kick
  // within 0.7 ms, but where one of two bands in one browser slipped a
  // buffer (10 ms): the clock follows such a step within two pings
  // (`hostClock`), so it puts at most the kicks of half a second out.
  expect(median).toBeLessThan(1);
  expect(sorted.filter((g) => g > 2).length).toBeLessThanOrEqual(2);
  expect(sorted.at(-1)!).toBeLessThan(15);

  await client.getByRole('button', { name: 'Leave the session' }).click();
  await expect(page.getByText('Nobody has joined yet.')).toBeVisible();
  expect(hostErrors).toEqual([]);
  expect(clientErrors).toEqual([]);
}

test('a client joins a session and sounds with its host, kick for kick', async ({
  page,
  context,
}) => {
  await inStep(page, await context.newPage(), 'e2e jam');
});

test('a client in another browser context joins through the lobby server, in step', async ({
  page,
  browser,
}) => {
  // Contexts share no BroadcastChannel: only the server connects them.
  const elsewhere = await browser.newContext();
  await inStep(page, await elsewhere.newPage(), 'server jam', LOBBY);
  await elsewhere.close();
});

test('the lobby server lists the sessions open, and refuses a join to none', async ({
  page,
  browser,
}) => {
  await listen(page);
  await host(page, 'Listed Jam', LOBBY);
  const elsewhere = await browser.newContext();
  const other = await elsewhere.newPage();
  await listen(other);
  await other.getByLabel('Lobby server').fill(LOBBY);
  await other.getByRole('button', { name: 'Find sessions' }).click();
  await other.getByRole('button', { name: 'Listed Jam' }).click();
  await expect(other.getByLabel('Session name')).toHaveValue('Listed Jam');
  await other.getByLabel('Session name').fill('Unlisted');
  await other.getByLabel('Your name').fill('Bob');
  await other.getByRole('button', { name: 'Join' }).click();
  await expect(other.getByText('No session named “Unlisted” is open.')).toBeVisible();
  // It stays said: the refused socket closing is no lost lobby.
  await other.waitForTimeout(500);
  await expect(other.getByText('No session named “Unlisted” is open.')).toBeVisible();
  await elsewhere.close();
});

test("a client's motif reaches the host's Muse, named by its player", async ({ page, context }) => {
  await listen(page);
  const client = await context.newPage();
  await listen(client);
  await host(page, 'motif jam');
  await page.getByRole('slider', { name: /Energy/ }).fill('0');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, 'motif jam', 'Ada');
  await expect(client.getByText('The host is playing.')).toBeVisible();
  await expect(client.getByText('Bar 3 of 8')).toBeVisible({ timeout: 8000 });

  // Synth-pop at 108 bpm: three notes four steps apart, in one bar.
  const step = 15 / 108;
  await client.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (const key of ['a', 'd', 'g']) {
    await client.keyboard.down(key);
    await client.waitForTimeout(60);
    await client.keyboard.up(key);
    await client.waitForTimeout(step * 4 * 1000 - 60);
  }
  const took = /: Took a 3-note motif from Ada's computer keys\./;
  await expect(page.getByText(took)).toBeVisible({ timeout: 8000 });
  // The client shows the host's Muse too.
  await expect(client.getByText(took)).toBeVisible();
});

test('a second host cannot take a session name that is open', async ({ page, context }) => {
  await listen(page);
  const other = await context.newPage();
  await listen(other);
  await host(page, 'taken');
  await other.getByLabel('Session name').fill('Taken ');
  await other.getByRole('button', { name: 'Host a session' }).click();
  await expect(other.getByText('A session named “Taken” is already open.')).toBeVisible();
});
