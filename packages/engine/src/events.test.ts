import { describe, expect, it } from 'vitest';
import { type NoteEvent, PARTS, eventProblems } from './events.ts';

const range = (from: number, to: number) => [...Array(to - from + 1).keys()].map((i) => from + i);

const kick: NoteEvent = { part: 'drums', step: 0, note: 36, velocity: 112, length: 1 };
const pad: NoteEvent = { part: 'chords', comp: 'pad', step: 0, note: 60, velocity: 60, length: 16 };

describe('eventProblems', () => {
  it('finds none in a well-formed event of every part', () => {
    expect(PARTS).toEqual(['drums', 'bass', 'chords', 'lead']);
    for (const part of PARTS) {
      const event: NoteEvent = part === 'chords' ? pad : { ...kick, part };
      expect(eventProblems(event)).toEqual([]);
    }
    expect(eventProblems({ ...pad, comp: 'stab' })).toEqual([]);
  });

  it('accepts every step of the bar and nothing outside it', () => {
    for (const step of range(0, 15)) expect(eventProblems({ ...kick, step })).toEqual([]);
    for (const step of [-1, 16, 2.5, NaN])
      expect(eventProblems({ ...kick, step })).toEqual([`step ${step} is not a step 0–15`]);
  });

  it('accepts every MIDI note and nothing outside them', () => {
    for (const note of range(0, 127)) expect(eventProblems({ ...kick, note })).toEqual([]);
    for (const note of [-1, 128, 60.5])
      expect(eventProblems({ ...kick, note })).toEqual([`note ${note} is not a MIDI note 0–127`]);
  });

  it('accepts every sounding velocity, and not 0, which MIDI reads as a note-off', () => {
    for (const velocity of range(1, 127)) expect(eventProblems({ ...kick, velocity })).toEqual([]);
    for (const velocity of [0, 128, 99.5])
      expect(eventProblems({ ...kick, velocity })).toEqual([
        `velocity ${velocity} is not a velocity 1–127`,
      ]);
  });

  it('wants a positive, finite length in steps', () => {
    for (const length of [0.05, 1, 16, 40]) expect(eventProblems({ ...kick, length })).toEqual([]);
    for (const length of [0, -1, Infinity, NaN])
      expect(eventProblems({ ...kick, length })).toEqual([`length ${length} is not positive`]);
  });

  it('wants pad or stab on a chords event, and on no other', () => {
    const bare: NoteEvent = { part: 'chords', step: 0, note: 60, velocity: 60, length: 16 };
    expect(eventProblems(bare)).toEqual(['a chords event is a pad or a stab']);
    expect(eventProblems({ ...kick, comp: 'stab' })).toEqual([
      'a drums event is not a pad or a stab',
    ]);
  });

  it('reports every problem at once', () => {
    expect(eventProblems({ ...kick, step: 16, note: 128, velocity: 0, length: 0 })).toHaveLength(4);
  });
});
