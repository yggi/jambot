/**
 * What a score states, as a client of session version 2 reads it from the
 * score alone (#553 rung 3; yggi/music-commons `contracts/session`, version 2:
 * "a score states its meter, tempo and key", yggi/cells decision 063 §1): the
 * meter its bars are in and the swing it leans by, the tempo, the key, and at
 * each bar the style's `artic` and `sync`, which the feel's frame reads beside
 * the conduct's seed and entropy and the score's section and energy.
 *
 * Each is read off cells' compile of the score, never off its spelling: the
 * meter and its swing from the main meter's cell (cells' `mainMeter`), the
 * tempo from that meter's clock, the key from the `diatonic` fragment the
 * score's key takes (`keyLine`), and the style from `&style` at each bar's
 * first moment (cells' `styleAt`). A score that states none of them, or a key
 * of another fragment, has no frame here, and its bars can't play.
 *
 * A score's `from` lines read the fragments the session sent by their hash,
 * else the seed library at this cells pin (`scoreResolver`); a fragment its
 * lock names that neither holds (`lockLacks`) makes its bars lacked, as the
 * contract says of a seed a client's pin lacks.
 */

import {
  COMPOSER_MODES,
  CELLS_AXIS,
  type ComposerMode,
  type Key,
  type MeterSwing,
  STRAIGHT,
} from '@jambot/engine';
import { type Meter, beatsOf, parseNote } from '@jambot/theory';
import type { Plan } from '@yggi/cells';
import { mainMeter } from '@yggi/cells/engine/midiclock';
import type { Resolve } from '@yggi/cells/engine/program';
import { styleAt } from '@yggi/cells/engine/styleat';
import { resolveBand } from '@yggi/cells/repository/band';
import { AXIS_NAMES } from '@yggi/cells/engine/style';
import { resolveSeed } from '@yggi/cells/repository/library';
import { type LockedFragment, type LockedText, isSeed } from './lock.ts';

/** What a score states of its bars: one meter, swing, tempo and key, and each bar's style as the feel reads it. */
export interface ScoreFrame {
  readonly meter: Meter;
  /** The swing its meter leans by on 8n or 16n, else straight sixteenths. */
  readonly swing: MeterSwing;
  /** Beats a minute, a beat its meter's pulse (`beatsOf`). */
  readonly bpm: number;
  readonly key: Key;
  /** Each bar's `artic` and `sync`, from `&style` at its first moment: cells' `bite` and `sync`. */
  readonly styles: readonly { readonly artic: number; readonly sync: number }[];
}

/** The fragment whose take states a score's key (`keyLine`): cells' mode fragment, its mode and its tonic its arguments. */
const KEY_FRAGMENT = 'diatonic';

const ARTIC = AXIS_NAMES.indexOf(CELLS_AXIS.artic);
const SYNC = AXIS_NAMES.indexOf(CELLS_AXIS.sync);

const isMode = (mode: string | undefined): mode is ComposerMode =>
  (COMPOSER_MODES as readonly string[]).includes(mode ?? '');

/**
 * How a score's `from` lines are read on a client: a fragment the session sent, by its id and hash, else the seed
 * library's by its id, at this cells pin.
 */
export function scoreResolver(fragments: readonly LockedText[]): Resolve {
  const byHash = new Map(fragments.map((f) => [`${f.id}\n${f.hash}`, f.text]));
  return (id, hash) =>
    (hash === undefined ? undefined : byHash.get(`${id}\n${hash}`)) ?? resolveSeed(id);
}

/** How a client compiles a score (`compileSection`): its band its own, at the score's style, and every other fragment read by `scoreResolver`. */
export const scoreResolve = (text: string, fragments: readonly LockedText[]): Resolve =>
  resolveBand(text, scoreResolver(fragments));

/** The fragments a lock names that neither the fragments sent (by hash) nor the seed library at this pin hold. */
export function lockLacks(
  lock: readonly LockedFragment[],
  fragments: readonly LockedText[],
): LockedFragment[] {
  const held = new Set(fragments.map((f) => f.hash));
  return lock.filter((l) => !held.has(l.hash) && !isSeed(l));
}

/**
 * What a compiled score states of its first `bars` bars, or null where it states no meter with a tempo, or no key of
 * its `diatonic` take: read off cells' compile (`plan`), its style read with the `resolve` it was compiled with (`compileSection`'s where none is given).
 */
export function scoreFrame(
  text: string,
  plan: Plan,
  bars: number,
  resolve: Resolve = resolveBand(text, resolveSeed),
): ScoreFrame | null {
  const { result } = plan;
  const main = result.ok ? mainMeter(result) : null;
  const cell = main && result.cells.get(main.cell);
  const clock = main && result.clocks.get(main.cell);
  const written = cell?.meter;
  if (!main || !written || !clock || written.beats.length === 0) return null;
  // (each beat in eighths: a meter of whole eighths, rising from the downbeat, as `METERS` holds them)
  const groups = written.beats.map((b) => (b * 8) / written.unit);
  if (!groups.every((g) => Number.isInteger(g) && g > 0)) return null;
  const heights = groups.map((_, i) => groups.slice(0, i).reduce((a, g) => a + g, 0));
  const meter: Meter = { cycle: groups.reduce((a, g) => a + g, 0), heights };
  const lean = written.swing?.find((l) => l.level === '8n' || l.level === '16n');
  const swing: MeterSwing = lean
    ? { level: lean.level as '8n' | '16n', share: lean.share }
    : STRAIGHT;
  const bpm = (clock.perSecond * 60) / main.beat;
  const take = result.takes?.find((t) => t.id === KEY_FRAGMENT);
  const mode = take?.args?.mode;
  const tonic = take?.args?.tonic === undefined ? undefined : parseNote(take.args.tonic);
  if (!isMode(mode) || !tonic || !(bpm > 0)) return null;
  const seconds = (beatsOf(meter) * 60) / bpm;
  const options = { resolve };
  const styles = Array.from({ length: bars }, (_, k) => {
    const point = styleAt(text, k * seconds, options);
    return { artic: point?.[ARTIC] ?? NaN, sync: point?.[SYNC] ?? NaN };
  });
  if (styles.some((s) => !Number.isFinite(s.artic) || !Number.isFinite(s.sync))) return null;
  return { meter, swing, bpm, key: { tonic: tonic.pitchClass, mode }, styles };
}
