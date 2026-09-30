import { type Page, expect, test } from '@playwright/test';
import {
  type ClockJump,
  type Heard,
  type Stall,
  clockJumps,
  heard,
  holdAudio,
  listen,
  masterCalls,
  openStyle,
  stalls,
  openCard,
} from './audio.ts';

/**
 * Host and client mode across two pages of one browser, over the tabs'
 * BroadcastChannel lobby and over the lobby server: what the client
 * sounds, against what the host sounds, on the clock both pages share.
 */

/** The lobby server `playwright.config.ts` starts. */
const LOBBY = 'ws://localhost:4319';

/**
 * Through the title card's settings: the lobby server's address, given when
 * the field is left, as a person does.
 */
const useLobby = async (page: Page, lobby: string) => {
  const fold = page.locator('details[aria-label="Jambot"]');
  if ((await fold.getAttribute('open')) === null) await fold.locator('summary').click();
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Lobby server').blur();
};

/** The session card, where the session is named and its players and the way out are. */
const sessionCard = (page: Page) => page.locator('details[aria-label="Session"]');

/** Its state line, folded or not: "Hosting · 1 joined", "Following · host playing". */
const state = (page: Page) => sessionCard(page).locator('summary .sub');

/** Unfolds the session card, unless it is. */
const openSession = async (page: Page) => {
  const card = sessionCard(page);
  if (!(await card.evaluate((details) => (details as HTMLDetailsElement).open)))
    await card.locator('summary .title').click();
};

/** A host has exactly one player joined, by this name. */
const joined = async (page: Page, name: string) => {
  await expect(state(page)).toContainText('Hosting · 1 joined');
  await openSession(page);
  await expect(page.getByRole('list', { name: 'Players' })).toContainText(name);
};

/** Hosts a session at the lobby's door: locally, or, given a lobby server, globally. */
const host = async (page: Page, session: string, lobby = '') => {
  if (lobby !== '') await useLobby(page, lobby);
  await page.getByRole('textbox', { name: 'Session name' }).fill(session);
  await page.getByRole('radio', { name: lobby === '' ? /Local/ : /Global/ }).click();
  await page.getByRole('button', { name: 'Host', exact: true }).click();
  await expect(state(page)).toContainText('Hosting');
};

/** The button that joins a session listed at the door. */
const listed = (page: Page, session: string) =>
  page.locator('details[aria-label="Join a session"]').getByRole('button', { name: session });

/** Joins a session listed at the lobby's door, as the name given. */
const join = async (page: Page, session: string, name: string, lobby = '') => {
  if (lobby !== '') await useLobby(page, lobby);
  await page.getByLabel('Your name').fill(name);
  await listed(page, session).click({ timeout: 8000 });
  await expect(state(page)).toContainText('Following');
};

/** Ends a session on purpose, past the question that asks whether to. */
const end = async (page: Page, button: string, sure: string) => {
  await openSession(page);
  await page.getByRole('button', { name: button }).click();
  await page.getByRole('button', { name: sure }).click();
};

/** What sounded: its kind and frequency, which tell the voices apart, and when it was heard. */
const sounded = async (page: Page) =>
  (await heard(page)).filter((h): h is Heard & { heard: number } => h.heard !== null);

/** How long, in milliseconds, before a jump of a page's clock what is heard can already be out: a lookahead and an output's latency. */
const AHEAD = 150;
/**
 * How long after a jump the client's clock follows it: a jump on the host
 * is followed by the host's output pair within three ticks, told with the
 * next answer (`PING_EVERY.steady`), and played by from the client's next
 * tick, after the lookahead scheduled at the old skew. One on the client
 * is followed sooner, within its own three ticks.
 */
const SETTLE = 500;
/**
 * The smallest jump, in milliseconds, an output pair tells from drift: two
 * bounds of its readings (`OUTPUT.paired`) and `OUTPUT.jumped`. A smaller
 * one it slews away, `OUTPUT.slew` a tick of 25 ms: 10 ms a second (T8).
 */
const TOLD = 2;
const SLEWED = 10 / 1000;
/**
 * How far apart, in milliseconds, the two pages may sound a note once
 * settled: T8's bound in one browser, half a round trip of about a
 * millisecond, and each output pair's bound and slew (`OUTPUT.paired`,
 * `OUTPUT.slew`), 0.75 ms each.
 */
