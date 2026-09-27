/**
 * The player: the band on this device's clock.
 *
 * It runs the transport on the audio clock, a tick every 25 ms, and plays
 * the events it schedules on an output, the built-in synth by default. What
 * is on screen follows what is heard: scheduled steps wait until the audio
 * clock reaches them, and those older than a second, which can no longer be
 * shown, are dropped on every tick, so a hidden tab builds up no backlog.
 * The style track and the key wished for live here, and intents go through
 * the conductor.
 *
 * The player also keeps the bars decided ahead (`forecast`), from the one
 * heard on, and shows everything through one snapshot, `hud` (`hudOf`).
 * The forecast is renewed once a bar and whenever a control moves, so it
 * is what will play. The seed of the next song is drawn while the band is
 * stopped, so even the bar it opens on is shown truly before the start.
 *
 * Starting waits for the audio clock, which a browser starts only after a
 * gesture. While it waits the player is starting: another start does
 * nothing, and a stop cancels it.
 *
 * Playing along shares that clock and that output: `playAlong` is the
 * instruments' way to be heard, for a finger on the keyboard or the pads, a
 * computer key or a MIDI note. It plays at once, on the same synth the band
 * uses, but it is not part of the band: only the band's own notes ever
 * appear in `sounding`.
 *
 * It plays alone, hosts a session, or follows a host (`mode`). A host plays
 * as it does alone and tells its session what it does (`hosting`): the
 * song it starts, each bar as it composes it, the bars ahead, the style
 * and the Muse; and its Muse hears the bars its clients judged. A client
 * plays the host's bars with its own output (`followSource`), on the
 * host's clock: its transport runs in the host's time, and `skew` maps it
 * onto this device's clock, so a note sounds here when it sounds at the
 * host. Its style, bars ahead and Muse are the host's; its players' notes
 * go to its ear (`earListen`), and what it judges goes to the host.
 */

import {
  type BarJudgement,
  type DroppedJudgement,
  type ForecastBar,
  INITIAL_STYLE,
  type KeyWish,
  LOOKAHEAD,
  type HeardNote,
  type Key,
  type MuseOutput,
  type Offer,
  type Part,
  PRESETS,
  type ScheduledStep,
  soundOf,
  styleAt,
  type StyleTrack,
  type TransportCarried,
  type TransportEnv,
  type TransportOutput,
  forecast,
  holding,
  transport,
  transportOver,
  writtenAt,
} from '@jambot/engine';
import {
  EAR,
  type EarCarried,
  type FollowCarried,
  type MuseState,
  type SentBar,
  type Song,
  followSource,
  earListen,
  sentBars,
  playerSource,
} from '@jambot/session';
import { type Output, webAudioOutput } from './audio/output.ts';
import { type Intent, conduct, stopAt, wishAfter } from './conductor.ts';
import { Heard } from './heard.ts';
import { type Hud, SECTIONS, hudOf } from './hud.ts';
import { EMPTY_PATTERN, Pattern, type BarPattern } from './pattern.ts';
import { Sounding, type SoundingNotes, memberOf } from './sounding.ts';
import { startTicker } from './ticker.ts';

const SILENT: SoundingNotes = { drums: [], bass: [], comp: [], lead: [] };

/** A part an instrument, not the band, can play along on. */
export type AlongPart = Extract<Part, 'lead' | 'drums'>;

/** How long a note played along sounds, in seconds: held for the keyboard, struck for the pads. */
const ALONG_DURATION: Record<AlongPart, number> = { lead: 0.6, drums: 0.2 };

/**
 * How many bars ahead the player keeps decided: the song map's sections, and
 * one more, since the bars are decided while the head is still in the bar
 * before the one that may start the section heard next.
 */
export const FORECAST_BARS = (SECTIONS + 1) * 8;

export type Status = 'stopped' | 'starting' | 'playing';

/** Alone, hosting a session, or following a host. */
export type Mode = 'solo' | 'host' | 'client';

/** What a host tells its session, as it happens. */
export interface Hosting {
  started(song: Song): void;
  stopped(): void;
  /** Bars composed, each with where it starts on this clock. */
  composed(bars: readonly SentBar[]): void;
  /** The bars ahead, whenever they are decided again. */
  decided(bars: readonly ForecastBar[]): void;
  track(track: StyleTrack): void;
  muse(muse: MuseState): void;
}

/** What a client tells its host, as it happens. */
export interface Following {
  /** Bars its players played in, judged. */
  judged(judged: readonly BarJudgement[]): void;
  /** Its players asked the Muse to forget. */
  forget(): void;
}

