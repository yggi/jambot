# Language: the negative shape

Jambot plays from an internal musical expression (IM): whatever composer,
compiler, analyzer, renderers and later models all read and write. The
prototype's score text is one candidate for it, not the answer, and the
prototype calls it the IR: one letter away, and not the same thing. This doc is
the design work of #7.

The IM is looked for as a **negative shape**. Rather than drawing the language
and defending it, the design gathers the constraints and invariants that every
system around Jambot places on it, from the inside (the prototype, the theory,
the engine, the analyzer) and from the outside (Strudel, MIDI, dough, Pd,
LADSPA, Fourier analysis, signal processing, functional programming, category
theory). What is left when they are all satisfied is the language. Its syntax
comes last.

This catalogue is the negative track of a ratchet ([`ratchet.md`](ratchet.md)):
#37, the working shape of the app, and #3, the analyzer, are the working tracks
paired with it (#41). Findings from their steps come up into this catalogue, and
entries that bind code go down as tests in their next step. The properties that
no single pair owns, such as round trips across several boundaries, are
collected in [`quinetic.md`](quinetic.md) (#39, Q1–Q8).

## Method

1. **Probes.** Each system is a probe. The question for each is not "should
   Jambot look like this?" but "what does this system force, forbid or show to
   be possible?"
2. **Catalogue.** Every entry is a claim in the `ratchet` skill's form
   ([`SKILL.md`](../.claude/skills/ratchet/SKILL.md)): a witness that makes it
   true, the shape of a counterexample that would refute it, a decidable test, a
   source, a status and where it lands. The status is the evidence, one of
   speculative, open, derived and measured (or measured, failing), and it only
   rises. A rule the owner took is a separate field, `Decided: <where>, <how>`,
   which says whether it was inherited, dissolved, chosen on measured options,
   taken in the working track or chosen ahead of the evidence.
3. **Tensions.** Where two constraints pull apart, a decision is needed. The
   tensions are the design's agenda.
4. **Candidates.** Candidate forms are scored against the catalogue. None is
   chosen before the catalogue settles.

A test named here lives on `main`, unless the entry says otherwise. A test that
holds an entry cites its id in a group at the end of its description, such as
`(F6)` or `(T4, Q1c)`, and the entry names the test's file; it need not quote
the test, so the test's wording can change. Tests written before the catalogue
are named here by file and quoted description. The pawl check
(`tooling/pawl.ts`, #42) holds all of this in `pnpm verify`: every entry has a
status on the ladder, every file an entry names exists and every quote is a test
in it, a measured entry names a file, every cited id is defined once, and an
entry names the file of every test that cites it.

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

The catalogue is split by layer, so each file is read alone and follows #116's two towers.
An entry's id is unique across all of them and `quinetic.md`, and does not change when an entry moves between files.
The catalogues stay Jambot's as the language moves to [yggi/cells](https://github.com/yggi/cells): they are claims about Jambot's own score format and engine, with ids the pawl's tests cite, and a claim cells adopts gets a cells decision record that cites its id (yggi/music-commons#14, ruling 2).

| File                                             | What it holds                                                      | Entries        |
| ------------------------------------------------ | ------------------------------------------------------------------ | -------------- |
| [Time](language-time.md)                         | the clock, the grid, the meter, swing, written against played time | 20             |
| [Pitch](language-pitch.md)                       | the helix, keys, modes, chords, numerals, pitch tokens             | 10             |
| [State and change](language-state.md)            | what a bar carries, glides, trajectories, the style space          | 13             |
| [Surface](language-surface.md)                   | lowering to devices, readers and writers, the score text           | 18             |
| [Analysis and composition](language-analysis.md) | reading the music back, the Muse, composing a band                 | 14             |
| [Experiments](language-experiments.md)           | the probes that measured the entries                               | 26 experiments |
| [Quinetic properties](quinetic.md)               | properties no single layer owns (#39)                              |                |

## Tensions

These are where the decisions are.

1. **Random access against musical memory** (T5, S1, S2, F2). Voice leading,
   motifs that return and themes are memory, and memory is state. Either a bar
   means its events and the text writes register in (S2), or a bar means a step
   on the carried state and a snapshot reaches any bar (F2), or memory becomes
   named, written objects (motifs and themes as named cells, an open thread). E1
   and #37 steps 3 and 5 narrow it: the drums carry nothing, the bass and the
   comp carry register alone, and the lead carries a phrase and its themes'
   melodies, which reach its rhythm and pitch (S2). So the third option is
   already how the lead works.
2. **Discrete tokens against continuous change** (R2, C1). Glides are
   trajectories; the text is tokens sampled per bar.
3. **Relative against absolute** (P1, A2). Baseband needs a lock, and messy MIDI
   may have none. How much of real MIDI falls to the escape hatch is the
   analyzer's measurement.
4. **Conformance against Jambot's own choices** (L4). Euclid already differs
   from Strudel by a rotation (#8).
5. **Exact time against the device grid** (T2, T3).
6. **The lead sheet against the token stream** (R1, R2). If they conflict, one
   meaning can have two surfaces.
7. **Twelve against any cycle** (P5, L1).
8. **Expressive against metric accents** (A5). Whether a player's velocities
   follow the beat decides whether accents are counted from a level, as taken
   now, or from `perform`.
9. **One bar of 16 steps against a meter per bar** (T6, T7, T10, T11, T14). The
   theory holds every meter as a helix, and the song holds one, 4/4, read
   through its helix by every reader of bar and beat (T10), so a meter other
   than 4/4 changes them all at once. A key change keeps the cycle and a meter
   change need not: a song of changing meters reads as a row of helices joined
   at the running sums of their bars (T14), but nothing plays one yet, and swing
   still moves the pulses of every other meter (T11).

## Semantics before surface

The constraints split into two kinds: about meaning (time, pitch, change, state)
and about the surface (R1–R3, L4's syntax). Every probe keeps the two apart:
mini-notation is a surface over Strudel's patterns, a Pd file is a surface over
a graph, MIDI bytes are a surface over events. So the order of work is the
meaning first, then the surfaces: the score text for people, tokens for models,
the Strudel export, the HUD. Whether these are one surface or several is open.

This is denotational design (Elliott, "Denotational Design with Type Class
Morphisms", 2009): say first what a score denotes, then require that every
operator means the same operation on the meanings. The meaning of a combination
is the combination of the meanings. Strudel shows why the combination has to be
named: combining two patterns can take its structure from the left, the right or
both (Tidal's `|+`, `+|` and `|+|`), and each is a different law.

## Candidates

Shapes for the meaning, not syntax. They are not exclusive.

- **Per-bar score text**, as in the prototype: satisfies A1, R1–R3; fails T5 and
  S2, in register and tempo only (E1).
- **Patterns as functions of time**, as in Strudel: a pattern is queried over a
  span and returns events. Satisfies T2 and T5 by construction; memory
  (tension 1) is the hard part.
- **A dataflow graph**, as in Pd: the band as a patch, messages at control rate,
  trajectories at signal rate. Fits C1 and C3, and the loop from players to Muse
  to composer and back.
- **Fourier coordinates**: sets and patterns as spectra, with the discrete
  theory as the points inside. Likely a space for distances and style, not a
  notation (P4).
- **Machines all the way down**, as in #37: every level, the compiler included,
  is a Mealy machine, and a score is a program for them. It fits F1–F3 and F7,
  and snapshots give random access. How legible such a score is (R1) is the open
  part.

## Nomenclature

The law of true names asks for words that do one job. Functional programming and
category theory have exact words for most of Jambot's shapes, each with laws
that can be tested. This table records them; it renames nothing in the code.

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
| a default and the licence it leaves                    | a bound; a hold with a tolerance                      | C8                                                |
| the harmonic history, folded bar by bar                | a fading memory; an exponential moving average        | a time constant, 1 / (1 − decay) (C9, A4)         |
| the history's centre, `centre`                         | the memory's mode (an argmax): a lean                 | C9                                                |
| the band's own drift, `bandWish`                       | a draw by weight to a power: a lean                   | the centre as its limit (C9)                      |
| hold, fill, read, remember, lean                       | the homeostat (Ashby); a viable system (Beer)         | C9, Q11                                           |
| "I got what you did there"                             | recognition: a remembered pattern and its operator    | the quine at every level (Q12)                    |

## Strange loops

Each property here, with its test and status, is an entry in
[`quinetic.md`](quinetic.md) (#39).

Speculative. The prototype's "Quinetics parallels" keep self-reference, fixed
points and coarse-graining apart as analogies until something measures them. The
composition constraints turn parts of them into claims that can be tested:

- **Self-reference** is the feedback loop of F7. Whether it converges to a
  stable style or oscillates is A4, which the critic will measure.
- **The loop at every level** (#210) holds a default and a licence, reads the fill back up, remembers it fading, and leans the default toward the memory (C9).
  The key runs all five, and its bandwidth is A4's first measurement (E19).
  Left alone, it strays and has no planned cycle to bring it home, as the harmony within a key has (Q11).
- **Recognition**, "I got what you did there", is the quine at every level: a level hears a pattern from its memory under an operator, and what it answers, heard again, gives them back (Q12).
  Memory and recognition together are the shape the loop shares with the score's round trip: the key, the motif and the scale already have it, the Muse and the performers not yet.
- **Fixed points** are the canonical forms of F3: texts that the round trip
  gives back unchanged.
- **Coarse-graining** is the hierarchy of F1: each level holds its output for
  the level below, and the analyzer summarises upwards. The same machine type at
  every level is the law of recursion as a type.
- **A strange loop** in Hofstadter's sense (_Gödel, Escher, Bach_, 1979) moves
  through the levels of a hierarchy and arrives where it started. The Muse does
  that: the lowest level, notes played, changes the highest, the style that
  governs them.
- **Bach's _Canon per tonos_**, GEB's musical emblem, rises a tone with each
  round and arrives back in its key an octave higher. That is the helix itself:
  `shift` by 2 six times is `shift` by 12, the same positions one turn higher.

Still speculative: whether the loop with the players converges on a style (A4 for the style, Q7b).
Themes as fixed points that return are measured (Q8).
