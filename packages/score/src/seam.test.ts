/**
 * The seam against the port (#63 step 2a): every bar the band writes, over
 * every preset held, the tour and the app's glides, stated as score text and
 * read back. The engine is a dev dependency here only; the text step that
 * reads it into the band is #63 step 5.
 */

import {
  BAR_STEPS,
  BASS_RANGE,
  type BandBar,
  type BandCarried,
  type BandEnv,
  COMPOSER_MODES,
  DRUM_NOTES,
  INITIAL_STYLE,
  type Key,
  PRESETS,
  PRESET_GLIDE,
  SECTION_BARS,
  SONG_METER,
  STYLE_DECIMALS as ENGINE_STYLE_DECIMALS,
  AXIS_NAMES,
  type Style,
  band,
  barEnergy,
  bass,
  chordNumeral,
  glideTo,
  holding,
  keyHelix,
  nearest,
  styleAt,
} from '@jambot/engine';
import { chordScale, joinChord, parseNumeral, positions, wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  BASS_FOLD,
  BASS_TOP,
  DRUM_SOUNDS,
  type BassLine,
  type BassNote,
  type DrumLines,
  type DrumSound,
  type ScoreBar,
  STYLE_AXES,
  STYLE_DECIMALS,
  UNSTATED_METER,
  bassNearest,
  compileBar,
  encodeBar,
  lowerNumeral,
} from './score.ts';

/** The note each drum line's own sound plays, the reverse of the engine's `DRUM_NOTES`. */
const SOUND_OF_NOTE = new Map<number, DrumSound>(
  DRUM_SOUNDS.map((sound) => [DRUM_NOTES[sound], sound]),
);

/** A bar's drum hits, as the lines that carry a sound with no open role (E16): the snare's is still open, so its hits are left out. */
function statedDrums(bar: BandBar): DrumLines {
  const bySound = new Map<DrumSound, number[]>();
  for (const note of bar.written) {
    if (note.part !== 'drums') continue;
    const sound = SOUND_OF_NOTE.get(note.note);
    if (!sound) continue;
    if (!bySound.has(sound)) bySound.set(sound, []);
    bySound.get(sound)!.push(note.step);
  }
  return Object.fromEntries(bySound);
}

const range = (n: number) => [...Array(n).keys()];
const BARS = 64;

/**
 * Each run's style and wish at a bar: a preset held, the tour, or the tour
 * glided as the app glides, wishing through every mode the composer knows.
 */
const glided: Style[] = (() => {
  let track = holding(INITIAL_STYLE);
  return range(BARS).map((bar) => {
    if (bar % 8 === 0 && bar > 0)
      track = glideTo(
        track,
        { ...PRESETS[(bar / 8) % PRESETS.length]!.style },
        bar * 16,
        PRESET_GLIDE,
      );
    return { ...styleAt(track, bar * 16), entropy: (bar % 32) / 32 };
  });
})();
const touring = (bar: number) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
const RUNS: ((bar: number) => { style: Style; mode: Key['mode'] })[] = [
  ...PRESETS.map((preset) => (bar: number) => ({
    style: { ...preset.style, entropy: (bar % 32) / 32 },
    mode: preset.mode,
  })),
  (bar) => ({
    style: { ...touring(bar).style, entropy: (bar % 32) / 32 },
    mode: touring(bar).mode,
  }),
  (bar) => ({ style: glided[bar]!, mode: COMPOSER_MODES[Math.floor(bar / 8) % 4]! }),
];

/** A bar the band played: the environment it was played in, the state before it, and the bar. */
interface Played {
  readonly env: BandEnv;
  readonly before: BandCarried;
  readonly bar: BandBar;
}

