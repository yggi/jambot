import {
  BAR_STEPS,
  INITIAL_STYLE,
  PRESETS,
  LOOKAHEAD,
  type Machine,
  type ScheduledStep,
  type TimedEvent,
  type TransportEnv,
  type TransportOutput,
  holding,
  transport,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  type ClockReading,
  OUTPUT,
  type PairEstimate,
  type Ping,
  type Sample,
  clockPair,
  hostClock,
  outputClock,
  pairingSample,
  skewOf,
} from './clock.ts';
import {
  type Drop,
  type SimulatedDevice,
  type DeviceFaults,
  type LinkFaults,
  type PingRun,
  type PageTick,
  linkDelay,
  orderedArrival,
  simulatedDevice,
  pingsBetween,
  ticksOf,
} from './faults.ts';

const range = (n: number) => [...Array(n).keys()];

/** A buffer of 512 frames at 48 kHz, as an output drops one. */
const BUFFER = 512 / 48000;
/** Chromium's render quantum at 48 kHz. */
const QUANTUM = 128 / 48000;
/**
 * The pairing's jitter, and its blips on a busy machine: in headless
 * Chromium, 1 in 100 readings was off by more than 0.4 ms, and on a busy
 * run a blip of up to 4 ms came back on the next reading.
 */
const PAIRING_JITTER = 0.0004;
const PAIRING_BLIPS = { share: 0.05, size: 0.004 };

