import { METERS } from '@jambot/theory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeAudioContext } from '../audio/fake-context.ts';
import { webAudioOutput } from '../audio/output.ts';
import { surroundings } from '../timing-test/fixtures.ts';
import { LEAD_SECONDS, MeterPlayer, TICK_MS } from './meter-player.svelte.ts';

function setup() {
  const world = surroundings();
  const player = new MeterPlayer({ audio: () => ({ base: world.base, offset: world.offset }) });
  // Most of what is checked here counts the eighths, which the click sounds when asked to.
  player.subdivision = 'eighths';
  /** Let the page's clock run on `ms`, a tick at a time. */
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += TICK_MS) {
      world.state.page += TICK_MS;
      vi.advanceTimersByTime(TICK_MS);
    }
  };
  return { ...world, player, run };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the meter player', () => {
  it('lays a bar of clicks from a moment after the press, at the tempo counted in quarters', async () => {
    const { player, clicks, base } = setup();
    player.bpm = 120;
    const pressed = base.currentTime;
    await player.start();
    expect(player.playing).toBe(true);
    const eighth = 60 / 120 / 2;
    expect(clicks.slice(0, 8)).toHaveLength(8);
    clicks
      .slice(0, 8)
      .forEach((seconds, k) => expect(seconds).toBeCloseTo(pressed + LEAD_SECONDS + k * eighth, 9));
  });

  it('keeps one bar between 6/8 and 3/4 at one tempo, six eighths of it', async () => {
    const barOf = async (name: '3/4' | '6/8') => {
      const { player, clicks, run } = setup();
      player.name = name;
      player.bpm = 90;
      await player.start();
      run(3000);
      return clicks[METERS[name].cycle]! - clicks[0]!;
    };
    expect(await barOf('6/8')).toBeCloseTo(await barOf('3/4'), 9);
  });

  it('goes on laying bars as the clock runs, a bar after a bar without a gap', async () => {
    const { player, clicks, run } = setup();
    player.name = '5/8';
    player.bpm = 100;
    await player.start();
    run(8000);
    expect(clicks.length).toBeGreaterThan(20);
    const eighth = 60 / 100 / 2;
    clicks.forEach((seconds, k) => expect(seconds).toBeCloseTo(clicks[0]! + k * eighth, 9));
  });

  it('takes a change of meter, tempo and swing at the next bar, never in the middle of one', async () => {
    const { player, clicks, run } = setup();
    player.bpm = 120;
    await player.start();
    const first = [...clicks];
    expect(first).toHaveLength(8);
    player.name = '7/8';
    player.bpm = 60;
    player.swing = 0.75;
    expect(clicks).toEqual(first);
    run(2000);
    const bar = 8 * (60 / 120 / 2);
    expect(clicks[8]).toBeCloseTo(first[0]! + bar, 9);
    expect(clicks[9]! - clicks[8]!).toBeCloseTo(60 / 60 / 2, 9);
    expect(clicks).toHaveLength(8 + 7);
  });

  it('plays the layers that are on: the click, drums and bass', async () => {
    const { player, plays, clicks } = setup();
    player.layers.drums = true;
    player.layers.bass = true;
    await player.start();
    expect(clicks.length).toBeGreaterThan(0);
    expect(new Set(plays.map((p) => p.part))).toEqual(new Set(['drums', 'bass']));
  });

  it('stops at once: what is scheduled is silenced, and the timer no longer lays', async () => {
    const { player, clicks, silenced, run } = setup();
    await player.start();
    run(500);
    const laid = clicks.length;
    player.stop();
    expect(player.playing).toBe(false);
    expect(player.heard).toBeNull();
    expect(silenced.count).toBe(1);
    run(3000);
    expect(clicks.length).toBe(laid);
  });

  it('shows the eighth heard as the clock reaches it, and the bar’s meter with it', async () => {
    const { player, run, base } = setup();
    player.name = '6/8';
    player.bpm = 120;
    await player.start();
    player.follow();
    expect(player.heard).toBeNull();
    run(LEAD_SECONDS * 1000 + 3 * TICK_MS + 4 * 250);
    player.follow();
    expect(player.heard?.name).toBe('6/8');
    expect(player.heard?.eighth).toBeGreaterThanOrEqual(3);
    expect(base.currentTime).toBeGreaterThan(0);
  });

  it('does nothing when it is pressed twice', async () => {
    const { player, clicks } = setup();
    await player.start();
    const laid = clicks.length;
    await player.start();
    expect(clicks.length).toBe(laid);
  });

  it('clicks the pulses and no more by default: 4/4’s quarters, not its “and”, and 6/8’s two dotted quarters', async () => {
    for (const [name, pulses] of [
      ['4/4', 4],
      ['3/4', 3],
      ['6/8', 2],
      ['7/8', 3],
    ] as const) {
      const { player, clicks, run } = setup();
      player.subdivision = 'pulses';
      player.name = name;
      player.bpm = 120;
      await player.start();
      run(100);
      expect([name, clicks.length]).toEqual([name, pulses]);
    }
  });

  it('clicks the sixteenths too where asked: every step of the bar', async () => {
    const { player, clicks } = setup();
    player.subdivision = 'sixteenths';
    await player.start();
    expect(clicks).toHaveLength(16);
  });

  it('puts the offbeat eighth where its share says: 50 % straight, 67 % on the triplet, 75 % dotted, 25 % pulled early', async () => {
    const offbeat = async (swing: number) => {
      const { player, clicks } = setup();
      player.swing = swing;
      await player.start();
      return (clicks[1]! - clicks[0]!) / (clicks[2]! - clicks[0]!);
    };
    expect(await offbeat(0.5)).toBeCloseTo(1 / 2, 9);
    expect(await offbeat(2 / 3)).toBeCloseTo(2 / 3, 9);
    expect(await offbeat(0.75)).toBeCloseTo(3 / 4, 9);
    expect(await offbeat(0.25)).toBeCloseTo(1 / 4, 9);
    expect(await offbeat(0.4)).toBeLessThan(1 / 2);
  });

  it('puts the second sixteenth of each half-beat where the secondary share says, on its own', async () => {
    const { player, clicks } = setup();
    player.subdivision = 'sixteenths';
    player.secondary = 2 / 3;
    await player.start();
    const half = (clicks[2]! - clicks[0]!) / 1;
    expect((clicks[1]! - clicks[0]!) / half).toBeCloseTo(2 / 3, 9);
    expect((clicks[3]! - clicks[2]!) / half).toBeCloseTo(2 / 3, 9);
    expect(clicks[2]! - clicks[0]!).toBeCloseTo(60 / 100 / 2, 9); // the eighths do not move
  });

  it('keeps the pulses where they are at every swing, the secondary swing and the ternary lean', async () => {
    const barAt = async (swing: number, secondary: number, ternary: number) => {
      const { player, clicks } = setup();
      player.subdivision = 'pulses';
      player.name = '7/8';
      player.swing = swing;
      player.secondary = secondary;
      player.ternary = ternary;
      await player.start();
      return clicks.map((seconds) => seconds - clicks[0]!);
    };
    const straight = await barAt(0.5, 0.5, 0);
    for (const [a, b, c] of [
      [0.25, 0.5, 0],
      [0.75, 0.75, 1],
      [2 / 3, 0.25, -1],
    ] as const) {
      const moved = await barAt(a, b, c);
      moved.forEach((seconds, i) => expect(seconds).toBeCloseTo(straight[i]!, 9));
    }
  });
});

describe('the meter player on the built-in synth', () => {
  afterEach(() => void vi.unstubAllGlobals());

  it('sounds the bass: a saw on the root, E2, on the downbeat, and on the fifth, B2, on each pulse after', async () => {
    const fake = fakeAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function () {
        return fake.context;
      }),
    );
    const base = webAudioOutput();
    const { offset } = surroundings();
    const player = new MeterPlayer({ audio: () => ({ base, offset }) });
    player.layers.click = false;
    player.layers.bass = true;
    player.bpm = 100;
    await player.start();
    const saws = fake.oscillators.filter((o) => o.type === 'sawtooth');
    const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
    expect(saws.map((o) => o.frequency.value)).toEqual([hz(40), hz(47), hz(47), hz(47)]);
    const quarter = 60 / 100;
    saws.forEach((o, k) => expect(o.started).toBeCloseTo(LEAD_SECONDS + k * quarter, 9));
    player.stop();
  });
});
