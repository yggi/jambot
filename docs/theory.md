# Theory

The mathematics under `packages/theory`: what its objects are, how they
relate, and which test holds each relation. Every relation here is checked
over every case in its range, not over samples. The names were decided in
[#31](https://github.com/yggi/jambot/issues/31) under the law of true names.

## The helix

A **helix** is a spiral staircase. Its steps are the **degrees**, counted
0, 1, 2, … and on past the last one, and each stands at a **height**. k
degrees up is one turn up, and one turn is the **cycle**, n heights:

    heightOf(helix, d + k) = heightOf(helix, d) + n.

A `Helix` is stored as one turn: `{ cycle, heights }`, the heights of degrees
0 to k − 1, rising, with degree 0 wherever it stands. G major is
`{ cycle: 12, heights: [7, 9, 11, 12, 14, 16, 18] }`.

The helix has two views, and both are used:

- **From above** it is the **circle**. Every turn stands on the same k
  **positions**, 0 to n − 1: pitch classes, or steps of a bar. Going once
  round brings you back to where you started.
- **From the side** it is a **staircase**. It climbs without end: MIDI
  notes, or steps of a song. Going once round brings you to the same
  position one turn up.

This is the pitch helix, with pitch class going round and the octave going
up. The same helix counts the onsets of a rhythm on through the bars.

`wrap(height, cycle)` forgets the turn and gives the position. `lift(position,
cycle, near)` goes back, and needs a choice of turn: the height nearest
`near`, ties going down. The score language's nearest octave, `^` and `v`,
and each part's home range are rules for that choice. `positions(helix)` is
the whole helix seen from above, sorted.

The two views do not carry the same information. The circle loses which
position is degree 0, which is why the heights are stored and the positions
derived. Degree 0 is the tonic of a scale or the root of a chord; height 0 is
C, or the downbeat of a rhythm. They coincide only when degree 0 stands at 0.

Tests: `helix.test.ts`.

### Degrees from heights

The helix rises strictly, so every height p has a degree just below it and a
degree just above it:

- `degreeBelow(helix, p)`: the highest degree whose height is at most p;
- `degreeAbove(helix, p)`: the lowest degree whose height is at least p.

For every degree d, heightOf(d) ≤ p exactly when d ≤ below, and
heightOf(d) ≥ p exactly when d ≥ above. These are the two adjoints of
`heightOf`, a Galois connection. They are the same degree when p is on the
helix, and neighbours when it is not.

`snap` answers the nearest of the two: nearest is a choice between them, and
ties go down. play-aeiou's `degree_of` is `degreeAbove`.

For `even(k, n)`, `degreeBelow` is ⌊p · k/n⌋. Seen from the side, the even
set is the staircase closest to the line of slope k/n. Only the even set as
it starts follows the line: for 7 of 12 that is Lydian, and Ionian, one of
its modes, reaches F a semitone early.

Tests: `helix.test.ts`, "degreeBelow and degreeAbove", for every even helix
with n ≤ 16, unshifted and shifted, and every height over four turns.

## The primitive: even

`even(k, n, shift)` places k of n as evenly as possible: position j is in the
unshifted set when j · k mod n < k. Degree 0 stands at 0, and `shift` moves
every height and keeps the degrees, so `even(k, n, s)` is
`shift(even(k, n), s)`. The bossa, `even(5, 16, 6)`, has its degree 0 at
step 6 and plays from the downbeat all the same.

This is Jambot's Euclid form (#8). The prototype, play-aeiou, quintenzirkel
and tonal all give exactly these sets. Strudel's Bjorklund form gives the
same rhythm from another starting point for 46 of the 120 pairs with
k < n ≤ 16, so a Strudel export shifts the pattern or writes it out.

A helix is **even** (`isEven`) when, for every d, the spans from each degree
to the d-th next degree take at most two sizes, one apart. Neither a shift
nor the choice of degree 0 changes that.

- `even(k, n)` is even, and every even k-of-n set is a shift of it: all 474
  such sets with n ≤ 12 are checked. So "the even set" is one helix, up to
  where it starts. Clough and Douthett prove this for every n.
- `complement(helix)` stands on the positions the helix leaves out, from its
  degree 0 upward. The complement of `even(k, n)` is `even(n − k, n)`,
  shifted. The black keys, the complement of C major, are F♯ major
  pentatonic.

Tests: `even.test.ts`.

## Generic and specific

An interval can be counted in degrees or in height. A **generic** interval
counts degrees: a fifth is 4. A **specific** interval counts height: a perfect
fifth is 7 semitones. `sizes(helix, generic)` gives every size a generic
interval takes on a helix. In the diatonic set each comes in one size or in
two sizes a semitone apart: Myhill's property, which the maximally even sets
with coprime k and n have. The terms are Clough and Myerson's.

Tests: `intervals.test.ts`.

## Spelling

A note's letter is its generic interval above the tonic, counted in letters,
and its accidental is what the specific interval leaves over. So spelling is
choosing a generic for each height (`genericsOf`), and `spell(tonic,
heights)` does the rest:

- a stack of thirds takes a third per note: C E♭ G♭ B♭♭;
- a 7-note scale takes one letter per degree, whatever accidentals that
  costs: E♭ harmonic minor is E♭ F G♭ A♭ B♭ C♭ D;
- anything else takes the usual interval of each size, with two exceptions:
  the tritone is a ♯4 beside a fifth and no fourth, and 8 semitones are a ♯5
  beside a third and no fifth. The blues is C E♭ F G♭ G B♭.

This is quintenzirkel's rule (`spellDegree`), and its golden spellings are
tests here. tonal agrees on every chord symbol both read, from 21 roots
(840 of 840), and on 25 of the 28 scales both know, from 21 tonics. It
spells the other three by other conventions: the altered scale as jazz
alterations, and the whole-tone and augmented scales with one letter per
note. More than a double accidental comes up only on a tonic that has an
accidental already: C♭dim7 has a B♭♭♭.

Tests: `spelling.test.ts`, and `second-opinion.test.ts` ("spelling").

## The generator

For coprime k and n, `generator(k, n)` is g = k⁻¹ mod n, and `even(k, n)` is
the arc {0, g, 2g, …, (k − 1)g} mod n. For 7 of 12, g = 7: the diatonic set is
seven consecutive fifths, so the circle of fifths and the Euclidean rhythm
are one structure. Carey and Clampitt call such scales generated.

Tests: `even.test.ts`.

## Modes

`mode(helix, d)` enters the same helix from degree d: the heights are kept,
and degree d is numbered 0. Mode 1 of C major is D dorian, at 2 4 5 7 9 11 12:
the same positions, another tonic. `modes(helix)` lists the k modes in degree
order. A mode shifted so that its degree 0 stands at 0 is "mode k" as the
sister projects use it: the scale re-rooted on its k-th note.

**Brightness** is a number: `brightness(helix)` sums the heights above degree
0, so a shift does not change it. Sorted by brightness, the modes of
`even(k, n)`, each measured from 0, run along the generator: the b-th
brightest stands on position b · g.

- From one mode to the next, one note moves by one position.
- The brightness drops by exactly one from each mode to the next, for every
  coprime k of n ≤ 16. The diatonic modes run from Lydian (39) to Locrian
  (33).

Tests: `modes.test.ts`.

## Keys

A key is a scale on a tonic. The two keys next to it have their own names in
music, and a key change is one of them, so nothing jumps:

- `relative(key, scale)` keeps the notes and moves the tonic: C major to A
  minor. It takes the scale on the position that shares the most notes with
  the key; ties go to the fewest steps along the key's generator (the fifth),
  then to the key's own tonic, then to the lowest position. That is the
  prototype's `pivotRoot`, checked for every key and mode it plays, and for a
  diatonic mode it is always a mode of the key.
- `parallel(key, scale)` keeps the tonic and changes the notes: C major to C
  minor.

Tests: `keys.test.ts`.

### The scale a chord implies

`chordScale(key, chord)` answers #10: the scale that changes the fewest notes
of the key while holding the chord as stacked thirds, entered at the chord's
root. So chord tones 1 3 5 7 9 are its degrees 0 2 4 6 8, and 2 4 6 are the
degrees between them. The candidates are the key and its parallel diatonic
modes, and the key of each major or minor degree a fifth below the chord's
root: ionian for a major target, harmonic minor for a minor one. Only a
dominant fits there. A tie goes to the parallel mode, which keeps the tonic.
Where none holds the chord, harmonic and then melodic minor on the tonic are
tried. Otherwise the chord implies no scale, and the line has to state one.

In C major and C minor this gives the usual jazz reading:

| chord            | from                | scale               |
| ---------------- | ------------------- | ------------------- |
| ♭III, ♭IIImaj7   | C dorian            | E♭ lydian           |
| ♭VI, ♭VImaj7     | C aeolian           | A♭ lydian           |
| ♭VII, ♭VIImaj7   | C mixolydian        | B♭ lydian           |
| ♭II              | C phrygian          | D♭ lydian           |
| iv, ivm7         | C aeolian           | F dorian            |
| V7/ii, V7/vi     | D, A harmonic minor | phrygian dominant   |
| V7/V             | C lydian (G major)  | D mixolydian        |
| V, V7 in C minor | C harmonic minor    | G phrygian dominant |
| III+ in C minor  | C harmonic minor    | E♭ ionian ♯5        |
| vii°7 in C minor | C harmonic minor    | B ultralocrian      |

Two readings differ from other conventions. ♭VII7 takes B♭ mixolydian from C
aeolian, where jazz often plays lydian dominant, which is no parallel mode.
And I in C minor takes C mixolydian (a tie with V of iv keeps the tonic),
where a Picardy third at a cadence is ionian. A line states its scale where
it means otherwise.

Over every chord of the grammar (11 qualities on 12 roots in the prototype's
four modes), 332 imply a scale, and in each the chord tones are its degrees
0 2 4 6 8 and 2 4 6 fall between them. Every borrowed chord and every
dominant of a major or minor degree is among them. tonal's
`Chord.chordScales` lists every one of the 332 scales for its chord.

Tests: `keys.test.ts`, and `second-opinion.test.ts`.

## Composition: a helix on a helix's degrees

`compose(inner, outer)` reads the inner heights as degrees of the outer
helix: inner degree e stands at the outer height of degree `heightOf(inner,
e)`. A k-of-m helix on an m-of-n helix gives a k-of-n helix. This is how the
levels nest:

- a note in a chord, a chord in a key, a key in a section (the score
  language's layers refer upward);
- steps, beats and bars in meter: the backbeat is `even(2, 4, 1)` composed
  with `even(4, 16)`, which is steps 4 and 12.

A chord of a key is composition with every other degree of 7, {0, 2, 4, …}.
For three and four notes those degrees are even in 7. So every triad and
every seventh of every diatonic mode is `even(3 or 4, 7)` composed with the
mode: 98 of 98. Five stacked thirds span more than a turn of 7 and are not
even in it, so a ninth chord is a named **stack**, heights above its root,
not a composition.

Composition does not keep evenness in general. Of the 165 compositions of
even helices with n ≤ 12, 35 are even. A triad of the diatonic set is not
even in 12 (only the augmented triad is), which is why chords have named
qualities instead of coming from `even(3, 12)`.

Tests: `helix.test.ts` ("compose") and `chords.test.ts` ("chords, by
composition").

Helices under composition form a category. The objects are cycles, and an
arrow from k to n is a helix: a strictly rising map f from degrees to heights
with f(d + k) = f(d) + n. The chromatic helix is the identity. These are the
injective maps of Fiedorowicz and Loday's paracyclic category; forgetting the
turn gives the circle.

### Shift and mode

The two operations move one coordinate each:

- `shift(helix, t)` adds t to every height and keeps the degrees: a
  transposition. C major shifted by 7 is G major, at 7 9 11 12 14 16 18;
- `mode(helix, d)` renumbers the degrees and keeps the heights.

Each is composition with a translation, the shift on the outside and the
mode on the inside, so

    compose(shift(inner, d), outer) = compose(inner, mode(outer, d)).

This is how a Roman numeral reads: V7 of C major is four even degrees of 7,
`even(4, 7)`, shifted to degree 4 and composed with the key, at 7 11 14 17.
The law needs the mode to keep its heights. With a mode measured from 0 in
its place, the V7 lands on 0.

On a set sorted from 0 the two cannot be told apart: sorted, the positions of
G major read from C are C Lydian.

Tests: `modes.test.ts`, "shift and mode": the law for every even pair with
n ≤ 12 and d over three turns.

## Mirror

`mirror(helix)` reflects the helix about degree 0: degree d stands as far
above degree 0 as degree −d stood below it. The gaps come in reverse order,
the tonic stays, and mirroring twice gives the helix back, for every even
helix with n ≤ 16. Across the seven diatonic modes it maps brightness i to
6 − i: lydian to locrian, ionian to phrygian, and dorian to itself. A major
triad mirrors to the minor triad a fourth below its root (C major to F
minor).

A reflection about any other axis is this one shifted, because 2a − x is
2t − x moved by 2(a − t). About the tonic and its fifth (negative harmony,
quintenzirkel's mirror) it is `shift(mirror(helix), 7)`. On the note sets
that takes C ionian to C aeolian and a major triad to the minor one on its
root, and each diatonic mode of brightness i to the one of brightness 5 − i.
It needs a perfect fifth over the tonic: locrian has none, and its image
loses the tonic. As a helix, degree 0 moves to the fifth, so C ionian goes
to G phrygian.

The relations between helices are comparisons, not names of their own: the
same positions (relative keys, C major and A minor), the same gaps
(transposition, C major and G major), the same gaps up to rotation (the
modes), and up to reversal (the mirror).

Tests: `helix.test.ts`, "mirror".

## Partials

`partial(n)` places the n-th partial of the harmonic series on the nearest
semitone, 12 · log₂ n rounded. Partials 1 to 5 are a major triad, and the
seventh partial is 31 cents from the nearest semitone.

Tests: `intervals.test.ts`.

## Names and readings

`read(name, context)` reads a name as a note, an interval, a degree, a chord,
a scale or a rhythm, and `readings(name)` lists every reading of an
ambiguous one. A tonic moves the scale's helix: D dorian's degree 0 stands
at 2. Keys read with a space or a colon, from any spelling of the tonic:
`Db:major`, `D#:minor`, `A:aeolian`. `nameOf(reading)` writes a short name back. A name and a thing are not
inverses, because a thing has many names, but `read(nameOf(x))` gives back x
for every reading of every name the tables hold. `dia` is every other degree
of the scale in context, whatever its number of degrees.

Tests: `read.test.ts`.

## Sources

- Carey, N. and Clampitt, D. (1989). Aspects of well-formed scales. _Music
  Theory Spectrum_ 11(2), 187–206.
- Clough, J. and Douthett, J. (1991). Maximally even sets. _Journal of Music
  Theory_ 35(1/2), 93–173.
- Clough, J. and Myerson, G. (1985). Variety and multiplicity in diatonic
  systems. _Journal of Music Theory_ 29(2), 249–270.
- Fiedorowicz, Z. and Loday, J.-L. (1991). Crossed simplicial groups and
  their associated homology. _Transactions of the American Mathematical
  Society_ 326(1), 57–87.
- Shepard, R. N. (1964). Circularity in judgments of relative pitch. _Journal
  of the Acoustical Society of America_ 36(12), 2346–2353.
- Toussaint, G. (2005). The Euclidean algorithm generates traditional musical
  rhythms. _Proceedings of BRIDGES 2005_, 47–56.
