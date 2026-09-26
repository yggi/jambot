import { describe, expect, it } from 'vitest';
import {
  type Section,
  type SectionType,
  SECTION_BARS,
  SECTION_TYPES,
  barEnergy,
  followers,
  form,
} from './form.ts';
import { type Script, lawBreaks } from './machine.ts';
import { INITIAL_STYLE, PRESETS, type Style } from './style.ts';

const range = (n: number) => [...Array(n).keys()];
const grid = range(11).map((i) => i / 10);

/** A run of sections for a seed, with the style held or changing per section. */
const run = (seed: number, styleOf: (index: number) => Style, sections = 64) => {
  let carried = form.initial;
  return range(sections).map((index) => {
    const next = form.advance({ seed, index, style: styleOf(index) }, carried, null);
    carried = next.carried;
    return next.output;
  });
};

describe('the form', () => {
  it('has six kinds of section, eight bars each', () => {
    // The prototype calls the bridge "shift", which is the theory's word for a
    // transposition.
    expect(SECTION_TYPES).toEqual(['intro', 'groove', 'bridge', 'build', 'drop', 'breakdown']);
    expect(SECTION_BARS).toBe(8);
  });

  it('starts with an intro, which leads into a groove, and a build always drops', () => {
    for (const seed of range(50)) {
      // At no energy a drop weighs nothing, and a build still drops.
      const sections = run(seed, (i) => ({ ...INITIAL_STYLE, energy: i % 2 ? 0 : 1 }));
      expect(sections[0]).toEqual({ type: 'intro', index: 0 });
      expect(sections[1]!.type).toBe('groove');
      sections.forEach((s, i) => {
        expect(s.index).toBe(i);
        if (i > 0 && sections[i - 1]!.type === 'build') expect(s.type).toBe('drop');
      });
      expect(sections.slice(1).some((s) => s.type === 'intro')).toBe(false);
    }
  });

  it('only moves where the chain allows', () => {
    const allowed: Record<SectionType, SectionType[]> = {
      intro: ['groove'],
      groove: ['groove', 'bridge', 'build'],
      bridge: ['groove', 'build', 'breakdown'],
      build: ['drop'],
      drop: ['drop', 'breakdown', 'groove'],
      breakdown: ['build', 'groove'],
    };
    for (const type of SECTION_TYPES)
      for (const energy of grid)
        for (const entropy of grid)
          expect(followers(type, energy, entropy).map(([next]) => next)).toEqual(allowed[type]);
    for (const preset of PRESETS)
      for (const seed of range(20)) {
        const sections = run(seed, () => ({ ...preset.style, entropy: 0.5 }));
        sections.slice(1).forEach((s, i) => expect(allowed[sections[i]!.type]).toContain(s.type));
      }
  });

  it('weighs the next section by energy and entropy, as the prototype does', () => {
    // groove: groove 0.3(1 − entropy) + 0.05, bridge 0.35 + 0.2 entropy,
    // build 0.1 + 0.45 energy
    expect(followers('groove', 1, 0)).toEqual([
      ['groove', 0.35],
      ['bridge', 0.35],
      ['build', 0.55],
    ]);
    // drop: drop 0.3 energy, breakdown 0.35 − 0.15 energy
    expect(followers('drop', 0, 1).map(([t, w]) => [t, +w.toFixed(12)])).toEqual([
      ['drop', 0],
      ['breakdown', 0.35],
      ['groove', 0.05],
    ]);
    for (const type of SECTION_TYPES)
      for (const energy of grid)
        for (const entropy of grid) {
          const weights = followers(type, energy, entropy).map(([, w]) => w);
          expect(weights.every((w) => w >= 0)).toBe(true);
          if (weights.length > 1) expect(weights.reduce((a, b) => a + b)).toBeGreaterThan(0);
        }
  });

  it('builds more when the energy is high, and grooves more when entropy is low', () => {
    const count = (style: Style, type: SectionType) =>
      range(40)
        .flatMap((seed) => run(seed, () => style))
        .filter((s) => s.type === type).length;
    const calm = { ...INITIAL_STYLE, energy: 0.1 };
    const hot = { ...INITIAL_STYLE, energy: 0.9 };
    expect(count(hot, 'build')).toBeGreaterThan(count(calm, 'build'));
    expect(count({ ...INITIAL_STYLE, entropy: 0 }, 'groove')).toBeGreaterThan(
      count({ ...INITIAL_STYLE, entropy: 1 }, 'groove'),
    );
  });

  it('keeps the machine laws, with the style changing under it (F1, Q4a)', () => {
    const script: Script<{ seed: number; index: number; style: Style }, null> = range(24).map(
      (index) => ({
        env: { seed: 5, index, style: { ...PRESETS[index % 8]!.style, entropy: index / 24 } },
        input: null,
      }),
    );
    expect(lawBreaks(form, script)).toEqual([]);
  });

  it('is the same form for the same seed and style, and another for another seed', () => {
    const types = (seed: number) => run(seed, () => INITIAL_STYLE).map((s: Section) => s.type);
    expect(types(3)).toEqual(types(3));
    expect(types(3)).not.toEqual(types(4));
  });
});

describe('barEnergy', () => {
  it('shapes the style’s energy by the section', () => {
    const at = (type: SectionType, bar = 0) => +barEnergy(0.5, type, bar).toFixed(12);
    expect(SECTION_TYPES.map((t) => at(t))).toEqual([0.2, 0.5, 0.4, 0.35, 0.8, 0.05]);
  });

  it('ramps up through a build, from −0.15 to +0.30', () => {
    const ramp = range(SECTION_BARS).map((bar) => barEnergy(0.5, 'build', bar));
    expect(ramp[0]).toBeCloseTo(0.35, 12);
    expect(ramp[7]).toBeCloseTo(0.8, 12);
    ramp.slice(1).forEach((e, i) => expect(e).toBeGreaterThan(ramp[i]!));
  });

  it('stays between 0 and 1', () => {
    for (const type of SECTION_TYPES)
      for (const bar of range(SECTION_BARS))
        for (const energy of grid) {
          const e = barEnergy(energy, type, bar);
          expect(e).toBeGreaterThanOrEqual(0);
          expect(e).toBeLessThanOrEqual(1);
        }
    expect(barEnergy(1, 'drop', 0)).toBe(1);
    expect(barEnergy(0, 'breakdown', 0)).toBe(0);
  });
});
