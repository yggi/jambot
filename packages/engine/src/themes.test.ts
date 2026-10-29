import { describe, expect, it } from 'vitest';
import { SECTION_TYPES } from './form.ts';
import { COMPOSER_MODES, type Key } from './key.ts';
import { THEME_KINDS, type Theme, type ThemeEnv, buildTheme, themeKind } from './themes.ts';

const range = (n: number) => [...Array(n).keys()];
const harms = range(21).map((i) => i / 20);

const env = (over: Partial<ThemeEnv>): ThemeEnv => ({
  seed: 1,
  index: 3,
  kind: 'A',
  key: { tonic: 9, mode: 'aeolian' },
  harm: 0.5,
  entropy: 0.3,
  a: null,
  ...over,
});

/** Every theme the sweep builds: modes, harmony, entropy, kinds and seeds. */
const sweep: [ThemeEnv, Theme][] = COMPOSER_MODES.flatMap((mode) =>
  harms.flatMap((harm) =>
    [0, 0.5, 1].flatMap((entropy) =>
      THEME_KINDS.flatMap((kind) =>
        range(20).map((seed) => {
          const e = env({ seed, kind, harm, entropy, key: { tonic: seed % 12, mode } });
          return [e, buildTheme(e)] as [ThemeEnv, Theme];
        }),
      ),
    ),
  ),
);

const degreeOf = (bar: Theme['bars'][number]) => {
  const first = bar[0]!;
  return 'degree' in first ? first.degree : null;
};

/** The degree a bar was walked to: a ii–V bar stands for the V it lands on. */
const walkedOf = (bar: Theme['bars'][number]) => {
  const second = bar[1];
  return second && 'degree' in second ? second.degree : degreeOf(bar);
};

