/**
 * E10: how a bar's header states its style (#7, decision (f)).
 *
 * The header states the style a bar is composed from (T5). During a glide
 * that style is any float, so the header either writes the floats in full,
 * or the band reads its style on the grid the header writes, so that what
 * the header says is exactly what the band read. This runs the band over
 * the app's own glides, the presets changed every 8 bars with
 * `PRESET_GLIDE`, and measures each option:
 *
 * - full floats: the header's length, and that nothing changes;
 * - a grid of 2 or 3 decimals, read by the band: what changes against the
 *   band as it plays now, as written (T4's written notes) and as played,
 *   and by how much;
 * - a grid of 2 or 3 decimals written, but not read: the bars whose text
 *   no longer composes what played, the round trip's counterexamples.
 *
 * The band now reads its style on the 3-decimal grid itself (C7, decided
 * on #7 on these measurements), so its 3-decimal comparisons read zero; the
 * numbers from before the decision are in `docs/language-experiments.md`, E10.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/header.ts [out.json]
 */

import { writeFileSync } from 'node:fs';
import {
  AXIS_NAMES,
  type BandBar,
  type BandCarried,
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  type Style,
  band,
  glideTo,
  holding,
  styleAt,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;

/** The style at each bar's start: a new preset every 8 bars, glided to as the app does. */
const styles: Style[] = (() => {
  let track = holding(INITIAL_STYLE);
  return range(BARS).map((bar) => {
    if (bar % 8 === 0 && bar > 0) {
      const preset = PRESETS[(bar / 8) % PRESETS.length]!;
      track = glideTo(track, { ...preset.style }, bar * 16, PRESET_GLIDE);
    }
    return { ...styleAt(track, bar * 16), entropy: (bar % 32) / 32 };
  });
})();
const modeAt = (bar: number) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!.mode;

const onGrid = (style: Style, decimals: number): Style =>
  Object.fromEntries(
    AXIS_NAMES.map((axis) => [axis, Math.round(style[axis] * 10 ** decimals) / 10 ** decimals]),
  ) as Style;

/** The header's style, as `axis=value` pairs. */
const header = (style: Style, decimals?: number) =>
  AXIS_NAMES.map(
    (axis) =>
      `${axis}=${decimals === undefined ? String(style[axis]) : onGrid(style, decimals)[axis]}`,
  ).join(' ');

/** A run of the band, with the style each bar reads. */
const run = (seed: number, read: (style: Style) => Style): BandBar[] => {
  let carried: BandCarried = band.initial;
  return range(BARS).map((bar) => {
    const next = band.advance(
      {
        seed,
        bar,
        style: read(styles[bar]!),
        wish: { tonic: null, mode: modeAt(bar), melodic: null },
      },
      carried,
      null,
    );
    carried = next.carried;
    return next.output;
  });
};

const same = (a: readonly object[], b: readonly object[]) =>
  JSON.stringify(a) === JSON.stringify(b);

// Full floats: the header's size.
const lengths = styles.map((s) => header(s).length);
const grids = [2, 3].map((d) => styles.map((s) => header(s, d).length));
console.log("E10.1 the header's style, in characters (the app's glides, 64 bars)");
console.table({
  'full floats': { mean: mean(lengths), max: Math.max(...lengths) },
  '3 decimals': { mean: mean(grids[1]!), max: Math.max(...grids[1]!) },
  '2 decimals': { mean: mean(grids[0]!), max: Math.max(...grids[0]!) },
});
console.log('e.g. bar 19, full:', header(styles[19]!));
console.log('e.g. bar 19, 3 dp:', header(styles[19]!, 3));

function mean(xs: number[]) {
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

// The grid, read by the band, against the band as it plays now; and the
// grid written but not read, against what played.
interface Difference {
  seed: number;
  bar: number;
  now: BandBar;
  grid: BandBar;
}
const report: Record<string, unknown> = {};
const examples: Difference[] = [];
for (const decimals of [2, 3]) {
  let written = 0;
  let played = 0;
  let velocity = 0;
  let length = 0;
  let unread = 0;
  for (const seed of SEEDS) {
    const now = run(seed, (s) => s);
    const grid = run(seed, (s) => onGrid(s, decimals));
    // Written but not read: each bar composed from its rounded header, from
    // the state the band played it from.
    let carried: BandCarried = band.initial;
    now.forEach((b, bar) => {
      const fromText = band.advance(
        {
          seed,
          bar,
          style: onGrid(styles[bar]!, decimals),
          wish: { tonic: null, mode: modeAt(bar), melodic: null },
        },
        carried,
        null,
      );
      carried = band.advance(
        { seed, bar, style: styles[bar]!, wish: { tonic: null, mode: modeAt(bar), melodic: null } },
        carried,
        null,
      ).carried;
      if (!same(fromText.output.written, b.written)) unread++;
    });
    now.forEach((b, bar) => {
      const g = grid[bar]!;
      if (!same(b.written, g.written)) {
        written++;
        if (decimals === 3) examples.push({ seed, bar, now: b, grid: g });
      }
      if (!same(b.dough, g.dough)) played++;
      if (b.dough.length === g.dough.length && same(b.written, g.written))
        b.dough.forEach((e, i) => {
          velocity = Math.max(velocity, Math.abs(e.velocity - g.dough[i]!.velocity));
          length = Math.max(length, Math.abs(e.length - g.dough[i]!.length));
        });
    });
  }
  report[`${decimals} decimals`] = {
    'read: bars written otherwise': written,
    'read: bars played otherwise': played,
    'read: largest velocity change': velocity,
    'read: largest length change (steps)': Number(length.toFixed(4)),
    'unread: bars the text does not give back': unread,
  };
}
console.log(
  `\nE10.2 a style on the grid, against the band as it plays now (${SEEDS.length} seeds × ${BARS} bars)`,
);
console.table(report);

console.log('\nE10.3 the bars a 3-decimal grid writes otherwise');
for (const { seed, bar, now, grid } of examples) {
  const key = (n: { part: string; step: number; note: number }) => `${n.part}:${n.step}:${n.note}`;
  const a = new Set(now.written.map(key));
  const b = new Set(grid.written.map(key));
  const gone = [...a].filter((k) => !b.has(k));
  const added = [...b].filter((k) => !a.has(k));
  const axes = AXIS_NAMES.filter((axis) => styles[bar]![axis] !== onGrid(styles[bar]!, 3)[axis])
    .map((axis) => `${axis} ${styles[bar]![axis].toFixed(6)}→${onGrid(styles[bar]!, 3)[axis]}`)
    .join(', ');
  console.log(`seed ${seed} bar ${bar}: −[${gone.join(' ')}] +[${added.join(' ')}]  (${axes})`);
}

const out = process.argv[2];
if (out)
  writeFileSync(
    out,
    JSON.stringify({
      styles,
      headers: { bar: 19, full: header(styles[19]!), grid3: header(styles[19]!, 3) },
      lengths: { full: lengths, grid3: grids[1], grid2: grids[0] },
      report,
      examples: examples.map(({ seed, bar, now, grid }) => ({
        seed,
        bar,
        style: styles[bar],
        now: now.written,
        grid: grid.written,
      })),
    }),
  );
