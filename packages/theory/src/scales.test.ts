import { describe, expect, it } from 'vitest';
import { even, isMaximallyEven } from './even.ts';
import { DIATONIC_MODE_NAMES, modes, rotate } from './modes.ts';
import { SCALES, parseScale, parseScaleName } from './scales.ts';

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
    expect(parseScaleName('octatonic')).toBe('half whole diminished');
    expect(parseScaleName('Major scale')).toBe('ionian');
    expect(parseScaleName('harmonic_minor')).toBe('harmonic minor');
    expect(parseScaleName('pentatonic')).toBe('major pentatonic');
    expect(parseScaleName('blues scale')).toBe('blues');
    expect(parseScaleName('scale')).toBeUndefined();
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

describe('modes of the other scales', () => {
  const modesOf = (name: string) => SCALES[name]!.set.map((_, d) => rotate(SCALES[name]!.set, d));
  const named = (names: string[]) => names.map((name) => SCALES[name]!.set);

  it('are the rotations of harmonic minor, melodic minor, the pentatonic and the octatonic', () => {
    expect(modesOf('harmonic minor')).toEqual(
      named([
        'harmonic minor',
        'locrian natural 6',
        'ionian #5',
        'dorian #4',
        'phrygian dominant',
        'lydian #2',
        'ultralocrian',
      ]),
    );
    expect(modesOf('melodic minor')).toEqual(
      named([
        'melodic minor',
        'dorian b2',
        'lydian augmented',
        'lydian dominant',
        'mixolydian b6',
        'locrian natural 2',
        'altered',
      ]),
    );
    expect(modesOf('major pentatonic')).toEqual(
      named([
        'major pentatonic',
        'suspended pentatonic',
        'man gong',
        'ritsusen',
        'minor pentatonic',
      ]),
    );
    expect(modesOf('blues')[1]).toEqual(SCALES['major blues']!.set);
    expect(modesOf('diminished')[1]).toEqual(SCALES['half whole diminished']!.set);
  });

  it('name each set once', () => {
    const sets = Object.values(SCALES).map((scale) => scale.set.join());
    expect(new Set(sets).size).toBe(sets.length);
  });
});

describe('parseScale', () => {
  it('reads a scale and a number as that mode, called by its own name when it has one', () => {
    expect(parseScale('major 2')).toEqual({ name: 'dorian', set: SCALES['dorian']!.set });
    expect(parseScale('Harm minor 5')).toEqual({
      name: 'phrygian dominant',
      set: SCALES['phrygian dominant']!.set,
    });
    expect(parseScale('blues 1')).toEqual({ name: 'blues', set: SCALES['blues']!.set });
    expect(parseScale('blues 3')).toEqual({
      name: 'blues 3',
      set: rotate(SCALES['blues']!.set, 2),
    });
    expect(parseScale('lydian')).toEqual({ name: 'lydian', set: SCALES['lydian']!.set });
  });

  it('rejects a mode the scale does not have', () => {
    for (const text of ['blues 0', 'blues 7', 'chromatic 13', 'sparkly 2', '3'])
      expect(parseScale(text), text).toBeUndefined();
  });
});
