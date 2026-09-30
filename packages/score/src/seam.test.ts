/**
 * The seam against the port (#63 step 2a): every bar the band writes, over
 * every preset held, the tour and the app's glides, stated as score text and
 * read back. The engine is a dev dependency here only; the text step that
 * reads it into the band is #63 step 5.
 */

import {
  BAR_STEPS,
  BASS_RANGE,
  COMP_RANGE as ENGINE_COMP_RANGE,
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
  voicing,
} from '@jambot/engine';
import {
  type Chord,
  chordScale,
  compose,
  joinChord,
  parseNumeral,
  positions,
  wrap,
} from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  BASS_FOLD,
  BASS_INITIAL,
  BASS_TOP,
  COMP_RANGE,
  type CompNotes,
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
  compVoicing,
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

/** A bar the band played: the environment it was played in, the state before it, the bar, and the key of the bar after it. */
interface Played {
  readonly env: BandEnv;
  readonly before: BandCarried;
  readonly bar: BandBar;
  readonly nextKey: Key;
}

/** Every bar of every run, for five seeds: each run plays one bar more, for the key the last one leads into. */
const PLAYED: Played[] = range(5).flatMap((seed) =>
  RUNS.flatMap((at) => {
    let carried: BandCarried = band.initial;
    const played = range(BARS + 1).map((bar) => {
      const { style, mode } = at(Math.min(bar, BARS - 1));
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
    return played
      .slice(0, BARS)
      .map((one, i): Played => ({ ...one, nextKey: played[i + 1]!.bar.plan.key }));
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

/** The notes a part wrote at each of its steps, low to high, in order of step. */
const statedHits = (bar: BandBar, part: 'pad' | 'stab'): CompNotes[] => {
  const byStep = new Map<number, number[]>();
  for (const note of bar.written)
    if (note.part === part) byStep.set(note.step, [...(byStep.get(note.step) ?? []), note.note]);
  return [...byStep].map(([step, notes]) => ({ step, notes: notes.sort((a, b) => a - b) }));
};

/**
 * The comp a bar played, as the score states it: its pad and stab, the
 * voicing it read from before (none at the song's start, and none where it
 * wrote neither line), and the next bar's chord where a stab played it: a
 * stab whose notes are not the voicing of the chord in force.
 */
const statedComp = (played: Played): Partial<ScoreBar> => {
  const { bar, before, nextKey } = played;
  const pad = statedHits(bar, 'pad');
  const stab = statedHits(bar, 'stab');
  if (pad.length === 0 && stab.length === 0) return {};
  let previous = before.parts.comp;
  const voiced = bar.chords.map((chord) => (previous = voicing(chord.chord, previous)));
  const leads = stab.some(
    (hit) =>
      hit.notes.join() !==
      voiced[bar.chords.findLastIndex((chord) => chord.slot.step <= hit.step)]!.join(),
  );
  const coming = bar.next[0];
  return {
    ...(before.parts.comp ? { voicing: before.parts.comp } : {}),
    ...(pad.length ? { pad } : {}),
    ...(stab.length ? { stab } : {}),
    ...(leads && coming
      ? { next: { key: nextKey, numeral: parseNumeral(chordNumeral(coming, nextKey))! } }
      : {}),
  };
};

/** What a bar the band wrote states: its header, its style, its chords as numerals, its drums, its bass and its comp. */
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
  ...statedComp(played),
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
    expect(BASS_INITIAL).toBe(bass.initial);
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
  it("takes the engine's voicing: its range, and every chord the band plays led from the voicing before it and from none (S2)", () => {
    expect(COMP_RANGE).toEqual(ENGINE_COMP_RANGE);
    let compared = 0;
    for (const { bar, before } of PLAYED) {
      let previous = before.parts.comp;
      for (const chord of bar.chords) {
        expect(compVoicing(chord.chord, previous)).toEqual(voicing(chord.chord, previous));
        expect(compVoicing(chord.chord, null)).toEqual(voicing(chord.chord, null));
        previous = voicing(chord.chord, previous);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(3000);
  });

  it('voices every chord the composer can write as the engine does: every triad, seventh and ninth on every degree of every mode, from no voicing and from each chord’s voicing, in every key (S2)', () => {
    // The engine's own finite test of its voicing, as a pin on the score's copy:
    // the band plays only some of these chords, and a copy that agreed on them
    // alone would drift where the band has not been.
    const chordOf = (heights: readonly number[], tensions: readonly number[] = []): Chord => ({
      helix: { cycle: 12, heights },
      tensions,
    });
    const chordsIn = (tonic: number): Chord[] =>
      COMPOSER_MODES.flatMap((mode) =>
        range(7).flatMap((d) => {
          const scale = keyHelix({ tonic, mode });
          const triad = compose({ cycle: 7, heights: [d, d + 2, d + 4] }, scale).heights;
          const seventh = compose({ cycle: 7, heights: [d, d + 2, d + 4, d + 6] }, scale).heights;
          return [chordOf(triad), chordOf(seventh), chordOf(seventh, [seventh[0]! + 14])];
        }),
      );
    const home = chordsIn(0);
    const previous = [null, ...home.map((chord) => voicing(chord, null))];
    let compared = 0;
    // Every pair of the 84 chords of one key, and each chord of every key from each of their voicings.
    for (const tonic of range(12))
      for (const to of tonic === 0 ? home : chordsIn(tonic))
        for (const from of previous) {
          expect(compVoicing(to, from)).toEqual(voicing(to, from));
          compared++;
        }
    expect(compared).toBe(12 * 84 * 85);
  });

  it('states the pad on the chords it sounds and the stab on its steps, each played as it was written, and holds a pad to the next chord and a stab one step (U6)', () => {
    let pads = 0;
    let stabs = 0;
    for (const played of PLAYED) {
      const score = compileBar(encodeBar(stated(played)));
      const { bar } = played;
      for (const [part, hits] of [
        ['pad', score.pad ?? []],
        ['stab', score.stab ?? []],
      ] as const) {
        const written = bar.written.filter((note) => note.part === part);
        expect(hits.flatMap((hit) => hit.notes.map((note) => `${hit.step}:${note}`))).toEqual(
          written.map((note) => `${note.step}:${note.note}`),
        );
        for (const note of written) {
          const end =
            part === 'stab'
              ? note.step + 1
              : (bar.chords.find((chord) => chord.slot.step > note.step)?.slot.step ?? BAR_STEPS);
          expect(note.length).toBe(end - note.step);
        }
        if (part === 'pad') pads += hits.length;
        else stabs += hits.length;
      }
    }
    expect(pads).toBeGreaterThan(1900);
    expect(stabs).toBeGreaterThan(1000);
  });

  it('states the next chord exactly where a stab leads into it, in the next bar’s own key: in the bar’s key it is another chord over a key change (T5, U6)', () => {
    let leads = 0;
    let keyChanges = 0;
    let wrongInThisKey = 0;
    for (const played of PLAYED) {
      const score = stated(played);
      if (!score.next) continue;
      leads++;
      const text = encodeBar(score);
      expect(compileBar(text).next).toEqual(score.next);
      const changed =
        score.next.key.tonic !== score.key.tonic || score.next.key.mode !== score.key.mode;
      expect(text.includes(' key=', text.indexOf('\nnext '))).toBe(changed);
      if (!changed) continue;
      keyChanges++;
      const coming = played.bar.next[0]!.chord;
      const inThisKey = lowerNumeral(
        score.key,
        parseNumeral(chordNumeral(played.bar.next[0]!, played.bar.plan.key))!,
      );
      if (JSON.stringify(inThisKey) !== JSON.stringify(coming)) wrongInThisKey++;
    }
    expect(leads).toBeGreaterThan(100);
    // Both paths are walked, and stating the numeral in this bar's key would be wrong for some.
    expect(keyChanges).toBeGreaterThan(0);
    expect(wrongInThisKey).toBeGreaterThan(0);
  });

  it('plays the same comp cold as warm from the text alone: 80 resumptions, each given its frame, play every note; without it, other inversions of the same chords (S2)', () => {
    let resumptions = 0;
    let lostTheVoicing = 0;
    for (const [i, played] of PLAYED.entries()) {
      if (i % 40 !== 7) continue;
      resumptions++;
      const heard = (from: BandCarried) =>
        band
          .advance(played.env, from, null)
          .output.written.filter((note) => note.part === 'pad' || note.part === 'stab')
          .map((note) => ({ part: note.part, step: note.step, note: note.note }));
      const warm = heard(played.before);
      const score = compileBar(encodeBar(stated(played)));
      const withVoicing = (comp: readonly number[] | null): BandCarried => ({
        ...played.before,
        parts: { ...played.before.parts, comp },
      });
      expect(heard(withVoicing(score.voicing ?? null))).toEqual(warm);
      expect(
        [
          ...(score.pad ?? []).map((h) => ['pad', h] as const),
          ...(score.stab ?? []).map((h) => ['stab', h] as const),
        ]
          .flatMap(([part, hit]) => hit.notes.map((note) => ({ part, step: hit.step, note })))
          .sort((a, b) => (a.part < b.part ? 1 : a.part > b.part ? -1 : 0)),
      ).toEqual([...warm].sort((a, b) => (a.part < b.part ? 1 : a.part > b.part ? -1 : 0)));
      const cold = heard(withVoicing(null));
      const classes = (notes: typeof warm) =>
        notes.map((n) => `${n.part}:${n.step}:${wrap(n.note, 12)}`).sort();
      expect(classes(cold)).toHaveLength(classes(warm).length);
      if (JSON.stringify(cold) !== JSON.stringify(warm)) lostTheVoicing++;
    }
    expect(resumptions).toBeGreaterThan(70);
    // A resume without the frame leads from nothing, which is what the frame is for.
    expect(lostTheVoicing).toBeGreaterThan(0);
  });
});
