import { chordScale, heightOf, joinChord, positions, wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BarChord, type ChordEnv, barChords, chordAt, chordName } from './chords.ts';
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
});
