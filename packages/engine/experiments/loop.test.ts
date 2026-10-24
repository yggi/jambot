import { describe, expect, it } from 'vitest';
import { type Motif, motifProblems, recognise } from '@jambot/theory';
import {
  BY_LICENCE,
  type Condition,
  type LoopMeasure,
  VARIANTS,
  kendall,
  PAST,
  RATES,
  TRIMS,
  loopRun,
  loops,
  rateOf,
  timesVaried,
  trimmed,
  varyOffer,
} from './loop.ts';

// The numbers are literals, to be moved by the step that moves them.
/** E22 at entropy 0.3 over every preset, the narrowest licence first, one seed of 96 bars. */
const middle = loops(0.3, 1, 96);
/** The same at entropy 1, at the ends of the licence. */
const ENDS = [BY_LICENCE[0]!, BY_LICENCE.at(-1)!];
const wide = loops(1, 1, 96, ENDS);

const round = (x: number) => Math.round(x * 100) / 100;
/** The lead's notes a bar after the intro at p = 0, untrimmed and at k = 4, 3 and 2, in Techno and Swing jazz: as measured. */
const NOTES_AT_P0 = [
  [6, 4, 3, 2],
  [6, 4, 3, 2],
];
/** A measure of every preset in one condition, as measured. */
const exactly = (rows: readonly LoopMeasure[], condition: Condition, of: keyof LoopMeasure) =>
  rows.filter((m) => m.condition === condition).map((m) => m[of] as number);
/** The same, to two decimals. */
const column = (rows: readonly LoopMeasure[], condition: Condition, of: keyof LoopMeasure) =>
  exactly(rows, condition, of).map(round);

