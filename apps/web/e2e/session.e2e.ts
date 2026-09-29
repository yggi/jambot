import { type Page, expect, test } from '@playwright/test';
import {
  type ClockJump,
  type Heard,
  clockJumps,
  heard,
  holdAudio,
  listen,
  stalls,
} from './audio.ts';

/**
 * Host and client mode across two pages of one browser, over the tabs'
 * BroadcastChannel lobby and over the lobby server: what the client
 * sounds, against what the host sounds, on the clock both pages share.
 */

/** The lobby server `playwright.config.ts` starts. */
const LOBBY = 'ws://localhost:4319';

/** Opens the Connection drawer, where a session is hosted or joined, unless it is open. */
const connection = async (page: Page) => {
  const drawer = page.locator('details', { has: page.getByText('Connection', { exact: true }) });
  if ((await drawer.getAttribute('open')) === null)
    await drawer.getByText('Connection', { exact: true }).click();
};

const host = async (page: Page, session: string, lobby = '') => {
  await connection(page);
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Session name').fill(session);
  await page.getByRole('button', { name: 'Host a session' }).click();
  await expect(page.getByText(/^Hosting/)).toBeVisible();
};

const join = async (page: Page, session: string, name: string, lobby = '') => {
  await connection(page);
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Session name').fill(session);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByText(/^Playing in/)).toBeVisible();
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
/** How long, in milliseconds, a test stalls the host's main thread, so its transport drops what the stall passes (T1). */
const STALL = 300;

/** The span, on the wall clock, in which a jump of a page's clock can leave the two pages out. */
const unsettled = ({ at, by }: ClockJump) => {
  const size = Math.abs(by);
  const slewing = size >= TOLD ? 0 : Math.max(0, size - IN_STEP) / SLEWED;
  return { from: at - AHEAD, to: at + SETTLE + slewing, size };
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
  await page.getByRole('slider', { name: /Energy/ }).fill('100');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, session, 'Ada', lobby);
  await expect(page.getByText('1 joined: Ada.')).toBeVisible();
  await expect(client.getByText('The host is playing.')).toBeVisible();
  // A client's controls rest: the host leads.
  await expect(client.getByRole('button', { name: 'Start the band' })).toBeDisabled();

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
  const jumps = [...(await clockJumps(page)), ...(await clockJumps(client))];
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
  const spans = jumps.map(unsettled);
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
    return { at: f.heard, gap };
  });
  // A note the client sounded and the host didn't is one the host's
  // transport dropped, where its page stalled past it (T1): from the stall
  // on, until a tick came back and an output's latency more. Every other
  // note has the host's, within what is allowed as it sounds: `IN_STEP`,
  // and the size of every jump still settling there, however large (a
  // busy machine's output can drop more than 50 ms at once).
  const hostStalls = await stalls(page);
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
      `out past what is allowed: ${out.map((g) => `${g.gap.toFixed(1)} at ${since(g.at)} s, past ${allowed(g.at).toFixed(1)}`).join('; ') || 'none'}`,
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

  await client.getByRole('button', { name: 'Leave the session' }).click();
  await expect(page.getByText('Nobody has joined yet.')).toBeVisible();
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

test('the lobby server lists the sessions open, and refuses a join to none', async ({
  page,
  browser,
}) => {
  await listen(page);
  await host(page, 'Listed Jam', LOBBY);
  const elsewhere = await browser.newContext();
  const other = await elsewhere.newPage();
  await listen(other);
  await connection(other);
  await other.getByLabel('Lobby server').fill(LOBBY);
  await other.getByRole('button', { name: 'Find sessions' }).click();
  await other.getByRole('button', { name: 'Listed Jam' }).click();
  await expect(other.getByLabel('Session name')).toHaveValue('Listed Jam');
  await other.getByLabel('Session name').fill('Unlisted');
  await other.getByLabel('Your name').fill('Bob');
  await other.getByRole('button', { name: 'Join' }).click();
  await expect(other.getByText('No session named “Unlisted” is open.')).toBeVisible();
  // It stays said: the refused socket closing is no lost lobby.
  await other.waitForTimeout(500);
  await expect(other.getByText('No session named “Unlisted” is open.')).toBeVisible();
  await elsewhere.close();
});

test("a client's motif reaches the host's Muse, named by its player", async ({ page, context }) => {
  await listen(page);
  const client = await context.newPage();
  await listen(client);
  await host(page, 'motif jam');
  await page.getByRole('slider', { name: /Energy/ }).fill('0');
  await page.getByRole('button', { name: 'Start the band' }).click();
  await join(client, 'motif jam', 'Ada');
  await expect(client.getByText('The host is playing.')).toBeVisible();
  await expect(client.getByText('Bar 3 of 8')).toBeVisible({ timeout: 8000 });

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
  await expect(page.getByText(took)).toBeVisible({ timeout: 8000 });
  // The client shows the host's Muse too.
  await expect(client.getByText(took)).toBeVisible();
});

test('a second host cannot take a session name that is open', async ({ page, context }) => {
  await listen(page);
  const other = await context.newPage();
  await listen(other);
  await host(page, 'taken');
  await connection(other);
  await other.getByLabel('Session name').fill('Taken ');
  await other.getByRole('button', { name: 'Host a session' }).click();
  await expect(other.getByText('A session named “Taken” is already open.')).toBeVisible();
});
