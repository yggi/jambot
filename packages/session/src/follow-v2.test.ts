/**
 * A client's band at session version 2 (`follow-v2.ts`, #553 rung 3): a host's song followed by its conducts and what
 * its scores state, over a link that serialises, held to the host's clock and frame bar by bar, with each way a bar is
 * lacked or silent shown.
 */

import {
  type BandBar,
  LOOKAHEAD,
  PRESETS,
  type ScheduledStep,
  type TransportEnv,
  clockOfTransport,
  holding,
  presetMode,
  sameMeter,
  transport,
  transportOver,
} from '@jambot/engine';
import { METERS, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  KEPT_BARS,
  LACKED_AS,
  SAYS,
  type ScoreArrival,
  type ScoreRead,
  type StatedBar,
  keptFrom,
  scoreSource,
  statedBars,
} from './follow-v2.ts';
import { conductOf } from './host-v2.ts';
import { sentBars } from './host.ts';
import type { BarConduct, SectionScore } from './protocol-v2.ts';
import { LACKED_WHYS } from './protocol.ts';

const style = { ...PRESETS[4]!.style, entropy: 0.3, bpm: 120 };
const wished = (head: number): TransportEnv => ({
  seed: 11,
  start: 1,
  track: holding(style),
  wish: { tonic: null, mode: presetMode(PRESETS[4]!)!, melodic: null },
  meter: head < 4 * 16 ? METERS['4/4'] : head < 12 * 16 ? METERS['7/8'] : METERS['4/4'],
});

/** A bar's digest, as a stand-in for what the score foresaw. */
const digestOf = (bar: number) => `d${bar}`;

/** What a score states of a bar the band composed: its frame, as a client reads it, and its digest. */
const statedOf = (b: BandBar): StatedBar => ({
  bar: b.bar,
  foreseen: digestOf(b.bar),
  kind: 'stated',
  frame: {
    meter: b.meter,
    swing: b.swing,
    key: b.plan.key,
    section: b.plan.section.type,
    energy: b.barEnergy,
    artic: b.style.artic,
    sync: b.style.sync,
  },
});

/**
 * A host whose song changes meter, and a client that follows its conducts and what its scores state over a link that
 * serialises; `told` may change what the client is told of a bar, or tell it nothing.
 */
function song(
  told: (b: BandBar) => StatedBar | null = statedOf,
  conducted: (bar: number) => boolean = () => true,
) {
  const follower = transportOver(scoreSource);
  let host = transport.initial;
  let client = follower.initial;
  let inbox: ScoreArrival[] = [];
  const hostSteps: ScheduledStep[] = [];
  const clientSteps: ScheduledStep[] = [];
  const hostBars = new Map<number, BandBar>();
  const clientBars = new Map<number, BandBar>();
  for (let t = 0.9; t < 40; t += 0.025) {
    const env = wished(host?.head.step ?? 0);
    const next = transport.advance(env, host, { now: t, until: t + LOOKAHEAD });
    host = next.carried;
    hostSteps.push(...next.output.steps);
    for (const b of next.output.composed) hostBars.set(b.bar, b);
    const sent = sentBars(
      next.output.composed,
      next.output.steps,
      host!.head,
      env.track,
      clockOfTransport(host),
    );
    const conducts = sent
      .filter((s) => conducted(s.bar.bar))
      .map((s) => conductOf(s, digestOf(s.bar.bar)));
    const stated = next.output.composed.flatMap((b) => told(b) ?? []);
    inbox.push(
      ...(JSON.parse(
        JSON.stringify([
          ...conducts.map((conduct) => ({ conduct })),
          ...stated.map((s) => ({ stated: s })),
        ]),
      ) as ScoreArrival[]),
    );
    if (client === null && inbox.length === 0) continue;
    const arrived = inbox;
    inbox = [];
    const got = follower.advance(env, client, { now: t, until: t + LOOKAHEAD, arrived });
    client = got.carried;
    clientSteps.push(...got.output.steps);
    for (const b of got.output.composed) clientBars.set(b.bar, b);
  }
  return { host: host!, client: client!, hostSteps, clientSteps, hostBars, clientBars };
}

