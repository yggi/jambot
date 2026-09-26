import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES, parseChordQuality, qualityOf } from './chords.ts';
import { even, isEven } from './even.ts';
import { type Helix, compose, positions, shift } from './helix.ts';
import { partial } from './intervals.ts';
import { DIATONIC_MODE_NAMES, diatonicMode } from './modes.ts';

const range = (n: number) => [...Array(n).keys()];

/** Every other degree of 7, `size` of them: stacked thirds. */
const thirds = (size: number): Helix => ({ cycle: 7, heights: range(size).map((i) => 2 * i) });

/** The chord on degree d of a key: stacked thirds, shifted to d and composed with the key. */
const chordOn = (key: Helix, d: number, size: number) => compose(shift(thirds(size), d), key);

/** A chord's heights above its root. */
const stackOf = (chord: Helix) => chord.heights.map((x) => x - chord.heights[0]!);

describe('chords, by composition', () => {
  it('stack thirds on every degree: the diatonic chords of C major', () => {
    const cMajor = diatonicMode('ionian');
    expect(range(7).map((d) => qualityOf(stackOf(chordOn(cMajor, d, 3))))).toEqual([
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ]);
    expect(range(7).map((d) => qualityOf(stackOf(chordOn(cMajor, d, 4))))).toEqual([
      'maj7',
      'm7',
      'm7',
      'maj7',
      '7',
      'm7',
      'm7b5',
    ]);
    expect(chordOn(cMajor, 4, 4).heights).toEqual([7, 11, 14, 17]); // V7, on G
  });

  it('give every diatonic mode the same chords: 3 major, 3 minor, 1 diminished triad', () => {
    for (const name of DIATONIC_MODE_NAMES) {
      const tally = (size: number) => {
        const counts: Record<string, number> = {};
        for (const d of range(7)) {
          const quality = qualityOf(stackOf(chordOn(diatonicMode(name), d, size)))!;
          counts[quality] = (counts[quality] ?? 0) + 1;
        }
        return counts;
      };
      expect(tally(3), name).toEqual({ major: 3, minor: 3, diminished: 1 });
      expect(tally(4), name).toEqual({ maj7: 2, m7: 3, '7': 1, m7b5: 1 });
    }
  });

  it('are even in 7 for three and four notes: every triad and seventh of every mode is even(3 or 4, 7) composed with it', () => {
    expect(isEven(thirds(3))).toBe(true);
    expect(isEven(thirds(4))).toBe(true);
    expect(positions(thirds(3))).toEqual(positions(even(3, 7, 4)));
    expect(thirds(4)).toEqual(even(4, 7));
  });

  it('stop at the ninth: five stacked thirds span more than a turn of 7, and are not even in it', () => {
    // So a ninth chord is a named stack, not a composition.
    expect(isEven({ cycle: 7, heights: [0, 1, 2, 4, 6] })).toBe(false); // 0 2 4 6 8, wrapped
  });

  it('split at the octave into a helix and the tones above it, and join back: every quality (#38, P6)', () => {
    // The tones below the octave rise within one turn of 12, so they are a
    // helix; every tone from the octave up comes after them. So a chord read
    // as a helix plus the tones above it loses nothing of its stack.
    const above: Record<string, number[]> = {};
    for (const [name, { stack }] of Object.entries(CHORD_QUALITIES)) {
      const below = stack.filter((x) => x < 12);
      const rest = stack.filter((x) => x >= 12);
      expect(
        below.every((x, i) => i === 0 || x > below[i - 1]!),
        name,
      ).toBe(true);
      expect(below.at(-1)! - below[0]!, name).toBeLessThan(12);
      expect([...below, ...rest], name).toEqual(stack);
      if (rest.length > 0) above[name] = rest;
    }
    expect(above).toEqual({
      '9': [14],
      maj9: [14],
      m9: [14],
      add9: [14],
      harmonics: [12, 19, 24, 28],
    });
  });
});

describe('chord qualities', () => {
  it('names each interval set once', () => {
    const sets = Object.values(CHORD_QUALITIES).map((q) => q.stack.join());
    expect(new Set(sets).size).toBe(sets.length);
  });

  it('read every symbol and every word back to their quality', () => {
    for (const [name, quality] of Object.entries(CHORD_QUALITIES)) {
      expect(qualityOf(quality.stack)).toBe(name);
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
    expect(CHORD_QUALITIES['harmonics']!.stack).toEqual([1, 2, 3, 4, 5].map(partial));
    expect(new Set(CHORD_QUALITIES['harmonics']!.stack.map((x) => x % 12))).toEqual(
      new Set(CHORD_QUALITIES['major']!.stack),
    );
  });
});
