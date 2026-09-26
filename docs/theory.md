# Theory

The mathematics under `packages/theory`: what its objects are, how they
relate, and which test holds each relation. Every relation here is checked
over every case in its range, not over samples. The names in code are the
current ones; the naming itself is open (see [Open](#open)).

## Cycles, positions and sets

A **cycle** has n positions, 0 to n − 1, and counting past the end wraps
around (`mod`). Twelve semitones are a cycle; so are the sixteen steps of a
bar. A **set** is k of those positions, sorted.

`even(k, n, rotation)` places k of n as evenly as possible: position j is in
the set when ((j − rotation) mod n) · k mod n < k. A set is **maximally
even** when, for every d, the spans from each member to its d-th next member
take at most two sizes, one apart (`isMaximallyEven`).

- `even(k, n)` is maximally even, and every maximally even k-of-n set is a
  shift of it: all 474 such sets with n ≤ 12 are checked. So "the even set"
  is one set, up to where it starts. Clough and Douthett prove this for
  every n.
- `shift(set, by, n)` moves every member by `by` positions, and
  `even(k, n, r)` is `shift(even(k, n), r, n)`.
- The members that `even(k, n)` leaves out are `even(n − k, n)`, shifted.
  The black keys, the complement of C major, are F♯ major pentatonic.

Tests: `even.test.ts`.

## The ladder

`degree(set, d, n)` reads a set as a **ladder**. The degrees are its
**rungs**, counted 0, 1, 2, … and on past the last member. The positions are
their heights. The ladder repeats: k rungs up is one cycle up,

    degree(set, d + k) = degree(set, d) + n.

So it is a spiral stair, a **helix**. Seen from above (height mod n), every
turn stands on the same k places: pitch classes, or steps of a bar. Seen from
the side it climbs: MIDI notes, or steps of a song. This is the pitch helix,
with pitch class going round and the octave going up. The same ladder counts
the onsets of a rhythm on through the bars.

Two pictures follow, and both are used. On the **cycle**, going once round
brings you back to where you started. On the **helix**, it brings you to the
same place one turn up. Forgetting the turn (height mod n) goes from the
helix to the cycle. Going back needs a choice of turn: the score language's
nearest octave, `^` and `v`, and each part's home range are rules for that
choice.

### Rungs from heights

The ladder rises strictly, so every height p has a rung just below it and a
rung just above it:

- `below`: the highest rung whose height is at most p;
- `above`: the lowest rung whose height is at least p.

For every rung d, degree(d) ≤ p exactly when d ≤ below, and degree(d) ≥ p
exactly when d ≥ above. These are the two adjoints of `degree`, a Galois
connection. They are the same rung when p is on the ladder, and neighbours
when it is not.

`nearestDegree` always answers one of the two: nearest is a choice between
them, and ties go down. play-aeiou's `degree_of` is `above`.

Tests: `degrees.test.ts`, "degree, read as an order", for every even set with
n ≤ 16 and every height over four turns.

## Generic and specific

An interval can be counted in rungs or in height. A **generic** interval
counts rungs: a fifth is 4. A **specific** interval counts height: a perfect
fifth is 7 semitones. In the diatonic set every generic interval comes in one
size or in two sizes a semitone apart (`genericSizes`): Myhill's property,
which the maximally even sets with coprime k and n have. The terms are Clough and Myerson's.

Tests: `intervals.test.ts`.

## The generator

For coprime k and n, `generator(k, n)` is g = k⁻¹ mod n, and `even(k, n)` is
the arc {0, g, 2g, …, (k − 1)g} mod n. For 7 of 12, g = 7: the diatonic set is
seven consecutive fifths, so the circle of fifths and the Euclidean rhythm
are one structure. Carey and Clampitt call such scales generated.

Tests: `even.test.ts`.

## Modes

`modes(k, n)` gives the k rotations of the even set, each moved to start on
0, in order along the generator.

- From one mode to the next, one note moves by one position.
- The sum of the positions drops by exactly one from each mode to the next,
  for every coprime k of n ≤ 16. So the order along the generator is the
  order of that sum, which is brightness as a number: the diatonic modes run
  from Lydian (39) to Locrian (33).

`rotate(set, d)` re-roots the set on its d-th member. This is "mode k" as the
sister projects use it: `rotate(ionian, 1)` is Dorian. On the ladder it is
standing on rung d and measuring every height from there. It gives the same
sets as `modes`, in scale order.

Tests: `modes.test.ts`.

## Composition: a ladder on a ladder's rungs

A k-of-m set, read as rungs of an m-of-n set, gives a k-of-n set: inner rung
e stands at height `degree(outer, e)`. This is how the levels nest:

- a note in a chord, a chord in a key, a key in a section (the score
  language's layers refer upward);
- steps, beats and bars in meter: the backbeat is `even(2, 4, 1)` of the
  beats of `even(4, 16)`, which is steps 4 and 12.

`stack(set, d, size)` is composition with every other rung, {0, 2, 4, …}.
For three and four notes those rungs are even in 7. So every triad and every
seventh of every diatonic mode is `even(3 or 4, 7)` composed with the mode:
98 of 98. Five stacked thirds are not even in 7, and the ninth is where this
stops.

Composition does not keep evenness in general. Of the 165 compositions of
even sets with n ≤ 12, 35 are even. A triad of the diatonic set is not even
in 12 (only the augmented triad is), which is why chords have named
qualities instead of coming from `even(3, 12)`.

Tests: `chords.test.ts`, "stack, as composition".

Sets with a starting point, under this composition, form a category. The
objects are cycles, and an arrow from k to n is a ladder: a strictly rising
map f from rungs to heights with f(d + k) = f(d) + n. The chromatic ladder
is the identity. These are the injective maps of Fiedorowicz and Loday's
paracyclic category; forgetting the turn gives the cyclic picture.

## Partials

`partial(n)` places the n-th partial of the harmonic series on the nearest
semitone, 12 · log₂ n rounded. Partials 1 to 5 are a major triad, and the
seventh partial is 31 cents from the nearest semitone.

Tests: `intervals.test.ts`.

## Open

The names of these objects and operations are being decided in
[#31](https://github.com/yggi/jambot/issues/31). So is which relations get a
function of their own: composition, the two adjoints, brightness and
complement are tested here through the current functions, and none of them
has its own function yet.

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
