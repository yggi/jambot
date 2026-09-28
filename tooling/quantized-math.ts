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
  'packages/engine/src/style.ts':
    "glideTo's Math.pow/Math.exp compute a continuous glide value (tempo's log " +
    'space); nothing rounds or compares it directly, only chance()/pick() ' +
    'downstream, which quantise on their own.',
  'packages/engine/src/themes.ts':
    'Math.pow builds a weight table that only pick() reads, which rounds every ' +
    'weight to QUANTUM before it meets a draw.',
  'packages/theory/src/intervals.ts':
    "partial()'s Math.log2 is a fixed constant per integer n (a harmonic " +
    "series partial), not a per-play draw, and far from a semitone's rounding " +
    'boundary for the small n in use.',
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
