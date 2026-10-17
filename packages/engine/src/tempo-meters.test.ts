import { METERS, type MeterName, beatsOf, gaps, meterOnSteps, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { clockOfTransport, transport, LOOKAHEAD, type TransportEnv } from './transport.ts';
import { INITIAL_STYLE, glideTo, holding, styleAt } from './style.ts';
import { rebeat, stepSeconds, tempoMap } from './tempo.ts';

const NAMES = Object.keys(METERS) as MeterName[];
const range = (n: number) => [...Array(n).keys()];

/** Tempos across the axis, a round one, a fraction and both ends. */
const TEMPOS = [60, 90, 108, 137.5, 180];

describe('bpm counts the meter’s beats (#367, cells decision 040)', () => {
  it('lasts beats × 60 / bpm a bar, its beats keeping their proportions (finite: every named meter, at five tempos) (T7)', () => {
    for (const name of NAMES) {
      const meter = METERS[name];
      const onSteps = meterOnSteps(meter).heights;
      const steps = stepsOf(meter);
      const shares = gaps(meter).map((g) => g / meter.cycle);
      for (const bpm of TEMPOS) {
        const map = tempoMap(holding({ ...INITIAL_STYLE, bpm }), { step: 0, seconds: 0 }, meter);
        const bar = map.played(steps);
        expect(Math.abs(bar - (beatsOf(meter) * 60) / bpm), `${name} at ${bpm}`).toBeLessThan(1e-9);
        const starts = [...onSteps, steps].map((step) => map.played(step));
        starts.slice(1).forEach((end, beat) => {
          const share = (end - starts[beat]!) / bar;
          expect(Math.abs(share - shares[beat]!), `${name} at ${bpm}, beat ${beat}`).toBeLessThan(
            1e-9,
          );
        });
      }
    }
  });

  it('is a 16th of a quarter at the bpm in 4/4, 3/4 and 5/4, and shorter in the meters whose beats are longer than a quarter', () => {
    for (const name of NAMES) {
      const meter = METERS[name];
      const quarterBeats = meter.heights.every(
        (h, i) => (meter.heights[i + 1] ?? meter.cycle) - h === 2,
      );
      if (quarterBeats) expect(stepSeconds(120, meter), name).toBe(stepSeconds(120));
      else expect(stepSeconds(120, meter), name).toBeLessThan(stepSeconds(120));
    }
    expect(stepSeconds(120)).toBe(0.125);
    // 6/8 at 120 is 120 dotted quarters: 180 quarters a minute.
    expect(stepSeconds(120, METERS['6/8'])).toBeCloseTo(stepSeconds(180), 12);
    expect(stepSeconds(90, METERS['7/8'])).toBeCloseTo(2 / 14, 12);
  });

  it('keeps every step where it was when the meter it counts changes: the number converts once (finite: every pair of named meters, through a glide) (T7)', () => {
    const gliding = glideTo(holding({ ...INITIAL_STYLE, bpm: 100 }), { bpm: 115 }, 8, 64);
    const anchor = { step: 0, seconds: 1 };
    for (const from of NAMES)
      for (const to of NAMES) {
        const before = tempoMap(gliding, anchor, METERS[from]);
        const after = tempoMap(rebeat(gliding, METERS[from], METERS[to]), anchor, METERS[to]);
        for (const step of range(97))
          expect(
            Math.abs(after.played(step) - before.played(step)),
            `${from} to ${to}, step ${step}`,
          ).toBeLessThan(1e-9);
      }
    // The number is what moves: 108 in 4/4 is 72 in 6/8 and 92.571… in 7/8.
    const synthPop = holding({ ...INITIAL_STYLE, bpm: 108 });
    expect(styleAt(rebeat(synthPop, METERS['4/4'], METERS['6/8']), 0).bpm).toBeCloseTo(72, 12);
    expect(styleAt(rebeat(synthPop, METERS['4/4'], METERS['7/8']), 0).bpm).toBeCloseTo(
      (108 * 6) / 7,
      12,
    );
    expect(rebeat(synthPop, METERS['4/4'], METERS['3/4'])).toEqual(synthPop);
  });

  it('keeps the number inside the axis: past its end the conversion stops there', () => {
    const fast = holding({ ...INITIAL_STYLE, bpm: 150 });
    expect(styleAt(rebeat(fast, METERS['6/8'], METERS['4/4']), 0).bpm).toBe(180);
    const slow = holding({ ...INITIAL_STYLE, bpm: 70 });
    expect(styleAt(rebeat(slow, METERS['4/4'], METERS['6/8']), 0).bpm).toBe(60);
  });

  it('lays a song in 6/8 counted in its beats: each bar 2 × 60 / bpm long, and the band writes the bpm it plays at', () => {
    const bpm = 96;
    const env: TransportEnv = {
      seed: 3,
      start: 1,
      track: holding({ ...INITIAL_STYLE, bpm }),
      wish: { tonic: null, mode: 'aeolian', melodic: null },
      meter: METERS['6/8'],
      tempoMeter: METERS['6/8'],
    };
    let carried = transport.initial;
    const starts = new Map<number, number>();
    const composed: number[] = [];
    for (let now = 0.9; now < 14; now += 0.05) {
      const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
      carried = next.carried;
      const clock = clockOfTransport(carried);
      for (const s of next.output.steps)
        if (clock.stepInBar(s.step) === 0) starts.set(clock.barAt(s.step), s.seconds);
      composed.push(...next.output.composed.map((b) => b.style.bpm));
    }
    expect(starts.size).toBeGreaterThan(8);
    for (const [bar, seconds] of starts)
      expect(Math.abs(seconds - (1 + (bar * 2 * 60) / bpm)), `bar ${bar}`).toBeLessThan(1e-9);
    expect(new Set(composed)).toEqual(new Set([bpm]));
  });
});
