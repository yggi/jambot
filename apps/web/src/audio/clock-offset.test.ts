// @vitest-environment node
/**
 * The clock offset the app reads, webmidi's (`clockOffset`,
 * `@yggi/webmidi/core`), under every fault of the clocks of a device
 * `@jambot/session` simulates (#27). Its unit tests are webmidi's
 * (`src/core/clock.test.ts`). The timing panel shows its own estimate
 * (`estimate`): the offset, the bound it trusts and the jumps it followed.
 */
import { type DeviceFaults, simulatedDevice } from '@jambot/session';
import { OUTPUT, type OutputClock, PAIRED_AFTER, clockOffset } from '@yggi/webmidi/core';
import { describe, expect, it } from 'vitest';

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

  // A dropped buffer jumps the pairing by the buffer at once. The output
  // pair takes it for a jump on its third reading after, and follows it:
  // a note is timestamped out for two ticks at most.
  it('follows a dropped buffer within three readings, again and again (T9)', () => {
    const settle = (OUTPUT.confirm - 1) * 0.025;
    expect(offsetBreaks({ drops: [{ at: 6, lost: BUFFER }] }, { settle })).toEqual([]);
    const drops = Array.from({ length: 6 }, (_, i) => ({ at: 2 + i * 1.7, lost: BUFFER }));
    expect(offsetBreaks({ drops }, { settle })).toEqual([]);
    expect(offsetBreaks({ drops }, { settle: settle - 0.025 }).length).toBeGreaterThan(0);
  });
});

describe('the moment heard, under every fault of its clocks (#27)', () => {
  // Where the platform pairs, the moment heard is read through the output
  // pair's estimate, within the pairing's jitter, blips dropped; where it
  // doesn't, through the clock less its latency, which carries a quantum.
  const scenes: Record<string, [DeviceFaults, boolean, number]> = {
    'no fault': [{}, true, 0],
    'drift, 100 ppm': [{ drift: 100 }, true, 0.0001],
    'a dropped buffer': [{ drops: [{ at: 6, lost: BUFFER }] }, true, 0],
    "the pairing's jitter": [{ pairingJitter: PAIRING_JITTER }, true, PAIRING_JITTER],
    "the pairing's blips": [
      { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS },
      true,
      PAIRING_JITTER + OUTPUT.slew,
    ],
    'the render quantum, with no pairing': [{ quantum: QUANTUM }, false, QUANTUM],
    'a dropped buffer, with no pairing': [{ drops: [{ at: 6, lost: BUFFER }] }, false, 0],
  };
  /** How far, in seconds, the moment heard is read off, at worst, every tick but the three after a drop. */
  const worst = (faults: DeviceFaults, paired: boolean) => {
    const d = simulatedDevice({ latency: 0.03, pageOrigin: -12, seed: 3, ...faults });
    const drops = faults.drops ?? [];
    let t = 0;
    let most = 0;
    const { clock, now } = d.view(() => t, { paired });
    const offset = clockOffset(clock, now);
    for (t = 0.3; t < 12; t += 0.025) {
      offset.update();
      if (drops.some((drop) => t >= drop.at && t < drop.at + drop.lost + OUTPUT.confirm * 0.025))
        continue;
      if (offset.heardOffset() !== null)
        most = Math.max(most, Math.abs(offset.heard() - d.heard(t)));
    }
    return most;
  };
  for (const [name, [faults, paired, bound]] of Object.entries(scenes))
    it(`reads the moment heard within the reading's own error: ${name}`, () => {
      expect(worst(faults, paired)).toBeLessThanOrEqual(bound + 1e-9);
    });

  it('finds the quantum where it falls back on the clock', () => {
    expect(worst({ quantum: QUANTUM }, false)).toBeGreaterThan(QUANTUM / 2);
    expect(worst({ quantum: QUANTUM }, true)).toBeLessThan(1e-9);
  });

  it('has no offset until the output has run for PAIRED_AFTER, however late it starts', () => {
    const d = simulatedDevice({ started: 1 });
    let t = 0;
    const { clock, now } = d.view(() => t);
    const offset = clockOffset(clock, now);
    for (t = 0; t < 2; t += 0.025) {
      offset.update();
      if (Math.abs(t - 1 - PAIRED_AFTER) > 0.06)
        expect(offset.heardOffset() === null).toBe(t < 1 + PAIRED_AFTER);
    }
  });
});

