import { describe, expect, it } from 'vitest';
import { type BandEnv, band } from './band.ts';
import { drums } from './drums.ts';
import { SECTION_BARS, barEnergy } from './form.ts';
import { type Script, lawBreaks } from './machine.ts';
import { INITIAL_STYLE, PRESETS, type Style } from './style.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tour: a new preset every 8 bars, with entropy rising. */
const styleAt = (bar: number): Style => ({
  ...PRESETS[Math.floor(bar / 8) % PRESETS.length]!.style,
  entropy: (bar % 32) / 32,
});
const script = (seed: number, bars = 64): Script<BandEnv, null> =>
  range(bars).map((bar) => ({ env: { seed, bar, style: styleAt(bar) }, input: null }));

const run = (seed: number, bars = 64) => {
  let carried = band.initial;
  return script(seed, bars).map(({ env, input }) => {
    const next = band.advance(env, carried, input);
    carried = next.carried;
    return next.output;
  });
};

describe('the band', () => {
  it('keeps the machine laws over a tour of the presets (F1)', () => {
    for (const seed of [1, 2, 3]) expect(lawBreaks(band, script(seed))).toEqual([]);
  });

  it('holds each section for its eight bars (C3)', () => {
    const bars = run(7);
    bars.forEach((b, bar) => {
      expect(b.bar).toBe(bar);
      expect(b.barInSection).toBe(bar % SECTION_BARS);
      expect(b.section.index).toBe(Math.floor(bar / SECTION_BARS));
      if (bar % SECTION_BARS) expect(b.section).toEqual(bars[bar - 1]!.section);
    });
    expect(bars[0]!.section.type).toBe('intro');
  });

  it('plays the drums of each bar, at the energy its section shapes', () => {
    for (const b of run(9)) {
      const style = styleAt(b.bar);
      const energy = barEnergy(style.energy, b.section.type, b.barInSection);
      expect(b.barEnergy).toBe(energy);
      expect(b.events).toEqual(
        drums({
          seed: 9,
          bar: b.bar,
          section: b.section,
          barInSection: b.barInSection,
          style,
          barEnergy: energy,
        }),
      );
    }
  });

  it('refuses to start inside a section, or to skip one', () => {
    const env = { seed: 1, bar: 3, style: INITIAL_STYLE };
    expect(() => band.advance(env, band.initial, null)).toThrow(/bar 3 is inside section 0/);
    const first = band.advance({ ...env, bar: 0 }, band.initial, null).carried;
    expect(() => band.advance({ ...env, bar: 16 }, first, null)).toThrow(
      /bar 16 starts section 2, but the band is in section 0/,
    );
    expect(() => band.advance({ ...env, bar: 9 }, first, null)).toThrow(
      /bar 9 is inside section 1, but the band is in section 0/,
    );
  });
});
