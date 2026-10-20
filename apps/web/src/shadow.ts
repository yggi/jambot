/**
 * The band through cells, in shadow (#399; the seam, #63; #358).
 *
 * The band keeps playing as it does, and beside it each section is written
 * as one cells text (`sectionAsCells`, E35's builder in `@jambot/score`),
 * compiled and played by cells' engine (`playSection`) to a silent sink: its
 * events are laid on the transport's clock and compared, event by event,
 * with what the band sends.
 *
 * A section's bars are not all composed when it starts (the band composes
 * each a beat before it plays), so its text is written from the bars as the
 * band will compose them (a forecast run on the band's own decisions, as
 * `foresight` does), and the bars composed are checked against it as they
 * come. A section's text is built ahead, when the band composes the middle
 * bar of the section before (`SECTION_BARS / 2`), so the work is done four
 * bars before it is needed and never at the section's edge, where the band
 * composes and the radio walks (the spirit: time is absolute). With the
 * radio on the air the forecast reads the track as the radio's walk will
 * leave it (`envFrom`). A bar composed otherwise than foreseen (a control
 * moved, the Muse offered a motif, the song was asked to end) has its
 * section's text written again from it, at once: it is composed a beat
 * before it plays.
 *
 * The text is written, compiled and played where `SectionTexts` says, a
 * worker in the app (`section-texts.ts`, #406): the page forecasts the bars
 * and sends them, and the answer comes back between ticks, each bar then
 * holding what cells plays in it. A bar composed while its text is on its
 * way is compared once it arrives, and a step laid then plays the band's
 * own and is counted late (`arrival`).
 *
 * What is compared, as E35 compares it:
 *
 * - the written layer, each bar as it is composed: each note's part, step,
 *   pitch, velocity as the performer plays it at feel 0, and written length,
 *   and each chord's step and notes (a mismatch is a bound of #399: none);
 * - each onset, as it is laid: cells' event against the band's, matched by
 *   part, pitch and step, on the transport's clock, within 1 ms (a bound),
 *   and on cells' own clock from where the text starts, apart: a text states
 *   one tempo, the first bar's, and the transport's may glide within a
 *   section (the radio's walk), which cells' own clock does not follow;
 * - each event as played, matched as its onset is: its velocity and its
 *   sounding length, in steps and in seconds, against the band's (a bound of
 *   #405: none differ). Cells sounds the written layer at feel 0, and the
 *   performer plays its feel on top of each of cells' events
 *   (`performStated`, cells decision 037: the text holds what is composed,
 *   the playing is the player's), from the same feel and draws as on the
 *   band's own notes; an event's end is laid as the transport lays the
 *   band's (`laidClock`).
 *
 * Cells' events are laid on the transport's clock by their place in the bar:
 * an event `x` steps into a bar as cells plays it (through the swing) is laid
 * where the transport laid that step, `x` less the step's start of a step's
 * length after it, so a tempo the transport glides carries cells' events
 * with it, as it carries its own.
 *
 * What cells cannot say yet is counted apart, each with its reason (`gaps`):
 * a section whose swing's share glides between its bars (one text states one
 * swing), a bar whose beats swing at a share that moves within it, a bar in a
 * meter of pulses of 2 and of 3 eighths swung on 8n (the band leans the pairs
 * and plays the threes straight, T16, and cells' `swing=8n` leans both:
 * `swingStated`),
 * and a bar no text was stated for. A note's level is composed within MIDI's
 * 1 to 127 (`composedLevel`, #433), so a text states every level the band plays on.
 *
 * With `plays` set to cells (the switch, for a solo band only), the band's
 * outputs play cells' events, with the performer's feel, in place of its own
 * wherever cells states the bar, and the band's own where it doesn't.
 */

