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
 */

import { chromium } from '@playwright/test';
import { openCard, openStyle, solo } from './audio.ts';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
};
const minutes = Number(arg('minutes', '30'));
const entropy = Number(arg('entropy', '0.3'));
const every = Number(arg('every', '5'));
const url = arg('url', 'http://localhost:4320/');

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url);
await solo(page);
await openStyle(page);
await page.getByRole('slider', { name: 'Entropy' }).fill(String(Math.round(entropy * 100)));
await openCard(page, 'Session');
await page.getByRole('checkbox', { name: 'Leave the band on the radio' }).check();
await page.getByRole('button', { name: 'Start the band' }).click();
const started = Date.now();
const readout = () => page.evaluate(() => window.jambot!.shadow);
for (let lap = 1; lap * every <= minutes; lap++) {
  await page.waitForTimeout(every * 60_000);
  const r = await readout();
  console.log(
    JSON.stringify({
      minutes: (Date.now() - started) / 60_000,
      bars: r.bars,
      mismatched: r.mismatched,
      gaps: r.gaps,
      texts: r.texts,
      buildCompile: r.cost.buildCompile,
      main: r.cost.main,
      arrival: r.arrival,
    }),
  );
}
const end = await readout();
console.log(JSON.stringify({ ...end, text: undefined, errors: [...end.errors, ...errors] }));
await browser.close();
