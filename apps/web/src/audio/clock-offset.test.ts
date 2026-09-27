import { type DeviceFaults, simulatedDevice } from '@jambot/session';
import { describe, expect, it } from 'vitest';
import { PAIRED_AFTER, clockOffset, heardNow } from './clock-offset.ts';

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

describe('heardNow', () => {
  it('reads the moment heard through the pairing, from a fresh sample', () => {
    const clock = {
      currentTime: 2.05,
      latency: 0.03,
      outputTimestamp: () => ({ contextTime: 2, performanceTime: 7000 }),
    };
    expect(heardNow(clock, () => 7010)).toBeCloseTo(2.01, 12);
  });

  it('is null while a platform that pairs has not paired, or its output has only just started', () => {
    for (const [contextTime, performanceTime] of [
      [0, 0],
      [0, 5000],
      [PAIRED_AFTER - 0.01, 5000],
    ] as const) {
      const clock = { currentTime: 1, outputTimestamp: () => ({ contextTime, performanceTime }) };
      expect(heardNow(clock, () => 5000)).toBeNull();
    }
    expect(heardNow({ currentTime: 1, outputTimestamp: () => undefined })).toBeNull();
  });

  it('falls back to the clock less its latency where the platform never pairs', () => {
    expect(heardNow({ currentTime: 3, latency: 0.04 })).toBeCloseTo(2.96, 12);
  });
});

/** A buffer of 512 frames at 48 kHz, and Chromium's render quantum there. */
const BUFFER = 512 / 48000;
const QUANTUM = 128 / 48000;
/** The pairing's jitter and its blips on a busy machine, as `faults.test.ts` has them. */
const PAIRING_JITTER = 0.0004;
const PAIRING_BLIPS = { share: 0.05, size: 0.004 };

/**
 * A device's clocks read as the app reads them, every tick (25 ms) from
 * 0.3 s to 12 s, on a platform that pairs its clocks or, with `paired`
 * false, one that doesn't. At each tick, `read` is given the clocks and how
 * far, in milliseconds on the page's clock, a note scheduled a lookahead
 * ahead is timestamped from the moment it is heard.
 */
function everyTick(
  faults: DeviceFaults,
  paired: boolean,
  read: (at: {
    t: number;
    clock: ReturnType<ReturnType<typeof simulatedDevice>['view']>;
    heardOff: (x: number, ms: number) => number;
  }) => void,
) {
  const d = simulatedDevice({ latency: 0.03, pageOrigin: -12, seed: 3, ...faults });
  let t = 0;
  const clock = d.view(() => t, { paired });
  for (t = 0.3; t < 12; t += 0.025)
    read({ t, clock, heardOff: (x, ms) => ms - d.pageNow(d.heardAt(x)) });
}

/** The clock offset's error at each tick, in milliseconds, updated as the tick reads the clock. */
function offsetErrors(faults: DeviceFaults, paired: boolean) {
  const errors: { t: number; ms: number }[] = [];
  let offset: ReturnType<typeof clockOffset> | null = null;
  everyTick(faults, paired, ({ t, clock, heardOff }) => {
    offset ??= clockOffset(clock.clock, clock.now);
    offset.update();
    const x = clock.clock.currentTime + 0.12;
    errors.push({ t, ms: heardOff(x, offset.toDeviceMs(x)) });
  });
  return errors;
}

/**
 * Where a clock offset is more than `bound` milliseconds out: at ticks away
 * from a drop, and from those after it that `settle` excuses. A note
 * scheduled before a drop and heard after it is out by the drop, which no
 * clock can know ahead: so are the ticks a lookahead and the latency
 * before one.
 */
function offsetBreaks(
  faults: DeviceFaults,
  { settle = 0, paired = true, bound = 1 }: { settle?: number; paired?: boolean; bound?: number },
) {
  const drops = faults.drops ?? [];
  const ahead = 0.12 + 0.03;
  const settled = (t: number) =>
    drops.every((d) => t < d.at - ahead || t >= d.at + d.lost + settle);
  return offsetErrors(faults, paired)
    .filter(({ t, ms }) => settled(t) && Math.abs(ms) > bound)
    .map(({ t, ms }) => `at ${t.toFixed(3)} s, ${ms.toFixed(2)} ms out`);
}

