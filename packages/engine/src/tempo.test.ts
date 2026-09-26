import { describe, expect, it } from 'vitest';
import { INITIAL_STYLE, glideTo, holding, styleAt } from './style.ts';
import { swingOf } from './swing.ts';
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
