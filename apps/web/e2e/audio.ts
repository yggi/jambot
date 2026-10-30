/**
 * Listening to the app in the browser: the sound sources it starts, the
 * Workers it runs, what reaches the speakers, and each audio context's
 * pairing of its clock with the page's, sampled every few milliseconds.
 * And the ways a person opens and joins a session, which the session checks
 * and the session soak share.
 */

import { appendFileSync } from 'node:fs';
import { type Page, expect, test } from '@playwright/test';
import { type SessionComparison, compareSession, sessionBreaks } from '../src/played.ts';

export interface Start {
  /** What started: an oscillator's type, or noise. */
  kind: string;
  /** An oscillator's frequency as it starts: 440 for a kick, whose pitch only glides. */
  frequency: number | null;
  when: number;
  /** Which of the page's audio contexts started it, in the order they were made. */
  context: number;
}

/** A span, on the wall clock in milliseconds, in which a page's main thread did nothing. */
export interface Stall {
  from: number;
  to: number;
}

/**
 * A client's network pair as it read, from where its trip or offset changed, on the wall
 * clock in milliseconds: its best round trip lately (the offset is good to
 * half of it), the network's offset and the skew played by, in milliseconds.
 */
export interface NetworkSample {
  wall: number;
  trip: number | null;
  offset: number | null;
  skew: number | null;
}

/**
 * What the master level was asked to do, at `at` on the page clock, in
 * milliseconds: to be `value` at once (`set`), or to glide to it on a time
 * constant, in seconds (`target`). The master is the gain that feeds the
 * compressor before the speakers.
 */
export interface MasterCall {
  at: number;
  kind: 'set' | 'target';
  value: number;
  timeConstant: number;
}

/** A sample of an audio context's pairing (`getOutputTimestamp`), with the wall clock it was read on. */
interface PairingSample {
  context: number;
  contextTime: number;
  /** `performance.timeOrigin` plus the pairing's `performanceTime`, in milliseconds. */
  wall: number;
}

/**
 * Listens to the app: every sound source it starts, with its kind and time;
 * every Worker it runs; and a tap on everything that reaches the speakers.
 */
export async function listen(page: Page, path = '/') {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    const w = window as unknown as {
      starts: Start[];
      workers: { running: number; made: number };
      tap?: AnalyserNode;
      contexts: AudioContext[];
      pairings: PairingSample[];
      stalls: Stall[];
      master: MasterCall[];
      network: NetworkSample[];
    };
    w.starts = [];
    w.workers = { running: 0, made: 0 };
    w.contexts = [];
    w.pairings = [];
    w.stalls = [];
    w.master = [];
    w.network = [];
    // The master's own level: the gain that feeds the compressor. What it is
    // asked to do, at once or on a time constant, is a mute and a fade.
    const masters = new WeakSet<AudioParam>();
    const set = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (this: AudioParam, value: number, at: number) {
      if (masters.has(this))
        w.master.push({ at: performance.now(), kind: 'set', value, timeConstant: 0 });
      return set.call(this, value, at);
    };
    const setTarget = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (
      this: AudioParam,
      target: number,
      startTime: number,
      timeConstant: number,
    ) {
      if (masters.has(this))
        w.master.push({ at: performance.now(), kind: 'target', value: target, timeConstant });
      return setTarget.call(this, target, startTime, timeConstant);
    };
    const Context = AudioContext;
    window.AudioContext = class extends Context {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.contexts.push(this);
      }
    };
    // Every 5 ms, each context's pairing; and where the interval came late,
    // by more than 50 ms, the page stalled.
    let last = performance.timeOrigin + performance.now();
    setInterval(() => {
      const now = performance.timeOrigin + performance.now();
      if (now - last > 50) w.stalls.push({ from: last, to: now });
      last = now;
      const net = window.jambot?.network;
      if (net) {
        const sample = {
          wall: now,
          trip: net.reading?.trip == null ? null : net.reading.trip * 1000,
          offset: net.reading?.offset == null ? null : net.reading.offset * 1000,
          skew: net.skew === null ? null : net.skew * 1000,
        };
        const was = w.network.at(-1);
        if (!was || was.trip !== sample.trip || was.offset !== sample.offset)
          w.network.push(sample);
      }
      w.contexts.forEach((ctx, context) => {
        const ts = ctx.getOutputTimestamp?.();
        if (ts?.contextTime && ts.performanceTime)
          w.pairings.push({
            context,
            contextTime: ts.contextTime,
            wall: performance.timeOrigin + ts.performanceTime,
          });
      });
    }, 5);
    // Buffer sources (the noise voices) have their own start.
    for (const source of [OscillatorNode, AudioBufferSourceNode]) {
      const start = source.prototype.start as (...args: number[]) => void;
      source.prototype.start = function (
        this: AudioScheduledSourceNode,
        when = 0,
        ...rest: number[]
      ) {
        const osc = this instanceof OscillatorNode ? this : null;
        w.starts.push({
          kind: osc?.type ?? 'noise',
          frequency: osc?.frequency.value ?? null,
          when,
          context: w.contexts.indexOf(this.context as AudioContext),
        });
        return start.call(this, when, ...rest);
      };
    }
    const connect = AudioNode.prototype.connect as (...args: unknown[]) => unknown;
    AudioNode.prototype.connect = function (this: AudioNode, target: unknown, ...rest: unknown[]) {
      if (this instanceof GainNode && target instanceof DynamicsCompressorNode)
        masters.add(this.gain);
      if (target instanceof AudioDestinationNode) {
        w.tap ??= target.context.createAnalyser();
        connect.call(this, w.tap);
      }
      return connect.call(this, target, ...rest);
    } as typeof AudioNode.prototype.connect;
    const Base = Worker;
    window.Worker = class extends Base {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        w.workers.made++;
        w.workers.running++;
      }
      override terminate() {
        w.workers.running--;
        super.terminate();
      }
    };
  });
  await page.goto(path);
  logShadow(page);
  return errors;
}

