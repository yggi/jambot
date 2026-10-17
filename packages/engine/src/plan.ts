/**
 * The section plan: the machine at section rate.
 *
 * At each section boundary it reads the seed, the section's index, the style
 * where the section starts, and the key the players wish for. It advances
 * the form, moves the key one step toward the wish (`nextKey`), picks the
 * melodic scale the lead walks (the wish's where the style reaches it, else
 * the style's default, #209), takes the meter asked for (#261) and the
 * level its swing leans (#360), or where none is asked for, the meter the
 * composer finds in the repository at the style (#375, `sectionMeter`), and
 * picks the section's theme. The band
 * holds the plan for the section's eight bars, so a new key, scale or theme
 * arrives only at a boundary, as does a new meter or swing level.
 *
 * Where the players wish for no tonic and the mode playing, the band may move
 * the key itself (#169): the harmony's reach (`harmonicReach`) gives how far,
 * the entropy how readily, and its harmonic history (`history.ts`) where to,
 * leaning toward the key the history weighs most. It returns the same way:
 * after a move the key it left still weighs most, so it leans back.
 *
 * Themes return: an A theme for the grooves and drops, a B theme for the
 * contrast. A returning theme is built anew when the mode has changed, when
 * the harmony has moved more than 0.2 from the one it was built for, or at
 * random, the more often the higher the entropy (at most three times in
 * ten). A build is always built afresh.
 */

import { type Meter, fifthsIndex, mod } from '@jambot/theory';
import { leaning } from './fading.ts';
import { type Section, form } from './form.ts';
import { type HarmonicWeights, keyWeight } from './history.ts';
import { INITIAL_KEY, type Key, type KeyWish, type MelodicScale, nextKey } from './key.ts';
import { harmonicReach, licenceOf, melodicDefault } from './licence.ts';
import { SONG_METER } from './events.ts';
import type { Machine } from './machine.ts';
import { type MeterRepository, composedMeter } from './meter-query.ts';
import { chance, draw, pick } from './random.ts';
import type { Style } from './style.ts';
import type { SwingLevel } from './swing.ts';
import { type Theme, buildTheme, themeKind } from './themes.ts';

export interface PlanEnv {
  readonly seed: number;
  readonly index: number;
  /** The style where the section starts. */
  readonly style: Style;
  /** The key the players wish for: a mode, and a tonic or none; and a melodic scale or none. */
  readonly wish: KeyWish;
  /** What the band's harmony has sounded lately, which its own moves lean toward. */
  readonly history: HarmonicWeights;
  /** The meter asked for, which the plan takes at a section's boundary as it takes the key (#261). */
  readonly meter?: Meter | undefined;
  /** The level the meter asked for swings on, which the plan takes as it takes the meter (#360); the 16ths where none is. */
  readonly swing?: SwingLevel | undefined;
  /**
   * The repository the composer asks for the section's meter where none is
   * asked for (#375); the song's 4/4 where there is none either.
   */
  readonly repository?: MeterRepository | undefined;
}

/**
 * What a section plays: where it stands in the form, its key and its meter,
 * the lead's melodic scale over the key, and its theme. The key and the
 * meter are its two frames (C3), held for its eight bars.
 */
export interface Plan {
  readonly section: Section;
  readonly key: Key;
  /** The meter of each of the section's bars (#261). */
  readonly meter: Meter;
  /**
   * The level the section's meter swings on (#360): its share glides on the
   * style's time (`SwingTrack`), and the level changes only here, where a
   * section starts, since nothing jumps.
   */
  readonly swing: SwingLevel;
  /**
   * The share the section's meter swings at, where the composer took it
   * from the repository (#375): a feel is one fragment, held for the
   * section. Absent where the meter was asked for, and the share glides on
   * the swing track.
   */
  readonly share?: number;
  /** The repository's meter fragment the section plays, by id, where it plays one (#375). */
  readonly meterFragment?: string;
  readonly melodic: MelodicScale;
  readonly theme: Theme;
}

export interface PlanCarried {
  /** The plan of the section before. */
  readonly before: Plan | null;
  /** The themes that return. */
  readonly themes: { readonly A: Theme | null; readonly B: Theme | null };
}

/** How far the harmony may move from a returning theme's before it is built anew. */
export const THEME_REACH = 0.2;

