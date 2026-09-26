# Sister projects: input for the score language

2026-09-26. A read-only survey of three sister projects, with measurements
against the prototype and Strudel. It gathers input for the language design
(#7) and for Jambot in general. The actionable results are on the board;
this log keeps the reasons and the connections that are not tasks yet.

## Scope and method

- **Surveyed, read only:** [play-aeiou](https://github.com/yggi/play-aeiou),
  [lib-aeiou](https://github.com/yggi/lib-aeiou) and
  [quintenzirkel](https://github.com/yggi/quintenzirkel), each at its `main`
  on this date. flow3r-aeiou is mentioned in lib-aeiou but was not examined.
- **Measured, not just read:** the prototype's language functions
  (`parseMini`, `evalMini`, `parseRoman`, `resolvePitch`, `encodePitch`,
  `parseKey`) were cut out of `prototype/jambot-prototype.html` as they are
  and run in Node 22, next to `@strudel/mini` 1.2.5. The numbers below come
  from those runs. The scripts were throwaway, and each issue says enough to
  repeat its measurement.

## Results on the board

| Issue | What                                                                                                                                                             | Kind        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| #8    | Euclid `(k,n,rot)`: the prototype, play-aeiou and quintenzirkel agree on all 120 patterns with `k < n ≤ 16`; Strudel differs in 46 of them, always by a rotation | design      |
| #9    | `b3 b5 b6 b7 b9` parse as the absolute notes B3–B9, not as flat alterations                                                                                      | bug, design |
| #10   | `2 4 6` over `bIII bVI bVII iv` come from a neighbouring degree of the key, which gives B♮ over B♭ and similar clashes                                           | bug, design |
| #11   | Mini-notation conformance with Strudel: what is identical, what differs (`:`, `?`, `! _ . / \|`), and the AGPL question                                          | design      |
| #12   | Pitch model: key names and the silent fallback, modes, spelling, chord vocabulary, C4 = 60                                                                       | design      |

There are also comments on #2 (what the port has to pin before fixing),
#3 (theory helpers and a testing precedent for the analyzer) and #5
(play-aeiou's owner-counting fix for the same note-off bug).

## The three projects, musically

**play-aeiou** is a MIDI instrument on an Atom S3 (CircuitPython): a
keyboard in, synths out, with a chord processor, an arpeggiator, an LFSR
melody source and N-step tracks. It thinks in **pitch-class sets**: a scale
is a 12-bit mask, a mode is a rotation of it, and a mode's name is looked up
from its notes (`core/harmony.py`). Chords are semitone stacks, built per
note, plus `dia`, which stacks every other scale degree (`notes/chords.py`).
It has one global key, no progressions, no functions and no text score.

**lib-aeiou** is the pure-values layer shared by play-aeiou and
flow3r-aeiou: scales, snapping and note names (`aeiou_lib/harmony.py`). Its
boundary rule is _"values, never messages"_. Anything that needs an event
type becomes a written **contract** that each project implements for itself
(`docs/contracts/`). It targets CPython, CircuitPython and MicroPython at
once, and has a CI gate for that.

**quintenzirkel** is a single-file circle-of-fifths app with an improviser.
Its theory is **derived, not tabulated** (`docs/theory.md`): position
`7p mod 12` turns every chord and scale into a rigid shape that rotates when
transposed, and the seven modes are one arc ordered by brightness. It spells
notes by scale degree, with double accidentals where needed. The improviser
plays on a 16-step bar with Euclidean rhythm, motifs stored as steps, a key
timeline and twelve named style axes (`docs/instrument.md`).

**What none of them has:** Roman numerals, harmonic function,
progressions, secondary or borrowed chords, voice leading between chords, or
a text score. Jambot's harmony layer and its language have no prior art in
the family; they are Jambot's own contribution. None of the three mentions
Jambot, Strudel or TidalCycles.

## Ideas worth taking into the language

These are precedents from working code, not decisions. Where one would
change the score language, it goes through #7 first.

### Pitch as sets, modes as rotations

play-aeiou's masks and quintenzirkel's arc are two views of the prototype's
open thread `even(k, n, rot)`: the diatonic set is `even(7, 12)`, and its
modes are its rotations. play-aeiou shows the working form: `rotate(mask, k)`
and a lookup by pitch set gives the harmonic- and melodic-minor modes and the
pentatonic rotations at no extra cost. For Jambot this means the language
could name all seven church modes (#12), even though the composer's
transition tables cover four, and every chord–scale rule for #10 can be
written and tested as "a mask per chord".

quintenzirkel's two pivots are worth knowing when mode changes are designed
as transitions ("nothing jumps"). _Keep the notes_ slides the tonic one fifth
over the same seven notes, and _keep the tonic_ rotates the scale under a
fixed root. The prototype's `pivotRoot` implements the first, scored by
common tones.

### A motif is a shape

quintenzirkel: "a list of MIDI numbers is a transcription and a list of
steps is a memory." Its motifs are steps through the current pool of notes,
and every variation operator keeps the length: `same`, `transpose`,
`sequence` (+2, a third up), `invert`, `retro` and `fragment`
(`src/3-movement/instrument.js`, `VARY`). The Muse already stores motifs as
scale-degree steps, so this lines up directly with the open thread on named
motifs and transforms (`m1:inv`, `m1:seq+2`, `m1:cad`). quintenzirkel's
operator set is a tested first vocabulary for that syntax.

### Pitch and rhythm as separate streams

play-aeiou indexes a melody source by a **note counter**, not by position,
so "a 12-note melody over a 5-of-8 euclidean bar comes round every 96 steps"
(`docs/seq/tracks.md`, `docs/music/sources.md`). A Jambot line binds each
pitch to its rhythm slot. A motif transform that keeps the rhythm and changes
the pitches, or the reverse, needs the two separated. Strudel can express
both couplings: a pattern of values with `struct`, or values in the rhythm
string itself. This matters when motifs become named cells.

### The cycle is the musical fact

play-aeiou's tracks are "N steps over B beats": "the cycle length is the
musical fact (a bar, two bars); the steps are how finely it is cut". That
gives tuplets and polymeter without a second clock. It is also Strudel's
model, one cycle subdivided, and it bears on two of the prototype's language
threads: patterns over several bars (`/2`) and meters other than 4/4.

### Written and played are different records

In quintenzirkel each note carries `met`, where it was written in the bar,
separately from when it sounded, and the staff reads only `met`. The key has
a timeline "authored ahead, read off the clock": the key being written
(`GEN.key`) is not the key sounding (`state.tonic`). One lesson from there
applies to the analyzer and the HUD: _the key change belongs at the top of
the bar that will be written in it_. Stamped on the bar before, the log
reported 43% of notes outside the key when there were none. This is the same
split as Jambot's score text versus the compiler's performance, and it
supports keeping `key=` on the `bar` line.

### Folding at the edges

quintenzirkel folds a melody back at the ends of its register instead of
clamping it, because "a line that reaches the top of its register and stays
there is the one thing a walk must not do". The prototype learned the same
lesson ("nearest octave made melodies climb forever") and answered it with
home ranges. lib-aeiou's `snap_note` folds by octaves for a related reason:
a clamp can hand back a note that is not in the scale.

### Style axes: zero means strict

quintenzirkel's "0 is not off, 0 is strict": at zero, a player is the most
conventional player the machine can be, not an absent one. And _each axis
owns one statistic_. Its tests sweep one axis with the others held still and
assert the direction and size of that statistic's change, never exact
numbers. This is a ready method for the analyzer's `METRICS.md` and for the
critic's calibration (#3).

### Naming

quintenzirkel's law of true names (`docs/tools.md`) bans a bare general word
as a binding once it is shown doing three jobs. Its example is `key`: a
musical key, a Map key, a cache key, a piano key, a keyboard key, a record
field. `tests/repo-namespace.js` enforces it. Jambot's score core will hold
musical keys, map keys and drum keys side by side, so the port could adopt
the rule.

## Connections at system level

- **play-aeiou is a likely player at an event.** It is a MIDI instrument that
  joins a running clock instead of restarting it (`docs/seq/clock.md`). Its
  output reaches Jambot's Muse already transformed by chords, arpeggios or
  the LFSR. The prototype's provenance rule, where every event carries its
  source, then needs a way to say "an arpeggio of a held chord" rather than
  "a player mashing": the Muse rejects more than 12 notes per bar as
  mashing, and an arpeggiator at 1/16 produces exactly 16.
- **lib-aeiou's planned `sync.md` contract** (MIDI clock, start, continue,
  stop, song position, who is master, dropped clocks) is the same question
  as the root node's timing, from the instrument's side. Neither side has
  written it yet.
- **Shared conventions, not shared code.** The runtimes differ (TypeScript
  here, restricted Python there; lib-aeiou bans annotations, `typing` and
  most of the standard library), so no code can be shared. The facts that
  should stay aligned are C4 = 60, the Euclid form (#8), scale contents and
  names (lib-aeiou's `SCALE_NAMES` order is part of its contract), and the
  meaning of "mode k".
- **Contracts as a pattern.** lib-aeiou's split, _values in the library,
  events in contracts that each side implements_, is the same shape as
  Jambot's pure engine with its score text as the contract. It is a
  precedent for how a dough rendering node could relate to the root node.
- **Note-off bookkeeping** is solved in play-aeiou (owner counts per port,
  retrigger on a repeated NoteOn, "a NoteOff is answered by the decision its
  NoteOn got"). How that carries over to Jambot's timestamped scheduling is
  in #5.

## Testing precedents

- quintenzirkel imports its theory layer into plain Node with no DOM and
  checks invariants over every case, not samples: the position map inverts
  itself, every mode is seven adjacent positions, Euclid is maximally even
  for every `(k, n)` with `k ≤ n ≤ 16`. Spelling has golden strings such as
  E♭ harmonic minor = `E♭ F G♭ A♭ B♭ C♭ D`.
- lib-aeiou: _a gate that never fires is worse than no gate_. Its
  compatibility checker has its own tests, which feed it known-bad source.
- Both suggest the same for `packages/score`: exhaustive tables for the
  finite parts of the grammar (every Euclid pair, every interval token over
  every chord, every numeral in every mode) and a test for each checker that
  shows it can fail. The tests proposed in #8, #9 and #10 follow that shape.

## Open

- flow3r-aeiou was not examined. lib-aeiou describes it as a modular synth
  where "everything is CV", with no note-event layer.
- Whether Jambot targets Strudel as generated text or as a dialect package
  depends partly on the AGPL question in #11. That is not settled here.
