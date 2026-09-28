/**
 * E14: one token grammar for pitch and time? (#7, #116, #126)
 *
 * A pitch token is a degree of the chord's implied scale and an accidental
 * (U2): `alteredHeight(scale, degree, accidental)`, the key's own chromatic
 * step (P5). A time token, `onsetToken`/`onsetHeight` (`meter.ts`, #125,
 * #126), is the same shape over the bar's eighths, with one grid step
 * always, since the eighths never need a key's uneven spacing (#125). This
 * runs the band over E1's shape (5 seeds, each preset held and the tour, 64
 * bars each) and asks, over every note the parts actually write:
 *
 * 1. does every onset round-trip through the time token, `onsetToken` then
 *    `onsetHeight`, exactly, and how many need the accidental (off an
 *    eighth) against none (on one);
 * 2. does every bass and lead note have a pitch token: a degree and an
 *    accidental of the bar's chord's implied scale (`chordScale`, P9, P10),
 *    through `alteredDegree`, or is it out of a single token's reach;
 * 3. what a bar's two lines would cost combined, one token a note either
 *    way: pitch tokens (one an onset, as today) plus time tokens, against
 *    today's rhythm written on the 16-step grid (E15).
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/tokengrammar.ts
 */

import { alteredDegree, chordScale, joinChord, onsetHeight, onsetToken } from '@jambot/theory';
import { type BandCarried, type KeyWish, PRESETS, band, chordAt, keyHelix } from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;
const runs: ((bar: number) => (typeof PRESETS)[number])[] = [
  ...PRESETS.map((preset) => () => preset),
  (bar) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!,
];

let onsets = 0;
let onEighth = 0;
let roundTrips = 0;
let pitchNotes = 0;
let pitchTokens = 0;
const byScaleFailure = { noScale: 0, noDegree: 0 };
let pitchOnsetsTotal = 0;
let rhythmLines = 0;
let rhythmGridTokens = 0;
let rhythmTimeTokens = 0;

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
          wish: { tonic: null, mode: preset.mode } as KeyWish,
          offer: null,
        },
        carried,
        null,
      );
      carried = after;

      // 1. Every onset, as a time token.
      const byLine = new Map<string, Set<number>>();
      for (const note of output.written) {
        onsets++;
        const token = onsetToken(note.step);
        if (token.accidental === 1) onEighth++;
        if (onsetHeight(token) === note.step) roundTrips++;
        const line = note.part === 'drums' ? `drums:${note.role}` : note.part;
        byLine.set(line, (byLine.get(line) ?? new Set()).add(note.step));
      }
      for (const [, steps] of byLine) {
        rhythmLines++;
        rhythmGridTokens += 16; // today's slot-per-step, whether or not it holds an onset
        rhythmTimeTokens += steps.size; // one time token an onset, however many share an eighth
      }

      // 2. Every bass and lead note, as a pitch token.
      const scale = keyHelix(output.plan.key);
      for (const note of output.written) {
        if (note.part !== 'bass' && note.part !== 'lead') continue;
        pitchNotes++;
        pitchOnsetsTotal++;
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
console.log(
  `E14: ${onsets} onsets, ${pitchNotes} bass/lead notes, over ${BARS * SEEDS.length * runs.length} bars`,
);
console.log('\n1. Onsets as a time token (onsetToken/onsetHeight)');
console.log(`   round trips: ${pct(roundTrips, onsets)}`);
console.log(`   on an eighth (accidental 0): ${pct(onsets - onEighth, onsets)}`);
console.log(`   off an eighth (accidental 1): ${pct(onEighth, onsets)}`);

console.log('\n2. Bass and lead notes as a pitch token (alteredDegree over chordScale)');
console.log(`   have one: ${pct(pitchTokens, pitchNotes)}`);
console.log(`   chordScale gives no scale: ${pct(byScaleFailure.noScale, pitchNotes)}`);
console.log(
  `   a scale, but no single degree+accidental: ${pct(byScaleFailure.noDegree, pitchNotes)}`,
);

console.log("\n3. A bar's two lines, one token a note either way");
console.log(`   pitch tokens (bass+lead onsets): ${pitchOnsetsTotal}`);
console.log(`   rhythm lines (a part in a bar): ${rhythmLines}`);
console.log(`   rhythm tokens today (16 slots a line): ${rhythmGridTokens}`);
console.log(`   rhythm tokens as time tokens (one an onset): ${rhythmTimeTokens}`);
console.log(
  `   rhythm saving: ${pct(rhythmGridTokens - rhythmTimeTokens, rhythmGridTokens)} fewer tokens`,
);
