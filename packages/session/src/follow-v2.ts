/**
 * A client's band at version 2 of the session contract (#553, rung 3): it
 * plays the scores a host tells, on the clock the conducts give, and none of
 * the band's own notes.
 *
 * The follower is a source of bars for the transport (`BarSource`), as
 * version 1's (`follow.ts`) is, and gives each bar as the transport lays its
 * first step. What arrives is each bar's conduct, and what the latest score
 * that states a bar states of it (`StatedBar`), once the client has read it:
 * a score is compiled off the page's thread, so a bar's statement arrives
 * as `reading` when the score is told and as what it states once read.
 *
 * A bar plays from its score only where its conduct carries the digest the
 * score foresaw for it; otherwise it is lacked, and said so (`said`). A bar no
 * score states (none told, or one that says why it can't) plays silent, and
 * is said and counted (`silent`). Each is said as the contract's `lacked`
 * names why (`LACKED_AS`), which a client tells its host. A lacked or silent bar is passed, as
 * version 1 passes a bar that hasn't arrived: nothing is laid in it, and the
 * conduct of the bar after sets the clock again.
 *
 * The bar it gives is the score's, framed by the conduct (the contract's
 * feel frame): its seed, entropy and offer the conduct's, its meter, swing
 * and key the score's, its section and energy the score's at the bar's place,
 * its `artic` and `sync` the score's `&style` there, and the rest of its
 * style the host's track where the bar starts. It writes no notes: what plays
 * in it is cells' (`shadow.ts` in the app), so the band's own events never
 * play on this path. It names no chords, theme or melodic scale, which a
 * score states only as its lines (the harmony a client folds is what cells
 * plays of it, `foldHeard`).
 */

import {
  type BandBar,
  type BarSource,
  type Key,
  type MeterSwing,
  SECTION_BARS,
  type SectionType,
  themeKind,
} from '@jambot/engine';
import type { Meter } from '@jambot/theory';
import type { BarConduct, SectionScore } from './protocol-v2.ts';
import type { LackedWhy } from './protocol.ts';

/** How many bars back a client keeps the scores and conducts it was told (#553, #626): a looper's or a section lock's window. */
export const KEPT_BARS = 8;

/** How many of the latest bars lacked or silent a follower says, the latest. */
export const SAID_KEPT = 8;

/** What a score states of one of its bars, as a client read it. */
export interface ScoreBarFrame {
  readonly meter: Meter;
  readonly swing: MeterSwing;
  readonly key: Key;
  readonly section: SectionType;
  readonly energy: number;
  readonly artic: number;
  readonly sync: number;
}

/** What a client read of a score: its meter, swing and key, and each bar's style, or why it can't play from it. */
export type ScoreRead =
  | {
      readonly frame: {
        readonly meter: Meter;
        readonly swing: MeterSwing;
        readonly key: Key;
        readonly styles: readonly { readonly artic: number; readonly sync: number }[];
      };
    }
  | { readonly lacks: string };

/**
 * A bar as the latest score told that states it leaves it: the digest it foresaw for the bar, and what it states of
 * it (`stated`), or that it is still being read (`reading`), states nothing (`unstated`, the bar plays silent), or
 * can't be played here (`lacking`: it locks a fragment the client lacks, or cells couldn't read it).
 */
export type StatedBar =
  | (BarStated & { readonly kind: 'stated'; readonly frame: ScoreBarFrame })
  | (BarStated & { readonly kind: 'reading' })
  | (BarStated & { readonly kind: 'unstated'; readonly why: string })
  | (BarStated & { readonly kind: 'lacking'; readonly why: string });

/** A bar a score states, and the digest it foresaw for it. */
interface BarStated {
  readonly bar: number;
  readonly foreseen: string;
}

/** What reaches a follower: a bar's conduct, or what a score states of a bar. */
export type ScoreArrival = { readonly conduct: BarConduct } | { readonly stated: StatedBar };

