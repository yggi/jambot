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
  does not change the music.
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
  section boundary.
- A chord is the theory's `Chord`, a helix plus tensions (#38), in the key's
  register. `joinChord` gives its stack, and `chordScale` takes a stack. A
  bar's chords come from its theme's slots at the bar's harmony
  (`barChords`); their colour draws are keyed by theme, bar and slot, so a
  test that wants a rate must vary the seed or the theme, not the key. The web player only
  reads the audio clock and plays what the transport schedules, so
  everything that decides what and when is tested without a browser.
- Swing is a time map, `swingMap(swing)`, with `played` and `written` as
  exact inverses. The transport plays through it, and player input reads
  back through `written`.
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
- GitHub Pages is deployed by hand: `pnpm pages deploy` (`tooling/pages.ts`)
  runs `pnpm verify`, builds `main` for the sub-path `/jambot/` into
  `apps/web/dist-pages`, checks that every file the site references resolves
  there and that nothing is fetched from outside it, commits the build to the
  `gh-pages` branch and pushes it. It then waits for the live site to serve
  that build and checks it again. Pages publishes the branch as it is: the
  repository's Pages source is "Deploy from a branch", `gh-pages`, `/`.
  `pnpm pages build` and `pnpm pages serve` show the site on
  `http://localhost:4318/jambot/` first, served as Pages serves it (404 for
  what isn't a file, where `vite preview` would answer with the app).
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
- music21 reads `-` as a flat (`C-7` is C♭7), reads `Bb7` as B major with a
  flat seventh without any error, and ignores `maj` in a numeral. tonal
  ignores a numeral's case. The skill's scripts guard against all of these.

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
