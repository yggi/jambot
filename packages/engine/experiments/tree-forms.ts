/**
 * E27: the bass bar as a fold of one tree over its 16 steps (#275 step 1)
 *
 * The score writes a bass bar as pairs, `0=0 4=0 7=7` (a step and a pitch
 * above the chord's root, `^` the octave above the nearest to the register
 * carried). #275 designs two other spellings of the same bar, both folds of
 * one tree over the bar's steps:
 *
 * - dense: one token per cell of the coarsest power-of-two level (1, 2, 4, 8
 *   or 16 cells) that holds every onset, a pitch token where a note starts and
 *   `_` where none does;
 * - collapsed: the smallest term of a small mini-notation, found by an exact
 *   search over the dense row. Its pieces: words in a sequence split their span
 *   evenly (k words over n steps where k divides n); `a@w` weights, as a
 *   sequence whose words span unequal multiples of one unit; `x*m` and
 *   `[...]*m` tiling; `x!m` replication of a word; and Euclid, `x(k,n,rot)`,
 *   for a span whose onsets are `even(k, n, rot)` of one pitch.
 *
 * Cost is the number of atoms (a pitch token or `_`) a term writes: brackets
 * and the suffixes `*`, `!`, `@` and `(k,n,rot)` attach to a token and are not
 * counted, so a whitespace-separated word count is the same number.
 *
 * Every minimal term is printed, read back by a separate small parser and
 * expanded to 16 cells, and must equal the dense row at 16 steps:
 * expand(collapse(x)) = x, checked for every bar. Terms that split a span by
 * `even(k, n)` where k does not divide n (question 4) are costed only, not
 * printed or expanded.
 *
 * The corpus is E1's shape: 5 seeds, each preset held and the tour, 64 bars
 * each. It is the engine's own bass, not captured music.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/tree-forms.ts
 */

import { even, wrap } from '@jambot/theory';
import {
  type BandCarried,
  type KeyWish,
  PRESETS,
  band,
  chordAt,
  presetSwing,
} from '../src/index.ts';
import { nearest } from '../src/bass.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;
const STEPS = 16;
const REST = '_';
const runs: ((bar: number) => (typeof PRESETS)[number])[] = [
  ...PRESETS.map((preset) => () => preset),
  (bar) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!,
];

// ---- the terms, their minimiser and their expander --------------------------------------------

type Term =
  | { kind: 'atom'; token: string }
  | { kind: 'euclid'; token: string; k: number; n: number; shift: number }
  | { kind: 'tile'; times: number; body: Term }
  | { kind: 'seq'; words: { term: Term; weight: number; repeat: number }[] };

const divisors = (n: number) =>
  range(n)
    .map((i) => i + 1)
    .filter((d) => n % d === 0);

interface Found {
  cost: number;
  term: Term;
}

/** What a minimiser may use: weights (`@`), the relaxed even splits of question 4, or neither. */
interface Options {
  weights: boolean;
  evenSplits: boolean;
}

