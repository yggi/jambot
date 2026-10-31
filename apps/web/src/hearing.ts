/**
 * The homeostat on the page (#495; #237, E45): the band hears itself, and
 * leans its entropy so that it neither bores nor confuses itself.
 *
 * Each bar the band composes, alone or hosting, is stated as each member's
 * cells text (`heardTexts`) and heard off the clock (`ear.ts`) against the
 * member's library and what it played lately (`playedInto`), which is kept
 * here, so the ear holds nothing but its recogniser. At each section's last
 * bar, once the ear has answered for it, the share recognised over the
 * section's bars (`shareOf`, the last `SHARE_BARS`) is read by the
 * controller (`regulated`) at the players' entropy there, and the lean it
 * moves is played from `LEAN_AHEAD` sections on (`leans`, which the band's
 * environment carries, `TransportEnv.leans`): the section after the one read
 * has its text forecast before the reading is made (`shadow.ts`, at the
 * middle bar of the section before), so it plays as forecast. A reading that
 * comes after the section it would lean has had its text asked for leans the
 * first section whose text is still to be asked, and is counted late.
 *
 * A client hears nothing: it plays its host's texts, which the host's lean
 * composed. What it costs the page's thread, a bar at a time, is kept
 * (`HearingReadout.costs`): stating the texts and asking the ear, and taking
 * its answer; and what the recognition cost the ear, where it ran.
 */

import {
  type BandBar,
  type BarRecognition,
  type Homeostat,
  LEAN_AHEAD,
  type LeanChange,
  type Lately,
  type LearnedLayer,
  NOTHING_LATELY,
  NO_LEAN,
  SECTION_BARS,
  bandOf,
  heardTexts,
  leanAt,
  playedInto,
  regulated,
  shareOf,
  withLean,
} from '@jambot/engine';
import type { Ear, Heard } from './ear.ts';
import { ASKED_AT, type Spread, spread } from './shadow.ts';

/** A section read: its share, the players' entropy at its last bar, and the lean it moved, from the bar it plays from. */
export interface SectionRead {
  readonly section: number;
  readonly share: number | null;
  readonly entropy: number;
  readonly lean: number;
  readonly from: number;
}

/** A bar's cost, in ms: on the page's thread, and the recognition where the ear ran it. */
export interface BarCost {
  readonly bar: number;
  readonly main: number;
  readonly ear: number;
}

/** What the homeostat did this song, for the dev readout (`window.jambot.homeostat`). */
export interface HearingReadout {
  /** The controller as it stands: its lean, its last move, its reversals, and the readings in a row. */
  readonly homeostat: Homeostat;
  /** The song's leans, by the bar each plays from. */
  readonly leans: readonly LeanChange[];
  /** Each section read, oldest first, the latest `KEPT_SECTIONS`. */
  readonly sections: readonly SectionRead[];
  /** The readings that came after the section they would lean had its text asked for. */
  readonly late: number;
  /** Each bar's cost, oldest first, the latest `KEPT_COSTS`. */
  readonly costs: readonly BarCost[];
}

/** How many sections read the readout keeps: some four hours at 120 bpm. */
export const KEPT_SECTIONS = 1024;

/** How many bars' costs the readout keeps: some four hours at 120 bpm. */
export const KEPT_COSTS = 8192;

/** The homeostat on the page: one song's hearing, over an ear. */
export class Hearing {
  #ear: Ear;
  #clock: () => number;
  #lately: Lately = NOTHING_LATELY;
  #heard = new Map<number, BarRecognition>();
  /** The players' entropy at each section's last bar composed and not yet read. */
  #entropy = new Map<number, number>();
  /** Each bar's cost on the page's thread so far, until its answer is taken. */
  #main = new Map<number, number>();
  /** The bar the band composes next, as of the latest bars composed. */
  #nextBar = 0;
  #homeostat: Homeostat = NO_LEAN;
  #leans: readonly LeanChange[] = [];
  #sections: SectionRead[] = [];
  #costs: BarCost[] = [];
  #late = 0;
  /** Hears each lean moved, as the band's environment changes with it. */
  leaned: (() => void) | null = null;

  /** `clock` is the page's, in ms, which the page's cost is timed on. */
  constructor(ear: Ear, clock: () => number = () => performance.now()) {
    this.#ear = ear;
    this.#clock = clock;
  }

  /** The leans the band plays at, by the bar each plays from. */
  get leans(): readonly LeanChange[] {
    return this.#leans;
  }

  /** A song starts: nothing heard, nothing leaned. */
  begin(): void {
    this.#lately = NOTHING_LATELY;
    this.#heard.clear();
    this.#entropy.clear();
    this.#main.clear();
    this.#nextBar = 0;
    this.#homeostat = NO_LEAN;
    this.#leans = [];
    this.#sections = [];
    this.#costs = [];
    this.#late = 0;
    this.#ear.begin();
  }

  /** The song ended: nothing asked is answered, and the next song starts unleaned; the readout stays. */
  end(): void {
    this.#ear.end();
    this.#leans = [];
  }

