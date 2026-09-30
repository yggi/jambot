/**
 * E14: a pitch as a degree of the chord's implied scale and an accidental
 * (U2, P9, #7, #126).
 *
 * `alteredHeight(scale, degree, accidental)` writes such a token, the key's
 * own chromatic step (P5). This runs the band over E1's shape (5 seeds, each
 * preset held and the tour, 64 bars each) and asks, over every bass and lead
 * note the parts actually write: does each have one, a degree and an
 * accidental of the bar's chord's implied scale (`chordScale`, P9, P10),
 * through `alteredDegree`, or is it out of a single token's reach?
 *
 * The bass is written as semitones above the chord's root instead (#263,
 * U6), which every note has; this measures what the degree form would have
 * cost, for the lead's cells (U4) to weigh.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/tokengrammar.ts
 */

import { alteredDegree, chordScale, joinChord } from '@jambot/theory';
import { type BandCarried, type KeyWish, PRESETS, band, chordAt, keyHelix } from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;
const runs: ((bar: number) => (typeof PRESETS)[number])[] = [
  ...PRESETS.map((preset) => () => preset),
  (bar) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!,
];

let pitchNotes = 0;
let pitchTokens = 0;
const byScaleFailure = { noScale: 0, noDegree: 0 };

for (const seed of SEEDS)
  for (const presetAt of runs) {
    let carried: BandCarried = band.initial;
    for (const bar of range(BARS)) {
      const preset = presetAt(bar);
      const { output, carried: after } = band.advance(
        {
          seed,
          bar,
          style: { ...preset.style, entropy: (bar % 32) / 32 },
          wish: { tonic: null, mode: preset.mode, melodic: null } as KeyWish,
          offer: null,
        },
        carried,
        null,
      );
      carried = after;

      // Every bass and lead note, as a pitch token.
      const scale = keyHelix(output.plan.key);
      for (const note of output.written) {
        if (note.part !== 'bass' && note.part !== 'lead') continue;
        pitchNotes++;
        const chord = chordAt(output.chords, note.step).chord;
        const implied = chordScale(scale, joinChord(chord));
        if (!implied) {
          byScaleFailure.noScale++;
          continue;
        }
        const token = implied.heights.length === 7 ? alteredDegree(implied, note.note) : undefined;
        if (!token) {
          byScaleFailure.noDegree++;
          continue;
        }
        pitchTokens++;
      }
    }
  }

const pct = (a: number, b: number) => `${a} (${((100 * a) / b).toFixed(1)}%)`;
console.log(`E14: ${pitchNotes} bass/lead notes, over ${BARS * SEEDS.length * runs.length} bars`);
console.log('\nBass and lead notes as a pitch token (alteredDegree over chordScale)');
console.log(`   have one: ${pct(pitchTokens, pitchNotes)}`);
console.log(`   chordScale gives no scale: ${pct(byScaleFailure.noScale, pitchNotes)}`);
console.log(
  `   a scale, but no single degree+accidental: ${pct(byScaleFailure.noDegree, pitchNotes)}`,
);
