import { describe, expect, it } from 'vitest';
import { BAR_STEPS } from './events.ts';
import type { HeardNote } from './muse.ts';
import { EMPTY_BAR, phrasesOf, readHeard, readPhrase } from './phrase.ts';

/** Notes struck at these positions, each released at `end` or held. */
const heard = (positions: number[], end?: (p: number) => number | null): HeardNote[] =>
  positions.map((position) => ({
    note: 60,
    velocity: 100,
    source: 'a hand',
    position,
    end: end ? end(position) : null,
  }));
const positionsOf = (notes: HeardNote[]) => notes.map((n) => n.position);

describe('phrases', () => {
  it('end at an empty bar and not at a shorter rest', () => {
    const short = heard([0, 4, 4 + EMPTY_BAR - 1]);
    expect(phrasesOf(short)).toHaveLength(1);
    const empty = heard([0, 4, 4 + EMPTY_BAR]);
    expect(phrasesOf(empty).map(positionsOf)).toEqual([[0, 4], [4 + EMPTY_BAR]]);
  });

  it('are one at any silence shorter than a bar, whatever the notes in between', () => {
    for (let gap = 1; gap < EMPTY_BAR; gap++) expect(phrasesOf(heard([0, gap]))).toHaveLength(1);
    expect(phrasesOf(heard([0, EMPTY_BAR]))).toHaveLength(2);
  });

  it('count from a note’s release, so a held note keeps the phrase going', () => {
    const held = heard([0, 2 * BAR_STEPS], (p) => (p === 0 ? 2 * BAR_STEPS - 4 : null));
    expect(phrasesOf(held)).toHaveLength(1);
    expect(phrasesOf(heard([0, 2 * BAR_STEPS], (p) => (p === 0 ? 2 : null)))).toHaveLength(2);
  });

  it('are found in time whatever order the notes arrived in', () => {
    const shuffled = heard([40, 2, 0, 4, 42]);
    expect(phrasesOf(shuffled).map(positionsOf)).toEqual([
      [0, 2, 4],
      [40, 42],
    ]);
  });

  it('are none in nothing', () => {
    expect(phrasesOf([])).toEqual([]);
    expect(readHeard([])).toEqual([]);
  });
});

