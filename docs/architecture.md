# Architecture

Jambot is a pnpm workspace:

- **`packages/theory`** holds the music theory, built on one primitive (see
  below).
- **`packages/engine`** holds the musical engine: the section plan, the band
  and its four parts, and the transport.
- **`packages/session`** holds host and client mode: what a host and its
  clients say, a client's band and ear, and its reading of the host's
  clock ([brief](briefs/host-mode.md)).
- **`apps/lobby`** is the lobby server: sessions found by name, and relayed
  between a host and its clients over WebSockets.
- **`apps/web`** is the browser app: Svelte 5, built by Vite, and installable
  as an offline PWA. It plays the full band on the engine, and also serves
  the original prototype at `/prototype.html`.
- **`tooling`** holds the repository's own gates and tools: the lint rules,
  the agent hooks, the pawl and history checks over the catalogues, the
  license gate and the Pages deploy.

`theory`, `engine` and `session` are pure: plain TypeScript with no DOM, no
Web Audio, no timers and no Node APIs, which lint enforces. They run
anywhere JavaScript runs: a browser tab, a Worker, or the root node.

The engine is ported from the [prototype](prototype.md) (#2), and all of it
but the Muse is in place (#37). The score core (the grammar, its parser, the
encoder and the compiler) goes into its own package, `packages/score`, which
builds on the theory, and the engine depends on both. The score language is
the contract between the composer, the compiler, the analyzer (#3) and later
the learned models, so it lives apart from any one of them. The package is
created with its first module, the seam of #63.

## Theory

Music theory lives in `packages/theory` (#28). It is built on one primitive,
`even(k, n, shift)`: k of n placed as evenly as possible, the maximally
even set. It gives both the Euclidean rhythms and the scales:

- 5 of 16 is the prototype's rim pattern, and 7 of 12 is the diatonic set;
- for coprime k and n, the set is also the arc of `k⁻¹ mod n` stacked from
  0, so 7 of 12 is a stack of fifths, and the circle of fifths and the
  Euclidean rhythm are one structure;
- sorted by brightness, the modes run along that generator. For the diatonic
  set they run from Lydian to Locrian, one lowered note at a time.

Every set is a **helix**, `{ cycle, heights }`: degrees going round and up,
seen from above as positions on the circle and from the side as heights on a
staircase ([theory](theory.md#the-helix)). Around the primitive, the theory
package names things:

- notes, with their spelling, and intervals, generic and specific;
- degrees, counted through a scale or a rhythm alike, and named by function
  (tonic, dominant, leading tone);
- chords: a `Chord` is a helix of one turn plus its tensions, the tones
  above it (#38), and the named qualities are stacks above the root;
- the scale a chord implies in a key (`chordScale`), where each tension sets
  its own degree;
- Roman numerals, as degrees of the key's own scale (`numerals.ts`);
- named scales and their modes, and named rhythms.

`read` reads all of these by name, in long and short forms, and `readings`
lists every reading of an ambiguous name ("C" is a note and a chord) until a
kind is given. `nameOf` writes a name back. Every theory name the sister
projects use resolves to what they mean by it, which a test checks against
their tables.

This primitive is the root of the project and the core of the language
design (#7).

## Layers

```
              ┌──────────────────────────────────────────────────┐
  style,      │ engine (pure, deterministic, no I/O)             │
  key wish,   │  section plan ─ per section: form, key, theme    │
  seed ─────▶ │  band ──────── per bar: decides the next bar,    │
  notes       │                plays drums · bass · comp · lead  │
  heard ────▶ │  Muse ──────── per bar: offers a motif heard     │
  (takeovers  │  [text step: encode → compile, #63]              │
   later)     └────────────────────────┬─────────────────────────┘
                                       │ note events per bar, and its sound
              ┌────────────────────────▼─────────────────────────┐
              │ transport ─ per tick: written position → time,   │
              │ through the swing and tempo maps; schedules ahead│
              └─────────┬──────────────────┬──────────────┬──────┘
                        │                  │              │
                Web Audio synth       Web MIDI out    root node /
                (drums, voices)       (#24)           native MIDI (#20)
```

- **Engine**: every level is a Mealy machine (`machine.ts`):
  `advance(env, carried, input)` reads an environment (the seed, the style
  and the plan at that position), carries state (only what depends on the
  path), hears an input and writes an output. `lawBreaks` checks the
  contract: what it reads, carries and writes is plain data, nothing given
  is changed, the same arguments give the same result, and advancing from a
  JSON snapshot gives what the run gave. All randomness is keyed by seed,
  position and a named stream (`random.ts`), and probabilities are
  quantised before they meet a draw, so the same inputs give the same
  music on every JavaScript engine. The levels, each at its own rate:
  - **the section plan** (`plan.ts`), per section: the form's next section,
    the key moved one step toward the players' wish, and the theme, which
    returns until the style drifts from it;
  - **the band** (`band.ts`), per bar: it plays a bar and decides the next
    one, its plan and chords, so what a part leads into is what plays. A bar
    the clock has passed is passed (`passBar`), not composed;
  - **the parts**, per bar, over one `BarEnv`: the drums carry nothing, the
    bass its last note, the comp its last voicing, the lead its last note,
    its phrase and its themes' melodies;
  - **the Muse** (`muse.ts`), per bar: it judges what each player played in
    a bar into a motif and offers the one it takes, which the band reads as
    its environment, as it reads the key wish, and the lead plays;
  - **the transport**, per tick (below).

  The parts write notes: a step, a note and a length in whole steps, and a
  drum hit's role. The band plays each through the performance
  (`perform.ts`), which reads its velocity and the length it sounds from
  the bar, and the transport plays the events. The text step goes between
  what is written and what is played once #63 builds it, as a round trip
  that changes nothing (`compile ∘ encode = id`).

- **Score text**: the contract between composing and playing, readable by a
  musician. In the design, the composer writes each bar as text, and only
  the compiler turns text into notes; takeovers, tests and sync work on this
  text. The prototype works that way. The port does not yet: it plays the
  engine's events, and #63 builds the seam.
- **Transport**: owns time (`transport.ts`), a pure machine at tick rate.
  Given the clock's now, it schedules every step that starts before now
  plus 120 ms. Swing is a time map from written to played positions, and
  tempo one from positions to seconds, each with its exact inverse
  (`swing.ts`, `tempo.ts`), and time maps compose. The band composes each
  bar on the last beat of the bar before. So a change of style reaches the
  drums within the rest of the bar and a beat (at most 20 steps), a chord's
  colour a bar later, and a key wish at the next section the band plans, a
  bar before that section starts. Tempo and
  swing follow per step and per beat, and a started beat keeps its swing.
  After a stall, what the clock has passed is dropped, not played late.
  Its bars come from a source (`BarSource`): the band, or a host's bars a
  client plays (`followSource`), which it takes as it lays each bar's
  first step, leaving the host's beat for the bar to arrive, and starts
  where the host said it starts. A bar that hasn't arrived by then is
  passed, as a stall passes one.
  Notes players play arrive as its input, where they were heard; as the
  band composes a bar, the Muse judges the bar before the one before it,
  so a motif heard in bar k plays from bar k + 2 and nothing reaches a bar
  sooner (F7). The Muse hears judgements: those of the notes played here,
  and those a client made of its players' bars and sent (`BarJudgement`).
  One that comes after the Muse heard its bar, before the bar was
  composed, or that no ear would have judged in the bar's key
  (`admissible`) is dropped, and the transport says so (`dropped`). The
  web app supplies the clock and plays what it schedules
  (`apps/web/src/player.svelte.ts`), and passes on the notes played.
- **Renderers**: turn timed events into sound or MIDI messages. The web
  app's output routes an event by its part: the drums to a synthesised kit,
  the bass, chords and lead to voices that the bar's `sound` colours
  (`soundOf`, from the style). MIDI out, with channel allocation and
  note-off bookkeeping, is #24.
- **UI**: reads what the player has heard and sends intents (a preset,
  which also wishes for its mode, a slider move, a key picked, a motif
  forgotten; takeovers later). It never mutates engine state. The Muse
  panel draws the motif on offer and the Muse's log, and the stage says
  when the lead plays it.
  The conductor (`conductor.ts`) turns an intent into glides on the style
  track and a key wish. How the UI grows into components over a view model
  is laid out on #26.

This split comes from the prototype, where one shared state object couples
composing, scheduling and rendering. The reasons are listed in
[the prototype page](prototype.md#what-the-port-changes).

## Delivery

- `pnpm verify` runs lint, the format check, the type checks, every test
  (the pawl over the catalogues among them) and the build, whose license
  gate fails on any shipped package without a permissive license. Agents'
  pushes run it through a hook. CI runs only by hand (#4).
- `pnpm e2e` runs the built app in Chromium and measures its audio.
- `pnpm pages deploy` publishes `main` to GitHub Pages by hand
  (`tooling/pages.ts`).

## Languages

Conceptually, the languages stack like this, from top to bottom:

1. Jambot's extensions to Strudel
2. Strudel
3. MIDI or dough: the "machine language" at the bottom, which a rendering
   node understands

Strudel is a target, not a dependency: the shared mini-notation should
behave identically, and no package imports Strudel, which is AGPL (L4 in
[`language.md`](language.md); the conformance corpus is #11). One idea is
that the score language relates to Strudel as TypeScript relates to
JavaScript; that is open (#7).

## Nodes

### Web clients

The browser app runs fully on its own: it composes and plays through the
built-in synth, Web MIDI, or both, with the note-off bookkeeping below for
a channel pads and stabs share (#24, #5). It also listens: Web MIDI in,
the on-screen keys and the computer keys all reach a common note capture,
which places each note on the grid where it was heard, through the steps
as the transport laid them, and keeps it for the Muse (#25). The Muse's
judgement of what it captured is in the engine, and the lead plays the
motif it offers (#79). At an event it connects to the root node (#20).

It also plays with others ([brief](briefs/host-mode.md)). A host opens a
session under a name, and plays as it does alone while it tells its
clients what it does: the song, each bar as written with where it starts,
the bars ahead, the style and the Muse. A client plays the host's bars
with its own synth and MIDI, on the host's clock, set by pings that
compare the moment each output is heard; its players' bars are judged on
the client, and the host's Muse takes one motif of all it hears. Sessions
are found through a lobby: across the tabs of one browser, or through
the lobby server (`apps/lobby`) across machines; WebRTC comes next.

### Root node

A dedicated main host appliance and the central composer and conductor at an
event. It is a full Linux machine (Raspberry Pi class or larger), so it runs
the TypeScript packages directly on a JavaScript runtime. An embedded root
node is out of scope. Web clients connect to it.

It has a USB host and physical MIDI inputs and outputs. It drives the
physical instruments (vintage synths, Eurorack) directly, without a browser
and Web MIDI in between:

```
web clients ⇄ root node ─ USB / MIDI ports ─▶ instruments ─▶ digital mixer ─▶ PA
                  ▲                                             │
                  └──────────── may listen and control ─────────┘
```

### Rendering nodes

A rendering node turns the bottom-layer language into sound. A MIDI
instrument is one; a dough node is another, in parallel to it.

## Related projects

Three sister projects share Jambot's theory and events, but not its code.
They are read-only from here.

- **[play-aeiou](https://github.com/yggi/play-aeiou)** is a MIDI instrument
  on an Atom S3 (CircuitPython): keyboard in, synths out, with a chord
  processor, an arpeggiator, an LFSR melody source and N-step tracks.
  - It joins a running MIDI clock instead of restarting it.
  - At an event it is a likely player, and its notes reach the Muse already
    transformed. The Muse treats more than 12 notes per bar as mashing, and a
    1/16 arpeggio produces 16, so provenance has to express "an arpeggio of a
    held chord" (#25).
  - Its note-off bookkeeping (owner counts per port) is a worked solution
    for #5.
- **[lib-aeiou](https://github.com/yggi/lib-aeiou)** is the pure-values layer
  shared by play-aeiou and flow3r-aeiou: scales, snapping and note names.
  - Its rule is _values, never messages_: anything that needs an event type
    becomes a written contract that each project implements for itself.
    That is the same shape as Jambot's pure engine with the score text as
    the contract, and a precedent for how a rendering node can relate to the
    root node.
  - Its planned `sync.md` contract (clock, start, continue, stop, song
    position, who is master, dropped clocks) is the timing question from
    the instrument's side (#27).
- **[quintenzirkel](https://github.com/yggi/quintenzirkel)** is a single-file
  circle-of-fifths app with an improviser.
  - Its theory is derived rather than tabulated: modes are one arc of seven
    fifths, and spelling follows the key.
  - Its improviser has a 16-step bar, Euclidean rhythm, motifs stored as
    steps, and named style axes, each of which owns one statistic.

None of the three has Roman numerals, harmonic function, progressions, voice
leading or a text score. Those are Jambot's own. flow3r-aeiou, a CV-based
modular synth, has not been examined.

The runtimes differ (TypeScript here, restricted Python there), so the
projects share **conventions, not code**. These facts stay aligned:

- C4 = 60;
- the Euclid form, `even(k, n)` (decided in #8);
- scale contents and names;
- the meaning of "mode k": the scale re-rooted on its k-th note (`mode`,
  then a shift back to 0).

Spelling follows Jambot's own rule, in thirds over the chord
([theory](theory.md#spelling)). quintenzirkel's spellings (`spellDegree`)
follow from it, and its golden spellings are tests here.

One theory word means something else in a sister project: quintenzirkel's
"position" is a place on the circle of fifths, a position along the
generator. Here a position is the chromatic place, height mod cycle.

quintenzirkel's mirror reflects about the axis between the tonic and its
fifth, so C ionian mirrors to C aeolian. Here `mirror` reflects about degree
0 (C ionian to C phrygian), and quintenzirkel's is that shifted by a fifth,
`shift(mirror(helix), 7)`, on the note sets ([theory](theory.md#mirror)).

Two names mean different sets, and Jambot follows the more common use:

- lib-aeiou's `augmented` scale is the augmented triad `[0, 4, 8]`. Here that
  is the augmented chord, and the augmented scale is the hexatonic
  `[0, 3, 4, 7, 8, 11]`.
- "octatonic" is quintenzirkel's (and Messiaen's) half-whole form; play-aeiou's
  and jazz's `diminished` is the whole-half form. They are one collection
  from two starting points.

Their ideas for the score language are collected on #7. The actionable
findings are in #8–#12.

## Timing

Timing and latency are a known issue across the whole system: browsers,
network, USB and MIDI (#27). What holds now: the clock never waits (T1), and
the transport drops what a stall passed. A hardware MIDI clock is one
mitigation path, and the MIDI clock is a lossy grid of 96 ticks a bar (T3).

Every clock the app reads is tested on simulated devices with each fault
explicit (`packages/session/src/faults.ts`). The transport keeps T1 under
all of them. `hostClock` keeps a client within half its best round trip of
its host under each fault alone, and follows a dropped buffer within two
pings on a quick link. It does not yet where a step is no wider than the
pings' ranges and its step rule's 3 ms, which it slews away at 2 ms a
second: a step of 4 ms on a quick link, a buffer over a link whose
quickest round trips are near one (5 ms legs held up to 20 ms left a
client 10 ms out for 6 to 7 s), or a ping answered partway into a drop. `clockOffset`, which times MIDI out and
capture, smooths a dropped buffer away over some 23 updates rather than
following it. Both are #27's next step: one estimator for every clock
pair.

The end-to-end check of host and client mode (`session.e2e.ts`) holds one
page's audio for 40 ms mid-run, which steps its clock by some 30 ms, so
every machine meets a step, not only one whose audio drops buffers. It
reads each page's pairing as a note sounds, finds every step of either
clock from the pairings, and asks that every note be within 2 ms of the
host's once the clock has settled from each: a step it should follow
within two pings, a smaller one at the rate it slews.

## What has settled, and what is open

Settled, each held by tests on `main`:

- **Purity and determinism:** theory and engine are pure; every level is a
  machine with checked laws; randomness is keyed and quantised.
- **One primitive:** `even(k, n, shift)` and the helix give scales,
  rhythms, modes and chords; the Euclid form is `even(k, n)` (#8).
- **Chords and their scales:** a chord is a helix plus tensions, and a
  tension sets its own degree of the scale its helix implies (#38).
- **Numerals, scale lines, pitch tokens:** decided on #7 as U1, U3 and U2,
  and held in the theory ahead of the score package (`numerals.ts`,
  `chordScale`); #63 measures them by round trip.
- **Time:** written and played time are separate, joined by exact time maps
  (T4); swing per beat, tempo per step, composing a beat ahead, dropping
  what a stall passed.
- **Rates:** each value lives at one rate and is held by the faster levels
  (C3); a key follows the players' wish as a standing target (C6).
- **The band:** it decides each bar a bar ahead, and plays four parts that
  each carry their memory.
- **The Muse** (#79): it judges each player's bar into a motif (U4),
  offers the one it takes as a standing target the band reads as its
  environment (C6), and the loop from players back to players passes
  through a delay of two bars (F7). A motif keeps its accents, counted
  from the player's level, and plays on the band's (U4); the player's level
  is the reading of their style, kept beside it.
- **Licensing:** MIT, a license gate on what the app ships, and Strudel
  kept out of the packages.

Open:

- **The score's surface and the text step** (#7, #63): the seam builds it
  and measures the decided surface by round trip.
- **Random access against musical memory** (#7's tension 1): the bass and
  the comp carry register alone, but the lead carries a phrase and its
  themes' melodies (S2). What a key frame holds, or which memory becomes a
  named cell in the score, is open.
- **Exact positions** (T2): the port counts steps in floating point, and
  whether positions become exact fractions is open until the text step.
- **The Muse, beyond repeating** (#79's later list): how the band develops
  a motif rather than repeats it (U5's operators), how several players are
  weighed (A3's confidence), whether an arpeggio of a held chord can be
  told from mashing (play-aeiou), following the players' style (#16, A4),
  and whether players' accents are expressive or metric (A5).
- **The MIDI clock's master** (#27): whether a web client or the root node
  drives it when both exist.
- **Latency and jitter budgets** (#27), and whether notes are humanised
  (the prototype adds random jitter; the port doesn't).
- **The root node** (#20): its JavaScript runtime (Node, Bun or Deno), what
  connected web clients do (send input and style, show the HUD, render),
  and how it talks to the digital mixer.
- **How the score language relates to Strudel** (#7, #11).