describe('the loop closed with no players, the Muse hearing the band’s own lead, E22 (#237)', () => {
  it('orders the presets by their licence, Techno’s the narrowest and Swing jazz’s the widest (E22)', () => {
    expect(BY_LICENCE.map((p) => p.name)).toEqual([
      'Techno',
      'Funk',
      'Ambient',
      'Synth-pop',
      'Deep house',
      'Lo-fi hip hop',
      'Bossa nova',
      'Swing jazz',
    ]);
  });

  it('hears the lead’s notes on the grid by the nearest step as the transport’s phrase reading hears them (E22)', () => {
    for (const condition of ['deaf', 'hearing'] as const)
      expect(loopRun(ENDS[0]!, 1, 0.3, 24, condition, 'nearest'), condition).toEqual(
        loopRun(ENDS[0]!, 1, 0.3, 24, condition, 'phrases'),
      );
  });

  it('judges every bar it runs, and none after (E22)', () => {
    const run = loopRun(ENDS[0]!, 1, 0.3, 24, 'hearing');
    expect(run).toHaveLength(24);
    // The lead rests in the intro, so the Muse judges its first bars silent.
    expect(run.slice(0, 8).every((b) => b.motif === null && b.heardAs === null)).toBe(true);
    expect(run.slice(8).every((b) => b.motif !== null)).toBe(true);
  });

  it('recognises nearly every bar once it hears itself, where deaf it recognises about half, and hears a third as many new motifs (E22, Q7b, Q12)', () => {
    expect(column(middle, 'deaf', 'recognised')).toEqual([
      0.57, 0.63, 0.55, 0.52, 0.56, 0.51, 0.53, 0.63,
    ]);
    expect(column(middle, 'hearing', 'recognised')).toEqual([
      0.93, 0.91, 0.84, 0.86, 0.93, 0.89, 0.92, 0.84,
    ]);
    expect(column(middle, 'deaf', 'novelty')).toEqual([
      3.08, 2.75, 1.08, 3.42, 3.17, 3.42, 2.83, 2.75,
    ]);
    expect(column(middle, 'hearing', 'novelty')).toEqual([0.5, 0.67, 1, 1, 0.5, 0.83, 0.58, 1.17]);
  });

  it('hears what it recognises of itself mostly as exact repeats, as it does deaf (E22, Q7b, Q12)', () => {
    expect(column(middle, 'hearing', 'exact')).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(column(middle, 'deaf', 'exact')).toEqual([
      0.84, 0.87, 0.88, 0.87, 0.92, 0.95, 0.89, 0.93,
    ]);
  });

  it('doesn’t stall on one bar, but oscillates: the first motif it heard on every other bar, a few others between (E22, Q7b)', () => {
    expect(column(middle, 'hearing', 'longestAny')).toEqual([5, 5, 1, 7, 9, 7, 3, 5]);
    expect(column(middle, 'hearing', 'stalled')).toEqual([0, 0, 0, 0, 0.1, 0, 0, 0]);
    expect(column(middle, 'hearing', 'oscillating')).toEqual([
      0.62, 0.49, 0.65, 0.44, 0.44, 0.59, 0.49, 0.38,
    ]);
    expect(column(middle, 'deaf', 'oscillating')).toEqual([
      0.28, 0.37, 0.45, 0.36, 0.36, 0.38, 0.35, 0.38,
    ]);
    expect(column(middle, 'hearing', 'commonest')).toEqual([
      0.59, 0.66, 0.5, 0.58, 0.6, 0.55, 0.54, 0.64,
    ]);
    expect(column(middle, 'deaf', 'commonest')).toEqual([
      0.28, 0.4, 0.52, 0.1, 0.33, 0.11, 0.13, 0.36,
    ]);
    expect(column(middle, 'hearing', 'firstHeld')).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(column(middle, 'deaf', 'firstHeld')).toEqual([1, 1, 0, 0, 1, 0, 0, 1]);
    // Deaf, the lead's own phrase puts its shape on a phrase's first and third bars too.
    expect(column(middle, 'deaf', 'oneParity')).toEqual([
      0.88, 0.8, 0.8, 0.89, 0.97, 0.89, 0.89, 0.88,
    ]);
    expect(column(middle, 'hearing', 'oneParity')).toEqual([
      0.85, 0.76, 1, 0.86, 0.83, 0.92, 0.94, 0.79,
    ]);
  });

  it('doesn’t drift: once it hears itself, half or more of its last section is heard as its first, where deaf, in most presets, none of it is (E22, Q7b)', () => {
    expect(column(middle, 'hearing', 'returns')).toEqual([
      0.63, 0.88, 0.88, 0.75, 0.88, 0.5, 0.88, 0.63,
    ]);
    expect(column(middle, 'deaf', 'returns')).toEqual([0, 0, 0.5, 0, 0, 0, 0, 0]);
    expect(column(middle, 'hearing', 'distinct')).toEqual([6, 6, 10, 9, 6, 9, 6, 10]);
    expect(column(middle, 'deaf', 'distinct')).toEqual([37, 31, 14, 45, 32, 41, 37, 31]);
  });

  it('recognises less as the entropy rises, deaf, but not monotonically less as the licence widens (E22, Q7b)', () => {
    const licence = BY_LICENCE.map((p) => p.style.harm);
    expect(round(kendall(licence, exactly(middle, 'deaf', 'recognised')))).toBe(-0.18);
    expect(round(kendall(licence, exactly(middle, 'hearing', 'recognised')))).toBe(-0.18);
    const at = (rows: readonly LoopMeasure[], condition: Condition) => [
      round(rows.find((m) => m.condition === condition && m.preset === 'Techno')!.recognised),
      round(rows.find((m) => m.condition === condition && m.preset === 'Swing jazz')!.recognised),
    ];
    expect([at(middle, 'deaf'), at(wide, 'deaf')]).toEqual([
      [0.57, 0.63],
      [0.46, 0.49],
    ]);
    expect([at(middle, 'hearing'), at(wide, 'hearing')]).toEqual([
      [0.93, 0.84],
      [0.89, 0.83],
    ]);
  });
});

