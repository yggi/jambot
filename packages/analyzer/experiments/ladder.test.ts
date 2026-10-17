import { DRUM_NOTES } from '@jambot/engine';
import { type ScoreBar, compileBar, encodeBar } from '@jambot/score';
import {
  DIATONIC_MODE_NAMES,
  type Helix,
  type Motif,
  NOOP,
  alteredDegree,
  applyOp,
  canonicalOp,
  diatonicMode,
  even,
  heightOf,
  parseNumeral,
  shift,
} from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { loadMidi } from '../src/load.ts';
import { toDrumNotation, toScoreDrums } from '../src/notation.ts';
import type { QuantisedNote } from '../src/swing.ts';
import { metronomeRung, scaleRung } from './ladder.ts';

/** A bar around a drum line: fixed placeholders for what this rung doesn't test. */
const around = (drums: ScoreBar['drums']): ScoreBar => ({
  bar: 0,
  section: 'groove',
  key: { tonic: 0, mode: 'ionian' },
  theme: 'A',
  style: { sync: 0, harm: 0, artic: 0, energy: 0, entropy: 0, bpm: 96 },
  harm: [{ step: 0, numeral: parseNumeral('I')! }],
  drums,
});

describe('metronomeRung (rung 0)', () => {
  it('the parser recovers the engine’s own metronome exactly: role, grid, tempo and swing (Q10)', () => {
    const bpm = 96;
    const bars = 4;
    const raw = metronomeRung(bpm, bars);
    const result = loadMidi(raw);

    expect(result.droppedEmptyTracks).toBe(0);
    expect(result.droppedDuplicateTracks).toBe(0);
    expect(result.otherMeters).toEqual([]);
    expect(result.log).toEqual([]);

    // Role: one track, drums, by channel 10 alone.
    expect(result.roles).toEqual([
      expect.objectContaining({ role: 'drums', confidence: 1, reason: 'channel 10' }),
    ]);

    // Grid: one beat click per quarter note, 4 a bar, dead on the grid.
    expect(result.sections).toHaveLength(1);
    const notes = result.sections[0]!.notes;
    expect(notes).toHaveLength(bars * 4);
    notes.forEach((note, index) => {
      expect(note.bar).toBe(Math.floor(index / 4));
      expect(note.step).toBe((index % 4) * 4);
      expect(note.midi).toBe(DRUM_NOTES.kick);
      expect(note.residual).toBeCloseTo(0, 6);
    });

    // The downbeat and the other beats keep the metronome's own accent.
    expect(notes.filter((n) => n.step === 0).every((n) => n.velocity === 110)).toBe(true);
    expect(notes.filter((n) => n.step !== 0).every((n) => n.velocity === 90)).toBe(true);

    // Swing and tempo: a metronome is straight, and its own tempo comes back exact.
    expect(result.sections[0]!.swing).toBeCloseTo(0, 2);
    expect(result.confidence).toBeGreaterThan(0.99);
    expect(result.tempoMap.played(result.tempoMap.written(1.5))).toBeCloseTo(1.5, 9);
  });

  it('scales to a slower and a faster tempo without losing a beat', () => {
    for (const bpm of [40, 96, 220]) {
      const result = loadMidi(metronomeRung(bpm, 2));
      expect(result.sections[0]!.notes).toHaveLength(8);
      expect(result.confidence).toBeGreaterThan(0.99);
    }
  });

  it('reaches the score’s own written notation (#63 step 2b)', () => {
    // Every rung 0 hit is a kick, the one sound `toDrumNotation` never
    // leaves open, so this rung meets no part of E16's one remaining
    // question (the snare's own role).
    const result = loadMidi(metronomeRung(96, 1));
    const written = toDrumNotation(result.sections[0]!.notes);
    expect(written).toEqual([
      { part: 'drums', step: 0, note: DRUM_NOTES.kick, length: 1, role: 'kick' },
      { part: 'drums', step: 4, note: DRUM_NOTES.kick, length: 1, role: 'kick' },
      { part: 'drums', step: 8, note: DRUM_NOTES.kick, length: 1, role: 'kick' },
      { part: 'drums', step: 12, note: DRUM_NOTES.kick, length: 1, role: 'kick' },
    ]);
  });

  it('round-trips through real score text: MIDI → parser → encodeBar → compileBar → parser (Q10)', () => {
    const result = loadMidi(metronomeRung(96, 1));
    const written = toDrumNotation(result.sections[0]!.notes);
    const bar = around(toScoreDrums(written));

    const text = encodeBar(bar);
    expect(text).toContain('bd "bd ~@3 bd ~@3 bd ~@3 bd ~@3"');
    expect(compileBar(text)).toEqual(bar);
    expect(encodeBar(compileBar(text))).toBe(text);
  });
});

/** Every key a diatonic scale can start from: 12 tonics, 7 modes, degree 0 in octave 4 (C4 = 60). */
const EVERY_SCALE = DIATONIC_MODE_NAMES.flatMap((mode) =>
  Array.from({ length: 12 }, (_, tonic) => ({
    name: `${tonic} ${mode}`,
    scale: shift(diatonicMode(mode), 60 + tonic),
  })),
);

