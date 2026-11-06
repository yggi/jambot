/**
 * E17's hands of #580, as a table: the share of bars read right by a steady
 * latency and a jitter, for each kind of pattern, by the nearest step, by a
 * phrase read whole and by the Muse's own judgement. Run with
 * `node --experimental-strip-types --no-warnings packages/engine/experiments/hands.ts`.
 */
import type { Key } from '../src/index.ts';
import {
  AS_HEARD,
  AS_PHRASES,
  type Segment,
  beatPattern,
  beginnerPattern,
  handRate,
  pattern,
  syncopatedPattern,
} from './humanise.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };
const SOURCES: [string, (i: number) => Segment[]][] = [
  ['one value', pattern],
  ['beats', beatPattern],
  ['beginner', beginnerPattern],
  ['syncopated', syncopatedPattern],
];
const pct = (n: number, of: number) => `${((100 * n) / of).toFixed(1)}`;

for (const jitterMs of [10, 20]) {
  console.log(`\njitter ${jitterMs} ms: bars right, nearest / phrase / the Muse's judgement`);
  console.log(['late ms', ...SOURCES.map(([name]) => name)].join(' | '));
  for (const lateMs of [0, 20, 40, 60, 70, 80, 100, 120]) {
    const cells = SOURCES.map(([, source]) => {
      const hand = { lateMs, jitterMs };
      const near = handRate(AS_HEARD, hand, KEY, 1, source);
      const whole = handRate(AS_PHRASES, hand, KEY, 1, source);
      const muse = handRate(AS_HEARD, hand, KEY, 1, source, 'phrases');
      return `${pct(near.right, near.bars)} / ${pct(whole.right, whole.bars)} / ${pct(muse.right, muse.bars)}`;
    });
    console.log([lateMs, ...cells].join(' | '));
  }
}
