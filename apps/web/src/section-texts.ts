/**
 * A section's cells text built, compiled and played, away from the page's
 * thread (#406): the shadow (`shadow.ts`) asks for each section's text with
 * the bars it forecast, and the answer comes back as plain data, what cells
 * plays in each bar, so the clock never waits on cells' compiler (the spirit:
 * time is absolute).
 *
 * `stateSection` is the whole job, and the same wherever it runs.
 * `WorkerTexts` is the page's side of a worker that runs it: the worker is
 * made as a song starts (`begin`) and warmed with a text of its own while the
 * band counts in, so the first section's text compiles warm, and it ends with
 * the song (`end`), as the ticker's does. `inlineTexts` runs the job on the
 * thread that asks, answering before `ask` returns: what the tests and a
 * player without a worker use.
 *
 * The answer also says what of each bar the text is checked by (`foreseenOf`),
 * which costs a millisecond or two over a section, so that is worked out
 * where the text is.
 */

import type { BandBar } from '@jambot/engine';
import {
  type PlayedSection,
  barMeterName,
  compileSection,
  keyText,
  playSection,
  sectionAsCells,
  sectionTextOf,
  statedChords,
  swingText,
  writtenNotes,
} from '@jambot/score';
import { stepsOf } from '@jambot/theory';

/** What of a bar the text is checked by: its written notes, chords, key, scale, meter and swing; its tempo is the transport's. */
export const foreseenOf = (bar: BandBar): string =>
  JSON.stringify([
    writtenNotes(bar),
    statedChords(bar),
    keyText(bar.plan.key),
    bar.plan.melodic,
    barMeterName(bar),
    swingText(bar.meter, bar.swing),
  ]);

/** A section's bars as one text, and what cells plays in each: the job's answer, plain data. */
export interface SectionStated {
  /** The text as built, or empty where none could be. */
  readonly source: string;
  /** What of each bar the text was built from (`foreseenOf`), in order. */
  readonly foreseen: readonly string[];
  /** Where no text states the bars, why (a section's key or meter moving between its bars). */
  readonly unstated: string | null;
  /** What cells plays, once compiled; none where the text wasn't built or cells threw. */
  readonly played: PlayedSection | null;
  /** The bars, by their place in the section, a note was cut in (it runs past its line's next onset or the text's end). */
  readonly cut: readonly number[];
  /** What cells threw. */
  readonly error: string | null;
  /** Where it ran, in ms: building the text, compiling it, and playing it. */
  readonly cost: { readonly build: number; readonly compile: number; readonly play: number };
}

/**
 * The job: the bars written as one text (`sectionAsCells`), compiled and
 * played through cells, timed on `clock` (ms); `edit` changes the text
 * before cells plays it, for a test to show the comparison finds what it
 * checks.
 */
export function stateSection(
  bars: readonly BandBar[],
  edit: (text: string) => string = (text) => text,
  clock: () => number = () => performance.now(),
): SectionStated {
  const t0 = clock();
  const foreseen = bars.map(foreseenOf);
  const none = { source: '', foreseen, played: null, cut: [], error: null };
  let source: string;
  let cut: number[];
  try {
    const text = sectionAsCells(bars, { tempo: 'first' });
    source = edit(sectionTextOf(text));
    const steps = stepsOf(bars[0]!.meter);
    cut = [...new Set(text.cuts.map((c) => Math.floor(c.step / steps)))];
  } catch (error) {
    const reason = String(error instanceof Error ? error.message : error).replace(
      /^a section's (\w+) changes at its bar.*$/,
      "the section's $1 moves between its bars: one text states one",
    );
    return { ...none, unstated: reason, cost: { build: clock() - t0, compile: 0, play: 0 } };
  }
  const t1 = clock();
  try {
    const plan = compileSection(source);
    const t2 = clock();
    const played = playSection(source, bars, plan);
    const t3 = clock();
    return {
      ...none,
      source,
      played,
      cut,
      unstated: null,
      cost: { build: t1 - t0, compile: t2 - t1, play: t3 - t2 },
    };
  } catch (error) {
    return {
      ...none,
      source,
      unstated: null,
      error: String(error),
      cost: { build: t1 - t0, compile: clock() - t1, play: 0 },
    };
  }
}

