# Memory

Persistent facts and a cheatsheet. Start here, and follow the links for
depth. Add a fact when it stays true and would save the next person time.

## Cheatsheet

```sh
pnpm install
pnpm dev          # web app with hot reload; the prototype is at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm verify       # lint, format check, typecheck, tests, build: run before pushing
pnpm e2e          # the app in Chromium: when what it plays, or when, changes
pnpm lobby        # the lobby server for sessions across machines, on 8787
pnpm lobby:deploy # the lobby server to Fly.io (needs flyctl and the account)
pnpm ratchet      # the catalogues over main's history: evidence, rules, aliases
pnpm pages deploy # publish main to GitHub Pages, and check the live site
```

- Agent sessions (Claude Code) install dependencies and Playwright's
  Chromium, warm music21 and fetch `origin/main` at start through
  `.claude/hooks/session-start.sh`, and `.claude/settings.json` allows the
  checks and the music-theory scripts without a prompt. Other agents run
  `pnpm install --frozen-lockfile` first.
- An agent's `git push` runs `pnpm verify` first (`verify-before-push.sh`,
  about 30 s) and is blocked if it fails. It checks the working tree, so
  commit before pushing.
- To review a pull request, use the `review-pr` skill:
  `.claude/skills/review-pr/prepare.sh <number>` fetches it and `main`,
  checks it out in its own worktree and runs `pnpm verify` there. It says
  when `main` has moved on and where a merge would conflict, and
  `--from <commit>` scopes it to part of a pull request. A branch behind
  `main` may not have the script yet: pipe `main`'s copy from
  `git show origin/main:.claude/skills/review-pr/prepare.sh` to `sh -s --`.
  `git fetch origin pull/<n>/head` works through the session proxy.
- To try the theory without a test, run its TypeScript source from the
  repository root, where `tonal` resolves too:
  `node --experimental-strip-types --no-warnings --input-type=module -e "import { read } from './packages/theory/src/index.ts'; console.log(read('C blues'))"`.

