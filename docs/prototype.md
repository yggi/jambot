# The prototype

[`prototype/jambot-prototype.html`](../prototype/jambot-prototype.html) is
where Jambot started, and it is the baseline the port is oriented by. It is
not a source of truth. It is one
self-contained file of about 1,300 lines: roughly 120 lines of CSS, 120 of
markup and 1,060 of JavaScript in a single IIFE, with no dependencies apart
from two Google Fonts. The web app build serves it at `/prototype.html`, so
it stays playable while the port catches up.

## What it does

[`prototype/README.md`](../prototype/README.md) travels with the prototype.
It describes the concept, the architecture, the style space, the score
language and the plans. This page covers only the port.

## What the port keeps

1. **The text score as the contract.** The composer writes text, and only the
   compiler turns it into notes. This is the natural seam between modules,
   the natural format for overrides and presets, a readable diff for golden
   tests, and a compact wire format for syncing several Jambots later.
2. **Deterministic, keyed randomness.** Given a seed and the same input
   history, the composition is reproducible. That is essential for testing
   and for any lockstep sync design.
3. **Continuous style space with per-axis glides.** A clean and expressive
   control model that should carry over unchanged.
4. **A sound scheduler.** Lookahead scheduling, a Worker ticker and
   audio-to-performance clock mapping for MIDI timestamps are exactly the
   right basics.
5. **Progressive capability.** It works with no MIDI and with no audio
   output, and degrades with clear messages.

## What the port changes

### Structure

- **One global mutable state object (`S`)** is read and written by
  composition, compilation, scheduling and UI. Composition has hidden side
  effects on `prevVoicing`, `prevBass`, `prevLeadPitch`, `leadMemory`, `cs`
  and `themes`. `composeBar` has to save and restore `prevVoicing` around
  the compiler, and `checkOverrides` deep-copies `S.cs` to undo a trial
  compile. **Target:** pure functions `(state, inputs) → (state', output)`
  with explicit carried state, such as voice-leading memory.
- **Engine and DOM are interleaved in places.** For example, `museEvaluate`
  writes the log via `innerHTML`, `renderBar` sets form controls, and key
  resolution mutates global state while planning. The engine core needs no
  DOM, so it can be separated cleanly.
- **Composition happens inside the audio scheduler**, at step 0 of the bar
  it is about to play, only 120 ms before the downbeat. A garbage-collection
  pause or a slow render can make a bar late. The port's transport composes
  bar n + 1 on the last beat of bar n, at least 333 ms ahead even at
  180 bpm (`transport.ts`).

### Correctness

- **MIDI note overlap on the chords channel.** Pads and stabs share a
  channel and often the same voicing. A stab's note-off ends a pad note that
  is still sounding on external gear, and the pad's own note-off arrives
  later as an orphan. This does not affect the built-in synth. **Fix:**
  per-channel note reference counting in the MIDI renderer, or separate
  channels for pads and stabs.
- **Untrusted strings go into `innerHTML`.** MIDI port names, which come
  from the OS or device, are inserted into `<option>` markup and into the
  Muse log without escaping. The risk is low, but a component framework
  removes it.
- **Determinism is not complete.** `Math.random` sets the song seed, the
  timing jitter and noise offsets, which is fine because those are only
  performance. More importantly, `Math.pow` and `Math.sin` feed weighted
  choices, and the spec does not guarantee they give bit-identical results
  across JS engines. That is harmless for a single player, but it matters
  for cross-device lockstep sync. The port quantises probabilities and
  weights before they meet a draw (`chance` and `pick` in `random.ts`).
- **Swing's two functions disagree.** `unswing` inverts the composition of
  two maps, the 16th level and then the 8th, but `swingDelay` adds their
  delays instead. Where both levels swing (swing between 0.5 and 1) a played
  note reads back up to 0.04 steps off the grid. The port keeps the
  composition, `swingMap` in `swing.ts`, with its exact inverse, so the odd
  16ths move by eighth × sixteenth / 9 of a step more or less than in the
  prototype: at most 1/36, under 4 ms at 120 bpm.
