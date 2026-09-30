import { type Page, expect, test } from '@playwright/test';
import { level, listen, onsets, openStyle, solo, starts, workers } from './audio.ts';

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
  await solo(page);
  await expect(page.getByText('Ready')).toBeVisible();
  // Swing jazz at full energy: the ride rings 0.45 s, so only the fade on
  // Stop can silence what is scheduled within 300 ms. The fade falls with a
  // time constant of 30 ms, so by then it leaves about e^-10 of the level;
  // a ride started up to 120 ms after Stop would still ring near 0.005.
  await openStyle(page);
  await page.getByRole('button', { name: 'Swing jazz' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  // Only the plan says where in its section the bar heard is: the song map
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
  await solo(page);
  await openStyle(page);
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
  await solo(page);
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
  await solo(page);
  await openStyle(page);
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
  await solo(page);
  await openStyle(page);
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

test('clicks the band’s own beats, and the swing moves its offbeats to the band’s (#166)', async ({
  page,
}) => {
  await listen(page);
  await solo(page);
  await openStyle(page);
  await page.getByRole('button', { name: 'Swing jazz' }).click();
  await page.getByLabel('Metrum').locator('summary').click();
  await page.getByRole('button', { name: 'Click' }).click();
  await start(page);
  await page.waitForTimeout(4000);
  const all = await starts(page);
  // The click tells its weights apart by pitch: a square at 1800 Hz on the
  // downbeat, a triangle at 1200 on the other pulses, a sine at 800 between.
  const at = (kind: string, frequency: number) =>
    all
      .filter((s) => s.kind === kind && s.frequency === frequency)
      .map((s) => s.when)
      .sort((x, y) => x - y);
  const pulses = [...at('square', 1800), ...at('triangle', 1200)].sort((x, y) => x - y);
  const offbeats = at('sine', 800);
  expect(pulses.length).toBeGreaterThan(8);
  expect(offbeats.length).toBeGreaterThan(8);
  // Swing jazz: 148 bpm, so a pulse lasts four steps, 60 / 148 s, and the
  // offbeat eighth lies 2/3 of the way to the next, as the band's ride does.
  const beat = 60 / 148;
  pulses.slice(1).forEach((t, i) => expect(t - pulses[i]!).toBeCloseTo(beat, 3));
  for (const t of offbeats) {
    const before = pulses.filter((p) => p < t).at(-1);
    if (before !== undefined) expect((t - before) / beat).toBeCloseTo(2 / 3, 2);
  }
});

test('plays the full band: bass, chords and lead beside the drums', async ({ page }) => {
  await listen(page);
  await solo(page);
  // Deep house: a groove with harmony, and energy enough for the lead.
  await openStyle(page);
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
  await solo(page);
  // At energy 0 the lead rests on its own, so a lead note the band plays is the motif.
  await openStyle(page);
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
  await expect(
    page
      .getByLabel('Conductor')
      .getByText(/Lead is playing the motif from the computer keys, heard in bar \d+\./),
  ).toBeVisible({
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

/**
 * The other inputs a melody comes from. Each is played as a player plays
 * it: the on-screen keys pressed, and a MIDI keyboard's messages arriving
 * on an input the page listens to (Web MIDI stood in for, since a headless
 * browser has no ports).
 */
const INPUTS: {
  name: string;
  source: string;
  ready(page: Page): Promise<void>;
  play(page: Page, note: number, on: boolean): Promise<unknown>;
}[] = [
  {
    name: 'the on-screen keys',
    source: 'the on-screen keys',
    ready: async () => {},
    play: (page, note, on) =>
      page
        .getByRole('group', { name: 'On-screen keyboard' })
        .getByRole('button', { name: { 69: 'A4', 72: 'C5', 76: 'E5' }[note]!, exact: true })
        .dispatchEvent(on ? 'pointerdown' : 'pointerup', { pointerId: 1 }),
  },
  {
    name: 'a MIDI keyboard',
    source: 'Test keyboard',
    ready: async (page) => {
      await page.locator('details[aria-label="Sound"] summary .title').click();
      await page.getByRole('button', { name: 'Connect MIDI' }).click();
      await page.getByLabel('Listen to input').selectOption({ label: 'Test keyboard' });
    },
    play: (page, note, on) =>
      page.evaluate(
        (bytes) => (window as unknown as { midiIn(b: number[]): void }).midiIn(bytes),
        on ? [0x90, note, 100] : [0x80, note, 0],
      ),
  },
];

for (const input of INPUTS)
  test(`takes a motif played on ${input.name}, and the lead plays it from the bar after next (#79)`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const port = { id: 'test-in', name: 'Test keyboard', onmidimessage: null } as {
        id: string;
        name: string;
        onmidimessage: ((event: { data: Uint8Array }) => void) | null;
      };
      const access = {
        inputs: new Map([[port.id, port]]),
        outputs: new Map(),
        onstatechange: null,
      };
      Object.assign(navigator, { requestMIDIAccess: () => Promise.resolve(access) });
      Object.assign(window, {
        midiIn: (bytes: number[]) => port.onmidimessage?.({ data: new Uint8Array(bytes) }),
      });
    });
    const errors = await listen(page);
    await solo(page);
    await openStyle(page);
    await page.getByRole('slider', { name: /Energy/ }).fill('0');
    await input.ready(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await start(page);
    await expect(page.getByText('Bar 2 of 8')).toBeVisible({ timeout: 5000 });
    // Synth-pop at 108 bpm: three notes four steps apart, in one bar.
    const step = 15 / 108;
    for (const note of [69, 72, 76]) {
      await input.play(page, note, true);
      await page.waitForTimeout(60);
      await input.play(page, note, false);
      await page.waitForTimeout(step * 4 * 1000 - 60);
    }
    const took = page.getByText(
      new RegExp(`Bar (\\d+): Took a 3-note motif from ${input.source}\\.`),
    );
    await expect(took).toBeVisible({ timeout: 8000 });
    const heard = /Bar (\d+):/.exec((await took.textContent()) ?? '')![1];
    await expect(
      page
        .getByLabel('Conductor')
        .getByText(`Lead is playing the motif from ${input.source}, heard in bar ${heard}.`),
    ).toBeVisible({
      timeout: 8000,
    });
    // The lead's lane credits the same motif, in the player's colour, while a bar shown played it (#183).
    await expect(
      page
        .getByRole('group', { name: 'Tracks grid' })
        .getByText(`from ${input.source}, bar ${heard}`),
    ).toBeVisible({ timeout: 8000 });
    expect(errors).toEqual([]);
  });

test('offers a melodic scale within the style’s reach, and the keyboard marks it (#209)', async ({
  page,
}) => {
  const errors = await listen(page);
  await solo(page);
  const scales = page.getByRole('radiogroup', { name: 'Melodic scale' });
  /** The on-screen keys marked with a dot. */
  const marked = async () => {
    const keys = page.getByRole('group', { name: 'On-screen keyboard' }).getByRole('button');
    const names: string[] = [];
    for (const button of await keys.all())
      if ((await button.getAttribute('class'))?.includes('in-scale'))
        names.push((await button.getAttribute('aria-label')) ?? '');
    return names;
  };
  /** Unfold the key card where it is folded. */
  const unfold = async () => {
    const card = page.locator('details[aria-label="Key"]');
    if (!(await card.evaluate((details) => (details as HTMLDetailsElement).open)))
      await card.locator('summary').click();
    await expect(scales).toBeVisible();
  };
  // Techno's harmony reaches the plain scale alone.
  await openStyle(page);
  await page.getByRole('button', { name: 'Techno' }).click();
  await unfold();
  await expect(scales.getByRole('radio', { name: 'plain' })).toBeChecked();
  await expect(scales.getByRole('radio', { name: 'pentatonic' })).toBeDisabled();
  await expect(scales.getByRole('radio', { name: 'blues' })).toBeDisabled();
  // Lo-fi hip hop's reaches the blues. Stopped, a pick is what the band opens on.
  await page.getByRole('button', { name: 'Lo-fi hip hop' }).click();
  await unfold();
  await expect(scales.getByRole('radio', { name: 'blues' })).toBeEnabled();
  // A minor from C4 to E5: C D E F G A B, twice but for the last B, F and G.
  expect(await marked()).toHaveLength(17 - 7);
  await scales.getByRole('radio', { name: 'pentatonic' }).click();
  await expect(scales.getByRole('radio', { name: 'pentatonic' })).toBeChecked();
  await expect(page.locator('details[aria-label="Key"] summary .sub')).toContainText(
    '· pentatonic',
  );
  await expect.poll(marked).toEqual(['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']);
  expect(errors).toEqual([]);
});

test('wraps the preset chips inside the style card, at 760 px and at 360 px (#217)', async ({
  page,
}) => {
  await listen(page);
  for (const width of [760, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await solo(page);
    await openStyle(page);
    const card = (await page.locator('details[aria-label="Style"]').boundingBox())!;
    const chips = await page
      .getByRole('group', { name: 'Genre presets' })
      .getByRole('button')
      .all();
    expect(chips).toHaveLength(8);
    for (const chip of chips) {
      const box = (await chip.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(card.x);
      expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});
