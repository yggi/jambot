/**
 * Named rhythms and Euclidean patterns, as onsets over a cycle of steps.
 *
 * `E(k,n,rot)` is the primitive itself. Named rhythms that are maximally even
 * are taken from it; the claves that are not are listed as onsets.
 */

import { even } from './even.ts';
import { normalizeWords } from './words.ts';

export interface Rhythm {
  /** Steps in one cycle. */
  steps: number;
  onsets: number[];
}

export interface NamedRhythm extends Rhythm {
  even: boolean;
  aliases: readonly string[];
}

export const RHYTHMS: Record<string, NamedRhythm> = {
  tresillo: { steps: 8, onsets: even(3, 8), even: true, aliases: [] },
  cinquillo: { steps: 8, onsets: even(5, 8, 6), even: true, aliases: [] },
  'son clave': {
    steps: 16,
    onsets: [0, 3, 6, 10, 12],
    even: false,
    aliases: ['clave', '3 2 son clave'],
  },
  'rumba clave': { steps: 16, onsets: [0, 3, 7, 10, 12], even: false, aliases: ['rumba'] },
  'bossa clave': {
    steps: 16,
    onsets: even(5, 16, 6),
    even: true,
    aliases: ['bossa', 'bossa nova'],
  },
  'four on the floor': { steps: 16, onsets: even(4, 16), even: true, aliases: [] },
  backbeat: { steps: 16, onsets: even(2, 16, 4), even: true, aliases: ['back beat'] },
  samba: { steps: 16, onsets: even(7, 16), even: true, aliases: [] },
};

const EUCLID_PATTERN = /^(?:e|euclid)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(-?\d+)\s*)?\)$/i;
const OF_PATTERN = /^(\d+)\s+of\s+(\d+)$/i;

export function parseRhythm(text: string): Rhythm | undefined {
  const trimmed = text.trim();
  const euclid = EUCLID_PATTERN.exec(trimmed) ?? OF_PATTERN.exec(trimmed);
  if (euclid) {
    const [k, n, rotation] = [Number(euclid[1]), Number(euclid[2]), Number(euclid[3] ?? 0)];
    if (n < 1 || k > n) return undefined;
    return { steps: n, onsets: even(k, n, rotation) };
  }
  const words = normalizeWords(trimmed);
  for (const [name, rhythm] of Object.entries(RHYTHMS)) {
    if ([name, ...rhythm.aliases].some((alias) => normalizeWords(alias) === words))
      return { steps: rhythm.steps, onsets: rhythm.onsets };
  }
  return undefined;
}