/**
 * With `JAMBOT_SHADOW_LOG` naming a file, how the band played through cells
 * on the page (#399, `window.jambot.shadow`), read every half second
 * and appended there as the page closes, one line a test: a measurement over
 * the end-to-end runs, not a check, missing at most the page's last half second.
 */
function logShadow(page: Page) {
  const file = process.env.JAMBOT_SHADOW_LOG;
  if (!file) return;
  const title = test.info().title;
  let latest: object | undefined;
  const timer = setInterval(() => {
    page
      .evaluate(() => window.jambot?.shadow)
      .then(
        (readout) => void (latest = readout ?? latest),
        () => {},
      );
  }, 500);
  page.on('close', () => {
    clearInterval(timer);
    if (latest) appendFileSync(file, `${JSON.stringify({ title, ...latest, text: undefined })}\n`);
  });
}

/**
 * How the band played through cells on the page so far (#399, #469, `window.jambot.shadow`):
 * every event from cells, none a gap's falling back on the band's own, and nothing thrown.
 */
export async function playsThroughCells(page: Page) {
  const shadow = (await page.evaluate(() => window.jambot?.shadow))!;
  expect(shadow.errors).toEqual([]);
  expect(shadow.played.cells).toBeGreaterThan(0);
  expect(shadow.played.band).toBe(0);
  expect(shadow.gaps).toEqual({});
}

/** Through the lobby's door into the band, playing alone. */
export const solo = (page: Page) => page.getByRole('button', { name: 'Solo', exact: true }).click();

/** The band screen's header: Start or Stop, and the section and bar heard. */
export const transport = (page: Page) => page.getByRole('region', { name: 'Transport' });

export const starts = (page: Page) =>
  page.evaluate(() => (window as unknown as { starts: Start[] }).starts);

/**
 * Whether a source is the metronome's click, which tells its weights apart
 * by pitch: a square at 1800 Hz, a triangle at 1200, a sine at 800. No MIDI
 * note is any of them. The count-in clicks whether the click is on or not.
 */
export const isClick = (s: Start) =>
  (s.kind === 'square' && s.frequency === 1800) ||
  (s.kind === 'triangle' && s.frequency === 1200) ||
  (s.kind === 'sine' && s.frequency === 800);

/** The distinct times sources were started at, in seconds on the audio clock. */
export const onsets = async (page: Page) =>
  [...new Set((await starts(page)).map((s) => s.when))].sort((a, b) => a - b);

/** The loudest sample the speakers are getting now. */
export const level = (page: Page) =>
  page.evaluate(() => {
    const tap = (window as unknown as { tap: AnalyserNode }).tap;
    const data = new Float32Array(tap.fftSize);
    tap.getFloatTimeDomainData(data);
    return Math.max(...data.map(Math.abs));
  });

export const workers = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { workers: { running: number; made: number } }).workers,
  );

/** A sound source started, and when it was heard. */
export interface Heard extends Start {
  /**
   * When it was heard, on the wall clock (`performance.timeOrigin` plus
   * `performance.now()`), in milliseconds: its audio time through its
   * context's pairing as it sounded, so a jump of the clock between
   * scheduling and sounding is read. A single reading of the pairing can
   * blip by a few milliseconds on a busy machine and the next takes it
   * back, so it is read through the median of the five samples from the
   * first at or after it. Pages in one browser share the wall clock, so it
   * compares what two pages sound. Null where no samples were taken after.
   */
  heard: number | null;
}