- The full prototype is one file: `prototype/jambot-prototype.html`. Open it
  in Chrome or Edge and press _Start the band_. Its code map is in
  [`prototype/README.md`](../prototype/README.md#running-and-hacking).
- To resolve a musical name, use `read` from `@jambot/theory`:
  `read('C blues')`, `read('G7', { kind: 'chord' })`, `read('clave')`,
  `read('second')`, `read('harm minor 5')`. `readings(name)` lists every
  reading of an ambiguous name, and `nameOf(reading)` writes one back. The sister projects' names are all in
  `sister-names.test.ts`; a new one goes there first.
- The theory's core relations, and the test that holds each, are in
  [`theory.md`](theory.md). A new relation gets its test and its line there.
- An engine level is a `Machine` (`packages/engine/src/machine.ts`). A new
  one gets a test that `lawBreaks(machine, script)` is empty, and the
  events it writes a test that `eventProblems` finds none.
- A random choice in the engine goes through `chance(draw, p)` or
  `pick(draw, weights)`, never a bare `draw < p`: they quantise to 2^-16,
  so a last-bit difference from `Math.pow` or `Math.sin` on another engine
  does not change the music. A value from them that is rounded is quantised
  first, `Math.round(quantize(x))`: sin(π/6) times an odd number lies one
  ulp from a half (`lead.ts`).
- The style (`packages/engine/src/style.ts`) is a track of glides, one per
  axis, and `styleAt(track, position)` reads it at any step of the song.
  Positions there are steps from the song's start, 16 to a bar. A track
  holds only the latest glide per axis, and before that glide's start it
  reads the glide's `from`. So to see what was played at a step, read the
  track as it stood when that step was scheduled, not the final track.
- The engine's levels are machines at their own rates: the section plan
  (form, key and theme) per section, the band per bar, the transport per
  tick. The players' key wish is a standing target, not an event: `nextKey`
  applied twice gives what it gave once, so the band can read it at every
  section boundary. The web player only reads the audio clock and plays
  what the transport schedules, so everything that decides what and when
  is tested without a browser.
- The band decides each bar when it composes the bar before: the section's
  plan at a section's first bar, and the bar's chords. So a part can lead
  into the next bar's chords (`BarEnv.next`), and they are what plays. A
  bar the clock has passed is passed (`passBar`), not composed.
- `lookAhead(carried, envAt, count)` forecasts the bars ahead, their plans
  and chords, by running the band's own decisions forward. From the
  transport, `forecast(env, carried, count)` gives the bars from the head's
  bar on, those composed first, each with the energy it plays at; with
  `carried` null it is the song from bar 0. The track holds glides ahead,
  so the forecast is what plays unless a control moves.
- The screen reads one snapshot, `player.hud` (`hudOf`, in
  `apps/web/src/hud.ts`), rebuilt when the step heard, the bars ahead or
  the track change. Components take slices of it as props and send
  intents; none reads the engine. A style is named by the preset it
  matches on every axis the preset sets but energy (`presetOf`), so there
  is no chosen-preset state: nudging the tempo makes a style custom, and
  moving energy or entropy doesn't. The key picker shows the key the band is
  heading for, the last bar decided's (`hud.heading`). A key picked is
  wished for tonic and mode; a preset wishes for its mode only when the
  wish is in another, so a key picked survives a preset in its mode.
- `Keyboard.svelte` and `DrumPads.svelte` mark the current key's scale as a
  dot (`hud.bar.scale`, from `hud.ts`) and flash amber for the band's own
  lead and drum notes (`player.sounding`, `apps/web/src/sounding.ts`), never
  what a person plays along with it. Any note played, from a pointer, a
  computer key or MIDI, goes through `App.svelte`'s `onHumanNote`, which
  sounds it at once (`Player.playAlong`) and logs it for the Muse
  (`Player.humanNoteOn`, and `humanNoteOff` for its release) alike;
  `midi/surfaces.ts`'s `partOf` reads a MIDI note's channel to tell the
  pads from the keyboard, channel 10 the drums' as the prototype's is.
- The parts are machines at bar rate over one `BarEnv`, and `BandBar` is
  that environment plus the events and the bar's `sound`. The drums carry
  nothing; the bass its last note, the comp its last voicing, the lead its
  last note, its phrase and its themes' melodies (`BandCarried.parts`). A
  passed bar leaves the parts where they were, and only the lead's memory
  reaches more than register (S2). The Muse judges each source's bar into
  a `Motif` (U4, `judgeBar` in `muse.ts`): onsets with rests, where a note
  was released before the next, and degrees of the key altered by `b` or
  `#`, written as a numeral writes a root off the key. The `muse` machine
  carries what it offers (an `Offer`: the motif, its source, the bar heard)
  and the last bar anyone played; its output is the log. The offer enters
  the band as its environment (`BandEnv.offer`, then `BarEnv.offer`), a
  standing target like the key wish, and the lead plays it whole while it
  stands, even where it would rest. The transport carries the Muse's
  state (`listening`) and judges bar k as it composes bar k + 2
  (`LISTEN_DELAY`); a test that builds a `BandEnv` or `BarEnv` by hand
  gives `offer: null`. A motif's accents are counted from the player's
  level in the bar, which the judgement and the offer carry beside it as
  the style reading, and a motif note plays at the band's level plus its
  accent (U4): the lead writes it on the note (`WrittenNote.accent`), and
  `perform` plays it on `LEAD_LEVEL`.
- The e2e checks tell sounds apart by oscillator type and starting
  frequency: a kick is a sine starting at 440 Hz (its pitch only glides), a
  snare's body a triangle at 185 Hz, the bass a saw, the lead a square, a
  chord note a triangle beside a sine 0.3 % sharp. A new voice keeps these
  apart or updates `band.e2e.ts`. A note played along is a square too, but
  starts at once, off the grid; at energy 0 the lead rests, so a square on
  the grid is a motif the Muse offered.
- Section names appear twice on the page, on the stage and in the song
  map, which names them before anything is heard. So a check that the
  screen follows what is heard looks for `Bar n of 8`, which only the stage
  shows.
- A chord is the theory's `Chord`, a helix plus tensions (#38), in the key's
  register. `joinChord` gives its stack, and `chordScale` takes a stack. A
  bar's chords come from its theme's slots (`barChords`); their colour
  draws are keyed by theme, bar and slot, so a test that wants a rate must
  vary the seed or the theme, not the key.
- Swing is a time map, `swingMap(swing)`, with `played` and `written` as
  exact inverses. The transport plays through it, and player input reads
  back through `written`.
- A moment on the clock reads back onto the grid through the steps the
  transport laid (`writtenAt`), never through the style track: the track
  holds only its latest glide per axis, so inverting it from the song's
  start put a note 18 bars early after two tempo changes (#78). Each
  `ScheduledStep` carries the swing its beat was held at for this. A played
  note is placed at the moment that was being heard as it was played, kept
  exact; rounding it is the Muse's (#79). `clockOffset` gives that moment
  on both its paths, so nothing else takes the latency off again: in
  Chromium the heard moment lags `currentTime` by about the output latency.
- Host and client mode ([brief](briefs/host-mode.md)): the pure parts are
  in `packages/session`, the app's in `apps/web/src/session/` (a `Lobby`,
  `HostSession`, `ClientSession`) and the player's `mode`. A client runs
  `transportOver(followSource)` in the host's time and plays each event
  `skew` earlier on its own clock; the skew is the host's heard moment
  less its own (`heardNow`), so output latency needs no term of its own.
  In a session a note's source is a player's id and the instrument
  (`playerSource`), never a name; screens read it by name through
  `sourceName` and the players' names the host sends with the Muse.
  An output's clock pairing steps while it starts, so `heardNow` is null
  for its first 0.2 s, and `hostClock` drops a ping that came back before
  it was sent. To try it, open the app in two windows of one browser,
  host in one and join in the other; `session.e2e.ts` measures the two.
  It holds one page's audio (`holdAudio`, a `suspend` and `resume`) for
  40 ms, a step of some 30 ms; holds of 20 ms or less step the pairing
  anywhere from −10 to +11 ms, as the output settles again. `heard` reads
  when a note sounded through the pairing sampled as it sounded (a median
  of five, as a single reading can blip), and `pairingSteps` finds each
  step of a page's clock, so a check can excuse the moments after a step,
  on any machine, rather than a count of notes out.
  Across machines, run `pnpm lobby` on one and give its `ws://` address as
  the lobby server on each; every machine loads the app from its own
  `localhost`, where Web MIDI works without HTTPS.
- A test of anything that reads a clock runs it on `simulatedDevice`
  (`packages/session/src/faults.ts`, #27): real time is the test's, and
  each fault is named, else off: drift, dropped buffers (the output's
  clock stands still for the buffer), the render quantum, latency, the
  pairing's jitter and blips, page stalls, and a link's legs, holds and
  loss. `device.view(() => t)` gives the `clock` and `now` the app reads.
  A claim is a bound the component promises, and a test shows its
  checker firing. Measured here in headless Chromium, the pairing is
  within about 0.4 ms but a busy machine blips a reading by up to 4 ms,
  which the next takes back; a dropped buffer steps it for good. Where a
  component doesn't keep its promise yet, the scene is kept as a known
  break, a test that finds it (`KNOWN_BREAKS`).
- The web tests resolve `ws` to its Node build (`apps/web/vitest.config.ts`):
  resolved for the browser it is a stub, and `websocket.test.ts` runs the
  real lobby server, in Node's environment.
- `performance.now` read off its object throws ("Illegal invocation" in a
  browser, a TypeError in Node), so a default clock is called on it:
  `deps.now ? deps.now() : performance.now()`, never
  `(deps.now ?? performance.now)()`. That broke every note played in the
  browser, after it had sounded, until an e2e check typed one (#79).
- In the theory, a set is a `Helix`, `{ cycle, heights }`: the heights of
  degrees 0 to k − 1, with degree 0 wherever it stands. `positions(helix)` is
  the sorted view from the circle. `shift` moves heights (transposition) and
  `mode` moves degrees (same positions, another tonic).
- To drive the prototype headless, define `window.__JAMBOT_TEST__` before its
  script runs. It is then called with the internals (`S`, `composeBar`,
  `applyPreset`, `evalMini`, `parseRoman`, `checkOverrides`, …).

## Facts

### Repository and CI

- The repository is private. GitHub Actions minutes are used up (#4), so
  the CI workflow runs only when started by hand. `pnpm verify` locally is
  the check that counts. A red or missing `check` on a pull request says
  nothing about the code.
- GitHub Pages is deployed by hand, after each merge into `main` (`AGENTS.md`):
  `pnpm pages deploy` (`tooling/pages.ts`) runs `pnpm verify`, builds `main` for
  the sub-path `/jambot/` into `apps/web/dist-pages`, checks that every file the
  site references resolves there and that nothing is fetched from outside it,
  commits the build to the `gh-pages` branch and pushes it. It then waits for
  the live site to serve that build and checks it again. Pages publishes the
  branch as it is: the repository's Pages source is "Deploy from a branch",
  `gh-pages`, `/`. `pnpm pages build` and `pnpm pages serve` show the site on
  `http://localhost:4318/jambot/` first, served as Pages serves it (404 for what
  isn't a file, where `vite preview` would answer with the app).
- `pnpm deploy` is a reserved pnpm command, which is why the deploy is
  `pnpm pages deploy`.
- `pnpm ci` is a reserved pnpm command, which is why the all-in-one script is
  called `verify`.
- TypeScript is pinned to 6.0, because typescript-eslint and svelte-check do
  not support TypeScript 7 yet.
- The web app's base path comes from `BASE_PATH` (`pnpm pages` sets
  `/<repo>/`, from the `origin` remote). It defaults to `/`.
- The service worker answers every navigation it doesn't precache with the
  app's `index.html`, so a page it doesn't precache opens as the app, not
  as itself. `apps/web/e2e/pages.e2e.ts` opens the prototype offline to
  hold that it is precached.
- The app and the prototype use system fonts and fetch nothing from
  outside the site (#58).
- No module exports a function named `then`: a module namespace with a
  `then` is a thenable, and `await import()` of it never settles. So the
  score's `then` is `thenOp` in code (U5).

### License

- Jambot is MIT ([`LICENSE`](../LICENSE)), as are quintenzirkel and
  lib-aeiou, so code moves freely between the sister projects. Every
  `package.json` says so.
- The build runs a license gate (`tooling/licenses.ts`, wired in
  `apps/web/vite.config.ts`). It fails on any package the app ships that
  isn't under a permissive license or lacks its license text, and writes
  `licenses.txt`: Jambot's license, then each shipped package's. Today that
  is the Svelte runtime, Vite's preload polyfill, workbox's runtime and the
  service worker's loader (Apache-2.0).
- Taking in a copyleft package, such as Strudel, is a decision, not a side
  effect of an import. MIT code may go into an AGPL build, but that build is
  then AGPL as a whole. Exporting Strudel code as text is not affected.
- The license covers the code and the docs. It does not cover training
  data, model weights or what the band plays. Lakh MIDI and Groove MIDI are
  CC-BY-4.0 (attribution); POP909 has a license of its own, to read before
  use.
- Static assets aren't modules, so the gate doesn't see them. None comes
  from elsewhere: the app and the prototype use system fonts (#58).

### Prototype

- Default MIDI channels: lead 1, bass 2, chords 3, drums 10. They match the
  Novation Circuit Tracks.
- Web MIDI works in Chrome and Edge, on desktop and Android. Safari has none,
  and Firefox asks for permission first. For hardware MIDI outside an
  artifact viewer, serve the file from `localhost`.
- Browsers throttle hidden tabs, so keep the page in the foreground.
- Composer events → score → compiled events is exact across all presets and
  transitions: about 6,000 events, none missing and none extra, lengths
  within 0.01 steps.

### Score language

- The language design (#7) collects constraints before syntax, in
  [`language.md`](language.md). An entry there is a claim in the `ratchet`
  skill's form: witness, counterexample, test, source, status, where it
  lands.
- Jambot's shapes have exact names in functional programming and category
  theory: a level is a Mealy machine, `compile` and `encode` are a
  retraction and a section, helices under `compose` are a category. The
  table is `language.md`, "Nomenclature".
- The prototype's score is not self-contained: 68% of bars compile
  differently from their text alone, always in register (octave, voicing),
  never in harmony or rhythm (`language.md`, S1 and E1).
- To run the prototype headless from Node, load it in jsdom as
  `prototype/experiments/cold-warm.mjs` does, and end with `process.exit`:
  the page's own timers keep the process alive.
- The engine's parts write notes, not events: a `WrittenNote` is a step, a
  note, a length in whole steps and, for a drum hit, its role, with no
  velocity. The band plays each through `perform` (`perform.ts`), which
  reads the velocity and the gated length from the bar (`language.md`, T4
  and E9). A test that reads a velocity or a played length goes through
  `perform`.
- The band reads its style on a grid of 3 decimals (`writtenStyle`, C7), so
  a `BandBar`'s `style` is the written one, not what the track gave. A test
  that compares a bar's style or energy with its input writes it first.
- A part is one voice (L6): the comp writes two parts, `pad` and `stab`,
  and the synth's chords voice plays both.
- To show measured options as pictures, draw a page per question from the
  experiment's JSON and screenshot it with `tooling/screenshot.ts` (the
  `screenshot` skill). The pages and pictures stay in the scratchpad; the
  experiment and its numbers are what the repository keeps.
- To measure the port headless, run a script under
  `packages/engine/experiments/` with
  `node --experimental-strip-types --no-warnings`; it imports the engine
  from `../src/index.ts`.

The full description is in
[`prototype/README.md`](../prototype/README.md#the-score-language-the-ir).

- One bar per block, 16 steps per bar, 4/4.
- Layers refer upward: pitch is relative to the chord, the chord to the key,
  the key to the section. Only compiled events are absolute.
- `harm`: Roman numerals in the bar's key (minor, dorian, major, mixolydian),
  with `° ø + 7 maj7 9 maj9`, borrowed `b`/`#` and secondaries `V7/iv`. A `9`
  is a tension on the seventh: a chord is a helix of one turn plus the
  tensions above it (#38).
- `bass`, `lead`: interval numbers from the chord root, counting degrees of
  the scale the chord implies. `1 3 5 7` name the chord's helix and `9` a
  tension over it, `2 4 6` are the scale tones between, and `b`/`#` alter
  them. A number sounds whether or not the chord holds it, as `7` does over
  a triad. A note goes
  to the octave nearest the previous one, `^`/`v` force the direction, then
  it folds into the part's range (bass 33–57, lead 60–88, or `range=lo-hi`).
  Absolute notes such as `A4` are an escape hatch, written in upper case so
  that `b3` is always a flat third (U2); the prototype still reads `a4`.
- `pad`, `stab`: `ch` is the current chord and `nx` the next one.
- `drums`: `bd sd gh rim hh oh rd ph`.
- Rhythm is mini-notation: sequence, `[sub]`, `<alt per bar>`, `@weight`,
  `*n`, `(k,n,rot)`, `?`, `,` layers, `~` rest.
- The text holds what is composed, and the compiler adds how it is played.
  `legato=` and `:1`–`:9` state deviations only.
- Two lessons shaped the pitch syntax. Chord-tone tokens like `c0` collided
  with the absolute note C0, so pitch became interval numbers. And
  "nearest octave" alone made melodies climb forever, so each part now has a
  home range.

### Strudel and the sister projects

- Strudel (`@strudel/*`) is AGPL-3.0-or-later. `@strudel/core` 1.2.6 does
  not load under Node 22 (a missing `@kabelsalat/web` export); 1.2.5 does.
- Jambot's Euclid is the prototype's form, `even(k, n)`, shared exactly with
  play-aeiou, quintenzirkel and tonal; that is decided (#8). Strudel's
  differs for 46 of the 120 `(k,n)` pairs with `k < n ≤ 16`, always by a
  rotation, so a Strudel export compensates with a shift or writes the
  pattern out.
- Strudel's `rev`, `late` and `scaleTranspose` (also `strans`) are the
  motif operators of those names (U5), so an export writes them as they
  are. Its `seq` concatenates, its `inv` swaps onsets and rests, and its
  `take` stretches the notes kept over the cycle, so the score doesn't use
  those words for motifs.
- The sister projects (play-aeiou, lib-aeiou, quintenzirkel) are read-only
  from here, and they share conventions with Jambot, not code. See
  [architecture](architecture.md#related-projects).

### music21 and tonal

- Two libraries give second opinions on theory claims, through the
  `music-theory` skill ([`SKILL.md`](../.claude/skills/music-theory/SKILL.md)):
  music21 (Python, BSD-3-Clause, pinned to 10.5.0) and tonal (MIT, a dev
  dependency). Lint keeps tonal to tests, and music21 is never a dependency
  of a package.
- They agree on note names, diatonic scales and the triads and sevenths of
  every mode. On chord symbols they never disagree when both can read one,
  but each reads names the other can't.
- tonal's Euclid, `RhythmPattern.euclid(n, k)`, is exactly `even(k, n)`, with
  the same rotation, for every 1 ≤ k ≤ n ≤ 16. Strudel's is not (#8).
- Roman numerals follow three conventions. Jambot's is the prototype's,
  decided as U1 on #7: the degree and `b`/`#` from the mode and the quality
  from the case, as music21 does, and `7`, `maj7` and `9` as fixed
  intervals, as tonal does. So `bVII` in G mixolydian is F♭ major (the
  mode's own F major is `VII`), and `I7` in C is C E G B♭. music21 differs
  in one more place: it raises the seventh degree of a minor key for `vii`.
  `parseNumeral` and `chordOfNumeral` in `@jambot/theory` read numerals.
  `alteredDegree` is the rule that writes a note off the key, for a
  numeral's root and a motif's note alike: as the parallel major has it,
  otherwise flat, so blue notes are ♭3, ♭5 and ♭7.
- music21 reads `-` as a flat (`C-7` is C♭7), reads `Bb7` as B major with a
  flat seventh without any error, and ignores `maj` in a numeral. tonal
  ignores a numeral's case. The skill's scripts guard against all of these.

### Testing the engine

- A gate is shown to fire by breaking the rule on purpose and watching the
  test fail: a threshold moved, a range widened, a tie turned. Every part's
  tests were written that way (#56, #64); a mutant that survives means a
  missing test, not a lucky one.
- The preset tour rarely comes near a style threshold or an extreme style.
  A threshold is tested on both sides by restyling real bars
  (`bass.test.ts`), and a range over a grid of styles (`lead.test.ts`,
  where the prototype's octave fold left the range at high energy and
  entropy).
- Where the prototype's function is the reference, paste it into the test
  and compare over every case: `pivotRoot` (`key.test.ts`), `voice`
  (`comp.test.ts`).
- A refactor that must not change the music: hash the band's events over a
  few hundred bars and seeds before and after, in a throwaway test.
- A test that swaps a global (`Math.sin`) restores it in a `finally`.

### The ratchet

- The ratchet ([`ratchet.md`](ratchet.md)) is the method for pairs of
  tracks: a working track that builds and a negative track that catalogues
  constraints, coupled only by claims with tests. The pairs are on the map,
  #41. The `ratchet` skill writes an entry as a witness, a counterexample and
  a decidable test; its `Status:` is the evidence, and a rule the owner took
  is a separate `Decided: <where>, <how>` field. The skill files a
  counterexample against the layer it refutes. The pawl check (`tooling/pawl.ts`, #42) runs in
  `pnpm verify`. A test holds an entry by citing its id at the end of its
  description, as in `(T4, Q1c)`, and the entry then names the test's file.
  Where two packages have a test file of the same name, the entry names it
  by its path (`packages/engine/src/chords.test.ts`); a quoted test name is
  the whole name, with no ellipsis; and only `#` followed by a space starts
  a heading, so an entry may wrap onto a line that starts with an issue
  number.
  The catalogues are `language.md` (#7) and `quinetic.md` (#39), with one
  id space; a property `language.md` already holds is an alias there.

### Terms

- **Root node**: the dedicated main host appliance at an event, and the
  central composer and conductor. A full Linux machine (Raspberry Pi class or
  larger) with a USB host and physical MIDI inputs and outputs. An embedded
  root node is out of scope. See [architecture](architecture.md#root-node).
- **Rendering node**: turns the bottom-layer language into sound, for
  example a MIDI instrument or a dough node.
- **dough**: a bottom-layer "machine language", parallel to MIDI.

### Hardware and setups

At an event, the root node drives the physical instruments (vintage synths,
Eurorack). They feed a digital mixer, which drives the main PA. The root node
may also listen to the mixer and control it. Everything else is open.
