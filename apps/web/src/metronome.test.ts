import { INITIAL_STYLE, PRESETS, countInSeconds, holding } from '@jambot/engine';
import { METERS, type Meter, type Weight, stepsOf } from '@jambot/theory';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Output } from './audio/output.ts';
import { Metronome } from './metronome.svelte.ts';
import { Player, type Surroundings } from './player.svelte.ts';

/** The player's surroundings a test drives by hand, with a click on the output. */
function surroundings() {
  const world = {
    currentTime: 0,
    latency: 0,
    resolve: () => {},
    plays: [] as { part: string; seconds: number }[],
    clicks: [] as { weight: Weight; seconds: number; gain: number }[],
    tickers: [] as (() => void)[],
    frames: [] as (() => void)[],
  };
  const output: Output = {
    get currentTime() {
      return world.currentTime;
    },
    get latency() {
      return world.latency;
    },
    resume: () => new Promise<void>((resolve) => (world.resolve = resolve)),
    play: (part, _note, _velocity, seconds) => void world.plays.push({ part, seconds }),
    silence: () => {},
    click: (weight, seconds, gain) => void world.clicks.push({ weight, seconds, gain }),
  };
  const s: Surroundings = {
    output: () => output,
    ticker: (tick) => (world.tickers.push(tick), () => {}),
    frame: (follow) => (world.frames.push(follow), () => {}),
    seed: () => 7,
    page: () => world.currentTime,
  };
  return { world, s };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

/** Where the song starts: the player's lead, and then a bar of count-in. */
const START = 0.1 + countInSeconds(holding(INITIAL_STYLE));

async function playing(metronome: Metronome, meter?: Meter) {
  const { world, s } = surroundings();
  const player = new Player(s, metronome);
  if (meter) player.setMeter(meter);
  void player.start();
  world.resolve();
  await settle();
  return { world, player };
}

/** Ticks and follows for `seconds`, in 25 ms steps, as the page does. */
function run(world: ReturnType<typeof surroundings>['world'], seconds: number) {
  for (let t = 0; t < seconds; t += 0.025) {
    world.currentTime += 0.025;
    world.tickers[0]!();
    world.frames[0]!();
  }
}

beforeEach(() => localStorage.clear());

describe('the metronome', () => {
  it('clicks nothing but the count-in while it is off', async () => {
    const { world } = await playing(new Metronome());
    run(world, 6);
    expect(world.plays.length).toBeGreaterThan(0);
    expect(world.clicks).toHaveLength(4);
    for (const c of world.clicks) expect(c.seconds).toBeLessThan(START);
  });

  it('clicks nothing while the band is stopped, though it is on: it has no clock of its own', () => {
    const metronome = new Metronome();
    const { world, s } = surroundings();
    new Player(s, metronome);
    metronome.on = true;
    expect(world.tickers).toEqual([]);
    expect(world.clicks).toEqual([]);
    expect(metronome.pulse).toBeNull();
  });

  it('clicks on the band’s own steps once on: the same clock, the downbeat first, at its volume', async () => {
    const metronome = new Metronome();
    metronome.on = true;
    metronome.volume = 0.4;
    const { world } = await playing(metronome);
    run(world, 4);
    expect(world.clicks.length).toBeGreaterThan(4);
    expect(world.clicks[0]!.weight).toBe('downbeat');
    for (const c of world.clicks) expect(c.gain).toBe(0.4);
    const pulses = world.clicks.filter((c) => c.weight !== 'subdivision');
    const beat = 60 / PRESETS[0]!.style.bpm;
    expect(pulses[1]!.seconds - pulses[0]!.seconds).toBeCloseTo(beat, 6);
  });

  it('starts on the band’s first step, not a moment of its own', async () => {
    const metronome = new Metronome();
    metronome.on = true;
    const { world } = await playing(metronome);
    run(world, 4);
    const firstNote = world.plays.find((p) => p.part === 'drums')!;
    const band = world.clicks.filter((c) => c.seconds > START - 0.01);
    expect(band[0]!.seconds).toBeLessThanOrEqual(firstNote.seconds + 1e-9);
    expect(band[0]!.seconds).toBeCloseTo(START, 6);
  });

  it('joins the band’s steps when switched on mid-song, never playing a click late', async () => {
    const metronome = new Metronome();
    const { world } = await playing(metronome);
    run(world, 5);
    metronome.on = true;
    const before = world.currentTime;
    world.clicks.length = 0;
    run(world, 2);
    expect(world.clicks.length).toBeGreaterThan(0);
    for (const c of world.clicks) expect(c.seconds).toBeGreaterThanOrEqual(before);
  });

  it('shows the pulse and the downbeat heard, and rests when the band stops', async () => {
    const metronome = new Metronome();
    metronome.on = true;
    const { world, player } = await playing(metronome);
    expect(metronome.pulse).toBeNull();
    run(world, 2);
    expect(metronome.pulse).not.toBeNull();
    expect(metronome.downbeat).toBe(metronome.pulse === 0);
    player.halt();
    expect(metronome.pulse).toBeNull();
    expect(metronome.downbeat).toBe(false);
    expect(metronome.on).toBe(true);
  });

  it('has a bar of the song’s meter: four pulses, from the clicks it lays', async () => {
    const metronome = new Metronome();
    expect(metronome.pulses).toBe(4);
  });

  it('saves its volume to localStorage and reads it back; whether it is on is never saved', () => {
    const a = new Metronome();
    a.volume = 0.3;
    a.on = true;
    const b = new Metronome();
    expect(b.volume).toBe(0.3);
    expect(b.on).toBe(false);
  });

  it('clicks the pulses and no more to begin with, and says so in its weights: no click on the “and”', async () => {
    const metronome = new Metronome();
    metronome.on = true;
    const { world } = await playing(metronome);
    run(world, 10);
    const band = world.clicks.filter((c) => c.seconds >= START - 0.01);
    expect(band.length).toBeGreaterThan(8);
    expect(band.some((c) => c.weight === 'subdivision')).toBe(false);
    const beat = 60 / PRESETS[0]!.style.bpm;
    band.slice(1).forEach((c, i) => expect(c.seconds - band[i]!.seconds).toBeCloseTo(beat, 6));
    expect(band.map((c) => c.weight).slice(0, 5)).toEqual([
      'downbeat',
      'pulse',
      'pulse',
      'pulse',
      'downbeat',
    ]);
  });

  it('clicks the eighths between the pulses once asked, and the sixteenths if asked for those', async () => {
    const eighths = new Metronome();
    eighths.on = true;
    eighths.subdivision = 'eighths';
    const a = await playing(eighths);
    run(a.world, 8);
    const between = (clicks: typeof a.world.clicks) =>
      clicks.filter((c) => c.seconds >= START - 0.01 && c.weight === 'subdivision').length;
    expect(between(a.world.clicks)).toBeGreaterThan(4);
    const sixteenths = new Metronome();
    sixteenths.on = true;
    sixteenths.subdivision = 'sixteenths';
    const b = await playing(sixteenths);
    run(b.world, 8);
    expect(between(b.world.clicks)).toBeGreaterThan(between(a.world.clicks) * 1.5);
  });

  it('saves what it clicks between the pulses beside its volume, and falls back to the pulses where what is saved is not one', () => {
    const a = new Metronome();
    expect(a.subdivision).toBe('pulses');
    a.subdivision = 'eighths';
    expect(new Metronome().subdivision).toBe('eighths');
    expect(new Metronome().volume).toBe(0.7);
    localStorage.setItem(
      'jambot-metronome-v1',
      JSON.stringify({ volume: 0.5, subdivision: 'triplets' }),
    );
    const b = new Metronome();
    expect([b.volume, b.subdivision]).toEqual([0.5, 'pulses']);
  });

  it('clicks the pulses of a bar of another meter, on the transport’s clock, the count-in too (finite: the meters the band can be asked for)', async () => {
    for (const name of ['3/4', '6/8', '5/8', '7/8', '12/8'] as const) {
      const meter = METERS[name];
      const metronome = new Metronome();
      metronome.on = true;
      const { world, player } = await playing(metronome, meter);
      const start = 0.1 + countInSeconds(holding(INITIAL_STYLE), meter);
      expect(player.clock.barSteps(0)).toBe(stepsOf(meter));
      run(world, 8);
      const count = world.clicks.filter((c) => c.seconds < start - 0.01);
      const band = world.clicks.filter((c) => c.seconds >= start - 0.01);
      expect([name, count.length]).toEqual([name, meter.heights.length]);
      expect([name, band[0]!.weight, band[0]!.seconds]).toEqual([
        name,
        'downbeat',
        expect.closeTo(start, 6),
      ]);
      const downbeats = band.filter((c) => c.weight === 'downbeat');
      expect(downbeats.length).toBeGreaterThan(1);
      const barSeconds = (stepsOf(meter) * 15) / PRESETS[0]!.style.bpm;
      expect([name, downbeats[1]!.seconds - downbeats[0]!.seconds]).toEqual([
        name,
        expect.closeTo(barSeconds, 6),
      ]);
      expect(band.slice(0, meter.heights.length).map((c) => c.weight)).toEqual(
        meter.heights.map((_, i) => (i === 0 ? 'downbeat' : 'pulse')),
      );
      expect([name, metronome.pulses]).toEqual([name, meter.heights.length]);
    }
  });
});
