# Jambot

A cybernetic bandleader for live maker events. Left alone, it plays an endless, evolving jam. When people join in (hardware keyboards, on-screen keys, phones), it listens, steals their motifs, bends its style toward theirs and conducts the collective output. It produces **MIDI and a score, not sound**: hardware synths, grooveboxes or a small built-in Web Audio synth make the sound downstream.

This file travels with `jambot-prototype.html`: a single self-contained page, no build step, working in Chrome or Edge (desktop or Android). Open it, press *Start the band*, play along.

---

## Spirit

- **As little hardwired as possible.** Genres aren't patches; they're points in a continuous style space. Melody, form and timbre all follow the same coordinates.
- **Nothing jumps.** Changing a preset, key or slider is a transition, never a cut. Tempo, rhythm, harmony and melody glide.
- **Legible all the way down.** The band plays from a human-readable score that people, the composer and (later) small models all read and write.
- **Time is absolute.** The clock never waits for anything: not rendering, not the network, not a model.
- **Honest about claims.** Every stage should be measurable; the key test is the round trip. Speculative threads (the "organismic" self-reference, the Quinetics parallels) stay labelled as such until something measures them.

## From concept to prototype: the decisions that stuck

The original concept had four personas: **Composer** (a generative state machine), **Listener** (scores the output on Entropy, Energy and Valence), **Muse** (steals from humans) and **Conductor** (a look-ahead HUD). It was planned as asyncio Python daemons. A critical review changed several things:

- **Lookahead scheduling instead of tick-driven generation.** The composer writes ahead; a small scheduler emits timestamped events. The HUD needed a planned future anyway.
- **The Listener merged into the Muse.** Measuring the composer's own output only feeds back what it already knows (a self-referential loop that either stalls or oscillates). Measurement matters only for things the composer can't know: humans and sensors. The Listener is expected to return later as a trained **critic**.
- **"Data is universal," but with provenance.** Every event carries its source. Audience input is influence (motifs, style), not direct notes, and the bad-actor filter runs per source.
- **Contraction over accumulation.** DMX, lasers and sensor nodes are out of v1. Musicality was the biggest risk, so it was tested first.
- **Browser instead of Python.** Web MIDI's `output.send(data, timestamp)` does lookahead scheduling natively. The page also runs on Android.

## Prototype architecture (what is in the HTML)

```
Sliders ─┐
         ├─ Controller (style glides) ─ Composer (rules) ─ encode ─┐
Players ─ Muse ─ motifs ─────────────────────────────────────────┐ │
                                                               Score (IR text) + your takeovers
                                                                   │
                                                               Compiler ─ Scheduler ─ MIDI out / Web Audio
                                                                   │
                                                               Conductor HUD
```

**Timing.** A Web Worker ticks every 25 ms (falling back to `setInterval`). Events are scheduled 120 ms ahead on the AudioContext clock, and MIDI timestamps are mapped via `getOutputTimestamp()` so MIDI lines up with the audible audio. Clock start/stop is optional. Keep the page in the foreground; browsers throttle hidden tabs.

**Muse.** Human notes are un-swung, then quantised to 16 steps and judged per source and per bar:
- more than 12 notes reads as mashing and is rejected;
- chords collapse to their top note;
- a motif needs at least 3 notes and a range of at most 19 semitones.

Accepted motifs are stored as scale-degree steps, so they follow key changes. The lead plays a motif back two bars after it was heard, and the motif expires after 16 silent bars.

**Style space.** Four hand-chosen axes plus energy, entropy and tempo:

| Axis | 0 | 1 | Drives |
|---|---|---|---|
| Swing | straight | swung | 0 to 0.5 shuffles the offbeat 16ths, 0.5 to 1 crossfades into triplet 8th swing; also timing and velocity looseness, hi-hat turning into ride, walking bass |
| Syncopation | on the beat | off the beat | step-probability blends, anticipations, ghost notes, Euclidean percussion |
| Harmony | static vamp | moving, rich | chord-change rate (4-bar vamp to 2 chords per bar), vocabulary (triads, 7ths, 9ths), functional pull (circle of fifths, secondary dominants, ii–V, major V in minor) |
| Articulation | legato | staccato | note lengths per part, the pad/stab crossfade, synth envelopes |

**Presets** are just points in that space, chosen so every axis is reached at both ends: Synth-pop, Techno, Deep house, Ambient, Lo-fi hip hop, Funk, Bossa nova, Swing jazz. Switching glides each axis on its own S-curve over 8 bars. Harmony changes at the next section boundary. A mode change pivots to the key with the most notes in common (A minor → D dorian → C major share all seven).

