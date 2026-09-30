/**
 * E22: the loop closed with no players, the Muse hearing the band's own lead
 * (#237 step 0, Q7b, Q12).
 *
 * The band is left alone, the players wishing only for its preset's mode.
 * The Muse hears the lead's written notes as she hears a player's, source
 * 'the lead', each note at its step with velocity 100, held for its length:
 * judged as the transport judges them (`judgeBar` in the bar's key, and
 * `keptAfter`), bar k as the band composes bar k + 2 (`LISTEN_DELAY`, F7).
 * The notes are on the grid already, so reading them as phrases, as the
 * transport does, gives each bar what the nearest step gives (the test
 * holds it on a sample); the nearest step is the default here, since the
 * phrase reading of a lead that never rests a bar reads 16 bars of notes
 * for every bar judged. Two conditions over the same seeds:
 *
 * - deaf: the band as it plays alone today, offered nothing; the Muse
 *   listens beside it, but her offer is not fed back, so the two conditions
 *   are measured alike;
 * - hearing: her offer is the band's, so a motif heard in bar k plays from
 *   bar k + 2, and she hears it played back.
 *
 * Per preset, entropy and condition, over the bars judged (a motif bar is
 * one whose lead the Muse judges a motif):
 *
 * - playing: the share of bars that are motif bars;
 * - recognised: the share of motif bars heard as a motif she remembers
 *   (`MuseOutput.recognised`), and of those, exact: heard as a repeat (`NOOP`),
 *   not under an operator;
 * - novelty: motif bars not recognised, per section;
 * - stall: the longest run of motif bars whose motif is the same exactly,
 *   and the share of motif bars in runs of `STALL_RUN` or more;
 * - oscillation: the share of motif bars, after two, whose motif is the one
 *   two bars before and not the one before (A B A B);
 * - what holds: the share of motif bars that play the run's commonest
 *   motif, the share of runs whose commonest motif is the first they
 *   heard, and the share of the commonest motif's bars on one parity, even
 *   or odd;
 * - distinct: the motifs of a run;
 * - return, the drift's measure: the share of the run's last `SECTION_BARS`
 *   motif bars heard (`recognise`, any operator) as one of its first
 *   `SECTION_BARS`: 1 is a band that ends on the material it opened with,
 *   0 one that drifted away from it.
 *
 * The presets are ordered by their harmony, which sets the key's reach and
 * the melodic scales (`licence.ts`): Techno's licence is the narrowest and
 * Swing jazz's the widest. Kendall's tau of the recognised share against
 * that order, and against the entropy, says whether the share falls
 * monotonically as the licence widens and as the entropy rises (#237).
 *
 * It then runs the variants (`VARIANTS`): the loop closed without the Muse's
 * hold, and with the lead varying an offer as it varies its own shapes, on
 * a phrase's second and fourth bars or on every bar, each with the hold and
 * without it. They say which part of the loop locks it.
 *
 * Last, the rate (`RATES`): the lead varying an offer at a rate p, from 0
 * (the loop that copies, `hearing`) through 1 (`every bar`) to 2, two
 * variations on every bar, over every preset at entropy 0.3. Kendall's tau
 * of the recognised share and of A B A B against p says whether the loop
 * moves from the locked loop toward the deaf band as p rises (#237).
 *
 * Its cost is mostly the Muse's recognition, every motif heard against every
 * one she remembers: 3 seeds of 128 bars, the default, take about 60 s with
 * the variants and the rates.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/loop.ts [seeds] [bars]
 *
 * Given a path ending in .json instead, it writes the examples to hear
 * (`examples`): the band as it plays 16 bars in a few presets and
 * conditions, every part's notes, for a page that plays them; conditions
 * named after the path, such as p=1.5, replace the default ones.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Motif, NOOP, applyOp, head, recognise } from '@jambot/theory';
import {
  type DoughNote,
  type HeardNote,
  type Judgement,
  type Key,
  LISTEN_DELAY,
  type MuseCarried,
  type Offer,
  type Reading,
  PRESETS,
  type Preset,
  SECTION_BARS,
  band,
  barStart,
  chance,
  draw,
  judgeBar,
  keptAfter,
  muse,
  pick,
  swingMap,
  taken,
} from '../src/index.ts';

/**
 * Whether the Muse's offer goes back into the band, and how:
 *
 * - `deaf`: not at all;
 * - `hearing`: as the Muse offers it, a confirmed motif held across bars;
 * - `no hold`: the motif of each bar heard, as the prototype takes it, with
 *   no confirmation (with only the lead heard, one motif a bar, confirming
 *   first has nothing to rank, so only the hold differs);
 * - `varied` and `varied, no hold`: the same, with the lead varying the
 *   offer on its phrase's second and fourth bars as it varies its own
 *   shapes (`varyOffer`);
 * - `every bar` and `every bar, no hold`: the same variation on every bar.
 *
 * The delay splits the loop into chains: what the Muse hears in bar k plays
 * in bar k + 2, so the even bars feed the even bars and the odd the odd. A
 * phrase's second and fourth bars are odd, so the variants that vary only
 * there leave the even chain copying itself.
 */