import {
  type BandBar,
  COMPOSE_AHEAD,
  type DoughNote,
  SECTION_BARS,
  SHARE,
  type ScheduledStep,
  type SongClock,
  type SwingTrack,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  type TransportOutput,
  band,
  bandEnvAt,
  clockOf,
  clockOfTransport,
  laidClock,
  performStated,
  tempoMap,
  valueIn,
  withMeter,
} from '@jambot/engine';
import {
  type PlayedBar,
  type SectionNote,
  bandChords,
  levelSwings,
  mismatches,
  swingStated,
  writtenNotes,
} from '@jambot/score';
import { type SectionStated, type SectionTexts, foreseenOf, inlineTexts } from './section-texts.ts';

/** Which events the band's outputs play: the band's own, or cells'. */
export type Plays = 'band' | 'cells';

/**
 * The switch (#399), off by default: `?play=cells` in the page's address
 * plays a solo band through cells, `?play=band` its own; with neither, the
 * build's default (`VITE_PLAY=cells` at build time, for the end-to-end checks
 * with the switch on), else the band's own.
 */
export function playsFrom(search: string, built: string | undefined): Plays {
  const asked = new URLSearchParams(search).get('play') ?? built;
  return asked === 'cells' ? 'cells' : 'band';
}

/** Within 1 ms: the bound on an onset. */
export const ONSET_BOUND = 0.001;

/** How many events that differ as played the readout shows, the first. */
const SAMPLES_SHOWN = 20;

/** How many cost samples the readout keeps, the latest. */
const SAMPLES_KEPT = 5000;

/** A cost's spread over its samples, in milliseconds. */
export interface Spread {
  readonly count: number;
  readonly p50: number;
  readonly p95: number;
  readonly max: number;
}

/** Onsets timed against the band's: how many, how many within 1 ms, and the farthest, in seconds. */
export interface Timed {
  readonly timed: number;
  readonly within: number;
  readonly largest: number;
}

/** What the shadow found, over every song since the page opened: the dev readout (`window.jambot.shadow`). */
export interface ShadowReadout {
  readonly plays: Plays;
  /** The section texts built and played: ahead, at a bar with none, or again at a bar composed otherwise than foreseen. */
  readonly texts: { readonly ahead: number; readonly fresh: number; readonly again: number };
  /** The bars compared on the written layer, and their notes. */
  readonly bars: number;
  readonly notes: number;
  /**
   * What differs, the bound of #399 and #405 being none: written notes, chords, band events cells has none for, or not within 1 ms, and cells events the band has none for;
   * and as played, events whose velocity differs, or whose sounding length does (by a millionth of a step, or 1 ms).
   */
  readonly mismatched: {
    readonly written: number;
    readonly harmony: number;
    readonly unmatched: number;
    readonly onsets: number;
    readonly extra: number;
    readonly velocity: number;
    readonly length: number;
  };
  /** Each onset on the transport's clock, and on cells' own from where its text starts (apart). */
  readonly onsets: Timed;
  readonly ownClock: Timed;
  /** Each event's sounding length in seconds against the band's, within 1 ms. */
  readonly lengths: Timed;
  /** The first events that differ as played, each in a line: the band's velocity, length and duration, and cells'. */
  readonly differing: readonly string[];
  /** Apart: notes whose sounding length on the written layer, at feel 0, differs. */
  readonly sounding: number;
  /** What cells cannot say yet, by reason: the bars and the band's events it covered. */
  readonly gaps: Readonly<Record<string, { readonly bars: number; readonly events: number }>>;
  /** Anything the shadow threw, which never reaches the band. */
  readonly errors: readonly string[];
  /** With the switch on: the events played from cells, and from the band where cells states no bar. */
  readonly played: { readonly cells: number; readonly band: number };
  /**
   * In ms: writing a text, compiling it, the two together, and playing it, where the job runs (a worker, `section-texts.ts`);
   * on the page's thread, the forecast, and for each text the page's own work, asking for it and taking the answer (`main`, the bound of #406: 2 ms at the 95th percentile).
   */
  readonly cost: {
    readonly build: Spread;
    readonly compile: Spread;
    readonly buildCompile: Spread;
    readonly play: Spread;
    readonly forecast: Spread;
    readonly main: Spread;
  };
  /**
   * When each text arrived: the least time, in seconds, between a text's answer and its first bar playing, by how it was asked
   * (none where no text was); and the steps laid while their bar's text was on its way (the bound of #406: none).
   */
  readonly arrival: {
    readonly least: {
      readonly ahead: number | null;
      readonly fresh: number | null;
      readonly again: number | null;
    };
    readonly late: number;
  };
  /** The latest text built. */
  readonly text: string;
}