describe('a device with faults', () => {
  it('runs its output clock from when it starts, at the rate its drift gives', () => {
    const d = simulatedDevice({ started: 2, drift: 100 });
    expect(d.currentTime(1)).toBe(0);
    expect(d.currentTime(12)).toBeCloseTo(10 * (1 + 1e-4), 12);
  });

  it('stands its clock still for as long as a dropped buffer, so it loses that much for good', () => {
    const d = simulatedDevice({ drops: [{ at: 5, lost: BUFFER }] });
    expect(d.currentTime(5)).toBe(5);
    expect(d.currentTime(5 + BUFFER / 2)).toBe(5);
    expect(d.currentTime(20)).toBeCloseTo(20 - BUFFER, 12);
    // A drop before the output starts drops nothing: its clock isn't running.
    const early = simulatedDevice({ started: 2, drops: [{ at: 1, lost: 0.5 }] });
    expect(early.currentTime(5)).toBe(3);
    expect(early.heardAt(3)).toBe(5);
  });

  it('moves its clock by whole render quanta', () => {
    const d = simulatedDevice({ quantum: QUANTUM });
    for (const t of [0.001, 0.5, 3.14159, 60])
      expect(d.currentTime(t) / QUANTUM).toBeCloseTo(Math.round(d.currentTime(t) / QUANTUM), 9);
    expect(0.5 - d.currentTime(0.5)).toBeLessThan(QUANTUM);
  });

  it('hears each moment of its clock its latency later, which heardAt inverts through drift and drops', () => {
    const d = simulatedDevice({
      started: 0.3,
      drift: -80,
      latency: 0.03,
      drops: [{ at: 4, lost: BUFFER }],
    });
    for (const t of [0.5, 3.9, 4.2, 10]) expect(d.heardAt(d.heard(t))).toBeCloseTo(t, 9);
    // A moment scheduled after the drop sounds a buffer later than it would have.
    const clean = simulatedDevice({ started: 0.3, drift: -80, latency: 0.03 });
    expect(d.heardAt(8) - clean.heardAt(8)).toBeCloseTo(BUFFER, 9);
    expect(d.heardAt(2)).toBeCloseTo(clean.heardAt(2), 12);
  });

  it('pairs its output clock with its page clock, off by its jitter, and by a blip on a share of readings', () => {
    const errors = (faults: DeviceFaults) => {
      const d = simulatedDevice({ pageOrigin: -3, latency: 0.02, seed: 4, ...faults });
      return range(2000).map((i) =>
        Math.abs(d.heardNow(0.1 + i * 0.025) - d.heard(0.1 + i * 0.025)),
      );
    };
    const jittered = errors({ pairingJitter: PAIRING_JITTER });
    expect(Math.max(...jittered)).toBeLessThanOrEqual(PAIRING_JITTER + 1e-12);
    expect(Math.max(...jittered)).toBeGreaterThan(PAIRING_JITTER / 2);
    const blipped = errors({ pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS });
    const blips = blipped.filter((e) => e > PAIRING_JITTER);
    expect(blips.length / blipped.length).toBeGreaterThan(0.02);
    expect(blips.length / blipped.length).toBeLessThan(0.05);
    expect(Math.max(...blipped)).toBeLessThanOrEqual(PAIRING_JITTER + PAIRING_BLIPS.size + 1e-12);
    const d = simulatedDevice({ pageOrigin: -3 });
    expect(d.pageNow(0)).toBe(3000);
    expect(simulatedDevice({ started: 1 }).pairing(0.5)).toEqual({
      contextTime: 0,
      performanceTime: 0,
    });
  });

  it('does what a stall held up when the stall ends, and ticks once for all the ticks it missed', () => {
    const d = simulatedDevice({ stalls: [{ at: 1, for: 0.3 }] });
    expect(d.woken(0.9)).toBe(0.9);
    expect(d.woken(1.1)).toBe(1.3);
    const ticks = ticksOf(d, 0.9, 1.5);
    expect(ticks.map((t) => t.at).filter((t) => t >= 1 && t < 1.3)).toEqual([]);
    expect(ticks.filter((t) => t.at === 1.3)).toHaveLength(1);
  });

  it('carries messages a leg at least its time, holds its share up by at most its jitter, and loses its share', () => {
    const link: LinkFaults = {
      there: 0.004,
      back: 0.001,
      jitter: 0.03,
      held: 0.3,
      loss: 0.2,
      seed: 9,
    };
    const there = range(2000).map((i) => linkDelay(link, 'there', i));
    const kept = there.filter((d) => d !== null);
    expect(kept.length / there.length).toBeCloseTo(0.8, 1);
    expect(Math.min(...kept)).toBe(0.004);
    expect(Math.max(...kept)).toBeLessThanOrEqual(0.034);
    expect(Math.max(...kept)).toBeGreaterThan(0.03);
    expect(linkDelay({ there: 0.004 }, 'there', 7)).toBe(0.004);
    // Given jitter and no share, every message is held up.
    const held = range(200).map((i) => linkDelay({ there: 0.004, jitter: 0.03 }, 'there', i)!);
    expect(held.every((d) => d > 0.004)).toBe(true);
  });

  it('keeps a stream in order: a message lost is sent again after the recovery, doubled each time, and those behind it wait', () => {
    const quick: LinkFaults = { there: 0.004 };
    expect(orderedArrival(quick, 0.2, 0, 1, 0)).toBeCloseTo(1.004, 12);
    // Behind a message that arrives later, a message waits for it.
    expect(orderedArrival(quick, 0.2, 1, 1.01, 1.3)).toBe(1.3);
    // Over a lossy link, each arrival is its leg plus 0, 1, 3, 7 … recoveries:
    // 2^k − 1 for k losses in a row.
    const lossy: LinkFaults = { there: 0.004, loss: 0.3, seed: 4 };
    const waits = range(400).map((i) => orderedArrival(lossy, 0.2, i, 0, 0) - 0.004);
    const recoveries = waits.map((w) => Math.round(w / 0.2));
    for (const r of recoveries) expect(Number.isInteger(Math.log2(r + 1))).toBe(true);
    expect(new Set(recoveries).size).toBeGreaterThan(3);
    for (const [i, w] of waits.entries()) expect(w).toBeCloseTo(recoveries[i]! * 0.2, 12);
    expect(recoveries.filter((r) => r === 0).length / 400).toBeCloseTo(0.7, 1);
  });

  it("stamps a ping with each side's page clock, carries what the host says it hears, and knows the offset it should read", () => {
    const client = simulatedDevice({ pageOrigin: 1, started: 0.2 });
    const host = simulatedDevice({ pageOrigin: 5, started: 3 });
    const [run] = pingsBetween(client, host, { there: 0.01, back: 0.002 }, [10], (t) => t / 100);
    expect(run!.ping.sent).toBeCloseTo(9, 12);
    expect(run!.ping.host).toBeCloseTo(5.01, 12);
    expect(run!.ping.received).toBeCloseTo(9.012, 12);
    expect(run!.ping.heard).toBeCloseTo(0.1001, 12);
    expect(run!.answeredAt).toBeCloseTo(10.01, 12);
    expect(run!.offset).toBeCloseTo(-4, 9);
  });
});

