# Quinetic properties: round trips, fixed points and strange loops

The prototype keeps its self-reference as analogies, the "Quinetics
parallels" (`prototype/README.md`, "Open threads"): the loop from players to
Muse to composer and back, themes as fixed points that return, and the
hierarchy from step to song as coarse-graining. They stay speculative until
something measures them. This catalogue, the work of #39, turns each into a
claim with a test, so the quinetic side of Jambot is measured rather than
asserted.

It is the second catalogue of the ratchet ([`ratchet.md`](ratchet.md), #41),
next to the language's negative shape ([`language.md`](language.md)). Where
the language catalogues what constrains the score, this one catalogues
properties of the whole system that no single pair of tracks owns: round
trips across several boundaries, the quine end to end, and delays on
feedback loops.

## Form

Entries are in the `ratchet` skill's claim form
([`SKILL.md`](../.claude/skills/ratchet/SKILL.md)): a witness, the shape of a
counterexample, a decidable test, a source, a status and where it lands.

The ids are one space with `language.md`'s, so a test cites either
catalogue's ids in the same group: `(T4, Q1c)`. Where a property is a claim
`language.md` already makes, it is an **alias**, `Same as F4.`, with no
status or test of its own: the property is tracked once, and a test that
cites the alias is checked against the entry it names. The pawl check
(`tooling/pawl.ts`) reads both catalogues.

## The shape

At every layer boundary there is a map down and a map up, with
**up ∘ down = id** on the upper layer (a section and a retraction). Then
**down ∘ up** is idempotent, and its fixed points are the canonical forms
(F3). Chained through all the layers, a score, played and heard, writes
itself: a quine. Each property is either one link of that chain or a law
about the machines that run it.

## Round trips (Q1–Q3)

**Q1a. Text and events round-trip: `compile(encode(e)) = e` for the
composer's events, and `encode ∘ compile` is idempotent on every text that
parses, takeovers included.**
Witness: the prototype's encoder and compiler, exact over about 6,000
events when both share the compiler's carried state (A1).
Counterexample: an event lost, added or changed on the way back, or a text
that a second pass rewrites. Compiled cold, the prototype gives the first
kind in 1,949 of 2,880 bars (E1).
Test: `prototype/experiments/cold-warm.mjs` for the prototype; open for the
port.
Source: F3, A1. Status: measured, failing (prototype, cold); open (port).
Lands in: #13.

**Q1b. Written and played time round-trip through swing: every written
position comes back from where it is played, at every swing.**
Witness: `swingMap` and `swingOf`, exact to 1e-12 on and off the grid.
Counterexample: the prototype's `swingDelay` read back by its `unswing`,
0.04 steps off at swing 0.75.
Test: `swing.test.ts`, whose tests of the inverse and of the prototype's
delays cite Q1b; `tempo.test.ts`, "stays in order and invertible across
beats that swing differently".
Source: F3, T4, #37 step 2. Status: measured. Lands in: #37 (done).

**Q1c. Position and clock time round-trip through tempo glides: time rises
with position, and position comes back from time.**
Witness: `tempoMap`, composed after `swingOf`.
Counterexample: seconds read as position × the step length there, which
runs backwards through a glide from 72 to 148 bpm.
Test: `tempo.test.ts`, whose tests of a glide's round trip, and those under
"position and clock time", cite Q1c.
Source: F3, T4, #37 step 3. Status: measured. Lands in: #37 (done), #23.

**Q1d. Events and MIDI round-trip: events sent as MIDI and read back are
the same events, and every note-on has its note-off.**
Witness: none yet.
Counterexample: the prototype's stab note-offs, which cut sustained pad
notes on the chords channel (#5).
Test: open: every preset's events through a MIDI writer and reader.
Source: F3, L2, #5. Status: open. Lands in: #24, #25.

**Q1e. Sound and score round-trip: the analyzer run on Jambot's own output
gives back the score it played from, up to the canonical form.**
Witness: none yet; the analyzer brief's closed loop.
Counterexample: a bar the analyzer reads back as another canonical text.
Test: open: the analyzer over the presets and the preset tour.
Source: F3, the analyzer brief. Status: open. Lands in: #3.

**Q2. Analysis settles in one round.** Same as F4.

**Q3. The quine closes end to end, and a loss is pinned to its layer.**
Witness: none yet: score → compile → performance → MIDI → analyzer → score.
Counterexample: a bar that doesn't come back, with no single boundary
(Q1a–Q1e) that loses it.
Test: open: over every preset and the preset tour, the fraction that comes
back exact at each boundary.
Source: F3. Status: open. Lands in: #3, #2.

## Machines (Q4–Q6)

**Q4a. Every level keeps the machine laws.** Same as F1.

**Q4b. Cold equals warm: a bar compiles from what it states as it did in
the run.** Same as S2.

**Q5a. Every level is one type, and a slower level's output is held as a
faster one's environment.**
Witness: `Machine` at the section rate (`form`, and `planner`, which writes
each section's form, key and theme), the bar rate (`band`) and the tick
rate (`transport`). The band holds each section's plan for its eight bars.
It does so by carrying the planner's state, whose `before` is the plan the
planner last wrote, so what the band reads is the planner's output.
Counterexample: a level that needs its own laws, or reads a slower level's
state instead of its held output.
Test: `machine.test.ts`, the laws with a machine that breaks each;
`plan.test.ts`, "keeps the machine laws over a tour of the presets and their
modes (F1, Q4a)"; `band.test.ts`, "holds each section for its eight bars (C3)"
and "plays each section's plan: its key, and its theme's chords bar by bar,
changing only at a boundary (C3)", which checks every bar against the
planner's output. Open: the parts and the compiler, once each is a machine.
Source: F1, C3, the law of recursion. Status: measured (form, planner, band,
transport); open (parts, compiler). Lands in: #37 step 5, #13.

**Q5b. Helices under `compose` are a category.** Same as F6.

**Q5c. The motif operators are a group acting on motifs: R∘R = id,
I∘I = id, R∘I = I∘R, and Tₐ∘T_b = Tₐ₊_b.**
Witness: none yet; the operators wait on #7's decision (d).
Counterexample: a motif in the corpus on which a law fails.
Test: open: every law over every motif in a corpus.
Source: quintenzirkel's variation operators, Lewin's T and I. Status: open.
Lands in: #7 (d).

**Q6. Every feedback loop passes through a delay.** Same as F7.

## Convergence and fixed points (Q7–Q9)

**Q7a. Following the players is a loop with a bandwidth.** Same as A4.

**Q7b. A band that hears itself stalls or oscillates.**
Witness: none yet. The prototype README predicts it, which is why the
Listener merged into the Muse.
Counterexample: the band's output fed into the Muse, with a style that
neither stalls nor oscillates.
Test: open: the critic's style distance over time, with the loop closed.
Source: the prototype README. Status: speculative. Lands in: #15, #16.

**Q8. A theme is a fixed point that returns: the section machine writes the
same theme again while the style stays near it.**
Witness: `plan`, the section machine. An A or B theme comes back while the
style stays near it, and is built anew when the harmony has moved more than
0.2 from it, when the mode changes, or at random, the more often the higher
the entropy.
Counterexample: a returning theme that differs from its first while the
style held, or one that returns after the style has drifted.
Test: `plan.test.ts`, whose theme-return tests cite Q8. With a steady style
and no entropy, a returning theme is exactly the same plan. It is renewed
in none of its returns at entropy 0, in 10–20% at 0.5 and in 25–35% at 1,
over 200 seeds. Open: whether a return is a fixed point in more than name,
such as the melody coming back with its harmony (#37 step 5).
Source: the prototype's Quinetics parallels, #37 step 4. Status: measured
(the plan); speculative (fixed point). Lands in: #37 step 5.

**Q9. A wish settles: read again, it changes nothing.** Same as C6.

## Not a property

Bach's _Canon per tonos_ rises a tone with each round and arrives back in
its key an octave higher. That is the helix itself: `shift` by 2 six times
is `shift` by 12, the same positions a turn higher. It illustrates, and
needs no test beyond the theory's.
