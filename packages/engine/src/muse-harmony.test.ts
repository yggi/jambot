import { METERS, type MeterName } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { slotStepOn } from './chords.ts';
import { SONG_CLOCK } from './events.ts';
import type { Key } from './key.ts';
import type { HeardNote } from './muse.ts';
import {
  PROGRESSION_FEWEST,
  chordsOf,
  distilledProgression,
  heardHarmony,
  sectionHarmony,
} from './muse-harmony.ts';

const A_MINOR: Key = { tonic: 9, mode: 'aeolian' };
const C_MAJOR: Key = { tonic: 0, mode: 'ionian' };
const FOUR = METERS['4/4'];
const at = (step: number, notes: readonly number[]) => notes.map((note) => ({ step, note }));

describe('the Muse’s ear for chords (#425)', () => {
  it('reads each diatonic triad of a key, struck on one step, as its degree, in every voicing', () => {
    for (const key of [A_MINOR, C_MAJOR])
      for (let degree = 0; degree < 7; degree++) {
        // (the key's triad on the degree, root position and its two inversions, an octave apart)
        const scale = key.mode === 'ionian' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
        const pc = (d: number) => 48 + key.tonic + scale[d % 7]! + 12 * Math.floor(d / 7);
        const triad = [pc(degree), pc(degree + 2), pc(degree + 4)];
        for (const voicing of [
          triad,
          [triad[1]!, triad[2]!, triad[0]! + 12],
          [triad[2]!, triad[0]! + 12, triad[1]! + 12],
        ])
          expect(chordsOf(at(0, voicing), FOUR, key), `${key.mode} ${degree} ${voicing}`).toEqual([
            { step: 0, degree },
          ]);
      }
  });

  it('reads a second chord on the bar’s half, in every named meter, and the first struck in a half as its chord', () => {
    const am = [57, 60, 64];
    const f = [53, 57, 60];
    for (const name of Object.keys(METERS) as MeterName[]) {
      const meter = METERS[name];
      const half = slotStepOn(meter, 8);
      expect(chordsOf([...at(0, am), ...at(half, f)], meter, A_MINOR), name).toEqual([
        { step: 0, degree: 0 },
        { step: 8, degree: 5 },
      ]);
      expect(chordsOf([...at(0, am), ...at(half - 1, f)], meter, A_MINOR), name).toEqual([
        { step: 0, degree: 0 },
      ]);
    }
    expect(chordsOf([...at(0, am), ...at(8, f)], FOUR, A_MINOR)).toEqual([
      { step: 0, degree: 0 },
      { step: 8, degree: 5 },
    ]);
    expect(chordsOf([...at(0, am), ...at(8, am)], FOUR, A_MINOR)).toEqual([{ step: 0, degree: 0 }]);
  });

  it('reads nothing of a bar with no chord in its first half, a root off the key, or fewer than three pitch classes on a step', () => {
    expect(chordsOf(at(8, [57, 60, 64]), FOUR, A_MINOR)).toBeNull();
    // (B♭ major: its root is no degree of A minor)
    expect(chordsOf(at(0, [58, 62, 65]), FOUR, A_MINOR)).toBeNull();
    expect(chordsOf([...at(0, [57, 60]), ...at(2, [64])], FOUR, A_MINOR)).toBeNull();
    expect(chordsOf([], FOUR, A_MINOR)).toBeNull();
  });

  it('distils eight bars, a bar not read holding the chord before, from its first bar read and half of them', () => {
    const bar = (degree: number) => [{ step: 0, degree }];
    const full = [0, 5, 2, 6, 0, 5, 2, 6].map(bar);
    expect(distilledProgression(full)).toEqual(
      [0, 5, 2, 6, 0, 5, 2, 6].map((degree, b) => ({ step: b * 16, degree })),
    );
    const sparse = [bar(0), null, bar(3), null, bar(4), null, bar(0), null];
    expect(distilledProgression(sparse)).toEqual(
      [0, 0, 3, 3, 4, 4, 0, 0].map((degree, b) => ({ step: b * 16, degree })),
    );
    expect(PROGRESSION_FEWEST).toBe(4);
    expect(distilledProgression([bar(0), null, bar(3), null, bar(4), null, null, null])).toBeNull();
    expect(distilledProgression([null, ...full.slice(1)])).toBeNull();
    expect(distilledProgression(full.slice(1))).toBeNull();
  });

  it('hears each source’s chords in a bar, leaving out a source heard as a bass there, and gathers a section’s bars by source', () => {
    const note = (source: string, step: number, n: number): HeardNote => ({
      note: n,
      velocity: 90,
      source,
      position: 16 + step,
      end: 16 + step + 8,
    });
    const notes = [
      ...[57, 60, 64].map((n) => note('Ada', 0, n)),
      ...[45, 48, 52].map((n) => note('Bo', 0, n)),
      note('Cy', 0, 69),
    ];
    const heard = heardHarmony(notes, 1, A_MINOR, FOUR, SONG_CLOCK, new Set(['Bo']));
    expect(heard).toEqual([{ source: 'Ada', bar: 1, slots: [{ step: 0, degree: 0 }] }]);
    expect(sectionHarmony(heard, 0)).toEqual([
      { source: 'Ada', bars: [null, [{ step: 0, degree: 0 }], null, null, null, null, null, null] },
    ]);
    expect(sectionHarmony(heard, 8)).toEqual([]);
  });
});
