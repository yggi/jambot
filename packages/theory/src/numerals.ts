/**
 * Roman numerals: a chord as a degree of its key (U1, decided on #7).
 *
 * A numeral is a degree of the key's own scale, as a pitch number is a degree
 * of the chord's (P7): `VI` in A minor is F, `VII` in G mixolydian is F, and
 * `b` and `#` alter the mode's own degree, so `bVII` in G mixolydian is F♭.
 * music21 reads numerals the same way, except that it raises the seventh
 * degree of a minor key for `vii`; U1 takes every degree from the mode.
 *
 * Case sets the quality of the triad, and a suffix names the rest, as fixed
 * intervals, the way chord symbols do: `V7` is a dominant seventh and `ii7` a
 * minor seventh in any key. The suffixes are the theory's qualities, each
 * written one way, so a numeral reads back as the chord it was written from.
 * `V7/ii` reads its numeral in the major or minor key on the target's root.
 *
 * Nothing here assumes 12 notes to the octave (P5, decided on #7): a key is
 * any helix of seven degrees, `b` and `#` move a degree by the key's
 * chromatic step, its larger step less its smaller (1 in 12, 2 in 31), and
 * a secondary's key is a mode of the key's own set. So a numeral means the
 * note the line of fifths spells for it in any tuning whose diatonic set is
 * a chain of fifths.
 */

import { type Helix, gaps, heightOf, shift, wrap } from './helix.ts';
import { mode } from './modes.ts';

/** A chord in a key: its root as a position on the circle, and its quality. */
export interface KeyChord {
  root: number;
  quality: string;
}

/** What a numeral's target names: a degree, altered, and whether its key is minor. */
export interface Target {
  degree: number;
  accidental: -1 | 0 | 1;
  minor: boolean;
}

