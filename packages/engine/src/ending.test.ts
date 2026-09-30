import { describe, expect, it } from 'vitest';
import { band, finaleBar } from './band.ts';
import { chordName } from './chords.ts';
import { DRUM_NOTES } from './drums.ts';
import { RING_STEPS, cadence, countIn, countInSeconds, finale } from './ending.ts';
import { METERS, stepsOf } from '@jambot/theory';
import type { BarEnv } from './band.ts';
import { BAR_STEPS, beatStart, doughProblems, writtenProblems } from './events.ts';
import { COMPOSER_MODES, INITIAL_KEY } from './key.ts';
import { INITIAL_STYLE, PRESETS, glideTo, holding } from './style.ts';
import { stepSeconds } from './tempo.ts';

const range = (n: number) => [...Array(n).keys()];
const TONICS = range(12);

const finaleIn = (tonic: number, mode: (typeof COMPOSER_MODES)[number], seed = 5) =>
  finaleBar(
    {
      seed,
      bar: 0,
      style: INITIAL_STYLE,
      wish: { tonic, mode, melodic: null },
      offer: null,
    },
    band.initial,
  ).bar;

const pitchClasses = (notes: readonly number[]) =>
  [...new Set(notes.map((n) => n % 12))].sort((a, b) => a - b);

describe('the cadence', () => {
  it('is the dominant seventh and then the tonic, in every mode and on every tonic', () => {
    for (const mode of COMPOSER_MODES)
      for (const tonic of TONICS) {
        const [dominant, home] = cadence({ tonic, mode });
        const stack = (c: NonNullable<typeof dominant>) =>
          c.chord.helix.heights.map((h) => h - c.chord.helix.heights[0]!);
        expect(dominant!.chord.helix.heights[0]! % 12).toBe((tonic + 7) % 12);
        expect(stack(dominant!)).toEqual([0, 4, 7, 10]);
        expect(dominant!.slot.step).toBe(0);
        expect(home!.chord.helix.heights[0]! % 12).toBe(tonic);
        const minor = mode === 'aeolian' || mode === 'dorian';
        expect(stack(home!)).toEqual([0, minor ? 3 : 4, 7]);
        expect(home!.slot.step).toBe(beatStart(2));
      }
  });

  it('names the dominant seventh and the tonic in C major as G7 and C', () => {
    const [dominant, home] = cadence({ tonic: 0, mode: 'ionian' });
    expect(chordName(dominant!, { tonic: 0, mode: 'ionian' })).toBe('G7');
    expect(chordName(home!, { tonic: 0, mode: 'ionian' })).toBe('C');
  });
});

describe('the final bar', () => {
  it('is legal written and played, in every mode and on every tonic', () => {
    for (const mode of COMPOSER_MODES)
      for (const tonic of TONICS) {
        const bar = finaleIn(tonic, mode);
        for (const note of bar.written) expect(writtenProblems(note)).toEqual([]);
        for (const note of bar.dough) expect(doughProblems(note)).toEqual([]);
        expect(bar.dough).toHaveLength(bar.written.length);
      }
  });

  it('lands every pitched part on the tonic on the third beat, and the drums together', () => {
    for (const mode of COMPOSER_MODES)
      for (const tonic of TONICS) {
        const { written, plan } = finaleIn(tonic, mode);
        expect(plan.key).toEqual({ tonic, mode });
        const landing = written.filter((n) => n.step === beatStart(2));
        const of = (part: string) => landing.filter((n) => n.part === part).map((n) => n.note);
        expect(of('bass').map((n) => n % 12)).toEqual([tonic]);
        expect(of('lead').map((n) => n % 12)).toEqual([tonic]);
        expect(pitchClasses(of('pad'))).toContain(tonic);
        expect(of('drums').sort()).toEqual(
          [DRUM_NOTES.kick, DRUM_NOTES.snare, DRUM_NOTES.ride].sort(),
        );
      }
  });

  it('plays the dominant before it: the bass on its root and the pad on its tones', () => {
    for (const mode of COMPOSER_MODES)
      for (const tonic of TONICS) {
        const { written } = finaleIn(tonic, mode);
        const before = written.filter((n) => n.step === 0 && n.part !== 'drums');
        expect(before.find((n) => n.part === 'bass')!.note % 12).toBe((tonic + 7) % 12);
        const pad = pitchClasses(before.filter((n) => n.part === 'pad').map((n) => n.note));
        expect(pad).toEqual([7, 11, 2, 5].map((i) => (tonic + i) % 12).sort((a, b) => a - b));
      }
  });

  it('rings its last chord past the bar, for no longer than the ring', () => {
    for (const mode of COMPOSER_MODES) {
      const { written } = finaleIn(0, mode);
      const ends = written.filter((n) => n.part !== 'drums').map((n) => n.step + n.length);
      expect(Math.max(...ends)).toBe(BAR_STEPS + RING_STEPS);
    }
  });

  it('is the same whichever seed writes it: an ending is a cadence, not a draw', () => {
    expect(finaleIn(9, 'aeolian', 1).written).toEqual(finaleIn(9, 'aeolian', 2).written);
  });

  it('closes every preset’s style', () => {
    for (const { style, mode } of PRESETS) {
      const bar = finaleBar(
        {
          seed: 3,
          bar: 0,
          style: { ...style, entropy: 0.3 },
          wish: { tonic: 2, mode, melodic: null },
          offer: null,
        },
        band.initial,
      ).bar;
      expect(bar.chords.map((c) => c.slot.step)).toEqual([0, beatStart(2)]);
      for (const note of bar.dough) expect(doughProblems(note)).toEqual([]);
    }
  });
});

