// @vitest-environment node
import { sine } from '@jambot/spectrum';
import { describe, expect, it } from 'vitest';
import { assess, probeSignal } from './measure.ts';

const sampleRate = 48000;

describe('probeSignal', () => {
  it('is a silence and then a sine at the pitch asked for, as long as asked, at a level that is not too quiet to read', () => {
    const { signal, silence } = probeSignal({ sampleRate, seconds: 2, hz: 110 });
    expect(signal).toHaveLength(2 * sampleRate);
    expect(silence).toBe(sampleRate / 4);
    expect(Math.max(...signal.subarray(0, silence).map(Math.abs))).toBe(0);
    expect(Math.max(...signal.subarray(silence).map(Math.abs))).toBeCloseTo(0.5, 2);
  });
});

describe('assess', () => {
  const probe = probeSignal({ sampleRate, seconds: 3, hz: 110 });

  it('reads how late a sound came out from where it starts, to within a few samples', () => {
    for (const delay of [0, 480, 2400]) {
      const out = new Float32Array(probe.signal.length);
      out.set(probe.signal.subarray(0, probe.signal.length - delay), delay);
      expect(
        assess(out, { sampleRate, silence: probe.silence, targetHz: 110 }).delayMs,
      ).toBeCloseTo((delay / sampleRate) * 1000, 0);
    }
  });

  it('reads the pitch it came out at, and how far that is from the target, in cents', () => {
    const out = Float32Array.from(
      sine(110 * 2 ** (-7 / 1200), 3 * sampleRate, sampleRate, { amplitude: 0.5 }),
    );
    const result = assess(out, { sampleRate, silence: probe.silence, targetHz: 110 });
    expect(result.heardHz).toBeCloseTo(110 * 2 ** (-7 / 1200), 1);
    expect(result.errorCents).toBeCloseTo(-7, 0);
  });

  it('says there is no pitch in silence, and no delay', () => {
    const result = assess(new Float32Array(3 * sampleRate), {
      sampleRate,
      silence: probe.silence,
      targetHz: 110,
    });
    expect(result.heardHz).toBeNull();
    expect(result.errorCents).toBeNull();
    expect(result.delayMs).toBeNull();
  });
});
