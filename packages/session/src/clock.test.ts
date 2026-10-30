import { lawBreaks } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  CLOCK,
  type ClockReading,
  OUTPUT,
  type PairConfig,
  type Ping,
  type Sample,
  clockPair,
  hostClock,
  outputClock,
  pairingSample,
  skewOf,
  unpairedSample,
} from './clock.ts';

/** A keyed stand-in for chance. */
function draws(seed: number) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 2 ** 32;
  };
}

/**
 * Pings every 250 ms from a client whose clock reads `offset` less than the
 * host's, which drifts by `drift` seconds a second, over legs that take
 * `there` and `back` seconds and are held up by up to `jitter` more.
 */
function pings(
  count: number,
  {
    offset = 5,
    drift = 0,
    there = 0.002,
    back = 0.002,
    jitter = 0.01,
    seed = 1,
    jump = { at: Infinity, by: 0 },
  } = {},
): { pings: Ping[]; offsetAt: (t: number) => number } {
  const draw = draws(seed);
  const offsetAt = (t: number) => offset + drift * t + (t >= jump.at ? jump.by : 0);
  const list: Ping[] = [];
  for (let i = 0; i < count; i++) {
    const sent = i * 0.25;
    const hold = () => (draw() < 0.3 ? draw() * jitter : 0);
    const arrives = sent + there + hold();
    const host = arrives + offsetAt(arrives);
    const received = arrives + back + hold();
    list.push({ sent, received, host, heard: null });
  }
  return { pings: list, offsetAt };
}

function read(list: readonly Ping[]): ClockReading[] {
  let carried = hostClock.initial;
  return list.map((ping) => {
    const next = hostClock.advance(null, carried, ping);
    carried = next.carried;
    return next.output;
  });
}