/** Two devices and the link between them, under some faults. */
interface Scene {
  readonly client?: DeviceFaults;
  readonly host?: DeviceFaults;
  readonly link?: LinkFaults;
}

/**
 * Each fault #27 lists for a client's clock, alone, and all at once. The
 * render quantum is not among them: it reaches only `currentTime`, and a
 * device's output pair reads the pairing, so it is a scene of the
 * transport's and of the fallbacks that read `currentTime`
 * (`clock-offset.test.ts`).
 */
const SCENES: Record<string, Scene> = {
  'no fault': {},
  'drift, 100 ppm each way': { client: { drift: 100 }, host: { drift: -100 } },
  'a buffer dropped on the client': { client: { drops: [{ at: 6, lost: BUFFER }] } },
  'a buffer dropped on the host': { host: { drops: [{ at: 6, lost: BUFFER }] } },
  'buffers dropped as the first pings are read': {
    client: { drops: [{ at: 0.35, lost: BUFFER }] },
    host: { drops: [{ at: 0.6, lost: BUFFER }] },
  },
  'buffers dropped again and again': {
    client: { drops: range(6).map((i) => ({ at: 2 + i * 1.7, lost: BUFFER })) },
  },
  // Each device's output pair reads the pairing, good to half a
  // millisecond, so a jump of 4.5 ms is well past its resolution.
  'a jump of 4.5 ms on the host, on a quick link': {
    host: { drops: [{ at: 6.1, lost: 0.0045 }] },
    link: { there: 0.001, back: 0.001 },
  },
  // One inside it, 1.5 ms, is slewed away, a quarter of a millisecond a tick.
  'a jump of 1.5 ms on the client': { client: { drops: [{ at: 6.1, lost: 0.0015 }] } },
  // The network's pings are stamped with the page clocks, which don't jump,
  // so how slow the link is doesn't matter to a jump.
  'a buffer dropped over a link as slow as the buffer': {
    host: { drops: [{ at: 6.1, lost: BUFFER }] },
    link: { there: 0.005, back: 0.005, jitter: 0.02, held: 0.5 },
  },
  'a ping answered as the host drops a buffer': {
    host: { drops: [{ at: 5.998, lost: BUFFER }] },
    link: { there: 0.002, back: 0.002, jitter: 0.004, held: 1, seed: 6 },
  },
  "the pairing's jitter": {
    client: { pairingJitter: PAIRING_JITTER, seed: 2 },
    host: { pairingJitter: PAIRING_JITTER, seed: 3 },
  },
  "the pairing's blips": {
    client: { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS, seed: 2 },
    host: { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS, seed: 3 },
  },
  'one leg slower than the other': { link: { there: 0.012, back: 0.002 } },
  'messages held up': { link: { there: 0.002, back: 0.002, jitter: 0.03, held: 0.3 } },
  'messages lost': { link: { there: 0.002, back: 0.002, loss: 0.2 } },
  'a stall on each page': {
    client: { stalls: [{ at: 4, for: 0.3 }] },
    host: { stalls: [{ at: 7, for: 0.3 }] },
    link: { there: 0.002, back: 0.002 },
  },
  'everything at once': {
    client: {
      started: 0.1,
      drift: 60,
      quantum: QUANTUM,
      latency: 0.03,
      pageOrigin: -40,
      pairingJitter: PAIRING_JITTER,
      pairingBlips: PAIRING_BLIPS,
      drops: [{ at: 5, lost: BUFFER }],
      stalls: [{ at: 8, for: 0.2 }],
      seed: 5,
    },
    host: {
      drift: -40,
      quantum: QUANTUM,
      latency: 0.012,
      pageOrigin: 17,
      pairingJitter: PAIRING_JITTER,
      pairingBlips: PAIRING_BLIPS,
      drops: [{ at: 9.5, lost: BUFFER }],
      seed: 6,
    },
    link: { there: 0.003, back: 0.002, jitter: 0.02, held: 0.3, loss: 0.1, seed: 7 },
  },
};

