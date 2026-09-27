# Language: the negative shape

Jambot plays from an internal musical expression (IM): whatever composer,
compiler, analyzer, renderers and later models all read and write. The
prototype's score text is one candidate for it, not the answer, and the
prototype calls it the IR: one letter away, and not the same thing. This doc is
the design work of #7.

The IM is looked for as a **negative shape**. Rather than drawing the language
and defending it, the design gathers the constraints and invariants that every
system around Jambot places on it, from the inside (the prototype, the theory,
the engine, the analyzer) and from the outside (Strudel, MIDI, dough, Pd,
LADSPA, Fourier analysis, signal processing, functional programming, category
theory). What is left when they are all satisfied is the language. Its syntax
comes last.

This catalogue is the negative track of a ratchet ([`ratchet.md`](ratchet.md)):
#37, the working shape of the app, and #3, the analyzer, are the working tracks
paired with it (#41). Findings from their steps come up into this catalogue, and
entries that bind code go down as tests in their next step. The properties that
no single pair owns, such as round trips across several boundaries, are
collected in [`quinetic.md`](quinetic.md) (#39, Q1–Q8).

## Method

1. **Probes.** Each system is a probe. The question for each is not "should
   Jambot look like this?" but "what does this system force, forbid or show to
   be possible?"
2. **Catalogue.** Every entry is a claim in the `ratchet` skill's form
   ([`SKILL.md`](../.claude/skills/ratchet/SKILL.md)): a witness that makes it
   true, the shape of a counterexample that would refute it, a decidable test, a
   source, a status and where it lands. The status is the evidence, one of
   speculative, open, derived and measured (or measured, failing), and it only
   rises. A rule the owner took is a separate field, `Decided: <where>, <how>`,
   which says whether it was inherited, dissolved, chosen on measured options,
   taken in the working track or chosen ahead of the evidence.
3. **Tensions.** Where two constraints pull apart, a decision is needed. The
   tensions are the design's agenda.
4. **Candidates.** Candidate forms are scored against the catalogue. None is
   chosen before the catalogue settles.

A test named here lives on `main`, unless the entry says otherwise. A test that
holds an entry cites its id in a group at the end of its description, such as
`(F6)` or `(T4, Q1c)`, and the entry names the test's file; it need not quote
the test, so the test's wording can change. Tests written before the catalogue
are named here by file and quoted description. The pawl check
(`tooling/pawl.ts`, #42) holds all of this in `pnpm verify`: every entry has a
status on the ladder, every file an entry names exists and every quote is a test
in it, a measured entry names a file, every cited id is defined once, and an
entry names the file of every test that cites it.

## Probes

| Probe                       | What it is                                                      | What it bears on                                             |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| Prototype                   | The score text, its compiler and the round trip                 | Everything; it is the baseline                               |
| `packages/theory`           | `even(k, n, shift)`, the helix and its operations               | Pitch and rhythm as one object                               |
| Strudel, mini-notation      | Patterns as functions of time, queried over a span              | Time, random access, the export target (#11)                 |
| dough                       | Flat key/value event messages at the bottom                     | What the lowest layer carries                                |
| MIDI                        | Note on/off, 7-bit values, channels, a 24 ppqn clock            | Lossy lowering, note-off bookkeeping, the time grid          |
| Pure Data                   | Dataflow patches; control rate and signal rate; logical time    | Continuous change, rates, the band as a graph                |
| LADSPA                      | A plugin is its declared ports, each with range and scale hints | Parameters, renderer interfaces, realtime capability         |
| Fourier (DFT on Z_n)        | Pitch-class sets and rhythms as spectra                         | A continuous space around the discrete theory                |
| SDR, signal analysis        | Carriers, baseband, clock recovery, squelch, multirate          | Relative pitch, following players, confidence                |
| Analyzer (#3), models (#14) | Messy MIDI in; small models reading and writing tokens          | Totality, grammar size, provenance                           |
| Functional programming      | Haskore and Euterpea, FRP and arrows, Tidal's pattern monads    | Composition laws, state, streams                             |
| Category theory             | Coalgebra, Lewin's transformations, the paracyclic category     | Nomenclature, and laws that can be tested                    |
| _Gödel, Escher, Bach_       | Strange loops, quines, canons                                   | The self-reference the project is built around (speculative) |

## Catalogue

### Time

**T1. The clock never waits: every advance finishes in bounded time, and nothing
plays late.** Witness: the transport, which advances from the head to now + 120
ms and drops what a stall made it miss. What arrives from another app is read by
its shape before anything is read from it (`readClientMessage`, and `admissible`
for what a judgement says), and the player takes what arrived before the
transport reads it, so nothing a client sends can stop the host's clock.
Counterexample: a stall after which events play late, or the grid moves; a
message that throws on every tick after it arrives. Test: `transport.test.ts`,
"never waits: after a stall it drops what it missed and keeps the grid where it
was (T1)", "catches up after four hours’ stall within a lookahead, reporting the
missed steps by count (T1)" and "drops what only claims to be a judgement, and
the clock never waits for it (T1)"; `apps/web/src/session/session.test.ts`,
whose test of a garbled judgement cites T1: the host keeps playing, and says it
dropped it. A Muse that reads a judgement without checking its shape fails it.
And `faults.test.ts` (`packages/session`), which runs the transport on a clock
with each fault #27 lists: drift, a dropped buffer, the render quantum, stalls
and a client's clock stepping. Open for compiling: every text that parses
compiles, in bounded time. Source: spirit, #37 step 3. Status: measured
(transport); open (compile). Decided: spirit, inherited. Lands in: #13.

**T2. Positions are exact fractions of a cycle, not ticks.** Witness: none yet;
the port counts steps in floating point. Counterexample: a triplet or quintuplet
whose position changes on a round trip. Lengths too: the port's are floats drawn
from the articulation, and 46 of 320 bars of a gliding tour play other lengths
when the style they are composed from is rounded to 9 decimals (E9). Test: open:
triplets and quintuplets round-trip exactly through `compile` and `encode`.
Source: Strudel (rational time), play-aeiou ("N steps over B beats"). Status:
open. Lands in: #13.

**T3. The MIDI clock is a lossy grid, so quantising happens only when
lowering.** Witness: 24 ppqn gives 96 ticks to a 4/4 bar: a 16th step is 6 ticks
and a triplet 8th is 8. Counterexample: a quintuplet 16th, at 19.2 ticks. Test:
open (E5): which rhythms of a corpus fall off the 96 ticks of a bar. Source:
MIDI. Status: derived. Lands in: #27.

**T4. What is written and how it is played are separate, joined by performance
maps: time maps with exact inverses (swing, tempo), dynamics (a velocity from
the hit, the energy and a seeded looseness) and articulation (a played length
from a written one).** Witness: for time, `swingMap`, `swingOf` and `tempoMap`,
composed by `composeTimeMaps`. Expressive timing would be one more map, not new
syntax. For dynamics and articulation, `perform` (`perform.ts`): each part
writes `WrittenNote`s, a step, a note, a length in whole steps and, for a drum
hit, its role, and the band plays each through `perform`, which reads the rest
from the bar. A drum's accent comes from its role and step (the kick 112 on
steps 0 and 8 and 92 elsewhere, the ghost snare 32 + 14 × sync), scaled by the
energy and loosened by the swing; the bass and the lead accent the beat, but for
a lead note from a motif, written with its accent, which plays on the lead's
level (U4); the bass and the lead gate their lengths by the articulation, and a
stab sounds from 2.5 steps down to 0.45. Where two drum roles meet on a sound
and step, one hit is written, the stronger role's, so the join of F5 happens in
what is written. The split changed nothing that plays: every event of 5,760
bars, over every preset held, the tour and a gliding tour, came back byte for
byte. Written, no length falls off a quarter step; played, 91% of the bass's,
95% of the lead's and every stab's do (E9). Counterexample: a written position
that doesn't read back from its played time. The prototype's `swingDelay` and
`unswing` give one: they are off by up to 0.04 steps where both swing levels act
(swing 0.5–1). For dynamics and articulation, a written note that holds a played
value, or an event that is not its written note performed. Rounding the style a
bar is composed from to 3 decimals changes what plays in 180 of 320 bars of a
gliding tour, and what is written in 3 (E9). Test: `swing.test.ts`, "is undone
by its inverse, both ways, on and off the grid (T4, Q1b)" and "shows that the
prototype's delays are not what its unswing undoes (T4, Q1b)"; `tempo.test.ts`,
"keeps time rising through a tempo glide, and gives each position back from its
time (T4, Q1c)", and the four tests under "position and clock time" that cite
(T4, Q1c): tempo glides from rest between the axis ends and every preset tempo
at every length, 60 chains of retargets that carry their slope, brake or arrive
early, the chain through swing, and a reading of clock time that runs backwards.
`transport.test.ts`, "reads every onset back as its written position, through
the tempo and swing it was laid with (T4, Q1c)": every onset of a run through
four glides of tempo and swing, where the track inverted from the song's start
misses by more than a bar (#78). In the built app, `band.e2e.ts`, "swings a
swung preset into triplet 8ths (T4)": every onset in Chromium lies on a third of
a step, the triplet offbeat among them. For dynamics and articulation,
`perform.test.ts`, whose tests cite T4: every note the band writes is on the
grid with no velocity, every event is its written note performed, and the
prototype's accents and gates as literals; `events.test.ts`, whose tests of
`writtenProblems` cite T4; `drums.test.ts`, "write one hit where two roles meet
on a sound and step, the one that plays louder (F5, T4)"; `band.test.ts`, whose
test of its parts cites T4. Open: the text, #63's round trip. Source: time maps
(Jaffe, "Ensemble Timing in Computer Music", 1985; Honing, "From Time to Time",
2001), #37 step 2; the prototype ("the text holds what is composed, and the
compiler adds how it is played"); #63 step 2, E9. Status: measured (time);
measured (the port's dynamics and articulation); open (the text). Decided: the
prototype, inherited (score against performance, for time); #7, on measured
options (dynamics and articulation, E9). Lands in: #37 (done), Q1b and Q1c; #63
step 2.

**T5. Any bar renders from its environment (seed, position, style, plan) and
what it states.** Witness: the drums, a function of the bar's environment that
carries nothing; randomness keyed by seed, position and a named stream.
Counterexample: a bar that plays differently from the same environment and text.
The prototype's score gives 1,949 (S1). Test: `drums.test.ts`, "are a function
of the bar: the same environment plays the same bar (T5)"; `random.test.ts`, "is
a pure function of seed and keys (T5)"; `lead.test.ts`, "plays the same melody
on an engine whose Math.sin is one ulp off, either way (T5)": the lead's
contour, sin(π/6) times an odd span, lies one ulp from a half, so it is
quantised before it is rounded. Open for the pitched parts' carried state (S2).
Source: Strudel's query model, spirit. Status: measured (drums); measured,
failing (the prototype's score, E1). Lands in: #63 step 3, where the pitched
parts' carried state is S2's key frame.

**T6. A meter is a helix of pulses over the bar's eighths, and a grouping is a
mode of it.** Witness: `pulseHelix` (`meter.ts`),
`even(pulses, subdivisions, 0)`: simple, compound and additive meters in one
formula, with 7/8's 3+2+2, 2+2+3 and 2+3+2 the three modes of `even(3, 7)` and
`mirror` the retrograde. Every pulse spans 2 or 3 eighths exactly when
`2 · pulses ≤ subdivisions ≤ 3 · pulses`. The song's 4/4 is one meter: its
pulses composed onto 16 steps, two to an eighth, are `even(4, 16)`, the
transport's beats. Counterexample: a grouping into 2s and 3s that no mode of
`even` gives. 10/8 as 3+3+2+2 is the first, and 70 of the 149 groupings of up to
16 eighths are such; each is still a helix, written as heights, as the son clave
is among the rhythms. Test: `meter.test.ts`, whose tests under "as a helix" cite
T6, over every named meter and every pair up to 16. Open for the song: nothing
reads a meter but the metronome, and the transport's bar is 16 steps
(`transport.ts`, `% 16`). Source: #98, the metronome. Status: measured (the
named meters, their modes); measured, failing (every grouping, by `even` alone).
Lands in: #63 (a meter in the bar's header, beside T5's environment); #27 (the
transport's bar).

**T7. A tempo is a rate of the grid, and a pulse tempo exists only where the
pulses are equal.** Witness: `pulseLengths`: its lengths are equal exactly when
the pulses divide the eighths, over every well-formed pair up to 16. The engine
counts tempo per step (`tempoMap`, C2), so its `bpm` is a quarter of the step
rate, whatever the meter. The metronome counts a mean pulse rate
(`pulsesPerMinute`, `subdivisionSeconds`), which for 5/8 at 120 plays pulses of
0.6 and 0.4 s: no pulse is at 120, and the eighth changes speed when the meter
does. Counterexample: an additive meter with a pulse that plays at the written
tempo. Test: `meter.test.ts`, whose test of pulse tempo cites T7, over every
well-formed pair up to 16. A header's `bpm=` counts the grid, as the engine
does: quarter-note equivalents, a quarter of the step rate, defined for every
meter; a pulse rate is derived for display. Source: #98. Status: measured
(theory). Decided: #7, on measured options (the grid's rate, the pulse rate, a
rate with a unit). Lands in: #63; #27.

**T8. Once its clock is trusted, a client sounds each moment within its bound of
the host, half its best round trip give or take each output pair's bound, and
follows a jump of either device's output: its own within three ticks, the host's
with the next answer after.** Witness: three pairs of clocks, one estimator
(`clockPair`, `clock.ts`): each device's output against its page clock
(`outputClock`), read from the platform's pairing every tick to half a
millisecond, and the host's page clock against the client's (`hostClock`), read
from pings stamped with the page clocks, which never jump; the client plays by
the three composed (`skewOf`). Counterexample: a jump an output pair can't tell
from drift, one inside two of its bounds and its 1 ms (`OUTPUT.jumped`), which
it slews at a quarter of a millisecond a tick; and three blips of the pairing in
a row that agree. When the pings themselves were stamped with the heard moments,
a jump no wider than their ranges was slewed (a buffer over 5 ms legs held up to
20 ms left a client 10 ms out for 6 to 7 s), and a ping answered partway into a
drop hid one: the pings now never read a jump, and neither does. The pairing's
jitter was put at ±2.4 ms on every reading; measured in headless Chromium it is
within about 0.4 ms, with blips of up to 4 ms that the next reading takes back.
Test: `faults.test.ts` (`packages/session`), every fault of a client's clock,
alone and at once, each promise's checker shown firing on an output pair that
only slews, one off partway, and a network that plays by its latest ping;
`apps/web/src/session/session.test.ts`, a client following its own output at the
next tick and its host's at the next answer; and in Chromium, `session.e2e.ts`,
through a 40 ms hold of one page's audio. Source: #27, #90. Status: measured.

**T9. MIDI out and capture follow a dropped buffer within three readings.**
Witness: `clockOffset`, the device's output pair (`outputClock`), read once a
tick from the pairing or, where the platform has none, from `currentTime` less
the latency, a render quantum coarser, and never the two mixed. Counterexample:
the smoothing it replaced, nine parts old to one fresh, which took some 23
updates to come within a millisecond of a jump. Test: `clock-offset.test.ts`,
"follows a dropped buffer within three readings, again and again (T9)". Source:
#27. Status: measured.

### State

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
the lead differs in more than half. Source: T5, S1, #40's review, #37 step 5.
Status: measured, failing (prototype); measured (the port's carried state).
Lands in: #13.

### Change

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
ms). The band holds each section's plan for its eight bars, and decides a bar,
its plan and chords, when it composes the bar before, so what a part leads into
is what plays. Counterexample: a value read at two rates that disagree, such as
the prototype's tempo, which plays per step and is written once per bar (S1).
Once a value has been read at its rate, it holds: a change in the middle of a
beat re-swung the rest of that beat by up to 0.36 steps, so the transport keeps
a started beat's swing. Test: `band.test.ts`, "holds each section for its eight
bars (C3)" and "plays each section's plan and its theme's chords, each decided
when the bar before it is composed (C3)"; `tempo.test.ts`, "swings each beat by
the swing where the beat starts (C3)"; `transport.test.ts`, "keeps a beat’s
swing once the beat has started, whatever the style does next (C3)". Source:
Pd's control and signal rates, multirate signal processing, #37 step 3, #40's
review. Status: measured (port); open (the rates the IM writes). Lands in: #13.

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
(the key); measured (the Muse's offer). Open: whether style intents read the
same way (a glide is a target reached over time, C1), and how the IM writes a
wish. Lands in: #13, #25, #39, #79.

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
composed from (C7)", over the app's glides, the bars ahead included. Source:
E10, T5. Status: measured. Decided: #7, on measured options (E10). Lands in: #63
step 2 (the header).

### Pitch

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
31 and 53, against the line of fifths. Open: a line's pitch tokens (U2), once
the score reads them. Source: #28, the open threads (tunings other than 12), #7
round 3, E12. Status: measured (the numerals); open (a line's pitch tokens).
Decided: #7, on measured options (E12). Lands in: #63.

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

### Lowering

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
`perform.test.ts`, whose tests of lengths cite L2. Open: every note-on has its
note-off on the MIDI port (#5, Q1d). Source: MIDI (no durations), #37 step 3,
E9. Status: measured (the port's lengths); open (note-offs). Decided: #7, ahead
of the evidence. Lands in: #24, #63 step 2.

**L3. A renderer sees only its declared parameters and its event stream.**
Source: the prototype README, LADSPA. Status: derived.

**L4. Strudel is a target: the shared mini-notation behaves identically, and no
package depends on Strudel.** Witness: none on `main`. #11's survey ran the
prototype's mini-notation against `@strudel/mini`: sequence, `[ ]`, `@`, `*`,
`< >`, `,` and `~` agree; `: ? ! _ . / |` and Euclid differ. Strudel is
AGPL-3.0-or-later, so `@strudel/mini` may be a dev dependency for tests only, as
the conformance oracle, and no package imports it, as with tonal.
Counterexample: a pattern both read that plays differently. Test: open: a
conformance corpus against `@strudel/mini` (E3, #11). Source: #11. Status: open.
Decided: #11, ahead of the evidence (the oracle for tests only, a licence call).
Lands in: #63 step 4.

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
device, by the device's map from its sound.** Witness: `perform` (`perform.ts`),
which reads a `WrittenNote` and returns a `NoteEvent`: `part`, `step` and `note`
pass through unchanged, and `velocity` and `length` are what the claim names as
replaced, read from the bar (T4). For the drums, `DRUM_NOTES` gives every sound
its own General MIDI note, so a played note names its sound, and `MidiOut`
(`midi-out.ts`) maps each sound to the note the device plays it on: a Novation
Circuit's drum tracks answer only 60, 62, 64 and 65 (#106). Counterexample: a
field `perform` drops that names neither a replacement nor a pass-through. A
drum hit's role (`WrittenNote.role`) is one: `perform` reads it once, in
`accent`, to help decide the note's velocity, and then drops it, so nothing past
a `NoteEvent` — MIDI out, the built-in synth, or a display over played events,
such as the stage's per-member piano roll (#99) — can read which groove role a
drum hit plays. The same is true of a lead note's `accent` (U4). For the note:
two sounds on one General MIDI note, which MIDI out could not tell apart, or a
device's map applied anywhere before MIDI out. A device map that puts two sounds
on one pad, as the Circuit preset does with rim and snare, is lossy, and allowed
only there. Test: `perform.test.ts`, "drops a drum hit’s role on the way to a
NoteEvent (L7)" and "drops a lead note’s accent on the way to a NoteEvent (L7)";
`drums.test.ts`, "give every sound its own note, so a played drum note names its
sound (L7)"; `midi-out.test.ts`, whose test of the drum note map cites L7.
Source: PR #103's review, a per-member piano roll that can label a pitch but not
a role; #106, a Circuit Tracks that plays no General MIDI drum note. Status:
measured (every sound its own note, the device map in MIDI out); measured,
failing (role, accent). Decided: #7, ahead of the evidence. Lands in: #99 (a
drums member named by role, not raw pitch), #79 (a rhythm motif with roles,
which wants the same field kept past `perform`), #102 (the device's map).

### Readers and writers

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

### Surface

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
raises the seventh degree of a minor key for `vii`; U1 doesn't. Source: #7 (a),
E8, music21. Status: measured. Decided: #7, on measured options. Open: the
canonical numeral of a root off the key, written as the parallel major has it
and otherwise flat, which is ahead of the evidence until #63's round trip
measures it. Lands in: #63.

**U2. `b` and `#` alter a degree, and an absolute note is written in upper case,
so no pitch token is a note.** Witness: `parseNote`, which reads a letter only
in upper case: `b3` is no note, and `Bb4` is 70. Counterexample: a pitch token
that reads as a note. E8 finds 56 absolute notes in the prototype's scores, each
a flat its encoder couldn't write as `b3` or `b9`, because those read as the
notes B3 and B9 (#9). Test: `notes.test.ts`, whose test of a letter's case cites
U2: every token from 1 to 9, with `b`, `#`, `bb` or `##`, and `^` or `v`, is no
note. Source: #9, E8, R4. Status: measured. Decided: #7, on measured options.
Lands in: #63, where the score reads pitch tokens.

**U3. A line states its scale only where `chordScale`'s candidates imply none.**
Witness: `chordScale`'s candidates: the key, its parallel modes, the key a
dominant points to, then harmonic and melodic minor (P9, #56). The composer
writes no chord without a scale. Counterexample: a chord the candidates give a
scale for whose line still needs `scale=`, or one they give none for that the
text can't state. Test: open: #63's round trip over the port's chords, writing
`scale=` only where `chordScale` gives none. Source: #7 (b), P9. Status: open.
Decided: #7, on measured options. Lands in: #63.

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
the Muse judges each bar on its own, and a phrase played across a bar line comes
back as a motif per bar, each taking the place of the one before. Test:
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
`perform.test.ts`, whose tests of accents cite U4: a motif's note is written
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
`late` take one to the other. Source: #7 (d), Lewin's T and I, quintenzirkel's
operators, Strudel, the names round, E13. Status: measured. Decided: #7, on
measured options (E13, the names round). Lands in: #79, #63.

### Analysis and provenance

**A1. The round trip from the composer's events through the text and back is
exact.** Witness: the prototype's encoder and compiler. Counterexample: an event
missing, added or changed after the round trip. Test: the prototype's run over
about 6,000 events (`prototype/README.md`, "Tested"); no test in this repository
reruns it yet. E1 adds that it holds only warm. Source: prototype. Status:
measured (in the prototype). Lands in: #13, Q1a.

**A2. Every MIDI input has an IM, with an escape hatch where the grammar can't
say it.** Witness: the analyzer. Counterexample: one MIDI file. Test: open: the
analyzer's corpus, with gaps logged by frequency. Source: analyzer brief.
Status: open. Decided: the analyzer brief, inherited. Lands in: #3.

**A3. Every event carries its source, and inferred structure its confidence.**
Witness: the Muse's judgement (`muse.ts`): every note heard carries its source,
each source's bar is judged on its own and the judgement names it, and the band
takes the motif with the most notes, the first to arrive on a tie. In a session
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
name, and a name already in the session is refused. Open: confidence, which
nothing infers yet; the prototype's source with the most notes stands in for it.
A session makes it pressing: a player who plays 12 notes in every bar, the most
that isn't mashing, wins every bar, whoever else plays. Source: prototype, SDR
(the Muse's gate works like a squelch). Status: measured (the Muse's sources);
open (confidence). Decided: the prototype, inherited (provenance). Lands in: #3,
#25, #79, #16.

**A4. Following the players is a loop with a bandwidth.** Source: SDR (clock
recovery), the Muse's rate limit. Status: speculative. Lands in: #16, #25, #27,
#79 (following the style), Q7a.

**A5. A player's velocities are expressive, not metric: where a note falls in
the beat explains little of how loud it is played.** Witness: none yet.
Counterexample: played melodies loud on the beat and soft off it, as `perform`
plays the lead. Then the metric part is performance (T4), and an accent is
counted from `perform`, not from the player's level (U4). Test: open: over
performed melodies (POP909's, then the Muse's own captures once they are
logged), the share of each bar's velocity variance that the beat class explains.
Source: #84, #79. Status: open. Lands in: #3 (which loads POP909), #79.

### Composition

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
`lead.test.ts`, `muse.test.ts`, `clock.test.ts` and
`packages/engine/src/metronome.test.ts`, whose tests of the machine laws cite
F1. Source: #37 step 1. Status: measured. Decided: #37 step 1, in the working
track. Lands in: Q4a.

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
- events and text: `encode` and `compile` (A1), with the canonical texts as the
  fixed points of `encode ∘ compile`;
- sound and score: the analyzer run on Jambot's own output;
- a motif and what an operator makes of it: `canonicalOp` writes each result
  with one operator, a fixed point (U5).

Chained, a score, played and heard, writes itself: a quine. Counterexample: a
value that doesn't come back through a boundary. The prototype's swing gives one
(T4). Test: `swing.test.ts` and `tempo.test.ts`, as for T4 (time);
`motifs.test.ts`, whose test of the canonical operator cites F3 (motifs); open
for text (#13) and sound (#3). Source: #13, #37. Status: measured (time);
measured (motifs); open (text, sound). Lands in: Q1a–Q1e and Q3.

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

## Tensions

These are where the decisions are.

1. **Random access against musical memory** (T5, S1, S2, F2). Voice leading,
   motifs that return and themes are memory, and memory is state. Either a bar
   means its events and the text writes register in (S2), or a bar means a step
   on the carried state and a snapshot reaches any bar (F2), or memory becomes
   named, written objects (motifs and themes as named cells, an open thread). E1
   and #37 steps 3 and 5 narrow it: the drums carry nothing, the bass and the
   comp carry register alone, and the lead carries a phrase and its themes'
   melodies, which reach its rhythm and pitch (S2). So the third option is
   already how the lead works.
2. **Discrete tokens against continuous change** (R2, C1). Glides are
   trajectories; the text is tokens sampled per bar.
3. **Relative against absolute** (P1, A2). Baseband needs a lock, and messy MIDI
   may have none. How much of real MIDI falls to the escape hatch is the
   analyzer's measurement.
4. **Conformance against Jambot's own choices** (L4). Euclid already differs
   from Strudel by a rotation (#8).
5. **Exact time against the device grid** (T2, T3).
6. **The lead sheet against the token stream** (R1, R2). If they conflict, one
   meaning can have two surfaces.
7. **Twelve against any cycle** (P5, L1).
8. **Expressive against metric accents** (A5). Whether a player's velocities
   follow the beat decides whether accents are counted from a level, as taken
   now, or from `perform`.
9. **One bar of 16 steps against a meter per bar** (T6, T7). The theory holds
   every meter, and the song holds one: the transport, the Muse's grid and the
   HUD count a bar as 16 steps and a beat as 4.

## Semantics before surface

The constraints split into two kinds: about meaning (time, pitch, change, state)
and about the surface (R1–R3, L4's syntax). Every probe keeps the two apart:
mini-notation is a surface over Strudel's patterns, a Pd file is a surface over
a graph, MIDI bytes are a surface over events. So the order of work is the
meaning first, then the surfaces: the score text for people, tokens for models,
the Strudel export, the HUD. Whether these are one surface or several is open.

This is denotational design (Elliott, "Denotational Design with Type Class
Morphisms", 2009): say first what a score denotes, then require that every
operator means the same operation on the meanings. The meaning of a combination
is the combination of the meanings. Strudel shows why the combination has to be
named: combining two patterns can take its structure from the left, the right or
both (Tidal's `|+`, `+|` and `|+|`), and each is a different law.

## Candidates

Shapes for the meaning, not syntax. They are not exclusive.

- **Per-bar score text**, as in the prototype: satisfies A1, R1–R3; fails T5 and
  S2, in register and tempo only (E1).
- **Patterns as functions of time**, as in Strudel: a pattern is queried over a
  span and returns events. Satisfies T2 and T5 by construction; memory
  (tension 1) is the hard part.
- **A dataflow graph**, as in Pd: the band as a patch, messages at control rate,
  trajectories at signal rate. Fits C1 and C3, and the loop from players to Muse
  to composer and back.
- **Fourier coordinates**: sets and patterns as spectra, with the discrete
  theory as the points inside. Likely a space for distances and style, not a
  notation (P4).
- **Machines all the way down**, as in #37: every level, the compiler included,
  is a Mealy machine, and a score is a program for them. It fits F1–F3 and F7,
  and snapshots give random access. How legible such a score is (R1) is the open
  part.

## Nomenclature

The law of true names asks for words that do one job. Functional programming and
category theory have exact words for most of Jambot's shapes, each with laws
that can be tested. This table records them; it renames nothing in the code.

| In Jambot                                              | Name                                                  | What it brings                                    |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| a level (part, bar, section)                           | Mealy machine; a coalgebra                            | the laws of F1                                    |
| `env`                                                  | environment (the reader)                              | read, never carried                               |
| `carried`                                              | state                                                 | a snapshot is a resume point and a key frame (S2) |
| output events                                          | log (the writer); a monoid                            | parts side by side, bars in sequence (F5)         |
| a run over a script                                    | causal stream function                                | output n depends on inputs up to n                |
| a slower level's output as a faster level's `env`      | a hold: one value for many positions                  | the rates of C3                                   |
| the analyzer's summary of a bar                        | coarse-graining                                       | the inverse direction of a hold                   |
| players → Muse → composer → players                    | feedback (a trace), guarded by a delay                | F7                                                |
| `compile`, `encode`                                    | retraction and section                                | F3                                                |
| canonical text                                         | fixed point of `encode ∘ compile`                     | F3                                                |
| score → sound → score                                  | a quine                                               | F3                                                |
| helix, `compose`                                       | arrow and composition in a category                   | F6                                                |
| `shift`, `mirror`                                      | T and I, the dihedral group acting on helices         | transformational theory (Lewin, 1987)             |
| "layers refer upward"                                  | relative coordinates, the origin given from above     | F5                                                |
| quintenzirkel's `same transpose sequence invert retro` | identity, T, T on degrees, I, R (retrograde, on time) | a group acting on motifs; laws such as R∘R = id   |
| a glide                                                | a path in style space                                 | C1                                                |

## Strange loops

Each property here, with its test and status, is an entry in
[`quinetic.md`](quinetic.md) (#39).

Speculative. The prototype's "Quinetics parallels" keep self-reference, fixed
points and coarse-graining apart as analogies until something measures them. The
composition constraints turn parts of them into claims that can be tested:

- **Self-reference** is the feedback loop of F7. Whether it converges to a
  stable style or oscillates is A4, which the critic will measure.
- **Fixed points** are the canonical forms of F3: texts that the round trip
  gives back unchanged.
- **Coarse-graining** is the hierarchy of F1: each level holds its output for
  the level below, and the analyzer summarises upwards. The same machine type at
  every level is the law of recursion as a type.
- **A strange loop** in Hofstadter's sense (_Gödel, Escher, Bach_, 1979) moves
  through the levels of a hierarchy and arrives where it started. The Muse does
  that: the lowest level, notes played, changes the highest, the style that
  governs them.
- **Bach's _Canon per tonos_**, GEB's musical emblem, rises a tone with each
  round and arrives back in its key an octave higher. That is the helix itself:
  `shift` by 2 six times is `shift` by 12, the same positions one turn higher.

Still speculative: themes as fixed points that return, and whether the loop with
the players converges.

## Experiments

Each answers one entry, or one of #7's decisions. E1, E8 and E9 have run; the
others have not.

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
  - Shape bars: fitting the shape to the chords (a chord tone on the half bar
    and on a chord's start, an octave fold) changes 131 of 4,476 notes (2.9%),
    in 13.8% of bars. 37 bars have a note off the key.
  - Variation bars (927): 12.1% are the shape under an operator exactly, 61.7%
    but for their last note, which the phrase's close sets, 23.8% but for one
    other note (a nudge or a chord tone), 2.4% two notes or more off. Every one
    has an operator's rhythm. The operators are the shape itself, up to a
    `strans` (52%, the lift and the bent close), `mirror` (27%) and a `head`
    (18%). The lead never uses `rev` or `late`.
  - Phrases (457): 52% are a cell and an operator on it in every bar but for the
    close, 90% allowing one more note a bar. Written as a cell and a reference
    per bar, with a degree for each note an operator doesn't give, a phrase
    takes 52% of the tokens it takes as notes.
  - Symmetries: 10 of the lead's 132 shapes have one, so several operators give
    the same bar, and `canonicalOp` chooses which the score writes (U5).

#7's decisions are made: (a) to (c) as U1 to U3, (d) as U4 and U5, and (e) to
(h) as T4's performance maps, C7, L6 and P5.
