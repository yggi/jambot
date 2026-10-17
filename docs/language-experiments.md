# Language: experiments

The experiments of #7 and #116, each answering an entry of the catalogue (index in [`language.md`](language.md)).

Each answers one entry, or one of #7's and #116's decisions. E2 to E7 have not
run; the others have.

- **E1. Cold against warm compile** (S1, S2, F2; Q4b), in
  [`prototype/experiments/cold-warm.mjs`](../prototype/experiments/cold-warm.mjs)
  (`node prototype/experiments/cold-warm.mjs`, about 3 s). It runs the prototype
  headless for 64 bars in each of the eight presets and in a tour that changes
  preset every 8 bars, with five seeds each, and compiles every bar twice: warm,
  as it plays, and cold, from its text with the compiler's history reset.
  - 1,949 of 2,880 bars (68%) compile differently, and 8,976 of 86,911 events
    (10%). By preset, from 37% (Funk) to 83% (Lo-fi hip hop, Swing jazz). The
    first bar of a run always agrees, because cold is the start state.
  - Every difference is register only: in every differing bar the pitch classes,
    times, lengths and velocities agree, and only the octave of a bass or lead
    note or the voicing of a chord changes. Chords and pads differ in 1,326
    bars, the lead in 678, the bass in 657.
  - Every bar writes its own `harm` and `key=`, so harmony is self-contained.
    357 bars (12%) use `nx`, which reads the next bar's plan.
  - With a steady preset, `bpm=` is exact. During the tour's glides the tempo
    that plays is up to 8.6 BPM off the bar's `bpm=`, and a bar lasts up to 135
    ms longer or shorter than its `bpm=` says.
  - No cold compile raised an error.
- **E2. Parameter inventory** (C2): the style axes have their ranges and glide
  spaces in `style.ts`; the `sound` parameters remain.