/** How likely the band is to move the key itself at a section boundary, at entropy 1. */
export const KEY_JUMP = 0.6;

/**
 * How sharply the band leans toward the key its history weighs most: each
 * candidate is picked in proportion to its weight to this power.
 */
const LEAN = 4;

/**
 * Where the band would move the key itself from `key` at section `index`, or
 * null to stay: with a chance of `KEY_JUMP` times the entropy, to a key in
 * the same mode within the harmony's reach, each picked by how much its scale
 * weighs in the history.
 */
export function bandWish(
  { seed, index, style, history }: Pick<PlanEnv, 'seed' | 'index' | 'style' | 'history'>,
  key: Key,
): Pick<KeyWish, 'tonic' | 'mode'> | null {
  const reach = harmonicReach(style);
  if (reach === 0 || !chance(draw(seed, 'keyJump', index), style.entropy * KEY_JUMP)) return null;
  // In one mode, keys lie as many fifths apart as their tonics do on the wheel.
  const home = fifthsIndex(key.tonic);
  const candidates = [...Array(12).keys()]
    .filter((tonic) => {
      const apart = Math.abs(mod(fifthsIndex(tonic) - home + 6, 12) - 6);
      return apart > 0 && apart <= reach;
    })
    .map((tonic) => ({ tonic, mode: key.mode }));
  const weights = candidates.map((c) => keyWeight(history, c));
  return candidates[pick(draw(seed, 'keyJump', index, 1), leaning(weights, LEAN))]!;
}

/** A section's meter: the meter, the level it swings on, and where the composer took it from the repository, the share and the fragment. */
export type SectionMeter = Pick<Plan, 'meter' | 'swing' | 'share' | 'meterFragment'>;

/**
 * The meter a section takes where it starts: the one asked for, with the
 * level asked for; where none is, the one the composer finds in the
 * repository at the style (`composedMeter`); on a miss, the section
 * before's; and where there is nothing else, the song's 4/4.
 */
export function sectionMeter(
  {
    meter,
    swing = '16n',
    repository,
    style,
  }: Pick<PlanEnv, 'meter' | 'swing' | 'repository' | 'style'>,
  before: SectionMeter | null,
): SectionMeter {
  if (meter) return { meter, swing };
  const found = repository ? composedMeter(repository, style, before?.meterFragment ?? null) : null;
  if (found)
    return {
      meter: found.meter,
      swing: found.swing.level,
      share: found.swing.share,
      meterFragment: found.id,
    };
  if (repository && before) {
    const { meter: kept, swing: level, share, meterFragment } = before;
    return {
      meter: kept,
      swing: level,
      ...(share === undefined ? {} : { share }),
      ...(meterFragment === undefined ? {} : { meterFragment }),
    };
  }
  return { meter: SONG_METER, swing };
}

export const planner: Machine<PlanEnv, PlanCarried, null, Plan> = {
  initial: { before: null, themes: { A: null, B: null } },
  advance(env, { before, themes }) {
    const { seed, index, style, wish } = env;
    const section = form.advance({ seed, index, style }, before?.section ?? null, null).output;
    const from = before?.key ?? INITIAL_KEY;
    // The players' wish wins: a tonic, or a mode other than the one playing.
    const own =
      before && wish.tonic === null && wish.mode === from.mode ? bandWish(env, from) : null;
    const key = nextKey(from, own ?? wish);
    const melodic =
      wish.melodic !== null && licenceOf(style).melodic.includes(wish.melodic)
        ? wish.melodic
        : melodicDefault(style);
    const kind = themeKind(section.type);
    const held = kind === 'build' ? null : themes[kind];
    const theme =
      held &&
      held.mode === key.mode &&
      Math.abs(held.harm - style.harm) <= THEME_REACH &&
      !chance(draw(seed, 'themeRenewal', index), style.entropy * 0.3)
        ? held
        : buildTheme({
            seed,
            index,
            kind,
            key,
            harm: style.harm,
            entropy: style.entropy,
            a: themes.A,
          });
    const plan = { section, key, ...sectionMeter(env, before), melodic, theme };
    return {
      carried: { before: plan, themes: kind === 'build' ? themes : { ...themes, [kind]: theme } },
      output: plan,
    };
  },
};
