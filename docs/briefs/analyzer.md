# Task: build the Jambot MIDI → score analyzer

You are building the analyzer that turns arbitrary MIDI files into Jambot's score language (the "IR"). It is the foundation of a later machine-learning pipeline: everything trained downstream sees music only through this analyzer. Its job is to produce IR that is **faithful** (compiles back to the original notes), **musically meaningful** (the harmony labels are right), and **honest** (it reports its confidence and never silently guesses).

No machine learning inside the analyzer. It is deterministic, rule-based and measurable.

## Context

Jambot is a generative MIDI bandleader. Its composer writes one bar at a time as IR text, and a compiler turns the text into notes. The reference implementation is a single HTML file, `jambot-prototype.html` (attached). The functions you need live in its `<script>`: `parseMini`, `evalMini`, `parseRoman`, `harmChords`, `resolvePitch`, `encodePitch`, `place`, `voice`, `encodeBar`, `compileBar`, `parseIR`, plus the helpers they use (`degPc`, `toDegK`, `diatonicChord`, `romanOf`, `chordRoman`, `chordName`, `swingParts`, `swingDelay`, `unswing`, the `RANGE`, `DRUMS` and velocity-rule tables).

In the prototype, the composer encodes its own events and the round trip is exact (0 missing and 0 extra notes over ~6,000 events). Your analyzer must produce IR the same compiler accepts.

### The IR, as implemented

One bar per block, 16 steps per bar, 4/4:

```
bar 12 groove key=A:minor theme=A
style bpm=108 swing=.30 energy=.62
harm "i7"                         # or "ii7@8 V7@8" for two chords
drums "[[bd,hh] ~ hh ~] [sd ~ hh gh] ~ [[sd,oh] ~ hh ~]"
bass legato=.64 "1@3 ~@3 1@2 5@6 8v@2"
pad "ch@16"
stab legato=.5 "~@2 ch ~@3 ch@10"
lead legato=.8 "~@3 9@2 6@2 7 9@5 4@2 3"
sound lead tri=.8 sq=.3 lpf=2600 att=.02
```

- **Harmony:** Roman numerals relative to the bar's key. Modes: minor, dorian, major, mixolydian. Qualities: triads (case = major/minor), `°`, `ø`, `+`, `7`, `maj7`, `9`, `maj9`, accidentals `b`/`#` (borrowed chords), secondaries `V7/iv`.
- **Pitch** (bass, lead): interval numbers from the chord root. Odd `1 3 5 7 9` are the chord's own tones, even `2 4 6` the scale tones between, `b`/`#` alter by a semitone. A note is placed in the octave nearest the previous note of that part; `^` and `v` force up or down. Afterwards it folds into the part's range (bass 33–57, lead 60–88, overridable with `range=lo-hi`). Absolute notes (`a4`, `c#3`) are an escape hatch; count every use as a quality cost.
- **Chords** (pad, stab): `ch` is the current chord, `nx` the next one; voicings come from the compiler's voice leading.
- **Drums:** `bd sd gh rim hh oh rd ph`.
- **Rhythm:** mini-notation (sequence, `[sub]`, `<alt per bar>`, `@weight`, `*n`, `(k,n,rot)`, `?`, `,` layers, `~` rest).
- **Performance vs. score:** the compiler adds default velocities, swing and timing looseness; the IR states only deviations. `legato=` scales note lengths per line, and `:1`–`:9` overrides one note's velocity.

## Step 0: make the score core a shared module (do this first)

Extract the IR functions from the HTML into a TypeScript package, `jambot-score`, with **no behaviour change**. Prove it with golden tests: run the prototype's composer headlessly (jsdom works, and the prototype exposes a test hook via `window.__JAMBOT_TEST__`), record hundreds of bars across all eight presets, and assert that your extracted encoder and compiler reproduce them exactly. From now on this package is the single source of truth for the grammar, for both the prototype and the analyzer.

Stack: TypeScript on Node. Use `@tonejs/midi` (or equivalent) for parsing MIDI. Plain functions, no framework.

## The pipeline

Each stage outputs its result plus a confidence value, and logs its reasons when it gives up.

1. **Load and normalise.** Build the tempo map and time signatures and convert ticks to beats. Support 4/4 first. Keep other meters out of the output but count and report them. Drop empty and duplicate tracks.
2. **Grid and swing.** Estimate swing per section from where offbeat onsets fall within the beat, at both the 8th and the 16th level. Map it onto the prototype's single swing axis (0 to 0.5 is a 16th shuffle, 0.5 to 1 is triplet 8th swing; see `swingParts` and `swingDelay`). Un-swing with the inverse mapping (`unswing`), then quantise to the 16-step grid. Keep the leftover timing deviations as microtiming statistics.
3. **Part roles.**
   - Drums are channel 10, mapped from General MIDI onto the 8 drum names. Record unmapped sounds and their counts; don't drop them silently.
   - Bass is the low, mostly monophonic line.
   - Lead is the top voice of the melodic tracks. Use track names and program numbers as hints ("melody", "vocal", "lead").
   - The polyphonic remainder is harmony: it provides chord evidence and becomes `pad`/`stab` lines.
   
   Report the rule used for every assignment and how clear-cut it was.