/** A clock whose pairing reads `offsets[i]` at reading `i`, a tick (25 ms) apart, and its offset, updated at each. */
function overReadings(offsets: readonly number[]) {
  let i = 0;
  const clock: OutputClock = {
    get currentTime() {
      return 1 + i * 0.025;
    },
    outputTimestamp: () => ({
      contextTime: 1 + i * 0.025,
      performanceTime: (1 + i * 0.025 - offsets[i]!) * 1000,
    }),
  };
  const offset = clockOffset(clock, () => 0);
  for (i = 0; i < offsets.length; i++) offset.update();
  return offset.estimate;
}

/** A seeded random in [0, 1): the same offsets every run. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

describe("the output pair's estimate the timing panel shows (#27): webmidi's own", () => {
  it('counts every restart on a pairing that blips, one smaller than the slew among them: 54 over 5 seeds', () => {
    // 2,000 readings of a pairing that jitters by up to 0.4 ms, blips by up to 4 ms on one reading in twenty,
    // drifts by 100 ppm, and jumps every 200 readings by 5 ms up to just inside the leap, either way.
    const widest = OUTPUT.leap - 0.004 - 0.0008 - 2 * OUTPUT.paired;
    const jumps = [1, 2, 3, 4, 5].map((seed) => {
      const random = seeded(seed);
      let base = 0.7;
      const offsets = Array.from({ length: 2000 }, (_, i) => {
        if (i > 0 && i % 200 === 0)
          base += (random() < 0.5 ? -1 : 1) * (0.005 + random() * (widest - 0.005));
        const blip = random() < 0.05 ? (random() * 2 - 1) * 0.004 : 0;
        return base + i * 0.025 * 1e-4 + (random() * 2 - 1) * 0.0004 + blip;
      });
      return overReadings(offsets).jumps;
    });
    // The 9 jumps of each, and restarts on the blips: seed 5's at reading 683 moves the offset by 0.16 ms, under the slew.
    expect(jumps).toEqual([11, 11, 9, 12, 11]);
    expect(jumps.reduce((a, b) => a + b)).toBe(54);
  });

  it('counts each dropped buffer as a jump followed, with the bound of the pairing or the clock', () => {
    for (const paired of [true, false]) {
      const drops = Array.from({ length: 6 }, (_, i) => ({ at: 2 + i * 1.7, lost: BUFFER }));
      const d = simulatedDevice({ latency: 0.03, pageOrigin: -12, seed: 3, drops });
      let t = 0;
      const { clock, now } = d.view(() => t, { paired });
      const offset = clockOffset(clock, now);
      for (t = 0.3; t < 12; t += 0.025) offset.update();
      expect(offset.estimate.jumps).toBe(6);
      expect(offset.estimate.bound).toBe(paired ? OUTPUT.paired : OUTPUT.unpaired);
    }
  });

  it('follows a jump wider than 50 ms (the leap) from its first reading, and one of up to 50 ms after three', () => {
    for (const [jump, after] of [
      [0.08, 1],
      [0.04, OUTPUT.confirm],
      [0.0107, OUTPUT.confirm],
    ] as const) {
      const offsets = [...Array<number>(20).fill(0.5), ...Array<number>(20).fill(0.5 - jump)];
      const followed = Array.from(
        { length: offsets.length },
        (_, n) => overReadings(offsets.slice(0, n + 1)).offset,
      );
      expect(
        followed.findIndex((o, i) => i >= 20 && Math.abs(o! - (0.5 - jump)) < 0.001) - 19,
      ).toBe(after);
    }
    expect([OUTPUT.leap, OUTPUT.confirm]).toEqual([0.05, 3]);
  });

  it('counts a hold of 80 ms as one jump', () => {
    const offsets = [...Array<number>(20).fill(0.5), ...Array<number>(20).fill(0.42)];
    expect(overReadings(offsets)).toEqual({
      offset: expect.closeTo(0.42, 12),
      bound: OUTPUT.paired,
      jumps: 1,
    });
  });

  it('has no estimate before its first reading', () => {
    expect(overReadings([])).toEqual({ offset: null, bound: null, jumps: 0 });
  });
});