/** Every bar of every run, for five seeds. */
const PLAYED: Played[] = range(5).flatMap((seed) =>
  RUNS.flatMap((at) => {
    let carried: BandCarried = band.initial;
    return range(BARS).map((bar): Played => {
      const { style, mode } = at(bar);
      const env: BandEnv = {
        seed,
        bar,
        style,
        wish: { tonic: null, mode, melodic: null },
        offer: null,
      };
      const before = carried;
      const next = band.advance(env, before, null);
      carried = next.carried;
      return { env, before, bar: next.output };
    });
  }),
);
const BAND_BARS: BandBar[] = PLAYED.map((played) => played.bar);

/** The bass a bar played, as the score states it: its notes, and the register it read from before. */
const statedBass = ({ bar, before }: Played): BassLine => ({
  register: before.parts.bass,
  notes: bar.written
    .filter((note) => note.part === 'bass')
    .map((note): BassNote => ({ step: note.step, note: note.note })),
});

/** What a bar the band wrote states: its header, its style, its chords as numerals, its drums and its bass. */
const stated = (played: Played): ScoreBar => ({
  bar: played.bar.bar,
  section: played.bar.plan.section.type,
  key: played.bar.plan.key,
  theme: played.bar.plan.theme.kind,
  style: played.bar.style,
  harm: played.bar.chords.map((chord) => ({
    step: chord.slot.step,
    numeral: parseNumeral(chordNumeral(chord, played.bar.plan.key))!,
  })),
  drums: statedDrums(played.bar),
  bass: statedBass(played),
});

