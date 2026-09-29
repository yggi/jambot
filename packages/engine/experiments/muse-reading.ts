/**
 * E17: how well does the Muse read a sloppy hand? (#204, H0)
 *
 * Patterns of one dominant note value with mixed lengths and rests
 * (`humanise.ts`) are played exactly and then as a hand would, from 0 to
 * 100 ms of sloppiness at 120 bpm (a step is 125 ms), and `judgeBar` reads
 * each back. It asks, per sloppiness, what share of bars come back as the
 * motif the exact playing gives, what share have the right rhythm, and why
 * the others don't. This is the baseline every later reading (H1 to H6) is
 * measured against.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/muse-reading.ts
 */

import {
  AS_HEARD,
  AS_PHRASES,
  BASELINE,
  beatPattern,
  choiceRate,
  judgedBars,
  pattern,
  BPM,
  phraseRate,
  readingRate,
  separation,
  stepMs,
} from './humanise.ts';

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

// H1 to H4 and H6: the same hands, playing two phrases of one to three bars with an empty bar between.
// The Muse's own judgement (`judgeBar`) reads a phrase so far, and no note of the bars after the one it judges.
console.log('\nphrases: bars right, notes on their steps, rests on theirs, notes strayed');
console.log(
  'ms     bars | nearest step | read whole, whole phrase known | judgeBar, phrase so far',
);
for (const [name, source] of [
  ['one dominant note value', pattern],
  ['beats that divide by themselves', beatPattern],
] as const) {
  console.log(`\n${name}`);
  for (const sloppiness of [0, 10, 20, 30, 40, 50, 60, 80, 100]) {
    const a = phraseRate(AS_HEARD, sloppiness, KEY, 1, source);
    const b = phraseRate(AS_PHRASES, sloppiness, KEY, 1, source);
    const c = phraseRate(AS_HEARD, sloppiness, KEY, 1, source, 'phrases');
    const row = (r: typeof a) =>
      `${pct(r.right, r.bars)} ${pct(r.onsets, r.bars)} ${pct(r.rests, r.bars)} ${pct(r.strayed, r.bars)}`;
    const rowNoStray = (r: typeof a) =>
      `${pct(r.right, r.bars)} ${pct(r.onsets, r.bars)} ${pct(r.rests, r.bars)}`;
    console.log(
      `${String(sloppiness).padStart(3)} ${String(a.bars).padStart(8)} | ${row(a)} | ${row(b)} | ${rowNoStray(c)}`,
    );
  }
}

// H5: does the confidence a judgement carries say whether it is right?
console.log(
  '\nconfidence of a bar read as a motif: mean, right share of the surest third and of the least sure, separation',
);
console.log('ms   bars   mean | surest third right | least sure right | separation');
for (const sloppiness of [10, 20, 30, 40, 60]) {
  const bars = judgedBars(sloppiness, KEY).sort((a, b) => b.confidence - a.confidence);
  const third = Math.floor(bars.length / 3);
  const share = (xs: typeof bars) => pct(xs.filter((b) => b.right).length, xs.length);
  const mean = bars.reduce((sum, b) => sum + b.confidence, 0) / bars.length;
  console.log(
    `${String(sloppiness).padStart(3)} ${String(bars.length).padStart(6)} ${mean.toFixed(2).padStart(6)} | ${share(bars.slice(0, third))} | ${share(bars.slice(-third))} | ${separation(bars).toFixed(3)}`,
  );
}

// H5: two players in one bar, and the motif the band takes: the most notes, or the surest reading.
console.log('\ntwo players, one bar: the motif taken is one read right');
console.log('A ms  B ms  pairs | most notes | surest reading');
for (const [a, b] of [
  [0, 40],
  [10, 30],
  [20, 40],
  [30, 30],
  [20, 60],
] as const) {
  const c = choiceRate(a, b, KEY);
  console.log(
    `${String(a).padStart(4)} ${String(b).padStart(5)} ${String(c.pairs).padStart(6)} | ${pct(c.byNotes, c.pairs)} | ${pct(c.bySureness, c.pairs)}`,
  );
}