/** What one tick of the transport gives the shadow. */
export interface ShadowTick {
  /** The transport's environment on this tick, which it laid the steps with. */
  readonly env: TransportEnv;
  /** The environment from now on, where the tick changed it (the radio's walk): what the bars still to come read. */
  readonly next?: TransportEnv;
  /** The transport's state after it. */
  readonly carried: TransportCarried;
  readonly output: TransportOutput;
  /** The clock now: nothing laid before it plays. */
  readonly now: number;
  /** The environment the band will read from a section's first bar on: the radio's walk to come, if on the air. */
  readonly envFrom?: (bar: number) => TransportEnv;
}

/** What cells plays in one bar, from the latest text that states it. */
interface StatedBar {
  readonly bar: number;
  /** The ask whose answer it is. */
  readonly ask: number;
  /** The bar as foreseen when the text was written: what a bar composed is checked against. */
  readonly foreseen: string;
  readonly played: PlayedBar | null;
  readonly chords: readonly { readonly step: number; readonly pitchClasses: readonly number[] }[];
  /** The text's first step on the song's clock, and where cells holds this bar's start in it, in seconds. */
  readonly textStart: number;
  readonly lap: number;
  /** Why cells states nothing for the bar. */
  readonly gap: string | null;
}

/**
 * Whether a bar's beats all swing at one share: its section's, where the
 * repository gave it, or the swing track's where that holds over the bar;
 * or whether its share moves nothing, an 8n swing in a meter whose pulses
 * are all 3 eighths (`levelSwings`, #438).
 */
export function swingHolds(bar: BandBar, track: SwingTrack, from: number, to: number): boolean {
  if (!levelSwings(bar.meter, bar.swing.level)) return true;
  if (bar.plan.share !== undefined && bar.plan.share !== null) return true;
  const { share } = track;
  if (share.from === share.to || share.start + share.length <= from || share.start >= to)
    return valueIn(SHARE, share, from) === bar.swing.share;
  return false;
}

/**
 * The bars `from` to `to` as the band will compose them, as `foresight`
 * runs them: those composed already, then the band's own composition run
 * forward, each bar reading the environment `envAt` gives for it, with the
 * motif on offer now.
 */
export function forecastBars(
  envAt: (bar: number) => TransportEnv,
  carried: TransportCarried,
  from: number,
  to: number,
): BandBar[] {
  const bars = carried.bars.filter((b) => b.bar >= from && b.bar <= to);
  const offer = carried.listening.muse.offer;
  let meters = carried.meters;
  let source = carried.source;
  for (let bar = carried.nextBar; bar <= to; bar++) {
    const made = band.advance(bandEnvAt(envAt(bar), bar, offer, clockOf(meters)), source, null);
    source = made.carried;
    meters = withMeter(meters, bar, made.output.meter);
    if (bar >= from) bars.push(made.output);
  }
  return bars;
}

const spread = (samples: readonly number[]): Spread => {
  if (samples.length === 0) return { count: 0, p50: 0, p95: 0, max: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]!;
  return { count: sorted.length, p50: at(0.5), p95: at(0.95), max: sorted.at(-1)! };
};

/** Within a millionth of a step. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** A band event's part as cells' lines name it: the pad and the stab apart. */
const lineOfEvent = (e: DoughNote) => e.part;

/** The comparison's part of a written note: the comp is the pad and the stab together. */
const plain = ({ part, step, note, velocity, written, length }: SectionNote): SectionNote => ({
  part,
  step,
  note,
  velocity,
  written,
  length,
});

/** Cells' event at a step, laid: its note, where it sounds on the transport's clock and on cells' own. */
interface Laid {
  readonly event: TimedEvent;
  readonly line: string;
  readonly step: number;
  readonly own: number | null;
}

