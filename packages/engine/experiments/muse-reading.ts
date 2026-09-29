/**
 * E17: how well does the Muse read a sloppy hand? (#204, A0)
 *
 * Patterns of one dominant note value with mixed lengths and rests
 * (`humanise.ts`) are played exactly and then as a hand would, from 0 to
 * 100 ms of sloppiness at 120 bpm (a step is 125 ms), and `judgeBar` reads
 * each back. It asks, per sloppiness, what share of bars come back as the
 * motif the exact playing gives, what share have the right rhythm, and why
 * the others don't. This is the baseline every later reading (A1 to A6) is
 * measured against.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/muse-reading.ts
 */

import { BASELINE, BPM, readingRate, stepMs } from './humanise.ts';

const KEY = { tonic: 9, mode: 'aeolian' } as const;
const pct = (n: number, of: number) => `${((100 * n) / of).toFixed(1)}%`.padStart(6);

console.log(`step = ${stepMs()} ms at ${BPM} bpm`);
console.log('ms   bars   right  rhythm | strayed noMotif rests  moved  notes');
for (const sloppiness of [0, 10, 20, 30, 40, 50, 60, 80, 100]) {
  const r = readingRate(BASELINE, sloppiness, KEY);
  const c = r.causes;
  console.log(
    `${String(sloppiness).padStart(3)} ${String(r.bars).padStart(6)} ${pct(r.right, r.bars)} ${pct(r.rhythm, r.bars)} |` +
      ` ${pct(c.strayed, r.bars)} ${pct(c.noMotif, r.bars)} ${pct(c.rests, r.bars)} ${pct(c.moved, r.bars)} ${pct(c.notes, r.bars)}`,
  );
}
