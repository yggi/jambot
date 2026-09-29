/**
 * E17: the lead driven by the style (#168 step 2).
 *
 * Step 2 lets three more of the style's axes reach the lead's phrases
 * (`phraseParams`): the harmony leans the contour from an arch toward a
 * wave, the harmony thins the strong steps a note lands on a chord tone at,
 * and the swing lifts the off-beat eighths. Which of them stay is decided
 * by ear, so this measures what each does to what the lead writes, per
 * preset, and hands the notes to a page that plays them.
 *
 * Each preset is held at entropy 0.3 over 5 seeds and 64 bars. Per preset:
 *
 * - notes a bar, where the lead plays;
 * - its movement: the mean interval between consecutive notes, in semitones,
 *   and how often the line turns (a change of direction, per note);
 * - on the beats (steps 0, 4, 8, 12): the share of notes that are chord tones;
 * - on the off-beat eighths (steps 2, 6, 10, 14): the share of all notes.
 *
 * With a path it also writes, per preset, seed 1's bars 8–23 as played (the
 * lead, the bass and the pad, each note's step on the song's grid, length,
 * velocity and timbre), the tempo and the swing, for the page's audio.
 *
 * Run at each commit compared:
 * node --experimental-strip-types --no-warnings packages/engine/experiments/lead-style.ts [out.json]
 */

import { writeFileSync } from 'node:fs';
import { joinChord, wrap } from '@jambot/theory';
import { type DoughNote, PRESETS, band, chordAt } from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5).map((s) => s + 1);
const BARS = 64;
const EXAMPLE = { seed: 1, from: 8, to: 24 };

interface Measure {
  preset: string;
  barsPlayed: number;
  notesPerBar: number;
  meanInterval: number;
  turnsPerNote: number;
  beatChordTones: number;
  offBeatEighths: number;
}

const measures: Measure[] = [];
const examples: Record<
  string,
  { bpm: number; swing: number; notes: (Omit<DoughNote, 'step'> & { step: number })[] }
> = {};

for (const preset of PRESETS) {
  const style = { ...preset.style, entropy: 0.3 };
  let barsPlayed = 0;
  let notes = 0;
  let intervals = 0;
  let intervalSum = 0;
  let turns = 0;
  let onBeats = 0;
  let beatTones = 0;
  let offBeats = 0;
  for (const seed of SEEDS) {
    let carried = band.initial;
    for (const bar of range(BARS)) {
      const next = band.advance(
        { seed, bar, style, wish: { tonic: null, mode: preset.mode }, offer: null },
        carried,
        null,
      );
      carried = next.carried;
      const out = next.output;
      const lead = out.dough.filter((n) => n.part === 'lead');
      if (seed === EXAMPLE.seed && bar >= EXAMPLE.from && bar < EXAMPLE.to) {
        examples[preset.name] ??= { bpm: style.bpm, swing: style.swing, notes: [] };
        for (const n of out.dough)
          if (n.part === 'lead' || n.part === 'bass' || n.part === 'pad')
            examples[preset.name]!.notes.push({ ...n, step: (bar - EXAMPLE.from) * 16 + n.step });
      }
      if (lead.length === 0) continue;
      barsPlayed++;
      notes += lead.length;
      lead.forEach((n, i) => {
        if (n.step % 4 === 0) {
          onBeats++;
          const tones = joinChord(chordAt(out.chords, n.step).chord).map((h) => wrap(h, 12));
          if (tones.includes(wrap(n.note, 12))) beatTones++;
        }
        if (n.step % 4 === 2) offBeats++;
        const before = lead[i - 1];
        if (!before) return;
        intervals++;
        intervalSum += Math.abs(n.note - before.note);
        const earlier = lead[i - 2];
        if (earlier && Math.sign(n.note - before.note) * Math.sign(before.note - earlier.note) < 0)
          turns++;
      });
    }
  }
  measures.push({
    preset: preset.name,
    barsPlayed,
    notesPerBar: notes / Math.max(1, barsPlayed),
    meanInterval: intervalSum / Math.max(1, intervals),
    turnsPerNote: turns / Math.max(1, notes),
    beatChordTones: beatTones / Math.max(1, onBeats),
    offBeatEighths: offBeats / Math.max(1, notes),
  });
}

const f = (x: number, digits = 2) => x.toFixed(digits);
console.log(
  'preset          bars  notes/bar  interval  turns/note  beat chord tones  off-beat 8ths',
);
for (const m of measures)
  console.log(
    `${m.preset.padEnd(15)} ${String(m.barsPlayed).padStart(4)}  ${f(m.notesPerBar).padStart(9)}  ${f(m.meanInterval).padStart(8)}  ${f(m.turnsPerNote).padStart(10)}  ${f(m.beatChordTones).padStart(16)}  ${f(m.offBeatEighths).padStart(13)}`,
  );

const out = process.argv[2];
if (out) writeFileSync(out, JSON.stringify({ measures, examples, example: EXAMPLE }));
