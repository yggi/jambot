import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { listen } from './audio.ts';

/**
 * The tuner (#269) in Chromium, on a microphone that is a recording: a sine
 * 20 cents sharp of A2, which Chromium's fake capture device plays over and
 * over. The tuner must name the note, read the distance in cents and Hz, and
 * take the longer frame a low note needs (8192 samples, 171 ms at 48 kHz).
 */
const SAMPLE_RATE = 48000;
const A2_HZ = 110;
const SHARP_CENTS = 20;
const HEARD_HZ = A2_HZ * 2 ** (SHARP_CENTS / 1200);

/** A 16-bit mono WAV of two seconds of a sine, which the fake device loops. */
function wav(hz: number): Buffer {
  const samples = SAMPLE_RATE * 2;
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++)
    data.writeInt16LE(
      Math.round(0.5 * 32767 * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE)),
      i * 2,
    );
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const file = join(mkdtempSync(join(tmpdir(), 'jambot-tune-')), 'a2-sharp.wav');
writeFileSync(file, wav(HEARD_HZ));

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${file}`,
    ],
  },
});

test('names a recorded A2, 20 cents sharp, reads it over a frame longer than the shortest, and lets go on Stop', async ({
  page,
}) => {
  const errors = await listen(page);
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Tuner' }).click();
  await page.getByRole('button', { name: 'Start' }).click();

  const note = page.getByRole('region', { name: 'Note' });
  await expect(note.locator('.name')).toHaveText('A2', { timeout: 15_000 });
  await expect(note.locator('.cents')).toHaveText(/^\+(19|20|21)\.\d cents$/);
  const detail = await note.locator('.detail').innerText();
  const [, offsetHz, nearestHz, heardHz] =
    /([+−][\d.]+) Hz from ([\d.]+) Hz · heard ([\d.]+) Hz/.exec(detail)!;
  expect(Number(nearestHz)).toBeCloseTo(110, 2);
  expect(Number(heardHz)).toBeCloseTo(HEARD_HZ, 1);
  expect(Number(offsetHz!.replace('−', '-'))).toBeCloseTo(HEARD_HZ - A2_HZ, 1);

  const spectrum = page.getByRole('region', { name: 'Spectrum' });
  await expect(spectrum.getByText(/Pitch read over 1[78]\d ms/)).toBeVisible();
  expect(await spectrum.locator('path.line').getAttribute('d')).toMatch(/^M0,/);
  await expect(spectrum.locator('line.pitch')).toHaveCount(1);

  // The waterfall: a pixel a band across, the newest look on the top line, and the note's own column bright in it.
  const top = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const { width } = canvas;
    const line = canvas.getContext('2d')!.getImageData(0, 0, width, 1).data;
    const light = Array.from(
      { length: width },
      (_, x) => line[x * 4]! + line[x * 4 + 1]! + line[x * 4 + 2]!,
    );
    return {
      width,
      brightest: light.indexOf(Math.max(...light)),
      max: Math.max(...light),
      median: [...light].sort((a, b) => a - b)[width >> 1]!,
    };
  });
  expect(top.width).toBe(175);
  expect(top.max).toBeGreaterThan(450);
  expect(top.median).toBeLessThan(200);
  // The bright column is the note's band: a quarter tone each, counted from A0 (27.5 Hz).
  expect(Math.abs(top.brightest - Math.round(24 * Math.log2(HEARD_HZ / 27.5)))).toBeLessThanOrEqual(
    3,
  );

  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await expect(note.locator('.name')).toHaveText('–');
  expect(errors).toEqual([]);
});

test('leaves the microphone when the person goes back to the lobby', async ({ page }) => {
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Tuner' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: 'Note' }).locator('.name')).toHaveText('A2', {
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Back to the lobby' }).click();
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Tuner' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await expect(page.getByText('Not listening.')).toBeVisible();
});

/**
 * The loop: a note the built-in synth plays is heard by the tuner through the
 * synth's own output, at a frequency the synth knows exactly (A4 = 440 Hz, the
 * rest by 2^(n/12)), so what the tuner reads as cents from the note sent is
 * the tuner's own error, through Web Audio, a worker and the page. Measured on
 * Chromium: under 0.05 cents, the display's resolution, from A1 to A6.
 */
test('hears the synth it plays through: a note sent is read within a quarter cent, from A1 to A6', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = await listen(page);
  await page.goto('/');
  await page.locator('details[aria-label="Extras"] summary').click();
  await page.getByRole('button', { name: 'Tuner' }).click();
  await page.getByLabel('Listen to').selectOption({ label: 'This device’s synth (what it plays)' });
  await page.getByRole('button', { name: 'Start' }).click();
  const send = page.getByRole('region', { name: 'Send a note' });
  const note = page.getByRole('region', { name: 'Note' });
  await send.getByRole('button', { name: 'Hold the note' }).click();

  const measured: { name: string; cents: number[] }[] = [];
  const read = async () => {
    const text = (await note.locator('.cents').innerText()).replace('−', '-');
    return Number.parseFloat(text);
  };
  // From A4 up two octaves, then down to A1, an octave at a time.
  const path = [0, 1, 1, -1, -1, -1, -1, -1];
  for (const step of path) {
    if (step !== 0)
      await send.getByRole('button', { name: step > 0 ? '+octave' : '−octave' }).click();
    const sent = await send.locator('.sent').innerText();
    await expect(note.locator('.name')).toHaveText(sent);
    await page.waitForTimeout(900); // the low notes' frame holds 340 ms of what came before
    const cents: number[] = [];
    for (let i = 0; i < 6; i++) {
      cents.push(await read());
      await page.waitForTimeout(100);
    }
    measured.push({ name: sent, cents });
  }
  for (const { name, cents } of measured)
    for (const c of cents) expect(Math.abs(c), `${name}: ${cents}`).toBeLessThan(0.25);

  // The reading is of the sound, not of the note asked for: a reference of 442 Hz puts the same A1 at 7.85 cents flat of its A.
  await page.getByLabel('A4 is').fill('442');
  await expect.poll(read).toBeCloseTo(-7.85, 0);
  expect(errors).toEqual([]);
});
