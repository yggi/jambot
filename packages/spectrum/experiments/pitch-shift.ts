/**
 * Correcting live audio toward a score's notes (#269's follow-up): how well
 * two pitch shifters move a sound, what a live pitch tracker costs in delay
 * and accuracy, and what a corrector that snaps to a scale and glides does
 * to a wandering voice or a theremin. On synthetic signals only, in Node:
 * what it cannot measure is the output latency of real hardware, and how
 * any of it sounds (the clips it writes are for listening).
 *
 * What it found, at 48 kHz, in Node, on synthetic signals (steady sines,
 * a vowel of three formants, a theremin-like sine, each wandering 25 cents
 * and with or without a 25-cent vibrato at 5.5 Hz):
 *
 * - **The shifters are not the problem.** Given the true period, both put a
 *   steady sound on the pitch asked for within 0.1 cents (PSOLA within 1.2
 *   on a 110 Hz vowel, flat), from 300 cents down to 300 up, and keep the
 *   level within 1 dB (PSOLA within 2.7). A vowel's formants move with the
 *   pitch in the phase vocoder, 2.4 dB off at 100 cents and 7 at 300, and in
 *   PSOLA stay within 3 dB at any shift, though a two-period window blurs
 *   formants narrower than the harmonics.
 * - **The tracker is.** A tracker that has only the past lags the pitch by
 *   half its window: 12 ms at 1024 samples, 22 to 24 at 2048, 42 to 65 at
 *   4096, and its fine error at that lag is 2 to 3 cents at 1024 and 5 to 20
 *   at 2048 and over, since a window of 43 ms spans a glide or half a vibrato. A window
 *   of 1024 holds only 2.3 periods of an A2, and is more than 300 cents off
 *   1.8 % of the time (5.8 % at 4096, on the lowest notes).
 * - **A hard retune works: 1 to 4 cents from the note a singer meant**, from
 *   a wander of 18 to 20, through a tracker of 1024: PSOLA 1.3 to 3.8 cents,
 *   the vocoder 0.5 to 3.1. It takes a 5.5 Hz vibrato out as well (the lag
 *   is a fifteenth of its cycle). A glide of 50 ms leaves 4 to 5 cents, and 11 to 12 with vibrato;
 *   200 ms leaves 10 to 11, and 16 with vibrato, which it keeps.
 * - **PSOLA is the cheaper and the quicker**: 13 to 40 ms of work for a
 *   second of sound (25 to 35 times real time) against 40 to 70 for the
 *   vocoder, which also waits a window (21 to 85 ms) and, with a slow tracker
 *   and a vibrato, came out 7 cents off where PSOLA was 2.6. The tracker is
 *   the dearest part: a look every 128 samples costs 180 ms a second at 1024
 *   (5.5 times real time) and 300 at 2048, so a look every 256 or 512 is the
 *   way to run it.
 * - **A live total**, algorithmic only: a tracker of 1024 (12 ms) plus a
 *   period of PSOLA's lookahead (2 ms at A5, 9 ms at A2, 24 at E1) plus a
 *   block of 2.7 ms is 15 to 40 ms before the audio hardware, on a core with
 *   room to spare. What real hardware adds, and how any of it sounds, this
 *   does not measure. The clips it writes are for listening.
 *
 * Run: node --experimental-strip-types --no-warnings packages/spectrum/experiments/pitch-shift.ts [out-dir]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { estimatePitch, findPeaks, rms, spectrumOf } from '../src/index.ts';
import { type PeriodAt, phaseVocoder, psola } from './shifters.ts';

const SR = 48000;
const cents = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);
const hzOfNote = (note: number) => 440 * 2 ** ((note - 69) / 12);
const noteOfHz = (hz: number) => 69 + 12 * Math.log2(hz / 440);

// --- signals ---------------------------------------------------------------

/** Loudness of a vowel's harmonic at a frequency: two formants, as an /a/. */
const formants = [
  { f: 700, bandwidth: 130, gain: 1 },
  { f: 1220, bandwidth: 90, gain: 0.7 },
  { f: 2600, bandwidth: 160, gain: 0.25 },
];
const vowelGain = (hz: number) =>
  formants.reduce(
    (sum, { f, bandwidth, gain }) => sum + gain / (1 + ((hz - f) / bandwidth) ** 2),
    0.02,
  );

