/**
 * What a host of version 2 of the session contract writes (#553, rung 2):
 * each bar's conduct, each section's score, and the fragments a score locks
 * that a client lacks, sent to each client once by hash. Written here, and
 * spoken by the app's host only where it is switched to version 2
 * (`HOST_SPEAKS` in the app); the client plays them at rung 3.
 *
 * A conduct is made from the bar the host sends at version 1 (`SentBar`), as
 * the contract's rule makes it (`conductOf` in yggi/music-commons
 * `tools/vectors.mjs`): its start, seed, entropy and offer, and the digest of
 * what the bar was built from (`foreseen`), which the score that states the
 * bar foresaw for it where the client is to play it.
 *
 * A score is made from what the host's band states of a section (`HostScore`):
 * the fields every client is sent alike, and the fragments it locks that are
 * not in the host's seed library (`filed`), of which each client is sent only
 * those it lacks (`fragmentsLacked`). Which hashes each client was sent is
 * the host's ledger (`FragmentLedger`), kept by the client's seat, so a
 * client that comes back with its token is not sent again what it was sent.
 */

import type { BarEnv } from '@jambot/engine';
import type { BarConduct, FragmentText, SectionScore } from './protocol-v2.ts';
import type { SentBar } from './protocol.ts';

/** A bar's conduct, from the bar a host sends at version 1 and the digest of what it was built from. */
export function conductOf({ bar, start }: SentBar, foreseen: string): BarConduct {
  return {
    bar: bar.bar,
    start,
    seed: bar.seed,
    entropy: bar.style.entropy,
    offer: bar.offer,
    foreseen,
  };
}

/**
 * A section's score as the host's band stated it, before it goes to a client:
 * a score's fields but its `fragments`, with the fragments of its lock that
 * are not in the host's seed library, each with its text (`filed`).
 */
export interface HostScore extends Omit<SectionScore, 'fragments'> {
  readonly filed: readonly FragmentText[];
}

/** What the band's job stated of a run of bars: its text or why none, its lock, and each bar's digest and cuts. */
export interface ScoreStated {
  readonly text: string;
  readonly unstated: string | null;
  readonly lock: SectionScore['lock'];
  readonly filed: readonly FragmentText[];
  readonly foreseen: readonly string[];
  readonly cut: readonly number[];
}

/**
 * A section's score from what was stated of its bars, from `bar` on, whose
 * first starts at `step`: its type the first bar's section's, and each bar's
 * energy.
 */
export function hostScoreOf(
  bar: number,
  step: number,
  stated: ScoreStated,
  bars: readonly Pick<BarEnv, 'plan' | 'barEnergy'>[],
): HostScore {
  const { text, unstated, lock, filed, foreseen, cut } = stated;
  return {
    bar,
    step,
    section: bars[0]!.plan.section.type,
    text,
    unstated,
    lock,
    filed,
    energy: bars.map((b) => b.barEnergy),
    foreseen,
    cut,
  };
}

/** A score as it goes to one client: the fragments it lacks in place of those filed. */
export function scoreFor(score: HostScore, fragments: readonly FragmentText[]): SectionScore {
  const { filed, ...rest } = score;
  void filed;
  return { ...rest, fragments };
}

/** The fragment hashes each client was sent, by the id of its seat (`roster.ts`). */
export type FragmentLedger = Readonly<Record<string, readonly string[]>>;

/**
 * The fragments of `filed` the client of seat `seat` lacks, each once, in
 * order, and the ledger with them sent: a fragment it was sent before, by
 * hash, is not sent again.
 */
export function fragmentsLacked(
  ledger: FragmentLedger,
  seat: string,
  filed: readonly FragmentText[],
): { readonly fragments: FragmentText[]; readonly ledger: FragmentLedger } {
  const sent = new Set(ledger[seat] ?? []);
  const fragments: FragmentText[] = [];
  for (const f of filed) {
    if (sent.has(f.hash)) continue;
    sent.add(f.hash);
    fragments.push(f);
  }
  return fragments.length === 0
    ? { fragments, ledger }
    : { fragments, ledger: { ...ledger, [seat]: [...sent] } };
}

/** The ledger of the seats held, a seat that is freed forgotten. */
export function ledgerOf(ledger: FragmentLedger, seats: readonly string[]): FragmentLedger {
  return Object.fromEntries(seats.flatMap((s) => (ledger[s] ? [[s, ledger[s]]] : [])));
}

/**
 * The scores in force from bar `from` on, in the order they were stated: each
 * that is the latest to state some bar from `from` on. What a welcome carries,
 * a score stated again in place of one before leaving the one before out.
 */
export function scoresInForce(scores: readonly HostScore[], from: number): HostScore[] {
  const latest = new Map<number, HostScore>();
  for (const s of scores)
    for (let i = 0; i < s.foreseen.length; i++) if (s.bar + i >= from) latest.set(s.bar + i, s);
  const kept = new Set(latest.values());
  return scores.filter((s) => kept.has(s));
}
