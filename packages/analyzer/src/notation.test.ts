import { DRUM_NOTES } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { toDrumNotation } from './notation.ts';
import type { QuantisedNote } from './swing.ts';

const note = (midi: number, step: number): QuantisedNote => ({
  midi,
  velocity: 100,
  bar: 0,
  step,
  length: 1,
  residual: 0.02,
});

describe('toDrumNotation', () => {
  it('writes a kick, a pedal hat, a rim and every hi-hat sound with the one role each always plays', () => {
    const notes = [
      note(DRUM_NOTES.kick, 0),
      note(DRUM_NOTES.pedalHat, 4),
      note(DRUM_NOTES.rim, 7),
      note(DRUM_NOTES.closedHat, 2),
      note(DRUM_NOTES.openHat, 6),
      note(DRUM_NOTES.ride, 10),
    ];
    const written = toDrumNotation(notes);
    expect(written.map((n) => n.role)).toEqual(['kick', 'pedal', 'euclid', 'hat', 'hat', 'hat']);
  });

  it('leaves the snare’s role open: E16 is not decided, so this doesn’t guess', () => {
    const [written] = toDrumNotation([note(DRUM_NOTES.snare, 4)]);
    expect(written!.role).toBeUndefined();
  });

  it('drops velocity and the microtiming residual: performance, not notation', () => {
    const [written] = toDrumNotation([note(DRUM_NOTES.kick, 0)]);
    expect(written).toEqual({
      part: 'drums',
      step: 0,
      note: DRUM_NOTES.kick,
      length: 1,
      role: 'kick',
    });
    expect(written).not.toHaveProperty('velocity');
    expect(written).not.toHaveProperty('residual');
  });

  it('keeps the bar-relative step and the length, in whole steps', () => {
    const [written] = toDrumNotation([{ ...note(DRUM_NOTES.kick, 12), length: 2 }]);
    expect(written).toMatchObject({ step: 12, length: 2 });
  });
});
