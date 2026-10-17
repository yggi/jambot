import { readFile } from 'node:fs/promises';
import { type Page, expect, test } from '@playwright/test';
import { clockJumps, holdAudio, listen, openCard, openStyle, solo, stalls } from './audio.ts';

/**
 * The timing panel and its export (#27), against what the harness measures
 * of the same page: a hold of its audio, which drops what a buffer would,
 * and a stall of its main thread.
 */

/** The report the panel exports, read back from the file it saves. */
async function exported(page: Page) {
  await openCard(page, 'Timing');
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await saving;
  expect(download.suggestedFilename()).toMatch(/^jambot-timing-.*\.json$/);
  return JSON.parse(await readFile((await download.path())!, 'utf8'));
}

/**
 * How long, in milliseconds, the test stalls the page's main thread. The tick before the stall
 * schedules every step that starts within `LOOKAHEAD` (120 ms), so the first step left unscheduled
 * can start up to a step after that, and it is missed only once it has wholly passed: a stall must
 * outlast the lookahead and two steps, 120 + 2 × 139 = 398 ms at 108 bpm, to miss a step whatever
 * its phase (#356, where 400 ms missed none once). 600 ms misses at least one in every phase, with
 * 200 ms to spare for a tick that the loaded page runs late.
 */
const STALL = 600;

test('counts a hold of the audio as a buffer dropped, and a stall as a long tick and steps missed', async ({
  page,
}) => {
  const errors = await listen(page, '/?timing');
  await solo(page);
  await openCard(page, 'Timing');
  await expect(page.getByRole('region', { name: 'Timing' })).toBeVisible();
  await openStyle(page);
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
