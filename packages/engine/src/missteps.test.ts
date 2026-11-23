import { describe, expect, it } from 'vitest';
import type { Key } from './key.ts';
import { CORRECTION_REACH, CORRECTION_STEPS, onKey, withoutMissteps } from './missteps.ts';
import type { HeardNote } from './muse.ts';

const A_MINOR: Key = { tonic: 9, mode: 'aeolian' };
const C_MAJOR: Key = { tonic: 0, mode: 'ionian' };

const note = (n: number, position: number, end: number | null, source = 'Ada'): HeardNote => ({
  note: n,
  velocity: 100,
  source,
  position,
  end,
});

describe('on the key', () => {
  it('is every pitch class of the key’s scale, in every octave, over all twelve tonics of every mode', () => {
    const modes = [
      'ionian',
      'dorian',
      'phrygian',
      'lydian',
      'mixolydian',
      'aeolian',
      'locrian',
    ] as const;
    const steps = {
      ionian: 0,
      dorian: 2,
      phrygian: 4,
      lydian: 5,
      mixolydian: 7,
      aeolian: 9,
      locrian: 11,
    };
    const major = [0, 2, 4, 5, 7, 9, 11];
    for (const mode of modes)
      for (let tonic = 0; tonic < 12; tonic++) {
        // (a mode's scale is the major scale of the tonic it is a mode of)
        const home = (tonic - steps[mode] + 12) % 12;
        const scale = new Set(major.map((s) => (s + home) % 12));
        for (let n = 36; n < 96; n++)
          expect(onKey(n, { tonic, mode }), `${n} in ${tonic} ${mode}`).toBe(scale.has(n % 12));
      }
  });
});

describe('a corrected misstep (#747, #580 rung 5)', () => {
  it('drops a short note off the key followed at once by a neighbour on it', () => {
    // (G# in A minor, then A 40 ms later at 120 bpm: 0.32 of a step)
    const wrong = note(68, 4, 4.32);
    const right = note(69, 4.32, 6);
    expect(withoutMissteps([wrong, right], A_MINOR)).toEqual([right]);
    // (a semitone down or two up, either way, is a neighbour too)
    for (const [miss, meant] of [
      [70, 69],
      [66, 64],
      [61, 62],
    ] as const)
      expect(
        withoutMissteps([note(miss, 0, 0.3), note(meant, 0.3, 2)], A_MINOR).map((n) => n.note),
      ).toEqual([meant]);
  });

  it('keeps it where the correction comes later than CORRECTION_STEPS, or lies further than CORRECTION_REACH', () => {
    expect([CORRECTION_STEPS, CORRECTION_REACH]).toEqual([0.6, 2]);
    const late = [note(68, 4, 4.5), note(69, 4 + CORRECTION_STEPS + 0.01, 6)];
    expect(withoutMissteps(late, A_MINOR)).toEqual(late);
    const far = [note(68, 4, 4.2), note(71, 4.2, 6)];
    expect(withoutMissteps(far, A_MINOR)).toEqual(far);
  });

  it('keeps a chromatic passing note a tight hand plays a sixteenth before its neighbour', () => {
    // (G A A# B in A minor, sixteenths 10 ms off: the A# comes a step before the B)
    const run = [note(67, 0, 1), note(69, 1.05, 2), note(70, 1.98, 3), note(71, 3.04, 4)];
    expect(withoutMissteps(run, A_MINOR)).toEqual(run);
  });

  it('keeps a note on the key whatever follows it, and one off the key followed by another off it', () => {
    const onIt = [note(69, 0, 0.3), note(70, 0.3, 2)];
    expect(withoutMissteps(onIt, A_MINOR)).toEqual(onIt);
    const both = [note(68, 0, 0.3), note(70, 0.3, 2)];
    expect(withoutMissteps(both, A_MINOR)).toEqual(both);
  });

  it('keeps one held longer than CORRECTION_STEPS, a note meant, not slipped', () => {
    const held = [note(68, 4, 5), note(69, 4.3, 6)];
    expect(withoutMissteps(held, A_MINOR)).toEqual(held);
  });

  it('reads one still held as a slip where its correction comes', () => {
    const live = [note(68, 4, null), note(69, 4.3, null)];
    expect(withoutMissteps(live, A_MINOR)).toEqual([live[1]]);
  });

  it('corrects a source by its own notes only: another player’s note is no correction', () => {
    const two = [note(68, 4, 4.3, 'Ada'), note(69, 4.3, 6, 'Bo')];
    expect(withoutMissteps(two, A_MINOR)).toEqual(two);
  });

  it('reads the key it is given: an F# before a G is a slip in C major, and a note meant in G major', () => {
    const slip = [note(66, 0, 0.3), note(67, 0.3, 2)];
    expect(withoutMissteps(slip, C_MAJOR).map((n) => n.note)).toEqual([67]);
    expect(withoutMissteps(slip, { tonic: 7, mode: 'ionian' })).toEqual(slip);
  });

  it('keeps every note in the order heard, the same objects', () => {
    const heard = [note(60, 0, 1), note(68, 1, 1.2), note(69, 1.2, 2), note(72, 2, 3)];
    const kept = withoutMissteps(heard, A_MINOR);
    expect(kept).toEqual([heard[0], heard[2], heard[3]]);
    expect(kept[1]).toBe(heard[2]);
  });
});
