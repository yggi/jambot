import { describe, expect, it } from 'vitest';
import { even } from './even.ts';
import { type Reading, type ReadingKind, read } from './read.ts';

/**
 * Every theory name the sister projects use, with what they mean by it, copied
 * from their source. Each must resolve here to the same thing: the same set
 * for chords and scales (compared as pitch classes, because quintenzirkel folds
 * its ninth into the octave), a size that includes theirs for intervals.
 *
 * Sources, read at:
 * - play-aeiou 29d28ce: `CHORD_TYPES` (notes/chords.py); `SCALES` and the mode
 *   names `MODE_NAMES` builds from `_MODE_NAMES` (core/harmony.py);
 * - lib-aeiou 856fb3c: `SCALES` (aeiou_lib/harmony.py);
 * - quintenzirkel 4b507f0: `FIGURES` (src/0-base/theory/circle.js), and the
 *   rhythms its Euclid comment names (src/3-movement/instrument.js).
 *
 * Names with no reading on purpose: play-aeiou's chord type `off` (no chord),
 * and its voicings, strum directions and arp patterns, which are ways to play
 * a chord rather than names in the theory. `dia` needs a scale and is tested in
 * read.test.ts.
 */

const PLAY_AEIOU_CHORD_TYPES: [string, number[]][] = [
  ['maj', [0, 4, 7]],
  ['min', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['sus4', [0, 5, 7]],
  ['sus2', [0, 2, 7]],
  ['5', [0, 7]],
  ['dim', [0, 3, 6]],
  ['aug', [0, 4, 8]],
  ['m7b5', [0, 3, 6, 10]],
  ['dim7', [0, 3, 6, 9]],
  ['6', [0, 4, 7, 9]],
  ['9', [0, 4, 7, 10, 14]],
  ['maj9', [0, 4, 7, 11, 14]],
  ['m9', [0, 3, 7, 10, 14]],
];

/** (short, name, set): the Scale knob. */
const PLAY_AEIOU_SCALES: [string, string, number[]][] = [
  ['CHR', 'chromatic', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
  ['MAJ', 'major', [0, 2, 4, 5, 7, 9, 11]],
  ['MIN', 'minor', [0, 2, 3, 5, 7, 8, 10]],
  ['PENT', 'pentatonic', [0, 2, 4, 7, 9]],
  ['MPEN', 'minor pent', [0, 3, 5, 7, 10]],
  ['BLUE', 'blues', [0, 3, 5, 6, 7, 10]],
  ['HMIN', 'harm minor', [0, 2, 3, 5, 7, 8, 11]],
  ['MMIN', 'mel minor', [0, 2, 3, 5, 7, 9, 11]],
  ['WTON', 'whole tone', [0, 2, 4, 6, 8, 10]],
  ['DIM', 'diminished', [0, 2, 3, 5, 6, 8, 9, 11]],
];

/**
 * What the Mode knob says for each mode of each scale, as `MODE_NAMES` builds
 * it: mode k is the scale re-rooted on its k-th note, called by the first
 * named set it lands on, or by the scale's name and k + 1 when none.
 */
const PLAY_AEIOU_MODES: Record<string, [string, string][]> = {
  chromatic: [['chromatic', 'CHR']],
  major: [
    ['ionian', 'ION'],
    ['dorian', 'DOR'],
    ['phrygian', 'PHR'],
    ['lydian', 'LYD'],
    ['mixolydian', 'MIX'],
    ['aeolian', 'AEO'],
    ['locrian', 'LOC'],
  ],
  pentatonic: [
    ['pentatonic', 'PENT'],
    ['suspended', 'SUS'],
    ['man gong', 'MGNG'],
    ['ritsusen', 'RITS'],
    ['minor pent', 'MPEN'],
  ],
  blues: [
    ['blues', 'BLUE'],
    ['major blues', 'MBLU'],
    ['blues 3', 'BLU3'],
    ['blues 4', 'BLU4'],
    ['blues 5', 'BLU5'],
    ['blues 6', 'BLU6'],
  ],
  'harm minor': [
    ['harm minor', 'HMIN'],
    ['locrian n6', 'LOC6'],
    ['ionian #5', 'ION5'],
    ['dorian #4', 'DOR4'],
    ['phryg dom', 'PDOM'],
    ['lydian #2', 'LYD2'],
    ['ultralocrian', 'ULOC'],
  ],
  'mel minor': [
    ['mel minor', 'MMIN'],
    ['dorian b2', 'DOR2'],
    ['lydian aug', 'LYD+'],
    ['lydian dom', 'LDOM'],
    ['mixolyd b6', 'MIX6'],
    ['locrian n2', 'LOC2'],
    ['altered', 'ALT'],
  ],
  'whole tone': [['whole tone', 'WTON']],
  diminished: [
    ['diminished', 'DIM'],
    ['half-whole', 'HWD'],
  ],
};

const LIB_AEIOU_SCALES: [string, number[]][] = [
  ['major', [0, 2, 4, 5, 7, 9, 11]],
  ['minor', [0, 2, 3, 5, 7, 8, 10]],
  ['ionian', [0, 2, 4, 5, 7, 9, 11]],
  ['aeolian', [0, 2, 3, 5, 7, 8, 10]],
  ['phrygian', [0, 1, 3, 5, 7, 8, 10]],
  ['dorian', [0, 2, 3, 5, 7, 9, 10]],
  ['mixolydian', [0, 2, 4, 5, 7, 9, 10]],
  ['lydian', [0, 2, 4, 6, 7, 9, 11]],
  ['locrian', [0, 1, 3, 5, 6, 8, 10]],
  ['harmonic_minor', [0, 2, 3, 5, 7, 8, 11]],
  ['melodic_minor', [0, 2, 3, 5, 7, 9, 11]],
  ['whole_tone', [0, 2, 4, 6, 8, 10]],
  ['diminished', [0, 2, 3, 5, 6, 8, 9, 11]],
];

/** (group, label, name, chord suffix, set): quintenzirkel's figures. */
const QUINTENZIRKEL_FIGURES: [string, string, string, string | undefined, number[]][] = [
  ['Note', 'Tonic', 'tonic', undefined, [0]],
  ['Note', 'Octave', 'octave', undefined, [0, 12]],
  ['Note', 'Harmonics', 'harmonics', undefined, [0, 12, 19, 24, 28]],
  ['Interval', 'Fifth', 'fifth', undefined, [0, 7]],
  ['Interval', 'Tritone', 'tritone', undefined, [0, 6]],
  ['Interval', 'Major 3rd', 'major 3rd', undefined, [0, 4]],
  ['Interval', 'Minor 3rd', 'minor 3rd', undefined, [0, 3]],
  ['Interval', 'Whole step', 'whole step', undefined, [0, 2]],
  ['Interval', 'Semitone', 'semitone', undefined, [0, 1]],
  ['Triad', 'Major', 'major', '', [0, 4, 7]],
  ['Triad', 'Minor', 'minor', 'm', [0, 3, 7]],
  ['Triad', 'Diminished', 'diminished', '°', [0, 3, 6]],
  ['Triad', 'Augmented', 'augmented', '+', [0, 4, 8]],
  ['Triad', 'Sus4', 'sus4', 'sus4', [0, 5, 7]],
  ['Triad', 'Sus2', 'sus2', 'sus2', [0, 2, 7]],
  ['Seventh', 'Dominant 7th', '7', '7', [0, 4, 7, 10]],
  ['Seventh', 'Major 7th', 'maj7', 'maj7', [0, 4, 7, 11]],
  ['Seventh', 'Minor 7th', 'm7', 'm7', [0, 3, 7, 10]],
  ['Seventh', 'Half-dim 7th', 'ø7', 'ø7', [0, 3, 6, 10]],
  ['Seventh', 'Dim 7th', '°7', '°7', [0, 3, 6, 9]],
  ['Seventh', 'Sixth', '6', '6', [0, 4, 7, 9]],
  ['Seventh', 'Ninth', '9', '9', [0, 2, 4, 7, 10]],
  ['Scale', 'Lydian', 'lydian', undefined, [0, 2, 4, 6, 7, 9, 11]],
  ['Scale', 'Ionian', 'ionian', undefined, [0, 2, 4, 5, 7, 9, 11]],
  ['Scale', 'Mixolydian', 'mixolydian', undefined, [0, 2, 4, 5, 7, 9, 10]],
  ['Scale', 'Dorian', 'dorian', undefined, [0, 2, 3, 5, 7, 9, 10]],
  ['Scale', 'Aeolian', 'aeolian', undefined, [0, 2, 3, 5, 7, 8, 10]],
  ['Scale', 'Phrygian', 'phrygian', undefined, [0, 1, 3, 5, 7, 8, 10]],
  ['Scale', 'Locrian', 'locrian', undefined, [0, 1, 3, 5, 6, 8, 10]],
  ['Scale', 'Major', 'major scale', undefined, [0, 2, 4, 5, 7, 9, 11]],
  ['Scale', 'Natural minor', 'natural minor', undefined, [0, 2, 3, 5, 7, 8, 10]],
  ['Scale', 'Harmonic minor', 'harmonic minor', undefined, [0, 2, 3, 5, 7, 8, 11]],
  ['Scale', 'Melodic minor', 'melodic minor', undefined, [0, 2, 3, 5, 7, 9, 11]],
  ['Scale', 'Pentatonic', 'pentatonic', undefined, [0, 2, 4, 7, 9]],
  ['Scale', 'Minor pent.', 'minor pentatonic', undefined, [0, 3, 5, 7, 10]],
  ['Scale', 'Blues', 'blues', undefined, [0, 3, 5, 6, 7, 10]],
  ['Scale', 'Whole tone', 'whole tone', undefined, [0, 2, 4, 6, 8, 10]],
  ['Scale', 'Octatonic', 'octatonic', undefined, [0, 1, 3, 4, 6, 7, 9, 10]],
  ['Scale', 'Chromatic', 'chromatic', undefined, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
];

/** quintenzirkel's groups, as the kind of reading that holds each. */
const QUINTENZIRKEL_KIND: Record<string, Record<string, ReadingKind> | ReadingKind> = {
  Note: { tonic: 'degree', octave: 'interval', harmonics: 'chord' },
  Interval: 'interval',
  Triad: 'chord',
  Seventh: 'chord',
  Scale: 'scale',
};

const pitchClasses = (set: readonly number[]) =>
  [...new Set(set.map((x) => ((x % 12) + 12) % 12))].sort((a, b) => a - b);

/** The set a reading stands for, over its root or tonic. */
function setOf(reading: Reading): readonly number[] {
  switch (reading.kind) {
    case 'chord':
      return reading.stack;
    case 'scale':
      return reading.helix.heights.map((x) => x - reading.helix.heights[0]!);
    case 'interval':
    case 'degree':
      return reading.specific;
    default:
      throw new Error(`no set for a ${reading.kind}`);
  }
}

function expectMeans(name: string, kind: ReadingKind, set: readonly number[]) {
  const reading = read(name, { kind });
  expect(reading.kind, name).toBe(kind);
  if (kind === 'interval' || kind === 'degree') expect(setOf(reading), name).toContain(set.at(-1));
  else expect(pitchClasses(setOf(reading)), name).toEqual(pitchClasses(set));
}

describe('names from play-aeiou', () => {
  it('chord types, alone and after a root', () => {
    for (const [name, set] of PLAY_AEIOU_CHORD_TYPES) {
      expectMeans(name, 'chord', set);
      expectMeans(`F#${name}`, 'chord', set);
    }
  });

  it('scales, by name and by the short on the panel', () => {
    for (const [short, name, set] of PLAY_AEIOU_SCALES) {
      expectMeans(name, 'scale', set);
      expectMeans(short, 'scale', set);
      expectMeans(`Eb ${name}`, 'scale', set);
    }
  });

  it('modes: each is the scale re-rooted, by its name, its short and its number', () => {
    for (const [scaleName, scaleModes] of Object.entries(PLAY_AEIOU_MODES)) {
      const scale = read(scaleName, { kind: 'scale' }).helix.heights;
      scaleModes.forEach(([name, short], k) => {
        const root = scale[k]!;
        const rerooted = scale.map((x) => (x - root + 12) % 12);
        expectMeans(name, 'scale', rerooted);
        if (!/\d$/.test(short)) expectMeans(short, 'scale', rerooted);
        expectMeans(`${scaleName} ${k + 1}`, 'scale', rerooted);
      });
    }
  });
});

describe('names from lib-aeiou', () => {
  it('scales, in their snake_case form', () => {
    for (const [name, set] of LIB_AEIOU_SCALES) expectMeans(name, 'scale', set);
  });

  it('"augmented" is its augmented triad, the chord reading here', () => {
    // lib-aeiou lists `augmented: [0, 4, 8]` as a scale. Here the augmented
    // scale is the hexatonic one, and [0, 4, 8] is the augmented chord.
    expectMeans('augmented', 'chord', [0, 4, 8]);
    expectMeans('augmented', 'scale', [0, 3, 4, 7, 8, 11]);
  });
});

describe('names from quintenzirkel', () => {
  it('every figure, by its name, its label, and as a chord symbol after a root', () => {
    for (const [group, label, name, suffix, set] of QUINTENZIRKEL_FIGURES) {
      const kinds = QUINTENZIRKEL_KIND[group]!;
      const kind = typeof kinds === 'string' ? kinds : kinds[name]!;
      expectMeans(name, kind, set);
      expectMeans(label, kind, set);
      if (suffix !== undefined) expectMeans(`B♭${suffix}`, 'chord', set);
    }
  });

  it('the rhythms its Euclid names: E(5,16) bossa nova, E(7,16) samba, E(3,8) tresillo', () => {
    expect(read('samba')).toEqual({ kind: 'rhythm', helix: even(7, 16) });
    expect(read('tresillo')).toEqual({ kind: 'rhythm', helix: even(3, 8) });
    // The bossa here is E(5,16) shifted by 6, so that it plays from where its clave does.
    expect(read('bossa nova')).toEqual({ kind: 'rhythm', helix: even(5, 16, 6) });
  });
});