describe("the host's clock, as a client reads it", () => {
  it('is not trusted before enough pings', () => {
    const readings = read(pings(CLOCK.ready).pings);
    expect(readings.slice(0, -1).map((r) => r.offset)).toEqual(Array(CLOCK.ready - 1).fill(null));
    expect(readings.at(-1)!.offset).not.toBeNull();
  });

  it('finds the offset to within a millisecond over held-up pings', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { pings: list } = pings(40, { seed, jitter: 0.03 });
      for (const r of read(list).slice(CLOCK.window))
        expect(Math.abs(r.offset! - 5)).toBeLessThan(0.001);
    }
  });

  it('follows drift, and never moves the offset played by more than the slew on a ping', () => {
    // 100 ppm, far more than two sound cards drift apart.
    const { pings: list, offsetAt } = pings(400, { drift: 1e-4 });
    const readings = read(list);
    for (const [i, r] of readings.entries()) {
      if (i < CLOCK.ready) continue;
      expect(Math.abs(r.offset! - readings[i - 1]!.offset!)).toBeLessThanOrEqual(
        CLOCK.slew + 1e-12,
      );
    }
    expect(Math.abs(readings.at(-1)!.offset! - offsetAt(list.at(-1)!.sent))).toBeLessThan(0.001);
  });

  it('is off by half the difference when one leg is always longer: what no ping can see', () => {
    const { pings: list } = pings(40, { there: 0.012, back: 0.002, jitter: 0 });
    expect(read(list).at(-1)!.offset).toBeCloseTo(5 + (0.012 - 0.002) / 2, 9);
  });

  it('drops a ping that came back before it was sent, where the clock jumped', () => {
    const { pings: list } = pings(20);
    // As an output first pairs its clock, a ping reads 7 ms quicker than
    // light, and 16 ms off; it must not become the one trusted.
    const jumped = [
      { sent: 0.0095, received: 0.0028, host: 5 + 0.006 - 0.016, heard: null },
      ...list,
    ];
    for (const r of read(jumped).slice(CLOCK.ready + 1))
      expect(Math.abs(r.offset! - 5)).toBeLessThan(0.001);
    expect(read(jumped)[0]).toEqual({
      offset: null,
      trip: null,
      tooFar: false,
      heard: null,
      jumps: 0,
    });
  });

  it('follows a clock that jumps by a buffer within two pings, as an output that drops one does', () => {
    // At 5 s one side's output loses a 10 ms buffer, so the clocks move
    // apart by 10 ms at once. Slewing that back would leave the band 10 ms
    // out for seconds.
    const { pings: list } = pings(40, { jump: { at: 5, by: -0.01 } });
    const readings = read(list);
    const after = list.findIndex((p) => p.sent >= 5);
    for (const r of readings.slice(after + 2))
      expect(Math.abs(r.offset! - 4.99)).toBeLessThan(0.001);
    for (const r of readings.slice(CLOCK.ready, after))
      expect(Math.abs(r.offset! - 5)).toBeLessThan(0.001);
  });

  it('keeps its offset through one ping that disagrees, which a second has to confirm', () => {
    const { pings: list } = pings(30, { jitter: 0 });
    // One ping reads 10 ms off with a quick round trip; the next ones don't.
    list[20] = { ...list[20]!, host: list[20]!.host - 0.01 };
    for (const r of read(list).slice(CLOCK.ready))
      expect(Math.abs(r.offset! - 5)).toBeLessThan(0.0005);
  });

  it('sets its offset right when its first pings were read while a clock was still jumping', () => {
    const { pings: list } = pings(30, { jump: { at: 1.1, by: -0.009 } });
    const readings = read(list);
    // Trusted after 4 pings at 5.000, then the clocks settle 9 ms apart.
    const after = list.findIndex((p) => p.sent >= 1.1);
    expect(readings[CLOCK.ready - 1]!.offset).toBeCloseTo(5, 3);
    for (const r of readings.slice(after + 2))
      expect(Math.abs(r.offset! - 4.991)).toBeLessThan(0.001);
  });

  it('puts its offset within a quicker ping at once, where the first pings were slow one way (#509)', () => {
    // A busy host starting up: its first answers come back 16 ms late, which
    // reads the offset 8 ms out, within those pings' 9 ms bounds. Then a quick
    // ping bounds it to 1 ms, and a page clock doesn't jump: the offset is
    // there from that ping on, not slewed there over seconds.
    const { pings: list } = pings(20, { jitter: 0 });
    const slow = list.map((p, i) => (i < CLOCK.ready ? { ...p, received: p.received + 0.016 } : p));
    const readings = read(slow);
    expect(readings[CLOCK.ready - 1]!.offset).toBeCloseTo(4.992, 6);
    for (const r of readings.slice(CLOCK.ready))
      expect(Math.abs(r.offset! - 5)).toBeLessThanOrEqual(0.002 + 1e-12);
  });

  it('finds a host too far away when even its best round trip is long', () => {
    expect(read(pings(20, { there: 0.03, back: 0.03 }).pings).at(-1)!.tooFar).toBe(false);
    expect(read(pings(20, { there: 0.06, back: 0.06 }).pings).at(-1)!.tooFar).toBe(true);
    // A single quick ping in the window is enough to stay.
    const slow = pings(20, { there: 0.06, back: 0.06 }).pings;
    slow[15] = { ...slow[15]!, received: slow[15]!.sent + 0.01, host: slow[15]!.sent + 0.005 + 5 };
    expect(read(slow).at(-1)!.tooFar).toBe(false);
  });

  it('keeps the machine laws (F1)', () => {
    const script = pings(30, { drift: 1e-4 }).pings.map((input) => ({ env: null, input }));
    expect(lawBreaks(hostClock, script)).toEqual([]);
  });
});

/** A pair's estimates over samples. */
function estimates(config: PairConfig, samples: readonly Sample[]) {
  const pair = clockPair(config);
  let carried = pair.initial;
  return samples.map((sample) => {
    const next = pair.advance(null, carried, sample);
    carried = next.carried;
    return next.output;
  });
}

const PAIR: PairConfig = {
  window: 8,
  ready: 2,
  slew: 0.0001,
  jumped: 0.001,
  confirm: 2,
  bounded: false,
};
const at = (offset: number, bound = 0.0005): Sample => ({ offset, bound });

