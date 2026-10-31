/**
 * The band's roll (the Mix view): every voice's notes over the bars shown on
 * one grid, read from the same tracks the lanes were (`tracksOf`). The fill
 * is the pitch (`pitch.ts`), the shape is the role and the outline is who
 * plays it: the lead's notes are chevrons, the chords' pills, the bass's
 * blocks and the drums' squares; the band's voices wear their own shade of
 * amber (`--voice-*`), and a player, or a bar of the lead that played a
 * player's motif, that player's colour. A player's notes keep the shape of
 * the part they play. The drums have no pitch: they lie in a strip of their
 * own, a row each for the kick, the snare's kind and the cymbals. The bar
 * the Muse took a motif from is marked in its player's colour. Places are
 * fractions, across the bars shown and down the pitches heard.
 */

import type { Performer } from './sounding.ts';
import type { TracksView } from './tracks.ts';

export type Shape = 'chevron' | 'pill' | 'block' | 'square';

/** Each performer's shape: what it plays, told apart even without colour. */
export const SHAPES: Readonly<Record<Performer, Shape>> = {
  lead: 'chevron',
  comp: 'pill',
  bass: 'block',
  drums: 'square',
};

/** How many rows the drum strip has. */
export const DRUM_ROWS = 3;

/** A drum's row in its strip, from the bottom: the kick, the snare and its kin (rim, clap), then hats, ride and claves. */
export const drumRow = (note: number): number => (note <= 36 ? 0 : note <= 41 ? 1 : 2);

/** The fewest semitones the roll spans: two octaves, so a quiet phrase isn't stretched. */
const LEAST_SPAN = 24;

export interface RollMark {
  readonly voice: Performer;
  /** The player who played it, by source, or null for the band. */
  readonly player: string | null;
  readonly shape: Shape;
  /** Its outline: who played it. */
  readonly who: string;
  /** Its MIDI note, or null for a drum. */
  readonly pitch: number | null;
  /** A drum's row in the strip, from the bottom; 0 for the rest. */
  readonly row: number;
  /** Across the bars shown, 0 to 1. */
  readonly x: number;
  readonly w: number;
  /** Down the pitches, 0 to 1, from the top; 0 for a drum. */
  readonly y: number;
  readonly h: number;
  /** Whether it ended before the step heard. */
  readonly past: boolean;
  /** Whether its voice sounds on this device. */
  readonly sounds: boolean;
}

export interface BandRollView {
  readonly marks: readonly RollMark[];
  /** The lowest and highest notes the roll spans. */
  readonly low: number;
  readonly high: number;
  /** Where each bar shown starts, 0 to 1. */
  readonly bars: readonly number[];
  /** The step heard, 0 to 1, or null before anything is. */
  readonly playhead: number | null;
  /** The bars the Muse took a motif from, each across the bars shown, in its player's colour. */
  readonly taken: readonly { readonly x: number; readonly w: number; readonly who: string }[];
}

export function bandRoll(tracks: TracksView): BandRollView {
  const { span, playhead } = tracks;
  type Raw = Omit<RollMark, 'x' | 'w' | 'y' | 'h' | 'past'> & { step: number; length: number };
  const raw: Raw[] = [];
  const barOf = (step: number) => tracks.frame.findIndex((b) => step < b.start + b.steps);
  for (const p of tracks.performers)
    for (const n of p.notes) {
      const credit = p.motifs.find((m) => m.at === barOf(n.step))?.credit;
      raw.push({
        voice: p.performer,
        player: null,
        shape: SHAPES[p.performer],
        who: credit ? `var(--source-${credit.colour})` : `var(--voice-${p.performer})`,
        pitch: p.performer === 'drums' ? null : n.note,
        row: p.performer === 'drums' ? drumRow(n.note) : 0,
        sounds: p.sounds,
        step: n.step,
        length: n.length,
      });
    }
  for (const lane of tracks.players) {
    if (lane.heardAs) continue;
    for (const n of lane.notes)
      raw.push({
        voice: lane.part,
        player: lane.source,
        shape: SHAPES[lane.part],
        who: `var(--source-${lane.colour})`,
        pitch: lane.part === 'drums' ? null : n.note,
        row: lane.part === 'drums' ? drumRow(n.note) : 0,
        sounds: true,
        step: n.step,
        length: n.length,
      });
  }
  const pitches = raw.flatMap((m) => (m.pitch === null ? [] : [m.pitch]));
  let low = pitches.length ? Math.min(...pitches) - 2 : 48;
  let high = pitches.length ? Math.max(...pitches) + 2 : 72;
  if (high - low < LEAST_SPAN) {
    const grow = LEAST_SPAN - (high - low);
    low -= Math.floor(grow / 2);
    high += Math.ceil(grow / 2);
  }
  const rows = high - low + 1;
  const marks = raw.map(({ step, length, ...m }): RollMark => ({
    ...m,
    x: step / span,
    w: length / span,
    y: m.pitch === null ? 0 : (high - m.pitch) / rows,
    h: m.pitch === null ? 0 : 1 / rows,
    past: playhead !== null && step + length <= playhead,
  }));
  return {
    marks,
    low,
    high,
    bars: tracks.frame.map((b) => b.start / span),
    playhead: playhead === null ? null : playhead / span,
    taken: tracks.players.flatMap((lane) => {
      const bar = lane.taken === null ? undefined : tracks.frame[lane.taken];
      return bar
        ? [{ x: bar.start / span, w: bar.steps / span, who: `var(--source-${lane.colour})` }]
        : [];
    }),
  };
}