export type Condition =
  | 'deaf'
  | 'hearing'
  | 'no hold'
  | 'varied'
  | 'varied, no hold'
  | 'every bar'
  | 'every bar, no hold'
  | Rate;

/**
 * The lead varying an offer at a rate p, `p=0.5`: ⌊p⌋ times a bar, and once
 * more by the chance of the rest. It generalises the closed conditions, which
 * are its points: `p=0` plays as `hearing` and `p=1` as `every bar`, and past
 * 1 the variations stack on one bar.
 */
export type Rate = `p=${number}`;

/** The rates E22 sweeps, from the loop that copies to two variations a bar. */
export const RATES: readonly Rate[] = ['p=0', 'p=0.25', 'p=0.5', 'p=0.75', 'p=1', 'p=1.5', 'p=2'];

/** The conditions E22 compares, and its variants. */
export const CONDITIONS: readonly Condition[] = ['deaf', 'hearing'];
export const VARIANTS: readonly Condition[] = [
  'hearing',
  'no hold',
  'varied',
  'varied, no hold',
  'every bar',
  'every bar, no hold',
];

/**
 * An offered motif varied as the lead varies its own shapes on a phrase's
 * second and fourth bars (`varied` in `lead.ts`, with `phraseParams`'
 * weights, 0.3, 0.25, 0.25 and 0.2, and a nudge of half the entropy):
 * turned over, lifted two degrees, its last note bent a degree or two from
 * the one before, or its last note dropped for a rest; then, by chance, one
 * note after the first nudged a degree. The draws are the lead's own
 * (`leadVariation`, keyed by bar), which it doesn't draw while an offer
 * stands, so this is the variation the lead would have drawn for the bar.
 */
export function varyOffer(
  motif: Motif,
  seed: number,
  bar: number,
  entropy: number,
  pass = 0,
): Motif {
  let n = 0;
  // A second pass on one bar (a rate past 1) draws its own numbers.
  const next = () =>
    pass === 0
      ? draw(seed, 'leadVariation', bar, n++)
      : draw(seed, 'leadVariation', bar, n++, pass);
  const notes = motif.degrees.filter((d) => d !== null).length;
  const way = pick(next(), [0.3, 0.25, 0.25, 0.2]);
  let varied =
    way === 0
      ? applyOp({ ...NOOP, mirror: true }, motif)
      : way === 1
        ? applyOp({ ...NOOP, strans: 2 }, motif)
        : way === 3 && notes > 2
          ? head(motif, notes - 1)
          : motif;
  const noteAt = (k: number) =>
    varied.degrees.map((d, i) => (d === null ? -1 : i)).filter((i) => i >= 0)[k];
  const moved = (i: number, by: number): Motif => ({
    ...varied,
    degrees: varied.degrees.map((d, j) => (j === i && d !== null ? d + by : d)),
  });
  if (way === 2 && notes > 1) {
    const [last, before] = [noteAt(notes - 1)!, noteAt(notes - 2)!];
    const target =
      varied.degrees[before]! + (chance(next(), 0.5) ? -1 : 1) * (1 + pick(next(), [1, 1]));
    varied = moved(last, target - varied.degrees[last]!);
  }
  const count = varied.degrees.filter((d) => d !== null).length;
  if (chance(next(), 0.5 * entropy) && count > 1)
    varied = moved(
      noteAt(
        1 +
          pick(
            next(),
            [...Array(count - 1)].map(() => 1),
          ),
      )!,
      chance(next(), 0.5) ? -1 : 1,
    );
  return varied;
}

