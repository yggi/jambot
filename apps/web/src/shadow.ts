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
 * - each note's sounding length and velocity as played, apart: the
 *   performer's feel plays the band's own, and cells sounds the written
 *   layer at feel 0.
 *
 * Cells' events are laid on the transport's clock by their place in the bar:
 * an event `x` steps into a bar as cells plays it (through the swing) is laid
 * where the transport laid that step, `x` less the step's start of a step's
 * length after it, so a tempo the transport glides carries cells' events
 * with it, as it carries its own.
 *
 * What cells cannot say yet is counted apart, each with its reason (`gaps`):
 * a section whose swing's share glides between its bars (one text states one
 * swing), a bar whose beats swing at a share that moves within it, and a bar
 * no text was stated for.
 *
 * With `plays` set to cells (the switch, for a solo band only), the band's
 * outputs play cells' events in place of its own wherever cells states the
 * bar, and the band's own where it doesn't.
 */

import {
  type BandBar,
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
  tempoMap,
  timbreOf,
  valueIn,
  withMeter,
} from '@jambot/engine';
import {
  type PlayedBar,
  type SectionNote,
  barMeterName,
  bandChords,
  compileSection,
  keyText,
  mismatches,
  playSection,
  sectionAsCells,
  sectionTextOf,
  statedChords,
  swingText,
  writtenNotes,
} from '@jambot/score';
import { stepsOf } from '@jambot/theory';

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
  /** What differs, the bound of #399 being none: written notes, chords, band events cells has none for, or not within 1 ms, and cells events the band has none for. */
  readonly mismatched: {
    readonly written: number;
    readonly harmony: number;
    readonly unmatched: number;
    readonly onsets: number;
    readonly extra: number;
  };
  /** Each onset on the transport's clock, and on cells' own from where its text starts (apart). */
  readonly onsets: Timed;
  readonly ownClock: Timed;
  /** Apart: notes whose sounding length differs, and events whose velocity as played differs (the performer's feel). */
  readonly sounding: number;
  readonly velocity: number;
  /** What cells cannot say yet, by reason: the bars and the band's events it covered. */
  readonly gaps: Readonly<Record<string, { readonly bars: number; readonly events: number }>>;
  /** Anything the shadow threw, which never reaches the band. */
  readonly errors: readonly string[];
  /** With the switch on: the events played from cells, and from the band where cells states no bar. */
  readonly played: { readonly cells: number; readonly band: number };
  /** On the main thread, in ms: writing a text, compiling it, the two together (the bound: 5 ms at the 95th percentile), playing it, and the forecast. */
  readonly cost: {
    readonly build: Spread;
    readonly compile: Spread;
    readonly buildCompile: Spread;
    readonly play: Spread;
    readonly forecast: Spread;
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

/** What of a bar the text is checked by: its written notes, chords, key, scale, meter and swing; its tempo is the transport's. */
export const foreseenOf = (bar: BandBar): string =>
  JSON.stringify([
    writtenNotes(bar),
    statedChords(bar),
    keyText(bar.plan.key),
    bar.plan.melodic,
    barMeterName(bar),
    swingText(bar.swing),
  ]);

/**
 * Whether a bar's beats all swing at one share: its section's, where the
 * repository gave it, or the swing track's where that holds over the bar.
 */
export function swingHolds(bar: BandBar, track: SwingTrack, from: number, to: number): boolean {
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
  sounding: 0,
  velocity: 0,
  cells: 0,
  band: 0,
});

