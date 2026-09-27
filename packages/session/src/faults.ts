/**
 * Clocks with their faults made explicit, for testing everything that reads
 * a clock (#27).
 *
 * Real time is the world's, in seconds, and nothing under test reads it. A
 * device has an output, whose clock reads 0 when it starts and then runs
 * fast or slow by its drift, moving in render quanta. When the output drops
 * a buffer its clock stands still for as long as the buffer, so from then
 * on everything scheduled on it sounds that much later: the clock has lost
 * time, and a clock read against it (the page's, another device's) has
 * jumped. What is heard lags the clock by the output's latency. The page
 * has a clock of its own, `performance.now()`, which the platform pairs
 * with the output's (`getOutputTimestamp`). Measured in headless Chromium,
 * a reading of the pairing is off by a few tenths of a millisecond at most,
 * but on a busy machine some readings blip by a few milliseconds and the
 * next is back: the kit has both, as jitter on every reading and blips on
 * a share of them. A reading pairs the two clocks at one moment, so it
 * carries no render quantum: only `currentTime` moves by quanta, and a
 * reader of the pairing meets the quantum only where the platform has no
 * pairing and it falls back on `currentTime`.
 *
 * A link between two devices carries a message each way in at least that
 * leg's time; some messages are held up by up to its jitter, and some are
 * lost. A page's main thread can stall, and what it would have done in a
 * stall it does when the stall ends.
 *
 * Every fault is off unless given, so a test names exactly the faults it
 * runs under, and every draw is keyed (`keyedRandom`), so a run replays.
 */

import { chance, keyedRandom } from '@jambot/engine';
import type { Ping } from './clock.ts';

/** From real time `at`, the output's clock stands still for `lost` seconds: a buffer dropped. */
export interface Drop {
  readonly at: number;
  readonly lost: number;
}

/** From real time `at` to `at + for`, a page's main thread does nothing. */
export interface Stall {
  readonly at: number;
  readonly for: number;
}

export interface DeviceFaults {
  /** The real time the output starts, when its clock reads 0. A drop before it drops nothing. */
  readonly started?: number;
  /** How many parts per million the output's clock runs fast; slow if negative. */
  readonly drift?: number;
  /** The buffers the output drops. */
  readonly drops?: readonly Drop[];
  /** The render quantum, in seconds: `currentTime` moves by whole quanta. */
  readonly quantum?: number;
  /** How far behind the output's clock what is heard is, in seconds. */
  readonly latency?: number;
  /** The real time at which the page's clock read 0. */
  readonly pageOrigin?: number;
  /** The most a reading of the pairing is off, either way, in seconds. */
  readonly pairingJitter?: number;
  /** A share of the pairing's readings, from 0 to 1, that are off by up to `size` seconds more, either way. */
  readonly pairingBlips?: { readonly share: number; readonly size: number };
  /** The stalls of the page's main thread. */
  readonly stalls?: readonly Stall[];
  readonly seed?: number;
}

/** A pairing of the output's clock with the page's, as `getOutputTimestamp` gives one. */
export interface Pairing {
  readonly contextTime: number;
  readonly performanceTime: number;
}

/** What the app reads on a device, as real time moves on. */
export interface DeviceView {
  /** The output's clock, as `Output` and `OutputClock` read it. */
  readonly clock: {
    readonly currentTime: number;
    readonly latency: number;
    /** The pairing, where the platform gives one. */
    outputTimestamp?(): Pairing;
  };
  /** The page's clock, in milliseconds. */
  now(): number;
}

export interface SimulatedDevice {
  readonly faults: DeviceFaults;
  /** The output's clock at real time `t`, as `currentTime` reads it. */
  currentTime(t: number): number;
  /** The moment on the output's clock being heard at real time `t`. */
  heard(t: number): number;
  /** The real time at which the moment `seconds` on the output's clock is heard: `heard`'s inverse. */
  heardAt(seconds: number): number;
  /** The page's clock at real time `t`, in milliseconds. */
  pageNow(t: number): number;
  /** The platform's pairing at real time `t`: zeros before the output starts. */
  pairing(t: number): Pairing;
  /** The moment heard at real time `t` as the pairing reads it, which `heardNow` gives. */
  heardNow(t: number): number;
  /** When the page does what it would have done at real time `t`: at once, or when a stall ends. */
  woken(t: number): number;
  /**
   * The device as the app reads it, at whatever real time `time` says it
   * is: on a platform that pairs its clocks, or, with `paired` false, one
   * that gives no pairing.
   */
  view(time: () => number, options?: { paired?: boolean }): DeviceView;
}