type Timbre = 'sine' | 'vowel';

/** A voiced sound from its pitch at every sample, in Hz: harmonics with phases that run on, a vowel's formants fixed in frequency. */
function voiced(f0: ArrayLike<number>, timbre: Timbre): Float64Array {
  const n = f0.length;
  const out = new Float64Array(n);
  const maxHarmonics = timbre === 'sine' ? 1 : 60;
  const phases = new Float64Array(maxHarmonics + 1);
  for (let i = 0; i < n; i++) {
    const hz = f0[i]!;
    let sample = 0;
    for (let k = 1; k <= maxHarmonics && k * hz < SR / 2.2; k++) {
      phases[k]! += (2 * Math.PI * k * hz) / SR;
      const amplitude = timbre === 'sine' ? 1 : vowelGain(k * hz) / k;
      sample += amplitude * Math.sin(phases[k]!);
    }
    out[i] = sample;
  }
  const scale = 0.5 / Math.max(1e-9, peakOf(out));
  return out.map((v) => v * scale);
}

/** The largest absolute sample. */
const peakOf = (x: ArrayLike<number>) => {
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]!));
  return peak;
};

const steady = (hz: number, seconds: number) => new Float64Array(Math.round(seconds * SR)).fill(hz);

// --- pitch tracking --------------------------------------------------------

/** The period at each sample from a tracker that has only the past: the estimate from the window that ends there, held between looks. */
function causalPeriods(x: ArrayLike<number>, window: number, hop = 128, minHz = 60): PeriodAt {
  const looks = Math.ceil(x.length / hop);
  const periods = new Float64Array(looks).fill(Number.NaN);
  let held = Number.NaN;
  for (let j = 0; j < looks; j++) {
    const end = j * hop;
    if (end >= window) {
      const found = estimatePitch(Array.prototype.slice.call(x, end - window, end), SR, {
        minHz,
        maxHz: 1500,
        minClarity: 0.6,
      });
      if (found) held = SR / found.hz;
    }
    periods[j] = held;
  }
  return (i) => periods[Math.min(looks - 1, Math.floor(i / hop))]!;
}

/** The pitch of a signal over time, in Hz, from windows of `frame` samples each `hop` apart, centred on their time. */
function pitchTrack(x: ArrayLike<number>, frame = 4096, hop = 512) {
  const track: { time: number; hz: number | null }[] = [];
  for (let start = 0; start + frame <= x.length; start += hop) {
    const found = estimatePitch(Array.prototype.slice.call(x, start, start + frame), SR, {
      minHz: 60,
      maxHz: 1500,
      minClarity: 0.6,
    });
    track.push({ time: (start + frame / 2) / SR, hz: found?.hz ?? null });
  }
  return track;
}

// --- measurements ----------------------------------------------------------

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const rmsOf = (xs: number[]) => Math.sqrt(mean(xs.map((x) => x * x)));
const std = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));

/** The share of a frame's energy within 30 cents of the harmonics of `hz`, and how far each harmonic's level is from what the vowel would have there (the formants staying where they were). */
function harmonicShape(x: Float64Array, hz: number, timbre: Timbre) {
  const frame = 16384;
  const start = Math.floor((x.length - frame) / 2);
  const spectrum = spectrumOf(Array.prototype.slice.call(x, start, start + frame), SR);
  let near = 0;
  let total = 0;
  const harmonics: number[] = [];
  const band = 2 ** (30 / 1200);
  spectrum.magnitudes.forEach((m, k) => {
    const f = k * spectrum.binHz;
    total += m * m;
    const h = Math.round(f / hz);
    if (h >= 1 && f >= (h * hz) / band && f <= h * hz * band) near += m * m;
  });
  const peaks = findPeaks(spectrum, { minMagnitude: 1e-4 });
  for (let h = 1; h * hz < 6000; h++) {
    const found = peaks
      .filter((p) => Math.abs(cents(p.hz, h * hz)) < 30)
      .sort((a, b) => b.magnitude - a.magnitude)[0];
    harmonics.push(found ? 20 * Math.log10(found.magnitude) : Number.NaN);
  }
  let formantError = Number.NaN;
  if (timbre === 'vowel') {
    const model = harmonics.map((_, i) => 20 * Math.log10(vowelGain((i + 1) * hz) / (i + 1)));
    const top = Math.max(...model);
    const measuredTop = Math.max(...harmonics.filter((v) => !Number.isNaN(v)));
    const diffs = harmonics
      .map((db, i) =>
        Number.isNaN(db) || model[i]! < top - 30
          ? null
          : Math.abs(db - measuredTop - (model[i]! - top)),
      )
      .filter((d): d is number => d !== null);
    formantError = diffs.length ? mean(diffs) : Number.NaN;
  }
  return { purity: near / total, formantError };
}

