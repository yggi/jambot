/**
 * The drummer playing from the composer's rhythm (#397, the owner's ruling
 * on E36: `groove`).
 *
 * The fragment says the pattern; the drummer keeps its dynamics, its fills
 * and its licence. For each role the drummer plays in a bar (`drums.ts`, all
 * it decides as before: whether a role plays, by energy, section and
 * syncopation, and how many hits), as many hits as it plays: the fragment's
 * first, its loudest first (then the earliest), and where the drummer plays
 * more of a role than the fragment holds, its own hits of that role on other
 * steps, its loudest first by its own accents (`baseVelocityOf`). A role the
 * fragment has no line for is the drummer's own, and a line of the fragment
 * for a role the drummer doesn't play in the bar plays nothing there. The
 * fill is the drummer's, a fragment's fill line left out. A role the drummer
 * has no part of its own for (`OWN_ROLES`: the ostinato and the clave) has
 * nothing to count the fragment's hits by, so its line plays every hit as
 * written (#651, a first piece of #656), the clave the weakest role, so the
 * rim wins a step they share. Each hit is written as the drummer writes its
 * own, a step long, and the performer gives it its velocity, so the
 * fragment's levels only order its hits.
 *
 * The fragment is read with the meter straight (`rhythms.ts`), and the band
 * swings its hits as it swings its own (yggi/cells#121 keeps a Euclid on `1m`
 * straight under a swung meter, E36).
 */

import { stepsOf } from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { OWN_ROLES } from './drums.ts';
import { baseVelocityOf } from './dynamics.ts';
import { DRUM_ROLES, type DrumRole, type WrittenNote } from './events.ts';
import type { FragmentHit } from './rhythm-query.ts';

const keyOf = (n: { step: number; note: number }) => n.step * 128 + n.note;

/** One hit on a sound and step, the stronger role's (`DRUM_ROLES`' order). */
function merged(hits: readonly WrittenNote[]): WrittenNote[] {
  const kept = new Map<number, WrittenNote>();
  for (const h of hits) {
    const there = kept.get(keyOf(h));
    if (!there || DRUM_ROLES.indexOf(h.role!) < DRUM_ROLES.indexOf(there.role!))
      kept.set(keyOf(h), h);
  }
  return [...kept.values()].sort((a, b) => a.step - b.step || a.note - b.note);
}

const written = (role: DrumRole, h: FragmentHit): WrittenNote => ({
  part: 'drums',
  role,
  step: h.step,
  note: h.note,
  length: 1,
});

/**
 * A bar's drums played from the fragments' hits in that bar (`sectionHits`):
 * the drummer's own (`drums`) given the fragment's pattern as above. With no
 * hits, the drummer's own as they are.
 */
export function grooveBar(
  env: BarEnv,
  own: readonly WrittenNote[],
  hits: readonly FragmentHit[],
): WrittenNote[] {
  if (!hits.length) return [...own];
  const steps = stepsOf(env.meter);
  const inBar = hits.filter((h) => h.step >= 0 && h.step < steps);
  const loud = (a: FragmentHit, b: FragmentHit) => b.velocity - a.velocity || a.step - b.step;
  const ownLoud = (a: WrittenNote, b: WrittenNote) =>
    baseVelocityOf(env, b) - baseVelocityOf(env, a) || a.step - b.step;
  const roles = new Set(own.map((n) => n.role!));
  const grooved = OWN_ROLES.filter((role) => role !== 'fill' && roles.has(role)).flatMap((role) => {
    const theirs = own.filter((n) => n.role === role);
    const kept = inBar
      .filter((h) => h.role === role)
      .sort(loud)
      .slice(0, theirs.length)
      .map((h) => written(role, h));
    const taken = new Set(kept.map(keyOf));
    const more = theirs.filter((n) => !taken.has(keyOf(n))).sort(ownLoud);
    return [...kept, ...more.slice(0, theirs.length - kept.length)];
  });
  const fill = own.filter((n) => n.role === 'fill');
  // (the ostinato and the clave, every hit: the drummer plays none of its own)
  const found = inBar.flatMap((h) => {
    const role = DRUM_ROLES.find((r) => r === h.role && !OWN_ROLES.includes(r));
    return role ? [written(role, h)] : [];
  });
  return merged([...grooved, ...fill, ...found]);
}
