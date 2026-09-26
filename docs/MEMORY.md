# Memory

Persistent facts and a cheatsheet. Start here, and follow the links for
depth. Add a fact when it stays true and would save the next person time.

## Cheatsheet

```sh
pnpm install
pnpm dev          # web app with hot reload; the prototype is at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm verify       # lint, format check, typecheck, tests, build: run before pushing
```

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
- In the theory, a set is a `Helix`, `{ cycle, heights }`: the heights of
  degrees 0 to k − 1, with degree 0 wherever it stands. `positions(helix)` is
  the sorted view from the circle. `shift` moves heights (transposition) and
  `mode` moves degrees (same positions, another tonic).
- To drive the prototype headless, define `window.__JAMBOT_TEST__` before its
  script runs. It is then called with the internals (`S`, `composeBar`,
  `applyPreset`, `evalMini`, `parseRoman`, `checkOverrides`, …).

## Facts

### Repository and CI

- The repository is private. GitHub Actions minutes are used up, so CI and
  the Pages deploy do not run (#4). `pnpm verify` locally is the check that
  counts.
- `pnpm ci` is a reserved pnpm command, which is why the all-in-one script is
  called `verify`.
- TypeScript is pinned to 6.0, because typescript-eslint and svelte-check do
  not support TypeScript 7 yet.
- The web app's base path comes from `BASE_PATH` (CI sets `/jambot/` for
  GitHub Pages). It defaults to `/`.

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

The full description is in
[`prototype/README.md`](../prototype/README.md#the-score-language-the-ir).

- One bar per block, 16 steps per bar, 4/4.
- Layers refer upward: pitch is relative to the chord, the chord to the key,
  the key to the section. Only compiled events are absolute.
- `harm`: Roman numerals in the bar's key (minor, dorian, major, mixolydian),
  with `° ø + 7 maj7 9 maj9`, borrowed `b`/`#` and secondaries `V7/iv`.
- `bass`, `lead`: interval numbers from the chord root. `1 3 5 7 9` are chord
  tones, `2 4 6` the scale tones between, and `b`/`#` alter them. A note goes
  to the octave nearest the previous one, `^`/`v` force the direction, then
  it folds into the part's range (bass 33–57, lead 60–88, or `range=lo-hi`).
  Absolute notes such as `a4` are an escape hatch.
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
- Roman numerals follow three conventions. The prototype takes the degree
  and `b`/`#` from the mode and the quality from the case, as music21 does.
  It takes `7`, `maj7` and `9` as fixed intervals, as tonal does. So `bVII`
  in G mixolydian is F♭ major (the mode's own F major is `VII`), and `I7` in
  C is C E G B♭.
- music21 reads `-` as a flat (`C-7` is C♭7), reads `Bb7` as B major with a
  flat seventh without any error, and ignores `maj` in a numeral. tonal
  ignores a numeral's case. The skill's scripts guard against all of these.

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
