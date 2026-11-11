import {
  type BandBar,
  type BarEnv,
  PRESETS,
  type WrittenNote,
  band,
  baseLengthOf,
  composedLevel,
  perform,
  presetMode,
  presetSwing,
} from '@jambot/engine';
import { stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type CellsNote, performCells } from './perform.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tour of the presets, a new one every 8 bars, with entropy rising. */
const tour = (seed: number, bars = 96): BandBar[] => {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
    const style = { ...preset.style, entropy: (bar % 32) / 32 };
    // The level is asked a bar ahead: a section's plan takes it on the bar before (#360).
    const ahead = presetSwing(PRESETS[Math.floor((bar + 1) / 8) % PRESETS.length]!)!.level;
    const swing = { level: ahead, share: presetSwing(preset)!.share };
    const next = band.advance(
      {
        seed,
        bar,
        style,
        swing,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        offer: null,
      },
      carried,
      null,
    );
    carried = next.carried;
    return next.output;
  });
};

const bars = [1, 2, 3].flatMap((seed) => tour(seed));

const clamp = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

/** A written note as a text states it and cells plays it: its line, step, pitch and role, its velocity at feel 0 as MIDI says it, and its sounding length at feel 0. */
const stated = (env: BarEnv, w: WrittenNote): CellsNote => ({
  part: w.part,
  step: w.step,
  note: w.note,
  ...(w.role !== undefined && { role: w.role }),
  velocity: clamp(composedLevel(env, w)),
  length: baseLengthOf(env, w),
});

describe('cells’ events as the performer plays them (#552)', () => {
  it('plays a note as a text states it as the band’s own performer plays the note written: the same velocity and length, every note of the tour, accented past MIDI’s 1 to 127 too, and every motif’s accent on the lead’s level (#405, #433, decision 037)', () => {
    // A written accent is in the level stated, not carried apart: the band's dough note carries it.
    const played = (env: BarEnv, w: WrittenNote) => {
      const { accent, ...rest } = perform(env, w);
      expect(accent).toBe(w.accent);
      return rest;
    };
    let notes = 0;
    let loose = 0;
    let past = 0;
    for (const b of bars) {
      // Every note the band writes, the same written far past either end of MIDI's velocities (a part's base keeps its
      // fraction there), and a motif's lead note on every step at accents from past the lead's level's floor to past its ceiling.
      const pushed = b.written.flatMap((w) =>
        [-200, 200].map((by): WrittenNote => ({ ...w, accent: (w.accent ?? 0) + by })),
      );
      const motif = range(stepsOf(b.meter)).flatMap((step) =>
        [-120, -91, -90, -60, -31, -9, -1, 0, 1, 9, 17, 36, 37, 48, 60].map(
          (accent): WrittenNote => ({
            part: 'lead',
            step,
            note: 64 + (step % 12),
            length: 2,
            accent,
          }),
        ),
      );
      for (const w of [...b.written, ...pushed, ...motif]) {
        expect(performCells(b, stated(b, w))).toEqual(played(b, w));
        if (w.accent !== undefined && (w.accent > 36 || w.accent < -90)) past++;
        if (perform(b, w).velocity !== clamp(composedLevel(b, w))) loose++;
        notes++;
      }
    }
    expect(notes).toBeGreaterThan(8_000);
    expect(past).toBeGreaterThan(8_000);
    // The feel is played, not lost: most velocities part from the level stated at feel 0.
    expect(loose / notes).toBeGreaterThan(0.5);
  });

  it('plays a fragment’s ostinato as the band’s own performer plays it, a finite velocity, though cells’ feel weighs no such role yet (#651, until yggi/cells#717)', () => {
    let hits = 0;
    for (const b of bars.slice(0, 96))
      for (const step of range(stepsOf(b.meter))) {
        const w: WrittenNote = { part: 'drums', role: 'ostinato', step, note: 45, length: 1 };
        const s = stated(b, w);
        const own = perform(b, w);
        const played = performCells(b, s);
        expect(Number.isFinite(played.velocity)).toBe(true);
        expect([played.velocity, played.length, played.role]).toEqual([
          own.velocity,
          own.length,
          'ostinato',
        ]);
        hits++;
      }
    expect(hits).toBeGreaterThan(1000);
  });

  it('carries a stated note’s voice sound onto what it plays, in place of nothing else, and none where none is stated (#497)', () => {
    const sound = { wave: 'square', lpf: 2400, bends: [{ at: 0.02, cents: 12 }] } as const;
    for (const b of bars.slice(0, 48))
      for (const w of b.written) {
        const s = stated(b, w);
        const plain = performCells(b, s);
        expect(plain).not.toHaveProperty('sound');
        expect(performCells(b, { ...s, sound })).toEqual({ ...plain, sound });
      }
  });
});
