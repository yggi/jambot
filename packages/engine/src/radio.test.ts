import { describe, expect, it } from 'vitest';
import { barStart } from './events.ts';
import { SECTION_BARS } from './form.ts';
import { type Radio, RADIO, type RadioParams, tuneIn, walkRadio } from './radio.ts';
import {
  AXES,
  AXIS_NAMES,
  type Axis,
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  type Style,
  type StyleTrack,
  glideTo,
  holding,
  rateAt,
} from './style.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const inSpace = (axis: Axis, x: number) => (AXES[axis].space === 'log' ? Math.log(x) : x);

/** The middle of every axis: a home the walk rarely meets an end from. */
const MIDDLE: Style = Object.fromEntries(
  AXIS_NAMES.map((axis) => {
    const { min, max, space } = AXES[axis];
    return [axis, space === 'log' ? Math.sqrt(min * max) : (min + max) / 2];
  }),
) as Style;

/** The radio's state at the start of each of `sections` sections, the first tuned in at `home`. */
function walk(home: Style, seed: number, sections: number, params: RadioParams = RADIO): Radio[] {
  const radios = [tuneIn(home)];
  for (let section = 1; section < sections; section++)
    radios.push(walkRadio(radios.at(-1)!, seed, section, params));
  return radios;
}

/** Every spread times `factor`. */
const widened = (factor: number): RadioParams => ({
  ...RADIO,
  tipSpread: Object.fromEntries(AXIS_NAMES.map((a) => [a, RADIO.tipSpread[a] * factor])) as Style,
  anchorSpread: Object.fromEntries(
    AXIS_NAMES.map((a) => [a, RADIO.anchorSpread[a] * factor]),
  ) as Style,
});

/** The walks the statistics are read over: 8 seeds of 2,000 sections from the middle. */
const LONG = range(8).map((seed) => walk(MIDDLE, seed + 1, 2000));
const WALKING = AXIS_NAMES.filter((axis) => RADIO.tipSpread[axis] > 0);

/** The tip's distance from the anchor on one axis, in the axis's space, at every section of every long walk. */
const tipOff = (axis: Axis) =>
  LONG.flatMap((radios) =>
    radios.map(({ tip, anchor }) => inSpace(axis, tip[axis]) - inSpace(axis, anchor[axis])),
  );
/** How far a value moves from one section to the next, in the axis's space, over every long walk. */
const moves = (axis: Axis, of: (radio: Radio) => number) =>
  LONG.flatMap((radios) =>
    radios
      .slice(1)
      .map((radio, i) => Math.abs(inSpace(axis, of(radio)) - inSpace(axis, of(radios[i]!)))),
  );
/** The correlation of a series, read off each radio, with itself a section later, over every long walk. */
function lagOne(of: (radio: Radio) => number): number {
  const series = LONG.map((radios) => radios.map(of));
  const m = mean(series.flat());
  let together = 0;
  let alone = 0;
  for (const xs of series)
    for (let i = 0; i < xs.length; i++) {
      alone += (xs[i]! - m) ** 2;
      if (i > 0) together += (xs[i]! - m) * (xs[i - 1]! - m);
    }
  return together / alone;
}

