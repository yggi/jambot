/**
 * A section's cells text built, compiled and played, away from the page's
 * thread (#406): the band through cells (`shadow.ts`) asks for each section's text with
 * the bars it forecast, and the answer comes back as plain data, what cells
 * plays in each bar, so the clock never waits on cells' compiler (the spirit:
 * time is absolute). A client of a host is given each section's text instead (`SectionText`, #446), and has it
 * compiled and played the same way (`playText`), from the text and its frame
 * alone, as the host's own is.
 *
 * `stateSection` is the whole job, and the same wherever it runs: the text
 * built, then played as a client plays it. `WorkerTexts` is the page's side
 * of a worker that runs it (`off-clock.ts`): the worker is made as a song
 * starts (`begin`) and warmed with a text of its own while the band counts
 * in, so the first section's text compiles warm, and it ends with the song
 * (`end`), as the ticker's does. `inlineTexts` runs the job on the thread that asks,
 * answering before `ask` returns: what the tests and a player without a
 * worker use.
 *
 * The answer also says what of each bar the text is checked by (`foreseenOf`),
 * which costs a millisecond or two over a section, and what the text locks
 * (`scoreLock`, cells' `textLockfile`), so both are worked out where the text is.
 *
 * A client of session version 2 (#553) is given each section's score in place
 * of its text, which states its meter, tempo and key itself, and the
 * fragments it locks that the session sent: it has it compiled and played the
 * same way (`playScore`), its frame read from the score alone (`scoreFrame`),
 * and its bars lacked where it locks a fragment neither the session nor this
 * pin holds (`lockLacks`).
 */

import { type BandBar, INITIAL_KEY, STRAIGHT } from '@jambot/engine';
import type { FragmentText, ScoreRead, SectionScore, SectionText } from '@jambot/session';
import {
  type PlayedSection,
  type SectionFrame,
  barMeterName,
  compileSection,
  keyText,
  playSection,
  sectionAsCells,
  sectionOutline,
  type Outline,
  type ScoreLock,
  lockLacks,
  scoreFrame,
  scoreLock,
  scoreResolve,
  sectionTextOf,
  statedChords,
  swingText,
  writtenNotes,
} from '@jambot/score';
import { METERS, stepsOf } from '@jambot/theory';
import { type JobWorker, WorkerJobs } from './off-clock.ts';

/**
 * A text's digest: cyrb53 (bryc's, public domain), 53 bits as hex, so two
 * texts that differ share one by a chance of some 1 in 9e15.
 */
export function digest(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * What of a bar the text is checked by, as a digest: its written notes,
 * chords, key, scale, meter and swing; its tempo is the transport's. A host
 * sends it with each text (`SectionText.foreseen`), and a client checks the
 * bar it is sent by it, as the host checks the bar it composes.
 */
export const foreseenOf = (bar: BandBar): string =>
  digest(
    JSON.stringify([
      writtenNotes(bar),
      statedChords(bar),
      keyText(bar.plan.key),
      bar.plan.melodic,
      barMeterName(bar),
      swingText(bar.meter, bar.swing),
    ]),
  );

/** What of a section's bars cells' reading needs beside its text, from its first bar: what a host sends with it. */
export const frameOf = (bar: BandBar): SectionText['frame'] => ({
  meter: bar.meter,
  swing: bar.swing,
  bpm: bar.style.bpm,
  key: bar.plan.key,
});

/** A text's frame for each of its bars, as cells' reading takes it (`playSection`). */
const framesOf = (
  { meter, swing, bpm, key }: SectionText['frame'],
  count: number,
): SectionFrame[] =>
  Array.from({ length: count }, () => ({ meter, swing, style: { bpm }, plan: { key } }));

/** A section's bars as one text, and what cells plays in each: the job's answer, plain data. */
export interface SectionStated {
  /** The text as built, or empty where none could be. */
  readonly source: string;
  /** What cells' reading needs beside the text, from its first bar. */
  readonly frame: SectionText['frame'];
  /** What of each bar the text was built from (`foreseenOf`), in order. */
  readonly foreseen: readonly string[];
  /** Where no text states the bars, why (a section's key or meter moving between its bars). */
  readonly unstated: string | null;
  /** What cells plays, once compiled; none where the text wasn't built or cells threw. */
  readonly played: PlayedSection | null;
  /** The score's outline (cells' `outlineOf`), what the Cells view's Playing tree reads (#642); none where it wasn't compiled. */
  readonly outline: Outline | null;
  /** The bars, by their place in the section, a note was cut in (it runs past its line's next onset or the text's end). */
  readonly cut: readonly number[];
  /**
   * Every fragment the text takes `from` but the band, and of them those not in the seed library, with their texts
   * (`scoreLock`): what a host of session version 2 sends with the score (#553); none for a text a host gave.
   */
  readonly lock: ScoreLock['lock'];
  readonly filed: ScoreLock['filed'];
  /** What cells threw. */
  readonly error: string | null;
  /** Where it ran, in ms: building the text, compiling it, and playing it. */
  readonly cost: { readonly build: number; readonly compile: number; readonly play: number };
  /**
   * For a score a host of session version 2 gave (#553): what it states, read from the score alone, or why its bars
   * can't play here; none for a text.
   */
  readonly read?: ScoreRead;
}

/**
 * The job: the bars written as one text (`sectionAsCells`), then compiled and
 * played through cells as a client of session version 2 plays it as a score
 * (`playScore`, with the fragments it locks), and what it states read off it
 * (`read`), timed on `clock` (ms); `edit` changes the text before cells plays
 * it, for a test to show that cells' events, not the band's, are what plays.
 * Its `frame` is the first bar's, which a client of version 1 reads beside the text (`playText`).
 */
export function stateSection(
  bars: readonly BandBar[],
  edit: (text: string) => string = (text) => text,
  clock: () => number = () => performance.now(),
): SectionStated {
  const t0 = clock();
  const foreseen = bars.map(foreseenOf);
  const frame = frameOf(bars[0]!);
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
    const none = {
      source: '',
      frame,
      foreseen,
      played: null,
      outline: null,
      cut: [],
      lock: [],
      filed: [],
      error: null,
    };
    return { ...none, unstated: reason, cost: { build: clock() - t0, compile: 0, play: 0 } };
  }
  const { lock, filed } = scoreLock(source);
  const built = clock() - t0;
  // (played as a client of session version 2 plays the score, with the fragments it locks: what the page's own player sounds, #711)
  const read = readScore({ text: source, unstated: null, lock, foreseen, cut }, filed, clock);
  return { ...read, frame, filed, cost: { ...read.cost, build: built } };
}

