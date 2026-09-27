import {
  type BandBar,
  INITIAL_STYLE,
  LOOKAHEAD,
  SLIDER_GLIDE,
  type StyleTrack,
  type TimedEvent,
  type TransportEnv,
  glideTo,
  holding,
  transport,
  transportOver,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { followSource } from './follow.ts';
import { sentBars } from './host.ts';
import type { SentBar } from './protocol.ts';

/** A keyed stand-in for chance, so a run is the same every time. */
function draws(seed: number) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 2 ** 32;
  };
}

interface Link {
  /** One-way delay, in seconds, and how much more it varies by. */
  delay: number;
  jitter: number;
  /** The chance a bar is lost. */
  loss: number;
}

interface Run {
  host: TimedEvent[];
  client: TimedEvent[];
  /** Events the client scheduled after the moment they were due. */
  late: number;
  lacked: number;
  /** The bars the host sent that the link lost. */
  lost: Set<number>;
  changedAt: number | null;
}

/**
 * A host and a client, each ticking every 25 ms on its own clock, the
 * client's 3.2 s behind the host's and ticking 10 ms out of phase. The host
 * sends each bar as it composes it over the link; what arrives reaches the
 * client on its first tick after. The client starts following the song
 * when the first bar reaches it, as a client starts when it hears the host
 * start. With `change`, the host's tempo glides
 * from the head once its head reaches that step, and the new track reaches
 * the client over the link too.
 */
function jam(link: Link, seconds: number, change: number | null = null): Run {
  const draw = draws(7);
  const offset = 3.2;
  let hostTrack: StyleTrack = holding({ ...INITIAL_STYLE, energy: 0.8 });
  let clientTrack = hostTrack;
  const env = (track: StyleTrack): TransportEnv => ({
    seed: 11,
    // A tenth of a second after the host's first tick, as a player starts a song.
    start: 1,
    track,
    wish: { tonic: null, mode: 'aeolian' },
  });
  const follower = transportOver(followSource);
  let hostCarried = transport.initial;
  let clientCarried = follower.initial;
  const wire: { at: number; sent?: SentBar; track?: StyleTrack }[] = [];
  const send = (now: number, message: { sent?: SentBar; track?: StyleTrack }) => {
    if (message.sent && draw() < link.loss) return message.sent.bar.bar;
    wire.push({ at: now + link.delay + draw() * link.jitter, ...message });
    return null;
  };
  const run: Run = { host: [], client: [], late: 0, lacked: 0, lost: new Set(), changedAt: null };

  for (let ms = 900; ms < seconds * 1000; ms += 5) {
    const t = ms / 1000;
    const hostTick = ms % 25 === 0;
    const clientTick = ms % 25 === 10;
    if (hostTick) {
      const { carried, output } = transport.advance(env(hostTrack), hostCarried, {
        now: t,
        until: t + LOOKAHEAD,
      });
      hostCarried = carried;
      run.host.push(...output.events);
      for (const sent of sentBars(output.composed, output.steps, carried!.head, hostTrack)) {
        const lost = send(t, { sent });
        if (lost !== null) run.lost.add(lost);
      }
      if (change !== null && run.changedAt === null && carried!.head.step >= change) {
        run.changedAt = carried!.head.step;
        hostTrack = glideTo(hostTrack, { bpm: 130 }, run.changedAt, SLIDER_GLIDE);
        send(t, { track: hostTrack });
      }
    }
    if (clientTick) {
      // The client's own clock reads t - offset; it plays on the host's, t.
      const hostNow = t - offset + offset;
      const due = wire.filter((m) => m.at <= hostNow);
      for (const m of due) {
        wire.splice(wire.indexOf(m), 1);
        if (m.track) clientTrack = m.track;
      }
      const arrived = due.flatMap((m) => (m.sent ? [m.sent] : []));
      if (clientCarried === null && arrived.length === 0) continue;
      const { carried, output } = follower.advance(env(clientTrack), clientCarried, {
        now: hostNow,
        until: hostNow + LOOKAHEAD,
        arrived,
      });
      clientCarried = carried;
      run.client.push(...output.events);
      run.late += output.events.filter((e) => e.seconds < hostNow).length;
    }
  }
  run.lacked = clientCarried!.source.lacked;
  return run;
}

const byBar = (events: readonly TimedEvent[], bar: number) => events.filter((e) => e.bar === bar);
const barsOf = (events: readonly TimedEvent[]) => [...new Set(events.map((e) => e.bar))];