/** A client's state: its transport, the host's bars arrived, and its ear. */
interface Follow {
  carried: TransportCarried<FollowCarried> | null;
  arrived: SentBar[];
  ear: EarCarried;
  /** The keys of the bars it played lately, which its ear judges them in. */
  keys: readonly { readonly bar: number; readonly key: Key }[];
  told: Following;
}

/** The transport a client runs: the host's bars, on the host's clock. */
const follower = transportOver(followSource);

/**
 * A note a player struck, where it was heard on the grid, exactly, on the
 * instrument it was played on. The Muse (#79) judges the keyboard's, and
 * its grid is what rounds them.
 */
export interface HumanNote extends HeardNote {
  readonly part: AlongPart;
}

/** How many of the Muse's judgements the log keeps, as the prototype shows. */
const MUSE_LOG = 5;

/** How many notes are kept before the oldest half is dropped, as the prototype does. */
const HUMAN_NOTES_MAX = 240;

/**
 * How long, in seconds, the steps laid are kept for reading played notes
 * back: a note is placed as it arrives, but its release can come this long
 * after the moment it was struck.
 */
const LAID_KEPT = 8;

/** How many bars' keys a client keeps for its ear, which judges a bar a beat after it ends. */
const KEYS_KEPT = 8;

/** What the player runs on; a test can stand in for each. */
export interface Surroundings {
  output(): Output;
  ticker(tick: () => void): () => void;
  frame(follow: () => void): () => void;
  /** A seed for the next song. */
  seed(): number;
}

/** The real browser's ticker, frame and seed, with a given way to make the output. */
export function browserSurroundings(output: () => Output = webAudioOutput): Surroundings {
  return {
    output,
    ticker: startTicker,
    frame(follow) {
      let id = requestAnimationFrame(function loop() {
        follow();
        id = requestAnimationFrame(loop);
      });
      return () => cancelAnimationFrame(id);
    },
    seed: () => Math.floor(Math.random() * 2 ** 32),
  };
}

const browser: Surroundings = browserSurroundings();

export class Player {
  status: Status = $state('stopped');
  track: StyleTrack = $state.raw(holding(INITIAL_STYLE));
  wish: KeyWish = $state.raw({ tonic: null, mode: PRESETS[0]!.mode });
  /** The step heard, or null before anything is. */
  heard: number | null = $state(null);
  /** Notes players struck while the band listened. */
  humanNotes: readonly HumanNote[] = $state.raw([]);
  /** The Muse's latest judgements, of bars someone played in or of a forget, the latest last. */
  museLog: readonly MuseOutput[] = $state.raw([]);
  /** The motif the Muse offers now, after the last bar it judged. */
  offer: Offer | null = $state.raw(null);
  /** The latest bars judged on clients that the Muse dropped: late, ahead, or inadmissible. */
  dropped: readonly DroppedJudgement[] = $state.raw([]);
  /** The band's own notes heard sounding right now, one entry per member. */
  sounding: SoundingNotes = $state(SILENT);
  /** The last bar each track finished, for its piano roll. */
  pattern: BarPattern = $state(EMPTY_PATTERN);
  mode: Mode = $state('solo');
  /** How many of the host's bars, as a client, had not arrived when they were due. */
  lacked = $state(0);
  /** Told what a host does, while it hosts. */
  hosting: Hosting | null = null;
  /**
   * The player id this device's own notes go by in a session's Muse, while
   * it hosts (`HOST_PLAYER`); its clients' go by theirs.
   */
  playerId: string | null = null;
  /** Each player in the session's name by id, to read their sources by. */
  players: Readonly<Record<string, string>> = $state.raw({});
  /**
   * The host's clock less this output's, while following: a moment the host
   * hears at `t` is heard here at `t - skew`.
   */
  skew = 0;

  #surroundings: Surroundings;
  #output: Output | null = null;
  #carried: TransportCarried | null = null;
  #seed = 0;
  #start = 0;
  #stopTicker: (() => void) | null = null;
  #stopFrames: (() => void) | null = null;
  #heard = new Heard<number>();
  /** The steps laid in the last `LAID_KEPT` seconds, which a note heard is read back through. */
  #laid: ScheduledStep[] = [];
  /** Melody notes heard since the last tick, for the transport to pass to the Muse. */
  #arrived: HeardNote[] = [];
  #forget = false;
  /** Bars the host's clients judged since the last tick. */
  #judged: BarJudgement[] = [];
  #follow: Follow | null = null;
  #sounding = new Sounding();
  #pattern = new Pattern();
  /** The bars decided, from the first of the section heard on. */
  #bars: readonly ForecastBar[] = $state.raw([]);
  /** The bar the transport composes next, when the bars were last decided. */
  #decidedAt = -1;

