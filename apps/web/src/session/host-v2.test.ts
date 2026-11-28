/**
 * A host, as version 2 of the session contract has it (#553): what it sends,
 * read with a client's reader, and the contract's rules held over it
 * (yggi/music-commons `contracts/session` at fea947e). A client here is a
 * bare link that reads what it is sent.
 */

import { PRESETS, SECTION_BARS, replayOf } from '@jambot/engine';
import { DEFAULT_BAND, scoreLock } from '@jambot/score';
import {
  FIRST_PROTOCOL,
  type FragmentText,
  type HostMessage,
  PROTOCOL,
  readHostMessage,
} from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type SectionTexts, inlineTexts } from '../section-texts.ts';
import { device, memoryLobby } from './fixtures.ts';
import { HostSession } from './host.svelte.ts';
import type { Lobby } from './lobby.ts';

type Score = Extract<HostMessage, { kind: 'score' }>;

/** A message a bare client heard, when on the host's clock, and whether its bar plays a loop again. */
interface Heard {
  readonly at: number;
  readonly message: HostMessage;
  readonly looped: boolean;
}

/** A fragment the Muse filed, which the seed library lacks: what a host sends a client once. */
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

/** A host open, at a preset, its band started, and the bare clients that join it. */
async function hosting({
  preset = 'Funk',
  texts,
  started = true,
}: { preset?: string; texts?: () => SectionTexts; started?: boolean } = {}) {
  const lobby = memoryLobby();
  const host = device(100, texts);
  const session = new HostSession(host.player, host.clocks, () => host.world.currentTime);
  await session.open(lobby, 'Jam');
  host.player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === preset)! });
  if (started) await host.player.start();
  const links: { send: (m: never) => void; heard: Heard[]; raw: unknown[] }[] = [];
  /** A bare client joins, by its name, and its token if it comes back. */
  const join = async (name: string, resume?: string, protocol = PROTOCOL) => {
    const heard: Heard[] = [];
    const raw: unknown[] = [];
    const link = await (lobby as Lobby).join('Jam', (m) => {
      raw.push(m);
      const message = readHostMessage(m);
      if (!message) return;
      const bar = message.kind === 'conduct' ? message.bar : -1;
      heard.push({
        at: host.world.currentTime,
        message,
        looped: replayOf(host.player.loop, bar) !== null,
      });
    });
    const client = { send: link.send as (m: never) => void, heard, raw, close: link.close };
    link.send({ kind: 'join', protocol, name, ...(resume === undefined ? {} : { resume }) });
    links.push(client);
    return client;
  };
  /** The host's clock on by `seconds`, a tick each 25 ms, each client pinging each half second; `each` on every tick. */
  const run = async (seconds: number, each: () => void = () => {}) => {
    for (let t = 0; t < seconds; t += 0.025) {
      host.world.currentTime += 0.025;
      for (const tick of [...host.world.tickers]) tick();
      if (Math.round(t * 40) % 20 === 0)
        for (const l of links) l.send({ kind: 'ping', sent: host.world.currentTime } as never);
      each();
      await vi.advanceTimersByTimeAsync(25);
    }
  };
  return { host, session, join, run };
}

/** What a client heard, as its kinds' messages. */
const of = <K extends HostMessage['kind']>(heard: readonly Heard[], kind: K) =>
  heard.filter((h) => h.message.kind === kind) as (Heard & {
    message: Extract<HostMessage, { kind: K }>;
  })[];

/** The scores a client heard, its welcome's among them, each with when. */
const scoresOf = (heard: readonly Heard[]): { at: number; score: Score }[] => [
  ...of(heard, 'welcome').flatMap((h) =>
    (h.message.song?.scores ?? []).map((s) => ({
      at: h.at,
      score: { kind: 'score' as const, ...s },
    })),
  ),
  ...of(heard, 'score').map((h) => ({ at: h.at, score: h.message })),
];

/**
 * Each bar a client was conducted and laid, and the score in force for it as it starts: the latest heard before its
 * start that states it. It is stated where that score states it with the digest its conduct carries.
 */
function barsOf(heard: readonly Heard[]) {
  const scores = scoresOf(heard);
  return of(heard, 'conduct')
    .filter((c) => c.message.start !== null)
    .map(({ at, message: conduct, looped }) => {
      const score = scores
        .filter((s) => s.at <= conduct.start!)
        .map((s) => s.score)
        .findLast((s) => conduct.bar >= s.bar && conduct.bar < s.bar + s.foreseen.length);
      const stated =
        score !== undefined &&
        score.unstated === null &&
        score.foreseen[conduct.bar - score.bar] === conduct.foreseen;
      return { conduct, at, looped, score, stated };
    });
}

