/**
 * E20: does repetition confirm? The Muse's memory (#204 H8) and a phrase's
 * cells (#207 M1), measured (Q12).
 *
 * Players. Each of the yardstick's patterns (`humanise.ts`, E17) is played
 * by a hand in bar 1 and again in bar 3, an empty bar between, each playing
 * humanised on its own. The Muse hears both, and the second is recognised
 * if she hears it as the first (`recognise`). A stranger is another pattern
 * played in bar 3, which she should not hear as the first. Per sloppiness:
 *
 * - repeats: the share of second playings recognised, over the patterns
 *   whose exact playing is a motif;
 * - false alarms: the share of strangers recognised;
 * - read both: the share of repeats whose two playings were both read as
 *   the pattern exactly, which bounds what recognition can do.
 *
 * The lead. Every preset at entropy 0.3, 5 seeds, 64 bars: the lead's bars
 * heard as the Muse hears a player (`judgeBar`, exact), four at a time from
 * each section's start, split into cells and their order (`cellsOf`):
 *
 * - the phrases that join as one motif, and of those, how many bars are
 *   heard as an earlier cell, under which operator;
 * - the orders, most common first (`A A' A A'` is the lead's own plan: a
 *   shape, a variation, the shape, another variation).
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/recognition.ts
 */

import { fileURLToPath } from 'node:url';
import { type Motif, cellsOf, joinBars, orderText } from '@jambot/theory';
import {
  type HeardNote,
  type Judgement,
  type Key,
  type MuseCarried,
  PRESETS,
  SECTION_BARS,
  band,
  barStart,
  judgeBar,
  muse,
} from '../src/index.ts';
import { BAR, PATTERNS, TRIALS, humanise, pattern, played } from './humanise.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };
/** The bar a pattern is played again in: an empty bar after the first. */
const AGAIN = BAR + 2;

const motifIn = (judgements: readonly Judgement[]): Motif | null => {
  const j = judgements.find((x) => x.kind === 'motif');
  return j?.kind === 'motif' ? j.motif : null;
};
const same = (a: Motif | null, b: Motif | null) =>
  a !== null && b !== null && JSON.stringify(a) === JSON.stringify(b);
/** A motif as what was played, apart from how loudly. */
const plainly = (m: Motif | null) => m && { ...m, accents: undefined };

/** What the Muse heard of bars 0 to `AGAIN`: whether she recognised bar `AGAIN`, and each bar's motif. */
function hear(notes: readonly HeardNote[]): { recognised: boolean; motifs: (Motif | null)[] } {
  let carried: MuseCarried = muse.initial;
  let recognised = false;
  const motifs: (Motif | null)[] = [];
  for (let bar = 0; bar <= AGAIN; bar++) {
    const judgements = judgeBar(notes, bar, KEY);
    motifs.push(motifIn(judgements));
    const next = muse.advance({ bar }, carried, { judgements, forget: false });
    carried = next.carried;
    if (bar === AGAIN) recognised = next.output.recognised.length > 0;
  }
  return { recognised, motifs };
}

export interface Repetition {
  readonly sloppiness: number;
  readonly repeats: number;
  readonly recognised: number;
  readonly readBoth: number;
  readonly strangers: number;
  readonly falseAlarms: number;
}

/** E20 on the players at `sloppiness`: each pattern played twice, and once followed by another. */
export function repetition(sloppiness: number, seed = 1): Repetition {
  let repeats = 0;
  let recognised = 0;
  let readBoth = 0;
  let strangers = 0;
  let falseAlarms = 0;
  for (let index = 0; index < PATTERNS; index++) {
    const exact = played(pattern(index), BAR, index);
    const target = motifIn(judgeBar(exact, BAR, KEY, 'nearest'));
    if (!target) continue;
    const first = humanise(exact, sloppiness, seed, index * TRIALS);
    const again = humanise(
      played(pattern(index), AGAIN, index),
      sloppiness,
      seed,
      index * TRIALS + 1,
    );
    const heard = hear([...first, ...again]);
    repeats++;
    if (heard.recognised) recognised++;
    if (
      same(plainly(heard.motifs[BAR]!), plainly(target)) &&
      same(plainly(heard.motifs[AGAIN]!), plainly(target))
    )
      readBoth++;
    const other = (index + 1) % PATTERNS;
    const stranger = humanise(
      played(pattern(other), AGAIN, other),
      sloppiness,
      seed,
      index * TRIALS + 2,
    );
    const exactOther = motifIn(judgeBar(played(pattern(other), BAR, other), BAR, KEY, 'nearest'));
    // A stranger that is the same motif, as two patterns can be, is no stranger.
    if (!exactOther || same(plainly(exactOther), plainly(target))) continue;
    strangers++;
    if (hear([...first, ...stranger]).recognised) falseAlarms++;
  }
  return { sloppiness, repeats, recognised, readBoth, strangers, falseAlarms };
}