/** A bar lacked or silent: why, as the contract's `lacked` names it, and in words: what a client says of it, and tells its host. */
export interface Said {
  readonly bar: number;
  readonly why: LackedWhy;
  readonly text: string;
}

export interface ScoreFollowCarried {
  /** The conducts of bars not played yet, in order. */
  readonly conducts: readonly BarConduct[];
  /** What the latest score that states each bar states of it, by bar, from `KEPT_BARS` back on. */
  readonly stated: Readonly<Record<number, StatedBar>>;
  /** How many bars were lacked: no conduct came, its score was still being read or can't be played, or its digest wasn't the score's. */
  readonly lacked: number;
  /** How many bars played silent: no score stated them. */
  readonly silent: number;
  /** The latest bars lacked or silent, with why (`SAID_KEPT`). */
  readonly said: readonly Said[];
}

/** Why a bar is lacked or silent, as a client says it. */
export const SAYS = {
  noConduct: 'no conduct came for it',
  noScore: 'no score states it',
  reading: 'its score was still being read',
  digest: 'its conduct’s digest is not the one its score foresaw',
} as const;

/**
 * Each way a follower lacks a bar, as the session contract's `lacked` names why (version 2, minor 2): a bar whose
 * conduct didn't come or whose score was still being read when it was due came too late to play (`late`); one no
 * score states, none told or one `unstated`, plays silent (`silent`); one whose conduct's digest isn't its score's
 * is `digest`; one whose score can't be played here, as it locks a fragment the client lacks or cells reads no frame
 * in it, is `lock`.
 */
export const LACKED_AS = {
  noConduct: 'late',
  reading: 'late',
  noScore: 'silent',
  unstated: 'silent',
  digest: 'digest',
  lacking: 'lock',
} as const satisfies Readonly<Record<keyof typeof SAYS | 'unstated' | 'lacking', LackedWhy>>;

/** Each bar a score states, as it leaves it once read, or while it is read. */
export function statedBars(
  score: Pick<SectionScore, 'bar' | 'section' | 'text' | 'unstated' | 'energy' | 'foreseen'>,
  read: ScoreRead | 'reading',
): StatedBar[] {
  return score.foreseen.map((foreseen, k): StatedBar => {
    const bar = score.bar + k;
    if (score.unstated !== null || score.text === '')
      return { bar, foreseen, kind: 'unstated', why: score.unstated ?? SAYS.noScore };
    if (read === 'reading') return { bar, foreseen, kind: 'reading' };
    if ('lacks' in read) return { bar, foreseen, kind: 'lacking', why: read.lacks };
    const { meter, swing, key, styles } = read.frame;
    const style = styles[k];
    const energy = score.energy[k];
    if (!style || energy === undefined)
      return { bar, foreseen, kind: 'lacking', why: 'its score states no style or energy for it' };
    return {
      bar,
      foreseen,
      kind: 'stated',
      frame: { meter, swing, key, section: score.section, energy, ...style },
    };
  });
}

/**
 * A bar as a score states it, framed by its conduct, in the transport's environment for it: what the performer reads
 * of it, and the clock.
 */
export function barOfScore(
  env: { readonly style: BandBar['style'] },
  conduct: BarConduct,
  frame: ScoreBarFrame,
): BandBar {
  const { bar, seed, entropy, offer } = conduct;
  const { meter, swing, key, section, energy, artic, sync } = frame;
  const index = Math.floor(bar / SECTION_BARS);
  return {
    seed,
    bar,
    meter,
    plan: {
      section: { type: section, index },
      key,
      meter,
      swing: swing.level,
      share: swing.share,
      melodic: 'plain',
      theme: { kind: themeKind(section), index, mode: key.mode, harm: 0, vamp: null, bars: [] },
    },
    barInSection: bar - index * SECTION_BARS,
    style: { ...env.style, entropy, artic, sync },
    swing,
    barEnergy: energy,
    chords: [],
    next: [],
    offer,
    written: [],
    dough: [],
  };
}

