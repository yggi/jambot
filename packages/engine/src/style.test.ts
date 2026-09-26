import { describe, expect, it } from 'vitest';
import {
  AXES,
  AXIS_NAMES,
  type Axis,
  type Glide,
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  glideTo,
  holding,
  styleAt,
  valueAt,
} from './style.ts';

const range = (n: number) => [...Array(n).keys()];
/** Evenly spaced values across an axis, ends included. */
const across = (axis: Axis, n = 9) =>
  range(n).map((i) => AXES[axis].min + ((AXES[axis].max - AXES[axis].min) * i) / (n - 1));

describe('the axes', () => {
  it('have their ranges and the space they glide in', () => {
    expect(AXIS_NAMES).toEqual(['swing', 'sync', 'harm', 'artic', 'energy', 'entropy', 'bpm']);
    for (const axis of AXIS_NAMES.filter((a) => a !== 'bpm'))
      expect(AXES[axis]).toEqual({ min: 0, max: 1, space: 'linear' });
    // Tempo is heard in ratios, so it glides in log space: halfway from 60
    // to 180 bpm is 104, not 120. The prototype glides it linearly.
    expect(AXES.bpm).toEqual({ min: 60, max: 180, space: 'log' });
  });
});

describe('the presets', () => {
  it('are the prototype’s eight points in style space', () => {
    expect(PRESETS.map((p) => [p.name, p.mode, ...Object.values(p.style)])).toEqual([
      // name, mode, swing, sync, harm, artic, energy, bpm
      ['Synth-pop', 'aeolian', 0, 0.3, 0.45, 0.55, 0.55, 108],
      ['Techno', 'aeolian', 0, 0.12, 0, 1, 0.8, 130],
      ['Deep house', 'dorian', 0.3, 0.35, 0.55, 0.65, 0.65, 122],
      ['Ambient', 'ionian', 0.05, 0.05, 0.3, 0, 0.2, 72],
      ['Lo-fi hip hop', 'aeolian', 0.45, 0.5, 0.75, 0.35, 0.5, 84],
      ['Funk', 'dorian', 0.3, 1, 0.12, 0.85, 0.75, 104],
      ['Bossa nova', 'ionian', 0, 0.75, 0.85, 0.45, 0.45, 132],
      ['Swing jazz', 'ionian', 1, 0.35, 1, 0.3, 0.6, 148],
    ]);
  });

  it('span the axes they are said to reach at both ends', () => {
    // The prototype README says the presets reach every axis at both ends.
    // Of its four hand-chosen axes, that holds for swing, harmony and
    // articulation, and syncopation stops at 0.05. Energy and tempo stay
    // inside their ranges.
    const span = (axis: Exclude<Axis, 'entropy'>) => {
      const values = PRESETS.map((p) => p.style[axis]);
      return [Math.min(...values), Math.max(...values)];
    };
    expect(span('swing')).toEqual([0, 1]);
    expect(span('harm')).toEqual([0, 1]);
    expect(span('artic')).toEqual([0, 1]);
    expect(span('sync')).toEqual([0.05, 1]);
    expect(span('energy')).toEqual([0.2, 0.8]);
    expect(span('bpm')).toEqual([72, 148]);
  });

  it('glide over 8 bars, and sliders over one', () => {
    expect(PRESET_GLIDE).toBe(128);
    expect(SLIDER_GLIDE).toBe(16);
  });

  it('start from Synth-pop, with entropy at 0.3', () => {
    expect(INITIAL_STYLE).toEqual({ ...PRESETS[0]!.style, entropy: 0.3 });
  });
});