/** The smallest term for a row, exact: a memoised search over every way the pieces fold it. */
function minimiser(options: Options) {
  const memo = new Map<string, Found>();
  const find = (row: readonly string[]): Found => {
    const key = row.join(' ');
    const known = memo.get(key);
    if (known) return known;
    const span = row.length;
    let best: Found | undefined;
    const offer = (cost: number, term: Term) => {
      if (!best || cost < best.cost) best = { cost, term };
    };

    // An atom: one pitch at the span's start and nothing after, or a rest all through.
    const onsets = row.flatMap((x, i) => (x === REST ? [] : [i]));
    if (onsets.length === 0) offer(1, { kind: 'atom', token: REST });
    else if (onsets.length === 1 && onsets[0] === 0) offer(1, { kind: 'atom', token: row[0]! });

    // Euclid: one pitch on `even(k, n, shift)` of n cells, n dividing the span.
    if (onsets.length > 0 && new Set(onsets.map((i) => row[i])).size === 1)
      for (const n of divisors(span)) {
        const cell = span / n;
        if (onsets.some((i) => i % cell !== 0)) continue;
        const cells = onsets.map((i) => i / cell);
        const k = cells.length;
        for (let shift = 0; shift < n; shift++) {
          const set = even(k, n, shift).heights;
          if (set.length === k && set.every((h, j) => h === [...cells].sort((a, b) => a - b)[j]))
            offer(1, { kind: 'euclid', token: row[onsets[0]!]!, k, n, shift });
        }
      }

    // Tiling: a period repeated m times.
    for (const m of divisors(span)) {
      if (m === 1) continue;
      const period = span / m;
      if (row.every((x, i) => x === row[i % period])) {
        const inner = find(row.slice(0, period));
        offer(inner.cost, { kind: 'tile', times: m, body: inner.term });
      }
    }

    // A sequence: W units of span / W steps, cut into words, equal ones with `!`.
    for (const W of divisors(span)) {
      if (W === 1) continue;
      const unit = span / W;
      const slice = (a: number, b: number) => row.slice(a * unit, b * unit);
      const same = (a: number, b: number, length: number) =>
        slice(a, a + length).join(' ') === slice(b, b + length).join(' ');
      // best[i]: the cheapest cover of the first i units.
      const cover: (Found & { words: { term: Term; weight: number; repeat: number }[] })[] = [];
      cover[0] = { cost: 0, term: { kind: 'seq', words: [] }, words: [] };
      for (let i = 0; i < W; i++) {
        const here = cover[i];
        if (!here) continue;
        for (let length = 1; i + length <= W; length++) {
          if (!options.weights && length > 1) break;
          if (i === 0 && length === W) continue; // the whole span in one word is the term itself
          const word = find(slice(i, i + length));
          let repeat = 1;
          while (true) {
            const j = i + repeat * length;
            if (!(i === 0 && j === W && repeat === 1)) {
              const cost = here.cost + word.cost;
              const words = [...here.words, { term: word.term, weight: length, repeat }];
              if (!cover[j] || cost < cover[j]!.cost)
                cover[j] = { cost, term: { kind: 'seq', words }, words };
            }
            if (i + (repeat + 1) * length > W || !same(i, i + repeat * length, length)) break;
            repeat++;
          }
        }
      }
      const whole = cover[W];
      if (whole) offer(whole.cost, whole.term);
    }

    // Question 4: k words over the span where k does not divide it, cut where `even(k, span, shift)` has its onsets.
    if (options.evenSplits)
      for (let k = 2; k < span; k++) {
        if (span % k === 0) continue;
        for (let shift = 0; shift < span; shift++) {
          const cuts = even(k, span, shift)
            .heights.map((h) => wrap(h, span))
            .sort((a, b) => a - b);
          if (cuts.length !== k) continue;
          // The words start at the cuts, the first word also covering anything before the first cut.
          const edges = [0, ...cuts.slice(1), span];
          let cost = 0;
          for (let i = 0; i + 1 < edges.length; i++)
            cost += find(row.slice(edges[i], edges[i + 1])).cost;
          offer(cost, { kind: 'atom', token: `(${k} words over ${span}, shift ${shift})` });
        }
      }

    best ??= {
      cost: span,
      term: {
        kind: 'seq',
        words: row.map((token) => ({ term: { kind: 'atom', token }, weight: 1, repeat: 1 })),
      },
    };
    memo.set(key, best);
    return best;
  };
  return find;
}

/** A term as text, at the top level a bare sequence. */
function print(term: Term, top = false): string {
  switch (term.kind) {
    case 'atom':
      return term.token;
    case 'euclid':
      return `${term.token}(${term.k},${term.n},${term.shift})`;
    case 'tile': {
      const body = term.body.kind === 'atom' ? print(term.body) : `[${print(term.body, true)}]`;
      return `${body}*${term.times}`;
    }
    case 'seq': {
      const words = term.words.map(({ term: word, weight, repeat }) => {
        const text =
          word.kind === 'seq' || word.kind === 'tile' ? `[${print(word, true)}]` : print(word);
        return `${text}${weight > 1 ? `@${weight}` : ''}${repeat > 1 ? `!${repeat}` : ''}`;
      });
      const text = words.join(' ');
      return top || words.length === 1 ? text : text;
    }
  }
}

