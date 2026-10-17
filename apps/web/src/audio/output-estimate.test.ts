// @vitest-environment node
/**
 * webmidi's clock offset, as the app reads it (`estimatedOffset`), against
 * the estimate Jambot had before it: the session's output pair
 * (`outputClock`) read as `apps/web/src/audio/clock-offset.ts` read it at
 * b17b648 (`jambotOffset` below). The two are one estimator but for webmidi's
 * `leap`: a jump wider than 50 ms is followed from its first reading, where
 * Jambot's waited for three (yggi/webmidi#3).
 */
import {
  type DeviceFaults,
  type PairCarried,
  type PairEstimate,
  outputClock,
  pairingSample,
  simulatedDevice,
  unpairedSample,
} from '@jambot/session';
import { OUTPUT, type OutputClock, PAIRED_AFTER } from '@yggi/webmidi/core';
import { describe, expect, it } from 'vitest';
import { estimatedOffset } from './output-estimate.ts';

/** Jambot's clock offset before webmidi's: the session's output pair, from one reading a tick, none twice. */
function jambotOffset(clock: OutputClock, now: () => number) {
  let carried: PairCarried = outputClock.initial;
  let estimate: PairEstimate = { offset: null, bound: null, jumps: 0 };
  let last: number | null = null;
  const reading = () => {
    if (!clock.outputTimestamp) {
      const at = clock.currentTime;
      return { at, sample: unpairedSample(at, clock.latency ?? 0, now()) };
    }
    const ts = clock.outputTimestamp();
    if (!ts || !(ts.contextTime! >= PAIRED_AFTER) || !(ts.performanceTime! > 0)) return null;
    return { at: ts.contextTime!, sample: pairingSample(ts.contextTime!, ts.performanceTime!) };
  };
  return {
    update() {
      const read = reading();
      if (!read || read.at === last) return;
      last = read.at;
      const next = outputClock.advance(null, carried, read.sample);
      carried = next.carried;
      estimate = next.output;
    },
    get estimate() {
      return estimate;
    },
  };
}

/** A clock whose pairing reads `offsets[i]` at reading `i`, a tick (25 ms) apart: the offset each reading samples. */
function pairedReadings(offsets: readonly number[]) {
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
  return {
    clock,
    now: () => 0,
    /** Each reading in turn, `read` given its index after both estimators took it. */
    each(read: (i: number) => void) {
      for (i = 0; i < offsets.length; i++) read(i);
    },
  };
}

/** The offset each estimator plays by, at every reading of `offsets`. */
function bothOver(offsets: readonly number[]) {
  const readings = pairedReadings(offsets);
  const webmidi = estimatedOffset(readings.clock, readings.now);
  const jambot = jambotOffset(readings.clock, readings.now);
  const played: { webmidi: number | null; jambot: number | null }[] = [];
  readings.each(() => {
    webmidi.update();
    jambot.update();
    played.push({ webmidi: webmidi.heardOffset(), jambot: jambot.estimate.offset });
  });
  return { played, webmidi: webmidi.estimate, jambot: jambot.estimate };
}

/** The reading, counted from the first after the jump at `at`, at which `offsets` is followed to within a millisecond. */
const followedAfter = (offsets: (number | null)[], at: number, to: number) =>
  offsets.findIndex((o, i) => i >= at && o !== null && Math.abs(o - to) < 0.001) - at + 1;

/** A seeded random in [0, 1): the same offsets every run. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

/**
 * 2,000 readings of a pairing that jitters by up to 0.4 ms, blips by up to
 * 4 ms on one reading in twenty, drifts by 100 ppm, and jumps every 200
 * readings by 5 ms to `widest` seconds, either way.
 */
function busyOffsets(seed: number, widest: number) {
  const random = seeded(seed);
  const offsets: number[] = [];
  let base = 0.7;
  for (let i = 0; i < 2000; i++) {
    if (i > 0 && i % 200 === 0)
      base += (random() < 0.5 ? -1 : 1) * (0.005 + random() * (widest - 0.005));
    const blip = random() < 0.05 ? (random() * 2 - 1) * 0.004 : 0;
    offsets.push(base + i * 0.025 * 1e-4 + (random() * 2 - 1) * 0.0004 + blip);
  }
  return offsets;
}

