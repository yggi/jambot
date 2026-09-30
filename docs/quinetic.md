# Quinetic properties: round trips, fixed points and strange loops

The prototype keeps its self-reference as analogies, the "Quinetics parallels"
(`prototype/README.md`, "Open threads"): the loop from players to Muse to
composer and back, themes as fixed points that return, and the hierarchy from
step to song as coarse-graining. They stay speculative until something measures
them. This catalogue, the work of #39, turns each into a claim with a test, so
the quinetic side of Jambot is measured rather than asserted.

It is the second catalogue of the ratchet ([`ratchet.md`](ratchet.md), #41),
next to the language's negative shape ([`language.md`](language.md)). Where the
language catalogues what constrains the score, this one catalogues properties of
the whole system that no single pair of tracks owns: round trips across several
boundaries, the quine end to end, and delays on feedback loops.

## Form

Entries are in the `ratchet` skill's claim form
([`SKILL.md`](../.claude/skills/ratchet/SKILL.md)): a witness, the shape of a
counterexample, a decidable test, a source, a status and where it lands.

The ids are one space with `language.md`'s, so a test cites either catalogue's
ids in the same group: `(T4, Q1c)`. Where a property is a claim `language.md`
already makes, it is an **alias**, `Same as F4.`, with no status or test of its
own: the property is tracked once, and a test that cites the alias is checked
against the entry it names. The pawl check (`tooling/pawl.ts`) reads both
catalogues.

## The shape

At every layer boundary there is a map down and a map up, with **up ∘ down =
id** on the upper layer (a section and a retraction). Then **down ∘ up** is
idempotent, and its fixed points are the canonical forms (F3). Chained through
all the layers, a score, played and heard, writes itself: a quine. Each property
is either one link of that chain or a law about the machines that run it.

## Round trips (Q1–Q3, Q12)

**Q1a. Text and events round-trip: `compile(encode(e)) = e` for the composer's
events, and `encode ∘ compile` is idempotent on every text that parses,
takeovers included.** Witness: the prototype's encoder and compiler, exact over
about 6,000 events when both share the compiler's carried state (A1); in the
port, `encodeBar` and `compileBar` (`packages/score`), over the written layer
(`BarEnv` and `WrittenNote`, T4), so far the header, the style, the harmony and
the drums (L8). Counterexample: an event lost, added or changed on the way back,
or a text that a second pass rewrites. Compiled cold, the prototype gives the
first kind in 1,949 of 2,880 bars (E1). Test:
`prototype/experiments/cold-warm.mjs` for the prototype. For the port, in
`packages/score`: `seam.test.ts`, whose test of the round trip cites Q1a: 3,200
of the band's bars (five seeds, every preset held, the tour and the app's
glides, every mode the composer knows) are read back as written, and a second
pass writes the same text, now including every drum hit but the snare's;
`score.test.ts`, whose tests cite Q1a: every key of every diatonic mode, every
value of the style's grid, texts written another way, and a drum line, each
written in one form; `mini.test.ts`, whose tests cite Q1a: every placing of
chords on the 16 steps of a bar, 32,768, read back as written. Source: F3, A1.
Status: measured, failing (prototype, cold); measured (port: the header, the
harmony, and every drum sound but the snare); open (port: the snare, and the
pitch lines). Lands in: #13, #63.

**Q1b. Written and played time round-trip through swing: every written position
comes back from where it is played, at every swing.** Witness: `swingMap` and
`swingOf`, exact to 1e-12 on and off the grid. Counterexample: the prototype's
`swingDelay` read back by its `unswing`, 0.04 steps off at swing 0.75. Test:
`packages/engine/src/swing.test.ts`, whose tests of the inverse and of the
prototype's delays cite Q1b; `packages/engine/src/tempo.test.ts`, "stays in
order and invertible across beats that swing differently". Source: F3, T4, #37
step 2. Status: measured. Lands in: #37 (done).

**Q1c. Position and clock time round-trip through tempo glides: time rises with
position, and position comes back from time.** Witness: `tempoMap`, composed
after `swingOf`. Counterexample: seconds read as position × the step length
there, which runs backwards through a glide from 72 to 148 bpm. Test:
`packages/engine/src/tempo.test.ts`, whose tests of a glide's round trip, and
those under "position and clock time", cite Q1c; `transport.test.ts`, whose test
of reading onsets back through the steps as laid cites Q1c. Source: F3, T4, #37
step 3. Status: measured. Lands in: #37 (done), #23.

