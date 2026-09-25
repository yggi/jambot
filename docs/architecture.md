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
              Web Audio synth   Web MIDI out   network / native MIDI
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
  follower, or a server clock.
- **Renderers**: turn timestamped events into sound or MIDI messages and
  handle channel allocation and note-off bookkeeping.
- **UI**: reads engine snapshots and sends intents (preset, slider move,
  override, key change). It never mutates engine state directly.

This split comes from the prototype, where one shared state object couples
composing, scheduling and rendering. The reasons are listed in
[the prototype page](prototype.md#what-the-port-changes).

## Server

A server is planned. It lets several Jambots play in sync and drives MIDI
interfaces directly, without the browser and Web MIDI in between. Its
language and design are open, so the engine stays free of I/O to keep every
option available.

Its possible roles, from least to most responsibility:

1. **Clock and relay**: shared tempo and phase, like Ableton Link, and
   rebroadcast of style changes and overrides.
2. **MIDI host**: drives hardware through native MIDI (CoreMIDI, ALSA,
   WinMM) with tighter timing than a browser.
3. **Authoritative composer**: runs the engine itself and streams score text
   or events to clients.

Two sync models are possible:

- **Lockstep**: every node runs the same engine from the same seed and the
  same ordered input log (each input stamped with the bar it applies to).
  This needs very little bandwidth but strict cross-platform determinism.
- **Authoritative**: one node (the server, or a client acting as conductor)
  composes and sends score text for bar _n + k_. The others only render. This
  is simpler to get right, and the score text is already the wire format.

If the server composes, it has to run the engine: a JavaScript runtime
(Node, Bun or Deno) reuses the package as it is, while another language
means compiling the engine to WASM or re-implementing it. If the server only
clocks, relays and drives MIDI, any language works.

Open questions:

- Does the server compose, or only clock, relay and drive MIDI?
- Lockstep or authoritative sync?
- What latency and jitter budget does MIDI out need? This decides how much
  the server language matters.
- Where do the Muse inputs go when several people play at once?
