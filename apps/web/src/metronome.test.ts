import { PRESETS } from '@jambot/engine';
import type { Weight } from '@jambot/theory';
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

async function playing(metronome: Metronome) {
  const { world, s } = surroundings();
  const player = new Player(s, metronome);
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
  it('clicks nothing while it is off', async () => {
    const { world } = await playing(new Metronome());
    run(world, 3);
    expect(world.plays.length).toBeGreaterThan(0);
    expect(world.clicks).toEqual([]);
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
    run(world, 2);
    const firstNote = world.plays.find((p) => p.part === 'drums')!;
    expect(world.clicks[0]!.seconds).toBeLessThanOrEqual(firstNote.seconds + 1e-9);
    expect(world.clicks[0]!.seconds).toBeCloseTo(0.1, 6);
  });

  it('joins the band’s steps when switched on mid-song, never playing a click late', async () => {
    const metronome = new Metronome();
    const { world } = await playing(metronome);
    run(world, 3);
    metronome.on = true;
    const before = world.currentTime;
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
    player.stop();
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
});
