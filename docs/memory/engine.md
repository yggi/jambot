# The engine

Facts about `packages/engine`: its levels, the band, the Muse, the style and the time maps.
The pointers to what holds each are in the sentences.

- An engine level is a `Machine` (`packages/engine/src/machine.ts`).
  A new one gets a test that `lawBreaks(machine, script)` is empty, and the events it writes a test that `eventProblems` finds none.
- A random choice in the engine goes through `chance(draw, p)` or `pick(draw, weights)`, never a bare `draw < p`: they quantise to 2^-16, so a last-bit difference from `Math.pow` or `Math.sin` on another engine does not change the music.
  A value from them that is rounded is quantised first, `Math.round(quantize(x))`: sin(π/6) times an odd number lies one ulp from a half (`lead.ts`).
- The style (`packages/engine/src/style.ts`) is a track of glides, one per axis, and `styleAt(track, position)` reads it at any step of the song.
  Positions there are steps from the song's start, 16 to a bar.
  A track holds only the latest glide per axis, and before that glide's start it reads the glide's `from`.
  So to see what was played at a step, read the track as it stood when that step was scheduled, not the final track.
- The engine's levels are machines at their own rates: the section plan (form, key and theme) per section, the band per bar, the transport per tick.
  The players' key wish is a standing target, not an event: `nextKey` applied twice gives what it gave once, so the band can read it at every section boundary.
  Where the players wish for no tonic and the mode playing, the band moves the key itself (`bandWish`, `plan.ts`, #169): `harmonicReach` (6 × `harm`, rounded) gives how many fifths, the entropy how readily (`KEY_JUMP` × entropy a section), and the harmonic history where to.
  The history (`history.ts`) folds each decided bar's chords, not its notes, so `lookAhead` and a passed bar fold exactly what then plays; the band carries it (`BandCarried.history`) and hands it to the planner at a section's boundary.
  The history is a fading memory (`fading.ts`, C9), and both of its leans are there: its centre, where the band has been, and the band's draw, by weight to the fourth power.
  Nothing hardcodes a return, and nothing makes one: the draw goes back to the key it left in a fifth to a quarter of jumps, and left alone the key ends anywhere round the circle within about 32 sections (E19, Q11).
  The wish also names a melodic scale for the lead (`KeyWish.melodic`, #209), which the plan takes at a section's boundary as it takes the key: the wish's where `licenceOf(style).melodic` reaches it, else `melodicDefault(style)` (`Plan.melodic`).
  It stands once met, as the mode does; the harmony, the themes, the numerals and the Muse keep the key's seven degrees, and only the lead's own phrases walk `melodicHelix(key, scale)`, through `phraseParams`' `scale`.
  A tonic wished for lets go once the band plans it (`released`, applied by the player), so the drift resumes from there.
  The web player only reads the audio clock and plays what the transport schedules, so everything that decides what and when is tested without a browser.
- The band decides each bar when it composes the bar before: the section's plan at a section's first bar, and the bar's chords.
  So a part can lead into the next bar's chords (`BarEnv.next`), and they are what plays.
  A bar the clock has passed is passed (`passBar`), not composed.
- A song starts and ends in the engine (`ending.ts`, `transport.ts`).
  The count-in is one bar of the song's beats before its first step, at the tempo the song opens at (`countIn`, `countInSeconds`): the player lays the clicks and starts the transport's clock a bar later, and a transport whose source is asked bars ahead composes bar 0 at once, so a host can send it during the count-in.
  A song ends on request (`finish` in the transport's input): the band composes `finaleBar` in place of the next bar it would, the transport schedules through it and no further, and `Finale.ended` says when it ended on the clock; a client is told the last bar (`ends`) and does the same.
  The final bar is written as any bar is (`finale`): the dominant seventh for two beats, then everything lands on the tonic on the third, the pad and bass held on for `RING_STEPS` past the bar, so the ending is a cadence, not a draw.
  It is decided as any bar is, so the section, key and history move on from it and a forecast from the state it leaves still runs.
- `lookAhead(carried, envAt, count)` forecasts the bars ahead, their plans and chords, by running the band's own decisions forward.
  From the transport, `forecast(env, carried, count)` gives the bars from the head's bar on, those composed first, each with the energy it plays at; with `carried` null it is the song from bar 0.
  The track holds glides ahead, so the forecast is what plays unless a control moves.
- The parts are machines at bar rate over one `BarEnv`, and `BandBar` is that environment plus the events and the bar's `sound`.
  `BarEnv.meter` is the meter the bar is in, whose steps it has (`stepsOf`, from `@jambot/theory`): the band gives the song's 4/4, and no part reads it yet, since each still writes 16 steps (#260, decision (k)); a test that builds a `BarEnv` by hand gives `meter: SONG_METER`.
  The drums read it (#260, slice 2): a bar's steps are `stepsOf(meter)`, the straight kick takes its weights from the accent tree (`accentsOf`: the downbeat, the half, the pulses), the snare's backbeat is `backbeatOf` (every pulse after the downbeat of two or three, the odd ones from four), and the two tables written on 4/4's 16 steps, the syncopated kick and the ghosts, are read by the rule in another meter (`regroup.ts`, `readOnMeter`: `cycle`, the default, which runs the pattern's four pulses through the bars and keeps the downbeat, or `fold`, the safe reading).
  4/4 was kept bar for bar by a gate recorded before the port (`docs/memory/testing.md`), and each part's test states its 4/4 literals; in any meter a hit lands on a step the bar has (`writtenProblems(hit, steps)`).
  The fold loses a hit where two land on one step and the stronger stays; in a bar of two pulses the cycle only reaches the pattern's odd pulses.
  Heard against each other, the owner preferred the cycle, most for the Funk drums in 5/4.
  The bass and the comp are on the meter too (#260, slice 3): their patterns are `patternsOn` (the root, the eighths and the walk from the grades and the pulses, the pump on the eighth after each pulse, the funk line and the syncopated stabs read by the same rule as the drums' tables) and a theme's chord slots, 0 and the bar's half, are read on the meter (`chordsOn`, `halfOf`).
  The lead, the dynamics, the style reading, the Muse, the phrase reader and the ending are on the meter too (#260, slice 4).
  The lead's groove is `straightGroove(meter)` from the accent tree and its syncopated groove is read by the cycle; a motif of any cycle is held in every meter and read by `motifInBar`: a window of the bar's steps over the motif repeated from its start, advancing by the bar's steps each bar, so 4/4 with a 16-step motif is unchanged.
  A theme's slot step is scaled by `slotStepOn`, which keeps its parity so an odd slot stays on a sixteenth.
  The dynamics' accents, the style and voice readers (`readStyle`, `readVoice`, given a meter) and the ending (`finale` lands at `slotStepOn(meter, LANDING)`, the count-in clicks once per pulse) follow `BarEnv.meter`.
  The Muse and the phrase readers take a `SongClock` (default `SONG_CLOCK`) for where bars fall, and a judged motif's cycle is the clock's `barSteps`; `BAR_LENGTHS` admits only the steps of a named meter's bar (10, 12, 14, 16, 18, 20, 24).
  A section has a meter (#261): the plan holds it (`Plan.meter`) beside the key, taken at the section boundary from the meter asked for (`BandEnv.meter`, `TransportEnv.meter`, 4/4 where none is), and a bar's `BarEnv.meter` is its plan's.
  The transport lays the bars on the song's clock as far as they are composed: it carries where the meter changes (`TransportCarried.meters`, the first at bar 0) and reads bars and beats from `clockOf` of them (`clockOfTransport`), learning a bar's meter as it composes or passes it (`BarSource.meterOf` gives it before a bar is composed, so a stall can pass a bar of another meter by its length).
  A bar is composed when the head is within `ahead` steps of where it starts (`barStart(nextBar) <= head + ahead`), which needs only the meters of the bars before it.
  Swing is read off the clock's beats (`swingOf(track, clock)`, `swingMapAt`): a step keeps the start and length of its pulse (`ScheduledStep.pulse`), which `writtenAt` undoes its swing over.
  A note that runs into a bar not yet composed ends by the meter before it, which only moves its end where the swing does.
  `lookAhead`, `forecast` and `foresight` read each bar's environment from the clock of the bars before it, so a preview across a change is what plays.
  The protocol is 8: the meter travels in the bar's plan, and the client gives it back to the bar (`follow.ts`).
  The metronome clicks the pulses of the clock it is given (`clicksOf(steps, clock, subdivision)`, the eighths or sixteenths only where asked), and swings each by its own pulse; `PRESET_GLIDE` (a number of steps, not bars) and the web readers still run on the song's 4/4 clock, until the web reads the transport's (#262).
  The drums carry nothing; the bass its last note, the comp its last voicing, the lead its last note, its phrase and its themes' melodies (`BandCarried.parts`).
  A passed bar leaves the parts where they were, and only the lead's memory reaches more than register (S2); the band's harmonic history is the plan's, not a part's.
  The Muse judges each source's bar into a `Motif` (U4, `judgeBar` in `muse.ts`): onsets with rests, where a note was released before the next, and degrees of the key altered by `b` or `#`, written as a numeral writes a root off the key.
  The `muse` machine carries what it offers (an `Offer`: the motif, its source, the bar heard) and the last bar anyone played; its output is the log.
  The offer enters the band as its environment (`BandEnv.offer`, then `BarEnv.offer`), a standing target like the key wish, and the lead plays it whole while it stands, even where it would rest.
  The transport carries the Muse's state (`listening`) and judges bar k as it composes bar k + 2 (`LISTEN_DELAY`); a test that builds a `BandEnv` or `BarEnv` by hand gives `offer: null`.
  A motif's accents are counted from the player's level in the bar, which the judgement and the offer carry beside it as the style reading, and a motif note plays at the band's level plus its accent (U4): the lead writes it on the note (`WrittenNote.accent`), and `perform` plays it on `LEAD_LEVEL`.
- `style-reading.ts` is the critic's reading (#15): `readStyle(dough)` reads a bar's `density`, `sync` and `artic` from its sounding notes, and `readTiming(steps, onsets)` its `bpm` and `swing` from the clock, by rule.
  A reading is raw and an axis with nothing to read is absent; how far each lies from the style that wrote the bar is step 2's measurement, and swing stays `estimateSwing`'s, in played time.
- `genre.ts` (#15, step 3): `genreOf(readingAxes({ ...readStyle(dough), ...readTiming(steps, onsets) }))` is a softmax over the distances from a reading to landmarks, by default the presets' points (`PRESET_LANDMARKS`).
  A reading has `energy`, `sync`, `artic`, `swing`, `bpm` and `harm`, so the distance is a root mean square over those, and E24 finds it lands a bar as its own preset in 0.64 to 0.80 of bars.
- `chord-reading.ts` (#15): `readChords(dough)` reads a root and quality per half bar from the pad and stab (the bass settles the root), and `readHarm` the `harm` of them; E25 finds it right wherever it reads and `harm` rising with the axis (tau 0.77) but short of it.
- `part-reading.ts` (#15, step 4): `readVoice(voice, dough)` reads one of four voices (drums, bass, comp, lead) alone, and `partDistance` its distance from where the voice reads at a style; E26 finds the bass says most of the style and the drums least, and a drum fill barely farther from the style than the drums' usual bar.
- The Muse is two functions and a machine over their results: `judgeBar` judges one source's bar, `taken` takes one motif of all the bar's judgements, and `muse` carries the offer.
  `reading.ts` is the one reader of onsets, shared with the analyzer (#204): `readOnsets` finds the swing (or is given it, as the Muse is, since the transport has already un-swung what she hears) and rounds.
  `phrase.ts` reads a phrase as the Muse will: `phrasesOf` cuts the notes heard at a silence of a bar less a step, `readPhrase` finds the phrase's offset, puts its first onset on the beat where the odds say so and reads each release as articulation or a plausible rest (`REST_VALUES`, `REST_MARGIN`), and snaps the onsets to the note value of the phrase (`lattice.ts`: a half, quarter, eighth or sixteenth, on the bar's own places, by the least cost of place and distance, `MERGE_LIMIT`); `readHeard` does all of it for every phrase.
  `heardInBar` is what the Muse hears of a bar, and `judgeBar` judges it, and the tracks grid's player lanes (`playedIn`, #206) show it, so a lane and the Muse never disagree: a source's notes up to the end of the bar, as phrases (`Reading` 'phrases', the default; 'nearest' is the prototype's rounding to `heardStep`, kept as the baseline), so a bar is judged by its phrase so far and never by a later bar (F7).
  `keptAfter` says what to keep once a bar is judged: the later bars' notes and each source's running phrase, up to `PHRASE_MEMORY` bars; the transport and a client's ear both use it.
  A motif's judgement carries `confidence` (hundredths, 0 to 1: the mean margin of the bar's notes from the places they were read on), and `taken` takes a motif heard before first, and a confirmed offer holds across bars against a motif heard once while she remembers it (#204 H8, Q12), then the surest reading, then the most notes (E17); adding the confidence bumped `PROTOCOL` to 4, the log's `recognised` to 5, and the Muse's memory travelling with her state (`Remembered`, `asOf`, `lastPlayed`) to 6; `memoryAt` fades it to a later bar, as her own next bar would.
  `packages/engine/experiments/humanise.ts` plays a pattern as a hand would, from one sloppiness in ms, and measures any reader over 890 bars, or 3,600 in phrases, against it; E17 records how the rounding does (69% right at 20 ms, 27% at 30, mostly lost to rests nobody meant) and how the reading of phrases does (85% and 46%).
  In a session the same split runs across apps: a client's ear (`earListen`) judges its players' bars and sends the judgements; the host's transport checks each (`admissible`: the gates a motif carries, in the bar's key, and first its shape, since it arrives as JSON) and drops, and logs, one that is late, ahead or inadmissible.
  `Motif`, `Judgement` and the bars travel as they are, so a change to their shape bumps `PROTOCOL` (`protocol.test.ts` fails until it does).
  A host reads each client message by its fields (`readClientMessage`) and refuses a name already in the session, in any case; a client reads its host's by kind alone.
  The player takes what arrived before the transport reads it, so an input it can't read costs one tick, not the song.
- A chord is the theory's `Chord`, a helix plus tensions (#38), in the key's register.
  `joinChord` gives its stack, and `chordScale` takes a stack.
  A bar's chords come from its theme's slots (`barChords`); their colour draws are keyed by theme, bar and slot, so a test that wants a rate must vary the seed or the theme, not the key.
- Swing is a time map, `swingMap(swing)`, with `played` and `written` as exact inverses.
  It is `leanMap` over the swing axis's two levels: a lean per level, signed, 0 straight, 1 the triplet, 1.5 the dotted figure, negative the offbeat early (`shareOfLean` reads a lean as the share of its span the first half holds, 50 % straight).
  The axis itself, a style's, never leans early; the metronome screen takes the two levels directly.
  The transport plays through it, and player input reads back through `written`.
- A moment on the clock reads back onto the grid through the steps the transport laid (`writtenAt`), never through the style track: the track holds only its latest glide per axis, so inverting it from the song's start put a note 18 bars early after two tempo changes (#78).
  Each `ScheduledStep` carries the swing its beat was held at for this.
  A played note is placed at the moment that was being heard as it was played, kept exact; rounding it is the Muse's (#79).
  `clockOffset` gives that moment on both its paths, so nothing else takes the latency off again: in Chromium the heard moment lags `currentTime` by about the output latency.
  It is the device's one heard clock: MIDI out, capture, the HUD, a client's ear (`Output.heard`) and a session all read it, and `bandOutput` reads the clocks for it once a tick.