/** The cost's samples, in ms, by what was timed. */
type Cost = Record<'build' | 'compile' | 'buildCompile' | 'play' | 'forecast', number[]>;
const noCost = (): Cost => ({ build: [], compile: [], buildCompile: [], play: [], forecast: [] });

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
  #texts = { ahead: 0, fresh: 0, again: 0 };
  #counts = noCounts();
  #onsets = { timed: 0, within: 0, largest: 0 };
  #own = { timed: 0, within: 0, largest: 0 };
  #gaps: Record<string, { bars: number; events: number }> = {};
  #errors: string[] = [];
  #cost = noCost();
  #text = '';

  #edit: (text: string) => string;

  /**
   * `clock` is the page's, in milliseconds, which the cost is timed on; a
   * test may edit each text before cells plays it, to show the comparison
   * finds what it checks.
   */
  constructor(
    clock: () => number,
    plays: Plays = 'band',
    edit: (text: string) => string = (t) => t,
  ) {
    this.#clock = clock;
    this.plays = plays;
    this.#edit = edit;
  }

  /** A song starts: what was stated for the last is forgotten, and what was found is kept, counted since the page opened. */
  reset() {
    this.#bars.clear();
    this.#composedBars.clear();
    this.#starts.clear();
  }

  get readout(): ShadowReadout {
    const c = this.#counts;
    return {
      plays: this.plays,
      texts: { ...this.#texts },
      bars: c.bars,
      notes: c.notes,
      mismatched: {
        written: c.written,
        harmony: c.harmony,
        unmatched: c.unmatched,
        onsets: c.onsets,
        extra: c.extra,
      },
      onsets: { ...this.#onsets },
      ownClock: { ...this.#own },
      sounding: c.sounding,
      velocity: c.velocity,
      gaps: structuredClone(this.#gaps),
      errors: [...this.#errors],
      played: { cells: c.cells, band: c.band },
      cost: {
        build: spread(this.#cost.build),
        compile: spread(this.#cost.compile),
        buildCompile: spread(this.#cost.buildCompile),
        play: spread(this.#cost.play),
        forecast: spread(this.#cost.forecast),
      },
      text: this.#text,
    };
  }

  /**
   * One tick: the bars composed checked and stated, then the steps laid
   * compared. The events the band's outputs play: cells' where it states
   * the bar and the switch asks for them, the band's own otherwise.
   */
  tick(tick: ShadowTick): readonly TimedEvent[] {
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
    const stated = this.#bars.get(bar.bar);
    if (!stated || stated.foreseen !== foreseenOf(bar)) {
      this.#texts[stated ? 'again' : 'fresh']++;
      const ahead = this.#forecast(() => env, carried, bar.bar + 1, end);
      this.#state([bar, ...ahead], carried);
    }
    this.#compare(bar);
    if (bar.bar % SECTION_BARS === SECTION_BARS / 2 && !carried.finale.asked) {
      const first = last + 1;
      const walked = envFrom?.(first) ?? env;
      const bars = this.#forecast(
        (b) => (b > first ? walked : env),
        carried,
        first,
        first + SECTION_BARS - 1,
      );
      this.#texts.ahead++;
      this.#state(bars, carried);
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

  /** Write bars as one text, compile it and play it through cells, and keep what each bar plays. */
  #state(bars: readonly BandBar[], carried: TransportCarried) {
    const clock = clockOf(
      bars.reduce((meters, b) => withMeter(meters, b.bar, b.meter), carried.meters),
    );
    const textStart = clock.barStart(bars[0]!.bar);
    const t0 = this.#clock();
    let source: string;
    let cut: ReadonlySet<number>;
    try {
      const text = sectionAsCells(bars, { tempo: 'first' });
      source = sectionTextOf(text);
      const steps = stepsOf(bars[0]!.meter);
      cut = new Set(text.cuts.map((c) => bars[Math.floor(c.step / steps)]!.bar));
    } catch (error) {
      const reason = String(error instanceof Error ? error.message : error).replace(
        /^a section's (\w+) changes at its bar.*$/,
        "the section's $1 moves between its bars: one text states one",
      );
      for (const b of bars) this.#bars.set(b.bar, this.#unstated(b, reason, textStart));
      return;
    }
    source = this.#edit(source);
    const t1 = this.#clock();
    const plan = compileSection(source);
    const t2 = this.#clock();
    const played = playSection(source, bars, plan);
    const t3 = this.#clock();
    this.#sample('build', t1 - t0);
    this.#sample('compile', t2 - t1);
    this.#sample('buildCompile', t2 - t0);
    this.#sample('play', t3 - t2);
    this.#text = source;
    for (const [i, b] of bars.entries())
      this.#bars.set(b.bar, {
        bar: b.bar,
        foreseen: foreseenOf(b),
        played: played.bars[i]!,
        chords: played.chords[i]!,
        textStart,
        lap: played.laps[i]!,
        gap:
          played.diagnostics.length > 0
            ? `cells said: ${played.diagnostics[0]}`
            : cut.has(b.bar)
              ? "a note runs past its line's next onset or the text's end (the finale's ring): cut there"
              : null,
      });
    for (const key of this.#bars.keys())
      if (key < bars[0]!.bar - 2 * SECTION_BARS) this.#bars.delete(key);
  }

  #unstated(bar: BandBar, reason: string, textStart: number): StatedBar {
    return {
      bar: bar.bar,
      foreseen: foreseenOf(bar),
      played: null,
      chords: [],
      textStart,
      lap: 0,
      gap: reason,
    };
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
      const stated = this.#bars.get(bar);
      if (stated && step.step === stated.textStart) this.#starts.set(step.step, step.seconds);
      const theirs = output.events.filter((e) => e.bar === bar && e.event.step === inBar);
      const composed = this.#composedBars.get(bar);
      const why = !stated
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
      const mine = this.#cellsAt(stated!, composed, step, inBar, clock, env, now);
      this.#match(theirs, mine);
      played.push(...mine.map((m) => m.event));
      if (this.plays === 'cells') this.#counts.cells += mine.length;
    }
    return played;
  }

  /** Cells' events whose onset falls in a step, laid where the transport laid it. */
  #cellsAt(
    stated: StatedBar,
    bar: BandBar,
    step: ScheduledStep,
    inBar: number,
    clock: SongClock,
    env: TransportEnv,
    now: number,
  ): Laid[] {
    const p = stated.played!;
    const barStart = clock.barStart(bar.bar);
    const anchor = { step: step.step, seconds: step.seconds };
    const tempo = tempoMap(env.track, anchor, env.tempoMeter);
    const textStarted = this.#starts.get(stated.textStart);
    const out: Laid[] = [];
    for (const [j, note] of p.notes.entries()) {
      const onset = p.onsets[j]!;
      if (Math.floor(onset + 1e-9) !== inBar) continue;
      const seconds = step.seconds + (onset - inBar) * step.length;
      if (seconds < now) continue;
      const end = tempo.played(barStart + Math.max(onset, p.ends[j]!));
      const line = p.lines[j]!;
      const role = p.roles[j];
      out.push({
        line,
        step: note.step,
        own: textStarted === undefined ? null : textStarted + p.at[j]!,
        event: {
          bar: bar.bar,
          seconds,
          duration: end - seconds,
          event: {
            part: line,
            step: Math.round(note.step),
            note: note.note,
            length: note.length,
            velocity: note.velocity,
            gain: note.velocity / 127,
            ...timbreOf(line, bar.style, bar.swing, bar.barEnergy),
            ...(role !== undefined && { role }),
          },
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
      if (m.event.event.velocity !== e.event.velocity) this.#counts.velocity++;
    }
    this.#counts.extra += mine.length - used.size;
  }
}