/** What the shadow counts, each from 0 as a song starts. */
const noCounts = () => ({
  bars: 0,
  notes: 0,
  written: 0,
  harmony: 0,
  unmatched: 0,
  onsets: 0,
  extra: 0,
  velocity: 0,
  length: 0,
  sounding: 0,
  cells: 0,
  band: 0,
});

/** The cost's samples, in ms, by what was timed. */
type Cost = Record<'build' | 'compile' | 'buildCompile' | 'play' | 'forecast' | 'main', number[]>;
const noCost = (): Cost => ({
  build: [],
  compile: [],
  buildCompile: [],
  play: [],
  forecast: [],
  main: [],
});

/** How a text was asked for: ahead, at a bar with none, or again at a bar composed otherwise than foreseen. */
type Asked = 'ahead' | 'fresh' | 'again';

/** A text asked for and not yet answered: how, its bars as forecast, where it starts, and the page's time asking. */
interface Pending {
  readonly asked: Asked;
  readonly bars: readonly BandBar[];
  readonly textStart: number;
  main: number | null;
}

/** The reason a step is laid without cells: its bar's text is still on its way. */
const ON_ITS_WAY = 'the text was on its way when its bar was laid (late)';

/** A swing track that holds straight, for an environment with none. */
const STILL: SwingTrack = {
  level: '16n',
  share: { from: 0.5, to: 0.5, start: 0, length: 0, slope: 0, brake: 0 },
};