// --- experiment A: the shifters on their own, given the true period --------

type Shifter = {
  name: string;
  run: (x: Float64Array, hz: number, ratio: (i: number) => number) => Float64Array;
};
const shifters: Shifter[] = [
  { name: 'psola', run: (x, hz, ratio) => psola(x, () => SR / hz, ratio) },
  { name: 'pv 1024', run: (x, _hz, ratio) => phaseVocoder(x, SR, ratio, { frame: 1024 }) },
  { name: 'pv 2048', run: (x, _hz, ratio) => phaseVocoder(x, SR, ratio, { frame: 2048 }) },
  { name: 'pv 4096', run: (x, _hz, ratio) => phaseVocoder(x, SR, ratio, { frame: 4096 }) },
];

function experimentA() {
  const rows: Record<string, unknown>[] = [];
  const cases: [string, Timbre, number][] = [
    ['sine 220', 'sine', 220],
    ['vowel 110', 'vowel', 110],
    ['vowel 220', 'vowel', 220],
    ['vowel 440', 'vowel', 440],
  ];
  for (const [label, timbre, hz] of cases) {
    const x = voiced(steady(hz, 2), timbre);
    const base = harmonicShape(x, hz, timbre);
    rows.push({
      signal: label,
      shifter: 'input',
      shift: 0,
      pitchError: 0,
      purity: +base.purity.toFixed(3),
      formantError: +base.formantError.toFixed(1),
      levelDb: 0,
    });
    for (const shift of shifters)
      for (const shiftCents of [-100, -50, 50, 100, 300]) {
        const ratio = 2 ** (shiftCents / 1200);
        const out = shift.run(x, hz, () => ratio);
        const track = pitchTrack(out.slice(Math.round(0.4 * SR), Math.round(1.6 * SR)), 8192, 2048)
          .map((p) => (p.hz ? cents(p.hz, hz * ratio) : Number.NaN))
          .filter((c) => !Number.isNaN(c));
        const shape = harmonicShape(out, hz * ratio, timbre);
        const mid = (v: Float64Array) => v.slice(Math.round(0.4 * SR), Math.round(1.6 * SR));
        rows.push({
          signal: label,
          shifter: shift.name,
          shift: shiftCents,
          pitchError: +mean(track).toFixed(2),
          pitchSpread: +std(track).toFixed(2),
          formantError: +shape.formantError.toFixed(1),
          levelDb: +(20 * Math.log10(rms(mid(out)) / rms(mid(x)))).toFixed(1),
        });
      }
  }
  return rows;
}

// --- experiment B: the tracker, on a pitch that moves -----------------------

/** A pitch contour of notes with a glide between, plus a vibrato and a slow wander, in Hz at every sample, and the note intended at each. */
function contour(seconds: number, notes: number[], vibratoCents: number, wanderCents: number) {
  const n = Math.round(seconds * SR);
  const hz = new Float64Array(n);
  const intended = new Float64Array(n);
  const each = seconds / notes.length;
  const glide = 0.08;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = Math.min(notes.length - 1, Math.floor(t / each));
    const into = t - k * each;
    const previous = notes[Math.max(0, k - 1)]!;
    const note =
      k > 0 && into < glide ? previous + (notes[k]! - previous) * (into / glide) : notes[k]!;
    intended[i] = notes[k]!;
    const off =
      vibratoCents * Math.sin(2 * Math.PI * 5.5 * t) +
      wanderCents * Math.sin(2 * Math.PI * 0.7 * t + 1);
    hz[i] = hzOfNote(note + off / 100);
  }
  return { hz, intended, each };
}