/**
 * A section's text as a host sends it, compiled and played through cells from
 * the text and its frame alone (#446): what a client does with each it is
 * given, and the host with each it builds (`stateSection`), so the two play
 * alike. Where no text states the bars, nothing is played and the reason is kept.
 */
export function playText(
  given: SectionText,
  clock: () => number = () => performance.now(),
): SectionStated {
  const { text: source, frame, foreseen, cut, unstated } = given;
  const none = {
    source,
    frame,
    foreseen,
    unstated,
    played: null,
    outline: null,
    cut,
    lock: [],
    filed: [],
    error: null,
  };
  if (unstated !== null) return { ...none, cost: { build: 0, compile: 0, play: 0 } };
  const t1 = clock();
  try {
    const plan = compileSection(source);
    const t2 = clock();
    const played = playSection(source, framesOf(frame, foreseen.length), plan);
    const outline = sectionOutline(plan);
    const t3 = clock();
    return { ...none, played, outline, cost: { build: 0, compile: t2 - t1, play: t3 - t2 } };
  } catch (error) {
    return {
      ...none,
      error: String(error),
      cost: { build: 0, compile: clock() - t1, play: 0 },
    };
  }
}

/** The frame of a score that plays nothing (unstated, or not read): its own fields, which nothing reads. */
const UNREAD: SectionText['frame'] = {
  meter: METERS['4/4'],
  swing: STRAIGHT,
  bpm: 0,
  key: INITIAL_KEY,
};

/** A score a host of session version 2 gave (#553), and the fragments the session sent that it locks. */
export interface GivenScore {
  readonly score: SectionScore;
  readonly fragments: readonly FragmentText[];
}

/**
 * A score as a host of session version 2 sends it (#553), compiled and played through cells from the score alone and
 * the fragments the session sent: its meter, swing, tempo and key read off it (`scoreFrame`), its `from` lines reading
 * the fragments sent by their hash, else the seed library (`scoreResolver`), its band this page's own at the score's
 * style (`resolveBand`). A score that locks a fragment neither holds, or whose frame cells can't read, is read as
 * lacking, and nothing is played; one that states nothing (`unstated`) plays nothing either.
 */
export const playScore = (
  { score, fragments }: GivenScore,
  clock: () => number = () => performance.now(),
): SectionStated => readScore(score, fragments, clock);

/** `playScore` over what of a score it reads, so the page that builds a score plays it as its clients do (#711). */
function readScore(
  score: Pick<SectionScore, 'text' | 'unstated' | 'lock' | 'foreseen' | 'cut'>,
  fragments: readonly FragmentText[],
  clock: () => number,
): SectionStated {
  const { text: source, foreseen, cut, unstated } = score;
  const none = {
    source,
    frame: UNREAD,
    foreseen,
    unstated,
    played: null,
    outline: null,
    cut,
    lock: score.lock,
    filed: [],
    error: null,
    cost: { build: 0, compile: 0, play: 0 },
  } satisfies SectionStated;
  if (unstated !== null || source === '') return none;
  const lacking = lockLacks(score.lock, fragments);
  if (lacking.length > 0)
    return {
      ...none,
      read: {
        lacks: `its score locks ${lacking.map((l) => `“${l.id}”`).join(', ')}, which neither the session sent nor this page’s cells holds`,
      },
    };
  const t1 = clock();
  try {
    const resolve = scoreResolve(source, fragments);
    const plan = compileSection(source, resolve);
    const read = scoreFrame(source, plan, foreseen.length, resolve);
    const t2 = clock();
    if (!read)
      return {
        ...none,
        read: { lacks: 'cells reads no meter, tempo or key in its score' },
        cost: { build: 0, compile: t2 - t1, play: 0 },
      };
    const frame = { meter: read.meter, swing: read.swing, bpm: read.bpm, key: read.key };
    const played = playSection(source, framesOf(frame, foreseen.length), plan);
    const outline = sectionOutline(plan);
    const t3 = clock();
    return {
      ...none,
      frame,
      played,
      outline,
      read: { frame: read },
      cost: { build: 0, compile: t2 - t1, play: t3 - t2 },
    };
  } catch (error) {
    return {
      ...none,
      error: String(error),
      read: { lacks: `cells threw reading its score: ${String(error)}` },
      cost: { build: 0, compile: clock() - t1, play: 0 },
    };
  }
}

