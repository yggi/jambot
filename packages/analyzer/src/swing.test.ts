import { swingMap } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { estimateSwing, quantiseSection } from './swing.ts';
import type { RawNote } from './tracks.ts';

const PPQ = 480;
const STEP_TICKS = PPQ / 4;

/** Notes written at `writtenSteps`, performed with `swing` (the inverse of what the parser must undo). */
function performedNotes(writtenSteps: readonly number[], swing: number): RawNote[] {
  const map = swingMap(swing);
  return writtenSteps.map((step, index) => ({
    midi: 60 + (index % 12),
    ticks: Math.round(map.played(step) * STEP_TICKS),
    durationTicks: STEP_TICKS,
    velocity: 80,
  }));
}

// Every step of a bar tour, so onbeat and offbeat notes at both swing
// levels are covered (the law of meaningful tests: every case, not a sample).
const BAR_TOUR = Array.from({ length: 8 }, (_, bar) =>
  Array.from({ length: 16 }, (_, step) => bar * 16 + step),
).flat();

describe('estimateSwing and quantiseSection', () => {
  it.each([0, 0.15, 0.3, 0.5, 0.7, 0.85, 1])(
    'recovers swing %s within the search resolution, and every step exactly, over a bar tour (A6)',
    (swing) => {
      const notes = performedNotes(BAR_TOUR, swing);
      const recovered = estimateSwing(notes.map((note) => note.ticks / STEP_TICKS));
      expect(recovered).toBeCloseTo(swing, 2);

      const result = quantiseSection(PPQ, 0, notes);
      result.notes.forEach((note, index) => {
        expect(note.bar * 16 + note.step).toBe(BAR_TOUR[index]);
      });
    },
  );

  it('is confident on a straight, exactly-quantised section', () => {
    const result = quantiseSection(PPQ, 0, performedNotes(BAR_TOUR, 0));
    expect(result.confidence).toBeGreaterThan(0.99);
  });

  it('keeps every note’s velocity and pitch through quantising', () => {
    const notes = performedNotes([0, 1, 2], 0.3);
    const result = quantiseSection(PPQ, 0, notes);
    expect(result.notes.map((note) => [note.midi, note.velocity])).toEqual(
      notes.map((note) => [note.midi, note.velocity]),
    );
  });

  it('estimates 0 swing for a section with no notes', () => {
    expect(estimateSwing([])).toBe(0);
  });
});
