/**
 * Named scales. Where a scale is maximally even it is taken from the
 * primitive (the modes of 7 of 12 and 5 of 12, 6, 8 and 12 of 12); the rest
 * are listed as sets and marked as not even. The modes of a listed scale are
 * its rotations, so only the scale itself is written out.
 */

import { even, shift } from './even.ts';
import { DIATONIC_MODE_NAMES, modes, rotate } from './modes.ts';
import { normalizeWords, withoutKindWord } from './words.ts';

export interface NamedScale {
  /** Semitones above the tonic, starting with 0. */
  set: readonly number[];
  /** True when the set is maximally even, which the tests check. */
  even: boolean;
  aliases: readonly string[];
}

const DIATONIC_ALIASES: Record<string, string[]> = {
  ionian: ['major', 'ION'],
  dorian: ['DOR'],
  phrygian: ['PHR'],
  lydian: ['LYD'],
  mixolydian: ['MIX'],
  aeolian: ['minor', 'natural minor', 'AEO'],
  locrian: ['LOC'],
};

const diatonic = Object.fromEntries(
  DIATONIC_MODE_NAMES.map((name, b) => [
    name,
    { set: modes(7, 12)[b]!, even: true, aliases: DIATONIC_ALIASES[name] ?? [] },
  ]),
);

/** A scale's modes, in scale order, each with its name and aliases; mode 0 is the scale. */
function modesOf(
  set: readonly number[],
  even: boolean,
  names: [string, string[]][],
): Record<string, NamedScale> {
  return Object.fromEntries(
    names.map(([name, aliases], d) => [name, { set: rotate(set, d), even, aliases }]),
  );
}

const harmonicMinor = [0, 2, 3, 5, 7, 8, 11];
const melodicMinor = [0, 2, 3, 5, 7, 9, 11];
const octatonic = even(8, 12);

/**
 * Canonical names first, then the aliases. The aliases in capitals are
 * play-aeiou's panel shorts, where they are not already an abbreviation (see
 * `normalizeWords`: `DIM` is "diminished"). The aliases hold every name
 * tonal has for these sets, except two that are something else here
 * (second-opinion.test.ts).
 */
export const SCALES: Record<string, NamedScale> = {
  ...diatonic,
  ...modesOf(modes(5, 12)[4]!, true, [
    ['major pentatonic', ['pentatonic', 'pentatonic major', 'PENT']],
    ['suspended pentatonic', ['suspended', 'egyptian']],
    ['man gong', ['malkos raga', 'MGNG']],
    ['ritsusen', ['ritusen', 'RITS']],
    ['minor pentatonic', ['pentatonic minor', 'vietnamese 2', 'MPEN']],
  ]),
  'whole tone': {
    set: even(6, 12),
    even: true,
    aliases: ['wholetone', "messiaen's mode #1", 'WTON'],
  },
  chromatic: { set: even(12, 12), even: true, aliases: ['CHR'] },
  diminished: {
    set: octatonic,
    even: true,
    aliases: ['whole half', 'whole half diminished'],
  },
  'half whole diminished': {
    set: shift(octatonic, -2, 12),
    even: true,
    aliases: ['half whole', 'dominant diminished', 'octatonic', "messiaen's mode #2", 'HWD'],
  },
  ...modesOf([0, 3, 5, 6, 7, 10], false, [
    ['blues', ['minor blues', 'BLUE']],
    ['major blues', ['MBLU']],
  ]),
  ...modesOf(harmonicMinor, false, [
    ['harmonic minor', ['HMIN']],
    ['locrian natural 6', ['locrian 6', 'locrian #6', 'LOC6']],
    ['ionian #5', ['ionian augmented', 'major augmented', 'major #5', 'ION5']],
    ['dorian #4', ['ukrainian dorian', 'romanian minor', 'altered dorian', 'DOR4']],
    ['phrygian dominant', ['spanish phrygian', 'spanish', 'phrygian major', 'PDOM']],
    ['lydian #2', ['lydian #9', 'LYD2']],
    ['ultralocrian', ['altered diminished', 'superlocrian bb7', 'superlocrian diminished', 'ULOC']],
  ]),
  ...modesOf(melodicMinor, false, [
    ['melodic minor', ['jazz minor', 'MMIN']],
    ['dorian b2', ['phrygian natural 6', 'phrygian #6', 'melodic minor second mode', 'DOR2']],
    ['lydian augmented', ['lydian #5', 'LYD+']],
    ['lydian dominant', ['acoustic', 'overtone', 'lydian b7', 'LDOM']],
    ['mixolydian b6', ['aeolian dominant', 'hindu', 'melodic minor fifth mode', 'MIX6']],
    ['locrian natural 2', ['aeolian b5', 'locrian #2', 'LOC2']],
    [
      'altered',
      [
        'super locrian',
        'superlocrian',
        'altered dominant',
        'diminished whole tone',
        'pomeroy',
        'ALT',
      ],
    ],
  ]),
  augmented: { set: [0, 3, 4, 7, 8, 11], even: false, aliases: [] },
};

/**
 * The canonical name of a scale, from its name or an alias in words (see
 * `normalizeWords`), with or without a trailing "scale".
 */
export function parseScaleName(text: string): string | undefined {
  const words = withoutKindWord(normalizeWords(text), 'scale');
  for (const [name, scale] of Object.entries(SCALES)) {
    if ([name, ...scale.aliases].some((alias) => normalizeWords(alias) === words)) return name;
  }
  return undefined;
}

/**
 * A scale by name, or a scale and a number: "harmonic minor 5" is its fifth
 * mode, the scale re-rooted on its fifth note, as play-aeiou numbers them. A
 * mode is called by its own name when its set has one ("major 2" is dorian),
 * and by the scale's name and the number otherwise ("blues 3"). A name wins
 * over a number: "locrian 6" is locrian ♮6, as it is usually named.
 */
export function parseScale(text: string): { name: string; set: readonly number[] } | undefined {
  const name = parseScaleName(text);
  if (name) return { name, set: SCALES[name]!.set };
  const numbered = /^(.*\S)\s+(\d+)$/.exec(text.trim());
  if (!numbered) return undefined;
  const scaleName = parseScaleName(numbered[1]!);
  const number = Number(numbered[2]);
  if (!scaleName || number < 1 || number > SCALES[scaleName]!.set.length) return undefined;
  const set = rotate(SCALES[scaleName]!.set, number - 1);
  const own = Object.entries(SCALES).find(([, scale]) => scale.set.join() === set.join());
  return { name: own?.[0] ?? `${scaleName} ${number}`, set };
}