/** A text of the worker's own, in the forms a section's text uses, compiled as it starts, so the first section's compiles warm. */
const WARM_TEXT = [
  '&bar meter("4/4") step=120bpm',
  '&key scale(aeolian, A)',
  '&harm over=key step=1m [0,2,4] [5,7,9]',
  '&kick step=16n &bd:0:.4 ~ ~ ~',
  '&drums [&kick]',
  '&bd s=white',
  '&bass over=&harm step=16n legato=.6 0@4 3@4',
  '&bassLevel map=amp step=16n .4@8',
  '&bassOut play=&bass level=&bassLevel &bassV',
  '&bassV loop=C1',
  '&out map=midi ~ &bassOut ~!7 &drums',
].join('\n');

/** The warm-up, what a worker does as it starts: its text compiled; what cells said of it. */
export function warmSection(): readonly unknown[] {
  return compileSection(WARM_TEXT).result.diagnostics;
}

/** Where a section's text is built, compiled and played: the shadow's side of it. */
export interface SectionTexts {
  /** A song starts. */
  begin(): void;
  /** Build, compile and play the bars as one text, and `answer` with what cells plays, once. */
  ask(bars: readonly BandBar[], answer: (stated: SectionStated) => void): void;
  /** The song ended: nothing asked is answered any more. */
  end(): void;
}

/** The job run on the thread that asks, the answer given before `ask` returns. */
export function inlineTexts(edit?: (text: string) => string): SectionTexts {
  return {
    begin() {},
    ask: (bars, answer) => answer(stateSection(bars, edit)),
    end() {},
  };
}

/** What the page asks the worker: a section's bars to state, or to warm up. */
export type Ask =
  | { readonly id: number; readonly bars: readonly BandBar[] }
  | { readonly id: number; readonly warm: true };

/** What the worker answers, under the ask's id: what the bars state, or nothing to a warm-up. */
export interface Answer {
  readonly id: number;
  readonly stated: SectionStated | null;
}

/** What the worker does with an ask. */
export function answerAsk(ask: Ask): Answer {
  if ('warm' in ask) {
    warmSection();
    return { id: ask.id, stated: null };
  }
  return { id: ask.id, stated: stateSection(ask.bars) };
}

/** The part of a `Worker` this needs, so a test can stand in for one. */
export interface TextWorker {
  addEventListener(type: 'message', listener: (event: { data: Answer }) => void): void;
  addEventListener(type: 'error', listener: () => void): void;
  postMessage(message: Ask): void;
  terminate(): void;
}

/**
 * The page's side of the worker (`section-texts.worker.ts`): made as a song
 * starts and warmed then, each answer matched to its ask, and ended with the
 * song; an ask with no worker makes one. Where no worker starts, or one
 * fails, the job runs on this thread, as the ticker falls back to an interval
 * (`ticker.ts`): the asks waiting on it then, and every one after.
 */
export class WorkerTexts implements SectionTexts {
  #make: () => TextWorker;
  #worker: TextWorker | null = null;
  #failed = false;
  #waiting = new Map<
    number,
    { bars: readonly BandBar[]; answer: (stated: SectionStated) => void }
  >();
  #next = 1;

  constructor(make: () => TextWorker) {
    this.#make = make;
  }

  begin(): void {
    if (this.#worker) return;
    this.#open()?.postMessage({ id: this.#next++, warm: true });
  }

  ask(bars: readonly BandBar[], answer: (stated: SectionStated) => void): void {
    const worker = this.#worker ?? this.#open();
    if (!worker) return answer(stateSection(bars));
    const id = this.#next++;
    this.#waiting.set(id, { bars, answer });
    worker.postMessage({ id, bars });
  }

  end(): void {
    this.#worker?.terminate();
    this.#worker = null;
    this.#waiting.clear();
  }

  #open(): TextWorker | null {
    if (this.#failed) return null;
    let worker: TextWorker;
    try {
      worker = this.#make();
    } catch {
      this.#failed = true;
      return null;
    }
    worker.addEventListener('message', ({ data }) => {
      const waiting = this.#waiting.get(data.id);
      this.#waiting.delete(data.id);
      if (waiting && data.stated) waiting.answer(data.stated);
    });
    worker.addEventListener('error', () => {
      this.#failed = true;
      const waiting = [...this.#waiting.values()];
      this.end();
      for (const { bars, answer } of waiting) answer(stateSection(bars));
    });
    this.#worker = worker;
    return worker;
  }
}

/** The browser's: a worker of its own, made as a song starts. */
export const browserTexts = (): SectionTexts =>
  new WorkerTexts(
    () => new Worker(new URL('./section-texts.worker.ts', import.meta.url), { type: 'module' }),
  );
