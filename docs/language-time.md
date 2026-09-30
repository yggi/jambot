# Language: time

The catalogue of the time tower: the clock, the grid, the meter, swing and how written time becomes played time.
The frame, the method and the tensions are in [`language.md`](language.md); the experiments are in [`language-experiments.md`](language-experiments.md).

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
until the hierarchy of dynamic markings, if any, has a shape. The style axes' wish (C10) is the same shape one level up: a default, and each player's displacement on it, within a licence. Source: the owner,
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
The bass's and the comp's carried state is a pin in the frame (#263, #264), and a
stab that leads into the next bar's chord states it in a `next` line, in that
bar's own key, which `seam.test.ts` shows is another chord in this bar's key
over a key change; open for the lead's (S2). Source: Strudel's query model,
spirit. Status: measured (drums); measured (the header and harmony); measured,
failing (the prototype's score, E1). Decided: #63, ahead of the evidence (the
bar states the next chord; reading the next header instead changes no note a bar
writes, so this is the option easiest to reverse). Lands in: #63 step 3, where
the pitched parts' carried state is S2's key frame.

**T6. A meter is a helix of pulses over the bar's eighths, and a grouping is a
mode of it.** Witness: `Meter` (`meter.ts`), which is a `Helix`: its cycle is
the bar's eighths and its heights where its pulses start. `METERS` names nine,
eight as `even(pulses, eighths)` (simple, compound and additive meters in one
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
step, on any grouping). Open: nothing in the language: the score writes onsets
as plain steps of the bar (U6), so the time tower carries no alteration there.
#125 measured that an alteration of time would be one grid step, and not
`chromaticStep`, unlike the pitch tower, where `chromaticStep` is confirmed the musician's interval in every
cycle P5 names (`motifs.test.ts`, "gives the minor third the line of fifths
spells … (#125)"), so the two towers alter differently by necessity, not by an
unresolved choice: a pitch alteration means a tuning-dependent interval, a time
alteration only a position on the grid. Lands in: U6, where pitch and time
share one shape, a plain integer on each cycle (#126, #263); tension 7; #125.

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
