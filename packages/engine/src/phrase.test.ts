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
  it('leaves a phrase played exactly exactly as it was', () => {
    const exact = heard([16, 18, 20, 24, 28, 30, 31], (p) => p + 1);
    expect(readPhrase(exact)).toEqual(exact);
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

  it('reads each phrase of a performance on its own offset', () => {
    const both = heard([15.7, 19.7, 23.7, 27.7, 16 * 5 + 0.3, 16 * 5 + 4.3, 16 * 5 + 8.3]);
    expect(positionsOf(readHeard(both))).toEqual([16, 20, 24, 28, 80, 84, 88]);
  });
});
