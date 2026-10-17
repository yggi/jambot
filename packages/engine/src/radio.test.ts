import { describe, expect, it } from 'vitest';
import { barStart } from './events.ts';
import { SECTION_BARS } from './form.ts';
import { timeConstant } from './fading.ts';
import { HISTORY_DECAY } from './history.ts';
import { type Script, lawBreaks } from './machine.ts';
import { RADIO, type RadioEnv, type RadioParams, radio, walkRadio } from './radio.ts';
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
  writtenStyle,
} from './style.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const inSpace = (axis: Axis, x: number) => (AXES[axis].space === 'log' ? Math.log(x) : x);

/** The style at the start of each of `sections` sections, the first `from`. */
function walk(from: Style, seed: number, sections: number, params: RadioParams = RADIO): Style[] {
  const styles = [from];
  for (let section = 1; section < sections; section++)
    styles.push(walkRadio(styles.at(-1)!, seed, section, params));
  return styles;
}

/** Every step of `params` times `factor`, and its tempo's lean too. */
const scaled = (factor: number, params: RadioParams = RADIO): RadioParams => ({
  step: Object.fromEntries(AXIS_NAMES.map((a) => [a, params.step[a] * factor])) as Style,
  tempoLean: params.tempoLean * factor,
});
/** The default with energy held, so the tempo's lean stays where it starts. */
const energyHeld: RadioParams = { ...RADIO, step: { ...RADIO.step, energy: 0 } };

/** How far an axis moves from one section to the next, in its space, over every walk given. */
const moves = (walks: readonly Style[][], axis: Axis) =>
  walks.flatMap((styles) =>
    styles.slice(1).map((style, i) => inSpace(axis, style[axis]) - inSpace(axis, styles[i]![axis])),
  );

const WALKING = AXIS_NAMES.filter((axis) => RADIO.step[axis] > 0);
const UNIT = WALKING.filter((axis) => AXES[axis].space === 'linear');
/** The middle of the tempo's axis, in log space: 104 bpm. */
const MID_BPM = Math.sqrt(AXES.bpm.min * AXES.bpm.max);

