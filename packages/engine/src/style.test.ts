import { describe, expect, it } from 'vitest';
import { METERS, meterOnSteps } from '@jambot/theory';
import { presetSwing } from './repository.ts';
import { leanMap, swingMapAt, swingParts } from './swing.ts';
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
  rateAt,
  styleAt,
  valueAt,
  writtenStyle,
} from './style.ts';

const range = (n: number) => [...Array(n).keys()];
/** Evenly spaced values across an axis, ends included. */
const across = (axis: Axis, n = 9) =>
  range(n).map((i) => AXES[axis].min + ((AXES[axis].max - AXES[axis].min) * i) / (n - 1));

describe('the axes', () => {
  it('have their ranges and the space they glide in (C2)', () => {
    // Swing is the meter's, not an axis (#360).
    expect(AXIS_NAMES).toEqual(['sync', 'harm', 'artic', 'energy', 'entropy', 'bpm']);
    for (const axis of AXIS_NAMES.filter((a) => a !== 'bpm'))
      expect(AXES[axis]).toEqual({ min: 0, max: 1, space: 'linear' });
    // Tempo is heard in ratios, so it glides in log space: halfway from 60
    // to 180 bpm is 104, not 120. The prototype glides it linearly.
    expect(AXES.bpm).toEqual({ min: 60, max: 180, space: 'log' });
  });
});