const IN_STEP = 2.5;
/**
 * How long, in milliseconds, a test holds a page's audio: 40 ms jumps its
 * clock by some 30, and 80 by some 70, past the 50 ms within which a
 * note is taken for the host's. Held on the host, the client plays by
 * the old skew until the next answer, so a wide hold there puts notes
 * that far out every time.
 */
const HOLDS = { some: 40, wide: 80 } as const;
/**
 * How long, in milliseconds, a test stalls the host's main thread, so its
 * transport drops what the stall passes (T1). The transport schedules
 * `LOOKAHEAD` (120 ms) ahead, so only the steps of a stall's last part are
 * dropped: at 300 ms that is about one step of 139 ms, which held a note in
 * only some runs, and 800 ms drops four or five steps in every run.
 */
const STALL = 800;

/**
 * The span, on the wall clock, in which a jump of a page's clock can leave
 * the two pages out. A jump of the host's clock that a stall of its main
 * thread begins before the host has told (within `SETTLE` of it) is told to
 * the client only when the host runs again, so it settles from the stall's
 * end, not from where the output pair placed it (`stalled`: the host's
 * stalls; none for the client's jumps).
 */
const unsettled = ({ at, by }: ClockJump, stalled: readonly Stall[] = []) => {
  const size = Math.abs(by);
  const slewing = size >= TOLD ? 0 : Math.max(0, size - IN_STEP) / SLEWED;
  const told = stalled.find((s) => s.from <= at + SETTLE && s.to >= at)?.to ?? at;
  return { from: at - AHEAD, to: told + SETTLE + slewing, size };
};

/**
 * The host starts the band at full energy, the client joins, and six
 * seconds on, one page's audio is held, as a device whose output drops
 * buffers is. After twelve seconds each note the client sounded is set
 * against the host's nearest of the same voice, on the clock both pages
 * share. Every note must be within `IN_STEP` of the host's but where a
 * jump of either page's clock is still settling: the hold, and any jump a
 * busy machine makes on its own, which the pairings show. There, a note
 * may be out by no more than the jumps settling and `IN_STEP`. So the
 * check asks the same of every machine, whether its audio drops buffers or
 * not, and a clock that slews a jump it should follow fails it on every
 * machine (T8).
 */