const sayOf = (carried: ScoreFollowCarried, said: Said): ScoreFollowCarried => ({
  ...carried,
  ...(said.why === 'silent' ? { silent: carried.silent + 1 } : { lacked: carried.lacked + 1 }),
  said: [...carried.said, said].slice(-SAID_KEPT),
});

/** The conducts after `bar`, and the statements from `KEPT_BARS` before it. */
function past(carried: ScoreFollowCarried, bar: number): ScoreFollowCarried {
  const stated = Object.fromEntries(
    Object.entries(carried.stated).filter(([b]) => Number(b) >= bar - KEPT_BARS),
  );
  return { ...carried, conducts: carried.conducts.filter((c) => c.bar > bar), stated };
}

export const scoreSource: BarSource<ScoreFollowCarried, ScoreArrival> = {
  initial: { conducts: [], stated: {}, lacked: 0, silent: 0, said: [] },
  ahead: 0,
  receive(carried, arrived) {
    if (arrived.length === 0) return carried;
    const conducts = new Map(carried.conducts.map((c) => [c.bar, c]));
    const stated = { ...carried.stated };
    for (const a of arrived)
      if ('conduct' in a) conducts.set(a.conduct.bar, a.conduct);
      else stated[a.stated.bar] = a.stated;
    return {
      ...carried,
      conducts: [...conducts.values()].sort((a, b) => a.bar - b.bar),
      stated,
    };
  },
  compose(env, carried) {
    const conduct = carried.conducts.find((c) => c.bar === env.bar);
    const stated = carried.stated[env.bar];
    const rest = past(carried, env.bar);
    const lacked = (as: keyof typeof LACKED_AS, text: string) => ({
      carried: sayOf(rest, { bar: env.bar, why: LACKED_AS[as], text }),
      bar: null,
    });
    if (!conduct) return lacked('noConduct', SAYS.noConduct);
    if (!stated) return lacked('noScore', SAYS.noScore);
    if (stated.kind === 'unstated') return lacked('unstated', stated.why);
    if (stated.kind === 'reading') return lacked('reading', SAYS.reading);
    if (stated.kind === 'lacking') return lacked('lacking', stated.why);
    if (stated.foreseen !== conduct.foreseen) return lacked('digest', SAYS.digest);
    const bar = barOfScore(env, conduct, stated.frame);
    return conduct.start === null
      ? { carried: rest, bar }
      : { carried: rest, bar, start: conduct.start };
  },
  pass: (env, carried) => past(carried, env.bar),
  meterOf: (env, { stated }) => {
    const at = stated[env.bar];
    return at?.kind === 'stated' ? at.frame.meter : null;
  },
};

/**
 * What a client keeps of what it was told, whatever plays (#553, #626): the conducts from `KEPT_BARS` before `bar` on,
 * and the scores in force for those bars (`scoresInForce`), so a loop of its own has its window.
 */
export function keptFrom<S extends Pick<SectionScore, 'bar' | 'foreseen'>>(
  scores: readonly S[],
  conducts: readonly BarConduct[],
  bar: number,
): { readonly scores: S[]; readonly conducts: BarConduct[] } {
  const from = bar - KEPT_BARS;
  return {
    scores: scoresInForce(scores, from),
    conducts: conducts.filter((c) => c.bar >= from),
  };
}

/**
 * The scores in force from bar `from` on, in the order they were stated: each that is the latest to state some bar
 * from `from` on. What a welcome carries, and a client keeps, a score stated again in place of one before leaving the
 * one before out.
 */
export function scoresInForce<S extends Pick<SectionScore, 'bar' | 'foreseen'>>(
  scores: readonly S[],
  from: number,
): S[] {
  const latest = new Map<number, S>();
  for (const s of scores)
    for (let i = 0; i < s.foreseen.length; i++) if (s.bar + i >= from) latest.set(s.bar + i, s);
  const kept = new Set(latest.values());
  return scores.filter((s) => kept.has(s));
}