describe('the variants: the lock is the delay’s, not the hold’s, E22 (#237)', () => {
  /** The variants at entropy 0.3, at the ends of the licence, one seed of 96 bars, with the deaf band beside them. */
  const sample = loops(0.3, 1, 96, ENDS, ['deaf', ...VARIANTS]);

  it('still locks without the hold: the first motif it heard is the commonest, all on bars of one parity (E22, Q7b)', () => {
    expect(column(sample, 'no hold', 'firstHeld')).toEqual([1, 1]);
    expect(column(sample, 'no hold', 'oneParity')).toEqual([1, 1]);
    expect(column(sample, 'no hold', 'recognised')).toEqual([0.93, 0.89]);
    expect(column(sample, 'hearing', 'recognised')).toEqual([0.93, 0.84]);
  });

  it('recognises less and repeats less exactly when the lead varies an offer on its phrase’s second and fourth bars, but the first motif still holds the other bars (E22, Q7b)', () => {
    expect(column(sample, 'varied', 'recognised')).toEqual([0.78, 0.76]);
    expect(column(sample, 'varied', 'exact')).toEqual([0.81, 0.9]);
    expect(column(sample, 'varied', 'distinct')).toEqual([19, 20]);
    expect(column(sample, 'varied', 'firstHeld')).toEqual([1, 1]);
    expect(column(sample, 'varied, no hold', 'firstHeld')).toEqual([1, 1]);
  });

  it('breaks the lock when the lead varies an offer on every bar: no first motif held, no return, and what it recognises about half under an operator (E22, Q7b, Q12)', () => {
    for (const condition of ['every bar', 'every bar, no hold'] as const) {
      expect(column(sample, condition, 'firstHeld'), condition).toEqual([0, 0]);
      expect(column(sample, condition, 'returns'), condition).toEqual([0, 0]);
    }
    expect(column(sample, 'every bar', 'recognised')).toEqual([0.63, 0.58]);
    expect(column(sample, 'every bar', 'exact')).toEqual([0.48, 0.49]);
    expect(column(sample, 'every bar', 'oscillating')).toEqual([0.15, 0.15]);
    expect(column(sample, 'every bar', 'commonest')).toEqual([0.14, 0.1]);
    // Deaf, beside it: recognised about as much, but nearly all exactly, and oscillating more.
    expect(column(sample, 'deaf', 'recognised')).toEqual([0.57, 0.63]);
    expect(column(sample, 'deaf', 'exact')).toEqual([0.84, 0.93]);
    expect(column(sample, 'deaf', 'oscillating')).toEqual([0.28, 0.38]);
  });
});

describe('the rate the lead varies an offer at, p (E22, #237)', () => {
  it('varies it ⌊p⌋ times a bar, and once more by the chance of the rest', () => {
    const times = (p: number) => [...Array(400).keys()].map((bar) => timesVaried(`p=${p}`, 1, bar));
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(new Set(times(0))).toEqual(new Set([0]));
    expect(new Set(times(1))).toEqual(new Set([1]));
    expect(new Set(times(2))).toEqual(new Set([2]));
    expect(new Set(times(1.5))).toEqual(new Set([1, 2]));
    for (const p of [0.25, 0.5, 0.75, 1.5]) expect(mean(times(p)), `p=${p}`).toBeCloseTo(p, 1);
  });

  it('recognises less and oscillates less as p rises, from the locked loop to below the deaf band at two variations a bar (E22, Q7b)', () => {
    /** The rates at entropy 0.3, at the ends of the licence, one seed of 96 bars. */
    const sample = loops(0.3, 1, 96, ENDS, RATES);
    const rates = RATES.map((r) => Number(r.slice(2)));
    const along = (field: keyof LoopMeasure) =>
      ENDS.map((p) =>
        RATES.map((r) => {
          const m = sample.find((m) => m.preset === p.name && m.condition === r)!;
          return Math.round(100 * (m[field] as number)) / 100;
        }),
      );
    expect(along('recognised')).toEqual([
      [0.93, 0.72, 0.66, 0.65, 0.63, 0.55, 0.43],
      [0.84, 0.67, 0.66, 0.63, 0.58, 0.56, 0.39],
    ]);
    expect(along('oscillating')).toEqual([
      [0.62, 0.25, 0.28, 0.17, 0.15, 0.08, 0.08],
      [0.38, 0.29, 0.3, 0.2, 0.15, 0.08, 0.04],
    ]);
    for (const shares of along('recognised')) expect(kendall(rates, shares)).toBe(-1);
    // A quarter of the bars varied at random reaches both of the delay's chains: the first motif no longer holds Techno.
    expect(along('firstHeld')).toEqual([
      [1, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0],
    ]);
  });

  it('is the conditions it generalises at its ends: p=0 plays as hearing, p=1 as every bar (E22)', () => {
    const [narrow] = ENDS;
    expect(loopRun(narrow!, 1, 0.3, 32, 'p=0')).toEqual(loopRun(narrow!, 1, 0.3, 32, 'hearing'));
    expect(loopRun(narrow!, 1, 0.3, 32, 'p=1')).toEqual(loopRun(narrow!, 1, 0.3, 32, 'every bar'));
  });
});