describe('a pair of clocks', () => {
  it('is trusted after `ready` samples, at the sample of least bound, the latest of equals', () => {
    const read = estimates(PAIR, [at(1.0002, 0.002), at(1, 0.0005), at(1.0001, 0.0005)]);
    expect(read.map((r) => r.offset === null)).toEqual([true, false, false]);
    expect(read[1]!.offset).toBe(1);
    expect(read[1]!.bound).toBe(0.0005);
    // The latest of equals is trusted, and the offset slews toward it.
    expect(read[2]!.offset).toBeCloseTo(1.0001, 12);
  });

  it('follows a jump two samples confirm, and counts it', () => {
    const before = Array.from({ length: 6 }, () => at(1));
    const read = estimates(PAIR, [...before, at(0.99), at(0.99), at(0.99)]);
    expect(read[6]!.offset).toBe(1);
    expect(read[7]!.offset).toBe(0.99);
    expect(read[7]!.jumps).toBe(1);
    expect(read[8]!.jumps).toBe(1);
  });

  it('drops a sample alone against the rest, as a blip of the pairing', () => {
    const read = estimates(PAIR, [at(1), at(1), at(1.004), at(1), at(1)]);
    expect(read.slice(1).map((r) => r.offset)).toEqual([1, 1, 1, 1]);
    expect(read.at(-1)!.jumps).toBe(0);
  });

  it('slews a jump inside its resolution, by at most `slew` a sample', () => {
    // 1.5 ms: within two bounds of 0.5 ms and the 1 ms `jumped`.
    const read = estimates(PAIR, [at(1), at(1), ...Array.from({ length: 20 }, () => at(0.9985))]);
    for (const [i, r] of read.entries())
      if (i > 1)
        expect(Math.abs(r.offset! - read[i - 1]!.offset!)).toBeLessThanOrEqual(1e-4 + 1e-12);
    expect(read.at(-1)!.offset).toBeCloseTo(0.9985, 9);
    expect(read.at(-1)!.jumps).toBe(0);
  });

  it('keeps the offset within the trusted sample where its bounds are sure, and slews to it where not', () => {
    // A wide first estimate 5 ms out, then a narrow sample that agrees with it.
    const samples = [at(1.005, 0.006), at(1.005, 0.006), at(1, 0.0005)];
    const slewed = estimates(PAIR, samples);
    const held = estimates({ ...PAIR, bounded: true }, samples);
    expect(slewed[2]!.offset).toBeCloseTo(1.0049, 12);
    expect(held[2]!.offset).toBeCloseTo(1.0005, 12);
    expect(held[2]!.jumps).toBe(0);
  });

  it('reads nothing from a sample with no bound, or a negative one', () => {
    const read = estimates(PAIR, [at(1), at(5, NaN), at(5, -1), at(1)]);
    expect(read.map((r) => r.offset)).toEqual([null, null, null, 1]);
  });

  it('keeps the machine laws (F1)', () => {
    const samples = [at(1), at(1.0003), at(0.99), at(0.99), at(0.9901, 0.002)];
    expect(
      lawBreaks(
        clockPair(PAIR),
        samples.map((input) => ({ env: null, input })),
      ),
    ).toEqual([]);
  });
});

describe("a device's output against its page", () => {
  it('reads a pairing as the moment heard less the page clock, to its bound', () => {
    expect(pairingSample(2, 7010)).toEqual({ offset: 2 - 7.01, bound: OUTPUT.paired });
    expect(unpairedSample(3, 0.04, 1000)).toEqual({ offset: 3 - 0.04 - 1, bound: OUTPUT.unpaired });
  });

  it('follows a dropped buffer within three samples, and drops blips, even two in a row', () => {
    const buffer = 512 / 48000;
    const read = estimates(OUTPUT, [
      ...Array.from({ length: 8 }, () => pairingSample(1, 0)),
      pairingSample(1.004, 0),
      pairingSample(1, 0),
      pairingSample(1.003, 0),
      pairingSample(1.0035, 0),
      pairingSample(1, 0),
      pairingSample(1 - buffer, 0),
      pairingSample(1 - buffer, 0),
      pairingSample(1 - buffer, 0),
    ]);
    expect(read.slice(8, 13).map((r) => r.offset)).toEqual([1, 1, 1, 1, 1]);
    expect(read[14]!.offset).toBe(1);
    expect(read[15]!.offset).toBeCloseTo(1 - buffer, 12);
    expect(read[15]!.jumps).toBe(1);
    expect(outputClock.initial.offset).toBeNull();
  });
});

describe("a client's clock composed from three pairs", () => {
  it("carries the host's output offset from the latest answer that has one", () => {
    let carried = hostClock.initial;
    const heard = [null, 0.03, null, 0.02];
    const read = heard.map((h, i) => {
      const next = hostClock.advance(null, carried, {
        sent: i,
        received: i + 0.002,
        host: 10 + i + 0.001,
        heard: h,
      });
      carried = next.carried;
      return next.output.heard;
    });
    expect(read).toEqual([null, 0.03, 0.03, 0.02]);
  });

  it("is the network's offset, plus the host's output offset, less the client's", () => {
    const reading: ClockReading = { offset: 10, trip: 0.002, tooFar: false, heard: 0.03, jumps: 0 };
    expect(skewOf(reading, 0.05)).toBeCloseTo(9.98, 12);
    expect(skewOf(reading, null)).toBeNull();
    expect(skewOf({ ...reading, heard: null }, 0.05)).toBeNull();
    expect(skewOf({ ...reading, offset: null }, 0.05)).toBeNull();
  });
});