describe('the radio’s walk', () => {
  it('walks the same from the same seed, differently from another, and from the style alone, which is all it carries (#313)', () => {
    const one = walk(INITIAL_STYLE, 1, 64);
    expect(walk(INITIAL_STYLE, 1, 64)).toEqual(one);
    const other = walk(INITIAL_STYLE, 2, 64);
    for (const axis of WALKING)
      expect(
        other.map((s) => s[axis]),
        axis,
      ).not.toEqual(one.map((s) => s[axis]));
    const carried = JSON.parse(JSON.stringify(one[40]!)) as Style;
    expect(walkRadio(carried, 1, 41)).toEqual(one[41]);
  });

  it('holds entropy, the walk’s temperature, and by default walks every other axis (#313)', () => {
    expect(RADIO.step.entropy).toBe(0);
    expect(WALKING).toEqual(AXIS_NAMES.filter((axis) => axis !== 'entropy'));
    for (const style of walk({ ...INITIAL_STYLE, entropy: 0.7 }, 3, 500))
      expect(style.entropy).toBe(0.7);
  });

  it('holds still at an entropy of 0, but for the tempo’s lean: 0.0005 in log tempo a section up at an energy of 1, as much down at 0, none at 0.5 (#313)', () => {
    for (const [energy, lean] of [
      [1, 0.0005],
      [0, -0.0005],
      [0.5, 0],
      [0.75, 0.00025],
    ] as const) {
      const styles = walk({ ...INITIAL_STYLE, bpm: MID_BPM, energy, entropy: 0 }, 1, 40);
      for (const style of styles)
        for (const axis of UNIT) expect(style[axis], axis).toBe(styles[0]![axis]);
      for (const move of moves([styles], 'bpm')) expect(move).toBeCloseTo(lean, 6);
    }
  });

  it('leans the tempo with energy as much when the walk is hot: the mean step at entropy 1 is the lean (#313)', () => {
    for (const [energy, lean] of [
      [1, 0.0005],
      [0, -0.0005],
      [0.5, 0],
    ] as const) {
      const walks = range(400).map((seed) =>
        walk({ ...INITIAL_STYLE, bpm: MID_BPM, energy, entropy: 1 }, seed + 1, 64, energyHeld),
      );
      expect(mean(moves(walks, 'bpm')), String(energy)).toBeCloseTo(lean, 3.7);
    }
  });

  it('scales every axis’s step with entropy: its largest step at 1 is the step, at 0.25 a quarter of it, and the spread a section follows (#313)', () => {
    const at = (entropy: number) =>
      range(8).map((seed) => walk({ ...INITIAL_STYLE, entropy }, seed + 1, 2000));
    const [hot, cool] = [at(1), at(0.25)];
    for (const axis of UNIT) {
      const step = RADIO.step[axis];
      const most = Math.max(...moves(hot, axis).map(Math.abs));
      expect(most / step, axis).toBeLessThanOrEqual(1);
      expect(most / step, axis).toBeGreaterThan(0.99);
      // A uniform draw on (−1, 1) has a root mean square of 1/√3.
      const rms = (walks: Style[][]) => Math.sqrt(mean(moves(walks, axis).map((m) => m * m)));
      expect(rms(hot) / (step / Math.sqrt(3)), axis).toBeCloseTo(1, 1);
      expect(rms(cool) / rms(hot), axis).toBeCloseTo(0.25, 1);
    }
  });

  it('moves the tempo at most 1 % a section (0.01 in log tempo) at any energy and entropy, and uses that room; twice the steps would not keep to it (#313)', () => {
    const largest = (params: RadioParams) =>
      Math.max(
        ...[0, 1].flatMap((energy) =>
          range(8).flatMap((seed) =>
            moves(
              [walk({ ...INITIAL_STYLE, bpm: MID_BPM, energy, entropy: 1 }, seed + 1, 500, params)],
              'bpm',
            ).map(Math.abs),
          ),
        ),
      );
    // The tempo is quantised to 2^-16 bpm, which moves its log by under 1e-6.
    const ceiling = 0.01 + 1e-6;
    expect(largest(energyHeld)).toBeLessThanOrEqual(ceiling);
    expect(largest(energyHeld)).toBeGreaterThan(0.0098);
    expect(largest(RADIO)).toBeLessThanOrEqual(ceiling);
    expect(largest(scaled(2, energyHeld))).toBeGreaterThan(ceiling);
  });

  it('reflects at an axis’s ends: from every preset, hot and with steps four times as wide, every target lies inside its axis and none rests on an end (#313)', () => {
    for (const params of [RADIO, scaled(4)])
      for (const preset of PRESETS)
        for (const seed of [1, 2])
          for (const style of walk({ ...preset.style, entropy: 1 }, seed, 500, params).slice(1))
            for (const axis of WALKING) {
              expect(style[axis], `${preset.name} ${axis}`).toBeGreaterThan(AXES[axis].min);
              expect(style[axis], `${preset.name} ${axis}`).toBeLessThan(AXES[axis].max);
            }
  });

  it('wanders freely, pulled nowhere: hot, from Techno, each tenth of each unit axis holds about a tenth of the time after the first 1,000 sections, so it never comes home (Q11)', () => {
    const techno = { ...PRESETS.find((p) => p.name === 'Techno')!.style, entropy: 1 };
    const walks = range(32).map((seed) => walk(techno, seed + 1, 5000).slice(1000));
    for (const axis of UNIT) {
      const tenths = range(10).map(() => 0);
      for (const style of walks.flat()) tenths[Math.min(9, Math.floor(style[axis] * 10))]!++;
      const total = walks.flat().length;
      for (const [tenth, count] of tenths.entries()) {
        expect(count / total, `${axis} tenth ${tenth}`).toBeGreaterThan(0.06);
        expect(count / total, `${axis} tenth ${tenth}`).toBeLessThan(0.14);
      }
    }
  });

  it('glides no faster than a preset change between the presets farthest apart on each axis, so nothing jumps (C1), and steps twenty times as wide would (#313)', () => {
    const steps = barStart(SECTION_BARS);
    // The fastest a preset glide moves each axis: the presets farthest apart,
    // from rest; entropy, which no preset sets, across its whole axis.
    const fastest = (axis: Axis) => {
      const values = axis === 'entropy' ? [0, 1] : PRESETS.map((p) => p.style[axis]);
      const track = glideTo(
        holding({ ...INITIAL_STYLE, [axis]: Math.min(...values) }),
        { [axis]: Math.max(...values) },
        0,
        PRESET_GLIDE,
      );
      return Math.max(...range(PRESET_GLIDE).map((p) => Math.abs(rateAt(axis, track[axis], p))));
    };
    const limits = Object.fromEntries(AXIS_NAMES.map((a) => [a, fastest(a)])) as Style;
    /** The fastest each axis moves when every section's style is glided to over `PRESET_GLIDE`, hot. */
    const rates = (params: RadioParams, seed: number) => {
      const styles = walk({ ...INITIAL_STYLE, entropy: 1 }, seed, 120, params);
      let track: StyleTrack = holding(styles[0]!);
      const most = Object.fromEntries(AXIS_NAMES.map((a) => [a, 0])) as Record<Axis, number>;
      for (const [section, style] of styles.entries()) {
        track = glideTo(track, style, section * steps, PRESET_GLIDE);
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
    const wild = rates(scaled(20), 1);
    expect(WALKING.some((axis) => wild[axis] > limits[axis])).toBe(true);
  });

  it('refuses a step that is negative or not a number, and a lean that is not a number (#313)', () => {
    expect(() => walkRadio(INITIAL_STYLE, 1, 1, scaled(-1))).toThrow(/sync/);
    expect(() =>
      walkRadio(INITIAL_STYLE, 1, 1, { ...RADIO, step: { ...RADIO.step, sync: Number.NaN } }),
    ).toThrow(/sync/);
    expect(() => walkRadio(INITIAL_STYLE, 1, 1, { ...RADIO, tempoLean: Infinity })).toThrow(
      /tempoLean/,
    );
  });
  it('keeps the machine laws at the section rate, tuned in at every preset (F1)', () => {
    for (const preset of PRESETS) {
      const tunedIn = { ...preset.style, entropy: 0.6 };
      const script: Script<RadioEnv, null> = range(24).map((section) => ({
        env: { seed: 5, section, tunedIn },
        input: null,
      }));
      expect(lawBreaks(radio, script), preset.name).toEqual([]);
    }
  });

  it('is warm when resumed cold from its carried state at sections 1, 64 and 600, and within the text’s rounding, for good, from the style as the score writes it (S2)', () => {
    const run = (from: number, carried: Style | null, until: number) => {
      const out: Style[] = [];
      for (let section = from; section < until; section++) {
        const next = radio.advance({ seed: 9, section, tunedIn: INITIAL_STYLE }, carried, null);
        carried = next.carried;
        out.push(next.output);
      }
      return out;
    };
    const warm = run(0, radio.initial, 700);
    for (const k of [1, 64, 600]) {
      const carried = JSON.parse(JSON.stringify(warm[k - 1])) as Style;
      expect(run(k, carried, 700), String(k)).toEqual(warm.slice(k));
      // The score writes the style to 3 decimals (C7), as the tuning already
      // is. A walk with no pull neither forgets an offset nor grows it.
      if (k === 1) continue;
      const written = run(k, writtenStyle(warm[k - 1]!), 700);
      expect(written, String(k)).not.toEqual(warm.slice(k));
      for (const [i, style] of written.entries())
        for (const axis of UNIT)
          expect(Math.abs(style[axis] - warm[k + i]![axis])).toBeLessThanOrEqual(0.0005 + 1e-12);
    }
  });

  it('remembers itself far longer than the key’s loop: at its hottest, on its quickest axis, over ten times the key’s 6.7 bars, where a walk stepped every bar and eight times as wide would forget sooner than the key (A4)', () => {
    const keyBars = timeConstant(HISTORY_DECAY);
    /** The fewest bars any unit axis remembers itself for, by `timeConstant` of its correlation a step later. */
    const remembers = (params: RadioParams, barsAStep: number) => {
      const walks = range(16).map((seed) =>
        walk({ ...INITIAL_STYLE, entropy: 1 }, seed + 1, 4000, params),
      );
      return Math.min(
        ...UNIT.map((axis) => {
          const m = mean(walks.flat().map((s) => s[axis]));
          let together = 0;
          let alone = 0;
          for (const styles of walks)
            for (const [i, style] of styles.entries()) {
              alone += (style[axis] - m) ** 2;
              if (i > 0) together += (style[axis] - m) * (styles[i - 1]![axis] - m);
            }
          return barsAStep * timeConstant(together / alone);
        }),
      );
    };
    expect(keyBars).toBeCloseTo(6.67, 2);
    expect(remembers(RADIO, SECTION_BARS)).toBeGreaterThan(10 * keyBars);
    expect(remembers(scaled(8), 1)).toBeLessThan(keyBars);
  });
});
