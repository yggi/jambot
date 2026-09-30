# Language: surface

The catalogue of how the language is written and read: lowering to devices, its readers and writers, and the score text.
The frame, the method and the tensions are in [`language.md`](language.md); the experiments are in [`language-experiments.md`](language-experiments.md).

## Lowering

**L1. The bottom is flat: timestamped events, as MIDI and dough carry.** Source:
architecture. Decided: architecture, inherited.

**L2. The IM states written lengths; a played duration is derived.** Witness:
the parts write lengths in whole steps (`WrittenNote`), and `perform` gates them
by the articulation (T4); the transport sends both ends of a note through the
time map (`tempo ∘ swing`), so a note is an interval of written time.
Counterexample: a legato line that overlaps or gaps under swing, as in the
prototype, which swings only the start. A written length off the grid, as the
port's parts wrote before `perform` took the gate from them (E9). Test:
`transport.test.ts`, "holds a note from its swung start to its swung end (L2)";
`performer.test.ts`, whose tests of lengths cite L2. Open: every note-on has its
note-off on the MIDI port (#5, Q1d). Source: MIDI (no durations), #37 step 3,
E9. Status: measured (the port's lengths); open (note-offs). Decided: #7, ahead
of the evidence. Lands in: #24, #63 step 2.

**L3. A renderer sees only its declared parameters and its event stream.**
Source: the prototype README, LADSPA. Status: derived.

**L4. Strudel is a target: the shared mini-notation behaves identically, and no
package depends on Strudel.** Witness: `writeSequence`'s every placing of a bar
of 8 agrees with `@strudel/mini` step for step and word for word. #11's earlier
survey ran the prototype's mini-notation against `@strudel/mini`: sequence,
`[ ]`, `@`, `*`, `< >`, `,` and `~` agree; `: ? ! _ . / |` and Euclid differ.
Strudel is AGPL-3.0-or-later, so `@strudel/mini` is a dev dependency of
`packages/score` for tests only, as the conformance oracle, and no package
imports it, as with tonal (`eslint.config.js`'s `no-restricted-imports`).
Counterexample: a pattern both read that plays differently. A mark that reuses
`:`: Strudel reads `sd:2` as `["sd", 2]`, a sample name and a bank index, never
a bare word, so `sd:ghost` reads as `["sd", "ghost"]` rather than failing — the
`:` finding #11 recorded as prose stayed open and unenforced long enough that a
role notation nearly reused it before E16/L8's word-fused form was chosen
instead. Test: `strudel.test.ts`, "places every word of a bar of 8 on the step
and with the word @strudel/mini gives it (L4)"; "reads a word marked with ':' as
a name and an index, not a word (L4 counterexample)". Source: #11. Status:
measured (sequence and `@weight`, the shared grammar so far); measured, failing
(`:`, pinned as a regression test); open (`? ! _ . / |` and Euclid, as the score
language grows into them, E3). Decided: #11, ahead of the evidence (the oracle
for tests only, a licence call). Lands in: #63 step 4.

**L5. A stage declares whether it can run on the clock; a model cannot.**
Source: LADSPA's hard-realtime flag, the roadmap. Decided: the roadmap,
inherited.

**L6. A part is one voice: one MIDI channel, and one line of the score.**
Witness: `PARTS`, the drums, the bass, the pad, the stab and the lead. The comp
plays two parts, the pad, held through each chord, and the stab, short and
rhythmic, as the prototype's text writes them on two lines. Counterexample: two
voices in one part whose notes cut each other on its channel. With pad and stab
one part, a stab's note-off cut 1,833 of 6,427 pads short and silenced 15.6% of
pad time (E11, #5). Within a part, stabs a step apart and held legato still
overlap: 234 of 14,931, each a step short on one channel unless the lowering
counts note-offs per note (Q1d). Test: `events.test.ts`, whose test of `PARTS`
cites L6; `band.test.ts`, "plays each part as one voice: a pad never starts on a
note a pad still holds, and a stab only one step after a stab still ringing (L6,
Q1d)". Source: #5, E11, R4 (`comp` named the machine, its carried state and a
note's voice). Status: measured. Decided: #7, on measured options (E11). Lands
in: #24 (the channels).

**L7. What is written survives into what is played, except what a performance
map replaces, and a drum hit's MIDI note is chosen only when lowering to a
device, by the device's map from its sound.** Witness: `perform`
(`performer.ts`), which reads a `WrittenNote` and returns a `DoughNote`: `part`,
`step`, `note`, `role` and `accent` pass through unchanged, and `velocity`,
`length` and the timbre are what the claim names as replaced, read from the bar
(T4). For the drums, `DRUM_NOTES` gives every sound its own General MIDI note,
so a played note names its sound, and `MidiOut` (`midi-out.ts`) maps each sound
to the note the device plays it on: a Novation Circuit's drum tracks answer only
60, 62, 64 and 65 (#106). Counterexample: a field `perform` drops that names
neither a replacement nor a pass-through. Two sounds on one General MIDI note,
which MIDI out could not tell apart, or a device's map applied anywhere before
MIDI out. A device map that puts two sounds on one pad, as the Circuit preset
does with rim and snare, is lossy, and allowed only there. Test:
`performer.test.ts`, "carries a drum hit’s role and a lead note’s accent through
to the dough note, unchanged (L7)"; `events.test.ts`, whose test of
`doughProblems` cites L7; `drums.test.ts`, "give every sound its own note, so a
played drum note names its sound (L7)"; `midi-out.test.ts`, whose test of the
drum note map cites L7. Source: PR #103's review, a per-performer piano roll
that can label a pitch but not a role; #106, a Circuit Tracks that plays no
General MIDI drum note. Status: measured (every sound its own note, the device
map in MIDI out; a drum hit's role and a lead note's accent, past the
performer). Decided: #7, ahead of the evidence. Lands in: #99 (a drums performer
named by role, not raw pitch), #79 (a rhythm motif with roles, which now has the
field kept past `perform`), #102 (the device's map).

**L8. The drum line writes one word per sound, each hit that word held for one
step, `~` the rest between; a hit's role is the sound's own default, except the
snare's.** Witness: `packages/score/src/score.ts`'s drum lines (`DRUM_SOUNDS`,
`DRUM_WORDS`, `placeHits`, wired into `encodeBar`/`compileBar`): a sounding drum
gets its own line, `<word> "<hits and rests>"`, in the mini-notation `mini.ts`
already gives every line (E16, form (iii)). Counterexample: two sounds sharing
one line, or a role written where the sound alone already gives it. Test:
`score.test.ts`'s drum-line tests, every one of the six supported sounds, a
solid bar with no rests, the last step held to the bar's own end, and the
canonical form under a second pass; `seam.test.ts`, whose round trip now carries
the band's own drum hits — kick, every hi-hat sound, pedal hat, the Euclidean
rim — over 5 seeds, every preset and the tour;
`packages/analyzer/experiments/ladder.test.ts`, whose rung 0 round-trips a kick
pattern through real score text end to end. Source: E16, measured options sent
to the owner on #63; #150, the parser's ladder, whose rung 0 needed the decision
to close its own round trip. Status: measured (kick, closed hat, open hat, pedal
hat, ride, rim); open (the snare, whose role — backbeat, fill or ghost — still
needs its own hit-by-hit call). Decided: owner, on measured options (E16). Lands
in: #63 step 2b, Q1a, A1.

## Readers and writers

**R1. A musician reads it like a lead sheet.** Source: spirit. Status: open.
Test: open. Decided: spirit, inherited.

**R2. A small model writes it: shallow nesting, a small vocabulary, relative
tokens, no arithmetic across tokens, a grammar constrained decoding can
enforce.** Source: the prototype README. Decided: the prototype, inherited.

**R3. The unit of editing is a line, which validates on its own.** Source: the
prototype's takeovers. Decided: the prototype, inherited.

**R4. A word in the score names one thing.** Witness: the port names the
prototype's `shift` section a bridge, because `shift` is the theory's
transposition and a candidate motif operator: `bar 12 shift` would read as an
operation. Counterexample: a score word with two meanings. Test: `form.test.ts`,
"has six kinds of section, eight bars each". Source: the law of true names, #37
step 3. Status: measured. Decided: #37 step 3, in the working track.

## Surface

How the score is written, decided on #7 on measured options (E8) and built by
its working track, the seam (#63).

**U1. A Roman numeral is a degree of the key's own scale: `b` and `#` alter the
mode's degree, case sets the quality, and the suffixes are the theory's
qualities as fixed intervals.** Witness: `numerals.ts`: `parseNumeral` and
`formatNumeral`, and `chordOfNumeral` and `numeralOf` between a numeral and a
chord of its key. It is P7's rule one level up: a numeral counts degrees of the
key's scale, as a pitch number counts degrees of the chord's. `V7/ii` reads its
numeral in the target's major or minor key, a mode of the key's own set, and `b`
and `#` move by the key's chromatic step, so a numeral reads in any cycle (P5).
Counterexample: a numeral that reads back as another chord, or a chord of a
diatonic key that no numeral writes. Counting from the parallel major, the other
option, makes `VI` in A minor F♯ and fails the tests. Test: `numerals.test.ts`,
whose tests cite U1: every numeral written and read back (7 degrees, 3
accidentals, 19 qualities, 43 targets), every chord of every diatonic key, the
prototype's 45 kinds (E8), and roots and cases checked with music21. music21
raises the seventh degree of a minor key for `vii`; U1 doesn't. `seam.test.ts`
(`packages/score`), whose test of the port's chords cites U1: every chord the
band plays over 3,200 bars, 3,352 of them (105 secondary dominants, 178
dominants raised in minor, 324 with a ninth), is written as a numeral that
`lowerNumeral` turns back into it, in the key's register. Source: #7 (a), E8,
music21. Status: measured. Decided: #7, on measured options. Open: the canonical
numeral of a root off the key, written as the parallel major has it and
otherwise flat, which is ahead of the evidence: the port writes no root off the
key (0 of 3,352), so #63's round trip hasn't met one, and a takeover will. Lands
in: #63.

**U2. `b` and `#` alter a degree, and an absolute note is written in upper case,
so no pitch token is a note.** Witness: `parseNote`, which reads a letter only
in upper case: `b3` is no note, and `Bb4` is 70. Counterexample: a pitch token
that reads as a note. E8 finds 56 absolute notes in the prototype's scores, each
a flat its encoder couldn't write as `b3` or `b9`, because those read as the
notes B3 and B9 (#9). Test: `notes.test.ts`, whose test of a letter's case cites
U2: every token from 1 to 9, with `b`, `#`, `bb` or `##`, and `^` or `v`, is no
note. Source: #9, E8, R4. Status: measured.
Decided: #7, on measured options.
The bass does not write degree tokens (U6): its pitch is a number of steps above the chord's root, so a degree and an accidental stay a line's where its notes are degrees of a scale, the lead's cells (U4).
Lands in: #63, where the score reads pitch tokens.

**U3. [vitrified] A line states its scale only where `chordScale`'s candidates imply none.**
Retired: no line reads a scale, so the score states none and refuses no chord for having none.
The bass counts its pitch above a chord's root (U6), the pad and the stab voice a chord's tones (#264), and the lead walks the plan's melodic scale over the key (#265); no engine part reads `chordScale`.
`harm` writes `Isus4` like any other numeral.
The number is kept, so references to U3 stay valid, and the entry may be taken out of retirement, with its refusal and its tests, should a line need a scale again.
As it stood:
Witness: `chordScale`'s candidates: the key, its parallel modes, the key a dominant points to, then harmonic and melodic minor (P9, #56).
The composer writes no chord without a scale.
Counterexample: a chord the candidates give a scale for whose line still needs `scale=`, or one they give none for that the text can't state.
`chordScale` reads a chord as a stack of thirds, so five qualities a numeral writes, `5`, `6`, `m6`, `sus2` and `sus4`, imply no scale on any root of any diatonic key (0 of 84 each), and `augmented`, `mMaj7` and `dim7` one in 7 of 84: a takeover's `Isus4` is such a chord.
The score refused such a chord, both ways, until it could write `scale=`.
Test: `score.test.ts` (`packages/score`), "writes a chord that implies no scale and reads it back, since the score states none: every numeral of every quality on every degree of every mode (Q1a)": the chords `chordScale` gives no scale are written and read back; the tests that cited U3, of the band's chords and of the refusal, went with it.
Source: #7 (b), P9.
Status: measured (the port's chords).
Decided: #7, on measured options.
Lands in: #63.

**U4. A motif is a rhythm and a contour on its own cycle: onsets, each a note or
a rest, and each note a degree of the key, counted from the motif's origin and
altered by `b` or `#` as a pitch token is (U2), with an accent if it has one.**
Witness: `Motif` (`motifs.ts`): `cycle`, `onsets`, `degrees` (`null` for a rest)
and `accidentals`, in chromatic steps of the key (P5). Each onset is held to the
next, and a rest is an arc of silence. `head` keeps the first notes and leaves a
rest for the others, so the last notes are `head` under `rev`, and need no
operator of their own. The origin is the motif's own zero, and an anchor, from
the level above, pins it to a bar step and a key degree, as `tempo.ts`'s anchor
pins a step to a second. `accents`, left out when there are none, gives each
note its velocity less its player's level in the bar. An accent moves with its
note under `late` and `rev`, and `strans` and `mirror` leave it. Played, a motif
note is the band's level for its part and bar plus its accent, never the
player's level: that is the Muse's style reading (#16), which reaches the band
only through following, with its bandwidth (A4). The Muse's judgement counts the
player's level as the rounded mean of the melody's velocities and carries it
beside the motif (`level` on the judgement and the offer). A lead note from a
motif is written with its accent (`WrittenNote.accent`), and `perform` plays it
on the lead's level, `LEAD_LEVEL`, in place of the beat's accent.
Counterexample: something a player plays that no motif gives back. The Muse's
working track names four (#79, and #7's pressure comment, points 1 to 4): a blue
note, which a whole degree rounds away; a player's accents, which the
performance's beat accents replace; a staccato or a dropped note, which a note
held to the next can't leave silent; a phrase longer than a bar, which a fixed
16 can't hold. An accent counted from the beat instead of the level is one more:
moved off the beat, it plays another velocity. Three of the four are answered:
the blue note by an altered degree, the accents by `accents` (ahead of the
evidence, A5), and the staccato by a rest. The phrase longer than a bar stands:
the Muse reads a phrase whole so far (#204, E17), but judges each bar on its
own, and a phrase played across a bar line comes back as a motif per bar, each
taking the place of the one before. Test:
`motifs.test.ts`, whose tests cite U4: what a motif may be; `head` under `rev`
is the last notes wherever no note is held over the cycle's start; an accent is
the same accent wherever `late` and `rev` move its note, and one counted from
the beat is not; `mirror` reflects an altered degree as the key's helix reflects
it in dorian, its own mirror, only when it turns the accidental over too; and
one `b` or `#` reaches every pitch of every key of 12, 17 and 19, but not of 22,
31 or 53, whose chromatic step is 3, 2 and 5 steps of the cycle. The engine and
MIDI stay in 12 (L1), where every pitch is reached. `numerals.test.ts`, whose
tests of `alteredDegree` cite U4: a note is written as a numeral writes a root
off the key, and every height of every diatonic key comes back. `muse.test.ts`,
whose tests cite U4: every note a player plays in any key comes back from the
Muse's motif, a note released before the next leaves a rest, and each accent is
counted from the player's level. `lead.test.ts`, `events.test.ts` and
`performer.test.ts`, whose tests of accents cite U4: a motif's note is written
with its accent and played on the lead's level, and the lead's own notes keep
the beat's; and `lead.test.ts`'s test of its phrases: the lead's own phrases and
its themes' melodies are motifs too, a rest first where the bar starts silent,
which `realize` plays as it plays a player's. `transport.test.ts`, whose test of
loudness cites U4: one accent pattern played loudly or softly plays back the
same. Source: #7 (d), #79, E13, the names round. Status: measured (12, 17, 19);
measured, failing (22, 31, 53). Decided: #7, on measured options (rests, over a
note held to the next, whose `head` and `rev` gave the last notes in 282 of 768
cases); dissolved (altered degrees: U2 already writes `b3`, and P5 says what `b`
moves by); #7, ahead of the evidence (accents counted from a level, not from the
beat: the test shows only that such an accent moves with its note, by
construction, and whether players' velocities are expressive or metric is A5's,
open; nothing that plays yet moves a note across a beat, E13, so it is the
easier choice to reverse); #79 step 3, ahead of the evidence (the lead's level,
91, the midpoint of its accents on and off the beat, 100 and 82). Lands in: #79
steps 1 and 3, #63. A motif also travels between apps as it is, in a client's
judgement and a host's bar (`packages/session`), so a change to its shape is a
change to the session protocol and bumps `PROTOCOL`; `protocol.test.ts` holds
the shape.

**U5. The motif operators are the theory's `shift` and `mirror` on pitch and on
time, named `strans`, `mirror`, `late` and `rev`: every chain of them is one
operator, and each result is written with one, the canonical.** Witness:
`MotifOp`, `applyOp`, `thenOp` (the score's `then`), `undo`, `NOOP`,
`stabilizer` and `canonicalOp` (`motifs.ts`). The group is the infinite dihedral
group on pitch times the dihedral group of the cycle (Q5c); `head` is a monoid
beside it. `strans`, `late` and `rev` are Strudel's names for the same
operations (`scaleTranspose`, `late`, `rev`), so a Strudel export writes them as
they are; `mirror` is the theory's. Seen as edges, a motif is its rhythm's
`gaps` and its `motion`, from note to note: `strans` and `late` keep them round
the cycle, `mirror` negates the motion, and `rev` runs both backwards and
negates the motion. Counterexample: a symmetry of a motif that no operator gives
(not complete); two operators that give one motif and write differently (not
exclusive, and the text no fixed point); a name that does another job in the
score, in Strudel or in JavaScript (R4): Strudel's `seq` concatenates and its
`inv` swaps onsets and rests, its `take` stretches the notes kept over the
cycle, and a module that exports `then` is a thenable, which `await import()`
never settles. Test: `motifs.test.ts`, whose tests cite U5: every map of a cycle
of 3 to 7 steps that keeps neighbours next to each other is one `late` or one
`late` after `rev`, and every map of the degrees that keeps their distances one
`strans` or one `strans` after `mirror`; on every motif of a 4-step cycle, the
operators that give one result are one coset of its stabilizer, and
`canonicalOp` is a function of the result and a fixed point; the edges turn as
the motif does, and two motifs have the same edges exactly when `strans` and
`late` take one to the other; `packages/analyzer/experiments/ladder.test.ts`,
whose tests cite U5: read back from MIDI in every key of every diatonic mode, a
scale's descent is its ascent under `rev` and under `mirror.strans(7)` alike,
`canonicalOp` writes the second, and counted in semitones the mirror gives the
descent in dorian alone (Q10). Source: #7 (d), Lewin's T and I, quintenzirkel's
operators, Strudel, the names round, E13. Status: measured. Decided: #7, on
measured options (E13, the names round). Lands in: #79, #63.

**U6. A pitch and an onset are each a plain integer on their own cycle, and neither token carries an accidental.**
A pitch is a number of the key's steps above the root of the chord in force, `0` to `11` in 12, with `^` for the octave above the nearest.
An onset is a step of the bar, counted from 0 (`0` to `15` in 4/4).
Witness: `encodeBar` and `compileBar` (`packages/score/src/score.ts`) write the bass as `step=pitch` pairs, `bass 0=0 4=0 7=7 8=0 12=0^ 14=10`, and read them back, with a register other than the bass's default (E2) pinned in a frame, counted from the tonic, `frame bass=28` (S2).
A note states no length: it lasts to the next onset or the bar's end, which is what the band writes for every bass note.
The pad and the stab are the same pairs with a chord for a value, `pad 0=ch 8=ch`, `stab 14=nx`, and the voicing a rule, each chord led from the one before it (#264).
The form before it wrote a pitch as a degree of the chord's implied scale with an accidental, and an onset as an eighth with a `#` for the step after it.
That `#` was a kludge for the sixteenths, reached no 32nds, and had no answer for triplets, and a degree token needs a scale, which `chordScale` gives only some chords (U3, vitrified).
A plain step is the same token at any depth of the bar's tree: the next power of two is a longer count, and a triplet an exact integer on a grid with a factor of 3 (#275).
Counterexample: a bass note with no token, which the form cannot give, since a pitch above a root always exists; a bar whose text a second pass rewrites; a note that changes register on a resume.
Test: `seam.test.ts` (`packages/score`), "gives every note the bass plays a token: a pitch above its chord’s root, and a ^ where it jumps an octave (U6)": every bass note of 3,200 bars, every preset, the tour and the glides, has a pair and reads back; "holds every bass note to the next onset and the last to the bar’s end, as the band writes it: a note has no length to state (U6)".
`score.test.ts`, "takes the octave nearest the register for every pitch on every register, a ^ for the one above, and refuses a ^ past the top (U6)", and a fixture for each refusal.
Source: #7's original speculation (a scale and a rhythm as one object), #116 §6, #125, #126, E14, the owner on #263.
Status: measured (the bass).
Open: the lead, whose cells are degrees of the key with operators on them (U4), which a pitch above a chord's root serves less well; finer grids, groups in a step and loops (#275); a key whose cycle is not 12, where a pitch is `0` to the cycle less one (P5), which the score does not write yet.
Decided: the owner, on #263, on measured options (the plain step against the degree token and the eighth with a `#`).
Lands in: #63 step 3a, #275.