  /** What the screen shows. */
  readonly hud: Hud = $derived(
    hudOf({
      heard: this.heard,
      bars: this.#bars,
      track: this.track,
      muse: {
        offer: this.offer,
        log: this.museLog,
        dropped: this.dropped,
        players: this.players,
      },
    }),
  );

  constructor(surroundings: Surroundings = browser) {
    this.#surroundings = surroundings;
    this.#seed = surroundings.seed();
    this.#decide();
  }

  /** Whether the band is playing or about to: the start button reads Stop. */
  get playing(): boolean {
    return this.status !== 'stopped';
  }

  /** How many scheduled positions wait to be heard. */
  get backlog(): number {
    return this.#heard.size;
  }

  apply(intent: Intent) {
    if (this.mode === 'client') return;
    const at = this.status === 'playing' ? (this.#carried?.head.step ?? 0) : null;
    this.track = conduct(this.track, intent, at);
    this.wish = wishAfter(this.wish, intent);
    this.hosting?.track(this.track);
    this.#decide();
  }

  /**
   * A moment on the output's clock, as a position on the grid: through the
   * steps as the transport laid them (`writtenAt`), with the tempo and the
   * swing they were laid with, whatever the style track holds by now. Null
   * while the band isn't playing, or for a moment outside the steps kept.
   */
  writtenPosition(seconds: number): number | null {
    return this.status === 'playing' ? writtenAt(this.#laid, seconds + this.skew) : null;
  }

  /**
   * A note played from `source`, at `seconds`: the moment on the output's
   * clock that was being heard as it was played, which the clock offset
   * gives (`clockOffset`). A player plays along with what they hear, so the
   * note is kept there, for whenever the Muse (#79) reads it. Judging what
   * was played is not this class's to do.
   */
  humanNoteOn(part: AlongPart, note: number, velocity: number, source: string, seconds: number) {
    const position = this.writtenPosition(seconds);
    if (position === null) return;
    const kept =
      this.humanNotes.length >= HUMAN_NOTES_MAX
        ? this.humanNotes.slice(this.humanNotes.length - HUMAN_NOTES_MAX / 2)
        : this.humanNotes;
    this.humanNotes = [...kept, { part, note, velocity, source, position, end: null }];
    if (part === 'lead') {
      const heardAs = this.playerId === null ? source : playerSource(this.playerId, source);
      this.#arrived.push({ note, velocity, source: heardAs, position, end: null });
    }
  }

  /** Ask the Muse to forget the motif it offers, from the next bar the band composes. */
  forgetMotif() {
    if (this.#follow) this.#follow.told.forget();
    else this.#forget = true;
  }

  /**
   * A note released at `seconds`: the latest of that part, pitch and source
   * still held ends where it was heard released.
   */
  humanNoteOff(part: AlongPart, note: number, source: string, seconds: number) {
    const i = this.humanNotes.findLastIndex(
      (n) => n.part === part && n.note === note && n.source === source && n.end === null,
    );
    if (i === -1) return;
    const end = this.writtenPosition(seconds);
    if (end === null) return;
    this.humanNotes = this.humanNotes.with(i, { ...this.humanNotes[i]!, end });
  }

  /**
   * Play a note along with the band, on the same clock and the same synth,
   * from a finger on an instrument, a computer key or a MIDI note. It never
   * appears in `sounding`, which is the band's own notes, not what people
   * play along with it.
   */
  async playAlong(part: AlongPart, note: number, velocity: number) {
    const output = (this.#output ??= this.#surroundings.output());
    await output.resume();
    const energy = this.hud.bar?.energy ?? 0.6;
    const sound = soundOf(styleAt(this.track, this.heard ?? 0), energy);
    output.play(part, note, velocity, output.currentTime, ALONG_DURATION[part], sound);
  }

  /**
   * Silence anything MIDI might still be holding: a tab waking from
   * suspend can find hardware sounding a note whose release a frozen clock
   * never scheduled, and a person can ask for this directly. A no-op
   * before any output exists, since nothing could be holding a note yet.
   */
  panicMidi() {
    this.#output?.panic?.();
  }

  /** Let the output's clock run, as a session needs it to before a song starts. */
  async prepare(): Promise<Output> {
    const output = (this.#output ??= this.#surroundings.output());
    await output.resume();
    return output;
  }

  async start() {
    if (this.status !== 'stopped' || this.mode === 'client') return;
    this.status = 'starting';
    const output = await this.prepare();
    if (this.status !== 'starting') return;
    this.status = 'playing';
    this.#start = output.currentTime + 0.1;
    this.#begin(output);
    this.hosting?.started({ seed: this.#seed, start: this.#start, track: this.track });
    this.#decide();
    this.#tick();
  }

  /** Everything a song starts from, and the clocks that run it. */
  #begin(output: Output) {
    output.starting?.(this.#start - this.skew);
    this.#carried = null;
    this.#heard.clear();
    this.#laid = [];
    this.#arrived = [];
    this.#judged = [];
    this.#forget = false;
    this.museLog = [];
    this.offer = null;
    this.dropped = [];
    this.#stopTicker = this.#surroundings.ticker(() => this.#tick());
    this.#stopFrames = this.#surroundings.frame(() => this.#followHeard());
  }

  /** The bars decided, from the first of the section heard on: the forecast a host sends. */
  get ahead(): readonly ForecastBar[] {
    return this.#bars;
  }

  /** Judgements a client made of its players' bars, for the Muse to hear with its own. */
  judgedElsewhere(judged: readonly BarJudgement[]) {
    this.#judged.push(...judged);
  }

  /** Where the song and the bars composed stand, for a client joining mid-song. */
  get hosted(): { song: Song; bars: SentBar[] } | null {
    const carried = this.#carried;
    if (this.status !== 'playing' || !carried) return null;
    return {
      song: { seed: this.#seed, start: this.#start, track: this.track },
      bars: sentBars(carried.bars, this.#laid, carried.head, this.track),
    };
  }

  /** Follow a host from now on: stop playing alone, and wait for its song. */
  follow(told: Following) {
    this.stop();
    this.mode = 'client';
    this.lacked = 0;
    this.#follow = { carried: null, arrived: [], ear: EAR, keys: [], told };
    this.#bars = [];
  }

  /** Play the host's song from now, with the bars it has composed and not played. */
  async followSong(song: Song, bars: readonly SentBar[]) {
    const follow = this.#follow;
    if (!follow) return;
    this.stop();
    Object.assign(follow, { carried: null, arrived: [...bars], ear: EAR, keys: [] });
    this.status = 'starting';
    const output = await this.prepare();
    if (this.status !== 'starting' || this.#follow !== follow) return;
    this.status = 'playing';
    this.#seed = song.seed;
    this.#start = song.start;
    this.track = song.track;
    this.#begin(output);
    this.#tick();
  }

  /** A bar the host composed. */
  followBar(sent: SentBar) {
    this.#follow?.arrived.push(sent);
  }

  followTrack(track: StyleTrack) {
    if (this.#follow) this.track = track;
  }

  /** The host's bars ahead. */
  followForecast(bars: readonly ForecastBar[]) {
    if (this.#follow) this.#bars = bars;
  }

  followMuse({ offer, log, dropped, players }: MuseState) {
    if (!this.#follow) return;
    this.offer = offer;
    this.museLog = log;
    this.dropped = dropped;
    this.players = players;
  }

  /** Play alone again. */
  unfollow() {
    this.stop();
    this.#follow = null;
    this.mode = 'solo';
    this.skew = 0;
    this.track = holding(INITIAL_STYLE);
    this.museLog = [];
    this.offer = null;
    this.dropped = [];
    this.players = {};
    this.#decide();
  }

  stop() {
    if (this.status === 'stopped') return;
    const wasPlaying = this.status === 'playing';
    this.status = 'stopped';
    if (!wasPlaying) return;
    this.#stopTicker?.();
    this.#stopFrames?.();
    this.#stopTicker = this.#stopFrames = null;
    this.heard = null;
    if (!this.#follow) {
      this.track = stopAt(this.track);
      this.#seed = this.#surroundings.seed();
      this.hosting?.stopped();
      this.hosting?.track(this.track);
      this.#decide();
    }
    this.#output?.silence();
    this.#sounding.clear();
    this.sounding = SILENT;
    this.#pattern.clear();
    this.pattern = EMPTY_PATTERN;
  }

  get #env(): TransportEnv {
    return { seed: this.#seed, start: this.#start, track: this.track, wish: this.wish };
  }

  /**
   * Decide the bars ahead again: from the transport while it plays, and from
   * the song's start while it doesn't. The bars before the first composed
   * one are kept from the start of its section, as the bar before may still
   * be heard and the song map shows its section whole.
   */
  #decide() {
    if (this.#follow) return;
    const carried = this.status === 'playing' ? this.#carried : null;
    const fresh = forecast(this.#env, carried, FORECAST_BARS);
    const first = fresh[0]?.bar ?? 0;
    const from = Math.floor((first - 1) / 8) * 8;
    const kept = carried ? this.#bars.filter((b) => b.bar >= from && b.bar < first) : [];
    this.#bars = [...kept, ...fresh];
    this.#decidedAt = carried?.nextBar ?? -1;
    this.hosting?.decided(this.#bars);
  }

  #tick() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    if (this.#follow) return this.#tickFollowing(output, this.#follow);
    const now = output.currentTime;
    // What arrived is taken before the transport reads it, so that anything
    // it can't read costs one tick, not every tick after.
    const [heard, judged, forget] = [this.#arrived, this.#judged, this.#forget];
    this.#arrived = [];
    this.#judged = [];
    this.#forget = false;
    const { carried, output: scheduled } = transport.advance(this.#env, this.#carried, {
      now,
      until: now + LOOKAHEAD,
      heard,
      judged,
      forget,
    });
    this.#carried = carried;
    const logged = scheduled.judged.filter((j) => j.judgements.length > 0 || j.forgot !== null);
    if (logged.length > 0) this.museLog = [...this.museLog, ...logged].slice(-MUSE_LOG);
    const latest = scheduled.judged.at(-1);
    const offered = this.offer;
    if (latest) this.offer = latest.offer;
    if (scheduled.dropped.length > 0)
      this.dropped = [...this.dropped, ...scheduled.dropped].slice(-MUSE_LOG);
    if (this.hosting) {
      if (scheduled.composed.length > 0)
        this.hosting.composed(
          sentBars(scheduled.composed, scheduled.steps, carried!.head, this.track),
        );
      if (logged.length > 0 || this.offer !== offered || scheduled.dropped.length > 0)
        this.hosting.muse({
          offer: this.offer,
          log: this.museLog,
          dropped: this.dropped,
          players: this.players,
        });
    }
    this.#schedule(output, now, scheduled);
    if (carried?.nextBar !== this.#decidedAt) this.#decide();
  }

  /**
   * A client's tick: the host's bars on the host's clock, the new ones that
   * arrived, and its ear judging the bars its players played.
   */
  #tickFollowing(output: Output, follow: Follow) {
    const now = output.currentTime + this.skew;
    const arrived = follow.arrived;
    follow.arrived = [];
    const { carried, output: scheduled } = follower.advance(this.#env, follow.carried, {
      now,
      until: now + LOOKAHEAD,
      arrived,
    });
    follow.carried = carried;
    const played = scheduled.composed.map(({ bar, plan }) => ({ bar, key: plan.key }));
    if (played.length > 0) follow.keys = [...follow.keys, ...played].slice(-KEYS_KEPT);
    if (carried!.source.lacked !== this.lacked) this.lacked = carried!.source.lacked;
    this.#schedule(output, now, scheduled);
    const heard = this.writtenPosition(output.currentTime - output.latency);
    if (heard !== null) {
      const keyOf = (bar: number) => follow.keys.find((k) => k.bar === bar)?.key;
      const ear = earListen(follow.ear, this.#arrived, heard, keyOf);
      follow.ear = ear.carried;
      if (ear.judged.length > 0) follow.told.judged(ear.judged);
    }
    this.#arrived = [];
  }

  /** Play what the transport scheduled, and keep its steps for what is heard. */
  #schedule(output: Output, now: number, scheduled: TransportOutput) {
    const skew = this.skew;
    for (const { bar, event, seconds, duration, sound } of scheduled.events) {
      output.play(event.part, event.note, event.velocity, seconds - skew, duration, sound);
      const member = memberOf(event.part);
      this.#sounding.push({ member, note: event.note, seconds: seconds - skew, duration });
      this.#pattern.push(member, bar, { step: event.step, note: event.note, length: event.length });
    }
    if (scheduled.events.length > 0) this.pattern = this.#pattern.get();
    output.tick?.(
      skew === 0
        ? scheduled.steps
        : scheduled.steps.map((s) => ({ ...s, seconds: s.seconds - skew })),
    );
    for (const { step, seconds } of scheduled.steps) this.#heard.push(seconds - skew, step);
    this.#laid = [
      ...this.#laid.filter((s) => s.seconds + s.length > now - LAID_KEPT),
      ...scheduled.steps,
    ];
    this.#heard.drop(now - skew - 1);
  }

  #followHeard() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const latest = this.#heard.take(output.currentTime - output.latency);
    if (latest !== undefined) this.heard = latest;
    this.sounding = this.#sounding.at(output.currentTime - output.latency);
  }
}
