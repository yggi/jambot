/**
 * The shared base against the language (#309, phase 1): Jambot depends on
 * yggi/cells, compiles a cells text and takes its events. The language is a
 * dev dependency here only; the band writes cells text and plays it through
 * the cells engine at the seam (phase 3, #63 step 5).
 * `even` and cells' Euclid relate by the hub's euclid contract, which
 * `packages/theory/src/contracts.test.ts` runs (#504).
 */

import { describe, expect, it } from 'vitest';
import { planOf, windowAt } from '@yggi/cells';

/** The MIDI note of a frequency, at A4 = 440 Hz. */
const midiOf = (freq: number): number => Math.round(69 + 12 * Math.log2(freq / 440));

const RIFF = `&bar scan(1 1 1 1) step=120bpm
&tune over=scale("C:minor:pentatonic") step=8n 0 2 4 2 [3 4] ~ 4 _
&lead sound=saw loop=C4 cutoff=1200
&mix [&tune * &lead]`;

describe('a cells text, compiled by the language Jambot depends on', () => {
  it('compiles with no diagnostics and plays the notes the text says', () => {
    const plan = planOf(RIFF);
    expect(plan.result.diagnostics).toEqual([]);
    // Eight steps of a quarter second (two per beat at 120 bpm): C F B♭ F, then G B♭ in one step, a rest, B♭ held two.
    const notes = windowAt(plan, 0, 2).events.map((e) => [e.at, e.dur, e.voice, midiOf(e.freq)]);
    expect(notes).toEqual([
      [0, 0.25, 'lead', 60],
      [0.25, 0.25, 'lead', 65],
      [0.5, 0.25, 'lead', 70],
      [0.75, 0.25, 'lead', 65],
      [1, 0.125, 'lead', 67],
      [1.125, 0.125, 'lead', 70],
      [1.5, 0.5, 'lead', 70],
    ]);
  });

  it('loops: every bar after the first plays the first again, shifted', () => {
    const plan = planOf(RIFF);
    expect(plan.end).toBe(Infinity);
    const first = windowAt(plan, 0, 2).events;
    for (const bar of [1, 2, 7]) {
      const again = windowAt(plan, 2 * bar, 2).events;
      expect(again.map((e) => [e.at - 2 * bar, e.dur, e.freq])).toEqual(
        first.map((e) => [e.at, e.dur, e.freq]),
      );
    }
  });
});
