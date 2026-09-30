import { METERS } from '@jambot/theory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { surroundings } from '../timing-test/fixtures.ts';
import { LEAD_SECONDS, MeterPlayer, TICK_MS } from './meter-player.svelte.ts';

function setup() {
  const world = surroundings();
  const player = new MeterPlayer({ audio: () => ({ base: world.base, offset: world.offset }) });
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
    player.swing = 1;
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
});