/** How often each page ticks, and how often a client pings its host once its clock is trusted (`PING_EVERY.steady`). */
const TICK = 0.025;
const EVERY = 0.25;
const PINGS = range(48).map((i) => 0.25 + i * EVERY);

/** The estimator of an output pair, whatever it carries. */
type OutputEstimator = Machine<null, unknown, Sample, PairEstimate>;
type NetworkEstimator = Machine<null, unknown, Ping, ClockReading>;

/**
 * A device's output pair, fed one reading of its pairing each tick from
 * `from` to 12 s: its estimate after each, where the page ran the tick.
 */
function outputPair(device: SimulatedDevice, estimator: OutputEstimator, from = 0.2) {
  let carried = estimator.initial;
  const read: { at: number; offset: number | null }[] = [];
  for (const { at } of ticksOf(device, from, 12, TICK)) {
    const { contextTime, performanceTime } = device.pairing(at);
    if (contextTime <= 0) continue;
    const next = estimator.advance(null, carried, pairingSample(contextTime, performanceTime));
    carried = next.carried;
    read.push({ at, offset: next.output.offset });
  }
  return (t: number) => read.findLast((r) => r.at <= t)?.offset ?? null;
}

/**
 * A client's clock set by its host's under a scene, at each of the
 * client's ticks: each device's output pair fed from its pairing, the
 * host answering each ping with its page clock and its output pair's
 * offset, and the client composing the three (`skewOf`). For each tick,
 * how late the client sounds the moment its host is heard, in seconds.
 */
function follow(
  scene: Scene,
  { output = outputClock as OutputEstimator, network = hostClock as NetworkEstimator } = {},
) {
  const client = simulatedDevice(scene.client);
  const host = simulatedDevice(scene.host);
  const hostOutput = outputPair(host, output);
  const clientOutput = outputPair(client, output);
  const runs = pingsBetween(client, host, scene.link ?? {}, PINGS, hostOutput);
  let carried = network.initial;
  let reading: ClockReading | null = null;
  let answered = 0;
  const ticks: { at: number; skew: number; late: number; trip: number }[] = [];
  for (const { at } of ticksOf(client, 0.2, 12, TICK)) {
    for (; answered < runs.length && runs[answered]!.receivedAt <= at; answered++) {
      const next = network.advance(null, carried, runs[answered]!.ping);
      carried = next.carried;
      reading = next.output;
    }
    const skew = reading && skewOf(reading, clientOutput(at));
    if (skew === null || skew === undefined) continue;
    ticks.push({
      at,
      skew,
      late: client.heardAt(host.heard(at) - skew) - at,
      trip: reading!.trip!,
    });
  }
  return { ticks, runs };
}

