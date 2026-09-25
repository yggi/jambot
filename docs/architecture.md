# Architecture

Status: **draft**. The toolchain and backend language are still open; see
[decisions](decisions/).

## Goals

- The web client runs fully on its own, with no server: it composes, plays
  through the built-in synth or Web MIDI, and listens to input.
- Later, a **server** lets several Jambots play in sync and drives MIDI
  interfaces directly, without a browser and its Web MIDI timing.
- The musical engine is written once and runs wherever composing happens.

## Layers

```
            ┌─────────────────────────────────────────────┐
  inputs →  │ engine (pure, deterministic, no I/O)        │
  (style,   │  style space · form/plan · harmony · parts  │
   notes,   │  muse · score encoder → score text (IR)     │
   overrides│  score compiler → note events (bar-relative)│
   seed)    └───────────────┬─────────────────────────────┘
                            │ events per bar
            ┌───────────────▼─────────────────────────────┐
            │ transport (clock, tempo map, lookahead)     │
            │ bar/step → absolute time; swing applied     │
            └───────┬───────────────┬───────────────┬─────┘
                    │               │               │
              Web Audio synth   Web MIDI out   (later) network / native MIDI
```

- **Engine**: platform-agnostic code with no DOM, Web Audio or timers. Its
  state is explicit and serialisable, so a snapshot can be sent, stored or
  replayed. It takes the style, input history and seed, and returns the
  score text and events for bar *n*.
- **Transport**: owns time. It maps musical positions to clock time and
  schedules ahead. It is swappable: a local audio clock, a MIDI clock
  follower, or a server clock.
- **Renderers**: turn timestamped events into sound or MIDI messages and
  handle channel allocation and note-off bookkeeping.
- **UI**: reads engine snapshots and sends intents (preset, slider move,
  override, key change). It never mutates engine state directly.

## Planned server (open design)

Its roles, from least to most responsibility:

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
  composes and sends score text for bar *n + k*. Others only render. This is
  simpler to get right, and the text score is already the right wire format.

Consequence for the language choice: if the server ever composes, it must
either run the engine code (so a JS/TS runtime, or an engine compiled to
WASM) or re-implement it. Keeping the engine pure and I/O-free keeps every
option open.

## Open questions

- Does the server compose (option 3), or only clock, relay and drive MIDI
  (options 1 and 2)?
- Lockstep or authoritative sync?
- Which latency and jitter budget is needed for MIDI out? This decides how
  much the backend language matters.
- Where do the clients' Muse inputs go when several people play at once?
