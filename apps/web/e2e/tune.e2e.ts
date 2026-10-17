import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect, test } from '@playwright/test';
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
  await page.getByRole('tab', { name: 'Tune' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();

  const note = page.getByRole('region', { name: 'Note' });
  await expect(note.locator('.name')).toHaveText('A2', { timeout: 15_000 });
  // The reading is the median of 10 looks a tenth of a second apart. A look whose frame holds the
  // seam where the fake device loops its file reads up to 7 cents sharp (+21.2 and +26.6 cents,
  // 111.36 and 111.70 Hz, in 2 to 4 of 40 looks over four runs, #342); every other look reads
  // +20.0 cents, 111.28 Hz, so the median is the recording's, whichever look comes first.
  const looks: { cents: number; offsetHz: number; nearestHz: number; heardHz: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const [cents, detail] = await Promise.all([
      note.locator('.cents').innerText(),
      note.locator('.detail').innerText(),
    ]);
    const [, offsetHz, nearestHz, heardHz] =
      /([+−][\d.]+) Hz from ([\d.]+) Hz · heard ([\d.]+) Hz/.exec(detail)!;
    looks.push({
      cents: Number.parseFloat(cents.replace('−', '-')),
      offsetHz: Number(offsetHz!.replace('−', '-')),
      nearestHz: Number(nearestHz),
      heardHz: Number(heardHz),
    });
    await page.waitForTimeout(100);
  }
  const median = (read: (look: (typeof looks)[number]) => number) =>
    looks.map(read).sort((a, b) => a - b)[looks.length >> 1]!;
  const seen = JSON.stringify(looks.map((l) => l.heardHz));
  expect(
    median((l) => l.cents),
    seen,
  ).toBeGreaterThanOrEqual(19);
  expect(
    median((l) => l.cents),
    seen,
  ).toBeLessThan(22);
  expect(median((l) => l.nearestHz)).toBeCloseTo(110, 2);
  expect(
    median((l) => l.heardHz),
    seen,
  ).toBeCloseTo(HEARD_HZ, 1);
  expect(
    median((l) => l.offsetHz),
    seen,
  ).toBeCloseTo(HEARD_HZ - A2_HZ, 1);

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

  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await expect(note.locator('.name')).toHaveText('–');
  expect(errors).toEqual([]);
});

test('leaves the microphone when the person goes back to the lobby', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Tune' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Note' }).locator('.name')).toHaveText('A2', {
    timeout: 15_000,
  });
  await page.getByRole('tab', { name: 'Play' }).click();
  await page.getByRole('tab', { name: 'Tune' }).click();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
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
  await page.getByRole('tab', { name: 'Tune' }).click();
  await page.getByLabel('Listen to').selectOption({ label: 'This device’s synth (what it plays)' });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
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

/**
 * The live correction (#298), in Chromium. Measured here, headless Chromium 141
 * on four cores: the worklet renders 6 s of sound off-line in about 0.5 s (12
 * times real time); a sound comes out 51 ms late, 49 of them its latency (a
 * tracker of 1024 samples and 3.25 periods of the lowest note taken, 70 Hz, and
 * a block); a probe 20 cents sharp of A2 comes out on A2 to a tenth of a cent;
 * and a recorded A2 20 cents sharp, played through the real graph, is read by
 * the tuner as A2 within a few cents except at the seam where the fake device
 * loops its file. The browser's render capacity is not there in this build, so
 * the load of the live audio thread is not measured: the off-line factor is
 * what this says of the room there is.
 */
test('measures the correcting worklet off-line in Chromium: faster than real time, late by its latency, and on the note', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = await listen(page);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Tune' }).click();
  const card = page.getByRole('region', { name: 'Correct' });
  await card.getByRole('button', { name: 'Measure this device' }).click();
  const text = (await card.getByLabel('Measurement').innerText()).replace(/\s+/g, ' ');
  const [, factor] = /(\d+) times real time/.exec(text)!;
  const [, late] = /came out (\d+) ms late/.exec(text)!;
  const [, cents] = /Hz, ([+−][\d.]+) cents from the note 110\.0 Hz/.exec(text)!;
  expect(Number(factor)).toBeGreaterThanOrEqual(3);
  expect(Number(late)).toBeGreaterThanOrEqual(40);
  expect(Number(late)).toBeLessThanOrEqual(60);
  expect(Math.abs(Number(cents!.replace('−', '-')))).toBeLessThan(2);
  expect(errors).toEqual([]);
});

