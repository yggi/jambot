/**
 * #580 rung 6's yardstick as a table: one hand a session, eight phrases, its one latency and jitter, bars right
 * without the hand's memory and with it, over all the phrases and over those from the third on. Run with
 * `node --experimental-strip-types --no-warnings packages/engine/experiments/sessions.ts`.
 */
import type { Key } from '../src/index.ts';
import {
  beatPattern,
  beginnerPattern,
  pattern,
  sessionRate,
  syncopatedPattern,
} from './humanise.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };
const MIX = [pattern, beatPattern, beginnerPattern, syncopatedPattern];
const pct = (n: number, of: number) => ((100 * n) / of).toFixed(1);
for (const jitterMs of [10, 20, 30]) {
  console.log(
    `\njitter ${jitterMs} ms: bars right, without memory / with it (all phrases; from the third)`,
  );
  for (const lateMs of [-60, 0, 40, 70, 90, 100, 120, 150, 180]) {
    const hand = { lateMs, jitterMs };
    const a = sessionRate(hand, KEY, MIX, false);
    const b = sessionRate(hand, KEY, MIX, true);
    console.log(
      `${lateMs} ms | ${pct(a.right, a.bars)} / ${pct(b.right, b.bars)} | later ${pct(a.laterRight, a.laterBars)} / ${pct(b.laterRight, b.laterBars)}`,
    );
  }
}
