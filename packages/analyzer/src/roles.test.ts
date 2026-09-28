import { describe, expect, it } from 'vitest';
import { assignRoles } from './roles.ts';
import type { RawTrack } from './tracks.ts';

const note = (midi: number, ticks: number, durationTicks = 100) => ({
  midi,
  ticks,
  durationTicks,
  velocity: 80,
});

/** Notes at consecutive ticks, one after another, never overlapping. */
const monophonicLine = (pitches: readonly number[]) =>
  pitches.map((midi, index) => note(midi, index * 100));

/** A chord on every step: several notes starting together, so the track is polyphonic. */
const chordLine = (steps: number): RawTrack['notes'] =>
  Array.from({ length: steps }, (_, step) => step).flatMap((step) => [
    note(60, step * 200),
    note(64, step * 200),
    note(67, step * 200),
  ]);

describe('assignRoles', () => {
  it('reads channel 10 as drums, whatever its notes look like', () => {
    const track: RawTrack = { channel: 9, notes: monophonicLine([36, 38, 42]) };
    const [assignment] = assignRoles([track]);
    expect(assignment).toMatchObject({ role: 'drums', confidence: 1 });
  });

  it('splits a low and a high monophonic line into bass and lead', () => {
    const bass: RawTrack = { channel: 1, notes: monophonicLine([36, 38, 40]) };
    const lead: RawTrack = { channel: 2, notes: monophonicLine([72, 74, 76]) };
    const assignments = assignRoles([bass, lead]);
    expect(assignments.find((a) => a.track === bass)?.role).toBe('bass');
    expect(assignments.find((a) => a.track === lead)?.role).toBe('lead');
  });

  it('prefers a track name that hints melody for lead, over register alone', () => {
    const high: RawTrack = { channel: 1, notes: monophonicLine([72, 74, 76]) };
    const named: RawTrack = { channel: 2, name: 'Lead Vocal', notes: monophonicLine([60, 62, 64]) };
    const assignments = assignRoles([high, named]);
    expect(assignments.find((a) => a.track === named)?.role).toBe('lead');
    expect(assignments.find((a) => a.track === high)?.role).toBe('bass');
  });

  it('reads a General MIDI synth-lead program as a lead hint', () => {
    const high: RawTrack = { channel: 1, notes: monophonicLine([72, 74, 76]) };
    const programmed: RawTrack = {
      channel: 2,
      program: 81,
      notes: monophonicLine([60, 62, 64]),
    };
    const assignments = assignRoles([high, programmed]);
    expect(assignments.find((a) => a.track === programmed)?.role).toBe('lead');
  });

  it('calls a middle monophonic line harmony, between the bass and the lead', () => {
    const bass: RawTrack = { channel: 1, notes: monophonicLine([36, 38]) };
    const middle: RawTrack = { channel: 2, notes: monophonicLine([55, 57]) };
    const lead: RawTrack = { channel: 3, notes: monophonicLine([76, 78]) };
    const assignments = assignRoles([bass, middle, lead]);
    expect(assignments.find((a) => a.track === middle)?.role).toBe('harmony');
  });

  it('defaults a single low monophonic track to bass, and a single high one to lead', () => {
    const low: RawTrack = { channel: 1, notes: monophonicLine([36, 38, 40]) };
    const high: RawTrack = { channel: 2, notes: monophonicLine([72, 74, 76]) };
    expect(assignRoles([low])[0]!.role).toBe('bass');
    expect(assignRoles([high])[0]!.role).toBe('lead');
  });

  it('calls a polyphonic track harmony', () => {
    const track: RawTrack = { channel: 1, notes: chordLine(4) };
    expect(assignRoles([track])[0]).toMatchObject({ role: 'harmony', confidence: 0.7 });
  });

  it('returns nothing for no tracks', () => {
    expect(assignRoles([])).toEqual([]);
  });
});
