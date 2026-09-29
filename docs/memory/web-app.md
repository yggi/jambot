# The web app

Facts about `apps/web`: the screen, its components and what its end-to-end checks rely on.

- The screen reads one snapshot, `player.hud` (`hudOf`, in `apps/web/src/hud.ts`), rebuilt when the step heard, the bars ahead or the track change.
  Components take slices of it as props and send intents; none reads the engine.
  A style is named by the preset it matches on every axis the preset sets but energy (`presetOf`), so there is no chosen-preset state: moving another axis makes a style custom, and moving energy or entropy, or nudging the tempo, doesn't.
  `KeyPicker.svelte` is folded to a header by default, the key the band is heading for (`hud.heading`, the last bar decided's) in common terms (`keyName`: "C major", "A minor"; ionian and aeolian are major and minor, `MODE_NAMES`).
  A key and its notes are spelled in the key, as its signature has them (`noteNames.ts`, on the theory's `spelledTonic` and `spell`, as the engine's `keyName`): G♯ minor, not A♭ minor. The header, the Stage and the song map all name a key this one way; only the wheel, where a pitch class stands alone, uses the prototype's fixed `TONIC_NAMES`.
  Unfolded it shows, stacked at every width and with no switch between them, two views of the one key that complement each other: the circle of fifths selects and nudges the tonic and shows the scale's shape on it, and under it the scale selects the shape and draws it as a mark on each note and the octave, on the 12 steps of the octave (`scaleMarks`), the gaps between the marks showing the whole and half steps (`scaleSteps`), with no other labels or captions.
  The scale's selector is a segmented button of all seven diatonic modes, brightest to darkest; the band plays four (`COMPOSER_MODES`), so the other three are disabled.
  Only major and minor keep their full names in it; the other modes are their first three letters (`MODE_SHORT_NAMES`: lyd, mix, dor, phr, loc), with the name as tooltip and accessible name, never Roman numerals, which the chords level below writes for chords.
  Changing the shape keeps the tonic, and nudging the tonic keeps the shape, the two going through the same `key` intent.
  `CircleOfFifths.svelte` draws it: theory's `fifthsIndex` (built on `generator(7, 12)`) lays the 12 pitch classes out by fifths, and the current scale is the arc its dots make along the rim, open and in fifths order (`figureArc`), with the tonic alone ringed; only a scale with a hole in it (harmonic minor) gets a dashed chord across the wheel.
  It is read-only wherever it is given no `mode`/`onintent`; given both, a dot is a button that wishes for its pitch class as tonic, in the mode already playing (going through the same `key` intent the mode select does).
  A key picked is wished for tonic and mode; a preset wishes for its mode only when the wish is in another, so a key picked survives a preset in its mode.
  `history`, always drawn on the same wheel, is one weight per pitch class from `player.harmonicHistory` (`apps/web/src/harmonicHistory.ts`), drawn as a filled radar under the wheel.
  The host, or a band playing alone, sets the key (the dots and the shape) and nudges it, by the Nudge up and Nudge down buttons, a fifth clockwise or counter-clockwise in the mode heard, within the licence.
  A client's key intent is dropped by `Player.apply` until the host takes nudges over the session, so a client's nudges are disabled, titled "The host sets the key": the buttons are the seam, the transport is open.
  `HarmonicHistory` sums every note the band actually plays by pitch class, drums excluded, decaying whatever a later bar's first note finds by how many bars passed silently since the last one pushed — so the shape reads as "what has the band been playing lately", not the current scale, and not everything ever played.
  Stage stays plain text: the key's name and its notes ascending from the tonic (`scaleNoteNames`), no wheel of its own.
- The page (`App.svelte`) lays the music out in the order of the composition, top to bottom, one `Level` each: transport, style, metrum, key, plan and chords, tracks (#163).
  A `Level` is a heading over a fieldset; `resting` disables its controls where a client takes the host's (transport, style, key), and the metrum and the tracks, the client's own, never rest.
  What isn't the music sits folded above it, one `Drawer` each: Connection (`SessionPanel`) and MIDI and sound (`MidiPanel`), each summary saying what it is set to.
  An e2e check that hosts or joins opens the Connection drawer first (`connection` in `session.e2e.ts`).
  A new widget goes into the level it belongs to, not into a corner of another.
- The key and the metrum share one card, summary over details: a `Fold` carries its own heading ("Key", "Metrum") inside it, over a headline in large type and a line under it, with the chevron at the top right, where a `Drawer`'s is too, so a stack of them lines up (`summary.chevron`, in `app.css`).
  A level whose card names itself has no `name` and so no heading above it (`Level`).
  The parts under a card are shared too: `Nudge` (two buttons joined in a pill, a step down and up, with what it reaches between them: the tempo's and the key's), `Gauge` (a track with a tick at its centre, a marker, an optional fill from the centre and an optional band of reach: the tempo's licence and the swing), `Segmented` (a row of exclusive segments, the key's scale) and `Ruler` (a span of steps ticked, with marks laid on it at places that need not be ticks: the scale's notes on the octave's 12 steps, the bar's steps on its 16).
  A new view of one thing builds from these, and a makeover of one changes all.
  A card's details say values, not sentences: "Reaches 117–180", "Swing 62 %", "Pulse 3 of 4".
- The metrum is the page's one section on time (`Metrum.svelte`, `metrum.ts`): the headline is the tempo, the line under it the meter and the swing value ("4/4 · swing 62 %"), and unfolded it holds the tempo nudge and its licence gauge, the swing gauge (none at the centre), the bar drawn on a `Ruler` and the click.
  The bar's marks sit where the click sounds under the swing (`barMarks`, on the engine's `clicksOf`): the eighths are the click's, counted 1 & 2 & 3 & 4 &, the sixteenths between are faint, so a light swing shows on them and only a swing past half moves the eighths.
  The swing is read there and set in the style, where it stays an axis.
- The click has no clock of its own (#166): the player hands the `Metronome` the steps the transport laid on each tick (`Metronome.lay`), it reads them into clicks on the song's meter through the swing (`clicksOf`, `packages/engine/src/metronome.ts`) and plays them on the player's output (`Output.click`, the built-in synth alone, never MIDI, on the bus `silence` fades).
  So it starts on the band's downbeat, follows a tempo glide, and rests while the band is stopped: switched on, it waits for the next song (decided in #166).
  A client clicks its host's steps on its own output at the skew it plays them; the click is the client's own, so it is never in a session and its switch never rests.
  Only its volume is saved, in `localStorage`; whether it is on never is.
- The players nudge a default the layer above sets; they don't select it.
  The layer above gives the default and a licence, how far a nudge may move it (`packages/engine/src/licence.ts`): the performer's licence on a note (`performer.ts`, T17) is the same shape one level down.
  The style sets the tempo, and `TempoNudge.svelte` (in the metrum) nudges it by a ratio, 2^(1/24) a step, within `tempoLicence`: a third of an octave either way, cut by the tempo axis's ends.
  The track holds the tempo played, the style's times the nudge, so the transport, the score and a session's clients read one tempo; the player carries the nudge (`Player.tempoNudge`), a preset's tempo takes it over, and `unnudged` reads the style's own back for naming.
  A key picked is held within `KEY_REACH` fifths of the home key's signature (`intoReach`, `fifthsApart`: relative keys lie 0 apart), and the wheel dims the tonics beyond it.
  Every style gives the same reach today, every key and a third of an octave; which axes narrow or widen it, and whether a nudge held at an edge should move the style itself, is open (#171).
  A client doesn't have its host's nudge, so it names a nudged style by the tempo played: a known seam.
- `Keyboard.svelte` and `DrumPads.svelte` mark the current key's scale as a dot (`hud.bar.scale`, from `hud.ts`) and flash amber for the band's own lead and drum notes (`player.sounding`, `apps/web/src/sounding.ts`), never what a person plays along with it.
  Any note played, from a pointer, a computer key or MIDI, goes through `App.svelte`'s `onHumanNote`, which sounds it at once (`Player.playAlong`) and logs it for the Muse (`Player.humanNoteOn`, and `humanNoteOff` for its release) alike; `midi/surfaces.ts`'s `partOf` reads a MIDI note's channel to tell the pads from the keyboard, channel 10 the drums' as the prototype's is.
- The e2e checks tell sounds apart by oscillator type and starting frequency: a kick is a sine starting at 440 Hz (its pitch only glides), a snare's body a triangle at 185 Hz, the bass a saw, the lead a square, a chord note a triangle beside a sine 0.3 % sharp.
  The click is a square at 1800 Hz on the downbeat, a triangle at 1200 on the other pulses and a sine at 800 between (`metronome-click.ts`), each starting at its frequency, which `band.e2e.ts` reads to place them.
  A new voice keeps these apart or updates `band.e2e.ts`.
  A note played along is a square too, but starts at once, off the grid; at energy 0 the lead rests, so a square on the grid is a motif the Muse offered.
- Section names appear twice on the page, on the stage and in the song map, which names them before anything is heard.
  So a check that the screen follows what is heard looks for `Bar n of 8`, which only the stage shows.
- The lead's status line (`leadStatus`, `hud.ts`) also appears twice, once on the stage and once on its own row among the stage's performers (`performers.ts`, `Performers.svelte`): a performer's row is what the lead-shaped drums, bass and chords rows already look like, and singling the lead's out would be the special case.
  An `apps/web/e2e/band.e2e.ts` check that reads it scopes to the stage's own `Conductor` region.
  The stage's four rows (drums, bass, chords, lead) are named `Performer`, not `Track` or `Member`: `track` already names `StyleTrack` and the ratchet's working and negative tracks, and `Performer` names what each row is precisely — the composer writes what a performer plays, and a performer is the band's own voice or a human at that voice's instrument, the same word family as `performer.ts` (T4, #107), which is how a performer plays it.
  Decided in the working track, on the owner's naming call.
  `apps/web`'s `Performer` is this UI row, one per band voice; the engine's own performer, `perform` in `performer.ts`, is a different thing with the same name — it plays a bar, not a screen.
- Whose motif the lead plays is the bar's own offer (`BarEnv.offer`), which every composed and forecast bar carries and a client gets with its host's bars, so no attribution crosses the protocol of its own (#164).
  `BarView.motif` names it (an `Attribution`: source and bar heard) for the bar heard and the bars ahead, where it is the offer standing now.
  `Pattern` keeps it with the bar its rolls show (`offered`, fed from the bars composed), so a roll and its attribution are always one bar's; its source stays an id, named only by the view (`performersOf`).
  `playedIn` gives the players' side of a bar, per source, on the Muse's own rounding (`heardIn`, `heardStep`).
- The e2e checks play each melody input as a player does: the computer keys typed, the on-screen keys pressed, and a MIDI keyboard through a Web MIDI stand-in the page gets before it loads (`band.e2e.ts`, `INPUTS`), since headless Chromium has no MIDI ports.
- `performance.now` read off its object throws ("Illegal invocation" in a browser, a TypeError in Node), so a default clock is called on it: `deps.now ? deps.now() : performance.now()`, never `(deps.now ?? performance.now)()`.
  That broke every note played in the browser, after it had sounded, until an e2e check typed one (#79).
