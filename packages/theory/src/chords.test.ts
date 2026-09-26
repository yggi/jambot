import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES, parseChordQuality, qualityOf, stack } from './chords.ts';
import { partial } from './intervals.ts';
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

  it('read the classical symbols, where case says the triad and the seventh', () => {
    expect(parseChordQuality('Mm7')).toBe('7');
    expect(parseChordQuality('MM7')).toBe('maj7');
    expect(parseChordQuality('mm7')).toBe('m7');
    expect(parseChordQuality('mM7')).toBe('mMaj7');
  });

  it('read a symbol in another case when no symbol matches as written', () => {
    expect(parseChordQuality('Sus4')).toBe('sus4');
    expect(parseChordQuality('MAJ7')).toBe('maj7');
    expect(parseChordQuality('mmaj7')).toBe('mMaj7');
  });

  it('list every symbol whose case carries meaning in each of its cases', () => {
    const symbols = Object.values(CHORD_QUALITIES).flatMap((q) => q.symbols);
    const casings = (s: string): string[] =>
      s === ''
        ? ['']
        : casings(s.slice(1)).flatMap((rest) => [
            ...new Set([s[0]!.toLowerCase() + rest, s[0]!.toUpperCase() + rest]),
          ]);
    for (const symbol of symbols) {
      const twins = symbols.filter((other) => other.toLowerCase() === symbol.toLowerCase());
      if (twins.length > 1)
        for (const casing of casings(symbol))
          expect(parseChordQuality(casing), `${casing}, a case of ${twins.join(' ')}`).toBe(
            parseChordQuality(symbols.find((s) => s === casing) ?? '!'),
          );
    }
  });

  it('read abbreviated and ordinal words, and a trailing "chord"', () => {
    expect(parseChordQuality('Dim 7th')).toBe('dim7');
    expect(parseChordQuality('half-dim 7th')).toBe('m7b5');
    expect(parseChordQuality('dom 9th')).toBe('9');
    expect(parseChordQuality('major chord')).toBe('major');
    expect(parseChordQuality('chord')).toBeUndefined();
  });
});

describe('harmonics', () => {
  it('is the first five partials over the root: a major triad, voiced by the harmonic series', () => {
    expect(CHORD_QUALITIES['harmonics']!.intervals).toEqual([1, 2, 3, 4, 5].map(partial));
    expect(new Set(CHORD_QUALITIES['harmonics']!.intervals.map((x) => x % 12))).toEqual(
      new Set(CHORD_QUALITIES['major']!.intervals),
    );
  });
});
