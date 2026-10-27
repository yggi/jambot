/**
 * The band through cells (#399; the seam, #63; #358): one path, the band's
 * outputs playing what cells plays (#469).
 *
 * Each section is written as one cells text (`sectionAsCells`, E35's builder
 * in `@jambot/score`), compiled and played by cells' engine (`playSection`),
 * and its events are laid on the transport's clock in place of the band's.
 *
 * A section's bars are not all composed when it starts (the band composes
 * each a beat before it plays), so its text is written from the bars as the
 * band will compose them (a forecast run on the band's own decisions, as
 * `foresight` does), and each bar composed is checked against what its text
 * foresaw, a digest (`foreseenOf`). A section's text is built ahead, when the
 * band composes the middle bar of the section before (`SECTION_BARS / 2`), so
 * the work is done four bars before it is needed and never at the section's
 * edge, where the band composes and the radio walks (the spirit: time is
 * absolute). With the radio on the air the forecast reads the track as the
 * radio's walk will leave it (`envFrom`). A bar composed otherwise than
 * foreseen (a control moved, the Muse offered a motif, the song was asked to
 * end) has its section's text written again from it, at once: it is composed
 * a beat before it plays.
 *
 * The text is written, compiled and played where `SectionTexts` says, a
 * worker in the app (`section-texts.ts`, #406): the page forecasts the bars
 * and sends them, and the answer comes back between ticks, each bar then
 * holding what cells plays in it.
 *
 * Cells sounds the written layer at feel 0, and the performer plays its feel
 * on top of each of cells' events (`performStated`, cells decision 037: the
 * text holds what is composed, the playing is the player's), from the same
 * feel and draws as on the band's own notes. Cells' events are laid by their
 * place in the bar: an event `x` steps into a bar as cells plays it (through
 * the swing) is laid where the transport laid that step, `x` less the step's
 * start of a step's length after it, so a tempo the transport glides carries
 * cells' events with it, as it carries its own; an event's end is laid as the
 * transport lays the band's (`laidClock`).
 *
 * The band's own events are the fallback for a gap, a bar cells states none
 * of, each counted with its reason (`gaps`): a bar whose text is still on its
 * way as its bar is laid (late, `arrival`), a section whose swing's share
 * glides between its bars (one text states one swing), a bar whose beats
 * swing at a share that moves within it, a note cut at the finale's ring, and
 * a bar no text was stated for. A note's level is composed within MIDI's 1 to
 * 127 (`composedLevel`, #433), so a text states every level the band plays on.
 * That cells plays a bar it states as the band would have is held by the tests
 * (`shadow.test.ts`), not counted as it plays.
 *
 * In a session (#446) a host's texts are asked as a band alone asks them,
 * and each answer it takes is told (`told`), which the host sends its
 * clients (`SectionText`). A client asks for none: it is given them
 * (`given`), has each compiled and played where its own are
 * (`SectionTexts.play`), and lays them on its own transport as a host lays
 * its own (`follow`), its performer's feel on cells' events. Each bar it is
 * sent is checked against what the latest text that states it was built
 * from (`foreseen`, a digest), as a host checks the bar it composes: a bar
 * sent otherwise than foreseen waits for the host's text again, and plays
 * the band's own if it hasn't come, counted late.
 */

