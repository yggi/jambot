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
ms and drops what a stall made it miss, walking the form through at most
`CATCH_UP` passed bars an advance, so an advance is bounded work however long
the stall: the walk costs some microseconds a bar, and walking a day's bars at
once outlasted the lookahead (#27). What arrives from another app is read by its
shape before anything is read from it (`readClientMessage`, and `admissible` for
what a judgement says), and the player takes what arrived before the transport
reads it, so nothing a client sends can stop the host's clock. Counterexample: a
stall after which events play late, or the grid moves; an advance whose work
grows with the stall; a message that throws on every tick after it arrives.
Test: `transport.test.ts`, "never waits: after a stall it drops what it missed
and keeps the grid where it was (T1)", "catches up after four hours’ stall a
bounded walk at a time: no advance passes more than CATCH_UP bars, and nothing
plays late (T1)" and "drops what only claims to be a judgement, and the clock
never waits for it (T1)"; `apps/web/src/session/session.test.ts`, whose test of
a garbled judgement cites T1: the host keeps playing, and says it dropped it. A
Muse that reads a judgement without checking its shape fails it. And
`faults.test.ts` (`packages/session`), which runs the transport on a clock with
each fault #27 lists: drift, a dropped buffer, the render quantum, stalls and a
client's clock stepping. Open for compiling: every text that parses compiles, in
bounded time. Source: spirit, #37 step 3. Status: measured (transport); open
(compile). Decided: spirit, inherited. Lands in: #13.

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
syntax. For dynamics and articulation, `perform` (`performer.ts`): each part
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
gliding tour, and what is written in 3 (E9). Test:
`packages/engine/src/swing.test.ts`, "is undone by its inverse, both ways, on
and off the grid (T4, Q1b)" and "shows that the prototype's delays are not what
its unswing undoes (T4, Q1b)"; `packages/engine/src/tempo.test.ts`, "keeps time
rising through a tempo glide, and gives each position back from its time (T4,
Q1c)", and the four tests under "position and clock time" that cite (T4, Q1c):
tempo glides from rest between the axis ends and every preset tempo at every
length, 60 chains of retargets that carry their slope, brake or arrive early,
the chain through swing, and a reading of clock time that runs backwards.
`transport.test.ts`, "reads every onset back as its written position, through
the tempo and swing it was laid with (T4, Q1c)": every onset of a run through
four glides of tempo and swing, where the track inverted from the song's start
misses by more than a bar (#78). In the built app, `band.e2e.ts`, "swings a
swung preset into triplet 8ths (T4)": every onset in Chromium lies on a third of
a step, the triplet offbeat among them. For dynamics and articulation,
`performer.test.ts`, whose tests cite T4: every note the band writes is on the
grid with no notation of its own, every dough note is its written note
performed, and the prototype's accents and gates as literals; `events.test.ts`,
whose tests of `writtenProblems` cite T4; `drums.test.ts`, "write one hit where
two roles meet on a sound and step, the one that plays louder (F5, T4)";
`band.test.ts`, whose test of its parts cites T4. Open: the text, #63's round
trip. Source: time maps (Jaffe, "Ensemble Timing in Computer Music", 1985;
Honing, "From Time to Time", 2001), #37 step 2; the prototype ("the text holds
what is composed, and the compiler adds how it is played"); #63 step 2, E9.
Status: measured (time); measured (the port's dynamics and articulation); open
(the text). Decided: the prototype, inherited (score against performance, for
time); #7, on measured options (dynamics and articulation, E9). Lands in: #37
(done), Q1b and Q1c; #63 step 2.

**T17. Every part's licence widens with the style's feel, from no looseness at 0 to a bounded width at 1: velocity either way, length only ever a little shorter.**
Witness: `licenceOf(style).feel` (`licence.ts`), 0.5 × swing + 0.3 × entropy + 0.2 × (1 − articulation), which reads `velocityLooseness` and `lengthLooseness` (`performer.ts`): one seeded draw per part and per field, added into `velocityOf`'s and `lengthOf`'s existing formulas, exactly as `drumVelocity` already did for drum velocity alone.
The genre sets the range, swing and articulation, and the players' entropy, which no preset sets, how much of it is used (#176).
The weights sum to 1, so the feel lies within 0 and 1; it is exactly 0 at swing 0, entropy 0 and articulation 1, and only there, and at any one entropy the presets run from Techno, the tightest, to Swing jazz, the loosest (at entropy 0.3: Techno 0.09, Synth-pop 0.18, Bossa nova 0.20, Funk 0.27, Deep house 0.31, Ambient 0.315, Lo-fi hip hop 0.445, Swing jazz 0.73).
The performer also draws its own accent (#170, `ownAccent`, `performer.ts`): a velocity delta from its bar and step, 0 at feel 0, as wide as the feel, and leaning as a player does: a ghost note up to 14 × feel softer on an off-beat 16th, a push up to 10 × feel louder on the off-beat 8th, a lean of 4 × feel either way on the beat.
It is added on top of the base and any written accent (T18), so a written accent is never lost, and the base's beat reading (`roleAccent`) stays the base's.
Velocity's width is ±12 × feel around the base and its accent, widened by the own accent to 26 × feel down and 22 × feel up; length's is a factor of 1 down to 1 − 0.15 × feel, so a gated length never grows.
Over every note of three seeds' 96-bar tours of the presets, entropy rising, every velocity and length lies within those bounds.
Counterexample: a part or a field whose spread stays 0 when the feel is above 0 (T4's dynamics and articulation would then still hold cold), a spread above 0 when it is 0, or a length that exceeds its base (the licence would then lengthen, not gate).
Keyed by bar and step only, never by the note's pitch, for every part but the drums: a bass or comp note resumed in another register must draw the same looseness as before it was resumed (S2), and only a drum hit's sound, not a register, is its identity.
Test: `performer.test.ts`, "gives every part a licence, velocity and length alike, that widens with the feel and holds still at 0 (#107, #147, T17)" and "draws its own accent within the licence: still at feel 0, wider as the feel rises, ghosts off the 16th and a push on the off-8th, in any register (#170, T17)"; `licence.test.ts`, whose tests of the feel cite T17: its range and its rise along each axis, the exact-zero corner, and the presets' order, over every preset at every tenth of entropy; `drums.test.ts`, "loosen their velocities from bar to bar as the feel rises, and not when held still (T17)"; `band.test.ts`, "carries register into the bass and the comp, but a phrase into the lead: what a resumed band loses (S2)", unbroken by this witness.
Source: #147 (T4's neighbour, which found only drums had one); #170, which leaves accent freedom to the performer; #176, which reads the width from the style's feel.
Status: measured.
Decided: owner, ahead of the evidence — every part, and timing as well as velocity, the way a real musician's and instrument's expression works, derived from the style, no new style axis (#107, #116 §7); the feel from swing, entropy and legato, with the presets' order as the measure of its weights (#176, #170).
Lands in: #147 (closes); #176.

**T18. A written accent is an offset on the base, not a replacement for it —
except a lead note from a motif, whose accent replaces the beat's own (U4,
already decided).** Witness: `velocityOf` (`performer.ts`): every part but the
lead adds `written.accent ?? 0` to `baseVelocityOf` (`dynamics.ts`, T19), before
the licence's looseness; the lead alone still reads `LEAD_LEVEL + accent` in
place of the base, since a motif's dynamics are its own, not an offset on a beat
it may not even land on. Counterexample: a stated accent that changes the base
itself (energy, beat, role) rather than only adding to its result; a part whose
accent the licence still jitters differently than it does without one. Test:
`performer.test.ts`, "adds every other part’s written accent on top of what it
would have played, never in place of it (#107)": every accent from −30 to 90,
every non-lead part and a drum hit, clamped to 1–127 exactly as `plain + accent`
would be; `events.test.ts`, whose `doughProblems`/`writtenProblems` tests now
take a whole accent on any part, not the lead alone. Source: the owner, on #107.
Status: measured. Decided: #107, ahead of the evidence. Lands in: whichever
composer, if any, first writes one for a part besides the lead.

**T19. The performer's own contribution to a note's velocity and length is only
its last draw, the licence; everything computed before it is the ensemble's
default, not the performer's, wherever it happens to be computed.** Witness:
`baseVelocityOf`/`baseLengthOf` (`dynamics.ts`), pulled out of `performer.ts` so
the base is named and owned apart from the performer's own hand: energy, beat,
drum role, a section's own read on a part and articulation's gate, none of it a
seeded draw. `velocityOf`/`lengthOf` (`performer.ts`) only ever add a written
accent (T18) and the licence (T17) on top of the base, the licence last, since
it alone is the performer's own. Counterexample: a base computed with a seeded
draw; a licence applied before an accent is read, so an accent could change what
the licence jitters rather than only its result; a change to the base's formula
that also has to reseed a licence stream. Test: `performer.test.ts`, "gives
every part a licence, velocity and length alike, that widens with the feel and
holds still at 0 (#107, #147, T17)" and "adds every other part’s written accent on
top of what it would have played, never in place of it (#107)", both unbroken by
pulling the base into `dynamics.ts`: no value changed, since the sum is the
same, only named in three parts instead of one. Source: the owner, correcting an
earlier framing that called the base "the performer's own reading" (#107).
Status: measured. Decided: #107, ahead of the evidence — extracted into its own
file for the law of true names; no change to any computed value. Lands in: #107,
#116 (which layer ends up computing the base is still open; `dynamics.ts` is
only where it lives today).

**T20. Velocity and length may be the end of a longer chain than base, accent
and licence: a global default, a style vector's own delta, and a composer's
deliberate dynamic marking at any level of the composition's hierarchy (song,
section, phrase, bar, note), each its own delta, before the note's own accent
and the performer's last humanizing draw.** Witness: none yet; today's `energy`
(`BarEnv.barEnergy`, `form.ts`) is the base's only style-driven term, one scalar
per bar folded straight into each part's formula, and `written.accent` the only
per-note delta a composer states — neither separates a global default from a
style delta, nor reaches above the bar. Counterexample: a dynamic marking stated
at a level `BarEnv` can't reach (a phrase, a section, the song); a style axis
whose contribution to the base isn't a delta on a default but folded into one
formula, the way `energy`'s scaling is today. Test: open — no decidable test
until the hierarchy of dynamic markings, if any, has a shape. Source: the owner,
illustrative, not a proposal to build (#107). Status: speculative. Lands in:
#107, #116, if ever taken up.

**T5. Any bar renders from its environment (seed, position, style, plan) and
what it states.** Witness: the drums, a function of the bar's environment that
carries nothing; randomness keyed by seed, position and a named stream.
Counterexample: a bar that plays differently from the same environment and text.
The prototype's score gives 1,949 (S1). Test: `drums.test.ts`, "are a function
of the bar: the same environment plays the same bar (T5)"; `random.test.ts`, "is
a pure function of seed and keys (T5)"; `lead.test.ts`, "plays the same melody
on an engine whose Math.sin is one ulp off, either way (T5)": the lead's
contour, sin(π/6) times an odd span, lies one ulp from a half, so it is
quantised before it is rounded; `seam.test.ts` (`packages/score`), whose test of
what a bar states cites T5: over 3,200 of the port's bars, the header and `harm`
state every field of the bar's plan and chords that its parts read, the section,
the key, the theme's kind, the style and each chord's step, slot and whether it
is raised, and `barInSection` and `barEnergy` follow from them. The theme's own
index is not stated, and the lead reads it to keep each theme's melody (S2).
Open for the pitched parts' carried state (S2). Source: Strudel's query model,
spirit. Status: measured (drums); measured (the header and harmony); measured,
failing (the prototype's score, E1). Lands in: #63 step 3, where the pitched
parts' carried state is S2's key frame.

**T6. A meter is a helix of pulses over the bar's eighths, and a grouping is a
mode of it.** Witness: `Meter` (`meter.ts`), which is a `Helix`: its cycle is
the bar's eighths and its heights where its pulses start. `METERS` names eight,
seven as `even(pulses, eighths)` (simple, compound and additive meters in one
formula) and 10/8's 3+3+2+2 by its heights. 7/8's 3+2+2, 2+2+3 and 2+3+2 are the
three modes of `even(3, 7)`, and `mirror` is the retrograde of every grouping. A
change of grouping is a key change on the time axis: `parallel` keeps the
downbeat and regroups, `relative` keeps the pulses and moves the downbeat, over
every grouping and each of its modes. Every pulse spans 2 or 3 eighths exactly
when `2 · pulses ≤ eighths ≤ 3 · pulses`. The song's 4/4 is one meter: its
pulses composed onto 16 steps, two to an eighth, are `even(4, 16)`, the
transport's beats. Counterexample: a grouping into 2s and 3s that no mode of
`even` gives. 10/8 as 3+3+2+2 is the first, and 70 of the 149 groupings of up to
16 eighths are such; each is still a helix, given by its heights, as the son
clave is among the rhythms. Test: `packages/theory/src/meter.test.ts`, whose
tests under "as a helix" cite T6, over every named meter and every grouping up
to 16. Open for the song: the transport's bar is 16 steps (T10), and the
metronome reads the song's meter from the steps the transport laid (#166).
Source: #98, the metronome; #105. Status:
measured (the named meters, their modes, every grouping as a helix); measured,
failing (every grouping, by `even` alone). Lands in: #63 (a meter in the bar's
header, beside T5's environment); #27 (the transport's bar).

**T7. A tempo is a rate of the grid, and a pulse tempo exists only where the
pulses are equal.** Witness: a meter's `gaps`, its pulses' lengths: they are
equal exactly when the pulses divide the eighths, over every well-formed pair up
to 16. The engine counts tempo per step (`tempoMap`, C2), so its `bpm` is a
quarter of the step rate, whatever the meter. A mean pulse
rate, which for 5/8 at 120 plays pulses of 0.6 and 0.4 s, is no pulse at 120,
and the eighth changes speed when the meter does. Counterexample: an additive meter with a pulse that plays at the
written tempo. Test: `packages/theory/src/meter.test.ts`, whose test of pulse
tempo cites T7, over every well-formed pair up to 16. A header's `bpm=` counts
the grid, as the engine does: quarter-note equivalents, a quarter of the step
rate, defined for every meter; a pulse rate is derived for display. Source: #98.
Status: measured (theory). Decided: #7, on measured options (the grid's rate,
the pulse rate, a rate with a unit). Lands in: #63; #27.

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

**T10. The song's clock is its meter's helix on the steps: the bar is a turn,
the step in the bar a position, and the beat a degree.** Witness: the helix's
own readings. For a meter composed onto the steps, two to an eighth
(`meterOnSteps`), `degreeBelow` gives the pulse a step falls in,
`Math.floor(pulse / k)` its bar and `wrap` its step in the bar, in every meter.
The song reads its clock this way and no other: `events.ts` holds its meter
(`SONG_METER`, 4/4) on the steps (`BEATS`), and `barAt`, `barStart`,
`stepInBar`, `beatAt`, `beatStart`, `beatInBar` and `onBeat` are its readings,
which every reader of bar and beat calls: the transport, the Muse's grid
(`BAR_STEPS`, a motif's cycle), the parts' loops over the bar, `perform`,
`PRESET_GLIDE`, swing's beat, the session's host and ear, the HUD and the piano
rolls. A score header that states no meter reads its bar the same way, from the
theory's 4/4 (`UNSTATED_METER`, `meterOnSteps`, in `packages/score`).
Counterexample: a reader of bar or beat whose result in 4/4 differs from the
helix's, or one that no helix reading writes. Test:
`packages/theory/src/meter.test.ts`, whose tests under "as the song’s clock"
cite T10: at every step of 128 bars, the 4/4 readings equal the literals
`Math.floor(step / 16)`, `step % 16` and `Math.floor(step % 16 / 4)`, and every
named meter's readings keep their laws, while the literals give 4/4's alone;
`events.test.ts`, whose tests under "the song’s clock" cite T10: the song's
readings are the literals at every quarter-step of 128 bars, and bars and beats
tile the song; `seam.test.ts` (`packages/score`), whose test of the meter cites
T10: a header that states no meter is in the song's. The rhythms the parts write
stay on the 16 steps, such as the backbeat on steps 4 and 12: they are content,
not readings (#123). MIDI clock's 6 ticks a step (T3) counts steps, not bars. A
key change keeps the cycle and a meter change need not, so a song whose meter
changes is a helix only between changes: open how bars of different lengths join
(#122, T14). Source: #7's tension 9; #105; #120. Status: measured (the readings,
every named meter; the readers, in 4/4). Lands in: #122 (a meter per bar); #63
(a meter in the header).

**T11. Swing never moves a pulse's start, and a 2-eighth pulse swings at the 8th
level wherever it stands in the meter.** Witness: `swingMap(swing, meter)` reads
its 8th level off the meter's own pulses (`meterOnSteps`), each swung on its own
start rather than a fixed 4-step modulus: a 2-eighth pulse gets the same
midpoint-late transform 4/4's beat always had, and any other pulse length passes
through unchanged (T16). The 16th level stays the fixed 2-step span it always
was, meter-free, so it shuffles inside every eighth regardless. Counterexample:
a pulse start that swing moves, at either level, or a 2-eighth pulse whose 8th
level doesn't move. Test: `packages/engine/src/swing.test.ts`, whose tests under
"swing over a meter" cite T11: every pulse of every named meter kept at every
swing sampled; a 2-eighth pulse's offbeat 8th onto the triplet at full swing, in
every meter that has one; the round trip, on and off the grid, over every named
meter; and 4/4's eighths landing on 12/8's third eighths, as before. Source:
#105, the ratchet run on the meter; #121, decided the easiest option to reverse.
Status: measured (every named meter, both levels). Decided: #121, on measured
options (kept the pulse-anchored 8th level, the direct generalisation of 4/4's,
over redesigning the level itself). Lands in: #27, where the transport learns a
meter (T10).

**T16. A pulse of more than two eighths plays straight at the 8th level until a
real performance says otherwise; its 16ths still swing.** Witness: `swingMap`'s
8th level passes any pulse but a 2-eighth one through unchanged, so 6/8, 7/8's
and 9/8's ternary pulses, and 12/8's, swing only at the 16th level; 5/8, 7/8 and
10/8's 2-eighth pulses still swing at both. Counterexample: a recording whose
feel needs a ternary pulse's 8th level to move, or a style for which a shared
axis, not a plain default, should decide it. #121's research (Polak's Jembe and
Mande fieldwork, Balkan aksak, Weede's drum-computer model, Roger Linn's MPC
swing) found no one ratio for a ternary or uneven pulse: each tradition keeps
its own, while every source agrees the 16th level is safe everywhere and the
beat (here, the pulse) itself stays put outside aksak. So straight is the
reversible default, not a measured feel: the harder choice, a ternary axis of
its own or a fold into swing as "rhythmic complexity", waits on real playing,
not generated data. Test: none yet; `packages/engine/src/swing.test.ts`'s "swing
over a meter" tests show the default holds and that its 16ths still shuffle, not
that straight is right. Source: #121, its research comment. Status: speculative.
Decided: #121, ahead of the evidence (the easiest option to reverse). Lands in:
#144, which measures a ternary feel against real playing and asks whether it is
performer expression, a style axis, or one with swing.

**T12. An onset off the meter is an altered degree of it only where the meter's
pulses are unequal.** Witness: the numerals' `b` and `#` move by
`chromaticStep`, a helix's larger step less its smaller (U1, U2, P5). On a meter
it is one eighth for every additive grouping, 7/8's 3+2+2 among them.
Counterexample: a meter whose alteration moves nothing. For every simple and
compound meter, and for the song's 4/4 on its 16 steps, the step is 0, so `b`
and `#` cannot write a syncopation; one step of the grid the meter is composed
onto would. In 12 notes to the cycle the two agree for the diatonic set: its
chromatic step is 1, the grid's own. On the steps rather than the eighths,
`chromaticStep` is never 1 (#125): 0 in the 13 groupings whose pulses are all as
long, 2, a whole eighth, in the 136 that aren't, so it can shift an additive
meter's onset by an eighth but never write a single 16th's syncopation off any
pulse, in any meter; one step of the grid always can, since it is the grid's own
unit by construction. Test: `packages/theory/src/meter.test.ts`, whose test of
an onset's alteration cites T12, over every grouping into 2s and 3s up to 16,
and "never moves an onset by one step through the chromatic step, in any
grouping, but one step of the grid always can (finite: every grouping into 2s
and 3s of up to 16 eighths) (#125)". Source: #7's "one token grammar for pitch
and rhythm", #105; #125. Status: measured, failing (every simple and compound
meter, at the eighth level); measured (the chromatic step is never a single grid
step, on any grouping). Open: whether the language takes one grid step as the
time tower's own alteration once it writes onsets at all (#63, #126) — #125
found no reason against it, only that it is not `chromaticStep`, unlike the
pitch tower, where `chromaticStep` is confirmed the musician's interval in every
cycle P5 names (`motifs.test.ts`, "gives the minor third the line of fifths
spells … (#125)"), so the two towers alter differently by necessity, not by an
unresolved choice: a pitch alteration means a tuning-dependent interval, a time
alteration only a position on the grid. Lands in: the language's next shape,
where pitch and time share one token grammar or don't (#126); tension 7; #125.

**T13. Over a link that keeps order, a bar reaches a client in time exactly when
the link holds it less than a beat.** Witness: a bar is composed a beat before
it starts (`COMPOSE_AHEAD`) and sent then, and a client takes it as it lays the
bar's first step (`followSource`), both within a lookahead, which cancels; what
misses is passed, never played late (T1). Over TCP, as a WebSocket's, a lost
message holds up every one behind it until it is sent again, after the
platform's recovery: some tens of milliseconds where a tail-loss probe fires,
200 ms at Linux's least retransmission timeout, 1 s at RFC 6298's. So a bar is
lacked only where a recovery, with the backoff of any loss again, outlasts a
beat: never below one beat's recovery, and at a 1 s recovery on 2% loss, 8% of
bars at 120 bpm and 12% at 180 (a model of the stream, not a network).
Counterexample: a bar held less than a beat and lacked, or held more and played.
Test: `packages/session/src/session.test.ts`, "lack a bar exactly where the
stream held it past a beat, at 60, 120 and 180 bpm (T13)" and "lack no bar in
two minutes where the stream recovers within 200 ms, the least Linux waits, over
2% loss (T13)"; composing half a beat ahead fails the first. Source: #27, #93.
Status: measured (the model). Open: each platform's recovery on a room's Wi-Fi,
which decides whether an unreliable channel is worth building (#93). Lands in:
#27, #93.

**T14. A song whose meter changes is a row of helices, each stretch of one meter
starting where the one before ends, at the running sum of its bars' lengths.**
Witness: `clockOf` (`events.ts`), a list of meter changes read as the song's
clock: its bar, step in the bar, beat and bar length, every stretch its meter on
the steps, two to an eighth. The song's own clock is its constant case
(`SONG_CLOCK`), so positions stay one number, the step from the song's start,
and the style track, tempo and capture keep reading them as they do (#122,
option A). Counterexample: a position read into a bar or beat that does not hold
it, a beat that straddles a bar line, or a bar whose beats are not its meter's
pulses. Test: `events.test.ts`, whose tests under "a song whose meter changes"
cite T14: 4/4 → 7/8 → 4/4 by hand, and every ordered pair of named meters at
every quarter-step, read into bars and beats and back, and each bar its own
meter's pulses. Open: nothing plays a meter change yet. The song reads
`SONG_CLOCK`, 21 readers use `BAR_STEPS` where a bar's own length would do, and
swing still moves pulses (T11). Source: #122. Status: measured (the clock).
Lands in: #122, the owner's choice between options A, B and C (#116 question
(l)).

**T15. A phrase is a motif on the cycle of its bars together, and the motif
operators are the same group on it.** Witness: `joinBars` and `splitBars`
(`motifs.ts`): bars in a row as one motif, and back. A bar reads round its own
cycle, so a rest runs on over a bar line as it runs round into its own start,
while a note held over a bar line is a tie that bars on their own cannot write:
such a phrase does not split, and a bar that begins inside its own last note
does not join. On a phrase, `strans` and `mirror` move each bar, `late` by a bar
turns them round, `rev` reverses their order and each bar, and a repeated bar is
a symmetry, `late` by a bar, which `canonicalOp` writes as no operator.
Counterexample: two bars that join and do not split back, an operator that moves
a phrase otherwise than its bars, or a law of the group that fails on a cycle of
whole bars. Test: `motifs.test.ts`, whose tests under "a phrase across bars"
cite T15, over every pair of 4-step bars with notes on degree 0 or ♭1, and every
operator of the 8-step cycle on a sample of phrases. The band writes nothing
across a bar line: every written note lies within its bar (L2), so a phrase
across bars comes only from a player, whom the Muse hears one bar at a time
(`BAR_STEPS`). Source: #124; #7, the Muse's open list (a phrase longer than a
bar). Status: measured (the operators on phrases). Lands in: #124, the Muse's
phrases; #39 (coarse-graining, the step → bar → phrase level).

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
(C3)"; `packages/engine/src/tempo.test.ts`, "swings each beat by the swing where
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
composed from (C7)", over the app's glides, the bars ahead included;
`score.test.ts` (`packages/score`), whose test of the style's grid cites C7:
every value on the grid, each unit axis's 1,001 and `bpm`'s 120,001, is written
and read back as itself, and a value off it is refused both ways.
`seam.test.ts`, whose test of the axes cites C7: the score's axes, their order
and its grid are the band's. Source: E10, T5. Status: measured. Decided: #7, on
measured options (E10). Lands in: #63 step 2 (the header).

**C8. A level below moves what the level above sets only within the licence it leaves, and never selects outright.**
Witness: `licenceOf(style)` (`licence.ts`), one function for the four licences the style leaves: the performer's feel at the note (T17 is this entry at the note), the tempo, which the players nudge by a ratio of the style's (`tempoNudgeWithin`), the key, which they move round the circle of fifths from the home, the key the plan is heading for (`intoReach`, `player.home`), and the melodic scale the lead walks over the key (`melodicWithin`, #209).
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
Status: measured (the key); measured (the Muse's memory of motifs); measured, failing (the tempo; the Muse's offer); open (the note, #204; the phrase, #207; the style, #195).
Open: whether a lean is always a centre or sometimes a draw; whether every level needs every arrow (the performer's fill is read by nobody); where each memory lives (S2); and whether a level needs a default of its own to return to (Q11).
Lands in: #210, #195, #204, #207, #16.

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
note. Source: #9, E8, R4. Status: measured. Decided: #7, on measured options.
Lands in: #63, where the score reads pitch tokens.

**U3. A line states its scale only where `chordScale`'s candidates imply none.**
Witness: `chordScale`'s candidates: the key, its parallel modes, the key a
dominant points to, then harmonic and melodic minor (P9, #56). The composer
writes no chord without a scale. Counterexample: a chord the candidates give a
scale for whose line still needs `scale=`, or one they give none for that the
text can't state. `chordScale` reads a chord as a stack of thirds, so five
qualities a numeral writes, `5`, `6`, `m6`, `sus2` and `sus4`, imply no scale on
any root of any diatonic key (0 of 84 each), and `augmented`, `mMaj7` and `dim7`
one in 7 of 84: a takeover's `Isus4` is such a chord. The score can't write
`scale=` yet, so `encodeBar` and `compileBar` refuse one. Test: `seam.test.ts`
(`packages/score`), whose test of `scale=` cites U3: every chord the band plays
over 3,200 bars implies a scale, so `harm` writes none; `score.test.ts`, whose
test of a chord with no scale cites U3: `Isus4` is refused both ways, and `I` is
not. Source: #7 (b), P9. Status: measured (the port's chords); open (a chord
with none, which needs `scale=`). Decided: #7, on measured options. Lands in:
#63.

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

**U6. A note and an onset are one token shape, a degree and an accidental,
differing only in the step an accidental moves by.** Witness: `alteredHeight`
(`numerals.ts`) writes a pitch token,
`heightOf(scale, degree) + accidental * step`, with `step` the key's chromatic
step (P5); `onsetToken`/`onsetHeight` (`meter.ts`, #125) write a time token the
same way, with `step` fixed to one grid step, since the bar's eighths are always
evenly spaced and need no key's unevenness to alter (#125). Both take a degree
and an accidental in {−1, 0, 1} (time's is only 0 or 1, never below its own
eighth); neither is a slot sequence with rests, the way the port's rhythm is
written today. Over the band's own output (E14, #126), every bass and lead note
has a pitch token (19,091 of 19,091: `chordScale` always gives a scale and
`alteredDegree` always finds a single accidental for what the composer plays)
and every onset round-trips through the time token exactly (82,984 of 82,984).
Written this way instead of on the 16-step grid, a bar's rhythm lines take 76.6%
fewer tokens (67,890 against 289,728, over 18,108 lines): more than E15's 43.6%,
since E15 kept a slot sequence at a coarser resolution while this drops the
rests a token stream never needs, the way a pitch line already doesn't write
them. Counterexample: a note or onset neither token reaches, or a case the time
token needs a special rule for that the pitch token doesn't. None found over the
corpus; #126's open list is where one would be filed. Test:
`packages/engine/experiments/tokengrammar.ts` (E14), printed, not asserted: the
corpus is generated, not a fixed suite (#121's caution about generated data
applies here too). `packages/theory/src/meter.test.ts`, "is alteredHeight/a
generic alteredDegree on the eighths, with one grid step and no parallel-major
search, since the eighths are always evenly spaced and never need one (#125,
#126)" holds the shape itself as a real test. Source: #7's original speculation
(a scale and a rhythm as one object), #116 §6, #125, #126 (E14). Status:
measured (the shape, and full coverage over the generated corpus); open (a real
captured corpus, R1's musician's read, and whether the score adopts it — #63's
call). Lands in: #63, #126.

### Analysis and provenance

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
9. **One bar of 16 steps against a meter per bar** (T6, T7, T10, T11, T14). The
   theory holds every meter as a helix, and the song holds one, 4/4, read
   through its helix by every reader of bar and beat (T10), so a meter other
   than 4/4 changes them all at once. A key change keeps the cycle and a meter
   change need not: a song of changing meters reads as a row of helices joined
   at the running sums of their bars (T14), but nothing plays one yet, and swing
   still moves the pulses of every other meter (T11).

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
| a default and the licence it leaves                    | a bound; a hold with a tolerance                      | C8                                                |
| the harmonic history, folded bar by bar                | a fading memory; an exponential moving average        | a time constant, 1 / (1 − decay) (C9, A4)         |
| the history's centre, `centre`                         | the memory's mode (an argmax): a lean                 | C9                                                |
| the band's own drift, `bandWish`                       | a draw by weight to a power: a lean                   | the centre as its limit (C9)                      |
| hold, fill, read, remember, lean                       | the homeostat (Ashby); a viable system (Beer)         | C9, Q11                                           |
| "I got what you did there"                             | recognition: a remembered pattern and its operator    | the quine at every level (Q12)                    |

## Strange loops

Each property here, with its test and status, is an entry in
[`quinetic.md`](quinetic.md) (#39).

Speculative. The prototype's "Quinetics parallels" keep self-reference, fixed
points and coarse-graining apart as analogies until something measures them. The
composition constraints turn parts of them into claims that can be tested:

- **Self-reference** is the feedback loop of F7. Whether it converges to a
  stable style or oscillates is A4, which the critic will measure.
- **The loop at every level** (#210) holds a default and a licence, reads the fill back up, remembers it fading, and leans the default toward the memory (C9).
  The key runs all five, and its bandwidth is A4's first measurement (E19).
  Left alone, it strays and has no planned cycle to bring it home, as the harmony within a key has (Q11).
- **Recognition**, "I got what you did there", is the quine at every level: a level hears a pattern from its memory under an operator, and what it answers, heard again, gives them back (Q12).
  Memory and recognition together are the shape the loop shares with the score's round trip: the key, the motif and the scale already have it, the Muse and the performers not yet.
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

Still speculative: whether the loop with the players converges on a style (A4 for the style, Q7b).
Themes as fixed points that return are measured (Q8).

## Experiments

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

- **E14. One token grammar for pitch and time** (U6; #7, #116 §6, #125, #126),
  in
  [`packages/engine/experiments/tokengrammar.ts`](../packages/engine/experiments/tokengrammar.ts)
  (about 1 s), over E1's shape. It writes every bass and lead note as a pitch
  token (`alteredHeight`/`alteredDegree` over the bar's chord's implied scale)
  and every onset as a time token (`onsetToken`/`onsetHeight`, one grid step,
  #125), the same degree-and-accidental shape either way.
  - Every one of 19,091 bass and lead notes has a pitch token: `chordScale`
    always gives a scale and `alteredDegree` always finds it in one accidental,
    over the corpus.
  - Every one of 82,984 onsets round-trips through the time token exactly.
  - Rhythm written as time tokens instead of the 16-step grid takes 76.6% fewer
    tokens (67,890 against 289,728, over 18,108 lines): more than E15's 43.6%,
    since a token stream drops the rests a slot sequence still writes.
  - No case needed a rule the other tower doesn't have, over this corpus. Not
    yet measured: a real captured corpus rather than the engine's own, and
    whether a musician reads it as a lead sheet (R1).

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
  (about 50 s with its variants; its test, a sample, about 4 s): the Muse hears the band's own lead as she hears a player, and her offer goes back into the band with F7's delay, so what she hears in bar k plays from bar k + 2.
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
  - Not measured: weights for the band's voices beside the players', since no players play here; and the style's distance over time, which needs the critic (#15).

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
  - Not measured: `swing` and `bpm` (the clock's, and `estimateSwing`'s in played time), `harm` (needs the chords, not read from notes yet), per-part readings (step 4), and the real music the analyzer will read.

#7's decisions are made: (a) to (c) as U1 to U3, (d) as U4 and U5, and (e) to
(h) as T4's performance maps, C7, L6 and P5.
