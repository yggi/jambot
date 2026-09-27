import { type Page, expect, test } from '@playwright/test';

interface Start {
  /** What started: an oscillator's type, or noise. */
  kind: string;
  /** An oscillator's frequency as it starts: 440 for a kick, whose pitch only glides. */
  frequency: number | null;
  when: number;
}

/**
 * Listens to the app: every sound source it starts, with its kind and time;
 * every Worker it runs; and a tap on everything that reaches the speakers.
 */
async function listen(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    const w = window as unknown as {
      starts: Start[];
      workers: { running: number; made: number };
      tap?: AnalyserNode;
    };
    w.starts = [];
    w.workers = { running: 0, made: 0 };
    // Buffer sources (the noise voices) have their own start.
    for (const source of [OscillatorNode, AudioBufferSourceNode]) {
      const start = source.prototype.start as (...args: number[]) => void;
      source.prototype.start = function (
        this: AudioScheduledSourceNode,
        when = 0,
        ...rest: number[]
      ) {
        const osc = this instanceof OscillatorNode ? this : null;
        w.starts.push({
          kind: osc?.type ?? 'noise',
          frequency: osc?.frequency.value ?? null,
          when,
        });
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
    const Base = Worker;
    window.Worker = class extends Base {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        w.workers.made++;
        w.workers.running++;
      }
      override terminate() {
        w.workers.running--;
        super.terminate();
      }
    };
  });
  await page.goto('/');
  return errors;
}

const starts = (page: Page) =>
  page.evaluate(() => (window as unknown as { starts: Start[] }).starts);

/** The distinct times sources were started at, in seconds on the audio clock. */
const onsets = async (page: Page) =>
  [...new Set((await starts(page)).map((s) => s.when))].sort((a, b) => a - b);

/** The loudest sample the speakers are getting now. */
const level = (page: Page) =>
  page.evaluate(() => {
    const tap = (window as unknown as { tap: AnalyserNode }).tap;
    const data = new Float32Array(tap.fftSize);
    tap.getFloatTimeDomainData(data);
    return Math.max(...data.map(Math.abs));
  });

const workers = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { workers: { running: number; made: number } }).workers,
  );

/** Where each onset falls after the first, in steps, as the fraction of a step. */
const phases = (times: number[], bpm: number) =>
  times.map((t) => {
    const steps = (t - times[0]!) / (15 / bpm);
    return Math.abs(steps - Math.round(steps * 3) / 3) < 1e-6
      ? Math.round((steps - Math.floor(steps + 1e-6)) * 3) / 3
      : NaN;
  });

const start = (page: Page) => page.getByRole('button', { name: 'Start the band' }).click();

test('plays, follows on screen, and stops at once, without an error', async ({ page }) => {
  const errors = await listen(page);
  await expect(page.getByText('Ready')).toBeVisible();
  // Swing jazz at full energy: the ride rings 0.45 s, so only the fade on
  // Stop can silence what is scheduled within 300 ms. The fade falls with a
  // time constant of 30 ms, so by then it leaves about e^-10 of the level;
  // a ride started up to 120 ms after Stop would still ring near 0.005.
  await page.getByRole('button', { name: 'Swing jazz' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  // Only the stage says where in its section the bar heard is: the song map
  // names the intro before anything is heard.
  await expect(page.getByText('Bar 1 of 8')).toBeVisible();
  await expect(page.getByText('Bar 2 of 8')).toBeVisible({ timeout: 5000 });
  let loudest = 0;
  for (let i = 0; i < 100 && loudest < 0.01; i++) {
    loudest = Math.max(loudest, await level(page));
    await page.waitForTimeout(20);
  }
  expect(loudest).toBeGreaterThan(0.01);
  expect(await workers(page)).toEqual({ running: 1, made: 1 });
  await page.getByRole('button', { name: 'Stop' }).click();
  await page.waitForTimeout(300);
  expect(await level(page)).toBeLessThan(0.0005);
  await expect(page.getByText('Ready')).toBeVisible();
  expect(await workers(page)).toEqual({ running: 0, made: 1 });
  expect(errors).toEqual([]);
});

test('plays every event once', async ({ page }) => {
  await listen(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  await page.waitForTimeout(3000);
  // A kick starts one sine oscillator whose pitch only glides (so it starts
  // at 440 Hz), and a snare one triangle at 185 Hz, which no MIDI note is.
  // Two of either at one instant would be an event played twice.
  const all = await starts(page);
  for (const [kind, frequency] of [
    ['sine', 440],
    ['triangle', 185],
  ] as const) {
    const times = all
      .filter((s) => s.kind === kind && s.frequency === frequency)
      .map((s) => s.when);
    expect(times.length).toBeGreaterThan(0);
    expect(new Set(times).size).toBe(times.length);
  }
});

test('starts and stops on a quick double click, and leaves nothing running', async ({ page }) => {
  await listen(page);
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Start'),
    )!;
    button.click();
    button.click();
  });
  await page.waitForTimeout(500);
  await expect(page.getByText('Ready')).toBeVisible();
  expect(await starts(page)).toEqual([]);
  expect((await workers(page)).running).toBe(0);
});