describe('the count-in', () => {
  const track = holding({ ...INITIAL_STYLE, bpm: 120 });

  it('lasts one bar at the tempo the song opens at', () => {
    expect(countInSeconds(track)).toBeCloseTo(BAR_STEPS * stepSeconds(120), 12);
    expect(countInSeconds(track)).toBeCloseTo(2, 12);
  });

  it('clicks on each of the bar’s beats, the first the downbeat, and ends a beat before the song', () => {
    const clicks = countIn(track, 10);
    expect(clicks.map((c) => c.beat)).toEqual([0, 1, 2, 3]);
    expect(clicks.map((c) => c.weight)).toEqual(['downbeat', 'pulse', 'pulse', 'pulse']);
    expect(clicks.map((c) => c.seconds)).toEqual([8, 8.5, 9, 9.5]);
  });

  it('takes the tempo the song opens at, not where it glides to', () => {
    const gliding = glideTo(holding({ ...INITIAL_STYLE, bpm: 100 }), { bpm: 160 }, 0, 32);
    expect(countInSeconds(gliding)).toBeCloseTo(BAR_STEPS * stepSeconds(100), 12);
  });
});

describe('the ending on other meters (#260)', () => {
  const named = Object.entries(METERS);
  const cadenceEnv = (meter: (typeof named)[number][1]) =>
    ({
      seed: 5,
      bar: 0,
      meter,
      plan: { key: INITIAL_KEY },
      chords: cadence(INITIAL_KEY),
    }) as unknown as BarEnv;
  const from = { bass: 40, comp: null, lead: { last: 69 } } as never;

  it('writes every note inside the bar and its ring, well formed, landing once on a step of the bar (finite: every meter)', () => {
    for (const [name, meter] of named) {
      const steps = stepsOf(meter);
      const notes = finale(cadenceEnv(meter), from);
      expect([name, writtenProblems({ ...notes[0]! }, steps + RING_STEPS)]).toEqual([name, []]);
      for (const note of notes) {
        expect([name, note.step >= 0 && note.step < steps]).toEqual([name, true]);
        expect([name, note.step + note.length <= steps + RING_STEPS]).toEqual([name, true]);
      }
      const landing = notes.filter((n) => n.part === 'bass').at(-1)!.step;
      expect([name, landing > 0 && landing < steps && landing % 2 === 0]).toEqual([name, true]);
      const seen = new Set(
        notes.filter((n) => n.part === 'drums').map((n) => `${n.step}/${n.note}`),
      );
      expect([name, seen.size]).toEqual([name, notes.filter((n) => n.part === 'drums').length]);
    }
  });

  it('counts a bar in with one click to each pulse of the meter, the first the downbeat (finite: every meter)', () => {
    const track = holding({ ...INITIAL_STYLE, bpm: 120 });
    for (const [name, meter] of named) {
      const clicks = countIn(track, 10, meter);
      expect([name, clicks.length]).toEqual([name, meterPulses(meter)]);
      expect([name, clicks[0]!.weight]).toEqual([name, 'downbeat']);
      expect([name, countInSeconds(track, meter)]).toEqual([
        name,
        expect.closeTo(stepsOf(meter) * stepSeconds(120), 12),
      ]);
    }
  });
});

const meterPulses = (meter: (typeof METERS)[keyof typeof METERS]) => meter.heights.length;
