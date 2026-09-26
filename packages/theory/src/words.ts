/**
 * Words: how a name written in words is compared.
 *
 * Case, hyphens, underscores, runs of spaces and the dot after an
 * abbreviation don't matter. Ordinals read as words ("7th" is "seventh"), an
 * accidental before a degree reads as its sign ("flat 6" and "♭6" are "b6"),
 * and the common abbreviations read as the words they stand for ("dim" is
 * "diminished", "harm minor" is "harmonic minor"). So each table lists a name
 * once, in words, and every way of writing it finds it.
 *
 * Symbols such as `m7` or `M3` are not words: case carries meaning in them,
 * and they are compared as written.
 */

const ORDINALS: Record<string, string> = {
  '2nd': 'second',
  '3rd': 'third',
  '4th': 'fourth',
  '5th': 'fifth',
  '6th': 'sixth',
  '7th': 'seventh',
  '9th': 'ninth',
  '11th': 'eleventh',
  '13th': 'thirteenth',
};

const ABBREVIATIONS: Record<string, string> = {
  maj: 'major',
  min: 'minor',
  dim: 'diminished',
  aug: 'augmented',
  dom: 'dominant',
  sus: 'suspended',
  alt: 'altered',
  pent: 'pentatonic',
  harm: 'harmonic',
  mel: 'melodic',
  phryg: 'phrygian',
  mixolyd: 'mixolydian',
};

const ACCIDENTAL_BEFORE_DEGREE = /(?:^| )(♭|flat|♯|sharp|♮|natural) ?(?=\d)/g;
const ACCIDENTAL_SIGN: Record<string, string> = {
  '♭': 'b',
  flat: 'b',
  '♯': '#',
  sharp: '#',
  '♮': 'n',
  natural: 'n',
};

export function normalizeWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/\./g, ' ')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .replace(ACCIDENTAL_BEFORE_DEGREE, (match, accidental: string) =>
      match.startsWith(' ') ? ` ${ACCIDENTAL_SIGN[accidental]}` : ACCIDENTAL_SIGN[accidental]!,
    )
    .split(' ')
    .map((word) => ORDINALS[word] ?? ABBREVIATIONS[word] ?? word)
    .join(' ');
}

/** The words with a trailing `kind` ("C major scale", "major chord") taken off. */
export function withoutKindWord(words: string, kind: string): string {
  return words.endsWith(` ${kind}`) ? words.slice(0, -kind.length - 1) : words;
}
