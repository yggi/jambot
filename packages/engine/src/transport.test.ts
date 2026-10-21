import { describe, expect, it } from 'vitest';
import { type BandBar, type BandCarried, band, lookAhead, passBar } from './band.ts';
import { chordAt } from './chords.ts';
import type { KeyWish } from './key.ts';
import { type Script, lawBreaks } from './machine.ts';
import { type HeardNote, type Judgement, judgeBar } from './muse.ts';
import { presetSwing } from './repository.ts';
import {
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  type Style,
  type StyleTrack,
  glideTo,
  holding,
  styleAt,
} from './style.ts';
import {
  type MeterSwing,
  STRAIGHT,
  type SwingTrack,
  holdingSwing,
  swingAt,
  swingOf,
  swingTo,
} from './swing.ts';
import { stepSeconds, tempoMap } from './tempo.ts';
import {
  type BarJudgement,
  type BarSource,
  CATCH_UP,
  COMPOSE_AHEAD,
  LOOKAHEAD,
  type ScheduledStep,
  type TransportEnv,
  type TransportInput,
  type TimedEvent,
  type TransportOutput,
  bandEnvAt,
  forecast,
  foresight,
  transport,
  transportOver,
  writtenAt,
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
    const next = transport.advance(env(track), carried, input);
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
/** Lo-fi hip hop's meter: swung on the 16ths, at 65 %. */
const LOFI = holdingSwing(presetSwing(PRESETS[4]!)!);
const env = (
  track: StyleTrack = swung,
  wish: KeyWish = { tonic: null, mode: PRESETS[4]!.mode, melodic: null },
  swing: SwingTrack = holdingSwing(STRAIGHT),
): TransportEnv => ({ seed: 11, start: 1, track, wish, swing });

/** The swing a meter's track plays, beat by beat, on the level it asks for. */
const swingOfTrack = (track: SwingTrack) => swingOf((start) => swingAt(track, start));

/**
 * A run in which the meter's swing changes once: after the tick where the
 * head first reaches `at`, from the head on.
 */
const runSwinging = (
  swing: SwingTrack,
  inputs: TransportInput[],
  at: number,
  change: (swing: SwingTrack, head: number) => SwingTrack,
) => {
  let carried = transport.initial;
  let changedAt: number | null = null;
  const outputs: TransportOutput[] = [];
  for (const input of inputs) {
    const next = transport.advance(
      env(holding({ ...INITIAL_STYLE, energy: 1 }), undefined, swing),
      carried,
      input,
    );
    carried = next.carried;
    outputs.push(next.output);
    if (changedAt === null && carried!.head.step >= at) {
      changedAt = carried!.head.step;
      swing = change(swing, changedAt);
    }
  }
  return { outputs, changedAt: changedAt! };
};

describe('the transport', () => {
  it('schedules 120 ms ahead', () => expect(LOOKAHEAD).toBe(0.12));

  it('schedules every step once, in order, each as long as the tempo where it starts, with its bar’s section, key and chord', () => {
    const slowing = glideTo(swung, { bpm: 150 }, 20, 64);
    const { outputs } = run(env(slowing), ticks(0.9, 800));
    const steps = outputs.flatMap((o) => o.steps);
    expect(steps.map((s) => s.step)).toEqual(range(steps.length));
    expect(steps[0]!.seconds).toBe(1);
    steps.forEach((s) =>
      expect(s.length).toBeCloseTo(stepSeconds(styleAt(slowing, s.step).bpm), 12),
    );
    const composed = new Map(outputs.flatMap((o) => o.composed).map((b) => [b.bar, b]));
    for (const s of steps) {
      const bar = composed.get(Math.floor(s.step / 16))!;
      expect(s.section).toEqual(bar.plan.section);
      expect(s.key).toEqual(bar.plan.key);
      expect(s.chord).toEqual(chordAt(bar.chords, s.step % 16));
    }
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

  it('composes each bar on the last beat of the bar before, and not sooner (C5)', () => {
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

  it('hears a change in the drums within 20 steps: the rest of the bar and a beat (C5)', () => {
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

  it('keeps a beat’s swing once the beat has started, whatever the style does next (C3)', () => {
    // Swing gliding up, then sent back to straight in the middle of a beat:
    // the rest of that beat plays as it would have. Reading the track again
    // moved it by up to 0.36 steps.
    const straight8: MeterSwing = { level: '8n', share: 0.5 };
    const swing = swingTo(holdingSwing(straight8), { share: 2 / 3 }, 0, 16);
    const style = holding({ ...INITIAL_STYLE, energy: 1 });
    let compared = 0;
    for (const at of [9, 10, 13, 14, 17, 18]) {
      const steady = run(env(style, undefined, swing), ticks(0.9, 60));
      const changed = runSwinging(swing, ticks(0.9, 60), at, (t, head) =>
        swingTo(t, { share: 0.5 }, head, 16),
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

  it('takes a level asked for where the next section starts, and glides the share from the next beat (#360)', () => {
    // Asked for the 8ths in bar 3: the share glides over a bar from there,
    // on the 16ths, and the section from bar 8 swings on the 8ths.
    const asked = 3 * 16;
    let swing = LOFI;
    let carried = transport.initial;
    const laid: ScheduledStep[] = [];
    for (const input of ticks(0.9, 1400)) {
      const r = transport.advance(env(swung, undefined, swing), carried, input);
      carried = r.carried;
      laid.push(...r.output.steps);
      if (swing === LOFI && carried!.head.step >= asked)
        swing = swingTo(swing, { level: '8n', share: 2 / 3 }, carried!.head.step, SLIDER_GLIDE);
    }
    const levels = new Map(laid.map((s) => [s.step, s.swing.level]));
    expect(laid.length).toBeGreaterThan(9 * 16);
    for (const [step, level] of levels)
      expect([step, level]).toEqual([step, step < 128 ? '16n' : '8n']);
    // The share moved inside the section, on the 16ths.
    const shares = laid.filter((s) => s.step < 128).map((s) => s.swing.share);
    expect(shares[0]).toBe(presetSwing(PRESETS[4]!)!.share);
    expect(shares.at(-1)).toBeCloseTo(2 / 3, 12);
  });

  it('plays every event the band composed, once, at its swung time', () => {
    const track = swung;
    const { outputs } = run(env(track, undefined, LOFI), ticks(0.9, 800));
    const steps = new Map(outputs.flatMap((o) => o.steps).map((s) => [s.step, s]));
    const bars = outputs.flatMap((o) => o.composed);
    const events = outputs.flatMap((o) => o.events);
    const played = new Set(
      events.map((e) => `${e.bar}:${e.event.part}:${e.event.step}:${e.event.note}`),
    );
    // Every bar the steps have wholly passed through is played in full.
    const whole = bars.filter((b) => steps.has(b.bar * 16 + 15));
    for (const b of whole)
      for (const e of b.dough)
        expect(played.has(`${b.bar}:${e.part}:${e.step}:${e.note}`)).toBe(true);
    // Each event is its bar's own dough note: the transport forwards a
    // performer's play, it doesn't recompute it.
    const dough = new Map(
      bars.flatMap((b) => b.dough.map((d) => [`${b.bar}:${d.part}:${d.step}:${d.note}`, d])),
    );
    for (const e of events)
      expect(e.event).toEqual(
        dough.get(`${e.bar}:${e.event.part}:${e.event.step}:${e.event.note}`),
      );
    expect(events.length).toBe(played.size);
    const swing = swingOfTrack(LOFI);
    for (const e of events) {
      const written = e.bar * 16 + e.event.step;
      const step = steps.get(written)!;
      expect(e.seconds).toBeCloseTo(
        step.seconds + (swing.played(written) - written) * step.length,
        9,
      );
    }
  });

  it('holds a note from its swung start to its swung end (L2)', () => {
    // Both ends of a note go through the map, so a legato line stays legato
    // under swing. The prototype swings only the start.
    const { outputs } = run(env(swung, undefined, LOFI), ticks(0.9, 400));
    const steps = new Map(outputs.flatMap((o) => o.steps).map((s) => [s.step, s]));
    const swing = swingOfTrack(LOFI);
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

  it('reads every onset back as its written position, through the tempo and swing it was laid with (T4, Q1c)', () => {
    // A player plays along with what they hear, and their notes are read
    // back onto the grid. The track holds only its latest glide per axis,
    // so inverting it from the song's start misplaces notes once the tempo
    // has changed twice (#78); the steps as laid hold what the track forgets.
    // The meter's swing changes too: its share at once, its level where the next section starts.
    const changes: [number, Partial<Style>, Partial<MeterSwing>][] = [
      [40, { bpm: 90 }, {}],
      [150, { bpm: 150 }, { level: '8n', share: 2 / 3 }],
      [260, {}, { share: 0.55 }],
      [330, { bpm: 70 }, { level: '16n', share: 0.62 }],
    ];
    let track = swung;
    let swing = LOFI;
    let carried = transport.initial;
    const laid: ScheduledStep[] = [];
    const events: TimedEvent[] = [];
    let next = 0;
    for (const input of ticks(0.9, 2400)) {
      const r = transport.advance(env(track, undefined, swing), carried, input);
      carried = r.carried;
      laid.push(...r.output.steps);
      events.push(...r.output.events);
      const head = carried!.head.step;
      if (next < changes.length && head >= changes[next]![0]) {
        const [, style, meter] = changes[next++]!;
        track = glideTo(track, style, head, SLIDER_GLIDE);
        swing = swingTo(swing, meter, head, SLIDER_GLIDE);
      }
    }
    // Both levels were laid.
    expect(new Set(laid.map((s) => s.swing.level))).toEqual(new Set(['8n', '16n']));
    expect(next).toBe(changes.length);
    expect(events.length).toBeGreaterThan(500);
    for (const e of events)
      expect(writtenAt(laid, e.seconds)).toBeCloseTo(e.bar * 16 + e.event.step, 9);
    // Inverting the track as it ends up, from the start, gets them wrong.
    const fromStart = (seconds: number) =>
      swingOfTrack(swing).written(tempoMap(track, { step: 0, seconds: 1 }).written(seconds));
    const last = events.at(-1)!;
    expect(Math.abs(fromStart(last.seconds) - (last.bar * 16 + last.event.step))).toBeGreaterThan(
      16,
    );
  });

  it('reads no position for a time outside the steps laid', () => {
    const { outputs } = run(env(), ticks(0.9, 40));
    const laid = outputs.flatMap((o) => o.steps);
    const end = laid.at(-1)!.seconds + laid.at(-1)!.length;
    expect(writtenAt(laid, 0.5)).toBeNull();
    expect(writtenAt(laid, end)).toBeNull();
    expect(writtenAt(laid.slice(4), laid[2]!.seconds)).toBeNull();
    expect(writtenAt([], 1)).toBeNull();
    expect(writtenAt(laid, laid[0]!.seconds)).toBe(0);
  });

  it('never waits: after a stall it drops what it missed and keeps the grid where it was (T1)', () => {
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
    // The first ten ticks back play exactly what the steady run plays in
    // their span: only what the clock passed is dropped.
    const key = (e: TimedEvent) => `${e.bar}:${e.event.step}:${e.event.note}:${e.seconds}`;
    const span = resumed + 9 * 0.025 + LOOKAHEAD;
    const window = steady.outputs
      .flatMap((o) => o.events)
      .filter((e) => e.seconds >= resumed && e.seconds < span);
    const back = stalled.outputs.slice(100, 110).flatMap((o) => o.events);
    expect(back.map(key)).toEqual(window.map(key));
    expect(window.length).toBeGreaterThan(0);
  });

  // It walks every bar of four hours through the transport.
  it('catches up after four hours’ stall a bounded walk at a time: no advance passes more than CATCH_UP bars, and nothing plays late (T1)', () => {
    // A wish for another key, so the stall passes key changes too.
    const far = env(swung, { tonic: 2, mode: 'mixolydian', melodic: null });
    const before = run(far, ticks(0.9, 100));
    // An event's night: four hours with the tab's clock stopped. A walk
    // through every bar it passed costs some microseconds a bar, so one
    // advance that walked them all would outlast its own lookahead on a
    // slow machine; each advance walks at most CATCH_UP bars, and the
    // ticks after carry on, on the clock as it is then.
    const woke = 0.9 + 100 * 0.025 + 4 * 3600;
    let carried = before.carried;
    let missed = 0;
    let silent = 0;
    let back: TransportOutput | null = null;
    for (let i = 0; !back; i++) {
      const now = woke + i * 0.025;
      const next = transport.advance(far, carried, { now, until: now + LOOKAHEAD });
      carried = next.carried;
      // CATCH_UP whole bars, and the steps of a part bar on either side.
      expect(next.output.missed).toBeLessThanOrEqual((CATCH_UP + 2) * 16);
      for (const e of next.output.events) expect(e.seconds).toBeGreaterThanOrEqual(now);
      missed += next.output.missed;
      if (next.output.composed.length > 0) back = next.output;
      else silent++;
    }
    // 84 bpm is 5.6 steps a second, and 4 hours are some 5,040 bars.
    expect(missed).toBeGreaterThan(4 * 3600 * 5.5);
    expect(silent).toBe(Math.floor((4 * 3600 * 5.6) / 16 / CATCH_UP));
    expect(back.composed.length).toBeLessThan(3);
    expect(back.steps.length).toBeLessThan(4);
    // The form, the key and the chords went on through the stall: the bars
    // composed after it are those an unbroken run composes there.
    const unbroken = new Map<number, BandBar>();
    let steady = run(far, ticks(0.9, 100)).carried!;
    while (steady.head.seconds <= woke + 2) {
      const next = transport.advance(far, steady, {
        now: steady.head.seconds,
        until: steady.head.seconds + 4,
      });
      for (const b of next.output.composed) unbroken.set(b.bar, b);
      steady = next.carried!;
    }
    for (const b of back.composed) {
      const there = unbroken.get(b.bar)!;
      expect({ plan: b.plan, chords: b.chords }).toEqual({
        plan: there.plan,
        chords: there.chords,
      });
    }
    expect(back.composed[0]!.plan.key).toEqual({ tonic: 2, mode: 'mixolydian' });
  });

  it('keeps the machine laws, with the style gliding under it (F1, Q4a)', () => {
    const track = glideTo(swung, PRESETS[1]!.style, 8, 64);
    const swing = swingTo(LOFI, { level: '8n', share: 2 / 3 }, 40, 32);
    const script: Script<TransportEnv, TransportInput> = ticks(0.9, 240).map((input) => ({
      env: env(track, undefined, swing),
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
        {
          seed: 11,
          bar: b.bar,
          style: styleAt(track, b.bar * 16),
          wish: env().wish,
          offer: null,
        },
        carried,
        null,
      );
      expect(b).toEqual(next.output);
      carried = next.carried;
    }
  });
});

/**
 * The transport over ticks, each note played delivered on the first tick
 * whose clock has reached the step it was played on, as a player's note
 * arrives; and a forget on the tick given.
 */
function listening(
  track: StyleTrack,
  count: number,
  notes: readonly HeardNote[],
  forgetAt: number | null = null,
) {
  let carried = transport.initial;
  const laid = new Map<number, number>();
  const outputs: TransportOutput[] = [];
  const inputs: TransportInput[] = [];
  let waiting = [...notes];
  for (const [i, tick] of ticks(0.9, count).entries()) {
    const arrived = waiting.filter(
      (n) => (laid.get(Math.floor(n.position)) ?? Infinity) <= tick.now,
    );
    waiting = waiting.filter((n) => !arrived.includes(n));
    const input: TransportInput = { ...tick, heard: arrived, forget: i === forgetAt };
    inputs.push(input);
    const next = transport.advance(env(track), carried, input);
    carried = next.carried;
    outputs.push(next.output);
    for (const step of next.output.steps) laid.set(step.step, step.seconds);
  }
  return { outputs, inputs, carried, bars: outputs.flatMap((o) => o.composed) };
}

/** A three-note motif played in `bar`, on its steps 0, 4 and 8. */
const motifIn = (bar: number, source = 'the computer keys'): HeardNote[] =>
  [69, 72, 76].map((note, i) => ({
    note,
    velocity: 100,
    source,
    position: 16 * bar + 4 * i,
    end: null,
  }));

describe('the transport listening', () => {
  const lively = holding({ ...INITIAL_STYLE, energy: 0.8 });

  it('plays a motif heard in bar k from bar k + 2, and nothing before bar k + 2 changes (F7)', () => {
    // Every loop passes through a delay: the Muse judges bar k as the band
    // composes bar k + 2, so what bar k + 1 plays can't depend on bar k.
    const silent = listening(lively, 1400, []);
    for (const k of [2, 5, 9]) {
      const heard = listening(lively, 1400, motifIn(k));
      const before = (r: typeof heard) => r.bars.filter((b) => b.bar < k + 2);
      expect(before(heard)).toEqual(before(silent));
      const judged = heard.outputs.flatMap((o) => o.judged);
      expect(judged.find((j) => j.bar === k)).toMatchObject({ offer: { bar: k } });
      const played = heard.bars.find((b) => b.bar === k + 2)!;
      expect(played.offer).toMatchObject({ bar: k, source: 'the computer keys' });
      expect(played.written.filter((n) => n.part === 'lead').map((n) => n.step)).toEqual([0, 4, 8]);
    }
  });

  it('plays a motif played loudly or softly the same, on the lead’s level plus its accents (U4)', () => {
    // The player's level is the reading of their style, not the band's.
    // Held still (feel 0, T17), so the lead plays its level and accents exactly.
    const still = holding({ ...INITIAL_STYLE, energy: 0.8, entropy: 0, artic: 1 });
    const at = (velocities: number[]) => {
      const notes = motifIn(2).map((n, i) => ({ ...n, velocity: velocities[i]! }));
      const bar = listening(still, 600, notes).bars.find((b) => b.bar === 4)!;
      return bar.dough.filter((e) => e.part === 'lead').map((e) => e.velocity);
    };
    expect(at([120, 100, 110])).toEqual([101, 81, 91]);
    expect(at([50, 30, 40])).toEqual([101, 81, 91]);
  });

  it('forecasts the bars ahead with the motif on offer now, and the bars composed with their own', () => {
    const { carried, bars } = listening(lively, 500, motifIn(2));
    const ahead = forecast(env(lively), carried, 8);
    expect(ahead.length).toBe(8);
    const offer = carried!.listening.muse.offer;
    expect(offer).toMatchObject({ bar: 2 });
    const composed = new Map(bars.map((b) => [b.bar, b]));
    for (const b of ahead)
      expect(b.offer).toEqual(composed.has(b.bar) ? composed.get(b.bar)!.offer : offer);
    expect(forecast(env(lively), null, 4).every((b) => b.offer === null)).toBe(true);
  });

  it('judges each bar it composed once, in order, and keeps no note it has judged', () => {
    const { outputs, carried } = listening(lively, 900, [...motifIn(3), ...motifIn(7)]);
    const judged = outputs.flatMap((o) => o.judged).map((j) => j.bar);
    expect(judged).toEqual(range(judged.length));
    expect(judged.length).toBeGreaterThan(8);
    const last = judged.at(-1)!;
    for (const n of carried!.listening.pending)
      expect(Math.floor(n.position / 16)).toBeGreaterThan(last);
    expect(carried!.listening.unjudged.every((u) => u.bar > last)).toBe(true);
  });

  it('forgets the motif when asked, from the next bar it composes', () => {
    // A motif in bar 2 plays from bar 4; a forget while bar 8 is composed
    // takes it away from bar 9; the next motif, in bar 11, plays from bar 13
    // and stays: the forget is used up.
    const notes = [...motifIn(2), ...motifIn(11)];
    const offered = listening(lively, 1800, notes);
    const tick = offered.outputs.findIndex((o) => o.composed.some((b) => b.bar === 8));
    const forgot = listening(lively, 1800, notes, tick + 1);
    const judged = forgot.outputs.flatMap((o) => o.judged);
    expect(judged.filter((j) => j.forgot === 'asked').map((j) => j.bar)).toEqual([7]);
    expect(forgot.bars.at(-1)!.bar).toBeGreaterThan(18);
    for (const b of forgot.bars)
      expect(b.offer?.bar ?? null).toBe(b.bar >= 13 ? 11 : b.bar >= 4 && b.bar < 9 ? 2 : null);
  });

  it('keeps the machine laws with notes arriving and a forget (F1)', () => {
    const { inputs } = listening(lively, 600, [...motifIn(2), ...motifIn(5, 'a MIDI port')], 400);
    const script: Script<TransportEnv, TransportInput> = inputs.map((input) => ({
      env: env(lively),
      input,
    }));
    expect(lawBreaks(transport, script)).toEqual([]);
  });
});

/**
 * A source that plays back bars given to it, as a client plays a host's:
 * each as its first step is laid, none for a bar it lacks, and a bar's start
 * where one is given.
 */
const replay = (
  bars: readonly BandBar[],
  starts: ReadonlyMap<number, number> = new Map(),
): BarSource<null> => ({
  initial: null,
  ahead: 0,
  receive: (carried) => carried,
  compose(env, carried) {
    const bar = bars.find((b) => b.bar === env.bar) ?? null;
    const start = starts.get(env.bar);
    return start === undefined ? { carried, bar } : { carried, bar, start };
  },
  pass: (_, carried) => carried,
});

describe('the transport over a source of bars', () => {
  const lively = holding({ ...INITIAL_STYLE, energy: 0.8 });
  const played = run(env(lively), ticks(0.9, 900));
  const bars = played.outputs.flatMap((o) => o.composed);
  const runOver = (source: BarSource<null>, inputs = ticks(0.9, 900)) => {
    const over = transportOver(source);
    let carried = over.initial;
    return inputs.map((input) => {
      const next = over.advance(env(lively), carried, input);
      carried = next.carried;
      return next.output;
    });
  };

  it("plays the band's bars, given back, on the same steps at the same times", () => {
    const again = runOver(replay(bars));
    expect(again.flatMap((o) => o.events)).toEqual(played.outputs.flatMap((o) => o.events));
    expect(again.flatMap((o) => o.steps)).toEqual(played.outputs.flatMap((o) => o.steps));
    expect(bars.length).toBeGreaterThan(8);
  });

  it('passes a bar it lacks, laying none of its steps, and plays the next as the band did', () => {
    const again = runOver(replay(bars.filter((b) => b.bar !== 3)));
    const steps = again.flatMap((o) => o.steps).map((s) => s.step);
    expect(steps.filter((s) => s >= 48 && s < 64)).toEqual([]);
    expect(again.reduce((sum, o) => sum + o.missed, 0)).toBe(16);
    const barFour = (outputs: TransportOutput[]) =>
      outputs.flatMap((o) => o.events).filter((e) => e.bar === 4);
    expect(barFour(again).length).toBeGreaterThan(0);
    expect(barFour(again)).toEqual(barFour(played.outputs));
  });

  it("lays a bar's first step where the source says the bar starts, and the steps after from there", () => {
    const laid = played.outputs.flatMap((o) => o.steps);
    const at = (step: number) => laid.find((s) => s.step === step)!.seconds;
    const again = runOver(replay(bars, new Map([[2, at(32) + 0.004]]))).flatMap((o) => o.steps);
    for (const s of again) expect(s.seconds - at(s.step)).toBeCloseTo(s.step < 32 ? 0 : 0.004, 9);
  });

  it('keeps the machine laws over a source (F1)', () => {
    const script: Script<TransportEnv, TransportInput> = ticks(0.9, 200).map((input) => ({
      env: env(lively),
      input,
    }));
    expect(lawBreaks(transportOver(replay(bars.filter((b) => b.bar !== 1))), script)).toEqual([]);
  });
});

describe('the transport hearing bars judged elsewhere', () => {
  const lively = holding({ ...INITIAL_STYLE, energy: 0.8 });
  const silent = run(env(lively), ticks(0.9, 700));
  const keyOf = (bar: number) =>
    silent.outputs.flatMap((o) => o.composed).find((b) => b.bar === bar)!.plan.key;
  /** The transport with `judged` delivered on the tick given. */
  const hearing = (judged: readonly BarJudgement[], on: number) =>
    run(
      env(lively),
      ticks(0.9, 700).map((tick, i) => (i === on ? { ...tick, judged } : tick)),
    ).outputs;

  it('takes a motif judged elsewhere in bar k, and plays it from bar k + 2, as one heard here (F7)', () => {
    const k = 3;
    const judgement = judgeBar(motifIn(k, 'a client'), k, keyOf(k))[0]!;
    // Delivered as bar k + 1 is composed, well before the Muse hears bar k: it waits for it.
    const on = silent.outputs.findIndex((o) => o.composed.some((b) => b.bar === k + 1));
    const outputs = hearing([{ bar: k, judgement }], on);
    expect(outputs.flatMap((o) => o.dropped)).toEqual([]);
    const heard = outputs.flatMap((o) => o.judged).find((j) => j.bar === k)!;
    expect(heard.judgements).toEqual([judgement]);
    const bar = outputs.flatMap((o) => o.composed).find((b) => b.bar === k + 2)!;
    expect(bar.offer).toMatchObject({ bar: k, source: 'a client' });
    expect(bar.written.filter((n) => n.part === 'lead').map((n) => n.step)).toEqual([0, 4, 8]);
  });

  it('drops a judgement that arrives after the Muse has heard its bar, and says so, changing no bar (F7)', () => {
    const k = 3;
    const judgement = judgeBar(motifIn(k, 'a client'), k, keyOf(k))[0]!;
    const heardOn = silent.outputs.findIndex((o) => o.judged.some((j) => j.bar === k));
    const outputs = hearing([{ bar: k, judgement }], heardOn + 1);
    expect(outputs.flatMap((o) => o.judged).every((j) => j.judgements.length === 0)).toBe(true);
    expect(outputs.flatMap((o) => o.composed)).toEqual(silent.outputs.flatMap((o) => o.composed));
    expect(outputs.flatMap((o) => o.dropped)).toEqual([{ bar: k, judgement, why: 'late' }]);
    // Delivered on the tick before, it is heard.
    const inTime = hearing([{ bar: k, judgement }], heardOn);
    expect(inTime.flatMap((o) => o.dropped)).toEqual([]);
    expect(inTime.flatMap((o) => o.judged).find((j) => j.bar === k)!.judgements).toEqual([
      judgement,
    ]);
  });

  it("drops a judgement no ear would have made in its bar's key, and plays on as before", () => {
    const k = 3;
    const judgement = judgeBar(motifIn(k, 'a client'), k, keyOf(k))[0]!;
    if (judgement.kind !== 'motif') throw new Error('a motif');
    const wild = { ...judgement, motif: { ...judgement.motif, degrees: [0, 7, 14] } };
    const on = silent.outputs.findIndex((o) => o.composed.some((b) => b.bar === k + 1));
    const outputs = hearing([{ bar: k, judgement: wild }], on);
    expect(outputs.flatMap((o) => o.dropped)).toEqual([
      { bar: k, judgement: wild, why: 'inadmissible' },
    ]);
    expect(outputs.flatMap((o) => o.composed)).toEqual(silent.outputs.flatMap((o) => o.composed));
  });

  it('drops what only claims to be a judgement, and the clock never waits for it (T1)', () => {
    const k = 3;
    const on = silent.outputs.findIndex((o) => o.composed.some((b) => b.bar === k + 1));
    const garbled = [
      null,
      { kind: 'motif', source: 'a client', level: 100 },
      { kind: 'motif', source: 'a client', level: 100, motif: { cycle: 16 } },
    ] as unknown as Judgement[];
    const outputs = hearing(
      garbled.map((judgement) => ({ bar: k, judgement })),
      on,
    );
    expect(outputs.flatMap((o) => o.dropped).map((d) => d.why)).toEqual([
      'inadmissible',
      'inadmissible',
      'inadmissible',
    ]);
    expect(outputs.flatMap((o) => o.composed)).toEqual(silent.outputs.flatMap((o) => o.composed));
  });

  it('drops a judgement of a bar not yet composed, which nobody can have played, and keeps nothing of it', () => {
    const judgement = judgeBar(motifIn(3, 'a client'), 3, keyOf(3))[0]!;
    // On tick 10 the band has composed bar 0 alone.
    const outputs = hearing([{ bar: 40, judgement }], 10);
    expect(outputs.flatMap((o) => o.dropped)).toEqual([{ bar: 40, judgement, why: 'ahead' }]);
    expect(outputs.flatMap((o) => o.composed)).toEqual(silent.outputs.flatMap((o) => o.composed));
  });
});

describe('the forecast from the transport', () => {
  it('is what the transport then composes, with a glide and a key change still to come', () => {
    // A preset glide from bar 16, and from tick 300 (about bar 10) a wish
    // for another key: the forecast reads both ahead of time. A forecast
    // made before the wish changed would not know it, as nobody can.
    const track = glideTo(swung, PRESETS[1]!.style, 16 * 16, PRESET_GLIDE);
    const wished = env(track, { tonic: 2, mode: 'mixolydian', melodic: null });
    let carried = transport.initial;
    const forecasts: { from: number; bars: ReturnType<typeof lookAhead> }[] = [];
    const composed = new Map<number, BandBar>();
    ticks(0.9, 900, 0.1).forEach((input, i) => {
      const now = i < 300 ? env(track) : wished;
      const next = transport.advance(now, carried, input);
      carried = next.carried;
      for (const b of next.output.composed) composed.set(b.bar, b);
      if (i >= 300 && i % 100 === 0)
        forecasts.push({
          from: carried!.nextBar,
          bars: lookAhead(carried!.source, (bar) => bandEnvAt(now, bar, null), 16),
        });
    });
    let compared = 0;
    for (const { from, bars } of forecasts) {
      expect(bars[0]!.bar).toBe(from);
      for (const { bar, plan, chords } of bars) {
        const there = composed.get(bar);
        if (!there) continue;
        expect({ plan, chords }).toEqual({ plan: there.plan, chords: there.chords });
        compared++;
      }
    }
    // The run went through the glide and the key change.
    const keys = new Set([...composed.values()].map((b) => JSON.stringify(b.plan.key)));
    expect(keys.size).toBeGreaterThan(1);
    expect(composed.get(30)!.style).not.toEqual(composed.get(0)!.style);
    expect(compared).toBeGreaterThan(60);
  });

  it('reads the bars ahead from any carried state, those composed first, each with the energy it plays at', () => {
    const track = glideTo(swung, PRESETS[1]!.style, 16 * 16, PRESET_GLIDE);
    const far = env(track, { tonic: 2, mode: 'mixolydian', melodic: null });
    // Before the start, the forecast is the song that then plays.
    const opening = forecast(far, null, 24);
    let carried = transport.initial;
    const composed = new Map<number, BandBar>();
    const checkpoints: { head: number; bars: ReturnType<typeof forecast> }[] = [];
    ticks(0.9, 900, 0.1).forEach((input) => {
      const next = transport.advance(far, carried, input);
      carried = next.carried;
      for (const b of next.output.composed) composed.set(b.bar, b);
      checkpoints.push({
        head: Math.floor(carried!.head.step / 16),
        bars: forecast(far, carried, 12),
      });
    });
    const played = (bar: number) => {
      const b = composed.get(bar);
      return (
        b && { bar: b.bar, plan: b.plan, chords: b.chords, barEnergy: b.barEnergy, offer: b.offer }
      );
    };
    expect(opening).toEqual(range(24).map(played));
    for (const { head, bars } of checkpoints) {
      expect(bars.map((b) => b.bar)).toEqual(range(12).map((i) => head + i));
      for (const b of bars) if (composed.has(b.bar)) expect(b).toEqual(played(b.bar));
    }
  });
});

describe('the foresight from the transport', () => {
  it('is the bars from the head on with their notes: the bars composed, then what the band composes next, exactly', () => {
    let carried = transport.initial;
    const composed = new Map<number, BandBar>();
    const looks: { from: number; bars: BandBar[] }[] = [];
    ticks(0.9, 700, 0.1).forEach((input, i) => {
      const next = transport.advance(env(), carried, input);
      carried = next.carried;
      for (const b of next.output.composed) composed.set(b.bar, b);
      if (i % 100 === 0) looks.push({ from: carried!.nextBar, bars: foresight(env(), carried, 6) });
    });
    let compared = 0;
    for (const { bars } of looks) {
      expect(bars).toHaveLength(6);
      bars.forEach((b, i) => expect(b.bar).toBe(bars[0]!.bar + i));
      for (const b of bars) {
        const there = composed.get(b.bar);
        if (!there) continue;
        expect(b.dough, `bar ${b.bar}`).toEqual(there.dough);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(20);
  });

  it('is the song from its first bar before the start, and leaves the transport as it was', () => {
    const bars = foresight(env(), null, 5);
    expect(bars.map((b) => b.bar)).toEqual([0, 1, 2, 3, 4]);
    expect(bars[0]!.dough.length).toBeGreaterThan(0);
    const composed = run(env(), ticks(0.9, 60, 0.1)).outputs.flatMap((o) => o.composed);
    for (const b of composed) expect(b.dough).toEqual(bars[b.bar]?.dough ?? b.dough);
  });
});

describe('the transport ending a song', () => {
  const inputs = (from: number, count: number) => ticks(from, count);
  /** Runs `count` ticks from the start, asking to finish on tick `at`. */
  const finishing = (at: number, count = 1200, track = swung) => {
    let carried = transport.initial;
    const outputs: TransportOutput[] = [];
    let asked: number | null = null;
    inputs(0.9, count).forEach((input, i) => {
      const finish = i >= at;
      const next = transport.advance(env(track), carried, { ...input, finish });
      if (finish && asked === null) asked = carried?.nextBar ?? 0;
      carried = next.carried;
      outputs.push(next.output);
    });
    return { outputs, carried: carried!, asked: asked! };
  };

  it('composes the finale as the next bar not yet composed, and no bar after it', () => {
    for (const at of [40, 47, 53, 61, 77, 100]) {
      const { outputs, carried, asked } = finishing(at);
      const composed = outputs.flatMap((o) => o.composed);
      expect(carried.finale.asked).toBe(true);
      expect(carried.finale.bar).toBe(asked);
      expect(composed.at(-1)!.bar).toBe(asked);
      expect(composed.map((b) => b.bar)).toEqual(range(asked + 1));
      expect(composed.at(-1)!.chords.map((c) => c.slot.step)).toEqual([0, 8]);
    }
  });

  it('plays only the bars up to the finale, and none of the steps after it', () => {
    const { outputs, carried } = finishing(60);
    const last = carried.finale.bar!;
    const steps = outputs.flatMap((o) => o.steps).map((s) => s.step);
    expect(steps).toEqual(range((last + 1) * 16));
    expect(outputs.flatMap((o) => o.events).every((e) => e.bar <= last)).toBe(true);
  });

  it('says when the last bar ended: where its last step ends, at the tempo it was laid with', () => {
    const { outputs, carried } = finishing(60);
    const laid = outputs.flatMap((o) => o.steps);
    const final = laid.at(-1)!;
    expect(carried.finale.ended).toBeCloseTo(final.seconds + final.length, 9);
  });

  it('says nothing of an end until the last bar is laid', () => {
    let carried = transport.initial;
    for (const input of inputs(0.9, 60)) {
      const next = transport.advance(env(), carried, { ...input, finish: true });
      carried = next.carried;
      if (carried!.finale.bar !== null && carried!.head.step < (carried!.finale.bar + 1) * 16)
        expect(carried!.finale.ended).toBeNull();
    }
  });

  it('keeps ending once ended: nothing more is composed or scheduled', () => {
    const { outputs, carried } = finishing(60, 1600);
    const after = outputs.slice(-100);
    for (const o of after) {
      expect(o.steps).toEqual([]);
      expect(o.events).toEqual([]);
      expect(o.composed).toEqual([]);
    }
    expect(carried.finale.ended).not.toBeNull();
  });

  it('ends a song asked to finish twice once', () => {
    const once = finishing(60);
    const twice = run(
      env(),
      inputs(0.9, 1200).map((input, i) => ({ ...input, finish: i >= 60 && i % 2 === 0 })),
    );
    expect(twice.carried!.finale).toEqual(once.carried.finale);
  });

  it('finishes on a bar that is decided as the band would decide it', () => {
    const { outputs } = finishing(60);
    const composed = outputs.flatMap((o) => o.composed);
    const last = composed.at(-1)!;
    const plain = run(env(), inputs(0.9, 1200)).outputs.flatMap((o) => o.composed);
    const same = plain.find((b) => b.bar === last.bar)!;
    expect(last.plan).toEqual(same.plan);
    expect(last.style).toEqual(same.style);
    expect(last.chords).not.toEqual(same.chords);
    expect(composed.slice(0, -1)).toEqual(plain.slice(0, last.bar));
  });

  it('leaves a state a forecast and a preview can still run from', () => {
    const { carried } = finishing(60);
    expect(() => forecast(env(), carried, 8)).not.toThrow();
    expect(() => foresight(env(), carried, 8)).not.toThrow();
  });

  it('keeps the machine laws with a finish asked (F1)', () => {
    const script: Script<TransportEnv, TransportInput> = ticks(0.9, 400).map((input, i) => ({
      env: env(),
      input: i > 100 ? { ...input, finish: true } : input,
    }));
    expect(lawBreaks(transport, script)).toEqual([]);
  });

  it('ignores a finish where the source has no finale of its own', () => {
    const plain = band;
    const source: BarSource<BandCarried> = {
      initial: plain.initial,
      ahead: COMPOSE_AHEAD,
      receive: (c) => c,
      compose(e, c) {
        const { carried, output } = plain.advance(e, c, null);
        return { carried, bar: output };
      },
      pass: passBar,
    };
    const over = transportOver(source);
    let carried = over.initial;
    for (const input of inputs(0.9, 600))
      carried = over.advance(env(), carried, { ...input, finish: true }).carried;
    expect(carried!.finale.bar).toBeNull();
    expect(carried!.finale.asked).toBe(true);
    expect(carried!.head.step).toBeGreaterThan(48);
  });

  it('ends at the bar a client is told, and schedules nothing beyond it', () => {
    const played = run(env(), ticks(0.9, 900));
    const bars = played.outputs.flatMap((o) => o.composed);
    const over = transportOver(replay(bars));
    let carried = over.initial;
    const steps: ScheduledStep[] = [];
    ticks(0.9, 900).forEach((input, i) => {
      const next = over.advance(env(), carried, { ...input, ends: i > 30 ? 3 : undefined });
      carried = next.carried;
      steps.push(...next.output.steps);
    });
    expect(steps.at(-1)!.step).toBe(4 * 16 - 1);
    expect(carried!.finale.ended).toBeCloseTo(steps.at(-1)!.seconds + steps.at(-1)!.length, 9);
  });
});

describe('the transport starting after the clock', () => {
  const later = { ...env(), start: 5 };

  it('composes the first bar as soon as the song is known, when the source is asked ahead', () => {
    const first = transport.advance(later, transport.initial, { now: 0, until: LOOKAHEAD });
    expect(first.output.steps).toEqual([]);
    expect(first.output.composed.map((b) => b.bar)).toEqual([0]);
    const again = transport.advance(later, first.carried, { now: 0.025, until: 0.025 + LOOKAHEAD });
    expect(again.output.composed).toEqual([]);
  });

  it('plays the same song from the start, as if it had started at once, shifted by the wait', () => {
    const now = run(env(), ticks(0.9, 400));
    const waiting = run(later, ticks(0.0, 600));
    const events = (o: TransportOutput[]) => o.flatMap((x) => x.events);
    const a = events(now.outputs);
    const b = events(waiting.outputs);
    expect(b.length).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      expect(b[i]!.event).toEqual(a[i]!.event);
      expect(b[i]!.seconds - a[i]!.seconds).toBeCloseTo(4, 9);
    }
  });

  it('schedules nothing before the song starts', () => {
    const { outputs } = run(later, ticks(0, 200));
    for (const s of outputs.flatMap((o) => o.steps)) expect(s.seconds).toBeGreaterThanOrEqual(5);
  });
});
