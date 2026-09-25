# Prototype evaluation

Subject: [`prototype/jambot-prototype.html`](../prototype/jambot-prototype.html),
one file of about 1,300 lines: roughly 120 lines of CSS, 120 of markup and
1,060 of JavaScript in a single IIFE. It has no dependencies apart from two
Google Fonts.

## What it does

| Area | How it works |
| --- | --- |
| **Style space** | Six continuous axes (swing, syncopation, harmony, articulation, energy, bpm) plus entropy. The eight genre presets are points in this space. Every axis glides on its own over a number of 16th steps, so a preset change takes 8 bars and a slider move takes 1. |
| **Randomness** | Seeded `mulberry32` combined with a key hash (`rng(...keys)`). Randomness is fixed per section and slot, so when the style changes the rhythms *morph* instead of reshuffling. |
| **Form** | A Markov chain over section types (intro, groove, B section, build, drop, breakdown), 8 bars each, weighted by energy and entropy. |
| **Harmony** | Per-mode transition tables (minor, dorian, major, mixolydian), static vamps at low harmony, and at higher harmony secondary dominants, split bars, 7ths and 9ths. Themes A, B and build return until the style drifts away from them. Key changes wait for the next section and pivot to the closest related root. |
| **Parts** | `drums`, `bass`, `comp` (pad and stab) and `lead` are each a function of the style coordinates. Patterns blend between straight and syncopated grids, walking bass takes over when swing is high, and there is Euclidean percussion. Chords are voice-led by a nearest-distance search. The lead builds phrases from contour shapes, with a phrase grammar: bar 2 of each 4 ends open, bar 4 closes on the root. |
| **Score (IR)** | Each bar is *encoded* to a text score in a Strudel/Tidal-like mini-notation: Roman numerals for harmony, intervals relative to the chord root for bass and lead, `ch`/`nx` for chords. The score is then *compiled* back to note events, so the band really does play from the text. Users can override any part line by line. |
| **Audio** | Web Audio synths (kick, snare, noise metals, bass, pad, lead) behind a compressor. The scheduler looks ahead 120 ms on a 25 ms tick driven by a Worker, so it keeps time in background tabs. |
| **MIDI** | Web MIDI out on per-part channels with timestamps mapped from audio time via `getOutputTimestamp`, 24 ppqn clock, start and stop, thru, and hot-plugged ports. |
| **Muse** | Captures notes from the MIDI, on-screen and computer keyboards, removes swing from their timing, and judges each bar (3–12 notes, span of 19 semitones or less). The lead adopts an accepted motif and forgets it after 16 idle bars. |
| **UI** | Conductor HUD with the current chord, the next four bars, a four-section song map with energy bars, the score, a Strudel export, and MIDI routing. Accessible (labels, `aria-live`) and themeable for light and dark. |

## Strengths worth keeping

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

## Problems to fix during the port

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
- Tests are not included, although the `window.__JAMBOT_TEST__` hook shows
  they existed. That hook is the way to record golden outputs from the
  prototype before porting (see below).

## Suggested porting approach

1. **Record golden output first.** Load the prototype headless with a fixed
   seed, drive it through `__JAMBOT_TEST__` (`composeBar`, `applyPreset`,
   `evalMini`, `parseRoman`, …) and store the score text for, say, 64 bars
   per preset. These become the port's regression tests.
2. **Port the engine module by module into pure, typed code.** Suggested
   order: mini-notation → harmony and Roman numerals → IR encode and compile
   → style space → part generators → form and planning → Muse. Check each
   step against the golden output.
3. **Rebuild audio and MIDI as renderers** that consume timestamped events,
   behind a transport interface (see [architecture](architecture.md)).
4. **Rebuild the UI last**, as components over a read-only engine snapshot.
