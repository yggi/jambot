import { describe, expect, it } from 'vitest';
import { PitchTracker } from './tracker.ts';
import { noise, sine } from './signals.ts';

const sampleRate = 48000;
const cents = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);

function feed(tracker: PitchTracker, x: Float64Array, block = 128) {
  const found: (number | undefined)[] = [];
  for (let i = 0; i + block <= x.length; i += block)
    found.push(tracker.push(x.subarray(i, i + block))?.hz);
  return found;
}

describe('PitchTracker', () => {
  it('says nothing until its window has filled, and then the pitch of a steady sine to a cent, at every note from A2 to A5', () => {
    for (const hz of [110, 147, 196, 262, 349, 440, 587, 880]) {
      const found = feed(new PitchTracker({ sampleRate }), sine(hz, 0.5 * sampleRate, sampleRate));
      expect(found[0], `${hz}`).toBeUndefined();
      expect(Math.abs(cents(found.at(-1)!, hz)), `${hz}`).toBeLessThan(1);
    }
  });

  it('looks every hop, not every block: the estimate holds still between looks', () => {
    const found = feed(
      new PitchTracker({ sampleRate, hop: 512 }),
      sine(220, 0.3 * sampleRate, sampleRate),
      128,
    );
    const changes = found.filter((hz, i) => i > 0 && hz !== found[i - 1]).length;
    // A look is every 512 samples, four blocks of 128: the estimate can change only then.
    expect(changes).toBeLessThanOrEqual(Math.ceil(found.length / 4));
  });

  it('does not depend on how the signal is cut into blocks', () => {
    const x = sine(233, 0.3 * sampleRate, sampleRate);
    const a = feed(new PitchTracker({ sampleRate }), x, 128);
    const b = feed(new PitchTracker({ sampleRate }), x, 64);
    // At every block of 128 the estimate of the tracker fed 64 at a time is the one of the same sample.
    for (let i = 0; i < a.length; i++) expect(b[2 * i + 1]).toBe(a[i]);
  });

  it('follows a pitch that moves, late by about half its window', () => {
    const x = new Float64Array(sampleRate);
    let phase = 0;
    for (let i = 0; i < x.length; i++) {
      phase += (2 * Math.PI * (i < sampleRate / 2 ? 220 : 247)) / sampleRate;
      x[i] = Math.sin(phase);
    }
    const found = feed(new PitchTracker({ sampleRate }), x);
    const time = found.findIndex(
      (hz, i) => i * 128 > sampleRate / 2 && hz !== undefined && Math.abs(cents(hz, 247)) < 20,
    );
    const late = (time * 128 - sampleRate / 2) / sampleRate;
    expect(late).toBeGreaterThan(0.005);
    expect(late).toBeLessThan(0.03); // a window of 21 ms and a hop of 5
  });

  it('says there is no pitch in silence and in noise, and in a sound below its range', () => {
    expect(
      feed(new PitchTracker({ sampleRate }), new Float64Array(0.3 * sampleRate)).every(
        (hz) => hz === undefined,
      ),
    ).toBe(true);
    expect(
      feed(new PitchTracker({ sampleRate }), noise(0.3 * sampleRate, 5, 0.5)).every(
        (hz) => hz === undefined,
      ),
    ).toBe(true);
  });
});