  /**
   * Bars the band composed, in order, with the layer as of them and the
   * players' entropy at a bar (before the lean): each is stated and sent to
   * the ear, and is what was played lately for the next.
   */
  composed(
    bars: readonly BandBar[],
    layer: LearnedLayer | null,
    entropyAt: (bar: number) => number,
  ): void {
    for (const bar of bars) {
      const t0 = this.#clock();
      const texts = heardTexts(bar);
      const lately = this.#lately;
      this.#lately = playedInto(lately, texts);
      this.#nextBar = Math.max(this.#nextBar, bar.bar + 1);
      if (bar.bar % SECTION_BARS === SECTION_BARS - 1)
        this.#entropy.set(bar.bar, entropyAt(bar.bar));
      const bench = { meter: bar.plan.meter, meterFragment: bar.plan.meterFragment };
      const ask = { bar: bar.bar, texts, bench, layer, lately };
      this.#main.set(bar.bar, 0);
      this.#ear.hear(ask, (heard) => this.#answered(heard));
      // (answered before `hear` returned, on this thread: its cost is the page's)
      const main = this.#clock() - t0;
      if (this.#main.has(bar.bar)) this.#main.set(bar.bar, main);
      else this.#cost(this.#costs.at(-1)!, main);
    }
  }

  #answered({ bar, recognition, cost }: Heard) {
    if (!this.#main.has(bar)) return;
    const t0 = this.#clock();
    this.#heard.set(bar, recognition);
    if (bar % SECTION_BARS === SECTION_BARS - 1) this.#read(bar);
    const main = this.#main.get(bar)! + (this.#clock() - t0);
    this.#main.delete(bar);
    this.#costs.push({ bar, main, ear: cost });
    if (this.#costs.length > KEPT_COSTS) this.#costs.shift();
  }

  /** A bar's cost on the page's thread grown by `main`, where its answer came before its asking was timed. */
  #cost(cost: BarCost, main: number) {
    this.#costs[this.#costs.length - 1] = { ...cost, main: cost.main + main };
  }

  /** The section ending at `last` read: its share, the controller after it, and its lean from the first section it can reach. */
  #read(last: number) {
    const section = Math.floor(last / SECTION_BARS);
    const window: BarRecognition[] = [];
    for (let bar = section * SECTION_BARS; bar <= last; bar++) {
      const heard = this.#heard.get(bar);
      if (heard) window.push(heard);
      this.#heard.delete(bar);
    }
    const share = shareOf(window);
    const entropy = this.#entropy.get(last) ?? 0;
    this.#entropy.delete(last);
    this.#homeostat = regulated(this.#homeostat, share, entropy);
    let reach = section + LEAN_AHEAD;
    while ((reach - 1) * SECTION_BARS + ASKED_AT < this.#nextBar) reach++;
    if (reach > section + LEAN_AHEAD) this.#late++;
    const from = reach * SECTION_BARS;
    const leans = withLean(this.#leans, from, this.#homeostat.lean);
    this.#sections.push({ section, share, entropy, lean: leanAt(leans, from), from });
    if (this.#sections.length > KEPT_SECTIONS) this.#sections.shift();
    if (leans === this.#leans) return;
    this.#leans = leans;
    this.leaned?.();
  }

  get readout(): HearingReadout {
    return {
      homeostat: this.#homeostat,
      leans: this.#leans,
      sections: this.#sections,
      late: this.#late,
      costs: this.#costs,
    };
  }
}

/** What a soak reads of a song's homeostat (`apps/web/e2e/soak.ts`), against the bounds #495 rules. */
export interface HearingSummary {
  /** The page's thread's cost a bar, over every bar kept (the bound: 2 ms at p95). */
  readonly main: Spread;
  /** A recognition's cost where the ear ran it, over the first bars and the last (the bound: the last within 1.25 times the first). */
  readonly ear: { readonly first: Spread; readonly last: Spread };
  readonly sections: number;
  /** The share of sections read inside the band at the players' entropy. */
  readonly inside: number;
  /** The controller's reversals per four sections (the bound: one). */
  readonly reversals: number;
  readonly late: number;
  readonly leans: readonly LeanChange[];
}

/** A readout summed up: the ear's cost over the bars up to `first` and those after `last`, such as a soak's first minute and its last. */
export function hearingSummary(
  { costs, sections, homeostat, late, leans }: HearingReadout,
  first: number,
  last: number,
): HearingSummary {
  const read = sections.filter((s) => s.share !== null);
  const inside = read.filter((s) => {
    const { low, high } = bandOf(s.entropy);
    return s.share! >= low && s.share! <= high;
  });
  return {
    main: spread(costs.map((c) => c.main)),
    ear: {
      first: spread(costs.filter((c) => c.bar <= first).map((c) => c.ear)),
      last: spread(costs.filter((c) => c.bar > last).map((c) => c.ear)),
    },
    sections: sections.length,
    inside: read.length ? inside.length / read.length : 0,
    reversals: sections.length ? (4 * homeostat.reversals) / sections.length : 0,
    late,
    leans,
  };
}
