import { describe, expect, it } from 'vitest';
import {
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  type StyleTrack,
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

  it('keeps time rising through a tempo glide, and gives each position back from its time', () => {
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

describe('Q1c (#39): position and clock time', () => {
  const tempos = PRESETS.map((p) => p.style.bpm);
  /** From each preset's tempo to each other's, starting at step 8: a jump, a slider, a preset. */
  const tracks: StyleTrack[] = tempos.flatMap((from) =>
    tempos.flatMap((to) =>
      [0, SLIDER_GLIDE, PRESET_GLIDE].map((length) =>
        glideTo(holding({ ...INITIAL_STYLE, bpm: from }), { bpm: to }, 8, length),
      ),
    ),
  );
  /** Through the longest glide and a bar past it, in 5ths of a step. */
  const positions = range(5 * 152 + 1).map((i) => i / 5);
  const anchor = { step: 0, seconds: 2 };

  /** The first position, if any, where a map's played time does not rise. */
  const orderBreak = (map: TimeMap) =>
    positions.slice(1).find((x, i) => !(map.played(x) > map.played(positions[i]!)));
  /** The furthest a round trip lands from where it started, both ways. */
  const roundTripError = (map: TimeMap) =>
    Math.max(
      ...positions.map((x) => Math.abs(map.written(map.played(x)) - x)),
      ...positions.map((x) => map.played(x)).map((t) => Math.abs(map.played(map.written(t)) - t)),
    );

  it('rises through every glide between two presets’ tempos, where position × the tempo there does not', () => {
    for (const track of tracks) expect(orderBreak(tempoMap(track, anchor))).toBeUndefined();
    // Reading clock time as the position times the step length at the
    // position: from 72 to 148 bpm over a slider glide, time runs backwards.
    const fast = glideTo(holding({ ...INITIAL_STYLE, bpm: 72 }), { bpm: 148 }, 8, SLIDER_GLIDE);
    const naive: TimeMap = {
      played: (x) => anchor.seconds + x * stepSeconds(valueAt('bpm', fast.bpm, x)),
      written: () => NaN,
    };
    expect(orderBreak(naive)).toBeDefined();
  });

  it('gives each position back from its time, and each time from its position, through every such glide', () => {
    for (const track of tracks) expect(roundTripError(tempoMap(track, anchor))).toBeLessThan(1e-9);
  });

  it('takes a written position to its second through swing, then tempo, and back, with both gliding', () => {
    for (const [swing, to] of [
      [0.3, 1],
      [1, 0],
      [0.5, 0.75],
    ] as const)
      for (const track of tracks.filter((_, i) => i % 9 === 0)) {
        const both = glideTo(glideTo(track, { swing }, 0, 0), { swing: to }, 8, PRESET_GLIDE);
        const map = composeTimeMaps(swingOf(both), tempoMap(both, anchor));
        expect(orderBreak(map)).toBeUndefined();
        expect(roundTripError(map)).toBeLessThan(1e-9);
      }
    // The check can fail: a map that reads written positions back a step late.
    const late = composeTimeMaps(swingOf(tracks[0]!), tempoMap(tracks[0]!, anchor));
    expect(roundTripError({ ...late, written: (t) => late.written(t) + 1 })).toBeGreaterThan(0.5);
  });
});

describe('swingOf', () => {
  it('swings each beat by the swing where the beat starts', () => {
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
