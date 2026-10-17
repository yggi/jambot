# Language: state and change

The catalogue of what a bar carries from the bars before it, and of how a value changes: glides, trajectories and the style space.
The frame, the method and the tensions are in [`language.md`](language.md); the experiments are in [`language-experiments.md`](language-experiments.md).

## State

**S1. The prototype's score is not self-contained.** Witness: a bar whose text
alone compiles to other events than the run played. Counterexample: a run in
which every bar compiles cold as it did warm. Test:
`prototype/experiments/cold-warm.mjs` (E1): 1,949 of 2,880 bars (68%) and 8,976
of 86,911 events (10%) differ, always in register (the octave of a bass or lead
note, a chord's voicing), never in harmony or rhythm. 357 bars (12%) voice the
next bar's chord through `nx`, which reads the plan. During the tour's glides
the tempo played is up to 8.6 BPM off the bar's `bpm=`. Source: the prototype's
compiler, which reads `S.cs[part].prev`, `S.prevVoicing` and the next bar's
plan, and its tempo glides in `S.tr`. Status: measured. Lands in: Q4b.

**S2. Whatever a bar reads from before it is written at the bar, as a key
frame.** Witness: none yet. The port's parts say what a key frame would hold:
the bass's last note and the comp's last voicing (register), and the lead's last
note, its phrase and its themes' melodies; the band already decides the next
chord a bar ahead. It never needs random state, since every draw names its
stream. Counterexample: a bar that compiles differently cold and warm. In the
port's composer, a band resumed after passing bars plays the lead from another
phrase: memory that is more than register. Test: `cold-warm.mjs`, which fails on
the prototype today; the port's version lands with the pitched parts.
`random.test.ts`, "names every stream with its own id, so no two decisions share
their numbers (S2)" and "keeps every stream of every seed apart, neighbouring
seeds included (S2)": with the stream's id mixed straight into the seed, seed
10's `drumVariation` drew exactly seed 11's `drumHit`, so the seed is mixed
first. `band.test.ts`, "carries register into the bass and the comp, but a
phrase into the lead: what a resumed band loses (S2)": over 80 resumptions, the
bass and the comp play the same rhythm and pitch classes, in another register;
the lead differs in more than half.
A sheet leaves the octave and the inversion to the player, so the score pins a hand only where it is not the default: `frame bass=28 comp=12,16,19` states the register the bass reads from (the carried `last`, before an octave jump) and the voicing the comp leads its first chord from.
Each is an integer above the tonic at or below the part's floor, 33 for the bass and 50 for the comp, so a pin moves with the key.
A bar whose hand is the default, the bass's E2 and the comp's nothing, states no pin, and a text without one compiles to a performance from that default, which differs from the band's only in register and inversion.
`seam.test.ts` (`packages/score`), "plays the same bass cold as warm from the text alone: 80 resumptions, each given its frame, play every note; without it, another register (S2)": 80 resumptions given their pin play every note, where the same bars resumed without it play another register, the same pitch classes; "plays the same comp cold as warm from the text alone: 80 resumptions, each given its frame, play every note; without it, other inversions of the same chords (S2)".
`score.test.ts`, "compiles a bar from its own text, with no state before it: the register is the default or in the frame, so cold equals warm (S2)", "pins a register other than the default in a frame, counted from the tonic at or below the bass’s floor, so the pin moves with the key (S2, U6)" and "voices each chord close from the one before it, the first from the frame: the same chords from another voicing are other notes (S2)".
The lead's phrase is still open (#265).
`radio.test.ts`, "is warm when resumed cold from its carried state at sections 1, 64 and 600, and within the text’s rounding, for good, from the style as the score writes it (S2)": the radio (#313) carries only the style it reached, so a walk resumed from it is the walk; resumed from the style as a bar's header writes it, to 3 decimals (C7), it differs, and stays within that rounding, since a walk with no pull neither forgets an offset nor grows it.
Source: T5, S1, #40's review, #37 step 5. Status: measured, failing
(prototype); measured (the port's carried state, and the bass's and the comp's pins; the radio's carried style).
Decided: the owner, ahead of the evidence: the frame is a pin counted from the tonic, and a text without one compiles from the default hand. Lands
in: #13, #264, #265.

**S3. A performer's own draw never keys on what a resumed band may still differ
on: a pitched part's note, its register.** Witness:
`velocityLooseness`/`lengthLooseness` and `ownAccent` (`performer.ts`) key every pitched part's
draw by bar and step alone; only the drums, whose note is a sound's identity
rather than a register, keep the note in the key. Counterexample: a draw keyed
by the note too, matching `drumVelocity`'s own shape for every part.
`velocityLooseness`'s first draft did exactly this: a bass or pad note resumed
in another register then drew a different length looseness than it would have
before the resume, though S2 says only its register may differ. Test:
`band.test.ts`, "carries register into the bass and the comp, but a phrase into
the lead: what a resumed band loses (S2)": fails on the pitch-keyed draft and
passes the fix; no new test needed, since S2's own already exercises it. Source:
#147/#154's build, caught by S2's own test. Status: measured. Decided: S2,
dissolved — S2 already requires it, so a performer's own draws have no real
choice here, only a bug to avoid, not a new one. Lands in: T17; whatever next
reads a pitched part's own note into a seeded draw (#107's Open items: voicing,
which dough keys a performer fills).

## Change

**C1. Nothing jumps: a change is a glide from where the value is, as fast as it
was moving.** Witness: `glideTo` in `style.ts`: a glide (from, to, start,
length) that carries the running glide's value and rate. Heading for its target
it is a cubic Hermite curve, which arrives sooner rather than overshoot
(Fritsch–Carlson). Sent back, its carried motion brakes within what the glide
before had left, and soon enough to peak inside the axis. Counterexample: a new
glide that starts from rest or from another value; from rest, a slider drag
plays harmony 0.476 at the end of an 8-step drag from 0.45 to 1, where carrying
the rate plays 0.547. A glide sent back whose carry grows with the new length: a
slider glide turned by a preset held harmony at the axis end for ten bars, with
a rate the clamp hid. Test: `style.test.ts`, "nothing jumps: a new glide starts
from where the running one is, and as fast, on every axis (C1)", "keeps moving
while a slider is dragged (C1)", "turns back within what the glide before had
left, whatever the new length (C1)", "stops its carry short of the axis end,
when a long glide inherits fast motion (C1)" and "never rests at an axis end it
was not sent to, and its rate is the slope of its value (C1)", the last over
every order of two intents, every turning step and every axis. Source: spirit,
Pd's `line~`. Status: measured (style axes); open (how the IM writes a glide,
tension 2). Decided: spirit, inherited (the behaviour). Lands in: #37 (done),
#13.