- **E3. Strudel coverage** (L4, #11): each preset's bars written in Strudel,
  with what can't be said.
- **E4. Spectra of the presets** (P4): |F_j| of every drum and bass pattern
  across the eight presets, and whether a style axis follows a coefficient.
- **E5. The clock grid** (T3): which rhythms in the corpus fall off the 96 ticks
  of a bar.
- **E6. Loop bandwidth** (A4): tempo following under simulated human jitter. It
  waits on #16, #25 and #27.
- **E7. The round trips** (F3, F4): for each boundary, up ∘ down against the
  identity, and the idempotence of down ∘ up. The time boundaries are measured
  (T4); the text boundary waits on #13, and the analyzer boundary on #3. All are
  entries in [`quinetic.md`](quinetic.md), with the other quinetic properties.
- **E8. What the composer writes** (R4; #7's decisions (a) and (c), #9), in
  [`prototype/experiments/census.mjs`](../prototype/experiments/census.mjs)
  (`node prototype/experiments/census.mjs`, about 2 s). It counts the score's
  tokens over E1's corpus: the numerals in `harm`, and the pitch tokens in
  `bass` and `lead`.
  - The keys are minor in 1,080 bars, dorian in 720 and major in 1,080; no
    mixolydian.
  - 3,064 numerals of 45 kinds, 110 of them secondaries. None has a `b` or `#`,
    so the prototype's rule for them never reaches its own output. If `b` and
    `#` counted from the parallel major, 516 of them (17%), all in minor and
    dorian bars, would gain a `b`.
  - 19,956 plain numbers, 314 with `#`, none with `b`, and 56 absolute notes.
    Every absolute note is a flat the encoder couldn't write, because `b3` and
    `b9` read as the notes B3 and B9: 27 are the ♭3 over V in A minor, 29 a ♭9
    or ♭2 over a dominant, a ninth chord or Imaj7. So `b3` names two things,
    against R4, and with `b` as a flat the composer would write no absolute
    note.
- **E9. What the port writes and what it plays** (T4, L2, T2, F5, Q1d; #63 step
  2), in
  [`packages/engine/experiments/performance.ts`](../packages/engine/experiments/performance.ts)
  (`node --experimental-strip-types --no-warnings packages/engine/experiments/performance.ts`,
  about 1 s). It runs the port's band over E1's shape: 5 seeds, each preset held
  and the tour, 64 bars each, 2,880 bars in all.
  - Lengths: as written, none falls off a quarter step. As played, 91% of the
    bass's, 95% of the lead's and every stab's do, gated by the articulation
    (T4). The drums and the pads play as written.
  - Velocities are played: 104 kinds in the drums, 38 in the bass, each a
    function of the bar and the written note (part, role, step), scaled by the
    energy, with a seeded looseness in the drums. The lead plays two, 100 on the
    beat and 82 off it.
  - Over a tour that glides from one preset to the next every 8 bars, a bar
    composed from its style rounded to 2, 3 and 9 decimals plays differently in
    233, 180 and 46 of 320 bars, and is written differently in 26, 3 and 0. At 3
    decimals the articulation alone changes what plays in 175 bars and what is
    written in none; the energy 45 and 2, sync 2 and 1, harm 1 and 1, swing 7
    and 0; tempo and entropy none.
  - No part strikes a note twice on a step. Taken together, the pad and the stab
    start a note while the same note still sounds in 631 bars (22%), 3,370 of
    3,927 times a stab inside a held pad; as two parts (L6), 234 remain, each a
    stab one step after a stab still ringing.
- **E10. How a bar's header states its style** (T5, T4, C3; #7's decision (f),
  taken as C7), in
  [`packages/engine/experiments/header.ts`](../packages/engine/experiments/header.ts)
  (about 2 s). It runs the band over the app's own glides, a new preset every 8
  bars with `PRESET_GLIDE`, 5 seeds × 64 bars. The numbers below compare with
  the band as it read every float, before C7; now that the band reads the grid
  itself, the script's 3-decimal comparisons read zero.
  - Written in full, the style takes 109 characters a bar on average and 145 at
    most, against 80 on a grid of 3 decimals. Between glides the values are
    short; within one, every axis runs long, as a dyadic fraction
    (`0.8892578125`) or with float noise (`0.19277343749999998`), and the tempo,
    which glides in log space (C2), longest.
  - If the band reads its style on a grid of 3 decimals, 4 of 320 bars are
    written otherwise than now, each by one hit (a hat that opens, a bass note
    that goes), and 174 play otherwise, by at most 1 in velocity and 0.005 steps
    in length. On a grid of 2 decimals, 55 and 215, by 1 and 0.05 steps.
  - A grid of 3 decimals written but not read gives back 316 of 320 bars; the
    other 4 are the round trip's counterexamples.
- **E11. Pad and stab** (Q1d, F5, R4; #5; #7's decision (g)), in
  [`packages/engine/experiments/pad-stab.ts`](../packages/engine/experiments/pad-stab.ts)
  (about 1 s), over E9's 2,880 bars.
  - On one MIDI channel, pad and stab together, as they were one part before L6,
    a stab's note-off cuts 1,833 of 6,427 pads short (28.5%), and 14,913 of
    95,824 steps of pad (15.6%) go silent, in 493 bars.
  - A join in the events, one note per pitch at a time, drops 3,370 of 14,931
    stab notes (22.6%).
  - Two parts, or two voices of one part on two channels, lose nothing between
    pad and stab. Two parts, now L6, take `PARTS` from 4 to 5 and drop the
    `comp` field from notes, which then names only the machine and its carried
    state; two voices would keep the events and map (part, voice) to a channel
    when lowering. Within the stab part, 234 of 14,931 stabs start a step after
    a stab still ringing on their note, a step short on one channel (Q1d).
- **E12. Numerals over any cycle** (P5, U1; #7's decision (h)), in
  [`packages/theory/experiments/cycles.ts`](../packages/theory/experiments/cycles.ts)
  (about 1 s). It reads 45 numerals (7 degrees, flat, natural and sharp, and V7
  and VII7 of 12 targets) in 13 tonics × 7 modes of six tunings whose diatonic
  set is a chain of fifths, 12, 17, 19, 22, 31 and 53 notes, against the line of
  fifths: a spelled note stands at a place on it and sounds at place × fifth,
  mod n.
  - `chordOfNumeral` reads 100% right in 12, 49% in 19 (every secondary fails,
    from `diatonicMode`'s 12), and 17–20% in 17, 22, 31 and 53, where a flat is
    more than one step.
  - Read with `b` and `#` worth L − s of the key's helix (its larger step less
    its smaller: 1 in 12 and 19, 2 in 17 and 31, 3 in 22, 5 in 53) and a
    secondary's key taken from the key's own set, every tuning reads 100%.
  - Only in 12 and 19 is the diatonic set `even(7, n)`; in the others it is a
    helix whose steps differ by more than one.
  - The any-cycle rule is now `numerals.ts`'s (P5, decided on #7), so
    `chordOfNumeral` reads 100% in every tuning, and the script's "now" column
    reads the same as its rule. Written back, a chord reads as itself
    everywhere; in 12, 17 and 19 an altered numeral can have a twin spelling at
    the same pitch, since places n fifths apart coincide (E♯ is G♭ in 17 and F♭
    in 19), and `numeralOf` writes the canonical one.

- **E13. The lead against the motif operators** (Q5c, U5, S2; #7's decision
  (d)), in
  [`packages/engine/experiments/motifs.ts`](../packages/engine/experiments/motifs.ts)
  (about 1 s), over E1's shape. It reads every lead bar back as key degrees and
  finds the operator and `head` (`motifs.ts`) whose notes start where the bar's
  do and whose contour, at the best `strans`, differs from it in the fewest
  notes. A `head` leaves a rest, which the lead holds its last note over, so
  only the notes' onsets are compared.
  - Shape bars: fitting the shape to the chords (a chord tone on a chord's start and on the strong steps the harmony leaves, every beat for a vamp and the half bar below rich harmony, #168; an octave fold) changes 161 of 4,567 notes (3.5%), in 15.2% of bars.
    32 bars have a note off the key.
  - Variation bars (931): 11.6% are the shape under an operator exactly, 59.2% but for their last note, which the phrase's close sets, 25.3% but for one other note (a nudge or a chord tone), 3.9% two notes or more off.
    The vamps' every-beat snap (#168) moves more notes to chord tones than the half bar did, so a few more bars sit two notes off (2.4% before).
    Every one has an operator's rhythm. The operators are the shape itself, up to a
    `strans` (52%, the lift and the bent close), `mirror` (27%) and a `head`
    (18%). The lead never uses `rev` or `late`.
  - Phrases (457): 48% are a cell and an operator on it in every bar but for the close, 88% allowing one more note a bar. Written as a cell and a reference
    per bar, with a degree for each note an operator doesn't give, a phrase
    takes 52% of the tokens it takes as notes.
  - Symmetries: 10 of the lead's 149 shapes have one, so several operators give
    the same bar, and `canonicalOp` chooses which the score writes (U5).

- **E14. A pitch as a degree and an accidental** (U2, U6; #7, #116 §6, #125, #126),
  in
  [`packages/engine/experiments/tokengrammar.ts`](../packages/engine/experiments/tokengrammar.ts)
  (about 1 s), over E1's shape.
  It writes every bass and lead note as a pitch token (`alteredHeight`/`alteredDegree` over the bar's chord's implied scale).
  - Every one of 19,091 bass and lead notes has a pitch token: `chordScale` always gives a scale and `alteredDegree` always finds it in one accidental, over the corpus.
  - The bass is written as semitones above the chord's root instead (#263, U6), which every note has without a scale, so this is what the degree form would have cost, for the lead's cells (U4) to weigh.
  - The time half of this experiment, every onset as an eighth with a `#`, went with that token: an onset is a plain step (U6).
  - Not yet measured: a real captured corpus rather than the engine's own, and whether a musician reads it as a lead sheet (R1).

- **E15. The band's onsets against the meter** (T10, T12; #116's question (k),
  #123), in
  [`packages/engine/experiments/onsets.ts`](../packages/engine/experiments/onsets.ts)
  (about 1 s), over E1's shape. It sorts every onset the parts write by the
  level of the 4/4 meter it falls on: a beat, an eighth between beats, or only
  the step grid.
  - Onsets (82,984): 45.6% on a beat, 30.1% on an eighth, 24.3% only on the
    grid. The pad, the backbeat and the pedal hat are all beats; the ghosts
    (92.8%), the fills (56.2%), the Euclidean rim (47.8%) and the lead (44.9%)
    are most of the grid's.
  - Lines, a part in a bar (18,108): 36.0% need only the beats (4 slots in 4/4),
    21.1% the eighths (8), and 42.9% the grid (16). Every rim and fill line,
    97.5% of ghost lines and 92.3% of lead lines need the grid.
  - Named rhythms: four on the floor and the backbeat are helices on the beats,
    the offbeat hats on the eighths, and every `E(3,16)`, `E(5,16)` and
    `E(7,16)` the rim plays only on the grid.
  - Tokens, in slots as mini-notation writes a drum line: a line on the grid
    takes 16; relative to the meter, 4 on the beats or 8 on the eighths, an
    onset between two eighths an eighth's degree altered by a step, and an
    eighth that holds two onsets one token more. Relative lines take 43.6% of
    the grid's tokens: the pad and the backbeat 25%, the bass 42.8%, the lead
    51.9%, the hats and the fills about 64%.
  - So onsets written relative to the meter would write most of the band in 4 or
    8 slots, and need the grid below for a quarter of its onsets, as a line's
    pitch tokens need `b` and `#` for notes off the chord's scale; how an onset
    off the meter is written is T12's.

- **E16. How the score's drum line writes a hit's role** (L7, T4, F5; #63 step
  2b), in
  [`packages/engine/experiments/drum-line.ts`](../packages/engine/experiments/drum-line.ts)
  (about 1 s), over E1's shape: 2,628 drum bars and 42,535 hits.
  - Only the snare needs its role written. Every other sound takes one role
    (kick, rim as euclid, pedal hat as pedal, closed and open hat and ride as
    hat); the snare takes three: backbeat 4,010, ghost 3,285, fill 1,168.
  - No context outside the hit gives the snare's role. The sound leaves 19.9% of
    hits open; the sound and step, 11.3%; with the section's type, 8.9%; with
    the section's last bar too, 1.3%, all on steps 12 to 15 of a last bar, where
    the draws of the backbeat and the fill decide.
  - Where two roles meet, the stronger stays (F5), so the backbeat hides the
    fill: in a build's last bar, step 12 is written as backbeat 59 times of 64
    and as fill 5, where the backbeat didn't play. A fill never lands on step 4.
  - Three forms, in tokens per bar (a line's name, a hit, a run of rests each
    one token): one line with a role on every hit (`sd:ghost`) takes 20.3 on
    average and 40 at most; a line per role, 33.0 and 65, writing the sound on
    the 48.4% of hits that are hats; a line per sound with a default role, 33.1
    and 66, writing the role on 10.5% of hits, the snare's ghosts and fills. Not
    measured: one line with a word per sound and role, as the prototype's `gh`
    is a ghost snare, which takes the first form's tokens with no role written,
    since the pairs that occur are 9.
  - Every bar with Euclidean rim hits, 1,080, has exactly the hits of one
    `even(k, 16, shift)`, with k of 3, 5 or 7 and a shift of 0 to 3, so the line
    can write them as one Euclid token.

- **E17. How well the Muse reads a sloppy hand** (A3's confidence, U4; #204 H0), in
  [`packages/engine/experiments/muse-reading.ts`](../packages/engine/experiments/muse-reading.ts)
  and its humaniser and yardstick in `humanise.ts` (about 1 s), over 200 patterns, each played 5 times, 890 bars whose exact playing the Muse takes as a motif.
  - A pattern fills a bar with one dominant note value (a quarter, an eighth or a sixteenth) that gives way now and then to a longer, shorter or dotted one, with rests.
  - A hand plays it in bar 1 at 120 bpm (a step is 125 ms).
    One number, the sloppiness, is the standard deviation in ms of each onset's jitter, of the phrase's offset, of the tempo's drift over the bar and of each release's jitter, and the sloppier the hand the shorter it holds a note (a gate of 1 − sloppiness / 500).
  - The target is what `judgeBar` makes of the exact playing.
    The reading that exists rounds each onset and release to the nearest step.
  - Read exactly at 0 ms, and 99.7% at 10 ms.
    Then 69.3% at 20 ms, 26.9% at 30, 8.9% at 40, 3.0% at 50, 1.1% at 60, and none at 80 and 100.
    A good player is at 20 to 40 ms.
  - The rest is where it goes wrong.
    Of the bars read wrong at 30 ms, 64% got a rest nobody meant, because a release and the next onset are rounded apart: 1 step of gap out of two noises of a fraction of a step.
    Without the shorter hold the share at 30 ms is 45.5%, and the bars read right 41.5%, so it is the rounding, not the articulation.
  - A note struck early or late enough to change bars strays in 11.2% of the bars at 30 ms, 27.1% at 60, and 42.7% at 100: the bar it belongs to loses its first note (H1).
  - Notes put on another step, a note lost with another on its step, and no motif at all are each under 10% up to 60 ms.
  - So the reading's first lesson is not where the notes go but where the rests are: a rest must be a plausible value or nothing (H4), and comes before the note value (H2).
  - The yardstick has both ends: an exact hand is read 100%, and a reader that hears nothing 0%.
    The baseline's numbers are literals in `humanise.test.ts`, to be raised by the step that improves them.
  - **#204 H1: a phrase read whole** (`readHeard`, `packages/engine/src/phrase.ts`).
    Two phrases of one to three bars with an empty bar between, each humanised alone: 3,600 bars.
    A phrase ends at a silence of a bar less a step (`EMPTY_BAR`), is read as one span with the phrase's offset found (shrunk toward none) and its first onset put on the beat where the odds say so (`BEAT_EVIDENCE`, odds of 6 to 1 against the hand's own looseness), then cut at the bar lines.
    Nearest step against a phrase read whole, bars right, and bars whose notes all start where they were meant (rests aside): 20 ms 69.1% and 82.9% against 83.6% and 92.8%; 30 ms 27.3% and 46.5% against 34.0% and 53.9%; 40 ms 9.1% and 23.3% against 10.1% and 26.4%.
    Bars with a note in the wrong bar at 30 ms: 9.9% against 7.6%.
  - Reading is no better from 60 ms, and marginally worse in right bars (a handful in 3,600): a hand that loose puts a note past half a step from where it meant, which no prior on the first onset repairs.
  - A beat prior on every onset, not only the first, at odds of 1.5 to 3, moved the 30 ms numbers by under a point, so it is left out.
  - **#204 H4: rests** (`releasesOf` in `phrase.ts`).
    A release short of the next onset, or of the bar's end, is the player's articulation, a share of the note's slot that the phrase's own notes leave (their lower quartile, up to 30%), unless the rest of the gap stands out by `REST_MARGIN` (3) times the hand's spread (its looseness, twice over).
    A rest is then of the plausible length nearest to it (1, 2, 3, 4, 6, 8, 12 or 16 steps) where that is within the spread, and of the whole steps nearest to it otherwise, since a tight hand that leaves five steps meant five.
    Bars right, bars with their rests where they were meant, nearest step against read whole: 10 ms 99.6% and 99.6% against 99.9% and 99.9%; 20 ms 69.1% and 70.4% against 84.4% and 87.9%; 30 ms 27.3% and 30.2% against 44.0% and 63.5%; 40 ms 9.1% and 11.6% against 20.1% and 43.9%; 60 ms 1.2% and 2.6% against 4.3% and 18.1%.
  - Two things made the first cut worse than the nearest step at 10 ms (96.2% against 99.6%) and are why it reads as it does.
    The articulation as the middle of what notes leave is wrong for a phrase that is half rests, where the rests are the middle; the lower quartile is not.
    Snapping every gap to a plausible rest read a rest of five steps (a quarter and a sixteenth, which the yardstick's cut patterns make) as four; a rest is snapped only where the hand's own spread doesn't rule it out.
  - The margin was swept on this yardstick, with the lower quartile in: 1.5, 2, 3, 4, 5 and 7 gave 75.4%, 78.0%, 84.4%, 81.3%, 75.8% and 67.3% of bars right at 20 ms, and 29.3%, 37.0%, 44.0%, 42.4%, 39.9% and 35.9% at 30 ms.
    At 10 ms all but 7 give 99.8% or 99.9%.
    3 is the best of the sweep, so it is tuned to the yardstick's patterns and to the humaniser, and is a starting value, not a finding.
    A larger margin declares fewer rests, so it costs a real rest that a loose hand can't tell from a release; the yardstick's rests are a minority, and a phrase that is mostly rests would want it smaller.
  - A note played staccato throughout is read as a full note (articulation), so a run of staccato eighths comes back as eighths, not as eighths and rests.
    Only a release that stands out is a rest.
  - **#204 H2: the note value** (`snapToValues`, `packages/engine/src/lattice.ts`).
    A phrase's onsets are read on the lattice of a half, a quarter, an eighth or a sixteenth of the bar's own places, the one that describes them at the least cost: a place of the bar each (`16 / value` of them, in nats) and how far each is from it, over the hand's looseness, which is one for every lattice; the coarser wins a tie.
    Two onsets a step or more apart may not share a place (`MERGE_LIMIT`), which stops a loose hand's sixteenths being read as eighths with two notes on one place.
    The first onset stays where the beat prior put it.
    Nearest step, then H4's reading, then H2's, bars right / onsets right: 20 ms 69.1% / 82.9%, 84.4% / 92.8%, 84.8% / 93.2%; 30 ms 27.3% / 46.5%, 44.0% / 53.9%, 46.0% / 56.6%; 40 ms 9.1% / 23.3%, 20.1% / 26.4%, 23.1% / 30.0%; 60 ms 1.2% / 6.8%, 4.3% / 7.3%, 5.0% / 8.6%.
  - Three first cuts of H2 were worse than H4's, each for one reason.
    The looseness fitted to each lattice (its own spread) let a coarse lattice explain the noise away: 8.6 points of onsets lost at 20 ms, 4 of them to notes in the wrong bar; one looseness for all lattices, from the phrase's residuals, is right.
    A lattice anchored at the phrase's first onset misplaces a phrase that starts on an offbeat sixteenth; the bar's own places are right, since the player aims at the band's grid.
    Without the merge limit, four sixteenths a loose hand played as 24, 24, 26, 26 were read as eighths.
  - **#204 H3: the hierarchy** is in the nesting: a half, a quarter, an eighth and a sixteenth are each the multiples of the next, so a phrase's one lattice holds its longer notes and the shorter ones ask for.
    Bars whose beats divide by themselves (a quarter, eighths, sixteenths, a mix; `beatPattern`, 3,875 bars) are the ground where one value for a phrase can't hold: nearest step against H2's, bars right / onsets right: 20 ms 70.0% / 78.9% against 81.6% / 91.7%; 30 ms 25.3% / 37.0% against 34.4% / 44.6%.
  - Each beat taking a lattice of its own, nested in the phrase's, at 0 to 4 nats to depart from it, was worse than none on those bars (20 ms, 79.5% to 81.6% bars right, 89.1% to 91.7% onsets), and no better on the bars of one value; the more it took to depart, the better it did.
    So it was taken out, and H3 stands as the nesting alone.
    Not tried: note values that are not a power of two (triplets, whose places are thirds of a beat), and ratios read from the lengths of notes as well as from their onsets.
  - **#204 H6: into the judgement** (`judgeBar` in `muse.ts`).
    The Muse's own judgement of a bar reads that source's notes as phrases (`readHeard`), those heard up to the end of the bar and no later, so what the band plays doesn't depend on what came after (F7): a phrase is read as far as it has gone.
    The notes kept between bars are each source's running phrase (`keptAfter`, up to `PHRASE_MEMORY` bars), not only the bars not yet judged; a client's ear and the host's transport both keep them, and read alike.
    The baseline stays as `judgeBar(…, 'nearest')`.
    Bars right / onsets / rests right by the Muse's own judgement, 3,600 bars: 20 ms 84.6% / 93.4% / 87.3%; 30 ms 45.8% / 57.4% / 62.4%; 40 ms 23.0% / 31.2% / 42.2%; on beats that divide by themselves at 30 ms 34.6% / 44.7% / 53.5%.
    That is within a point of a phrase read whole with its end known (46.3% at 30 ms), so reading a phrase so far costs nothing worth a point.
    The judgement of the bar before a phrase's first bar, judged before the phrase is known, still sees a lone early note as a bar of its own: too few, and not offered.
  - **#204 H5: the confidence a judgement carries.**
    Each onset has a margin, how near it sits to the place it was read on against halfway to the next (1 on it, 0 halfway; `PhraseReading`); a motif's judgement carries the mean of its bar's notes, in hundredths (`confidence`, absent from the nearest step's reading).
    It sorts the bars read right from those read wrong: the chance that a right bar carries more than a wrong one is 0.85 at 10 ms, 0.78 at 20, 0.73 at 30, 0.69 at 40, 0.61 at 60.
    At 30 ms the surest third of the bars are read right 67.3% of the time and the least sure third 24.1%.
    The mean, the minimum and the lower quartile of the margins were compared, pooled over 20 to 40 ms: 0.78, 0.75 and 0.76, so the mean.
  - Two players in one bar, one motif taken (`taken`): the prototype took the most notes, and now the surest reading is taken, then the most notes.
    Right picks, most notes against surest reading, over 790 pairs each: players at 0 and 40 ms 65.4% against 100%; 10 and 30 ms 71.5% against 97.6%; 20 and 40 ms 54.2% against 77.7%; 30 and 30 ms 41.1% against 58.4%; 20 and 60 ms 50.3% against 77.3%.
    The notes times the confidence, which keeps some richness, was in between (66.5% at 20 and 40 ms).
    This changes what the band takes, ahead of the evidence about real players: a clean three-note motif now beats a loose ten-note one.
    It is one comparison in `taken` to reverse.
  - The tuned constants of H1 to H4 (`BEAT_EVIDENCE`, `REST_MARGIN`, `ARTICULATION_CEILING`, `MERGE_LIMIT`) stay as they are: a posterior that estimated them from this yardstick would learn the humaniser's parameters, not a player's.
    H5 as one posterior over the reading is not done; the confidence is.
    That waits on a recording of real playing.
  - What is left is the per-onset jitter of a loose hand, which the equal lengths (H2) and their ratios (H3) address, and the rests a loose hand can't tell from a release.

- **E18. The lead driven by the style** (T4; #168 step 2), in
  [`packages/engine/experiments/lead-style.ts`](../packages/engine/experiments/lead-style.ts)
  (under 1 s): every preset at entropy 0.3, over 5 seeds and 64 bars, run at each of step 2's three commits.
  - The harmony shapes the contour, from an arch where it is low toward a wave where it is high: the line turns less often in Techno (harmony 0, 0.18 to 0.14 turns a note) and Funk (0.12, 0.14 to 0.11), and more in Lo-fi hip hop (0.75, 0.14 to 0.18) and Bossa nova (0.85, 0.14 to 0.17).
  - The harmony thins the strong steps a note snaps to a chord tone on, from every beat below 0.25 to the downbeat alone from 0.6: the beats on a chord tone rise where it is low (Techno 0.78 to 1.00, Funk 0.94 to 1.00) and fall a little where it is high (Lo-fi hip hop 0.81 to 0.75).
  - The swing adds pickups on the off-beat eighths: Swing jazz (swing 1) goes from 0.17 to 0.26 of its notes there, and from 4.30 to 4.77 notes a bar; Deep house (0.3) from 0.14 to 0.18; the presets without swing are unchanged.
  - All three stay, decided by ear (#168).
    The articulation is left out, since the performer already plays it (T4).
  - The melodic scale (#209) is forced on for every preset, whatever the style's reach, by running the lead alone over the band's bars with the plan's scale set.
    With the plain scale the lead writes exactly what it wrote without one, so those rows are the baseline.
    The contour's span counts degrees, so a wider degree widens the line: over all presets the mean interval is 2.36 semitones in the plain scale, 3.26 in the pentatonic (from 3.03 in Lo-fi hip hop to 3.55 in Deep house) and 2.77 in the blues, close to 7/5 and 7/6 of the plain scale's, as the degrees' sizes predict.
    Notes a bar, the off-beat eighths and the turns stay within 0.03 of the plain scale's, since the scale moves notes, not steps; the beats on a chord tone fall a little, most in the blues (Swing jazz 0.78 to 0.66).
    The share of notes in the melodic scale is 0.99 in the plain scale, 0.96 in the pentatonic and the blues: the rest are the chord tones the lead lands on and the cadence.
    The span stays in degrees: whether to scale it by 7 over the scale's size, which would bring the mean interval back to the plain scale's, is left to the ear at the A/B.

- **E19. The key's loop, left alone** (C9, A4, Q11; #210 step 3), in
  [`packages/engine/experiments/key-loop.ts`](../packages/engine/experiments/key-loop.ts)
  (under 2 s): every preset, the players wishing only for its mode, at entropy 0.3, 0.6 and 1, over 20 seeds and 33 sections.
  - The time constant is derived: 1 / (1 − `HISTORY_DECAY`), 6.67 bars, against the 8 bars a section holds its key.
  - The band moves its own key at a section boundary as often as `KEY_JUMP` times the entropy says (0.20, 0.40 and 0.63 of boundaries), whatever the harmony, and never at entropy 0 or in Techno, whose reach is 0.
  - Every jump stays within the style's reach of the key before (C8); the mean jump is 1.0 to 1.9 fifths, since the draw leans toward the keys that share most with where the band has been.
  - The draw leans back, a little: a jump goes back to the key the jump before left in 19 to 30% of jumps where the reach is 3 fifths or more, where an even draw among the keys within reach would in 9 to 17%, and near an even draw's rate where the reach is 1 or 2 (Funk 40 to 56% of 50%, Ambient 36 to 41% of 25%).
    The key left has faded by then: a section is more than the history's time constant.
  - The history's centre follows a jump 1.2 to 3.9 bars into the new section on average, about half a section in every preset that reaches past two fifths.
    Where the harmony is thin it may not follow at all: by the section's end the centre is not the band's new key in 50 to 56% of Ambient's jumps and 29 to 31% of Funk's, against 3 to 12% of Synth-pop's, Deep house's and Lo-fi hip hop's, and none or 1% of Bossa nova's and Swing jazz's.
    Their few chords don't hold the notes that tell neighbouring keys apart, so the reading loses what the lean needs.
  - A key held a section or more is read back from the band's chords in every bar of Deep house, Bossa nova and Swing jazz and all but 0.1% of Synth-pop's and Lo-fi hip hop's, but not in 1.2% of Funk's, 3.8% of Techno's and 5.6% of Ambient's bars, at entropy 0 (F3).
  - Over all bars, the centre is not the key playing in 9 to 27% at entropy 0.3 and 25 to 47% at entropy 1, and in up to 4% where the key never moves, from the first bars, before the history holds the scale: after a first bar of A minor alone, the centre can be D minor, which holds the chord as well.
  - So the players' home, which their key licence counts from, is the plan's key, not the centre (#210, the owner, on these measurements): the centre shows where the band has been, the plan where it is.
  - Left alone, the key doesn't come back.
    At entropy 0.6 the mean distance from the opening key is 0.6 to 1.4 fifths by preset after one section, 1.7 to 2.5 after 8, and 2.3 to 3.3 after 32, where a key drawn at random round the circle lies 3 fifths away; 0 to 15% of runs are back on it after 32 (a random key 8%).
    It is a walk with a bound on each step and none on where it goes.
  - Not measured: the gain of the draw, which reads the history to the fourth power (`LEAN`), and whether a key the style names, or the song's opening key, should pull the walk back (Q11, the owner's call).

- **E20. Does repetition confirm?** (Q12, C9; #204 H8, #207 M1), in
  [`packages/engine/experiments/recognition.ts`](../packages/engine/experiments/recognition.ts)
  (under 2 s), over E17's yardstick and the band's lead.
  - A hand plays each of the yardstick's patterns in bar 1 and again in bar 3, an empty bar between, each playing humanised on its own; the Muse hears both, with the memory of #204 H8.
  - The repeat is recognised in 100% of the 178 patterns whose exact playing is a motif at 0 ms, 99.4% at 10 ms, 74.7% at 20, 24.7% at 30, 10.7% at 40 and 1.7% at 60.
    That is as often as both playings are read right (100%, 99.4%, 74.2%, 23.0%, 8.4%, 1.1%): recognition is exact, so it is only as good as the reading under it, and a little better where a hand's two playings are read wrong the same way.
  - Another pattern played in bar 3 is never heard as the first, of 157 at every looseness: an exact recognition gives no false alarms.
  - The lead's bars heard as the Muse hears a player, four at a time from each half section, every preset at entropy 0.3, 5 seeds, 64 bars: all 385 phrases join as one motif, and split into cells (`cellsOf`).
    Of the bars after a phrase's first, 38.4% are heard as an earlier cell, and of those 10.2% under an operator.
    The orders: `A B A C` 62.3%, `A B C D` 11.4%, `A A A B` 5.5%, `A B A B` 3.9%, `A B A A` 3.6%, `A A' A B` 3.6%, and the lead's own plan, `A A' A A'`, 1.0%.
  - So the lead returns to its shape in its third bar, and the Muse hears it, but its variations, a shape under an operator and then fitted to the chords, are seldom an exact operator on the shape once fitted; E13 finds most of them one operator but for the close and one note.
  - Both halves ask for the same next step: recognition with a tolerance, an operator but for a note, whose width would be a licence (C8), so a loose hand's repeat and a fitted variation are heard as what they are.

- **E21. Real hands following a beat** (#204, A7), in
  [`packages/engine/experiments/timing-logs.ts`](../packages/engine/experiments/timing-logs.ts),
  run on a file downloaded from the lobby's timing test: the first, one player (the author), ten runs of a kick and snare pattern (quarters and eighths, at 80, 100 and 120 bpm), Firefox 152 on Linux with an output latency of 51 ms, the computer's keys once, the on-screen tap twice and a MIDI pad controller seven times.
  - The player sits late against what they heard: a run's mean offset is +5 to +34 ms in nine of the ten runs (median of the means about +13 ms), and a run that lost the beat, at 120 bpm, is −32 ms with a spread of 115.
    The input's own delay, the audio path's latency the browser doesn't state, and the tapping player's habit of leading the beat all fall in this one number, and one player on one machine can't separate them.
  - Within a run, but for the one that lost the beat, the spread is 33 to 64 ms (21 to 52 robust); over all the runs of an input it is 34 ms for the on-screen tap, 47 for the keys and 58 for the pads (that run included): about the 30 to 40 ms where the Muse's reading gets 46% and 23% of bars right on the humaniser (E17).
    The first three bars are the loosest, 62 to 67 ms over the runs, and the others 39 to 66.
  - The offsets of one run correlate a little from tap to tap (lag 1: 0.14 to 0.44 in nine of ten runs), so there is some slow drift beside independent jitter, which the humaniser's per-phrase offset and drift stand for.
  - The bias depends on where the hit is: on the eighths pattern the kick on the and of 2 (step 6) is 55 ms late (spread 53) and the kick on 3 (step 8) 15 ms early, against 10 ms late on the snare's beat 2 and 5 ms early on beat 4.
    The humaniser gives every onset the same offset; a player's offbeats are later than their downbeats.
  - The Muse on these taps, against the pattern's steps: of 80 bars, 45 have every onset on a step of the pattern by the nearest step and 51 as phrases (`heardInBar`).
    The five runs with a spread of 33 to 38 ms are read right in 6 to 7 bars of 8 as phrases; the run that lost the beat in 1 bar, and one of eighths with a spread of 64 ms in none.
    Sparse drum hits are an easier case than the yardstick's melodies, so this is no check of its numbers, only that they are not far off.
  - The first cut of the tap button counted a pointer's click after its own pointerdown as a second tap (a click is a pointer event in Firefox and Chrome), so the two on-screen runs have each tap twice, the second 70 to 100 ms after the first; the analysis drops them, and the button now takes the pointer going down alone.
  - Not measured: another player, another browser, a touch screen, audio latency by a loopback, and whether a hand follows the band the same way as it follows a metronome.
- **E22. The loop closed with no players** (Q7b, Q12; #237 step 0), in
  [`packages/engine/experiments/loop.ts`](../packages/engine/experiments/loop.ts)
  (about 60 s with its variants and rates; its test, a sample, about 5 s): the Muse hears the band's own lead as she hears a player, and her offer goes back into the band with F7's delay, so what she hears in bar k plays from bar k + 2.
  - Two conditions over the same seeds: deaf, the band as it plays alone today, a Muse listening beside it whose offer is not fed back; and hearing, the loop closed.
  - Every preset at entropy 0, 0.3, 0.6 and 1, 3 seeds of 128 bars; the presets ordered by their harmony, which sets the licence's reach (Techno the narrowest, Swing jazz the widest).
  - The lead's notes are on the grid, so the nearest step reads each bar as the transport's phrase reading does, which the test holds on a sample.
  - Closed, the Muse recognises 83.6 to 94.4% of the lead's motif bars as a motif she remembers, against 37.0 to 63.4% deaf.
    Of those, 77.9 to 100% are exact repeats, against 86.5 to 96.6% deaf.
    New motifs fall from 0.8 to 3.5 a section (the fewest Ambient's, whose lead rests most) to 0.4 to 1.2, and the distinct motifs of a run of 128 bars from 11.0 to 53.7 to 5.3 to 12.3.
  - It doesn't stall on one bar: the longest run of one motif is 1 to 9 bars on average, and runs of a section or more hold at most 7.5% of the motif bars, except in Ambient at entropy 0.6: 24.9%, with a run of 23 bars.
  - It oscillates: 37.9 to 65.1% of motif bars play the motif of two bars before and not the one before (A B A B), against 20.8 to 44.1% deaf.
    The run's commonest motif plays in 50.0 to 67.3% of its motif bars, against 9.8 to 47.6% deaf, and in every run closed it is the first motif the lead played, against 0 to 100% of runs deaf.
    74.6 to 100% of its bars fall on bars of one parity, even or odd, as do 83.3 to 98.6% deaf, where the lead's own phrase puts its shape on a phrase's first and third bars.
    The reason is in the loop's parts: the delay is two bars, so the loop is two chains, the even bars feeding the even and the odd the odd; and the lead plays the offer whole, but closes a phrase's second and fourth bars, both odd, on the cadence.
    So the even chain copies itself: the first motif plays back unchanged on every other bar, and its cadenced variants between.
    The variants below show the Muse's hold is not the cause.
  - It doesn't drift: 58.3 to 95.8% of the last section's motifs are heard (`recognise`, any operator) as one of the first section's, against 0 to 62.5% deaf, 0% in Synth-pop, Lo-fi hip hop and Bossa nova at every entropy, and at most 16.7% at entropy 0.6 and 1.
  - Nor does it dissolve: every run closed holds the motif it opened with.
  - So the loop closed at the motif stalls at the phrase and oscillates at the bar, as the prototype predicted (Q7b), where the key's loop drifts above entropy 0 (E19).
    The two differ in what varies: the key's jump draws on the entropy, and the offered motif passes through the band unchanged but for the cadence, whatever the entropy.
  - Monotonicity (#237): Kendall's tau of the recognised share against the licence is +0.07, +0.07, +0.21 and +0.57 deaf at the four entropies, so deaf the share doesn't fall as the licence widens; it rises a little.
    Closing the loop turns it: −0.18, −0.29, −0.82 and −0.79, falling as the licence widens, most at entropy 0.6 and 1.
    Against the entropy, deaf, the share falls in every preset (tau −1 in four, −0.67 in three, −0.33 in Bossa nova); closed, it doesn't fall consistently (+0.33 to −1).
    The test's sample, one seed of 96 bars at entropy 0.3, gives −0.18 against the licence in both conditions: at 0.3 the order is weak either way.
  - The variants (`VARIANTS`), over the same presets, entropies and seeds, the mean of each measure over them all, beside the deaf band's:

    | condition          | recognised | exact | return | A B A B | commonest | first held | one parity | distinct |
    | ------------------ | ---------- | ----- | ------ | ------- | --------- | ---------- | ---------- | -------- |
    | deaf               | 52.1%      | 92.1% | 16.2%  | 35.2%   | 21.4%     | 33.3%      | 93.2%      | 38.6     |
    | hearing            | 88.4%      | 94.5% | 78.8%  | 53.5%   | 55.5%     | 100%       | 90.6%      | 9.0      |
    | no hold            | 87.4%      | 99.1% | 73.8%  | 60.5%   | 50.7%     | 100%       | 99.0%      | 10.0     |
    | varied             | 73.2%      | 88.0% | 62.8%  | 50.5%   | 53.7%     | 100%       | 94.9%      | 24.9     |
    | varied, no hold    | 69.2%      | 89.8% | 58.1%  | 55.5%   | 52.7%     | 100%       | 98.6%      | 35.5     |
    | every bar          | 62.1%      | 52.0% | 10.7%  | 11.4%   | 10.9%     | 12.5%      | 67.7%      | 40.9     |
    | every bar, no hold | 56.6%      | 53.4% | 6.4%   | 16.6%   | 8.0%      | 3.1%       | 70.6%      | 49.6     |

  - Without the Muse's hold, the offer each bar's motif as the prototype takes it (with only the lead heard, one motif a bar, confirming first has nothing to rank), the loop locks as firmly: the first motif is the commonest in every run, all of its bars of one parity.
  - With the lead varying an offer on its phrase's second and fourth bars as it varies its own shapes (`varyOffer`: turned over, lifted two degrees, its last note bent or dropped, by the lead's own draws), the loop recognises less and hears two and a half times as many distinct motifs, but the first motif still holds every run: the variation falls on odd bars only, and the even chain still copies itself.
  - With the variation on every bar, the lock breaks: the first motif is the commonest in 12.5% of runs, the last section is heard as the first in 10.7%, and A B A B falls to 11.4%, below the deaf band's 35.2%.
    It still recognises more than the deaf band, 62.1% against 52.1%, and half of that under an operator where the deaf band's is nearly all exact repeats: recognisable, not repetitive, and drifting.
    Whether that is where the owner hears beauty, or past it toward confusing, is for the ear (#237).
  - So a loop that copies what it hears locks on its first pattern, whatever holds or confirms it, and each of the delay's chains needs a transformation of its own to drift: variation on every bar, or an answer under an operator from the Muse (#237 step 4), not a copy.
  - By ear (#237), on seed 1's bars 32 to 47 at entropy 0.3 through the app's synth, the owner placed the conditions by the licence.
    Techno is good in every condition, the loop that copies included, heard as a gradient from minimal to melodic techno.
    Deep house is acceptable but leaning boring when it copies, better varied, pretty good varied on every bar, and disconnected deaf.
    Swing jazz is very boring when it copies, still too boring varied, better deaf, and best by far varied on every bar.
    So where the loop turns boring moves with the licence, and no condition was heard as confusing.
  - The rate (`RATES`) generalises the closed conditions: the lead varies the offer ⌊p⌋ times a bar and once more by the chance of the rest (`timesVaried`, its own stream, `offerVariation`), so p = 0 plays as hearing and p = 1 as every bar, which the test holds, and past 1 the variations stack on one bar.
    Over every preset at entropy 0.3, 3 seeds of 128 bars, p from 0 to 2:
    - the recognised share falls from 86 to 92% at p = 0 to 52 to 62% at p = 2, the deaf band's level (44 to 62%), with Kendall's tau against p −1 in six presets and −0.90 in Ambient and Bossa nova;
    - A B A B falls from 50 to 65% to 4 to 10% (tau −1, −0.81 in Ambient);
    - the exact share drops at once, from 86 to 100% at p = 0 to 48 to 68% at p = 0.25, and stays about half after: a quarter of the bars varied at random already reaches both of the delay's chains, though the first motif still holds up to all of a preset's runs at p = 0.25 and 0.5 (Swing jazz's), and a third or fewer from p = 0.75;
    - the distinct motifs rise from 7 to 11 a run to 24 to 49 by p = 1, and change little after (24 to 45 at p = 2).
      So p moves the loop continuously from the locked loop to past the deaf band's recognition.
  - By ear at p = 0.5, 1.5 and 2, beside the hearing (p = 0) and every-bar (p = 1) clips (#237):
    - Techno is good at every p, each a different style.
    - Deep house sounds best at p = 2 and too melodic below it; the owner's guess is that it wants shorter phrases, fewer notes a motif.
    - Swing jazz sounds worst at p = 0.5, where the first motif still holds two of its three runs, and good at 1.5 and 2, where it holds none.
      At 2 it is freer but not confusing: the motif is still heard through its variations, as the Muse still recognises 52% of its bars.
    - So no preset turned confusing by p = 2, and the edge lies past it.
  - The rate thins the lead, since one of its variations drops a note: over bars 32 to 127 of the same runs, the lead plays 4.3 to 5.7 notes a bar at p = 0 in every preset but Ambient (3.8) and Bossa nova (3.0), and 2.3 to 2.9 at p = 2 in all of them (Deep house 5.0 to 2.9).
    So Deep house's preference for p = 2 doesn't yet separate more variation from fewer notes a motif.
  - Not measured: weights for the band's voices beside the players', since no players play here; the style's distance over time, which needs the critic (#15); where past p = 2 the loop turns confusing; and the length of a motif apart from its variation.

- **E23. The style read back from the notes it wrote** (#15 step 2, F3 at the style level, N3), in
  [`packages/engine/experiments/style-readback.ts`](../packages/engine/experiments/style-readback.ts),
  held by [`packages/engine/experiments/style-readback.test.ts`](../packages/engine/experiments/style-readback.test.ts):
  bars composed at a style and read back by `readStyle`, per axis: Kendall's tau-b of the reading against the axis, and the mean distance of the two where the reading is on the axis's scale.
  Over the eight presets held 16 bars, each axis swept from 0 to 1 in eleven steps with the rest in the middle, and the tour with each preset reached by E10's 8-bar glide; 5 seeds each.
  - The articulation is not in the written notes.
    Their lengths fill the gap to the next onset in every bar (reading 0 in all 3,900 bars measured), because the gate is the performer's (T4); it is read from `BandBar.dough`, and then rises with the axis: tau 0.92 over the presets, 0.95 over its sweep and 0.71 over the tour, where the style is moving inside each bar.
    It lies 0.16 from the axis (0.21 in the tour): the reading tops out short of staccato, since a bass or lead note is never gated below a quarter of its length.
  - The syncopation rises with the axis but weakly: tau 0.37 over the presets, 0.34 over its sweep and 0.22 over the tour, and the reading covers 0.03 to 0.29 of an axis that spans 0 to 1.
    It is the drums that carry it (their off-beat share rises from 0.02 to 0.28 with the axis), the bass follows (0 to 0.25), and the pad and stab never leave the grid (0 and 0 to 0.08).
    The lead is not monotone (0.11, 0.45, 0.18, 0.21, 0.59 at 0, 0.25, 0.5, 0.75, 1).
    So the axis is a finding against the composer more than against the reader: `sync` moves the drums and the bass, and hardly touches the chords.
  - The density rises with the energy: tau 0.60 over its sweep, 0.46 over the presets and 0.31 over the tour.
    It has no scale of its own yet (onsets per step over all parts, 0.9 to 1.2 on average), so it has no distance; a fit to the axis is a later step.
  - An axis is read from its own and no other: a sweep of one moves the tau of each other reading by less than 0.05.
  - The clock is read exactly.
    `readTiming` finds the tempo from how long the steps last, and the swing by `estimateSwing` over the onsets put back on the steps as played.
    Over 3 seeds of 16 bars, the tempo has tau 1.00 over the presets and its sweep and an error under 10⁻⁶ bpm, and 0.94 over the tour, 0.06 bpm off, since a glide moves the tempo inside a bar.
    The swing has tau 0.89 over the presets, 0.92 over its sweep and 0.94 over the tour, and lies 0.02 to 0.03 from the axis, through the seeded looseness of the timing (T17).
    The tempo is the clock's own number, so its reading proves the reader and not the composer; the swing is a real inference, from notes that carry a licence.
    A sweep of one moves no tau of the other (under 0.05).
  - Not measured: `harm` (needs the chords, not read from notes yet), per-part readings (step 4), and the real music the analyzer will read.

- **E24. Does Techno land where techno lands?** (#15 step 3, N3), in
  [`packages/engine/experiments/genre-calibration.ts`](../packages/engine/experiments/genre-calibration.ts),
  held by [`packages/engine/experiments/genre-calibration.test.ts`](../packages/engine/experiments/genre-calibration.test.ts):
  the transport plays each preset's point, `readStyle`, `readTiming` and `readHarm` read the bars, and `genreOf` (`packages/engine/src/genre.ts`) turns the reading into probabilities over the presets by a softmax over the distances at a temperature.
  The reading has six axes (`energy` from the density, `sync`, `artic`, `swing`, `bpm` on its log axis scaled to 0 to 1, and `harm`); the distance is a root mean square over them.
  3 seeds of 32 bars per preset, temperature 0.1, against two sets of landmarks: the presets' own points, and where the presets' bars read (the mean over 5 other seeds).
  - Against the presets' points, a single bar lands as its own preset in 0.64 of bars on average (chance 0.125): Ambient 1.00, Swing jazz 0.91, Techno 0.87, Synth-pop 0.82, Lo-fi hip hop 0.74 and Deep house 0.72, but Funk 0.06 and Bossa nova 0.03.
    The reading is compressed short of the axes (E23, E25), so a preset far out on one, Funk's `sync` of 1, has no bar near its point.
  - Against where the presets read, 0.80: Ambient 0.92, Swing jazz 0.91, Bossa nova 0.86, Lo-fi hip hop 0.81, Funk 0.78, Techno 0.77, Deep house 0.69 and Synth-pop 0.68.
    So the critic's landmarks are measured, not read off the presets.
  - Each axis added lifted it. On the three axes of the notes alone (`energy`, `sync`, `artic`) it was 0.30 against the points and 0.41 against where the presets read; with the two of the clock (`swing`, `bpm`) 0.61 and 0.71; with `harm` from the chords 0.64 and 0.80.
    Synth-pop, Lo-fi hip hop and Bossa nova sat in the middle of the note axes and were separated by the clock; Deep house, taken for Funk until then, by `harm` (0.45 to 0.69).
  - A section's mean of 8 bars lands within 0.15 of a bar: averaging adds little, so what is missing is axes, not noise.
  - Not measured: the temperature's effect on calibration of `p` beyond the two tried (0.05 and 0.1 rank alike; `p` on the right preset is 0.14 to 0.80 at 0.1), `harm`, and real music.

- **E25. The chords, and `harm`, read back from the notes** (#15, the critic's `harm`; F3 at the harmony level, N3), in
  [`packages/engine/experiments/harm-readback.ts`](../packages/engine/experiments/harm-readback.ts),
  held by [`packages/engine/experiments/harm-readback.test.ts`](../packages/engine/experiments/harm-readback.test.ts):
  `readChords` (`packages/engine/src/chord-reading.ts`) reads a root and a quality for each half of a bar from the pad and stab, and `readHarm` turns the chords into a number: the mean of the chord changes in the bar over 2, and of how far the chords' tones run past a triad (a seventh a half, a ninth a whole).
  5 seeds of 32 bars per preset; the sweep is `harm` from 0 to 1 in eleven steps with the rest in the middle.
  - Where it reads a chord it gives back the composer's in 99.8% of the 2,423 bar halves it reads, over every preset (root and quality alike), ninths that drop their fifth included.
    Five differ, all in the jazz and lo-fi presets: an Am7 read as C6 in two (one set of four notes, which the bass settles when it plays the root), and others in three.
    It reads none in 137 (5%), all of them halves where the comp sounds nothing; a second half with no notes of its own holds the chord of the first.
    A triad is not read as a sixth chord without its fifth (a Dm as F6 was 10 of 300 of Funk's halves) because the fewest missing tones wins before the bass does.
  - `harm` rises with the axis: tau 0.77 over the presets and 0.77 over the sweep.
    It lies 0.19 from the axis and covers 0.04 to 0.69 of it, at 0 and at 1, since at harm 1 the composer draws a ninth with a chance of 0.7 at most (`chords.ts`), and the reading's rate is full only when both halves of a bar change.
  - Not measured: chords in the pad-less bars, whose harmony the bass and lead carry; a key (the reading is of roots and qualities, not numerals); real music, where a voicing is not the comp's close one.

- **E26. One voice of the band read alone** (#15 step 4, N3), in
  [`packages/engine/experiments/voice-reading.ts`](../packages/engine/experiments/voice-reading.ts),
  held by [`packages/engine/experiments/voice-reading.test.ts`](../packages/engine/experiments/voice-reading.test.ts):
  `readVoice` (`packages/engine/src/part-reading.ts`) reads the drums, the bass, the comp (pad and stab together) and the lead each from its own notes: its density (its share of the 16 steps), its `sync`, the `artic` of the bass and lead, and the `harm` of the comp.
  The distance of a voice from a landmark is a root mean square over the axes both have.
  The presets held, 5 seeds of 32 bars each, against landmarks that are where each voice reads at each preset (5 other seeds).
  - Every voice says something of the style by itself: the nearest of the eight landmarks, for that voice alone, is the preset that wrote the bar in 0.61 of the bass's bars, 0.49 of the comp's, 0.40 of the lead's and 0.29 of the drums' (chance 0.125).
    The drums say least although they carry most of the bar's `sync` (E23): their density and `sync` are the two axes they have, and the presets share them.
  - A voice lies 0.06 (comp), 0.10 (bass), 0.14 (lead) and 0.18 (drums) from its own landmark on average.
  - A drum fill (a `fill` hit written; 112 of 1,280 bars) reads only a little farther from the drums' landmark than the drums of a bar without: 0.199 against 0.180, and a bar with a fill is the farther of a pair in 0.58 of them (0.5 is chance).
    So a bar of drums read by density and `sync` cannot tell a fill from the drummer's usual variety; a licence that shrinks when a fill reads far would need a finer reading (the half bar the fill covers, or its role), not this one.
  - Not measured: the swing and tempo of a voice (they need the voice's onsets on the clock), a fill of the lead, and entropy (step 5).
- **E27. The bass bar as a fold of one tree** (#275 step 1), in
  [`packages/engine/experiments/tree-forms.ts`](../packages/engine/experiments/tree-forms.ts)
  (about 2 s), over E1's shape (5 seeds, each preset held and the tour, 64 bars each; 2,880 bass bars).
  It writes each bass bar three ways: pairs (one token a note, `step=pitch`), dense (one token a cell of the coarsest power-of-two level of 1, 2, 4, 8 or 16 cells that holds every onset, a pitch where a note starts and `_` where none does) and collapsed (the smallest term of words that split a span evenly, `@` weights, `*` tiling, `!` replication and Euclid `x(k,n,rot)`, found by an exact memoised search over the row).
  A pitch is the semitones above the root of the chord in force, `^` when the note is above the nearest to the register carried.
  A cost is the number of atoms (a pitch or `_`) a term writes; brackets and suffixes are not counted.
  Every minimal term is printed, read back by a separate parser and expanded: expand(collapse(row)) = row holds for 2,880 of 2,880 bars.
  - Tokens (all bars): pairs 10,242; dense 25,915 (253.0% of pairs); collapsed 8,357 (81.6% of pairs). By section, collapsed as a share of pairs: breakdown 98.2% (383 pairs), bridge 82.4% (852), build 77.7% (2,091), drop 78.4% (3,170), groove 84.7% (2,511), intro 84.5% (1,235).
  - Dense levels: 1 cell 503 bars, 2 cells 76, 4 cells 339, 8 cells 936, 16 cells 1,026.
  - Folds: the collapsed term is smaller than the pairs in 1,376 bars (47.8%) and smaller than the dense row in 2,129 (73.9%).
    The other 1,504 bars (52.2%) have no term smaller than their pairs.
  - Onset sets: 927 bars (32.2%) are exactly `even(k, 16, shift)`, by k: 1 has 510, 2 has 83, 4 has 324, 6 has 9, 8 has 1. 443 bars (15.4%) are a pure loop of onsets (period 1, 2, 4 or 8), and 52 (1.8%) a pure loop with their pitches. 1,186 bars (41.2%) need an `@` weight: the smallest term without weights is larger.
  - The five patterns' steps: root {0,8}, pump {2,6,10,14}, eight (every even step) and walk {0,4,8,12} are each `even(k, 16, shift)` (k of 2, 4, 8 and 4); funk {0,3,6,7,10,11,13,14} is not.
    A bar's onset set equals one pattern's steps in 401 bars (13.9%: walk 314, root 76, pump 10, eight 1), is a proper subset of exactly one pattern's in 1,062 (36.9%: eight 622, funk 440), of several without equalling one in 831 (28.9%), and of none in 586 (20.3%).
    The patterns are chances per step, and a bar adds forced notes at chord changes and anticipations, so a bar's onset set names a pattern only where it fills the pattern's steps, and a short set (a lone onset on step 0) is a subset of several.
  - Words split by `even(k, n)` with k not dividing n: 9 bars (0.3%) have an onset set that is such a split of the 16 steps, all k = 6, and all are `even(6, 16, 0)`, so the rotation is 0 in this corpus. Allowing such a split as one more piece makes no bar's smallest term smaller (0 of 2,880). These terms are costed, not printed and expanded.
  - Not measured: captured music (the corpus is the engine's own bass, generated, in five patterns and their ornaments), the lead and drums, a musician's reading of any form, and the cost of a token in characters.

- **E28. The pure cell** (#287 step 0), in
  [`packages/engine/experiments/pure-cell.ts`](../packages/engine/experiments/pure-cell.ts)
  (about 15 s), over E20's corpus (every preset at entropy 0.3, 5 seeds, 64 bars: 1,671 bars with a lead note, 1,646 judged as a motif).
  A pure cell is chromatic, its heights the notes' semitones from its first note; the `Motif` is the same rhythm with its heights pulled back along the key's scale.
  The operators of `motifs.ts` act on both.
  - **Representability.** Every note is in the key's scale in 97.7% of the lead's bars, in its pentatonic in 24.3% and in its blues scale in 24.3% (the same bars: the corpus plays the plain scale, so the pentatonic and blues paths are unexercised). A judged bar needs an accidental in 2.3% under the true key, 52.1% read a fifth off and 98.6% a semitone off. A chromatic cell needs none in any.
  - **Identity.** In 70 runs, 1,646 bars are 1,036 distinct chromatic shapes (994 by orbit under `rev`, `mirror` and `late`) and 814 distinct degree shapes (758 by orbit). The degree form is the coarser: it counts a diatonic transposition as the same cell, the chromatic form does not. So the pure cell does not deduplicate a library better; it deduplicates a different thing.
  - **Variations.** Of 1,155 later bars of four-bar phrases, 38.4% are an earlier bar's image under an operator in the degree form and 16.5% in the chromatic form; 190 are both, 253 the degree form only and 1 the chromatic only. The 253 are diatonic operators (a step of the scale, a mirror about a degree) that are not chromatic ones. So the operators must act on the helix (degree indexed), which is to say the chromatic cell keeps U5's operators only through a scale; its own exact operators are the chromatic transposition and mirror. The lead's fit (E20) is not switched off here, so this is with it.
  - **A key misread.** Of the 443 pairs recognised in the degree form, 44.9% are still recognised with the later bar read a fifth off and 2.5% a semitone off. The chromatic form is built from the notes and does not read a key, so it holds under any misread by construction, which is not a measurement.
  - **Structure (chance in brackets, over every subset).** Lead onset sets of 3 to 5 onsets are a progression in Z16 in 33.0% (20.0%), 13.2% (5.5%) and 5.3% (2.2%) of bars, and none of 6 or 7; the bass's 3 to 7 in 33.7% (20.0%), 44.5% (5.5%), 6.3% (2.2%), 3.8% (1.2%) and 21.6% (0.7%). Lead pitch-class sets are an arc of the circle of fifths in 1.4% of the 3-sets (5.5%), 2.0% of the 4-sets (2.4%) and 2.4% of the 5-sets (1.5%), so no more than chance; the bass's 3-sets in 32.3% (5.5%) (root, fifth and the note beside) and its 4-sets in 0.6% (2.4%). An orbit description covers the bass's rhythm and root-fifth pitch, and not the lead's pitch.
  - Not measured: the fit switched off (the engine has no such setting, so the with-and-without columns of E20 wait for step 4 of #287), offered motifs and captured music (the corpus is the engine's own lead), and the chromatic cell's accents and rests in identity.

- **E29. The hull of the twelve, and one snap for every sub-grid** (#287 step 4), in
  [`packages/engine/experiments/pitch-hull.ts`](../packages/engine/experiments/pitch-hull.ts)
  (under 2 s), over every subset of Z12 (4,096) and of Z16's Euclid grids.
  The chromatic cell lives in a finite space, so a claim about it is tested over every case.
  - The 4,096 subsets fall into 352 classes under transposition and 224 under transposition and inversion. A scale is a point in that hull; the diatonic set has 12 transpositions, so its 84 (tonic, mode) pairs are 12 distinct sets.
  - Z12 is Z3 × Z4 by a pitch class's remainders: a major third (4) moves only the remainder mod 3, a minor third (3) only the remainder mod 4, and a fifth (7 = 4 + 3) moves both. The circle of fifths is the diagonal of the 3 × 4 grid (the Tonnetz), and reaches all twelve because 3 and 4 are coprime. Z16 of a bar is a nested tree (halve, halve, halve); Z12 is a product, so its 3 groups of 4 and 4 groups of 3 are one grid.
  - One subgroup for each divisor of 12, each `even(k, 12)` in 12 / k transpositions: the tritone (k = 2, 6), the augmented triad (3, 4), the diminished seventh (4, 3), the whole-tone scale (6, 2).
  - A window of m fifths is maximally even (an `even(m, 12)` in some rotation) exactly for m of 1, 5, 7, 11 and 12, the m coprime to 12; the windows of 2, 3, 4, 6, 8, 9 and 10 (a sus2, an add6 or quartal stack) are real sets that no Euclid pair finds. Three 5-windows, the three pentatonics, lie in each 7-window. On `SCALES`, the diatonic modes and the pentatonic family are windows and Euclid sets; whole-tone and the two octatonics are Euclid sets but not windows; the blues, harmonic and melodic minor families and the augmented scale are neither.
  - `snap(grid, n, height)`, the nearest member of a sub-grid with the cycle carried and a tie to the lower, is a member, the nearest, the identity on the grid, and equivariant under transposition, for every one of the 4,095 sub-grids of Z12 at 36 heights. The same function over Z16 snaps a bar's steps to any sub-grid (`even(k, 16)` for k of 1, 2, 3, 4, 5, 7, 8, 16 are checked), the last step going to the next bar's first where that is nearest. A chord is a subset, so snapping to a chord tone and to a scale is one operation.
  - Not measured: the tertian chords as short monotone paths on the 3 × 4 grid (a claim, untested), a snap over the lead (what it does to the recognition of E20 and E28 is step 4), a rhythm snap on a live hand (a note may not move earlier than it was played), and a sub-grid of the triplet levels (Z24 and Z48).

- **E30. The radio's walk over hours of music** (#313), in
  [`packages/engine/experiments/radio-walk.ts`](../packages/engine/experiments/radio-walk.ts)
  (about 45 s), held by [`packages/engine/experiments/radio-walk.test.ts`](../packages/engine/experiments/radio-walk.test.ts):
  the radio (`packages/engine/src/radio.ts`) wanders freely, with no pull, its steps scaled by the entropy and the tempo leaned by the energy, as the owner ruled on #313 (2026-10-16).
  It is tuned in at each preset's point with a setting's energy and entropy in place of the preset's, and left alone for 3 hours of music over 5 seeds a preset, each section's style glided to over `PRESET_GLIDE`; a section lasts 19.5 s on average.
  Fifteen settings: entropy 0.15, 0.3, 0.6 and 1 by an energy tuned in at of 0.2, 0.5 and 0.8, energy walking, and entropy 0.3 with energy held at each.
  Distances are on the unit axes, tempo on its unit scale; the nearest preset is read at each bar's start by `styleDistance`.
  - The tempo moves at most 1.00 % a section at entropy 1, 0.62 % at 0.6, 0.33 to 0.34 % at 0.3 and 0.17 to 0.19 % at 0.15.
    In an hour it moves 4.1 % (root mean square) at entropy 0.3 and energy 0.5, 6.7 to 7.3 % at energy 0.2 or 0.8, and 9.5 to 10.0 % at entropy 1; over 3 hours a run spans 10 % at entropy 0.3 and energy 0.5, about 20 % at 0.2 or 0.8, and 25 to 27 % at entropy 1.
    Energy leans it: tuned in at 0.8 and entropy 0.3, the median run ends at 140 bpm, at 0.2 at 96, and at 0.5 at 115; held at 0.8 a tenth of the runs end at the axis's top, 180, and spend 5 % of their sections within 2 % of it.
    With energy held at 0.5 the tempo moves 2.3 % an hour, against 4.1 % with energy walking, whose lean the tempo follows.
  - Each axis walks from where it was tuned in, after 10 minutes, an hour and 3 hours, about 0.07–0.11, 0.15–0.22 and 0.21–0.38 at entropy 0.3, about twice that at 0.6 within the hour, and at entropy 1 0.22–0.30 within 10 minutes and 0.30–0.44 within the hour, where the axis's ends begin to hold it; the tempo, on its unit scale, 0.010, 0.025 and 0.084 at entropy 0.3.
  - The nearest preset first changes after a median of 72 to 90 minutes at entropy 0.3, 19 to 23 at 0.6 and 9 to 12 at 1, and not within 3 hours in at least half the runs at 0.15.
    It changes 4.8 to 7.0 times an hour at entropy 0.3, 13 to 15 at 0.6 and 23 to 25 at 1, and about a fifth of changes, 18 to 23 % at every setting, are undone within a section: the walk runs along the border between two presets.
    The station plays nearest the preset it was tuned in at in 62 to 72 % of bars at entropy 0.3 (89 to 96 % at 0.15, 33 to 38 % at 0.6, 22 to 24 % at 1), and is nearest 2.3 to 2.8 of the 8 presets some time in 3 hours at 0.3 (6.3 at 1).
  - No axis glides faster than a tenth of the fastest a preset glide moves it, even at entropy 1 (harmony, articulation and energy 0.10); at entropy 0.3, 0.03.
  - The style's loop with nobody in it, over 4 walks of 100,000 sections at each entropy (#210's three numbers, A4): its time constant, `timeConstant` of each axis's correlation a section later, is 53 to 144 sections on the unit axes at entropy 1 (0.3 to 0.8 hours, 63 to 173 times the key loop's 6.67 bars) and 562 to 1,561 at 0.3 (3.0 to 8.5 hours), a little under the reflected walk's slowest mode, 2 / (π² σ²) sections (61 to 169 at 1); the tempo's is 6,369 sections at entropy 1.
    It scales as 1 / entropy², so the loop nests under the key's at every entropy above 0.
    Its gain, the mean step against the distance from the axis's middle inside its middle half, is 0 within twice its error at every entropy (at most 5.4e-4 ± 3.3e-4 a section, where a pull of 1/128 reads −7.8e-3): nothing reads, remembers or leans.
    Its bound is the axis, reflected, and the step: the largest step is the step the entropy allows (the tempo 0.995 to 1.000 of it), and no value after the first sits on an end.
  - Entropy, walked under its own temperature (a step of 0.06 scaled by itself), cools from 0.3 to a median of 0.24 in 3 hours, 0.083 in 12 and 0.001 in 48: a multiplicative walk creeps to 0 and freezes there, so entropy holds.
  - Not measured: the music (the band was not run, only the style), a key under the walk (#313 step 4), a meter other than 4/4, and whether a listener hears the station as itself after 10 minutes.

- **E31. The band's drums as cells text** (#309, the seam), in
  [`packages/score/experiments/drums-in-cells.ts`](../packages/score/experiments/drums-in-cells.ts)
  (about 2 s, under vitest only: `@yggi/cells` ships TypeScript, which node does not strip under `node_modules`), held by [`packages/score/experiments/drums-in-cells.test.ts`](../packages/score/experiments/drums-in-cells.test.ts):
  for each preset held (seed 0, entropy 0.3), the first of 32 bars with the most roles, then the most hits, is stated in cells v0.3.0 by a small translator, compiled, and played through cells' own MIDI out (`channelTable`, `router`, `midiNote`).
  Each witness is a section's last bar, with a fill; the eight hold 144 hits, every role and every sound.
  The translator uses only forms cells has, and records what it cannot say as a gap, with the bar as witness.
  - Every hit plays as the band plays it, 144 of 144, with no diagnostic: its General MIDI note, its step, its written length of one step and its velocity.
  - A role is a line named by it (`&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.089528 ~ …`), and each line played alone plays that role's hits, so the snare's role, open in the score (E16), is a word in cells.
  - A velocity v is a hit's level, (v/127)², since cells' MIDI out strikes a note at 127·√level: every velocity from 1 to 127 comes back, as a hit's own level (`&sd:0:.0635`) and as a line of levels (`map=amp`).
  - The rim is one Euclid token, `&rim(k,16,r)` on a step of the whole bar, with its accents a line of levels the card multiplies it by.
    Every rim the band can write, `even(k, 16, shift)` for k of 3, 5 and 7 and a shift of 0 to 3, is cells' `euclid(k, 16, shift + c)` with c of 6, 4 and 0: D3's first row ("cells in the text, `even` underneath") in practice.
  - Gap 1, a drum voice that is only its MIDI note.
    A cell is a voice only with a sound parameter (`s=`, `lpf=` and the like); `gain=1`, `oneshot` or nothing leaves a kit member no voice, and the line that names it plays nothing.
    So the text names a sound, `s=white`, that the band never makes.
    Witness: Synth-pop's bar 23, its voices with `gain=1`: "&kick has no voice", and none of its 12 hits sounds.
  - Gap 2, a role's accent left to the player.
    The band writes a role and plays a velocity: the role's accent (`dynamics.ts`) loosened by the licence (`performer.ts`); cells plays the levels a text states.
    Every line of a role whose accent is one number in a bar (ghost, pedal, euclid) and has two hits or more plays them at more than one velocity, 5 lines of 5; Funk's bar 23 plays its rim's 7 hits at 5.
    So either the text holds the performance, against D3's ruling that the jam's text holds what is composed (T4), or the accents change: cells has no form for a level read from a line's role and a seeded licence.
  - Not measured: when a step plays (the swing and a tempo in a glide, which the transport maps), the played length (the licence's gate, a little under a step, where cells holds the whole step), a meter other than 4/4 (the band writes none), more bars than one per preset, and the other parts.

- **E32. The band's harmony as cells text** (yggi/cells#50, its first step; #309, the seam), in
  [`packages/score/experiments/pitch-in-cells.ts`](../packages/score/experiments/pitch-in-cells.ts)
  (about 4 s, under vitest only, as E31), held by [`packages/score/experiments/pitch-in-cells.test.ts`](../packages/score/experiments/pitch-in-cells.test.ts):
  every preset held (all 8, seed 0, entropy 0.3, 32 bars: 256 bars, 262 chords, six keys in three modes), each bar's harmony (its key, its chords as numerals, the next chord where a stab plays it, the frame pin) written under three candidate spellings in cells and read back.
  The three share the key (`&key scale(aeolian, A)`), the rhythm (a token a chord, `step=2n`, `@k`), the next chord as a one-chord cell (`&next`, over the next key where it differs) and the pin as degrees of the key from the part's voice (`&frame over=&key [0,2,5]`, `&frameBass over=&key 5`); they part on the chord.
  - **stacks** (cells v0.3.0 parses it, as its `chords.cells`): a stack of the key's degrees, `[4,6#,8,10]`.
  - **shapes** (cells v0.3.0 parses it, as its `tines.cells`): a shape moved up the key, `&c0 [0,2#,4,6]` and `&c0^4` (decisions 015 and 033).
  - **numerals** (a proposal: cells has no numeral): U1's numeral as a token over the key, `V7/V`; its meaning is the stack it names, and every bar's numerals text lowered by it is that bar's stacks text.
  - **Characters, and the bars that read back exactly**: the score's own `key=`, `harm`, `next` and `frame` 12,900 and 256; stacks 26,156 and 252; shapes 28,401 and 252 (25,206 with its shapes stated once a preset); numerals 24,553 and 256.
    The chords' lines alone are 2,936 in the score, 9,099 stacks, 11,344 shapes and 7,496 numerals; the key (5,744) and the pin (11,569) are the same lines in every candidate.
    Every stacks and shapes text compiles with no diagnostic and plays the band's chords step for step; every pin reads back through cells.
  - **Every case**: every numeral `numeralOf` writes in the 48 keys of the composer's four modes, 10,944 of them and 4,560 with a root off the key (U1), reads back in every candidate. Every V, V7 and V9 of a major or minor degree, 720, reads back only as a numeral.
  - Gap 1, a secondary's function: stacks and shapes play V7/V's notes and read back II7 (Swing jazz's bars 2, 6, 10 and 14, the four bars lost; and all 720 secondaries).
  - Gap 2, a key of another cycle (P5): a cells accidental is a step of the grid, so over a 31-tone major key `[1,3#,5]` plays the 14th step, and the F♯ that U1's chromatic step (2) means is `3##`: a stacks or shapes text says one chord differently in each cycle; a numeral does not, but cells has none. The band writes no other cycle, so this is a probe.
  - Gap 3, the hand: a pin is data every candidate states and reads back (464 pins, 1,036 notes, 33 off the key), and none says what it is for, the voicing led from it: Synth-pop's bar 2 plays V as 56 59 64 from its pin and 59 64 68 from none.
  - Gap 4, the next chord is a copy: 19 bars state it again, one in the next key (Funk's bar 23), 6 across a section's end; no candidate refers to the next bar's chord.
  - Gap 5, a chord's scale as a line's default (U3): no candidate has one, and no line of the band reads one; every chord's implied scale can be stated once on a line, 256 of 262 by cells' own names and 6 (V and V7 in minor) as tonal's `scale("E:phrygian:dominant")`, each playing the scale `chordScale` gives.
  - Not measured: a section's text as one piece (a pick of the harm line, `&harm[$k]`, could name 13 of the 19 next chords), the bass and comp lines themselves, the numerals' spelling inside cells (`°` and `ø`, and `bVII` against D3's accidental after the number), a key of another cycle in the band, and captured music (the analyzer's roots off the key).

- **E33. The band writes a whole bar as one cells text** (#359, rung 3 of #358; #63, the seam), in
  [`packages/score/experiments/bar-in-cells.ts`](../packages/score/experiments/bar-in-cells.ts)
  (about 5 s, under vitest only, as E31), held by [`packages/score/experiments/bar-in-cells.test.ts`](../packages/score/experiments/bar-in-cells.test.ts):
  the drums, the bass, the comp and the harmony of a bar stated together in cells v0.3.0, with `&bar` a `meter(…)` cell and every line on a tap of it, played through cells' MIDI out and read back part by part on Jambot's own channels (10 the drums, 2 the bass, 3 the pad and the stab).
  The bars come from the band's transport, a preset held, its bpm counting the meter's beats (T7, #367): all 8 presets in 4/4, and Synth-pop and Bossa nova (both swing 0, and between them every part but the lead) in 3/4 and in 7/8 (3+2+2), seed 0, entropy 0.3, 32 bars each: 12 runs, 384 bars.
  What is compared is what is composed, without the licence (T17): each note's step, pitch and written length in whole steps, and its velocity as the performer plays it at feel 0 (`baseVelocityOf` plus a written accent).
  - The text: `&bar meter("7/8") step=108bpm`; the harmony as E32's stacks, `&key scale(aeolian, A)` and `&harm over=&key step=2n [0,2,4] [4,6#,8]` (the owner's choice, 2026-10-17), which nothing plays; the drums as E31's, a line a role on `16n` with each hit's level, the rim `&rim(5,14,0)` on `1m`; the bass and the comp on `16n` as degrees of the key from their voices (C1, C3), a note held `@k`, a chord a stack, their velocities through a gate (`&bassOut play=&bass level=&bassLevel &bassV`), a line of levels or one gain; one MIDI card.
  - **Bars equal**: drums, bass and comp 384 of 384 in every run, 7,478 notes with no diagnostic; the harmony 380 of 384, 32 of 32 in every run but Swing jazz's 28 (gap 3).
  - **Onsets within 1 ms**: 4,067 of 4,067 in the 7 runs whose swing is 0 (Synth-pop, Techno and Bossa nova, each in every meter it runs), each bar laid at the end of the bar before as cells holds it, over 32 bars; the farthest is 8.2e-13 s, rounding, in every meter.
    Both bpms count the meter's beats (cells decision 040, T7), so the text states the band's tempo as it is, with no conversion; 7/8 stated in its quarters, 126 for 108, is more than 1 ms off, as is a tempo a hundredth of a bpm away (yggi/cells#88, the reading built).
  - **Characters**: 281,123 over the 384 bars, 732 a bar: the drums 139,824 (39,242 of them the hits' levels), the bass 50,061, the comp 40,520, the harmony 12,921 and its key 8,640, the meter 11,456, the card 17,701.
    By run, 4/4: Synth-pop 24,345, Techno 25,939, Deep house 24,891, Ambient 15,155, Lo-fi hip hop 24,381, Funk 30,824, Bossa nova 24,149, Swing jazz 25,011; Synth-pop 21,891 in 3/4 and 21,597 in 7/8, Bossa nova 21,254 and 21,686.
  - Taps hold in every meter: the drums' and the lines' `16n`, the chords' `1m` (and `2n` in the 6 bars of Swing jazz that hold two chords, the only ones), and the rim's Euclid on `1m` over the bar's 12 or 14 steps; no line steps by `&bar` itself.
  - With the licence left out, E31's gap 2 does not arise for the rim: in the 90 bars it plays, its hits take one level, `&euclid * .208568`.
  - Gap 1, a line's articulation ([yggi/cells#94](https://github.com/yggi/cells/issues/94)).
    The bass and the stab sound a share of their written length (`baseLengthOf`), 2,242 of the 2,979 bass, pad and stab notes, one share a line, the same in every meter: from .32 (Techno's bass) to 1.885 (Swing jazz's stab, longer than written); the pad 1.
    Cells has no such form (Strudel's `clip`, `legato`), so the text states the written length, which is what is compared; sounding its share, no note runs into its line's next onset, and 46 stabs run past the bar line.
    Witness: Techno's bar 0, its bass written 8 steps and sounding 2.56; cells plays 8.
  - Gap 2, the chord in force ([yggi/cells#95](https://github.com/yggi/cells/issues/95)).
    The comp and the bass state their notes as degrees of the key, so every chord is stated again, voiced, in the comp (E32's gap 3, the hand), though 2,862 of the 2,979 notes are tones of the chord sounding (the pad 678 of 678, the stab 1,316 of 1,374, the bass 868 of 927).
    `over=&harm` reads the braid of chords as turned: past the chord's last tone it plays the next chord's, not the chord a lap up (over `[0,2,4,6] [4,6#,8,10]` from C1, index 4 plays E2, not A2).
  - Gap 3, a secondary's function (E32's gap 1, [yggi/cells#50](https://github.com/yggi/cells/issues/50)): Swing jazz's bars 2, 6, 10 and 14 state V7/V or V9/V, whose stacks read back as II7 and II9.
  - Gap 4, swing on the bar ([yggi/cells#18](https://github.com/yggi/cells/issues/18), its first rung): the times of the 5 swung presets are not compared, their steps are.
    E31's gap 1 holds too: each drum voice names a sound, `s=white` ([yggi/cells#10](https://github.com/yggi/cells/issues/10)).
  - What the seam's next rung (#63 step 5) needs that cells lacks: swing on the bar (#18); a line's articulation (#94), and with it a note that sounds past the bar line, which a text of one bar can't hold; a line over the chord in force (#95) and the next chord (#50), so the parts read the harmony instead of restating it; a fragment that leaves `&bar` and `&key` to the host (yggi/cells#22); the lead (yggi/cells#47, #348); a role's accent as a level (yggi/cells#21), since the hits' levels are 28 % of the drums' text; and a tempo that glides, since a text holds one bpm and the transport's tempo moves within a bar.
  - Not measured: the lead, the licence (the played velocity and length), a tempo in a glide, a meter that changes between sections (each text states its bar's), a chord on a half of 3/4 or 7/8 (no bar of those runs holds two), seeds other than 0, and the swung presets in 3/4 and 7/8.

#7's decisions are made: (a) to (c) as U1 to U3, (d) as U4 and U5, and (e) to
(h) as T4's performance maps, C7, L6 and P5.