test('pulls a recorded A2, 20 cents sharp, onto A2 through the worklet, and the tuner reads the corrected sound', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = await listen(page);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Tune' }).click();
  const card = page.getByRole('region', { name: 'Correct' });
  await card.getByRole('button', { name: 'Start correcting' }).click();
  await expect(card.getByText(/Hearing 11\d\.\d Hz, moving it −(1\d|2\d)\.\d cents/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(card.getByText(/Adds 4\d ms/)).toBeVisible();
  await page
    .getByLabel('Listen to')
    .selectOption({ label: 'The corrected sound (from the correction below)' });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const note = page.getByRole('region', { name: 'Note' });
  await expect(note.locator('.name')).toHaveText('A2', { timeout: 15_000 });
  await page.waitForTimeout(1500);
  // 40 looks over 6 s. Most read the corrected sound on the note (0.0 cents), and about a third,
  // at a steady beat, some 11 cents flat, whatever the load: 24 to 29 of 40 looks on the note in
  // eight runs, four alone and four at a load of 9 to 15 on four cores (#342). Ten looks, with a
  // bound of 6, sat on that share's edge and failed once in four full runs at a load of 1; over
  // 40 the count holds to its share, and half of them is 4 under the fewest seen.
  const cents: number[] = [];
  for (let i = 0; i < 40; i++) {
    cents.push(Number.parseFloat((await note.locator('.cents').innerText()).replace('−', '-')));
    await page.waitForTimeout(150);
  }
  // The recording is +20 cents: what the tuner reads from the corrected sound is on the note.
  const onTheNote = cents.filter((c) => Math.abs(c) < 3).length;
  expect(onTheNote, JSON.stringify(cents)).toBeGreaterThanOrEqual(20);
  expect(errors).toEqual([]);
});

/**
 * The tone (slice 7) on the synth heard through its own output. The lead goes
 * through a lowpass filter at a fixed frequency, which is a formant in this
 * sense: its harmonic levels follow that frequency and not the pitch, so its
 * fingerprint moves with the note (measured here, from A4: 4.5 dB at A3, 4.2
 * at A2, 9.1 at A5), which is the limit of the claim `timbre.ts` states.
 */
test('hears the synth’s lead as one tone near its pitch, and as another an octave up: the limit of the fingerprint', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Tune' }).click();
  await page.getByLabel('Listen to').selectOption({ label: 'This device’s synth (what it plays)' });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const send = page.getByRole('region', { name: 'Send a note' });
  const tone = page.getByRole('region', { name: 'Tone' });
  await send.getByRole('button', { name: 'Hold the note' }).click();
  await expect(tone.locator('rect.bar')).toHaveCount(12);
  await page.waitForTimeout(1200);
  await tone.getByRole('button', { name: 'Remember this tone' }).click();
  const differenceAt = async (step: string) => {
    await send.getByRole('button', { name: step }).click();
    await page.waitForTimeout(1500);
    const text = await tone.getByText(/dB from the remembered/).innerText();
    return Number.parseFloat(text);
  };
  expect(await differenceAt('−octave')).toBeGreaterThan(3);
  expect(await differenceAt('+octave')).toBeLessThan(0.5); // back on A4: the same sound
  const up = await differenceAt('+octave');
  expect(up).toBeGreaterThan(6);
  expect(up).toBeLessThan(14);
});

/** A 16-bit mono WAV of a pitch made of harmonics, which the fake device loops. */
function wavOfHarmonics(hz: number, levels: number[]): Buffer {
  const samples = SAMPLE_RATE * 2;
  const peak = levels.reduce((a, b) => a + b, 0);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    let v = 0;
    levels.forEach((a, k) => (v += a * Math.sin((2 * Math.PI * hz * (k + 1) * i) / SAMPLE_RATE)));
    data.writeInt16LE(Math.round((0.6 * 32767 * v) / peak), i * 2);
  }
  return Buffer.concat([headerFor(data.length), data]);
}

function headerFor(bytes: number): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + bytes, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(bytes, 40);
  return header;
}

const dir = mkdtempSync(join(tmpdir(), 'jambot-tone-'));
const sawFile = join(dir, 'saw.wav');
const squareFile = join(dir, 'square.wav');
writeFileSync(
  sawFile,
  wavOfHarmonics(
    220,
    Array.from({ length: 12 }, (_, k) => 1 / (k + 1)),
  ),
);
writeFileSync(
  squareFile,
  wavOfHarmonics(
    220,
    Array.from({ length: 12 }, (_, k) => ((k + 1) % 2 ? 1 / (k + 1) : 0)),
  ),
);

/** Each recording on a browser of its own, since what the fake device plays is a launch option. */
for (const [name, file, absent] of [
  ['a saw', sawFile, 0],
  ['a square wave', squareFile, 6],
] as const)
  test(`shows the harmonics of a recording of ${name}: ${absent} of the twelve missing, and a steady note`, async ({
    baseURL,
  }) => {
    const browser = await chromium.launch({
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-audio-capture=${file}`,
      ],
    });
    try {
      const context = await browser.newContext({
        baseURL: baseURL!,
        permissions: ['microphone'],
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('tab', { name: 'Tune' }).click();
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      const tone = page.getByRole('region', { name: 'Tone' });
      await expect(tone.getByText(/Steady, with no width/)).toBeVisible({ timeout: 15_000 });
      await expect(tone.locator('rect.bar')).toHaveCount(12);
      await expect(tone.locator('rect.bar.missing')).toHaveCount(absent);
    } finally {
      await browser.close();
    }
  });
