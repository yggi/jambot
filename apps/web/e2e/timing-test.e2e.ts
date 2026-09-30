import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { listen, starts } from './audio.ts';

/**
 * The timing test (#204, H7) in Chromium: it plays its pattern on the
 * built-in synth, takes taps of the computer's keys, keeps the whole run in
 * `localStorage`, and hands every run over as a download.
 */
test('plays a two-sound pattern, follows the taps, keeps the run and downloads it', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = await listen(page);
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Timing test' }).click();
  await page.getByRole('radio', { name: '120 bpm' }).click();
  await page.getByRole('button', { name: 'Start the test' }).click();
  await expect(page.getByRole('button', { name: 'Tap along' })).toBeVisible();

  // Every 400 ms, a key: some near a hit, some not.
  for (let i = 0; i < 44 && !(await page.getByLabel('Result').isVisible()); i++) {
    await page.keyboard.press('a');
    await page.waitForTimeout(400);
  }
  await expect(page.getByLabel('Result')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel('Result')).toContainText(/of 32 hits followed/);

  // A kick is one sine at 440 Hz, a snare one triangle at 185 Hz: two of each
  // a bar, for eight bars. Nothing else in this test starts those.
  const all = await starts(page);
  const kicks = all.filter((s) => s.kind === 'sine' && s.frequency === 440);
  const snares = all.filter((s) => s.kind === 'triangle' && s.frequency === 185);
  expect(kicks).toHaveLength(16);
  expect(snares).toHaveLength(16);
  // 120 bpm: a beat is half a second, and the first kick is a bar after the count-in began.
  const gaps = kicks.slice(1).map((k, i) => k.when - kicks[i]!.when);
  for (const gap of gaps) expect(gap).toBeCloseTo(1, 2);

  const kept = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('jambot:timing-runs') ?? '[]'),
  );
  expect(kept).toHaveLength(1);
  const run = kept[0];
  expect(run).toMatchObject({
    format: 'jambot timing test',
    version: 1,
    pattern: 'quarters',
    bpm: 120,
    bars: 8,
  });
  expect(run.expected).toHaveLength(32);
  expect(run.taps.length).toBeGreaterThan(20);
  for (const tap of run.taps) {
    expect(tap.source).toBe('the computer keys');
    expect(tap.eventMs).toBeGreaterThan(0);
    expect(tap.handledMs).toBeGreaterThanOrEqual(tap.eventMs);
    expect(Number.isFinite(tap.heardAt)).toBe(true);
  }
  expect(run.environment.sampleRate).toBeGreaterThan(0);
  expect(run.clock.length).toBeGreaterThan(20);
  expect(run.summary.hits).toBe(32);

  // The download is every run, whole.
  const json = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download all (JSON)' }).click();
  const file = await json;
  expect(file.suggestedFilename()).toMatch(/^jambot-timing-tests-.*\.json$/);
  const text = await readFile((await file.path())!, 'utf8');
  expect(JSON.parse(text).runs).toEqual(kept);
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download taps (CSV)' }).click();
  const table = await (
    await import('node:fs/promises')
  ).readFile((await (await csv).path())!, 'utf8');
  expect(table.trimEnd().split('\n')).toHaveLength(run.taps.length + 1);

  // The run is still there after a reload, and the test can go back to the lobby.
  await page.reload();
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Timing test' }).click();
  await expect(page.getByText(/\d+\/32 hits/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to the lobby' }).click();
  await expect(page.getByRole('button', { name: 'Solo', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('stops on request and keeps nothing', async ({ page }) => {
  const errors = await listen(page);
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Timing test' }).click();
  await page.getByRole('button', { name: 'Start the test' }).click();
  await page.waitForTimeout(1500);
  await page.keyboard.press('s');
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText(/nothing was kept/i)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('jambot:timing-runs'))).toBeNull();
  expect(errors).toEqual([]);
});

/**
 * A player who strikes a key exactly when each kick and snare is heard,
 * by the page's own pairing of the audio clock with its clock, is on time:
 * every hit is answered and the mean offset is a few milliseconds. This is
 * the pipeline end to end, from the scheduled note through the pairing to
 * the event's timestamp and the match; a latency taken with the wrong sign
 * or a hit placed on the wrong clock would move every offset by it.
 */
test('a player exactly on the heard beat is on time, on every hit', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = await listen(page);
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Timing test' }).click();
  await page.getByRole('radio', { name: '120 bpm' }).click();
  await page.getByRole('button', { name: 'Start the test' }).click();
  await expect(page.getByRole('button', { name: 'Tap along' })).toBeVisible();
  // A second in, the output has run long enough for its pairing to be read.
  await page.waitForTimeout(1200);
  const scheduled = await page.evaluate(() => {
    const w = window as unknown as {
      starts: { kind: string; frequency: number | null; when: number }[];
      contexts: AudioContext[];
    };
    const ctx = w.contexts[0]!;
    const pair = () => ctx.getOutputTimestamp() as { contextTime: number; performanceTime: number };
    const hits = w.starts.filter(
      (s) =>
        (s.kind === 'sine' && s.frequency === 440) ||
        (s.kind === 'triangle' && s.frequency === 185),
    );
    const first = pair();
    for (const hit of hits) {
      const rough = first.performanceTime + (hit.when - first.contextTime) * 1000;
      // The pairing read just before the hit, so it is extrapolated a short way.
      setTimeout(
        () => {
          const ts = pair();
          const at = ts.performanceTime + (hit.when - ts.contextTime) * 1000;
          setTimeout(
            () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })),
            at - performance.now(),
          );
        },
        rough - 150 - performance.now(),
      );
    }
    return hits.length;
  });
  expect(scheduled).toBe(32);
  await expect(page.getByLabel('Result')).toBeVisible({ timeout: 40_000 });
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem('jambot:timing-runs')!)[0]);
  expect(run.summary).toMatchObject({ hits: 32, answered: 32, missed: 0, extra: 0 });
  const { mean, sd } = run.summary.offsets;
  console.log(
    `exactly on the heard beat: mean ${mean.toFixed(2)} ms, spread ${sd.toFixed(2)} ms over 32 hits`,
  );
  expect(Math.abs(run.summary.offsets.mean)).toBeLessThan(15);
  expect(run.summary.offsets.sd).toBeLessThan(15);
  expect(run.summary.offsets.onTime).toBeGreaterThan(0.9);
  expect(errors).toEqual([]);
});

/** A click of the tap button is one tap: the browser follows its pointer down with a click, itself a pointer event. */
test('a click on the tap button is one tap, not two', async ({ page }) => {
  const errors = await listen(page);
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Timing test' }).click();
  await page.getByRole('button', { name: 'Start the test' }).click();
  const tap = page.getByRole('button', { name: 'Tap along' });
  for (let i = 0; i < 3; i++) {
    await tap.click();
    await page.waitForTimeout(300);
  }
  await expect(page.getByText(/^3 taps ·/)).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  expect(errors).toEqual([]);
});