- **Two axes don't glide like the rest.** Entropy is set at once, and tempo
  glides linearly although it is heard in ratios. In the port every axis
  glides, and tempo glides in log space (`style.ts`). Every slider,
  including the tempo buttons, glides over one bar; the prototype's tempo
  buttons glide over four steps.
- **A glide restarts from rest.** Each change starts a new S-curve at rate
  0, so while a slider is dragged, every retarget stops the axis again: over
  an 8-step drag of harmony from 0.45 to 1, it plays 0.476 at the end. In
  the port a glide leaves as fast as the axis was moving (a cubic Hermite
  curve, which from rest is the same S-curve), and plays 0.547 there.
- **A stall is played late, in a burst.** After a stall the scheduler plays
  every step it missed at once. Time is absolute in the port: events the
  clock has passed are dropped, and the grid stays where it was.
- **Swing moves only a note's start.** A note keeps its written length from
  its swung start, so a legato line under swing overlaps or leaves gaps. In
  the port both ends of a note go through the time map. Swing is also read
  per beat, the finest rate at which its map keeps each beat's ends, where
  the prototype reads it per bar.
- **The same drum hit is sent twice.** Where two rules place the same drum
  sound on one step, such as a fill over the backbeat, both note-ons go
  out: in 163 of 2,560 bars across the presets. In the port a sound strikes
  at most once per step, and the louder hit stays.
- **A section is called "shift".** That is the theory's word for a
  transposition, so the port calls it a bridge.
- **A key change throws away the planned sections.** The prototype plans
  twelve bars ahead, so a preset's new mode is a pending key that it
  consumes once, after cutting the plan back to the next section boundary
  (`replanFuture`). The port composes each section at its boundary, a beat
  ahead, and reads the players' wish as a standing target there, so
  nothing is replanned (`plan.ts`).
- **A section's chords are coloured once, at its start.** The prototype
  draws each chord's seventh and ninth when it plans the section, at the
  harmony there, in sequence with every other draw. The port draws them per
  theme, bar and slot, and decides each bar's chords a bar ahead at the
  harmony there (`chords.ts`, `band.ts`), so a harmony slider is heard from
  the bar after next, raising it only adds tones, and a returning theme
  brings its chords back.
- **A B vamp moves away from the A vamp by index alone.** Where the A theme
  is in another mode, the same index is another vamp; the port moves away
  only within the same mode (`themes.ts`).

### Maintainability

- The code is dense (single-letter names, many statements per line) and has
  no types. Events, the plan, chords, styles and the IR AST all have
  implicit shapes.
- Inline styles in the markup, and magic numbers such as velocities, ranges
  and weights spread through the part generators.
- There are no tests in the file, although the `window.__JAMBOT_TEST__` hook
  shows they existed.

## How the port works

The port is test-first. What is true is what the tests and the design (#7)
say; the prototype orients.

1. **Invariants first.** Tests state what has to hold, over every case of
   the finite parts. For example, the theory package checks `even` for every
   k ≤ n ≤ 16: size, shift, maximal evenness, and that the set is the
   arc of its generator.
2. **The prototype for orientation.** Where one of its values helps, a test
   records it as a literal: the rim pattern, the four scales, the random
   generator's first draws. A seed does not have to produce the same music as
   in the prototype. A deliberate difference is fine when it is noted.
3. **Theory and engine first, language surface after #7.** The composer
   produces raw events before anything is written as text, so the engine
   (#2) and `packages/theory` (#28) are built now. The language surface
   (parser, tokens, encoder, compiler) waits for the language design (#7),
   and what the port finds feeds that design.
4. **Audio and MIDI become renderers** that consume timestamped events,
   behind a transport (see [architecture](architecture.md)).
5. **The UI comes last**, as Svelte components over a read-only engine
   snapshot.

Progress is tracked in #2.
