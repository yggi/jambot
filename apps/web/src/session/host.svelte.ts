/**
 * A host's session: the player hosting, and the clients who joined it.
 *
 * It opens the session in a lobby, admits a client of the same protocol
 * with a name, and welcomes it with where the song stands: the song, the
 * bars composed and not yet played, the section texts that state them while
 * the band plays through cells (#446), the bars ahead and the Muse. From then
 * on it tells every client what the player does (`Hosting`), answers each
 * ping with its page clock and its output's offset from it (`DeviceClocks`),
 * and passes what clients judged, and what they played on drums, named by
 * the player it seated (`heardFrom`, #410), to the player's Muse. A client silent for `SILENT` seconds has lost its
 * link. It keeps its seat, and comes back as the same player with the token
 * its welcome gave (`roster.ts`), as one whose link dropped does. What a
 * host needs to come back from a reload is kept as it changes
 * (`snapshot`), and `open` takes it up again.
 *
 * A session is open, as every session was, until the host asks for a code
 * (`admitByCode`, or `byCode` when it opens, #461): from then on a join with
 * the code joins to play, one without it joins to listen (what it plays,
 * judges or forgets reaches no Muse, and its welcome says so), and one with
 * another is refused; past `WRONG_CODES` wrong codes a minute, every code is
 * refused for the rest of the minute. A player seated before stays seated,
 * and one whose token opens its seat comes back as it was. The code is drawn
 * here, shown on the host's Session card, kept through a reload, and sent to
 * nobody: it travels only in a join.
 */

import type { ForecastBar } from '@jambot/engine';
import {
  CODE_WRONG,
  type ClientMessage,
  HOST_PLAYER,
  type HostMessage,
  type HostSnapshot,
  type MuseState,
  PROTOCOL,
  type Roster,
  admit,
  codeOf,
  expire,
  forecastDelta,
  heardFrom,
  leave,
  lose,
  memberAt,
  playerSource,
  present,
  WRONG_CODES,
  wrongCodesWithin,
} from '@jambot/session';
import type { Hosting, Player } from '../player.svelte.ts';
import type { DeviceClocks } from './clocks.ts';
import type { HostLink, Lobby } from './lobby.ts';

/** How long, in seconds, a client may be silent before it is taken to have gone. */
export const SILENT = 3;

export interface Guest {
  readonly id: string;
  readonly name: string;
}

/** Where a host keeps what it needs to come back from a reload. */
export interface HostKeep {
  save(snapshot: HostSnapshot): void;
  clear(): void;
}

export interface HostOptions {
  /** A token for a player that joins, which can't be guessed. */
  readonly mint?: () => string;
  /** Where a snapshot is kept, if anywhere. */
  readonly keep?: HostKeep;
  /** The time, in seconds since the epoch, that a snapshot is dated by. */
  readonly epoch?: () => number;
  /** A code to admit clients by, which can't be guessed but by trying (`CODE_DIGITS`). */
  readonly draw?: () => string;
}

/** A code drawn from the browser's randomness, as a resume token is. */
const drawCode = () => codeOf(() => crypto.getRandomValues(new Uint32Array(1))[0]!);

export class HostSession {
  /** The session's name, while it is open. */
  session: string | null = $state(null);
  guests: readonly Guest[] = $state.raw([]);
  /** Why the session ended, if it ended on its own. */
  ended: string | null = $state(null);
  /** The code clients are admitted by (#461), or null while the session is open to anyone who finds it. */
  code: string | null = $state(null);