describe('valueAt', () => {
  const linear: Glide = { from: 0.2, to: 0.8, start: 32, length: 64 };
  const tempo: Glide = { from: 80, to: 160, start: 32, length: 64 };

  it('holds before the glide, reaches the target at its end, and stays there', () => {
    for (const [axis, glide] of [
      ['harm', linear],
      ['bpm', tempo],
    ] as const) {
      for (const at of [-10, 0, 31, 32]) expect(valueAt(axis, glide, at)).toBe(glide.from);
      for (const at of [96, 97, 1000]) expect(valueAt(axis, glide, at)).toBe(glide.to);
    }
  });

  it('glides monotone, on an S-curve that starts and ends slowly', () => {
    for (const [axis, glide] of [
      ['harm', linear],
      ['bpm', tempo],
    ] as const) {
      const values = range(65).map((i) => valueAt(axis, glide, 32 + i));
      values.slice(1).forEach((v, i) => expect(v).toBeGreaterThan(values[i]!));
      const first = values[1]! - values[0]!;
      const middle = values[33]! - values[32]!;
      expect(first).toBeLessThan(middle / 10);
    }
  });

  it('passes the midpoint of its space halfway: the mean, or for tempo the geometric mean', () => {
    expect(valueAt('harm', linear, 64)).toBe(0.5);
    expect(valueAt('bpm', tempo, 64)).toBeCloseTo(Math.sqrt(80 * 160), 10);
    expect(valueAt('bpm', { from: 60, to: 180, start: 0, length: 16 }, 8)).toBeCloseTo(103.923, 3);
  });

  it('never moves faster than the S-curve allows: 1.5 times the average rate', () => {
    for (const axis of AXIS_NAMES) {
      const [lo, hi] = [AXES[axis].min, AXES[axis].max];
      const glide = { from: lo, to: hi, start: 0, length: 16 };
      const space = AXES[axis].space === 'log' ? Math.log : (x: number) => x;
      const rate = (space(hi) - space(lo)) / 16;
      for (const i of range(16 * 64)) {
        const [a, b] = [valueAt(axis, glide, i / 64), valueAt(axis, glide, (i + 1) / 64)];
        expect(Math.abs(space(b) - space(a))).toBeLessThanOrEqual((1.5 * rate) / 64 + 1e-12);
      }
    }
  });
});

describe('glideTo', () => {
  it('nothing jumps: a new glide starts from where the running one is, on every axis', () => {
    for (const axis of AXIS_NAMES) {
      let track = holding(INITIAL_STYLE);
      // Retarget again and again, most of the time in the middle of a glide.
      for (const [i, target] of across(axis).entries()) {
        const at = 5 + i * 7;
        const before = styleAt(track, at);
        track = glideTo(track, { [axis]: target }, at, 12);
        expect(styleAt(track, at)).toEqual(before);
      }
    }
  });

  it('only moves the axes it is given', () => {
    const track = holding(INITIAL_STYLE);
    const moved = glideTo(track, { sync: 1 }, 0, 16);
    for (const axis of AXIS_NAMES.filter((a) => a !== 'sync'))
      expect(moved[axis]).toBe(track[axis]);
    expect(styleAt(moved, 16)).toEqual({ ...INITIAL_STYLE, sync: 1 });
  });

  it('takes a whole preset to its point in style space, and leaves entropy', () => {
    const track = glideTo(holding(INITIAL_STYLE), PRESETS[7]!.style, 0, PRESET_GLIDE);
    expect(styleAt(track, PRESET_GLIDE)).toEqual({ ...PRESETS[7]!.style, entropy: 0.3 });
  });

  it('glides entropy like any other axis', () => {
    // The prototype sets entropy at once; here it glides.
    const track = glideTo(holding(INITIAL_STYLE), { entropy: 1 }, 0, SLIDER_GLIDE);
    expect(styleAt(track, 8).entropy).toBeCloseTo(0.65, 12);
  });

  it('keeps every target, and so every glide, inside its axis', () => {
    const track = glideTo(holding(INITIAL_STYLE), { swing: 1.4, sync: -0.2, bpm: 400 }, 0, 16);
    expect(styleAt(track, 16)).toMatchObject({ swing: 1, sync: 0, bpm: 180 });
    expect(() => glideTo(track, { bpm: NaN }, 0, 16)).toThrow(/bpm: NaN is not a value/);
  });

  it('with no length, sets the value at once: for when the band is not playing', () => {
    const track = glideTo(holding(INITIAL_STYLE), { harm: 1 }, 40, 0);
    expect(styleAt(track, 39).harm).toBe(INITIAL_STYLE.harm);
    expect(styleAt(track, 40).harm).toBe(1);
    expect(() => glideTo(track, { harm: 0 }, 40, -1)).toThrow(/length -1/);
  });

  it('gives a track that survives JSON, so it can be carried', () => {
    const track = glideTo(holding(INITIAL_STYLE), PRESETS[3]!.style, 10, PRESET_GLIDE);
    expect(JSON.parse(JSON.stringify(track))).toEqual(track);
  });
});
