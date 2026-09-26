import { describe, expect, it } from 'vitest';
import { normalizeWords } from './words.ts';

describe('normalizeWords', () => {
  it('ignores case, hyphens, underscores, runs of spaces and the dot after an abbreviation', () => {
    expect(normalizeWords('  Whole-Tone ')).toBe('whole tone');
    expect(normalizeWords('harmonic_minor')).toBe('harmonic minor');
    expect(normalizeWords('four  on - the floor')).toBe('four on the floor');
    expect(normalizeWords('Minor pent.')).toBe('minor pentatonic');
  });

  it('reads ordinals as words', () => {
    expect(normalizeWords('major 3rd')).toBe('major third');
    expect(normalizeWords('2nd')).toBe('second');
    expect(normalizeWords('Dominant 7th')).toBe('dominant seventh');
    expect(normalizeWords('13th')).toBe('thirteenth');
    expect(normalizeWords('8th')).toBe('8th'); // an octave, and not a degree name
  });

  it('reads an accidental before a degree as its sign', () => {
    for (const text of ['mixolydian b6', 'mixolydian ♭6', 'mixolydian flat 6', 'Mixolydian-flat6'])
      expect(normalizeWords(text), text).toBe('mixolydian b6');
    for (const text of ['dorian #4', 'dorian ♯4', 'dorian sharp 4'])
      expect(normalizeWords(text), text).toBe('dorian #4');
    for (const text of ['locrian n6', 'locrian ♮6', 'locrian natural 6'])
      expect(normalizeWords(text), text).toBe('locrian n6');
    expect(normalizeWords('flat')).toBe('flat');
  });

  it('reads the common abbreviations as the words they stand for', () => {
    expect(normalizeWords('harm minor')).toBe('harmonic minor');
    expect(normalizeWords('mel minor')).toBe('melodic minor');
    expect(normalizeWords('phryg dom')).toBe('phrygian dominant');
    expect(normalizeWords('lydian aug')).toBe('lydian augmented');
    expect(normalizeWords('mixolyd b6')).toBe('mixolydian b6');
    expect(normalizeWords('Half-dim 7th')).toBe('half diminished seventh');
    expect(normalizeWords('MAJ')).toBe('major');
    expect(normalizeWords('min')).toBe('minor');
    expect(normalizeWords('sus')).toBe('suspended');
    expect(normalizeWords('alt')).toBe('altered');
    expect(normalizeWords('dimension')).toBe('dimension'); // whole words only
  });
});
