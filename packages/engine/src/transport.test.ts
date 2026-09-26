import { describe, expect, it } from 'vitest';
import { band } from './band.ts';
import { type Script, lawBreaks } from './machine.ts';
import { INITIAL_STYLE, PRESETS, type StyleTrack, glideTo, holding, styleAt } from './style.ts';
import { swingOf } from './swing.ts';
import { stepSeconds } from './tempo.ts';
import {
  LOOKAHEAD,
  type TransportEnv,
  type TransportInput,
  type TransportOutput,
  transport,
} from './transport.ts';

const range = (n: number) => [...Array(n).keys()];

/** The prototype's clock: a tick every 25 ms, scheduling 120 ms ahead. */
const ticks = (from: number, count: number, every = 0.025): TransportInput[] =>
  range(count).map((i) => ({ now: from + i * every, until: from + i * every + LOOKAHEAD }));

const run = (env: TransportEnv, inputs: TransportInput[]) => {
  let carried = transport.initial;
  const outputs: TransportOutput[] = [];
  for (const input of inputs) {
    const next = transport.advance(env, carried, input);
    carried = next.carried;
    outputs.push(next.output);
  }
  return { outputs, carried };
};

const swung = holding({ ...PRESETS[4]!.style, entropy: 0.3 }); // Lo-fi hip hop, 84 bpm
const env = (track: StyleTrack = swung): TransportEnv => ({ seed: 11, start: 1, track });

describe('the transport', () => {
  it('schedules 120 ms ahead', () => expect(LOOKAHEAD).toBe(0.12));

  it('schedules every step once, in order, each as long as the tempo where it starts', () => {
    const slowing = glideTo(swung, { bpm: 150 }, 20, 64);
    const { outputs } = run(env(slowing), ticks(0.9, 800));
    const steps = outputs.flatMap((o) => o.steps);
    expect(steps.map((s) => s.step)).toEqual(range(steps.length));
    expect(steps[0]!.seconds).toBe(1);
    steps.forEach((s) =>
      expect(s.length).toBeCloseTo(stepSeconds(styleAt(slowing, s.step).bpm), 12),
    );
    steps
      .slice(1)
      .forEach((s, i) => expect(s.seconds).toBeCloseTo(steps[i]!.seconds + steps[i]!.length, 9));
    expect(steps.length).toBeGreaterThan(100);
  });

  it('schedules each step before it starts, and nothing in the past', () => {
    const inputs = ticks(0.9, 400);
    const { outputs } = run(env(), inputs);
    outputs.forEach((o, i) => {
      for (const s of o.steps) expect(s.seconds).toBeLessThan(inputs[i]!.until);
      for (const e of o.events) expect(e.seconds).toBeGreaterThanOrEqual(inputs[i]!.now);
    });
  });

  it('composes each bar a bar ahead: bar n + 1 exists before bar n starts to play', () => {
    const { outputs } = run(env(), ticks(0.9, 800));
    const composed = new Set<number>();
    for (const o of outputs) {
      for (const b of o.composed) composed.add(b.bar);
      for (const s of o.steps)
        if (s.step % 16 === 0) expect(composed.has(s.step / 16 + 1)).toBe(true);
    }
    expect([...composed]).toEqual(range(composed.size));
  });

  it('plays every event the band composed, once, at its swung time', () => {
    const track = swung;
    const { outputs } = run(env(track), ticks(0.9, 800));
    const steps = new Map(outputs.flatMap((o) => o.steps).map((s) => [s.step, s]));
    const bars = outputs.flatMap((o) => o.composed);
    const events = outputs.flatMap((o) => o.events);
    const played = new Set(events.map((e) => `${e.bar}:${e.event.step}:${e.event.note}`));
    // Every bar the steps have wholly passed through is played in full.
    const whole = bars.filter((b) => steps.has(b.bar * 16 + 15));
    for (const b of whole)
      for (const e of b.events) expect(played.has(`${b.bar}:${e.step}:${e.note}`)).toBe(true);
    expect(events.length).toBe(played.size);
    const swing = swingOf(track);
    for (const e of events) {
      const written = e.bar * 16 + e.event.step;
      const step = steps.get(written)!;
      expect(e.seconds).toBeCloseTo(
        step.seconds + (swing.played(written) - written) * step.length,
        9,
      );
    }
  });

  it('holds a note from its swung start to its swung end', () => {
    // Both ends of a note go through the map, so a legato line stays legato
    // under swing. The prototype swings only the start.
    const { outputs } = run(env(), ticks(0.9, 400));
    const steps = new Map(outputs.flatMap((o) => o.steps).map((s) => [s.step, s]));
    const swing = swingOf(swung);
    const at = (written: number) => {
      const played = swing.played(written);
      const step = steps.get(Math.floor(played))!;
      return step.seconds + (played - step.step) * step.length;
    };
    for (const e of outputs.flatMap((o) => o.events)) {
      const written = e.bar * 16 + e.event.step;
      if (!steps.has(written + e.event.length)) continue;
      expect(e.seconds + e.duration).toBeCloseTo(at(written + e.event.length), 9);
    }
  });

  it('never waits: after a stall it drops what it missed and keeps the grid where it was', () => {
    // Time is absolute. Steps that start while the clock was stalled are not
    // played late in a burst, as in the prototype; the grid stays in place.
    const steady = run(env(), ticks(0.9, 400));
    const stalled = run(env(), [...ticks(0.9, 100), ...ticks(0.9 + 100 * 0.025 + 3, 200)]);
    const grid = (r: typeof steady) =>
      new Map(r.outputs.flatMap((o) => o.steps).map((s) => [s.step, s.seconds]));
    const a = grid(steady);
    for (const [step, seconds] of grid(stalled)) if (a.has(step)) expect(seconds).toBe(a.get(step));
    const resumed = 0.9 + 100 * 0.025 + 3;
    const late = stalled.outputs.slice(100).flatMap((o) => o.events);
    for (const e of late) expect(e.seconds).toBeGreaterThanOrEqual(resumed);
    expect(late.length).toBeGreaterThan(0);
  });

  it('keeps the machine laws, with the style gliding under it', () => {
    const track = glideTo(glideTo(swung, PRESETS[1]!.style, 8, 64), { swing: 1 }, 40, 32);
    const script: Script<TransportEnv, TransportInput> = ticks(0.9, 240).map((input) => ({
      env: env(track),
      input,
    }));
    expect(lawBreaks(transport, script)).toEqual([]);
  });

  it('composes the band as the band would alone', () => {
    const track = holding(INITIAL_STYLE);
    const { outputs } = run(env(track), ticks(0.9, 600));
    let carried = band.initial;
    for (const b of outputs.flatMap((o) => o.composed)) {
      const next = band.advance(
        { seed: 11, bar: b.bar, style: styleAt(track, b.bar * 16) },
        carried,
        null,
      );
      expect(b).toEqual(next.output);
      carried = next.carried;
    }
  });
});
