import { describe, expect, it } from 'vitest';
import { band, finaleBar } from './band.ts';
import { chordName } from './chords.ts';
import { DRUM_NOTES } from './drums.ts';
import { RING_STEPS, cadence, countIn, countInSeconds, finale } from './ending.ts';
import { METERS, stepsOf } from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { BAR_STEPS, beatStart, doughProblems, writtenProblems } from './events.ts';
import { COMPOSER_MODES, INITIAL_KEY } from './key.ts';
import { INITIAL_STYLE, PRESETS, type Style, glideTo, holding } from './style.ts';
import { endingRead, sectionEnding } from './endings.ts';
import { stylePoint } from './meter-query.ts';
import { stepSeconds } from './tempo.ts';
import { presetMode } from './mode-repository.ts';
import { METER_REPOSITORY } from './repository.ts';

const range = (n: number) => [...Array(n).keys()];
const TONICS = range(12);

/**
 * A style where cells finds no ending (#646): every axis at 1, a corner of the style space no ending lies within the miss
 * distance of, so the band plays its own finale there.
 */
const MISSED: Style = { ...INITIAL_STYLE, sync: 1, harm: 1, artic: 1, mood: 1 };

const finaleIn = (
  tonic: number,
  mode: (typeof COMPOSER_MODES)[number],
  seed = 5,
  style: Style = MISSED,
) =>
  finaleBar(
    {
      seed,
      bar: 0,
      style,
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
        // (the key's own tonic triad: minor in aeolian, dorian and phrygian, diminished in locrian, #516)
        const TONIC_TRIAD = {
          aeolian: 'm',
          dorian: 'm',
          phrygian: 'm',
          locrian: 'dim',
          ionian: 'M',
          lydian: 'M',
          mixolydian: 'M',
        };
        expect(stack(home!)).toEqual(
          { m: [0, 3, 7], dim: [0, 3, 6], M: [0, 4, 7] }[TONIC_TRIAD[mode]],
        );
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
  it('is the band’s own where cells finds no ending', () => {
    for (const mode of COMPOSER_MODES) {
      expect(sectionEnding(stylePoint(MISSED), mode, METERS['4/4'], 0), mode).toBeUndefined();
      expect(finaleIn(0, mode).plan.endingFragment, mode).toBeUndefined();
    }
    // (and found where it lies within reach: Jambot's own finale, as cells writes it, at the first preset's point)
    expect(finaleIn(0, 'aeolian', 5, INITIAL_STYLE).plan.endingFragment).toBe('finale');
  });

  it('is legal written and played, in every mode and on every tonic, the band’s own and the one found', () => {
    for (const style of [MISSED, INITIAL_STYLE])
      for (const mode of COMPOSER_MODES)
        for (const tonic of TONICS) {
          const bar = finaleIn(tonic, mode, 5, style);
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

  /** A preset's final bar, seed 3, on D. */
  const closing = (preset: (typeof PRESETS)[number]) =>
    finaleBar(
      {
        seed: 3,
        bar: 0,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: 2, mode: presetMode(preset)!, melodic: null },
        offer: null,
      },
      band.initial,
    ).bar;

  it('closes every preset’s style on its tonic, with the chords of the ending found there, or the band’s own', () => {
    const found = new Set<string>();
    for (const preset of PRESETS) {
      const bar = closing(preset);
      const ending = bar.plan.endingFragment;
      const read = ending === undefined ? null : endingRead(ending, bar.plan.key.mode, bar.meter);
      found.add(ending ?? '-');
      // (a chord where the ending's notes start; the band's own, the dominant then the tonic on the third beat)
      expect(
        bar.chords.map((c) => c.slot.step),
        preset.name,
      ).toEqual(read ? [...new Set(read.cadence.map((n) => n.step))] : [0, beatStart(2)]);
      expect(bar.chords.at(-1)!.chord.helix.heights[0]! % 12, preset.name).toBe(2);
      for (const note of bar.dough) expect(doughProblems(note)).toEqual([]);
    }
    // (every preset lies within reach of one: the stop, the amen, the tierce, the blues', the drone and the finale)
    expect([...found].sort()).toEqual(
      ['blues_ending', 'drone_out', 'finale', 'picardy', 'plagal', 'stop'].sort(),
    );
  });

  it('plays the ending found: at Acid the stop, everything on the one, the bass on the tonic and the pad its triad, and nothing rings past the bar', () => {
    const acid = PRESETS.find((p) => p.name === 'Acid')!;
    // (the nearest at Acid's point, as it is asked without a draw)
    expect(sectionEnding(stylePoint(acid.style), 'aeolian', METERS['4/4'], 0)).toBe('stop');
    const { plan, written, chords } = closing(acid);
    expect(plan.endingFragment).toBe('stop');
    expect(chords.map((c) => c.slot.step)).toEqual([0]);
    expect(written.length).toBeGreaterThan(0);
    for (const note of written) expect(note.step, note.part).toBe(0);
    expect(written.filter((n) => n.part === 'bass').map((n) => n.note % 12)).toEqual([2]);
    const { mode } = plan.key;
    const third = mode === 'ionian' || mode === 'lydian' || mode === 'mixolydian' ? 4 : 3;
    expect(pitchClasses(written.filter((n) => n.part === 'pad').map((n) => n.note))).toEqual(
      [2, 2 + third, 9].sort((a, b) => a - b),
    );
    expect(written.filter((n) => n.part === 'drums').map((n) => n.note)).toContain(DRUM_NOTES.kick);
    expect(Math.max(...written.map((n) => n.step + n.length))).toBeLessThan(BAR_STEPS);
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
  it('reads a found ending’s chords in the section’s meter, as its notes: the pad sounds each chord where it stands, inside the bar', () => {
    // (before, read in the meter asked for, 4/4 where none was: Spooky's 5/4 chords at steps 0 and 8, its notes at 0
    // and 10; March's 2/4 a chord at step 8, past its bar of 8)
    for (const name of ['Spooky', 'Waltz', 'March']) {
      const preset = PRESETS.find((p) => p.name === name)!;
      const { bar } = finaleBar(
        {
          seed: 3,
          bar: 0,
          style: { ...preset.style, entropy: 0.3 },
          wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
          offer: null,
          repository: METER_REPOSITORY,
        },
        band.initial,
      );
      expect(bar.plan.meter, name).not.toEqual(METERS['4/4']);
      const steps = stepsOf(bar.plan.meter);
      const padAt = new Set(bar.written.filter((n) => n.part === 'pad').map((n) => n.step));
      for (const chord of bar.chords) {
        expect(chord.slot.step, name).toBeLessThan(steps);
        expect(padAt.has(chord.slot.step), `${name} ${chord.slot.step}`).toBe(true);
      }
    }
  });

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
      // A bar of its beats at 120 counted in them (#367): 7/8's three last 1.5 s, not 3.5 quarters' 1.75.
      expect([name, countInSeconds(track, meter)]).toEqual([
        name,
        expect.closeTo((meterPulses(meter) * 60) / 120, 12),
      ]);
    }
  });
});

const meterPulses = (meter: (typeof METERS)[keyof typeof METERS]) => meter.heights.length;