/** A device whose clocks have the faults given, and no others. */
export function simulatedDevice(faults: DeviceFaults = {}): SimulatedDevice {
  const {
    started = 0,
    drift = 0,
    quantum = 0,
    latency = 0,
    pageOrigin = 0,
    pairingJitter = 0,
    seed = 1,
  } = faults;
  const drops = (faults.drops ?? []).filter((d) => d.at >= started).sort((a, b) => a.at - b.at);
  const stalls = [...(faults.stalls ?? [])].sort((a, b) => a.at - b.at);
  const rate = 1 + drift * 1e-6;
  /** The output's clock, not yet in quanta. */
  const running = (t: number) => {
    let elapsed = Math.max(0, t - started);
    for (const d of drops) elapsed -= Math.min(Math.max(t - d.at, 0), d.lost);
    return Math.max(0, elapsed) * rate;
  };
  const blips = faults.pairingBlips ?? { share: 0, size: 0 };
  const jitter = (t: number) => {
    const draw = (stream: number) => keyedRandom(seed, Math.round(t * 1e6), stream);
    const blip = chance(draw(2), blips.share) ? blips.size * (2 * draw(3) - 1) : 0;
    return pairingJitter * (2 * draw(1) - 1) + blip;
  };
  const self: SimulatedDevice = {
    faults,
    currentTime: (t) => (quantum > 0 ? Math.floor(running(t) / quantum) * quantum : running(t)),
    heard: (t) => running(t) - latency,
    heardAt(seconds) {
      let t = started + (seconds + latency) / rate;
      for (const d of drops) if (d.at < t) t += d.lost;
      return t;
    },
    pageNow: (t) => (t - pageOrigin) * 1000,
    pairing(t) {
      if (t <= started) return { contextTime: 0, performanceTime: 0 };
      return {
        contextTime: Math.max(0, self.heard(t)),
        performanceTime: self.pageNow(t) + jitter(t) * 1000,
      };
    },
    heardNow(t) {
      const p = self.pairing(t);
      return p.contextTime + (self.pageNow(t) - p.performanceTime) / 1000;
    },
    woken(t) {
      for (const s of stalls) if (t >= s.at && t < s.at + s.for) return s.at + s.for;
      return t;
    },
    view(time, { paired = true } = {}) {
      const clock: DeviceView['clock'] = {
        get currentTime() {
          return self.currentTime(time());
        },
        latency,
        ...(paired && { outputTimestamp: () => self.pairing(time()) }),
      };
      return { clock, now: () => self.pageNow(time()) };
    },
  };
  return self;
}

export interface LinkFaults {
  /** The least time, in seconds, a message takes from client to host. */
  readonly there?: number;
  /** The least time, in seconds, a message takes back. */
  readonly back?: number;
  /** The most a message is held up beyond its leg's time, in seconds. */
  readonly jitter?: number;
  /** The share of messages held up, from 0 to 1: every one, unless given. */
  readonly held?: number;
  /** The share of messages lost, from 0 to 1. */
  readonly loss?: number;
  readonly seed?: number;
}

/** How long message `index` takes on a leg, or null where it is lost. */
export function linkDelay(faults: LinkFaults, leg: 'there' | 'back', index: number): number | null {
  const { there = 0, back = 0, jitter = 0, held = 1, loss = 0, seed = 1 } = faults;
  const way = leg === 'there' ? 0 : 1;
  const draw = (stream: number) => keyedRandom(seed, index, way, stream);
  if (chance(draw(0), loss)) return null;
  const hold = chance(draw(1), held) ? draw(2) * jitter : 0;
  return (leg === 'there' ? there : back) + hold;
}

/** A ping answered, where it happened in real time, and the offset its answer should have read. */
export interface PingRun {
  readonly ping: Ping;
  /** When the client sent it and read the answer, in real time. */
  readonly sentAt: number;
  readonly receivedAt: number;
  /** The true offset, the host's moment heard less the client's, when the answer was read. */
  readonly offset: number;
}

/**
 * A client's pings to a host, one at each real time given, over the link:
 * each stamped as the pairing reads the moment heard, on the client as it
 * sends and reads the answer and on the host as it answers, where a stall
 * of either page holds it up. Lost ones never come back. The rest are in the
 * order their answers were read, which the link's jitter may shuffle.
 */
export function pingsBetween(
  client: SimulatedDevice,
  host: SimulatedDevice,
  link: LinkFaults,
  times: readonly number[],
): PingRun[] {
  const runs: PingRun[] = [];
  times.forEach((sentAt, i) => {
    const there = linkDelay(link, 'there', i);
    const back = linkDelay(link, 'back', i);
    if (there === null || back === null) return;
    const answeredAt = host.woken(sentAt + there);
    const receivedAt = client.woken(answeredAt + back);
    runs.push({
      ping: {
        sent: client.heardNow(sentAt),
        received: client.heardNow(receivedAt),
        host: host.heardNow(answeredAt),
      },
      sentAt,
      receivedAt,
      offset: host.heard(receivedAt) - client.heard(receivedAt),
    });
  });
  return runs.sort((a, b) => a.receivedAt - b.receivedAt);
}

/** A tick of a page's scheduler: when it ran in real time, and the output's clock it read. */
export interface PageTick {
  readonly at: number;
  readonly now: number;
}

/**
 * A page's ticks from `from` to `to`, `every` seconds apart as a Worker
 * sends them, each reading the output's clock. A tick due in a stall runs
 * when the stall ends, once however many were due.
 */
export function ticksOf(
  device: SimulatedDevice,
  from: number,
  to: number,
  every = 0.025,
): PageTick[] {
  const ticks: PageTick[] = [];
  for (let i = 0; from + i * every < to; i++) {
    const at = device.woken(from + i * every);
    if (ticks.length > 0 && at <= ticks.at(-1)!.at) continue;
    ticks.push({ at, now: device.currentTime(at) });
  }
  return ticks;
}
