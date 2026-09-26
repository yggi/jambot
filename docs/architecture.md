# Architecture

Jambot is a pnpm workspace:

- **`packages/theory`** holds the music theory, built on one primitive (see
  below).
- **`packages/engine`** holds the musical engine.
- **`apps/web`** is the browser app: Svelte 5, built by Vite, and installable
  as an offline PWA. It also serves the original prototype at
  `/prototype.html`.

`theory` and `engine` are pure: plain TypeScript with no DOM, no Web Audio,
no timers and no Node APIs, which lint enforces. They run anywhere
JavaScript runs: a browser tab, a Worker, or the root node.

The engine is being ported from the [prototype](prototype.md) one module at
a time (#2). Until the port is done, the web app is a shell that links to the
prototype.

Music theory lives in `packages/theory` (#28). It is built on one primitive,
`even(k, n, rotation)`: k of n placed as evenly as possible, the maximally
even set. It gives both the Euclidean rhythms and the scales:

- 5 of 16 is the prototype's rim pattern, and 7 of 12 is the diatonic set;
- for coprime k and n, the set is also the arc of `k⁻¹ mod n` stacked from
  0, so 7 of 12 is a stack of fifths, and the circle of fifths and the
  Euclidean rhythm are one structure;
- the modes are the set's rotations, ordered along that generator. For the
  diatonic set they run from Lydian to Locrian, one lowered note at a time.

Around the primitive, the theory package names things:

- notes, with their spelling, and intervals;
- degrees, counted through a scale or a rhythm alike;
- chords, as stacks of every other degree;
- named scales and rhythms.

`lookup` reads all of these by name, in long and short forms, and lists
every reading of an ambiguous name ("C" is a note and a chord) until a kind
is given.

This primitive is the root of the project and the core of the language
design (#7).

The score core (the grammar, its parser, the encoder and the compiler) goes
into its own package, `packages/score`, which builds on the theory, and the
engine depends on both. The
score language is the contract between the composer, the compiler, the
analyzer (#3) and later the learned models, so it lives apart from any one
of them. The package is created with its first ported module.

## Layers

```
            ┌─────────────────────────────────────────────┐
  inputs →  │ engine (pure, deterministic, no I/O)        │
  (style,   │  style space · form/plan · harmony · parts  │
   notes,   │  muse · score encoder → score text          │
   overrides│  score compiler → note events (bar-relative)│
   seed)    └───────────────┬─────────────────────────────┘
                            │ events per bar
            ┌───────────────▼─────────────────────────────┐
            │ transport (clock, tempo map, lookahead)     │
            │ bar/step → absolute time; swing applied     │
            └───────┬───────────────┬───────────────┬─────┘
                    │               │               │
              Web Audio synth   Web MIDI out   root node / native MIDI
```

- **Engine**: its state is explicit and serialisable, so a snapshot can be
  sent, stored or replayed. It takes the style, the input history and a
  seed, and returns the score text and note events for bar _n_. All
  randomness is keyed by seed and position (see `random.ts`), so the same
  inputs always give the same music.
- **Score text**: the contract between composing and playing. The composer
  writes each bar as text, and only the compiler turns text into notes.
  Overrides, tests and sync all work on this text.
- **Transport**: owns time. It maps musical positions to clock time and
  schedules ahead. It is swappable: a local audio clock, a MIDI clock
  follower, or the root node's clock.
- **Renderers**: turn timestamped events into sound or MIDI messages and
  handle channel allocation and note-off bookkeeping.
- **UI**: reads engine snapshots and sends intents (preset, slider move,
  override, key change). It never mutates engine state directly.

This split comes from the prototype, where one shared state object couples
composing, scheduling and rendering. The reasons are listed in
[the prototype page](prototype.md#what-the-port-changes).

## Languages

Conceptually, the languages stack like this, from top to bottom:

1. Jambot's extensions to Strudel
2. Strudel
3. MIDI or dough: the "machine language" at the bottom, which a rendering
   node understands

How the score language relates to Strudel is being designed (#7). One idea
is that it relates to Strudel as TypeScript relates to JavaScript.

## Nodes

### Web clients

The browser app runs fully on its own: it composes, plays through the
built-in synth or Web MIDI, and listens to input. At an event it connects to
the root node.

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
- the Euclid form (#8);
- scale contents and names;
- the meaning of "mode k".

Their ideas for the score language are collected on #7. The actionable
findings are in #8–#12.

## Timing

Timing and latency are a known issue across the whole system: browsers,
network, USB and MIDI. A hardware MIDI clock is one mitigation path.

## Open questions

- Which JavaScript runtime runs on the root node (Node, Bun or Deno)?
- What do connected web clients do: send input and style, show the HUD,
  render?
- What latency and jitter budget does MIDI out need?
- How does the root node talk to the digital mixer?
- Where do the Muse inputs go when several people play at once?
- How does the score language relate to Strudel? (#7)
