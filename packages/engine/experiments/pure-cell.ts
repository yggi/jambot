/**
 * E28: the pure cell (#287 step 0)
 *
 * A pure cell is chromatic: a cycle, onsets and heights in the twelve pitch
 * classes, with no key and no mode. A `Motif` is the same shape with its
 * heights pulled back along a scale (degrees and accidentals). This measures
 * what the chromatic form holds that the degree form does not, on the lead's
 * own bars (E20's corpus: every preset at entropy 0.3, 5 seeds, 64 bars; the
 * engine's own lead, not captured music), with the operators of `motifs.ts`
 * acting on both forms.
 *
 * 1. Representability. The share of lead bars whose every note is in the
 *    key's scale, its pentatonic, its blues scale, and the share of judged
 *    bars that need an accidental under the true key and under a key read a
 *    fifth or a semitone off. A chromatic cell needs none by construction.
 * 2. Identity. Per run (one library), the bars as distinct cells by shape
 *    (heights from the first note) and by orbit (the least of the shape
 *    under `rev`, `mirror` and `late`), for the chromatic form and the
 *    degree form. The degree form identifies a diatonic transposition with
 *    the shape; the chromatic form does not.
 * 3. Variations through the helix. The later bars of four-bar phrases (as
 *    E20) that are an earlier bar's image under an operator: in the degree
 *    form, in the chromatic form, in both and in one only. The operators act
 *    on the written notes, so this is with the lead's fit; the fit is not
 *    switched off here.
 * 4. A key misread. Bar pairs recognised in the degree form under the true
 *    key, then read again with the later bar under a key a fifth or a
 *    semitone off: how many are still recognised. The chromatic form is built
 *    from the notes and does not read a key, so it survives every misread by
 *    construction; it is not counted as a measurement.
 * 5. Structure, not a gate. How many bars' onset sets are arithmetic
 *    progressions in Z16 (a generator and a start, every step of it a stride,
 *    3 or more onsets) and how many pitch-class sets are arcs of the circle
 *    of fifths (a run of the orbit of 7 in Z12), with the share a random set
 *    of the same size would have (counted over every subset). The bass is
 *    read the same way.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/pure-cell.ts
 */

import { fileURLToPath } from 'node:url';
import { type Motif, type MotifOp, applyOp, motifProblems, recognise } from '@jambot/theory';
import {
  type HeardNote,
  type Key,
  PRESETS,
  SECTION_BARS,
  band,
  barStart,
  judgeBar,
} from '../src/index.ts';
import { melodicHelix } from '../src/key.ts';