4. **Key and mode.** Match windowed pitch-class profiles (Krumhansl–Schmuckler or Temperley) against the four modes. Allow modulations, but only past a confidence threshold and after they persist, to avoid flip-flopping.
5. **Chords.** For each half-bar window, build a pitch-class histogram weighted by duration and beat strength, with the bass note weighted extra. Match it against the qualities the IR supports, then turn the result into a Roman numeral in the current key: diatonic chords first, then secondary dominants (dominant quality whose root is a fifth above a diatonic target), then borrowed chords with `b`/`#`. Smooth across windows with Viterbi and a chord-change penalty. For chords the IR can't express (sus, add6, slash chords), pick the nearest supported label, log the substitution, and count it; these counts decide what the grammar needs next.
6. **Encode.** Turn each bar into IR with the shared encoder. Pad/stab split: sustained chord hits go to `pad`, short repeated ones to `stab`. Where a line is better written with Euclid or `*n` and still compiles to the same notes, you may compress it, but exact equivalence comes first.
7. **Style axes** for every bar and section: `swing`, `sync` (a syncopation index; justify your choice), `harm` (chord-change rate plus vocabulary complexity, normalised), `artic` (median legato of bass and lead), `energy` (onset density and velocity), `bpm`. Define each metric precisely in a `METRICS.md`. These labels will train the style critic later, so they must mean the same thing on real music as on the prototype's output.
8. **Form** (last, optional for v1). Build a self-similarity matrix over the encoded bars, split it into sections where it changes, cluster the sections into themes (A, B, ...), and emit a `form` line.

Output: one JSONL record per file with `meta`, `key` changes, `bars` (IR text), `sections`, per-bar `axes`, per-stage confidence, substitution counts and round-trip scores. Plus a corpus summary.

## Evaluation (build this before tuning anything)

1. **Closed loop on synthetic music** (the most important test). Generate thousands of bars with the prototype composer at known style vectors, render them to MIDI with the compiler's performance rules (swing, looseness, velocities), analyse them back, and compare. Targets to start from, which you can recalibrate with evidence:
   - notes: onset and pitch F1 ≥ 0.98 per part;
   - harmony: chord label accuracy ≥ 0.95;
   - key: accuracy ≥ 0.98;
   - axes: mean absolute error ≤ 0.05.
2. **Round trip on real MIDI.** Compare the compiled IR against the quantised original: note F1 per part, the share of absolute-note escapes, the share of substituted chords.
3. **Annotated ground truth.** POP909 provides melody and chord annotations; score chord-root and quality accuracy and key accuracy against it. Use Groove MIDI to sanity-check the drum mapping and swing.
4. **Failure report.** Why files or bars were dropped, with counts and example file names.

Keep a small web viewer, or reuse the prototype's Score panel, that shows the original piano roll, the IR and the re-compiled piano roll side by side for one file. Eyeballing drives design decisions here.

## Rules

- **Don't change the grammar silently.** If the IR can't express something important, write it into `GRAMMAR-PROPOSALS.md`: the case, how often it occurred, a proposed syntax, and what it costs the compiler. Grammar changes land in `jambot-score` with tests, never as analyzer hacks.
- **Deterministic.** Same file in, same IR out. No randomness without a fixed seed.
- **Honest.** Every heuristic reports confidence, and low confidence is recorded, not rounded away. Better to drop a bar and say why than to emit a plausible lie.
- **Scale.** The full Lakh MIDI dataset should process in hours on a laptop, using worker processes, with resumable runs.
- **Tests.** Unit tests for each stage; golden tests for the score core; the closed-loop suite in CI.

## Milestones (stop and report after each)

1. `jambot-score` extracted, with golden tests passing against the prototype.
2. Closed synthetic loop running, with the first numbers.
3. One real file end to end, plus the viewer.
4. POP909 evaluation.
5. Lakh batch with the corpus summary: key and mode distribution, chord-vocabulary coverage, substitution counts, axis histograms.
6. Form segmentation.

For each milestone report what works, the metrics, what failed and why, and which grammar gaps the data revealed, ranked by frequency. Ask before making decisions that change the IR or the metric definitions.
