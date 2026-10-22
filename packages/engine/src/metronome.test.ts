import { describe, expect, it } from 'vitest';
import { METERS, type Meter } from '@jambot/theory';
import { BAR_STEPS, type MeterChange, clockOf } from './events.ts';
import { SUBDIVISIONS, clicksOf, soundsAt } from './metronome.ts';
import { presetSwing } from './repository.ts';
import { PRESETS, holding } from './style.ts';
import { type MeterSwing, STRAIGHT, holdingSwing } from './swing.ts';

/** Full triplet swing on the 8ths, Swing jazz's. */
const TRIPLET: MeterSwing = { level: '8n', share: 2 / 3 };
import { stepSeconds } from './tempo.ts';
import { LOOKAHEAD, type ScheduledStep, type TransportEnv, transport } from './transport.ts';

/** The transport's own clock, a tick every 25 ms, run for `seconds` at a constant style. */
function play(preset: number, swing: MeterSwing | null, seconds: number) {
  const style = { ...PRESETS[preset]!.style, entropy: 0.3 };
  const env: TransportEnv = {
    seed: 11,
    start: 1,
    track: holding(style),
    swing: holdingSwing(swing ?? presetSwing(PRESETS[preset]!)!),
    wish: { tonic: null, mode: PRESETS[preset]!.mode, melodic: null },
  };
  let carried = transport.initial;
  const steps: ScheduledStep[] = [];
  const events: { step: number; seconds: number; part: string }[] = [];
  for (let now = 0.9; now < 1 + seconds; now += 0.025) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried;
    steps.push(...next.output.steps);
    for (const e of next.output.events)
      events.push({
        step: e.bar * BAR_STEPS + e.event.step,
        seconds: e.seconds,
        part: e.event.part,
      });
  }
  return { steps, events, bpm: style.bpm };
}

