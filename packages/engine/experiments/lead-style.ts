/**
 * E18: the lead driven by the style (#168 step 2), over each melodic scale (#209).
 *
 * Step 2 lets three more of the style's axes reach the lead's phrases
 * (`phraseParams`): the harmony leans the contour from an arch toward a
 * wave, the harmony thins the strong steps a note lands on a chord tone at,
 * and the swing lifts the off-beat eighths. Which of them stay is decided
 * by ear, so this measures what each does to what the lead writes, per
 * preset, and hands the notes to a page that plays them.
 *
 * #209 lets the lead walk a melodic scale over the key: the plain scale,
 * the pentatonic or the blues. Each is forced on here, whatever the style's
 * reach, by running the lead alone over the band's bars with the plan's
 * melodic scale set, so every preset is measured in all three.
 *
 * Each preset is held at entropy 0.3 over 5 seeds and 64 bars. Per preset
 * and melodic scale:
 *
 * - notes a bar, where the lead plays;
 * - its movement: the mean interval between consecutive notes, in semitones,
 *   and how often the line turns (a change of direction, per note);
 * - on the beats (steps 0, 4, 8, 12): the share of notes that are chord tones;
 * - on the off-beat eighths (steps 2, 6, 10, 14): the share of all notes;
 * - in the scale: the share of notes whose pitch class is in the melodic
 *   scale (the rest are chord tones it lands on, and the cadence).
 *
 * With a path it also writes, per preset and scale, seed 1's bars 8–23 as
 * played (the lead, the bass and the pad, each note's step on the song's
 * grid, length, velocity and timbre), the tempo and the swing, for the
 * page's audio.
 *
 * Run at each commit compared:
 * node --experimental-strip-types --no-warnings packages/engine/experiments/lead-style.ts [out.json]
 */

import { writeFileSync } from 'node:fs';
import { joinChord, positions, wrap } from '@jambot/theory';
import {
  presetMode,
  type BandBar,
  type DoughNote,
  MELODIC_SCALES,
  type MelodicScale,
  type MeterSwing,
  PRESETS,
  band,
  chordAt,
  lead,
  melodicHelix,
  playBar,
  presetSwing,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5).map((s) => s + 1);
const BARS = 64;
const EXAMPLE = { seed: 1, from: 8, to: 24 };

interface Measure {
  preset: string;
  scale: MelodicScale;
  barsPlayed: number;
  notesPerBar: number;
  meanInterval: number;
  turnsPerNote: number;
  beatChordTones: number;
  offBeatEighths: number;
  inScale: number;
}

/** A tally of what the lead wrote, summed over bars. */
interface Tally {
  barsPlayed: number;
  notes: number;
  intervals: number;
  intervalSum: number;
  turns: number;
  onBeats: number;
  beatTones: number;
  offBeats: number;
  inScale: number;
}

const empty = (): Tally => ({
  barsPlayed: 0,
  notes: 0,
  intervals: 0,
  intervalSum: 0,
  turns: 0,
  onBeats: 0,
  beatTones: 0,
  offBeats: 0,
  inScale: 0,
});

const measures: Measure[] = [];
const examples: Record<
  string,
  { bpm: number; swing: MeterSwing; notes: (Omit<DoughNote, 'step'> & { step: number })[] }
> = {};
const totals = Object.fromEntries(MELODIC_SCALES.map((s) => [s, empty()])) as Record<
  MelodicScale,
  Tally
>;