export interface LeadCells {
  /** Four-bar phrases heard, and those whose bars join as one motif. */
  readonly phrases: number;
  readonly joined: number;
  /** Bars after a phrase's first, and those heard as an earlier cell, as it was or under an operator. */
  readonly later: number;
  readonly repeated: number;
  readonly underOp: number;
  /** Each order and how many phrases have it, most common first. */
  readonly orders: readonly (readonly [string, number])[];
}

/** E20 on the lead: every preset at entropy 0.3 over `seeds` seeds and 64 bars. */
export function leadCells(seeds = 5): LeadCells {
  let phrases = 0;
  let joined = 0;
  let later = 0;
  let repeated = 0;
  let underOp = 0;
  const orders = new Map<string, number>();
  for (const preset of PRESETS)
    for (let seed = 1; seed <= seeds; seed++) {
      const style = { ...preset.style, entropy: 0.3 };
      let carried = band.initial;
      const motifs: (Motif | null)[] = [];
      for (let bar = 0; bar < 64; bar++) {
        const wish = { tonic: null, mode: preset.mode, melodic: null };
        const next = band.advance({ seed, bar, style, wish, offer: null }, carried, null);
        carried = next.carried;
        const heard: HeardNote[] = next.output.written
          .filter((n) => n.part === 'lead')
          .map((n) => ({
            note: n.note,
            velocity: 100,
            source: 'the lead',
            position: barStart(bar) + n.step,
            end: barStart(bar) + n.step + n.length,
          }));
        motifs.push(motifIn(judgeBar(heard, bar, next.output.plan.key, 'nearest')));
      }
      for (let start = 0; start + 4 <= 64; start += SECTION_BARS / 2) {
        const bars = motifs.slice(start, start + 4);
        if (bars.some((m) => m === null)) continue;
        phrases++;
        const phrase = joinBars(bars as Motif[]);
        const read = phrase && cellsOf(phrase, [16, 16, 16, 16]);
        if (!read) continue;
        joined++;
        later += read.order.length - 1;
        read.order.forEach(({ cell, op }, i) => {
          if (i === 0) return;
          const firstHeard = read.order.findIndex((o) => o.cell === cell);
          if (firstHeard < i) {
            repeated++;
            if (op.strans !== 0 || op.mirror || op.late !== 0 || op.rev) underOp++;
          }
        });
        const text = orderText(read.order);
        orders.set(text, (orders.get(text) ?? 0) + 1);
      }
    }
  return {
    phrases,
    joined,
    later,
    repeated,
    underOp,
    orders: [...orders].sort((a, b) => b[1] - a[1]),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pct = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(1)}%`;
  console.log('players: a pattern played twice, an empty bar between');
  console.log('sloppiness  repeats  recognised  read both  false alarms');
  for (const sloppiness of [0, 10, 20, 30, 40, 60]) {
    const r = repetition(sloppiness);
    console.log(
      `${String(sloppiness).padStart(5)} ms  ${String(r.repeats).padStart(7)}  ${pct(r.recognised, r.repeats).padStart(10)}  ${pct(r.readBoth, r.repeats).padStart(9)}  ${pct(r.falseAlarms, r.strangers).padStart(12)} of ${r.strangers}`,
    );
  }
  const lead = leadCells();
  console.log(`\nthe lead: ${lead.phrases} four-bar phrases, ${lead.joined} join as one motif`);
  console.log(
    `bars after the first heard as an earlier cell: ${pct(lead.repeated, lead.later)} (${lead.repeated} of ${lead.later}), under an operator ${pct(lead.underOp, lead.repeated)}`,
  );
  for (const [order, count] of lead.orders.slice(0, 10))
    console.log(`  ${order.padEnd(10)} ${pct(count, lead.joined)}`);
}
