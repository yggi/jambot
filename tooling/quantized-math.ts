/**
 * A `Math.pow`, `Math.sin` or similar result may differ in its last bit on
 * another JavaScript engine (`random.ts`), so a value built from one must
 * not reach a choice — a `chance`, a `pick`, or a discrete decision such as
 * a comparison or a `Math.round` — unquantised (#45). There is no static
 * check for "reaches a choice", so this is the audit's first step: every
 * call to a transcendental `Math` function in the pure packages' own
 * sources is named here, with why its result is safe, and a new one that
 * isn't named here fails the check until it is.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The functions whose last bit isn't guaranteed to match across engines. */
const RISKY = ['pow', 'sin', 'cos', 'tan', 'exp', 'log', 'log2', 'asin', 'acos', 'atan'];
const CALL = new RegExp(`\\bMath\\.(${RISKY.join('|')})\\(`);

const PURE_SOURCES = [
  'packages/analyzer/src',
  'packages/engine/src',
  'packages/score/src',
  'packages/session/src',
  'packages/spectrum/src',
  'packages/theory/src',
] as const;

/** Where the audit found a risky call is safe, or waiting on a reason. */
export const AUDITED: Readonly<Record<string, string>> = {
  'packages/engine/src/random.ts':
    "chance() and pick()'s own gate: draw < quantize(p) and weights rounded to " +
    'QUANTUM before a total, pinned by the ulp tests in random.test.ts.',
  'packages/engine/src/lead.ts':
    'Math.sin feeds a contour, quantised then Math.round-ed before it becomes a ' +
    'step (T5), pinned by the ulp test in lead.test.ts.',
  'packages/engine/src/licence.ts':
    "Math.log2 bounds a tempo nudge at the tempo axis's ends; clamping to it is " +
    'continuous (a max or min of two values meets where they are equal), and ' +
    'the tempo it gives only glides, never reaching a chance(), pick() or round.',
  'packages/engine/src/style.ts':
    "glideTo's Math.pow/Math.exp compute a continuous glide value (tempo's log " +
    'space); nothing rounds or compares it directly, only chance()/pick() ' +
    'downstream, which quantise on their own.',
  'packages/engine/src/genre.ts':
    'Math.exp builds the softmax weights of a reading, which is measured and never ' +
    'drawn from here: a choice made from the probabilities goes through pick(), ' +
    'which rounds every weight to QUANTUM before it meets a draw.',
  'packages/engine/src/themes.ts':
    'Math.pow builds a weight table that only pick() reads, which rounds every ' +
    'weight to QUANTUM before it meets a draw.',
  'packages/theory/src/intervals.ts':
    "partial()'s Math.log2 is a fixed constant per integer n (a harmonic " +
    "series partial), not a per-play draw, and far from a semitone's rounding " +
    'boundary for the small n in use.',
  'packages/spectrum/src/corrector.ts':
    'Math.log2 turns a pitch into a note and Math.exp is the glide toward a snap: ' +
    'continuous values, moved only by a last bit. The one choice made from them ' +
    'is the nearest note of a scale, where a tie within 1e-9 is given to the higher, ' +
    'so a pitch half-way between two notes may go to either on another engine and ' +
    'either is right. It draws no chance() or pick().',
  'packages/spectrum/src/psola.ts':
    'Math.cos shapes the window a pulse is weighted by: a weight, continuous. Marks are ' +
    'placed by comparing the likeness of candidate places, which differ by far more ' +
    'than a last bit except where the sound is flat, where either place is as good.',
  'packages/spectrum/src/bands.ts':
    'Math.log2 counts the bands that fit between two frequencies, floored: at ' +
    'an exact boundary a band more or fewer is drawn, nothing is chosen from it, ' +
    'and the log10 of a magnitude is a height to draw.',
  'packages/spectrum/src/fft.ts':
    "Math.cos and Math.sin build the transform's twiddle factors and the window: " +
    'a last-bit difference moves a magnitude by a last bit, and the only decisions ' +
    'made from them (`peaks.ts`, `pitch.ts`) compare values that differ by far more, ' +
    'or between two near-equal candidates either of which is a right reading. No ' +
    'chance(), pick() or step is drawn from them, and a frame is heard, never ' +
    'replayed to the same bit on two machines.',
  'packages/spectrum/src/peaks.ts':
    'Math.log and Math.exp place a peak between bins from the logarithm of three ' +
    'magnitudes: a continuous value, read as a frequency to show, and a local ' +
    'maximum is decided by comparing magnitudes, not these results.',
  'packages/spectrum/src/signals.ts':
    'Math.sin makes a test signal: samples, not a choice, and the estimators are ' +
    'tested to a tolerance far above a last bit.',
  'packages/theory/src/tuning.ts':
    "pitchOf()'s Math.log2 reaches a Math.round, but only half-way between two " +
    'notes, where either neighbour is right and the cents it returns (about ±50) ' +
    'and the note agree either way, so an engine one ulp apart gives a reading ' +
    "as good; frequencyOf()'s power is a frequency to show or to compare, never a " +
    'chance(), pick() or a step.',
};

/** A repository as this check sees it: a reader over paths under a directory. */
export interface SourceRepo {
  files(dir: string): string[];
  read(path: string): string;
}

/** The pure-package source files, outside tests, that call a risky `Math` function. */
export function riskySources(repo: SourceRepo, dirs: readonly string[] = PURE_SOURCES): string[] {
  const found: string[] = [];
  for (const dir of dirs)
    for (const path of repo.files(dir)) {
      if (/\.test\.ts$/.test(path)) continue;
      if (CALL.test(repo.read(path))) found.push(path);
    }
  return found.sort();
}

/** The risky sources with no entry in `audited`: what the check refuses. */
export function unaudited(
  repo: SourceRepo,
  audited: Readonly<Record<string, string>> = AUDITED,
): string[] {
  return riskySources(repo).filter((path) => !(path in audited));
}

/** A `SourceRepo` over the real filesystem, rooted at `base`. */
export function diskSourceRepo(base: string): SourceRepo {
  const files = (dir: string): string[] => {
    const abs = join(base, dir);
    if (!statSync(abs, { throwIfNoEntry: false })?.isDirectory()) return [];
    const out: string[] = [];
    const walk = (rel: string) => {
      for (const name of readdirSync(join(abs, rel))) {
        const next = rel ? `${rel}/${name}` : name;
        if (statSync(join(abs, next)).isDirectory()) walk(next);
        else out.push(`${dir}/${next}`);
      }
    };
    walk('');
    return out;
  };
  return { files, read: (path) => readFileSync(join(base, path), 'utf8') };
}