describe('the metronome', () => {
  it('clicks the pulses of the song’s 4/4 bar, one step in four, downbeat first, and not the “and”', () => {
    const { steps } = play(0, STRAIGHT, 8);
    const clicks = clicksOf(steps);
    expect(clicks.length).toBe(steps.filter((s) => s.step % 4 === 0).length);
    expect(clicks.slice(0, 4).map((c) => c.weight)).toEqual([
      'downbeat',
      'pulse',
      'pulse',
      'pulse',
    ]);
    expect(clicks.slice(0, 8).map((c) => c.eighth)).toEqual([0, 2, 4, 6, 0, 2, 4, 6]);
    expect(clicks.slice(0, 8).map((c) => c.pulse)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
    expect(clicks.every((c) => c.weight !== 'subdivision')).toBe(true);
    expect(
      clicks.filter((c) => c.weight === 'downbeat').every((c) => c.step % BAR_STEPS === 0),
    ).toBe(true);
  });

  it('adds the eighths between the pulses, or the sixteenths too, where asked', () => {
    const { steps } = play(0, STRAIGHT, 8);
    const eighths = clicksOf(steps, undefined, 'eighths');
    expect(eighths.length).toBe(steps.filter((s) => s.step % 2 === 0).length);
    expect(eighths.slice(0, 8).map((c) => c.weight)).toEqual([
      'downbeat',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
    ]);
    expect(eighths.slice(0, 8).map((c) => c.pulse)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    const sixteenths = clicksOf(steps, undefined, 'sixteenths');
    expect(sixteenths.length).toBe(steps.length);
    expect(sixteenths.slice(0, 4).map((c) => c.weight)).toEqual([
      'downbeat',
      'subdivision',
      'subdivision',
      'subdivision',
    ]);
  });

  it('keeps the pulses’ clicks the same whatever it adds between them (finite: every subdivision)', () => {
    const { steps } = play(4, { level: '8n', share: 0.6 }, 6);
    const pulses = clicksOf(steps).map((c) => [c.step, c.seconds, c.weight]);
    for (const subdivision of SUBDIVISIONS)
      expect(
        clicksOf(steps, undefined, subdivision)
          .filter((c) => c.weight !== 'subdivision')
          .map((c) => [c.step, c.seconds, c.weight]),
      ).toEqual(pulses);
  });

  it('sits on the band’s own grid when straight: a click at each step’s start', () => {
    const { steps } = play(0, STRAIGHT, 4);
    for (const click of clicksOf(steps)) {
      const laid = steps.find((s) => s.step === click.step)!;
      expect(click.seconds).toBe(laid.seconds);
    }
  });

  it('plays at the band’s tempo: a pulse lasts a beat of the style', () => {
    const { steps, bpm } = play(0, STRAIGHT, 4);
    const pulses = clicksOf(steps);
    expect(pulses[1]!.seconds - pulses[0]!.seconds).toBeCloseTo(4 * stepSeconds(bpm), 9);
  });

  it('clicks where the band plays a note on the step, through the swing, in every swing', () => {
    for (const swing of [
      STRAIGHT,
      { level: '16n', share: 0.6 },
      { level: '16n', share: 2 / 3 },
      { level: '8n', share: 0.6 },
      TRIPLET,
    ] as const) {
      const { steps, events } = play(4, swing, 12);
      const clicks = new Map(clicksOf(steps, undefined, 'eighths').map((c) => [c.step, c.seconds]));
      const onEighths = events.filter((e) => clicks.has(e.step));
      expect(onEighths.length).toBeGreaterThan(20);
      for (const e of onEighths) expect(clicks.get(e.step)).toBeCloseTo(e.seconds, 6);
    }
  });

  it('swings the off eighths late and leaves the beats where they are', () => {
    const { steps } = play(4, TRIPLET, 6);
    const straight = play(4, STRAIGHT, 6).steps;
    const swung = clicksOf(steps, undefined, 'eighths');
    const clicks = clicksOf(straight, undefined, 'eighths');
    swung.forEach((c, i) => {
      if (c.step % 4 === 0) expect(c.seconds).toBeCloseTo(clicks[i]!.seconds, 9);
      else expect(c.seconds).toBeGreaterThan(clicks[i]!.seconds);
    });
  });

  it('moves a step by the swing it was laid with, and not on a straight or a beat step', () => {
    const laid = {
      step: 6,
      seconds: 2,
      length: 0.1,
      swing: TRIPLET,
      pulse: { start: 4, length: 4 },
    };
    expect(soundsAt({ ...laid, swing: STRAIGHT })).toBe(2);
    expect(soundsAt(laid)).toBeGreaterThan(2);
    expect(soundsAt({ ...laid, step: 4 })).toBe(2);
  });

  it('clicks nothing where the transport laid no step: a stall’s steps are dropped, not played late', () => {
    const { steps } = play(0, STRAIGHT, 6);
    const stalled = steps.filter((s) => s.step < 8 || s.step >= 24);
    const clicks = clicksOf(stalled);
    expect(clicks.some((c) => c.step >= 8 && c.step < 24)).toBe(false);
  });

  it('moves a step by the swing over its own pulse: a step of a pulse of two swings, one of three does not', () => {
    const laid = { seconds: 2, length: 0.1, swing: TRIPLET };
    expect(soundsAt({ ...laid, step: 8, pulse: { start: 6, length: 4 } })).toBeGreaterThan(2);
    expect(soundsAt({ ...laid, step: 8, pulse: { start: 6, length: 6 } })).toBe(2);
  });
});

/** The transport asked for `meter` from the start, run for `bars` bars of it. */
function inMeter(meter: Meter, swing: MeterSwing, bars: number) {
  const style = { ...PRESETS[4]!.style, entropy: 0.3, bpm: 120 };
  const env: TransportEnv = {
    seed: 11,
    start: 1,
    track: holding(style),
    swing: holdingSwing(swing),
    wish: { tonic: null, mode: PRESETS[4]!.mode, melodic: null },
    meter,
  };
  let carried = transport.initial;
  const steps: ScheduledStep[] = [];
  for (let now = 0.9; now < 1 + bars * 2.5; now += 0.025) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried;
    steps.push(...next.output.steps);
  }
  const changes: readonly MeterChange[] = carried!.meters;
  return { steps, clock: clockOf(changes) };
}

describe('the metronome on a song’s own clock', () => {
  const names = ['3/4', '4/4', '5/8', '6/8', '7/8', '12/8'] as const;

  it('clicks each pulse of the bar and only those, the downbeat first, in every named meter (finite: the meters the transport can be asked for)', () => {
    for (const name of names) {
      const meter = METERS[name];
      const { steps, clock } = inMeter(meter, STRAIGHT, 6);
      const whole = steps.filter((s) => clock.barAt(s.step) < 4 && clock.barAt(s.step) >= 1);
      const clicks = clicksOf(whole, clock);
      expect([name, clicks.length]).toEqual([name, 3 * meter.heights.length]);
      for (const click of clicks) {
        expect([name, clock.onBeat(click.step)]).toEqual([name, true]);
        expect([name, click.weight === 'downbeat']).toEqual([
          name,
          clock.stepInBar(click.step) === 0,
        ]);
      }
      const bar = clicks.filter((c) => clock.barAt(c.step) === 1);
      expect([name, bar.map((c) => c.pulse)]).toEqual([name, meter.heights.map((_, i) => i)]);
      expect([name, bar.map((c) => c.pulses)]).toEqual([
        name,
        meter.heights.map(() => meter.heights.length),
      ]);
    }
  });

  it('puts a click on the transport’s own pulse starts, through a swing that never moves one (finite: every meter, three swings)', () => {
    for (const name of names)
      for (const swing of [STRAIGHT, { level: '16n', share: 2 / 3 } as const, TRIPLET]) {
        const { steps, clock } = inMeter(METERS[name], swing, 4);
        const laid = new Map(steps.map((s) => [s.step, s]));
        for (const click of clicksOf(steps, clock))
          expect([name, swing, click.seconds]).toEqual([
            name,
            swing,
            laid.get(click.step)!.seconds,
          ]);
      }
  });
});

describe('swing over a meter, heard in the click', () => {
  it('swings the eighths of a pulse of two, and leaves those of a pulse of three straight (T11, T16)', () => {
    const { steps, clock } = inMeter(METERS['7/8'], TRIPLET, 4);
    const straight = inMeter(METERS['7/8'], STRAIGHT, 4).steps;
    const swung = clicksOf(steps, clock, 'eighths');
    const flat = clicksOf(straight, clock, 'eighths');
    const bar = swung.filter((c) => clock.barAt(c.step) === 2);
    const flatBar = flat.filter((c) => clock.barAt(c.step) === 2);
    // 7/8 is 3+2+2: the eighths at 1 and 2 are the first pulse's, which plays straight at the 8th level.
    expect(bar.map((c) => c.eighth)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const seconds = (clicks: typeof bar, eighth: number) =>
      clicks.find((c) => c.eighth === eighth)!.seconds;
    for (const eighth of [1, 2])
      expect(seconds(bar, eighth)).toBeCloseTo(seconds(flatBar, eighth), 9);
    for (const eighth of [4, 6])
      expect(seconds(bar, eighth)).toBeGreaterThan(seconds(flatBar, eighth));
  });
});
