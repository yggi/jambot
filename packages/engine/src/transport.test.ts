import { describe, expect, it } from 'vitest';
import { band } from './band.ts';
import { type Script, lawBreaks } from './machine.ts';
import {
  INITIAL_STYLE,
  PRESETS,
  SLIDER_GLIDE,
  type StyleTrack,
  glideTo,
  holding,
  styleAt,
} from './style.ts';
import { swingOf } from './swing.ts';
import { stepSeconds } from './tempo.ts';
import {
  COMPOSE_AHEAD,
  LOOKAHEAD,
  type TransportEnv,
  type TransportInput,
  type TimedEvent,
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

/**
 * A run in which the style changes once, as a player would change it: after
 * the tick where the head first reaches `at`, from the head on.
 */
const runChanging = (
  track: StyleTrack,
  inputs: TransportInput[],
  at: number,
  change: (track: StyleTrack, head: number) => StyleTrack,
) => {
  let carried = transport.initial;
  let changedAt: number | null = null;
  const outputs: TransportOutput[] = [];
  for (const input of inputs) {
    const next = transport.advance({ seed: 11, start: 1, track }, carried, input);
    carried = next.carried;
    outputs.push(next.output);
    if (changedAt === null && carried!.head.step >= at) {
      changedAt = carried!.head.step;
      track = change(track, changedAt);
    }
  }
  return { outputs, changedAt: changedAt! };
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
    const sections = new Map(outputs.flatMap((o) => o.composed).map((b) => [b.bar, b.section]));
    steps.forEach((s) => expect(s.section).toEqual(sections.get(Math.floor(s.step / 16))));
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

  it('composes each bar on the last beat of the bar before, and not sooner', () => {
    // A beat is at least 333 ms even at 180 bpm, nearly three lookaheads.
    expect(COMPOSE_AHEAD).toBe(4);
    const { outputs } = run(env(), ticks(0.9, 800));
    const composed: number[] = [];
    for (const o of outputs) {
      composed.push(...o.composed.map((b) => b.bar));
      const last = o.steps.at(-1);
      if (last) expect(composed.at(-1)).toBe(Math.floor((last.step + COMPOSE_AHEAD) / 16));
    }
    expect(composed).toEqual(range(composed.length));
  });

  it('hears a change in the drums within 20 steps: the rest of the bar and a beat', () => {
    // Energy 0.5 plays at 0.2 in the intro, so any rise shows.
    const track = holding({ ...INITIAL_STYLE, energy: 0.5 });
    let longest = 0;
    for (let at = 0; at < 48; at++) {
      const { outputs, changedAt } = runChanging(track, ticks(0.9, 480), at, (t, head) =>
        glideTo(t, { energy: 1 }, head, SLIDER_GLIDE),
      );
      const heard = outputs
        .flatMap((o) => o.composed)
        .find((b) => b.bar * 16 > changedAt && b.barEnergy > 0.2 + 1e-9);
      longest = Math.max(longest, heard!.bar * 16 - changedAt);
    }
    expect(longest).toBeLessThanOrEqual(16 + COMPOSE_AHEAD);
    expect(longest).toBeGreaterThan(16);
  });

  it('keeps a beat’s swing once the beat has started, whatever the style does next', () => {
    // Swing gliding up, then sent back to straight in the middle of a beat:
    // the rest of that beat plays as it would have. Reading the track again
    // moved it by up to 0.36 steps.
    const track = glideTo(holding({ ...INITIAL_STYLE, energy: 1, swing: 0 }), { swing: 1 }, 0, 16);
    let compared = 0;
    for (const at of [9, 10, 13, 14, 17, 18]) {
      const steady = run(env(track), ticks(0.9, 60));
      const changed = runChanging(track, ticks(0.9, 60), at, (t, head) =>
        glideTo(t, { swing: 0 }, head, 16),
      );
      const beatEnd = Math.floor(changed.changedAt / 4) * 4 + 4;
      const inBeat = (r: { outputs: TransportOutput[] }) =>
        r.outputs
          .flatMap((o) => o.events)
          .filter((e) => {
            const s = e.bar * 16 + e.event.step;
            return s >= changed.changedAt && s < beatEnd;
          })
          .map((e) => [e.event.step, e.event.note, e.seconds]);
      expect(inBeat(changed)).toEqual(inBeat(steady));
      compared += inBeat(steady).length;
    }
    expect(compared).toBeGreaterThan(0);
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
    const dense = holding({ ...INITIAL_STYLE, energy: 1 });
    const steady = run(env(dense), ticks(0.9, 400));
    const stalled = run(env(dense), [...ticks(0.9, 100), ...ticks(0.9 + 100 * 0.025 + 3, 200)]);
    const grid = (r: typeof steady) =>
      new Map(r.outputs.flatMap((o) => o.steps).map((s) => [s.step, s.seconds]));
    const a = grid(steady);
    for (const [step, seconds] of grid(stalled)) if (a.has(step)) expect(seconds).toBe(a.get(step));
    const resumed = 0.9 + 100 * 0.025 + 3;
    const late = stalled.outputs.slice(100).flatMap((o) => o.events);
    for (const e of late) expect(e.seconds).toBeGreaterThanOrEqual(resumed);
    // The first tick back plays exactly what the steady run plays in its
    // window: only what the clock passed is dropped.
    const key = (e: TimedEvent) => `${e.bar}:${e.event.step}:${e.event.note}:${e.seconds}`;
    const window = steady.outputs
      .flatMap((o) => o.events)
      .filter((e) => e.seconds >= resumed && e.seconds < resumed + LOOKAHEAD);
    expect(stalled.outputs[100]!.events.map(key)).toEqual(window.map(key));
    expect(window.length).toBeGreaterThan(0);
  });

  it('catches up after four hours’ stall within a lookahead, reporting the missed steps by count', () => {
    const before = run(env(), ticks(0.9, 100));
    // An event's night: four hours with the tab's clock stopped.
    const now = 0.9 + 100 * 0.025 + 4 * 3600;
    const started = Date.now();
    const back = transport.advance(env(), before.carried, { now, until: now + LOOKAHEAD });
    const took = Date.now() - started;
    expect(took).toBeLessThan(LOOKAHEAD * 1000);
    // 84 bpm is 5.6 steps a second.
    expect(back.output.missed).toBeGreaterThan(4 * 3600 * 5.5);
    expect(back.output.composed.length).toBeLessThan(3);
    expect(back.output.steps.length).toBeLessThan(4);
    for (const s of back.output.steps) expect(s.seconds + s.length).toBeGreaterThan(now);
    // The form went on through the stall: the band stands where an unbroken run would.
    const unbroken = run(env(), ticks(0.9, 100)).carried!;
    let carried = unbroken;
    while (carried.head.seconds + stepSeconds(styleAt(swung, carried.head.step).bpm) <= now)
      carried = transport.advance(env(), carried, {
        now: carried.head.seconds,
        until: carried.head.seconds + 4,
      }).carried!;
    expect(back.carried!.section).toEqual(carried.section);
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
