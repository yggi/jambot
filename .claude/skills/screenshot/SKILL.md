---
name: screenshot
description: Show measured options side by side as screenshots, rendered in Playwright's Chromium from an experiment's numbers, and, where the difference is heard, as audio through the app's own synth. Use when a decision goes to the owner with measurements (ratchet B3) and a picture would compare the options faster than a table: piano rolls of bars that differ, a chart of a measure over bars, a tuning drawn as a circle, a before-and-after of what plays.
---

# Screenshot measured options

The numbers come from an experiment on `main` or in the pull request. The
pictures are drawn from those numbers, rendered in Chromium, looked at, and
sent. The tool is `tooling/screenshot.ts`; its checks are
`tooling/screenshot.test.ts` (in `pnpm verify`) and
`apps/web/e2e/screenshot.e2e.ts` (in `pnpm e2e`, which has the browser).

Two sister projects draw for decisions too: Cell studio's [`gallery`](https://github.com/yggi/cell-studio/blob/main/.claude/skills/gallery/SKILL.md), contact sheets of everything its graph draws in each state, and cells' picture skill, a text's events as a piano roll before and after a language change.
Borrow the form that fits: a contact sheet when every case of a drawing must be seen at once, a roll when the question is what plays.

## 1. The numbers: an experiment writes them

An experiment under `packages/*/experiments/` prints its tables and, given a
path, writes what a picture needs as JSON: E10, E11 and E12 take `[out.json]`.
The experiment is committed and cited in the catalogue; the page that draws it
is not.

```sh
S=<your scratchpad>
node --experimental-strip-types --no-warnings packages/engine/experiments/pad-stab.ts $S/e11.json
```

## 2. The page: one per question, built in the scratchpad

A small script in the scratchpad reads the JSON and writes one HTML page per
question, with `page(title, body)` from the tool, which frames the body with the
shared layout and the palette:

```js
import { page, inlineModule, shoot } from '/home/user/jambot/tooling/screenshot.ts';
```

Run such a script with `node --experimental-strip-types --no-warnings`.

- **Inline SVG, no libraries.** A roll is rects on a step grid, a chart a
  polyline, a tuning a circle of steps. Draw from the JSON, not by hand.
- **Colour by role, from `PAGE_CSS`.** `--s1`–`--s3` for the options or voices
  compared (they hold apart for colour-blind readers), `--bad` for what an
  option loses and `--good` for what holds, each only beside a word or a sign
  (✗, −, +). Hatch what is lost. The dataviz skill has the method.
- **A page answers one question.** Its title is the question, its subtitle the
  experiment, its corpus and its file. The options sit in the same order in
  every table and panel. The table of costs carries the numbers; the pictures
  show an example.
- **Pick the example by a measure**, such as the bar with the most overlaps, and
  say which bar it is.

### A change to the page itself

For a change to what the page shows, the picture is the built app, driven:
`pnpm build`, then `pnpm preview --port 4317` in `apps/web`, and a Playwright
script that plays what the change is about (a motif typed on the computer keys,
a preset, a mute) and shoots the card with `locator.screenshot`. Shoot at 390 CSS
pixels wide and `deviceScaleFactor: 2`, once with `colorScheme: 'light'` and once
`'dark'`. The script imports `@playwright/test`, which resolves from `apps/web`
only, so it runs from there while it runs and moves back to the scratchpad
after; stop the preview by its port (`ss -ltnp | grep 4317`), or `pnpm e2e`
won't start. The tracks card of #206 was shot so.

### Audio through the app's synth

Where the difference is heard, render it. `inlineModule` returns a repository
module as JavaScript for a `<script type="module">`, if its imports are types
only: `apps/web/src/audio/voices.ts` is one. In the page, play the notes into an
`OfflineAudioContext`, draw what you measure from the buffer (an RMS envelope in
20 ms windows), and hand the audio back as WAV:

```js
page('Pad and stab (g)', body, { wait: true }); // the body is data-wait
// in the page's module script, when the rendering is done:
window.__files = { 'one-channel.wav': base64Wav };
window.__done = true;
```

## 3. The screenshots

```sh
node --experimental-strip-types --no-warnings tooling/screenshot.ts $S/f.html $S/g.html $S/h.html
```

Each page becomes `<name>.png` beside it, at twice its CSS pixels, and whatever
it handed back is written beside it too. Any error on a page, or a page that
never sets `window.__done`, fails the run.

## 4. Look before sending

Read every PNG. A validator can't see these:

- **Labels that collide**: the ends of lines that finish close together, an axis
  title over a tick.
- **Panels that overflow**: a table beside a drawing in a half-width panel; give
  its cells `class="nw"` and shrink the drawing.
- **Claims the numbers don't make.** Every sentence on the page is checked
  against the JSON. "Only the tempo runs long" read true at the example bar and
  false across the run.
- **Marks that invert their meaning**: shading by percentage makes 80% darker
  than 100%. Mark pass and fail with words and signs instead.
- **A range that hides the difference**: rolls over the band's whole range
  squeezed #209's scales into a band where they looked the same. Zoom onto the
  part compared, and draw a reference line (every C) to read pitches against.

## 5. Send, and where things go

Send the PNGs with `SendUserFile` (`display: render`), and audio as attachments.
The pages, pictures and audio stay in the scratchpad: they are views of numbers
the repository already holds. The issue gets the numbers as tables in the
comment, since a comment can't carry a local image.

## Pitfalls

- `Math.max(...array)` over a buffer throws `RangeError` in Chromium past about
  100,000 items. Loop instead.
- `page.evaluate` in the tool takes expression strings, so `tooling`'s type
  check never needs the DOM.
- Playwright is resolved from `apps/web`, whose checks pin it; a fresh checkout
  needs `cd apps/web && pnpm exec playwright install chromium` once, which
  Claude Code sessions do at start.