/**
 * The real times from each jump of either device until the client's clock
 * has followed it. A jump on the client is followed by its output pair
 * within `OUTPUT.confirm` ticks after it; one on the host, by the host's
 * output pair as quickly, and then at the client's first tick after the
 * first answer after that. A jump inside an output pair's resolution, two
 * bounds and `OUTPUT.jumped`, is slewed, one `OUTPUT.slew` a tick.
 */
function settling(scene: Scene, runs: readonly PingRun[]) {
  const resolution = 2 * OUTPUT.paired + OUTPUT.jumped;
  const followed = (d: Drop) =>
    d.at + d.lost + (OUTPUT.confirm + 1 + (d.lost <= resolution ? d.lost / OUTPUT.slew : 0)) * TICK;
  return [
    ...(scene.client?.drops ?? []).map((d) => [d.at, followed(d)] as const),
    ...(scene.host?.drops ?? []).map((d) => {
      const told = runs.find((r) => r.answeredAt >= followed(d));
      return [d.at, (told?.receivedAt ?? Infinity) + TICK] as const;
    }),
  ];
}

/**
 * Where a client's clock breaks its promise under a scene (T8): once it is
 * trusted and away from the moments it settles from a jump, a client
 * sounds a moment within half its best round trip of its host (Cristian's
 * bound), give or take each output pair's bound and slew; and its clock
 * moves by more than a millisecond at once only where a clock jumped.
 */
function brokenPromises(
  scene: Scene,
  estimators: { output?: OutputEstimator; network?: NetworkEstimator } = {},
): string[] {
  const { ticks, runs } = follow(scene, estimators);
  const spans = settling(scene, runs);
  const settled = (t: number) => spans.every(([from, to]) => t < from || t > to);
  const problems: string[] = [];
  let before: number | null = null;
  for (const { at, skew, late, trip } of ticks) {
    const bound = trip / 2 + 2 * (OUTPUT.paired + OUTPUT.slew) + 1e-6;
    if (settled(at) && Math.abs(late) > bound)
      problems.push(
        `at ${at.toFixed(2)} s, ${(late * 1000).toFixed(2)} ms out, past ${(bound * 1000).toFixed(2)}`,
      );
    if (before !== null && Math.abs(skew - before) > 0.001 && settled(at))
      problems.push(
        `at ${at.toFixed(2)} s, moves ${((skew - before) * 1000).toFixed(2)} ms at once`,
      );
    before = skew;
  }
  if (ticks.length === 0) problems.push('never trusted');
  return problems;
}

/** When, in real time, a problem `brokenPromises` found happened; NaN for one that has no time. */
const whenOf = (problem: string) => Number(/^at (\d+\.\d+) s, /.exec(problem)?.[1] ?? NaN);

/** An output pair before #27's estimator: it slews toward each reading and never follows a jump, as `hostClock` did before #90. */
const slewOnly = clockPair({ ...OUTPUT, jumped: Infinity });

/** A network pair that claims the quickest ping's bound, of the latest 16, but plays by the latest ping. */
const latestPing: NetworkEstimator = {
  initial: [] as number[],
  advance(_, carried, ping) {
    const trip = ping.received - ping.sent;
    const trips = [...(carried as number[]), trip].slice(-16);
    const offset = ping.host - (ping.sent + ping.received) / 2;
    return {
      carried: trips,
      output: { offset, trip: Math.min(...trips), tooFar: false, heard: ping.heard, jumps: 0 },
    };
  },
};

/** `outputClock`, but 2 ms off from its 200th reading on. */
const offPartway: OutputEstimator = {
  initial: { inner: outputClock.initial, read: 0 },
  advance(env, carried, sample) {
    const { inner, read } = carried as { inner: typeof outputClock.initial; read: number };
    const next = outputClock.advance(env, inner, sample);
    const off = read >= 200 ? 0.002 : 0;
    const offset = next.output.offset === null ? null : next.output.offset + off;
    return { carried: { inner: next.carried, read: read + 1 }, output: { ...next.output, offset } };
  },
};

