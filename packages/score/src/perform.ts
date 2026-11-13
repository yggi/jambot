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
import type { NotePart, PitchedName } from './section-text.ts';

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
  const { part, role, step, note } = cells;
  const { velocity, length } = played(frameOf(bar), {
    part,
    step,
    note,
    velocity: cells.velocity,
    length: cells.length,
    ...(role !== undefined && { role }),
  });
  return doughOf(bar, { ...cells, velocity, length });
}

/** The part the built-in synth sounds a note as, by the channel it is sent on: its own, the pad's on the one the pad and the stab share. */
const SOUNDED: Readonly<Record<NotePart, PitchedName | 'drums'>> = {
  lead: 'lead',
  bass: 'bass',
  comp: 'pad',
  drums: 'drums',
};

/**
 * One of cells' events that is none of the feel's, its text declaring no part or drum role the feel reads (`lineOf`):
 * as cells gives it, the feel contract's rule (version 3), its velocity and length unmoved and no role, sounded by the
 * built-in synth as the part its channel sends (`sent`; the pad on the channel the pad and the stab share).
 */
export function asCellsGives(
  bar: BarEnv,
  sent: NotePart,
  cells: Omit<CellsNote, 'part' | 'role'>,
): DoughNote {
  const { step, note, velocity, length, sound } = cells;
  return doughOf(bar, {
    part: SOUNDED[sent],
    step,
    note,
    velocity,
    length,
    ...(sound && { sound }),
  });
}

/** A note as a dough note: its velocity and length as given, its gain from its velocity, and the style's colour. */
function doughOf(bar: BarEnv, cells: CellsNote): DoughNote {
  const { part, role, step, note, length, velocity, sound } = cells;
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