**Q1d. Events and MIDI round-trip: events sent as MIDI and read back are the
same events, and every note-on has its note-off.** Witness: none yet.
Counterexample: the prototype's stab note-offs, which cut sustained pad notes on
the chords channel (#5): on one channel, 15.6% of the port's pad time went
silent (E11). Pad and stab are now two parts, each its own channel (L6). Within
the stab part, 234 of 14,931 stabs start a step after a stab still ringing on
their note, so the MIDI writer counts note-offs per note, or the second stab
loses a step (E9, E11). Test: open: every preset's events through a MIDI writer
and reader. `band.test.ts`, whose test of each part as one voice cites Q1d,
holds where a part overlaps itself. Source: F3, L2, #5. Status: open. Lands in:
#24, #25.

**Q1e. Sound and score round-trip: the analyzer run on Jambot's own output gives
back the score it played from, up to the canonical form.** Witness: none yet;
the analyzer brief's closed loop. Counterexample: a bar the analyzer reads back
as another canonical text. Test: open: the analyzer over the presets and the
preset tour. Source: F3, the analyzer brief. Status: open. Lands in: #3.

**Q2. Analysis settles in one round.** Same as F4.

**Q3. The quine closes end to end, and a loss is pinned to its layer.** Witness:
none yet: score → compile → performance → MIDI → analyzer → score.
Counterexample: a bar that doesn't come back, with no single boundary (Q1a–Q1e)
that loses it. Test: open: over every preset and the preset tour, the fraction
that comes back exact at each boundary. Source: F3. Status: open. Lands in: #3,
#2.

**Q12. I got what you did there: a level hears a pattern from its memory under an operator, and what it answers, heard again, gives that pattern and that operator back.**
It is the quine at every level: what the band reads, it writes, and what it writes, read, is what it read, a fixed point of reading after playing.
Memory is half of it: to hear a pattern again, a level has to remember it (C9), and recognition is the read of C9's loop done against the memory rather than against nothing.
Repetition is the same shape with the player's own memory: a long rest ends a phrase, a motif heard again is confirmed, and a phrase heard again confirms the order of its parts.
The composer has it at three levels, and whether the performers have it too, a groove heard again as the same groove, is open.
Witness: the key, where `centre` finds the shift of the mode's scale that best lays it on the pitch classes heard, and a key held and played gives itself back where the harmony is rich (F3, E19); the motif, where `canonicalOp` finds the one operator from a motif to its answer (U5, Q5c), and a bar repeated is a symmetry of its phrase that it writes as no operator at all; the scale, where a descent heard after an ascent is the ascent under one operator on either tower (#150's rung 1, Q10); the phrase, which ends at an empty bar and not at a shorter rest (`readHeard`).
Counterexample: an answer that, heard again, gives another pattern or another operator; a repetition the reading doesn't hear as one.
The key is one where the harmony is thin: its chords don't sound what tells its neighbours apart, so a key held is read back as another in 1 to 6% of bars (E19).
Test: `key-loop.test.ts` (`packages/engine/experiments`), whose test of a key held and read back cites Q12; `motifs.test.ts` (`packages/theory`), whose tests of a repeated bar, of `recognise` and of `cellsOf` cite Q12: every motif of a 4-step cycle under every operator is heard as itself under the canonical operator, a repeat under none, and every pair of bars that join splits into its cells and their order and is rebuilt from them; `muse.test.ts`, whose tests of the Muse's memory cite Q12: a motif played again, by the same player or another, as it was or upside down, is heard as the one remembered, taken first, and held across bars against a motif heard once until it fades; `recognition.test.ts` (`packages/engine/experiments`), E20, whose tests cite Q12; `loop.test.ts` (`packages/engine/experiments`), E21, whose tests of the recognised share and the exact repeats cite Q12; `ladder.test.ts` (`packages/analyzer/experiments`), whose test of the descent cites Q12; `phrase.test.ts`, whose test of where a phrase ends cites Q12.
Recognition is exact today, so it is only as good as the reading under it: a loose hand's repeat is heard in 75% of patterns at 20 ms and 25% at 30 ms, as often as both playings are read right, and a variation the lead fitted to the chords is rarely an exact operator on its shape (E20).
What survives the round trip is what is recognised: with the Muse hearing the band's own lead and offering into it, the first motif she heard and confirmed plays back for the whole run on every other bar, and 84 to 94% of the lead's bars are heard as motifs she remembers, against 37 to 63% when her offer is not fed back (E21, Q7b).
Open: recognition with a tolerance, an operator but for a note, as E13 matches the lead, whose tolerance would be a licence (C8); the Muse hearing the band's answer in what plays, which E21 measures only in an experiment (#237 step 2); the performer's.
Source: #157 (seed 6, recognition), #210, the owner; Hofstadter, _Gödel, Escher, Bach_ (1979), the quine.
Status: measured (the key, where the harmony is rich); measured, failing (the key, where it is thin); measured (the motif's operator); measured (the scale); measured (a rest ends a phrase); measured (a repetition confirms a motif, #204 H8); measured (a phrase's cells and their order, #207 M1); measured, failing (a loose hand's repeat; a variation fitted to the chords); measured (what survives the round trip is what is recognised, the lead heard back, E21); speculative (the performer).
Decided: #210, ahead of the evidence: a long rest ends a phrase, repetition confirms a motif, and a phrase's repetition confirms the phrase order; a confirmed motif holds across bars against one heard once, while it is remembered (#235).
Lands in: #204, #207, #157, #158.

## A curriculum toward Q1e and Q3 (Q10)

Q1e and Q3 need the whole analyzer, including text it cannot write yet. A
curriculum measures what exists today without waiting: a ladder of MIDI the
engine itself generates, at rising complexity, disturbed by an external corpus
once it saturates. This is the ratchet applied to itself (`ratchet.md`, "the
same shape at every level"): the parser's own working track (a rung that passes)
and negative track (the next rung, chosen to be the smallest that can fail), at
the parser's own scale rather than the whole app's.

**Q10. A curriculum of engine-generated MIDI, of rising complexity, is recovered
exactly by the parser at every rung it has reached.** Witness: a generator per
rung (`packages/analyzer/experiments/ladder.ts`), each a function of the
engine's own machines into `RawMidi`, read back through `loadMidi` and checked
against what the generator asked for. The rungs: a metronome on 4/4; a scale up
and down, a quarter note each; a real melody (_Twinkle, Twinkle, Little Star_);
rhythmic patterns (the engine's own Euclidean and swung drums); multiple voices
together (the band's own bass, lead, chords and drums, through the performer,
#140); imitative polyphony (a Bach canon, chosen to break the register-only
bass/lead ranking in `roles.ts`, a parser robustness case — not a re-opening of
_Canon per tonos_ as a property, which stays "Not a property" below). Rung 1's
generator reads a scale's helix with its degree number as time (#157): note i
sounds on beat i at the scale's degree i, up one turn and back. Read back, the
descent is the ascent under one operator on either tower, `rev` on time or
`mirror.strans(7)` on pitch, and `canonicalOp` writes it on pitch; counted in
semitones rather than the key's degrees, the pitch mirror gives the descent in
dorian alone, the one diatonic mode that is its own mirror (U5). Counterexample:
a rung whose generated content the parser doesn't recover exactly, in role, grid
position, pitch, tempo or swing; a later rung that silently loses a guarantee an
earlier one held (the history gate already refuses this for the catalogue as a
whole). Test: `packages/analyzer/experiments/ladder.test.ts`, one description
per rung, citing Q10. Source: #141's continuation list, the analyzer brief's
evaluation section ("closed loop on synthetic music... the most important
test"). Status: measured (rung 0, a metronome on 4/4, exact role, grid, tempo
and swing over three tempos; rung 1, a scale up and down, exact role, grid,
pitch, tempo and swing in every key of every diatonic mode); open (a real
melody, rhythmic patterns, multiple voices, imitative polyphony); speculative
(the external-corpus disturbance, until a rung saturates and a corpus is chosen
— POP909, Groove MIDI, ASAP or Lakh, per the brief). Lands in: #141, #3, Q1e,
Q3.

## Machines (Q4–Q6)

**Q4a. Every level keeps the machine laws.** Same as F1.

**Q4b. Cold equals warm: a bar compiles from what it states as it did in the
run.** Same as S2.

**Q5a. Every level is one type, and a slower level's output is held as a faster
one's environment.** Witness: `Machine` at the section rate (`form`, and
`planner`, which writes each section's form, key and theme), the bar rate
(`band`) and the tick rate (`transport`). The band holds each section's plan for
its eight bars. It does so by carrying the planner's state, whose `before` is
the plan the planner last wrote, so what the band reads is the planner's output.
Counterexample: a level that needs its own laws, or reads a slower level's state
instead of its held output. The bass, the comp and the lead are each a `Machine`
at the bar rate, whose environment is the bar the band holds. Test:
`machine.test.ts`, the laws with a machine that breaks each; `plan.test.ts`,
"keeps the machine laws over a tour of the presets and their modes (F1, Q4a)";
`band.test.ts`, "holds each section for its eight bars (C3)" and "plays each
section's plan and its theme's chords, each decided when the bar before it is
composed (C3)", which checks every bar against the planner's output, and the
test of the parts citing Q5a, which checks each part's events and carried state
against the part's own machine run on the bar the band holds; `bass.test.ts`,
`comp.test.ts` and `lead.test.ts`, whose tests of the machine laws cite F1.
Open: the compiler, once it is a machine. Source: F1, C3, the law of recursion,
#37 step 5. Status: measured (form, planner, band, transport); measured (parts);
open (compiler). Lands in: #13.

**Q5b. Helices under `compose` are a category.** Same as F6.

**Q5c. The motif operators are a group acting on motifs: R∘R = id, I∘I = id, R∘I
= I∘R, and Tₐ∘T_b = Tₐ₊_b.** Witness: `motifs.ts`: the theory's T and I on two
axes, `strans` and `mirror` on pitch, `late` and `rev` on time, each chain of
them one operator `{ strans, mirror, late, rev }`, in the infinite dihedral
group on pitch times the dihedral group of the cycle (U5). `head` is not in the
group: it drops notes for a rest, and heads form a monoid beside it.
Counterexample: a motif on which a law fails, or two operators whose composition
acts otherwise than the one after the other. `head` gives the first kind for the
group: two motifs that differ in their last note share a head, so no operator
undoes it. Test: `motifs.test.ts`, whose tests cite Q5c: every pair of 48
operators on every one of the 525 motifs of a 4-step cycle, rests and
alterations included, and on each of them with its notes accented, the laws and
`undo`, `late` and `rev` as `shift` and `mirror` of the rhythm, and the heads'
laws. E13 measures how far the lead's variations are these operators: 96% of its
variation bars are the shape under one, but for the phrase's close and at most
one other note. Source: quintenzirkel's variation operators, Lewin's T and I, #7
(d). Status: measured. Lands in: #7 (d), decided as U4 and U5.

**Q6. Every feedback loop passes through a delay.** Same as F7.

## Convergence and fixed points (Q7–Q9, Q11)

**Q7a. Following the players is a loop with a bandwidth.** Same as A4.

**Q7b. A band that hears itself through lossy, fading, licensed round trips neither stalls nor repeats nor dissolves; it drifts recognisably.**
The prototype README predicts the opposite, that a band that hears itself stalls or oscillates, which is why its Listener merged into the Muse.
Witness: the key, whose loop already hears the band's own chords (E19): above entropy 0 it drifts, a walk bounded per step that ends as far from its opening key as a key drawn at random; at entropy 0 it stalls, never moving.
Counterexample: a band that hears itself and plays one pattern for good, swings between two, or keeps nothing it heard.
The motif is one: the Muse hearing the band's own lead, with no players, and offering into it (E21).
Closed, the loop recognises 84 to 94% of the lead's bars, against 37 to 63% deaf, 78 to 100% of them as exact repeats, and hears 0.4 to 1.2 new motifs a section, against 0.8 to 3.5.
It doesn't stall on one bar, but oscillates: in every run the first motif it heard plays back unchanged on every other bar and is the commonest, in 50 to 67% of its bars, its cadenced variants between; and it doesn't drift: 58 to 96% of the last section's motifs are heard as the first section's, against 0 to 63% deaf.
The two-bar delay (F7) splits the loop into two chains, the even bars feeding the even and the odd the odd, and a lead that plays the offer whole but for the cadence, which falls on odd bars, leaves the even chain copying itself, so the first motif is a fixed point whatever the entropy, with the Muse's hold or without it.
A lead that varies an offer on every bar, as it varies its own shapes, breaks the lock (E21's variants): the first motif is the commonest in 12.5% of runs, the last section heard as the first in 10.7%, A B A B in 11.4%, and it recognises 62.1% of its bars, against 52.1% deaf, half of them under an operator where deaf nearly all are exact repeats.
Test: `key-loop.test.ts` (`packages/engine/experiments`), E19, whose test of a key with no home to return to reads the drift; `loop.test.ts` (`packages/engine/experiments`), E21, whose tests cite Q7b: the recognised share, the exact repeats, the runs, the oscillation, the commonest motif and the return, closed and deaf, and whether the recognised share falls as the licence widens and the entropy rises; and its variants' tests, without the hold, and with the offer varied on a phrase's second and fourth bars or on every bar.
Open: the critic's style distance over time with the loop closed (#15); the Muse hearing every voice in what plays (#237 step 2).
Source: the prototype README; #237, the owner.
Status: measured (the key, above entropy 0, E19); measured, failing (the key, at entropy 0, E19); measured, failing (the lead heard back through the Muse, E21); measured (the lead varying every offer it hears, E21's variants).
Decided: #237, ahead of the evidence: the Muse hears every voice; composer, performers and Muse each keep a memory.
Lands in: #237, #15, #16.

**Q8. A theme is a fixed point that returns: the section machine writes the same
theme again while the style stays near it.** Witness: `plan`, the section
machine. An A or B theme comes back while the style stays near it, and is built
anew when the harmony has moved more than 0.2 from it, when the mode changes, or
at random, the more often the higher the entropy. Counterexample: a returning
theme that differs from its first while the style held, or one that returns
after the style has drifted. Test: `plan.test.ts`, whose theme-return tests cite
Q8. With a steady style and no entropy, a returning theme is exactly the same
plan. It is renewed in none of its returns at entropy 0, in 10–20% at 0.5 and in
25–35% at 1, over 200 seeds. The lead brings a theme's melody back with its
harmony: with a steady style and no entropy, each return plays the phrase it
played the first time (`lead.test.ts`, whose test of a theme's return cites Q8).
Source: the prototype's Quinetics parallels, #37 steps 4 and 5. Status: measured
(the plan); measured (the melody). Lands in: #63 step 3, where a theme's melody
is a named cell of the key frame.

**Q9. A wish settles: read again, it changes nothing.** Same as C6.

**Q11. Left alone, a level's default comes home in a cycle the level above plans, and strays from it as far as the freedom used allows.**
It may do either: a chord sequence begins and ends on its tonic, a longer part may go through a planned cycle of keys as a classical movement does, or the music may drift openly.
Which it does is the balance between the licence given (C8) and the freedom used, the entropy, and the composer and the performer read the same style and use it differently.
Witness: the harmony within a key, whose cycle the form plans: every A theme starts on the tonic, at every harmony, vamp or walk, while B themes and builds start elsewhere for contrast, and the form brings A back (Q8), so the chords come home each time the form does.
How a theme's last bar comes home, to the tonic or through its dominant, is not measured yet.
The key at entropy 0, which never leaves the key it opened in; the tempo, which remembers no nudge and so is always the style's own when none is held (C9).
Counterexample: a level that strays with nothing to bring it home.
The key above entropy 0 is one: the band moves it within its reach, leaning toward where it has been (C9), and no plan brings it round, since the style holds a reach per jump, not a cycle of keys.
Over 32 sections the key ends as far from where it opened as a key drawn at random round the circle, about 3 fifths, and back on it in at most 1 run in 10 (E19).
So at the key the balance has one side: the freedom used moves it, and nothing given plans its way back.
Test: `themes.test.ts`, whose test of the A theme's first chord cites Q11: every mode, 21 harmonies, three entropies and 20 seeds; `key-loop.test.ts` (`packages/engine/experiments`), E19, whose test of the key's drift cites Q11.
Source: #210 ("left alone, it plays an endless, evolving jam", `AGENTS.md`, as a claim about where the system settles); the owner, on #210.
Status: measured (the harmony within a key); measured (the key at entropy 0); measured, failing (the key above it).
Decided: #210, ahead of the evidence: a default comes home in a cycle the level above plans, or drifts, as the licence given and the freedom used balance.
Lands in: #210, #233 (a planned cycle of keys over the form, which the key does not have yet), #195.

## Not a property

Bach's _Canon per tonos_ rises a tone with each round and arrives back in its
key an octave higher. That is the helix itself: `shift` by 2 six times is
`shift` by 12, the same positions a turn higher. It illustrates, and needs no
test beyond the theory's.
