import {
  type BandBar,
  LOOKAHEAD,
  PRESETS,
  type ScheduledStep,
  type TransportEnv,
  clockOfTransport,
  holding,
  sameMeter,
  transport,
  transportOver,
} from '@jambot/engine';
import { METERS, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { followSource } from './follow.ts';
import { sentBars } from './host.ts';
import type { SentBar } from './protocol.ts';

const style = { ...PRESETS[4]!.style, entropy: 0.3, bpm: 120 };
const wished = (head: number): TransportEnv => ({
  seed: 11,
  start: 1,
  track: holding(style),
  wish: { tonic: null, mode: PRESETS[4]!.mode, melodic: null },
  meter: head < 4 * 16 ? METERS['4/4'] : head < 12 * 16 ? METERS['7/8'] : METERS['4/4'],
});

/** A host whose song changes meter and a client that follows it over a link that serialises, as a WebSocket does. */
function song() {
  const follower = transportOver(followSource);
  let host = transport.initial;
  let client = follower.initial;
  let inbox: SentBar[] = [];
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
    inbox.push(...(JSON.parse(JSON.stringify(sent)) as SentBar[]));
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

describe('a client following a host whose song changes meter (#261)', () => {
  const played = song();

  it('reaches the host’s clock: the same changes of meter', () => {
    expect(played.hostBars.size).toBeGreaterThan(20);
    expect(played.host.meters).toHaveLength(3);
    expect(played.client.meters).toHaveLength(3);
    played.host.meters.forEach((change, i) => {
      expect(played.client.meters[i]!.bar).toBe(change.bar);
      expect(sameMeter(played.client.meters[i]!.meter, change.meter)).toBe(true);
    });
  });

  it('plays each bar exactly as the host did, in the meter it gave it, through the wire (finite: every bar)', () => {
    let sevens = 0;
    for (const [bar, made] of played.clientBars) {
      const hosted = played.hostBars.get(bar)!;
      expect([bar, stepsOf(made.meter)]).toEqual([bar, stepsOf(hosted.meter)]);
      expect([bar, made.written]).toEqual([bar, hosted.written]);
      expect([bar, made.dough]).toEqual([bar, hosted.dough]);
      if (stepsOf(made.meter) === 14) sevens++;
    }
    expect(sevens).toBe(8);
  });

  it('lays every step where the host laid it, on its own clock', () => {
    const byStep = new Map(played.hostSteps.map((s) => [s.step, s]));
    expect(played.clientSteps.length).toBeGreaterThan(300);
    for (const s of played.clientSteps) {
      const host = byStep.get(s.step);
      if (host) expect([s.step, s.seconds]).toEqual([s.step, host.seconds]);
    }
  });
});
