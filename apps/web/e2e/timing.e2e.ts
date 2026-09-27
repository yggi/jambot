import { readFile } from 'node:fs/promises';
import { type Page, expect, test } from '@playwright/test';
import { clockJumps, holdAudio, listen, stalls } from './audio.ts';

/**
 * The timing panel and its export (#27), against what the harness measures
 * of the same page: a hold of its audio, which drops what a buffer would,
 * and a stall of its main thread.
 */

/** The report the panel exports, read back from the file it saves. */
async function exported(page: Page) {
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await saving;
  expect(download.suggestedFilename()).toMatch(/^jambot-timing-.*\.json$/);
  return JSON.parse(await readFile((await download.path())!, 'utf8'));
}

/** How long, in milliseconds, the test stalls the page's main thread: past a lookahead and a step at 108 bpm. */
const STALL = 400;

test('counts a hold of the audio as a buffer dropped, and a stall as a long tick and steps missed', async ({
  page,
}) => {
  const errors = await listen(page, '/?timing');
  await expect(page.getByRole('region', { name: 'Timing' })).toBeVisible();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await page.waitForTimeout(3000);

  const before = await exported(page);
  expect(before).toMatchObject({ report: 'jambot timing', version: 1, mode: 'solo' });
  expect(before.transport.laid).toBeGreaterThan(0);
  expect(before.transport.ticks.count).toBeGreaterThan(50);
  // Nothing is scheduled after its time: the clock never waits (T1).
  expect(before.transport.margins.least).toBeGreaterThan(0);
  expect(before.output.bound).toBe(0.5);

  // The output drops what a buffer would: its pair follows the jump.
  const heldAt = await page.evaluate(() => performance.timeOrigin + performance.now());
  await holdAudio(page, 80);
  await page.waitForTimeout(1000);
  const held = await exported(page);
  const jumps = (await clockJumps(page, 5)).filter((j) => j.at >= heldAt - 100);
  expect(jumps.length).toBeGreaterThan(0);
  expect(held.output.jumps).toBeGreaterThan(before.output.jumps);

  // The page does nothing for a moment: one long tick, and the steps it passed are missed.
  await page.evaluate((ms) => {
    const end = performance.now() + ms;
    while (performance.now() < end);
  }, STALL);
  await page.waitForTimeout(1000);
  const stalled = await exported(page);
  const longest = Math.max(...(await stalls(page)).map((s) => s.to - s.from));
  expect(longest).toBeGreaterThanOrEqual(STALL - 50);
  expect(stalled.transport.ticks.most).toBeGreaterThanOrEqual(STALL - 50);
  expect(stalled.transport.missed).toBeGreaterThan(held.transport.missed);
  expect(errors).toEqual([]);
});
