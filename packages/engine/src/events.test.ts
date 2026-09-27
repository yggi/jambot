import { describe, expect, it } from 'vitest';
import {
  DRUM_ROLES,
  type DrumRole,
  type NoteEvent,
  PARTS,
  type WrittenNote,
  eventProblems,
  writtenProblems,
} from './events.ts';

const range = (from: number, to: number) => [...Array(to - from + 1).keys()].map((i) => from + i);

const kick: NoteEvent = { part: 'drums', step: 0, note: 36, velocity: 112, length: 1 };

describe('eventProblems', () => {
  it('finds none in a well-formed event of every part, each one voice: the pad and the stab apart (L6)', () => {
    expect(PARTS).toEqual(['drums', 'bass', 'pad', 'stab', 'lead']);
    for (const part of PARTS) expect(eventProblems({ ...kick, part })).toEqual([]);
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
      expect(eventProblems({ ...kick, length })).toEqual([
        `length ${length} is not a positive, finite length`,
      ]);
  });

  it('reports every problem at once', () => {
    expect(eventProblems({ ...kick, step: 16, note: 128, velocity: 0, length: 0 })).toHaveLength(4);
  });
});

const hit: WrittenNote = { part: 'drums', role: 'kick', step: 0, note: 36, length: 1 };

describe('writtenProblems', () => {
  it('finds none in a well-formed written note of every part, and every drum role (T4)', () => {
    for (const part of PARTS) {
      const note: WrittenNote = part === 'drums' ? hit : { part, step: 0, note: 40, length: 4 };
      expect(writtenProblems(note)).toEqual([]);
    }
    for (const role of DRUM_ROLES) expect(writtenProblems({ ...hit, role })).toEqual([]);
  });

  it('wants every step of the bar and nothing outside it', () => {
    for (const step of range(0, 15)) expect(writtenProblems({ ...hit, step })).toEqual([]);
    for (const step of [-1, 16, 2.5, NaN])
      expect(writtenProblems({ ...hit, step })).toEqual([`step ${step} is not a step 0–15`]);
  });

  it('accepts every MIDI note and nothing outside them', () => {
    for (const note of range(0, 127)) expect(writtenProblems({ ...hit, note })).toEqual([]);
    for (const note of [-1, 128, 60.5])
      expect(writtenProblems({ ...hit, note })).toEqual([`note ${note} is not a MIDI note 0–127`]);
  });

  it('wants a length in whole steps: a played length is the performance’s (T4)', () => {
    for (const length of [1, 2, 16, 40]) expect(writtenProblems({ ...hit, length })).toEqual([]);
    for (const length of [0, -1, 0.3, 2.5, Infinity, NaN])
      expect(writtenProblems({ ...hit, length })).toEqual([
        `length ${length} is not a whole number of steps`,
      ]);
  });

  it('wants no velocity: how loud a note plays is the performance’s (T4)', () => {
    const loud = { ...hit, velocity: 100 } as WrittenNote;
    expect(writtenProblems(loud)).toEqual(['a written note has no velocity']);
  });

  it('takes a whole accent on a lead note, as written, and on nothing else (T4, U4)', () => {
    const lead: WrittenNote = { part: 'lead', step: 0, note: 72, length: 2 };
    for (const accent of [-20, 0, 15]) expect(writtenProblems({ ...lead, accent })).toEqual([]);
    expect(writtenProblems({ ...lead, accent: 2.5 })).toEqual(['accent 2.5 is not a whole number']);
    for (const part of PARTS.filter((p) => p !== 'lead' && p !== 'drums'))
      expect(writtenProblems({ ...lead, part, accent: 3 })).toEqual([
        `a ${part} note has no accent`,
      ]);
  });

  it('wants a role on a drum hit and on nothing else', () => {
    const bare: WrittenNote = { part: 'drums', step: 0, note: 36, length: 1 };
    expect(writtenProblems(bare)).toEqual(['a drum hit has a role']);
    expect(writtenProblems({ ...hit, role: 'cowbell' as DrumRole })).toEqual([
      'role cowbell is not a drum role',
    ]);
    for (const part of PARTS.filter((p) => p !== 'drums'))
      expect(writtenProblems({ ...hit, part })).toEqual([`a ${part} note has no role`]);
  });

  it('reports every problem at once', () => {
    expect(writtenProblems({ ...hit, step: 16, note: 128, length: 0.5 })).toHaveLength(3);
  });
});
