import { lawBreaks } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { CLOCK, type ClockReading, type Ping, hostClock } from './clock.ts';

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
    step = { at: Infinity, by: 0 },
  } = {},
): { pings: Ping[]; offsetAt: (t: number) => number } {
  const draw = draws(seed);
  const offsetAt = (t: number) => offset + drift * t + (t >= step.at ? step.by : 0);
  const list: Ping[] = [];
  for (let i = 0; i < count; i++) {
    const sent = i * 0.25;
    const hold = () => (draw() < 0.3 ? draw() * jitter : 0);
    const arrives = sent + there + hold();
    const host = arrives + offsetAt(arrives);
    const received = arrives + back + hold();
    list.push({ sent, received, host });
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

  it('drops a ping that came back before it was sent, where the clock stepped', () => {
    const { pings: list } = pings(20);
    // As an output first pairs its clock, a ping reads 7 ms quicker than
    // light, and 16 ms off; it must not become the one trusted.
    const stepped = [{ sent: 0.0095, received: 0.0028, host: 5 + 0.006 - 0.016 }, ...list];
    for (const r of read(stepped).slice(CLOCK.ready + 1))
      expect(Math.abs(r.offset! - 5)).toBeLessThan(0.001);
    expect(read(stepped)[0]).toEqual({ offset: null, trip: null, tooFar: false });
  });

  it('follows a clock that steps by a buffer within two pings, as an output that drops one does', () => {
    // At 5 s one side's output loses a 10 ms buffer, so the clocks move
    // apart by 10 ms at once. Slewing that back would leave the band 10 ms
    // out for seconds.
    const { pings: list } = pings(40, { step: { at: 5, by: -0.01 } });
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

  it('sets its offset right when its first pings were read while a clock was still stepping', () => {
    const { pings: list } = pings(30, { step: { at: 1.1, by: -0.009 } });
    const readings = read(list);
    // Trusted after 4 pings at 5.000, then the clocks settle 9 ms apart.
    const after = list.findIndex((p) => p.sent >= 1.1);
    expect(readings[CLOCK.ready - 1]!.offset).toBeCloseTo(5, 3);
    for (const r of readings.slice(after + 2))
      expect(Math.abs(r.offset! - 4.991)).toBeLessThan(0.001);
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
