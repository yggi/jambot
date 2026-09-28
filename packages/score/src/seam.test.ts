/**
 * The seam against the port (#63 step 2a): every bar the band writes, over
 * every preset held, the tour and the app's glides, stated as score text and
 * read back. The engine is a dev dependency here only; the text step that
 * reads it into the band is #63 step 5.
 */

import {
  type BandBar,
  type BandCarried,
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
  chordNumeral,
  glideTo,
  holding,
  keyHelix,
  styleAt,
} from '@jambot/engine';
import { chordScale, joinChord, parseNumeral, positions, wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  DRUM_SOUNDS,
  type DrumLines,
  type DrumSound,
  type ScoreBar,
  STYLE_AXES,
  STYLE_DECIMALS,
  UNSTATED_METER,
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

/** Every bar of every run, for five seeds. */
const BAND_BARS: BandBar[] = range(5).flatMap((seed) =>
  RUNS.flatMap((at) => {
    let carried: BandCarried = band.initial;
    return range(BARS).map((bar) => {
      const { style, mode } = at(bar);
      const next = band.advance(
        { seed, bar, style, wish: { tonic: null, mode }, offer: null },
        carried,
        null,
      );
      carried = next.carried;
      return next.output;
    });
  }),
);

/** What a bar the band wrote states: its header, its style, its chords as numerals and its drums. */
const stated = (bar: BandBar): ScoreBar => ({
  bar: bar.bar,
  section: bar.plan.section.type,
  key: bar.plan.key,
  theme: bar.plan.theme.kind,
  style: bar.style,
  harm: bar.chords.map((chord) => ({
    step: chord.slot.step,
    numeral: parseNumeral(chordNumeral(chord, bar.plan.key))!,
  })),
  drums: statedDrums(bar),
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
    for (const bar of BAND_BARS) {
      const score = stated(bar);
      const text = encodeBar(score);
      expect(compileBar(text)).toEqual(score);
      expect(encodeBar(compileBar(text))).toBe(text);
    }
  });

  it("writes every chord the band plays as a numeral that means it, in the key's register (U1)", () => {
    for (const bar of BAND_BARS)
      for (const [i, { numeral }] of stated(bar).harm.entries())
        expect(lowerNumeral(bar.plan.key, numeral)).toEqual(bar.chords[i]!.chord);
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
    for (const bar of BAND_BARS) {
      const score = compileBar(encodeBar(stated(bar)));
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
});