test('plays a straight preset on the 16th grid', async ({ page }) => {
  await listen(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  await page.waitForTimeout(3000);
  const times = await onsets(page);
  expect(times.length).toBeGreaterThan(8);
  // Synth-pop: 108 bpm, no swing.
  expect(new Set(phases(times, 108))).toEqual(new Set([0]));
});

test('swings a swung preset into triplet 8ths (T4)', async ({ page }) => {
  await listen(page);
  await page.getByRole('button', { name: 'Swing jazz' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  await page.waitForTimeout(3000);
  const times = await onsets(page);
  expect(times.length).toBeGreaterThan(8);
  // Swing jazz: 148 bpm, full triplet swing. The offbeat 8th lies 2/3 of a
  // step late, which a 16th shuffle never plays, and every onset is on a
  // third of a step.
  const found = new Set(phases(times, 148));
  expect(found.has(NaN)).toBe(false);
  expect(found.has(2 / 3)).toBe(true);
});

test('plays the full band: bass, chords and lead beside the drums', async ({ page }) => {
  await listen(page);
  // Deep house: a groove with harmony, and energy enough for the lead.
  await page.getByRole('button', { name: 'Deep house' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  // The intro is 8 bars; the lead joins after it, at 122 bpm about 16 s in.
  await page.waitForTimeout(20000);
  const all = await starts(page);
  const midi = (f: number | null) =>
    f !== null &&
    Math.abs(12 * Math.log2(f / 440) + 69 - Math.round(12 * Math.log2(f / 440) + 69)) < 1e-6;
  // The bass: a saw on a MIDI note in 33–57.
  const bass = all.filter((s) => s.kind === 'sawtooth');
  expect(bass.length).toBeGreaterThan(0);
  for (const s of bass) {
    expect(midi(s.frequency)).toBe(true);
    const note = Math.round(12 * Math.log2(s.frequency! / 440) + 69);
    expect(note).toBeGreaterThanOrEqual(33);
    expect(note).toBeLessThanOrEqual(57);
  }
  // The chords: a sine detuned by 0.3 % beside each triangle.
  const detuned = all.filter(
    (s) => s.kind === 'sine' && s.frequency !== 440 && midi(s.frequency! / 1.003),
  );
  expect(detuned.length).toBeGreaterThan(0);
  // The lead: a square on a MIDI note in 60–86.
  const lead = all.filter((s) => s.kind === 'square');
  expect(lead.length).toBeGreaterThan(0);
  for (const s of lead) {
    const note = Math.round(12 * Math.log2(s.frequency! / 440) + 69);
    expect(note).toBeGreaterThanOrEqual(60);
    expect(note).toBeLessThanOrEqual(86);
  }
});

test('takes a motif typed on the computer keys, and the lead plays it back from the bar after next (#79)', async ({
  page,
}) => {
  const errors = await listen(page);
  // At energy 0 the lead rests on its own, so a lead note the band plays is the motif.
  await page.getByRole('slider', { name: /Energy/ }).fill('0');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await start(page);
  await expect(page.getByText('Bar 2 of 8')).toBeVisible({ timeout: 5000 });
  // Synth-pop at 108 bpm: a step is 15 / 108 s. Three notes four steps apart, in one bar.
  const step = 15 / 108;
  for (const key of ['a', 'd', 'g']) {
    await page.keyboard.down(key);
    await page.waitForTimeout(60);
    await page.keyboard.up(key);
    await page.waitForTimeout(step * 4 * 1000 - 60);
  }
  await expect(page.getByText(/: Took a 3-note motif from the computer keys\./)).toBeVisible({
    timeout: 8000,
  });
  await expect(page.getByText(/Lead is playing the motif heard in bar \d+\./)).toBeVisible({
    timeout: 8000,
  });
  await page.waitForTimeout(3000);

  // The lead's voice is a square: the first three are the keys played along, at once;
  // the rest are the band's, on the grid.
  const squares = (await starts(page)).filter((s) => s.kind === 'square').map((s) => s.when);
  const along = squares.slice(0, 3);
  const band = squares.slice(3);
  expect(band.length).toBeGreaterThanOrEqual(4);
  const steps = (a: number, b: number) => (b - a) / step;
  const typed = [steps(along[0]!, along[1]!), steps(along[1]!, along[2]!)];
  for (const [i, gap] of [steps(band[0]!, band[1]!), steps(band[1]!, band[2]!)].entries()) {
    expect(Math.abs(gap - Math.round(gap))).toBeLessThan(1e-6);
    expect(Math.abs(gap - typed[i]!)).toBeLessThan(1.5);
  }
  // It plays whole in every bar: the next bar starts it again, a bar later.
  expect(Math.abs(steps(band[0]!, band[3]!) - 16)).toBeLessThan(1e-6);
  expect(errors).toEqual([]);
});