import {
  type BandBar,
  type DoughNote,
  type LateEvent,
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
import { type PlayedBar, levelSwings } from '@jambot/score';
import type { SectionText } from '@jambot/session';
import { type SectionStated, type SectionTexts, foreseenOf, inlineTexts } from './section-texts.ts';

/** Where a song's texts come from: asked for from the band's own bars (alone or hosting), or given by a host (a client, #446). */
export type TextsFrom = 'asked' | 'given';

/** How many cost samples the readout keeps, the latest. */
const SAMPLES_KEPT = 5000;

/** A cost's spread over its samples, in milliseconds. */
export interface Spread {
  readonly count: number;
  readonly p50: number;
  readonly p95: number;
  readonly max: number;
}

/** How the band played through cells, over every song since the page opened: the dev readout (`window.jambot.shadow`). */
export interface ShadowReadout {
  /** Where the latest song's texts came from. */
  readonly from: TextsFrom;
  /**
   * The section texts built and played: ahead, at a bar with none, or again at a bar composed otherwise than foreseen;
   * on a client, those a host gave as it took them (`given`) and with its welcome (`joined`, #446).
   * And those told, which a host whose band plays through cells sends its clients.
   */
  readonly texts: {
    readonly ahead: number;
    readonly fresh: number;
    readonly again: number;
    readonly given: number;
    readonly joined: number;
    readonly told: number;
  };
  /** The size of each text told, as its message goes on the wire: bytes of JSON (#446). */
  readonly wire: Spread;
  /** What cells cannot say yet, by reason: the bars that played the band's own events for it, and those events. */
  readonly gaps: Readonly<Record<string, { readonly bars: number; readonly events: number }>>;
  /** Anything the band through cells threw: the tick then plays the band's own. */
  readonly errors: readonly string[];
  /** The events played from cells, and from the band in a gap. */
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
      readonly given: number | null;
    };
    readonly late: number;
  };
  /** The latest text built. */
  readonly text: string;
}

/** What one tick of a client's transport gives the shadow: the host's bars, as sent (#446). */
export interface FollowTick {
  /** The transport's environment on this tick, which it laid the steps with. */
  readonly env: TransportEnv;
  readonly carried: TransportCarried<unknown>;
  readonly output: TransportOutput;
  /** The clock now: nothing laid before it plays. */
  readonly now: number;
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
  /** The ask whose answer it is, and how it came. */
  readonly ask: number;
  readonly asked: Asked;
  /** What the bar was foreseen as when the text was written, a digest: what a bar composed or sent is checked against. */
  readonly foreseen: string;
  readonly played: PlayedBar | null;
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

/**
 * How a text came: asked for ahead, at a bar with none, or again at a bar composed otherwise than foreseen;
 * or given by a host as it took it, or with its welcome (#446).
 */
type Asked = 'ahead' | 'fresh' | 'again' | 'given' | 'joined';

/**
 * A text asked for and not yet answered: how, its bars, as forecast where asked, where it starts, and the page's
 * time asking.
 */
interface Pending {
  readonly asked: Asked;
  readonly bars: readonly number[];
  readonly forecast: readonly BandBar[];
  readonly textStart: number;
  main: number | null;
}

/** The reason a step is laid without cells: its bar's text is still on its way. */
const ON_ITS_WAY = 'the text was on its way when its bar was laid (late)';

/** The reason a client's step is laid without cells where it joined: the text that states its bar came with the welcome (#446). */
const JOINING = 'the text came with the welcome and was on its way when its bar was laid (joined)';

/** How many texts told a host keeps for a client's welcome: those of the section playing and the next, and more. */
const TOLD_KEPT = 8;

/** A swing track that holds straight, for an environment with none. */
const STILL: SwingTrack = {
  level: '16n',
  share: { from: 0.5, to: 0.5, start: 0, length: 0, slope: 0, brake: 0 },
};

export class Shadow {
  #clock: () => number;
  #bars = new Map<number, StatedBar>();
  /** The bars the band composed lately, by bar: what a step laid plays from. */
  #composedBars = new Map<number, BandBar>();
  /** The gap each bar lately laid in one was counted in, by bar: a bar counts once a reason. */
  #gapped = new Map<number, string>();
  #counted = { ahead: 0, fresh: 0, again: 0, given: 0, joined: 0, told: 0 };
  #from: TextsFrom = 'asked';
  /** What each bar composed lately was built from, as a digest (`foreseenOf`): what the text that states it must have foreseen. */
  #digests = new Map<number, string>();
  /** The texts told lately, latest last: a client's welcome gives those of bars not yet played. */
  #told: SectionText[] = [];
  #wire: number[] = [];
  /** Hears each text the band's own bars state as it is taken: a host sends it to its clients (#446). */
  told: ((text: SectionText) => void) | null = null;
  #played = { cells: 0, band: 0 };
  #gaps: Record<string, { bars: number; events: number }> = {};
  #errors: string[] = [];
  #cost = noCost();
  #text = '';
  #texts: SectionTexts;
  /** The latest ask for each bar, by bar, and the asks not yet answered, by ask. */
  #asked = new Map<number, number>();
  #pending = new Map<number, Pending>();
  #nextAsk = 1;
  /** The latest tick: the page's clock and the transport's then, what an answer between ticks is timed by. */
  #lastTick: { page: number; tick: FollowTick } | null = null;
  #least: {
    ahead: number | null;
    fresh: number | null;
    again: number | null;
    given: number | null;
  } = {
    ahead: null,
    fresh: null,
    again: null,
    given: null,
  };
  #late = 0;