describe('the offer trimmed to its first k notes, E22 (#237)', () => {
  /** The sounding notes of a motif, each its onset and its degree. */
  const sounding = (m: Motif) =>
    m.onsets.flatMap((at, i) => (m.degrees[i] === null ? [] : [[at, m.degrees[i]]]));
  /** Every motif of 1 to 15 notes on a bar of 16 steps, one note a step, with a rest before them, after them, or neither (a rest at both ends would follow itself round the cycle). */
  const shapes = [...Array(15).keys()].flatMap((i) =>
    [
      [0, 0],
      [1, 0],
      [0, 1],
    ].map(([before, after]): Motif => {
      const n = i + 1;
      const onsets = [...Array(before! + n + after!).keys()];
      const degrees = onsets.map((j) => (j < before! || j >= before! + n ? null : (j * 3) % 7));
      return { cycle: 16, onsets, degrees, accidentals: onsets.map(() => 0) };
    }),
  );

  it('keeps exactly the first k notes, for every k from 1 to 16 and every motif of 1 to 15 notes, with a rest before or after or neither', () => {
    expect(shapes).toHaveLength(45);
    for (const shape of shapes) expect(motifProblems(shape), JSON.stringify(shape)).toEqual([]);
    for (const shape of shapes)
      for (let k = 1; k <= 16; k++) {
        const trim = trimmed(shape, k);
        const label = `${JSON.stringify(shape.degrees)} k=${k}`;
        expect(motifProblems(trim), label).toEqual([]);
        expect(sounding(trim), label).toEqual(sounding(shape).slice(0, k));
      }
  });

  it('leaves the motif as it is when k is unbounded', () => {
    for (const shape of shapes) expect(trimmed(shape, Infinity)).toBe(shape);
  });

  it('reads a condition’s rate and trim, k unbounded where none is named', () => {
    expect(rateOf('p=0')).toEqual({ p: 0, k: Infinity });
    expect(rateOf('p=1.5')).toEqual({ p: 1.5, k: Infinity });
    expect(rateOf('p=1 k=3')).toEqual({ p: 1, k: 3 });
    expect(rateOf('hearing')).toBeNull();
    expect(TRIMS).toEqual(['p=0 k=2', 'p=0 k=3', 'p=0 k=4', 'p=1 k=2', 'p=1 k=3', 'p=1 k=4']);
    expect(PAST).toEqual(['p=2.5', 'p=3', 'p=4']);
  });

  it('varies a trimmed offer as often as its rate does, the trim drawing nothing', () => {
    for (const trim of TRIMS) {
      const rate = `p=${rateOf(trim)!.p}` as const;
      for (let bar = 0; bar < 64; bar++)
        expect(timesVaried(trim, 1, bar), `${trim} bar ${bar}`).toBe(timesVaried(rate, 1, bar));
    }
  });

  it('plays as its rate when k is past any motif’s notes: p=0 k=16 as hearing, p=1 k=16 as every bar (E22)', () => {
    const [narrow] = ENDS;
    expect(loopRun(narrow!, 1, 0.3, 32, 'p=0 k=16')).toEqual(
      loopRun(narrow!, 1, 0.3, 32, 'hearing'),
    );
    expect(loopRun(narrow!, 1, 0.3, 32, 'p=1 k=16')).toEqual(
      loopRun(narrow!, 1, 0.3, 32, 'every bar'),
    );
  });

  it('thins the lead as k falls, with no variation at p=0 (E22, #237)', () => {
    /** The trims at p = 0, at the ends of the licence, one seed of 96 bars, beside p = 0 untrimmed. */
    const sample = loops(0.3, 1, 96, ENDS, ['p=0', 'p=0 k=4', 'p=0 k=3', 'p=0 k=2']);
    const notes = ENDS.map((p) =>
      sample.filter((m) => m.preset === p.name).map((m) => round(m.leadNotes)),
    );
    for (const row of notes) expect([...row].sort((a, b) => b - a)).toEqual(row);
    expect(notes).toEqual(NOTES_AT_P0);
  });

  it('opens the loop at k = 2: two notes fall under the Muse’s gate of three, so she judges almost no bar a motif and the lead holds what it was offered (E22, #237)', () => {
    const sample = loops(0.3, 1, 96, ENDS, ['p=0 k=2', 'p=1 k=2', 'p=1 k=3']);
    expect(column(sample, 'p=0 k=2', 'playing')).toEqual([0.02, 0.02]);
    expect(column(sample, 'p=1 k=2', 'playing')).toEqual([0.02, 0.02]);
    expect(column(sample, 'p=0 k=2', 'leadNotes')).toEqual([2, 2]);
    expect(column(sample, 'p=1 k=3', 'playing')).toEqual([0.72, 0.72]);
    expect(column(sample, 'p=1 k=3', 'recognised')).toEqual([0.68, 0.71]);
  });
});

