import { describe, expect, it } from 'vitest';
import { clockOffset } from './clock-offset.ts';

describe('clockOffset', () => {
  it('falls back to now() minus currentTime*1000 when there is no outputTimestamp', () => {
    const clock = { currentTime: 2 };
    const offset = clockOffset(clock, () => 3000);
    offset.update();
    // now=3000, currentTime=2s -> offset = 3000 - 2000 = 1000
    expect(offset.toDeviceMs(5)).toBe(5 * 1000 + 1000);
  });

  it('prefers a precise outputTimestamp over the now() fallback', () => {
    const clock = {
      currentTime: 2,
      outputTimestamp: () => ({ contextTime: 2, performanceTime: 2500 }),
    };
    const offset = clockOffset(clock, () => 999999);
    offset.update();
    // offset = 2500 - 2*1000 = 500, ignoring the fallback's now()
    expect(offset.toDeviceMs(0)).toBe(500);
  });

  it('ignores an outputTimestamp that is not yet valid (zero or negative)', () => {
    const clock = {
      currentTime: 2,
      outputTimestamp: () => ({ contextTime: 0, performanceTime: 0 }),
    };
    const offset = clockOffset(clock, () => 3000);
    offset.update();
    expect(offset.toDeviceMs(0)).toBe(1000);
  });

  it('smooths across updates, nine parts old to one part fresh', () => {
    let now = 1000;
    const clock = { currentTime: 0 };
    const offset = clockOffset(clock, () => now);
    offset.update(); // offset = 1000
    now = 2000;
    offset.update(); // offset = 1000*0.9 + 2000*0.1 = 1100
    expect(offset.toDeviceMs(0)).toBe(1100);
  });

  it('samples fresh when read before any update', () => {
    const clock = { currentTime: 4 };
    const offset = clockOffset(clock, () => 4500);
    expect(offset.toDeviceMs(0)).toBe(500);
  });

  it('inverts toDeviceMs, for a note timestamped on performance.now()', () => {
    const clock = { currentTime: 2 };
    const offset = clockOffset(clock, () => 3000);
    offset.update(); // offset = 1000
    expect(offset.fromDeviceMs(4500)).toBe(3.5);
    expect(offset.fromDeviceMs(offset.toDeviceMs(7))).toBeCloseTo(7, 9);
  });

  it('maps to the moment being heard on both paths: the fallback takes the output latency off currentTime', () => {
    // Chromium, measured: the time getOutputTimestamp says is heard lags
    // currentTime by about the output latency (35 ms against 32).
    const precise = clockOffset(
      {
        currentTime: 1.512,
        latency: 0.032,
        outputTimestamp: () => ({ contextTime: 1.48, performanceTime: 1620 }),
      },
      () => 1620,
    );
    const fallback = clockOffset({ currentTime: 1.512, latency: 0.032 }, () => 1620);
    expect(precise.fromDeviceMs(1620)).toBeCloseTo(1.48, 9);
    expect(fallback.fromDeviceMs(1620)).toBeCloseTo(1.48, 9);
  });
});