/** How many times the lead varies an offer on this bar: on its phrase's second and fourth, on every bar, or at a rate. */
export function timesVaried(condition: Condition, seed: number, bar: number): number {
  if (condition.startsWith('p=')) {
    const p = Number(condition.slice(2));
    const whole = Math.floor(p);
    return whole + (chance(draw(seed, 'offerVariation', bar), p - whole) ? 1 : 0);
  }
  if (condition.startsWith('every bar')) return 1;
  return condition.startsWith('varied') && (bar % 4 === 1 || bar % 4 === 3) ? 1 : 0;
}

/** The source the lead is heard as. */
const LEAD = 'the lead';

/** The shortest run of one motif counted as a stall: a section of it. */
export const STALL_RUN = SECTION_BARS;

/** The presets, the narrowest licence first: by their harmony. */
export const BY_LICENCE: readonly Preset[] = [...PRESETS].sort(
  (a, b) => a.style.harm - b.style.harm,
);

/** Each judged bar of a run: the lead's motif, if it gave one, and whether the Muse heard it as one she remembers, exactly or not. */
export interface LoopBar {
  readonly motif: Motif | null;
  readonly heardAs: 'new' | 'exact' | 'varied' | null;
}

const motifIn = (judgements: readonly Judgement[]): Motif | null => {
  const j = judgements.find((x) => x.kind === 'motif');
  return j?.kind === 'motif' ? j.motif : null;
};

/** A motif as what was played, apart from how loudly: equal texts are the same motif exactly. */
const text = (m: Motif) => JSON.stringify([m.cycle, m.onsets, m.degrees, m.accidentals]);

const isNoop = (op: object) => JSON.stringify(op) === JSON.stringify(NOOP);

/** One run of `bars` judged bars: the band left alone, heard by the Muse, her offer fed back or not. */
export function loopRun(
  preset: Preset,
  seed: number,
  entropy: number,
  bars: number,
  condition: Condition,
  reading: Reading = 'nearest',
  played?: (bar: number, dough: readonly DoughNote[]) => void,
): LoopBar[] {
  const style = { ...preset.style, entropy };
  const wish = { tonic: null, mode: preset.mode, melodic: null };
  let playing = band.initial;
  let listening: MuseCarried = muse.initial;
  let pending: HeardNote[] = [];
  /** The motif of each bar heard, as the prototype takes it: the `no hold` conditions' offer. */
  let latest: Offer | null = null;
  const keys: Key[] = [];
  const heard: LoopBar[] = [];
  for (let bar = 0; bar < bars + LISTEN_DELAY; bar++) {
    const judged = bar - LISTEN_DELAY;
    if (judged >= 0) {
      const judgements = judgeBar(pending, judged, keys[judged]!, reading);
      const next = muse.advance({ bar: judged }, listening, { judgements, forget: false });
      listening = next.carried;
      pending = keptAfter(pending, judged);
      const best = taken(judgements);
      if (best) latest = { motif: best.motif, source: best.source, bar: judged, level: best.level };
      const motif = motifIn(judgements);
      const recognition = next.output.recognised.find((r) => r.source === LEAD);
      heard.push({
        motif,
        heardAs:
          motif === null
            ? null
            : !recognition
              ? 'new'
              : isNoop(recognition.op)
                ? 'exact'
                : 'varied',
      });
    }
    if (bar >= bars) continue;
    const held =
      condition === 'deaf' ? null : condition.endsWith('no hold') ? latest : listening.offer;
    let offer = held;
    for (let pass = 0; offer && pass < timesVaried(condition, seed, bar); pass++)
      offer = { ...offer, motif: varyOffer(offer.motif, seed, bar, entropy, pass) };
    const next = band.advance({ seed, bar, style, wish, offer }, playing, null);
    playing = next.carried;
    played?.(bar, next.output.dough);
    keys.push(next.output.plan.key);
    for (const n of next.output.written)
      if (n.part === 'lead')
        pending.push({
          note: n.note,
          velocity: 100,
          source: LEAD,
          position: barStart(bar) + n.step,
          end: barStart(bar) + n.step + n.length,
        });
  }
  return heard;
}

