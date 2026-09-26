/**
 * Named rhythms and Euclidean patterns, as helices over a cycle of steps.
 *
 * `E(k,n,shift)` is the primitive itself. Named rhythms that are maximally
 * even are taken from it; the claves that are not are listed as heights. A
 * shifted rhythm keeps its degrees: the bossa is E(5,16) shifted by 6, so its
 * degree 0 is at step 6, and it plays from the downbeat all the same.
 */

import { even } from './even.ts';
import { type Helix } from './helix.ts';
import { normalizeWords } from './words.ts';

export interface NamedRhythm {
  helix: Helix;
  aliases: readonly string[];
}

const onSixteen = (heights: number[]): Helix => ({ cycle: 16, heights });

export const RHYTHMS: Record<string, NamedRhythm> = {
  tresillo: { helix: even(3, 8), aliases: [] },
  cinquillo: { helix: even(5, 8, 6), aliases: [] },
  'son clave': { helix: onSixteen([0, 3, 6, 10, 12]), aliases: ['clave', '3 2 son clave'] },
  'rumba clave': { helix: onSixteen([0, 3, 7, 10, 12]), aliases: ['rumba'] },
  'bossa clave': { helix: even(5, 16, 6), aliases: ['bossa', 'bossa nova'] },
  'four on the floor': { helix: even(4, 16), aliases: [] },
  backbeat: { helix: even(2, 16, 4), aliases: ['back beat'] },
  samba: { helix: even(7, 16), aliases: [] },
};

const EUCLID_PATTERN = /^(?:e|euclid)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(-?\d+)\s*)?\)$/i;
const OF_PATTERN = /^(\d+)\s+of\s+(\d+)$/i;

export function parseRhythm(text: string): Helix | undefined {
  const trimmed = text.trim();
  const euclid = EUCLID_PATTERN.exec(trimmed) ?? OF_PATTERN.exec(trimmed);
  if (euclid) {
    const [k, n, by] = [Number(euclid[1]), Number(euclid[2]), Number(euclid[3] ?? 0)];
    if (n < 1 || k > n) return undefined;
    return even(k, n, by);
  }
  const words = normalizeWords(trimmed);
  for (const [name, rhythm] of Object.entries(RHYTHMS)) {
    if ([name, ...rhythm.aliases].some((alias) => normalizeWords(alias) === words))
      return rhythm.helix;
  }
  return undefined;
}
