/**
 * A host and a client, as version 2 of the session contract has them (#553): the client plays the host's scores on the
 * clock its conducts give, read from the scores alone (yggi/music-commons `contracts/session`, minor 3), held against
 * what the host plays, and tells the host each bar it didn't play (`lacked`), which the host counts by client.
 */

import { PRESETS } from '@jambot/engine';
import {
  type ClientResume,
  type FragmentText,
  type HostMessage,
  KEPT_BARS,
  NO_LACKED,
  SAYS,
  lackedIn,
  readHostMessage,
} from '@jambot/session';
import { METERS } from '@jambot/theory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compareSession } from '../played.ts';
import { type SectionTexts, inlineTexts } from '../section-texts.ts';
import { ClientSession } from './client.svelte.ts';
import { device, memoryLobby } from './fixtures.ts';
import { HostSession } from './host.svelte.ts';
import type { Lobby } from './lobby.ts';

type Device = ReturnType<typeof device>;

/** Every device a tick on, every 25 ms, for `seconds`. */
async function run(devices: Device[], seconds: number) {
  for (let t = 0; t < seconds; t += 0.025) {
    for (const d of devices) {
      d.world.currentTime += 0.025;
      for (const tick of [...d.world.tickers]) tick();
    }
    await vi.advanceTimersByTimeAsync(25);
  }
}

/** This issue's bound (#553): 32 bars of Funk, seed 1. */
const FUNK_BARS = 32;

/** The seconds `bars` bars of Funk take, with a bar of count-in and a bar for the last to be played. */
const funkSeconds = (bars: number) =>
  ((bars + 2) * 4 * 60) / PRESETS.find((p) => p.name === 'Funk')!.style.bpm;

/** A lobby whose messages to a client `alter` may change, or drop where it gives null. */
function altering(lobby: Lobby, alter: (m: HostMessage) => HostMessage | null): Lobby {
  return {
    ...lobby,
    join: (session, hear, lost) =>
      lobby.join(
        session,
        (m) => {
          const altered = alter(m);
          if (altered) hear(altered);
        },
        lost,
      ),
  };
}

/** A host at Funk, seed 1 (or in the meter asked), and a client joined before it starts. */
async function session({
  alter,
  texts,
  meter,
}: {
  alter?: (m: HostMessage) => HostMessage | null;
  texts?: () => SectionTexts;
  meter?: keyof typeof METERS;
} = {}) {
  const lobby = memoryLobby();
  const host = device(105, texts, undefined, 1);
  const client = device(100, undefined, undefined, 1);
  const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
  await hosting.open(lobby, 'Jam');
  host.player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === 'Funk')! });
  if (meter) host.player.setMeter(METERS[meter]);
  const following = new ClientSession(client.player, client.clocks);
  await following.join(alter ? altering(lobby, alter) : lobby, 'Jam', 'Ada');
  await host.player.start();
  return { lobby, host, client, hosting, following };
}

/** The bars a device's outputs played in, each once. */
const barsPlayed = (d: Device) =>
  [...new Set(d.player.played.since().events.map((e) => e.bar))].sort((a, b) => a - b);

/** What two devices played, event by event (`compareSession`). */
const versus = (a: Device, b: Device) =>
  compareSession(a.player.played.since().events, b.player.played.since().events);

/** Nothing parts: every event matched, none lacked. */
const AGREED = {
  mismatched: { velocity: 0, length: 0, onset: 0, duration: 0 },
  lacked: { host: { events: 0, unexplained: 0 }, client: { events: 0, unexplained: 0 } },
};

/** A fragment the Muse filed, which the seed library lacks: what a host sends a client once (as `host-v2.test.ts`). */
const RIFF: FragmentText = {
  id: 'muse_riff_1',
  hash: 'e2:00000000000000a1',
  text: '&muse_riff_1 step=8n 0 2 4 2',
};

/** Texts built on the thread that asks, each locking the riff as well, as a score that takes a filed fragment would. */
const filing = (): SectionTexts => {
  const inline = inlineTexts();
  return {
    ...inline,
    ask: (bars, answer) =>
      inline.ask(bars, (stated) =>
        answer(
          stated.source === ''
            ? stated
            : {
                ...stated,
                lock: [...stated.lock, { id: RIFF.id, hash: RIFF.hash }],
                filed: [RIFF],
              },
        ),
      ),
  };
};

