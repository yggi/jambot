import { describe, expect, it } from 'vitest';
import { Corrector, MAJOR, nearestNote } from './corrector.ts';

const hzOf = (note: number) => 440 * 2 ** ((note - 69) / 12);
const cents = (ratio: number) => 1200 * Math.log2(ratio);

describe('nearestNote', () => {
  it('is the note itself when it is in the scale, at every note of C major', () => {
    for (let note = 36; note <= 96; note++)
      if (MAJOR.includes(note % 12)) expect(nearestNote(note, MAJOR)).toBe(note);
  });

  it('is the nearest scale note otherwise, the higher on a tie between two, and in any octave', () => {
    expect(nearestNote(61, MAJOR)).toBe(62); // C♯ is as far from C as from D: the higher
    expect(nearestNote(60.4, MAJOR)).toBe(60);
    expect(nearestNote(61.4, MAJOR)).toBe(62);
    expect(nearestNote(65.4, MAJOR)).toBe(65);
    expect(nearestNote(70.2, MAJOR)).toBe(71);
    expect(nearestNote(58.6, MAJOR)).toBe(59);
  });

  it('keeps to a scale that wraps the octave, and to a chromatic one', () => {
    expect(nearestNote(71.4, [0, 2, 4, 5, 7, 9, 11])).toBe(71);
    expect(nearestNote(71.6, [0, 2, 4, 5, 7, 9, 11])).toBe(72);
    expect(nearestNote(60.3, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toBe(60);
    expect(nearestNote(60.7, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toBe(61);
  });

  it('is never more than half the widest gap away: a pentatonic scale is up to 1.5 semitones', () => {
    const pentatonic = [0, 2, 4, 7, 9];
    for (let note = 48; note < 72; note += 0.1)
      expect(Math.abs(nearestNote(note, pentatonic) - note)).toBeLessThanOrEqual(1.5 + 1e-9);
  });
});

describe('Corrector', () => {
  const block = 128 / 48000;

  it('asks for nothing of a note that is in tune, and for the distance of one that is not: hard', () => {
    const corrector = new Corrector({ scale: MAJOR, retuneSeconds: 0 });
    expect(cents(corrector.next(hzOf(69), block))).toBeCloseTo(0, 6);
    expect(cents(corrector.next(hzOf(69.3), block))).toBeCloseTo(-30, 6);
    expect(cents(corrector.next(hzOf(68.7), block))).toBeCloseTo(30, 6);
  });

  it('glides: after one time constant it has closed 63 % of the distance, and it keeps closing', () => {
    const corrector = new Corrector({ scale: MAJOR, retuneSeconds: 0.05 });
    const steps = Math.round(0.05 / block);
    let ratio = 1;
    for (let i = 0; i < steps; i++) ratio = corrector.next(hzOf(69.3), block);
    expect(cents(ratio)).toBeCloseTo(-30 * (1 - Math.exp(-1)), 0);
    for (let i = 0; i < steps * 5; i++) ratio = corrector.next(hzOf(69.3), block);
    expect(cents(ratio)).toBeCloseTo(-30, 0);
  });

  it('holds what it asked for through a short loss of the pitch, and lets it go after', () => {
    const corrector = new Corrector({ scale: MAJOR, retuneSeconds: 0, holdSeconds: 0.1 });
    corrector.next(hzOf(69.3), block);
    const held = corrector.next(undefined, block);
    expect(cents(held)).toBeCloseTo(-30, 6);
    let ratio = held;
    for (let i = 0; i < Math.round(0.1 / block) + 1; i++) ratio = corrector.next(undefined, block);
    for (let i = 0; i < Math.round(1 / block); i++) ratio = corrector.next(undefined, block);
    expect(cents(ratio)).toBeCloseTo(0, 0);
  });

  it('never asks for more than its limit, whatever the sound is', () => {
    const corrector = new Corrector({ scale: [0], retuneSeconds: 0, limitCents: 200 });
    for (let note = 60; note < 72; note += 0.25) {
      const c = cents(corrector.next(hzOf(note), block));
      expect(Math.abs(c)).toBeLessThanOrEqual(200 + 1e-9);
    }
  });

  it('takes a reference pitch, and a scale changed while it runs', () => {
    const corrector = new Corrector({ scale: MAJOR, retuneSeconds: 0, reference: 432 });
    expect(cents(corrector.next(432, block))).toBeCloseTo(0, 6);
    corrector.scale = [1, 3, 6, 8, 10]; // the black keys: A is as far from A♭ as from B♭, and takes the higher
    expect(cents(corrector.next(432, block))).toBeCloseTo(100, 6);
  });
});
