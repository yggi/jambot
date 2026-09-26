import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES, parseChordQuality, qualityOf, stack } from './chords.ts';
import { modes } from './modes.ts';

const range = (n: number) => [...Array(n).keys()];

describe('stack', () => {
  it('stacks every other scale degree: the diatonic chords of C major', () => {
    const ionian = modes(7, 12)[1]!;
    expect(range(7).map((d) => qualityOf(stack(ionian, d, 3)))).toEqual([
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ]);
    expect(range(7).map((d) => qualityOf(stack(ionian, d, 4)))).toEqual([
      'maj7',
      'm7',
      'm7',
      'maj7',
      '7',
      'm7',
      'm7b5',
    ]);
    expect(stack(ionian, 4, 5)).toEqual([0, 4, 7, 10, 14]);
  });

  it('gives every diatonic mode the same chords: 3 major, 3 minor, 1 diminished triad', () => {
    for (const mode of modes(7, 12)) {
      const tally = (size: number) => {
        const counts: Record<string, number> = {};
        for (const d of range(7)) {
          const quality = qualityOf(stack(mode, d, size))!;
          counts[quality] = (counts[quality] ?? 0) + 1;
        }
        return counts;
      };
      expect(tally(3)).toEqual({ major: 3, minor: 3, diminished: 1 });
      expect(tally(4)).toEqual({ maj7: 2, m7: 3, '7': 1, m7b5: 1 });
    }
  });
});

describe('chord qualities', () => {
  it('names each interval set once', () => {
    const sets = Object.values(CHORD_QUALITIES).map((q) => q.intervals.join());
    expect(new Set(sets).size).toBe(sets.length);
  });

  it('read every symbol and every word back to their quality', () => {
    for (const [name, quality] of Object.entries(CHORD_QUALITIES)) {
      expect(qualityOf(quality.intervals)).toBe(name);
      for (const symbol of quality.symbols) expect(parseChordQuality(symbol), symbol).toBe(name);
      for (const word of quality.words) {
        expect(parseChordQuality(word), word).toBe(name);
        expect(parseChordQuality(word.toUpperCase()), word).toBe(name);
      }
    }
  });

  it('keep symbols case-sensitive where case carries meaning', () => {
    expect(parseChordQuality('m7')).toBe('m7');
    expect(parseChordQuality('M7')).toBe('maj7');
    expect(parseChordQuality('m')).toBe('minor');
    expect(parseChordQuality('M')).toBe('major');
    expect(parseChordQuality('mystery')).toBeUndefined();
  });
});