/** Seconds a beat lasts at a preset's tempo. */
const beatOf = (preset: string) => 60 / PRESETS.find((p) => p.name === preset)!.style.bpm;

describe('a host, as version 2 of the session contract has it (#553)', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('counts the bars each client tells it it lacked, by why and by the client, a listener’s too (minor 2)', async () => {
    const lacked = (bar: number, why: string) => ({ kind: 'lacked', bar, why, text: `bar ${bar}` });
    const { session, join, run } = await hosting({ started: false });
    const ada = await join('Ada');
    const bo = await join('Bo');
    await run(0.1);
    session.cast(session.guests[1]!.id, 'listener');
    for (const m of [lacked(3, 'late'), lacked(4, 'late'), lacked(5, 'digest')])
      ada.send(m as never);
    // (a malformed one is the lobby's reader's to drop, `readClientMessage`, as the contract's vectors hold)
    bo.send(lacked(6, 'silent') as never);
    await run(0.1);
    const [a, b] = session.guests.map((g) => g.id);
    expect(session.lacked).toEqual({
      [a!]: { silent: 0, digest: 1, lock: 0, late: 2 },
      [b!]: { silent: 1, digest: 0, lock: 0, late: 0 },
    });
    session.close();
    expect(session.lacked).toEqual({});
  });

  it('admits a join of version 2, and refuses one before it for its version', async () => {
    const { session, join, run } = await hosting();
    const old = await join('Old', undefined, FIRST_PROTOCOL - 1);
    const ada = await join('Ada');
    await run(0.1);
    expect(old.raw[0]).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/version/) });
    expect(ada.raw[0]).toMatchObject({ kind: 'welcome', protocol: PROTOCOL });
    expect(session.guests.map((g) => g.name)).toEqual(['Ada']);
    session.close();
  });

  it('sends only what a client reads: a conduct for each bar, a score for each section, never a bar or a text', async () => {
    const { session, join, run } = await hosting();
    await run(3);
    const ada = await join('Ada');
    await run(60);
    for (const m of ada.raw)
      expect(readHostMessage(m), JSON.stringify(m).slice(0, 80)).not.toBeNull();
    const kinds = new Set(ada.raw.map((m) => (m as { kind: string }).kind));
    expect(kinds).not.toContain('bar');
    expect(kinds).not.toContain('section');
    expect(kinds).toContain('conduct');
    expect(kinds).toContain('score');
    const [welcome] = of(ada.heard, 'welcome');
    expect(welcome!.message.band).toEqual(DEFAULT_BAND);
    expect(welcome!.message.fragments).toEqual([]);
    expect(welcome!.message.song!.conducts.length).toBeGreaterThan(0);
    expect(welcome!.message.song!.scores.length).toBeGreaterThan(0);
    session.close();
  });

  it('conducts each bar a beat before it, states each section four bars and a beat before it, and every bar by the score its conduct foresaw', async () => {
    const preset = 'Funk';
    const { session, join, run } = await hosting({ preset });
    const ada = await join('Ada');
    await run(80);
    const beat = beatOf(preset);
    const bars = barsOf(ada.heard);
    expect(bars.length).toBeGreaterThan(3 * SECTION_BARS);
    for (const { conduct, at, stated, score } of bars) {
      // (a beat ahead, less the tick it is composed on)
      expect(conduct.start! - at, `bar ${conduct.bar}`).toBeGreaterThan(beat - 0.05);
      expect(stated, `bar ${conduct.bar}`).toBe(true);
      // A score states its meter, tempo and key, and ends in its band.
      expect(score!.text).toMatch(/^&bar (swing=\S+ )?from bar.* \d+(\.\d+)?bpm$/m);
      expect(score!.text).toMatch(/^&key /m);
      expect(score!.text).toMatch(/^\* from band/m);
      expect(score!.lock).toEqual(scoreLock(score!.text).lock);
      expect(score!.lock.map((l) => l.id)).not.toContain('band');
    }
    // Each section after the first is stated four bars and a beat before it starts.
    const starts = new Map(bars.map((b) => [b.conduct.bar, b.conduct.start!]));
    const ahead = of(ada.heard, 'score').filter((s) => s.message.bar % SECTION_BARS === 0);
    expect(ahead.length).toBeGreaterThanOrEqual(3);
    for (const { at, message } of ahead) {
      const start = starts.get(message.bar);
      if (start === undefined) continue;
      expect(start - at, `section at ${message.bar}`).toBeGreaterThan(
        (SECTION_BARS / 2) * 4 * beat + beat - 0.05,
      );
    }
    session.close();
  });

  it('sends a fragment the Muse filed to each client once by its hash, and not again to one back with its token', async () => {
    const { host, session, join, run } = await hosting({ texts: filing, started: false });
    // Ada joins before the band starts: her welcome has no song, and the riff comes with the first score that locks it.
    const ada = await join('Ada');
    await host.player.start();
    await run(30);
    const bo = await join('Bo');
    await run(30);
    /** The riff's texts a client was sent, in its welcome and with its scores. */
    const riffs = (heard: readonly Heard[]) =>
      [
        ...of(heard, 'welcome').flatMap((h) => h.message.fragments),
        ...of(heard, 'score').flatMap((h) => h.message.fragments),
      ].filter((f) => f.hash === RIFF.hash);
    const scores = of(ada.heard, 'score');
    expect(scores.length).toBeGreaterThan(2);
    for (const { message } of scores)
      expect(message.lock).toContainEqual({ id: RIFF.id, hash: RIFF.hash });
    expect(riffs(ada.heard)).toEqual([RIFF]);
    expect(of(ada.heard, 'welcome')[0]!.message.fragments).toEqual([]);
    expect(riffs(bo.heard)).toEqual([RIFF]);
    // Ada's link drops, and she comes back with her token: she holds the riff already.
    const token = of(ada.heard, 'welcome')[0]!.message.resume;
    ada.close();
    await run(4);
    const back = await join('Ada', token);
    await run(30);
    expect(of(back.heard, 'welcome')).toHaveLength(1);
    expect(of(back.heard, 'score').length).toBeGreaterThan(0);
    expect(riffs(back.heard)).toEqual([]);
    // A seed is never sent.
    for (const c of [ada, bo, back])
      for (const f of [
        ...of(c.heard, 'welcome').flatMap((h) => h.message.fragments),
        ...of(c.heard, 'score').flatMap((h) => h.message.fragments),
      ])
        expect(f.id).toBe(RIFF.id);
    session.close();
  });
});