  /**
   * `clock` is the page's, in milliseconds, which the cost is timed on;
   * `texts` builds, compiles and plays each section's text: a worker in
   * the app, on this thread where none is given.
   */
  constructor(clock: () => number, texts: SectionTexts = inlineTexts()) {
    this.#clock = clock;
    this.#texts = texts;
  }

  /**
   * A song starts: what was stated for the last is forgotten, and what was
   * counted is kept, since the page opened; where its texts are built starts,
   * warming while the band counts in.
   */
  reset(from: TextsFrom = 'asked') {
    this.#from = from;
    this.#bars.clear();
    this.#composedBars.clear();
    this.#digests.clear();
    this.#gapped.clear();
    this.#asked.clear();
    this.#pending.clear();
    this.#told = [];
    this.#lastTick = null;
    this.#texts.begin();
  }

  /** The song ended: no text asked for it is answered. */
  end() {
    this.#pending.clear();
    this.#texts.end();
  }

  get readout(): ShadowReadout {
    return {
      from: this.#from,
      texts: { ...this.#counted },
      wire: spread(this.#wire),
      gaps: structuredClone(this.#gaps),
      errors: [...this.#errors],
      played: { ...this.#played },
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
   * One tick: the bars composed checked and stated, then the steps laid. The
   * tick's output as the band's outputs play it: cells' events where it
   * states the bar, the band's own in a gap, and those dropped late of each
   * (#462).
   */
  tick(tick: ShadowTick): TransportOutput {
    return this.#run(tick, (bar) => this.#composed(bar, tick));
  }

  /**
   * One tick of a client's transport (#446): the bars sent, checked against
   * the texts given, then the steps laid; the output to play as `tick`'s.
   */
  follow(tick: FollowTick): TransportOutput {
    return this.#run(tick, (bar) => this.#sent(bar));
  }

  #run(tick: FollowTick, composed: (bar: BandBar) => void): TransportOutput {
    this.#lastTick = { page: this.#clock(), tick };
    try {
      for (const bar of tick.output.composed) composed(bar);
      const { played, late } = this.#laid(tick);
      return { ...tick.output, events: played, lateEvents: late };
    } catch (error) {
      if (this.#errors.length < 20) this.#errors.push(String(error));
      return tick.output;
    }
  }

  /**
   * A section's text a host gave (#446), as it took it or with its welcome
   * (`joined`): compiled and played where this page's texts are, each bar it
   * states then holding what cells plays in it, as on the host.
   */
  given(text: SectionText, joined = false) {
    if (this.#from !== 'given') return;
    const asked = joined ? 'joined' : 'given';
    this.#counted[asked]++;
    const bars = text.foreseen.map((_, i) => text.bar + i);
    this.#ask({ asked, bars, forecast: [], textStart: text.step, main: null }, (answer) =>
      this.#texts.play(text, answer),
    );
  }

  /** The texts told that state a bar from `bar` on, in the order told: what a client's welcome gives (#446). */
  toldFrom(bar: number): readonly SectionText[] {
    return this.#told.filter((t) => t.bar + t.foreseen.length > bar);
  }

  /** A step of a bar laid in a gap: its band's events counted under the reason, and the bar the first time it is laid for it. */
  #gapIn(bar: number, reason: string, events: number) {
    const gap = (this.#gaps[reason] ??= { bars: 0, events: 0 });
    gap.events += events;
    if (this.#gapped.get(bar) === reason) return;
    gap.bars++;
    this.#gapped.set(bar, reason);
    this.#gapped.delete(bar - 2 * SECTION_BARS);
  }

  #sample(kind: keyof Cost, ms: number) {
    const samples = this.#cost[kind];
    samples.push(ms);
    if (samples.length > SAMPLES_KEPT) samples.splice(0, samples.length - SAMPLES_KEPT);
  }

  /** A bar composed: its text written again if it wasn't foreseen, and the next section's text built ahead at this one's middle. */
  #composed(bar: BandBar, { env: laidWith, next: env = laidWith, carried, envFrom }: ShadowTick) {
    const section = Math.floor(bar.bar / SECTION_BARS);
    const last = (section + 1) * SECTION_BARS - 1;
    const end = carried.finale.bar === null ? last : Math.min(last, carried.finale.bar);
    const digest = this.#keep(bar);
    const foreseen = this.#foreseen(bar.bar);
    if (foreseen === undefined || foreseen !== digest) {
      const asked = foreseen === undefined ? 'fresh' : 'again';
      this.#counted[asked]++;
      const ahead = this.#forecast(() => env, carried, bar.bar + 1, end);
      this.#state([bar, ...ahead], carried, asked);
    }
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

  /** A bar composed or sent, kept for the steps laid from it, and what it was built from, as a digest. */
  #keep(bar: BandBar): string {
    const digest = foreseenOf(bar);
    this.#composedBars.set(bar.bar, bar);
    this.#composedBars.delete(bar.bar - 2 * SECTION_BARS);
    this.#digests.set(bar.bar, digest);
    this.#digests.delete(bar.bar - 2 * SECTION_BARS);
    return digest;
  }

  /** A bar a host sent (#446): played through cells once a text given states it as it was sent. */
  #sent(bar: BandBar) {
    this.#keep(bar);
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
    const forecast = this.#pending.get(ask)?.forecast.find((b) => b.bar === bar);
    return forecast && foreseenOf(forecast);
  }

  /**
   * Whether a bar holds the answer to the latest text asked for it, or given,
   * built from the bar as it was composed or sent: a host's always is, as it
   * asks again for a bar composed otherwise than foreseen; a client's is once
   * the host's text again has come.
   */
  #current(bar: number): boolean {
    const ask = this.#asked.get(bar);
    const stated = this.#bars.get(bar);
    const digest = this.#digests.get(bar);
    return (
      ask !== undefined &&
      stated?.ask === ask &&
      (digest === undefined || stated.foreseen === digest)
    );
  }

  /** How a bar's latest text came, while it is on its way: still being built, or, on a client, its bar sent otherwise than foreseen and the host's text again not yet come. */
  #onItsWay(bar: number): Asked | null {
    const ask = this.#asked.get(bar);
    if (ask === undefined) return null;
    const pending = this.#pending.get(ask);
    if (pending) return pending.asked;
    const stated = this.#bars.get(bar);
    const digest = this.#digests.get(bar);
    return stated?.ask === ask && digest !== undefined && stated.foreseen !== digest
      ? stated.asked
      : null;
  }

  /** Ask for bars as one text, compiled and played through cells (`SectionTexts`), each bar then holding what it plays. */
  #state(bars: readonly BandBar[], carried: TransportCarried, asked: Asked) {
    const clock = clockOf(
      bars.reduce((meters, b) => withMeter(meters, b.bar, b.meter), carried.meters),
    );
    const pending: Pending = {
      asked,
      bars: bars.map((b) => b.bar),
      forecast: bars,
      textStart: clock.barStart(bars[0]!.bar),
      main: null,
    };
    this.#ask(pending, (answer) => this.#texts.ask(bars, answer));
  }

  /** A text asked for, or given, timed on the page: its bars then wait for its answer. */
  #ask(pending: Pending, send: (answer: (stated: SectionStated) => void) => void) {
    const t0 = this.#clock();
    const ask = this.#nextAsk++;
    this.#pending.set(ask, pending);
    for (const b of pending.bars) this.#asked.set(b, ask);
    send((stated) => this.#answered(ask, stated));
    const main = this.#clock() - t0;
    // Answered before `ask` returned, on this thread: the whole of it was the page's work.
    if (this.#pending.has(ask)) pending.main = main;
    else this.#sample('main', main);
  }

  /** A text's answer: each bar it is still the latest for holds what cells plays in it. */
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
    const { bars, textStart, asked } = pending;
    if (stated.played) {
      this.#sample('build', stated.cost.build);
      this.#sample('compile', stated.cost.compile);
      this.#sample('buildCompile', stated.cost.build + stated.cost.compile);
      this.#sample('play', stated.cost.play);
    }
    if (stated.error !== null && this.#errors.length < 20) this.#errors.push(stated.error);
    if (stated.source) this.#text = stated.source;
    const { played } = stated;
    let took = false;
    for (const [i, b] of bars.entries()) {
      if (this.#asked.get(b) !== ask) continue;
      took = true;
      const gap =
        stated.unstated ??
        (stated.error !== null || !played
          ? 'no text'
          : played.diagnostics.length > 0
            ? `cells said: ${played.diagnostics[0]}`
            : stated.cut.includes(i)
              ? "a note runs past its line's next onset or the text's end (the finale's ring): cut there"
              : null);
      this.#bars.set(b, {
        bar: b,
        ask,
        asked,
        foreseen: stated.foreseen[i]!,
        played: played?.bars[i] ?? null,
        gap,
      });
    }
    const first = bars[0]!;
    if (took && this.#from === 'asked') this.#tell(first, textStart, stated);
    for (const key of this.#bars.keys()) if (key < first - 2 * SECTION_BARS) this.#bars.delete(key);
    for (const key of this.#asked.keys())
      if (key < first - 2 * SECTION_BARS) this.#asked.delete(key);
  }

  /**
   * A text the band's own bars state, taken: told, as a host sends it (#446),
   * kept for a client's welcome, and its size on the wire counted.
   */
  #tell(bar: number, step: number, stated: SectionStated) {
    const { source: text, unstated, frame, foreseen, cut } = stated;
    const told: SectionText = { bar, step, text, unstated, frame, foreseen, cut };
    this.#counted.told++;
    this.#told = [...this.#told, told].slice(-TOLD_KEPT);
    this.#wire.push(new TextEncoder().encode(JSON.stringify({ kind: 'section', ...told })).length);
    if (this.#wire.length > SAMPLES_KEPT) this.#wire.shift();
    this.told?.(told);
  }

  /**
   * How long before its first bar plays a text arrived, on the transport's clock: now, or between the latest tick
   * and the next; on a client, a text a host gave as it took it (`given`), and not one with its welcome.
   */
  #arrived({ asked, textStart: start }: Pending) {
    const latest = this.#lastTick;
    if (asked === 'joined' || !latest || !latest.tick.carried) return;
    const { tick, page } = latest;
    const { env, carried } = tick;
    const now = tick.now + (this.#clock() - page) / 1000;
    if (start < carried.head.step) return;
    const plays = tempoMap(env.track, carried.head, env.tempoMeter).played(start);
    const least = this.#least[asked];
    this.#least[asked] = least === null ? plays - now : Math.min(least, plays - now);
  }

  /**
   * The steps laid on a tick, and the events to play, and to drop late:
   * cells' where cells plays the bar, the band's own in a gap, of the steps
   * laid and of those the clock passed whole (#462).
   */
  #laid({ env, carried, output, now }: FollowTick): {
    played: TimedEvent[];
    late: LateEvent[];
  } {
    const clock = clockOfTransport(carried);
    const played: TimedEvent[] = [];
    const late: LateEvent[] = [];
    const theirsLate = (bar: number, inBar: number) =>
      output.lateEvents.filter((e) => e.bar === bar && e.event.step === inBar);
    for (const step of output.steps) {
      const bar = clock.barAt(step.step);
      const inBar = step.step - clock.barStart(bar);
      const composed = this.#composedBars.get(bar);
      const onItsWay = this.#onItsWay(bar);
      if (onItsWay !== null && onItsWay !== 'joined') this.#late++;
      const why = this.#bandsWhy(bar, onItsWay, clock, env);
      if (why !== null || !composed) {
        const theirs = output.events.filter((e) => e.bar === bar && e.event.step === inBar);
        this.#gapIn(bar, why ?? 'no bar', theirs.length);
        played.push(...theirs);
        late.push(...theirsLate(bar, inBar));
        this.#played.band += theirs.length;
        continue;
      }
      const mine = this.#cellsAt(
        this.#bars.get(bar)!,
        composed,
        step,
        inBar,
        carried,
        env,
        now,
        late,
      );
      played.push(...mine);
      this.#played.cells += mine.length;
    }
    for (const step of output.passedSteps) {
      const bar = clock.barAt(step);
      const inBar = step - clock.barStart(bar);
      const composed = this.#composedBars.get(bar);
      if (this.#bandsWhy(bar, this.#onItsWay(bar), clock, env) !== null || !composed)
        late.push(...theirsLate(bar, inBar));
      else late.push(...this.#cellsIn(this.#bars.get(bar)!, composed, inBar));
    }
    return { played, late };
  }

  /** Why a bar plays the band's own events, not cells': null where cells states it. */
  #bandsWhy(bar: number, onItsWay: Asked | null, clock: SongClock, env: TransportEnv) {
    const stated = this.#current(bar) ? this.#bars.get(bar) : undefined;
    const composed = this.#composedBars.get(bar);
    return onItsWay
      ? onItsWay === 'joined'
        ? JOINING
        : ON_ITS_WAY
      : !stated
        ? 'no text'
        : (stated.gap ??
          (composed &&
          !swingHolds(composed, env.swing ?? STILL, clock.barStart(bar), clock.barStart(bar + 1))
            ? "the bar's swing moves within it: a text states one"
            : null));
  }

  /** Cells' notes whose onset falls in a step of a bar, each as the performer plays it. */
  #cellsIn(stated: StatedBar, bar: BandBar, inBar: number): LateEvent[] {
    const p = stated.played!;
    return p.notes.flatMap((_, j) =>
      Math.floor(p.onsets[j]! + 1e-9) === inBar
        ? [{ bar: bar.bar, event: this.#performed(p, bar, j) }]
        : [],
    );
  }

  /** Cells' `j`th note in a bar, as the performer plays it: its velocity and length with the feel. */
  #performed(p: NonNullable<StatedBar['played']>, bar: BandBar, j: number): DoughNote {
    const note = p.notes[j]!;
    const role = p.roles[j];
    return performStated(bar, {
      part: p.lines[j]!,
      step: Math.round(note.step),
      note: note.note,
      ...(role !== undefined && { role }),
      velocity: note.velocity,
      length: note.length,
    });
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
    carried: TransportCarried<unknown>,
    env: TransportEnv,
    now: number,
    late: LateEvent[],
  ): TimedEvent[] {
    const p = stated.played!;
    const ends = laidClock(
      step,
      bar,
      carried.meters,
      env.swing ?? STILL,
      tempoMap(env.track, { step: step.step, seconds: step.seconds }, env.tempoMeter),
    );
    const out: TimedEvent[] = [];
    for (const j of p.notes.keys()) {
      const onset = p.onsets[j]!;
      if (Math.floor(onset + 1e-9) !== inBar) continue;
      const seconds = step.seconds + (onset - inBar) * step.length;
      const event = this.#performed(p, bar, j);
      if (seconds < now) {
        late.push({ bar: bar.bar, event });
        continue;
      }
      out.push({
        bar: bar.bar,
        seconds,
        duration: ends(step.step + event.length) - seconds,
        event,
      });
    }
    return out;
  }
}
