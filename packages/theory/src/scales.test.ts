import { describe, expect, it } from 'vitest';
import { even, isEven } from './even.ts';
import { type Helix, heightOf, shift } from './helix.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, mode } from './modes.ts';
import { SCALES, parseScale, parseScaleName } from './scales.ts';

const heightsOf = (name: string) => SCALES[name]!.helix.heights;

/** Mode d, shifted so that its degree 0 stands at 0. */
const fromZero = (helix: Helix, d: number) => shift(mode(helix, d), -heightOf(helix, d));

describe('named scales', () => {
  it('include the seven diatonic modes under their own names', () => {
    for (const name of DIATONIC_MODE_NAMES) expect(SCALES[name]!.helix).toEqual(diatonicMode(name));
  });

  it('take the even ones from the primitive, and all start on 0', () => {
    expect(heightsOf('major pentatonic')).toEqual([0, 2, 4, 7, 9]);
    expect(heightsOf('minor pentatonic')).toEqual([0, 3, 5, 7, 10]);
    expect(SCALES['whole tone']!.helix).toEqual(even(6, 12));
    expect(SCALES['chromatic']!.helix).toEqual(even(12, 12));
    expect(heightsOf('diminished')).toEqual([0, 2, 3, 5, 6, 8, 9, 11]);
    expect(heightsOf('blues')).toEqual([0, 3, 5, 6, 7, 10]);
    expect(heightsOf('harmonic minor')).toEqual([0, 2, 3, 5, 7, 8, 11]);
    expect(heightsOf('melodic minor')).toEqual([0, 2, 3, 5, 7, 9, 11]);
    expect(Object.keys(SCALES).filter((name) => isEven(SCALES[name]!.helix))).toEqual([
      ...DIATONIC_MODE_NAMES,
      'major pentatonic',
      'suspended pentatonic',
      'man gong',
      'ritsusen',
      'minor pentatonic',
      'whole tone',
      'chromatic',
      'diminished',
      'half whole diminished',
    ]);
    for (const [name, scale] of Object.entries(SCALES)) {
      expect(scale.helix.cycle, name).toBe(12);
      expect(scale.helix.heights[0], name).toBe(0);
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
  const modesOf = (name: string) =>
    SCALES[name]!.helix.heights.map((_, d) => fromZero(SCALES[name]!.helix, d));
  const named = (names: string[]) => names.map((name) => SCALES[name]!.helix);

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
    expect(modesOf('blues')[1]).toEqual(SCALES['major blues']!.helix);
    expect(modesOf('diminished')[1]).toEqual(SCALES['half whole diminished']!.helix);
  });

  it('name each set once', () => {
    const sets = Object.values(SCALES).map((scale) => scale.helix.heights.join());
    expect(new Set(sets).size).toBe(sets.length);
  });
});

describe('parseScale', () => {
  it('reads a scale and a number as that mode, called by its own name when it has one', () => {
    expect(parseScale('major 2')).toEqual({ name: 'dorian', helix: SCALES['dorian']!.helix });
    expect(parseScale('Harm minor 5')).toEqual({
      name: 'phrygian dominant',
      helix: SCALES['phrygian dominant']!.helix,
    });
    expect(parseScale('blues 1')).toEqual({ name: 'blues', helix: SCALES['blues']!.helix });
    expect(parseScale('blues 3')).toEqual({
      name: 'blues 3',
      helix: fromZero(SCALES['blues']!.helix, 2),
    });
    expect(parseScale('lydian')).toEqual({ name: 'lydian', helix: SCALES['lydian']!.helix });
  });

  it('reads a name before a number: "locrian 6" is locrian natural 6, not the sixth mode of locrian', () => {
    expect(parseScale('locrian 6')!.name).toBe('locrian natural 6');
    expect(parseScale('locrian 5')!.name).toBe('lydian'); // a number where no name is in the way
  });

  it('rejects a mode the scale does not have', () => {
    for (const text of ['blues 0', 'blues 7', 'chromatic 13', 'sparkly 2', '3'])
      expect(parseScale(text), text).toBeUndefined();
  });
});