describe('a looped window, stated on the score wire (#553 rung 2, #626, #648)', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  /**
   * A key nudged early, so it moves at a section line, and the looper tapped over `window` bars (or a section asked to
   * repeat or lock) when the band composes bar `at`, let go when it composes `release`: the bars every client is
   * conducted, with the score in force for each.
   */
  async function looped(
    window: number | 'repeat' | 'lock',
    at: number,
    release: number,
    split?: boolean,
  ) {
    const { host, session, join, run } = await hosting();
    if (split !== undefined) host.player.shadow.split = split;
    const ada = await join('Ada');
    // (the last bar the client was conducted: the band composes the next)
    const bar = () => of(ada.heard, 'conduct').at(-1)?.message.bar ?? -1;
    let nudged = false;
    let tapped = false;
    let let_go = false;
    await run(80, () => {
      if (!nudged && bar() >= 1) {
        host.player.nudgeFrom('key', 1, 1);
        nudged = true;
      }
      if (!tapped && bar() >= at - 1) {
        if (typeof window === 'number') host.player.tapBars(window);
        else host.player.askSection('repeat');
        if (window === 'lock') host.player.askSection('lock');
        tapped = true;
      }
      if (tapped && !let_go && bar() >= release - 1) {
        if (typeof window === 'number') host.player.tapBars(window);
        else if (window === 'lock') host.player.askSection('lock');
        let_go = true;
      }
    });
    session.close();
    return barsOf(ada.heard);
  }

  // (chosen and named in the measure, #553: a key nudged at bar 1 moves at bar 16, and a window tapped as the band
  // composes bar 17, let go as it composes bar 23, so its last lap ends inside the section from 16)
  it('states every bar a looper of 1 bar plays, a window of one key', async () => {
    const bars = await looped(1, 17, 23);
    expect(bars.filter((b) => b.looped).length).toBeGreaterThan(0);
    expect(bars.filter((b) => !b.stated).map((b) => b.conduct.bar)).toEqual([]);
  }, 120_000);

  it('states every bar of a section repeated or locked, a held window (a repeat sign)', async () => {
    for (const held of ['repeat', 'lock'] as const) {
      const bars = await looped(held, 10, 27);
      expect(bars.filter((b) => b.looped).length, held).toBeGreaterThanOrEqual(SECTION_BARS);
      expect(
        bars.filter((b) => !b.stated).map((b) => b.conduct.bar),
        held,
      ).toEqual([]);
    }
  }, 120_000);

  it.each([2, 4])(
    'states every bar a looper of %i bars plays over two keys, which one text a section left unstated',
    async (window) => {
      const bars = await looped(window, 17, 23);
      expect(bars.filter((b) => b.looped).length).toBeGreaterThan(0);
      expect(bars.filter((b) => !b.stated).map((b) => b.conduct.bar)).toEqual([]);
      const unsplit = await looped(window, 17, 23, false);
      expect(unsplit.filter((b) => b.looped && !b.stated).length).toBeGreaterThan(0);
    },
    120_000,
  );
});
