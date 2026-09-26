/**
 * E9: what the port writes and what it plays (#7, round 3).
 *
 * Runs the band headless over E1's corpus shape: 5 seeds, each preset held
 * and a tour that changes preset every 8 bars, 64 bars each. It measures
 * three things the score text has to meet:
 *
 * 1. Lengths and velocities: how many distinct values each part plays, and
 *    how many lengths fall off a quarter step, as written and as played
 *    (T4, L2).
 * 2. The header's precision: a tour that glides between presets, each bar
 *    composed twice from the same carried state, once with its style
 *    rounded, and how many bars change, in what plays and in what is
 *    written (T4, T5).
 * 3. The chords part: duplicate note-ons, and a note started while the same
 *    note still sounds, as a stab inside a held pad (F5, Q1d, #5).
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/performance.ts
 */

import {
  type BandCarried,
  type BandEnv,
  type KeyWish,
  type NoteEvent,
  PRESETS,
  type Style,
  band,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const SEEDS = range(5);
const BARS = 64;

/** Each preset held, and the tour, as E1 runs them. */
const runs: ((bar: number) => (typeof PRESETS)[number])[] = [
  ...PRESETS.map((preset) => () => preset),
  (bar) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!,
];

const envOf = (seed: number, bar: number, style: Style, mode: KeyWish['mode']): BandEnv => ({
  seed,
  bar,
  style,
  wish: { tonic: null, mode },
});

// 1. Lengths and velocities, with each preset's style held.
const kind = (e: NoteEvent) => e.comp ?? e.part;
const parts = new Map<
  string,
  {
    events: number;
    lengths: Set<number>;
    offGrid: number;
    writtenOffGrid: number;
    velocities: Set<number>;
  }
>();
// 3. The chords part, over the same runs.
let bars = 0;
let duplicateBars = 0;
let overlapBars = 0;
let overlaps = 0;
let stabsInPads = 0;

for (const seed of SEEDS)
  for (const presetAt of runs) {
    let carried: BandCarried = band.initial;
    /** Chords notes still sounding into the next bar, in its steps. */
    let ringing: { note: number; start: number; end: number; comp?: string }[] = [];
    for (const bar of range(BARS)) {
      const preset = presetAt(bar);
      const style = { ...preset.style, entropy: (bar % 32) / 32 };
      const { output, carried: after } = band.advance(
        envOf(seed, bar, style, preset.mode),
        carried,
        null,
      );
      carried = after;
      bars++;

      output.events.forEach((e, i) => {
        const p = parts.get(kind(e)) ?? {
          events: 0,
          lengths: new Set(),
          offGrid: 0,
          writtenOffGrid: 0,
          velocities: new Set(),
        };
        p.events++;
        p.lengths.add(e.length);
        p.velocities.add(e.velocity);
        if (!Number.isInteger(e.length * 4)) p.offGrid++;
        if (!Number.isInteger(output.written[i]!.length * 4)) p.writtenOffGrid++;
        parts.set(kind(e), p);
      });

      const hits = output.events.map((e) => `${e.part}:${e.step}:${e.note}`);
      if (new Set(hits).size !== hits.length) duplicateBars++;

      const sounding = [
        ...ringing,
        ...output.events
          .filter((e) => e.part === 'chords')
          .map((e) => ({ note: e.note, start: e.step, end: e.step + e.length, comp: e.comp })),
      ];
      let overlapped = false;
      for (const a of sounding)
        for (const b of sounding)
          if (a !== b && a.note === b.note && b.start > a.start && b.start < a.end) {
            overlaps++;
            overlapped = true;
            if (a.comp === 'pad' && b.comp === 'stab') stabsInPads++;
          }
      if (overlapped) overlapBars++;
      ringing = sounding
        .filter((n) => n.end > 16)
        .map((n) => ({ ...n, start: -Infinity, end: n.end - 16 }));
    }
  }

console.log('E9.1 lengths and velocities, each preset held (5 seeds × 9 runs × 64 bars)');
console.table(
  Object.fromEntries(
    [...parts].map(([name, p]) => [
      name,
      {
        events: p.events,
        lengths: p.lengths.size,
        'played off a quarter step': p.offGrid,
        'written off a quarter step': p.writtenOffGrid,
        velocities: p.velocities.size,
      },
    ]),
  ),
);

// 2. The header's precision, over a tour that glides between presets.
const glidingStyle = (bar: number): Style => {
  const i = Math.floor(bar / 8);
  const from = PRESETS[i % PRESETS.length]!.style;
  const to = PRESETS[(i + 1) % PRESETS.length]!.style;
  const t = (bar % 8) / 8;
  const style = Object.fromEntries(
    Object.keys(from).map((axis) => {
      const a = axis as keyof typeof from;
      return [axis, lerp(from[a], to[a], t)];
    }),
  );
  return { ...style, entropy: (bar % 32) / 32 + 0.013 } as Style;
};
const rounded = (style: Style, decimals: number, only?: string): Style =>
  Object.fromEntries(
    Object.entries(style).map(([axis, v]) => [
      axis,
      only && axis !== only ? v : Math.round(v * 10 ** decimals) / 10 ** decimals,
    ]),
  ) as Style;

const heard = (notes: readonly object[]) =>
  notes
    .map((n) => JSON.stringify(n))
    .sort()
    .join();

const precision = (decimals: number, only?: string) => {
  let played = 0;
  let written = 0;
  for (const seed of SEEDS) {
    let carried: BandCarried = band.initial;
    for (const bar of range(BARS)) {
      const mode = PRESETS[Math.floor(bar / 8) % PRESETS.length]!.mode;
      const style = glidingStyle(bar);
      const exact = band.advance(envOf(seed, bar, style, mode), carried, null);
      const header = band.advance(
        envOf(seed, bar, rounded(style, decimals, only), mode),
        carried,
        null,
      );
      carried = exact.carried;
      if (heard(exact.output.events) !== heard(header.output.events)) played++;
      if (heard(exact.output.written) !== heard(header.output.written)) written++;
    }
  }
  return { 'played changes': played, 'written changes': written };
};

console.log(
  '\nE9.2 bars that change when the header rounds the style (5 seeds × 64 bars, gliding)',
);
console.table(Object.fromEntries([2, 3, 9].map((d) => [`${d} decimals`, precision(d)])));
console.table(
  Object.fromEntries(
    Object.keys(glidingStyle(0)).map((axis) => [`${axis} alone, 3 decimals`, precision(3, axis)]),
  ),
);

console.log('\nE9.3 the chords part');
console.table({
  bars,
  'bars with a duplicate note-on': duplicateBars,
  'bars where a note starts while it sounds': overlapBars,
  overlaps,
  'of them a stab inside a pad': stabsInPads,
});
