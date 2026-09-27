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
 */

import {
  type ForecastBar,
  INITIAL_STYLE,
  type KeyWish,
  LOOKAHEAD,
  type HeardNote,
  type MuseOutput,
  type Part,
  PRESETS,
  type ScheduledStep,
  soundOf,
  styleAt,
  type StyleTrack,
  type TransportCarried,
  type TransportEnv,
  forecast,
  holding,
  transport,
  writtenAt,
} from '@jambot/engine';
import { type Output, webAudioOutput } from './audio/output.ts';
import { type Intent, conduct, stopAt, wishAfter } from './conductor.ts';
import { Heard } from './heard.ts';
import { type Hud, SECTIONS, hudOf } from './hud.ts';
import { Sounding, type SoundingNotes } from './sounding.ts';
import { startTicker } from './ticker.ts';

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
  /** The band's own notes heard sounding right now: the lead's, the drums'. */
  sounding: SoundingNotes = $state({ lead: [], drums: [] });

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
  #sounding = new Sounding();
  /** The bars decided, from the first of the section heard on. */
  #bars: readonly ForecastBar[] = $state.raw([]);
  /** The bar the transport composes next, when the bars were last decided. */
  #decidedAt = -1;

  /** What the screen shows. */
  readonly hud: Hud = $derived(hudOf({ heard: this.heard, bars: this.#bars, track: this.track }));

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
    const at = this.status === 'playing' ? (this.#carried?.head.step ?? 0) : null;
    this.track = conduct(this.track, intent, at);
    this.wish = wishAfter(this.wish, intent);
    this.#decide();
  }

  /**
   * A moment on the output's clock, as a position on the grid: through the
   * steps as the transport laid them (`writtenAt`), with the tempo and the
   * swing they were laid with, whatever the style track holds by now. Null
   * while the band isn't playing, or for a moment outside the steps kept.
   */
  writtenPosition(seconds: number): number | null {
    return this.status === 'playing' ? writtenAt(this.#laid, seconds) : null;
  }

  /**
   * A note played at `seconds` on the output's clock, from `source`, kept
   * where it was heard for whenever the Muse (#79) reads it. A player plays
   * along with what they hear, which is the output's latency behind its
   * clock, so the note is placed that much earlier. Judging what was played
   * is not this class's to do.
   */
  humanNoteOn(part: AlongPart, note: number, velocity: number, source: string, seconds: number) {
    const position = this.writtenPosition(seconds - this.#latency);
    if (position === null) return;
    const kept =
      this.humanNotes.length >= HUMAN_NOTES_MAX
        ? this.humanNotes.slice(this.humanNotes.length - HUMAN_NOTES_MAX / 2)
        : this.humanNotes;
    this.humanNotes = [...kept, { part, note, velocity, source, position, end: null }];
    if (part === 'lead') this.#arrived.push({ note, velocity, source, position, end: null });
  }

  /** Ask the Muse to forget the motif it offers, from the next bar the band composes. */
  forgetMotif() {
    this.#forget = true;
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
    const end = this.writtenPosition(seconds - this.#latency);
    if (end === null) return;
    this.humanNotes = this.humanNotes.with(i, { ...this.humanNotes[i]!, end });
  }

  get #latency(): number {
    return this.#output?.latency ?? 0;
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

  async start() {
    if (this.status !== 'stopped') return;
    this.status = 'starting';
    const output = (this.#output ??= this.#surroundings.output());
    await output.resume();
    if (this.status !== 'starting') return;
    this.status = 'playing';
    this.#start = output.currentTime + 0.1;
    output.starting?.(this.#start);
    this.#carried = null;
    this.#heard.clear();
    this.#laid = [];
    this.#arrived = [];
    this.#forget = false;
    this.museLog = [];
    this.#decide();
    this.#tick();
    this.#stopTicker = this.#surroundings.ticker(() => this.#tick());
    this.#stopFrames = this.#surroundings.frame(() => this.#follow());
  }

  stop() {
    if (this.status === 'stopped') return;
    const wasPlaying = this.status === 'playing';
    this.status = 'stopped';
    if (!wasPlaying) return;
    this.#stopTicker?.();
    this.#stopFrames?.();
    this.#stopTicker = this.#stopFrames = null;
    this.track = stopAt(this.track);
    this.heard = null;
    this.#seed = this.#surroundings.seed();
    this.#decide();
    this.#output?.silence();
    this.#sounding.clear();
    this.sounding = { lead: [], drums: [] };
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
    const carried = this.status === 'playing' ? this.#carried : null;
    const fresh = forecast(this.#env, carried, FORECAST_BARS);
    const first = fresh[0]?.bar ?? 0;
    const from = Math.floor((first - 1) / 8) * 8;
    const kept = carried ? this.#bars.filter((b) => b.bar >= from && b.bar < first) : [];
    this.#bars = [...kept, ...fresh];
    this.#decidedAt = carried?.nextBar ?? -1;
  }

  #tick() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const now = output.currentTime;
    const { carried, output: scheduled } = transport.advance(this.#env, this.#carried, {
      now,
      until: now + LOOKAHEAD,
      heard: this.#arrived,
      forget: this.#forget,
    });
    this.#carried = carried;
    this.#arrived = [];
    this.#forget = false;
    const logged = scheduled.judged.filter((j) => j.judgements.length > 0 || j.forgot !== null);
    if (logged.length > 0) this.museLog = [...this.museLog, ...logged].slice(-MUSE_LOG);
    for (const { event, seconds, duration, sound } of scheduled.events) {
      output.play(event.part, event.note, event.velocity, seconds, duration, sound);
      if (event.part === 'lead' || event.part === 'drums')
        this.#sounding.push({ part: event.part, note: event.note, seconds, duration });
    }
    output.tick?.(scheduled.steps);
    for (const { step, seconds } of scheduled.steps) this.#heard.push(seconds, step);
    this.#laid = [
      ...this.#laid.filter((s) => s.seconds + s.length > now - LAID_KEPT),
      ...scheduled.steps,
    ];
    this.#heard.drop(now - 1);
    if (carried?.nextBar !== this.#decidedAt) this.#decide();
  }

  #follow() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const latest = this.#heard.take(output.currentTime - output.latency);
    if (latest !== undefined) this.heard = latest;
    this.sounding = this.#sounding.at(output.currentTime - output.latency);
  }
}
