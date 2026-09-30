import { Midi, Note } from 'tonal';
import { describe, expect, it } from 'vitest';
import { partial } from './intervals.ts';
import { A4_HZ, A4_MIDI, frequencyOf, pitchOf } from './tuning.ts';

const range = (n: number) => [...Array(n).keys()];
const MIDI_NOTES = range(128);
/** Every whole cent from just past the lower half-way point to just short of the upper. */
const CENTS = range(99).map((i) => i - 49);
const REFERENCES = [A4_HZ, 415, 432, 466.16];

describe('frequencyOf', () => {
  it('puts A4 at the reference, and C4 where 12-TET has it', () => {
    expect(A4_MIDI).toBe(69);
    expect(frequencyOf(69)).toBe(440);
    expect(frequencyOf(69, 415)).toBe(415);
    expect(frequencyOf(60)).toBeCloseTo(261.6256, 4);
  });

  it('agrees with tonal on every MIDI note', () => {
    for (const midi of MIDI_NOTES)
      expect(frequencyOf(midi), `${midi}`).toBeCloseTo(Midi.midiToFreq(midi), 9);
    expect(frequencyOf(60), 'C4').toBeCloseTo(Note.freq('C4')!, 9);
  });

  it('doubles an octave up and takes any number of semitones, a fraction of one included', () => {
    for (const midi of range(116))
      expect(frequencyOf(midi + 12) / frequencyOf(midi)).toBeCloseTo(2, 12);
    expect(frequencyOf(69.5)).toBeCloseTo(440 * 2 ** (0.5 / 12), 9);
  });
});

describe('pitchOf', () => {
  it('reads a note as itself when it is exact', () => {
    for (const reference of REFERENCES)
      for (const midi of MIDI_NOTES) {
        const pitch = pitchOf(frequencyOf(midi, reference), reference)!;
        expect(pitch.midi, `${midi} at ${reference}`).toBe(midi);
        expect(pitch.cents, `${midi} at ${reference}`).toBeCloseTo(0, 9);
        expect(pitch.offsetHz, `${midi} at ${reference}`).toBeCloseTo(0, 9);
      }
  });

  it('reads every MIDI note detuned by every whole cent, at every reference', () => {
    for (const reference of REFERENCES)
      for (const midi of MIDI_NOTES)
        for (const cents of CENTS) {
          const hz = frequencyOf(midi + cents / 100, reference);
          const pitch = pitchOf(hz, reference)!;
          const at = `${midi} ${cents >= 0 ? '+' : ''}${cents} cents at ${reference}`;
          expect(pitch.midi, at).toBe(midi);
          expect(pitch.cents, at).toBeCloseTo(cents, 7);
          expect(pitch.hz, at).toBeCloseTo(frequencyOf(midi, reference), 9);
          expect(pitch.offsetHz, at).toBeCloseTo(hz - frequencyOf(midi, reference), 9);
        }
  });

  it('counts sharp as positive and flat as negative, in cents and in Hz alike', () => {
    const sharp = pitchOf(442)!;
    expect(sharp.midi).toBe(69);
    expect(sharp.cents).toBeCloseTo(7.8514, 4); // 1200 · log2(442 / 440)
    expect(sharp.offsetHz).toBeCloseTo(2, 9);
    const flat = pitchOf(438)!;
    expect(flat.cents).toBeCloseTo(-7.8872, 4);
    expect(flat.offsetHz).toBeCloseTo(-2, 9);
  });

  it('never leaves the nearest note more than 50 cents away, and at 50 takes either neighbour', () => {
    for (const midi of MIDI_NOTES) {
      const pitch = pitchOf(frequencyOf(midi + 0.5))!;
      expect(Math.abs(pitch.cents), `${midi}`).toBeCloseTo(50, 7);
      expect([midi, midi + 1], `${midi}`).toContain(pitch.midi);
    }
    for (let hz = 20; hz < 20000; hz *= 1.0137) {
      const { cents } = pitchOf(hz)!;
      expect(cents).toBeGreaterThanOrEqual(-50);
      expect(cents).toBeLessThanOrEqual(50);
    }
  });

  it('moves with the reference: the same sound is a different distance from another A4', () => {
    expect(pitchOf(432)!.cents).toBeCloseTo(-31.7667, 4);
    expect(pitchOf(432, 432)!.cents).toBeCloseTo(0, 9);
    expect(pitchOf(432, 432)!.midi).toBe(69);
  });

  it('reads one octave up as twelve notes and the same cents', () => {
    for (const hz of [27.5, 82.41, 100, 261.63, 440.7, 1234.5]) {
      const low = pitchOf(hz)!;
      const high = pitchOf(hz * 2)!;
      expect(high.midi).toBe(low.midi + 12);
      expect(high.cents).toBeCloseTo(low.cents, 9);
    }
  });

  it('finds the harmonic series where the theory places it, the seventh 31 cents flat', () => {
    const a2 = frequencyOf(45);
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8])
      expect(pitchOf(a2 * n)!.midi, `${n}`).toBe(45 + partial(n));
    expect(pitchOf(a2 * 7)!.cents).toBeCloseTo(-31.1741, 4);
    expect(pitchOf(a2 * 3)!.cents).toBeCloseTo(1.955, 3);
  });

  it('reads no pitch from what is not a frequency', () => {
    for (const hz of [0, -440, Number.NaN, Infinity, -Infinity])
      expect(pitchOf(hz), `${hz}`).toBeUndefined();
    for (const reference of [0, -1, Number.NaN, Infinity])
      expect(pitchOf(440, reference), `${reference}`).toBeUndefined();
  });
});