async function inStep(
  page: Page,
  client: Page,
  session: string,
  {
    lobby = '',
    hold,
    holdFor,
    stallHost = false,
  }: { lobby?: string; hold: 'host' | 'client'; holdFor: number; stallHost?: boolean },
) {
  const hostErrors = await listen(page);
  const clientErrors = await listen(client);

  await host(page, session, lobby);
  await openStyle(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, session, 'Ada', lobby);
  await joined(page, 'Ada');
  await expect(state(client)).toContainText('host playing');
  // A client's controls rest: the host leads.
  // (Its label is Stop once the band sounds, so it is found by its title.)
  await expect(client.getByTitle('The host starts and stops the band')).toBeDisabled();

  await client.waitForTimeout(6000);
  const held = hold === 'host' ? page : client;
  const heldAt = await held.evaluate(() => performance.timeOrigin + performance.now());
  await holdAudio(held, holdFor);
  await client.waitForTimeout(3000);
  // The host's page does nothing for a moment, as a busy machine's can.
  if (stallHost)
    await page.evaluate((ms) => {
      const end = performance.now() + ms;
      while (performance.now() < end);
    }, STALL);
  await client.waitForTimeout(3000);

  // Each page's notes are read one after the other, and a note is heard
  // only once five pairings after it are sampled, so the last notes of the
  // later read have none yet at the earlier: compare up to where both have.
  const hostedAll = await sounded(page);
  const followedAll = await sounded(client);
  const horizon =
    Math.min(...[hostedAll, followedAll].map((notes) => Math.max(...notes.map((n) => n.heard)))) -
    100;
  const hosted = hostedAll.filter((n) => n.heard <= horizon + 50);
  const followed = followedAll.filter((n) => n.heard <= horizon);
  const hostStalls = await stalls(page);
  const hostJumps = await clockJumps(page);
  const clientJumps = await clockJumps(client);
  const jumps = [...hostJumps, ...clientJumps];
  // The hold jumped the held page's clock by more than the client's clock
  // can slew. A median moves a sample or two before the jump, and a
  // pairing is read a little after the moment it pairs, so the jump can be
  // found some milliseconds before the hold began.
  const holdJumps = (await clockJumps(held)).filter(
    (s) => s.at >= heldAt - 100 && s.at < heldAt + 500,
  );
  expect(
    holdJumps.some((s) => Math.abs(s.by) >= TOLD),
    `jumps of the held clock: ${(await clockJumps(held)).map((s) => `${s.by.toFixed(1)} ms at ${((s.at - heldAt) / 1000).toFixed(3)} s`).join(', ')}`,
  ).toBe(true);
  const spans = [
    ...hostJumps.map((j) => unsettled(j, hostStalls)),
    ...clientJumps.map((j) => unsettled(j)),
  ];
  /** How far, in milliseconds, a note at `t` may be out: `IN_STEP`, and every jump still settling there. */
  const allowed = (t: number) =>
    IN_STEP + spans.filter((s) => t >= s.from && t <= s.to).reduce((sum, s) => sum + s.size, 0);

  // Each note the client sounded, against the host's nearest of the same voice.
  const voice = (h: Heard) => `${h.kind} ${h.frequency}`;
  const gaps = followed.map((f) => {
    const gap = hosted
      .filter((h) => voice(h) === voice(f))
      .reduce(
        (best, h) => (Math.abs(f.heard - h.heard) < Math.abs(best) ? f.heard - h.heard : best),
        Infinity,
      );
    return { at: f.heard, gap, voice: voice(f) };
  });
  // A note the client sounded and the host didn't is one the host's
  // transport dropped, where its page stalled past it (T1): from the stall
  // on, until a tick came back and an output's latency more. Every other
  // note has the host's, within what is allowed as it sounds: `IN_STEP`,
  // and the size of every jump still settling there, however large (a
  // busy machine's output can drop more than 50 ms at once).
  const dropped = (t: number) => hostStalls.some((s) => t >= s.from && t <= s.to + 100);
  const judged = gaps.filter((g) => !(Math.abs(g.gap) >= 50 && dropped(g.at)));
  const out = judged.filter((g) => !(Math.abs(g.gap) <= allowed(g.at)));
  const wide = judged.filter((g) => Math.abs(g.gap) >= 50);
  const steady = judged.filter((g) => allowed(g.at) === IN_STEP);
  const sorted = steady.map((g) => Math.abs(g.gap)).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const since = (t: number) => ((t - heldAt) / 1000).toFixed(2);
  console.log(
    `${lobby || 'tabs'}, the ${hold} held: ${followed.length} notes, ` +
      `${gaps.length - judged.length} dropped in the host's ${hostStalls.length} stalls, ` +
      `${wide.length} out by 50 ms or more in a jump; ` +
      `${steady.length} settled: median ${median.toFixed(2)} ms, worst ${sorted.at(-1)!.toFixed(2)} ms; ` +
      `clocks jumped ${jumps.map((s) => `${s.by.toFixed(1)} ms at ${since(s.at)} s`).join(', ')} from the hold; ` +
      `out past what is allowed: ${out.map((g) => `${g.voice} ${g.gap.toFixed(1)} at ${since(g.at)} s, past ${allowed(g.at).toFixed(1)}`).join('; ') || 'none'}`,
  );
  // Each fault met its path: the stall dropped host notes the client
  // played, and the wide hold put notes 50 ms or more out.
  if (stallHost) expect(gaps.length - judged.length).toBeGreaterThan(0);
  if (holdFor === HOLDS.wide) expect(wide.length).toBeGreaterThan(0);
  expect(steady.length).toBeGreaterThan(40);
  expect(median).toBeLessThan(1);
  expect(
    out.map((g) => `${since(g.at)} s: ${g.gap.toFixed(1)} ms, past ${allowed(g.at).toFixed(1)}`),
  ).toEqual([]);

  await end(client, 'Leave session', 'Yes, leave');
  await expect(client.getByRole('button', { name: 'Solo', exact: true })).toBeVisible();
  await expect(state(page)).toContainText('nobody has joined');
  expect(hostErrors).toEqual([]);
  expect(clientErrors).toEqual([]);
}

test("a client joins a session and sounds with its host, note for note, through a hold of the host's audio past 50 ms", async ({
  page,
  context,
}) => {
  await inStep(page, await context.newPage(), 'e2e jam', { hold: 'host', holdFor: HOLDS.wide });
});

test("a client in another browser context joins through the lobby server, in step through a hold of the client's audio and a stall of the host's page", async ({
  page,
  browser,
}) => {
  // Contexts share no BroadcastChannel: only the server connects them.
  const elsewhere = await browser.newContext();
  await inStep(page, await elsewhere.newPage(), 'server jam', {
    lobby: LOBBY,
    hold: 'client',
    holdFor: HOLDS.some,
    stallHost: true,
  });
  await elsewhere.close();
});