describe("webmidi's clock offset against Jambot's estimate before it", () => {
  it('plays by the same offset at every reading, where no jump is wider than its leap', () => {
    // The widest jump, its jitter and a blip on top stay inside the leap and the readings' bounds.
    const widest = OUTPUT.leap - 0.004 - 0.0008 - 2 * OUTPUT.paired;
    const jumps: { webmidi: number; jambot: number }[] = [];
    for (const seed of [1, 2, 3, 4, 5]) {
      const { played, webmidi, jambot } = bothOver(busyOffsets(seed, widest));
      expect(played.map((p) => p.webmidi)).toEqual(played.map((p) => p.jambot));
      expect(webmidi.bound).toBe(jambot.bound);
      jumps.push({ webmidi: webmidi.jumps, jambot: jambot.jumps });
    }
    // The 9 jumps of each, and restarts on the blips: one of those (seed 5,
    // reading 683) moved the offset by 0.16 ms, less than the slew, and is
    // not counted (`output-estimate.ts`).
    expect(jumps.map((j) => j.jambot)).toEqual([11, 11, 9, 12, 11]);
    expect(jumps.map((j) => j.webmidi)).toEqual([11, 11, 9, 12, 10]);
  });

  it('follows a jump wider than 50 ms after 1 reading, where Jambot waited for 3', () => {
    const offsets = [...Array<number>(20).fill(0.5), ...Array<number>(20).fill(0.42)];
    const { played, webmidi, jambot } = bothOver(offsets);
    expect(
      followedAfter(
        played.map((p) => p.webmidi),
        20,
        0.42,
      ),
    ).toBe(1);
    expect(
      followedAfter(
        played.map((p) => p.jambot),
        20,
        0.42,
      ),
    ).toBe(OUTPUT.confirm);
    expect(OUTPUT.confirm).toBe(3);
    expect([webmidi.jumps, jambot.jumps]).toEqual([1, 1]);
  });

  it('follows a jump of up to 50 ms after 3 readings, as Jambot did: a dropped buffer', () => {
    for (const jump of [0.0107, 0.04]) {
      const offsets = [...Array<number>(20).fill(0.5), ...Array<number>(20).fill(0.5 - jump)];
      const { played } = bothOver(offsets);
      expect(
        followedAfter(
          played.map((p) => p.webmidi),
          20,
          0.5 - jump,
        ),
      ).toBe(3);
      expect(played.map((p) => p.webmidi)).toEqual(played.map((p) => p.jambot));
    }
  });
});

/** A buffer of 512 frames at 48 kHz. */
const BUFFER = 512 / 48000;

describe("the output pair's estimate the timing panel shows (#27)", () => {
  // Every scene of `clock-offset.test.ts`, the buffers dropped again and again among them.
  const scenes: Record<string, [DeviceFaults, boolean]> = {
    'no fault': [{}, true],
    'drift, 100 ppm': [{ drift: 100 }, true],
    "the pairing's blips": [
      { pairingJitter: 0.0004, pairingBlips: { share: 0.05, size: 0.004 } },
      true,
    ],
    'six dropped buffers': [
      { drops: Array.from({ length: 6 }, (_, i) => ({ at: 2 + i * 1.7, lost: BUFFER })) },
      true,
    ],
    'six dropped buffers, with no pairing': [
      { drops: Array.from({ length: 6 }, (_, i) => ({ at: 2 + i * 1.7, lost: BUFFER })) },
      false,
    ],
    'the render quantum, with no pairing': [{ quantum: 128 / 48000 }, false],
  };
  for (const [name, [faults, paired]] of Object.entries(scenes))
    it(`counts the jumps followed and gives the bound as Jambot's estimate did, every tick: ${name}`, () => {
      const d = simulatedDevice({ latency: 0.03, pageOrigin: -12, seed: 3, ...faults });
      let t = 0;
      const { clock, now } = d.view(() => t, { paired });
      const webmidi = estimatedOffset(clock, now);
      const jambot = jambotOffset(clock, now);
      for (t = 0.3; t < 12; t += 0.025) {
        webmidi.update();
        jambot.update();
        if (jambot.estimate.offset !== null) expect(webmidi.estimate).toEqual(jambot.estimate);
      }
      expect(webmidi.estimate.jumps).toBe(faults.drops?.length ?? 0);
    });

  it('counts a hold of 80 ms as one jump, as the timing panel counted it', () => {
    const offsets = [...Array<number>(20).fill(0.5), ...Array<number>(20).fill(0.42)];
    const readings = pairedReadings(offsets);
    const webmidi = estimatedOffset(readings.clock, readings.now);
    readings.each(() => webmidi.update());
    expect(webmidi.estimate).toEqual({
      offset: expect.closeTo(0.42, 12),
      bound: OUTPUT.paired,
      jumps: 1,
    });
  });

  it('has no estimate before its offset is trusted', () => {
    const readings = pairedReadings([0.5, 0.5]);
    const webmidi = estimatedOffset(readings.clock, readings.now);
    expect(webmidi.estimate).toEqual({ offset: null, bound: null, jumps: 0 });
  });
});