/** What E22 measures of a preset's runs at one entropy and condition. */
export interface LoopMeasure {
  readonly preset: string;
  readonly entropy: number;
  readonly condition: Condition;
  /** The share of bars whose lead the Muse judges a motif. */
  readonly playing: number;
  /** The share of motif bars heard as a remembered motif. */
  readonly recognised: number;
  /** Of those, the share heard as an exact repeat. */
  readonly exact: number;
  /** Motif bars not recognised, per section. */
  readonly novelty: number;
  /** The longest run of one motif exactly, the mean over the runs, and the longest of any run. */
  readonly longestRun: number;
  readonly longestAny: number;
  /** The share of motif bars in runs of `STALL_RUN` or more. */
  readonly stalled: number;
  /** The share of motif bars, after two, that play A B A B. */
  readonly oscillating: number;
  /** The share of the last section's motif bars heard as one of the first section's. */
  readonly returns: number;
  /** Distinct motifs per run, the mean. */
  readonly distinct: number;
  /** The share of motif bars that play their run's commonest motif exactly. */
  readonly commonest: number;
  /** The share of runs whose commonest motif is the first they heard. */
  readonly firstHeld: number;
  /** Of the bars that play a run's commonest motif, the share on the bars of one parity, even or odd, whichever holds more. */
  readonly oneParity: number;
}

const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

/** E22's measures over runs of one preset, entropy and condition. */
export function measure(
  preset: string,
  entropy: number,
  condition: Condition,
  runs: readonly LoopBar[][],
): LoopMeasure {
  let bars = 0;
  let motifBars = 0;
  let recognised = 0;
  let exact = 0;
  let stalled = 0;
  let afterTwo = 0;
  let oscillating = 0;
  const longest: number[] = [];
  const returns: number[] = [];
  const distinct: number[] = [];
  let commonest = 0;
  let firstHeld = 0;
  let commonestBars = 0;
  let parity = 0;
  for (const run of runs) {
    bars += run.length;
    const texts = run.map((b) => (b.motif ? text(b.motif) : null));
    let best = 0;
    let length = 0;
    const flush = () => {
      if (length >= STALL_RUN) stalled += length;
      best = Math.max(best, length);
      length = 0;
    };
    texts.forEach((t, i) => {
      if (t === null) return flush();
      motifBars++;
      const heardAs = run[i]!.heardAs;
      if (heardAs !== 'new') recognised++;
      if (heardAs === 'exact') exact++;
      if (i > 0 && texts[i - 1] !== t) flush();
      length++;
      const [one, two] = [texts[i - 1], texts[i - 2]];
      if (one == null || two == null) return;
      afterTwo++;
      if (two === t && one !== t) oscillating++;
    });
    flush();
    longest.push(best);
    const counts = new Map<string, number>();
    for (const t of texts) if (t !== null) counts.set(t, (counts.get(t) ?? 0) + 1);
    distinct.push(counts.size);
    const top = [...counts].reduce<[string, number] | null>(
      (best, entry) => (best === null || entry[1] > best[1] ? entry : best),
      null,
    );
    if (top) {
      commonest += top[1];
      if (texts.find((t) => t !== null) === top[0]) firstHeld++;
      const odd = texts.filter((t, i) => t === top[0] && i % 2 === 1).length;
      commonestBars += top[1];
      parity += Math.max(odd, top[1] - odd);
    }
    const motifs = run.flatMap((b) => (b.motif ? [b.motif] : []));
    const first = motifs.slice(0, SECTION_BARS);
    const last = motifs.slice(-SECTION_BARS);
    if (motifs.length >= 2 * SECTION_BARS)
      returns.push(
        last.filter((m) => first.some((f) => recognise(m, f) !== null)).length / last.length,
      );
  }
  return {
    preset,
    entropy,
    condition,
    playing: motifBars / bars,
    recognised: recognised / Math.max(1, motifBars),
    exact: exact / Math.max(1, recognised),
    novelty: (motifBars - recognised) / (bars / SECTION_BARS),
    longestRun: mean(longest),
    longestAny: Math.max(0, ...longest),
    stalled: stalled / Math.max(1, motifBars),
    oscillating: oscillating / Math.max(1, afterTwo),
    returns: mean(returns),
    distinct: mean(distinct),
    commonest: commonest / Math.max(1, motifBars),
    firstHeld: firstHeld / runs.length,
    oneParity: parity / Math.max(1, commonestBars),
  };
}