/** The cells a text fills over `span` steps: a small parser of the pieces above, independent of the minimiser. */
function expand(text: string, span: number): string[] {
  let at = 0;
  const peek = () => text[at];
  const number = () => {
    const start = at;
    while (peek() !== undefined && /\d/.test(peek()!)) at++;
    if (start === at) throw new Error(`a number was expected at ${at} in "${text}"`);
    return Number(text.slice(start, at));
  };
  type Word = { cells: (span: number) => string[]; weight: number; repeat: number };
  const sequence = (): Word[] => {
    const words: Word[] = [];
    while (peek() !== undefined && peek() !== ']') {
      if (peek() === ' ') {
        at++;
        continue;
      }
      let cells: (span: number) => string[];
      if (peek() === '[') {
        at++;
        const inner = sequence();
        if (peek() !== ']') throw new Error(`"]" was expected in "${text}"`);
        at++;
        cells = (s) => place(inner, s);
      } else {
        const start = at;
        while (peek() !== undefined && /[^ \]*!@(]/.test(peek()!)) at++;
        const token = text.slice(start, at);
        if (peek() === '(') {
          at++;
          const k = number();
          at++;
          const n = number();
          at++;
          const shift = number();
          at++;
          cells = (s) => {
            const out = Array<string>(s).fill(REST);
            for (const h of even(k, n, shift).heights) out[(h * s) / n] = token;
            return out;
          };
        } else cells = (s) => [token, ...Array<string>(s - 1).fill(REST)];
      }
      let weight = 1;
      let repeat = 1;
      while (peek() === '*' || peek() === '!' || peek() === '@') {
        const mark = text[at++]!;
        const value = number();
        if (mark === '@') weight = value;
        else if (mark === '!') repeat = value;
        else {
          const body = cells;
          cells = (s) => range(value).flatMap(() => body(s / value));
        }
      }
      words.push({ cells, weight, repeat });
    }
    return words;
  };
  const place = (words: Word[], s: number): string[] => {
    const total = words.reduce((a, w) => a + w.weight * w.repeat, 0);
    return words.flatMap((w) => range(w.repeat).flatMap(() => w.cells((s * w.weight) / total)));
  };
  const words = sequence();
  if (at !== text.length) throw new Error(`unread text at ${at} in "${text}"`);
  return place(words, span);
}

// ---- the corpus -------------------------------------------------------------------------------

interface BassBar {
  section: string;
  /** The pitch token at each onset step, in step order. */
  notes: { step: number; token: string }[];
}

const bars: BassBar[] = [];
let barsWithNoBass = 0;
let repeatedSteps = 0;
let totalBars = 0;

for (const seed of SEEDS)
  for (const presetAt of runs) {
    let carried: BandCarried = band.initial;
    let register = band.initial.parts.bass;
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
          wish: { tonic: null, mode: preset.mode, melodic: null } as KeyWish,
          offer: null,
        },
        carried,
        null,
      );
      carried = after;
      totalBars++;
      const written = output.written
        .filter((n) => n.part === 'bass')
        .sort((a, b) => a.step - b.step);
      if (written.length === 0) {
        barsWithNoBass++;
        continue;
      }
      const notes: BassBar['notes'] = [];
      for (const note of written) {
        if (notes.at(-1)?.step === note.step) repeatedSteps++;
        const root = chordAt(output.chords, note.step).chord.helix.heights[0]!;
        const interval = wrap(note.note - root, 12);
        const up = note.note > nearest(wrap(note.note, 12), register);
        notes.push({ step: note.step, token: `${interval}${up ? '^' : ''}` });
        register = note.note;
      }
      bars.push({ section: output.plan.section.type, notes });
    }
  }

// ---- the measurements -------------------------------------------------------------------------

const PATTERNS: Record<string, number[]> = {
  root: [0, 8],
  pump: [2, 6, 10, 14],
  eight: [0, 2, 4, 6, 8, 10, 12, 14],
  funk: [0, 3, 6, 7, 10, 11, 13, 14],
  walk: [0, 4, 8, 12],
};

const pct = (a: number, b: number) => `${a} (${((100 * a) / b).toFixed(1)}%)`;
const sorted = <T>(entries: Iterable<[string | number, T]>) =>
  [...entries].sort(([a], [b]) =>
    typeof a === 'number' ? a - (b as number) : String(a).localeCompare(String(b)),
  );

const exact = minimiser({ weights: true, evenSplits: false });
const unweighted = minimiser({ weights: false, evenSplits: false });
const relaxed = minimiser({ weights: true, evenSplits: true });

interface Totals {
  bars: number;
  pairs: number;
  dense: number;
  collapsed: number;
}
const total: Totals = { bars: 0, pairs: 0, dense: 0, collapsed: 0 };
const bySection = new Map<string, Totals>();
let roundTrips = 0;
const denseLevels = new Map<number, number>();
let euclidBars = 0;
const euclidByK = new Map<number, number>();
let loopBars = 0;
let loopPitchBars = 0;
let needWeights = 0;
let foldBars = 0;
let foldBelowDense = 0;
const usesOf = { euclid: 0, tile: 0, weight: 0, replicate: 0 };
const classes = {
  equalsSupport: new Map<string, number>(),
  subsetOfOne: new Map<string, number>(),
  subsetOfSeveral: 0,
  subsetOfNone: 0,
};
const noneSamples = new Map<string, number>();
const eulerNonDividing = new Map<number, number>();
const shiftOnly = new Map<number, { bars: number; shiftZero: number }>();
const relaxedBetter = new Map<string, number>();
let relaxedSaved = 0;
let relaxedBars = 0;