describe('a client of session version 2 following a host’s conducts and scores (#553 rung 3)', () => {
  const played = song();

  it('reaches the host’s clock: the same changes of meter, every step where the host laid it', () => {
    expect(played.hostBars.size).toBeGreaterThan(20);
    expect(played.client.meters).toHaveLength(3);
    played.host.meters.forEach((change, i) => {
      expect(played.client.meters[i]!.bar).toBe(change.bar);
      expect(sameMeter(played.client.meters[i]!.meter, change.meter)).toBe(true);
    });
    const byStep = new Map(played.hostSteps.map((s) => [s.step, s]));
    expect(played.clientSteps.length).toBeGreaterThan(300);
    for (const s of played.clientSteps)
      expect([s.step, s.seconds]).toEqual([s.step, byStep.get(s.step)!.seconds]);
    expect(played.client.source).toMatchObject({ lacked: 0, silent: 0, said: [] });
  });

  it('plays each bar in the frame its score and conduct give, and none of the band’s own notes (finite: every bar)', () => {
    for (const [bar, made] of played.clientBars) {
      const hosted = played.hostBars.get(bar)!;
      const frame = (b: BandBar) => ({
        bar: b.bar,
        seed: b.seed,
        steps: stepsOf(b.meter),
        swing: b.swing,
        key: b.plan.key,
        section: b.plan.section.type,
        style: { entropy: b.style.entropy, artic: b.style.artic, sync: b.style.sync },
        energy: b.barEnergy,
        offer: b.offer,
      });
      expect(frame(made)).toEqual(frame(hosted));
      expect([bar, made.written, made.dough]).toEqual([bar, [], []]);
    }
  });

  it('lacks exactly a bar whose conduct’s digest isn’t its score’s, whose score is still read or locks what it lacks, and says why, as the contract’s `lacked` names it', () => {
    const wrong = song((b) =>
      b.bar === 9
        ? { ...statedOf(b), foreseen: 'other' }
        : b.bar === 11
          ? { bar: b.bar, foreseen: digestOf(b.bar), kind: 'reading' }
          : b.bar === 13
            ? { bar: b.bar, foreseen: digestOf(b.bar), kind: 'lacking', why: 'it locks a riff' }
            : statedOf(b),
    );
    expect(wrong.client.source.lacked).toBe(3);
    expect(wrong.client.source.silent).toBe(0);
    expect(wrong.client.source.said).toEqual([
      { bar: 9, why: 'digest', text: SAYS.digest },
      { bar: 11, why: 'late', text: SAYS.reading },
      { bar: 13, why: 'lock', text: 'it locks a riff' },
    ]);
    expect([...wrong.clientBars.keys()].filter((b) => !played.clientBars.has(b))).toEqual([]);
    expect([...played.clientBars.keys()].filter((b) => !wrong.clientBars.has(b))).toEqual([
      9, 11, 13,
    ]);
    // The bar after a lacked one starts where the host’s did, on the clock its conduct gives.
    const byStep = new Map(played.hostSteps.map((s) => [s.step, s]));
    for (const s of wrong.clientSteps) expect(s.seconds).toBe(byStep.get(s.step)!.seconds);
  });

  it('plays silent a bar no score states, counted and said, and lacks a bar no conduct came for', () => {
    const silent = song(
      (b) =>
        b.bar === 6
          ? null
          : b.bar === 7
            ? { bar: 7, foreseen: digestOf(7), kind: 'unstated', why: 'the key moves' }
            : statedOf(b),
      (bar) => bar !== 14,
    );
    expect(silent.client.source).toMatchObject({ lacked: 1, silent: 2 });
    expect(silent.client.source.said).toEqual([
      { bar: 6, why: 'silent', text: SAYS.noScore },
      { bar: 7, why: 'silent', text: 'the key moves' },
      { bar: 14, why: 'late', text: SAYS.noConduct },
    ]);
    expect([...played.clientBars.keys()].filter((b) => !silent.clientBars.has(b))).toEqual([
      6, 7, 14,
    ]);
  });
});

