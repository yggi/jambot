import { describe, expect, it } from 'vitest';
import { keyedRng } from './random.ts';
import {
  AXES,
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  glideTo,
  holding,
  styleAt,
  valueAt,
} from './style.ts';
import { type TimeMap, composeTimeMaps, swingOf } from './swing.ts';
import { stepSeconds, tempoMap } from './tempo.ts';

const range = (n: number) => [...Array(n).keys()];

const steady = holding({ ...INITIAL_STYLE, bpm: 120 });
/** From 120 to 60 bpm over two bars, starting at step 8. */
const slowing = glideTo(steady, { bpm: 60 }, 8, 32);

describe('stepSeconds', () => {
  it('is a 16th note: 60 / bpm / 4', () => {
    expect(stepSeconds(120)).toBe(0.125);
    expect(stepSeconds(60)).toBe(0.25);
  });
});

describe('tempoMap', () => {
  it('lays steps end to end, each as long as the tempo where it starts', () => {
    const map = tempoMap(slowing, { step: 4, seconds: 10 });
    let seconds = 10;
    for (const step of range(60).map((i) => 4 + i)) {
      expect(map.played(step)).toBeCloseTo(seconds, 12);
      seconds += stepSeconds(styleAt(slowing, step).bpm);
    }
    expect(map.played(4)).toBe(10);
    expect(map.played(4.5)).toBe(10.0625);
  });

  it('keeps time rising through a tempo glide, and gives each position back from its time (T4, #39 Q1c)', () => {
    for (const track of [steady, slowing, glideTo(steady, { bpm: 180 }, 0, 64)]) {
      const map = tempoMap(track, { step: 0, seconds: 2 });
      const positions = range(64 * 12 + 1).map((i) => i / 12);
      const times = positions.map((p) => map.played(p));
      times.slice(1).forEach((t, i) => expect(t).toBeGreaterThan(times[i]!));
      positions.forEach((p, i) => expect(map.written(times[i]!)).toBeCloseTo(p, 9));
    }
  });

  it('only reaches forward from its anchor, where the past may have played to another track', () => {
    const map = tempoMap(steady, { step: 16, seconds: 3 });
    expect(() => map.played(15.5)).toThrow(/before the anchor/);
    expect(() => map.written(2.9)).toThrow(/before the anchor/);
  });
});