describe('reading a phrase', () => {
  it('leaves a phrase played exactly, each note held to the next, exactly as it was', () => {
    const at = [16, 18, 20, 24, 28, 30, 31];
    const exact = heard(at, (p) => (at[at.indexOf(p) + 1] ?? 32) as number);
    expect(readPhrase(exact)).toEqual(exact);
  });

  it('keeps a rest that is a rest, and only its length', () => {
    // A quarter note, then a quarter rest, then the rest of the bar legato.
    const at = [16, 24, 28, 30];
    const ends = new Map([
      [16, 20],
      [24, 28],
      [28, 30],
      [30, 32],
    ]);
    const exact = heard(at, (p) => ends.get(p)!);
    expect(readPhrase(exact)).toEqual(exact);
  });

  it('reads a release short of the next onset as articulation, not a rest, when the player does it throughout', () => {
    const at = [16, 20, 24, 28];
    const staccato = heard(at, (p) => p + 3);
    expect(readPhrase(staccato).map((n) => n.end)).toEqual([20, 24, 28, 32]);
    // Eighths held a step, the bar's last note aside, whose silence to the bar's end is a rest of its own.
    const eighths = heard([16, 18, 20, 22], (p) => p + 1);
    expect(
      readPhrase(eighths)
        .map((n) => n.end)
        ?.slice(0, 3),
    ).toEqual([18, 20, 22]);
  });

  it('does not make a rest of a release that is only loose', () => {
    // Releases and onsets a fraction of a step either side of the next onset.
    const at = [16.3, 19.8, 24.2, 27.7, 32.3];
    const ends = [19.5, 24.6, 27.5, 32.4, 35.7];
    const notes = at.map((position, i) => ({ ...heard([position])[0]!, end: ends[i]! }));
    const read = readPhrase(notes);
    expect(read.map((n) => n.position)).toEqual([16, 20, 24, 28, 32]);
    expect(read.map((n) => n.end)).toEqual([20, 24, 28, 32, 36]);
  });

  it('makes a rest of a gap that stands out from the rest, of the nearest plausible length', () => {
    // Legato but for a gap of 4.1 steps after the second note.
    const notes = [
      { ...heard([16])[0]!, end: 20 },
      { ...heard([20])[0]!, end: 23.9 },
      { ...heard([28])[0]!, end: 32 },
    ];
    expect(readPhrase(notes).map((n) => n.end)).toEqual([20, 24, 32]);
  });

  it('takes an odd gap for what it is from a tight hand, and for a plausible rest from a loose one', () => {
    // A gap of 4.7 steps after the second note: five, or a quarter?
    const tight = [
      { ...heard([16])[0]!, end: 20 },
      { ...heard([20])[0]!, end: 23.3 },
      { ...heard([28])[0]!, end: 32 },
    ];
    expect(readPhrase(tight).map((n) => n.end)).toEqual([20, 23, 32]);
    const loose = [
      { ...heard([16.3])[0]!, end: 19.8 },
      { ...heard([19.7])[0]!, end: 23.3 },
      { ...heard([28.3])[0]!, end: 31.7 },
      { ...heard([31.7])[0]!, end: 34.3 },
    ];
    expect(readPhrase(loose)[1]!.end).toBe(24);
  });

  it('gives a note whose release is unknown none', () => {
    expect(readPhrase(heard([16, 20, 24])).map((n) => n.end)).toEqual([null, null, null]);
  });

  it('puts an early first note on the bar it meant, not the one before', () => {
    // Struck 0.55 of a step before the bar, which rounds to the step before it; a loose hand round the rest.
    const notes = heard([15.45, 20.3, 23.7, 28.3, 31.7]);
    expect(positionsOf(readPhrase(notes))[0]).toBe(16);
    expect(Math.round(notes[0]!.position)).toBe(15);
  });

  it('takes a phrase that all came early as one, by its offset', () => {
    const early = heard([15.6, 19.6, 23.6, 27.6, 31.6]);
    expect(positionsOf(readPhrase(early))).toEqual([16, 20, 24, 28, 32]);
  });

  it('leaves a first note where it was when the hand is tight and it is really off the beat', () => {
    const tight = heard([18.02, 20, 24, 28.02, 32]);
    expect(readPhrase(tight)[0]!.position).toBe(18);
  });

  it('pulls a first note in only to the beat it is near, not to any beat', () => {
    const loose = [20.3, 23.7, 28.3, 31.7];
    expect(readPhrase(heard([17.6, ...loose]))[0]!.position).toBe(18);
    expect(readPhrase(heard([19.45, ...loose]))[0]!.position).toBe(20);
  });

  it('keeps pitch, velocity and source, and gives every release a step past its onset', () => {
    const notes = heard([0.1, 4.1], () => 0.15).map((n, i) => ({
      ...n,
      note: 60 + i,
      velocity: 90,
    }));
    const read = readPhrase(notes);
    expect(read.map((n) => [n.note, n.velocity, n.source])).toEqual([
      [60, 90, 'a hand'],
      [61, 90, 'a hand'],
    ]);
    read.forEach((n) => expect(n.end).toBeGreaterThan(n.position));
  });

  it('reads eighths struck 0.6 of a step off, either way, as eighths', () => {
    const late = heard([16.3, 18.6, 20.4, 22.6, 24.4, 26.6, 28.4]);
    expect(positionsOf(readPhrase(late))).toEqual([16, 18, 20, 22, 24, 26, 28]);
  });

  it('reads each phrase of a performance on its own offset', () => {
    const both = heard([15.7, 19.7, 23.7, 27.7, 16 * 5 + 0.3, 16 * 5 + 4.3, 16 * 5 + 8.3]);
    expect(positionsOf(readHeard(both))).toEqual([16, 20, 24, 28, 80, 84, 88]);
  });
});