function experimentB() {
  const rows: Record<string, unknown>[] = [];
  for (const [label, timbre, notes] of [
    ['vowel, low (A2 to E3)', 'vowel', [45, 47, 49, 52, 50, 47, 45, 52]],
    ['vowel, mid (A3 to E4)', 'vowel', [57, 59, 61, 64, 62, 59, 57, 64]],
    ['sine, theremin (A4 to E5)', 'sine', [69, 71, 73, 76, 74, 71, 69, 76]],
  ] as [string, Timbre, number[]][]) {
    const { hz } = contour(3, notes, 25, 25);
    const x = voiced(hz, timbre);
    for (const window of [1024, 2048, 4096]) {
      const periods = causalPeriods(x, window);
      const errors: number[] = [];
      let missing = 0;
      for (let i = SR / 2; i < x.length; i += 240) {
        const p = periods(i);
        if (Number.isNaN(p)) missing++;
        else errors.push(cents(SR / p, hz[i]!));
      }
      const gross = errors.filter((e) => Math.abs(e) > 300).length;
      // The lag: the delay at which the tracker's pitch best matches the true pitch.
      // Gross errors (an octave or a fifth off, over 300 cents) are counted apart from the fine error of the rest.
      let bestLag = 0;
      let bestError = Infinity;
      for (let lag = 0; lag <= window; lag += 48) {
        const e: number[] = [];
        for (let i = SR / 2; i < x.length; i += 240) {
          const p = periods(i);
          if (!Number.isNaN(p) && i - lag >= 0) {
            const c = cents(SR / p, hz[i - lag]!);
            if (Math.abs(c) <= 300) e.push(c);
          }
        }
        const r = rmsOf(e);
        if (r < bestError) [bestError, bestLag] = [r, lag];
      }
      rows.push({
        signal: label,
        window,
        windowMs: +((window / SR) * 1000).toFixed(1),
        grossPct: +((100 * gross) / errors.length).toFixed(1),
        lagMs: +((bestLag / SR) * 1000).toFixed(1),
        fineErrorAtLagRms: +bestError.toFixed(1),
        lostPct: +((100 * missing) / (missing + errors.length)).toFixed(1),
      });
    }
  }
  return rows;
}

// --- experiment C: a corrector, end to end ---------------------------------

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
/** The nearest note of C major to a note number, fractional. */
function nearestInScale(note: number): number {
  const base = Math.floor(note / 12) * 12;
  let best = base;
  for (const octave of [base - 12, base, base + 12])
    for (const degree of MAJOR)
      if (Math.abs(octave + degree - note) < Math.abs(best - note)) best = octave + degree;
  return best;
}

interface Correction {
  ratio: Float64Array;
  /** What the corrector believed the input's pitch was, per look. */
}

/** The ratio at each sample from a corrector: it reads the input's pitch (from the causal tracker's period), snaps to a note of the scale, and glides its offset toward the snap with time constant `tau` seconds. */
function corrector(periods: PeriodAt, n: number, tau: number, hop = 128): Correction {
  const ratio = new Float64Array(n).fill(1);
  let offset = 0;
  for (let i = 0; i < n; i += hop) {
    const p = periods(i);
    if (!Number.isNaN(p)) {
      const note = noteOfHz(SR / p);
      // What is heard is the input moved by the offset already applied: the target is what the snap asks of the input as it is.
      const want = (nearestInScale(note) - note) * 100;
      offset = tau <= 0 ? want : offset + (want - offset) * (1 - Math.exp(-hop / (tau * SR)));
    }
    ratio.fill(2 ** (offset / 1200), i, Math.min(n, i + hop));
  }
  return { ratio };
}

