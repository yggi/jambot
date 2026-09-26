# Architecture

Jambot is a pnpm workspace with two packages:

- **`packages/engine`** holds the musical engine: plain TypeScript with no
  DOM, no Web Audio, no timers and no Node APIs (a lint rule enforces this).
  It runs anywhere JavaScript runs: a browser tab, a Worker, or a server.
- **`apps/web`** is the browser app: Svelte 5, built by Vite, and installable
  as an offline PWA. It also serves the original prototype at
  `/prototype.html`.

The engine is being ported from the [prototype](prototype.md) one module at
a time (#2). Until the port is done, the web app is a shell that links to the
prototype.

The score core (the grammar, its parser, the encoder and the compiler) goes
into its own package, `packages/score`, and the engine depends on it. The
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

How the current score language maps onto Strudel extensions is open.

## Nodes

### Web clients

The browser app runs fully on its own: it composes, plays through the
built-in synth or Web MIDI, and listens to input. At an event it connects to
the root node.

### Root node

A dedicated main host appliance and the central composer and conductor at an
event. It is a full Linux system (Raspberry Pi class) or a powerful embedded
system (ESP32-P4 class). Web clients connect to it.

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

## Timing

Timing and latency are a known issue across the whole system: browsers,
network, USB and MIDI. A hardware MIDI clock is one mitigation path.

## Open questions

- How does the engine run on the root node? A JavaScript runtime (Node, Bun,
  Deno) reuses the TypeScript packages as they are on a Linux system, but not
  on an ESP32-P4-class device.
- What do connected web clients do: send input and style, show the HUD,
  render?
- What latency and jitter budget does MIDI out need?
- How does the root node talk to the digital mixer?
- Where do the Muse inputs go when several people play at once?
- How does the score language map onto Strudel extensions?
