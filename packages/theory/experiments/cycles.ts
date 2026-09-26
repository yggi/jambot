/**
 * E12: Roman numerals over cycles other than 12 (#7, decision (h); P5, U1).
 *
 * P5 says no pitch token assumes 12 notes to the cycle. The numerals (U1)
 * are the first pitch tokens with a witness, so this reads every numeral in
 * every key of six tunings in which the diatonic set is a chain of fifths:
 * 12, 17, 19, 22, 31 and 53 notes to the octave.
 *
 * The oracle is the line of fifths, independent of `numerals.ts`: a note
 * spelled as a letter and its accidentals stands at a place on the line
 * (F −1, C 0, G 1, …, a sharp 7 further on), and in a tuning whose fifth is
 * g steps of n it sounds at place × g, mod n. A key is seven consecutive
 * places around its tonic, a degree is the place in them it names, and `b`
 * and `#` move it 7 places. A secondary's key is the major or minor key on
 * its target's root.
 *
 * It measures two readings against the oracle:
 * - `chordOfNumeral` as it is, given each key as a helix of its own cycle;
 * - the same rule with an accidental worth L − s of the key's helix (the
 *   chromatic semitone: its larger step less its smaller) and a secondary's
 *   key taken from the key's own set, which is how U1 would read over any
 *   cycle.
 * And whether `numeralOf` writes each oracle chord back as its numeral.
 *
 * The any-cycle rule is now `numerals.ts`'s own (P5, decided on #7 on
 * these measurements), so its "now" column reads as its rule does.
 *
 * Run: node --experimental-strip-types --no-warnings packages/theory/experiments/cycles.ts [out.json]
 */

import { writeFileSync } from 'node:fs';
import {
  type Helix,
  type Numeral,
  brightness,
  chordOfNumeral,
  formatNumeral,
  gaps,
  heightOf,
  isEven,
  modes,
  numeralOf,
  shift,
  wrap,
} from '../src/index.ts';

/** Each tuning's fifth, in steps of its cycle. */
const FIFTHS: Record<number, number> = { 12: 7, 17: 10, 19: 11, 22: 13, 31: 18, 53: 31 };

/** The modes by brightness, lydian first: where each starts on the line, relative to its tonic. */
const MODES = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];

/** The place on the line of fifths of a degree of a mode, the tonic at 0. */
const placeOf = (brightnessRank: number, degree: number) => {
  for (let p = -brightnessRank; p <= 6 - brightnessRank; p++)
    if ((((p * 4) % 7) + 7) % 7 === degree) return p;
  throw new Error('no place');
};

/** A key as a helix of cycle n: its tonic's place on the line, and its mode. */
const keyHelix = (n: number, tonic: number, rank: number): Helix => {
  const g = FIFTHS[n]!;
  const heights = [0, 1, 2, 3, 4, 5, 6].map((d) => (tonic + placeOf(rank, d)) * g);
  const base = heights[0]!;
  return {
    cycle: n,
    heights: heights.map((h) => base + wrap(h - base, n)),
  };
};

/** The oracle: the root of a numeral, as a place on the line of fifths. */
function oraclePlace(tonic: number, rank: number, numeral: Numeral): number {
  let home = tonic;
  let homeRank = rank;
  if (numeral.of) {
    home = tonic + placeOf(rank, numeral.of.degree) + 7 * numeral.of.accidental;
    homeRank = numeral.of.minor ? 4 : 1;
  }
  return home + placeOf(homeRank, numeral.degree) + 7 * numeral.accidental;
}

/** U1's rule over any cycle: an accidental is L − s, a secondary's key from the key's own set. */
function anyCycleRoot(key: Helix, numeral: Numeral): number {
  const steps = gaps(key);
  const apotome = Math.max(...steps) - Math.min(...steps);
  let home = key;
  if (numeral.of) {
    const root = heightOf(key, numeral.of.degree) + numeral.of.accidental * apotome;
    const byBrightness = modes(key).sort((a, b) => brightness(b) - brightness(a));
    const mode = byBrightness[numeral.of.minor ? 4 : 1]!;
    home = shift(mode, root - mode.heights[0]!);
  }
  return wrap(heightOf(home, numeral.degree) + numeral.accidental * apotome, key.cycle);
}

const accidentals = [-1, 0, 1] as const;
const numerals: Numeral[] = [];
for (const degree of [0, 1, 2, 3, 4, 5, 6])
  for (const accidental of accidentals) numerals.push({ degree, accidental, quality: 'major' });
for (const target of [1, 2, 3, 4, 5, 6])
  for (const minor of [false, true])
    for (const degree of [4, 6])
      numerals.push({
        degree,
        accidental: 0,
        quality: '7',
        of: { degree: target, accidental: 0, minor },
      });

type Tally = {
  even: boolean;
  read: number;
  readAnyCycle: number;
  written: number;
  total: number;
};
const results: Record<string, Tally> = {};
const circle: Record<number, { numeral: string; oracle: number; now: number; anyCycle: number }[]> =
  {};

for (const n of Object.keys(FIFTHS).map(Number)) {
  const g = FIFTHS[n]!;
  const tally: Tally = {
    even: isEven(keyHelix(n, 0, 1)),
    read: 0,
    readAnyCycle: 0,
    written: 0,
    total: 0,
  };
  for (let tonic = -6; tonic <= 6; tonic++)
    for (let rank = 0; rank < 7; rank++) {
      const key = keyHelix(n, tonic, rank);
      if (!key.heights.every((h, i) => i === 0 || h > key.heights[i - 1]!))
        throw new Error(`a key of ${n} is not a helix`);
      for (const numeral of numerals) {
        const oracle = wrap(oraclePlace(tonic, rank, numeral) * g, n);
        let now = NaN;
        try {
          now = chordOfNumeral(key, numeral).root;
        } catch {
          // A reading that throws is a wrong one.
        }
        const anyCycle = anyCycleRoot(key, numeral);
        tally.total++;
        if (now === oracle) tally.read++;
        if (anyCycle === oracle) tally.readAnyCycle++;
        let back: Numeral | undefined;
        try {
          back = numeralOf(key, { root: oracle, quality: numeral.quality }, numeral.of);
        } catch {
          back = undefined;
        }
        if (back && formatNumeral(back) === formatNumeral(numeral)) tally.written++;
        if (tonic === 0 && rank === 1)
          (circle[n] ??= []).push({ numeral: formatNumeral(numeral), oracle, now, anyCycle });
      }
    }
  results[`${n} notes (fifth ${g})`] = tally;
}

const pct = (a: number, b: number) => `${a} (${((100 * a) / b).toFixed(0)}%)`;
console.log(
  `E12 numerals read against the line of fifths: ${numerals.length} numerals × 13 tonics × 7 modes per tuning`,
);
console.table(
  Object.fromEntries(
    Object.entries(results).map(([name, t]) => [
      name,
      {
        'diatonic is even(7, n)': t.even,
        numerals: t.total,
        'chordOfNumeral now': pct(t.read, t.total),
        'with b/# = L − s': pct(t.readAnyCycle, t.total),
        'numeralOf writes it back': pct(t.written, t.total),
      },
    ]),
  ),
);

const out = process.argv[2];
if (out) writeFileSync(out, JSON.stringify({ results, circle, fifths: FIFTHS, modes: MODES }));
