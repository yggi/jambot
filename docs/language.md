# Language: the negative shape

Jambot plays from an internal musical expression (IM): whatever composer,
compiler, analyzer, renderers and later models all read and write. The
prototype's score text is one candidate for it, not the answer, and the
prototype calls it the IR: one letter away, and not the same thing. This doc
is the design work of #7.

The IM is looked for as a **negative shape**. Rather than drawing the
language and defending it, the design gathers the constraints and invariants
that every system around Jambot places on it, from the inside (the
prototype, the theory, the engine, the analyzer) and from the outside
(Strudel, MIDI, dough, Pd, LADSPA, Fourier analysis, signal processing,
functional programming, category theory). What is left when they are all
satisfied is the language. Its syntax comes last.

This catalogue is the negative track of a ratchet ([`ratchet.md`](ratchet.md)):
#37, the working shape of the app, and #3, the analyzer, are the working
tracks paired with it (#41). Findings from their steps come up into this
catalogue, and entries that bind code go down as tests in their next step.
The properties that no single pair owns, such as round trips across several
boundaries, are collected in [`quinetic.md`](quinetic.md) (#39, Q1–Q8).

## Method

1. **Probes.** Each system is a probe. The question for each is not "should
   Jambot look like this?" but "what does this system force, forbid or show
   to be possible?"
2. **Catalogue.** Every entry is a claim in the `ratchet` skill's form
   ([`SKILL.md`](../.claude/skills/ratchet/SKILL.md)): a witness that makes
   it true, the shape of a counterexample that would refute it, a decidable
   test, a source, a status and where it lands. Its status is one of
   speculative, open, measured (or measured, failing), derived and decided,
   and it only rises.
3. **Tensions.** Where two constraints pull apart, a decision is needed. The
   tensions are the design's agenda.
4. **Candidates.** Candidate forms are scored against the catalogue. None is
   chosen before the catalogue settles.

A test named here lives on `main`, unless the entry says otherwise. A test
that holds an entry cites its id in a group at the end of its description,
such as `(F6)` or `(T4, Q1c)`, and the entry names the test's file; it
need not quote the test, so the test's wording can change. Tests written
before the catalogue are named here by file and quoted description. The
pawl check (`tooling/pawl.ts`, #42) holds all of this in `pnpm verify`: every
entry has a status on the ladder, every file an entry names exists and every
quote is a test in it, a measured entry names a file, every cited id is
defined once, and an entry names the file of every test that cites it.

## Probes

| Probe                       | What it is                                                      | What it bears on                                             |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| Prototype                   | The score text, its compiler and the round trip                 | Everything; it is the baseline                               |
| `packages/theory`           | `even(k, n, shift)`, the helix and its operations               | Pitch and rhythm as one object                               |
| Strudel, mini-notation      | Patterns as functions of time, queried over a span              | Time, random access, the export target (#11)                 |
| dough                       | Flat key/value event messages at the bottom                     | What the lowest layer carries                                |
| MIDI                        | Note on/off, 7-bit values, channels, a 24 ppqn clock            | Lossy lowering, note-off bookkeeping, the time grid          |
| Pure Data                   | Dataflow patches; control rate and signal rate; logical time    | Continuous change, rates, the band as a graph                |
| LADSPA                      | A plugin is its declared ports, each with range and scale hints | Parameters, renderer interfaces, realtime capability         |
| Fourier (DFT on Z_n)        | Pitch-class sets and rhythms as spectra                         | A continuous space around the discrete theory                |
| SDR, signal analysis        | Carriers, baseband, clock recovery, squelch, multirate          | Relative pitch, following players, confidence                |
| Analyzer (#3), models (#14) | Messy MIDI in; small models reading and writing tokens          | Totality, grammar size, provenance                           |
| Functional programming      | Haskore and Euterpea, FRP and arrows, Tidal's pattern monads    | Composition laws, state, streams                             |
| Category theory             | Coalgebra, Lewin's transformations, the paracyclic category     | Nomenclature, and laws that can be tested                    |
| _Gödel, Escher, Bach_       | Strange loops, quines, canons                                   | The self-reference the project is built around (speculative) |

## Catalogue

### Time

**T1. The clock never waits: every advance finishes in bounded time, and
nothing plays late.**
Witness: the transport, which advances from the head to now + 120 ms and
drops what a stall made it miss.
Counterexample: a stall after which events play late, or the grid moves.
Test: `transport.test.ts`, "never waits: after a stall it drops what it
missed and keeps the grid where it was" and "catches up after four
hours’ stall within a lookahead, reporting the missed steps by count". Open
for compiling: every text that parses compiles, in bounded time.
Source: spirit, #37 step 3. Status: measured (transport); open (compile).
Lands in: #13.

**T2. Positions are exact fractions of a cycle, not ticks.**
Witness: none yet; the port counts steps in floating point.
Counterexample: a triplet or quintuplet whose position changes on a round
trip.
Test: open: triplets and quintuplets round-trip exactly through `compile`
and `encode`.
Source: Strudel (rational time), play-aeiou ("N steps over B beats").
Status: open. Lands in: #13.

**T3. The MIDI clock is a lossy grid, so quantising happens only when
lowering.**
Witness: 24 ppqn gives 96 ticks to a 4/4 bar: a 16th step is 6 ticks and a
triplet 8th is 8.
Counterexample: a quintuplet 16th, at 19.2 ticks.
Test: open (E5): which rhythms of a corpus fall off the 96 ticks of a bar.
Source: MIDI. Status: derived. Lands in: #27.

**T4. Written time and played time are separate, joined by time maps with
exact inverses.**
Witness: `swingMap`, `swingOf` and `tempoMap`, composed by
`composeTimeMaps`. Expressive timing would be one more map, not new syntax.
Counterexample: a written position that doesn't read back from its played
time. The prototype's `swingDelay` and `unswing` give one: they are off by
up to 0.04 steps where both swing levels act (swing 0.5–1).
Test: `swing.test.ts`, "is undone by its inverse, both ways, on and off the
grid" and "shows that the prototype's delays are not what its unswing
undoes"; `tempo.test.ts`, "keeps time rising through a tempo glide, and
gives each position back from its time", and the four tests under
"position and clock time" that cite (T4, Q1c): tempo glides from rest
between the axis ends and every preset tempo at every length, 60 chains of
retargets that carry their slope, brake or arrive early, the chain through
swing, and a reading of clock time that runs backwards.
Source: time maps (Jaffe, "Ensemble Timing in Computer Music", 1985;
Honing, "From Time to Time", 2001), #37 step 2. Status: measured. Lands in:
#37 (done), Q1b and Q1c.

**T5. Any bar renders from its environment (seed, position, style, plan)
and what it states.**
Witness: the drums, a function of the bar's environment that carries
nothing; randomness keyed by seed, position and a named stream.
Counterexample: a bar that plays differently from the same environment and
text. The prototype's score gives 1,949 (S1).
Test: `drums.test.ts`, "are a function of the bar: the same environment
plays the same bar"; `random.test.ts`, "is a pure function of seed and
keys". Open for the pitched parts.
Source: Strudel's query model, spirit. Status: measured (drums); measured,
failing (the prototype's score, E1). Lands in: #37 step 5.

### State

**S1. The prototype's score is not self-contained.**
Witness: a bar whose text alone compiles to other events than the run
played.
Counterexample: a run in which every bar compiles cold as it did warm.
Test: `prototype/experiments/cold-warm.mjs` (E1): 1,949 of 2,880 bars (68%)
and 8,976 of 86,911 events (10%) differ, always in register (the octave of
a bass or lead note, a chord's voicing), never in harmony or rhythm. 357
bars (12%) voice the next bar's chord through `nx`, which reads the plan.
During the tour's glides the tempo played is up to 8.6 BPM off the bar's
`bpm=`.
Source: the prototype's compiler, which reads `S.cs[part].prev`,
`S.prevVoicing` and the next bar's plan, and its tempo glides in `S.tr`.
Status: measured. Lands in: Q4b.

**S2. Whatever a bar reads from before it is written at the bar, as a key
frame.**
Witness: none yet. A key frame would hold register (an entry pitch per
melodic part and the voicing), the next chord where `nx` is used, and the
tempo trajectory. It never needs random state, since every draw names its
stream.
Counterexample: a bar that compiles differently cold and warm.
Test: `cold-warm.mjs`, which fails on the prototype today; the port's
version lands with the pitched parts.
Source: T5, S1, `random.test.ts` ("names every stream with its own id").
Status: measured, failing (prototype). Lands in: #37 step 5, #13.

### Change

**C1. Nothing jumps: a change is a glide from where the value is, as fast
as it was moving.**
Witness: `glideTo` in `style.ts`: a glide (from, to, start, length) on an
S-curve, which carries the running glide's value and rate.
Counterexample: a new glide that starts from rest or from another value.
Test: `style.test.ts`, "nothing jumps: a new glide starts from where the
running one is, and as fast, on every axis".
Source: spirit, Pd's `line~`. Status: measured (style axes); open (how the
IM writes a glide, tension 2). Lands in: #37 (done), #13.

**C2. A parameter declares its range and the space it glides in.**
Witness: the style axes in `style.ts`, each with a range and a linear or
logarithmic space; tempo glides in log space.
Counterexample: a glide whose midpoint is not the midpoint of its space.
The prototype glides every axis linearly.
Test: `style.test.ts`, "have their ranges and the space they glide in" and
"passes the midpoint of its space halfway: the mean, or for tempo the
geometric mean" (104 bpm halfway from 60 to 180).
Source: LADSPA port hints. Status: measured (style axes); open (the `sound`
parameters, E2). Lands in: #24.

**C3. Each value lives at one rate, the slowest at which it is constant,
and a slower level's output is held as a faster one's environment.**
Witness: the port's rates: the section kind per section (`form`), the style
for composing per bar (`band`), swing per beat (`swingOf`), tempo per step
(`tempoMap`), scheduling per tick (`transport`, 25 ms). The band holds each
section for its eight bars.
Counterexample: a value read at two rates that disagree, such as the
prototype's tempo, which plays per step and is written once per bar (S1).
Test: `band.test.ts`, "holds each section for its eight bars";
`tempo.test.ts`, "swings each beat by the swing where the beat starts".
Source: Pd's control and signal rates, multirate signal processing, #37
step 3. Status: measured (port); open (the rates the IM writes). Lands in:
#13.

### Pitch

**P1. Pitch is relative: to the chord, the chord to the key; only compiled
events are absolute.**
Witness: the prototype's score language.
Counterexample: a score whose meaning changes under transposition other
than by the transposition.
Test: open: every bar of a corpus, compiled in two keys, differs by the
interval between them.
Source: prototype; in signal terms the key is the carrier and the score is
baseband. Status: decided. Lands in: #13.

**P2. The text carries no spelling; spelling is output only.**
Witness: `spell`, used for the HUD, the Strudel export and the analyzer's
key report, never to read a score.
Counterexample: two spellings of one score that compile differently.
Source: #7 after #33, #35. Status: decided.

**P3. Scales and rhythms are one object, the helix.**
Witness: `Helix` and `even(k, n, shift)`: 7 of 12 is the diatonic set, and
5 of 16 the prototype's rim pattern.
Test: `even.test.ts`, "gives the diatonic set, the prototype rim pattern and
the #8 example".
Source: #28. Status: decided.

**P4. Maximal evenness is a Fourier maximum.**
Witness: `even(k, n)`.
Counterexample: a k-subset of n with a larger |F_k|, or an equal one that
is not a shift of `even(k, n)`.
Test: `even.test.ts`, "have the largest k-th magnitude of any k of n, and
only their shifts reach it: every 1 ≤ k < n ≤ 16 (P4)", over every subset.
|F_j| is unchanged by `shift` (a phase) and `mirror` (a conjugate), so the
magnitudes are coordinates in which the theory's sets are points, and the
phases carry position; for pitch sets, the phase of F_5 is a place on the
circle of fifths (Amiot, _Music Through Fourier Space_, 2016).
Source: Fourier. Status: measured. Open: a distance for "nothing jumps"
between chords, scales and rhythms, and key tracking as the phase of F_5
(E4).

**P5. No pitch token assumes 12 notes to the cycle.**
Witness: none yet; the helix takes any cycle, MIDI takes 12.
Counterexample: a token whose meaning uses 12.
Test: open: every token over a helix of cycle 19 or 31.
Source: #28, the open threads (tunings other than 12). Status: open.

**P6. A chord is a helix of one turn plus its tensions, the tones above the
octave; together they are its stack.**
Witness: every quality's stack split at the octave. A ninth chord is its
seventh plus a tension, so "a chord is a helix" holds for what a helix can
hold, and the ninth is named for what it does.
Counterexample: a quality whose tones below the octave are not a helix, or
whose parts don't join back into its stack.
Test: `chords.test.ts`, "split at the octave into a helix and the tones
above it, and join back: every quality (#38, P6)", all 20 qualities.
Source: #37 step 1, #38. Status: decided. Lands in: #37 step 4, the chord
type.

**P7. A tension sets its own degree of the scale its chord's helix
implies.**
Witness: the seventh's `chordScale` with degree 1 set to the ninth: a scale
in all 102 of the 144 ninths (3 qualities, 12 roots, the prototype's 4
modes) whose seventh has one. So a ninth has a scale exactly where its
seventh has one, and a V9 of a minor degree keeps its natural 9: V9/ii in C
takes A mixolydian ♭13.
Counterexample: a chord whose tension's scale is not a scale, or a nearer
scale that holds the chord.
Test: `keys.test.ts`, whose test of a ninth's scale cites P7. `chordScale`,
which still searches five-note stacks, agrees in 89, finds a scale one note
farther in 3 and none in 10.
Source: #38. Status: decided; measured, failing (chordScale, 13 of 144).
Lands in: #37 step 4, where `chordScale` takes the chord type.

**P8. The baseline hears a chord only as pitch classes: register above the
octave is read only for names.**
Witness: the prototype's 13 reads of a chord's intervals, each taken mod 12,
placed at the nearest octave, or used for a name.
Counterexample: a bar whose events change when every ninth folds to its
second.
Test: open: run the prototype headless, as E1 does, with every 14 folded
to 2, and compare the events.
Source: #38. Status: open.

### Lowering

**L1. The bottom is flat: timestamped events, as MIDI and dough carry.**
Source: architecture. Status: decided.

**L2. The IM states written lengths; a played duration is derived.**
Witness: the transport sends both ends of a note through the time map
(`tempo ∘ swing`), so a note is an interval of written time.
Counterexample: a legato line that overlaps or gaps under swing, as in the
prototype, which swings only the start.
Test: `transport.test.ts`, "holds a note from its swung start to its swung
end". Open: every note-on has its note-off on the MIDI port (#5, Q1d).
Source: MIDI (no durations), #37 step 3. Status: measured (the port's
lengths); open (note-offs). Lands in: #24.

**L3. A renderer sees only its declared parameters and its event stream.**
Source: the prototype README, LADSPA. Status: derived.

**L4. Strudel is a target: the shared mini-notation behaves identically,
and Strudel is not a dependency.**
Witness: none on `main`. #11's survey ran the prototype's mini-notation
against `@strudel/mini`: sequence, `[ ]`, `@`, `*`, `< >`, `,` and `~`
agree; `: ? ! _ . / |` and Euclid differ. Strudel is AGPL-3.0-or-later.
Counterexample: a pattern both read that plays differently.
Test: open: a conformance corpus (#11).
Source: #11. Status: open. Lands in: #11.

**L5. A stage declares whether it can run on the clock; a model cannot.**
Source: LADSPA's hard-realtime flag, the roadmap. Status: decided.

### Readers and writers

**R1. A musician reads it like a lead sheet.** Source: spirit. Status:
decided. Test: open.

**R2. A small model writes it: shallow nesting, a small vocabulary,
relative tokens, no arithmetic across tokens, a grammar constrained
decoding can enforce.** Source: the prototype README. Status: decided.

**R3. The unit of editing is a line, which validates on its own.** Source:
the prototype's takeovers. Status: decided.

**R4. A word in the score names one thing.**
Witness: the port names the prototype's `shift` section a bridge, because
`shift` is the theory's transposition and a candidate motif operator:
`bar 12 shift` would read as an operation.
Counterexample: a score word with two meanings.
Test: `form.test.ts`, "has six kinds of section, eight bars each".
Source: the law of true names, #37 step 3. Status: decided.

### Analysis and provenance

**A1. The round trip from the composer's events through the text and back
is exact.**
Witness: the prototype's encoder and compiler.
Counterexample: an event missing, added or changed after the round trip.
Test: the prototype's run over about 6,000 events (`prototype/README.md`,
"Tested"); no test in this repository reruns it yet. E1 adds that it holds
only warm.
Source: prototype. Status: measured (in the prototype). Lands in: #13, Q1a.

**A2. Every MIDI input has an IM, with an escape hatch where the grammar
can't say it.**
Witness: the analyzer. Counterexample: one MIDI file.
Test: open: the analyzer's corpus, with gaps logged by frequency.
Source: analyzer brief. Status: decided. Lands in: #3.

**A3. Every event carries its source, and inferred structure its
confidence.**
Source: prototype, SDR (the Muse's gate works like a squelch). Status:
decided (provenance); open (confidence). Lands in: #3, #25.

**A4. Following the players is a loop with a bandwidth.**
Source: SDR (clock recovery), the Muse's rate limit. Status: speculative.
Lands in: #16, #25, #27, Q7a.

### Composition

These come from the engine's contract (#37), the score's round trip (#13),
functional programming and category theory. Their names are in
[Nomenclature](#nomenclature).

**F1. Every level is a Mealy machine, `advance(env, carried, input) →
{ carried', output }`, that keeps the machine laws.**
Witness: `Machine` and `lawBreaks` (`machine.ts`); the form (section rate),
the band (bar rate) and the transport (tick rate). A run is a causal stream
function: output n depends only on inputs up to n (Rutten, "Universal
Coalgebra", 2000).
Counterexample: a machine that keeps state out of sight, changes what it
was given, or can't resume from a JSON snapshot.
Test: `machine.test.ts` (each law, with a machine that breaks it);
`form.test.ts`, `band.test.ts` and `transport.test.ts`, whose tests of the
machine laws cite F1.
Source: #37 step 1. Status: measured. Lands in: Q4a.

**F2. The compiler is a machine too, carrying what the composer carries.**
Witness: the prototype's compiler carries each part's previous pitch and
the chord voicing (E1), which is the state #37's composer machines carry.
Counterexample: compiler state the composer doesn't carry.
Test: `cold-warm.mjs`, which resets exactly that state.
Source: E1, #37. Status: measured. Open: whether a bar means its events,
with register written in (S2), or a step on the carried state, reached
through a snapshot (tension 1). Lands in: #13.

**F3. Every layer boundary is a round trip: up ∘ down = id on the upper
layer, so down ∘ up is idempotent and its fixed points are the canonical
forms.**
Witness: per boundary, a section and a retraction:

- written and played time: `swingMap` and `tempoMap` with their inverses
  (T4);
- events and text: `encode` and `compile` (A1), with the canonical texts as
  the fixed points of `encode ∘ compile`;
- sound and score: the analyzer run on Jambot's own output.

Chained, a score, played and heard, writes itself: a quine.
Counterexample: a value that doesn't come back through a boundary. The
prototype's swing gives one (T4).
Test: `swing.test.ts` and `tempo.test.ts`, as for T4 (time); open for text
(#13) and sound (#3).
Source: #13, #37. Status: measured (time); open (text, sound). Lands in:
Q1a–Q1e and Q3.

**F4. Analysis settles in one round: `encode(compile(encode(x))) =
encode(x)`.**
Witness: the analyzer. Counterexample: a MIDI file whose analysis changes
on a second pass.
Test: open: the analyzer's corpus.
Source: F3. Status: open. Lands in: #3, Q2.

**F5. Within a part, events combine as a join: the same hit twice is one
hit, and the louder stays. Bars combine in sequence by a shift of origin.**
Witness: the drums, which strike each sound at most once per step. The
events are bar-relative, and pitch is chord-relative in the same way:
relative coordinates whose origin the level above supplies (Lewin's
generalized interval systems).
Counterexample: a duplicate note-on. The prototype sends one in 163 of
2,560 bars, on every preset (`docs/prototype.md`).
Test: `drums.test.ts`, "strike each sound at most once per step, in order".
Open: the pitched parts, and #5's pad and stab overlap.
Source: #37 step 3, Hudak's algebra of polymorphic temporal media (2004).
Status: measured (drums). Lands in: #37 step 5.

**F6. Helices under `compose` are a category.**
Witness: `compose`, with the chromatic helix as the identity. It is how a
note nests in a chord in a key, and a step in a beat in a bar.
Counterexample: a chain of three helices whose composites differ by
bracketing, or a helix changed by the identity.
Test: `helix.test.ts`, "is a category: associative over every chain of even
helices with n ≤ 12, and the chromatic helix is the identity (F6, Q5b)",
over 659,594 chains, each helix at every shift below its cycle.
Source: `docs/theory.md` ("Composition"). Status: measured.

**F7. Every feedback loop passes through a delay.**
Witness: none yet; in the prototype the Muse judges a bar after it ends and
plays a motif back two bars later. Pd refuses a signal loop without a delay
for the same reason.
Counterexample: a wiring of machines with a delay-free cycle.
Test: open: a check over the wiring, with a wiring it rejects.
Source: F1, Pd. Status: derived. Lands in: #25, Q6.

**F8. The jam is an infinite stream, made one position at a time.**
Witness: the transport, whose every advance is bounded (T1). "The clock
never waits" is productivity.
Source: F1, T1. Status: derived.

## Tensions

These are where the decisions are.

1. **Random access against musical memory** (T5, S1, S2, F2). Voice
   leading, motifs that return and themes are memory, and memory is state.
   Either a bar means its events and the text writes register in (S2), or a
   bar means a step on the carried state and a snapshot reaches any bar
   (F2), or memory becomes named, written objects (motifs and themes as
   named cells, an open thread). E1 and #37 step 3 narrow it: the drums
   carry nothing, the band's carried state is one section, and the memory
   that reaches the events is register alone.
2. **Discrete tokens against continuous change** (R2, C1). Glides are
   trajectories; the text is tokens sampled per bar.
3. **Relative against absolute** (P1, A2). Baseband needs a lock, and messy
   MIDI may have none. How much of real MIDI falls to the escape hatch is the
   analyzer's measurement.
4. **Conformance against Jambot's own choices** (L4). Euclid already
   differs from Strudel by a rotation (#8).
5. **Exact time against the device grid** (T2, T3).
6. **The lead sheet against the token stream** (R1, R2). If they conflict,
   one meaning can have two surfaces.
7. **Twelve against any cycle** (P5, L1).

## Semantics before surface

The constraints split into two kinds: about meaning (time, pitch, change,
state) and about the surface (R1–R3, L4's syntax). Every probe keeps the
two apart: mini-notation is a surface over Strudel's patterns, a Pd file is
a surface over a graph, MIDI bytes are a surface over events. So the order
of work is the meaning first, then the surfaces: the score text for people,
tokens for models, the Strudel export, the HUD. Whether these are one
surface or several is open.

This is denotational design (Elliott, "Denotational Design with Type Class
Morphisms", 2009): say first what a score denotes, then require that every
operator means the same operation on the meanings. The meaning of a
combination is the combination of the meanings. Strudel shows why the
combination has to be named: combining two patterns can take its structure
from the left, the right or both (Tidal's `|+`, `+|` and `|+|`), and each
is a different law.

## Candidates

Shapes for the meaning, not syntax. They are not exclusive.

- **Per-bar score text**, as in the prototype: satisfies A1, R1–R3; fails
  T5 and S2, in register and tempo only (E1).
- **Patterns as functions of time**, as in Strudel: a pattern is queried
  over a span and returns events. Satisfies T2 and T5 by construction;
  memory (tension 1) is the hard part.
- **A dataflow graph**, as in Pd: the band as a patch, messages at control
  rate, trajectories at signal rate. Fits C1 and C3, and the loop from
  players to Muse to composer and back.
- **Fourier coordinates**: sets and patterns as spectra, with the discrete
  theory as the points inside. Likely a space for distances and style, not
  a notation (P4).
- **Machines all the way down**, as in #37: every level, the compiler
  included, is a Mealy machine, and a score is a program for them. It fits
  F1–F3 and F7, and snapshots give random access. How legible such a score
  is (R1) is the open part.

## Nomenclature

The law of true names asks for words that do one job. Functional
programming and category theory have exact words for most of Jambot's
shapes, each with laws that can be tested. This table records them; it
renames nothing in the code.

| In Jambot                                              | Name                                                  | What it brings                                    |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| a level (part, bar, section)                           | Mealy machine; a coalgebra                            | the laws of F1                                    |
| `env`                                                  | environment (the reader)                              | read, never carried                               |
| `carried`                                              | state                                                 | a snapshot is a resume point and a key frame (S2) |
| output events                                          | log (the writer); a monoid                            | parts side by side, bars in sequence (F5)         |
| a run over a script                                    | causal stream function                                | output n depends on inputs up to n                |
| a slower level's output as a faster level's `env`      | a hold: one value for many positions                  | the rates of C3                                   |
| the analyzer's summary of a bar                        | coarse-graining                                       | the inverse direction of a hold                   |
| players → Muse → composer → players                    | feedback (a trace), guarded by a delay                | F7                                                |
| `compile`, `encode`                                    | retraction and section                                | F3                                                |
| canonical text                                         | fixed point of `encode ∘ compile`                     | F3                                                |
| score → sound → score                                  | a quine                                               | F3                                                |
| helix, `compose`                                       | arrow and composition in a category                   | F6                                                |
| `shift`, `mirror`                                      | T and I, the dihedral group acting on helices         | transformational theory (Lewin, 1987)             |
| "layers refer upward"                                  | relative coordinates, the origin given from above     | F5                                                |
| quintenzirkel's `same transpose sequence invert retro` | identity, T, T on degrees, I, R (retrograde, on time) | a group acting on motifs; laws such as R∘R = id   |
| a glide                                                | a path in style space                                 | C1                                                |

## Strange loops

Each property here, with its test and status, is an entry in
[`quinetic.md`](quinetic.md) (#39).

Speculative. The prototype's "Quinetics parallels" keep self-reference,
fixed points and coarse-graining apart as analogies until something
measures them. The composition constraints turn parts of them into claims
that can be tested:

- **Self-reference** is the feedback loop of F7. Whether it converges to a
  stable style or oscillates is A4, which the critic will measure.
- **Fixed points** are the canonical forms of F3: texts that the round trip
  gives back unchanged.
- **Coarse-graining** is the hierarchy of F1: each level holds its output
  for the level below, and the analyzer summarises upwards. The same machine
  type at every level is the law of recursion as a type.
- **A strange loop** in Hofstadter's sense (_Gödel, Escher, Bach_, 1979)
  moves through the levels of a hierarchy and arrives where it started. The
  Muse does that: the lowest level, notes played, changes the highest, the
  style that governs them.
- **Bach's _Canon per tonos_**, GEB's musical emblem, rises a tone with
  each round and arrives back in its key an octave higher. That is the helix
  itself: `shift` by 2 six times is `shift` by 12, the same positions one
  turn higher.

Still speculative: themes as fixed points that return, and whether the loop
with the players converges.

## Experiments

Each answers one entry. E1 has run; the others have not.

- **E1. Cold against warm compile** (S1, S2, F2, Q4b), in
  [`prototype/experiments/cold-warm.mjs`](../prototype/experiments/cold-warm.mjs)
  (`node prototype/experiments/cold-warm.mjs`, about 3 s). It runs the
  prototype headless for 64 bars in each of the eight presets and in a tour
  that changes preset every 8 bars, with five seeds each, and compiles every
  bar twice: warm, as it plays, and cold, from its text with the compiler's
  history reset.
  - 1,949 of 2,880 bars (68%) compile differently, and 8,976 of 86,911
    events (10%). By preset, from 37% (Funk) to 83% (Lo-fi hip hop, Swing
    jazz). The first bar of a run always agrees, because cold is the start
    state.
  - Every difference is register only: in every differing bar the pitch
    classes, times, lengths and velocities agree, and only the octave of a
    bass or lead note or the voicing of a chord changes. Chords and pads
    differ in 1,326 bars, the lead in 678, the bass in 657.
  - Every bar writes its own `harm` and `key=`, so harmony is
    self-contained. 357 bars (12%) use `nx`, which reads the next bar's
    plan.
  - With a steady preset, `bpm=` is exact. During the tour's glides the
    tempo that plays is up to 8.6 BPM off the bar's `bpm=`, and a bar lasts
    up to 135 ms longer or shorter than its `bpm=` says.
  - No cold compile raised an error.
- **E2. Parameter inventory** (C2): the style axes have their ranges and
  glide spaces in `style.ts`; the `sound` parameters remain.
- **E3. Strudel coverage** (L4, #11): each preset's bars written in
  Strudel, with what can't be said.
- **E4. Spectra of the presets** (P4): |F_j| of every drum and bass pattern
  across the eight presets, and whether a style axis follows a coefficient.
- **E5. The clock grid** (T3): which rhythms in the corpus fall off the 96
  ticks of a bar.
- **E6. Loop bandwidth** (A4): tempo following under simulated human
  jitter. It waits on #16, #25 and #27.
- **E7. The round trips** (F3, F4): for each boundary, up ∘ down against
  the identity, and the idempotence of down ∘ up. The time boundaries are
  measured (T4); the text boundary waits on #13, and the analyzer boundary
  on #3. All are entries in [`quinetic.md`](quinetic.md), with the other quinetic
  properties.

The open decisions on #7, (a) to (d), are about meaning, and each is checked
against this catalogue as it is made.