test('the door lists the sessions open with their players, local and global apart, and drops a client back to it when its host closes', async ({
  page,
  browser,
}) => {
  await listen(page);
  await host(page, 'Listed Jam', LOBBY);
  const elsewhere = await browser.newContext();
  const other = await elsewhere.newPage();
  await listen(other);
  await useLobby(other, LOBBY);
  const found = listed(other, 'Listed Jam');
  await expect(found).toHaveAttribute('title', /lobby server/i);
  await expect(found).toHaveText(/1$/);
  await other.getByLabel('Your name').fill('Bob');
  await found.click();
  await expect(state(other)).toContainText('Following');
  await joined(page, 'Bob');

  // A session between the tabs of a browser is listed as local, and the global one is not listed
  // where no lobby server was given. Its own context: what a page keeps to come back is shared.
  const tabs = await browser.newContext();
  const tab = await tabs.newPage();
  const third = await tabs.newPage();
  await listen(tab);
  await listen(third);
  await host(tab, 'Tab Jam');
  await expect(listed(third, 'Tab Jam')).toHaveAttribute('title', /in this browser/i, {
    timeout: 8000,
  });
  await expect(listed(third, 'Listed Jam')).toHaveCount(0);
  await tabs.close();

  // The host closes: its client is back at the door, and told why.
  await end(page, 'Close session', 'Yes, close it');
  await expect(other.getByRole('button', { name: 'Solo', exact: true })).toBeVisible();
  await expect(other.getByRole('status')).toHaveText('The host closed the session.');
  await elsewhere.close();
});

/**
 * The loudest sample at the speakers, every 10 ms for `ms` milliseconds,
 * with the time it was read, and the page clock's time the record began at.
 */
const record = (page: Page, ms: number) =>
  page.evaluate(
    (ms) =>
      new Promise<{ began: number; samples: { t: number; level: number }[] }>((resolve) => {
        const tap = (window as unknown as { tap: AnalyserNode }).tap;
        const data = new Float32Array(tap.fftSize);
        const out: { t: number; level: number }[] = [];
        const began = performance.now();
        const id = setInterval(() => {
          tap.getFloatTimeDomainData(data);
          const t = performance.now() - began;
          out.push({ t, level: Math.max(...data.map(Math.abs)) });
          if (t > ms) {
            clearInterval(id);
            resolve({ began, samples: out });
          }
        }, 10);
      }),
    ms,
  );