describe('why a client says it lacked a bar, as the contract names it (`LACKED_AS`)', () => {
  it('maps every way a follower lacks a bar onto one of the contract’s, and each of the contract’s is met', () => {
    expect(LACKED_AS).toEqual({
      noConduct: 'late',
      reading: 'late',
      noScore: 'silent',
      unstated: 'silent',
      digest: 'digest',
      lacking: 'lock',
    });
    expect(new Set(Object.values(LACKED_AS))).toEqual(new Set(LACKED_WHYS));
    // Every reason a follower says in words is one the map names.
    for (const key of Object.keys(SAYS)) expect(LACKED_AS, key).toHaveProperty(key);
  });
});

describe('what a score states of each of its bars, as a client reads it', () => {
  const score: SectionScore = {
    bar: 8,
    step: 128,
    section: 'groove',
    text: '&bar from meter 104bpm',
    unstated: null,
    lock: [],
    fragments: [],
    energy: [0.5, 0.6],
    foreseen: ['a', 'b'],
    cut: [],
  };
  const read: ScoreRead = {
    frame: {
      meter: METERS['4/4'],
      swing: { level: '16n', share: 0.6 },
      key: { tonic: 2, mode: 'dorian' },
      styles: [
        { artic: 0.1, sync: 0.2 },
        { artic: 0.3, sync: 0.4 },
      ],
    },
  };

  it('frames each bar by the score: its meter, swing and key, its section, and its energy and style at its place', () => {
    const { meter, swing, key } = 'frame' in read ? read.frame : ({} as never);
    const frame = { meter, swing, key, section: 'groove' };
    expect(statedBars(score, read)).toEqual([
      {
        bar: 8,
        foreseen: 'a',
        kind: 'stated',
        frame: { ...frame, energy: 0.5, artic: 0.1, sync: 0.2 },
      },
      {
        bar: 9,
        foreseen: 'b',
        kind: 'stated',
        frame: { ...frame, energy: 0.6, artic: 0.3, sync: 0.4 },
      },
    ]);
  });

  it('says a bar unstated, still read, or lacking, by its score', () => {
    expect(
      statedBars({ ...score, text: '', unstated: 'the key moves' }, read).map((s) => s.kind),
    ).toEqual(['unstated', 'unstated']);
    expect(statedBars(score, 'reading').map((s) => s.kind)).toEqual(['reading', 'reading']);
    expect(statedBars(score, { lacks: 'it locks muse_riff_1' })).toEqual([
      { bar: 8, foreseen: 'a', kind: 'lacking', why: 'it locks muse_riff_1' },
      { bar: 9, foreseen: 'b', kind: 'lacking', why: 'it locks muse_riff_1' },
    ]);
  });
});

describe('what a client keeps of what it was told (#553, #626)', () => {
  const conduct = (bar: number): BarConduct => ({
    bar,
    start: bar,
    seed: 1,
    entropy: 0.3,
    offer: null,
    foreseen: digestOf(bar),
  });
  const scoreOf = (bar: number, bars: number) => ({
    bar,
    foreseen: Array.from({ length: bars }, (_, i) => digestOf(bar + i)),
  });

  it('keeps the conducts of the last eight bars and on, and the scores in force for them', () => {
    const conducts = Array.from({ length: 30 }, (_, b) => conduct(b));
    const scores = [scoreOf(0, 8), scoreOf(8, 8), scoreOf(16, 8), scoreOf(20, 2), scoreOf(24, 8)];
    const kept = keptFrom(scores, conducts, 22);
    expect(KEPT_BARS).toBe(8);
    expect(kept.conducts.map((c) => c.bar)).toEqual(Array.from({ length: 16 }, (_, i) => 14 + i));
    expect(kept.scores).toEqual([scores[1], scores[2], scores[3], scores[4]]);
    expect(keptFrom(scores, conducts, 26).scores).toEqual([scores[2], scores[3], scores[4]]);
  });
});