/** A text of the worker's own, in the forms a section's text uses, compiled as it starts, so the first section's compiles warm. */
const WARM_TEXT = [
  '&harm, &key from',
  '&bar meter("4/4") step=120bpm',
  '&key scale(aeolian, A)',
  '&style label="groove" style=&(map=style .5 .5 .5 .5)',
  '&harm over=&key step=1m [0,2,4] [5,7,9]',
  '&kick role=kick step=16n &bd:0:.4 ~ ~ ~',
  '&drumlines [&kick]',
  '&bassline part=bass over=&harm step=16n legato=.6 0@4 3@4',
  '&bassLevel map=amp step=16n .4@8',
  '&padline part=pad step=1m ~',
  '&stabline part=stab step=1m ~',
  '&leadline part=lead step=1m ~',
  '* from band(drumlines=&drumlines, bassline=&bassline, padline=&padline, stabline=&stabline, leadline=&leadline, bassLevel=&bassLevel, style=&style)',
].join('\n');

/** The warm-up, what a worker does as it starts: its text compiled; what cells said of it. */
export function warmSection(): readonly unknown[] {
  return compileSection(WARM_TEXT).result.diagnostics;
}

/** Where a section's text is built, compiled and played: the band through cells' side of it. */
export interface SectionTexts {
  /** A song starts. */
  begin(): void;
  /** Build, compile and play the bars as one text, and `answer` with what cells plays, once. */
  ask(bars: readonly BandBar[], answer: (stated: SectionStated) => void): void;
  /** Compile and play a text a host gave (#446), and `answer` with what cells plays, once. */
  play(given: SectionText, answer: (stated: SectionStated) => void): void;
  /** Read, compile and play a score a host of session version 2 gave (#553), and `answer` with what cells plays, once. */
  score(given: GivenScore, answer: (stated: SectionStated) => void): void;
  /** The song ended: nothing asked is answered any more. */
  end(): void;
}

/** The job run on the thread that asks, the answer given before `ask` returns. */
export function inlineTexts(edit?: (text: string) => string): SectionTexts {
  return {
    begin() {},
    ask: (bars, answer) => answer(stateSection(bars, edit)),
    play: (given, answer) => answer(playText(given)),
    score: (given, answer) => answer(playScore(given)),
    end() {},
  };
}

/** What the page asks the worker: a section's bars to state, a text or a score a host gave to play, or to warm up. */
export type Ask =
  | { readonly id: number; readonly bars: readonly BandBar[] }
  | { readonly id: number; readonly given: SectionText }
  | { readonly id: number; readonly score: GivenScore }
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
  if ('score' in ask) return { id: ask.id, stated: playScore(ask.score) };
  return { id: ask.id, stated: 'given' in ask ? playText(ask.given) : stateSection(ask.bars) };
}

/** The part of a `Worker` this needs, so a test can stand in for one. */
export type TextWorker = JobWorker<Ask, Answer>;

/**
 * The page's side of the worker (`section-texts.worker.ts`), off the clock
 * as `WorkerJobs` runs it: made as a song starts and warmed then, and ended
 * with the song; where no worker starts, or one fails, the job runs on this
 * thread.
 */
export class WorkerTexts implements SectionTexts {
  #jobs: WorkerJobs<Ask, Answer, SectionStated>;

  constructor(make: () => TextWorker) {
    this.#jobs = new WorkerJobs(make, (answer) => answer.stated);
  }

  begin(): void {
    this.#jobs.begin((id) => ({ id, warm: true }));
  }

  ask(bars: readonly BandBar[], answer: (stated: SectionStated) => void): void {
    this.#jobs.post(
      (id) => ({ id, bars }),
      () => stateSection(bars),
      answer,
    );
  }

  play(given: SectionText, answer: (stated: SectionStated) => void): void {
    this.#jobs.post(
      (id) => ({ id, given }),
      () => playText(given),
      answer,
    );
  }

  score(given: GivenScore, answer: (stated: SectionStated) => void): void {
    this.#jobs.post(
      (id) => ({ id, score: given }),
      () => playScore(given),
      answer,
    );
  }

  end(): void {
    this.#jobs.end();
  }
}

/** The browser's: a worker of its own, made as a song starts. */
export const browserTexts = (): SectionTexts =>
  new WorkerTexts(
    () => new Worker(new URL('./section-texts.worker.ts', import.meta.url), { type: 'module' }),
  );
