import { writeMidi, type MidiEvent } from 'midi-file';
import { describe, expect, it } from 'vitest';
import { loadMidi } from './load.ts';
import { parseSmf } from './smf.ts';

const PPQ = 480;
const STEP = PPQ / 4;

/** A real Standard MIDI File's bytes, built the same way `midi-file` itself round-trips one. */
function smfBytes(tracks: MidiEvent[][]): Uint8Array {
  const header = { format: 1 as const, numTracks: tracks.length, ticksPerBeat: PPQ };
  return new Uint8Array(writeMidi({ header, tracks }));
}

describe('parseSmf', () => {
  it('reads a file’s ppq, tempo, meter and notes back from real bytes', () => {
    const conductor: MidiEvent[] = [
      { deltaTime: 0, type: 'setTempo', microsecondsPerBeat: 500_000 }, // 120bpm
      {
        deltaTime: 0,
        type: 'timeSignature',
        numerator: 4,
        denominator: 4,
        metronome: 24,
        thirtyseconds: 8,
      },
      { deltaTime: 16 * STEP, type: 'endOfTrack' },
    ];
    const melody: MidiEvent[] = [{ deltaTime: 0, type: 'trackName', text: 'Lead Melody' }];
    for (let step = 0; step < 16; step++) {
      // Back to back: each noteOn follows the previous noteOff with no gap.
      melody.push({
        deltaTime: 0,
        type: 'noteOn',
        channel: 0,
        noteNumber: 60 + step,
        velocity: 90,
      });
      melody.push({
        deltaTime: STEP,
        type: 'noteOff',
        channel: 0,
        noteNumber: 60 + step,
        velocity: 0,
      });
    }
    melody.push({ deltaTime: 0, type: 'endOfTrack' });

    const raw = parseSmf(smfBytes([conductor, melody]));
    expect(raw.ppq).toBe(PPQ);
    expect(raw.tempos).toEqual([{ ticks: 0, bpm: 120 }]);
    expect(raw.timeSignatures).toEqual([{ ticks: 0, numerator: 4, denominator: 4 }]);
    expect(raw.tracks).toHaveLength(2);
    const melodyTrack = raw.tracks[1]!;
    expect(melodyTrack.name).toBe('Lead Melody');
    expect(melodyTrack.notes).toHaveLength(16);
    expect(melodyTrack.notes[0]).toEqual({ midi: 60, ticks: 0, durationTicks: STEP, velocity: 90 });
    expect(melodyTrack.notes[15]).toEqual({
      midi: 75,
      ticks: 15 * STEP,
      durationTicks: STEP,
      velocity: 90,
    });
  });

  it('pairs overlapping same-pitch notes oldest-first', () => {
    const track: MidiEvent[] = [
      { deltaTime: 0, type: 'noteOn', channel: 0, noteNumber: 60, velocity: 100 },
      { deltaTime: STEP, type: 'noteOn', channel: 0, noteNumber: 60, velocity: 60 },
      { deltaTime: STEP, type: 'noteOff', channel: 0, noteNumber: 60, velocity: 0 },
      { deltaTime: STEP, type: 'noteOff', channel: 0, noteNumber: 60, velocity: 0 },
      { deltaTime: 0, type: 'endOfTrack' },
    ];
    const raw = parseSmf(smfBytes([track]));
    expect(raw.tracks[0]!.notes).toEqual([
      { midi: 60, ticks: 0, durationTicks: 2 * STEP, velocity: 100 },
      { midi: 60, ticks: STEP, durationTicks: 2 * STEP, velocity: 60 },
    ]);
  });

  it('reads a program change as the track’s program, and channel from its events', () => {
    const track: MidiEvent[] = [
      { deltaTime: 0, type: 'programChange', channel: 3, programNumber: 81 },
      { deltaTime: 0, type: 'noteOn', channel: 3, noteNumber: 60, velocity: 90 },
      { deltaTime: STEP, type: 'noteOff', channel: 3, noteNumber: 60, velocity: 0 },
      { deltaTime: 0, type: 'endOfTrack' },
    ];
    const raw = parseSmf(smfBytes([track]));
    expect(raw.tracks[0]).toMatchObject({ channel: 3, program: 81 });
  });

  it('feeds a real file end to end through loadMidi, the milestone 3 slice of #3 (A6)', () => {
    const conductor: MidiEvent[] = [
      { deltaTime: 0, type: 'setTempo', microsecondsPerBeat: 500_000 },
      {
        deltaTime: 0,
        type: 'timeSignature',
        numerator: 4,
        denominator: 4,
        metronome: 24,
        thirtyseconds: 8,
      },
      { deltaTime: 0, type: 'endOfTrack' },
    ];
    const drums: MidiEvent[] = [];
    for (let step = 0; step < 16; step += 4) {
      // A kick every 4 steps, 1 step long: 3 steps of gap after each noteOff.
      const gapAfterFirst = step === 0 ? 0 : 4 * STEP - STEP;
      drums.push({
        deltaTime: gapAfterFirst,
        type: 'noteOn',
        channel: 9,
        noteNumber: 36,
        velocity: 100,
      });
      drums.push({ deltaTime: STEP, type: 'noteOff', channel: 9, noteNumber: 36, velocity: 0 });
    }
    drums.push({ deltaTime: 0, type: 'endOfTrack' });

    const raw = parseSmf(smfBytes([conductor, drums]));
    const result = loadMidi(raw);
    expect(result.roles).toEqual([expect.objectContaining({ role: 'drums' })]);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.notes).toHaveLength(4);
    expect(result.tempoMap.played(PPQ)).toBeCloseTo(0.5, 9);
  });
});