describe('the radio’s walk', () => {
  it('tunes in with its home, its anchor and its tip at the style it is given (#313)', () => {
    expect(tuneIn(INITIAL_STYLE)).toEqual({
      home: INITIAL_STYLE,
      anchor: INITIAL_STYLE,
      tip: INITIAL_STYLE,
    });
  });

  it('walks the same from the same seed, differently from another, and alike from a carried copy of its state (#313)', () => {
    const one = walk(INITIAL_STYLE, 1, 64);
    expect(walk(INITIAL_STYLE, 1, 64)).toEqual(one);
    const other = walk(INITIAL_STYLE, 2, 64);
    for (const axis of WALKING)
      expect(
        other.map((r) => r.tip[axis]),
        axis,
      ).not.toEqual(one.map((r) => r.tip[axis]));
    const carried = JSON.parse(JSON.stringify(one[40]!)) as Radio;
    expect(walkRadio(carried, 1, 41)).toEqual(one[41]);
  });

  it('holds still on an axis whose spreads are 0, and by default entropy is one (#313)', () => {
    expect(RADIO.tipSpread.entropy).toBe(0);
    expect(RADIO.anchorSpread.entropy).toBe(0);
    for (const radios of LONG)
      for (const { tip } of radios) expect(tip.entropy).toBe(MIDDLE.entropy);
    const still = widened(0);
    for (const radio of walk(INITIAL_STYLE, 3, 100, still))
      expect(radio.tip).toEqual(INITIAL_STYLE);
  });

  it('keeps every target inside its axis, from every preset, even with spreads four times as wide (#313)', () => {
    for (const params of [RADIO, widened(4)])
      for (const preset of PRESETS)
        for (const seed of [1, 2])
          for (const { tip, anchor } of walk({ ...preset.style, entropy: 0.3 }, seed, 500, params))
            for (const axis of AXIS_NAMES)
              for (const value of [tip[axis], anchor[axis]]) {
                expect(value, `${preset.name} ${axis}`).toBeGreaterThanOrEqual(AXES[axis].min);
                expect(value, `${preset.name} ${axis}`).toBeLessThanOrEqual(AXES[axis].max);
              }
  });

  it('keeps the tip near the anchor: its mean within 0.05 spreads of it, its spread within a tenth of the one asked for, and never 5 spreads off (#313)', () => {
    // The draw is bounded at 2√3, so no walk can take the tip farther than
    // 2√3 · √(1 − decay²) / (1 − decay) spreads, 9.2 at a time of 4 sections;
    // a bell's tail reaches about 4 in 16,000 sections.
    for (const axis of WALKING) {
      const off = tipOff(axis);
      const spread = RADIO.tipSpread[axis];
      expect(Math.abs(mean(off)) / spread, axis).toBeLessThan(0.05);
      const rms = Math.sqrt(mean(off.map((d) => d * d)));
      expect(rms / spread, axis).toBeGreaterThan(0.9);
      expect(rms / spread, axis).toBeLessThan(1.1);
      expect(Math.max(...off.map(Math.abs)) / spread, axis).toBeLessThan(5);
    }
  });

  it('moves the anchor more slowly than the tip: about half as far a section, and remembering itself over 20 times as long (#313)', () => {
    for (const axis of WALKING) {
      const anchorMoves = mean(moves(axis, (r) => r.anchor[axis]));
      const tipMoves = mean(moves(axis, (r) => r.tip[axis]));
      expect(anchorMoves / tipMoves, axis).toBeLessThan(0.6);
      // A series that keeps r of itself a section later remembers for 1 / (1 − r) sections.
      const anchorTime = 1 / (1 - lagOne((r) => inSpace(axis, r.anchor[axis])));
      const tipTime =
        1 / (1 - lagOne((r) => inSpace(axis, r.tip[axis]) - inSpace(axis, r.anchor[axis])));
      expect(tipTime, axis).toBeCloseTo(RADIO.tipTime, 0);
      expect(anchorTime / tipTime, axis).toBeGreaterThan(20);
    }
  });

  it('glides no faster than a preset change between the presets farthest apart on each axis, so nothing jumps (C1), and steps ten times as wide would (#313)', () => {
    const steps = barStart(SECTION_BARS);
    // The fastest a preset glide moves each axis: the presets farthest apart,
    // from rest; entropy, which no preset sets, across its whole axis.
    const fastest = (axis: Axis) => {
      const values = axis === 'entropy' ? [0, 1] : PRESETS.map((p) => p.style[axis]);
      const from = Math.min(...values);
      const track = glideTo(
        holding({ ...INITIAL_STYLE, [axis]: from }),
        { [axis]: Math.max(...values) },
        0,
        PRESET_GLIDE,
      );
      return Math.max(...range(PRESET_GLIDE).map((p) => Math.abs(rateAt(axis, track[axis], p))));
    };
    const limits = Object.fromEntries(AXIS_NAMES.map((a) => [a, fastest(a)])) as Style;
    /** The fastest each axis moves when every section's tip is glided to over `PRESET_GLIDE`. */
    const rates = (params: RadioParams, seed: number) => {
      const radios = walk(INITIAL_STYLE, seed, 120, params);
      let track: StyleTrack = holding(INITIAL_STYLE);
      const most = Object.fromEntries(AXIS_NAMES.map((a) => [a, 0])) as Record<Axis, number>;
      for (const [section, { tip }] of radios.entries()) {
        track = glideTo(track, tip, section * steps, PRESET_GLIDE);
        for (const position of range(steps).map((p) => section * steps + p))
          for (const axis of AXIS_NAMES)
            most[axis] = Math.max(most[axis], Math.abs(rateAt(axis, track[axis], position)));
      }
      return most;
    };
    for (const seed of [1, 2, 3]) {
      const most = rates(RADIO, seed);
      for (const axis of AXIS_NAMES) expect(most[axis], axis).toBeLessThanOrEqual(limits[axis]);
    }
    const wild = rates(widened(10), 1);
    expect(WALKING.some((axis) => wild[axis] > limits[axis])).toBe(true);
  });

  it('refuses a time constant under one section and a spread that is negative or not a number (#313)', () => {
    const radio = tuneIn(INITIAL_STYLE);
    expect(() => walkRadio(radio, 1, 1, { ...RADIO, tipTime: 0.5 })).toThrow(/tipTime/);
    expect(() => walkRadio(radio, 1, 1, { ...RADIO, anchorTime: Number.NaN })).toThrow(
      /anchorTime/,
    );
    expect(() =>
      walkRadio(radio, 1, 1, { ...RADIO, tipSpread: { ...RADIO.tipSpread, sync: -0.1 } }),
    ).toThrow(/sync/);
  });
});
