# Language: analysis and composition

The catalogue of what reads the music back (analysis, provenance, the Muse) and of how parts compose into a band.
The frame, the method and the tensions are in [`language.md`](language.md); the experiments are in [`language-experiments.md`](language-experiments.md).

## Analysis and provenance

**A1. The round trip from the composer's events through the text and back is
exact.** Witness: the prototype's encoder and compiler; in the port, `encodeBar`
and `compileBar` (`packages/score`), so far for the header, the style, the
harmony and the drums (L8). Counterexample: an event missing, added or changed
after the round trip. Test: the prototype's run over about 6,000 events
(`prototype/README.md`, "Tested"), which no test in this repository reruns; E1
adds that it holds only warm. `seam.test.ts` (`packages/score`), whose test of
the round trip cites A1: every one of 3,200 of the port's bars is read back as
it was written. Source: prototype. Status: measured (in the prototype); measured
(the port's header, harmony and drums, but the snare); open (the port's pitch
lines). Lands in: #13, Q1a.

**A2. Every MIDI input has an IM, with an escape hatch where the grammar can't
say it.** Witness: the analyzer. Counterexample: one MIDI file. Test: open: the
analyzer's corpus, with gaps logged by frequency. Source: analyzer brief.
Status: open. Decided: the analyzer brief, inherited. Lands in: #3.

**A3. Every event carries its source, and inferred structure its confidence.**
Witness: the Muse's judgement (`muse.ts`): every note heard carries its source,
each source's bar is judged on its own and the judgement names it, and the band
takes the motif the reading is surest of, then the one with the most notes, the
first to arrive on a tie. In a session
(`packages/session`), a source is a player's id and the instrument
(`playerSource`): a client's id is the one the lobby gave its link, which it
can't choose, so two players are never one source, whatever they are called.
Names are for people to read (`sourceName`), and a host refuses one already in
the session, the host's own included, in any case. Counterexample: a judgement
that names no source, or two sources' notes judged as one, such as one player's
chord heard as the top of another's melody, or two players heard as one because
they share a name. Test: `muse.test.ts`, whose tests of sources cite A3;
`apps/web/src/session/session.test.ts`, whose tests of players cite A3: a
client's judgement reaches the host's Muse by the client's id and reads by its
name, and a name already in the session is refused. Confidence is the reading's
own (`confidence` on a motif's judgement, the mean of how near each note sits to
the place it was read on, E17); the prototype's source with the most notes, which
stood in for it, let a player who plays 12 notes in every bar, the most that
isn't mashing, win every bar, whoever else played. Open: whether the most notes
should count at all beside the confidence, and what the confidence is worth
against real players. Source: prototype, SDR
(the Muse's gate works like a squelch). Status: measured (the Muse's sources);
open (confidence). Decided: the prototype, inherited (provenance). Lands in: #3,
#25, #79, #16.