for (const preset of PRESETS) {
  const style = { ...preset.style, entropy: 0.3 };
  const tallies = Object.fromEntries(MELODIC_SCALES.map((s) => [s, empty()])) as Record<
    MelodicScale,
    Tally
  >;
  for (const seed of SEEDS) {
    let carried = band.initial;
    const bars: BandBar[] = range(BARS).map((bar) => {
      const next = band.advance(
        {
          seed,
          bar,
          style,
          swing: presetSwing(preset)!,
          wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
          offer: null,
        },
        carried,
        null,
      );
      carried = next.carried;
      return next.output;
    });
    for (const scale of MELODIC_SCALES) {
      const t = tallies[scale];
      let leadCarried = lead.initial;
      for (const [bar, planned] of bars.entries()) {
        const env = { ...planned, plan: { ...planned.plan, melodic: scale } };
        const next = lead.advance(env, leadCarried, null);
        leadCarried = next.carried;
        const out = playBar(env, [
          ...planned.written.filter((n) => n.part !== 'lead'),
          ...next.output,
        ]);
        const notes = out.dough.filter((n) => n.part === 'lead');
        if (seed === EXAMPLE.seed && bar >= EXAMPLE.from && bar < EXAMPLE.to) {
          const name = `${preset.name} · ${scale}`;
          examples[name] ??= { bpm: style.bpm, swing: presetSwing(preset)!, notes: [] };
          for (const n of out.dough)
            if (n.part === 'lead' || n.part === 'bass' || n.part === 'pad')
              examples[name]!.notes.push({ ...n, step: (bar - EXAMPLE.from) * 16 + n.step });
        }
        if (notes.length === 0) continue;
        const inScale = new Set(positions(melodicHelix(env.plan.key, scale)));
        t.barsPlayed++;
        t.notes += notes.length;
        notes.forEach((n, i) => {
          if (inScale.has(wrap(n.note, 12))) t.inScale++;
          if (n.step % 4 === 0) {
            t.onBeats++;
            const tones = joinChord(chordAt(out.chords, n.step).chord).map((h) => wrap(h, 12));
            if (tones.includes(wrap(n.note, 12))) t.beatTones++;
          }
          if (n.step % 4 === 2) t.offBeats++;
          const before = notes[i - 1];
          if (!before) return;
          t.intervals++;
          t.intervalSum += Math.abs(n.note - before.note);
          const earlier = notes[i - 2];
          if (
            earlier &&
            Math.sign(n.note - before.note) * Math.sign(before.note - earlier.note) < 0
          )
            t.turns++;
        });
      }
    }
  }
  for (const scale of MELODIC_SCALES) {
    const t = tallies[scale];
    for (const k of Object.keys(t) as (keyof Tally)[]) totals[scale][k] += t[k];
    measures.push(measureOf(preset.name, scale, t));
  }
}

function measureOf(preset: string, scale: MelodicScale, t: Tally): Measure {
  return {
    preset,
    scale,
    barsPlayed: t.barsPlayed,
    notesPerBar: t.notes / Math.max(1, t.barsPlayed),
    meanInterval: t.intervalSum / Math.max(1, t.intervals),
    turnsPerNote: t.turns / Math.max(1, t.notes),
    beatChordTones: t.beatTones / Math.max(1, t.onBeats),
    offBeatEighths: t.offBeats / Math.max(1, t.notes),
    inScale: t.inScale / Math.max(1, t.notes),
  };
}

const f = (x: number, digits = 2) => x.toFixed(digits);
const row = (m: Measure) =>
  `${m.preset.padEnd(15)} ${m.scale.padEnd(10)} ${String(m.barsPlayed).padStart(4)}  ${f(m.notesPerBar).padStart(9)}  ${f(m.meanInterval).padStart(8)}  ${f(m.turnsPerNote).padStart(10)}  ${f(m.beatChordTones).padStart(16)}  ${f(m.offBeatEighths).padStart(13)}  ${f(m.inScale).padStart(8)}`;
console.log(
  'preset          scale      bars  notes/bar  interval  turns/note  beat chord tones  off-beat 8ths  in scale',
);
for (const m of measures) console.log(row(m));
console.log();
for (const scale of MELODIC_SCALES)
  console.log(row(measureOf('All presets', scale, totals[scale])));

const out = process.argv[2];
if (out) writeFileSync(out, JSON.stringify({ measures, examples, example: EXAMPLE }));
