import {
  type ForecastBar,
  INITIAL_STYLE,
  LOOKAHEAD,
  PRESETS,
  type TransportEnv,
  forecast,
  glideTo,
  holding,
  transport,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { applyForecast, forecastDelta } from './forecast.ts';

const env = (track = holding(INITIAL_STYLE)): TransportEnv => ({
  seed: 5,
  start: 0,
  track,
  wish: { tonic: null, mode: 'aeolian' },
});

/** The forecast of 40 bars, bar by bar as a host renews it, while the band plays. */
function forecasts(changeAt: number | null) {
  let carried = transport.initial;
  let track = holding(INITIAL_STYLE);
  const all: ForecastBar[][] = [forecast(env(track), null, 40)];
  for (let t = 0; t < 30; t += 0.025) {
    const before = carried?.nextBar;
    carried = transport.advance(env(track), carried, { now: t, until: t + LOOKAHEAD }).carried;
    if (changeAt !== null && t >= changeAt && t < changeAt + 0.025)
      track = glideTo(track, PRESETS[2]!.style, carried!.head.step, 128);
    if (carried!.nextBar !== before) all.push(forecast(env(track), carried, 40));
  }
  return all;
}

describe('the forecast sent as what changed', () => {
  it('gives the forecast back, applied to what the client held, bar after bar', () => {
    for (const changeAt of [null, 7]) {
      const all = forecasts(changeAt);
      let held: ForecastBar[] = [];
      let before: ForecastBar[] = [];
      for (const now of all) {
        held = applyForecast(held, forecastDelta(before, now));
        expect(held).toEqual(now);
        before = now;
      }
      expect(all.length).toBeGreaterThan(10);
    }
  });

  it('sends one bar a bar while nothing moves, and many when a control moves', () => {
    const steady = forecasts(null);
    for (let i = 2; i < steady.length; i++)
      expect(forecastDelta(steady[i - 1]!, steady[i]!).changed.length).toBeLessThanOrEqual(1);
    const moved = forecasts(7);
    const sizes = moved.slice(1).map((now, i) => forecastDelta(moved[i]!, now).changed.length);
    expect(Math.max(...sizes)).toBeGreaterThan(10);
  });

  it('keeps a bar it holds when the delta leaves it out, and drops those outside the range', () => {
    const [a, b, c] = forecasts(null)[0]!;
    expect(applyForecast([a!, b!, c!], { from: 1, count: 2, changed: [] })).toEqual([b, c]);
    expect(applyForecast([], { from: 0, count: 3, changed: [a!, b!, c!] })).toEqual([a, b, c]);
  });
});
