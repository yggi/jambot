/**
 * Cells' events as the performer plays them (#552): cells' default performer
 * (`played`, yggi/cells v0.15.0, decision 063 rung 3), the family's feel
 * contract's rule (yggi/music-commons `contracts/feel`, version 3), on each
 * event cells plays in a bar, at the contract's widths.
 *
 * Cells sounds the written layer at feel 0, and the feel goes on top of each
 * of its events (cells decision 037: the text holds what is composed, the
 * playing is the player's): its velocity loosened and accented and its
 * length gated, never its onset. The frame the feel reads is made of the bar
 * the band composed (`frameOf`), the fields a host's `bar` message sends a
 * follower, so a host, its clients and Cell studio play one rule. The band's
 * own notes, in a gap, are played by the engine's `perform`, from the same
 * feel and draws.
 */

import {
  type BarEnv,
  type DoughNote,
  type DrumRole,
  type VoiceSound,
  timbreOf,
} from '@jambot/engine';
import { type FeelFrame, type SectionType, played } from '@yggi/cells';
import type { PitchedName } from './section-text.ts';

/** What the feel reads of a bar: its seed and number, its meter in eighths, its section, style, swing and energy. */
export function frameOf(bar: BarEnv): FeelFrame {
  const { cycle, heights } = bar.meter;
  return {
    seed: bar.seed,
    bar: bar.bar,
    groups: heights.map((h, i) => (heights[i + 1] ?? cycle) - h),
    section: bar.plan.section.type as SectionType,
    style: { entropy: bar.style.entropy, artic: bar.style.artic, sync: bar.style.sync },
    swing: { level: bar.swing.level, share: bar.swing.share },
    energy: bar.barEnergy,
  };
}

/**
 * One of cells' events in a bar as read back (`playSection`): its line, a drum
 * hit's role, its step, pitch and velocity as MIDI sends it, its sounding
 * length in steps, and its voice's own sound where the text gives it one.
 */
export interface CellsNote {
  readonly part: PitchedName | 'drums';
  readonly role?: DrumRole;
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
  readonly length: number;
  readonly sound?: VoiceSound;
}

/**
 * One of cells' events as the performer plays it: its velocity and length
 * from cells' `played`, and the rest a dough note carries, the style's
 * colour where its voice has no sound of its own.
 */
export function performCells(bar: BarEnv, cells: CellsNote): DoughNote {
  const { part, role, step, note, sound } = cells;
  const { velocity, length } = played(frameOf(bar), {
    part,
    step,
    note,
    velocity: cells.velocity,
    length: cells.length,
    ...(role !== undefined && { role }),
  });
  return {
    part,
    step,
    note,
    length,
    velocity,
    gain: velocity / 127,
    ...timbreOf(part, bar.style, bar.swing, bar.barEnergy),
    ...(role !== undefined && { role }),
    ...(sound && { sound }),
  };
}
