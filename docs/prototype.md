# The prototype

[`prototype/jambot-prototype.html`](../prototype/jambot-prototype.html) is
where Jambot started, and it is the reference for the port. It is one
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
  pause or a slow render can make a bar late. **Target:** compose at least
  one bar ahead, off the scheduling hot path.

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
  for cross-device lockstep sync. Quantising the weights before sampling
  would make it safe.

### Maintainability

- The code is dense (single-letter names, many statements per line) and has
  no types. Events, the plan, chords, styles and the IR AST all have
  implicit shapes.
- Inline styles in the markup, and magic numbers such as velocities, ranges
  and weights spread through the part generators.
- There are no tests in the file, although the `window.__JAMBOT_TEST__` hook
  shows they existed. That hook is how the port records reference output
  (see below).

## How the port works

The port is test-first, and it is checked against the prototype's own
output:

1. **Reference output.** Tests pin values recorded from the prototype, so a
   seed produces the same music before and after the port. For small units,
   such as the random generator, the values are recorded once and written
   into the test. For whole bars, a script drives the prototype headless
   through `__JAMBOT_TEST__` (`composeBar`, `applyPreset`, `evalMini`,
   `parseRoman`, …) and stores the score text per preset as fixtures.
2. **Engine first, module by module**, into pure, typed code in
   `packages/engine`, in dependency order: randomness → mini-notation →
   harmony and Roman numerals → score encode and compile → style space →
   part generators → form and planning → Muse.
3. **Audio and MIDI become renderers** that consume timestamped events,
   behind a transport (see [architecture](architecture.md)).
4. **The UI comes last**, as Svelte components over a read-only engine
   snapshot.

Deliberate musical changes, such as the MIDI overlap fix, happen after the
module matches the prototype, and they update the reference values in the
same commit.

Progress is tracked in #2.