**C2. A parameter declares its range and the space it glides in.** Witness: the
style axes in `style.ts`, each with a range and a linear or logarithmic space;
tempo glides in log space. Counterexample: a glide whose midpoint is not the
midpoint of its space. The prototype glides every axis linearly. Test:
`style.test.ts`, "have their ranges and the space they glide in (C2)" and
"passes the midpoint of its space halfway: the mean, or for tempo the geometric
mean (C2)" (104 bpm halfway from 60 to 180). Source: LADSPA port hints. Status:
measured (style axes); open (the `sound` parameters, E2). Lands in: #24.

**C3. Each value lives at one rate, the slowest at which it is constant, and a
slower level's output is held as a faster one's environment.** Witness: the
port's rates: the section plan per section (`planner`: the section kind, the key
and the theme), the style for composing per bar (`band`), swing per beat
(`swingOf`), tempo per step (`tempoMap`), scheduling per tick (`transport`, 25
ms). The band holds each section's plan for its eight bars, and commits a bar,
its plan and chords, when it composes the bar before, so what a part leads into
is what plays; but nothing it decides reads more than the seed, the bar, the
style and the wish, so `lookAhead` runs those same decisions forward any
distance, not only one bar: the harmonic layer needs no key frame beyond the
plan's own carried state. Counterexample: a value read at two rates that
disagree, such as the prototype's tempo, which plays per step and is written
once per bar (S1); or a forecast that disagrees with what the band then plays.
Once a value has been read at its rate, it holds: a change in the middle of a
beat re-swung the rest of that beat by up to 0.36 steps, so the transport keeps
a started beat's swing. Test: `band.test.ts`, "holds each section for its eight
bars (C3)", "plays each section's plan and its theme's chords, each decided when
the bar before it is composed (C3)" and "forecasts the plan and chords of the
bars the band then plays, from any bar, bar 0 included, any distance ahead
(C3)"; `packages/engine/src/tempo.test.ts`, "swings each beat by the share where
the beat starts (C3)"; `transport.test.ts`, "keeps a beat’s swing once the beat
has started, whatever the style does next (C3)". Source: Pd's control and signal
rates, multirate signal processing, #37 step 3, #40's review; #7's comment on
#26's tests, "harmony can be decided any distance ahead"; #131, catalogue
upkeep. Status: measured (port, committing a bar ahead and forecasting any
distance ahead); open (the rates the IM writes). Lands in: #13.

