import {
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
import { CLOCK, type ClockCarried, type ClockReading, type Ping, hostClock } from './clock.ts';
import {
  type SimulatedDevice,
  type DeviceFaults,
  type LinkFaults,
  type PingRun,
  type PageTick,
  linkDelay,
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

  it('carries messages a leg at least its time, holds some up by at most its jitter, and loses its share', () => {
    const link: LinkFaults = { there: 0.004, back: 0.001, jitter: 0.03, loss: 0.2, seed: 9 };
    const there = range(2000).map((i) => linkDelay(link, 'there', i));
    const kept = there.filter((d) => d !== null);
    expect(kept.length / there.length).toBeCloseTo(0.8, 1);
    expect(Math.min(...kept)).toBe(0.004);
    expect(Math.max(...kept)).toBeLessThanOrEqual(0.034);
    expect(Math.max(...kept)).toBeGreaterThan(0.03);
    expect(linkDelay({ there: 0.004 }, 'there', 7)).toBe(0.004);
  });

  it("stamps a ping as each side's pairing reads it, and knows the offset it should read", () => {
    const client = simulatedDevice({ pageOrigin: 1, started: 0.2 });
    const host = simulatedDevice({ pageOrigin: 5, started: 3 });
    const [run] = pingsBetween(client, host, { there: 0.01, back: 0.002 }, [10]);
    expect(run!.ping.sent).toBeCloseTo(9.8, 12);
    expect(run!.ping.host).toBeCloseTo(7.01, 12);
    expect(run!.ping.received).toBeCloseTo(9.812, 12);
    expect(run!.offset).toBeCloseTo(-2.8, 9);
  });
});

/** Two devices and the link between them, under some faults. */
interface Scene {
  readonly client?: DeviceFaults;
  readonly host?: DeviceFaults;
  readonly link?: LinkFaults;
}

/** Each fault #27 lists for a clock pair, alone, and all at once. */
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
  'the render quantum': { client: { quantum: QUANTUM }, host: { quantum: QUANTUM } },
  "the pairing's jitter": {
    client: { pairingJitter: PAIRING_JITTER, seed: 2 },
    host: { pairingJitter: PAIRING_JITTER, seed: 3 },
  },
  "the pairing's blips": {
    client: { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS, seed: 2 },
    host: { pairingJitter: PAIRING_JITTER, pairingBlips: PAIRING_BLIPS, seed: 3 },
  },
  'one leg slower than the other': { link: { there: 0.012, back: 0.002 } },
  'messages held up': { link: { there: 0.002, back: 0.002, jitter: 0.03 } },
  'messages lost': { link: { there: 0.002, back: 0.002, loss: 0.2 } },
  'a stall on each page': {
    client: { stalls: [{ at: 4, for: 0.3 }] },
    host: { stalls: [{ at: 7, for: 0.3 }] },
    link: { there: 0.002, back: 0.002 },
  },
};

/**
 * Where the host's clock does not keep its promise yet, and why: each test
 * finds the break, so the day a better clock keeps the promise, its test
 * says so, and the scene moves to `SCENES` (#27, step 3). Both flaws come from telling a step by two pings'
 * ranges, which a ping can't do when its range is wider than the step.
 */
const KNOWN_BREAKS: Record<string, Scene> = {
  // The host answers one ping partway into a drop, and the ping reads an
  // offset between the old and the new. Quick, it becomes the one trusted,
  // and agrees with the pings on either side: the step is never told, and
  // the offset stays some milliseconds out until the ping leaves the window.
  'a ping answered as the host drops a buffer': {
    host: { drops: [{ at: 5.998, lost: BUFFER }] },
    link: { there: 0.002, back: 0.002, jitter: 0.004, held: 1, seed: 6 },
  },
  // Pings whose quickest round trip is near the step read ranges that meet
  // across it, so a step is slewed back, 0.5 ms a ping: seconds out.
  'a buffer dropped over a link as slow as the buffer': {
    host: { drops: [{ at: 6.1, lost: BUFFER }] },
    link: { there: 0.005, back: 0.005, jitter: 0.02, held: 0.5 },
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
    link: { there: 0.003, back: 0.002, jitter: 0.02, loss: 0.1, seed: 7 },
  },
};

