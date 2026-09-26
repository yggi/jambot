import { describe, expect, it } from 'vitest';
import { even, isMaximallyEven } from './even.ts';
import { DIATONIC_MODE_NAMES, modes } from './modes.ts';
import { SCALES, parseScaleName } from './scales.ts';

describe('named scales', () => {
  it('include the seven diatonic modes under their own names', () => {
    DIATONIC_MODE_NAMES.forEach((name, b) => expect(SCALES[name]!.set).toEqual(modes(7, 12)[b]));
  });

  it('take the even ones from the primitive, and say which ones are not even', () => {
    expect(SCALES['major pentatonic']!.set).toEqual([0, 2, 4, 7, 9]);
    expect(SCALES['minor pentatonic']!.set).toEqual([0, 3, 5, 7, 10]);
    expect(SCALES['whole tone']!.set).toEqual(even(6, 12));
    expect(SCALES['chromatic']!.set).toEqual(even(12, 12));
    expect(SCALES['diminished']!.set).toEqual([0, 2, 3, 5, 6, 8, 9, 11]);
    expect(SCALES['blues']!.set).toEqual([0, 3, 5, 6, 7, 10]);
    expect(SCALES['harmonic minor']!.set).toEqual([0, 2, 3, 5, 7, 8, 11]);
    expect(SCALES['melodic minor']!.set).toEqual([0, 2, 3, 5, 7, 9, 11]);
    for (const [name, scale] of Object.entries(SCALES)) {
      expect(isMaximallyEven(scale.set, 12), name).toBe(scale.even);
      expect(scale.set[0], name).toBe(0);
    }
  });

  it('read names and aliases, in any case and with - or space', () => {
    expect(parseScaleName('major')).toBe('ionian');
    expect(parseScaleName('Natural Minor')).toBe('aeolian');
    expect(parseScaleName('minor')).toBe('aeolian');
    expect(parseScaleName('whole-tone')).toBe('whole tone');
    expect(parseScaleName('octatonic')).toBe('diminished');
    expect(parseScaleName('pentatonic')).toBe('major pentatonic');
    expect(parseScaleName('blues scale')).toBe('blues');
    expect(parseScaleName('sparkly')).toBeUndefined();
  });

  it('give every alias exactly one scale', () => {
    const seen = new Map<string, string>();
    for (const [name, scale] of Object.entries(SCALES)) {
      for (const alias of [name, ...scale.aliases]) {
        expect(seen.get(alias), alias).toBeUndefined();
        seen.set(alias, name);
      }
    }
  });
});