/** The riff's texts in what a client was sent, read as a host's messages. */
const riffsIn = (heard: readonly HostMessage[]) =>
  heard
    .map(readHostMessage)
    .flatMap((m) => (m?.kind === 'welcome' || m?.kind === 'score' ? m.fragments : []))
    .filter((f) => f.hash === RIFF.hash);

describe('a client playing its host’s scores (#553)', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('plays 32 bars of Funk at seed 1 from the scores alone, lacking none and silent in none, event for event as its host', async () => {
    const { client, host, hosting, following } = await session();
    await run([host, client], funkSeconds(FUNK_BARS));
    expect(client.player.shadow.readout.from).toBe('scored');
    expect(barsPlayed(client).slice(0, FUNK_BARS)).toEqual(
      Array.from({ length: FUNK_BARS }, (_, b) => b),
    );
    expect([client.player.lacked, client.player.silent, client.player.said]).toEqual([0, 0, []]);
    // The host's count of the bars its client lacked, which the soak's bound reads: none.
    expect(lackedIn(hosting.lacked)).toEqual({ ...NO_LACKED, bars: 0 });
    // None of the band's own notes: every event the client played is cells'.
    expect(client.player.shadow.readout.played.band).toBe(0);
    expect(client.player.shadow.readout.errors).toEqual([]);
    // (the comparison: each event's bar, step, part and pitch, its onset and its end on the host's clock, its velocity
    // and length, `compareSession`; the feel's frame from the score and the conduct gives the host's own)
    const compared = versus(host, client);
    expect(compared.events).toBeGreaterThan(1000);
    expect(compared.bars.to).toBeGreaterThanOrEqual(FUNK_BARS);
    expect(compared).toMatchObject(AGREED);
    following.leave();
    hosting.close();
  }, 240_000);

  it('plays as its host does while the radio glides the style through the bars, the host sounding its own scores and conducts through its own player (#711)', async () => {
    const { host, client, hosting, following } = await session();
    host.player.tuneRadio(true);
    await run([host, client], funkSeconds(FUNK_BARS));
    // (the radio walked: the style glides from the second section on, as in the session soak of #710)
    expect(host.player.station!.walked).toBeGreaterThan(1);
    expect([host.player.lacked, host.player.silent]).toEqual([0, 0]);
    expect([client.player.lacked, client.player.silent]).toEqual([0, 0]);
    expect(host.player.shadow.readout.played.band).toBe(0);
    const compared = versus(host, client);
    expect(compared.events).toBeGreaterThan(1000);
    expect(compared.bars.to).toBeGreaterThanOrEqual(FUNK_BARS);
    expect(compared, compared.differing.slice(0, 3).join('\n')).toMatchObject(AGREED);
    following.leave();
    hosting.close();
  }, 240_000);

  it('plays from a welcome’s scores and conducts as one that joins mid-song, and keeps the last eight bars’ scores and conducts', async () => {
    const { lobby, host, client, hosting, following } = await session();
    await run([host, client], 20);
    const late = device(95, undefined, undefined, 1);
    const joining = new ClientSession(late.player, late.clocks);
    await joining.join(lobby, 'Jam', 'Bo');
    await run([host, client, late], 30);
    expect(late.player.shadow.readout.texts.joined).toBeGreaterThan(0);
    expect([late.player.lacked, late.player.silent]).toEqual([0, 0]);
    const compared = versus(host, late);
    expect(compared.events).toBeGreaterThan(300);
    expect(compared).toMatchObject(AGREED);
    // What it keeps: the conducts from eight bars before the bar playing on, and the scores in force for each of them.
    const kept = client.player.kept!;
    // (the bar its transport lays: the last it played)
    const playing = barsPlayed(client).at(-1)!;
    const bars = kept.conducts.map((c) => c.bar);
    expect(KEPT_BARS).toBe(8);
    expect(bars[0]).toBeLessThanOrEqual(playing - KEPT_BARS + 1);
    expect(bars[0]).toBeGreaterThanOrEqual(playing - KEPT_BARS - 1);
    for (const bar of bars)
      expect(
        kept.scores.some((s) => bar >= s.bar && bar < s.bar + s.foreseen.length),
        `bar ${bar}`,
      ).toBe(true);
    expect(host.player.kept).toBeNull();
    joining.leave();
    following.leave();
    hosting.close();
  }, 240_000);

  it('lacks exactly the bar whose conduct carries another digest than its score foresaw, and says why', async () => {
    const wrong = 12;
    const { host, client, hosting, following } = await session({
      alter: (m) =>
        m.kind === 'conduct' && m.bar === wrong ? { ...m, foreseen: 'not the score’s' } : m,
    });
    await run([host, client], funkSeconds(20));
    expect(client.player.lacked).toBe(1);
    expect(client.player.silent).toBe(0);
    expect(client.player.said).toEqual([{ bar: wrong, why: 'digest', text: SAYS.digest }]);
    // The client told its host, which counts it by the client's seat.
    expect(hosting.lacked).toEqual({ [hosting.guests[0]!.id]: { ...NO_LACKED, digest: 1 } });
    const played = barsPlayed(client);
    expect(played).not.toContain(wrong);
    expect(played).toContain(wrong - 1);
    expect(played).toContain(wrong + 1);
    // (shown firing: the bar the host played, the client didn't)
    expect(barsPlayed(host)).toContain(wrong);
    following.leave();
    hosting.close();
  }, 240_000);

  it('plays silent the bars no score states, counted and said, and lacks none', async () => {
    const from = 2 * 8;
    type Score = Extract<HostMessage, { kind: 'score' }>;
    const unstate = (m: Score): Score =>
      m.bar === from ? { ...m, text: '', unstated: 'a test states none', lock: [] } : m;
    const { host, client, hosting, following } = await session({
      alter: (m) => (m.kind === 'score' ? unstate(m as Score) : m),
    });
    await run([host, client], funkSeconds(28));
    const silent = Array.from({ length: 8 }, (_, i) => from + i);
    expect(client.player.silent).toBe(silent.length);
    expect(client.player.lacked).toBe(0);
    expect(client.player.said).toEqual(
      silent.map((bar) => ({ bar, why: 'silent', text: 'a test states none' })),
    );
    expect(hosting.lacked).toEqual({
      [hosting.guests[0]!.id]: { ...NO_LACKED, silent: silent.length },
    });
    const played = barsPlayed(client);
    for (const bar of silent) expect(played).not.toContain(bar);
    expect(played).toContain(from - 1);
    expect(played).toContain(from + 8);
    following.leave();
    hosting.close();
  }, 240_000);

  it('keeps the fragments a host sent through a reload, so the host sends them 0 times again and it plays on, lacking none', async () => {
    const lobby = memoryLobby();
    const host = device(105, filing, undefined, 1);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'Jam');
    host.player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === 'Funk')! });
    /** A page: its device, its client and what it kept, its link cut as a page that closes cuts it. */
    const page = async (resume?: ClientResume) => {
      const d = device(100, undefined, undefined, 1);
      const saved: ClientResume[] = [];
      const heard: HostMessage[] = [];
      let closed = false;
      const link: Lobby = {
        ...lobby,
        join: (session, hear, lost) =>
          closed
            ? Promise.reject(new Error('the page closed'))
            : lobby.join(session, (m) => void (closed || (heard.push(m), hear(m))), lost),
      };
      const following = new ClientSession(d.player, d.clocks, {
        keep: { save: (r) => void saved.push(r), clear: () => {} },
      });
      await following.join(link, 'Jam', 'Ada', {
        lobbyUrl: '',
        ...(resume && { resume: resume.token, fragments: resume.fragments ?? [] }),
      });
      const close = () => {
        closed = true;
        lobby.cut('Jam');
      };
      return { d, following, saved, heard, close };
    };
    const first = await page();
    await host.player.start();
    await run([host, first.d], 30);
    expect(riffsIn(first.heard)).toEqual([RIFF]);
    expect(first.following.fragments).toEqual([RIFF]);
    expect(first.d.player.lacked).toBe(0);
    const kept = first.saved.at(-1)!;
    expect(kept.fragments).toEqual([RIFF]);

    // The page reloads: it joins again by its token, holding what it kept.
    first.close();
    const back = await page(kept);
    await run([host, back.d], 30);
    expect(back.following.status).toBe('joined');
    expect(riffsIn(back.heard)).toEqual([]);
    expect(barsPlayed(back.d).length).toBeGreaterThan(8);
    expect([back.d.player.lacked, back.d.player.silent]).toEqual([0, 0]);

    // (shown firing: a page that kept no fragments is not sent the riff again either, and lacks every bar that locks it)
    back.close();
    const bare = await page({ ...kept, fragments: [] });
    await run([host, bare.d], 10);
    expect(riffsIn(bare.heard)).toEqual([]);
    expect(bare.d.player.lacked).toBeGreaterThan(0);
    expect(bare.d.player.said.at(-1)).toMatchObject({ why: 'lock', text: /muse_riff_1/ });
    // Its host counts each of those bars as lacked for the lock, and none before the reload.
    expect(hosting.lacked).toEqual({
      [hosting.guests[0]!.id]: { ...NO_LACKED, lock: bare.d.player.lacked },
    });
    bare.following.leave();
    hosting.close();
  }, 240_000);

  it('this issue’s bound: a client with no fragment of its own plays 32 bars of Funk, seed 1, with 0 errors, sent each fragment text once (the reload’s test holds the other: one it holds, 0 times)', async () => {
    const lobby = memoryLobby();
    const host = device(105, filing, undefined, 1);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'Jam');
    host.player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === 'Funk')! });
    const heard = (into: HostMessage[]): Lobby => ({
      ...lobby,
      join: (session, hear, lost) => lobby.join(session, (m) => (into.push(m), hear(m)), lost),
    });
    const empty: HostMessage[] = [];
    const fresh = device(100, undefined, undefined, 1);
    const following = new ClientSession(fresh.player, fresh.clocks);
    await following.join(heard(empty), 'Jam', 'Ada');
    await host.player.start();
    await run([host, fresh], funkSeconds(FUNK_BARS));
    expect(barsPlayed(fresh).slice(0, FUNK_BARS)).toEqual(
      Array.from({ length: FUNK_BARS }, (_, b) => b),
    );
    expect(fresh.player.shadow.readout.errors).toEqual([]);
    expect([fresh.player.lacked, fresh.player.silent]).toEqual([0, 0]);
    expect(lackedIn(hosting.lacked).bars).toBe(0);
    // Each fragment text sent once: the riff, in the first score that locks it, and in no score after.
    expect(riffsIn(empty)).toEqual([RIFF]);
    const scores = empty.filter((m) => m.kind === 'score');
    expect(scores.length).toBeGreaterThan(4);
    const bytes = (ms: readonly unknown[]) =>
      ms.reduce<number>((n, m) => n + JSON.stringify(m).length, 0);
    expect(bytes(riffsIn(empty))).toBe(JSON.stringify(RIFF).length);
    // (measured at #553's rung 4: the riff 87 bytes as JSON, 5 scores 16,944 bytes, 400 messages 105,191 bytes in all)
    expect(bytes(scores)).toBeLessThan(20_000);
    expect(bytes(empty)).toBeLessThan(120_000);
    following.leave();
    hosting.close();
  }, 240_000);

  it.each(['6/8', '7/8'] as const)(
    "counts a client in the host's meter, %s, to the host's clicks, and ends it on the host's last bar",
    async (meter) => {
      const { host, client, hosting, following } = await session({ meter });
      await run([host, client], 1);
      // The count-in is a bar of the meter the song opens in: the drummer's, a click of the count on each of its beats,
      // on the host's clock (#646).
      const counted = (d: typeof host) =>
        d.world.plays.filter((p) => p.part === 'drums' && p.seconds < d.player.songStart - 1e-9);
      expect(host.world.clicks).toEqual([]);
      expect(counted(host).length).toBe(meter === '6/8' ? 2 : 3);
      const mine = counted(client);
      expect(mine.length).toBeGreaterThan(0);
      const theirs = counted(host).slice(-mine.length);
      expect(mine.map((p) => [p.note, p.velocity])).toEqual(
        theirs.map((p) => [p.note, p.velocity]),
      );
      mine.forEach((p, i) =>
        expect(Math.abs(p.seconds + 5 - theirs[i]!.seconds)).toBeLessThan(0.001),
      );
      await run([host, client], 10);
      host.player.stop();
      await run([host, client], 1);
      // The finale: the host's last bar, which the client counts down to and plays through.
      expect(client.player.lastBar).not.toBeNull();
      expect(client.player.lastBar).toBe(host.player.lastBar);
      await run([host, client], 12);
      expect([host.player.status, client.player.status]).toEqual(['stopped', 'stopped']);
      expect([client.player.lacked, client.player.silent]).toEqual([0, 0]);
      following.leave();
      hosting.close();
    },
    240_000,
  );
});