/** How often a client pings its host once its clock is trusted (`PING_EVERY.steady`). */
const EVERY = 0.25;
const PINGS = range(48).map((i) => 0.25 + i * EVERY);

type Estimator = Machine<null, ClockCarried, Ping, ClockReading>;

/** What a client's clock reads after each answer, and where each answer came in. */
function follow(estimator: Estimator, runs: readonly PingRun[]) {
  let state = estimator.initial;
  return runs.map((run) => {
    const next = estimator.advance(null, state, run.ping);
    state = next.carried;
    return { run, reading: next.output };
  });
}

/** How late, in seconds, a client sounds the moment its host is heard at real time `t`, reading `offset`. */
const late = (client: SimulatedDevice, host: SimulatedDevice, t: number, offset: number) =>
  client.heardAt(host.heard(t) - offset) - t;

/**
 * The real times from each drop until the second ping sent after it has
 * come back: the two a step takes to be followed (`hostClock`). A ping
 * lost on the way puts that off.
 */
const settling = (scene: Scene, runs: readonly PingRun[]) =>
  [...(scene.client?.drops ?? []), ...(scene.host?.drops ?? [])].map((d) => {
    const after = runs.filter((r) => r.sentAt >= d.at + d.lost);
    return [d.at, after[1]?.receivedAt ?? Infinity] as const;
  });

/**
 * Where a client's clock breaks its promise under a scene: past the moments
 * its clocks are settling from a drop, once it is trusted, a client sounds
 * a moment within half the best round trip of its host (Cristian's bound),
 * give or take the pairing's jitter on each of a ping's three stamps and
 * the drift since its best ping. And its offset moves by more than the
 * slew only where a clock stepped.
 */
function brokenPromises(estimator: Estimator, scene: Scene): string[] {
  const client = simulatedDevice(scene.client);
  const host = simulatedDevice(scene.host);
  const runs = pingsBetween(client, host, scene.link ?? {}, PINGS);
  const followed = follow(estimator, runs);
  const jitter = Math.max(scene.client?.pairingJitter ?? 0, scene.host?.pairingJitter ?? 0);
  const drift = Math.abs((scene.client?.drift ?? 0) - (scene.host?.drift ?? 0)) * 1e-6;
  const stale = drift * CLOCK.window * EVERY;
  const settles = settling(scene, runs);
  const settled = (t: number) => settles.every(([from, to]) => t < from || t > to);
  const problems: string[] = [];
  let before: number | null = null;
  for (const { run, reading } of followed) {
    const t = run.receivedAt;
    const { offset, trip } = reading;
    if (offset === null) continue;
    const off = late(client, host, t, offset);
    const bound = trip! / 2 + 3 * jitter + stale + 1e-6;
    if (settled(t) && Math.abs(off) > bound)
      problems.push(
        `at ${t.toFixed(2)} s, ${(off * 1000).toFixed(2)} ms out, past ${bound * 1000}`,
      );
    if (before !== null && Math.abs(offset - before) > CLOCK.slew + 1e-9 && settled(t))
      problems.push(`at ${t.toFixed(2)} s, jumps ${((offset - before) * 1000).toFixed(2)} ms`);
    before = offset;
  }
  if (followed.every((f) => f.reading.offset === null)) problems.push('never trusted');
  return problems;
}

