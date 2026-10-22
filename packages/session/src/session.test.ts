import {
  presetMode,
  type BandBar,
  type BarJudgement,
  DRUM_NOTES,
  EMPTY_LAYER,
  GROOVE_TAG,
  type HeardNote,
  type Key,
  METER_REPOSITORY,
  PRESETS,
  RHYTHM_REPOSITORY,
  type ScheduledStep,
  INITIAL_STYLE,
  LOOKAHEAD,
  SLIDER_GLIDE,
  type Style,
  type StyleTrack,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  glideTo,
  holding,
  holdingSwing,
  readRhythm,
  stylePoint,
  transport,
  transportOver,
  writtenAt,
  writtenStyle,
  presetSwing,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { CLOCK } from './clock.ts';
import { EAR, earListen } from './ear.ts';
import { orderedArrival } from './faults.ts';
import { followSource } from './follow.ts';
import { sentBars } from './host.ts';
import { type SentBar, heardFrom, readClientMessage } from './protocol.ts';

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
  /** The chance a bar is lost, or where the link keeps order, a message. */
  loss: number;
  /**
   * Where given, the link keeps order, as TCP keeps a WebSocket's: a
   * message lost is sent again after this many seconds, doubled on each
   * loss after, and every message behind it waits (`orderedArrival`). The
   * host then also sends what shares its socket: an answer to a ping every
   * 250 ms, and the bars ahead and the Muse with each bar.
   */
  recovery?: number;
}

