import { type Page, expect, test } from '@playwright/test';
import {
  type Start,
  askForMeter,
  isClick,
  level,
  listen,
  onsets,
  openCard,
  openStyle,
  playsThroughCells,
  solo,
  starts,
  workers,
  showView,
  transport,
} from './audio.ts';

/** Where each onset falls after the first, in steps, as the fraction of a step. */
const phases = (times: number[], bpm: number) =>
  times.map((t) => {
    const steps = (t - times[0]!) / (15 / bpm);
    return Math.abs(steps - Math.round(steps * 3) / 3) < 1e-6
      ? Math.round((steps - Math.floor(steps + 1e-6)) * 3) / 3
      : NaN;
  });

const start = (page: Page) => page.getByRole('button', { name: 'Start the band' }).click();

/**
 * The onsets once more than 8 have sounded, waiting up to 10 s for them: the
 * count is what the band played, not how much time the page got.
 */
const playing = async (page: Page) => {
  await expect
    .poll(async () => (await onsets(page)).length, { timeout: 10_000 })
    .toBeGreaterThan(8);
  return onsets(page);
};

test('counts in, plays, follows on screen, and stops on a cadence, without an error', async ({
  page,
}) => {
  const errors = await listen(page);
  await solo(page);
  await expect(transport(page).getByText('Ready')).toBeVisible();
  // Swing jazz at full energy: the ride rings 0.45 s, so only the fade on
  // the halt can silence what is scheduled within 300 ms. The fade falls
  // with a time constant of 30 ms, so by then it leaves about e^-10 of the
  // level; a ride started up to 120 ms after it would still ring near 0.005.
  await openStyle(page);
  await page.getByRole('radio', { name: 'Swing jazz' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  // Only the plan says where in its section the bar heard is: the song map
  // names the intro before anything is heard.
  await expect(transport(page).getByText('Intro 1/8')).toBeVisible();
  await expect(transport(page).getByText('Intro 2/8')).toBeVisible({ timeout: 5000 });
  let loudest = 0;
  for (let i = 0; i < 100 && loudest < 0.01; i++) {
    loudest = Math.max(loudest, await level(page));
    await page.waitForTimeout(20);
  }
  expect(loudest).toBeGreaterThan(0.01);
  // Two workers play: the ticker's, and the one the band's section texts are built in (#406).
  expect(await workers(page)).toEqual({ running: 2, made: 2 });
  // Stop asks the band to end: it plays on, closes on a cadence, and halts
  // by itself, within two bars and a ring (some 4 s at 148 bpm).
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(transport(page).getByText('Ending · stop again to stop now')).toBeVisible();
  await expect(transport(page).getByText('Ready')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(300);
  expect(await level(page)).toBeLessThan(0.0005);
  // Both end with the song.
  expect(await workers(page)).toEqual({ running: 0, made: 2 });
  expect(errors).toEqual([]);
});

test('counts a bar in with the click, whether it is on or not, and the band comes in on the beat after it', async ({
  page,
}) => {
  await listen(page);
  await solo(page);
  await start(page);
  // Synth-pop, 108 bpm: a beat is 60 / 108 s, and a bar of them comes first.
  await expect(transport(page).getByText(/^Count-in/)).toBeVisible();
  await page.waitForTimeout(2000);
  const counted = await starts(page);
  expect(counted.length).toBe(4);
  expect(counted.every(isClick)).toBe(true);
  expect(counted.map((s) => s.kind)).toEqual(['square', 'triangle', 'triangle', 'triangle']);
  const beat = 60 / 108;
  counted.slice(1).forEach((s, i) => expect(s.when - counted[i]!.when).toBeCloseTo(beat, 3));
  await page.waitForTimeout(1500);
  const band = (await starts(page)).filter((s) => !isClick(s));
  expect(band.length).toBeGreaterThan(0);
  // The band's first note falls one beat after the last click.
  expect(band[0]!.when - counted[3]!.when).toBeCloseTo(beat, 3);
  await expect(transport(page).getByText(/^Count-in/)).toBeHidden();
});

test('stops at once when stopped again, or in the count-in', async ({ page }) => {
  await listen(page);
  await solo(page);
  await start(page);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(transport(page).getByText('Ready')).toBeVisible({ timeout: 1000 });
  expect((await starts(page)).filter((s) => !isClick(s))).toEqual([]);
  await start(page);
  await expect(transport(page).getByText('Intro 1/8')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(transport(page).getByText('Ending · stop again to stop now')).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(transport(page).getByText('Ready')).toBeVisible({ timeout: 1000 });
  await page.waitForTimeout(300);
  expect(await level(page)).toBeLessThan(0.0005);
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
    const button = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Start the band"]',
    )!;
    button.click();
    button.click();
  });
  await page.waitForTimeout(500);
  await expect(transport(page).getByText('Ready')).toBeVisible();
  expect(await starts(page)).toEqual([]);
  expect((await workers(page)).running).toBe(0);
});

test('plays a straight preset on the 16th grid', async ({ page }) => {
  await listen(page);
  await solo(page);
  // At energy 100 the repository's meter nearest Synth-pop leans on the 16ths: 4/4 asked for stays straight (#375).
  await askForMeter(page, '4/4');
  await openStyle(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  const times = await playing(page);
  // Synth-pop: 108 bpm, no swing.
  expect(new Set(phases(times, 108))).toEqual(new Set([0]));
});

test('left on the radio, the band wanders its style by itself a section at a time, plays on, and a preset takes it back (#313)', async ({
  page,
}) => {
  const errors = await listen(page);
  await solo(page);
  await openStyle(page);
  await page.getByRole('slider', { name: 'Entropy' }).fill('100');
  const axes = ['Syncopation', 'Harmony', 'Articulation'];
  const values = () =>
    Promise.all(axes.map((name) => page.getByRole('slider', { name, exact: true }).inputValue()));
  const opening = await values();
  await openCard(page, 'Session');
  await page.getByRole('checkbox', { name: 'Leave the band on the radio' }).check();
  await start(page);
  await playing(page);
  // Synth-pop opens the song: the first section is the style tuned in at.
  await expect(page.getByText('Now playing').locator('..')).toContainText('Synth-pop');
  // A section is 8 bars (17.8 s at 108 bpm); three axes of a walk at entropy 1 step 8 to 10 % each.
  await openStyle(page);
  await expect
    .poll(async () => (await values()).join() !== opening.join(), { timeout: 60_000 })
    .toBe(true);
  const sounded = (await onsets(page)).length;
  await expect
    .poll(async () => (await onsets(page)).length, { timeout: 10_000 })
    .toBeGreaterThan(sounded);
  await page.getByRole('radio', { name: 'Techno' }).click();
  await openCard(page, 'Session');
  await expect(
    page.getByRole('checkbox', { name: 'Leave the band on the radio' }),
  ).not.toBeChecked();
  expect(errors).toEqual([]);
});

test('swings a swung preset into triplet 8ths (T4)', async ({ page }) => {
  await listen(page);
  await solo(page);
  await openStyle(page);
  await page.getByRole('radio', { name: 'Swing jazz' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  const times = await playing(page);
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
  await page.getByRole('radio', { name: 'Swing jazz' }).click();
  await openCard(page, 'Metrum');
  await page.getByRole('button', { name: 'Click' }).click();
  // The click sounds the pulses alone to begin with: the eighths between them are asked for.
  await page.getByRole('radio', { name: 'Eighths', exact: true }).click();
  await start(page);
  await page.waitForTimeout(8000);
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

test('clicks the pulses and not the “and”, until the eighths are asked for', async ({ page }) => {
  await listen(page);
  await solo(page);
  await openCard(page, 'Metrum');
  await page.getByRole('button', { name: 'Click' }).click();
  await start(page);
  await page.waitForTimeout(8000);
  const clicks = (await starts(page)).filter(isClick);
  expect(clicks.length).toBeGreaterThan(8);
  expect(clicks.filter((s) => s.kind === 'sine')).toEqual([]);
  // Synth-pop: 108 bpm, a pulse every four steps, the downbeat's square first in each bar of four.
  const beat = 60 / 108;
  const times = clicks.map((s) => s.when).sort((x, y) => x - y);
  times.slice(1).forEach((t, i) => expect(t - times[i]!).toBeCloseTo(beat, 3));
  expect(clicks.filter((s) => s.kind === 'square')).toHaveLength(Math.ceil(clicks.length / 4));
});

/** The downbeats the 7/8 check waits for: the count-in's and seven of the song's, about the 14 s it once waited. */
const BARS_OF_7_8 = 8;

test('plays a section of 7/8 on bars of 14 steps: the click on its three pulses, the band on the same steps (#262)', async ({
  page,
}) => {
  await listen(page);
  await solo(page);
  await openCard(page, 'Metrum');
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);
  const before = await height();
  await page.getByRole('radio', { name: '7/8', exact: true }).click();
  // The metrum says 7/8, and nothing shifts the layout for it.
  await expect(page.locator('details[aria-label="Metrum"] summary .sub')).toContainText('7/8');
  expect(await page.locator('details[aria-label="Metrum"] svg.ruler circle.mark').count()).toBe(14);
  expect(Math.abs((await height()) - before)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Click' }).click();
  await start(page);
  // Bars laid, not a span of time (#470): the count-in's and seven of the song's, waiting up to 30 s for them.
  const isDownbeat = (s: Start) => isClick(s) && s.kind === 'square';
  await expect
    .poll(async () => (await starts(page)).filter(isDownbeat).length, { timeout: 30_000 })
    .toBeGreaterThanOrEqual(BARS_OF_7_8);
  const all = await starts(page);
  // Synth-pop: 108 in 4/4, which 7/8 counts as 92.571 of its three beats, the felt tempo kept (#367):
  // a step is 15 / 108 s, and a bar of 7/8 holds 14 of them: pulses at 0, 6 and 10.
  const step = 15 / 108;
  const clicks = all.filter(isClick);
  expect(clicks.filter((s) => s.kind === 'sine')).toEqual([]);
  const downbeats = clicks
    .filter((s) => s.kind === 'square')
    .map((s) => s.when)
    .sort((x, y) => x - y);
  // The count-in is a bar of 7/8 as well, so its downbeat is the first.
  expect(downbeats.length).toBeGreaterThanOrEqual(BARS_OF_7_8);
  downbeats.slice(1).forEach((t, i) => expect(t - downbeats[i]!).toBeCloseTo(14 * step, 3));
  const pulses = clicks
    .filter((s) => s.kind === 'triangle')
    .map((s) => s.when)
    .sort((x, y) => x - y);
  // Two pulses follow each downbeat, the last bar perhaps not yet laid whole.
  expect(pulses.length).toBeGreaterThanOrEqual(2 * downbeats.length - 2);
  expect(pulses.length).toBeLessThanOrEqual(2 * downbeats.length);
  pulses.forEach((t, i) => {
    const bar = downbeats[Math.floor(i / 2)]!;
    expect(t - bar).toBeCloseTo((i % 2 === 0 ? 6 : 10) * step, 3);
  });
  // The band is on the same grid: every note of it falls on a step of a bar of 14, none past the bar, and every bar
  // of the song laid whole, from the first after the count-in to the last before the latest downbeat, has notes.
  const band = [...new Set(all.filter((s) => !isClick(s)).map((s) => s.when))].sort(
    (x, y) => x - y,
  );
  for (const t of band) {
    const steps = (t - downbeats[0]!) / step;
    expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-3);
  }
  const whole = downbeats.slice(1, -1);
  for (const [i, bar] of whole.entries())
    expect(
      band.filter((t) => t >= bar - 1e-3 && t < bar + 14 * step - 1e-3).length,
      `bar ${i + 1}`,
    ).toBeGreaterThan(0);
  // And the click and the band agree: the band's downbeat kick is struck with each click's downbeat.
  const kicks = all.filter((s) => s.kind === 'sine' && s.frequency === 440).map((s) => s.when);
  const struck = downbeats.filter((d) => kicks.some((k) => Math.abs(k - d) < 1e-3));
  expect(struck.length).toBeGreaterThan(downbeats.length / 2);
  // And the band plays its bars of 7/8 through cells, no bar a gap (#432).
  await playsThroughCells(page);
});

test('plays a section of 6/8 at the bpm it states, counted in its dotted quarters: each beat 60 / bpm long, within 1 ms (#367)', async ({
  page,
}) => {
  await listen(page);
  await solo(page);
  await openCard(page, 'Metrum');
  await page.getByRole('radio', { name: '6/8', exact: true }).click();
  // Synth-pop's 108 in 4/4 is 72 dotted quarters in 6/8: the felt tempo kept, the number converted once.
  const stated = page.locator('details[aria-label="Metrum"] summary .main');
  await expect(stated).toHaveText('72 BPM');
  const bpm = Number((await stated.textContent())!.replace(' BPM', ''));
  await page.getByRole('button', { name: 'Click' }).click();
  await start(page);
  // The click sounds each beat: the downbeat and the dotted quarter after it, the count-in's two first.
  const clicks = async () => (await starts(page)).filter(isClick).map((s) => s.when);
  await expect.poll(async () => (await clicks()).length, { timeout: 15_000 }).toBeGreaterThan(8);
  const beats = (await clicks()).sort((x, y) => x - y);
  beats.slice(1).forEach((t, i) => expect(Math.abs(t - beats[i]! - 60 / bpm)).toBeLessThan(1e-3));
  // And the band plays its bars of 6/8 through cells, no bar a gap (#432).
  await playsThroughCells(page);
});

test('plays the full band: bass, chords and lead beside the drums', async ({ page }) => {
  await listen(page);
  await solo(page);
  // Deep house: a groove with harmony, and energy enough for the lead.
  await openStyle(page);
  await page.getByRole('radio', { name: 'Deep house' }).click();
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await start(page);
  // The intro is 8 bars; the lead joins after it, at 122 bpm about 16 s in,
  // and the count-in is 2 s before that.
  await page.waitForTimeout(24000);
  const all = (await starts(page)).filter((s) => !isClick(s));
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
  // At energy 0 the repository's meter nearest Synth-pop is 6/8: 4/4 asked for keeps the steps below (#375).
  await askForMeter(page, '4/4');
  // At energy 0 the lead rests on its own, so a lead note the band plays is the motif.
  await openStyle(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('0');
  await openCard(page, 'Muse');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await start(page);
  await expect(transport(page).getByText('Intro 2/8')).toBeVisible({ timeout: 5000 });
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
  // The lead's line is under the tracks' headline while the lead is selected.
  await expect(page.locator('details[aria-label="Band"] summary .sub')).toContainText(
    /Lead is playing the motif from the computer keys, heard in bar \d+\./,
    { timeout: 8000 },
  );
  await page.waitForTimeout(3000);

  // The lead's voice is a square: the first three are the keys played along, at once;
  // the rest are the band's, on the grid.
  const squares = (await starts(page))
    .filter((s) => s.kind === 'square' && !isClick(s))
    .map((s) => s.when);
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
    ready: (page) => showView(page, 'Melody'),
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
      await openCard(page, 'Sound');
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
    // At energy 0 the repository's meter nearest Synth-pop is 6/8: 4/4 asked for keeps the steps below (#375).
    await askForMeter(page, '4/4');
    await openStyle(page);
    await page.getByRole('slider', { name: /Energy/ }).fill('0');
    await input.ready(page);
    await openCard(page, 'Muse');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await start(page);
    await expect(transport(page).getByText('Intro 2/8')).toBeVisible({ timeout: 5000 });
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
    await expect(page.locator('details[aria-label="Band"] summary .sub')).toContainText(
      `Lead is playing the motif from ${input.source}, heard in bar ${heard}.`,
      { timeout: 8000 },
    );
    // The lead's lane credits the same motif, in the player's colour, while a bar shown played it (#183).
    await showView(page, 'Mix');
    await expect(
      page
        .getByRole('group', { name: 'Band grid' })
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
    await showView(page, 'Melody');
    const keys = page.getByRole('group', { name: 'On-screen keyboard' }).getByRole('button');
    const names: string[] = [];
    for (const button of await keys.all())
      if ((await button.getAttribute('class'))?.includes('in-scale'))
        names.push((await button.getAttribute('aria-label')) ?? '');
    return names;
  };
  /** Pull the key's section down, where it isn't. */
  const unfold = async () => {
    await openCard(page, 'Key');
    await expect(scales).toBeVisible();
  };
  // Techno's harmony reaches the plain scale alone.
  await openStyle(page);
  await page.getByRole('radio', { name: 'Techno' }).click();
  await unfold();
  await expect(scales.getByRole('radio', { name: 'plain' })).toBeChecked();
  await expect(scales.getByRole('radio', { name: 'pentatonic' })).toBeDisabled();
  await expect(scales.getByRole('radio', { name: 'blues' })).toBeDisabled();
  // Lo-fi hip hop's reaches the blues. Stopped, a pick is what the band opens on.
  await openStyle(page);
  await page.getByRole('radio', { name: 'Lo-fi hip hop' }).click();
  await unfold();
  await expect(scales.getByRole('radio', { name: 'blues' })).toBeEnabled();
  // A minor from C4 to E5: C D E F G A B, twice but for the last B, F and G.
  expect(await marked()).toHaveLength(17 - 7);
  await unfold();
  await scales.getByRole('radio', { name: 'pentatonic' }).click();
  await expect(scales.getByRole('radio', { name: 'pentatonic' })).toBeChecked();
  await expect(page.locator('details[aria-label="Key"] summary .sub')).toContainText(
    '· pentatonic',
  );
  await expect.poll(marked).toEqual(['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']);
  expect(errors).toEqual([]);
});

test('keeps the preset segments inside the style card, in two rows, at 760 px and at 360 px (#217)', async ({
  page,
}) => {
  await listen(page);
  for (const width of [760, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await solo(page);
    await openStyle(page);
    const card = (await page.locator('details[aria-label="Style"]').boundingBox())!;
    const segments = await page
      .getByRole('radiogroup', { name: 'Genre presets' })
      .getByRole('radio')
      .all();
    expect(segments).toHaveLength(8);
    const rows = new Set<number>();
    for (const segment of segments) {
      const box = (await segment.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(card.x);
      expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
      rows.add(Math.round(box.y));
    }
    expect(rows.size).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test('keeps the shell’s regions and every card the size they are while the band plays, so nothing moves, at 390 x 844 and 360 x 740', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await listen(page);
  for (const [width, height] of [
    [390, 844],
    [360, 740],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await solo(page);
    // The song's view, whose cards follow the band.
    await showView(page, 'Song');
    const seen = new Map<string, Set<number>>();
    const sample = async () => {
      const sizes = await page.evaluate(() => {
        const box = (e: Element | null) => (e ? e.getBoundingClientRect().height : -1);
        const regions: [string, number][] = [
          ['transport', box(document.querySelector('.transport'))],
          ['drawer', box(document.querySelector('nav[aria-label="Drawer"]'))],
          ['views', box(document.querySelector('[role="tablist"][aria-label="Views"]'))],
        ];
        const cards = [...document.querySelectorAll('details.card')].map(
          (card): [string, number] => [card.getAttribute('aria-label')!, box(card)],
        );
        return [...regions, ...cards];
      });
      for (const [name, h] of sizes)
        seen.set(name, (seen.get(name) ?? new Set()).add(Math.round(h)));
    };
    await sample();
    await start(page);
    // Some 20 s: past the first chords, and past the section change at bar 8.
    for (let t = 0; t < 70; t++) {
      await page.waitForTimeout(300);
      await sample();
    }
    expect(seen.size).toBeGreaterThanOrEqual(8);
    // Rounding may move a box by a pixel; anything more is the layout shifting.
    for (const [name, heights] of seen)
      expect(
        Math.max(...heights) - Math.min(...heights),
        `${name} at ${width} x ${height}`,
      ).toBeLessThanOrEqual(1);
    // The page itself never scrolls: the shell owns the viewport.
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight - innerHeight),
    ).toBeLessThanOrEqual(0);
  }
});

test('puts the views on a rail at the left of a phone on its side, at 844 x 390 and 667 x 375', async ({
  page,
}) => {
  await listen(page);
  for (const [width, height] of [
    [844, 390],
    [667, 375],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await solo(page);
    const views = (await page.getByRole('tablist', { name: 'Views' }).boundingBox())!;
    const head = (await transport(page).boundingBox())!;
    const drawer = (await page.getByRole('navigation', { name: 'Drawer' }).boundingBox())!;
    expect(views.x, `${width} x ${height}`).toBeLessThan(2);
    expect(views.width).toBeLessThanOrEqual(80);
    expect(views.height).toBeGreaterThan(height - 2);
    // The riders sit beside the transport, on its row.
    expect(head.height).toBeLessThanOrEqual(56);
    expect(Math.abs(drawer.y - head.y)).toBeLessThan(8);
    expect(drawer.x).toBeGreaterThan(head.x + head.width - 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight - innerHeight),
    ).toBeLessThanOrEqual(0);
  }
});
