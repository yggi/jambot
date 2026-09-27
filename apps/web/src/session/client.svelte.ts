/**
 * A client's session: the player following a host.
 *
 * It joins a session by name and pings the host from the start. The pings
 * set the player's clock by the host's (`hostClock`), both read as the
 * moment each output is heard (`heardNow`), so a note sounds here as it
 * sounds at the host, whatever each output's latency. A song waits until the clock is trusted, then plays from the bars
 * the host sent. Everything else the host says goes to the player as it
 * comes: bars, the style, the bars ahead and the Muse. What the player's
 * ear judged goes to the host, its sources named by this player's name.
 *
 * It leaves when asked, when the host closes or refuses it, when the host
 * is too far away for playing together (`CLOCK.tooFar`), and when no
 * welcome comes within `WELCOME_WAIT`.
 */

import type { ForecastBar } from '@jambot/engine';
import {
  type ClientMessage,
  type HostMessage,
  PROTOCOL,
  type SentBar,
  type Song,
  applyForecast,
  hostClock,
} from '@jambot/session';
import type { Player } from '../player.svelte.ts';
import type { ClientLink, Lobby } from './lobby.ts';

/** How long, in milliseconds, a client waits for a host to welcome it. */
export const WELCOME_WAIT = 2000;

/** How often, in milliseconds, a client pings: quickly until its clock is trusted, then steadily. */
export const PING_EVERY = { settling: 50, steady: 250 } as const;

export type ClientStatus = 'idle' | 'joining' | 'joined';

export class ClientSession {
  status: ClientStatus = $state('idle');
  /** The session joined, and this player's name in it. */
  session: string | null = $state(null);
  name: string | null = $state(null);
  /** Whether the host is playing a song. */
  hostPlaying = $state(false);
  /** The shortest round trip to the host lately, in milliseconds, once measured. */
  trip: number | null = $state(null);
  /** Why the session ended, if it ended on its own. */
  ended: string | null = $state(null);

  #player: Player;
  #heardNow: () => number | null;
  #link: ClientLink | null = null;
  #clock = hostClock.initial;
  #pinging: ReturnType<typeof setTimeout> | null = null;
  #welcomeWait: ReturnType<typeof setTimeout> | null = null;
  #held: ForecastBar[] = [];
  /** A song the host plays, waiting for the clock to be trusted. */
  #pending: { song: Song; bars: SentBar[] } | null = null;

  /** `heardNow` is the moment the output is heard now, on its clock. */
  constructor(player: Player, heardNow: () => number | null) {
    this.#player = player;
    this.#heardNow = heardNow;
  }

  async join(lobby: Lobby, session: string, name: string) {
    this.leave();
    this.ended = null;
    this.status = 'joining';
    this.session = session.trim();
    this.name = name.trim();
    await this.#player.prepare();
    this.#player.follow({
      judged: (judged) => {
        for (const { bar, judgement } of judged) this.#send({ kind: 'judged', bar, judgement });
      },
      forget: () => this.#send({ kind: 'forget' }),
    });
    this.#link = await lobby.join(session, (message) => this.#hear(message));
    this.#welcomeWait = setTimeout(
      () => this.#end(`No session named “${this.session}” answered.`),
      WELCOME_WAIT,
    );
    this.#send({ kind: 'join', protocol: PROTOCOL, name: this.name });
  }

  leave() {
    if (this.status === 'idle') return;
    this.#send({ kind: 'leave' });
    this.#end(null);
  }

  #end(why: string | null) {
    this.#link?.close();
    this.#link = null;
    if (this.#pinging) clearTimeout(this.#pinging);
    if (this.#welcomeWait) clearTimeout(this.#welcomeWait);
    this.#pinging = this.#welcomeWait = null;
    this.#clock = hostClock.initial;
    this.#pending = null;
    this.#held = [];
    this.#player.unfollow();
    this.status = 'idle';
    this.hostPlaying = false;
    this.trip = null;
    this.ended = why;
  }

  #send(message: ClientMessage) {
    this.#link?.send(message);
  }

  #ping() {
    const sent = this.#heardNow();
    if (sent !== null) this.#send({ kind: 'ping', sent });
    const every = this.#clock.offset === null ? PING_EVERY.settling : PING_EVERY.steady;
    this.#pinging = setTimeout(() => this.#ping(), every);
  }

  #hear(message: HostMessage) {
    switch (message.kind) {
      case 'welcome':
        if (this.#welcomeWait) clearTimeout(this.#welcomeWait);
        this.#welcomeWait = null;
        this.status = 'joined';
        this.#forecast(message.forecast);
        this.#player.followMuse(message.muse);
        if (message.song) this.#play(message.song, message.song.bars);
        this.#ping();
        return;
      case 'refused':
        return this.#end(message.reason);
      case 'closed':
        return this.#end('The host closed the session.');
      case 'pong':
        return this.#pong(message.sent, message.host);
      case 'start':
        return this.#play(message.song, []);
      case 'bar':
        if (this.#pending) this.#pending.bars.push(message.sent);
        else this.#player.followBar(message.sent);
        return;
      case 'track':
        return this.#player.followTrack(message.track);
      case 'forecast':
        return this.#forecast(message.forecast);
      case 'muse':
        return this.#player.followMuse(message.muse);
      case 'stop':
        this.hostPlaying = false;
        this.#pending = null;
        return this.#player.stop();
    }
  }

  #forecast(delta: Parameters<typeof applyForecast>[1]) {
    this.#held = applyForecast(this.#held, delta);
    this.#player.followForecast(this.#held);
  }

  #play(song: Song, bars: readonly SentBar[]) {
    this.hostPlaying = true;
    this.#pending = { song, bars: [...bars] };
    this.#startWhenReady();
  }

  #startWhenReady() {
    const pending = this.#pending;
    if (!pending || this.#clock.offset === null) return;
    this.#pending = null;
    this.#player.skew = this.#clock.offset;
    void this.#player.followSong(pending.song, pending.bars);
  }

  #pong(sent: number, host: number) {
    const received = this.#heardNow();
    if (received === null) return;
    const { carried, output } = hostClock.advance(null, this.#clock, { sent, received, host });
    this.#clock = carried;
    if (output.trip !== null) this.trip = Math.round(output.trip * 1000);
    if (output.tooFar)
      return this.#end(
        `The host is ${this.trip} ms away and back: too far to play together. Jambot is played in one room.`,
      );
    if (output.offset !== null) this.#player.skew = output.offset;
    this.#startWhenReady();
  }
}