describe('the presets', () => {
  it('are the prototype’s eight points in style space', () => {
    expect(PRESETS.map((p) => [p.name, ...Object.values(p.style)])).toEqual([
      // name, sync, harm, artic, energy, bpm
      ['Synth-pop', 0.3, 0.45, 0.55, 0.55, 108],
      ['Techno', 0.12, 0, 1, 0.8, 130],
      ['Deep house', 0.35, 0.55, 0.65, 0.65, 122],
      ['Ambient', 0.05, 0.3, 0, 0.2, 72],
      ['Lo-fi hip hop', 0.5, 0.75, 0.35, 0.5, 84],
      ['Funk', 1, 0.12, 0.85, 0.75, 104],
      ['Bossa nova', 0.75, 0.85, 0.45, 0.45, 132],
      ['Swing jazz', 0.35, 1, 0.3, 0.6, 148],
    ]);
  });

  /** Each preset's value on the swing axis before the meter took it (#360), as a literal. */
  const AXIS_SWING: Readonly<Record<string, number>> = {
    'Synth-pop': 0,
    Techno: 0,
    'Deep house': 0.3,
    Ambient: 0.05,
    'Lo-fi hip hop': 0.45,
    Funk: 0.3,
    'Bossa nova': 0,
    'Swing jazz': 1,
  };

  it('each find a meter swinging on the level the swing axis swung, the straight ones on the 16ths (#360, #459: the shares, `repository.test.ts`)', () => {
    for (const p of PRESETS) {
      const parts = swingParts(AXIS_SWING[p.name]!);
      // On every preset only one level swung, so the level is the one that did.
      expect(Math.min(parts.eighth, parts.sixteenth)).toBe(0);
      expect(presetSwing(p)!.level).toBe(parts.eighth > 0 ? '8n' : '16n');
    }
  });

  it('keep exactly the swing they played: every onset of a bar within 1e-9 of the axis’s `leanMap` (finite: 8 presets, every 48th of a step) (#360)', () => {
    const beats = meterOnSteps(METERS['4/4']).heights;
    let worst = 0;
    for (const p of PRESETS) {
      const was = leanMap(swingParts(AXIS_SWING[p.name]!));
      for (let i = 0; i <= 16 * 48; i++) {
        const x = i / 48;
        const start = beats.findLast((b) => b <= x) ?? 0;
        const now = swingMapAt(presetSwing(p)!, start, 4);
        worst = Math.max(worst, Math.abs(now.played(x) - was.played(x)));
      }
    }
    expect(worst).toBeLessThan(1e-9);
  });

  it('span the axes they are said to reach at both ends', () => {
    // The prototype README says the presets reach every axis at both ends.
    // Of its four hand-chosen axes, that holds for harmony and articulation,
    // and for swing, which is now the meter's (#360); syncopation stops at
    // 0.05. Energy and tempo stay inside their ranges.
    const span = (axis: Exclude<Axis, 'entropy'>) => {
      const values = PRESETS.map((p) => p.style[axis]);
      return [Math.min(...values), Math.max(...values)];
    };
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
  const linear: Glide = { from: 0.2, to: 0.8, start: 32, length: 64, slope: 0, brake: 0 };
  const tempo: Glide = { from: 80, to: 160, start: 32, length: 64, slope: 0, brake: 0 };

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

  it('passes the midpoint of its space halfway: the mean, or for tempo the geometric mean (C2)', () => {
    expect(valueAt('harm', linear, 64)).toBe(0.5);
    expect(valueAt('bpm', tempo, 64)).toBeCloseTo(Math.sqrt(80 * 160), 10);
    expect(
      valueAt('bpm', { from: 60, to: 180, start: 0, length: 16, slope: 0, brake: 0 }, 8),
    ).toBeCloseTo(103.923, 3);
    // From rest, the curve is smoothstep: a quarter of the way in, 5/32 of the way.
    expect(valueAt('harm', linear, 48)).toBeCloseTo(0.2 + 0.6 * (5 / 32), 12);
  });

  it('never moves faster than the S-curve allows: 1.5 times the average rate', () => {
    for (const axis of AXIS_NAMES) {
      const [lo, hi] = [AXES[axis].min, AXES[axis].max];
      const glide = { from: lo, to: hi, start: 0, length: 16, slope: 0, brake: 0 };
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
  it('nothing jumps: a new glide starts from where the running one is, and as fast, on every axis (C1)', () => {
    for (const axis of AXIS_NAMES) {
      let track = holding(INITIAL_STYLE);
      // Retarget again and again, most of the time in the middle of a glide,
      // towards targets on both sides.
      const targets = across(axis);
      for (const [i, target] of [...targets, ...targets.reverse()].entries()) {
        const at = 5 + i * 7;
        const [value, rate] = [styleAt(track, at), rateAt(axis, track[axis], at)];
        const next = glideTo(track, { [axis]: target }, at, 12);
        expect(styleAt(next, at)).toEqual(value);
        expect(rateAt(axis, next[axis], at)).toBe(rate);
        track = next;
      }
    }
  });

  it('keeps moving while a slider is dragged (C1)', () => {
    // A drag of harm from 0.45 to 1 over 8 steps (1 s at 120 bpm), sending 30
    // retargets a second, each from the next step to be scheduled. What is
    // played at each step is read from the track as it stands then. Starting
    // each glide from rest played harm 0.476 at the end of the drag; carrying
    // the rate plays 0.547, and every step rises.
    let track = holding({ ...INITIAL_STYLE, harm: 0.45 });
    let retarget = 0;
    const played: number[] = [];
    for (let step = 0; step <= 24; step++) {
      for (; retarget <= 30 && (retarget / 30) * 8 < step + 1; retarget++) {
        const harm = 0.45 + 0.55 * Math.min(1, ((retarget / 30) * 8) / 8);
        track = glideTo(track, { harm }, step, SLIDER_GLIDE);
      }
      played.push(styleAt(track, step).harm);
    }
    expect(played[8]).toBeCloseTo(0.547, 3);
    played.slice(1).forEach((h, i) => {
      if (played[i]! < 1) expect(h).toBeGreaterThan(played[i]!);
      expect(h).toBeLessThanOrEqual(1);
    });
    expect(played[24]).toBe(1);
  });

  it('arrives sooner when it is already heading for a near target fast, rather than overshoot it', () => {
    const fast = glideTo(holding({ ...INITIAL_STYLE, harm: 0 }), { harm: 1 }, 0, 4);
    const near = glideTo(fast, { harm: styleAt(fast, 2).harm + 0.01 }, 2, 16);
    expect(near.harm.length).toBeLessThan(16);
    expect(near.harm.length).toBeCloseTo((3 * 0.01) / rateAt('harm', fast.harm, 2), 12);
  });

  it('glides monotone to its target when it starts heading there, without overshooting', () => {
    for (const axis of AXIS_NAMES) {
      const [lo, hi] = [AXES[axis].min, AXES[axis].max];
      // A fast glide up, retargeted to just above where it is.
      const fast = glideTo(holding({ ...INITIAL_STYLE, [axis]: lo }), { [axis]: hi }, 0, 4);
      for (const nudge of [0.001, 0.05, 0.3])
        for (const at of [1, 2, 3]) {
          const now = styleAt(fast, at)[axis];
          const target = Math.min(hi, now + (hi - lo) * nudge);
          const next = glideTo(fast, { [axis]: target }, at, 16);
          let last = now;
          for (let p = at; p <= at + 16; p += 0.25) {
            const v = styleAt(next, p)[axis];
            expect(v).toBeGreaterThanOrEqual(last - 1e-12);
            expect(v).toBeLessThanOrEqual(target + 1e-9 * Math.max(1, target));
            last = v;
          }
        }
    }
  });

  it('turns back within what the glide before had left, whatever the new length (C1)', () => {
    // A slider glide (one bar) sent back by a preset (eight bars): the motion
    // it carries dies away within the four steps the slider had left, so the
    // carry past the turn is bounded by slope × 4 × 4/27, not by the preset's
    // length. Letting it scale with the new length held harm at 1 for ten bars.
    let track = glideTo(holding({ ...INITIAL_STYLE, harm: 0.2 }), { harm: 1 }, 0, SLIDER_GLIDE);
    const rate = rateAt('harm', track.harm, 12);
    track = glideTo(track, { harm: 0.3 }, 12, PRESET_GLIDE);
    const harm = range(PRESET_GLIDE + 1).map((i) => styleAt(track, 12 + i).harm);
    const peak = Math.max(...harm);
    expect(peak).toBeGreaterThan(harm[0]!);
    expect(peak - harm[0]!).toBeLessThanOrEqual(rate * 4 * (4 / 27) + 1e-12);
    expect(harm.at(-1)).toBe(0.3);
  });

  it('stops its carry short of the axis end, when a long glide inherits fast motion (C1)', () => {
    // Quick reversals build up speed that a long glide then inherits: here
    // harm 0.489 moving up at 0.067 a step, with 127 steps of the last glide
    // left, sent to 0. Carried that long, it would pass the axis end by 1.26
    // and rest there; the brake stops it inside.
    let track = holding({ ...INITIAL_STYLE, harm: 0.5 });
    for (const [at, harm, length] of [
      [0, 1, 128],
      [6, 0.947171276876317, 4],
      [8, 0.19909047996582951, 4],
      [10, 0.6105198364753834, 128],
      [11, 0, 128],
    ] as const)
      track = glideTo(track, { harm }, at, length);
    const harm = range(129).map((i) => styleAt(track, 11 + i).harm);
    expect(Math.max(...harm)).toBeLessThan(1);
    expect(harm.at(-1)).toBe(0);
  });

  it('never rests at an axis end it was not sent to, and its rate is the slope of its value (C1)', () => {
    // Every order of two intents, a slider or a preset and then a slider or
    // a preset, turned at every step of the first, on every axis.
    const lengths = [SLIDER_GLIDE, PRESET_GLIDE];
    const problems: string[] = [];
    for (const axis of AXIS_NAMES) {
      const { min, max } = AXES[axis];
      const at = (f: number) => min * Math.pow(max / min, f);
      const value = AXES[axis].space === 'log' ? at : (f: number) => min + (max - min) * f;
      const space = AXES[axis].space === 'log' ? Math.log : (x: number) => x;
      for (const first of lengths)
        for (const second of lengths)
          for (const [a, b, c] of [
            [0.1, 0.95, 0.2],
            [0.9, 0.05, 0.8],
            [0.4, 1, 0],
            [0.6, 0, 1],
            [0.2, 0.8, 0.8],
          ] as const)
            for (let turn = 1; turn < first; turn += first / 16) {
              const started = glideTo(
                holding({ ...INITIAL_STYLE, [axis]: value(a) }),
                { [axis]: value(b) },
                0,
                first,
              );
              const glide = glideTo(started, { [axis]: value(c) }, turn, second)[axis];
              let resting = 0;
              for (let p = turn; p <= turn + second; p += 0.5) {
                const v = valueAt(axis, glide, p);
                const where = `${axis} ${first}→${second} ${a}→${b}→${c} turned at ${turn}, at ${p}`;
                if (v < min || v > max) problems.push(`${where}: ${v} outside the axis`);
                resting = (v === min || v === max) && v !== value(c) ? resting + 1 : 0;
                if (resting > 1) problems.push(`${where}: resting at ${v}`);
                if (p > turn && p < turn + second) {
                  const h = 1e-4;
                  const slope =
                    (space(valueAt(axis, glide, p + h)) - space(valueAt(axis, glide, p - h))) /
                    (2 * h);
                  // 1e-5: where the carried motion ends, the curvature jumps,
                  // which costs a central difference about h × jump / 4.
                  if (Math.abs(rateAt(axis, glide, p) - slope) > 1e-5)
                    problems.push(`${where}: rate ${rateAt(axis, glide, p)}, slope ${slope}`);
                }
              }
            }
    }
    expect(problems.slice(0, 5)).toEqual([]);
  });

  it('turns back when it is sent the other way, and never leaves its axis', () => {
    for (const axis of AXIS_NAMES) {
      const [lo, hi] = [AXES[axis].min, AXES[axis].max];
      const up = glideTo(holding({ ...INITIAL_STYLE, [axis]: lo }), { [axis]: hi }, 0, 4);
      const back = glideTo(up, { [axis]: lo }, 2, 16);
      const values = range(81).map((i) => styleAt(back, 2 + i / 4)[axis]);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(lo);
        expect(v).toBeLessThanOrEqual(hi);
      }
      // It carries on up for a moment, then comes down to the target.
      expect(values[1]!).toBeGreaterThan(values[0]!);
      expect(values.at(-1)).toBe(lo);
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
    const track = glideTo(holding(INITIAL_STYLE), { harm: 1.4, sync: -0.2, bpm: 400 }, 0, 16);
    expect(styleAt(track, 16)).toMatchObject({ harm: 1, sync: 0, bpm: 180 });
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

describe('writtenStyle', () => {
  it("puts every axis on the score's grid of 3 decimals, within half a step of it and inside the axis (C7)", () => {
    // Every value a preset glide passes through, on every axis.
    let track = holding(INITIAL_STYLE);
    const values: Record<Axis, number[]> = Object.fromEntries(
      AXIS_NAMES.map((a) => [a, []]),
    ) as never;
    PRESETS.forEach((preset, i) => {
      track = glideTo(track, preset.style, i * PRESET_GLIDE, PRESET_GLIDE);
      for (const step of range(PRESET_GLIDE)) {
        const style = styleAt(track, i * PRESET_GLIDE + step);
        for (const axis of AXIS_NAMES) values[axis].push(style[axis]);
      }
    });
    let long = 0;
    for (const axis of AXIS_NAMES)
      for (const value of values[axis]) {
        const written = writtenStyle({ ...INITIAL_STYLE, [axis]: value })[axis];
        expect(String(written)).toMatch(/^\d+(\.\d{1,3})?$/);
        expect(Math.abs(written - value)).toBeLessThanOrEqual(0.0005 + 1e-12);
        expect(written).toBeGreaterThanOrEqual(AXES[axis].min);
        expect(written).toBeLessThanOrEqual(AXES[axis].max);
        if (String(value).length > String(written).length) long++;
      }
    // A glide's values run long; the grid is what makes them short.
    expect(long).toBeGreaterThan(1000);
  });

  it('is a fixed point: a style written once is written again unchanged, and reads back from its text (C7)', () => {
    const style = styleAt(glideTo(holding(INITIAL_STYLE), PRESETS[3]!.style, 0, PRESET_GLIDE), 37);
    const once = writtenStyle(style);
    expect(writtenStyle(once)).toEqual(once);
    const text = AXIS_NAMES.map((axis) => `${axis}=${once[axis]}`).join(' ');
    const read = Object.fromEntries(
      text
        .split(' ')
        .map((pair) => pair.split('='))
        .map(([a, v]) => [a, Number(v)]),
    );
    expect(read).toEqual(once);
  });
});
