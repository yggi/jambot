import { DRUM_NOTES, type WrittenNote } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { toDrumNotation, toScoreDrums } from './notation.ts';
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

  it('leaves the snare’s role open: its hit-by-hit call is E16’s one still-open part', () => {
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

const written = (part: WrittenNote['part'], midi: number, step: number): WrittenNote => ({
  part,
  step,
  note: midi,
  length: 1,
});

describe('toScoreDrums', () => {
  it('groups every supported sound’s hits under its own line', () => {
    const notes = [
      written('drums', DRUM_NOTES.kick, 0),
      written('drums', DRUM_NOTES.kick, 8),
      written('drums', DRUM_NOTES.closedHat, 2),
    ];
    expect(toScoreDrums(notes)).toEqual({ kick: [0, 8], closedHat: [2] });
  });

  it('leaves the snare out: it has no score line yet (E16)', () => {
    expect(toScoreDrums([written('drums', DRUM_NOTES.snare, 4)])).toEqual({});
  });

  it('reads only the drums part, not another performer’s notes on the same shape', () => {
    expect(toScoreDrums([written('bass', DRUM_NOTES.kick, 0)])).toEqual({});
  });

  it('groups nothing for no notes', () => {
    expect(toScoreDrums([])).toEqual({});
  });
});