describe("a client's clock under every fault (#27, T8)", () => {
  for (const [name, scene] of Object.entries(SCENES))
    it(`keeps its promise: ${name}`, () => {
      expect(brokenPromises(scene)).toEqual([]);
    });

  it('breaks its promise where an output pair only slews, after the drop and not before (#90)', () => {
    for (const name of ['a buffer dropped on the client', 'a buffer dropped on the host']) {
      const problems = brokenPromises(SCENES[name]!, { output: slewOnly });
      expect(problems.length).toBeGreaterThan(0);
      expect(problems.map(whenOf).every((t) => t >= 6 && t <= 12.01)).toBe(true);
    }
    expect(brokenPromises(SCENES['no fault']!, { output: slewOnly })).toEqual([]);
    expect(whenOf('never trusted')).toBeNaN();
  });

  it('breaks its promise where the network trusts the latest ping over the quickest', () => {
    const problems = brokenPromises(SCENES['messages held up']!, { network: latestPing });
    expect(problems.some((p) => / ms out, past /.test(p))).toBe(true);
    expect(brokenPromises(SCENES['no fault']!, { network: latestPing })).toEqual([]);
  });

  it('breaks its promise where an output pair is off, or moves at once with no clock jumping', () => {
    const problems = brokenPromises(SCENES['no fault']!, { output: offPartway });
    expect(problems.some((p) => / ms out, past /.test(p))).toBe(true);
    expect(problems.some((p) => / moves -?\d+\.\d+ ms at once$/.test(p))).toBe(true);
  });
});

const dense = holding({ ...INITIAL_STYLE, energy: 1 });
const env: TransportEnv = {
  seed: 11,
  start: 1,
  track: dense,
  wish: { tonic: null, mode: PRESETS[0]!.mode, melodic: null },
};

/** The transport, run on the ticks given, each scheduling a lookahead past the clock it read. */
function schedule(ticks: readonly PageTick[]) {
  let state = transport.initial;
  return ticks.map((tick) => {
    const next = transport.advance(env, state, { now: tick.now, until: tick.now + LOOKAHEAD });
    state = next.carried;
    return { tick, output: next.output };
  });
}

type Scheduled = { tick: PageTick; output: TransportOutput }[];

const eventKey = (e: TimedEvent) => `${e.bar}:${e.event.part}:${e.event.step}:${e.event.note}`;

/**
 * Where the transport breaks T1 over ticks that read a faulty clock, against
 * a run on a clock without faults: an event scheduled before the clock it
 * read (played late), a step laid twice, a step laid anywhere but where
 * the clean run laid it (the grid moved), or a step not laid that no gap
 * between two ticks' horizons passed.
 */
function transportBreaks(run: Scheduled, clean: Scheduled): string[] {
  const problems: string[] = [];
  for (const { tick, output } of run)
    for (const e of output.events)
      if (e.seconds < tick.now) problems.push(`${eventKey(e)} at ${e.seconds}, before ${tick.now}`);
  const laid = run.flatMap((r) => r.output.steps);
  const steps = new Map<number, ScheduledStep>();
  for (const s of laid) {
    if (steps.has(s.step)) problems.push(`step ${s.step} laid twice`);
    steps.set(s.step, s);
  }
  const events = new Set(run.flatMap((r) => r.output.events.map(eventKey)));
  const last = laid.at(-1)?.step ?? -1;
  const passed = run.slice(1).map((r, i) => [run[i]!.tick.now + LOOKAHEAD, r.tick.now] as const);
  const gone = (seconds: number) => passed.some(([from, to]) => seconds >= from && seconds < to);
  for (const s of clean.flatMap((r) => r.output.steps)) {
    if (s.step > last) break;
    const here = steps.get(s.step);
    if (here && here.seconds !== s.seconds) problems.push(`step ${s.step} moved`);
    if (!here && !gone(s.seconds)) problems.push(`step ${s.step} dropped, though no gap passed it`);
  }
  for (const { output } of clean)
    for (const e of output.events)
      if (
        steps.has(e.event.step + BAR_STEPS * e.bar) &&
        !events.has(eventKey(e)) &&
        !gone(e.seconds)
      )
        problems.push(`${eventKey(e)} not played, though no gap passed it`);
  return problems;
}