/** Every sound source the page started, each with when it was heard. */
export async function heard(page: Page): Promise<Heard[]> {
  const [all, pairings] = await Promise.all([
    starts(page),
    page.evaluate(() => (window as unknown as { pairings: PairingSample[] }).pairings),
  ]);
  const byContext = new Map<number, PairingSample[]>();
  for (const p of pairings) byContext.set(p.context, [...(byContext.get(p.context) ?? []), p]);
  return all.map((start) => {
    const own = byContext.get(start.context) ?? [];
    const first = own.findIndex((p) => p.contextTime >= start.when);
    const samples = first < 0 ? [] : own.slice(first, first + 5);
    if (samples.length < 5) return { ...start, heard: null };
    const readings = samples
      .map((p) => p.wall + (start.when - p.contextTime) * 1000)
      .sort((a, b) => a - b);
    return { ...start, heard: readings[2]! };
  });
}

/** A jump of a page's audio clock: where, on the wall clock, and by how many milliseconds its pairing moved. */
export interface ClockJump {
  at: number;
  by: number;
}

/**
 * Where a page's audio clock jumped: where the median of five samples of
 * its pairing moved from the median of the five before by more than `by`
 * milliseconds, as an output's does when it drops a buffer, is held, or
 * settles after starting. A blip, which the next sample takes back, moves
 * no median.
 */
export async function clockJumps(page: Page, by = 1): Promise<ClockJump[]> {
  const pairings = await page.evaluate(
    () => (window as unknown as { pairings: PairingSample[] }).pairings,
  );
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  const jumps: ClockJump[] = [];
  for (const context of new Set(pairings.map((p) => p.context))) {
    const own = pairings.filter((p) => p.context === context);
    const gap = own.map((p) => p.wall - p.contextTime * 1000);
    for (let i = 5; i + 5 <= own.length; i++) {
      const moved = median(gap.slice(i, i + 5)) - median(gap.slice(i - 5, i));
      if (Math.abs(moved) > by) {
        jumps.push({ at: own[i]!.wall, by: moved });
        i += 4;
      }
    }
  }
  return jumps.sort((a, b) => a.at - b.at);
}

/**
 * Hold a page's audio for `ms` milliseconds, as a device whose output drops
 * buffers does: every audio context's clock stands still, and what is
 * scheduled on it sounds that much later from then on.
 */
export const holdAudio = (page: Page, ms: number) =>
  page.evaluate(async (ms) => {
    const { contexts } = window as unknown as { contexts: AudioContext[] };
    await Promise.all(contexts.map((ctx) => ctx.suspend()));
    await new Promise((resolve) => setTimeout(resolve, ms));
    await Promise.all(contexts.map((ctx) => ctx.resume()));
  }, ms);

/**
 * Where a page's main thread stalled, on the wall clock: where its 5 ms
 * sampler came more than 50 ms late. Its transport ticks there too, so what
 * the stall passed it dropped rather than played late (T1).
 */
export const stalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { stalls: Stall[] }).stalls);

/** A client's network pair, each time it read otherwise (`NetworkSample`). */
export const networkReadings = (page: Page) =>
  page.evaluate(() => (window as unknown as { network: NetworkSample[] }).network);

/** The drawer section that holds a card, the band's or the door's, by the card's title. */
const DRAWN: Record<string, string> = {
  Name: 'You',
  Settings: 'Settings',
  Jambot: 'About',
  Sound: 'Sound',
  Session: 'Session',
  Style: 'Style',
  Metrum: 'Time',
  Key: 'Key',
  Muse: 'Muse',
  Timing: 'Counters',
};
/** The band's view that holds a card, by the card's title. */
const SHOWN: Record<string, string> = { Band: 'Mix', Play: 'Melody' };

/** Shows one of the band's views, as a person taps its tab: the drawer goes up. */
export const showView = (page: Page, name: string) => page.getByRole('tab', { name }).click();

/**
 * Brings a card into view by its title: on the band's screen, its drawer
 * section pulled down or its view shown; elsewhere, unfolded where it is
 * folded.
 */
export async function openCard(page: Page, title: string) {
  const drawer = page.getByRole('navigation', { name: 'Drawer' });
  if (DRAWN[title] && (await drawer.count()) > 0) {
    const rider = drawer.getByRole('button', { name: DRAWN[title], exact: true });
    if ((await rider.getAttribute('aria-expanded')) !== 'true') await rider.click();
    return;
  }
  if (SHOWN[title] && (await drawer.count()) > 0) return showView(page, SHOWN[title]);
  const card = page.locator(`details[aria-label="${title}"]`);
  if (!(await card.evaluate((details) => (details as HTMLDetailsElement).open)))
    await card.locator('summary .title').click();
}