describe('clockOffset under every fault of its clocks (#27, T9)', () => {
  // The render quantum reaches only `currentTime`, so only the fallback
  // meets it: there it is a scene, and the fallback promises a quantum more.
  const paired: Record<string, DeviceFaults> = {
    'no fault': {},
    'drift, 100 ppm': { drift: 100 },
    "the pairing's jitter": { pairingJitter: PAIRING_JITTER },
    "the pairing's blips": { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS },
    'a page clock far from the output clock': { pageOrigin: -86400, started: 0.2 },
  };
  const unpaired: Record<string, DeviceFaults> = {
    'no fault': {},
    'drift, 100 ppm': { drift: 100 },
    'the render quantum': { quantum: QUANTUM },
    'a page clock far from the output clock': { pageOrigin: -86400, started: 0.2 },
  };
  for (const [name, faults] of Object.entries(paired))
    it(`timestamps a note within a millisecond of when it is heard: ${name}`, () => {
      expect(offsetBreaks(faults, {})).toEqual([]);
    });
  for (const [name, faults] of Object.entries(unpaired))
    it(`timestamps a note within a millisecond and a quantum where the platform has no pairing: ${name}`, () => {
      expect(offsetBreaks(faults, { paired: false, bound: 1 + QUANTUM * 1000 })).toEqual([]);
    });

  it('finds a timestamp out where the offset lags a drop, or the fallback reads a quantum', () => {
    const dropped = { drops: [{ at: 6, lost: BUFFER }] };
    expect(offsetBreaks(dropped, {}).length).toBeGreaterThan(0);
    expect(offsetBreaks(dropped, { settle: 5 }).length).toBe(0);
    expect(offsetBreaks({ quantum: QUANTUM }, { paired: false }).length).toBeGreaterThan(0);
  });

  // A dropped buffer jumps the pairing by the buffer at once, and nine
  // parts in ten of the old offset are kept on every update: the offset
  // takes some 23 updates to come within a millisecond, and MIDI out and
  // capture are that far out meanwhile. A clock that follows a jump would
  // be back within two (#27: one estimator for every clock pair).
  it('does not follow a dropped buffer within two ticks yet, and is out for some 23 (T9)', () => {
    const breaks = offsetBreaks({ drops: [{ at: 6, lost: BUFFER }] }, { settle: 2 * 0.025 });
    expect(breaks.length).toBeGreaterThan(15);
    expect(breaks.length).toBeLessThan(25);
  });
});

describe('heardNow under every fault of its clocks (#27)', () => {
  // Where the platform pairs, `heardNow` reads one sample of the pairing,
  // which carries no quantum; where it doesn't, the clock less its latency,
  // which carries one.
  const scenes: Record<string, [DeviceFaults, boolean, number]> = {
    'no fault': [{}, true, 0],
    'drift, 100 ppm': [{ drift: 100 }, true, 0],
    'a dropped buffer': [{ drops: [{ at: 6, lost: BUFFER }] }, true, 0],
    "the pairing's jitter": [{ pairingJitter: PAIRING_JITTER }, true, PAIRING_JITTER],
    "the pairing's blips": [
      { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS },
      true,
      PAIRING_JITTER + PAIRING_BLIPS.size,
    ],
    'the render quantum, with no pairing': [{ quantum: QUANTUM }, false, QUANTUM],
    'a dropped buffer, with no pairing': [{ drops: [{ at: 6, lost: BUFFER }] }, false, 0],
  };
  /** How far, in seconds, `heardNow` reads from the moment heard, at worst, every tick. */
  const worst = (faults: DeviceFaults, paired: boolean) => {
    const d = simulatedDevice({ latency: 0.03, pageOrigin: -12, seed: 3, ...faults });
    let t = 0;
    let most = 0;
    const { clock, now } = d.view(() => t, { paired });
    for (t = 0.3; t < 12; t += 0.025)
      most = Math.max(most, Math.abs(heardNow(clock, now)! - d.heard(t)));
    return most;
  };
  for (const [name, [faults, paired, bound]] of Object.entries(scenes))
    it(`reads the moment heard from one sample, off by no more than that sample: ${name}`, () => {
      expect(worst(faults, paired)).toBeLessThanOrEqual(bound + 1e-9);
    });

  it('finds the quantum where it falls back on the clock', () => {
    expect(worst({ quantum: QUANTUM }, false)).toBeGreaterThan(QUANTUM / 2);
    expect(worst({ quantum: QUANTUM }, true)).toBeLessThan(1e-9);
  });

  it('is null until the output has run for PAIRED_AFTER, however late it starts', () => {
    const d = simulatedDevice({ started: 1 });
    let t = 0;
    const { clock, now } = d.view(() => t);
    for (t = 0; t < 2; t += 0.025)
      if (Math.abs(t - 1 - PAIRED_AFTER) > 0.01)
        expect(heardNow(clock, now) === null).toBe(t < 1 + PAIRED_AFTER);
  });
});