export class Shadow {
  plays: Plays;
  #clock: () => number;
  #bars = new Map<number, StatedBar>();
  /** The bars the band composed lately, by bar: what a step laid plays from. */
  #composedBars = new Map<number, BandBar>();
  /** Where each text's first step was laid, on the transport's clock, by that step. */
  #starts = new Map<number, number>();
  #counted = { ahead: 0, fresh: 0, again: 0 };
  #counts = noCounts();
  #onsets = { timed: 0, within: 0, largest: 0 };
  #own = { timed: 0, within: 0, largest: 0 };
  #lengths = { timed: 0, within: 0, largest: 0 };
  #differing: string[] = [];
  #gaps: Record<string, { bars: number; events: number }> = {};
  #errors: string[] = [];
  #cost = noCost();
  #text = '';
  #texts: SectionTexts;
  /** The latest ask for each bar, by bar, and the asks not yet answered, by ask. */
  #asked = new Map<number, number>();
  #pending = new Map<number, Pending>();
  #nextAsk = 1;
  /** The bars composed while their text was on its way, compared once it arrives. */
  #toCompare = new Set<number>();
  /** The latest tick: the page's clock and the transport's then, what an answer between ticks is timed by. */
  #lastTick: { page: number; tick: ShadowTick } | null = null;
  #least: { ahead: number | null; fresh: number | null; again: number | null } = {
    ahead: null,
    fresh: null,
    again: null,
  };
  #late = 0;

  /**
   * `clock` is the page's, in milliseconds, which the cost is timed on;
   * `texts` builds, compiles and plays each section's text: a worker in
   * the app, on this thread where none is given.
   */
  constructor(clock: () => number, plays: Plays = 'band', texts: SectionTexts = inlineTexts()) {
    this.#clock = clock;
    this.plays = plays;
    this.#texts = texts;
  }

  /**
   * A song starts: what was stated for the last is forgotten, and what was
   * found is kept, counted since the page opened; where it will ask for
   * texts (not on a client, which follows a host's song), where they are
   * built starts, warming while the band counts in.
   */
  reset(asking = true) {
    this.#bars.clear();
    this.#composedBars.clear();
    this.#starts.clear();
    this.#asked.clear();
    this.#pending.clear();
    this.#toCompare.clear();
    this.#lastTick = null;
    if (asking) this.#texts.begin();
  }

  /** The song ended: no text asked for it is answered. */
  end() {
    this.#pending.clear();
    this.#texts.end();
  }

  get readout(): ShadowReadout {
    const c = this.#counts;
    return {
      plays: this.plays,
      texts: { ...this.#counted },
      bars: c.bars,
      notes: c.notes,
      mismatched: {
        written: c.written,
        harmony: c.harmony,
        unmatched: c.unmatched,
        onsets: c.onsets,
        extra: c.extra,
        velocity: c.velocity,
        length: c.length,
      },
      onsets: { ...this.#onsets },
      ownClock: { ...this.#own },
      lengths: { ...this.#lengths },
      differing: [...this.#differing],
      sounding: c.sounding,
      gaps: structuredClone(this.#gaps),
      errors: [...this.#errors],
      played: { cells: c.cells, band: c.band },
      cost: {
        build: spread(this.#cost.build),
        compile: spread(this.#cost.compile),
        buildCompile: spread(this.#cost.buildCompile),
        play: spread(this.#cost.play),
        forecast: spread(this.#cost.forecast),
        main: spread(this.#cost.main),
      },
      arrival: { least: { ...this.#least }, late: this.#late },
      text: this.#text,
    };
  }

  /**
   * One tick: the bars composed checked and stated, then the steps laid
   * compared. The events the band's outputs play: cells' where it states
   * the bar and the switch asks for them, the band's own otherwise.
   */
  tick(tick: ShadowTick): readonly TimedEvent[] {
    this.#lastTick = { page: this.#clock(), tick };
    try {
      for (const bar of tick.output.composed) this.#composed(bar, tick);
      const played = this.#laid(tick);
      return this.plays === 'cells' ? played : tick.output.events;
    } catch (error) {
      if (this.#errors.length < 20) this.#errors.push(String(error));
      return tick.output.events;
    }
  }

  #gap(reason: string, bars: number, events: number) {
    const gap = (this.#gaps[reason] ??= { bars: 0, events: 0 });
    gap.bars += bars;
    gap.events += events;
  }

  #sample(kind: keyof Cost, ms: number) {
    const samples = this.#cost[kind];
    samples.push(ms);
    if (samples.length > SAMPLES_KEPT) samples.splice(0, samples.length - SAMPLES_KEPT);
  }

  /** A bar composed: its text written again if it wasn't foreseen, its written layer compared, and the next section's text built ahead at this one's middle. */
  #composed(bar: BandBar, { env: laidWith, next: env = laidWith, carried, envFrom }: ShadowTick) {
    const section = Math.floor(bar.bar / SECTION_BARS);
    const last = (section + 1) * SECTION_BARS - 1;
    const end = carried.finale.bar === null ? last : Math.min(last, carried.finale.bar);
    this.#composedBars.set(bar.bar, bar);
    this.#composedBars.delete(bar.bar - 2 * SECTION_BARS);
    const foreseen = this.#foreseen(bar.bar);
    if (foreseen === undefined || foreseen !== foreseenOf(bar)) {
      const asked = foreseen === undefined ? 'fresh' : 'again';
      this.#counted[asked]++;
      const ahead = this.#forecast(() => env, carried, bar.bar + 1, end);
      this.#state([bar, ...ahead], carried, asked);
    }
    if (this.#current(bar.bar)) this.#compare(bar);
    else this.#toCompare.add(bar.bar);
    if (bar.bar % SECTION_BARS === SECTION_BARS / 2 && !carried.finale.asked) {
      const first = last + 1;
      const walked = envFrom?.(first) ?? env;
      const bars = this.#forecast(
        (b) => (b > first ? walked : env),
        carried,
        first,
        first + SECTION_BARS - 1,
      );
      this.#counted.ahead++;
      this.#state(bars, carried, 'ahead');
    }
  }

  #forecast(
    envAt: (bar: number) => TransportEnv,
    carried: TransportCarried,
    from: number,
    to: number,
  ) {
    if (from > to) return [];
    const t0 = this.#clock();
    const bars = forecastBars(envAt, carried, from, to);
    this.#sample('forecast', this.#clock() - t0);
    return bars;
  }

  /** What the latest text asked for a bar was built from: its answer's, or, still on its way, the bar as forecast; none where none was asked. */
  #foreseen(bar: number): string | undefined {
    const ask = this.#asked.get(bar);
    if (ask === undefined) return undefined;
    const stated = this.#bars.get(bar);
    if (stated?.ask === ask) return stated.foreseen;
    const forecast = this.#pending.get(ask)?.bars.find((b) => b.bar === bar);
    return forecast && foreseenOf(forecast);
  }

  /** Whether a bar holds the answer to the latest text asked for it. */
  #current(bar: number): boolean {
    const ask = this.#asked.get(bar);
    return ask !== undefined && this.#bars.get(bar)?.ask === ask;
  }

  /** Whether a bar's latest text is still on its way. */
  #onItsWay(bar: number): boolean {
    const ask = this.#asked.get(bar);
    return ask !== undefined && this.#pending.has(ask);
  }

  /** Ask for bars as one text, compiled and played through cells (`SectionTexts`), each bar then holding what it plays. */
  #state(bars: readonly BandBar[], carried: TransportCarried, asked: Asked) {
    const t0 = this.#clock();
    const clock = clockOf(
      bars.reduce((meters, b) => withMeter(meters, b.bar, b.meter), carried.meters),
    );
    const ask = this.#nextAsk++;
    const pending: Pending = { asked, bars, textStart: clock.barStart(bars[0]!.bar), main: null };
    this.#pending.set(ask, pending);
    for (const b of bars) this.#asked.set(b.bar, ask);
    this.#texts.ask(bars, (stated) => this.#answered(ask, stated));
    const main = this.#clock() - t0;
    // Answered before `ask` returned, on this thread: the whole of it was the page's work.
    if (this.#pending.has(ask)) pending.main = main;
    else this.#sample('main', main);
  }

  /** A text's answer: each bar it is still the latest for holds what cells plays in it, and the bars composed meanwhile are compared. */
  #answered(ask: number, stated: SectionStated) {
    const pending = this.#pending.get(ask);
    if (!pending) return;
    const t0 = this.#clock();
    this.#pending.delete(ask);
    try {
      this.#take(ask, pending, stated);
    } catch (error) {
      if (this.#errors.length < 20) this.#errors.push(String(error));
    }
    const main = this.#clock() - t0;
    if (pending.main !== null) this.#sample('main', pending.main + main);
  }

  #take(ask: number, pending: Pending, stated: SectionStated) {
    this.#arrived(pending);
    const { bars, textStart } = pending;
    if (stated.played) {
      this.#sample('build', stated.cost.build);
      this.#sample('compile', stated.cost.compile);
      this.#sample('buildCompile', stated.cost.build + stated.cost.compile);
      this.#sample('play', stated.cost.play);
    }
    if (stated.error !== null && this.#errors.length < 20) this.#errors.push(stated.error);
    if (stated.source) this.#text = stated.source;
    const { played } = stated;
    for (const [i, b] of bars.entries()) {
      if (this.#asked.get(b.bar) !== ask) continue;
      const gap =
        stated.unstated ??
        (stated.error !== null || !played
          ? 'no text'
          : played.diagnostics.length > 0
            ? `cells said: ${played.diagnostics[0]}`
            : !swingStated(b.meter, b.swing)
              ? "pulses of 2 and of 3 eighths on an 8n swing: the band leans the pairs and plays the threes straight (T16), and cells' swing=8n leans both (yggi/cells#204)"
              : stated.cut.includes(i)
                ? "a note runs past its line's next onset or the text's end (the finale's ring): cut there"
                : null);
      this.#bars.set(b.bar, {
        bar: b.bar,
        ask,
        foreseen: stated.foreseen[i]!,
        played: played?.bars[i] ?? null,
        chords: played?.chords[i] ?? [],
        textStart,
        lap: played?.laps[i] ?? 0,
        gap,
      });
    }
    const first = bars[0]!.bar;
    for (const key of this.#bars.keys()) if (key < first - 2 * SECTION_BARS) this.#bars.delete(key);
    for (const key of this.#asked.keys())
      if (key < first - 2 * SECTION_BARS) this.#asked.delete(key);
    for (const bar of this.#toCompare) {
      const composed = this.#composedBars.get(bar);
      if (!this.#current(bar) || !composed) continue;
      this.#toCompare.delete(bar);
      this.#compare(composed);
    }
  }

  /** How long before its first bar plays a text arrived, on the transport's clock: now, or between the latest tick and the next. */
  #arrived({ asked, bars }: Pending) {
    const latest = this.#lastTick;
    if (!latest || !latest.tick.carried) return;
    const { tick, page } = latest;
    const { env, carried } = tick;
    const now = tick.now + (this.#clock() - page) / 1000;
    const start = clockOfTransport(carried).barStart(bars[0]!.bar);
    if (start < carried.head.step) return;
    const plays = tempoMap(env.track, carried.head, env.tempoMeter).played(start);
    const least = this.#least[asked];
    this.#least[asked] = least === null ? plays - now : Math.min(least, plays - now);
  }

  /** A bar composed, on the written layer: its notes and chords against what cells plays in it. */
  #compare(bar: BandBar) {
    const stated = this.#bars.get(bar.bar)!;
    const band = writtenNotes(bar).map(plain);
    if (!stated.played || stated.gap !== null)
      return this.#gap(stated.gap ?? 'no text', 1, band.length);
    this.#counts.bars++;
    this.#counts.notes += band.length;
    const cells = stated.played.notes;
    for (const part of ['drums', 'bass', 'comp', 'lead'] as const) {
      const [b, c] = [band.filter((n) => n.part === part), cells.filter((n) => n.part === part)];
      const pairs = mismatches(b, c).filter((line) => line.startsWith('band '));
      this.#counts.written += pairs.length + Math.abs(b.length - c.length);
      this.#counts.sounding += mismatches(b, c, true).filter((l) => l.startsWith('band ')).length;
    }
    const chords = (x: readonly { step: number; pitchClasses: readonly number[] }[]) =>
      x.map((ch) => JSON.stringify([ch.step, ch.pitchClasses]));
    const [mine, theirs] = [chords(stated.chords), chords(bandChords(bar))];
    this.#counts.harmony +=
      Math.abs(mine.length - theirs.length) +
      mine.filter((ch, i) => i < theirs.length && ch !== theirs[i]).length;
  }

  /** The steps laid on a tick: cells' events at each, compared with the band's, and the events to play. */
  #laid({ env, carried, output, now }: ShadowTick): TimedEvent[] {
    const clock = clockOfTransport(carried);
    const played: TimedEvent[] = [];
    for (const step of output.steps) {
      if (this.#starts.size > 64) this.#starts.delete(this.#starts.keys().next().value!);
      const bar = clock.barAt(step.step);
      const inBar = step.step - clock.barStart(bar);
      const stated = this.#current(bar) ? this.#bars.get(bar) : undefined;
      if (stated && step.step === stated.textStart) this.#starts.set(step.step, step.seconds);
      const theirs = output.events.filter((e) => e.bar === bar && e.event.step === inBar);
      const composed = this.#composedBars.get(bar);
      const late = this.#onItsWay(bar);
      if (late) this.#late++;
      const why = late
        ? ON_ITS_WAY
        : !stated
          ? 'no text'
          : (stated.gap ??
            (composed &&
            !swingHolds(composed, env.swing ?? STILL, clock.barStart(bar), clock.barStart(bar + 1))
              ? "the bar's swing moves within it: a text states one"
              : null));
      if (why !== null || !composed) {
        this.#gap(why ?? 'no bar', 0, theirs.length);
        played.push(...theirs);
        if (this.plays === 'cells') this.#counts.band += theirs.length;
        continue;
      }
      const mine = this.#cellsAt(stated!, composed, step, inBar, clock, carried, env, now);
      this.#match(theirs, mine);
      played.push(...mine.map((m) => m.event));
      if (this.plays === 'cells') this.#counts.cells += mine.length;
    }
    return played;
  }

  /**
   * Cells' events whose onset falls in a step, laid where the transport laid
   * it, each as the performer plays it: its velocity and length with the
   * feel, and its end where the transport lays the band's (`laidClock`).
   */
  #cellsAt(
    stated: StatedBar,
    bar: BandBar,
    step: ScheduledStep,
    inBar: number,
    clock: SongClock,
    carried: TransportCarried,
    env: TransportEnv,
    now: number,
  ): Laid[] {
    const p = stated.played!;
    const track = env.swing ?? STILL;
    // A note that runs past its bar ends as the transport knew the bars after as it laid the step:
    // those it had composed, up to `COMPOSE_AHEAD` steps ahead, by their plans and meters, and past them by this bar's.
    const reach = clock.barAt(step.step + COMPOSE_AHEAD);
    const song = clockOf(carried.meters.filter((change) => change.bar <= reach));
    const ends = laidClock(
      step,
      song,
      (at) => {
        const barOfBeat = song.barAt(at);
        const { plan } = (barOfBeat <= reach && this.#composedBars.get(barOfBeat)) || bar;
        return { level: plan.swing, share: plan.share ?? valueIn(SHARE, track.share, at) };
      },
      tempoMap(env.track, { step: step.step, seconds: step.seconds }, env.tempoMeter),
    );
    const textStarted = this.#starts.get(stated.textStart);
    const out: Laid[] = [];
    for (const [j, note] of p.notes.entries()) {
      const onset = p.onsets[j]!;
      if (Math.floor(onset + 1e-9) !== inBar) continue;
      const seconds = step.seconds + (onset - inBar) * step.length;
      if (seconds < now) continue;
      const line = p.lines[j]!;
      const role = p.roles[j];
      const event = performStated(bar, {
        part: line,
        step: Math.round(note.step),
        note: note.note,
        ...(role !== undefined && { role }),
        velocity: note.velocity,
        length: note.length,
      });
      out.push({
        line,
        step: note.step,
        own: textStarted === undefined ? null : textStarted + p.at[j]!,
        event: {
          bar: bar.bar,
          seconds,
          duration: ends(step.step + event.length) - seconds,
          event,
        },
      });
    }
    return out;
  }

  /** The band's events at a step against cells': each matched by part, pitch and step, and its onset timed. */
  #match(theirs: readonly TimedEvent[], mine: readonly Laid[]) {
    const used = new Set<number>();
    for (const e of theirs) {
      const j = mine.findIndex(
        (m, k) =>
          !used.has(k) &&
          m.line === lineOfEvent(e.event) &&
          m.event.event.note === e.event.note &&
          same(m.step, e.event.step),
      );
      if (j < 0) {
        this.#counts.unmatched++;
        continue;
      }
      used.add(j);
      const m = mine[j]!;
      const off = Math.abs(m.event.seconds - e.seconds);
      this.#onsets.timed++;
      if (off < ONSET_BOUND) this.#onsets.within++;
      else this.#counts.onsets++;
      this.#onsets.largest = Math.max(this.#onsets.largest, off);
      if (m.own !== null) {
        const own = Math.abs(m.own - e.seconds);
        this.#own.timed++;
        if (own < ONSET_BOUND) this.#own.within++;
        this.#own.largest = Math.max(this.#own.largest, own);
      }
      const longer = Math.abs(m.event.duration - e.duration);
      this.#lengths.timed++;
      if (longer < ONSET_BOUND) this.#lengths.within++;
      this.#lengths.largest = Math.max(this.#lengths.largest, longer);
      const loud = m.event.event.velocity !== e.event.velocity;
      const long = longer >= ONSET_BOUND || !same(m.event.event.length, e.event.length);
      if (loud) this.#counts.velocity++;
      if (long) this.#counts.length++;
      if ((loud || long) && this.#differing.length < SAMPLES_SHOWN)
        this.#differing.push(
          `bar ${e.bar} ${e.event.part} step ${e.event.step} note ${e.event.note}: ` +
            `band ${e.event.velocity}, ${e.event.length} steps, ${e.duration} s at ${e.seconds} s; ` +
            `cells ${m.event.event.velocity}, ${m.event.event.length} steps, ${m.event.duration} s`,
        );
    }
    this.#counts.extra += mine.length - used.size;
  }
}