const range = (n: number) => [...Array(n).keys()];
const mod = (a: number, n: number) => ((a % n) + n) % n;
const pct = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(1)}%`;

interface Note {
  readonly step: number;
  readonly note: number;
}
interface Bar {
  readonly bar: number;
  readonly key: Key;
  readonly lead: readonly Note[];
  readonly bass: readonly Note[];
  readonly heard: readonly HeardNote[];
}

/** Every run of E20's corpus: the lead's and the bass's written bars. */
function corpus(seeds = 5): Bar[][] {
  const runs: Bar[][] = [];
  for (const preset of PRESETS)
    for (let seed = 1; seed <= seeds; seed++) {
      const style = { ...preset.style, entropy: 0.3 };
      let carried = band.initial;
      const bars: Bar[] = [];
      for (let bar = 0; bar < 64; bar++) {
        const wish = { tonic: null, mode: preset.mode, melodic: null };
        const next = band.advance(
          { seed, bar, style, swing: preset.swing, wish, offer: null },
          carried,
          null,
        );
        carried = next.carried;
        const of = (part: string): Note[] =>
          next.output.written
            .filter((n) => n.part === part)
            .map((n) => ({ step: n.step, note: n.note }))
            .sort((a, b) => a.step - b.step);
        const heard: HeardNote[] = next.output.written
          .filter((n) => n.part === 'lead')
          .map((n) => ({
            note: n.note,
            velocity: 100,
            source: 'the lead',
            position: barStart(bar) + n.step,
            end: barStart(bar) + n.step + n.length,
          }));
        bars.push({ bar, key: next.output.plan.key, lead: of('lead'), bass: of('bass'), heard });
      }
      runs.push(bars);
    }
  return runs;
}

const motifOf = (b: Bar, key: Key): Motif | null => {
  const j = judgeBar(b.heard, b.bar, key, 'nearest').find((x) => x.kind === 'motif');
  return j?.kind === 'motif' ? j.motif : null;
};

/** The chromatic cell of a judged motif: its rhythm and rests, with the heights of the notes as played. */
function chromatic(motif: Motif, notes: readonly Note[]): Motif | null {
  const steps = [...new Set(notes.map((n) => n.step))];
  if (steps.length !== motif.degrees.filter((d) => d !== null).length) return null;
  let k = 0;
  const first = notes[0]!.note;
  return {
    cycle: motif.cycle,
    onsets: motif.onsets,
    degrees: motif.degrees.map((d) => (d === null ? null : notes[k++]!.note - first)),
    accidentals: motif.degrees.map(() => 0),
  };
}

const plain = (m: Motif): Motif => ({
  cycle: m.cycle,
  onsets: m.onsets,
  degrees: m.degrees,
  accidentals: m.accidentals,
});

/** A motif with its first note at degree 0: its shape. */
function shape(m: Motif): string {
  const first = m.degrees.find((d) => d !== null)!;
  return JSON.stringify({
    ...plain(m),
    degrees: m.degrees.map((d) => (d === null ? d : d - first)),
  });
}

/** The least shape of a motif under the operators on each axis: its orbit's representative. */
function orbit(m: Motif): string {
  let best = '';
  for (const rev of [false, true])
    for (const mirror of [false, true])
      for (let late = 0; late < m.cycle; late++) {
        const op: MotifOp = { strans: 0, mirror, late, rev };
        const s = shape(applyOp(op, plain(m)));
        if (best === '' || s < best) best = s;
      }
  return best;
}

const sameAs = (a: Motif, b: Motif) => recognise(a, b) !== null;

// ---- 5: arithmetic progressions ----------------------------------------------------------------

/** Is this set of residues mod n a run `r, r+g, r+2g, …` of one generator? */
export function isProgression(set: readonly number[], n: number): boolean {
  const m = set.length;
  if (m < 3 || m >= n) return false;
  const want = [...set].sort((a, b) => a - b).join();
  for (let g = 1; g < n; g++)
    for (const r of set) {
      const run = range(m).map((i) => (r + g * i) % n);
      if (new Set(run).size === m && run.sort((a, b) => a - b).join() === want) return true;
    }
  return false;
}

/** The share of m-subsets of Z_n that are progressions: what chance gives. */
export function chance(
  m: number,
  n: number,
  test: (set: readonly number[], n: number) => boolean,
): number {
  let all = 0;
  let aps = 0;
  const walk = (from: number, chosen: number[]) => {
    if (chosen.length === m) {
      all++;
      if (test(chosen, n)) aps++;
      return;
    }
    for (let x = from; x < n; x++) walk(x + 1, [...chosen, x]);
  };
  walk(0, []);
  return aps / all;
}

/** An arc of the circle of fifths: a run of the orbit of 7 in Z12. */
export const isFifthsArc = (pcs: readonly number[]) =>
  pcs.length >= 3 &&
  pcs.length < 12 &&
  [...pcs].some((r) => {
    const run = range(pcs.length).map((i) => (r + 7 * i) % 12);
    return (
      run
        .slice()
        .sort((a, b) => a - b)
        .join() === [...pcs].sort((a, b) => a - b).join()
    );
  });

/** Per size, the bars and those that are a progression: onset sets by their size, pitch-class sets by theirs. */
function structure(runs: Bar[][], part: 'lead' | 'bass') {
  const onsets = new Map<number, { bars: number; hits: number }>();
  const arcs = new Map<number, { bars: number; hits: number }>();
  const tally = (map: typeof onsets, size: number, hit: boolean) => {
    const row = map.get(size) ?? { bars: 0, hits: 0 };
    row.bars++;
    if (hit) row.hits++;
    map.set(size, row);
  };
  for (const bars of runs)
    for (const b of bars) {
      const steps = [...new Set(b[part].map((n) => n.step))];
      const pcs = [...new Set(b[part].map((n) => mod(n.note, 12)))];
      if (steps.length >= 3) tally(onsets, steps.length, isProgression(steps, 16));
      if (pcs.length >= 3) tally(arcs, pcs.length, isFifthsArc(pcs));
    }
  return { onsets, arcs };
}

// ---- the run -------------------------------------------------------------------------------------

export function measure(seeds = 5) {
  const runs = corpus(seeds);
  const accidentalKeys: [string, (k: Key) => Key][] = [
    ['true key', (k) => k],
    ['a fifth up', (k) => ({ ...k, tonic: mod(k.tonic + 7, 12) })],
    ['a semitone up', (k) => ({ ...k, tonic: mod(k.tonic + 1, 12) })],
  ];

  // 1. representability
  let leadBars = 0;
  const inScale = { key: 0, pentatonic: 0, blues: 0 };
  const accidental = accidentalKeys.map(() => ({ judged: 0, needs: 0 }));
  for (const bars of runs)
    for (const b of bars) {
      if (b.lead.length === 0) continue;
      leadBars++;
      const pcs = b.lead.map((n) => mod(n.note - b.key.tonic, 12));
      for (const scale of ['plain', 'pentatonic', 'blues'] as const) {
        const helix = melodicHelix(b.key, scale);
        const set = new Set(helix.heights.map((h) => mod(h - b.key.tonic, 12)));
        if (pcs.every((p) => set.has(p))) inScale[scale === 'plain' ? 'key' : scale]++;
      }
      accidentalKeys.forEach(([, read], i) => {
        const m = motifOf(b, read(b.key));
        if (!m) return;
        accidental[i]!.judged++;
        if (m.accidentals.some((a) => a !== 0)) accidental[i]!.needs++;
      });
    }

  // 2. identity, per run
  const identity = { bars: 0, dShape: 0, dOrbit: 0, cShape: 0, cOrbit: 0 };
  // 3. variations, 4. misread
  const vary = {
    later: 0,
    degree: 0,
    chroma: 0,
    both: 0,
    degreeOnly: 0,
    chromaOnly: 0,
    skipped: 0,
  };
  const misread = accidentalKeys.slice(1).map(() => ({ pairs: 0, kept: 0 }));
  for (const bars of runs) {
    const dShape = new Set<string>();
    const dOrbit = new Set<string>();
    const cShape = new Set<string>();
    const cOrbit = new Set<string>();
    const cells = new Map<number, { d: Motif; c: Motif }>();
    for (const b of bars) {
      const d = motifOf(b, b.key);
      const c = d && chromatic(d, b.lead);
      if (!d || !c) continue;
      if (motifProblems(d).length || motifProblems(c).length) continue;
      cells.set(b.bar, { d, c });
      identity.bars++;
      dShape.add(shape(d));
      dOrbit.add(orbit(d));
      cShape.add(shape(c));
      cOrbit.add(orbit(c));
    }
    identity.dShape += dShape.size;
    identity.dOrbit += dOrbit.size;
    identity.cShape += cShape.size;
    identity.cOrbit += cOrbit.size;

    for (let start = 0; start + 4 <= 64; start += SECTION_BARS / 2) {
      const phrase = range(4).map((i) => cells.get(start + i));
      if (phrase.some((p) => !p)) continue;
      for (let i = 1; i < 4; i++) {
        vary.later++;
        const here = phrase[i]!;
        const before = phrase.slice(0, i) as { d: Motif; c: Motif }[];
        const d = before.some((p) => sameAs(here.d, p.d));
        const c = before.some((p) => sameAs(here.c, p.c));
        if (d) vary.degree++;
        if (c) vary.chroma++;
        if (d && c) vary.both++;
        if (d && !c) vary.degreeOnly++;
        if (c && !d) vary.chromaOnly++;
        // 4: the later bar read under a key off the true one, the earlier as it was.
        if (d)
          accidentalKeys.slice(1).forEach(([, read], k) => {
            const bar = bars[start + i]!;
            const off = motifOf(bar, read(bar.key));
            misread[k]!.pairs++;
            if (off && before.some((p) => sameAs(off, p.d))) misread[k]!.kept++;
          });
      }
    }
  }

  return {
    leadBars,
    inScale,
    accidental: accidentalKeys.map(([name], i) => ({ name, ...accidental[i]! })),
    identity,
    vary,
    misread: accidentalKeys.slice(1).map(([name], i) => ({ name, ...misread[i]! })),
    lead: structure(runs, 'lead'),
    bass: structure(runs, 'bass'),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = measure();
  console.log(`1. representability, over ${r.leadBars} lead bars`);
  console.log(
    `   every note in: the key ${pct(r.inScale.key, r.leadBars)}, its pentatonic ${pct(r.inScale.pentatonic, r.leadBars)}, its blues ${pct(r.inScale.blues, r.leadBars)}`,
  );
  for (const a of r.accidental)
    console.log(
      `   a judged bar needs an accidental, read in ${a.name}: ${a.needs} of ${a.judged} (${pct(a.needs, a.judged)})`,
    );
  const i = r.identity;
  console.log(`2. identity, ${i.bars} bars in 70 runs (distinct cells, summed over runs)`);
  console.log(`   chromatic: shape ${i.cShape}, orbit ${i.cOrbit}`);
  console.log(`   degree:    shape ${i.dShape}, orbit ${i.dOrbit}`);
  const v = r.vary;
  console.log(
    `3. variations: ${v.later} later bars of phrases heard as an earlier bar's operator image`,
  );
  console.log(
    `   degree ${v.degree} (${pct(v.degree, v.later)}), chromatic ${v.chroma} (${pct(v.chroma, v.later)}); both ${v.both}, degree only ${v.degreeOnly}, chromatic only ${v.chromaOnly}`,
  );
  console.log('4. a key misread (the degree form; the chromatic form is built from notes)');
  for (const m of r.misread)
    console.log(
      `   later bar read ${m.name}: ${m.kept} of ${m.pairs} recognised pairs (${pct(m.kept, m.pairs)}) still recognised`,
    );
  const table = (title: string, map: Map<number, { bars: number; hits: number }>, n: number) => {
    console.log(`   ${title}`);
    console.log('   size   bars   hits     chance');
    for (const [size, row] of [...map].sort((x, y) => x[0] - y[0]))
      console.log(
        `   ${String(size).padStart(4)}  ${String(row.bars).padStart(5)}  ${pct(row.hits, row.bars).padStart(6)}  ${pct(100 * chance(size, n, n === 16 ? isProgression : isFifthsArc), 100).padStart(6)}`,
      );
  };
  for (const part of ['lead', 'bass'] as const) {
    console.log(`5. structure, ${part}`);
    table('onset sets that are a progression in Z16', r[part].onsets, 16);
    table('pitch-class sets that are an arc of the circle of fifths', r[part].arcs, 12);
  }
}