/** E22 for `presets` (every preset, the narrowest licence first) at `entropy`, in `conditions`, over `seeds` seeds of `bars` bars. */
export function loops(
  entropy: number,
  seeds: number,
  bars: number,
  presets: readonly Preset[] = BY_LICENCE,
  conditions: readonly Condition[] = CONDITIONS,
): LoopMeasure[] {
  return presets.flatMap((preset) =>
    conditions.map((condition) =>
      measure(
        preset.name,
        entropy,
        condition,
        [...Array(seeds).keys()].map((s) => loopRun(preset, s + 1, entropy, bars, condition)),
      ),
    ),
  );
}

/** Kendall's tau between two lists of equal length: 1 when they rise together, -1 when one falls as the other rises. */
export function kendall(xs: readonly number[], ys: readonly number[]): number {
  let score = 0;
  let pairs = 0;
  for (let i = 0; i < xs.length; i++)
    for (let j = i + 1; j < xs.length; j++) {
      pairs++;
      score += Math.sign(xs[j]! - xs[i]!) * Math.sign(ys[j]! - ys[i]!);
    }
  return pairs === 0 ? 0 : score / pairs;
}

/** The bars written out to hear, and the run they come from. */
export const EXAMPLE = { seed: 1, entropy: 0.3, bars: 64, from: 32, to: 48 } as const;
/** The presets and conditions written out to hear: a narrow, a middle and a wide licence. */
const HEARD = {
  presets: ['Techno', 'Deep house', 'Swing jazz'],
  conditions: ['deaf', 'hearing', 'varied', 'every bar'],
} as const;

/**
 * The examples to hear and draw: per preset and condition, the band as it
 * plays bars `EXAMPLE.from` to `EXAMPLE.to` of seed `EXAMPLE.seed`, every
 * part's notes with their step on the example's own grid, and how the Muse
 * heard the lead in each of those bars, with the preset's tempo and swing.
 */