describe('the rates past two variations a bar, E22 (#237)', () => {
  it('hears fewer bars as motifs and recognises less of them as p rises past 2 (E22, Q7b)', () => {
    const rates = ['p=2', ...PAST] as const;
    const sample = loops(0.3, 1, 96, ENDS, rates);
    const along = (field: keyof LoopMeasure) =>
      ENDS.map((p) =>
        rates.map((r) =>
          round(sample.find((m) => m.preset === p.name && m.condition === r)![field] as number),
        ),
      );
    expect(along('playing')).toEqual([
      [0.71, 0.61, 0.52, 0.39],
      [0.72, 0.6, 0.46, 0.35],
    ]);
    expect(along('recognised')).toEqual([
      [0.43, 0.42, 0.46, 0.22],
      [0.39, 0.45, 0.45, 0.29],
    ]);
    for (const shares of along('playing')) expect(kendall([2, 2.5, 3, 4], shares)).toBe(-1);
  });
});

describe('an offered motif varied as the lead varies its own shapes (E22)', () => {
  const shape: Motif = {
    cycle: 16,
    onsets: [0, 4, 8, 12],
    degrees: [0, 2, 4, 3],
    accidentals: [0, 0, 0, 0],
  };
  const same = (a: Motif, b: Motif) =>
    JSON.stringify([a.onsets, a.degrees, a.accidentals]) ===
    JSON.stringify([b.onsets, b.degrees, b.accidentals]);

  it('turns it over, lifts it, bends its last note or drops it, each by a draw of the bar, and keeps it a motif', () => {
    const ways = new Set<string>();
    for (let bar = 0; bar < 200; bar++) {
      const varied = varyOffer(shape, 1, bar, 0);
      expect(motifProblems(varied), `bar ${bar}`).toEqual([]);
      expect(varyOffer(shape, 1, bar, 0)).toEqual(varied);
      const op = recognise(varied, shape);
      if (op?.mirror) ways.add('turned over');
      else if (op && op.strans === 2) ways.add('lifted');
      else if (varied.degrees.filter((d) => d !== null).length < 4) ways.add('dropped');
      else if (!same(varied, shape) && varied.degrees.slice(0, 3).join() === '0,2,4')
        ways.add('bent');
    }
    expect([...ways].sort()).toEqual(['bent', 'dropped', 'lifted', 'turned over']);
  });

  it('nudges one note after the first a degree, by chance, as the entropy rises', () => {
    const nudged = (entropy: number) =>
      [...Array(200).keys()].filter((bar) => {
        const varied = varyOffer(shape, 1, bar, entropy);
        return (
          varied.degrees[0] === 0 &&
          recognise(varied, shape) === null &&
          varied.degrees.length === 4
        );
      }).length;
    expect(nudged(0)).toBeLessThan(nudged(1));
  });
});

describe('Kendall’s tau (E22)', () => {
  it('is 1 for lists that rise together, -1 for one that falls as the other rises, and 0 for none (E22)', () => {
    expect(kendall([1, 2, 3], [4, 5, 9])).toBe(1);
    expect(kendall([1, 2, 3], [9, 5, 4])).toBe(-1);
    expect(kendall([1, 2, 3], [5, 4, 6])).toBeCloseTo(1 / 3);
    expect(kendall([1, 2, 3], [5, 5, 5])).toBe(0);
  });
});