**Rhythm as morphing, not reshuffling.** Each part's per-step probabilities are compared against thresholds that stay fixed for a whole section. As coordinates move, notes appear and disappear one at a time. Odd bars add a small entropy-scaled perturbation, so there's variation without chaos.

**Form.** Which section comes next is a Markov chain over intro, groove, B section, build, drop and breakdown, weighted by energy and entropy. Harmony lives in **themes** (A for groove and drop, B for contrast, a fresh one for each build). A theme returns until the style drifts away from it or entropy asks for something new, and its melody returns with it.

**Lead.** A four-bar phrase grammar: idea, variation, idea, cadence. Bar 2 ends open (on the 3rd or 5th), bar 4 closes on the root. Rhythms blend step profiles with Euclidean spacing. Contours are an arch, a fall, a rise or a wave, with a step back after every leap.

**Timbre** follows the axes too, via the score's `sound` lines: triangle or square for the lead, upright or saw for the bass, pad swell against pluck.

**Conductor HUD.** Current chord with its Roman numeral, beat bar, a song map (next four sections with per-bar energy and chord loops), the next four bars with section and key cues, lead status, the Muse's log, and a slider readout that moves by itself during glides.

## The score language (the IR)

The band plays from text. Every bar the composer **writes IR**, your takeovers replace whole lines, the **compiler** turns the text into events, and the scheduler plays them.

```
bar 186 groove key=C:major theme=A
style bpm=148 swing=1 energy=.60
harm "IVmaj9"
drums "[rd ~ ~ ~] [[rd,ph] gh rd ~] [rd gh gh gh] [[rd,ph] ~ [bd,rd] ~]"
bass legato=.81 "1@4 7@4 5@4 5@4"
lead legato=.83 "~@3 9@2 6@2 7 9@5 4@2 3"
sound lead tri=1.26 sq=.30 lpf=2720 att=0.030
```

- **Layers refer upward by name.** Pitch is relative to the chord, the chord is relative to the key, the key belongs to the section, the section to the form. Only the compiled events are absolute.
- **Harmony:** Roman numerals in four modes (minor, dorian, major, mixolydian), with `° ø + 7 maj7 9 maj9`, borrowed `b`/`#` and secondaries `V7/iv`.
- **Pitch:** interval numbers from the chord root. Odd `1 3 5 7 9` are the chord's own tones, even `2 4 6` the scale tones between, `b`/`#` alter by a semitone. A note goes to the octave nearest the previous note; `^` and `v` force the direction; then it folds into the part's range (overridable with `range=`). Absolute notes like `a4` are an escape hatch.
- **Chords:** `ch` is the current chord and `nx` the next, voiced by the compiler's voice leading.
- **Drums:** `bd sd gh rim hh oh rd ph`.
- **Rhythm:** mini-notation (sequence, `[sub]`, `<alt per bar>`, `@weight`, `*n`, `(k,n,rot)` Euclid, `?`, `,` layers, `~` rest).
- **Score vs. performance:** the text holds what is composed. The compiler adds how it's played (default velocities, swing, timing looseness). `legato=` and `:1`–`:9` state deviations only.
- **Takeovers:** type a line in the Score panel and it plays from the next bar. Replace `harm` and the bass, pads and lead re-voice to your chords automatically. Bad input is rejected with a readable message before it reaches the band.
- **Strudel export:** a separate panel prints the current bar as Strudel code (absolute notes for now; swing and lengths are not carried over).

**Tested.** Composer events → IR → compiled events is exact across all presets and transitions: about 6,000 events, none missing and none extra, lengths within 0.01 steps. Building it corrected two design mistakes. `c0`-style chord-tone tokens collided with the absolute note C0, which is why pitch became interval numbers. And "nearest octave" alone made melodies climb forever, which is why each part now has a home range.

**Why this shape.** It's readable by musicians (it reads like a lead sheet), parseable to MIDI, and suited to small models: shallow nesting, relative tokens with a small vocabulary, key invariance for free, no arithmetic across tokens, and grammar-constrained decoding guaranteeing valid output. It also splits cleanly across devices: the root node keeps form, harmony, motifs and style; a rendering node running dough would need only the rhythm, events and sound layers.

**Maximal evenness.** Euclidean rhythms and scales are one operator. Placing 7 in 12 as evenly as possible gives 2 2 1 2 2 2 1, the diatonic scale; its rotations are the modes. 5 in 12 gives the pentatonic scale; 5 in 16 gives the clave-like rim pattern the prototype plays (steps 0, 4, 7, 10, 13). That's Clough and Douthett's theory of maximally even sets, and it deserves to be a language primitive: `even(k, n, rot)`.

## Learned models: the plan

Models never touch MIDI or audio directly; they read and write the score. The rule composer stays in the system permanently as the fallback, the prior and the baseline. Inference runs in a Worker, a section ahead; if a model is late, the rules play.