interface Run {
  host: TimedEvent[];
  client: TimedEvent[];
  /** Events the client scheduled after the moment they were due. */
  late: number;
  lacked: number;
  /** The bars the host sent that the link lost. */
  lost: Set<number>;
  /** How long past its leg's delay the link held each bar, in seconds, where it keeps order. */
  held: Map<number, number>;
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
function jam(link: Link, seconds: number, change: number | null = null, bpm?: number): Run {
  const draw = draws(7);
  const offset = 3.2;
  let hostTrack: StyleTrack = holding({
    ...INITIAL_STYLE,
    energy: 0.8,
    ...(bpm !== undefined && { bpm }),
  });
  let clientTrack = hostTrack;
  const env = (track: StyleTrack): TransportEnv => ({
    seed: 11,
    // A tenth of a second after the host's first tick, as a player starts a song.
    start: 1,
    track,
    wish: { tonic: null, mode: 'aeolian', melodic: null },
  });
  const follower = transportOver(followSource);
  let hostCarried = transport.initial;
  let clientCarried = follower.initial;
  const wire: { at: number; sent?: SentBar; track?: StyleTrack }[] = [];
  const stream = { sent: 0, arrived: 0 };
  const run: Run = {
    host: [],
    client: [],
    late: 0,
    lacked: 0,
    lost: new Set(),
    held: new Map(),
    changedAt: null,
  };
  const send = (now: number, message: { sent?: SentBar; track?: StyleTrack }) => {
    if (link.recovery !== undefined) {
      const faults = { there: link.delay, jitter: link.jitter, loss: link.loss, seed: 7 };
      const at = orderedArrival(faults, link.recovery, stream.sent++, now, stream.arrived);
      stream.arrived = at;
      if (message.sent) run.held.set(message.sent.bar.bar, at - now - link.delay);
      wire.push({ at, ...message });
      return null;
    }
    if (message.sent && draw() < link.loss) return message.sent.bar.bar;
    wire.push({ at: now + link.delay + draw() * link.jitter, ...message });
    return null;
  };

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
        // The bars ahead and the Muse go with each bar, on the same socket.
        if (link.recovery !== undefined) {
          send(t, {});
          send(t, {});
        }
      }
      if (link.recovery !== undefined && ms % 250 === 0) send(t, {});
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
      wish: { tonic: null, mode: 'aeolian', melodic: null },
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

/**
 * A client's player plays three notes in bar k, as the client hears the
 * bar; its ear judges them and sends the judgement over a link with a
 * one-way delay (`back`, if the way back is slower); the host's Muse hears
 * it, or drops it as late. Returns the
 * host's bar k + 2 and what the host dropped. The client's output is 30 ms
 * behind its clock, as a browser's is, and both tick every 25 ms.
 */
function motifOver(bpm: number, delay: number, back = delay, k = 3) {
  const track = holding({ ...INITIAL_STYLE, energy: 0.8, bpm });
  const env: TransportEnv = {
    seed: 5,
    start: 1,
    track,
    wish: { tonic: null, mode: 'aeolian', melodic: null },
  };
  const latency = 0.03;
  const follower = transportOver(followSource);
  let hostCarried = transport.initial;
  let clientCarried = follower.initial;
  let ear = EAR;
  const toClient: { at: number; sent: SentBar }[] = [];
  const toHost: { at: number; judged: BarJudgement }[] = [];
  const laid: ScheduledStep[] = [];
  const keys = new Map<number, Key>();
  const hostBars: BandBar[] = [];
  const dropped: BarJudgement[] = [];
  let notes = [69, 72, 76].map((note, i) => ({ note, step: k * 16 + i * 4 }));
  for (let ms = 900; ms < 30_000; ms += 5) {
    const t = ms / 1000;
    if (ms % 25 === 0) {
      const judged = toHost.filter((m) => m.at <= t);
      toHost.splice(0, judged.length);
      const { carried, output } = transport.advance(env, hostCarried, {
        now: t,
        until: t + LOOKAHEAD,
        judged: judged.map((m) => m.judged),
      });
      hostCarried = carried;
      hostBars.push(...output.composed);
      dropped.push(...output.dropped);
      for (const sent of sentBars(output.composed, output.steps, carried!.head, track))
        toClient.push({ at: t + delay, sent });
    }
    if (ms % 25 === 10) {
      const arrived = toClient.filter((m) => m.at <= t).map((m) => m.sent);
      toClient.splice(0, arrived.length);
      if (clientCarried === null && arrived.length === 0) continue;
      const { carried, output } = follower.advance(env, clientCarried, {
        now: t,
        until: t + LOOKAHEAD,
        arrived,
      });
      clientCarried = carried;
      laid.push(...output.steps);
      for (const b of output.composed) keys.set(b.bar, b.plan.key);
      // What the player hears now, and plays along with.
      const heard = writtenAt(laid, t - latency);
      if (heard === null) continue;
      const played: HeardNote[] = notes
        .filter((n) => n.step <= heard)
        .map(({ note }) => ({ note, velocity: 100, source: 'Ada', position: heard, end: null }));
      notes = notes.filter((n) => n.step > heard);
      const listened = earListen(ear, played, heard, (bar) => keys.get(bar));
      ear = listened.carried;
      for (const judged of listened.judged) toHost.push({ at: t + back, judged });
    }
  }
  return { bar: hostBars.find((b) => b.bar === k + 2)!, dropped };
}

describe("a client's motif, over the link", () => {
  it('reaches the host in time for bar k + 2 at 180 bpm, over the slowest link the clock keeps (F7)', () => {
    // Half the longest round trip the clock keeps, one way, plus a tick.
    const delay = CLOCK.tooFar / 2 + 0.025;
    for (const bpm of [60, 108, 180]) {
      const { bar, dropped } = motifOver(bpm, delay);
      expect(dropped).toEqual([]);
      expect(bar.offer).toMatchObject({ bar: 3, source: 'Ada' });
      expect(bar.written.filter((n) => n.part === 'lead').map((n) => n.step)).toEqual([0, 4, 8]);
    }
  });

  it('is dropped as late, and changes no bar, where its way back takes longer than a bar allows (F7)', () => {
    const { bar, dropped } = motifOver(180, 0.01, 0.9);
    expect(dropped.map((d) => d.bar)).toEqual([3]);
    expect(bar.offer).toBeNull();
  });
});

describe('bars over a link that keeps order, as a WebSocket does (#27, T13)', () => {
  /** How often each side ticks. */
  const TICK = 0.025;

  it('lack a bar exactly where the stream held it past a beat, at 60, 120 and 180 bpm (T13)', () => {
    // 5% of messages lost, each sent again after a second: RFC 6298's least
    // wait, and far more loss than a room's Wi-Fi, so both sides are met.
    for (const bpm of [60, 120, 180]) {
      const run = jam({ delay: 0.004, jitter: 0.006, loss: 0.05, recovery: 1 }, 120, null, bpm);
      const beat = 60 / bpm;
      const started = barsOf(run.client)[0]!;
      const last = barsOf(run.host).at(-1)!;
      const played = new Set(barsOf(run.client));
      const judged = [...run.held].filter(([bar]) => bar > started && bar < last);
      const lacked = judged.filter(([bar]) => !played.has(bar));
      expect(lacked.length).toBeGreaterThan(0);
      expect(run.late).toBe(0);
      for (const [bar, held] of judged) {
        if (held < beat - 2 * TICK) expect(played.has(bar)).toBe(true);
        if (held > beat + 2 * TICK) expect(played.has(bar)).toBe(false);
      }
    }
  });

  it('lack no bar in two minutes where the stream recovers within 200 ms, the least Linux waits, over 2% loss (T13)', () => {
    let longest = 0;
    for (const bpm of [60, 120, 180]) {
      const run = jam({ delay: 0.004, jitter: 0.006, loss: 0.02, recovery: 0.2 }, 120, null, bpm);
      longest = Math.max(longest, ...run.held.values());
      expect(run.lacked).toBe(0);
      expect(run.late).toBe(0);
    }
    // The stream did hold bars up behind a loss, a recovery and more.
    expect(longest).toBeGreaterThan(0.2);
  });
});

describe("a client's drums, over the link (#410)", () => {
  const FUNK = PRESETS.find((p) => p.name === 'Funk')!;
  const STYLE: Style = { ...FUNK.style, entropy: 0.3 };
  /** Ada's pattern, a bar of 4/4: kick, snare on the backbeat, hats on the eighths. */
  const PATTERN: readonly { note: number; step: number; velocity: number }[] = [
    { note: DRUM_NOTES.kick, step: 0, velocity: 110 },
    { note: DRUM_NOTES.closedHat, step: 2, velocity: 70 },
    { note: DRUM_NOTES.snare, step: 4, velocity: 100 },
    { note: DRUM_NOTES.closedHat, step: 6, velocity: 72 },
    { note: DRUM_NOTES.kick, step: 10, velocity: 96 },
    { note: DRUM_NOTES.snare, step: 12, velocity: 104 },
    { note: DRUM_NOTES.closedHat, step: 14, velocity: 68 },
  ];
  /** Played over the song's first 8 bars, each hit up to 0.3 of a step off the grid, as a hand plays. */
  const PLAYED: HeardNote[] = [...Array(8).keys()].flatMap((bar) =>
    PATTERN.map(({ note, step, velocity }, i) => ({
      note,
      velocity,
      source: 'the drum pads',
      position: bar * 16 + step + (((bar * 7 + i * 3) % 7) - 3) / 10,
      end: null,
    })),
  );
  const envAt = (bpm: number): TransportEnv => ({
    seed: 3,
    start: 1,
    track: holding({ ...STYLE, bpm }),
    swing: holdingSwing(presetSwing(FUNK)!),
    wish: { tonic: null, mode: presetMode(FUNK)!, melodic: null },
    repository: METER_REPOSITORY,
    rhythms: RHYTHM_REPOSITORY,
    layer: EMPTY_LAYER,
    session: 'Friday jam',
  });

  /**
   * A client's player plays Ada's pattern as the client hears its bars; its
   * ear passes each bar on (`played`) as JSON over a link with a one-way
   * delay (`back`, if the way back is slower), and the host hears what it
   * reads under the name it seated her by. The host's state once 9 bars are
   * laid, and the bytes of each message. The client's output is 30 ms behind
   * its clock, and both tick every 25 ms.
   */
  function drumsOver(bpm: number, delay: number, back = delay) {
    const env = envAt(bpm);
    const latency = 0.03;
    const follower = transportOver(followSource);
    let hostCarried = transport.initial;
    let clientCarried = follower.initial;
    let ear = EAR;
    const toClient: { at: number; sent: SentBar }[] = [];
    const toHost: { at: number; text: string }[] = [];
    const laid: ScheduledStep[] = [];
    const bytes: { message: number; notes: number }[] = [];
    let waiting = [...PLAYED];
    for (let ms = 900; ; ms += 5) {
      const t = ms / 1000;
      if (ms % 25 === 0) {
        const arrived = toHost.filter((m) => m.at <= t);
        toHost.splice(0, arrived.length);
        const drums = arrived.flatMap(({ text }) => {
          const message = readClientMessage(JSON.parse(text));
          return message?.kind === 'played' ? heardFrom(message, 'Ada') : [];
        });
        const { carried, output } = transport.advance(env, hostCarried, {
          now: t,
          until: t + LOOKAHEAD,
          drums,
        });
        hostCarried = carried;
        if (carried!.head.step > clockOfTransport(carried).barStart(9))
          return { carried: carried!, bytes };
        for (const sent of sentBars(output.composed, output.steps, carried!.head, env.track))
          toClient.push({ at: t + delay, sent });
      }
      if (ms % 25 === 10) {
        const arrived = toClient.filter((m) => m.at <= t).map((m) => m.sent);
        toClient.splice(0, arrived.length);
        if (clientCarried === null && arrived.length === 0) continue;
        const { carried, output } = follower.advance(env, clientCarried, {
          now: t,
          until: t + LOOKAHEAD,
          arrived,
        });
        clientCarried = carried;
        laid.push(...output.steps);
        const heard = writtenAt(laid, t - latency);
        if (heard === null) continue;
        // What the player struck by now, where it was heard.
        const drums = waiting.filter((n) => n.position <= heard);
        waiting = waiting.filter((n) => n.position > heard);
        const listened = earListen(
          ear,
          [],
          heard,
          () => undefined,
          clockOfTransport(carried),
          drums,
        );
        ear = listened.carried;
        for (const played of listened.played) {
          const text = JSON.stringify({ kind: 'played', ...played });
          bytes.push({ message: text.length, notes: played.notes.length });
          toHost.push({ at: t + back, text });
        }
      }
    }
  }

  /** The host's state once 9 bars are laid, where its own player struck the same notes as it heard them. */
  function playedAtHost(bpm: number): TransportCarried {
    const env = envAt(bpm);
    let carried: TransportCarried | null = transport.initial;
    let waiting = PLAYED.map((n) => ({ ...n, source: 'Ada' }));
    for (let now = env.start - 0.1; ; now += 0.025) {
      const head = carried?.head.step ?? 0;
      const drums = waiting.filter((n) => n.position < head);
      waiting = waiting.filter((n) => n.position >= head);
      carried = transport.advance(env, carried, { now, until: now + LOOKAHEAD, drums }).carried!;
      if (carried.head.step > clockOfTransport(carried).barStart(9)) return carried;
    }
  }

  // Half the longest round trip the clock keeps, one way, plus a tick (F7).
  const SLOWEST = CLOCK.tooFar / 2 + 0.025;

  it("is filed by the host's Muse under the client's name, tagged with the session, as the host's own player's would be", () => {
    for (const bpm of [FUNK.style.bpm, 180]) {
      const { carried } = drumsOver(bpm, SLOWEST);
      const filed = carried.source.plans.layer!.filed;
      expect(filed.map((f) => f.fragment.id)).toEqual(['Ada song 3, bar 0']);
      expect(filed[0]!.meta).toEqual({
        source: 'Ada',
        created: 'song 3, bar 0',
        tags: [GROOVE_TAG, 'Friday jam'],
      });
      // Across the wire or struck at the host, the Muse files the same.
      expect(carried.source.plans.layer).toEqual(playedAtHost(bpm).source.plans.layer);
    }
  });

  it('is found at the point it was played at, and reads back as played, to the step the Muse rounds to', () => {
    const { carried } = drumsOver(FUNK.style.bpm, SLOWEST);
    const layer = carried.source.plans.layer!;
    const plan = carried.bars.at(-1)!.plan;
    const found = RHYTHM_REPOSITORY.query(
      stylePoint(writtenStyle(STYLE)),
      { meter: plan.meter, meterFragment: plan.meterFragment },
      layer,
    );
    expect(found[0]).toEqual({ id: 'Ada song 3, bar 0', distance: 0 });
    expect(readRhythm(layer.filed[0]!.fragment.text, plan.meter)!.hits).toEqual(
      PATTERN.map(({ note, step, velocity }) => ({
        role: note === DRUM_NOTES.kick ? 'kick' : note === DRUM_NOTES.snare ? 'backbeat' : 'hat',
        note,
        step,
        velocity,
      })),
    );
  });

  it('travels a bar a message, at most 90 bytes a note and 60 more for the message', () => {
    const { bytes } = drumsOver(FUNK.style.bpm, SLOWEST);
    expect(bytes.map((b) => b.notes)).toEqual(Array(8).fill(PATTERN.length));
    for (const { message, notes } of bytes) expect(message).toBeLessThanOrEqual(60 + 90 * notes);
  });

  it('reaches the host over a way back of a beat and a half, as a judgement does, and files nothing over a slower one', () => {
    for (const bpm of [60, 180]) {
      const beat = 60 / bpm;
      expect(drumsOver(bpm, 0.01, 1.5 * beat).carried.source.plans.layer!.filed).toHaveLength(1);
      expect(drumsOver(bpm, 0.01, 2 * beat).carried.source.plans.layer!.filed).toEqual([]);
    }
  });
});
