import {
  METERS,
  chordOfNumeral,
  chordScale,
  heightOf,
  joinChord,
  parseNumeral,
  positions,
  qualityOf,
  wrap,
} from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  type BarChord,
  type ChordEnv,
  barChords,
  chordAt,
  chordName,
  chordNumeral,
  chordsOn,
  slotStepOn,
} from './chords.ts';
import { COMPOSER_MODES, type Key, keyHelix, keyName } from './key.ts';
import type { Slot, Theme } from './themes.ts';

const range = (n: number) => [...Array(n).keys()];
const harms = range(21).map((i) => i / 20);

/** A theme of the given bars, the rest of its eight bars on the tonic. */
const themeOf = (key: Key, bars: Slot[][], index = 5): Theme => ({
  kind: 'A',
  index,
  mode: key.mode,
  harm: 0.5,
  vamp: null,
  bars: range(8).map((b) => bars[b] ?? [{ step: 0, degree: 0 }]),
});

const envOf = (over: Partial<ChordEnv> & Pick<ChordEnv, 'key' | 'theme'>): ChordEnv => ({
  seed: 1,
  barInSection: 0,
  harm: 0.5,
  ...over,
});

const keys: Key[] = COMPOSER_MODES.flatMap((mode) => range(12).map((tonic) => ({ tonic, mode })));

/** Every degree on bar 0 of every key, followed by every degree, at every harmony, over seeds. */
const sweep: [ChordEnv, BarChord][] = keys.flatMap((key) =>
  range(7).flatMap((degree) =>
    range(7).flatMap((next) => {
      const theme = themeOf(key, [[{ step: 0, degree }], [{ step: 0, degree: next }]]);
      return harms.flatMap((harm) =>
        range(3).map((seed) => {
          const env = envOf({ seed, key, theme, harm });
          return [env, barChords(env)[0]!] as [ChordEnv, BarChord];
        }),
      );
    }),
  ),
);

const pitchClasses = (chord: BarChord) => joinChord(chord.chord).map((x) => wrap(x, 12));
const aboveRoot = (chord: BarChord) => {
  const stack = joinChord(chord.chord);
  return stack.map((x) => x - stack[0]!);
};

