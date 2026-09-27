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
  type Part,
  PRESETS,
  soundOf,
  styleAt,
  type StyleTrack,
  type TransportCarried,
  type TransportEnv,
  forecast,
  holding,
  swingOf,
  tempoMap,
  transport,
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
 * A note a player struck, quantised to the grid it landed nearest: bar-
 * relative like a `NoteEvent`, but not yet judged. The Muse (#2) is what
 * reads these; until it exists, the player only keeps them.
 */
export interface HumanNote {
  readonly part: AlongPart;
  readonly note: number;
  readonly velocity: number;
  readonly bar: number;
  readonly step: number;
  readonly source: string;
}

/** How many notes are kept before the oldest half is dropped, as the prototype does. */
const HUMAN_NOTES_MAX = 240;

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
  /** Notes players struck while the band listened, waiting for the Muse (#2). */
  humanNotes: readonly HumanNote[] = $state.raw([]);
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
   * `seconds` on the output's clock, as a position on the grid: the
   * transport's swing and tempo maps, inverted from the song's start (the
   * one anchor always behind a moment just played). Null before the band
   * plays, or for a time before it started.
   */
  writtenPosition(seconds: number): number | null {
    if (this.status !== 'playing' || seconds < this.#start) return null;
    const anchor = { step: 0, seconds: this.#start };
    return swingOf(this.track).written(tempoMap(this.track, anchor).written(seconds));
  }

  /**
   * A note played at `seconds` on the output's clock, from `source`:
   * quantised to the nearest step and kept for whenever the Muse (#2)
   * reads it. Judging what was played is not this class's to do.
   */
  humanNoteOn(part: AlongPart, note: number, velocity: number, source: string, seconds: number) {
    const position = this.writtenPosition(seconds);
    if (position === null) return;
    const abs = Math.round(position);
    if (abs < 0) return;
    const kept =
      this.humanNotes.length >= HUMAN_NOTES_MAX
        ? this.humanNotes.slice(this.humanNotes.length - HUMAN_NOTES_MAX / 2)
        : this.humanNotes;
    this.humanNotes = [
      ...kept,
      { part, note, velocity, bar: Math.floor(abs / 16), step: abs % 16, source },
    ];
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
    });
    this.#carried = carried;
    for (const { event, seconds, duration, sound } of scheduled.events) {
      output.play(event.part, event.note, event.velocity, seconds, duration, sound);
      if (event.part === 'lead' || event.part === 'drums')
        this.#sounding.push({ part: event.part, note: event.note, seconds, duration });
    }
    output.tick?.(scheduled.steps);
    for (const { step, seconds } of scheduled.steps) this.#heard.push(seconds, step);
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
