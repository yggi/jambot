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
  - Under the radio's walk (#313 step 4; `keyRun`'s `radio`, entropy 0.3, 0.6 and 1, 20 seeds, 33 sections, the style tuned in at each preset and walked a section at a time, glided as the player glides it), the key has no home either.
    Where it moves, it ends 1.9 to 3.4 fifths from where it opened after 32 sections at entropy 0.3 (leaving out Techno and Funk, below) and 2.0 to 3.4 at 1, and is back on it in 0 to 15% of runs at 0.3 and 0 to 20% at 1 (a random key 8%).
  - The walk changes the key's reach, since `harm` walks: Techno, whose key never moves at its own harm 0, moves it at 4% of boundaries at entropy 0.3 and 51% at 1 as the walk raises its harmony; Funk's 11% and 51% are below the 20% and 63% it has left alone; and a jump may pass the reach of the preset tuned in at (widest 5 fifths from Synth-pop's 3).
    At entropy 0.3 Techno stays home in 18 of 20 runs (90%) and Funk in 13 (65%), since their harmony takes many sections to leave 0 and the least.
  - So the key under the radio is the key left alone, followed by the style's reach: no plan, no home, nothing added to the band.
    The owner chose this (2026-10-18, on #313: "A, as recommended"): under the radio the key is left alone, and the planned cycle (#233), which would give it a home against the ruling that the style wander freely, stays a question for the form, not the radio.

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
  (about 95 s with its variants, rates and trims; its test, a sample, about 10 s): the Muse hears the band's own lead as she hears a player, and her offer goes back into the band with F7's delay, so what she hears in bar k plays from bar k + 2.
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
  - The length apart from the variation (`TRIMS`, #237 step 0b): the lead trims the offer to its first k notes (`trimmed`, `head`, which draws nothing) and then varies it at p, for k = 2, 3 and 4 at p = 0 and 1.
    So p = 0 k = 3 is a motif of three notes that copies itself, and p = 1 k = 3 the same varied once a bar; a k past every motif's notes plays as its rate, which the test holds.
    Beside them, the rates past 2 (`PAST`: 2.5, 3 and 4).
    Over every preset at entropy 0.3, 3 seeds of 128 bars, the range over the presets (motif bars: the bars the Muse judges a motif; lead notes from bar 32):

    | condition | motif bars | recognised | exact   | A B A B | distinct | lead notes a bar |
    | --------- | ---------- | ---------- | ------- | ------- | -------- | ---------------- |
    | p = 0     | 62–94%     | 86–92%     | 86–100% | 50–65%  | 7–11     | 3.0–5.7          |
    | p=0 k=4   | 62–94%     | 85–90%     | 79–100% | 46–59%  | 8–12     | 3.0–4.0          |
    | p=0 k=3   | 62–94%     | 85–92%     | 79–100% | 41–64%  | 8–13     | 2.4–3.0          |
    | p=0 k=2   | 1–2%       | 0–17%      | 0%      | 0%      | 2        | 1.6–2.0          |
    | p = 1     | 56–90%     | 62–74%     | 46–57%  | 12–17%  | 24–49    | 2.8–4.1          |
    | p=1 k=4   | 52–84%     | 65–74%     | 46–56%  | 13–18%  | 24–35    | 2.3–3.3          |
    | p=1 k=3   | 50–78%     | 68–74%     | 46–57%  | 11–17%  | 21–27    | 2.2–2.8          |
    | p=1 k=2   | 1–2%       | 0–17%      | 0%      | 0%      | 2        | 1.6–2.0          |
    | p = 2     | 45–71%     | 52–62%     | 49–63%  | 4–10%   | 24–45    | 2.3–2.9          |
    | p = 2.5   | 41–65%     | 46–57%     | 43–60%  | 5–11%   | 29–49    | 2.2–2.9          |
    | p = 3     | 34–57%     | 40–46%     | 46–56%  | 5–8%    | 25–44    | 2.1–2.7          |
    | p = 4     | 31–45%     | 26–41%     | 39–73%  | 0–8%    | 25–36    | 2.1–2.4          |
    - The trim holds the length where the variation moved it: at p = 0 the lead plays k notes a bar wherever its motifs had more (3.0 at k = 3 in every preset but Ambient, 2.4), and Bossa nova, whose motifs have three, plays the same at k = 4 as untrimmed.
    - A short motif alone doesn't loosen the lock: at p = 0 k = 3 the Muse still recognises 85 to 92% of the bars, as at p = 0, mostly as exact repeats, with A B A B at 41 to 64%.
    - At p = 1, k = 3 thins the lead to p = 2's length with one variation a bar: Deep house plays 2.8 notes a bar at p = 1 k = 3, 2.9 at p = 2 and 3.0 at p = 0 k = 3, and Swing jazz 2.8, 2.9 and 3.0.
      By the Muse's measures p = 1 k = 3 sits with p = 1, not with p = 2: it recognises 68 to 74% of the bars (Deep house 70.9%, against 64.1% at p = 1 and 55.7% at p = 2), and A B A B is 11 to 17%.
      So what p = 2 does to recognition is the second variation's, not the shorter motif's; whether the ear hears Deep house's preference so is the owner's to say.
    - k = 2 opens the loop: the Muse judges a bar of fewer than three notes too few (`muse.ts`), so she hears 1 to 2% of the bars as motifs, and the lead plays two notes in every bar from bar 32 on, at p = 0 and p = 1 alike.
      Three notes is the shortest motif the loop can hear.
    - Past p = 2 the stacked variations drop notes until a bar has two, which the Muse doesn't hear as a motif.
      Over every preset, every bar from bar 32 that is neither a motif nor silent has fewer than three notes: 28% of the bars at p = 2, 46% at 3 and 56% at 4.
      So the motif bars fall with p (Kendall's tau −1 from 2 to 4 at the licence's ends, which the test holds), and from p = 3 the recognised share is below the deaf band's in every preset.
      The lead thins only to 2.1 to 2.9 notes a bar, since a variation drops a note only from three or more.
      Past 2, then, the measures fall partly because the Muse stops hearing the thinned bars, not only because the variation outruns her recognition: the confusing edge found by p is confounded with the length, as Deep house's preference was.
    - The renders of seed 1's bars 32 to 47 (Deep house and Swing jazz at each trim beside p = 0, 1 and 2; Swing jazz at 1.5, 2, 2.5, 3 and 4) are with the owner, whose ear places the length and the confusing edge (#237).

  - Not measured: weights for the band's voices beside the players', since no players play here; the style's distance over time, which needs the critic (#15); and where past p = 2 the loop turns confusing at a length the Muse can hear, which needs a variation that keeps three notes.

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
    `readTiming` finds the tempo from how long the steps last.
    Over 3 seeds of 16 bars, the tempo has tau 1.00 over the presets and its sweep and an error under 10⁻⁶ bpm, and 0.94 over the tour, 0.06 bpm off, since a glide moves the tempo inside a bar.
    The tempo is the clock's own number, so its reading proves the reader and not the composer.
  - Swing is not read: it is the meter's, not the style's (#360), and each preset plays in its meter's swing.
    The onsets' own reader still finds it in the played time (`estimateSwing`, for the Muse and the analyzer); reading it into the meter is #368.
  - Not measured: `harm` (needs the chords, not read from notes yet), per-part readings (step 4), and the real music the analyzer will read.

- **E24. Does Techno land where techno lands?** (#15 step 3, N3), in
  [`packages/engine/experiments/genre-calibration.ts`](../packages/engine/experiments/genre-calibration.ts),
  held by [`packages/engine/experiments/genre-calibration.test.ts`](../packages/engine/experiments/genre-calibration.test.ts):
  the transport plays each preset's point, `readStyle`, `readTiming` and `readHarm` read the bars, and `genreOf` (`packages/engine/src/genre.ts`) turns the reading into probabilities over the presets by a softmax over the distances at a temperature.
  The reading has five axes (`energy` from the density, `sync`, `artic`, `bpm` on its log axis scaled to 0 to 1, and `harm`); the distance is a root mean square over them.
  Swing is not one: it is the meter's (#360), and each preset plays in its meter's swing, which the drums, the bass and the lead still hear.
  3 seeds of 32 bars per preset, temperature 0.1, against two sets of landmarks: the presets' own points, and where the presets' bars read (the mean over 5 other seeds).
  - Against the presets' points, a single bar lands as its own preset in 0.53 of bars on average (chance 0.125): Ambient 1.00, Techno 0.82, Synth-pop 0.76, Swing jazz 0.71, Deep house 0.53 and Lo-fi hip hop 0.40, but Funk 0.00 and Bossa nova 0.00.
    The reading is compressed short of the axes (E23, E25), so a preset far out on one, Funk's `sync` of 1, has no bar near its point.
  - Against where the presets read, 0.69: Ambient 0.91, Funk 0.82, Techno 0.77, Lo-fi hip hop 0.77, Swing jazz 0.69, Deep house 0.59, Bossa nova 0.57 and Synth-pop 0.42.
    So the critic's landmarks are measured, not read off the presets.
  - Each axis added lifted it. On the three axes of the notes alone (`energy`, `sync`, `artic`) it was 0.30 against the points and 0.41 against where the presets read; with `bpm` and `harm` it is 0.53 and 0.69.
    With the swing read as a sixth axis, before it left the style (#360), it was 0.64 and 0.80: Synth-pop, Lo-fi hip hop and Bossa nova sat in the middle of the note axes and were separated by the clock, and Swing jazz landed in 0.91 of bars.
    So four axes and the tempo place a bar less well than they did with swing (#358's open question, measured for the reader, not the composer).
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
  The walk is over the five unit axes and the tempo: swing is the meter's, not an axis (#360), so the radio leaves it where it was tuned in, and the nearest preset is read without it.
  - The tempo moves at most 1.00 % a section at entropy 1, 0.62 % at 0.6, 0.33 to 0.34 % at 0.3 and 0.17 to 0.19 % at 0.15.
    In an hour it moves 4.2 % (root mean square) at entropy 0.3 and energy 0.5, 6.3 to 7.8 % at energy 0.2 or 0.8, and 9.6 to 10.1 % at entropy 1; over 3 hours a run spans 9 % at entropy 0.3 and energy 0.5, about 20 % at 0.2 or 0.8, and 24 to 27 % at entropy 1.
    Energy leans it: tuned in at 0.8 and entropy 0.3, the median run ends at 142 bpm, at 0.2 at 99, and at 0.5 at 118; held at 0.8 a tenth of the runs end at 179 or above, and spend 7 % of their sections within 2 % of the axis's top.
    With energy held at 0.5 the tempo moves 2.3 % an hour, against 4.2 % with energy walking, whose lean the tempo follows.
  - Each axis walks from where it was tuned in, after 10 minutes, an hour and 3 hours, about 0.07–0.10, 0.13–0.24 and 0.21–0.32 at entropy 0.3, about twice that at 0.6 within the hour, and at entropy 1 0.22–0.29 within 10 minutes and 0.29–0.42 within the hour, where the axis's ends begin to hold it; the tempo, on its unit scale, 0.011, 0.030 and 0.079 at entropy 0.3.
  - The nearest preset first changes after a median of 43 to 76 minutes at entropy 0.3, 12 to 18 at 0.6 and 4 to 6 at 1, and at 0.15 not within 3 hours in at least half the runs, but for energy 0.8 (159 minutes).
    It changes 3.9 to 7.7 times an hour at entropy 0.3, 13 to 17 at 0.6 and 24 to 26 at 1, and about a fifth of changes, 19 to 23 % at every setting, are undone within a section: the walk runs along the border between two presets.
    The station plays nearest the preset it was tuned in at in 62 to 71 % of bars at entropy 0.3 (79 to 91 % at 0.15, 35 to 41 % at 0.6, 26 to 29 % at 1), and is nearest 2.4 to 2.8 of the 8 presets some time in 3 hours at 0.3 (6.2 to 6.3 at 1).
    It changes sooner than when swing walked as an axis (72 to 90 minutes at entropy 0.3): with an axis fewer, no two presets lie farther apart, and the walk's draws are new.
  - No axis glides faster than a tenth of the fastest a preset glide moves it, even at entropy 1 (harmony, articulation and energy 0.10); at entropy 0.3, 0.03.
  - The style's loop with nobody in it, over 4 walks of 100,000 sections at each entropy (#210's three numbers, A4): its time constant, `timeConstant` of each axis's correlation a section later, is 53 to 142 sections on the unit axes at entropy 1 (0.3 to 0.8 hours, 64 to 170 times the key loop's 6.67 bars) and 570 to 1,524 at 0.3 (3.1 to 8.3 hours), a little under the reflected walk's slowest mode, 2 / (π² σ²) sections (61 to 169 at 1); the tempo's is 7,208 sections at entropy 1.
    It scales as 1 / entropy², so the loop nests under the key's at every entropy above 0.
    Its gain, the mean step against the distance from the axis's middle inside its middle half, is 0 within twice its error at every entropy (at most 3.7e-4 ± 3.9e-4 a section, where a pull of 1/128 reads −7.8e-3): nothing reads, remembers or leans.
    Its bound is the axis, reflected, and the step: the largest step is the step the entropy allows (the tempo 0.992 to 1.000 of it), and no value after the first sits on an end.
  - Entropy, walked under its own temperature (a step of 0.06 scaled by itself), cools from 0.3 to a median of 0.22 in 3 hours, 0.063 in 12 and under 0.001 in 48: a multiplicative walk creeps to 0 and freezes there, so entropy holds.
  - Not measured: the music (the band was not run, only the style), a key under the walk (#313 step 4), a meter other than 4/4, and whether a listener hears the station as itself after 10 minutes.

- **E31. The band's drums as cells text** (#309, the seam), in
  [`packages/score/experiments/drums-in-cells.ts`](../packages/score/experiments/drums-in-cells.ts)
  (about 2 s, under vitest), held by [`packages/score/experiments/drums-in-cells.test.ts`](../packages/score/experiments/drums-in-cells.test.ts):
  for each preset held (seed 0, entropy 0.3), the first of 32 bars with the most roles, then the most hits, is stated in cells v0.9.0 by a small translator, compiled, and played through cells' own MIDI out (`channelTable`, `router`, `midiNote`).
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
  (about 4 s, under vitest, as E31), held by [`packages/score/experiments/pitch-in-cells.test.ts`](../packages/score/experiments/pitch-in-cells.test.ts):
  every preset held (all 8, seed 0, entropy 0.3, 32 bars: 256 bars, 262 chords, six keys in three modes), each bar's harmony (its key, its chords as numerals, the next chord where a stab plays it, the frame pin) written under three candidate spellings in cells and read back.
  The three share the key (`&key scale(aeolian, A)`), the rhythm (a token a chord, `step=2n`, `@k`), the next chord as a one-chord cell (`&next`, over the next key where it differs) and the pin as degrees of the key from the part's voice (`&frame over=&key [0,2,5]`, `&frameBass over=&key 5`); they part on the chord.
  - **stacks** (cells v0.9.0 parses it, as its `chords.cells`): a stack of the key's degrees, `[4,6#,8,10]`.
  - **shapes** (cells v0.9.0 parses it, as its `tines.cells`): a shape moved up the key, `&c0 [0,2#,4,6]` and `&c0^4` (decisions 015 and 033).
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
  (about 6 s, under vitest, as E31), held by [`packages/score/experiments/bar-in-cells.test.ts`](../packages/score/experiments/bar-in-cells.test.ts):
  the drums, the bass, the comp and the harmony of a bar stated together in cells v0.9.0, with `&bar` a `meter(…)` cell carrying the preset's swing and every line on a tap of it, played through cells' MIDI out and read back part by part on Jambot's own channels (10 the drums, 2 the bass, 3 the pad and the stab).
  The bars come from the band's transport, a preset held, its bpm counting the meter's beats (T7, #367): all 8 presets in 4/4, and Synth-pop and Bossa nova (both straight, and between them every part but the lead) in 3/4 and in 7/8 (3+2+2), seed 0, entropy 0.3, 32 bars each: 12 runs, 384 bars.
  What is compared is what is composed, without the licence (T17): each note's step and pitch, its length as the ensemble articulates it (`baseLengthOf`), and its velocity as the performer plays it at feel 0 (`baseVelocityOf` plus a written accent).
  A step is read off cells' times through the band's own swing undone (`leanMap`), so a swung bar's steps compare as a straight one's.
  - The text: `&bar meter("4/4") step=84bpm swing=16n:.65`, the swing as cells' swung meter fragments state it (a share the shorter of its decimal and its fraction: `.6`, `.65`, `31/60`, `2/3`), none on a straight meter; the harmony as E32's stacks, `&key scale(aeolian, A)` and `&harm over=&key step=2n [0,2,4] [4,6#,8]` (the owner's choice, 2026-10-17), each chord stated once, which no part plays; the drums as E31's, a line a role on `16n` with each hit's level, the rim `&rim(5,14,0)` on `1m` where the meter is straight (gap 4); the bass and the comp on `16n` over the chord in force from their voices (C1, C3), a note an index into the stack sounding at its onset, held `@k` for its written length and sounding the line's share of it (`&bass over=&harm step=16n legato=.635 3@10 6@6`, Synth-pop's bar 0 over `[0,2,4]`: its root a lap and two laps up), a chord a stack of indices, their velocities through a gate (`&bassOut play=&bass level=&bassLevel &bassV`), a line of levels or one gain; one MIDI card.
  - **Bars equal**: the drums, the bass and the comp 384 of 384, 7,478 notes with no diagnostic, every step, pitch, length and velocity; the harmony 380 of 384, 32 of 32 in every run but Swing jazz's 28 (gap 3).
  - **Onsets within 1 ms**: 7,478 of 7,478 in all 12 runs, 3,411 of them in the 5 swung presets (Deep house, Ambient, Lo-fi hip hop, Funk and Swing jazz), each bar laid at the end of the bar before as cells holds it, over 32 bars; the farthest is 8.2e-13 s, rounding, in every meter and every swing.
    Both bpms count the meter's beats (cells decision 040, T7), and cells' swing on the bar places Jambot's (yggi/cells#18), so the text states the band's tempo and swing as they are, with no conversion; 7/8 stated in its quarters, 126 for 108, is more than 1 ms off, as is a tempo a hundredth of a bpm away, Lo-fi hip hop with no swing, at `16n:.64` or on `8n`.
  - **Lengths within 1e-6 steps** (and 1 ms): all 2,979 bass, pad and stab notes, in every meter and every swing (gap 1, closed in cells v0.6.0), each line's share one number, `legato=` (yggi/cells#94), from `.32` (Techno's bass) to `1.885` (Swing jazz's stab, longer than written); the 46 stabs that sound past the bar line sound whole in cells too.
    Witness: Techno's bar 0, its bass written 8 steps and sounding 2.56, `legato=.32`; cells plays 2.56.
  - **The chord in force** (#387, cells v0.5.0's `over=&harm`, yggi/cells#125): 781 of the 802 bass, pad and stab lines read it, 720 of them with whole indices alone, the same counts as cells' own test over E33's bars (`tools/chord-in-force.test.ts`).
    An index `n` is the chord's tone `n`, past its last tone the chord a lap up (index 4 of a seventh chord is its root an octave up) and below its first a lap down; an accidental on it is a degree of the key beside that tone, and the tone keeps its own alteration (`throughChord`), which 91 notes need (the bass 33, the stab 58).
    The translator takes the first index that plays the note: no accidental before one, one before two, and the tone nearest 0 first.
    Over every chord of the composer's four modes (228 a key), indices from below the root to past a lap, none, a sharp or a flat, cells plays what `throughChord` says, 43,776 notes of 43,776.
    The 21 lines that can't are Swing jazz's walking bass, kept over the key: 25 notes off the key and off the chord sounding, each a semitone from the root of the chord that sounds next.
    Witness: Swing jazz's bar 0, Imaj9 in C, `[0,2,4,6,8]`, its bass's last note G♭2 (42) leading to IVmaj7's F: `11b` over the key, and no index over the chord, since an accidental on an index moves a degree of the key (cells decision 015).
    Respelling a bar's chord now moves the comp that reads it (Synth-pop's bar 0, `[0,2#,4]`: the comp and the harmony differ), and a line read over the key instead of the harmony differs too.
    The reading plays `&harm` itself on a channel of its own, and every number holds: a played table turns for the lines read through it as one nothing plays (cells v0.6.0, [yggi/cells#167](https://github.com/yggi/cells/issues/167)).
    Under v0.5.0, with `&harm` heard, every line over it read its first chord all bar long, so the reading played a copy.
  - **Characters**: 295,332 over the 384 bars, 769 a bar: the drums 143,841 (41,982 of them the hits' levels), the bass 54,278, the comp 44,287, the harmony 12,921 and its key 8,640, the meter 13,664, the card 17,701.
    The bass, the comp and the harmony are 111,486 over the chord in force against 110,770 over the key (54,221 + 43,628 + 12,921), 716 more: an index is no shorter than a degree, and `over=&harm` is a character longer than `over=&key`.
    By run, 4/4: Synth-pop 25,150, Techno 26,619, Deep house 26,068, Ambient 15,672, Lo-fi hip hop 26,732, Funk 35,087, Bossa nova 24,930, Swing jazz 26,102; Synth-pop 22,671 in 3/4 and 22,148 in 7/8, Bossa nova 21,907 and 22,246.
  - Taps hold in every meter: the drums' and the lines' `16n`, the chords' `1m` (and `2n` in the 6 bars of Swing jazz that hold two chords, the only ones), and the rim's Euclid on `1m` over the bar's 12 or 14 steps; no line steps by `&bar` itself.
  - With the licence left out, E31's gap 2 does not arise for the rim: in the 45 bars of the straight runs that state it as a Euclid, its hits take one level, `&euclid * .208568`.
  - Gap 1, a line's articulation under swing ([yggi/cells#120](https://github.com/yggi/cells/issues/120)), closed in cells v0.6.0.
    Cells sounds a share of a note's written steps and swings its end as its onset, as Jambot does, so every bass, pad and stab note sounds the band's length within 1e-6 steps, the farthest under 1e-9 s.
    Under v0.5.0 cells sounded a share of the time a note is held, and 572 bass and stab notes in 4 swung presets parted (Deep house 209, Lo-fi hip hop 158, Funk 77, Swing jazz 128), by up to 0.46 steps, 84 ms.
    Witness: Funk's bar 0, its bass at step 10 written 3 steps, `legato=.425`: both end it at step 11.275, 1.42 steps' time after its onset (a pair of sixteenths at .6), where v0.5.0 sounded .425 of the 3.2 steps' time it is held, 1.36, and ended it at step 11.2.
    A meter's `legato=` by level can't carry the band's articulation either: the bass and the stab tap the same level, `16n`, at shares of their own (Synth-pop's `.635` and `1.3725`).
  - Gap 2, what the chord in force leaves ([yggi/cells#95](https://github.com/yggi/cells/issues/95), [yggi/cells#50](https://github.com/yggi/cells/issues/50)).
    2,862 of the 2,979 notes are tones of the chord sounding (the pad 678 of 678, the stab 1,316 of 1,374, the bass 868 of 927), and the text reads them over it; three things are still stated note by note.
    A step of the 12 off the chord: Swing jazz's 25 approach notes have no index (above), so their 21 lines restate the key's degrees.
    The next chord: of the notes off the chord sounding, 83 are tones of the next bar's first chord (the bass 31, the stab 52), which the text writes beside this chord's tones, since cells has no next chord.
    The hand (E32's gap 3): the comp's 599 stacks are its indices, the voicing written out, not led from a pin; 543 of them are close, consecutive tones of the chord with no accidental, which a voicing could choose.
  - Gap 3, a secondary's function (E32's gap 1, [yggi/cells#50](https://github.com/yggi/cells/issues/50)): Swing jazz's bars 2, 6, 10 and 14 state V7/V or V9/V, whose stacks read back as II7 and II9.
  - Gap 4, a Euclid under swing ([yggi/cells#121](https://github.com/yggi/cells/issues/121)), closed in cells v0.11.2 ([yggi/cells#306](https://github.com/yggi/cells/issues/306)): a Euclid's hits are even parts of its step (cells' `x(k,n,r)`), which swing with it, so a swung rim stated as one Euclid on `1m` plays the band's hits: 137 of the 275 hits in the 45 swung bars that hold a rim (Lo-fi hip hop's 13, Funk's 32) are offbeats, late by up to 54 ms (Lo-fi hip hop's), as the band plays them.
    The translator still states a swung rim as a line on `16n`, as E33 measured it.
    So under swing the text states the rim as a line on `16n`, as every other role.
    E31's gap 1 holds too: each drum voice names a sound, `s=white` ([yggi/cells#10](https://github.com/yggi/cells/issues/10)).
  - What the seam's next rung (#63 step 5) needs that cells lacks: the next chord (#50), so the notes that lead to it read it instead of an accidental beside this one; a fragment that leaves `&bar` and `&key` to the host (yggi/cells#22); the lead (yggi/cells#47, #348); a role's accent as a level (yggi/cells#21), since the hits' levels are 29 % of the drums' text; and a tempo that glides, since a text holds one bpm and the transport's tempo moves within a bar.
    The chord in force, which it needed too, is in cells since v0.5.0, and the parts read it; the articulation under swing (gap 1) since v0.6.0; a Euclid that swings with the bar (gap 4) since v0.11.2.
    A note that sounds past the bar line is held now, so a text of one bar states it, and a section of bar texts in a row would overlap where it does.
  - Not measured: the lead, the licence (the played velocity and length), a tempo or a swing in a glide, a meter that changes between sections (each text states its bar's), a chord on a half of 3/4 or 7/8 (no bar of those runs holds two), seeds other than 0, and the swung presets in 3/4 and 7/8.

- **E34. The composer asks the repository for its meter while the radio walks** (#375, rung 6 of #358; yggi/cells decision 043), in
  [`packages/engine/experiments/meter-radio.ts`](../packages/engine/experiments/meter-radio.ts)
  (about 10 s, and as much again with learning, under vitest, as E31), held by [`packages/engine/experiments/meter-radio.test.ts`](../packages/engine/experiments/meter-radio.test.ts):
  the radio tuned in at each preset's point at entropy 0.3, its energy the preset's, left alone for 3 hours of music over 5 seeds a preset (40 runs, 120 hours, 26,691 sections), each section's style glided to as in E30.
  The band decides every bar with no meter asked for, so each section's plan takes the meter the composer finds in cells' repository (`METER_REPOSITORY`, `composedMeter`: the nearest of the eleven meters the band can play, on `sync`, `harm`, `artic` and `energy`), and a bar lasts its meter's beats at its tempo (#367).
  - **Where the meter changes**: 211 times in 120 hours (1.8 an hour), every one on a section's first bar, and none goes back at the next section's start.
    With no margin for the meter playing (`METER_HOLD` 0), 941 changes and 271 back; with half of it (0.01), 367 and 2; with 0.02, none.
    A section moves the style's point 0.014 on average and 0.021 at the 99th percentile, on cells' distance, so the margin is about a section's move.
  - **What it plays**: 4/4 in 35 % of the time, the swung 4/4s in 49 % (leaning lightly on `16n` 23 %, on `16n` 11 %, faintly 8 %, swung on `8n` 7 %), and another meter in 16 % (5/4 5 %, 10/8 5 %, 3/4 2 %, 6/8 2 %, 12/8 0.8 %, 7/8 0.7 %).
  - **A miss** (`MISS_DISTANCE` 0.3, nothing nearer, so the band keeps its meter): 201 of the 26,691 sections; on a grid of the four unit axes (21 points an axis), 10.3 % of the space, toward its corners, where the farthest point lies 0.466 from a fragment.
    At 0.25 a quarter of the space misses (24.6 %), and one change goes back where the meter playing has just slipped past the distance; at 0.35, 3 %.
  - **The cost**: a query is 0.006 to 0.008 ms, far under #375's bound of 1 ms a section.
  - Beside it, `packages/engine/src/repository.test.ts`: the 8 presets held, 2 seeds of 32 bars, play 15,061 events with the repository's meter, each with the same part, step, note and velocity as `main` and the same onset and duration to 1e-9 s, the swing coming from the plan whatever the swing track holds.
  - **Learning** (#398, cells decision 048): the same 40 runs with the band given an empty learned layer, each meter it keeps a use at the section's point (`learningRuns`).
    The share of sections whose meter is among its run's 3 most used goes from 97.50 % to 98.11 %, 0.61 points ± 0.25 (the standard error of the 40 runs' paired differences), so 1.1 with twice its error, under decision 048's bound of 5 (`lockIn`).
    Learning reaches farther, as decision 048 says: 2 misses where there were 201, and 119 changes of meter where there were 211, none going back at the next section; the layer after 3 hours weighs at most 814 bytes (7 points), against a cap of 16,000.
  - Not measured: the radio driving the app (nothing calls it yet, #313 step 3), entropy other than 0.3, how the band's parts sound in the meters the walk reaches (6/8 and 12/8 are played by the rules of #260), a fragment's legato by level (none of cells' carries one, and the band doesn't read one), and learning over more than one run (each starts from an empty layer).

- **E35. The band writes a whole section as one cells text, every part, the lead as its notes** (#390; #63, the seam; #358), in
  [`packages/score/experiments/section-in-cells.ts`](../packages/score/experiments/section-in-cells.ts)
  (about 3 s for seed 1 and 8 s for the whole corpus, under vitest, as E31), held by [`packages/score/experiments/section-in-cells.test.ts`](../packages/score/experiments/section-in-cells.test.ts):
  a section's 8 bars (`SECTION_BARS`) stated as one text in cells v0.9.0, every part, over E28's corpus through the band's transport: every preset held at entropy 0.3, seeds 1 to 5, 64 bars, in 4/4 (40 runs, 2,560 bars, 320 sections).
  `pnpm verify` holds seed 1 (8 runs, 512 bars, 64 sections), and `E35_FULL=1` the whole corpus.
  The builder and the reading are [`packages/score/src/section-text.ts`](../packages/score/src/section-text.ts) and [`section-play.ts`](../packages/score/src/section-play.ts), which the app shares (#399), with the helpers E31 to E33 found; the app plays what they state (#456, #469).
  What is compared is the written layer (Q1a): each note's step, pitch, velocity at feel 0 and written length, read off cells' MIDI out (a note's written span is its sounding span, in steps through the swing undone, over the share its line reads at its onset), and each chord's step and notes; the sounding length and the chord's numeral, E33's bounds, are measured too.
  - The text: the host's lines once, `&bar meter("4/4") step=108bpm` and `&key scale(aeolian, A)`; the harmony once, `&harm over=&key step=1m [3,5,7] [6,8,10] …`, every chord at its slot, which no part plays; then the parts, each a line a sound open on them: the drums a line a role over the section's 128 sixteenths, the rim a Euclid a bar on `1m` where the meter is straight; the bass, the pad and the stab over the chord in force (`over=&harm`); the lead from C4 as degrees of the plan's melodic scale; their velocities through gates; one MIDI card on Jambot's channels (1 the lead, 2 the bass, 3 the pad and the stab, 10 the drums).
    Decision 047's union of lines is in cells since v0.6.0 (`unionOf`), but building sections by it is a later rung, so the text is built with the host's lines given once; each part with the host's lines alone compiles and plays its notes as it does in the whole (Synth-pop's 8 sections at seed 1, 4 parts each).
  - **The host's lines once**: the plan holds the meter, the tempo, the swing, the key and the melodic scale for a section's 8 bars, in all 320 sections, so each is one line.
    The builder refuses 8 bars taken across a section's boundary where the key moves ("a section's key changes at its bar 4"): one text holds one main key and one bpm, so a key that changes inside a section or a tempo that glides in one (the radio, a slider) has no statement here, and neither happens in the corpus.
    The app states a gliding section at its first bar's tempo (`tempo: 'first'`) and lays each event on the transport's clock by its place in its step (#399).
  - **Bars equal on the written layer**: 2,560 of 2,560 for the drums, the bass, the comp, the harmony (each chord's notes) and the lead, 73,444 notes, with no diagnostic and no note cut (none is written past its line's next onset).
  - **Onsets within 1 ms**: 73,444 of 73,444, each section laid where the one before ends as cells holds it; the farthest is 2.8e-12 s.
  - **The lead as its notes** (yggi/cells#47, the owner's ruling of 2026-09-30, "A now, B as the goal"): `&lead over=&key step=16n legato=.6375 ~@5 5@3 5@6 8@2 …` (Synth-pop's section 2 at seed 1, A aeolian, from C4), its levels a line, no cell or operator named.
    Every section of the corpus plays the plain melodic scale (`melodicDefault`, the narrowest the style reaches: the key's own), so its 216 lead lines read the key; 6 of seed 1's 1,959 lead notes are off it, each written with an accidental.
    Where the plan's scale is a pentatonic or the blues, it is one line, a stack of the key's degrees open on the key (`&melo over=&key step=1m [0,2,3,4b,4,6]`, the blues in A aeolian), and the lead reads it as the chord in force is read, an index a tone and a lap the key's seven degrees.
    A probe off the corpus, the players wishing for each scale a preset's harmony reaches (8 runs at seed 1, 512 bars), plays every bar equal, 50 of its 56 lead lines over the scale and 26 notes with an accidental on their index.
    Over all 48 keys of the composer's four modes, cells plays every note of the lead's range, 60 to 86, over the key, and every note of the key over each scale's stack: 3,915 notes.
  - **Characters**: 3,945 a section, 3,563 without the lead, against E33's 6,602 for the same 8 bars each stated alone (1,262,444 against 2,112,582 over the corpus, 46 % fewer; the lead adds 122,297; the drums' voices are one `use * from "core kit"` line since cells v0.10.1, spelled so since v0.11.0).
    By part at seed 1, against E33's: the meter 2,456 and 19,648, the key 1,436 and 11,488, the harmony 7,197 and 17,811, the card 3,479 and 24,066, the drums 196,608 and 251,231, the bass 38,416 and 90,065, the comp 28,400 and 68,839.
    What a bar's text repeats, the host's lines, the harmony, the voices, the mix, the card and each line's head, gate and voice, a section's says once.
  - **The chord in force**: 682 of the 727 bass, pad and stab lines read it (gap 3 has the rest).
    Swing jazz's breakdown bass at seed 5 (sections 3 and 6), held 0.3 of a step short of each written length, sounds two shares of it, stated as a line of them, `legato=&bassShare` and `&bassShare step=16n .98125@16 … .9625@8`, which cells reads at each onset.
  - The reading plays `&harm` itself, as E33's does, and every number holds: a played table turns for the lines read through it (cells v0.6.0, [yggi/cells#167](https://github.com/yggi/cells/issues/167)).
    Under v0.5.0, with `&harm` heard, the lines over it read its first chord all section long (the bass the band's in 231 of seed 1's 512 bars, the comp in 193), so the reading played a copy.
  - Gap 1, a secondary's function (E33's gap 3, E32's gap 1, [yggi/cells#50](https://github.com/yggi/cells/issues/50)): every chord's notes are the band's, and 93 bars read a secondary back as the stack it is (2,467 of 2,560 equal with their numerals; Swing jazz 57, Bossa nova 34, Lo-fi hip hop 2).
    Witness: Bossa nova's bar 0 at seed 1, in C, `V9/vi` read back as `III9`.
  - Gap 2, a line's articulation under swing (E33's gap 1, [yggi/cells#120](https://github.com/yggi/cells/issues/120)), closed in cells v0.6.0: the written layer and the sounding length are the band's in every bar, swung or straight, 512 of 512 at seed 1 and 2,560 of 2,560 over the corpus.
    Under v0.5.0 the bass sounded the band's length in none of seed 1's 64 bars of Deep house, Lo-fi hip hop, Funk and Swing jazz, the lead in 8 to 10 of them, and the comp in 7, 21, 64 and 63.
  - Gap 3, a line reads one table (E33's gap 2, at a section's length): a note off the key that no tone of the chord in force carries has no index, since an accidental on an index is a degree of the key, and keeps its section's whole line over the key.
    45 of the corpus's 727 lines (the bass 37, the stab 8); at seed 1, 10 of 149 (Swing jazz's walking bass in all 8 sections, Funk's stab and Bossa nova's bass once), for 55 notes, each off the key and off its chord.
    Witness: Funk's section 5 at seed 1, in D dorian, its stab's last note B♭3 (58), at step 14 of its last bar over VII (C).
    Where E33 kept one bar's line over the key, a note now keeps 8 bars' line there.
    The lead over its melodic scale meets the same: the probe's 6 lines over the key, for 8 notes off it, such as Synth-pop's C♯5 over the D minor pentatonic, the third of V (A) it lands on.
  - What the band playing through cells (#63's next rung) needs that cells lacks, beyond E33's list: a tempo that glides inside a section, and an index into a table that names a step of the 12 beside its tone (gap 3), so that one note doesn't keep a section's line over the key.
  - Not measured: the licence (the played velocity and length), a meter other than 4/4 (the corpus is E28's), the radio's walk (presets are held here, so no tempo glides), a key that changes inside a section (none does), a note that leads into the next section's first chord (a section's text doesn't see it), and the union of fragments in cells.

- **E36. The composer asks the repository for a rhythm that fits the meter chosen, read back into the drums and set beside the drummer** (#397, step 1; #358, the repository rung), in
  [`packages/score/experiments/rhythm-query.ts`](../packages/score/experiments/rhythm-query.ts)
  (about 5 s, under vitest, as E31), held by [`packages/score/experiments/rhythm-query.test.ts`](../packages/score/experiments/rhythm-query.test.ts):
  E35's corpus (every preset held at entropy 0.3, seeds 1 to 5, 64 bars, 320 sections of 8 bars), decided with no meter asked for, so each section's meter is the repository's (E34).
  At each section's start the composer asks cells v0.9.0's 13 rhythms (`RHYTHM_FRAGMENTS`: E31's 8 drum bars and 5 claves; the drummer holds those, `heldRhythms`, and not v0.11.2's Electro swing drums, whose lines its roles don't name) at the style's point, with `facet: 'rhythm'` and the workbench the section's meter fragment hosted at its tempo, so the fit ranks only those that fit it (`fitOf`, yggi/cells decision 047).
  A section takes the nearest that fits, or a named miss: the fit refusing every rhythm, or the nearest that fits lying past `RHYTHM_MISS`, 0.3, the meter's own distance.
  Nothing here changes what the band plays.
  - **What each section gets**: 320 of 320 a rhythm, each preset's own drum bar at distance 0, under the meter its sections choose (4/4 for Synth-pop, Techno and Bossa nova, a lean on `16n` for Deep house, Ambient, Lo-fi hip hop and Funk, swung on `8n` for Swing jazz), and no miss.
    The corpus holds presets, whose points are the drum bars' own, so the choice is tested off it.
    Every preset's point under each of the band's 11 meters finds its drum bar under the five 4/4s, and the fit refuses every rhythm under the six others (3/4, 6/8, 12/8, 5/4, 7/8, 10/8, the clock alone, as yggi/cells#148's table): 48 of 88 named misses.
    Over a grid of the four axes (11 points an axis, 14,641), the meter found first and taken as the workbench (4/4 where it misses), 58 % find a rhythm, 32 % are refused by the fit and 10 % lie past 0.3.
  - **Read back** (E31's reverse, `readFragment`): the fragment's union with the workbench (`unionOf`) played through cells' MIDI out, a role a line (the fragment's mix, which carries no MIDI card since cells v0.11.0, cut to that term and sent on channel 10), each hit's General MIDI note the band's sound, its step through the meter's swing undone, its velocity cells' 127·√level.
    Under a straight 4/4 at its bpm, every drum bar is E31's, 144 of 144: note, step, length, velocity and role.
    Under the meter each preset's sections choose, 144 of 144 too: a rim's Euclid on `1m` swings under a lean on `16n` as the band swings every hit, since cells v0.11.2 swings the parts of a step (yggi/cells#306; before it, Lo-fi hip hop's 5 rim hits and Funk's 7 played straight, yggi/cells#121).
  - **Beside the drummer** (320 bars a preset): a fragment is one bar the drummer wrote at seed 0, a section's last, so every fragment holds a fill, where the drummer fills the last bar of 21 to 28 of its 40 sections.
    Its bars equal the fragment in none of 2,560, and overlap it (the hits both strike over either's, by step and sound) 0.17 (Ambient) to 0.50 (Techno); a drummer's bar overlaps its own at another seed, where the section types agree, 0.34 (Lo-fi hip hop) to 0.66 (Ambient).
    Its density follows the section, Synth-pop's 5.7 hits a bar in an intro, 23.7 in a drop and 1 in a breakdown against the fragment's 12, and Ambient's 3.6 on average against 18.
    The fragment's velocities, a played bar's (E31's gap 2), lie 5.5 to 9.3 from the drummer's on the hits both play.
  - **Four ways a fragment could enter the drummer** (`ENTRIES`), each a bar built from the fragment's bar and the drummer's bar of the same place, against the drummer's:
    - `bar`, the fragment as the bar: its fill in all 8 bars of a section, the same 12 to 28 hits in an intro as in a drop, an overlap of 0.17 to 0.50.
    - `roles`, the fragment saying where and the drummer whether (a role the drummer doesn't play in the bar, none; the fill its own): the drummer's fills, but no role holds more hits than the fragment's, so Synth-pop's drops play 8.9 hits a bar against 23.7.
    - `thinned`, as `roles` with at most as many hits a role as the drummer plays, the fragment's loudest first: the same ceiling.
    - `groove`, as `thinned` with as many as the drummer plays, its own hits of the role on other steps making up what the fragment lacks: the drummer's hits a bar by section type (within 0.2) and its fills, with 0.68 (Ambient) to 6.09 (Funk) of its hits a bar on other steps (Synth-pop 1.26, Techno 1.95, Deep house 1.61, Lo-fi hip hop 2.63, Bossa nova 4.05, Swing jazz 1.78).
      Its overlap with the drummer, 0.53 to 0.82, is above the drummer's with itself at another seed at every preset, and its seeds agree more, 0.50 to 0.77 against 0.34 to 0.66.
  - **A clave chosen with it** (yggi/cells decision 046): asked with the drum bar on the workbench and among those chosen, the nearest other fragment that fits and whose union renames none of its names, so that it layers as a line of its own (a second drum bar renames `&kick` and the rest), within `CO_SELECT`, 0.1.
    Funk's sections take the rumba clave 3-2 (0.069), 2.5 strokes a bar, and Bossa nova's the one-bar bossa nova clave (0.025), 5 a bar; every other preset's nearest clave lies 0.168 (Lo-fi hip hop) or farther.
    A clave strikes the claves, General MIDI's 75, a sound of its own (cells v0.7.0, yggi/cells#140), so none of its strokes falls on a sound the drum bar strikes, and over the `groove` bar every one is added, 2.5 and 5 hits a bar.
    Under v0.6.0 it struck the side stick, 37, the band's rim, and 1 of the rumba clave's strokes a bar and 3 of the bossa nova clave's fell to the drum bar's rim, adding 1.63 and 3.
    With no learned layer, use together pulls nothing (the layer's store is #398).
  - **The point asked at**: at the section's energy in place of the style's, 57 of the 320 sections take another fragment, 40 of them a clave alone, with no band role (Bossa nova's intros, builds, bridges and breakdowns, Funk's drops and breakdowns, Lo-fi hip hop's breakdowns), and 17 a neighbour's drum bar (Synth-pop's drops take Deep house's).
  - **The cost**, the median over seed 1's 64 sections: 0.006 to 0.013 ms with no workbench or with one the repository has seen, 2.0 to 3.4 ms with one it hasn't (a new repository a query, k = 1), under #397's 1 ms and 5 ms (yggi/cells#148: 0.2 ms, and 3 to 5 ms).
    The bounds are wall-clock time, so they run with `E36_COST=1`, not in `pnpm verify`: on a shared CI runner the unseen median reads 5.0 to 5.2 ms.
  - The proposal for #397's step 2, with these numbers, is on the issue.
  - Not measured: the radio's walk (presets are held, so a section's point is a drum bar's own), a learned layer or a filed fragment, a rhythm held against a nearer one between sections (as `METER_HOLD` holds a meter), how any entry sounds (none is built), and a clave's level against the drummer's accents.
- **E37. The composer asks the repository for its rhythm while the radio walks** (#397, step 2; E34's walk, on the owner's ruling of E36), in
  [`packages/engine/experiments/rhythm-radio.ts`](../packages/engine/experiments/rhythm-radio.ts)
  (about 15 s, under vitest, as E31), held by [`packages/engine/experiments/rhythm-radio.test.ts`](../packages/engine/experiments/rhythm-radio.test.ts):
  E34's radio tuned in at each preset's point at entropy 0.3, its energy the preset's, left alone for an hour of music over 5 seeds a preset (40 runs, 40 hours, 8,521 sections), the band deciding every bar with no meter asked for and cells' rhythms beside cells' meters, so each section's plan takes the meter the composer finds and the rhythm, and its clave, that fit it (`composedRhythm`).
  - **Where the rhythm changes**: 123 times, every one on a section's first bar, and none goes back at the next section's start; with no margin for the rhythm playing, 89 go back.
    Without a margin at the edge of the clave's distance, 15 of the changes dropped a clave at one section and took it back at the next (Bossa nova's and Funk's), so the clave playing is held `RHYTHM_HOLD` past `LAYER_DISTANCE`, and none does.
  - **A miss**: 390 sections (4.6 %), each in a meter no rhythm fits (the fit refusing every one under a meter other than a 4/4), where the drummer invents; none lies past `RHYTHM_MISS`.
  - **What plays**: a preset's drum bar in every section that finds a rhythm, and a clave alone in none, since a line of its own only layers on a drum bar (#428; on `main` at 9e26a40, 992 sections played one alone, the son clave 3-2 in 360 of them).
    Beside Funk's drum bar the rumba clave plays in 389 sections, the son clave 3-2 in 146 and the son clave 2-3 in 73; beside Bossa nova's the one-bar bossa nova clave in 475, the two-bar one in 157 and the son clave 3-2 in 72; and the son clave 3-2 beside Deep house's in 9.
  - Not measured: entropy other than 0.3, a learned layer (#398, #401), and how the walk sounds.
- **E38. The Muse files the drummer's grooves while the radio walks** (#401, the owner's ruling of 2026-10-18; E37's walks), in
  [`packages/engine/experiments/rhythm-radio.ts`](../packages/engine/experiments/rhythm-radio.ts) (`learningRuns`)
  (about 40 s, under vitest, as E31), held by [`packages/engine/experiments/rhythm-learning.test.ts`](../packages/engine/experiments/rhythm-learning.test.ts):
  E37's radio walks for 3 hours a run (40 runs, 120 hours, 26,631 sections), the band given an empty learned layer, so on each miss the drummer invents, and where the next section is planned the Muse files the section's recurring bar as cells text open on its meter (`muse-groove.ts`, `museFiled`), and every meter, rhythm and groove kept is a use, the rhythm's together with its meter; against the same walks with nothing learned (26,691 sections: a meter learned can last other than the one it replaced).
  - **What is filed**: 198 grooves in every one of the 40 runs, at most 11 in a run: 57 the drummer's, each on a miss, and 141 the composer's variations, 98 of seed drum bars and 43 of grooves filed (E39).
    38 of the drummer's are under a meter no seed rhythm fits (5/4, 6/8, 7/8, 10/8, 12/8, 3/4), and 19 under a 4/4, where the composer had rejected the drum bars near and the next nearest lay past `RHYTHM_MISS`.
    Each is found by a query at its point at distance 0, from a repository that never saw it, and cells reads every hit of it back as it was played or varied (`readRhythm`).
  - **The loop closed**: the misses fall from 4,042 sections to 63, and 15,193 sections play a filed groove: once kept, a groove's point gains a use a section (cells' `USE_STEP`, to `USE_CAP`), so it reaches as far as a seed rhythm, and in its meter, where no seed rhythm fits, it is the one found until the composer tires of it (E39).
    A section of an Ambient run whose bars hold fewer than 3 hits (`GROOVE_FEWEST`) misses and files nothing.
  - **Identity**: no run files a groove twice on its own; each of the 198 filed again into its run's last layer adds to its one fragment, 198 of 198, and E31's 8 bars filed so add to cells' seed drum bars, which are their text.
  - **Lock-in** (cells decision 048, as E34 measures it for meters): the share of sections whose rhythm (or the drummer's own, `-`) is among the run's 3 most used moves from 0.9684 to 0.8465, −12.19 points, standard error 1.82, so −8.55 with twice its error, within 5, with the pull of use together that entropy 0.3 sets (#389: 0.14): the composer tiring of seed rhythms too spreads the sections over more rhythms (#414).
    Use together decides little on these walks: on the walks where only filed grooves climbed, forced to no pull, or cells' default 0.1, the share was 0.9250, to 0.2, 0.9232, and only to 1 did it move, to 0.9755 (+3.35), measured once at #389, not held by a test.
  - **The layer** weighs at most 11,471 bytes after 3 hours (12,237 before cells v0.10.0, whose grooves state no voices, and 11,603 before v0.11.0, whose grooves carry no MIDI card: 12 bytes less a groove), under `LAYER_CAP` (16,000); nothing was dropped: every groove a run filed is in its last layer.
    Each variation names how it varies its groove (`by: drop &hat 6`, #442), so the layer weighs more than the 12,116 bytes it did before, by 121.
  - **The cost** (one run, Funk in 5/4, a laptop under vitest): the bar whose next section files spends about 15 to 18 ms (the filing, its uses, and the clave's layering asked of a rhythm not seen before), the bar after about 1.6 to 4.5 ms, against about 1 ms a bar otherwise.
  - Not measured: a player's grooves in a walk (none plays), entropy other than 0.3, and how any of it sounds.
- **E39. The composer tires of a rhythm while the radio walks** (#411, #414; cells decision 043's novelty ladder; E38's walks), in
  [`packages/engine/experiments/rhythm-radio.ts`](../packages/engine/experiments/rhythm-radio.ts) (`mostUsedGroove`), held by [`packages/engine/experiments/rhythm-learning.test.ts`](../packages/engine/experiments/rhythm-learning.test.ts):
  E38's runs, with the composer's boredom (`novelty.ts`): a rhythm, a seed rhythm or a groove the layer filed, climbs a rung each 3 of boredom, the entropy of each section it plays, so at 0.3 it plays 10 sections, its one variation 10 more, and is then rejected, with the clave first chosen with it, until its boredom has faded.
  - **The most used groove of a meter no seed rhythm fits** plays 1,661 of the 3,222 sections in those meters, over every run and meter, 52 %, under #411's 60 %; on `main` at 3a64468, where the first groove filed stays its meter's, the same walks play it in 3,213 of 3,236, 99.3 %.
  - **The variations**: 141, each of a seed drum bar (98, every preset's) or of a groove its run filed before (43), each one of cells' variations of its text (cells' vary, yggi/cells decision 052, #442), the one its filing names (`by`), and no family varied twice.
    139 of the 141 are the variations this repository's own operators made (`novelty.ts` before #442), hit for hit.
    The other 2 (Techno at seed 8 and Deep house at seed 14, each varying a drummer's 10/8 groove whose hats strike all 20 steps) differ because cells tells variations apart by the notes they play (S2, yggi/cells#216): rotating such a line moves only its levels, so cells leaves it out, the list is one shorter, and the same draw takes another variation.
    No count of E38 to E40 moves with them; only the layer's weight does, by `by`.
  - **Inventing again**: the drummer invents 19 grooves in a meter where one was filed before, each where the composer had rejected every groove that meter held.
  - **The cost** (Funk at entropy 1 over 10 sections, in 5/4 and in the repository's 4/4, 6 runs, a shared container under vitest at a load of about 3.4, the repository warmed as the app warms it, on every bench and after each filing): the bar whose next section varies its rhythm spends about 5 ms (4.3 to 4.5 before #442), its ask of cells' vary (`RhythmRepository.vary`) 0.8 to 1.8 ms, the varied line read back alone, one compile; against about 0.3 to 0.4 ms a bar otherwise.
    Unwarmed, cells' variations of the rhythm are computed in the ask too, which takes 3.4 to 7 ms and the bar about 8 to 9 ms, so the repository warms them with the rhythm's fit and read (`warm`).
  - Not measured: entropy other than 0.3 over the walks (a band test holds the ladder at 0 and 1), and how a variation sounds.
- **E40. A seed rhythm climbs the novelty ladder while a preset is held** (#414, the owner's ruling of 2026-10-18; E37's runs), in
  [`packages/engine/experiments/rhythm-radio.ts`](../packages/engine/experiments/rhythm-radio.ts) (`heldRuns`)
  (about 20 s, under vitest), held by [`packages/engine/experiments/rhythm-held.test.ts`](../packages/engine/experiments/rhythm-held.test.ts):
  E37's runs with the radio not walking, each preset held at entropy 0.3 for an hour of music over 5 seeds (40 runs, 8,450 sections), the band learning from an empty layer, against the same runs with none, which play what `main` plays (with a seed rhythm found nothing is filed, so the layer changes nothing there).
  - **The most used rhythm** of a run plays 3,939 of the 8,450 sections, pooled, 47 %, under #414's 60 %; with no layer, as on `main`, the preset's drum bar plays every section.
  - **The turns**: in every run the preset's drum bar plays the first 10 sections, the composer's variation of it the next 10, and then, for at least 20 sections, the next nearest drum bar (another preset's, at Bossa nova Lo-fi hip hop's with the two-bar bossa nova clave layered on it, or, at Techno, Ambient and Funk, where none lies within `RHYTHM_MISS`, the drummer's own, which the Muse files and which climbs in turn); the drum bar's family returns once its boredom has faded, as the variation.
  - **No clave alone** (#428): no section plays a clave without a drum bar; on `main` at 9e26a40, 95 sections an hour did at Funk (the son clave 2-3) and 120 at Bossa nova (the two-bar bossa nova clave).
  - **The drummer's bars against `main`'s**: hits a role by section type within 0.05 a bar (Swing jazz; Funk 0.03, where the drummer's own groove plays past the drum bar; every other preset 0), since the drummer still decides how many it plays and the fragment only where (`groove.ts`); bar beside bar, 69 % (Swing jazz) to 95 % (Lo-fi hip hop) of the hits on a step and sound both play, Funk 74 % and Bossa nova 91 %.
  - **The layer** weighs at most 3,808 bytes after an hour (4,042 before cells v0.10.0, and 3,844 before v0.11.0, whose grooves carry no MIDI card), 3 grooves, its variation naming how it varies (`by`, #442; 4,003 before).
  - **The clave climbs with the drum bar** (`ClaveOwners`, #430): Funk's rumba clave and Bossa nova's one-bar clave play beside the drum bar and its variation, and are out with them.
    A clave is the drum bar's it was first chosen to layer on, so a drum bar that returns plays with the clave it played every section of its stretch before, in every section (`claveLost`; on `main` at 09ec1be, where a clave was rejected with every lineage it played with, 100 sections lost it: Funk's variation, 20 sections in each of its 5 runs).
    At Funk the rumba clave layers on the drummer's variation at one section, where Funk's lineage has faded, and the drummer's variation returns 20 sections later without it, since it is out with Funk's lineage then: 100 sections, 20 a run, on the owner's ruling (option A on #430).
  - Not measured: entropy other than 0.3 held (band tests hold 0 and 1), and how a variation sounds.
- **E41. The bass enters the loop** (#423; the loop of `facet.ts` keyed by facet, cells' five bass seeds, yggi/cells#211 and #214), in
  [`packages/engine/experiments/bass-loop.ts`](../packages/engine/experiments/bass-loop.ts) and E37's runs with the bass lines (`rhythmRun`'s `lines`),
  held by [`packages/engine/experiments/bass-loop.test.ts`](../packages/engine/experiments/bass-loop.test.ts) (about 2 minutes under vitest):
  - **Held** at entropy 0, every preset swung as it is, 2 seeds of 32 bars, cells' meters and rhythms and an empty layer, with the bass lines and without (as `main` plays):
    each preset plays its pattern's line every section (root: Synth-pop, Deep house, Ambient; pump: Techno; funk: Lo-fi hip hop, Funk, Bossa nova; walk: Swing jazz); the drums, the comp and the lead play every event they did, to 1e-9 s (`bass-loop.test.ts` in `src`, 15,612 events in all), and the bass as many notes a bar by section type, since it decides how many as before.
    What moves is where they fall and what they play, by preset (the share of its notes on a step `main`'s bass plays, and of the same note there; by section type, the total variation of the shares of its notes on each interval above the chord's root, intro / groove / build / drop):

    | preset        | on `main`'s steps | same note | intervals moved           |
    | ------------- | ----------------- | --------- | ------------------------- |
    | Synth-pop     | 79.4 %            | 77.5 %    | 0 / 0 / 0.07 / 0.2        |
    | Techno        | 81.2 %            | 62.5 %    | 0.14 / 0.10 / 0.24 / 0.4  |
    | Deep house    | 80.9 %            | 78.7 %    | 0 / 0 / 0.05 / 0.2        |
    | Ambient       | 87.6 %            | 87.6 %    | 0 / 0 / 0.04 / 0.06       |
    | Lo-fi hip hop | 57.5 %            | 56.5 %    | 0 / 0 / 0.17 / 0.25       |
    | Funk          | 68.0 %            | 56.7 %    | 0.09 / 0.03 / 0.10 / 0.2  |
    | Bossa nova    | 59.5 %            | 50.7 %    | 0.09 / 0 / 0.18 / 0.22    |
    | Swing jazz    | 100 %             | 29.3 %    | 0.33 / 0.34 / 0.19 / 0.38 |

    Off a chord change the bass keeps the octave it draws one step in four on a line's note, but not the fifth it draws one in five: the line says the tone; the walk is one of the walks `bass.ts` draws (up through the chord, the approach from below), so Swing jazz keeps every onset and under a third of its notes.

  - **Walked** (E37's runs, the radio at entropy 0.3 from each preset, 40 runs of an hour, 8,508 sections, learning from an empty layer):
    the run's most used line plays 4,028 sections, 47.3 %, under #423's 60 %; the share of sections among a run's 3 most used lines moves −4.3 points (1.0 error), within 5 with twice its error; 108 lines filed (17 the bass's own on a miss, 91 the composer's variations, by cells' five pitched operators since v0.10.1: transpose, invert, reverse, bend and trim), each read back as filed; 18 sections play the bass's own (none with nothing learned, where no line is rejected).
  - **Three hours** (E38's runs with the bass lines): the layer weighs at most 14,756 bytes (15,583 before cells v0.10.0, whose lines and grooves state no voices, and 15,035 before v0.11.0, whose grooves carry no MIDI card and whose bass lines none, their line named `&bassline`), under `LAYER_CAP` (16,000), its cap dropping nothing in any section; E39's most used groove plays 1,661 of 3,222 sections, 51.6 %, as without the bass.
  - **The cost** (Node, a shared container, warmed as the app warms it): the warm-up's 55 steps (a line read, or its variations) take at most 4.1 ms each, under the 25 ms a slice starts a step in; an ask of the bass lines takes 0.02 ms at p95 and 1.8 ms at most, under #412's 5 ms.
  - Not measured: entropy other than 0 held and 0.3 walked, a player's bass on the walks (none plays), and how any of it sounds: the owner's ear rules on the held movement before merge (#423).

- **E42. The lead enters the loop** (#424; the loop of `facet.ts` for the facet `lead`, every line one the layer filed, cells holding no seed lead lines), in
  [`packages/engine/experiments/lead-loop.ts`](../packages/engine/experiments/lead-loop.ts) and E37's runs with the bass lines, the lead lines and a player (`rhythmRun`'s `player`),
  held by [`packages/engine/experiments/lead-loop.test.ts`](../packages/engine/experiments/lead-loop.test.ts) (about 2 minutes under vitest):
  - **The player** answers one section in four, the second of each four, in its second half, with one of eight motifs of 3 to 6 notes (`MOTIFS`), a new one every 16 sections, heard by the Muse in each bar as a lead line: a choice of this experiment, not a measure of players.
  - **Walked** (the radio at entropy 0.3 from each preset, 40 runs of an hour, 8,508 sections, learning from an empty layer):
    8,413 sections play a lead line, and the lead its own in 95 (with nothing learned, in all of them); the run's most used line plays 3,021, 35.9 % of those that play one, under #424's 60 %.
    The share of sections among a run's 3 most used lead lines moves −20.4 points (1.8 error), within 5 with twice its error; with nothing learned the lead plays its own every section, which counts as one, so this share can only fall, and the bound says little here.
    2,322 filings: 332 of the player's lines new, 38 of the lead's own the player answered, 160 of the composer's variations (lift or turn over), 1,792 a line held already (identity); each new one reads back as filed.
  - **Three hours** (one seed a preset, 8 runs, 5,252 sections; forty take five minutes): the layer reaches its cap with the drums, the bass and the lead filing, at most 15,996 bytes, under `LAYER_CAP` (16,000), its cap dropping the oldest in 20 sections (31 before cells v0.11.0, whose grooves and bass lines carry no MIDI card, so the layer fills later); a lead line weighs about 380 bytes, its voice and card a sixth of it. The most used lead line plays 27.6 % of the sections that play one.
  - **The cost** (Node, a shared container) with the heaviest layer's 23 lead lines: the warm-up's 88 steps take at most 1.6 ms each, under a slice's 50 ms; an ask of the lead lines takes 0.11 ms at p95 and 0.8 ms at most, under #424's 5 ms.
  - Not measured: entropy other than 0.3 walked, players other than this one, a player's motif bent off the key (which cells doesn't vary), and how any of it sounds.

- **E43. The harmony enters the loop** (#425; the loop of `facet.ts` for the facet `harmony`, cells' five seed vamps, yggi/cells#219), in
  [`packages/engine/experiments/harmony-loop.ts`](../packages/engine/experiments/harmony-loop.ts) and E37's runs with the bass lines and the harmonies (`rhythmRun`'s `harmony`),
  held by [`packages/engine/experiments/harmony-loop.test.ts`](../packages/engine/experiments/harmony-loop.test.ts) (about 2 minutes under vitest):
  - **Held** at entropy 0, nothing filed, every preset, 2 seeds of 64 bars, learning from an empty layer: every slot of every theme is `main`'s degree, and every bar's chords `main`'s (`harmony-loop.test.ts` in `src`).
    Techno, Funk and Ambient play a seed vamp in every A and B section, drawn as `buildTheme` draws one; the five presets at harm 0.33 or more walk the tables, as no vamp fits there.
    The twelve vamps of the four modes are each one of the five seeds, laid as `buildTheme` lays it at every harmony under 0.33 (`progressions.test.ts`).
  - **Walked** (the radio at entropy 0.3 from each preset, 40 runs of an hour, 8,508 sections, learning from an empty layer, no player):
    the run's most used theme plays 1,759 sections, 20.7 %, under #425's 60 %; 2,340 sections play a seed vamp; the share of sections among a run's 3 most used themes moves +0.07 points (0.21 error), within 5 with twice its error.
  - **With a player** who plays a progression over one section in four, the third of each four, a chord a bar, one of eight (`PROGRESSIONS`), a new one every 16 sections (a choice of this experiment, not a measure of players):
    2,101 filings, 320 new and 1,781 a progression held already (identity), each new one reading back as filed; 5,459 sections play a progression from the repository; the most used theme plays 2,507 sections, 29.5 %, under 60 %.
    The share among a run's 3 most used themes rises 13.9 points (3.0 error) against the same walks with nothing learned, which can't hear the player: past 5.
    It is the player's progressions coming back. Use and use together add 0.07 points of it (above, no player); above `VAMP_HARM` a progression filed is the only fit, and each section that plays it is a use that widens its reach (cells' `USE_STEP`, to `USE_CAP`); with use moving no point, only counting together, the rise is 4.8 points (2.2 error), still past 5 with twice its error.
    Whether this is the lock-in the bound means, or the loop doing what it is for, is the owner's to rule (#425).
  - **The cost** (Node, a shared container): the warm-up's 45 steps (a seed read under a named meter) take at most 6.8 ms each; with the layer that filed the most progressions (8), an ask takes 0.15 ms at p95 and 5.5 ms at most, the first, cold, under #425's 5 ms at p95.
  - Not measured: entropy other than 0 held and 0.3 walked, players other than this one, chords a session's client plays (no part carries them yet), a progression's variations (cells has no operators on a harmony, yggi/cells#208), and how any of it sounds.

- **E44. The homeostat's sensor, measured** (#237, step 6's first part; cells' recogniser, yggi/cells decision 055; the owner's limits of 2026-10-22), in
  [`packages/engine/experiments/homeostat-sensor.ts`](../packages/engine/experiments/homeostat-sensor.ts) and [`packages/engine/src/recognised.ts`](../packages/engine/src/recognised.ts),
  held by [`packages/engine/experiments/homeostat-sensor.test.ts`](../packages/engine/experiments/homeostat-sensor.test.ts) (about 90 s under vitest):
  - **The sensor** (`recognised.ts`): each bar, what each member played is stated as cells text by its own text function (the drums' hits but the clave's, the bass's line over the bar's chords, the lead's line in the bar's key, and the section's theme as a progression), and recognised by cells' recogniser among the member's library (cells' seeds of its facet and the layer's filings of it), exactly (tolerance 0) or by one of the operators the composer varies it by (depth 1).
    The share is that of the bars recognised over the last 8 (`shareOf`): a member's over the bars it played in, and over all members pooled.
    It reads a bar after the band plays it and gives the band nothing: every event of every preset walked for 64 bars is the same sensed and not.
  - **The runs**: the 8 presets, every member through the loop (cells' meters, rhythms, bass lines and harmonies, and the lead lines), learning from an empty layer, nobody playing; held, each preset's swing, 2 seeds of 64 bars (128 sections); walked by the radio as E37 to E43 walk it, 2 seeds of 256 bars (512 sections); at entropy 0.1, 0.3 and 0.6.
    A share is read at each section's last bar, where its window is the section's 8 bars.
  - **Where it sits at entropy 0.3**, against the ruled band of 0.4 to 0.7 (mean, spread as the standard deviation over sections, the sections inside the band, and those pinned at 0 or 1):

    | member      | held: mean | spread | inside | pinned | walked: mean | spread | inside | pinned |
    | ----------- | ---------- | ------ | ------ | ------ | ------------ | ------ | ------ | ------ |
    | drums       | 0.002      | 0.016  | 0 %    | 98 %   | 0.012        | 0.089  | 0.6 %  | 97 %   |
    | bass        | 0.220      | 0.375  | 0.8 %  | 78 %   | 0.209        | 0.360  | 4.5 %  | 79 %   |
    | lead        | 0          | 0      | 0 %    | 100 %  | 0            | 0      | 0 %    | 100 %  |
    | harmony     | 0.288      | 0.453  | 0 %    | 100 %  | 0.288        | 0.453  | 0 %    | 100 %  |
    | all, pooled | 0.134      | 0.161  | 7.0 %  | 49 %   | 0.127        | 0.161  | 7.0 %  | 53 %   |

    Over all members it sits under the band in 93 % of sections held and walked (119 of 128, 476 of 512), and above it in none: the sensor reads the band left alone as confusing, in every preset.
    By preset, over all members, held (walked): Techno 0.37 (0.36), inside the band in 44 % (36 %) of its sections; Swing jazz 0.29 (0.19); Funk 0.27 (0.28); Ambient 0.09 (0.10); Synth-pop, Deep house, Lo-fi hip hop and Bossa nova 0.02 or less held (Bossa nova 0.05 walked).

  - **Why so low, by member**:
    the drummer plays its fragment's hits as it decides how many (`groove.ts`: the fragment says only where), so its bar is a fragment thinned and joined by its own lines (a Euclid on the rim, fills on its own), several notes from any fragment or one operator of it, and is almost never recognised, even where the Muse filed the drummer's own groove;
    the lead has no seed line in cells, and with nobody playing files none (its own are filed only where a player answered, #424), so its library is empty;
    a harmony is one text a section, so its share is a section's 0 or 1: 1 where the theme is a seed vamp (Techno, Funk), 0 where the tables walk, and none stated where a theme leads to a secondary dominant (Bossa nova and Swing jazz, most sections);
    the bass's line is recognised where it plays a seed line as the seed states it or bent or trimmed by one of cells' pitched operators (Techno, Ambient, Swing jazz's walk), and not where the bass decides its own notes over it; `bend` and `trim` (cells v0.10.1) raise its share from 0.173 to 0.220 held and from 0.128 to 0.209 walked.
  - **Per member or over all members**: over all members, pooled.
    Each member's share is pinned at 0 or 1 in 78 % to 100 % of its sections (the lead and the harmony by construction), so it says little a ladder could move; over all members the share is pinned in 49 % (53 % walked) and moves between, the one with a spread to control.
  - **Entropy** barely moves it: over all members 0.142, 0.134 and 0.130 held at 0.1, 0.3 and 0.6, and 0.134, 0.127 and 0.114 walked, so a band widening with entropy has nothing yet to be placed on.
  - **Tolerance** (held at 0.3, over all members): 0.134 at 0, 0.155 at 1 note, 0.214 at 2 and 0.406 at 4, where 50 % of sections are inside the band and 0.8 % pinned; at 4 the bass is above the band in 92 % of its sections and the drums reach 0.17.
    A tolerance from the licence is #237's step 1, not built; this says where it would move the share.
  - **The cost** (Node, a shared container; the recogniser warmed on every member's seeds on every bench, as a page warms at idle, so a bar compiles only its heard texts, one a member): a bar's recognition of every member takes 6.6 ms at p95 held and 6.7 ms walked (max 105 and 84 ms, single bars; no worse on a bar after a filing), over the ruled 2 ms.
    The drums' one compile is most of it (3.4 ms at p95 held, 5.1 ms walked); the bass 0.8 to 0.9 ms, the lead 0.7 ms, the harmony 0.5 ms; a tolerance of 1 to 4 costs about the same.
  - Not measured: the page's cost (the ruling's bound is on the page), a player on the walks, the shares under the controller (a later step), and how any of it sounds.

- **E45. The homeostat's controller, measured** (#237, step 6; the owner's limits of 2026-10-22), in
  [`packages/engine/src/homeostat.ts`](../packages/engine/src/homeostat.ts) and [`packages/engine/experiments/homeostat.ts`](../packages/engine/experiments/homeostat.ts),
  held by [`packages/engine/experiments/homeostat.test.ts`](../packages/engine/experiments/homeostat.test.ts) (about 2 minutes under vitest; `E45_REPORT=1 E45_FULL=1` prints a larger set, about 10 minutes):
  - **What it reads.** E44's sensor, every member against its library, reads the band left alone at 0.134 and entropy barely moves it, so no lever moves it either.
    E45 hears each bar against what the member played lately as well (`recognised.ts`: its last 8 texts, the harmony's last 2 themes, heard once a section), the workbench a listener has just heard.
    Over all members it then reads 0.68 at entropy 0.3, and falls as the band's entropy rises; with what was played lately alone, without the library, it reads 0.67, so it is what was played lately that is recognised.
  - **What it moves**, measured open (a probe of 8 presets, 2 seeds of 128 bars, held at 0.3, before the controller was written):
    the novelty ladder's rate alone (boredom a section, and the pull of use together, set apart from the band's entropy) moves the share from 0.682 at a rate of 0 to 0.674 at 1, almost nothing, since a varied fragment is recognised by its operator and a fetched one is repeated for its section;
    the band's whole entropy moves it from 0.72 at 0 to 0.61 at 1 (the test's runs: 0.721, 0.684 and 0.601 leaned all the way down, at no lean, and all the way up), in every preset.
    So the controller leans the band's whole entropy, the owner's nudge for the whole system (#237, 2026-09-30): `leanedEntropy` is the players' plus the lean, inside 0 to 1, and the band plays at it, the composer's ladder with it.
  - **The controller** (`homeostat.ts`): the band is 0.4 to 0.7 at entropy 0.3 (ruled), about a centre of 0.55, widening by 0.3 for each unit of entropy (chosen: 0.21 wide at 0, 0.51 at 1).
    It reads the share over the last 8 bars at each section's second-to-last bar, and the band plays the next bar, which decides the next section, at the new lean.
    A reading above the band (bored) leans the entropy up, one under it (confused) down, by `LEAN_STEP`, 0.5, where the reading before was out on the same side (`PATIENCE`, 2); inside it holds.
    With no patience and a step of 0.25 it reversed up to 1.75 times per four sections at entropy 0.1, past the ruled 1, chasing a section's noise (a section's share spreads by 0.12 to 0.14); with patience 2 and a step of 0.5, at most 0.5.
  - **Closed**, the share of sections inside the band at the players' entropy (`E45_FULL`: held 2 seeds of 128 bars a preset, walked 2 of 256 at 0.3):

    | players' entropy | left alone | closed | leaned all the way up | most reversals per 4 sections |
    | ---------------- | ---------- | ------ | --------------------- | ----------------------------- |
    | 0.1, held        | 27.7 %     | 47.3 % | 51.6 %                | 0.5                           |
    | 0.3, held        | 52.7 %     | 64.1 % | 68.0 %                | 0                             |
    | 0.6, held        | 74.2 %     | 75.4 % | 77.0 %                | 0                             |
    | 0.3, walked      | 48.8 %     | 65.8 % | 67.4 %                | 0.25                          |

    The test's own runs (1 seed of 96 bars held, 128 walked, at 0.3): 45.8 % left alone, 56.3 % closed, 71.9 % all the way up; 51.6 % and 59.4 % walked; no reversal.

  - **Against the ruled limits**:
    the reversals are within one per four sections in every run;
    the share is inside the band in 47 % to 75 % of sections, under the ruled 80 % at every entropy, and so is the lean all the way up, which is the controller's reach: what bounds it is the lever, not the controller;
    the band left alone is bored, not confused: above the band in 34 % to 59 % of sections, under it in 1 % to 4 %, and the controller ends leaned up in 13 of 16 runs held at 0.3, and never down;
    Ambient and Swing jazz stay at 0.68 to 0.69 at the band's entropy of 1 (Synth-pop 0.54), so nothing the lean can reach brings them further in;
    a run leaned all the way down at its start comes inside after 1 to 5 sections (3, 1, 2, 5, 1, 2, 3, 3, counted from its first section), within the ruled 2 in 4 of 8, and the open runs take as long, so the lean is not what holds the others out.
  - **The cost** (Node, a shared container; a recogniser warmed on every member's seeds): a bar's recognition of every member takes 9 to 12 ms at p95 against the library and what was played lately, against E44's 6.6 ms, over the ruled 2 ms; each text heard is read with its variations once, to be heard against in the next bars.
    cells' recogniser keeps every text it reads, so a run reading new texts every bar grows without bound: one recogniser shared by 48 runs of 128 bars ran out of the default heap, so each run here has its own.
  - **Next**, for the owner (#237): whether the sensor hears what was played lately (the reading it gives is the one a lever moves); a lever with more reach where entropy 1 is still bored, such as E22's rate of variation (step 0b) or the ladder's fetch far; and the host's part: recognition at idle, off the clock, with a recogniser rebuilt or a cache bounded in cells, before any host runs the controller.
  - Not measured: a player, the page's cost, a session, the 30-minute soaks the ruling names (the band's events with the controller off are E44's), and how any of it sounds.

#7's decisions are made: (a) to (c) as U1 to U3, (d) as U4 and U5, and (e) to
(h) as T4's performance maps, C7, L6 and P5.