describe('the seam, over the bars the band writes', () => {
  it("reads the band's own style axes, in order, on the band's grid (C7)", () => {
    expect([...STYLE_AXES]).toEqual(AXIS_NAMES);
    expect(STYLE_DECIMALS).toBe(ENGINE_STYLE_DECIMALS);
  });

  it("reads a header that states no meter in the song's meter (T10)", () => {
    expect(UNSTATED_METER).toEqual(SONG_METER);
  });

  it('has bars to read: every preset, the tour and the glides, five seeds', () => {
    expect(BAND_BARS).toHaveLength(5 * (PRESETS.length + 2) * BARS);
    expect(new Set(BAND_BARS.map((b) => b.plan.section.type)).size).toBeGreaterThan(4);
    expect(new Set(BAND_BARS.map((b) => b.plan.key.mode)).size).toBe(4);
    expect(BAND_BARS.some((b) => b.chords.some((c) => 'dominantOf' in c.slot))).toBe(true);
    expect(BAND_BARS.some((b) => b.chords.some((c) => c.raised))).toBe(true);
    expect(BAND_BARS.some((b) => b.chords.some((c) => c.chord.tensions.length))).toBe(true);
  });

  it('reads back every bar as it was written: compileBar ∘ encodeBar = id (Q1a, A1)', () => {
    for (const played of PLAYED) {
      const score = stated(played);
      const text = encodeBar(score);
      expect(compileBar(text)).toEqual(score);
      expect(encodeBar(compileBar(text))).toBe(text);
    }
  });

  it("writes every chord the band plays as a numeral that means it, in the key's register (U1)", () => {
    for (const played of PLAYED)
      for (const [i, { numeral }] of stated(played).harm.entries())
        expect(lowerNumeral(played.bar.plan.key, numeral)).toEqual(played.bar.chords[i]!.chord);
  });

  it('writes no scale=: every chord the band plays implies one (U3)', () => {
    const chords = BAND_BARS.flatMap((bar) =>
      bar.chords.map((c) => chordScale(keyHelix(bar.plan.key), joinChord(c.chord))),
    );
    expect(chords.length).toBeGreaterThan(3000);
    expect(chords.filter((scale) => scale === undefined)).toEqual([]);
  });

  it("states everything the bar's plan and chords hold that its parts read, but for the theme's own (T5)", () => {
    const key = (k: Key) => keyHelix(k);
    for (const played of PLAYED) {
      const { bar } = played;
      const score = compileBar(encodeBar(stated(played)));
      const barInSection = score.bar % SECTION_BARS;
      expect(barInSection).toBe(bar.barInSection);
      expect(bar.plan.section.index).toBe(Math.floor(score.bar / SECTION_BARS));
      expect(barEnergy(score.style.energy, bar.plan.section.type, barInSection)).toBe(
        bar.barEnergy,
      );
      expect(Object.keys(score.style)).toEqual([...STYLE_AXES]);
      for (const [i, { step, numeral }] of score.harm.entries()) {
        const chord = bar.chords[i]!;
        expect(chord.slot).toEqual(
          numeral.of ? { step, dominantOf: numeral.of.degree } : { step, degree: numeral.degree },
        );
        // Raised: the one chord of a degree with a tone off the key.
        const inKey = positions(key(bar.plan.key));
        const off = joinChord(chord.chord).some((h) => !inKey.includes(wrap(h, 12)));
        expect(chord.raised).toBe(!numeral.of && off);
      }
    }
  });
  it("takes the engine's register and folds: the bass's range, and the octave nearest a note, for every pitch class on every register (U6)", () => {
    expect(BASS_FOLD[0]).toBe(BASS_RANGE[0]);
    expect(BASS_TOP).toBe(BASS_RANGE[1]);
    for (let last = BASS_FOLD[0]; last <= BASS_FOLD[1]; last++)
      for (let pitchClass = 0; pitchClass < 12; pitchClass++)
        expect(bassNearest(pitchClass, last)).toBe(nearest(pitchClass, last));
  });

  it('gives every note the bass plays a token: a pitch above its chord’s root, and a ^ where it jumps an octave (U6)', () => {
    let notes = 0;
    let jumps = 0;
    let offEighths = 0;
    for (const played of PLAYED) {
      const text = encodeBar(stated(played));
      const line = text.split('\n').find((l) => l.startsWith('bass '))!;
      const pairs = line.slice('bass '.length).split(' ');
      expect(pairs).toHaveLength(statedBass(played).notes.length);
      notes += pairs.length;
      jumps += pairs.filter((pair) => pair.endsWith('^')).length;
      offEighths += pairs.filter((pair) => Number(pair.split('=')[0]) % 2 === 1).length;
    }
    expect(notes).toBeGreaterThan(9000);
    // Both paths are walked: the jumps, and the steps between the eighths that a # once was for.
    expect(jumps).toBeGreaterThan(0);
    expect(offEighths).toBeGreaterThan(0);
  });

  it('holds every bass note to the next onset and the last to the bar’s end, as the band writes it: a note has no length to state (U6)', () => {
    for (const { bar } of PLAYED) {
      const notes = bar.written.filter((note) => note.part === 'bass');
      for (const [i, note] of notes.entries())
        expect(note.length).toBe((notes[i + 1]?.step ?? BAR_STEPS) - note.step);
    }
  });

  it('plays the same bass cold as warm from the text alone: 80 resumptions, each given its frame, play every note; without it, another register (S2)', () => {
    let resumptions = 0;
    let lostTheRegister = 0;
    for (const [i, played] of PLAYED.entries()) {
      if (i % 40 !== 0) continue;
      resumptions++;
      const heard = (from: BandCarried) =>
        band
          .advance(played.env, from, null)
          .output.written.filter((note) => note.part === 'bass')
          .map((note) => ({ step: note.step, note: note.note }));
      const warm = statedBass(played).notes;
      const compiled = compileBar(encodeBar(stated(played))).bass!;
      const withRegister = (register: number): BandCarried => ({
        ...played.before,
        parts: { ...played.before.parts, bass: register },
      });
      expect(heard(withRegister(compiled.register))).toEqual(warm);
      expect(compiled.notes).toEqual(warm);
      const cold = heard(withRegister(bass.initial));
      expect(cold.map((n) => ({ step: n.step, pc: wrap(n.note, 12) }))).toEqual(
        warm.map((n) => ({ step: n.step, pc: wrap(n.note, 12) })),
      );
      if (JSON.stringify(cold) !== JSON.stringify(warm)) lostTheRegister++;
    }
    expect(resumptions).toBe(80);
    // A resume without the frame changes the register, which is what the frame is for.
    expect(lostTheRegister).toBeGreaterThan(0);
  });
});