**C4. A part morphs: as the style moves, its hits and tones come and go one at a
time.** Witness: the drums, whose threshold per step and sound is drawn once per
section, so a rising energy only adds kicks, snares and hats. The chords, whose
seventh and ninth are drawn once per theme, bar and slot, so a rising harmony
only adds chord tones. Counterexample: a hit or a tone that goes as its axis
rises. The rim gives one on purpose: it plays E(3,16), E(5,16) or E(7,16) as the
energy crosses a third and two thirds, and the three are not nested, so hits
move there (950 of 192,000 energy steps took hits away in #40's review). The
port keeps the prototype's named patterns over a nested ranking that would
morph. The raised dominant gives another: above harmony 0.4 the minor v before i
becomes V, so its third moves. Test: `drums.test.ts`, "morph with energy:
raising it adds kicks, snares and hats, and never takes one away (C4)" and
"switch the rim between Euclid patterns at energy ⅓ and ⅔, and otherwise only
add to it (C4)"; `packages/engine/src/chords.test.ts`, "only gain tones as
harmony rises, one slot at a time (C4)", which skips the step where a dominant
is raised. Source: the prototype README ("rhythm as morphing"), the review of
#40, and #37 steps 3 and 4. Status: measured (kick, snare, hats, chord tones);
measured, failing (the rim and the raised dominant, by choice). Open: whether
named patterns or a nested chain of them serve the music better, and the pitched
parts' rhythms, which nothing measures yet. Lands in: #2 (the pitched parts'
rhythms).

**C5. A change is heard within a bound set by the rate it lives at.** Witness:
the transport. Tempo follows from the next step, swing from the next beat, and a
composed part from the next bar composed, which is composed on the last beat of
the bar before (`COMPOSE_AHEAD`, at least 333 ms at 180 bpm): within the rest of
the bar and a beat, at most 20 steps. What is decided a bar ahead waits a bar
more: a chord's colour, from the next bar decided, within the rest of the bar, a
bar and a beat; a key, which lives per section, from the next section planned,
within the rest of the section, a bar and a beat. Counterexample: a change that
waits longer. Composing a bar as the bar before starts made energy and sync wait
17 to 31 steps, so a slider's one-bar glide had ended before the drums heard it.
Test: `transport.test.ts`, "hears a change in the drums within 20 steps: the
rest of the bar and a beat (C5)", over a change at every step of three bars, and
"composes each bar on the last beat of the bar before, and not sooner (C5)";
`player.test.ts`, "hears a preset's mode from the next section on, and shows the
chords (C5)". Source: #40's review, #37 step 4. Status: measured. Open: the lead
the text step and the models need (L5), which the bound grows by. Lands in: #13,
#26.

