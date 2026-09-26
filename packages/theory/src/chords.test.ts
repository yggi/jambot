import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES, parseChordQuality, qualityOf, stack } from './chords.ts';
import { degree } from './degrees.ts';
import { even, isMaximallyEven, mod } from './even.ts';
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

/**
 * Composition: a k-of-m set read as degrees of an m-of-n set gives a k-of-n
 * set. Degree e of the inner set is placed at degree(outer, e), wrapped.
 */
const compose = (inner: readonly number[], outer: readonly number[], n: number) =>
  inner.map((e) => mod(degree(outer, e, n), n)).sort((a, b) => a - b);

describe('stack, as composition', () => {
  it('gives every triad and seventh of every diatonic mode as an even set of 7, composed with the mode', () => {
    for (const mode of modes(7, 12)) {
      for (const d of range(7)) {
        for (const size of [3, 4]) {
          const chord = stack(mode, d, size)
            .map((x) => mod(x + mode[d]!, 12))
            .sort((a, b) => a - b);
          const composed = range(7).map((r) => compose(even(size, 7, r), mode, 12).join());
          expect(composed, `${mode.join()} degree ${d}, ${size} notes`).toContain(chord.join());
        }
      }
    }
  });

  it('stops at the ninth: five stacked thirds are not even in 7', () => {
    expect(isMaximallyEven([0, 2, 4, 6], 7)).toBe(true);
    expect(isMaximallyEven([0, 1, 2, 4, 6], 7)).toBe(false); // 0 2 4 6 8, wrapped
  });

  it('does not keep evenness in general: 35 of the 165 compositions of even sets with n ≤ 12 are even', () => {
    let evenCount = 0;
    let total = 0;
    for (let n = 3; n <= 12; n++)
      for (let m = 2; m < n; m++)
        for (let k = 2; k < m; k++) {
          total++;
          if (isMaximallyEven(compose(even(k, m), even(m, n), n), n)) evenCount++;
        }
    expect([evenCount, total]).toEqual([35, 165]);
    // A triad of the Lydian set, even in 7, is not even in 12.
    expect(compose(even(3, 7), even(7, 12), 12)).toEqual([0, 6, 9]);
  });

  it('nests meter the same way: the backbeat is 2 of 4 beats, composed with 4 of 16 steps', () => {
    expect(compose(even(2, 4, 1), even(4, 16), 16)).toEqual([4, 12]);
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