**A4. Following the players is a loop with a bandwidth.**
Witness: the key's loop (C9), which follows the players' key wishes and the band's own chords through a fading memory: its bandwidth is three numbers, a time constant, a gain and a bound.
The time constant is `timeConstant(HISTORY_DECAY)`, about 6.7 bars, less than the 8 bars a key is held for; a reading held every bar settles at itself times it.
The bound is the style's reach, per jump (C8).
The gain of the centre, an argmax, is all or nothing: the centre follows a new key 1.2 to 3.9 bars into its section, or not by its end (E19).
Counterexample: a loop that runs away (a gain above 1: each reading moves the default further than the one before), or one that never settles on a reading held.
Test: `fading.test.ts`, whose test of a held reading cites A4; `key-loop.test.ts` (`packages/engine/experiments`), E19, whose tests of the time constant, the bound and the centre's lag cite A4.
Source: SDR (clock recovery), the Muse's rate limit; #210.
Status: measured (the key, E19); speculative (the style, following the players' own, #16).
Lands in: #16, #25, #27, #79 (following the style), #210, Q7a.

**A5. A player's velocities are expressive, not metric: where a note falls in
the beat explains little of how loud it is played.** Witness: none yet.
Counterexample: played melodies loud on the beat and soft off it, as `perform`
plays the lead. Then the metric part is performance (T4), and an accent is
counted from `perform`, not from the player's level (U4). Test: open: over
performed melodies (POP909's, then the Muse's own captures once they are
logged), the share of each bar's velocity variance that the beat class explains.
Source: #84, #79. Status: open. Lands in: #3 (which loads POP909), #79.

**A6. A file's ticks round-trip through the parser's tempo map, and a written
step round-trips through grid quantisation once its 4/4 section's swing is
found.** Witness: `ticksTimeMap` (`packages/analyzer/src/tempo.ts`), whose
`played` and `written` are built as one section/retraction pair per tempo
segment, the same shape as the engine's own time maps (T4); and
`estimateSwing`/`readOnsets` (`packages/engine/src/reading.ts`, which
`quantiseSection` in `packages/analyzer/src/swing.ts` calls, and the Muse reads
a phrase with), which search the swing axis (`swingMap`) for the value whose
inverse leaves a section's onsets closest to the step grid, then round. Counterexample: a tick
whose `written(played(tick))` differs from itself across a tempo change; a bar
written at a known swing whose recovered step differs from the one it was
written at. Test: `packages/analyzer/src/tempo.test.ts` (the round trip, across
three tempo segments, and anchored by the earliest tempo event regardless of
array order) and `packages/analyzer/src/swing.test.ts` (recovers every named
swing across a bar tour, in both onbeat and offbeat positions);
`packages/analyzer/src/smf.test.ts` (the same, through real Standard MIDI File
bytes, `parseSmf`, `midi-file`). Source: #141, analyzer brief
(`docs/briefs/analyzer.md`) steps 1–2. Status: measured (the parser's tempo map
and 4/4 grid quantisation, on synthetic input, and through real SMF bytes); open
(real-world MIDI files' content, other meters, #3 steps 4–8). Lands in: #3, F4,
Q1e.

## Composition

These come from the engine's contract (#37), the score's round trip (#13),
functional programming and category theory. Their names are in
[Nomenclature](#nomenclature).

**F1. Every level is a Mealy machine,
`advance(env, carried, input) → { carried', output }`, that keeps the machine
laws.** Witness: `Machine` and `lawBreaks` (`machine.ts`); the form and the
section plan (section rate), the band and its bass, comp and lead, and the Muse
(bar rate), the transport (tick rate), and a client's reading of its host's
clock (`hostClock`, per ping). A run is a causal stream function: output n
depends only on inputs up to n (Rutten, "Universal Coalgebra", 2000).
Counterexample: a machine that keeps state out of sight, changes what it was
given, or can't resume from a JSON snapshot. Test: `machine.test.ts` (each law,
with a machine that breaks it); `form.test.ts`, `band.test.ts`,
`transport.test.ts`, `plan.test.ts`, `bass.test.ts`, `comp.test.ts`,
`lead.test.ts`, `muse.test.ts` and `clock.test.ts`. Source: #37 step 1.
Status: measured. Decided: #37 step 1, in the working track. Lands in: Q4a.

**F2. The compiler is a machine too, carrying what the composer carries.**
Witness: the prototype's compiler carries each part's previous pitch and the
chord voicing (E1), which is the state #37's composer machines carry.
Counterexample: compiler state the composer doesn't carry. Test:
`cold-warm.mjs`, which resets exactly that state. Source: E1, #37. Status:
measured. Open: whether a bar means its events, with register written in (S2),
or a step on the carried state, reached through a snapshot (tension 1). Lands
in: #13.

**F3. Every layer boundary is a round trip: up ∘ down = id on the upper layer,
so down ∘ up is idempotent and its fixed points are the canonical forms.**
Witness: per boundary, a section and a retraction:

- written and played time: `swingMap` and `tempoMap` with their inverses (T4);
- events and text: `encodeBar` and `compileBar` (A1), with the canonical texts
  as the fixed points of `encodeBar ∘ compileBar`;
- sound and score: the analyzer run on Jambot's own output;
- a motif and what an operator makes of it: `canonicalOp` writes each result
  with one operator, a fixed point (U5);
- a key and the harmony: the band's chords down, and the harmonic history's
  centre up (C9), which gives a key held a section back where the harmony
  is rich, but not always where it is thin (E19).

Chained, a score, played and heard, writes itself: a quine. Counterexample: a
value that doesn't come back through a boundary. The prototype's swing gives one
(T4). Test: `packages/engine/src/swing.test.ts` and
`packages/engine/src/tempo.test.ts`, as for T4 (time); `motifs.test.ts`, whose
test of the canonical operator cites F3 (motifs); `mini.test.ts` and
`score.test.ts` (`packages/score`), whose tests of the written form cite F3: a
text written another way (fields in another order, a key spelled another way,
`.6` for `0.6`, weights not in lowest terms) is written in one form, which a
second pass leaves as it is (text); open for the parts' lines (#63) and sound
(#3); `key-loop.test.ts` (`packages/engine/experiments`), E19, whose test of a
key held cites F3 (the key).
The key's counterexample is the fill's, not the read's: the read gives every
key back from its whole scale (`packages/engine/src/history.test.ts`), and the
chords of a thin harmony don't sound the notes that tell neighbouring keys
apart. Whether the round trip may lose there is #157's call, a lossy round trip
that returns one structure (#158). Source: #13, #37. Status: measured (time);
measured (motifs); measured (text: the header and harmony); measured, failing
(the key, where the harmony is thin); open (text: the parts' lines; sound).
Lands in: Q1a–Q1e and Q3, #158.

**F4. Analysis settles in one round: `encode(compile(encode(x))) = encode(x)`.**
Witness: the analyzer. Counterexample: a MIDI file whose analysis changes on a
second pass. Test: open: the analyzer's corpus. Source: F3. Status: open. Lands
in: #3, Q2.

**F5. Within a part, events combine as a join: the same hit twice is one hit,
and the louder stays. Bars combine in sequence by a shift of origin.** Witness:
the drums, which write one hit per sound and step: where two roles meet, the
stronger role's, which the performance plays louder (T4). The events are
bar-relative, and pitch is chord-relative in the same way: relative coordinates
whose origin the level above supplies (Lewin's generalized interval systems).
Counterexample: a duplicate note-on. The prototype sends one in 163 of 2,560
bars, on every preset (`docs/prototype.md`). Test: `drums.test.ts`, "strike each
sound at most once per step, in order (F5)"; `band.test.ts`, "plays each note at
most once per step in every part, over a tour of the presets (F5)". Open: the
louder staying in the pitched parts, which never strike a note twice, and a note
started while the same note of its part still sounds, as a stab a step after a
stab (L6, Q1d). Source: #37 step 3, Hudak's algebra of polymorphic temporal
media (2004). Status: measured (drums); measured (every part's note-ons). Lands
in: Q1d.

**F6. Helices under `compose` are a category.** Witness: `compose`, with the
chromatic helix as the identity. It is how a note nests in a chord in a key, and
a step in a beat in a bar. Counterexample: a chain of three helices whose
composites differ by bracketing, or a helix changed by the identity. Test:
`helix.test.ts`, "is a category: associative over every chain of even helices
with n ≤ 12, and the chromatic helix is the identity (F6, Q5b)", over 659,594
chains, each helix at every shift below its cycle. Source: `docs/theory.md`
("Composition"). Status: measured.

**F7. Every feedback loop passes through a delay.** Witness: two loops. The
players' key wish: the players hear the key and wish for another; the wish
enters the band as its environment, not its state, and the band reads it only at
a section boundary (C5, C6), so the loop is delayed by the rest of a section and
a beat. The Muse (#79): notes played arrive at the transport as input, the Muse
judges a bar as the band composes the bar after next (`LISTEN_DELAY`), and its
offer enters the band as its environment, so a motif heard in bar k plays from
bar k + 2, as in the prototype. The Muse's loop crosses the network in host
mode: a client's ear judges bar k a beat after it ends (`EAR_AFTER`) and sends
the judgement; one that arrives after the host's Muse heard bar k is dropped,
and says so, so no bar changes sooner and a replay stays exact. Pd refuses a
signal loop without a delay for the same reason. Counterexample: a wiring of
machines with a delay-free cycle, or a wish heard inside the section it was sent
in; a note played in a bar that changes that bar or the next. Test:
`player.test.ts`, "hears a preset's mode from the next section on, and shows the
chords (C5)", for the key wish; `transport.test.ts`, whose test of a motif
played back cites F7: notes in bar k leave every bar before k + 2 as it was, and
bar k + 2 plays the motif. A wiring that judges a bar as the next is composed, a
delay of one bar, fails it. Its tests of a judgement from elsewhere, taken for
bar k + 2 or dropped as late, cite F7 too; and
`packages/session/src/session.test.ts`, whose tests of a client's motif over the
link cite F7: at 60, 108 and 180 bpm, over a one-way delay of half
`CLOCK.tooFar` and a tick, the host's bar k + 2 plays it, and a slower way back
drops it as late. An ear that waits 12 steps, not 4, fails it. Source: F1, Pd,
#37 step 4, #79 step 3. Status: derived; measured (the key wish); measured (the
Muse's loop). Lands in: #79, Q6.

**F8. The jam is an infinite stream, made one position at a time.** Witness: the
transport, whose every advance is bounded (T1). "The clock never waits" is
productivity. Source: F1, T1. Status: derived.
