# Language: pitch

The catalogue of the pitch tower: the helix, keys, modes, chords, numerals and the pitch tokens.
The frame, the method and the tensions are in [`language.md`](language.md); the experiments are in [`language-experiments.md`](language-experiments.md).

**P1. Pitch is relative: to the chord, the chord to the key; only compiled
events are absolute.** Witness: the prototype's score language. Counterexample:
a score whose meaning changes under transposition other than by the
transposition. Test: open: every bar of a corpus, compiled in two keys, differs
by the interval between them. Source: prototype; in signal terms the key is the
carrier and the score is baseband. Status: open. Decided: the prototype,
inherited. Lands in: #13.

**P2. The text carries no spelling; spelling is output only.** Witness: `spell`,
used for the HUD, the Strudel export and the analyzer's key report, never to
read a score. The engine carries keys and chords as heights and spells them only
to name them (`keyName`, `chordName`). Counterexample: two spellings of one
score that compile differently. Test: `key.test.ts`, "names each key by its
tonic, spelled in the key, and its mode (P2)";
`packages/engine/src/chords.test.ts`, "are named as lead sheets name them,
spelled in their key (P2)". Source: #7 after #33, #35, #37 step 4. Status:
measured. Decided: #7 after #33, dissolved.

**P3. Scales and rhythms are one object, the helix.** Witness: `Helix` and
`even(k, n, shift)`: 7 of 12 is the diatonic set, and 5 of 16 the prototype's
rim pattern. Test: `even.test.ts`, "gives the diatonic set, the prototype rim
pattern and the #8 example". Source: #28. Status: measured. Decided: #28,
inherited.

**P4. Maximal evenness is a Fourier maximum.** Witness: `even(k, n)`.
Counterexample: a k-subset of n with a larger |F_k|, or an equal one that is not
a shift of `even(k, n)`. Test: `even.test.ts`, "have the largest k-th magnitude
of any k of n, and only their shifts reach it: every 1 ≤ k < n ≤ 16 (P4)", over
every subset. |F_j| is unchanged by `shift` (a phase) and `mirror` (a
conjugate), so the magnitudes are coordinates in which the theory's sets are
points, and the phases carry position; for pitch sets, the phase of F_5 is a
place on the circle of fifths (Amiot, _Music Through Fourier Space_, 2016).
Source: Fourier. Status: measured. Open: a distance for "nothing jumps" between
chords, scales and rhythms, and key tracking as the phase of F_5 (E4).

**P5. No pitch token assumes 12 notes to the cycle.** Witness: the numerals
(U1): a key is any helix of seven degrees, `b` and `#` move a degree by the
key's chromatic step, its larger step less its smaller (1 in 12 and 19, 2 in 17
and 31, 3 in 22, 5 in 53), and a secondary's key is a mode of the key's own set.
The helix takes any cycle, and splits a chord at a turn of it (P6). The engine
and MIDI stay in 12 (L1): the claim binds the score's tokens, not the notes they
compile to. Counterexample: a token whose meaning uses 12. The numerals read an
accidental as one step and a secondary's key as a diatonic mode of 12, so from
17 notes on they failed: in 19 every secondary, in 17, 22, 31 and 53 about 80%
(E12). Test: `numerals.test.ts`, "read every numeral over any cycle whose
diatonic set is a chain of fifths, as the line of fifths spells it, and write
each chord back (P5, U1)": 93 numerals × 13 tonics × 7 modes in 12, 17, 19, 22,
31 and 53, against the line of fifths. A line's pitch tokens (U2) are the same
arithmetic as a numeral's, `alteredHeight` (`numerals.ts`), so they reach every
pitch a numeral does: measured over the key's own scale (#130). Open: over a
chord's implied scale for anything but a diatonic chord, since that scale is
`chordScale`'s (P9, P10), whose borrowed and secondary candidates assume 12
notes (P10's counterexample). Source: #28, the open threads (tunings other than
12), #7 round 3, E12; #130. Status: measured (the numerals, and a line's tokens
over the key's own scale); open (a line's tokens over a chord's implied scale,
outside a diatonic chord). Decided: #7, on measured options (E12). Lands in:
#63; #130.