describe('themes', () => {
  it('are A for grooves and drops, B for contrast, and their own for a build', () => {
    expect(SECTION_TYPES.map(themeKind)).toEqual(['A', 'A', 'B', 'build', 'A', 'B']);
  });

  it('are eight bars of slots for their section, kind, mode and harmony, each bar starting on a degree, with at most one more on step 8', () => {
    // Gathered, not asserted one by one: the sweep is fifteen thousand themes.
    const wrong: string[] = [];
    for (const [e, theme] of sweep) {
      const { kind, index, mode, harm } = theme;
      if (kind !== e.kind || index !== e.index || mode !== e.key.mode || harm !== e.harm)
        wrong.push(`identity ${JSON.stringify({ kind, index, mode, harm })}`);
      if (theme.bars.length !== 8) wrong.push(`${theme.bars.length} bars`);
      for (const bar of theme.bars) {
        const steps = bar.map((slot) => slot.step);
        const degrees = bar.map((slot) => ('degree' in slot ? slot.degree : slot.dominantOf));
        if (degreeOf(bar) === null || !(steps.join() === '0' || steps.join() === '0,8'))
          wrong.push(`bar ${JSON.stringify(bar)}`);
        if (!degrees.every((d) => Number.isInteger(d) && d >= 0 && d < 7))
          wrong.push(`degrees ${JSON.stringify(bar)}`);
      }
    }
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  it('vamp below harmony 0.33 on the mode’s vamps: four bars a chord below 0.15, two above', () => {
    const VAMPS: Record<string, number[][]> = {
      aeolian: [[0], [0, 6], [0, 3], [0, 5]],
      dorian: [[0, 3], [0], [0, 6]],
      ionian: [
        [0, 3],
        [0, 4],
        [0, 5],
      ],
      mixolydian: [
        [0, 6],
        [0, 3],
      ],
      // (the generator's, #516: each mode's colour beside its tonic)
      phrygian: [[0, 1], [0], [0, 6]],
      lydian: [[0, 1], [0], [0, 4]],
      locrian: [
        [0, 1],
        [0, 6],
      ],
    };
    for (const [e, theme] of sweep.filter(([e]) => e.harm < 0.33)) {
      const chords = VAMPS[e.key.mode]![theme.vamp!]!;
      const played = theme.bars.map(degreeOf);
      const each = e.harm < 0.15 ? 4 : 2;
      expect(played.slice(0, 4)).toEqual(
        range(4).map((b) => chords[Math.floor(b / each) % chords.length]),
      );
      if (each === 2) expect(played.slice(4)).toEqual(played.slice(0, 4));
      else expect(played.slice(4)).toEqual(range(4).map(() => chords[1 % chords.length]));
      expect(theme.bars.flat().every((s) => 'degree' in s)).toBe(true);
    }
  });

  it('move a B vamp away from the A vamp in play', () => {
    let moved = 0;
    for (const mode of COMPOSER_MODES)
      for (const seed of range(40)) {
        const key: Key = { tonic: 0, mode };
        const a = buildTheme(env({ seed, key, harm: 0.2, kind: 'A' }));
        const b = buildTheme(env({ seed: seed + 1000, key, harm: 0.2, kind: 'B', a }));
        expect(b.vamp).not.toBe(a.vamp);
        if (buildTheme(env({ seed: seed + 1000, key, harm: 0.2, kind: 'B' })).vamp === a.vamp)
          moved++;
      }
    expect(moved).toBeGreaterThan(0);
  });

  it('above it, walk four bars from the tonic (A), the sixth or fourth degree (B) or the fourth (build), never repeating a bar', () => {
    for (const [e, theme] of sweep.filter(([e]) => e.harm >= 0.33)) {
      const played = theme.bars.map(walkedOf);
      const start = { A: [0], B: [5, 3], build: [3] }[e.kind];
      expect(start).toContain(played[0]);
      for (let b = 1; b < 4; b++) expect(played[b]).not.toBe(played[b - 1]);
      // The second half repeats the first, but for its last bar.
      expect(played.slice(4, 7)).toEqual(played.slice(0, 3));
    }
  });

  it('start an A theme on the tonic at every harmony, vamp or walk, so the chords come home whenever the form brings A back (Q11)', () => {
    const themes = sweep.filter(([e]) => e.kind === 'A');
    expect(themes.length).toBe(COMPOSER_MODES.length * harms.length * 3 * 20);
    for (const [, theme] of themes) expect(walkedOf(theme.bars[0]!)).toBe(0);
  });

  it('lead into a bar only through its secondary dominant, and never toward a diminished chord', () => {
    // (phrygian's, lydian's and locrian's checked with music21 10.5.0 and tonal: B D F on E phrygian's 4, F lydian's 3, B locrian's 0)
    const DIMINISHED: Record<string, number> = {
      aeolian: 1,
      dorian: 5,
      ionian: 6,
      mixolydian: 2,
      phrygian: 4,
      lydian: 3,
      locrian: 0,
    };
    let secondaries = 0;
    for (const [e, theme] of sweep) {
      theme.bars.slice(0, 4).forEach((bar, b) => {
        const slot = bar[1];
        if (!slot || !('dominantOf' in slot)) return;
        secondaries++;
        const next = b < 3 ? walkedOf(theme.bars[b + 1]!) : 0;
        expect(slot.dominantOf).toBe(next);
        expect(slot.dominantOf).not.toBe(DIMINISHED[e.key.mode]);
        expect(e.harm).toBeGreaterThan(0.7);
      });
    }
    expect(secondaries).toBeGreaterThan(0);
  });

  // (the dominant, but mixolydian's ♭VII and phrygian's and locrian's ♭II, #516)
  it('cadence into the dominant at full harmony and no entropy, or play it as a ii–V', () => {
    const CADENCE: Record<string, number> = {
      aeolian: 4,
      dorian: 4,
      ionian: 4,
      mixolydian: 6,
      phrygian: 1,
      lydian: 4,
      locrian: 1,
    };
    for (const mode of COMPOSER_MODES)
      for (const seed of range(30)) {
        const theme = buildTheme(env({ seed, key: { tonic: 0, mode }, harm: 1, entropy: 0 }));
        const dominant = CADENCE[mode]!;
        const last = theme.bars[3]!;
        const iiV = last.length === 2 && 'degree' in last[1]! && last[1].degree === 4;
        const cadence = [dominant, (dominant + 3) % 7];
        expect(iiV || cadence.includes(degreeOf(last)!)).toBe(true);
      }
  });

  it('are a function of their environment, and another seed builds another', () => {
    const e = env({ harm: 0.8 });
    expect(buildTheme({ ...e })).toEqual(buildTheme(e));
    const differ = range(20).some(
      (seed) => JSON.stringify(buildTheme({ ...e, seed })) !== JSON.stringify(buildTheme(e)),
    );
    expect(differ).toBe(true);
  });
});