**C6. What the players want is a target the band settles on, not an event it
consumes: read again, it changes nothing.** Witness: the key wish.
`nextKey(key, wish)` goes to the wished key in one step, pivoting on the most
shared notes when only a mode is wished, and applied again gives what it gave
once. So the band reads the wish at every section boundary, and what it plays
does not depend on when or how often the wish was sent. The Muse's offer (#79):
the band reads it as its environment every bar, and what the lead plays from it
follows the motif alone, not the bar it was heard in, the player it came from,
or how loudly they played it. Counterexample: a wish that moves again each time
it is read, such as "up a fifth", or one consumed as an event, which the
prototype must cut its plan back for (`replanFuture`) so that it lands at a
boundary. Test: `key.test.ts`, "settle on a wish in one step: applied again, a
wish changes nothing (C6)", over every key and wish; `plan.test.ts`, "settles on
a steady wish: the key moves once, then stays (C6)"; `band.test.ts`, whose test
of an offered motif cites C6: two offers of one motif, heard in bars 3 and 40,
from two players at levels 110 and 35, play the same notes and velocities over
128 bars. Source: #37 step 4; fixed points, #39; #79 step 3. Status: measured
(the key); measured (the Muse's offer). Open: how the IM writes a wish.
The style axes' wish is a displacement, not a target (C10), and the key's wish is a target today, so "wish" has two shapes until the key's is read the same way. Lands in: #13, #25, #39, #79.

**C7. The band reads its style as the score writes it, on a grid of 3 decimals,
so a bar's header states exactly the style it was composed from.** Witness:
`writtenStyle` (`STYLE_DECIMALS`), which the band applies to the style of every
bar it plays, passes or looks ahead to. What plays between bar starts, the tempo
and the swing, the transport reads from the style track itself, continuously
(C3). Counterexample: a bar whose header, read back, composes another bar. With
the band reading every float and the header writing 3 decimals, 4 of 320 bars of
the app's glides did (E10). Test: `style.test.ts`, whose tests of `writtenStyle`
cite C7: every value a preset glide passes through lands within half a step of
the grid, inside its axis, and reads back from its text; `band.test.ts`, "reads
its style as the score writes it, so a bar states exactly the style it was
composed from (C7)", over the app's glides, the bars ahead included;
`score.test.ts` (`packages/score`), whose test of the style's grid cites C7:
every value on the grid, each unit axis's 1,001 and `bpm`'s 120,001, is written
and read back as itself, and a value off it is refused both ways.
`seam.test.ts`, whose test of the axes cites C7: the score's axes, their order
and its grid are the band's. Source: E10, T5. Status: measured. Decided: #7, on
measured options (E10). Lands in: #63 step 2 (the header).

**C8. A level below moves what the level above sets only within the licence it leaves, and never selects outright.**
Witness: `licenceOf(style)` (`licence.ts`), one function for the four licences the style leaves: the performer's feel at the note (T17 is this entry at the note), the tempo, which the players nudge by a ratio of the style's (`tempoNudgeWithin`), the key, which they move round the circle of fifths from the home, the key the plan is heading for (`intoReach`, `player.home`), each a displacement from what the level above sets (C10), and the melodic scale the lead walks over the key (`melodicWithin`, #209).
The genre sets each range (`harm` the key's reach and the melodic scales, `swing` and `artic` the feel), and the players' `entropy`, which no preset sets, how much of it is used (#176).
A wish beyond a licence is pulled back to its edge, not refused, so what the players ask for moves the band as far as the style allows.
The composer and the performer read the same style and use it differently: the band's own drift takes the key's reach from `harm` and its readiness to move from `entropy` (C9), the performer takes the feel; the licence is what is given, the entropy how much of it is used.
Counterexample: a nudge that takes a value past its licence, such as a key picked six fifths away in Techno; a licence that reads something other than the style; a layer below that sets a value the layer above holds.
Test: `licence.test.ts`, whose tests of the tempo, the key and the melodic scale held within reach cite C8: every preset and tonic, and every scale at every harmony; `conductor.test.ts` (`apps/web`), whose test of a key held within reach of the plan's key cites C8: every home and tonic; `player.test.ts` (`apps/web`), whose test of the players' home cites C8: the plan's key, whatever the harmonic history weighs.
Source: #176, #193, #209; the law of recursion.
Status: measured (the feel, T17; the tempo; the key; the melodic scale).
Decided: #176, ahead of the evidence: the key's reach from `harm`, the tempo's from `entropy`, and the feel from `swing`, `entropy` and `artic`; #210, on measured options (E19): the key's reach counts from the plan's key, not from the harmonic history's centre, which trails a key change by half a section and may not find it where the harmony is thin.
Lands in: #176 (closed), #195, #210.

**C9. Every level holds a default and a licence, reads its fill back up, keeps a fading memory of the readings, and leans its default toward the memory's centre, within the licence of the level above.**
Witness: the key, which has all five arrows (#169, #210).
It holds the style's reach (C8) and a chance to move of `KEY_JUMP` times the entropy; the band fills it with chords; `foldBar` reads them as a weight per pitch class; the weights fade by `HISTORY_DECAY` a bar, a fading memory (`fading.ts`) whose time constant is 1 / (1 − 0.85), about 6.7 bars; and two leans read it: the centre (`centre`, the key whose scale weighs most, where the band has been), and the band's own drift, a draw among the keys within reach by their weight to the fourth power (`bandWish`, `leaning`), of which the centre is the limit as the power grows.
E19 measures the loop: every jump stays within the reach, and the centre reaches a new key 1.2 to 3.9 bars into its section, but where the harmony is thin its reading loses what tells neighbouring keys apart, and the centre misses the band's key by the section's end in half of Ambient's jumps and in 3 of 10 of Funk's.
Read against the memory, the read is recognition, hearing a remembered pattern under an operator (Q12): the key's centre is the shift of the scale that best lays it on what was heard.
Since a fading memory forgets where it started, a client that joins late and folds the bars it hears from nothing comes to its host's history without being sent it: the history its key card draws agrees with the host's once the gap has faded below what tells two keys apart.
Counterexample: a level whose fill no one reads, whose default never moves however it is nudged, as the tempo's (`nudgedTempo` reads the style and the nudge alone, #195); a memory that drops at a cliff, not a fade, as the Muse's offer, forgotten whole after `MUSE.forgetAfter` = 16 silent bars (#207); a lean that leaves the licence of the level above.
Test: `fading.test.ts`, whose tests cite C9: a memory fades to nothing left alone, settles on a held reading at the reading times its time constant, and forgets where it started, two memories fed the same readings drawing together by the decay each fold, at four decays, and each lean leans as it says; `packages/engine/src/history.test.ts`, whose test of the recorded keys and centres cites C9: the band's key per section and its history's centre per bar over every preset, three seeds and 24 sections, as recorded before the history was a fading memory; `plan.test.ts`, whose test of the band's lean toward its history's centre cites C9; `key-loop.test.ts` (`packages/engine/experiments`), E19; `muse.test.ts`, whose test of the offer forgotten after 16 bars cites C9, the cliff; `licence.test.ts`, whose test of the tempo played cites C9: the style's own tempo times the nudge, and nothing else.
Source: #210; W. Ross Ashby, _Design for a Brain_ (1952), the homeostat; Stafford Beer, _Brain of the Firm_ (1972), the recursion of viable systems.
The Muse remembers the motifs she took the same way (#204 H8, `muse.ts`): a fading memory by `MOTIF_DECAY` a bar, in which a motif heard once is kept for 16 bars, as long as an offer outlasts silence, and longer each time it is heard again, and a motif heard again is taken first (Q12).
Her offer still drops at the cliff, so the memory has no lean yet: #207's selection is its lean.
The style left alone, the radio (`radio.ts`, #313), is the style's row with nobody in it, by the owner's ruling (no attraction): it holds the axes' bounds and takes the energy and entropy as its temperature, fills by a free walk, and has no read, memory or lean until a player acts, when its position is the default the players' nudges lean from (#195); E30 measures its three numbers (A4), and that it never comes home (Q11).
Status: measured (the key); measured (the Muse's memory of motifs); measured, failing (the tempo; the Muse's offer); open (the note, #204; the phrase, #207; the style, #195).
Open: whether a lean is always a centre or sometimes a draw; whether every level needs every arrow (the performer's fill is read by nobody); where each memory lives (S2); and whether a level needs a default of its own to return to (Q11).
Lands in: #210, #195, #204, #207, #16.

**C10. A wish is a displacement from what the level above sets, in that value's own space, held per player as a running total and settled on the median: read again it changes nothing, and a default that moves under it carries it along.**
Witness: the tempo, whose nudge is a count of octaves from the style's tempo (`nudgedTempo`: the style's times 2 to the nudge, held within `tempoLicence`), which a preset carries over to its own tempo (`styleAfter`, `conductor.ts`), and the key's licence, counted in fifths from the home (`fifthsApart`, `intoReach`).
Still to build: the style axes (#217), where a wish is a count of steps of the axis from the style's value, the players' wishes settle on their median, and the style played is the default plus that, within the licence (C8).
The top of each chain is a point, a preset or a tonic, and everything below it is a displacement: the T of T and I (U5) on the value's own axis, in the space its parameter declares (C2).
A displacement travels as its running total and never as an increment, so a lost or repeated message changes nothing (C6), and the median lets no one player pull the band further than the middle of the players, which a sum of increments would.
Counterexample: a wish stored as a target value, so that a preset or a drag of the default has to clear it or lose to it; a wish sent as an increment, which a repeated message moves twice; a median that one player alone can move while others are present; a settled value outside the licence.
Test: open, and for the style axes the step #217 lists, over every preset and axis: the settled style is within reach, a lone player gets exactly their wish, the order of players changes nothing, a wish applied twice is applied once, and a default moved by a drag moves the wish along with it, held at the axis's ends.
For the tempo and the key the displacement is already what the code holds, and `licence.test.ts`'s test of the tempo played (the style's own tempo times the nudge, and nothing else, cited under C9) is the nearest test.
Source: the owner's gut on #217 that everything is a delta; #217's proposal; T18 and T20, the same shape at the note; C1 and C2.
Status: open.
Lands in: #217 (the pure wish, then the path), #116.
