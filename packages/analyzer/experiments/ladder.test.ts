import { DRUM_NOTES } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { loadMidi } from '../src/load.ts';
import { metronomeRung } from './ladder.ts';

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
});