/** A numeral: a degree of the key, altered, its quality, and its target if secondary. */
export interface Numeral {
  degree: number;
  accidental: -1 | 0 | 1;
  quality: string;
  of?: Target;
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/**
 * Each quality as a numeral writes it: upper case for a major third or none,
 * lower case for a minor third, and a suffix. The harmonic series is no chord
 * and has no numeral.
 */
const SUFFIXES: Record<string, [upper: boolean, suffix: string]> = {
  major: [true, ''],
  minor: [false, ''],
  diminished: [false, '°'],
  augmented: [true, '+'],
  sus2: [true, 'sus2'],
  sus4: [true, 'sus4'],
  '5': [true, '5'],
  '6': [true, '6'],
  m6: [false, '6'],
  '7': [true, '7'],
  maj7: [true, 'maj7'],
  m7: [false, '7'],
  mMaj7: [false, 'maj7'],
  m7b5: [false, 'ø7'],
  dim7: [false, '°7'],
  '9': [true, '9'],
  maj9: [true, 'maj9'],
  m9: [false, '9'],
  add9: [true, 'add9'],
};

const QUALITY_BY_WRITING = new Map(
  Object.entries(SUFFIXES).map(([quality, [upper, suffix]]) => [`${upper}${suffix}`, quality]),
);

const ACCIDENTALS: Record<string, -1 | 0 | 1> = { b: -1, '': 0, '#': 1 };
const sign = (accidental: number) => (accidental < 0 ? 'b' : accidental > 0 ? '#' : '');

/** A roman numeral in one case, and the degree it names. */
function readRoman(text: string): { degree: number; upper: boolean } | undefined {
  const upper = text === text.toUpperCase();
  if (!upper && text !== text.toLowerCase()) return undefined;
  const degree = ROMANS.indexOf(text.toUpperCase());
  return degree < 0 ? undefined : { degree, upper };
}

/** A numeral from its text, such as `bVII`, `viiø7` or `V9/ii`, if it is one. */
export function parseNumeral(text: string): Numeral | undefined {
  const match = /^([b#]?)([IViv]+)(.*?)(?:\/([b#]?)([IViv]+))?$/u.exec(text);
  if (!match) return undefined;
  const [, accidental, romanText, suffix, targetAccidental, targetRoman] = match;
  const roman = readRoman(romanText!);
  const quality = roman && QUALITY_BY_WRITING.get(`${roman.upper}${suffix}`);
  if (!roman || !quality) return undefined;
  const numeral: Numeral = { degree: roman.degree, accidental: ACCIDENTALS[accidental!]!, quality };
  if (targetRoman === undefined) return numeral;
  const target = readRoman(targetRoman);
  if (!target) return undefined;
  numeral.of = {
    degree: target.degree,
    accidental: ACCIDENTALS[targetAccidental!]!,
    minor: !target.upper,
  };
  return numeral;
}

/** A numeral's text: the inverse of `parseNumeral`. */
export function formatNumeral(numeral: Numeral): string {
  const [upper, suffix] = SUFFIXES[numeral.quality]!;
  const roman = ROMANS[numeral.degree]!;
  const text = sign(numeral.accidental) + (upper ? roman : roman.toLowerCase()) + suffix;
  if (!numeral.of) return text;
  const target = ROMANS[numeral.of.degree]!;
  return `${text}/${sign(numeral.of.accidental)}${numeral.of.minor ? target.toLowerCase() : target}`;
}

/** The step a `b` or `#` moves by: the key's larger step less its smaller. */
function chromaticStep(key: Helix): number {
  const steps = gaps(key);
  return Math.max(...steps) - Math.min(...steps);
}

/** The major and minor modes as their large (L) and small (s) steps. */
const STEPS = { ionian: 'LLsLLLs', aeolian: 'LsLLsLL' } as const;

/** The key's own set entered as a major or minor mode, on a root. */
function modeOn(key: Helix, name: keyof typeof STEPS, root: number): Helix {
  const steps = gaps(key);
  const large = Math.max(...steps);
  const shape = steps.map((g) => (g === large ? 'L' : 's')).join('');
  const degree = [0, 1, 2, 3, 4, 5, 6].find(
    (d) => shape.slice(d) + shape.slice(0, d) === STEPS[name],
  )!;
  const entered = mode(key, degree);
  return shift(entered, root - entered.heights[0]!);
}

/** The key a numeral is read in: the key itself, or its target's major or minor key. */
function keyOf(key: Helix, of: Target | undefined): Helix {
  if (!of) return key;
  const root = heightOf(key, of.degree) + of.accidental * chromaticStep(key);
  return modeOn(key, of.minor ? 'aeolian' : 'ionian', root);
}

/** The chord a numeral means in a key of seven degrees. */
export function chordOfNumeral(key: Helix, numeral: Numeral): KeyChord {
  const home = keyOf(key, numeral.of);
  return {
    root: wrap(
      heightOf(home, numeral.degree) + numeral.accidental * chromaticStep(key),
      home.cycle,
    ),
    quality: numeral.quality,
  };
}

/**
 * The numeral that writes a chord in a key of seven degrees, against a
 * target if one is given. A root on a degree of the key is written plain; a
 * root off the key as the parallel major has it (`#VI` in A minor, the sixth
 * of A major); any other as a flat on the degree above (`bVII` in C major).
 * Undefined for a quality no numeral writes.
 */
export function numeralOf(key: Helix, chord: KeyChord, of?: Target): Numeral | undefined {
  if (!(chord.quality in SUFFIXES) || key.heights.length !== 7) return undefined;
  const home = keyOf(key, of);
  const major = modeOn(key, 'ionian', home.heights[0]!);
  const step = chromaticStep(key);
  const at = (helix: Helix, degree: number) => wrap(heightOf(helix, degree), helix.cycle);
  const altered = (degree: number, accidental: number) =>
    wrap(at(home, degree) + accidental * step, home.cycle);
  const degrees = [0, 1, 2, 3, 4, 5, 6];
  const numeral = (degree: number, accidental: number): Numeral => ({
    degree,
    accidental: accidental as -1 | 0 | 1,
    quality: chord.quality,
    ...(of && { of }),
  });

  const plain = degrees.find((d) => at(home, d) === chord.root);
  if (plain !== undefined) return numeral(plain, 0);
  const inMajor = degrees.find((d) => at(major, d) === chord.root);
  if (inMajor !== undefined)
    for (const accidental of [-1, 1])
      if (altered(inMajor, accidental) === chord.root) return numeral(inMajor, accidental);
  const below = degrees.find((d) => altered(d, -1) === chord.root);
  if (below !== undefined) return numeral(below, -1);
  const above = degrees.find((d) => altered(d, 1) === chord.root);
  return above === undefined ? undefined : numeral(above, 1);
}
