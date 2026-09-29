import { describe, expect, it } from 'vitest';
import { BAR_STEPS } from './events.ts';
import { clicksOf, soundsAt } from './metronome.ts';
import { PRESETS, holding } from './style.ts';
import { stepSeconds } from './tempo.ts';
import { LOOKAHEAD, type ScheduledStep, type TransportEnv, transport } from './transport.ts';

/** The transport's own clock, a tick every 25 ms, run for `seconds` at a constant style. */
function play(preset: number, swing: number | null, seconds: number) {
  const style = { ...PRESETS[preset]!.style, entropy: 0.3, ...(swing === null ? {} : { swing }) };
  const env: TransportEnv = {
    seed: 11,
    start: 1,
    track: holding(style),
    wish: { tonic: null, mode: PRESETS[preset]!.mode },
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
  it('clicks one step in two, the eighths of the song’s 4/4 bar, downbeat first', () => {
    const { steps } = play(0, 0, 8);
    const clicks = clicksOf(steps);
    expect(clicks.length).toBe(steps.filter((s) => s.step % 2 === 0).length);
    expect(clicks.slice(0, 8).map((c) => c.weight)).toEqual([
      'downbeat',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
    ]);
    expect(clicks.slice(0, 8).map((c) => c.eighth)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(clicks.slice(0, 8).map((c) => c.pulse)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(
      clicks.filter((c) => c.weight === 'downbeat').every((c) => c.step % BAR_STEPS === 0),
    ).toBe(true);
  });

  it('sits on the band’s own grid when straight: a click at each step’s start', () => {
    const { steps } = play(0, 0, 4);
    for (const click of clicksOf(steps)) {
      const laid = steps.find((s) => s.step === click.step)!;
      expect(click.seconds).toBe(laid.seconds);
    }
  });

  it('plays at the band’s tempo: a pulse lasts a beat of the style', () => {
    const { steps, bpm } = play(0, 0, 4);
    const pulses = clicksOf(steps).filter((c) => c.weight !== 'subdivision');
    expect(pulses[1]!.seconds - pulses[0]!.seconds).toBeCloseTo(4 * stepSeconds(bpm), 9);
  });

  it('clicks where the band plays a note on the step, through the swing, in every swing', () => {
    for (const swing of [0, 0.25, 0.5, 0.75, 1]) {
      const { steps, events } = play(4, swing, 12);
      const clicks = new Map(clicksOf(steps).map((c) => [c.step, c.seconds]));
      const onEighths = events.filter((e) => clicks.has(e.step));
      expect(onEighths.length).toBeGreaterThan(20);
      for (const e of onEighths) expect(clicks.get(e.step)).toBeCloseTo(e.seconds, 6);
    }
  });

  it('swings the off eighths late and leaves the beats where they are', () => {
    const { steps } = play(4, 1, 6);
    const straight = play(4, 0, 6).steps;
    const swung = clicksOf(steps);
    const clicks = clicksOf(straight);
    swung.forEach((c, i) => {
      if (c.step % 4 === 0) expect(c.seconds).toBeCloseTo(clicks[i]!.seconds, 9);
      else expect(c.seconds).toBeGreaterThan(clicks[i]!.seconds);
    });
  });

  it('moves a step by the swing it was laid with, and not on a straight or a beat step', () => {
    const laid = { step: 6, seconds: 2, length: 0.1, swing: 1 };
    expect(soundsAt({ ...laid, swing: 0 })).toBe(2);
    expect(soundsAt(laid)).toBeGreaterThan(2);
    expect(soundsAt({ ...laid, step: 4 })).toBe(2);
  });

  it('clicks nothing where the transport laid no step: a stall’s steps are dropped, not played late', () => {
    const { steps } = play(0, 0, 6);
    const stalled = steps.filter((s) => s.step < 8 || s.step >= 24);
    const clicks = clicksOf(stalled);
    expect(clicks.some((c) => c.step >= 8 && c.step < 24)).toBe(false);
  });
});