function experimentC(clips: string | null) {
  const rows: Record<string, unknown>[] = [];
  const notes = [57, 59, 60, 64, 62, 59, 57, 64]; // A B C E D B A E: all in C major
  const scenes: [string, Timbre, number[]][] = [
    ['vowel A3-E4', 'vowel', notes],
    ['theremin A4-E5', 'sine', notes.map((n) => n + 12)],
  ];
  for (const [label, timbre, scene] of scenes)
    for (const vibrato of [0, 25]) {
      const { hz, intended, each } = contour(4, scene, vibrato, 25);
      const x = voiced(hz, timbre);
      const name = `${label}, ${vibrato ? 'vibrato 25 cents' : 'no vibrato'}`;
      const measure = (y: Float64Array) => {
        const errors: number[] = [];
        let off = 0;
        let heard = 0;
        let looks = 0;
        let gross = 0;
        for (const { time, hz: found } of pitchTrack(y, 4096, 1024)) {
          // Past the glide and the tracker's lag, and short of the next note, which the 85 ms window would reach into.
          const settled = time > 0.3 && time % each > 0.22 && time % each < each - 0.06;
          if (!settled) continue;
          looks++;
          if (!found) continue;
          heard++;
          const note = noteOfHz(found);
          const error = (note - intended[Math.round(time * SR)]!) * 100;
          if (Math.abs(error) > 300) gross++;
          else errors.push(error);
          if (Math.abs(note - nearestInScale(note)) * 100 > 30) off++;
        }
        return {
          error: rmsOf(errors),
          grossPct: (100 * gross) / Math.max(1, heard),
          offScalePct: (100 * off) / Math.max(1, heard),
          heardPct: (100 * heard) / Math.max(1, looks),
        };
      };
      const row = (how: string, m: ReturnType<typeof measure>, cost?: number) =>
        rows.push({
          signal: name,
          how,
          errorRms: +m.error.toFixed(1),
          grossPct: +m.grossPct.toFixed(0),
          offScalePct: +m.offScalePct.toFixed(0),
          heardPct: +m.heardPct.toFixed(0),
          msPerSecond: cost === undefined ? '' : +(cost / 4).toFixed(0),
        });
      row('input (no correction)', measure(x));
      const tag = `${label.split(' ')[0]}-${vibrato ? 'vibrato' : 'plain'}`;
      if (clips) writeWav(join(clips, `${tag}-input.wav`), x);
      for (const window of [1024, 2048]) {
        const periods = causalPeriods(x, window);
        for (const tau of [0, 0.05, 0.2]) {
          const { ratio } = corrector(periods, x.length, tau);
          const ratioAt = (i: number) => ratio[Math.min(x.length - 1, i)]!;
          for (const [shifter, run] of [
            ['psola', () => psola(x, periods, ratioAt)],
            ['pv 2048', () => phaseVocoder(x, SR, ratioAt, { frame: 2048 })],
          ] as [string, () => Float64Array][]) {
            const t0 = performance.now();
            const y = run();
            const cost = performance.now() - t0;
            row(
              `${shifter}, tracker ${window}, retune ${tau === 0 ? 'hard' : `${tau * 1000} ms`}`,
              measure(y),
              cost,
            );
            if (clips && window === 1024 && tau <= 0.05)
              writeWav(
                join(
                  clips,
                  `${tag}-${shifter.replace(' ', '')}-retune-${tau === 0 ? 'hard' : '50ms'}.wav`,
                ),
                y,
              );
          }
        }
      }
    }
  return rows;
}

// --- experiment D: compute --------------------------------------------------

function experimentD() {
  const x = voiced(steady(220, 10), 'vowel');
  const rows: Record<string, unknown>[] = [];
  const time = (name: string, run: () => void) => {
    run(); // warm
    const t0 = performance.now();
    run();
    const ms = performance.now() - t0;
    rows.push({
      stage: name,
      msPerSecondOfAudio: +(ms / 10).toFixed(1),
      realTimeFactor: +(10000 / ms).toFixed(1),
    });
  };
  time(
    'psola (true period)',
    () =>
      void psola(
        x,
        () => SR / 220,
        () => 1.05,
      ),
  );
  for (const frame of [1024, 2048, 4096])
    time(`phase vocoder ${frame}`, () => void phaseVocoder(x, SR, () => 1.05, { frame }));
  for (const window of [1024, 2048, 4096])
    time(`tracker ${window}, a look every 128 samples`, () => void causalPeriods(x, window));
  return rows;
}

// --- output -----------------------------------------------------------------

function writeWav(path: string, x: Float64Array) {
  const peak = Math.max(1e-9, peakOf(x));
  const data = Buffer.alloc(x.length * 2);
  x.forEach((v, i) => data.writeInt16LE(Math.round((v / peak) * 0.8 * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}

const out = process.argv[2] ?? null;
if (out) mkdirSync(out, { recursive: true });
const tables = {
  A_shifters: experimentA(),
  B_tracker: experimentB(),
  C_corrector: experimentC(out),
  D_compute: experimentD(),
};
for (const [name, rows] of Object.entries(tables)) {
  console.log(`\n== ${name}`);
  console.table(rows);
}
if (out) writeFileSync(join(out, 'pitch-shift.json'), JSON.stringify(tables, null, 1));