describe("a bar's chords", () => {
  it('are one per slot, on its step, each a helix and its tensions (P6)', () => {
    const key: Key = { tonic: 2, mode: 'ionian' };
    const theme = themeOf(key, [
      [
        { step: 0, degree: 1 },
        { step: 8, dominantOf: 4 },
      ],
    ]);
    const chords = barChords(envOf({ key, theme }));
    expect(chords.map((c) => c.slot)).toEqual(theme.bars[0]);
    for (const { chord } of chords) {
      expect(chord.helix.cycle).toBe(12);
      expect(chord.helix.heights.at(-1)! - chord.helix.heights[0]!).toBeLessThan(12);
    }
  });

  it('stay in the key, but for a raised dominant: stacked thirds on the degree, every mode, tonic and degree', () => {
    // Gathered, not asserted one by one: the sweep is 148,176 chords.
    const wrong: string[] = [];
    for (const [env, chord] of sweep) {
      if (chord.raised) continue;
      const scale = keyHelix(env.key);
      const degree = (chord.slot as { degree: number }).degree;
      const thirds = [0, 2, 4, 6, 8].map((k) => wrap(heightOf(scale, degree + k), 12));
      const tones = pitchClasses(chord);
      if (tones.join() !== thirds.slice(0, tones.length).join())
        wrong.push(`${keyName(env.key)} ${degree}: ${tones.join()}`);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  it('are triads up to harmony 0.25, all sevenths from 0.75, and add a major ninth only above 0.75 (P6)', () => {
    const wrong: string[] = [];
    let ninths = 0;
    for (const [env, chord] of sweep) {
      const size = chord.chord.helix.heights.length;
      const { tensions } = chord.chord;
      if (env.harm <= 0.25 && size !== 3) wrong.push(`${env.harm}: ${size} tones`);
      if (env.harm >= 0.75 && size !== 4) wrong.push(`${env.harm}: ${size} tones`);
      if (tensions.length === 0) continue;
      ninths++;
      if (
        env.harm <= 0.75 ||
        size !== 4 ||
        tensions.join() !== `${chord.chord.helix.heights[0]! + 14}`
      )
        wrong.push(`${env.harm}: tensions ${tensions.join()}`);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
    expect(ninths).toBeGreaterThan(0);
  });

  it('take a seventh as often as the prototype, a smoothstep from 0.25 to 0.75, and a major ninth up to 7 times in 10', () => {
    // ii in C major, whose ninth is major, over 2,000 seeds.
    const key: Key = { tonic: 0, mode: 'ionian' };
    const theme = themeOf(key, [[{ step: 0, degree: 1 }]]);
    const at = (harm: number) =>
      range(2000).map((seed) => barChords(envOf({ seed, key, theme, harm }))[0]!.chord);
    const smooth = (u: number) => u * u * (3 - 2 * u);
    for (const harm of [0.35, 0.5, 0.65]) {
      const sevenths = at(harm).filter((chord) => chord.helix.heights.length === 4).length;
      expect(sevenths / 2000, `${harm}`).toBeCloseTo(smooth((harm - 0.25) / 0.5), 1);
    }
    for (const harm of [0.85, 1]) {
      const ninths = at(harm).filter((chord) => chord.tensions.length > 0).length;
      expect(ninths / 2000, `${harm}`).toBeCloseTo(((harm - 0.75) / 0.25) * 0.7, 1);
    }
  });

  it('only gain tones as harmony rises, one slot at a time (C4)', () => {
    for (const key of keys.filter((k) => k.tonic === 0))
      for (const degree of range(7))
        for (const seed of range(20)) {
          const theme = themeOf(key, [[{ step: 0, degree }]], seed);
          let before: BarChord | null = null;
          for (const harm of harms) {
            const now = barChords(envOf({ seed, key, theme, harm }))[0]!;
            if (before && before.raised === now.raised)
              expect(aboveRoot(now).slice(0, aboveRoot(before).length)).toEqual(aboveRoot(before));
            before = now;
          }
        }
  });

  it('raise the dominant to a dominant seventh before the tonic, in aeolian and dorian above harmony 0.4 only', () => {
    let raised = 0;
    for (const [env, chord] of sweep) {
      const degree = (chord.slot as { degree: number }).degree;
      const next = (env.theme.bars[1]![0] as { degree: number }).degree;
      const minor = env.key.mode === 'aeolian' || env.key.mode === 'dorian';
      expect(chord.raised).toBe(minor && degree === 4 && next === 0 && env.harm > 0.4);
      if (!chord.raised) continue;
      raised++;
      expect(aboveRoot(chord)).toEqual(
        chord.chord.helix.heights.length === 3 ? [0, 4, 7] : [0, 4, 7, 10],
      );
      // Its one tone outside the key is the leading tone, a semitone below the tonic.
      const inKey = new Set(positions(keyHelix(env.key)));
      expect(pitchClasses(chord).filter((x) => !inKey.has(x))).toEqual([
        wrap(env.key.tonic - 1, 12),
      ]);
    }
    expect(raised).toBeGreaterThan(0);
  });

  it('lead into a degree through its secondary dominant: a dominant seventh or ninth a fifth above it', () => {
    for (const key of keys)
      for (const target of range(7))
        for (const harm of harms) {
          const theme = themeOf(key, [[{ step: 8, dominantOf: target }]]);
          const [chord] = barChords(envOf({ key, theme, harm }));
          const targetRoot = keyHelix(key).heights[target]!;
          expect(wrap(chord!.chord.helix.heights[0]! - targetRoot, 12)).toBe(7);
          expect(aboveRoot(chord!).slice(0, 4)).toEqual([0, 4, 7, 10]);
          expect([4, 5]).toContain(aboveRoot(chord!).length);
          if (aboveRoot(chord!).length === 5) expect(harm).toBeGreaterThan(0.75);
        }
  });

  it('each imply a scale in their key, so the composer never needs to state one (P7, P9)', () => {
    const distinct = new Map<string, [Key, number[]]>();
    for (const [env, chord] of sweep) {
      const stack = joinChord(chord.chord);
      distinct.set(`${env.key.mode} ${stack.join()}`, [env.key, stack]);
    }
    for (const [label, [key, stack]] of distinct)
      expect(chordScale(keyHelix(key), stack), label).toBeDefined();
    for (const key of keys)
      for (const target of range(7)) {
        // A theme never leads into a diminished chord through its dominant.
        const triad = [0, 2, 4].map((d) => keyHelix(key).heights[(target + d) % 7]!);
        if (wrap(triad[2]! - triad[0]!, 12) === 6) continue;
        const theme = themeOf(key, [[{ step: 8, dominantOf: target }]]);
        for (const harm of [0.5, 1])
          for (const seed of range(5)) {
            const [chord] = barChords(envOf({ seed, key, theme, harm }));
            expect(
              chordScale(keyHelix(key), joinChord(chord!.chord)),
              `${key.mode} ${key.tonic} V/${target}`,
            ).toBeDefined();
          }
      }
  });

  it('are a function of their environment, and come back with their theme', () => {
    const key: Key = { tonic: 9, mode: 'aeolian' };
    const theme = themeOf(key, [[{ step: 0, degree: 3 }]]);
    const env = envOf({ key, theme, harm: 0.8 });
    expect(barChords(env)).toEqual(barChords({ ...env }));
    // The draws are keyed by the theme and the bar, not the section it returns in.
    const differ = range(40).some(
      (seed) =>
        JSON.stringify(barChords({ ...env, seed })) !==
        JSON.stringify(barChords({ ...env, seed, theme: { ...theme, index: 6 } })),
    );
    expect(differ).toBe(true);
  });

  it('each have a name, every chord the composer writes (P2)', () => {
    // The player names the chord on every step it schedules, so a chord
    // without a name would stop the band.
    const unnamed: string[] = [];
    const named = new Set<string>();
    const tryName = (chord: BarChord, key: Key) => {
      const label = `${key.mode} ${key.tonic} ${JSON.stringify(chord.slot)} ${joinChord(chord.chord).join()}`;
      if (named.has(label)) return;
      named.add(label);
      try {
        chordName(chord, key);
      } catch {
        unnamed.push(label);
      }
    };
    for (const [env, chord] of sweep) tryName(chord, env.key);
    for (const key of keys)
      for (const target of range(7))
        for (const harm of harms)
          for (const seed of range(3)) {
            const theme = themeOf(key, [[{ step: 8, dominantOf: target }]]);
            tryName(barChords(envOf({ seed, key, theme, harm }))[0]!, key);
          }
    expect(unnamed).toEqual([]);
    expect(named.size).toBeGreaterThan(1000);
  });

  it('are named as lead sheets name them, spelled in their key (P2)', () => {
    const aMinor: Key = { tonic: 9, mode: 'aeolian' };
    const name = (slot: Slot, harm: number, key = aMinor, next: Slot = { step: 0, degree: 0 }) =>
      chordName(barChords(envOf({ key, harm, theme: themeOf(key, [[slot], [next]]) }))[0]!, key);
    expect(name({ step: 0, degree: 0 }, 0)).toBe('Am');
    expect(name({ step: 0, degree: 4 }, 0.2)).toBe('Em');
    expect(name({ step: 0, degree: 4 }, 0.8)).toBe('E7');
    expect(name({ step: 0, degree: 5 }, 0.8, aMinor, { step: 0, degree: 3 })).toMatch(
      /^Fmaj(7|9)$/,
    );
    expect(name({ step: 8, dominantOf: 3 }, 0.5)).toMatch(/^A(7|9)$/);
    const eFlat: Key = { tonic: 3, mode: 'ionian' };
    expect(name({ step: 0, degree: 3 }, 0, eFlat)).toBe('Ab');
    expect(name({ step: 0, degree: 6 }, 0, eFlat)).toBe('Ddim');
  });

  it('each have a Roman numeral that reads back as the chord, a secondary dominant with its target', () => {
    const secondaries = keys.flatMap((key) =>
      range(7).flatMap((target) =>
        [0.3, 0.8, 1].flatMap((harm) =>
          range(3).map((seed) => {
            const theme = themeOf(key, [[{ step: 8, dominantOf: target }]]);
            const env = envOf({ seed, key, theme, harm });
            return [env, barChords(env)[0]!] as [ChordEnv, BarChord];
          }),
        ),
      ),
    );
    const written = new Set<string>();
    // Tallied, not asserted one by one: expect() costs more than the check, tens of thousands of times over.
    const wrong: string[] = [];
    for (const [{ key }, chord] of [...sweep, ...secondaries]) {
      const text = chordNumeral(chord, key);
      const numeral = parseNumeral(text);
      if (!numeral) {
        wrong.push(`${text}: not a numeral`);
        continue;
      }
      if ((numeral.of !== undefined) !== 'dominantOf' in chord.slot)
        wrong.push(`${text}: secondary dominant mismatch`);
      const stack = joinChord(chord.chord);
      const back = chordOfNumeral(keyHelix(key), numeral);
      if (
        back.root !== wrap(stack[0]!, 12) ||
        back.quality !== qualityOf(stack.map((x) => x - stack[0]!))
      )
        wrong.push(`${text}: reads back as ${JSON.stringify(back)}`);
      written.add(text);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
    expect(written.size).toBeGreaterThan(40);
  });

  it('are written as numerals by the mode, as music21 writes them', () => {
    // music21: in A minor, V7 is E G# B D, V7/iv is A C# E G, V7/III is
    // G B D F, iiø7 is B D F A; in C major, V7/ii is A C# E G and V9/V is
    // D F# A C E.
    const numeral = (key: Key, slot: Slot, harm: number, seed = 0, next: Slot = slot) =>
      chordNumeral(
        barChords(envOf({ seed, key, harm, theme: themeOf(key, [[slot], [next]]) }))[0]!,
        key,
      );
    const aMinor: Key = { tonic: 9, mode: 'aeolian' };
    expect(numeral(aMinor, { step: 0, degree: 0 }, 0)).toBe('i');
    expect(numeral(aMinor, { step: 0, degree: 5 }, 0)).toBe('VI');
    expect(numeral(aMinor, { step: 0, degree: 4 }, 0.8, 0, { step: 0, degree: 0 })).toBe('V7');
    expect(numeral(aMinor, { step: 0, degree: 1 }, 1)).toBe('iiø7');
    expect(numeral(aMinor, { step: 8, dominantOf: 3 }, 0.5)).toBe('V7/iv');
    expect(numeral(aMinor, { step: 8, dominantOf: 2 }, 0.5)).toBe('V7/III');
    const cMajor: Key = { tonic: 0, mode: 'ionian' };
    expect(numeral(cMajor, { step: 8, dominantOf: 1 }, 0.5)).toBe('V7/ii');
    expect(numeral(cMajor, { step: 0, degree: 1 }, 1)).toMatch(/^ii(7|9)$/);
    const ninths = range(20).map((seed) => numeral(cMajor, { step: 8, dominantOf: 4 }, 1, seed));
    expect(new Set(ninths)).toEqual(new Set(['V7/V', 'V9/V']));
  });

  it('sound from their step until the next one starts', () => {
    const key: Key = { tonic: 0, mode: 'ionian' };
    const theme = themeOf(key, [
      [
        { step: 0, degree: 1 },
        { step: 8, degree: 4 },
      ],
    ]);
    const chords = barChords(envOf({ key, theme }));
    expect(range(16).map((step) => chordAt(chords, step).slot.step)).toEqual(
      range(16).map((step) => (step < 8 ? 0 : 8)),
    );
  });

  it('reads a theme’s slot steps, 0 and the bar’s half, on a meter: the same in 4/4, the meter’s half in another (finite: every meter)', () => {
    const expected: Record<string, number> = {
      '3/4': 6,
      '4/4': 8,
      '5/4': 10,
      '5/8': 4,
      '6/8': 6,
      '7/8': 6,
      '9/8': 8,
      '10/8': 10,
      '12/8': 12,
    };
    for (const [name, meter] of Object.entries(METERS)) {
      expect([name, slotStepOn(meter, 0)]).toEqual([name, 0]);
      expect([name, slotStepOn(meter, 8)]).toEqual([name, expected[name]]);
      expect(slotStepOn(meter, 8) % 2).toBe(0);
    }
  });

  it('gives a bar’s chords their slots on the meter and leaves everything else of them as it is', () => {
    const chords = [
      {
        slot: { step: 0, degree: 0 },
        raised: false,
        chord: { helix: { cycle: 12, heights: [0, 4, 7] }, tensions: [] },
      },
      {
        slot: { step: 8, degree: 4 },
        raised: false,
        chord: { helix: { cycle: 12, heights: [7, 11, 14] }, tensions: [] },
      },
    ] as const;
    expect(chordsOn(chords, METERS['4/4'])).toEqual(chords);
    const six = chordsOn(chords, METERS['6/8']);
    expect(six.map((c) => c.slot.step)).toEqual([0, 6]);
    expect(six[1]!.chord).toBe(chords[1]!.chord);
    expect(chordAt(six, 5).slot.step).toBe(0);
    expect(chordAt(six, 6).slot.step).toBe(6);
  });
});