1. **Critic** (score → style vector + genre probabilities). Runs the round-trip calibration ("does Techno land where techno lands?"), reranks the rule composer's candidates (write 4 seeds per bar, keep the closest), and is the Listener returning as a measurement rather than a rulebook.
2. **Muse encoder.** The critic applied to human playing. Target = sliders + α × player style, rate-limited; confidence doubles as the bad-actor filter.
3. **Writers,** one per layer in dependency order: harmony, then lead, then drums and bass. Tiny transformers over score tokens, conditioned on the style axes, trained with the conditioning randomly dropped so the sliders can steer at play time, with grammar-constrained decoding. The lead comes first because melody is the weakest part now.
4. **Form author.** A large LLM writes forms and themes offline or between songs; only small models run live.

**Data:** Lakh MIDI (genre tags via the Million Song Dataset), Groove MIDI (human drumming), POP909 (melody and chord annotations); names from memory, check the details. The style axes can be calculated from the music, so every bar labels itself. Jambot's own output gives exactly labelled data for calibration only; don't train the writers on it alone. Takeovers and thumbs from events become preference data.

**The analyzer is the foundation and the biggest risk.** Messy MIDI → clean IR decides the quality of everything downstream. A full agent brief exists (`analyzer-agent-prompt.md`): extract a shared `jambot-score` package first, then build a closed test loop on synthetic music, evaluate on POP909, batch Lakh, and log grammar gaps ranked by frequency.

Risk levels: analyzer and critic are **solid**; Muse encoder and lead writer are **plausible**; a fully learned band that beats rules plus reranking is **speculative** (and the architecture doesn't depend on it).

## Running and hacking

- Open the HTML directly in Chrome or Edge. For hardware MIDI outside the artifact viewer, serve it from `localhost`. Safari has no Web MIDI; Firefox asks permission first.
- Default channels: lead 1, bass 2, chords 3, drums 10 (matches the Novation Circuit Tracks); change them under *MIDI, key and sound*.
- Headless use: define `window.__JAMBOT_TEST__` before the script runs to receive the internals (`S`, `composeBar`, `applyPreset`, `evalMini`, `parseRoman`, `checkOverrides`, …). The round-trip and takeover tests in the conversation ran this way under jsdom.
- Code map inside `<script>`: constants and presets → style glides and swing → section form and themes → parts (`drums`, `bass`, `comp`, `lead`) → **the intermediate language** (mini-notation, Roman numerals, pitch tokens, encoder, compiler, takeovers) → audio → MIDI and scheduler → Muse → HUD → inputs → controls.

## Open threads

**Language**
- Named themes and form as editable IR blocks; the `form` line becomes a real input, not just a display.
- Motif names and transforms (`m1:inv`, `m1:seq+2`, `m1:cad`); human motifs saved as named cells.
- Patterns spanning several bars (`/2`), plus multi-bar takeovers.
- An `even(k, n, rot)` primitive shared by scales and rhythms; modes as rotations.
- True Strudel compatibility: a compile target of real Strudel code with scale degrees, swing and lengths, or a Strudel dialect package.
- A dough bottom layer: `sound` lines as dough key/value messages; Karplus–Strong and other physical models as new keys; instruments as points in a timbre space.
- Expressive timing (a tempo layer that bends time) and tunings other than 12-tone (the scale layer carrying cents).
- Chord gaps the analyzer will reveal: sus, add6, slash chords, meters other than 4/4.

**Music**
- Signature idioms the four axes can't reach (reggae one-drop, baião): richer bass and drum profiles, or learned writers.
- Longer arcs: a narrative above first-order form (energy curves across a whole set).
- Lead against the bass line (counterpoint, avoiding parallel motion), plus tension/release planning across phrases.
- Instrument selection by nearest match in style space (General MIDI programs, KO II or Circuit patches), still slider-driven.

**System**
- The analyzer (brief ready), then the critic and reranking.
- Muse encoder plus controller: does following the players feel musical or seasick? Test it live.
- The root node: a dedicated Linux host appliance that is the central composer and conductor, drives the physical instruments, and that web clients connect to. Rendering nodes (MIDI instruments, dough nodes) side by side below it.
- Conductor HUD on audience phones (look-ahead chords for acoustic players), plus audience input as weighted influence.
- Logging takeovers and ratings at events as training and evaluation data.

**Mention-track (speculative, keep separate)**
- The Quinetics parallels: self-reference (players → Muse → composer → players), themes as fixed points that return, the step → bar → phrase → section → song hierarchy as successive coarse-graining. Keep these as analogies until the critic can measure something, e.g. whether the loop converges to stable styles, or how style drifts under player influence.