/** The faults a transport's clock can have: those of its own device, and a client's following. */
const TRANSPORT_SCENES: Record<string, { faults: DeviceFaults; now?: (t: PageTick) => number }> = {
  'no fault': { faults: {} },
  'drift, 100 ppm': { faults: { drift: 100 } },
  'a buffer dropped': { faults: { drops: [{ at: 6, lost: BUFFER }] } },
  'buffers dropped again and again': {
    faults: { drops: range(8).map((i) => ({ at: 2 + i * 1.3, lost: BUFFER })) },
  },
  'the render quantum': { faults: { quantum: QUANTUM } },
  'a stall shorter than the lookahead': { faults: { stalls: [{ at: 5, for: 0.08 }] } },
  'a stall longer than the lookahead': { faults: { stalls: [{ at: 5, for: 0.4 }] } },
  // A client plays on its output's clock plus its offset from the host's,
  // which jumps back or forward by a buffer as the clock follows one.
  "a client's clock following a jump back": {
    faults: {},
    now: (t) => t.now + (t.at >= 6 ? -BUFFER : 0),
  },
  "a client's clock following a jump forward": {
    faults: {},
    now: (t) => t.now + (t.at >= 6 ? BUFFER : 0),
  },
};

describe('the transport under every fault of its clock (#27, T1)', () => {
  const clean = schedule(ticksOf(simulatedDevice(), 0.9, 12));
  for (const [name, { faults, now }] of Object.entries(TRANSPORT_SCENES))
    it(`never plays late, never lays a step twice and keeps its grid: ${name} (T1)`, () => {
      const ticks = ticksOf(simulatedDevice(faults), 0.9, 12).map((t) =>
        now ? { ...t, now: now(t) } : t,
      );
      const run = schedule(ticks);
      expect(transportBreaks(run, clean)).toEqual([]);
      expect(run.flatMap((r) => r.output.steps).length).toBeGreaterThan(60);
    });

  it('finds an event played late, a step laid twice or moved, and a step or an event dropped where no gap was', () => {
    const run = schedule(ticksOf(simulatedDevice(), 0.9, 4));
    const at = run.findIndex((r) => r.output.events.length > 0);
    const only = (broken: Scheduled, message: RegExp) => {
      const problems = transportBreaks(broken, clean);
      expect(problems.length).toBeGreaterThan(0);
      for (const problem of problems) expect(problem).toMatch(message);
    };
    const event = String.raw`\d+:[a-z]+:\d+:\d+`;
    only(
      run.map((r, i) =>
        i === at ? { ...r, tick: { ...r.tick, now: r.output.events[0]!.seconds + 0.001 } } : r,
      ),
      new RegExp(`^${event} at [\\d.]+, before [\\d.]+$`),
    );
    only([...run, run[at]!], /^step \d+ laid twice$/);
    const shifted = (r: Scheduled[number]) => ({
      ...r,
      output: {
        ...r.output,
        steps: r.output.steps.map((s) => ({ ...s, seconds: s.seconds + 0.001 })),
      },
    });
    only(
      run.map((r, i) => (i === at ? shifted(r) : r)),
      /^step \d+ moved$/,
    );
    only(
      run.map((r, i) => (i === at ? { ...r, output: { ...r.output, steps: [] } } : r)),
      /^step \d+ dropped, though no gap passed it$/,
    );
    only(
      run.map((r, i) => (i === at ? { ...r, output: { ...r.output, events: [] } } : r)),
      new RegExp(`^${event} not played, though no gap passed it$`),
    );
    expect(transportBreaks(run, clean)).toEqual([]);
  });
});
