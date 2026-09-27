import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type Script, lawBreaks } from './machine.ts';
import {
  type Click,
  type MetronomeEnv,
  type MetronomeInput,
  metronome,
  subdivisionSeconds,
} from './metronome.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tick every 25 ms, scheduling 120 ms ahead: the transport's own clock. */
const LOOKAHEAD = 0.12;
const ticks = (from: number, count: number, every = 0.025): MetronomeInput[] =>
  range(count).map((i) => ({ now: from + i * every, until: from + i * every + LOOKAHEAD }));

const env = (meter = METERS['4/4'], bpm = 120, start = 1): MetronomeEnv => ({
  start,
  bpm,
  meter,
});

function run(e: MetronomeEnv, inputs: MetronomeInput[]) {
  let carried = metronome.initial;
  const clicks: Click[] = [];
  let missed = 0;
  for (const input of inputs) {
    const next = metronome.advance(e, carried, input);
    carried = next.carried;
    clicks.push(...next.output.clicks);
    missed += next.output.missed;
  }
  return { clicks, missed, carried };
}

describe('the metronome', () => {
  it('schedules every subdivision once, in order, each as long as a pulse’s subdivision', () => {
    const e = env(METERS['4/4'], 120);
    const { clicks } = run(e, ticks(0.9, 400));
    expect(clicks.map((c) => c.position)).toEqual(clicks.map((_, i) => i % 8));
    expect(clicks[0]!.seconds).toBe(1);
    const length = subdivisionSeconds(120, 2);
    clicks
      .slice(1)
      .forEach((c, i) => expect(c.seconds).toBeCloseTo(clicks[i]!.seconds + length, 9));
    expect(clicks.length).toBeGreaterThan(30);
  });

  it('schedules each subdivision before it starts, and nothing in the past', () => {
    const e = env();
    const inputs = ticks(0.9, 400);
    let carried = metronome.initial;
    inputs.forEach((input) => {
      const next = metronome.advance(e, carried, input);
      carried = next.carried;
      for (const c of next.output.clicks) {
        expect(c.seconds).toBeLessThan(input.until);
        expect(c.seconds).toBeGreaterThanOrEqual(input.now);
      }
    });
  });

  it('marks the bar’s first subdivision the downbeat, others by the meter’s pulses (4/4: every 2 of 8)', () => {
    const { clicks } = run(env(METERS['4/4'], 240), ticks(0.9, 40));
    const first8 = clicks.slice(0, 8);
    expect(first8.map((c) => c.weight)).toEqual([
      'downbeat',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
    ]);
    expect(first8.map((c) => c.pulse)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('never waits: after a stall it drops what it missed and keeps the grid where it was', () => {
    const e = env();
    const length = subdivisionSeconds(e.bpm, e.meter.subdivision);
    const onGrid = (seconds: number) =>
      Math.abs(Math.round((seconds - e.start) / length) - (seconds - e.start) / length) < 1e-9;
    const resumed = 0.9 + 100 * 0.025 + 3;
    const stalled = run(e, [...ticks(0.9, 100), ...ticks(resumed, 200)]);
    const late = stalled.clicks.filter((c) => c.seconds >= resumed);
    for (const c of late) expect(onGrid(c.seconds)).toBe(true);
    expect(stalled.missed).toBeGreaterThan(0);
    expect(late.length).toBeGreaterThan(0);
  });

  it('catches up after four hours’ stall within a lookahead, reporting the missed subdivisions by count', () => {
    const e = env(METERS['4/4'], 120);
    const before = run(e, ticks(0.9, 100));
    const now = 0.9 + 100 * 0.025 + 4 * 3600;
    const started = Date.now();
    const back = metronome.advance(e, before.carried, { now, until: now + LOOKAHEAD });
    expect(Date.now() - started).toBeLessThan(LOOKAHEAD * 1000);
    // 120 bpm, 4/4: 4 subdivisions a second.
    expect(back.output.missed).toBeGreaterThan(4 * 3600 * 3.9);
    expect(back.output.clicks.length).toBeLessThan(4);
    const length = subdivisionSeconds(e.bpm, e.meter.subdivision);
    for (const c of back.output.clicks) expect(c.seconds + length).toBeGreaterThan(now);
  });

  it('makes 3/4 and 6/8 sound different at the same pulse tempo: 3 pulses a bar against 2', () => {
    const barLength = (meter: (typeof METERS)['3/4']) => {
      const downbeats = run(env(meter, 120), ticks(0.9, 200)).clicks.filter(
        (c) => c.weight === 'downbeat',
      );
      return downbeats[1]!.seconds - downbeats[0]!.seconds;
    };
    // Same pulse tempo (120 pulses/min = 0.5 s a pulse), but 3/4 has 3
    // pulses to the bar and 6/8 has 2, so 3/4's downbeat recurs a third
    // again as slowly.
    expect(barLength(METERS['3/4'])).toBeCloseTo(1.5, 9);
    expect(barLength(METERS['6/8'])).toBeCloseTo(1, 9);
  });

  it('keeps the machine laws, with bpm and meter changing (F1)', () => {
    const script: Script<MetronomeEnv, MetronomeInput> = ticks(0.9, 240).map((input, i) => ({
      env: env(i < 120 ? METERS['4/4'] : METERS['6/8'], i < 60 ? 120 : 150),
      input,
    }));
    expect(lawBreaks(metronome, script)).toEqual([]);
  });
});