**P6. A chord is a helix of one turn plus its tensions, the tones above the
octave; together they are its stack.** Witness: `splitChord` and `joinChord` in
`chords.ts`, the theory's `Chord` type: a rising stack splits at one turn above
its root into the helix below and the tensions above, and joins back. A ninth
chord is its seventh plus a tension, so "a chord is a helix" holds for what a
helix can hold, and the ninth is named for what it does. The split is at a turn
of the helix's own cycle, so it assumes no 12 (P5). Counterexample: a quality
whose tones below the octave are not a helix, or whose parts don't join back
into its stack. A stack that doesn't rise, such as `0 4 14 7`, is no chord.
Test: `packages/theory/src/chords.test.ts`, "split at the octave into a helix
and the tones above it, and join back: every quality on every root (#38, P6)",
"are no chord where the stack does not rise: nothing to split (#38, P6)" and
"split at a turn of any cycle, not at 12: stacked thirds of 7 above their turn
(#38, P6)"; the engine's chords, `packages/engine/src/chords.test.ts`, "are one
per slot, on its step, each a helix and its tensions (P6)" and "are triads up to
harmony 0.25, all sevenths from 0.75, and add a major ninth only above 0.75
(P6)". Source: #37 step 1, #38. Status: measured. Decided: #38, on measured
options. Lands in: #37 step 4 (done: the engine's chords are `Chord`s).

**P7. A tension sets its own degree of the scale its chord's helix implies.**
Witness: `chordScale`, which takes the scale the helix implies and lets each
tension set the nearest degree the helix doesn't sound. A ninth sets degree 1,
so a ninth has a scale exactly where its seventh has one: 102 of the 144 ninths
(3 qualities, 12 roots, the prototype's 4 modes), each a named scale (mixolydian
25, aeolian 18, lydian 18, dorian 18, ionian 14, mixolydian ♭6 9). A V9 of a
minor degree keeps its natural 9: V9/ii in C takes A mixolydian ♭13. A tension
that would put the degrees out of order gives no scale, as a major 7th over C7
does, and so does one on a degree another tension has set, as the ♯9 of G7♭9♯9
would lose its ♭9. Counterexample: a ninth whose scale is not its seventh's with
degree 1 set, or is no named scale. A nearer scale than the helix's is a
counterexample to the helix's scale, not to the tension's degree, and is filed
there (P9). Test: `keys.test.ts`, "gives a ninth its seventh's scale with degree
1 set to the ninth, and a named scale every time: 102 of 144 (#38, P7)", "keeps
the natural 9 of a V9 of a minor degree: V9/ii in C takes A mixolydian ♭13 (#38,
P7)" and "lets each tension set the nearest degree its chord does not sound, and
gives no scale where that breaks the scale (#38, P7)";
`packages/engine/src/chords.test.ts`, "each imply a scale in their key, so the
composer never needs to state one (P7, P9)". Against the search over five-note
stacks it replaced, 10 more ninths have a scale and 3 have one a note nearer.
Source: #38. Status: measured. Decided: #38, on measured options. Lands in: #37
step 4 (done in the theory), #7 (b).

**P8. The baseline hears a chord only as pitch classes: register above the
octave is read only for names.** Witness: the prototype's 13 reads of a chord's
intervals, each taken mod 12, placed at the nearest octave, or used for a name.
Counterexample: a bar whose events change when every ninth folds to its second.
Test: open: run the prototype headless, as E1 does, with every 14 folded to 2,
and compare the events. Source: #38. Status: open.

**P9. A chord's helix implies the scale nearest the key among `chordScale`'s
candidates, which is not the nearest named scale that holds it.** Witness:
`chordScale`'s candidates, nearest first: the key, its parallel diatonic modes,
the key a dominant points to, then harmonic and melodic minor on the tonic.
Counterexample: a named scale on the chord's root that holds it and changes
fewer notes of the key. C major in C minor takes C mixolydian, which changes E♭
and A♭, where mixolydian ♭6 changes only E♭. Test: `keys.test.ts`, "takes the
nearest of its candidates, which is not always the nearest named scale that
holds the chord (P9)", over the 528 chords of the grammar in the prototype's
modes: 241 take the nearest named scale, 101 have a nearer one (by one note in
97, by two in 4), and the 186 that `chordScale` gives no scale are each held by
some named scale. None is held by none. Every chord the composer writes has a
scale among the candidates: `packages/engine/src/chords.test.ts`, "each imply a
scale in their key, so the composer never needs to state one (P7, P9)", over
every degree, harmony and secondary dominant in every key it plays. So `scale=`
is needed only for chords the composer doesn't write: a player's, an analyzed
one, a hand edit. Source: #37 step 4, a probe on P7's counterexample (N1).
Status: measured, failing (over the named scales); measured (the composer's
chords). Open: whether the default a line's `scale=` overrides should be the
nearest named scale, which no chord of the grammar lacks, or the candidates,
whose choices read as modal interchange and secondary dominants. Lands in: #7
(b).

**P10. `chordScale`'s candidates outside the key itself assume 12 notes to the
cycle.** Witness: `helixScale`'s search (`keys.ts`) tries the key, then
`parallel(key, diatonicMode(name))` for each diatonic mode, then
`targetKeys(key, chord)`, then harmonic and melodic minor on the tonic
(`MINOR_FORMS`). `diatonicMode` is built once from `even(7, 12)`, `targetKeys`
returns nothing for `key.cycle !== 12`, and `MINOR_FORMS` are written as
`{ cycle: 12, … }` literals, so only the first candidate, the key itself, is
built from `key.cycle`. A diatonic chord always enters there and gives the right
cycle (P5, U2's reach for a line's tokens follows from it). Counterexample: a
chord that needs a borrowed or secondary candidate, in a cycle other than 12. A
minor triad a step flatter than the key's own third — borrowed from the parallel
minor, as `III+` is in a major key — falls through to a 12-cycle candidate:
`chordScale` returns a `Helix` of the wrong cycle in 17, 19 and 53, and none at
all in 22 and 31. Test: `keys.test.ts`, "gives the key itself, entered at the
root, for a diatonic chord in every cycle P5 names (P10)" and "only holds a
borrowed chord's scale in its own cycle at 12: its candidates (diatonicMode's
parallel modes, targetKeys, the minor forms) assume 12 notes, so a triad a step
flatter than the key's own third gives a wrong-cycle scale in 17, 19 and 53, and
none in 22 and 31 (P10 counterexample)". Source: #130, probing P5's reach past
the numerals into `chordScale`. Status: measured (the key itself, every cycle);
measured, failing (a borrowed or secondary candidate, outside 12). Lands in:
#130's follow-up, generalizing `diatonicMode`, `targetKeys` and `MINOR_FORMS`
the way `numerals.test.ts`'s P5 oracle already builds a diatonic set in any
cycle from its generator.
