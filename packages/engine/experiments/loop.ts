/**
 * E21: the loop closed with no players, the Muse hearing the band's own lead
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
 * Its cost is the Muse's recognition, every motif heard against every one
 * she remembers under every operator: 3 seeds of 128 bars, the default,
 * take about 25 s, and 5 seeds of 256 bars about 85 s.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/loop.ts [seeds] [bars]
 */

import { fileURLToPath } from 'node:url';
import { type Motif, NOOP, recognise } from '@jambot/theory';
import {
  type HeardNote,
  type Judgement,
  type Key,
  LISTEN_DELAY,
  type MuseCarried,
  type Reading,
  PRESETS,
  type Preset,
  SECTION_BARS,
  band,
  barStart,
  judgeBar,
  keptAfter,
  muse,
} from '../src/index.ts';

/** Whether the Muse's offer goes back into the band. */
export type Condition = 'deaf' | 'hearing';

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
): LoopBar[] {
  const style = { ...preset.style, entropy };
  const wish = { tonic: null, mode: preset.mode, melodic: null };
  let playing = band.initial;
  let listening: MuseCarried = muse.initial;
  let pending: HeardNote[] = [];
  const keys: Key[] = [];
  const heard: LoopBar[] = [];
  for (let bar = 0; bar < bars + LISTEN_DELAY; bar++) {
    const judged = bar - LISTEN_DELAY;
    if (judged >= 0) {
      const judgements = judgeBar(pending, judged, keys[judged]!, reading);
      const next = muse.advance({ bar: judged }, listening, { judgements, forget: false });
      listening = next.carried;
      pending = keptAfter(pending, judged);
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
    const offer = condition === 'hearing' ? listening.offer : null;
    const next = band.advance({ seed, bar, style, wish, offer }, playing, null);
    playing = next.carried;
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

/** What E21 measures of a preset's runs at one entropy and condition. */
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

/** E21's measures over runs of one preset, entropy and condition. */
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

/** E21 for `presets` (every preset, the narrowest licence first) at `entropy`, in both conditions, over `seeds` seeds of `bars` bars. */
export function loops(
  entropy: number,
  seeds: number,
  bars: number,
  presets: readonly Preset[] = BY_LICENCE,
): LoopMeasure[] {
  return presets.flatMap((preset) =>
    (['deaf', 'hearing'] as const).map((condition) =>
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [seeds = 3, bars = 128] = process.argv.slice(2).map(Number);
  const pct = (x: number) => `${(100 * x).toFixed(1)}%`.padStart(6);
  const all: LoopMeasure[] = [];
  for (const entropy of [0, 0.3, 0.6, 1]) {
    console.log(`\nentropy ${entropy}, ${seeds} seeds, ${bars} bars`);
    console.log(
      'preset         condition  playing   recog   exact  novelty  longest (any)  stalled     osc  return  distinct  commonest  first  parity',
    );
    for (const m of loops(entropy, seeds, bars)) {
      all.push(m);
      console.log(
        [
          m.preset.padEnd(14),
          m.condition.padEnd(9),
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
        ].join('  '),
      );
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
}
