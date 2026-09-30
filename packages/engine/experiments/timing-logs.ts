/**
 * E21: how do real hands follow a beat, and how does the Muse read them?
 * (#204, A7)
 *
 * Reads a file downloaded from the app's timing test (the lobby's Timing
 * test, "Download all (JSON)"; `apps/web/src/timing-test/run.ts` says what
 * it holds) and prints, per run and per input:
 *
 * - how far each tap was from the hit it answered: the mean (where the
 *   player sits against what they heard), the spread within the run, and
 *   the spread that is left when a run's own mean is taken off;
 * - the serial correlation of the offsets (a slow drift, or independent
 *   jitter), and the mean by bar (learning, or losing the beat);
 * - the mean and spread by sound and step of the pattern (an offbeat hit
 *   is late, or a downbeat early);
 * - the Muse's reading of the taps, bar by bar, against the pattern: the
 *   share of bars whose onsets all land on the steps the pattern has them
 *   on, read by the nearest step and read as phrases (`heardInBar`).
 *
 * A tap that follows another of the on-screen tap by less than 150 ms is
 * dropped: files written before the click that follows a pointer was
 * ignored have each tap twice.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/timing-logs.ts <file.json>
 */

import { readFileSync } from 'node:fs';
import { type HeardNote, heardInBar } from '../src/index.ts';

interface Tap {
  source: string;
  kind: string;
  eventMs: number;
  handledMs: number;
  heardAt: number;
  hit: number | null;
  offsetMs: number | null;
  velocity: number | null;
}
interface Expected {
  bar: number;
  step: number;
  sound: string;
}
interface Run {
  id: string;
  pattern: string;
  bpm: number;
  bars: number;
  stepSeconds: number;
  windowMs: number;
  taps: Tap[];
  expected: Expected[];
  environment: { userAgent: string; outputLatency: number | null };
}

const path = process.argv[2];
if (!path) throw new Error('give the file downloaded from the timing test');
const file = JSON.parse(readFileSync(path, 'utf8')) as { format: string; runs: Run[] };
if (file.format !== 'jambot timing test') throw new Error(`not a timing test file: ${file.format}`);

const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const sd = (x: number[]) => Math.sqrt(mean(x.map((a) => (a - mean(x)) ** 2)));
const median = (x: number[]) => {
  const s = [...x].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};
const ac1 = (x: number[]) => {
  const m = mean(x);
  const den = x.reduce((s, a) => s + (a - m) ** 2, 0);
  return x.slice(1).reduce((s, a, i) => s + (a - m) * (x[i]! - m), 0) / den;
};
const f = (x: number, digits = 0) => x.toFixed(digits).padStart(digits ? 6 : 4);

const taken = (run: Run) =>
  run.taps.filter(
    (t, i, all) =>
      !(i > 0 && t.source === 'the on-screen tap' && t.eventMs - all[i - 1]!.eventMs < 150),
  );
const answered = (run: Run) => taken(run).filter((t) => t.hit !== null);
const sourceOf = (run: Run) => taken(run)[0]?.source.split(':')[0] ?? 'no taps';

console.log(`${file.runs.length} runs, ${path}`);
const first = file.runs[0];
if (first)
  console.log(
    `${first.environment.userAgent}; output latency ${first.environment.outputLatency} s\n`,
  );

console.log(
  'run       input           pattern  bpm  hits/taps  mean median  sd  robust-sd  lag-1  by bar',
);
const bySource = new Map<string, { offsets: number[]; centred: number[] }>();
for (const run of file.runs) {
  const off = answered(run).map((t) => t.offsetMs!);
  if (off.length < 3) continue;
  const m = mean(off);
  const mad = 1.4826 * median(off.map((o) => Math.abs(o - median(off))));
  const bars = Array.from({ length: run.bars }, (_, bar) => {
    const here = answered(run)
      .filter((t) => run.expected[t.hit!]!.bar === bar)
      .map((t) => t.offsetMs!);
    return here.length ? Math.round(mean(here)) : '–';
  });
  console.log(
    `${run.id.slice(11, 19)}  ${sourceOf(run).slice(0, 14).padEnd(14)}  ${run.pattern.padEnd(9)}${String(run.bpm).padStart(3)}  ${String(off.length).padStart(3)}/${String(taken(run).length).padEnd(3)}  ${f(m, 1)} ${f(median(off), 1)} ${f(sd(off), 1)} ${f(mad, 1)}  ${f(ac1(off), 2)}  ${bars.join(' ')}`,
  );
  const s = bySource.get(sourceOf(run)) ?? { offsets: [], centred: [] };
  s.offsets.push(...off);
  s.centred.push(...off.map((o) => o - m));
  bySource.set(sourceOf(run), s);
}

console.log('\nby input: taps, mean, median, spread, spread within a run (its own mean off)');
for (const [source, s] of bySource)
  console.log(
    `${source.padEnd(16)} ${String(s.offsets.length).padStart(4)} ${f(mean(s.offsets), 1)} ${f(median(s.offsets), 1)} ${f(sd(s.offsets), 1)} ${f(sd(s.centred), 1)}`,
  );

console.log('\nby sound and step of the pattern: taps, mean, spread');
const cells = new Map<string, number[]>();
for (const run of file.runs)
  for (const t of answered(run)) {
    const e = run.expected[t.hit!]!;
    const key = `${run.pattern.padEnd(9)} ${e.sound.padEnd(5)} step ${String(e.step).padStart(2)}`;
    cells.set(key, [...(cells.get(key) ?? []), t.offsetMs!]);
  }
for (const key of [...cells.keys()].sort()) {
  const x = cells.get(key)!;
  console.log(`${key}  ${String(x.length).padStart(3)} ${f(mean(x), 1)} ${f(sd(x), 1)}`);
}

console.log('\nthe Muse on these taps: bars whose onsets all land on the pattern’s steps');
const total = { nearest: [0, 0], phrases: [0, 0] } as Record<
  'nearest' | 'phrases',
  [number, number]
>;
for (const run of file.runs) {
  const notes: HeardNote[] = taken(run).map((t) => ({
    note: 60,
    velocity: t.velocity ?? 100,
    source: 'player',
    position: 32 + t.heardAt / run.stepSeconds,
    end: null,
  }));
  const line: string[] = [];
  for (const reading of ['nearest', 'phrases'] as const) {
    let right = 0;
    for (let bar = 0; bar < run.bars; bar++) {
      const wanted = run.expected.filter((e) => e.bar === bar).map((e) => e.step);
      const read = heardInBar(notes, bar + 2, reading)
        .flatMap((h) => h.notes)
        .map((n) => Math.round(n.position) - 16 * (bar + 2));
      if (read.length === wanted.length && read.every((s, i) => s === wanted[i])) right++;
    }
    total[reading][0] += right;
    total[reading][1] += run.bars;
    line.push(`${reading} ${right}/${run.bars}`);
  }
  console.log(
    `${run.id.slice(11, 19)}  ${run.pattern.padEnd(9)}${String(run.bpm).padStart(3)}  ${line.join('  ')}`,
  );
}
console.log(
  `all: nearest ${total.nearest[0]}/${total.nearest[1]}, phrases ${total.phrases[0]}/${total.phrases[1]}`,
);