  #player: Player;
  #clocks: DeviceClocks;
  #wallNow: () => number;
  #link: HostLink | null = null;
  /** When each client was last heard, by its id. */
  #lastHeard: Record<string, number> = {};
  #roster: Roster = [];
  /** When, on the wall clock, the wrong codes of the last `WRONG_CODES.seconds` were tried (#461). */
  #wrongCodes: number[] = [];
  #lobbyUrl = '';
  #mint: () => string;
  #keep: HostKeep | null;
  #epoch: () => number;
  #draw: () => string;
  #forecast: readonly ForecastBar[] = [];
  #muse: MuseState = {
    offer: null,
    memory: [],
    asOf: null,
    lastPlayed: null,
    log: [],
    dropped: [],
    players: {},
  };
  #sweep: ReturnType<typeof setInterval> | null = null;

  /**
   * `clocks` are what clients set their clocks by; `wallNow`, in seconds,
   * times their silence.
   */
  constructor(
    player: Player,
    clocks: DeviceClocks,
    wallNow: () => number = () => performance.now() / 1000,
    {
      mint = () => crypto.randomUUID(),
      keep,
      epoch = () => Date.now() / 1000,
      draw = drawCode,
    }: HostOptions = {},
  ) {
    this.#player = player;
    this.#clocks = clocks;
    this.#wallNow = wallNow;
    this.#mint = mint;
    this.#keep = keep ?? null;
    this.#epoch = epoch;
    this.#draw = draw;
  }

  /**
   * Open the session under a name, the host's own notes going by its
   * player's name, or by "the host" without one. Throws if the lobby
   * refuses it. Given the snapshot of a host that was reloaded, it takes
   * that session up again: under its name, by the secret the lobby gave,
   * with the players it had, all away until they come back, and the style
   * it was set to.
   */
  async open(
    lobby: Lobby,
    session: string,
    player = '',
    {
      restore,
      lobbyUrl = '',
      byCode = false,
    }: { restore?: HostSnapshot; lobbyUrl?: string; byCode?: boolean } = {},
  ) {
    this.#lobbyUrl = lobbyUrl;
    this.ended = null;
    await this.#player.prepareWithin();
    this.#link = await lobby.host(
      restore?.session ?? session,
      (message, from) => this.#hear(message, from),
      (why) => {
        this.#shutdown();
        this.ended = why;
      },
      restore?.reclaim ?? undefined,
    );
    this.session = (restore?.session ?? session).trim();
    this.code = restore ? (restore.code ?? null) : byCode ? this.#draw() : null;
    this.#player.mode = 'host';
    this.#player.playerId = HOST_PLAYER;
    this.#player.players = {};
    this.#forecast = this.#player.ahead;
    this.#muse = {
      offer: this.#player.offer,
      memory: this.#player.memory,
      asOf: this.#player.museBar,
      lastPlayed: this.#player.lastPlayed,
      log: this.#player.museLog,
      dropped: this.#player.dropped,
      players: {},
    };
    this.#name(HOST_PLAYER, (restore?.player ?? player).trim() || 'the host');
    if (restore) {
      const now = this.#wallNow();
      this.#roster = restore.roster.map((m) => ({ ...m, link: null, awaySince: now }));
      this.#player.players = {
        ...restore.players,
        [HOST_PLAYER]: this.#player.players[HOST_PLAYER]!,
      };
      this.#muse = { ...this.#muse, players: this.#player.players };
      this.#player.restore(restore);
    }
    this.#player.hosting = this.#hosting();
    this.#player.session = this.session;
    this.#sweep = setInterval(() => this.#dropSilent(), 1000);
    this.persist();
  }

  /**
   * Admit clients by a code from now on, a fresh one each time it is asked
   * (#461), or let anyone who finds the session join again. Who is seated
   * stays seated either way.
   */
  admitByCode(on: boolean) {
    this.code = on ? this.#draw() : null;
    this.persist();
  }

  /** The session is closed on purpose: its clients hear it, and nothing is kept to come back to. */
  close() {
    this.#link?.send({ kind: 'closed' });
    this.#keep?.clear();
    this.#shutdown();
  }

  /** Save what a reload needs, where it is kept: on every change, and as the page goes. */
  persist() {
    const link = this.#link;
    if (!this.#keep || !link || this.session === null) return;
    this.#keep.save({
      version: 1,
      savedAt: this.#epoch(),
      session: this.session,
      lobby: this.#lobbyUrl,
      reclaim: link.reclaim,
      player: this.#player.players[HOST_PLAYER] ?? '',
      roster: this.#roster.map(({ id, name, token, listens }) => ({
        id,
        name,
        token,
        ...(listens ? { listens } : {}),
      })),
      players: this.#player.players,
      // Its bpm counted in the meter asked for, which a reloaded host opens in (#367).
      track: this.#player.trackCountedIn(this.#player.meter),
      wish: this.#player.wish,
      tempoNudge: this.#player.tempoNudge,
      meter: this.#player.meter,
      swing: this.#player.swing,
      ...(this.#player.station ? { station: this.#player.station } : {}),
      code: this.code,
    });
  }

  #shutdown() {
    this.#link?.close();
    this.#link = null;
    if (this.#sweep) clearInterval(this.#sweep);
    this.#sweep = null;
    this.#player.hosting = null;
    this.#player.session = null;
    this.#player.playerId = null;
    this.#player.players = {};
    this.#player.mode = 'solo';
    this.session = null;
    this.code = null;
    this.guests = [];
    this.#roster = [];
    this.#wrongCodes = [];
    this.#lastHeard = {};
  }

  #seat(roster: Roster) {
    this.#roster = roster;
    this.guests = present(roster).map(({ id, name }) => ({ id, name }));
    this.persist();
  }

  #send(message: HostMessage, to?: string) {
    this.#link?.send(message, to);
  }

  #hosting(): Hosting {
    return {
      started: (song) => this.#send({ kind: 'start', song }),
      stopped: () => this.#send({ kind: 'stop' }),
      finale: (bar) => this.#send({ kind: 'finale', bar }),
      section: (text) => this.#send({ kind: 'section', ...text }),
      composed: (bars) => {
        for (const sent of bars) this.#send({ kind: 'bar', sent });
      },
      decided: (bars) => {
        this.#send({ kind: 'forecast', forecast: forecastDelta(this.#forecast, bars) });
        this.#forecast = bars;
      },
      track: (track, swing, tempoMeter) => {
        this.#send({ kind: 'track', track, swing, tempoMeter });
        this.persist();
      },
      meter: () => this.persist(),
      station: () => this.persist(),
      muse: (muse) => {
        this.#muse = muse;
        this.#send({ kind: 'muse', muse });
      },
    };
  }

  #hear(message: ClientMessage, from: string) {
    if (message.kind === 'join') return this.#admit(message, from);
    const member = memberAt(this.#roster, from);
    if (!member) return;
    this.#lastHeard[from] = this.#wallNow();
    switch (message.kind) {
      case 'ping': {
        const heard = this.#clocks.heardOffset();
        this.#send({ kind: 'pong', sent: message.sent, host: this.#clocks.page(), heard }, from);
        return;
      }
      case 'judged':
      case 'played':
      case 'forget':
        // A listener, seated without the code of a session by code, reaches no Muse (#461).
        if (member.listens) return;
        return this.#contribute(message, member);
      case 'leave':
        return this.#seat(leave(this.#roster, from));
      case 'lost':
        return this.#lose(from);
    }
  }

  /** What a seated player contributes reaches the host's Muse. */
  #contribute(
    message: ClientMessage & { kind: 'judged' | 'played' | 'forget' },
    member: { id: string; name: string },
  ) {
    switch (message.kind) {
      case 'judged': {
        // A client's source goes by the id of its link, which it can't choose.
        const judgement = {
          ...message.judgement,
          source: playerSource(member.id, message.judgement.source),
        };
        this.#player.judgedElsewhere([{ bar: message.bar, judgement }]);
        return;
      }
      case 'played':
        // Its Muse files a groove, or a bass line, under the name the player was seated by.
        return message.part === 'bass'
          ? this.#player.bassElsewhere(heardFrom(message, member.name, 'bass'))
          : this.#player.drumsElsewhere(heardFrom(message, member.name));
      case 'forget':
        return this.#player.forgetMotif();
    }
  }

  #admit(join: ClientMessage & { kind: 'join' }, from: string) {
    const admitted = admit(
      this.#roster,
      join,
      from,
      this.#mint(),
      this.#player.players[HOST_PLAYER] ?? '',
      this.code,
      wrongCodesWithin(this.#wrongCodes, this.#wallNow()).length >= WRONG_CODES.count,
    );
    if ('refusal' in admitted) {
      if (admitted.refusal === CODE_WRONG)
        this.#wrongCodes = [
          ...wrongCodesWithin(this.#wrongCodes, this.#wallNow()),
          this.#wallNow(),
        ];
      return this.#send({ kind: 'refused', reason: admitted.refusal }, from);
    }
    const { roster, member } = admitted;
    this.#name(member.id, member.name, false);
    this.#seat(roster);
    this.#lastHeard[from] = this.#wallNow();
    this.#send(
      {
        kind: 'welcome',
        protocol: PROTOCOL,
        session: this.session ?? '',
        resume: member.token,
        song: this.#player.hosted
          ? {
              ...this.#player.hosted.song,
              bars: this.#player.hosted.bars,
              texts: this.#player.hosted.texts,
            }
          : null,
        forecast: forecastDelta([], this.#forecast),
        muse: this.#muse,
        ...(member.listens ? { listening: true as const } : {}),
      },
      from,
    );
    // Everyone else learns the new player's name.
    this.#send({ kind: 'muse', muse: this.#muse });
  }

  /**
   * Name a player: its sources read by this name on the host and every
   * client, kept after it leaves, so the log still says who played.
   */
  #name(id: string, name: string, tell = true) {
    this.#player.players = { ...this.#player.players, [id]: name };
    this.#muse = { ...this.#muse, players: this.#player.players };
    if (tell) this.#send({ kind: 'muse', muse: this.#muse });
  }

  /** A client's link is gone: its seat is kept for it to come back to. */
  #lose(link: string) {
    delete this.#lastHeard[link];
    this.#seat(lose(this.#roster, link, this.#wallNow()));
  }

  #dropSilent() {
    const now = this.#wallNow();
    for (const [link, heard] of Object.entries(this.#lastHeard))
      if (now - heard > SILENT) this.#lose(link);
    const kept = expire(this.#roster, now);
    if (kept.length !== this.#roster.length) this.#seat(kept);
  }
}