export function examples(conditions: readonly Condition[] = HEARD.conditions) {
  return HEARD.presets.map((name) => {
    const preset = PRESETS.find((p) => p.name === name)!;
    return {
      preset: name,
      bpm: preset.style.bpm,
      swing: preset.style.swing,
      conditions: conditions.map((condition) => {
        const notes: (DoughNote & { at: number; seconds: number; duration: number })[] = [];
        // Where each note is played, through the swing, and for how long, at the preset's tempo.
        const swung = swingMap(preset.style.swing);
        const stepSeconds = 60 / preset.style.bpm / 4;
        const run = loopRun(
          preset,
          EXAMPLE.seed,
          EXAMPLE.entropy,
          EXAMPLE.bars,
          condition,
          'nearest',
          (bar, dough) => {
            if (bar < EXAMPLE.from || bar >= EXAMPLE.to) return;
            for (const n of dough) {
              const at = (bar - EXAMPLE.from) * 16 + n.step;
              const seconds = swung.played(at) * stepSeconds;
              const duration = (swung.played(at + n.length) - swung.played(at)) * stepSeconds;
              notes.push({ ...n, at, seconds, duration });
            }
          },
        );
        return {
          condition,
          heardAs: run.slice(EXAMPLE.from, EXAMPLE.to).map((b) => b.heardAs),
          notes,
          measure: measure(name, EXAMPLE.entropy, condition, [run]),
        };
      }),
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]?.endsWith('.json')) {
  const asked = process.argv.slice(3) as Condition[];
  writeFileSync(
    process.argv[2],
    JSON.stringify({ example: EXAMPLE, presets: examples(asked.length ? asked : undefined) }),
  );
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [seeds = 3, bars = 128] = process.argv.slice(2).map(Number);
  const pct = (x: number) => `${(100 * x).toFixed(1)}%`.padStart(6);
  const header =
    'preset         condition           playing   recog   exact  novelty  longest (any)  stalled     osc  return  distinct  commonest  first  parity';
  const row = (m: LoopMeasure) =>
    [
      m.preset.padEnd(14),
      m.condition.padEnd(18),
      pct(m.playing).padStart(7),
      pct(m.recognised),
      pct(m.exact),
      m.novelty.toFixed(2).padStart(7),
      `${m.longestRun.toFixed(1).padStart(7)} (${String(m.longestAny).padStart(3)})`,
      pct(m.stalled).padStart(7),
      pct(m.oscillating),
      pct(m.returns),
      m.distinct.toFixed(1).padStart(8),
      pct(m.commonest).padStart(9),
      pct(m.firstHeld),
      pct(m.oneParity).padStart(7),
    ].join('  ');
  const all: LoopMeasure[] = [];
  for (const entropy of [0, 0.3, 0.6, 1]) {
    console.log(`\nentropy ${entropy}, ${seeds} seeds, ${bars} bars`);
    console.log(header);
    for (const m of loops(entropy, seeds, bars)) {
      all.push(m);
      console.log(row(m));
    }
  }
  const licence = BY_LICENCE.map((p) => p.style.harm);
  console.log('\nKendall tau of the recognised share against the licence (harmony), per entropy');
  for (const condition of ['deaf', 'hearing'] as const)
    console.log(
      `${condition.padEnd(8)} ` +
        [0, 0.3, 0.6, 1]
          .map((entropy) => {
            const shares = all
              .filter((m) => m.condition === condition && m.entropy === entropy)
              .map((m) => m.recognised);
            return `${entropy}: ${kendall(licence, shares).toFixed(2)}`;
          })
          .join('  '),
    );
  console.log('\nKendall tau of the recognised share against the entropy, per preset');
  for (const condition of ['deaf', 'hearing'] as const)
    console.log(
      `${condition.padEnd(8)} ` +
        BY_LICENCE.map((p) => {
          const rows = all.filter((m) => m.condition === condition && m.preset === p.name);
          return `${p.name}: ${kendall(
            rows.map((m) => m.entropy),
            rows.map((m) => m.recognised),
          ).toFixed(2)}`;
        }).join('  '),
    );
  console.log(
    '\nvariants: the loop closed without the hold, with the lead varying an offer, and both',
  );
  const variants: LoopMeasure[] = [];
  for (const entropy of [0, 0.3, 0.6, 1]) {
    console.log(`\nentropy ${entropy}, ${seeds} seeds, ${bars} bars`);
    console.log(header);
    for (const m of loops(entropy, seeds, bars, BY_LICENCE, VARIANTS)) {
      variants.push(m);
      console.log(row(m));
    }
  }
  console.log(
    '\nthe variants, the mean over every preset and entropy:\ncondition             recog   exact  return     osc  commonest   first  parity  distinct',
  );
  for (const condition of VARIANTS) {
    const rows = variants.filter((m) => m.condition === condition);
    const avg = (f: (m: LoopMeasure) => number) => pct(mean(rows.map(f)));
    console.log(
      `${condition.padEnd(18)} ${avg((m) => m.recognised)}  ${avg((m) => m.exact)}  ${avg((m) => m.returns)}  ${avg((m) => m.oscillating)}     ${avg((m) => m.commonest)}  ${avg((m) => m.firstHeld)}  ${avg((m) => m.oneParity)}  ${mean(
        rows.map((m) => m.distinct),
      )
        .toFixed(1)
        .padStart(8)}`,
    );
  }
  console.log(
    `\nthe rate p the lead varies an offer at, entropy 0.3, ${seeds} seeds, ${bars} bars`,
  );
  console.log(header);
  const rated = loops(0.3, seeds, bars, BY_LICENCE, ['deaf', ...RATES]);
  for (const m of rated) console.log(row(m));
  const rates = RATES.map((r) => Number(r.slice(2)));
  console.log('\nKendall tau against p, per preset: recognised, A B A B');
  for (const p of BY_LICENCE) {
    const rows = RATES.map((r) => rated.find((m) => m.preset === p.name && m.condition === r)!);
    console.log(
      `${p.name.padEnd(14)} ${kendall(
        rates,
        rows.map((m) => m.recognised),
      ).toFixed(2)}  ${kendall(
        rates,
        rows.map((m) => m.oscillating),
      ).toFixed(2)}`,
    );
  }
}
