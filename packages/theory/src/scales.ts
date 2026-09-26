/**
 * Named scales, each a helix with its tonic at 0. Where a scale is maximally
 * even it is taken from the primitive (the modes of 7 of 12 and 5 of 12, 6, 8
 * and 12 of 12); the rest are listed as heights. The modes of a listed scale
 * are its modes measured from 0, so only the scale itself is written out.
 */

import { even } from './even.ts';
import { type Helix, heightOf, shift } from './helix.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, mode } from './modes.ts';
import { normalizeWords, withoutKindWord } from './words.ts';

export interface NamedScale {
  /** Tonic at 0. */
  helix: Helix;
  aliases: readonly string[];
}

/** Mode d, shifted so that its degree 0 stands at 0: the scale re-rooted on its d-th note. */
const fromZero = (helix: Helix, d: number) => shift(mode(helix, d), -heightOf(helix, d));
const onTwelve = (heights: number[]): Helix => ({ cycle: 12, heights });

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
  DIATONIC_MODE_NAMES.map((name) => [
    name,
    { helix: diatonicMode(name), aliases: DIATONIC_ALIASES[name] ?? [] },
  ]),
);

/** A scale's modes, in degree order, each with its name and aliases; mode 0 is the scale. */
function modesOf(helix: Helix, names: [string, string[]][]): Record<string, NamedScale> {
  return Object.fromEntries(
    names.map(([name, aliases], d) => [name, { helix: fromZero(helix, d), aliases }]),
  );
}

/** Degree 3 of 5 of 12 is its major mode: C D E G A. */
const majorPentatonic = fromZero(even(5, 12), 3);
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
  ...modesOf(majorPentatonic, [
    ['major pentatonic', ['pentatonic', 'pentatonic major', 'PENT']],
    ['suspended pentatonic', ['suspended', 'egyptian']],
    ['man gong', ['malkos raga', 'MGNG']],
    ['ritsusen', ['ritusen', 'RITS']],
    ['minor pentatonic', ['pentatonic minor', 'vietnamese 2', 'MPEN']],
  ]),
  'whole tone': { helix: even(6, 12), aliases: ['wholetone', "messiaen's mode #1", 'WTON'] },
  chromatic: { helix: even(12, 12), aliases: ['CHR'] },
  diminished: { helix: octatonic, aliases: ['whole half', 'whole half diminished'] },
  'half whole diminished': {
    helix: fromZero(octatonic, 1),
    aliases: ['half whole', 'dominant diminished', 'octatonic', "messiaen's mode #2", 'HWD'],
  },
  ...modesOf(onTwelve([0, 3, 5, 6, 7, 10]), [
    ['blues', ['minor blues', 'BLUE']],
    ['major blues', ['MBLU']],
  ]),
  ...modesOf(onTwelve([0, 2, 3, 5, 7, 8, 11]), [
    ['harmonic minor', ['HMIN']],
    ['locrian natural 6', ['locrian 6', 'locrian #6', 'LOC6']],
    ['ionian #5', ['ionian augmented', 'major augmented', 'major #5', 'ION5']],
    ['dorian #4', ['ukrainian dorian', 'romanian minor', 'altered dorian', 'DOR4']],
    ['phrygian dominant', ['spanish phrygian', 'spanish', 'phrygian major', 'PDOM']],
    ['lydian #2', ['lydian #9', 'LYD2']],
    ['ultralocrian', ['altered diminished', 'superlocrian bb7', 'superlocrian diminished', 'ULOC']],
  ]),
  ...modesOf(onTwelve([0, 2, 3, 5, 7, 9, 11]), [
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
  augmented: { helix: onTwelve([0, 3, 4, 7, 8, 11]), aliases: [] },
};

/**
 * The canonical name of a scale, from its name or an alias in words (see
 * `normalizeWords`), with or without a trailing "scale".
 */
export function parseScaleName(text: string): string | undefined {
  return SCALE_BY_WORDS.get(withoutKindWord(normalizeWords(text), 'scale'));
}

/** Every name and alias in words, to its canonical name; the first scale to claim one keeps it. */
const SCALE_BY_WORDS = new Map<string, string>();
for (const [name, scale] of Object.entries(SCALES))
  for (const alias of [name, ...scale.aliases]) {
    const words = normalizeWords(alias);
    if (!SCALE_BY_WORDS.has(words)) SCALE_BY_WORDS.set(words, name);
  }

/**
 * A scale by name, or a scale and a number: "harmonic minor 5" is its fifth
 * mode, the scale re-rooted on its fifth note, as play-aeiou numbers them. A
 * mode is called by its own name when it has one ("major 2" is dorian),
 * and by the scale's name and the number otherwise ("blues 3"). A name wins
 * over a number: "locrian 6" is locrian ♮6, as it is usually named.
 */
export function parseScale(text: string): { name: string; helix: Helix } | undefined {
  const name = parseScaleName(text);
  if (name) return { name, helix: SCALES[name]!.helix };
  const numbered = /^(.*\S)\s+(\d+)$/.exec(text.trim());
  if (!numbered) return undefined;
  const scaleName = parseScaleName(numbered[1]!);
  const number = Number(numbered[2]);
  if (!scaleName || number < 1 || number > SCALES[scaleName]!.helix.heights.length)
    return undefined;
  const helix = fromZero(SCALES[scaleName]!.helix, number - 1);
  const own = Object.entries(SCALES).find(
    ([, scale]) => scale.helix.heights.join() === helix.heights.join(),
  );
  return { name: own?.[0] ?? `${scaleName} ${number}`, helix };
}