/** Puts the drawer back up, as a tap on the rider that pulled it does, so the view under it takes taps again. */
export async function closeDrawer(page: Page) {
  const drawn = page.getByRole('navigation', { name: 'Drawer' }).locator('[aria-expanded="true"]');
  if ((await drawn.count()) > 0) await drawn.click();
}

/**
 * Asks for a meter on the Metrum card, so the band plays it whatever the
 * style: with none asked for, the composer takes the repository's meter
 * nearest the style, which a moved slider can change (#375).
 */
export async function askForMeter(page: Page, name: string) {
  await openCard(page, 'Metrum');
  await page.getByRole('radio', { name, exact: true }).click();
  await closeDrawer(page);
}

/** Unfold the style card, where it is folded: its presets and sliders are in its details. */
export const openStyle = (page: Page) => openCard(page, 'Style');

/** What the page asked of the master level, in order. */
export const masterCalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { master: MasterCall[] }).master);

/**
 * Through the door's Settings: the lobby server's address, given when the
 * field is left, as a person does.
 */
export const useLobby = async (page: Page, lobby: string) => {
  await openCard(page, 'Settings');
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Lobby server').blur();
  await closeDrawer(page);
};

/** Through the door's You: the name a person goes by. */
export const useName = async (page: Page, name: string) => {
  await openCard(page, 'Name');
  await page.getByLabel('Your name').fill(name);
  await closeDrawer(page);
};

/** The session card, where the session is named and its players and the way out are. */
export const sessionCard = (page: Page) => page.locator('details[aria-label="Session"]');

/** Its state line, folded or not: "Hosting · 1 joined", "Following · host playing". */
export const state = (page: Page) => sessionCard(page).locator('summary .sub');

/** Brings the session card into view: its drawer section, pulled down. */
export const openSession = (page: Page) => openCard(page, 'Session');

/** A host has exactly one player joined, by this name. */
export const joined = async (page: Page, name: string) => {
  await expect(state(page)).toContainText('Hosting · 1 joined');
  await openSession(page);
  await expect(page.getByRole('list', { name: 'Players' })).toContainText(name);
};

/** Hosts a session at the lobby's door: locally, or, given a lobby server, globally. */
export const host = async (page: Page, session: string, lobby = '') => {
  if (lobby !== '') await useLobby(page, lobby);
  await page.getByRole('textbox', { name: 'Session name' }).fill(session);
  await page.getByRole('radio', { name: lobby === '' ? /Local/ : /Global/ }).click();
  await page.getByRole('button', { name: 'Host', exact: true }).click();
  await expect(state(page)).toContainText('Hosting');
};

/** The button that joins a session listed at the door. */
export const listed = (page: Page, session: string) =>
  page.locator('details[aria-label="Join a session"]').getByRole('button', { name: session });

/** Asks for a session listed at the lobby's door, with the code given (#461), and none where it is empty. */
export const ask = async (page: Page, session: string, code = '') => {
  const found = listed(page, session);
  await found.waitFor({ timeout: 8000 });
  await page.getByRole('textbox', { name: 'Code', exact: true }).fill(code);
  await found.click();
};

/** Joins a session listed at the lobby's door, as the name given, with the host's code where it asks for one. */
export const join = async (page: Page, session: string, name: string, lobby = '', code = '') => {
  if (lobby !== '') await useLobby(page, lobby);
  await useName(page, name);
  await ask(page, session, code);
  await expect(state(page)).toContainText('Following');
};

/** A host asks for a code to admit players by, on its Session card, and reads it there (#461). */
export const admitByCode = async (page: Page): Promise<string> => {
  await openSession(page);
  await page.getByRole('checkbox', { name: 'Admit players by a code' }).check();
  return (await page.getByLabel('Code', { exact: true }).textContent())!.trim();
};

/**
 * A host's events against a client's, as each page's outputs played them
 * (#446, `window.jambot.played`): every event of the bars both played whole
 * the same part, note, velocity and length, its onset and duration within
 * 1 ms, and every event one page lacks of the other's among those it dropped
 * late (#462, `sessionBreaks`). With each page's count of events dropped late.
 */
export async function sessionAgrees(
  host: Page,
  client: Page,
): Promise<SessionComparison & { readonly lateEvents: { host: number; client: number } }> {
  const [mine, theirs] = await Promise.all(
    [host, client].map((page) =>
      page.evaluate(() => ({
        ...window.jambot!.played(),
        lateEvents: window.jambot!.timing.lateEvents,
      })),
    ),
  );
  const compared = compareSession(mine!.events, theirs!.events, {
    host: mine!.late,
    client: theirs!.late,
  });
  expect(sessionBreaks(compared), compared.differing.join('\n')).toEqual([]);
  return { ...compared, lateEvents: { host: mine!.lateEvents, client: theirs!.lateEvents } };
}