/** The estimator before #90: the best of the latest pings, slewed to. It has no idea of a step. */
const slewOnly: Estimator = {
  initial: hostClock.initial,
  advance(env, carried, ping) {
    const trip = ping.received - ping.sent;
    if (trip < 0) return { carried, output: hostClock.advance(env, carried, ping).output };
    const pings = [...carried.pings, { trip, offset: ping.host - (ping.sent + ping.received) / 2 }];
    const window = pings.slice(-CLOCK.window);
    const best = window.reduce((a, b) => (b.trip < a.trip ? b : a));
    let offset = carried.offset;
    if (window.length >= CLOCK.ready)
      offset =
        offset === null
          ? best.offset
          : offset + Math.max(-CLOCK.slew, Math.min(CLOCK.slew, best.offset - offset));
    const next = { pings: window, offset, doubt: null };
    return { carried: next, output: { offset, trip: best.trip, tooFar: false } };
  },
};

describe("the host's clock under every fault (#27)", () => {
  for (const [name, scene] of Object.entries(SCENES))
    it(`keeps its promise: ${name}`, () => {
      expect(brokenPromises(hostClock, scene)).toEqual([]);
    });

  for (const [name, scene] of Object.entries(KNOWN_BREAKS))
    it(`does not keep its promise yet: ${name}`, () => {
      expect(brokenPromises(hostClock, scene)).not.toEqual([]);
    });

  it('breaks its promise where it only slews, as it did before it followed a step (#90)', () => {
    expect(brokenPromises(slewOnly, SCENES['a buffer dropped on the client']!)).not.toEqual([]);
    expect(brokenPromises(slewOnly, SCENES['a buffer dropped on the host']!)).not.toEqual([]);
    expect(brokenPromises(slewOnly, SCENES['no fault']!)).toEqual([]);
  });

  it('breaks its promise where it jumps without a step', () => {
    const jumpy: Estimator = {
      initial: hostClock.initial,
      advance(env, carried, ping) {
        const next = hostClock.advance(env, carried, ping);
        const offset = next.output.offset === null ? null : next.output.offset + 0.002;
        return { carried: next.carried, output: { ...next.output, offset } };
      },
    };
    expect(brokenPromises(jumpy, SCENES['no fault']!)).not.toEqual([]);
  });
});

const dense = holding({ ...INITIAL_STYLE, energy: 1 });
const env: TransportEnv = {
  seed: 11,
  start: 1,
  track: dense,
  wish: { tonic: null, mode: PRESETS[0]!.mode },
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
      if (steps.has(e.event.step + 16 * e.bar) && !events.has(eventKey(e)) && !gone(e.seconds))
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
  // which steps back or forward by a buffer as the clock follows one.
  "a client's clock following a step back": {
    faults: {},
    now: (t) => t.now + (t.at >= 6 ? -BUFFER : 0),
  },
  "a client's clock following a step forward": {
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

  it('finds an event played late, a step laid twice or moved, and one dropped where no gap was', () => {
    const run = schedule(ticksOf(simulatedDevice(), 0.9, 4));
    const events = run.map((r) => r.output.events.length);
    const at = events.findIndex((n) => n > 0);
    const late = run.map((r, i) =>
      i === at ? { ...r, tick: { ...r.tick, now: r.output.events[0]!.seconds + 0.001 } } : r,
    );
    expect(transportBreaks(late, clean).some((p) => p.includes('before'))).toBe(true);
    const twice = [...run, run[at]!];
    expect(transportBreaks(twice, clean).some((p) => p.includes('twice'))).toBe(true);
    const moved = run.map((r, i) =>
      i === at
        ? {
            ...r,
            output: {
              ...r.output,
              steps: r.output.steps.map((s) => ({ ...s, seconds: s.seconds + 0.001 })),
            },
          }
        : r,
    );
    expect(transportBreaks(moved, clean).some((p) => p.includes('moved'))).toBe(true);
    const lost = run.map((r, i) => (i === at ? { ...r, output: { ...r.output, steps: [] } } : r));
    expect(transportBreaks(lost, clean).some((p) => p.includes('no gap'))).toBe(true);
    expect(transportBreaks(run, clean)).toEqual([]);
  });
});
