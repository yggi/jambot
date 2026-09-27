import { type Page, expect, test } from '@playwright/test';
import { type ClockJump, type Heard, clockJumps, heard, holdAudio, listen } from './audio.ts';

/**
 * Host and client mode across two pages of one browser, over the tabs'
 * BroadcastChannel lobby and over the lobby server: what the client
 * sounds, against what the host sounds, on the clock both pages share.
 */

/** The lobby server `playwright.config.ts` starts. */
const LOBBY = 'ws://localhost:4319';

const host = async (page: Page, session: string, lobby = '') => {
  await page.getByLabel('Lobby server').fill(lobby);
  await page.getByLabel('Session name').fill(session);
  await page.getByRole('button', { name: 'Host a session' }).click();
  await expect(page.getByText(/^Hosting/)).toBeVisible();
};

const join = async (page: Page, session: string, name: string, lobby = '') => {
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
/** How long after a jump the client's clock follows it: two pings of `PING_EVERY.steady`, one in flight, and a lookahead. */
const SETTLE = 900;
/**
 * The smallest jump, in milliseconds, the client's clock tells from drift
 * between pings a millisecond or two apart: `CLOCK.jumped` plus their
 * ranges. A smaller one it slews away, `CLOCK.slew` a ping of
 * `PING_EVERY.steady`: 2 ms a second. Both are T8's known breaks
 * (`faults.test.ts`), for #27's one estimator for every clock pair.
 */
const TOLD = 6;
const SLEWED = 2 / 1000;
/** How far apart, in milliseconds, the two pages may sound a note once settled. */
const IN_STEP = 2;
/** How long, in milliseconds, the test holds a page's audio: long enough to jump its clock by some 30 ms. */
const HOLD = 40;

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
  { lobby = '', hold }: { lobby?: string; hold: 'host' | 'client' },
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
  await holdAudio(held, HOLD);
  await client.waitForTimeout(6000);

  const hosted = await sounded(page);
  const followed = await sounded(client);
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
  // A note one page played and the other dropped, in a stall of a browser
  // running two bands, has none near it.
  const matched = gaps.filter((g) => Math.abs(g.gap) < 50);
  const steady = matched.filter((g) => allowed(g.at) === IN_STEP);
  const out = matched.filter((g) => Math.abs(g.gap) > allowed(g.at));
  const sorted = steady.map((g) => Math.abs(g.gap)).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const since = (t: number) => ((t - heldAt) / 1000).toFixed(2);
  console.log(
    `${lobby || 'tabs'}, the ${hold} held: ${matched.length} of ${followed.length} notes matched, ` +
      `${steady.length} settled: median ${median.toFixed(2)} ms, worst ${sorted.at(-1)!.toFixed(2)} ms; ` +
      `clocks jumped ${jumps.map((s) => `${s.by.toFixed(1)} ms at ${since(s.at)} s`).join(', ')} from the hold; ` +
      `out past what is allowed: ${out.map((g) => `${g.gap.toFixed(1)} at ${since(g.at)} s, past ${allowed(g.at).toFixed(1)}`).join('; ') || 'none'}`,
  );
  expect(matched.length).toBeGreaterThanOrEqual(followed.length * 0.95);
  expect(steady.length).toBeGreaterThan(40);
  expect(median).toBeLessThan(1);
  expect(out).toEqual([]);

  await client.getByRole('button', { name: 'Leave the session' }).click();
  await expect(page.getByText('Nobody has joined yet.')).toBeVisible();
  expect(hostErrors).toEqual([]);
  expect(clientErrors).toEqual([]);
}

test("a client joins a session and sounds with its host, note for note, through a hold of the client's audio", async ({
  page,
  context,
}) => {
  await inStep(page, await context.newPage(), 'e2e jam', { hold: 'client' });
});

test("a client in another browser context joins through the lobby server, in step through a hold of the host's audio", async ({
  page,
  browser,
}) => {
  // Contexts share no BroadcastChannel: only the server connects them.
  const elsewhere = await browser.newContext();
  await inStep(page, await elsewhere.newPage(), 'server jam', { lobby: LOBBY, hold: 'host' });
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
  await other.getByLabel('Session name').fill('Taken ');
  await other.getByRole('button', { name: 'Host a session' }).click();
  await expect(other.getByText('A session named “Taken” is already open.')).toBeVisible();
});
