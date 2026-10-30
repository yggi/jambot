/**
 * E15: are the band's onsets relative to the meter? (#123, #116 question (k))
 *
 * Pitch is relative: a note is a degree of its chord, the chord a degree of
 * the key (P1). Every onset the parts write is a step of the bar's 16. The
 * time twin of P1 would write an onset as a degree of the meter: a beat, or
 * an eighth of the meter composed onto the steps, with the step grid below
 * reachable as the chromatic circle is below a key.
 *
 * This runs the band over E1's shape (5 seeds, each preset held and the
 * tour, 64 bars each) and asks:
 *
 * 1. of each part's onsets, and each drum role's, how many fall on a beat,
 *    on an eighth between beats, or only on the step grid;
 * 2. of each part's line in a bar, whether its onsets are all beats, all
 *    eighths, or need the grid, which is how many slots the line needs: 4,
 *    8 or 16 in 4/4;
 * 3. of the named rhythms the parts draw on, which are helices composed
 *    onto the meter and which only onto the grid;
 * 4. how many tokens a line takes in slots, as mini-notation writes a
 *    drum line: 16 on the grid, against 4 on the beats or 8 on the
 *    eighths, where an onset between two eighths is the eighth's degree
 *    altered by a step, one token, and an eighth that holds two onsets
 *    takes one token more.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/onsets.ts
 */

import { compose, even, positions } from '@jambot/theory';
import {
  presetMode,
  BEATS,
  type BandCarried,
  type KeyWish,
  PROTOTYPE_PRESETS,
  band,
  presetSwing,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;
const runs: ((bar: number) => (typeof PROTOTYPE_PRESETS)[number])[] = [
  ...PROTOTYPE_PRESETS.map((preset) => () => preset),
  (bar) => PROTOTYPE_PRESETS[Math.floor(bar / 8) % PROTOTYPE_PRESETS.length]!,
];

/** The meter's eighths on the steps: every other step, the beats among them. */
const EIGHTHS = compose(even(8, 8), even(8, 16));
const beats = new Set(positions(BEATS));
const eighths = new Set(positions(EIGHTHS));
type Level = 'beat' | 'eighth' | 'grid';
const levelOf = (step: number): Level =>
  beats.has(step) ? 'beat' : eighths.has(step) ? 'eighth' : 'grid';
const LEVELS: Level[] = ['beat', 'eighth', 'grid'];

const onsets = new Map<string, Record<Level, number>>();
const lines = new Map<string, Record<Level, number>>();
/** Tokens a line takes: on the grid, and relative to the meter. */
const tokens = new Map<string, { lines: number; grid: number; meter: number }>();
const count = (table: Map<string, Record<Level, number>>, key: string, level: Level) => {
  const row = table.get(key) ?? { beat: 0, eighth: 0, grid: 0 };
  row[level]++;
  table.set(key, row);
};

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
          // The level is asked a bar ahead: a section's plan takes it on the bar before (#360).
          swing: {
            level: presetSwing(presetAt(bar + 1))!.level,
            share: presetSwing(preset)!.share,
          },
          wish: { tonic: null, mode: presetMode(preset)!, melodic: null } as KeyWish,
          offer: null,
        },
        carried,
        null,
      );
      carried = after;
      const byLine = new Map<string, Set<number>>();
      for (const note of output.written) {
        const line = note.part === 'drums' ? `drums:${note.role}` : note.part;
        count(onsets, line, levelOf(note.step));
        byLine.set(line, (byLine.get(line) ?? new Set()).add(note.step));
      }
      for (const [line, steps] of byLine) {
        const levels = [...steps].map(levelOf);
        const finest = levels.includes('grid')
          ? 'grid'
          : levels.includes('eighth')
            ? 'eighth'
            : 'beat';
        count(lines, line, finest);
        const both = [...steps].filter((s) => eighths.has(s) && steps.has(s + 1)).length;
        const row = tokens.get(line) ?? { lines: 0, grid: 0, meter: 0 };
        row.lines++;
        row.grid += 16;
        row.meter += finest === 'beat' ? 4 : 8 + both;
        tokens.set(line, row);
      }
    }
  }

const pct = (x: number, of: number) => `${((100 * x) / of).toFixed(1)}%`.padStart(7);
const table = (title: string, rows: Map<string, Record<Level, number>>) => {
  console.log(`\n${title}`);
  console.log(`${''.padEnd(16)}${'count'.padStart(7)}${LEVELS.map((l) => l.padStart(7)).join('')}`);
  const total: Record<Level, number> = { beat: 0, eighth: 0, grid: 0 };
  for (const [key, row] of [...rows].sort(([a], [b]) => a.localeCompare(b))) {
    const n = LEVELS.reduce((sum, l) => sum + row[l], 0);
    for (const l of LEVELS) total[l] += row[l];
    console.log(
      `${key.padEnd(16)}${String(n).padStart(7)}${LEVELS.map((l) => pct(row[l], n)).join('')}`,
    );
  }
  const n = LEVELS.reduce((sum, l) => sum + total[l], 0);
  console.log(
    `${'all'.padEnd(16)}${String(n).padStart(7)}${LEVELS.map((l) => pct(total[l], n)).join('')}`,
  );
};

table('1. Onsets, by the level they fall on', onsets);
table('2. Lines (a part in a bar), by the finest level they need: 4, 8 or 16 slots', lines);

console.log('\n3. Named rhythms the parts draw on');
const onMeter = (steps: number[]) =>
  steps.every((s) => beats.has(s))
    ? 'beats'
    : steps.every((s) => eighths.has(s))
      ? 'eighths'
      : 'grid';
const named: [string, number[]][] = [
  ['four on the floor', [0, 4, 8, 12]],
  ['backbeat', [4, 12]],
  ['offbeat hats', [2, 6, 10, 14]],
  ...[3, 5, 7].flatMap((k) =>
    range(4).map((r): [string, number[]] => [`E(${k},16) rotated ${r}`, positions(even(k, 16, r))]),
  ),
];
for (const [name, steps] of named) console.log(`${name.padEnd(22)}${onMeter(steps)}`);

console.log('\n4. Tokens a line takes in slots: on the grid, and relative to the meter');
let grid = 0;
let meter = 0;
for (const [line, row] of [...tokens].sort(([a], [b]) => a.localeCompare(b))) {
  grid += row.grid;
  meter += row.meter;
  console.log(
    `${line.padEnd(16)}${(row.grid / row.lines).toFixed(1).padStart(7)}${(row.meter / row.lines).toFixed(1).padStart(7)}${pct(row.meter, row.grid)}`,
  );
}
console.log(`${'all'.padEnd(16)}${''.padStart(14)}${pct(meter, grid)}`);