/** Up an octave and back, the top held twice: 16 quarters, 4 bars. */
const UP_AND_DOWN = [0, 1, 2, 3, 4, 5, 6, 7, 7, 6, 5, 4, 3, 2, 1, 0];

/** Half of the parsed line, two bars from `from`, as a motif of the key's degrees from the line's first note (U4). */
function halfAsMotif(notes: readonly QuantisedNote[], key: Helix, from: number): Motif {
  const half = notes.filter((n) => n.bar >= from && n.bar < from + 2);
  const read = half.map((n) => alteredDegree(key, n.midi)!);
  const origin = alteredDegree(key, notes[0]!.midi)!.degree;
  return {
    cycle: 32,
    onsets: half.map((n) => (n.bar - from) * 16 + n.step),
    degrees: read.map((r) => r.degree - origin),
    accidentals: read.map((r) => r.accidental),
  };
}

describe('scaleRung (rung 1)', () => {
  it('the parser recovers a scale up and down in every key exactly: role, grid, pitch, tempo and swing (Q10)', () => {
    for (const { name, scale } of EVERY_SCALE) {
      const result = loadMidi(scaleRung(scale, 96));
      expect(result.log, name).toEqual([]);
      expect(result.roles, name).toEqual([expect.objectContaining({ role: 'lead' })]);
      expect(result.sections, name).toHaveLength(1);
      const { notes, swing } = result.sections[0]!;
      expect(swing, name).toBeCloseTo(0, 2);
      expect(
        notes.map((n) => [n.bar, n.step, n.length, n.midi]),
        name,
      ).toEqual(
        UP_AND_DOWN.map((degree, i) => [
          Math.floor(i / 4),
          (i % 4) * 4,
          4,
          heightOf(scale, degree),
        ]),
      );
      notes.forEach((n) => expect(n.residual, name).toBeCloseTo(0, 6));
    }
  });

  it('scales to a slower and a faster tempo without losing a note', () => {
    const scale = shift(diatonicMode('ionian'), 60);
    for (const bpm of [40, 96, 220]) {
      const result = loadMidi(scaleRung(scale, bpm));
      expect(result.sections[0]!.notes).toHaveLength(16);
      expect(result.confidence).toBeGreaterThan(0.99);
    }
  });

  it('reads back as one index on both towers: note i at beat i and at the scale’s degree i, up and back (Q10, #157)', () => {
    const beats = even(4, 16);
    for (const { name, scale } of EVERY_SCALE) {
      const notes = loadMidi(scaleRung(scale, 96)).sections[0]!.notes;
      const key = { cycle: 12, heights: scale.heights.map((h) => h - 60) };
      const read = notes.map((n) => alteredDegree(key, n.midi)!);
      const origin = read[0]!.degree;
      expect(
        notes.map((n) => n.bar * 16 + n.step),
        name,
      ).toEqual(UP_AND_DOWN.map((_, i) => heightOf(beats, i)));
      expect(
        read.map((r) => [r.degree - origin, r.accidental]),
        name,
      ).toEqual(UP_AND_DOWN.map((degree) => [degree, 0]));
    }
  });

  it('the descent is the ascent under one operator on either tower, `rev` or `mirror.strans(7)`, and the canonical one is on pitch (U5, #157, Q12)', () => {
    for (const { name, scale } of EVERY_SCALE) {
      const notes = loadMidi(scaleRung(scale, 96)).sections[0]!.notes;
      const key = { cycle: 12, heights: scale.heights.map((h) => h - 60) };
      const up = halfAsMotif(notes, key, 0);
      const down = halfAsMotif(notes, key, 2);
      const rev = { ...NOOP, rev: true };
      const mirrored = { ...NOOP, mirror: true, strans: 7 };
      expect(applyOp(rev, up), name).toEqual(down);
      expect(applyOp(mirrored, up), name).toEqual(down);
      expect(canonicalOp(rev, up), name).toEqual(mirrored);
    }
  });

  it('counted in semitones rather than the key’s degrees, the pitch mirror gives the descent in dorian alone (U5)', () => {
    const holds = DIATONIC_MODE_NAMES.filter((mode) => {
      const notes = loadMidi(scaleRung(shift(diatonicMode(mode), 60), 96)).sections[0]!.notes;
      const inSemitones = (from: number): Motif => {
        const half = notes.filter((n) => n.bar >= from && n.bar < from + 2);
        return {
          cycle: 32,
          onsets: half.map((n) => (n.bar - from) * 16 + n.step),
          degrees: half.map((n) => n.midi - notes[0]!.midi),
          accidentals: half.map(() => 0),
        };
      };
      const up = inSemitones(0);
      const down = inSemitones(2);
      expect(applyOp({ ...NOOP, rev: true }, up), mode).toEqual(down);
      return (
        JSON.stringify(applyOp({ ...NOOP, mirror: true, strans: 12 }, up)) === JSON.stringify(down)
      );
    });
    expect(holds).toEqual(['dorian']);
  });
});