test('a session joined comes in on a fade, not at full volume, and leaving fades it out', async ({
  page,
  context,
}) => {
  await listen(page);
  const client = await context.newPage();
  await listen(client);
  await host(page, 'fade jam');
  await openStyle(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await client.getByLabel('Your name').fill('Ada');
  await listed(client, 'fade jam').click({ timeout: 8000 });
  const { began, samples: trace } = await record(client, 9000);

  // The master is set to silence at the join and, once the band plays,
  // rises on a time constant: nothing is heard before the rise begins, and
  // the band is audible once it is up. What the page asks of the master is
  // read, not the first 150 ms of sound after the rise: the first note comes
  // 350 to 500 ms after it, at whatever part of the rise a note happens to
  // land.
  const master = await masterCalls(client);
  const muted = master.find((c) => c.kind === 'set' && c.value === 0);
  const rise = master.find((c) => c.kind === 'target' && c.value > 0 && c.timeConstant >= 0.3);
  expect(muted, 'the master is set to silence at the join').toBeDefined();
  expect(rise, 'the master then rises on a time constant').toBeDefined();
  expect(muted!.at).toBeLessThan(rise!.at);
  const levels = (from: number, to: number) =>
    trace.filter((s) => s.t >= from && s.t < to).map((s) => s.level);
  expect(Math.max(...levels(0, rise!.at - began))).toBeLessThan(0.001);
  expect(Math.max(...levels(rise!.at - began + 3000, rise!.at - began + 6000))).toBeGreaterThan(
    0.1,
  );

  // Leaving fades the band out: it plays on while it does, and the door comes once it is quiet.
  const leaving = record(client, 1500);
  const clicked = Date.now();
  await end(client, 'Leave session', 'Yes, leave');
  await expect(client.getByRole('button', { name: 'Solo', exact: true })).toBeVisible();
  expect(Date.now() - clicked).toBeGreaterThanOrEqual(400);
  const { samples: after } = await leaving;
  expect(Math.max(...after.filter((s) => s.t > 1000).map((s) => s.level))).toBeLessThan(0.0005);
});

test('one tap does not end a session: closing or leaving asks first', async ({ page, context }) => {
  await listen(page);
  const client = await context.newPage();
  await listen(client);
  await host(page, 'careful jam');
  await join(client, 'careful jam', 'Ada');
  await joined(page, 'Ada');

  await openSession(page);
  await page.getByRole('button', { name: 'Close session' }).click();
  await expect(page.getByRole('alertdialog')).toHaveText(
    /Close careful jam for everyone\? 1 other is playing in it\./,
  );
  await page.getByRole('button', { name: 'Keep playing' }).click();
  await expect(state(page)).toContainText('Hosting');

  await openSession(client);
  await client.getByRole('button', { name: 'Leave session' }).click();
  await client.getByRole('button', { name: 'Stay' }).click();
  await expect(state(client)).toContainText('Following');
  await joined(page, 'Ada');
});

test("a client's motif reaches the host's Muse, and both lead lines, named by its player", async ({
  page,
  context,
}) => {
  await listen(page);
  const client = await context.newPage();
  await listen(client);
  await host(page, 'motif jam');
  await openStyle(page);
  await page.getByRole('slider', { name: /Energy/ }).fill('0');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, 'motif jam', 'Ada');
  await expect(state(client)).toContainText('host playing');
  await expect(client.getByText('Intro 3/8')).toBeVisible({ timeout: 8000 });

  // Synth-pop at 108 bpm: three notes four steps apart, in one bar.
  const step = 15 / 108;
  await client.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (const key of ['a', 'd', 'g']) {
    await client.keyboard.down(key);
    await client.waitForTimeout(60);
    await client.keyboard.up(key);
    await client.waitForTimeout(step * 4 * 1000 - 60);
  }
  const took = /: Took a 3-note motif from Ada's computer keys\./;
  await openCard(page, 'Muse');
  await openCard(client, 'Muse');
  await expect(page.getByText(took)).toBeVisible({ timeout: 8000 });
  // The client shows the host's Muse too.
  await expect(client.getByText(took)).toBeVisible();
  // And both show the lead playing it, named by its player: the bars carry it, not a message of its own (#164).
  const playing = /Lead is playing the motif from Ada's computer keys, heard in bar \d+\./;
  for (const screen of [page, client])
    await expect(screen.locator('details[aria-label="Band"] summary .sub')).toContainText(playing, {
      timeout: 8000,
    });
});

test('a second host cannot take a session name that is open', async ({ page, context }) => {
  await listen(page);
  const other = await context.newPage();
  await listen(other);
  await host(page, 'taken');
  await other.getByRole('textbox', { name: 'Session name' }).fill('Taken ');
  await other.getByRole('button', { name: 'Host', exact: true }).click();
  await expect(other.getByText('A session named “Taken” is already open.')).toBeVisible();
});

test('a host page that reloads keeps its session and its client, and a client page that reloads joins again as itself', async ({
  page,
  browser,
}) => {
  const elsewhere = await browser.newContext();
  const client = await elsewhere.newPage();
  await listen(page);
  await listen(client);
  await host(page, 'reload jam', LOBBY);
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, 'reload jam', 'Ada', LOBBY);
  await expect(state(client)).toContainText('host playing');
  await joined(page, 'Ada');

  // The host's page goes and comes back: the lobby holds the session, the page
  // reopens it from what it kept, and the client, never disconnected, joins again.
  await page.reload();
  await expect(state(page)).toContainText('Hosting');
  await joined(page, 'Ada');
  await expect(state(client)).toContainText('Following');
  await expect(state(client)).toContainText('host stopped');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await expect(state(client)).toContainText('host playing');

  // The client's page goes and comes back: it joins as the player it was, and
  // the host still lists one Ada, not two.
  await client.reload();
  await expect(state(client)).toContainText('Following');
  await expect(state(client)).toContainText('host playing');
  await joined(page, 'Ada');

  // Leaving on purpose leaves nothing to come back to: the client's reload lands on the door.
  await end(client, 'Leave session', 'Yes, leave');
  await client.reload();
  await expect(client.getByRole('button', { name: 'Solo', exact: true })).toBeVisible();
  await expect(sessionCard(client)).toHaveCount(0);

  // Nor does closing.
  await end(page, 'Close session', 'Yes, close it');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Solo', exact: true })).toBeVisible();
  await expect(sessionCard(page)).toHaveCount(0);
  await elsewhere.close();
});
