import { METERS, type Meter, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { BandBar } from './band.ts';
import { chordAt } from './chords.ts';
import { type MeterChange, clockOf, sameMeter } from './events.ts';
import { PRESETS, holding } from './style.ts';
import { type MeterSwing, STRAIGHT, holdingSwing, swingAt, swingOf } from './swing.ts';

/** Full triplet swing on the 8ths. */
const TRIPLET: MeterSwing = { level: '8n', share: 2 / 3 };
import { stepSeconds } from './tempo.ts';
import {
  LOOKAHEAD,
  type ScheduledStep,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  type TransportInput,
  clockThrough,
  forecast,
  foresight,
  transport,
  writtenAt,
} from './transport.ts';
import { presetMode } from './mode-repository.ts';

const range = (n: number) => [...Array(n).keys()];
const ticks = (from: number, count: number, every = 0.025): TransportInput[] =>
  range(count).map((i) => ({ now: from + i * every, until: from + i * every + LOOKAHEAD }));

const style = { ...PRESETS[4]!.style, entropy: 0.3, bpm: 120 };
const wished = (meter: Meter, swing: MeterSwing): TransportEnv => ({
  seed: 11,
  start: 1,
  track: holding(style),
  swing: holdingSwing(swing),
  wish: { tonic: null, mode: presetMode(PRESETS[4]!)!, melodic: null },
  meter,
});

/**
 * A song whose meter is asked for at the head's bars: 4/4 at first, 7/8 from
 * bar `toSeven`, and 4/4 again from bar `back`. The plan takes the meter at a
 * section boundary, so the sections from bars 8 and 16 are the ones that change.
 */
const meters = (head: number, toSeven = 4, back = 12): Meter =>
  head < toSeven * 16 ? METERS['4/4'] : head < back * 16 ? METERS['7/8'] : METERS['4/4'];

const play = (swing: MeterSwing, count: number, from = 0.9, every = 0.025) => {
  let carried: TransportCarried | null = transport.initial;
  const steps: ScheduledStep[] = [];
  const events: TimedEvent[] = [];
  const composed: BandBar[] = [];
  let at = 0;
  for (const input of ticks(from, count, every)) {
    const next = transport.advance(wished(meters(at), swing), carried, input);
    carried = next.carried;
    steps.push(...next.output.steps);
    events.push(...next.output.events);
    composed.push(...next.output.composed);
    at = carried!.head.step;
  }
  return { steps, events, composed, carried: carried! };
};

const named = (changes: readonly MeterChange[]) =>
  changes.map(({ bar, meter }) => [
    bar,
    Object.entries(METERS).find(([, m]) => sameMeter(m, meter))![0],
  ]);

describe('the transport over a song that changes meter (T14, #261)', () => {
  const swingless = play(STRAIGHT, 2000);
  const swung = play(TRIPLET, 2000);
  const expected = clockOf([
    { bar: 0, meter: METERS['4/4'] },
    { bar: 8, meter: METERS['7/8'] },
    { bar: 16, meter: METERS['4/4'] },
  ]);

  it('takes the meter at a section boundary, as it takes the key, and carries where it changes', () => {
    const byBar = new Map(swingless.composed.map((b) => [b.bar, b]));
    for (const bar of range(24))
      expect([
        bar,
        sameMeter(
          byBar.get(bar)!.meter,
          expected.barSteps(bar) === 16 ? METERS['4/4'] : METERS['7/8'],
        ),
      ]).toEqual([bar, true]);
    expect(named(swingless.carried.meters)).toEqual([
      [0, '4/4'],
      [8, '7/8'],
      [16, '4/4'],
    ]);
    for (const bar of swingless.composed) expect(bar.plan.meter).toBe(bar.meter);
  });

  it('lays every step once, in order, each in the bar and place the clock says, to the last step (finite: every laid step)', () => {
    const laid = swingless.steps;
    expect(laid.map((s) => s.step)).toEqual(range(laid.length));
    expect(laid.length).toBeGreaterThan(expected.barStart(17));
    const byBar = new Map(swingless.composed.map((b) => [b.bar, b]));
    for (const s of laid) {
      const bar = byBar.get(expected.barAt(s.step))!;
      expect([s.step, s.section]).toEqual([s.step, bar.plan.section]);
      expect(s.chord).toEqual(chordAt(bar.chords, expected.stepInBar(s.step)));
    }
  });

  it('plays each bar as long as its meter: 14 steps of a 7/8 bar, 16 of a 4/4', () => {
    const starts = swingless.steps.filter((s) => expected.stepInBar(s.step) === 0);
    const span = (bar: number) => expected.barStart(bar + 1) - expected.barStart(bar);
    expect([span(7), span(8), span(15), span(16)]).toEqual([16, stepsOf(METERS['7/8']), 14, 16]);
    for (const s of starts.slice(0, 20))
      expect(s.seconds).toBeCloseTo(1 + s.step * stepSeconds(120), 9);
  });

  it('puts every note of a bar on a step the bar has, and plays it where the clock puts it', () => {
    expect(swingless.events.length).toBeGreaterThan(400);
    for (const e of swingless.events) {
      expect([e.bar, e.event.step < expected.barSteps(e.bar)]).toEqual([e.bar, true]);
      const step = expected.barStart(e.bar) + e.event.step;
      expect(e.seconds).toBeCloseTo(1 + step * stepSeconds(120), 9);
    }
  });

  it('reads every played moment back to where it is written, through the swing over each bar’s own pulses', () => {
    expect(swung.events.length).toBeGreaterThan(400);
    for (const e of swung.events)
      expect(writtenAt(swung.steps, e.seconds)).toBeCloseTo(
        expected.barStart(e.bar) + e.event.step,
        9,
      );
  });

  it('ends each note where the swing over its own bars puts its end (finite: every note)', () => {
    const track = holdingSwing(TRIPLET);
    const swingOfTrack = swingOf((start) => swingAt(track, start), expected);
    let crossing = 0;
    for (const e of swung.events) {
      const start = expected.barStart(e.bar) + e.event.step;
      const end = start + e.event.length;
      if (expected.beatAt(end) !== expected.beatAt(start)) crossing++;
      expect(e.seconds + e.duration).toBeCloseTo(
        1 + swingOfTrack.played(end) * stepSeconds(120),
        9,
      );
    }
    expect(crossing).toBeGreaterThan(20);
  });

  it('never moves a pulse start by swing, in a bar of any meter (finite: every note on a beat)', () => {
    let checked = 0;
    const seconds = new Map(swung.steps.map((s) => [s.step, s.seconds]));
    for (const e of swung.events) {
      const step = expected.barStart(e.bar) + e.event.step;
      if (!expected.onBeat(step)) continue;
      expect(e.seconds).toBeCloseTo(seconds.get(step)!, 9);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
    // The swing does move an offbeat eighth, in 7/8's 2-eighth pulses as in 4/4's.
    const moved = swung.events.some((e) => {
      const step = expected.barStart(e.bar) + e.event.step;
      return (
        expected.barSteps(e.bar) === 14 &&
        !expected.onBeat(step) &&
        Math.abs(e.seconds - seconds.get(step)!) > 1e-6
      );
    });
    expect(moved).toBe(true);
  });

  it('keeps the clock across a stall that passes the change: the passed bars say their meters', () => {
    let carried: TransportCarried | null = transport.initial;
    let at = 0;
    for (const input of [...ticks(0.9, 160), ...ticks(45, 40)]) {
      const next = transport.advance(wished(meters(at, 1, 1000), STRAIGHT), carried, input);
      carried = next.carried;
      at = carried!.head.step;
    }
    const held = clockOf([
      { bar: 0, meter: METERS['4/4'] },
      { bar: 8, meter: METERS['7/8'] },
    ]);
    expect(carried!.head.step).toBeGreaterThan(held.barStart(12));
    expect(named(carried!.meters)).toEqual([
      [0, '4/4'],
      [8, '7/8'],
    ]);
    const kept = clockOf(carried!.meters);
    for (const bar of range(12))
      expect([bar, kept.barStart(bar)]).toEqual([bar, held.barStart(bar)]);
  });

  it('keeps the clock when the first bar is passed too, a song that starts 7/8 and is late', () => {
    let carried: TransportCarried | null = transport.initial;
    for (const input of ticks(45, 40))
      carried = transport.advance(wished(METERS['7/8'], STRAIGHT), carried, input).carried;
    expect(named(carried!.meters)).toEqual([[0, '7/8']]);
  });

  it('forecasts across the change what the band then composes, bar for bar', () => {
    let carried: TransportCarried | null = transport.initial;
    let at = 0;
    let preview: BandBar[] = [];
    const composed = new Map<number, BandBar>();
    for (const input of ticks(0.9, 700)) {
      const next = transport.advance(wished(meters(at), STRAIGHT), carried, input);
      carried = next.carried;
      at = carried!.head.step;
      if (preview.length === 0 && at >= 5 * 16)
        preview = foresight(wished(meters(at), STRAIGHT), carried, 12);
      for (const bar of next.output.composed) composed.set(bar.bar, bar);
    }
    expect(preview.length).toBe(12);
    expect(preview.some((b) => stepsOf(b.meter) === 14)).toBe(true);
    for (const bar of preview)
      if (composed.has(bar.bar)) expect(composed.get(bar.bar)).toEqual(bar);
  });
});

describe('the clock through the bars ahead (#262)', () => {
  const early = play(STRAIGHT, 120); // a few bars in, all of them 4/4
  const asked = wished(METERS['7/8'], STRAIGHT);

  it('reads the bars of a forecast in the meters they will be in, section by section', () => {
    const ahead = forecast(asked, early.carried, 30);
    const clock = clockThrough(early.carried, ahead);
    const head = clock.barAt(early.carried.head.step);
    for (const bar of ahead) {
      const meter = bar.plan.meter;
      expect([bar.bar, clock.barSteps(bar.bar)]).toEqual([bar.bar, stepsOf(meter)]);
    }
    // The section the head is in keeps its meter; the next takes the one asked for.
    expect(clock.barSteps(head)).toBe(16);
    const next = (Math.floor(head / 8) + 1) * 8;
    expect([clock.barSteps(next - 1), clock.barSteps(next)]).toEqual([16, 14]);
    expect(clock.barStart(next + 1) - clock.barStart(next)).toBe(14);
  });

  it('is the transport’s own clock where nothing is ahead, and the song’s 4/4 before it starts', () => {
    const own = clockThrough(early.carried, []);
    const made = clockOf(early.carried.meters);
    for (const bar of range(6)) expect(own.barStart(bar)).toBe(made.barStart(bar));
    const before = clockThrough(null, forecast(wished(METERS['4/4'], STRAIGHT), null, 4));
    expect(before.barSteps(0)).toBe(16);
  });

  it('opens a song in the meter asked for: bar 0 is a section’s first, before anything is composed', () => {
    const clock = clockThrough(null, forecast(asked, null, 20));
    expect([clock.barSteps(0), clock.barSteps(8), clock.barSteps(16)]).toEqual([14, 14, 14]);
  });
});
