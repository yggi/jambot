# MIDI

Facts about MIDI in and out of the app.

- MIDI in goes through the family's MIDI layer, [`@yggi/webmidi`](https://github.com/yggi/webmidi) at its tag (`apps/web/package.json`): its parser, the computer's keys, the on-screen keyboard's layout and the drum maps (`@yggi/webmidi/core`), and the Web MIDI connection, `MidiAccess` (`@yggi/webmidi/web`).
  What is Jambot's own stays in `apps/web/src/midi/`: where a note lands (`routing.ts`: `partOf`, channel 10 the pads, and `routeNote`, the Muse and playing along), the band's patch (`patch.ts`), the drum notes by sound (`drums.ts`) and what is remembered (`settings.svelte.ts`); the scale-locked keys are `keyboard.ts`.
  The clock offset, the audio clock against `performance.now()` that MIDI timestamps ride on, is webmidi's `clockOffset`: Jambot's output pair lifted, which also follows a jump wider than 50 ms (`OUTPUT.leap`: another device, a resume) from its first reading where Jambot's waited for three.
  The timing panel reads its estimate, the offset, the bound it trusts and the jumps it followed, from the offset itself (`EstimatedClockOffset.estimate`, webmidi's `PairEstimate`).
  The details dialog's test note and its all notes off are Jambot's (`Device.testNote`, `Device.panicOutput`, by the output's key).
  Note and clock out are webmidi's too (`MidiOut` and `ClockOut`, `audio/band-output.ts`; yggi/webmidi#3, Jambot #680).
  The ports' tests drive webmidi's fake Web MIDI, `@yggi/webmidi/testing`, which only a test imports (`device.test.ts`); the senders' tests keep their own port that records (`{ port, sent }`, a bare `MidiPort`).

## Setups

- The MIDI settings are webmidi's book of setups (yggi/webmidi decision 002), kept under `jambot:midi-setups` (`MidiSettings.book`, webmidi's `localBookStore`): device profiles kept by port name and shared by every setup (drum map, bend range, MPE, latency), and named setups, each with its outputs, the inputs it hears, its routes per context and its clock row.
  Jambot's context is `band` (`patch.ts`, `BAND`): its rows are the five parts (`lead`, `bass`, `pad`, `stab`, `drums`, the drums a kit), then the keys' row (webmidi's `KEYS`: the on-screen and computer keys), and webmidi's matrix adds a row per input (`in:<port name>`) and the clock row after them.
  The seats of #108 would be more rows of the same kind.
  The built-in synth is an output of each setup (webmidi's `BUILT_IN`, decision 004), the matrix's first column: it plays a part where the part's row crosses it (`synthPlays`, `band-output.ts`), so a setup can play some parts here and send others to hardware, or be MIDI only (the column removed).
  The keys' row has no crossing of it (`builtIn: false`): the keys sound with the part they play, as an input does.
  It was a switch of Jambot's own under `jambot:synth`, for every setup at once; a load moves it into every setup of the book once (`withSynth`: on or never set, the synth playing all five parts; off, no column), and the key then says `book`.
- A first load with no book migrates the store from before it (`jambot-midi-v1`, read as its load read it, drum notes by sound into a map) through webmidi's `fromJambot`, once, and leaves that store as it was; a first visit gets the same from its defaults, the five parts on lead 1, bass 2, pad and stab 3, drums 10 to one output with no device.
  That store kept ports by id alone, so the migration names none, and the device's map stays the book's defaults; when the ports are first seen, `nameByPorts` names them and moves the defaults to the device's profile, making the book `fromJambot` would have made with the ports known, with no custom variant (`patch.test.ts`).
  A migrated store sends the same bytes at the same times as before: `band-output.test.ts` plays a minute of a band through the output as it was (kept there as a literal) and through the book, and needs them equal.
- A change to a named setup becomes its custom variant ("Jambot - custom"), saved at once; webmidi's `SetupPicker` offers to overwrite the named setup, save it as a new one or discard it.

## Out

- The band goes to every output of the setup in use (`audio/band-output.ts`), each its own webmidi `MidiOut` and `ClockOut` with its own port, channels, drum notes, clock and latency, read off the book by `bandRoutes` (`patch.ts`) as the clock is read; a part goes to every crossing of its row, a part not routed to an output sends it nothing, and an output that leaves the setup is silenced and let go.
  A part's note is an `OutNote` on the channel its crossing gives, a drum through the device's map; the channels, `DrumNotes` and `DEFAULT_CHANNELS` are `midi/channels.ts`.
- A stop is not a panic (webmidi decision 008): Stop (`ClockOut`) goes just after the last tick sent, and no clock message follows it, and the notes already sent ahead sound on to their own ends, no later than `STOP_TAIL` (the lookahead and 0.4 s, which is what the band let ring when its own output sent a deferred All notes off then), each released by an exact note-off, so a device that ignores All notes off is released all the same.
  The bytes are therefore not those of Jambot's own output before #680: the clock, every onset and every ordinary release are the same, and `band-output.minute.txt` (a minute of the band as recorded, `RECORD_MINUTE=1 pnpm --filter @jambot/web exec vitest run -c vitest.node.config.ts src/audio/band-output.test.ts` records it anew) differs from the minute before only in the panics: All notes off on the channels used, in the order they were first used, with a note-off for each held note (a channel moved, the panic button), the sweep after the button, and at the stop exact note-offs where an All notes off came 0.52 s after it.
  The bound is the device's: every onset on time (`pnpm e2e`), nothing sounding after a stop, no clock after Stop, ticks evenly spaced (`band-output.test.ts`).
  Start goes 2 ms before the first tick of a run, so with the first step of the song (`ClockOut`); a run that begins elsewhere sends Song Position and Continue.
- The clock (24 ticks a beat, Start, Stop) goes to the outputs of the setup's clock row (`Setup.clock`), not a device's setting.
- An output's device's latency (its profile's, 0–1000 ms) sends every message to it that much earlier, the clock too (the output's `toDeviceMs` is the offset's less the latency, from 0); 0 sends each at its moment.
- Which output note each drum sound sends is the device's drum map (webmidi's `DrumMap` from the General MIDI note the engine writes for a `DrumSound`, `packages/engine/src/drums.ts`, to the note sent), kept by port name, so a Circuit's map is set once: a Novation Circuit's four Drum tracks (Circuit and Circuit Tracks alike, confirmed identical in both of Novation's Programmer's Reference Guides) never speak GM, only notes 60/62/64/65 on channel 10, each playing whatever sample was loaded onto it.
  webmidi's output details (`DeviceDialog`, opened from the output's head) offer its presets (`DRUM_PRESETS`: `GM`, `Novation Circuit`) and a number per drum sound where the drums go to the output, to hand-edit from there (`SoundPanel` passes the kit's members, `BAND_ROWS`, yggi/webmidi#36; since v0.5.0 they are no rows of the matrix); `MidiOut.setDrumNotes` remaps a drum part's GM note to its configured one before sending, so two sounds aimed at the same pad retrigger like any other shared note (#102).
- The panic button is webmidi's `MidiOut.panic` (a cut: a note-off for each note held, All notes off on the channels used) and then `sweep` (All notes off, All sound off and sustain off on all sixteen channels, from nothing it knows, so it reaches a note left by a reload), `band-output.ts`'s `panic`; an output's own details dialog sweeps that output alone (`Device.panicOutput`). `App.svelte` calls it on every output, through `Player.panicMidi`, on waking from a hidden tab, since a suspended tab's frozen clock can leave a release unscheduled and hardware sounding, and offers it as All notes off in the Sound panel too, for whatever the automatic case misses (#102).
- An output's Test note sends a middle C on the first channel routed to it, released 300 ms later (`Device.testNote`).

## In

- An input is a row of the patch in every mode: routed to any outputs, on a channel 1–16 or as played (webmidi's `AS_PLAYED`, the channel it came in on), and its Plays choice says what it plays (webmidi decision 003, `setup.plays`): not heard, the default, or a part.
  The parts are rows with their roles (`lead`, `bass`, `pad`, `stab`, `drums`), so a setup's choice carries from Cell studio by role, and a preset assigns by them: the Sound sheet offers webmidi's `DEFAULT_PRESET`, a keyboard to the lead and pads to the drums, for the inputs with no choice.
  A note from an input the setup hears goes to the instruments, the Muse and the timing test on the part it plays (`partPlayed`): any of the five parts it is set to; the default, by its channel as before (`partOf`: channel 10 the pads, any other the keyboard).
  The player plays along on every part (`AlongPart`, #564), so the Plays choice offers all five; the keys' row is the one not offered (`BAND_ROWS`' `playable: false`).
  A note played along sounds on its part (the synth's timbre for it, and MIDI out on its channel), is kept (`humanNotes`) and shown as the player's lane (a pad's and a stab's drawn as the chords').
  The Muse reads a played lead as motifs (#79), drums as grooves (#401) and a bass as bass lines, as she reads a client's part bass (#423); a pad or a stab as a player's chords (#570), as she reads the chords a player strikes on the keys (#425), filing the progression and judging no motif of them; as with those, her own players' alone, a client's kept and shown. A client's played bass goes to its ear, which passes it on to the host as the part bass with the bar's low notes (#569), as its drums go (#410).
  A note from an input is passed on at once where its row crosses an output, heard or not, and where the row of every input (`in:*`) does when it is heard (`Device.connect`, webmidi's `forwardsOfInput`).
  What is played on the on-screen and computer keys is passed on where the keys' row crosses an output (`Instruments`, `Device.forwardKeys`), on the crossing's channel; this is what the store before the book called thru.
- The device listens to the inputs the setup hears or routes and to no other (webmidi's `listenOf`, each by its name): none is opened that isn't wanted, and one not plugged in is found by name when the ports change; every input when every input is heard or routed.

## Panels

- Control panels (webmidi decisions 005 and 007) are rows and columns of the matrix beside the inputs: the library is kept under `jambot:midi-panels` (`PanelDeck`, `apps/web/src/midi/panels.svelte.ts`, webmidi's `localPanelStore`), a setup names the panels it has active (`Setup.panels`, webmidi's `withPanelActive`), and the library's others are chips over the matrix that add them.
  A first visit's library holds webmidi's two examples (`EXAMPLE_MIXER`, `EXAMPLE_PLAY`), none active; a library a person emptied stays empty.
- A panel is played, edited, made and deleted under the patch (`SoundPanel`: `PanelView`, `PanelEditor`).
  Its touches go out through the outputs its row crosses, on the channel the crossing says (`forwardsOf` on `panel:<id>`, through `Device`'s sender), and to the panels its row crosses (`panelForwardsOf`).
  An input's raw messages (`MidiAccess`'s `onMessage`) go to the panels its row crosses, so a panel follows a controller whether or not a view shows it.
  The panels' notes are released on All notes off (`PanelDeck.silence`), and where a panel is taken out or edited, by the book of before the change.
- Jambot's own rows (the parts, the keys) are sent from notes, not bytes, so no panel's column crosses them (decision 007); and the built-in synth is no `direct` column (`PatchMatrix`'s `builtIn.direct` is not passed), so a panel is not heard on it: it plays on MIDI outputs only.
  Playing a panel on the synth would take a map from MIDI bytes to the synth's notes, which Jambot has none of; it is left open.

## Ports

- A setup remembered with a device or an input is reconnected on load without a click (`App.svelte`, `Device.remembersPorts`), since a Web MIDI permission already granted needs no gesture; a first visit, with nothing chosen yet, asks for none.
- The ports are listed by the device (`Device.ports`, from `MidiAccess.inputs` and `outputs`, which leave out a port the browser keeps listed as disconnected), read again when a port comes or goes (`MidiAccess`'s `onstatechange`) and when a person presses Refresh ports (`Device.refresh`, `MidiAccess.refresh`).
  Each look resolves each output of the setup again (webmidi's `outputNow`: by id, else by name, since a port plugged in again is a new object and may have a new id) and listens again.
  A device of the setup that isn't plugged in is drawn struck out, its routes kept, and the sound card's summary says "not found".
- Ports under one name are one input to the book, which keeps an input by its name (`in:<name>`), and Android names a multi-port device's every port after the device: webmidi's matrix draws them as one row, "2 ports" under the name, since a name twice would be a row twice, which a keyed list refuses by throwing, and that would stop the whole page redrawing (as it did before: a lobby's Solo did nothing, the channel picker stayed open, a device plugged in wasn't shown).
- A browser that hasn't answered a request for MIDI after 8 s (`CONNECT_WAIT`: a permission prompt hidden, or one a tablet never shows) is said to be waiting, and Connect can be pressed again.
- An output removed (its × in the matrix's head, or its details) goes back among the devices plugged in that the setup has no output for, which are chips over the matrix that add it (webmidi v0.5.0: no `+ Output`; a port is found by its name, one port to one output, decision 006); the last is left with no device, its routes kept (webmidi's `removeOutput`: a setup keeps one output). A device's own settings can be forgotten from its device settings (webmidi's `forgetDevice`), back to the defaults. Reset MIDI settings (`MidiSettings.reset`) forgets every setup and device profile, after asking.
