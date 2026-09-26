import { type Page, expect, test } from '@playwright/test';

/**
 * Listens to the app: every start time the page gives an audio source, and a
 * tap on everything that reaches the speakers.
 */
async function listen(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    const w = window as unknown as { starts: number[]; tap?: AnalyserNode };
    w.starts = [];
    // Buffer sources (the noise voices) have their own start.
    for (const source of [OscillatorNode, AudioBufferSourceNode]) {
      const start = source.prototype.start as (...args: number[]) => void;
      source.prototype.start = function (
        this: AudioScheduledSourceNode,
        when = 0,
        ...rest: number[]
      ) {
        w.starts.push(when);
        return start.call(this, when, ...rest);
      };
    }
    const connect = AudioNode.prototype.connect as (...args: unknown[]) => unknown;
    AudioNode.prototype.connect = function (this: AudioNode, target: unknown, ...rest: unknown[]) {
      if (target instanceof AudioDestinationNode) {
        w.tap ??= target.context.createAnalyser();
        connect.call(this, w.tap);
      }
      return connect.call(this, target, ...rest);
    } as typeof AudioNode.prototype.connect;
  });
  await page.goto('/');
  return errors;
}

/** The distinct times sources were started at, in seconds on the audio clock. */
const onsets = (page: Page) =>
  page.evaluate(() => {
    const starts = (window as unknown as { starts: number[] }).starts;
    return [...new Set(starts)].sort((a, b) => a - b);
  });

/** The loudest sample the speakers are getting now. */
const level = (page: Page) =>
  page.evaluate(() => {
    const tap = (window as unknown as { tap: AnalyserNode }).tap;
    const data = new Float32Array(tap.fftSize);
    tap.getFloatTimeDomainData(data);
    return Math.max(...data.map(Math.abs));
  });

/** Where each onset falls after the first, in steps, as the fraction of a step. */
const phases = (times: number[], bpm: number) =>
  times.map((t) => {
    const steps = (t - times[0]!) / (15 / bpm);
    return Math.abs(steps - Math.round(steps * 3) / 3) < 1e-6
      ? Math.round((steps - Math.floor(steps + 1e-6)) * 3) / 3
      : NaN;
  });

test('plays, follows on screen, and stops, without an error', async ({ page }) => {
  const errors = await listen(page);
  await expect(page.getByText('Ready')).toBeVisible();
  await page.getByRole('button', { name: 'Start the band' }).click();
  await expect(page.getByText('Intro')).toBeVisible();
  await expect(page.getByText('Bar 2')).toBeVisible({ timeout: 5000 });
  let loudest = 0;
  for (let i = 0; i < 100 && loudest < 0.01; i++) {
    loudest = Math.max(loudest, await level(page));
    await page.waitForTimeout(20);
  }
  expect(loudest).toBeGreaterThan(0.01);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText('Ready')).toBeVisible();
  await page.waitForTimeout(500);
  expect(await level(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('plays a straight preset on the 16th grid', async ({ page }) => {
  await listen(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await page.waitForTimeout(3000);
  const times = await onsets(page);
  expect(times.length).toBeGreaterThan(8);
  // Synth-pop: 108 bpm, no swing.
  expect(new Set(phases(times, 108))).toEqual(new Set([0]));
});

test('swings a swung preset onto thirds of a step', async ({ page }) => {
  await listen(page);
  await page.getByRole('button', { name: 'Swing jazz' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await page.waitForTimeout(3000);
  const times = await onsets(page);
  expect(times.length).toBeGreaterThan(8);
  // Swing jazz: 148 bpm, full triplet swing, so the offbeat 8th lies 2/3 of
  // a step late and the 16ths around it 1/3. Every onset is on a third.
  const found = new Set(phases(times, 148));
  expect(found.has(NaN)).toBe(false);
  expect([...found].some((p) => p > 0)).toBe(true);
});
