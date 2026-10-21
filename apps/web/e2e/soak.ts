/**
 * The radio soak (#399): the built app left on the radio at an entropy, in
 * Playwright's Chromium, for some minutes, and what the band through cells
 * found in shadow read off the dev readout (`window.jambot.shadow`) at the end.
 * Not one of the end-to-end checks (`*.e2e.ts`): a measurement, run by hand
 * against a served build, in the background, and printed as JSON.
 *
 *     pnpm --filter @jambot/web build && pnpm --filter @jambot/web preview --port 4320 &
 *     node --experimental-strip-types --no-warnings apps/web/e2e/soak.ts --minutes 30 --entropy 0.3
 *
 * `--url` names another address (`?play=cells` plays the band through cells),
 * and `--every` how often, in minutes, a line of progress is printed.
 *
 * `--session` soaks a session (#446): a host on the radio and one client,
 * joined before the song over the tabs' lobby, each page at the address. It
 * prints both shadows, and at the end sets every event the client's outputs
 * played against the host's (`compareSession`), read off each page a minute
 * at a time (`window.jambot.played`), as it keeps only the latest, with the
 * steps each page's transport laid and those its clock passed unlaid, and
 * the events each dropped late (`timing`). The session's bound (#462) is that
 * every event both played is the same and every event a page lacks is one it
 * dropped late (`sessionBreaks`): it exits with 1 where it breaks.
 *
 * `--profile` watches each page's ticks and main thread, and traces the
 * garbage collector, to say what overlapped each tick that dropped events
 * late (`late-ticks.ts`), and how loaded the machine was, a minute at a time.
 */

import { cpus, loadavg } from 'node:os';
import { type Page, chromium } from '@playwright/test';
import {
  type DroppedEvent,
  type PlayedEvent,
  compareSession,
  sessionBreaks,
} from '../src/played.ts';
import { host, join, joined, openCard, openStyle, solo, state } from './audio.ts';
import {
  GC_CATEGORIES,
  collections,
  lateTicks,
  markPage,
  placeOf,
  readWatch,
  watchTicks,
} from './late-ticks.ts';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
};
const minutes = Number(arg('minutes', '30'));
const entropy = Number(arg('entropy', '0.3'));
const every = Number(arg('every', '5'));
const url = arg('url', 'http://localhost:4320/');
const session = process.argv.includes('--session');
const profile = process.argv.includes('--profile');

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext();
if (profile) await context.addInitScript(watchTicks);
const errors: string[] = [];
const open = async () => {
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  return page;
};
const page = await open();
const client = session ? await open() : null;
if (profile) await browser.startTracing(undefined, { categories: GC_CATEGORIES });
const marks = profile
  ? {
      host: await markPage(page, 'soak-host'),
      client: client ? await markPage(client, 'soak-client') : null,
    }
  : null;
/** The machine's load, a minute at a time: other agents' runs share it. */
const load: number[] = [];
if (client) {
  await host(page, 'soak');
  await join(client, 'soak', 'Ada');
  await joined(page, 'Ada');
} else await solo(page);
await openStyle(page);
await page.getByRole('slider', { name: 'Entropy' }).fill(String(Math.round(entropy * 100)));
await openCard(page, 'Session');
await page.getByRole('checkbox', { name: 'Leave the band on the radio' }).check();
await page.getByRole('button', { name: 'Start the band' }).click();
if (client) await state(client).filter({ hasText: 'host playing' }).waitFor({ state: 'attached' });
const started = Date.now();
const readout = (p: Page) => p.evaluate(() => window.jambot!.shadow);

/** Each page's events, read a minute at a time from where the last read ended. */
const played = new Map<Page, { events: PlayedEvent[]; next: number; late: DroppedEvent[] }>();
const gather = async () => {
  load.push(loadavg()[0]!);
  for (const p of client ? [page, client] : []) {
    const kept = played.get(p) ?? { events: [], next: 0, late: [] };
    const read = await p.evaluate((from) => window.jambot!.played(from), kept.next);
    played.set(p, { events: [...kept.events, ...read.events], next: read.next, late: read.late });
  }
};
const steps = async (p: Page) => {
  const { laid, missed, lateEvents, ticks } = await p.evaluate(() => window.jambot!.timing);
  return { laid, missed, lateEvents, longestTick: ticks.most };
};
const summary = async (p: Page) => {
  const r = await readout(p);
  return {
    steps: await steps(p),
    from: r.from,
    bars: r.bars,
    mismatched: r.mismatched,
    gaps: r.gaps,
    texts: r.texts,
    played: r.played,
    wire: r.wire,
    buildCompile: r.cost.buildCompile,
    main: r.cost.main,
    arrival: r.arrival,
  };
};
for (let minute = 1; minute <= minutes; minute++) {
  await page.waitForTimeout(60_000);
  await gather();
  if (minute % every !== 0) continue;
  const line: Record<string, unknown> = { minutes: (Date.now() - started) / 60_000 };
  if (client) Object.assign(line, { host: await summary(page), client: await summary(client) });
  else Object.assign(line, await summary(page));
  console.log(JSON.stringify(line));
}
const end = async (p: Page) => ({ ...(await readout(p)), text: undefined, steps: await steps(p) });
/** What overlapped each page's ticks that dropped events late, with the collector's trace set beside. */
const profiled = async () => {
  if (!marks) return null;
  const trace = JSON.parse((await browser.stopTracing()).toString()) as {
    traceEvents: Parameters<typeof placeOf>[0];
  };
  const events = trace.traceEvents;
  const of = async (p: Page, name: string, at: number | null) => {
    const place = at === null ? null : placeOf(events, name, at);
    const watch = await readWatch(p);
    return { place, ...lateTicks(watch, place && collections(events, place)) };
  };
  return {
    host: await of(page, 'soak-host', marks.host),
    client: client ? await of(client, 'soak-client', marks.client) : null,
    machine: { cpus: cpus().length, load1: load },
  };
};
if (client) {
  const [mine, theirs] = [played.get(page)!, played.get(client)!];
  const compared = compareSession(mine.events, theirs.events, {
    host: mine.late,
    client: theirs.late,
  });
  const breaks = sessionBreaks(compared);
  const [hosted, followed] = [await end(page), await end(client)];
  console.log(
    JSON.stringify({
      host: hosted,
      client: followed,
      session: {
        ...compared,
        played: { host: mine.events.length, client: theirs.events.length },
        lateEvents: { host: hosted.steps.lateEvents, client: followed.steps.lateEvents },
        breaks,
      },
      profile: await profiled(),
      errors,
    }),
  );
  if (breaks.length > 0) process.exitCode = 1;
} else {
  const r = await end(page);
  console.log(
    JSON.stringify({ ...r, profile: await profiled(), errors: [...r.errors, ...errors] }),
  );
}
await browser.close();
