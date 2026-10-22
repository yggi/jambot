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
 * It counts its timing as it plays (`timing`, `timedTick`), each tick timed
 * on the page's clock, from each song's start until the next.
 *
 * Starting waits for the audio clock, which a browser starts only after a
 * gesture. While it waits the player is starting: another start does
 * nothing, and a stop cancels it. The song then starts a bar later, after a
 * count-in of clicks (`counting`), on the same clock and on this output, so
 * a client that a host tells has that bar to get ready in (the host says the
 * start as the count-in begins). A stop cuts a count-in short.
 *
 * Stopping a band that plays asks it to end (`stop`, `ending`): the band
 * composes a last bar that closes on a cadence, plays through it, lets its
 * last chord ring, and only then halts (`halt`). A second stop halts at
 * once, and so does anything that isn't a person's stop: leaving a session,
 * following a host, or the host having stopped.
 *
 * Beside the band, alone or hosting, each section is written as one cells
 * text and played by cells' engine to a silent sink, and compared with what
 * the band sends (`shadow`, #399). With the switch on (`plays`) the outputs
 * play cells' events in place of the band's; a host then sends each text to
 * its clients (`Hosting.section`), and a client with the switch on plays the
 * texts it is sent as the host plays them (#446). What the outputs played is
 * kept, event by event (`played`), and what the transport dropped late
 * (#462), to set a client's beside its host's.
 *
 * The metronome, when one is given, is handed the steps laid on each tick
 * and clicks them on this output, so it has no clock of its own.
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
 *
 * The band learns (#398): each song starts from the layer the host keeps
 * (`layer`, loaded from `Surroundings.layers`), and each meter its composer
 * keeps from the repository is a use the plans carry on. The layer is saved
 * whenever it changes, which is once a section at most, on the tick the
 * section is planned; a tick that passes many sections saves once. A client
 * keeps none and learns nothing. What its players play on drums goes to its
 * Muse apart from the keyboard's (`drums`), and a groove she hears over a
 * section is filed in the layer under the player's name and tagged with the
 * session hosted (#401). A client's ear passes its players' drums on to the
 * host a bar at a time, and the host's Muse hears them as its own players'
 * (#410).
 */

import {
  type BarJudgement,
  type DroppedJudgement,
  type ForecastBar,
  type HarmonicWeights,
  INITIAL_KEY,
  INITIAL_STYLE,
  type KeyWish,
  LOOKAHEAD,
  type HeardNote,
  type Key,
  type MuseOutput,
  type Offer,
  type Remembered,
  type Part,
  RING_STEPS,
  SECTION_BARS,
  SONG_CLOCK,
  SONG_METER,
  sectionMeter,
  writtenStyle,
  STRAIGHT,
  type ScheduledStep,
  type SongClock,
  styleAt,
  timbreOf,
  type StyleTrack,
  type MeterSwing,
  type SwingTrack,
  type BandBar,
  EMPTY_LAYER,
  type LearnedLayer,
  type TransportCarried,
  type TransportEnv,
  type TransportOutput,
  METER_REPOSITORY,
  RHYTHM_BENCHES,
  RHYTHM_REPOSITORY,
  type RhythmRepository,
  BASS_REPOSITORY,
  LINE_BENCHES,
  type LineRepository,
  LEAD_REPOSITORY,
  type LeadRepository,
  NO_HISTORY,
  clockOfTransport,
  clockThrough,
  countIn,
  countInSeconds,
  foldBar,
  forecast,
  foresight,
  holding,
  rebeat,
  holdingSwing,
  presetMode,
  presetSwing,
  released,
  sameMeter,
  stepSeconds,
  transport,
  transportOver,
  swingAt,
  valueAt,
  writtenAt,
} from '@jambot/engine';
import {
  EAR,
  type EarCarried,
  type FollowCarried,
  type LayerStore,
  type MuseState,
  type PlayedBar,
  type SectionText,
  type SentBar,
  type Song,
  type Station,
  TRANSPORT_TIMING,
  type TransportTiming,
  followSource,
  timedTick,
  earListen,
  sentBars,
  playerSource,
  onward,
  tuneIn,
} from '@jambot/session';
import { type Meter, stepsOf } from '@jambot/theory';
import { type Output, webAudioOutput } from './audio/output.ts';
import { browserLayerStore } from './layer-storage.ts';
import { warmAtIdle, warmedOnFiling } from './warm.ts';
import { type Rhythm, hitsAt, recorded, toggled } from './rhythmGrid.ts';
import {
  type Intent,
  conduct,
  conductRadio,
  conductSwing,
  nudgeAfter,
  radioStyle,
  stopAt,
  stopSwing,
  styleAfter,
  takesFromRadio,
  wishAfter,
} from './conductor.ts';
import { Heard } from './heard.ts';
import { type SectionTexts, browserTexts } from './section-texts.ts';
import { type Plays, Shadow, type TextsFrom } from './shadow.ts';
import { PlayedLog } from './played.ts';
import { type Hud, SECTIONS, hudOf } from './hud.ts';
import { EVEN_MIX, type Mix, sounds, velocityFor } from './mix.ts';
import { PATTERN_BARS, Pattern, type PatternBar, patternBarOf } from './pattern.ts';
import { Sounding, type SoundingNotes, performerOf } from './sounding.ts';
import type { Metronome } from './metronome.svelte.ts';
import { startTicker } from './ticker.ts';

/** The swing the band opens with: the one the repository finds at the opening style's point (#459), straight on a miss. */
const OPENING_SWING: MeterSwing = presetSwing({ style: INITIAL_STYLE }) ?? STRAIGHT;

/** The mode the band opens wishing for: the one the repository finds at the opening style's point (#420), the opening key's on a miss. */
const OPENING_MODE = presetMode({ style: INITIAL_STYLE }) ?? INITIAL_KEY.mode;

const SILENT: SoundingNotes = { drums: [], bass: [], comp: [], lead: [] };

/** A part an instrument, not the band, can play along on. */
export type AlongPart = Extract<Part, 'lead' | 'drums'>;

/** How long a note played along sounds, in seconds: held for the keyboard, struck for the pads. */
const ALONG_DURATION: Record<AlongPart, number> = { lead: 0.6, drums: 0.2 };

/** How hard a pattern of one's own strikes, of 127, and the source its hits are logged from. */
const RHYTHM_VELOCITY = 100;
const RHYTHM_SOURCE = 'your pattern';

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
  /**
   * The style, the meter's swing and the meter whose beats the style's bpm
   * counts (#367): sent together, so a client lays every step as the host does.
   */
  track(track: StyleTrack, swing: SwingTrack, tempoMeter: Meter): void;
  /** The meter asked for changed, or null to none: nothing goes on the wire, since each bar carries its own, but a host keeps it. */
  meter(meter: Meter | null): void;
  /** The radio went on or off the air (#313): the walk travels in the track, so only a host keeps it. */
  station(station: Station | null): void;
  muse(muse: MuseState): void;
  /** The song ends on this bar, its last, composed. */
  finale(bar: number): void;
  /** A section's cells text, as the band through cells states it (#446): told only while it plays through cells. */
  section(text: SectionText): void;
}

/** What a client tells its host, as it happens. */
export interface Following {
  /** Bars its players played in, judged. */
  judged(judged: readonly BarJudgement[]): void;
  /** What its players played on drums, a bar at a time, as its ear heard it (#410). */
  played(played: readonly PlayedBar[]): void;
  /** Its players asked the Muse to forget. */
  forget(): void;
  /** The host's heard moment less this output's now, once the clocks are trusted: read every tick. */
  skew(): number | null;
}

/** A client's state: its transport, the host's bars and section texts arrived (#446), and its ear. */
interface Follow {
  carried: TransportCarried<FollowCarried> | null;
  arrived: SentBar[];
  /** Texts the host gave, not yet handed to the shadow: as it took them, or with its welcome (`joined`). */
  texts: { readonly text: SectionText; readonly joined: boolean }[];
  ear: EarCarried;
  /** The keys of the bars it played lately, which its ear judges them in. */
  keys: readonly { readonly bar: number; readonly key: Key }[];
  /** The host's last bar, once it has said which. */
  ends: number | undefined;
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

/** How long after `start` is called the song's clock starts, in seconds, before its count-in. */
const START_LEAD = 0.1;

/**
 * How long, in milliseconds, opening or joining a session waits for the
 * output's clock to run. A browser holds a context suspended until a click,
 * and `resume` stays pending for good on a page that was reloaded.
 */
export const OUTPUT_WAIT = 1500;

/** How many bars' keys a client keeps for its ear, which judges a bar a beat after it ends. */
const KEYS_KEPT = 8;

/** What the player runs on; a test can stand in for each. */
export interface Surroundings {
  output(): Output;
  ticker(tick: () => void): () => void;
  frame(follow: () => void): () => void;
  /** A seed for the next song. */
  seed(): number;
  /** The page's clock, in seconds, which the ticks are timed on. */
  page(): number;
  /** Where the host keeps what its band learned (#398); with none, it learns for as long as the player lives. */
  layers?: LayerStore;
  /** Runs work ahead, a step at a time, at idle (`warmAtIdle`); with none, the rhythms are warmed by asking them. */
  warm?(steps: Iterable<void>): void;
  /** Where the shadow's section texts are built, compiled and played (#406): a worker; with none, on the page's thread. */
  texts?(): SectionTexts;
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
    page: () => performance.now() / 1000,
    layers: browserLayerStore(),
    warm: (steps) => void warmAtIdle(steps),
    texts: browserTexts,
  };
}

const browser: Surroundings = browserSurroundings();

/** The moment heard now, on the output's clock: its own estimate, or its clock less its latency. */
const heardOn = (output: Output) => output.heard?.() ?? output.currentTime - output.latency;

export class Player {
  status: Status = $state('stopped');
  track: StyleTrack = $state.raw(holding(INITIAL_STYLE));
  /**
   * The radio (#313), which the session carries: a station on the air walks
   * the style track a section at a time while nobody takes it (`#walkRadio`),
   * and null is off. It is the host's alone: a client follows the track.
   */
  station: Station | null = $state.raw(null);
  wish: KeyWish = $state.raw({ tonic: null, mode: OPENING_MODE, melodic: null });
  /**
   * What the band has learned (#398): the layer the next song starts from,
   * and while one plays, what it has learned as of the section planned last.
   * The host's: loaded from where it is kept, saved as it changes, and
   * replaced by an import (`useLayer`).
   */
  layer: LearnedLayer = $state.raw(EMPTY_LAYER);
  /** The players' nudge of the style's tempo, in octaves, within its licence (`conductor.ts`). */
  tempoNudge = $state(0);
  /**
   * The meter asked for, which the band takes at the next section's boundary
   * (#261): a person's choice, held here as the key wish is. Null, as at
   * first, asks for none: the composer then asks cells' repository at each
   * section's start for the meter nearest the style, with its swing (#375).
   * The meter heard is the song's clock's (`clock`).
   */
  meter: Meter | null = $state.raw(null);
  /**
   * The meter's swing (#360): the level asked for, which the band takes at
   * the next section's boundary as it takes the meter, and the share gliding.
   * A preset's is the swing of the meter the repository finds at its point
   * (`presetSwing`, #459), the opening style's too; the Meter card sets it.
   */
  swing: SwingTrack = $state.raw(holdingSwing(OPENING_SWING));
  /**
   * The meter whose beats the track's bpm counts (#367): the meter of the
   * bar the band decided next, or while stopped the meter the song opens
   * in. When it changes, the number converts once (`rebeat`) and every step
   * keeps its length, so the felt tempo carries over: Synth-pop's 108 in
   * 4/4 is 72 in 6/8. It changes as the band decides the first bar in the
   * new meter, a bar before it is heard, so that bar is composed, and its
   * header written, in the new count.
   */
  tempoMeter: Meter = $state.raw(SONG_METER);
  /**
   * The song's clock as far as the bars decided reach: where its bars and
   * beats fall, in the meters they are in (#262). Every view reads bars and
   * beats off this, never off 4/4.
   */
  clock: SongClock = $state.raw(SONG_CLOCK);
  /** Whether the count-in is before the song: the clicks are heard, the band isn't yet. */
  counting = $state(false);
  /** Whether the band was asked to stop and plays on to its last bar. */
  ending = $state(false);
  /** The step of the count-in's bar heard, from 0, or null outside the count-in: what the transport counts down. */
  countStep: number | null = $state(null);
  /** The step heard, or null before anything is. */
  heard: number | null = $state(null);
  /** Notes players struck while the band listened. */
  humanNotes: readonly HumanNote[] = $state.raw([]);
  /** A pattern of this player's own, edited or recorded in the Rhythm view: drum hits by their step in the bar. */
  rhythm: Rhythm = $state.raw([]);
  /**
   * Whether it plays here with the band: on this device alone, on the
   * band's own steps, every bar, and logged as this player's drums once
   * heard, as a pad struck would be.
   */
  rhythmPlays = $state(false);
  /** The last step whose pattern hits were logged as heard. */
  #rhythmLogged: number | null = null;
  /** The Muse's latest judgements, of bars someone played in or of a forget, the latest last. */
  museLog: readonly MuseOutput[] = $state.raw([]);
  /** The motif the Muse offers now, after the last bar it judged. */
  offer: Offer | null = $state.raw(null);
  /** The motifs the Muse remembers, weighed as of the bar she last read (`museBar`). */
  memory: readonly Remembered[] = $state.raw([]);
  /** The bar `memory` is weighed at, or null before she has read one. */
  museBar: number | null = $state.raw(null);
  /** The last bar anyone played in, or null before anyone has. */
  lastPlayed: number | null = $state.raw(null);
  /** The latest bars judged on clients that the Muse dropped: late, ahead, or inadmissible. */
  dropped: readonly DroppedJudgement[] = $state.raw([]);
  /** The band's own notes heard sounding right now, one entry per performer. */
  sounding: SoundingNotes = $state(SILENT);
  /** The band's last bars, each track's notes in each, and whose motif the lead played in it (`Pattern`). */
  pattern: readonly PatternBar[] = $state.raw([]);
  /**
   * The bars from the head on with their notes as they will play unless a
   * control moves (`foresight`), renewed with the forecast: the tracks draw
   * what is still to come from it. Empty on a client, which has only the bars
   * its host sent as they arrive.
   */
  foreseen: readonly PatternBar[] = $state.raw([]);
  /**
   * Which of the band's performers this device sounds (`Mix`): this
   * device's alone, never sent to a session, and kept across songs.
   */
  mix: Mix = $state.raw(EVEN_MIX);
  /**
   * The band's harmonic history, which its key follows (#169): the engine's
   * own while the band plays here, and for a client the same fold over the
   * host's bars as they arrive.
   */
  harmonicHistory: HarmonicWeights = $state.raw(NO_HISTORY);
  mode: Mode = $state('solo');
  /** How many of the host's bars, as a client, had not arrived when they were due. */
  lacked = $state(0);
  /** Told what a host does, while it hosts. */
  hosting: Hosting | null = null;
  /** The session it hosts, by name, which a groove its Muse files is tagged with (#401); null alone or as a client. */
  session: string | null = null;
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

  /** The band through cells, in shadow (#399): what it found is `shadow.readout`. */
  readonly shadow: Shadow;
  /** What the outputs played lately, event by event (#446). */
  readonly played = new PlayedLog();
  /** What the switch asks a solo band's outputs to play. */
  #plays: Plays;

  #surroundings: Surroundings;
  /** Cells' rhythms, each groove filed warmed once it is (#412). */
  #rhythms: RhythmRepository;
  /** Cells' bass lines, each line filed warmed once it is (#423). */
  #bassLines: LineRepository;
  /** The lead lines the layer files, each warmed once it is (#424). */
  #leads: LeadRepository;
  #metronome: Metronome | null;
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
  /**
   * Drum notes struck since the tick before, for the Muse to hear as grooves
   * (#401): this device's players', and a host's clients' (#410); a client's
   * go to its ear.
   */
  #arrivedDrums: HeardNote[] = [];
  /** Bass notes a host's clients' players played (#423), for the Muse to hear as bass lines; this device's own she reads from what it heard, in the bass's register. */
  #arrivedBass: HeardNote[] = [];
  #forget = false;
  /** Whether a host's clients were told which bar is the last. */
  #finaleTold = false;
  /** Bars the host's clients judged since the last tick. */
  #judged: BarJudgement[] = [];
  #follow: Follow | null = null;
  #timing: TransportTiming = TRANSPORT_TIMING;
  #sounding = new Sounding();
  #pattern = new Pattern();
  /** The bars decided, from the first of the section heard on. */
  #bars: readonly ForecastBar[] = $state.raw([]);
  /** The bar the transport composes next, when the bars were last decided. */
  #decidedAt = -1;
  /** The meters the transport had laid when `clock` was last read from them: a change of them is a change of clock. */
  #clockMeters: unknown = null;
  /** Whether the layer kept has loaded: until it has, nothing learned is saved over it. */
  #layerLoaded = false;

  /**
   * The home key the players' key licence counts from: the plan's, the key
   * the band is heading for, and the key the song opens in before anything
   * is decided. Not the harmonic history's centre, which trails a key change
   * by half a section and may not find it at all where the harmony is thin
   * (E19); the history shows where the band has been, the plan where it is.
   */
  get home(): Key {
    return this.hud.heading ?? INITIAL_KEY;
  }

  /** What the screen shows. */
  readonly hud: Hud = $derived(
    hudOf({
      heard: this.heard,
      bars: this.#bars,
      clock: this.clock,
      track: this.track,
      tempoNudge: this.tempoNudge,
      muse: {
        offer: this.offer,
        log: this.museLog,
        dropped: this.dropped,
        players: this.players,
        memory: this.memory,
        asOf: this.museBar,
        lastPlayed: this.lastPlayed,
      },
    }),
  );

  constructor(
    surroundings: Surroundings = browser,
    /** Clicks the steps laid, when it is on; this device's own. */
    metronome: Metronome | null = null,
    /** Which events the band's outputs play: cells' (the switch of #399, on by default since #456), or its own. */
    plays: Plays = 'cells',
  ) {
    this.#surroundings = surroundings;
    this.#rhythms = surroundings.warm
      ? warmedOnFiling(RHYTHM_REPOSITORY, RHYTHM_BENCHES, surroundings.warm)
      : RHYTHM_REPOSITORY;
    this.#bassLines = surroundings.warm
      ? warmedOnFiling(BASS_REPOSITORY, LINE_BENCHES, surroundings.warm)
      : BASS_REPOSITORY;
    this.#leads = surroundings.warm
      ? warmedOnFiling(LEAD_REPOSITORY, LINE_BENCHES, surroundings.warm)
      : LEAD_REPOSITORY;
    // Every fit a section can ask for, at idle from the start (#397), and every bass line's read (#423).
    surroundings.warm?.(RHYTHM_REPOSITORY.warm?.(RHYTHM_BENCHES) ?? []);
    surroundings.warm?.(BASS_REPOSITORY.warm?.(LINE_BENCHES) ?? []);
    this.#metronome = metronome;
    this.#plays = plays;
    this.shadow = new Shadow(() => surroundings.page() * 1000, plays, surroundings.texts?.());
    // A host's band through cells tells its session each section's text as it takes it (#446).
    this.shadow.told = (text) => {
      if (this.#plays === 'cells') this.hosting?.section(text);
    };
    this.#seed = surroundings.seed();
    this.#decide();
    void surroundings.layers?.load().then((layer) => {
      this.#layerLoaded = true;
      this.#startFrom(layer);
    });
  }

  /**
   * Start the next song from this layer, as an import does (#398): while
   * the band is stopped, and not as a client, which keeps none. It is kept
   * in place of the one kept. Whether it took it.
   */
  useLayer(layer: LearnedLayer): boolean {
    if (!this.#startFrom(layer)) return false;
    void this.#surroundings.layers?.save(layer);
    return true;
  }

  /** The layer the next song starts from, while stopped and not a client: the meter it opens in may be another. */
  #startFrom(layer: LearnedLayer): boolean {
    if (this.status !== 'stopped' || this.mode === 'client') return false;
    this.layer = layer;
    // The grooves and lines it filed, which the warm-up from the start never saw (#412).
    if (layer.filed.length > 0) {
      this.#surroundings.warm?.(RHYTHM_REPOSITORY.warm?.(RHYTHM_BENCHES, layer) ?? []);
      this.#surroundings.warm?.(BASS_REPOSITORY.warm?.(LINE_BENCHES, layer) ?? []);
      this.#surroundings.warm?.(LEAD_REPOSITORY.warm?.(LINE_BENCHES, layer) ?? []);
    }
    if (this.#countTempoIn(this.#opening()))
      this.hosting?.track(this.track, this.swing, this.tempoMeter);
    this.#decide();
    return true;
  }

  /** Whether the band is playing or about to: the start button reads Stop. */
  get playing(): boolean {
    return this.status !== 'stopped';
  }

  /** The transport's timing counters since the song started (`timedTick`). */
  get timing(): TransportTiming {
    return this.#timing;
  }

  /** How many scheduled positions wait to be heard. */
  get backlog(): number {
    return this.#heard.size;
  }

  /**
   * Ask for a meter from the next section on, or with null for none, so the
   * composer asks the repository (#375): the forecast shows it where it will
   * be heard.
   */
  setMeter(meter: Meter | null) {
    if (this.mode === 'client') return;
    this.meter = meter;
    // Stopped, the song opens in it: its bpm counts its beats from now.
    if (this.status !== 'playing' && this.#countTempoIn(this.#opening()))
      this.hosting?.track(this.track, this.swing, this.tempoMeter);
    this.hosting?.meter(meter);
    this.#decide();
  }

  /**
   * Count the track's bpm in `meter`'s beats, every step as long as it was:
   * the felt tempo kept (#367). Whether it changed anything.
   */
  #countTempoIn(meter: Meter): boolean {
    if (sameMeter(meter, this.tempoMeter)) return false;
    this.track = rebeat(this.track, this.tempoMeter, meter);
    this.tempoMeter = meter;
    return true;
  }

  /**
   * The track with its bpm counted in `meter`'s beats, the felt tempo kept:
   * what a host keeps, with the meter asked for (with none, the meter it
   * counts now, which a reloaded host's repository finds again).
   */
  trackCountedIn(meter: Meter | null): StyleTrack {
    return rebeat(this.track, this.tempoMeter, meter ?? this.tempoMeter);
  }

  /**
   * Put the radio on the air or take it off (#313). Tuned in, it holds the
   * style the track is going to until the next section starts, and walks from
   * there; a person who sets a preset or an axis it walks takes the track back
   * (`takesFromRadio`).
   */
  tuneRadio(on: boolean) {
    if (this.mode === 'client' || (this.station !== null) === on) return;
    this.station = on ? tuneIn(this.#surroundings.seed()) : null;
    this.hosting?.station(this.station);
  }

  /**
   * The radio's walk at the start of each section after the song's first: the
   * track glides one section to the walk's next style from where it is, never
   * before the head, so what has been scheduled stays as it is. The nudge of
   * the tempo stays within the licence of the style walked to.
   */
  #walkRadio(composed: readonly BandBar[], carried: TransportCarried<unknown>) {
    const { station } = this;
    if (!station) return;
    const clock = clockOfTransport(carried);
    for (const { bar } of composed) {
      if (bar === 0 || bar % SECTION_BARS !== 0 || !this.station) continue;
      const walked = onward(this.station, radioStyle(this.track, this.tempoNudge));
      const at = Math.max(carried.head.step, clock.barStart(bar));
      const conducted = conductRadio(this.track, walked.style, at, this.tempoNudge);
      this.station = walked.station;
      this.track = conducted.track;
      this.tempoNudge = conducted.nudge;
    }
    if (this.station !== station) {
      this.hosting?.station(this.station);
      this.hosting?.track(this.track, this.swing, this.tempoMeter);
      this.#decide();
    }
  }

  /**
   * The environment the band reads from a section's first bar on, as the
   * radio's walk will leave it when that bar is composed (`#walkRadio`): what
   * the shadow forecasts a section ahead by. Off the air, the environment now.
   */
  #envFrom(first: number): TransportEnv {
    const env = this.#env;
    const carried = this.#carried;
    if (!this.station || !carried || first === 0) return env;
    const walked = onward(this.station, radioStyle(this.track, this.tempoNudge));
    const at = Math.max(carried.head.step, clockOfTransport(carried).barStart(first));
    return { ...env, track: conductRadio(this.track, walked.style, at, this.tempoNudge).track };
  }

  apply(intent: Intent) {
    if (this.mode === 'client') return;
    if (this.station && takesFromRadio(intent)) this.tuneRadio(false);
    // A swing set on the Metrum card asks for the meter the band is heading
    // for, so the card's swing wins over the repository's from the next
    // section, as a meter asked for there does (#375).
    if (intent.kind === 'swing' && this.meter === null) this.meter = this.#heading();
    const at = this.status === 'playing' ? (this.#carried?.head.step ?? 0) : null;
    const style = styleAfter(this.track, intent, this.tempoNudge);
    this.track = conduct(this.track, intent, at, this.tempoNudge);
    this.swing = conductSwing(this.swing, intent, at);
    this.tempoNudge = nudgeAfter(this.tempoNudge, intent, style);
    this.wish = wishAfter(this.wish, intent, style, this.home);
    // Stopped, with no meter asked for, the song opens in the meter the
    // repository finds at the style it opens with now.
    if (this.status !== 'playing') this.#countTempoIn(this.#opening());
    this.hosting?.track(this.track, this.swing, this.tempoMeter);
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
    this.#keepHuman({ part, note, velocity, source, position, end: null });
    if (part === 'lead') {
      const heardAs = this.playerId === null ? source : playerSource(this.playerId, source);
      this.#arrived.push({ note, velocity, source: heardAs, position, end: null });
    } else this.#drumsHeard(note, velocity, source, position);
  }

  /**
   * A drum note for the Muse, who files a groove a player plays over a
   * section under the player's name (#401): in a session the name the player
   * goes by, else the instrument it came from. A client's go to its ear,
   * which passes them on to its host by the instrument (#410), and the host
   * names them by the player it seated.
   */
  #drumsHeard(note: number, velocity: number, source: string, position: number) {
    const name = (!this.#follow && this.playerId !== null && this.players[this.playerId]) || source;
    this.#arrivedDrums.push({ note, velocity, source: name, position, end: null });
  }

  /** Keep a note a player struck, the oldest let go of past `HUMAN_NOTES_MAX`. */
  #keepHuman(note: HumanNote) {
    const kept =
      this.humanNotes.length >= HUMAN_NOTES_MAX
        ? this.humanNotes.slice(this.humanNotes.length - HUMAN_NOTES_MAX / 2)
        : this.humanNotes;
    this.humanNotes = [...kept, note];
  }

  /** Tap a hit of the pattern in or out, at a step of the bar. */
  toggleHit(note: number, step: number) {
    this.rhythm = toggled(this.rhythm, note, step);
  }

  /** Write a hit into the pattern at the step heard, as a pad struck while it records. */
  recordHit(note: number) {
    if (this.heard === null) return;
    this.rhythm = recorded(this.rhythm, note, this.clock.stepInBar(this.heard));
  }

  /** The pattern's hits at a step of the song, in its bar. */
  #rhythmAt(step: number): number[] {
    const clock = this.clock;
    return hitsAt(this.rhythm, clock.stepInBar(step), clock.barSteps(clock.barAt(step)));
  }

  /** Log the pattern's hits of the steps heard since the last logged, as this player's drums. */
  #logRhythm(heard: number) {
    const from = this.#rhythmLogged === null ? heard : this.#rhythmLogged + 1;
    for (let step = from; step <= heard; step++)
      for (const note of this.#rhythmAt(step)) {
        this.#keepHuman({
          part: 'drums',
          note,
          velocity: RHYTHM_VELOCITY,
          source: RHYTHM_SOURCE,
          position: step,
          end: step + 1,
        });
        this.#drumsHeard(note, RHYTHM_VELOCITY, RHYTHM_SOURCE, step);
      }
    this.#rhythmLogged = heard;
  }

  /** Nothing remembered: the Muse has read no bar. */
  #forgetMemory() {
    this.memory = [];
    this.museBar = null;
    this.lastPlayed = null;
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
    const timbre = timbreOf(part, styleAt(this.track, this.heard ?? 0), this.#swingHeard(), energy);
    output.play(part, note, velocity, output.currentTime, ALONG_DURATION[part], timbre);
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

  /**
   * `prepare`, asked in this very turn, but waited for only `OUTPUT_WAIT`: a
   * session's clocks and links don't need a running output to begin, and a
   * song's start waits for it by itself.
   */
  async prepareWithin(wait = OUTPUT_WAIT): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ready = this.prepare().then(() => {});
    const patience = new Promise<void>((resolve) => (timer = setTimeout(resolve, wait)));
    try {
      await Promise.race([ready, patience]);
    } finally {
      clearTimeout(timer);
    }
  }

  async start() {
    if (this.status !== 'stopped' || this.mode === 'client') return;
    this.status = 'starting';
    const output = await this.prepare();
    if (this.status !== 'starting') return;
    this.status = 'playing';
    this.#start = output.currentTime + START_LEAD + countInSeconds(this.track, this.#opening());
    this.#begin(output);
    this.hosting?.started({
      seed: this.#seed,
      start: this.#start,
      track: this.track,
      swing: this.swing,
      tempoMeter: this.tempoMeter,
    });
    this.#decide();
    this.#tick();
  }

  /** Everything a song starts from, and the clocks that run it. */
  #begin(output: Output) {
    output.starting?.(this.#start - this.skew);
    this.#carried = null;
    this.shadow.reset(this.#textsFrom());
    this.#heard.clear();
    this.#timing = TRANSPORT_TIMING;
    this.#laid = [];
    this.#arrived = [];
    this.#arrivedDrums = [];
    this.#arrivedBass = [];
    this.#judged = [];
    this.#forget = false;
    this.#finaleTold = false;
    this.ending = false;
    this.#rhythmLogged = null;
    this.#countIn(output);
    this.museLog = [];
    this.offer = null;
    this.#forgetMemory();
    this.dropped = [];
    this.#stopTicker = this.#surroundings.ticker(() => this.#tick());
    this.#stopFrames = this.#surroundings.frame(() => this.#followHeard());
  }

  /**
   * Where a song's section texts come from: the band's own, asked for, alone
   * or hosting; given by the host to a client that plays through cells (#446);
   * none to one that doesn't.
   */
  #textsFrom(): TextsFrom {
    return !this.#follow ? 'asked' : this.#plays === 'cells' ? 'given' : 'none';
  }

  /**
   * The count-in before the song: its clicks, on this output's clock, of
   * those the clock hasn't passed, so a client that joins during it clicks
   * the rest and one that joins after it none.
   */
  #countIn(output: Output) {
    const now = output.currentTime;
    const clicks = countIn(this.track, this.#start, this.#opening())
      .map((click) => ({ ...click, seconds: click.seconds - this.skew }))
      .filter((click) => click.seconds >= now);
    this.counting = this.#start - this.skew > now;
    this.#metronome?.countIn(output, clicks);
  }

  /**
   * The meter the song opens in, which its count-in is a bar of: the meter
   * asked for, or with none the one the repository finds at the style the
   * song opens with (#375); as a client the one its host's first bar is in
   * once that has arrived, else the song's.
   */
  #opening(): Meter {
    const first = this.#follow?.arrived.find((sent) => sent.bar.bar === 0);
    if (this.#follow) return first?.bar.plan.meter ?? SONG_METER;
    return sectionMeter(
      {
        meter: this.meter ?? undefined,
        repository: METER_REPOSITORY,
        style: writtenStyle(styleAt(this.track, 0)),
        layer: this.layer,
      },
      null,
    ).meter;
  }

  /** The meter the song opens in, which its count-in is a bar of (`#opening`). */
  get opening(): Meter {
    return this.#opening();
  }

  /** The meter the band is heading for: the last bar decided's, or stopped, the one the song opens in. */
  #heading(): Meter {
    return this.#bars.at(-1)?.plan.meter ?? this.#opening();
  }

  /** The bars decided, from the first of the section heard on: the forecast a host sends. */
  get ahead(): readonly ForecastBar[] {
    return this.#bars;
  }

  /** Judgements a client made of its players' bars, for the Muse to hear with its own. */
  judgedElsewhere(judged: readonly BarJudgement[]) {
    this.#judged.push(...judged);
  }

  /** Drum notes a client's players struck, named by the player, for the Muse to hear with its own (#410). */
  drumsElsewhere(drums: readonly HeardNote[]) {
    if (this.status === 'playing' && !this.#follow) this.#arrivedDrums.push(...drums);
  }

  /** Bass notes a client's players played, named by the player, for the Muse to hear with its own (#423). */
  bassElsewhere(bass: readonly HeardNote[]) {
    if (this.status === 'playing' && !this.#follow) this.#arrivedBass.push(...bass);
  }

  /**
   * Set the style, key wish, tempo nudge, meter and swing a host that was
   * reloaded had, while it is stopped: the style holds where the conductor
   * left it, its bpm counting the meter's beats (`trackCountedIn`), a record
   * saved before the meter was kept asks for the song's, one that asks for
   * none (null) has the composer ask the repository (#375), and one saved
   * before the meter held the swing plays straight.
   */
  restore({
    track,
    wish,
    tempoNudge,
    meter = SONG_METER,
    swing = holdingSwing(STRAIGHT),
    station = null,
  }: {
    track: StyleTrack;
    wish: KeyWish;
    tempoNudge: number;
    meter?: Meter | null | undefined;
    swing?: SwingTrack | undefined;
    station?: Station | null | undefined;
  }) {
    if (this.status !== 'stopped' || this.mode === 'client') return;
    this.track = stopAt(track);
    this.swing = stopSwing(swing);
    this.wish = wish;
    this.tempoNudge = tempoNudge;
    this.meter = meter;
    this.tempoMeter = this.#opening();
    this.station = station;
    this.hosting?.track(this.track, this.swing, this.tempoMeter);
    this.#decide();
  }

  /**
   * Where the song and the bars composed stand, for a client joining mid-song,
   * and the section texts that state the bars not yet played, while the band
   * plays through cells (#446).
   */
  get hosted(): { song: Song; bars: SentBar[]; texts: readonly SectionText[] } | null {
    const carried = this.#carried;
    if (this.status !== 'playing' || !carried) return null;
    return {
      song: {
        seed: this.#seed,
        start: this.#start,
        track: this.track,
        swing: this.swing,
        tempoMeter: this.tempoMeter,
      },
      bars: sentBars(
        carried.bars,
        this.#laid,
        carried.head,
        this.track,
        clockOfTransport(carried),
        this.tempoMeter,
      ),
      texts:
        this.#plays === 'cells'
          ? this.shadow.toldFrom(clockOfTransport(carried).barAt(carried.head.step))
          : [],
    };
  }

  /** Follow a host from now on: stop playing alone, and wait for its song. */
  follow(told: Following) {
    this.halt();
    this.mode = 'client';
    this.station = null;
    this.lacked = 0;
    this.#follow = {
      carried: null,
      arrived: [],
      texts: [],
      ear: EAR,
      keys: [],
      ends: undefined,
      told,
    };
    this.#bars = [];
    this.#thenClock(null);
  }

  /**
   * Play the host's song from now, with the bars it has composed and not
   * played, and the texts its welcome gave that state them (#446).
   */
  async followSong(song: Song, bars: readonly SentBar[], texts: readonly SectionText[] = []) {
    const follow = this.#follow;
    if (!follow) return;
    this.halt();
    Object.assign(follow, {
      carried: null,
      arrived: [...bars],
      texts: texts.map((text) => ({ text, joined: true })),
      ear: EAR,
      keys: [],
      ends: undefined,
    });
    this.status = 'starting';
    const output = await this.prepare();
    if (this.status !== 'starting' || this.#follow !== follow) return;
    this.status = 'playing';
    this.#seed = song.seed;
    this.#start = song.start;
    this.track = song.track;
    this.swing = song.swing;
    this.tempoMeter = song.tempoMeter;
    this.#begin(output);
    this.#tick();
  }

  /** A bar the host composed. */
  followBar(sent: SentBar) {
    this.#follow?.arrived.push(sent);
  }

  /** A section's text the host's band through cells states, as it took it (#446). */
  followSection(text: SectionText) {
    this.#follow?.texts.push({ text, joined: false });
  }

  /** The host says which bar is the song's last. */
  followEnds(bar: number) {
    if (!this.#follow) return;
    this.#follow.ends = bar;
    this.ending = true;
  }

  followTrack(track: StyleTrack, swing: SwingTrack, tempoMeter: Meter) {
    if (!this.#follow) return;
    this.track = track;
    this.swing = swing;
    this.tempoMeter = tempoMeter;
  }

  /** The host's bars ahead. */
  followForecast(bars: readonly ForecastBar[]) {
    if (!this.#follow) return;
    this.#bars = bars;
    this.#thenClock(this.#follow.carried);
  }

  followMuse({ offer, log, dropped, players, memory, asOf, lastPlayed }: MuseState) {
    if (!this.#follow) return;
    this.offer = offer;
    this.memory = memory;
    this.museBar = asOf;
    this.lastPlayed = lastPlayed;
    this.museLog = log;
    this.dropped = dropped;
    this.players = players;
  }

  /** Play alone again. */
  unfollow() {
    this.halt();
    this.#follow = null;
    this.mode = 'solo';
    this.skew = 0;
    this.track = holding(INITIAL_STYLE);
    this.swing = holdingSwing(OPENING_SWING);
    this.tempoMeter = SONG_METER;
    this.#countTempoIn(this.#opening());
    this.museLog = [];
    this.offer = null;
    this.#forgetMemory();
    this.dropped = [];
    this.players = {};
    this.#decide();
  }

  /**
   * Ask the band to stop: it ends on a bar that closes on a cadence, then
   * halts (`halt`). Asked again, or asked while the song is still to begin
   * (not started, or counting in), it halts at once, which is the way out
   * of a wait.
   */
  stop() {
    if (this.status === 'stopped') return;
    if (this.status !== 'playing' || this.mode === 'client' || this.counting || this.ending)
      return this.halt();
    this.ending = true;
  }

  /** Stop now, whatever the band is in the middle of: nothing rings on. */
  halt() {
    if (this.status === 'stopped') return;
    const wasPlaying = this.status === 'playing';
    this.status = 'stopped';
    this.ending = false;
    this.counting = false;
    this.countStep = null;
    if (!wasPlaying) return;
    this.shadow.end();
    this.#stopTicker?.();
    this.#stopFrames?.();
    this.#stopTicker = this.#stopFrames = null;
    this.heard = null;
    this.#metronome?.rest();
    if (!this.#follow) {
      this.track = stopAt(this.track);
      this.swing = stopSwing(this.swing);
      // A meter asked for and not yet heard, or the repository's at the style, is the one the next song opens in.
      this.#countTempoIn(this.#opening());
      this.#seed = this.#surroundings.seed();
      this.hosting?.stopped();
      this.hosting?.track(this.track, this.swing, this.tempoMeter);
      this.#decide();
    }
    this.#output?.silence();
    this.#sounding.clear();
    this.sounding = SILENT;
    this.#pattern.clear();
    this.pattern = [];
    this.harmonicHistory = NO_HISTORY;
  }

  get #env(): TransportEnv {
    return {
      seed: this.#seed,
      start: this.#start,
      track: this.track,
      wish: this.wish,
      meter: this.meter ?? undefined,
      repository: METER_REPOSITORY,
      layer: this.layer,
      rhythms: this.#rhythms,
      bassLines: this.#bassLines,
      leads: this.#leads,
      session: this.session ?? undefined,
      swing: this.swing,
      tempoMeter: this.tempoMeter,
    };
  }

  /** The meter's swing heard: the bar heard's (its section's share where the repository gave it), or before anything is, what is asked for where the song stands. */
  #swingHeard(): MeterSwing {
    const asked = swingAt(this.swing, this.heard ?? 0);
    const bar = this.hud.bar;
    return bar ? { level: bar.swingLevel, share: bar.swingShare ?? asked.share } : asked;
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
    const from = Math.floor((first - 1) / SECTION_BARS) * SECTION_BARS;
    const kept = carried ? this.#bars.filter((b) => b.bar >= from && b.bar < first) : [];
    this.#bars = [...kept, ...fresh];
    this.#thenClock(carried);
    this.foreseen = foresight(this.#env, carried, PATTERN_BARS).map(patternBarOf);
    this.#decidedAt = carried?.nextBar ?? -1;
    this.hosting?.decided(this.#bars);
  }

  /** Read the song's clock through the bars decided, from the transport as it stands. */
  #thenClock(carried: Parameters<typeof clockThrough>[0]) {
    this.#clockMeters = carried?.meters ?? null;
    this.clock = clockThrough(carried, this.#bars);
  }

  /** The step of the count-in's bar at a time heard on this output, or null before its first click. */
  #countStepAt(heard: number): number | null {
    const meter = this.#opening();
    const from = this.#start - countInSeconds(this.track, meter);
    const step = Math.floor(
      (heard + this.skew - from) / stepSeconds(valueAt('bpm', this.track.bpm, 0), meter),
    );
    return step >= 0 && step < stepsOf(meter) ? step : null;
  }

  /** The count-in is over once the song's start is heard, read on the ticks, which run in a hidden tab. */
  #counted(output: Output) {
    if (this.counting && heardOn(output) + this.skew >= this.#start) this.counting = false;
  }

  #tick() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    this.#counted(output);
    if (this.#follow) return this.#tickFollowing(output, this.#follow);
    const now = output.currentTime;
    // What arrived is taken before the transport reads it, so that anything
    // it can't read costs one tick, not every tick after.
    const [heard, judged, forget] = [this.#arrived, this.#judged, this.#forget];
    const drums = this.#arrivedDrums;
    const bass = this.#arrivedBass;
    this.#arrived = [];
    this.#arrivedDrums = [];
    this.#arrivedBass = [];
    this.#judged = [];
    this.#forget = false;
    const laidWith = this.#env;
    const { carried, output: scheduled } = transport.advance(laidWith, this.#carried, {
      now,
      until: now + LOOKAHEAD,
      heard,
      drums,
      bass,
      judged,
      forget,
      finish: this.ending,
    });
    this.#carried = carried;
    this.#learned(carried!.source.plans.layer);
    // The band decided its next bar in another meter: from now the bpm counts
    // that meter's beats, every step as long as it was (#367).
    const decided = carried!.source.next;
    if (decided && this.#countTempoIn(decided.plan.meter))
      this.hosting?.track(this.track, this.swing, this.tempoMeter);
    this.#walkRadio(scheduled.composed, carried!);
    const logged = scheduled.judged.filter((j) => j.judgements.length > 0 || j.forgot !== null);
    if (logged.length > 0) this.museLog = [...this.museLog, ...logged].slice(-MUSE_LOG);
    const latest = scheduled.judged.at(-1);
    const offered = this.offer;
    const remembered = this.memory;
    if (latest) {
      this.offer = latest.offer;
      const { memory, lastPlayed } = carried!.listening.muse;
      // A memory that was empty and is still is no news.
      if (memory.length > 0 || remembered.length > 0) this.memory = memory;
      this.museBar = latest.bar;
      this.lastPlayed = lastPlayed;
    }
    if (scheduled.dropped.length > 0)
      this.dropped = [...this.dropped, ...scheduled.dropped].slice(-MUSE_LOG);
    if (this.hosting) {
      if (carried!.finale.bar !== null && !this.#finaleTold) {
        this.#finaleTold = true;
        this.hosting.finale(carried!.finale.bar);
      }
      if (scheduled.composed.length > 0)
        this.hosting.composed(
          sentBars(
            scheduled.composed,
            scheduled.steps,
            carried!.head,
            this.track,
            clockOfTransport(carried),
            this.tempoMeter,
          ),
        );
      if (
        logged.length > 0 ||
        this.offer !== offered ||
        this.memory !== remembered ||
        scheduled.dropped.length > 0
      )
        this.hosting.muse({
          offer: this.offer,
          memory: this.memory,
          asOf: this.museBar,
          lastPlayed: this.lastPlayed,
          log: this.museLog,
          dropped: this.dropped,
          players: this.players,
        });
    }
    // The shadow writes and compares beside the band (#399); its events play with the switch on.
    const played = this.shadow.tick({
      env: laidWith,
      next: this.#env,
      carried: carried!,
      output: scheduled,
      now,
      envFrom: (first) => this.#envFrom(first),
    });
    this.#schedule(output, now, played, clockOfTransport(carried));
    const { history, plans } = carried!.source;
    if (history !== this.harmonicHistory) this.harmonicHistory = history;
    // A tonic picked lets go once the band has planned it, so the band moves on from there (#169).
    const wish = plans.before ? released(this.wish, plans.before.key) : this.wish;
    if (wish !== this.wish) {
      this.wish = wish;
      this.#decide();
    } else if (carried?.nextBar !== this.#decidedAt) this.#decide();
    if (this.#finished(carried!, now)) this.halt();
  }

  /** What the band has learned as of the section it planned last, kept as it changes. */
  #learned(layer: LearnedLayer | null) {
    if (!layer || layer === this.layer) return;
    this.layer = layer;
    if (this.#layerLoaded) void this.#surroundings.layers?.save(layer);
  }

  /** Whether the song's last bar has ended and its last chord has rung out, at `now` on the transport's clock. */
  #finished({ finale, head }: TransportCarried<unknown>, now: number): boolean {
    if (finale.ended === null) return false;
    const ring =
      RING_STEPS * stepSeconds(valueAt('bpm', this.track.bpm, head.step), this.tempoMeter);
    return now >= finale.ended + ring;
  }

  /**
   * A client's tick: the host's bars on the host's clock, the new ones that
   * arrived, and its ear judging the bars its players played.
   */
  #tickFollowing(output: Output, follow: Follow) {
    // A jump of either output moves the skew; each tick plays by the latest.
    const skew = follow.told.skew();
    if (skew !== null) this.skew = skew;
    const now = output.currentTime + this.skew;
    const arrived = follow.arrived;
    follow.arrived = [];
    const texts = follow.texts;
    follow.texts = [];
    for (const { text, joined } of texts) this.shadow.given(text, joined);
    const env = this.#env;
    const { carried, output: laid } = follower.advance(env, follow.carried, {
      now,
      until: now + LOOKAHEAD,
      arrived,
      ends: follow.ends,
    });
    follow.carried = carried;
    // With the switch on, the host's texts play through cells, the performer's feel on them, as at the host (#446).
    const scheduled = this.shadow.follow({ env, carried: carried!, output: laid, now });
    if (scheduled.composed.length > 0)
      this.harmonicHistory = scheduled.composed.reduce(
        (history, bar) => foldBar(history, bar.chords),
        this.harmonicHistory,
      );
    const played = scheduled.composed.map(({ bar, plan }) => ({ bar, key: plan.key }));
    if (played.length > 0) follow.keys = [...follow.keys, ...played].slice(-KEYS_KEPT);
    if (carried!.source.lacked !== this.lacked) this.lacked = carried!.source.lacked;
    this.#schedule(output, now, scheduled, clockOfTransport(carried));
    if (carried!.meters !== this.#clockMeters) this.#thenClock(carried);
    const heard = this.writtenPosition(heardOn(output));
    if (heard !== null) {
      const keyOf = (bar: number) => follow.keys.find((k) => k.bar === bar)?.key;
      const ear = earListen(
        follow.ear,
        this.#arrived,
        heard,
        keyOf,
        clockOfTransport(carried),
        this.#arrivedDrums,
      );
      follow.ear = ear.carried;
      if (ear.judged.length > 0) follow.told.judged(ear.judged);
      if (ear.played.length > 0) follow.told.played(ear.played);
    }
    this.#arrived = [];
    this.#arrivedDrums = [];
    if (this.#finished(carried!, now)) this.halt();
  }

  /** Play what the transport scheduled, count it, and keep its steps for what is heard. */
  #schedule(output: Output, now: number, scheduled: TransportOutput, clock: SongClock) {
    const skew = this.skew;
    const late = this.#timing.lateEvents;
    this.#timing = timedTick(this.#timing, { at: this.#surroundings.page(), now, scheduled });
    this.played.push(scheduled.events);
    // What the counters count dropped late is kept beside, so a session's soak can name each (#462).
    if (this.#timing.lateEvents > late) this.played.dropped(scheduled.lateEvents);
    for (const { bar, offer } of scheduled.composed) this.#pattern.offered(bar, offer);
    for (const { bar, event, seconds, duration } of scheduled.events) {
      const performer = performerOf(event.part);
      const velocity = velocityFor(this.mix, performer, event.velocity);
      if (sounds(this.mix, performer) && velocity > 0) {
        output.play(event.part, event.note, velocity, seconds - skew, duration, event);
        this.#sounding.push({ performer, note: event.note, seconds: seconds - skew, duration });
      }
      this.#pattern.push(performer, bar, {
        step: event.step,
        note: event.note,
        length: event.length,
      });
    }
    if (scheduled.events.length > 0) {
      this.pattern = this.#pattern.get();
    }
    if (this.rhythmPlays && this.rhythm.length > 0) {
      const timbre = timbreOf(
        'drums',
        styleAt(this.track, this.heard ?? 0),
        this.#swingHeard(),
        this.hud.bar?.energy ?? 0.6,
      );
      for (const { step, seconds } of scheduled.steps)
        for (const note of this.#rhythmAt(step))
          output.play('drums', note, RHYTHM_VELOCITY, seconds - skew, ALONG_DURATION.drums, timbre);
    }
    output.tick?.(
      skew === 0
        ? scheduled.steps
        : scheduled.steps.map((s) => ({ ...s, seconds: s.seconds - skew })),
    );
    for (const { step, seconds } of scheduled.steps) this.#heard.push(seconds - skew, step);
    this.#metronome?.lay(output, scheduled.steps, skew, clock);
    this.#laid = [
      ...this.#laid.filter((s) => s.seconds + s.length > now - LAID_KEPT),
      ...scheduled.steps,
    ];
    this.#heard.drop(now - skew - 1);
  }

  #followHeard() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const heard = heardOn(output);
    this.countStep = this.counting ? this.#countStepAt(heard) : null;
    const latest = this.#heard.take(heard);
    if (latest !== undefined) this.heard = latest;
    if (latest !== undefined && this.rhythmPlays && this.rhythm.length > 0) this.#logRhythm(latest);
    else if (latest !== undefined) this.#rhythmLogged = latest;
    this.#metronome?.follow(heard);
    this.sounding = this.#sounding.at(heard);
  }
}
