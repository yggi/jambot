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
- `lookAhead(carried, envAt, count)` forecasts the bars ahead, their plans and chords, by running the band's own decisions forward.
  From the transport, `forecast(env, carried, count)` gives the bars from the head's bar on, those composed first, each with the energy it plays at; with `carried` null it is the song from bar 0.
  The track holds glides ahead, so the forecast is what plays unless a control moves.
- The parts are machines at bar rate over one `BarEnv`, and `BandBar` is that environment plus the events and the bar's `sound`.
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
- The Muse is two functions and a machine over their results: `judgeBar` judges one source's bar, `taken` takes one motif of all the bar's judgements, and `muse` carries the offer.
  `reading.ts` is the one reader of onsets, shared with the analyzer (#204): `readOnsets` finds the swing (or is given it, as the Muse is, since the transport has already un-swung what she hears) and rounds.
  `phrase.ts` reads a phrase as the Muse will: `phrasesOf` cuts the notes heard at a silence of a bar less a step, `readPhrase` finds the phrase's offset, puts its first onset on the beat where the odds say so and reads each release as articulation or a plausible rest (`REST_VALUES`, `REST_MARGIN`), and snaps the onsets to the note value of the phrase (`lattice.ts`: a half, quarter, eighth or sixteenth, on the bar's own places, by the least cost of place and distance, `MERGE_LIMIT`); `readHeard` does all of it for every phrase.
  `heardInBar` is what the Muse hears of a bar, and `judgeBar` judges it, and the tracks grid's player lanes (`playedIn`, #206) show it, so a lane and the Muse never disagree: a source's notes up to the end of the bar, as phrases (`Reading` 'phrases', the default; 'nearest' is the prototype's rounding to `heardStep`, kept as the baseline), so a bar is judged by its phrase so far and never by a later bar (F7).
  `keptAfter` says what to keep once a bar is judged: the later bars' notes and each source's running phrase, up to `PHRASE_MEMORY` bars; the transport and a client's ear both use it.
  A motif's judgement carries `confidence` (hundredths, 0 to 1: the mean margin of the bar's notes from the places they were read on), and `taken` takes a motif heard before first, and a confirmed offer holds across bars against a motif heard once while she remembers it (#204 H8, Q12), then the surest reading, then the most notes (E17); adding the confidence bumped `PROTOCOL` to 4, and the log's `recognised` to 5.
  `packages/engine/experiments/humanise.ts` plays a pattern as a hand would, from one sloppiness in ms, and measures any reader over 890 bars, or 3,600 in phrases, against it; E17 records how the rounding does (69% right at 20 ms, 27% at 30, mostly lost to rests nobody meant) and how the reading of phrases does (85% and 46%).
  In a session the same split runs across apps: a client's ear (`earListen`) judges its players' bars and sends the judgements; the host's transport checks each (`admissible`: the gates a motif carries, in the bar's key, and first its shape, since it arrives as JSON) and drops, and logs, one that is late, ahead or inadmissible.
  `Motif`, `Judgement` and the bars travel as they are, so a change to their shape bumps `PROTOCOL` (`protocol.test.ts` fails until it does).
  A host reads each client message by its fields (`readClientMessage`) and refuses a name already in the session, in any case; a client reads its host's by kind alone.
  The player takes what arrived before the transport reads it, so an input it can't read costs one tick, not the song.
- A chord is the theory's `Chord`, a helix plus tensions (#38), in the key's register.
  `joinChord` gives its stack, and `chordScale` takes a stack.
  A bar's chords come from its theme's slots (`barChords`); their colour draws are keyed by theme, bar and slot, so a test that wants a rate must vary the seed or the theme, not the key.
- Swing is a time map, `swingMap(swing)`, with `played` and `written` as exact inverses.
  The transport plays through it, and player input reads back through `written`.
- A moment on the clock reads back onto the grid through the steps the transport laid (`writtenAt`), never through the style track: the track holds only its latest glide per axis, so inverting it from the song's start put a note 18 bars early after two tempo changes (#78).
  Each `ScheduledStep` carries the swing its beat was held at for this.
  A played note is placed at the moment that was being heard as it was played, kept exact; rounding it is the Muse's (#79).
  `clockOffset` gives that moment on both its paths, so nothing else takes the latency off again: in Chromium the heard moment lags `currentTime` by about the output latency.
  It is the device's one heard clock: MIDI out, capture, the HUD, a client's ear (`Output.heard`) and a session all read it, and `bandOutput` reads the clocks for it once a tick.
