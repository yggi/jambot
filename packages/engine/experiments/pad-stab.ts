/**
 * E11: pad and stab (#7, decision (g); #5, Q1d, R4).
 *
 * The comp plays pads, held through a chord, and stabs, short and
 * rhythmic. A stab may start on a note a pad is holding. On Web Audio each
 * note is its own voice, so both sound. On one MIDI channel the stab's
 * note-off ends the pad's note too. Pad and stab are two parts (L6, decided
 * on #7 on these measurements); the options are measured by putting the
 * two back on one channel. This runs the band over E1's shape (5 seeds, each preset
 * held and the tour, 64 bars each) and measures what each option keeps:
 *
 * - one channel, as MIDI lowers the part now: pads cut short by a stab's
 *   note-off, and how much of their time is lost;
 * - a join in the events, one note per pitch at a time: the stabs dropped
 *   where a pad holds their note;
 * - two parts, or two voices of one part lowered to two channels: nothing
 *   lost, and what each changes in the code and the text.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/pad-stab.ts [out.json]
 */

import { writeFileSync } from 'node:fs';
import {
  type BandCarried,
  type KeyWish,
  type NoteEvent,
  PRESETS,
  type Sound,
  band,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;

const runs: ((bar: number) => (typeof PRESETS)[number])[] = [
  ...PRESETS.map((preset) => () => preset),
  (bar) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!,
];

/** A note of the comp's two parts, on the song's step line. */
interface Sounding {
  part: 'pad' | 'stab';
  note: number;
  start: number;
  end: number;
  velocity: number;
}

let bars = 0;
let pads = 0;
let padSteps = 0;
let stabs = 0;
let cutPads = 0;
let lostSteps = 0;
let droppedStabs = 0;
let barsTouched = 0;
const withinPart = { pad: 0, stab: 0 };
let withinLost = 0;
/** The bar of the tour with the most stabs inside a pad, and the bars around it. */
let example: {
  seed: number;
  bar: number;
  overlaps: number;
  notes: Sounding[];
  /** Each bar's tempo and synth sound, from the bar before the example to the one after. */
  bars: { bpm: number; sound: Sound }[];
} | null = null;

for (const seed of SEEDS)
  runs.forEach((presetAt, r) => {
    let carried: BandCarried = band.initial;
    const song: Sounding[] = [];
    const sounds: { bpm: number; sound: Sound }[] = [];
    const touched = new Set<number>();
    for (const bar of range(BARS)) {
      const preset = presetAt(bar);
      const { output, carried: after } = band.advance(
        {
          seed,
          bar,
          style: { ...preset.style, entropy: (bar % 32) / 32 },
          wish: { tonic: null, mode: preset.mode } as KeyWish,
        },
        carried,
        null,
      );
      carried = after;
      bars++;
      sounds.push({ bpm: output.style.bpm, sound: output.sound });
      const comped = output.events.filter(
        (e: NoteEvent): e is NoteEvent & { part: 'pad' | 'stab' } =>
          e.part === 'pad' || e.part === 'stab',
      );
      for (const e of comped)
        song.push({
          part: e.part,
          note: e.note,
          start: bar * 16 + e.step,
          end: bar * 16 + e.step + e.length,
          velocity: e.velocity,
        });
    }
    if (r === runs.length - 1)
      for (const bar of range(BARS - 1).slice(1)) {
        const inside = (s: Sounding) =>
          song.some(
            (p) => p.part === 'pad' && p.note === s.note && s.start > p.start && s.start < p.end,
          );
        const overlaps = song.filter(
          (s) => s.part === 'stab' && Math.floor(s.start / 16) === bar && inside(s),
        ).length;
        if (!example || overlaps > example.overlaps)
          example = {
            seed,
            bar,
            overlaps,
            notes: song.filter((n) => n.end > bar * 16 - 16 && n.start < bar * 16 + 32),
            bars: sounds.slice(bar - 1, bar + 2),
          };
      }
    for (const pad of song.filter((n) => n.part === 'pad')) {
      pads++;
      padSteps += pad.end - pad.start;
      // Stabs on the pad's note that start while it sounds, in order.
      const inside = song
        .filter(
          (s) =>
            s.part === 'stab' && s.note === pad.note && s.start > pad.start && s.start < pad.end,
        )
        .sort((a, b) => a.start - b.start);
      droppedStabs += inside.length;
      const first = inside[0];
      if (first && first.end < pad.end) {
        cutPads++;
        lostSteps += pad.end - first.end;
        touched.add(Math.floor(pad.start / 16));
      }
    }
    stabs += song.filter((n) => n.part === 'stab').length;
    // Two parts on two channels: what is left is a note of one part that
    // starts while its own part still sounds that note.
    for (const a of song)
      for (const b of song)
        if (
          a !== b &&
          a.part === b.part &&
          a.note === b.note &&
          b.start > a.start &&
          b.start < a.end
        ) {
          withinPart[a.part]++;
          // The earlier note's note-off ends the later one on one channel.
          if (a.end < b.end) withinLost += b.end - a.end;
        }
    barsTouched += touched.size;
  });

const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(1)}%`;
console.log(
  `E11 pad and stab, ${bars} bars (${SEEDS.length} seeds × ${runs.length} runs × ${BARS} bars)`,
);
console.table({
  'one channel, pad and stab together (as before the split)': {
    'pads cut short': `${cutPads} of ${pads} (${pct(cutPads, pads)})`,
    'pad time lost': `${lostSteps.toFixed(0)} of ${padSteps} steps (${pct(lostSteps, padSteps)})`,
    'stabs dropped': 0,
    'bars that sound otherwise': barsTouched,
  },
  'a join in the events': {
    'pads cut short': 0,
    'pad time lost': 0,
    'stabs dropped': `${droppedStabs} of ${stabs} (${pct(droppedStabs, stabs)})`,
    'bars that sound otherwise': 'where a stab is dropped',
  },
  'two parts, or two voices on two channels (now)': {
    'pads cut short': 0,
    'pad time lost': 0,
    'stabs dropped': 0,
    'bars that sound otherwise': 0,
  },
});
console.log('\nWithin one part, a note that starts while the same note of that part sounds:');
console.table({
  pad: { notes: withinPart.pad },
  stab: { notes: withinPart.stab, 'steps a note-off would cut': withinLost.toFixed(1) },
});

const out = process.argv[2];
if (out)
  writeFileSync(
    out,
    JSON.stringify({
      bars,
      pads,
      padSteps,
      stabs,
      cutPads,
      lostSteps,
      droppedStabs,
      barsTouched,
      example,
    }),
  );