describe('a host and a client', () => {
  it('play the same notes at the same moments over a quick link, every bar', () => {
    const run = jam({ delay: 0.004, jitter: 0.006, loss: 0 }, 40);
    expect(run.lacked).toBe(0);
    expect(run.late).toBe(0);
    // The client joins the song as it starts, so it plays everything the host plays.
    const played = barsOf(run.host).filter((bar) => bar < barsOf(run.host).at(-1)!);
    expect(played.length).toBeGreaterThan(15);
    for (const bar of played) expect(byBar(run.client, bar)).toEqual(byBar(run.host, bar));
  });

  it('pass a bar the link lost, and play the rest as the host does', () => {
    const run = jam({ delay: 0.004, jitter: 0.006, loss: 0.15 }, 40);
    const reached = barsOf(run.host).slice(0, -1);
    const lost = reached.filter((bar) => run.lost.has(bar));
    expect(lost.length).toBeGreaterThan(1);
    // The client starts when a bar first reaches it, so bars lost before that
    // pass before it plays; every one lost after is lacked.
    const started = barsOf(run.client)[0]!;
    expect(run.lacked).toBeGreaterThanOrEqual(lost.filter((bar) => bar > started).length);
    expect(run.lacked).toBeLessThanOrEqual(lost.length);
    for (const bar of reached)
      expect(byBar(run.client, bar)).toEqual(run.lost.has(bar) ? [] : byBar(run.host, bar));
    expect(run.late).toBe(0);
  });

  it('pass a bar that arrives after its first step, and never play one late', () => {
    // A beat at 108 bpm is 0.56 s; bars that take longer than that miss.
    const run = jam({ delay: 0.3, jitter: 0.6, loss: 0 }, 40);
    expect(run.lacked).toBeGreaterThan(0);
    expect(run.late).toBe(0);
    // The first bar reached the client after it started, so the client joined it late.
    const [first, ...rest] = barsOf(run.client);
    expect(byBar(run.host, first!)).toEqual(expect.arrayContaining(byBar(run.client, first!)));
    for (const bar of rest) expect(byBar(run.client, bar)).toEqual(byBar(run.host, bar));
  });

  it("follow a tempo change that reaches the client late from the bar after the next on, to the host's time", () => {
    // The track takes longer than two steps to arrive, so the client lays
    // steps on the old tempo after the glide has begun; a bar, sent a beat
    // ahead, still arrives in time.
    const run = jam({ delay: 0.32, jitter: 0.04, loss: 0 }, 40, 16 * 6 + 3);
    const changed = Math.floor(run.changedAt! / 16);
    expect(run.lacked).toBe(0);
    // Bar 0 reached the client after it started, so it joined that bar late.
    for (const bar of barsOf(run.host).slice(1, -1)) {
      const host = byBar(run.host, bar);
      const client = byBar(run.client, bar);
      expect(client.map((e) => e.event)).toEqual(host.map((e) => e.event));
      if (bar < changed || bar >= changed + 2)
        for (const [i, e] of client.entries()) expect(e.seconds).toBeCloseTo(host[i]!.seconds, 9);
    }
    // The glide did move the time: the host's bars got shorter.
    const start = (bar: number) => byBar(run.host, bar).find((e) => e.event.step === 0)!.seconds;
    expect(start(changed + 6) - start(changed + 5)).toBeLessThan(start(3) - start(2) - 0.2);
  });
});

describe('the bars a host sends', () => {
  it('each start where the host then lays its first step', () => {
    let carried = transport.initial;
    const track = glideTo(holding(INITIAL_STYLE), { bpm: 140 }, 40, 64);
    const env: TransportEnv = {
      seed: 3,
      start: 0.5,
      track,
      wish: { tonic: null, mode: 'aeolian' },
    };
    const sent = new Map<number, number | null>();
    const laid = new Map<number, number>();
    const composed: BandBar[] = [];
    for (let t = 0.5; t < 20; t += 0.025) {
      const next = transport.advance(env, carried, { now: t, until: t + LOOKAHEAD });
      carried = next.carried;
      composed.push(...next.output.composed);
      for (const s of sentBars(next.output.composed, next.output.steps, carried!.head, track))
        sent.set(s.bar.bar, s.start);
      for (const s of next.output.steps) laid.set(s.step, s.seconds);
    }
    expect(composed.length).toBeGreaterThan(8);
    for (const [bar, start] of sent)
      if (laid.has(bar * 16)) expect(start).toBeCloseTo(laid.get(bar * 16)!, 9);
  });
});
