import { expect, test } from '@playwright/test';
import { isClick, listen, starts } from './audio.ts';

/**
 * The metronome (#259) in Chromium, its bass on: the bass voice's saw must
 * start on the root, E2, on each downbeat and on the fifth, B2, on the
 * pulses between, a quarter apart at 100 quarters a minute, and the click go
 * on beside it, bar after bar.
 */
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
const E2 = hz(40);
const B2 = hz(47);
const QUARTER = 60 / 100;

test('the metronome plays its bass when the bass is on: the root on the downbeat, the fifth on each pulse', async ({
  page,
}) => {
  const errors = await listen(page);
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Metronome', exact: true }).click();
  await page
    .getByRole('group', { name: 'Layers' })
    .getByRole('button', { name: 'Bass', exact: true })
    .click();
  await page
    .getByRole('region', { name: 'Metronome' })
    .getByRole('button', { name: 'Play', exact: true })
    .click();

  // Two bars of 4/4: eight bass notes.
  const saws = async () => (await starts(page)).filter((s) => s.kind === 'sawtooth');
  await expect
    .poll(async () => (await saws()).length, { timeout: 10_000 })
    .toBeGreaterThanOrEqual(8);
  const bass = (await saws()).slice(0, 8);
  bass.forEach((s, k) => expect(s.frequency).toBeCloseTo(k % 4 === 0 ? E2 : B2, 2));
  bass.forEach((s, k) => expect(s.when - bass[0]!.when).toBeCloseTo(k * QUARTER, 6));

  // The click sounds each pulse beside it, each once.
  const clicks = (await starts(page)).filter(isClick).filter((s) => s.when <= bass[7]!.when);
  expect(clicks.map((s) => s.when)).toEqual(bass.map((s) => s.when));
  expect(errors).toEqual([]);
});
