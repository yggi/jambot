/**
 * A score's lock, as a host of session version 2 sends it (#553,
 * yggi/music-commons `contracts/session`): every fragment the score takes
 * `from`, by its id and hash (cells' `textLockfile`), never `band`, which is
 * the client's own and never travels (yggi/cells decision 063 §1). Of them,
 * those not in the seed library at this cells pin (`resolveSeed`), a fragment
 * the Muse filed or varied, go with their texts (`filed`), and a host sends
 * each client those it lacks once (`fragmentsLacked` in `@jambot/session`).
 * A seed is never sent: a client reads it from its own pin.
 */

import { fragmentHash, textLockfile } from '@yggi/cells';
import type { Resolve } from '@yggi/cells';
import { resolveBand, resolveSeed } from '@yggi/cells/library';

/** A fragment by its id and hash: a lock's entry, as `@jambot/session`'s `FragmentRef`. */
export interface LockedFragment {
  readonly id: string;
  readonly hash: string;
}

/** A fragment's text by its id and hash, as `@jambot/session`'s `FragmentText`. */
export interface LockedText extends LockedFragment {
  readonly text: string;
}

/** A score's lock, and the fragments of it not in the seed library, each with its text. */
export interface ScoreLock {
  readonly lock: readonly LockedFragment[];
  readonly filed: readonly LockedText[];
}

/** The band, which a lock never names: the client's own (decision 063 §1). */
const BAND = 'band';

/** A lock's entry names a fragment, or a part of one (`id/part`): the fragment's id. */
const fragmentOf = (id: string): string => id.split('/')[0]!;

/** Whether a fragment by its id and hash is the seed library's at this cells pin. */
export function isSeed({ id, hash }: LockedFragment): boolean {
  const seed = resolveSeed(fragmentOf(id));
  return seed !== null && fragmentHash(seed) === hash;
}

/**
 * The default band a host plays, by the seed's id and hash at this cells pin:
 * what a welcome of session version 2 names, which a client may show and never
 * plays (the band a score resolves is the client's own, at the score's style,
 * `resolveBand`).
 */
export const DEFAULT_BAND: LockedFragment = {
  id: BAND,
  hash: fragmentHash(resolveSeed(BAND) ?? ''),
};

/**
 * A score's lock (cells' `textLockfile`, its `band` left out), and of it the
 * fragments not in the seed library, each with the text `resolve` gives
 * (`filed`). `resolve` reads the score's `from` lines as the score is compiled
 * (`compileSection`): the default band at its style, then the seed library. A
 * text with no `from` line, or none (an unstated score), locks nothing.
 */
export function scoreLock(
  text: string,
  resolve: Resolve = resolveBand(text, resolveSeed),
): ScoreLock {
  if (text === '') return { lock: [], filed: [] };
  const lock = textLockfile(text, resolve)
    .filter((l) => fragmentOf(l.id) !== BAND)
    .map(({ id, hash }) => ({ id, hash }));
  const filed = new Map<string, LockedText>();
  for (const l of lock) {
    const id = fragmentOf(l.id);
    const text = isSeed(l) || filed.has(l.hash) ? null : resolve(id, l.hash);
    if (text !== null) filed.set(l.hash, { id, hash: l.hash, text });
  }
  return { lock, filed: [...filed.values()] };
}