describe('position and clock time', () => {
  const { min, max } = AXES.bpm;
  /** The ends of the tempo axis, and every preset's tempo. */
  const tempos = [min, ...PRESETS.map((p) => p.style.bpm), max];
  const lengths = [0, SLIDER_GLIDE, PRESET_GLIDE];
  /** From rest at each tempo to each other, starting at step 8, at each length. */
  const fromRest = lengths.map((length) =>
    tempos.flatMap((from) =>
      tempos.map((to) => glideTo(holding({ ...INITIAL_STYLE, bpm: from }), { bpm: to }, 8, length)),
    ),
  );
  /**
   * Glides retargeted while they move, as a dragged slider or a preset
   * change does: from rest at step 8, then two to four retargets, each
   * partway through the glide before, to a tempo and length drawn from a
   * fixed seed. They leave with the old glide's slope, and some brake or
   * arrive early.
   */
  const retargeted = range(60).map((chain) => {
    const at = (i: number) => keyedRng(39, chain, i);
    let track = holding({ ...INITIAL_STYLE, bpm: tempos[Math.floor(at(0)() * tempos.length)]! });
    let start = 8;
    for (const i of range(2 + Math.floor(at(1)() * 3))) {
      const r = at(2 + i);
      const length = [4, SLIDER_GLIDE, PRESET_GLIDE][Math.floor(r() * 3)]!;
      track = glideTo(track, { bpm: tempos[Math.floor(r() * tempos.length)]! }, start, length);
      start += 1 + Math.floor(r() * Math.min(track.bpm.length, 40));
    }
    return track;
  });
  /** Through the longest glide and a bar past it, in 5ths of a step. */
  const positions = range(5 * 152 + 1).map((i) => i / 5);
  const anchor = { step: 0, seconds: 2 };

  /**
   * Where a map breaks Q1c, if anywhere: the first position whose time does
   * not rise, and the furthest a round trip lands from where it started,
   * from positions and back, and from clock times (a grid of its own, not
   * the positions' images) and back.
   */
  const breaks = (map: TimeMap) => {
    const times = positions.map((x) => map.played(x));
    const clock = positions.map((_, i) => anchor.seconds + (i / 5) * stepSeconds(max));
    return {
      order: positions.slice(1).find((x, i) => !(times[i + 1]! > times[i]!)),
      error: Math.max(
        ...positions.map((x, i) => Math.abs(map.written(times[i]!) - x)),
        ...clock.map((t) => Math.abs(map.played(map.written(t)) - t)),
      ),
    };
  };
  const holds = { order: undefined, error: expect.any(Number) as number };

  // Every pair at every length takes about 5 s on a slow machine, past
  // Vitest's default limit.
  it(
    'holds from rest between any two of the axis ends and the presets’ tempos, at every glide length (T4, #39 Q1c)',
    { timeout: 30_000 },
    () => {
      for (const track of fromRest.flat()) {
        const found = breaks(tempoMap(track, anchor));
        expect(found).toEqual(holds);
        expect(found.error).toBeLessThan(1e-9);
      }
    },
  );

  it('holds through glides retargeted while they move, which carry their slope and may brake (T4, #39 Q1c)', () => {
    const glides = retargeted.map((t) => t.bpm);
    // The sample holds what it claims: glides leaving at speed, braking before
    // they arrive, and arriving early rather than overshoot.
    expect(glides.filter((g) => g.slope !== 0).length).toBeGreaterThan(20);
    expect(glides.some((g) => g.brake > 0 && g.brake < g.length)).toBe(true);
    expect(glides.some((g) => ![4, SLIDER_GLIDE, PRESET_GLIDE].includes(g.length))).toBe(true);
    for (const track of retargeted) {
      const found = breaks(tempoMap(track, anchor));
      expect(found).toEqual(holds);
      expect(found.error).toBeLessThan(1e-9);
    }
  });

  it('fails when clock time is read as position × the step length there (T4, #39 Q1c)', () => {
    // From 72 to 148 bpm over a slider glide, time runs backwards.
    const fast = fromRest[1]!.find((t) => t.bpm.from === 72 && t.bpm.to === 148)!;
    const naive: TimeMap = {
      played: (x) => anchor.seconds + x * stepSeconds(valueAt('bpm', fast.bpm, x)),
      written: () => NaN,
    };
    expect(breaks(naive).order).toBeDefined();
  });

  it('takes a written position to its second through swing, then tempo, and back, with both gliding (T4, #39 Q1c)', () => {
    const swings = [
      [0.3, 1],
      [1, 0],
      [0.5, 0.75],
    ] as const;
    // Every seventh glide from rest, at each length, and a few retargeted.
    const sample = [
      ...fromRest.flatMap((tracks) => tracks.filter((_, i) => i % 7 === 0)),
      ...retargeted.slice(0, 6),
    ];
    // The sample glides the tempo: at every length, between tempos that differ.
    for (const length of lengths)
      expect(
        sample.filter((t) => t.bpm.length === length && t.bpm.from !== t.bpm.to).length,
      ).toBeGreaterThan(5);
    sample.forEach((track, i) => {
      const [swing, to] = swings[i % swings.length]!;
      const both = glideTo(glideTo(track, { swing }, 0, 0), { swing: to }, 8, PRESET_GLIDE);
      const found = breaks(composeTimeMaps(swingOf(both), tempoMap(both, anchor)));
      expect(found, `sample ${i}`).toEqual(holds);
      expect(found.error).toBeLessThan(1e-9);
    });
    // The check can fail: a map that reads written positions back a step late.
    const late = composeTimeMaps(swingOf(retargeted[0]!), tempoMap(retargeted[0]!, anchor));
    expect(breaks({ ...late, written: (t) => late.written(t) + 1 }).error).toBeGreaterThan(0.5);
  });
});

describe('swingOf', () => {
  it('swings each beat by the swing where the beat starts (C3)', () => {
    const track = glideTo(holding({ ...INITIAL_STYLE, swing: 0 }), { swing: 1 }, 0, 64);
    const map = swingOf(track);
    for (const beat of range(16)) {
      const swing = styleAt(track, 4 * beat).swing;
      expect(map.played(4 * beat + 2) - (4 * beat + 2)).toBeCloseTo(
        (2 / 3) * Math.max(0, 2 * swing - 1),
        12,
      );
    }
  });

  it('stays in order and invertible across beats that swing differently', () => {
    const track = glideTo(holding({ ...INITIAL_STYLE, swing: 0 }), { swing: 1 }, 0, 64);
    const map = swingOf(track);
    const positions = range(64 * 24 + 1).map((i) => i / 24);
    const played = positions.map((p) => map.played(p));
    played.slice(1).forEach((y, i) => expect(y).toBeGreaterThan(played[i]!));
    positions.forEach((p, i) => expect(map.written(played[i]!)).toBeCloseTo(p, 12));
  });
});
