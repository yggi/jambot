/**
 * The shared base against the language (#309, phase 1): Jambot depends on
 * yggi/cells, compiles a cells text and takes its events. The language is a
 * dev dependency here only; the band writes cells text and plays it through
 * the cells engine at the seam (phase 3, #63 step 5).
 */

import { describe, expect, it } from 'vitest';
import { planOf, windowAt } from '@yggi/cells';
import { bjorklund } from '@yggi/cells/engine/parser/generators';
import { even } from '@jambot/theory';

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

describe('Euclid: the language and the theory give the same sets', () => {
  // music-commons' Euclid contract: cells writes Strudel's Bjorklund form, Jambot `even`'s j·k mod n < k.
  // They are the same set for every pair, and differ by a rotation for 46 of the 120 pairs with k < n ≤ 16.
  const pairs = Array.from({ length: 15 }, (_, i) => i + 2).flatMap((n) =>
    Array.from({ length: n - 1 }, (_, i) => [i + 1, n] as const),
  );
  const onsets = (k: number, n: number) => bjorklund(k, n).flatMap((on, j) => (on ? [j] : []));
  const rotationTo = (k: number, n: number): number | undefined => {
    const target = even(k, n).heights.join();
    const from = onsets(k, n);
    return [...Array(n).keys()].find(
      (r) =>
        from
          .map((j) => (j - r + n) % n)
          .sort((a, b) => a - b)
          .join() === target,
    );
  };

  it.each(pairs)('%i of %i is one set, up to a rotation', (k, n) => {
    expect(rotationTo(k, n)).toBeDefined();
  });

  it('the rotation is not zero for 46 of the 120 pairs', () => {
    expect(pairs).toHaveLength(120);
    expect(pairs.filter(([k, n]) => rotationTo(k, n) !== 0)).toHaveLength(46);
  });
});
