import type { Weight } from '@jambot/theory';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ClickOutput } from './audio/metronome-click.ts';
import { Metronome, type MetronomeSurroundings } from './metronome.svelte.ts';

/** Surroundings a test drives by hand: the clock, the resume, the ticks and frames. */
function surroundings() {
  const world = {
    currentTime: 0,
    latency: 0,
    resumes: 0,
    resolve: () => {},
    clicks: [] as { weight: Weight; seconds: number; gain: number }[],
    tickers: [] as { tick: () => void; stopped: boolean }[],
    frames: [] as { follow: () => void; stopped: boolean }[],
  };
  const output: ClickOutput = {
    get currentTime() {
      return world.currentTime;
    },
    get latency() {
      return world.latency;
    },
    resume: () => {
      world.resumes++;
      return new Promise<void>((resolve) => (world.resolve = resolve));
    },
    click: {
      play: (weight, seconds, gain) => void world.clicks.push({ weight, seconds, gain }),
    },
  };
  const s: MetronomeSurroundings = {
    output: () => output,
    ticker(tick) {
      const t = { tick, stopped: false };
      world.tickers.push(t);
      return () => void (t.stopped = true);
    },
    frame(follow) {
      const f = { follow, stopped: false };
      world.frames.push(f);
      return () => void (f.stopped = true);
    },
  };
  return { world, s };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

/** Ticks and follows for `seconds`, in 25 ms steps. */
async function run(world: ReturnType<typeof surroundings>['world'], seconds: number) {
  for (let t = 0; t < seconds; t += 0.025) {
    world.currentTime += 0.025;
    world.tickers[0]!.tick();
    world.frames[0]!.follow();
  }
  await settle();
}

beforeEach(() => localStorage.clear());

describe('the metronome', () => {
  it('resumes its own audio context once, and clicks nothing until it does', async () => {
    const { world, s } = surroundings();
    const metronome = new Metronome(() => 120, s);
    void metronome.start();
    expect(metronome.on).toBe(false);
    expect(world.resumes).toBe(1);
    world.resolve();
    await settle();
    expect(metronome.on).toBe(true);
  });

  it('clicks on the pulse at the given tempo, downbeat first, and shows the pulse and downbeat heard', async () => {
    const { world, s } = surroundings();
    const metronome = new Metronome(() => 120, s);
    void metronome.start();
    world.resolve();
    await settle();
    await run(world, 3);
    expect(world.clicks.length).toBeGreaterThan(0);
    expect(world.clicks[0]!.weight).toBe('downbeat');
    expect(metronome.pulse).not.toBeNull();
    expect(metronome.downbeat).toBe(metronome.pulse === 0);
  });

  it('plays every click at the volume set, and none once stopped', async () => {
    const { world, s } = surroundings();
    const metronome = new Metronome(() => 120, s);
    metronome.volume = 0.4;
    void metronome.start();
    world.resolve();
    await settle();
    await run(world, 1);
    expect(world.clicks.length).toBeGreaterThan(0);
    for (const c of world.clicks) expect(c.gain).toBe(0.4);
    metronome.stop();
    expect(metronome.pulse).toBeNull();
    const played = world.clicks.length;
    world.tickers[0]!.tick();
    expect(world.clicks.length).toBe(played);
  });

  it('counts a bar’s pulses by the meter chosen: 3 for 3/4, 4 for 4/4, and clicks that many a bar', async () => {
    const { world, s } = surroundings();
    const metronome = new Metronome(() => 180, s);
    expect(metronome.pulses).toBe(4); // the default
    metronome.meter = '3/4';
    expect(metronome.pulses).toBe(3);
    void metronome.start();
    world.resolve();
    await settle();
    await run(world, 4);
    const nonDownbeatPulses = world.clicks.filter((c) => c.weight === 'pulse').length;
    const downbeats = world.clicks.filter((c) => c.weight === 'downbeat').length;
    expect(downbeats).toBeGreaterThan(1);
    // 3/4: 2 other pulses for every downbeat, give or take a trailing partial bar.
    expect(nonDownbeatPulses).toBeGreaterThanOrEqual(downbeats * 2 - 2);
    expect(nonDownbeatPulses).toBeLessThanOrEqual(downbeats * 2);
  });

  it('saves volume and meter to localStorage, and reads them back', () => {
    const { s } = surroundings();
    const a = new Metronome(() => 120, s);
    a.volume = 0.3;
    a.meter = '6/8';
    const b = new Metronome(() => 120, s);
    expect(b.volume).toBe(0.3);
    expect(b.meter).toBe('6/8');
  });
});