const features = (term: Term): void => {
  if (term.kind === 'euclid') usesOf.euclid++;
  if (term.kind === 'tile') {
    usesOf.tile++;
    features(term.body);
  }
  if (term.kind === 'seq')
    for (const w of term.words) {
      if (w.weight > 1) usesOf.weight++;
      if (w.repeat > 1) usesOf.replicate++;
      features(w.term);
    }
};

for (const bar of bars) {
  const onsets = bar.notes.map((n) => n.step);
  const set = new Set(onsets);
  // Dense: the coarsest power-of-two level that holds every onset.
  const levels = [1, 2, 4, 8, 16];
  const level = levels.find((l) => onsets.every((s) => s % (STEPS / l) === 0))!;
  denseLevels.set(level, (denseLevels.get(level) ?? 0) + 1);
  const row = range(STEPS).map((s) => bar.notes.find((n) => n.step === s)?.token ?? REST);
  const dense = level;
  const pairs = bar.notes.length;
  const found = exact(row);
  const text = print(found.term, true);
  const back = expand(text, STEPS);
  if (back.length === STEPS && back.every((x, i) => x === row[i])) roundTrips++;
  else console.log(`ROUND TRIP FAILS: ${row.join(' ')} -> ${text} -> ${back.join(' ')}`);
  features(found.term);
  const collapsed = found.cost;

  const add = (t: Totals) => {
    t.bars++;
    t.pairs += pairs;
    t.dense += dense;
    t.collapsed += collapsed;
  };
  add(total);
  if (!bySection.has(bar.section))
    bySection.set(bar.section, { bars: 0, pairs: 0, dense: 0, collapsed: 0 });
  add(bySection.get(bar.section)!);

  // 2. What the onset sets are.
  let euclidK: number | undefined;
  for (let k = 1; k <= STEPS && euclidK === undefined; k++)
    for (let shift = 0; shift < STEPS; shift++) {
      const heights = even(k, STEPS, shift).heights;
      if (heights.length === onsets.length && heights.every((h) => set.has(h))) {
        euclidK = k;
        break;
      }
    }
  if (euclidK !== undefined) {
    euclidBars++;
    euclidByK.set(euclidK, (euclidByK.get(euclidK) ?? 0) + 1);
  }
  const onsetRow = range(STEPS).map((s) => (set.has(s) ? 'x' : REST));
  const periodic = (r: string[]) =>
    divisors(STEPS)
      .filter((p) => p < STEPS)
      .some((p) => r.every((x, i) => x === r[i % p]));
  if (periodic(onsetRow)) loopBars++;
  if (periodic(row)) loopPitchBars++;
  if (unweighted(row).cost > collapsed) needWeights++;
  if (collapsed < pairs) foldBars++;
  if (collapsed < dense) foldBelowDense++;

  // 3. The band's five patterns, by onset set.
  const names = Object.entries(PATTERNS)
    .filter(([, steps]) => onsets.every((s) => steps.includes(s)))
    .map(([name]) => name);
  const equals = Object.entries(PATTERNS)
    .filter(([, steps]) => steps.length === onsets.length && onsets.every((s) => steps.includes(s)))
    .map(([name]) => name);
  const bump = (m: Map<string, number>, key: string) => m.set(key, (m.get(key) ?? 0) + 1);
  if (equals.length > 0) bump(classes.equalsSupport, equals.join('='));
  else if (names.length === 1) bump(classes.subsetOfOne, names[0]!);
  else if (names.length > 1) classes.subsetOfSeveral++;
  else {
    classes.subsetOfNone++;
    bump(noneSamples, onsets.join(','));
  }

  // 4. Sequences of k words split by even(k, n), k not dividing n.
  if (euclidK !== undefined && STEPS % euclidK !== 0) {
    eulerNonDividing.set(euclidK, (eulerNonDividing.get(euclidK) ?? 0) + 1);
    const cell = shiftOnly.get(euclidK) ?? { bars: 0, shiftZero: 0 };
    cell.bars++;
    if (
      even(euclidK, STEPS, 0).heights.every((h) => set.has(h)) &&
      even(euclidK, STEPS, 0).heights.length === onsets.length
    )
      cell.shiftZero++;
    shiftOnly.set(euclidK, cell);
  }
  const loose = relaxed(row);
  relaxedBars++;
  if (loose.cost < collapsed) {
    relaxedSaved += collapsed - loose.cost;
    const m = /\((\d+) words over/.exec(print(loose.term, true));
    bump(relaxedBetter, m ? `k=${m[1]}` : 'inside a sub-span');
  }
}

console.log(
  `E27: ${bars.length} bass bars of ${totalBars} (${barsWithNoBass} with no bass note), ${repeatedSteps} steps with two notes, over ${SEEDS.length * runs.length * BARS} bars`,
);

const row = (name: string, t: Totals) =>
  `   ${name.padEnd(10)} ${String(t.bars).padStart(5)} bars  pairs ${String(t.pairs).padStart(6)}  dense ${String(t.dense).padStart(6)} (${((100 * t.dense) / t.pairs).toFixed(1)}%)  collapsed ${String(t.collapsed).padStart(6)} (${((100 * t.collapsed) / t.pairs).toFixed(1)}%)`;
console.log('\n1. Tokens a bar, in three forms');
console.log(row('all', total));
for (const [section, t] of sorted(bySection)) console.log(row(String(section), t));
console.log(`   expand(collapse(row)) = row: ${pct(roundTrips, bars.length)}`);
console.log(
  `   dense level (cells): ${sorted(denseLevels)
    .map(([l, c]) => `${l}: ${c}`)
    .join(', ')}`,
);
console.log(
  `   pieces in the collapsed terms: ${Object.entries(usesOf)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')}`,
);

console.log('\n2. Which bars fold');
console.log(
  `   onset set is even(k,16,shift): ${pct(euclidBars, bars.length)}; by k: ${sorted(euclidByK)
    .map(([k, c]) => `${k}: ${c}`)
    .join(', ')}`,
);
console.log(`   of them a single onset (k=1): ${euclidByK.get(1) ?? 0}`);
console.log(`   onset set is a pure loop (period 1, 2, 4 or 8): ${pct(loopBars, bars.length)}`);
console.log(`   row with its pitches is a pure loop: ${pct(loopPitchBars, bars.length)}`);
console.log(
  `   need weights (smallest term without @ is larger): ${pct(needWeights, bars.length)}`,
);
console.log(`   fold at all (collapsed smaller than pairs): ${pct(foldBars, bars.length)}`);
console.log(`   collapsed smaller than dense: ${pct(foldBelowDense, bars.length)}`);

console.log("\n3. The band's bass patterns, by onset set");
for (const [name, steps] of Object.entries(PATTERNS)) {
  const k = steps.length;
  const isEuclid = range(STEPS).some((shift) =>
    even(k, STEPS, shift).heights.every((h) => steps.includes(h)),
  );
  console.log(
    `   ${name.padEnd(6)} steps ${steps.join(',')}: even(${k},16,shift) for some shift: ${isEuclid}`,
  );
}
console.log(
  `   onset set equals one pattern's steps: ${pct(
    [...classes.equalsSupport.values()].reduce((a, b) => a + b, 0),
    bars.length,
  )}; ${sorted(classes.equalsSupport)
    .map(([k, c]) => `${k}: ${c}`)
    .join(', ')}`,
);
console.log(
  `   a proper subset of exactly one pattern's steps: ${pct(
    [...classes.subsetOfOne.values()].reduce((a, b) => a + b, 0),
    bars.length,
  )}; ${sorted(classes.subsetOfOne)
    .map(([k, c]) => `${k}: ${c}`)
    .join(', ')}`,
);
console.log(
  `   a subset of several patterns' steps (not equal to one): ${pct(classes.subsetOfSeveral, bars.length)}`,
);
console.log(
  `   in no pattern's steps (an onset off every pattern): ${pct(classes.subsetOfNone, bars.length)}`,
);
console.log(
  `   the commonest of those: ${sorted(noneSamples)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k, c]) => `{${k}}: ${c}`)
    .join('; ')}`,
);

console.log('\n4. Words split by even(k, n) where k does not divide n');
console.log(
  `   onset set is even(k,16,shift), k not dividing 16: ${pct(
    [...eulerNonDividing.values()].reduce((a, b) => a + b, 0),
    bars.length,
  )}; by k: ${
    sorted(eulerNonDividing)
      .map(([k, c]) => `${k}: ${c}`)
      .join(', ') || 'none'
  }`,
);
console.log(
  `   of them reachable with shift 0: ${
    sorted(shiftOnly)
      .map(([k, c]) => `k=${k}: ${c.shiftZero} of ${c.bars}`)
      .join(', ') || 'none'
  }`,
);
console.log(
  `   bars whose smallest term gets smaller if such a split is allowed: ${pct(
    [...relaxedBetter.values()].reduce((a, b) => a + b, 0),
    relaxedBars,
  )}, ${relaxedSaved} tokens saved; by k: ${
    sorted(relaxedBetter)
      .map(([k, c]) => `${k}: ${c}`)
      .join(', ') || 'none'
  }`,
);
