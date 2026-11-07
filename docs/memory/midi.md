# MIDI

Facts about MIDI in and out of the app.

- MIDI in goes through the family's MIDI layer, [`@yggi/webmidi`](https://github.com/yggi/webmidi) at its tag (`apps/web/package.json`): its parser, the computer's keys, the on-screen keyboard's layout and the drum maps (`@yggi/webmidi/core`), and the Web MIDI connection, `MidiAccess` (`@yggi/webmidi/web`).
  What is Jambot's own stays in `apps/web/src/midi/`: where a note lands (`routing.ts`: `partOf`, channel 10 the pads, and `routeNote`, the Muse and playing along), the band's patch (`patch.ts`), the drum notes by sound (`drums.ts`) and what is remembered (`settings.svelte.ts`); the scale-locked keys are `keyboard.ts`.
  The clock offset, the audio clock against `performance.now()` that MIDI timestamps ride on, is webmidi's `clockOffset`: Jambot's output pair lifted, which also follows a jump wider than 50 ms (`OUTPUT.leap`: another device, a resume) from its first reading where Jambot's waited for three.
  The timing panel reads its estimate, the offset, the bound it trusts and the jumps it followed, from the offset itself (`EstimatedClockOffset.estimate`, webmidi's `PairEstimate`).
  Note and clock out are still Jambot's (`audio/midi-out.ts`), the next step of yggi/webmidi#3.
  The ports' tests drive webmidi's fake Web MIDI, `@yggi/webmidi/testing`, which only a test imports (`device.test.ts`); the senders' tests keep their own port that records (`{ port, sent }`, a bare `MidiPort`).

## Setups

- The MIDI settings are webmidi's book of setups (yggi/webmidi decision 002), kept under `jambot:midi-setups` (`MidiSettings.book`, webmidi's `localBookStore`): device profiles kept by port name and shared by every setup (drum map, bend range, MPE, latency), and named setups, each with its outputs, the inputs it hears, its routes per context and its clock row.
  Jambot's context is `band` (`patch.ts`, `BAND`): its rows are the five parts (`lead`, `bass`, `pad`, `stab`, `drums`, the drums a kit), then the keys' row (webmidi's `KEYS`: the on-screen and computer keys), and webmidi's matrix adds a row per input (`in:<port name>`) and the clock row after them.
  The seats of #108 would be more rows of the same kind.
  Whether the built-in synth plays is Jambot's, beside the book, under `jambot:synth`.
- A first load with no book migrates the store from before it (`jambot-midi-v1`, read as its load read it, drum notes by sound into a map) through webmidi's `fromJambot`, once, and leaves that store as it was; a first visit gets the same from its defaults, the five parts on lead 1, bass 2, pad and stab 3, drums 10 to one output with no device.
  That store kept ports by id alone, so the migration names none, and the device's map stays the book's defaults; when the ports are first seen, `nameByPorts` names them and moves the defaults to the device's profile, making the book `fromJambot` would have made with the ports known, with no custom variant (`patch.test.ts`).
  A migrated store sends the same bytes at the same times as before: `band-output.test.ts` plays a minute of a band through the output as it was (kept there as a literal) and through the book, and needs them equal.
- A change to a named setup becomes its custom variant ("Jambot - custom"), saved at once; webmidi's `SetupPicker` offers to overwrite the named setup, save it as a new one or discard it.

## Out

- The band goes to every output of the setup in use (`audio/band-output.ts`), each its own `MidiOut` with its own port, channels, drum notes, clock and latency, read off the book by `bandRoutes` (`patch.ts`) as the clock is read; a part goes to every crossing of its row, a part not routed to an output sends it nothing, and an output that leaves the setup is silenced and let go.
  `MidiOut` silences its channels in the order the parts are routed, and `bandRoutes` keeps the order the store before the book kept them (`BAND_PARTS`), so all notes off goes out as before.
- The clock (24 ticks a beat, Start, Stop) goes to the outputs of the setup's clock row (`Setup.clock`), not a device's setting.
- An output's device's latency (its profile's, 0–1000 ms) sends every message to it that much earlier, the clock too (`MidiOut.setLatency`); 0 sends each at its moment.
- Which output note each drum sound sends is the device's drum map (webmidi's `DrumMap` from the General MIDI note the engine writes for a `DrumSound`, `packages/engine/src/drums.ts`, to the note sent), kept by port name, so a Circuit's map is set once: a Novation Circuit's four Drum tracks (Circuit and Circuit Tracks alike, confirmed identical in both of Novation's Programmer's Reference Guides) never speak GM, only notes 60/62/64/65 on channel 10, each playing whatever sample was loaded onto it.
  `DeviceInspector` offers webmidi's presets (`DRUM_PRESETS`: `GM`, `Novation Circuit`), and the patch a number per drum sound on each output the drums go to, to hand-edit from there (the kit's member rows, `BAND_ROWS`, yggi/webmidi#36); `MidiOut.setDrumNotes` remaps a drum part's GM note to its configured one before sending, so two sounds aimed at the same pad retrigger like any other shared note (#102).
- `MidiOut.panic` (`audio/midi-out.ts`) sends all notes off and forgets what it held; `App.svelte` calls it on every output, through `Player.panicMidi`, on waking from a hidden tab, since a suspended tab's frozen clock can leave a release unscheduled and hardware sounding, and offers it as All notes off in the Sound panel too, for whatever the automatic case misses (#102).
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

## Ports

- A setup remembered with a device or an input is reconnected on load without a click (`App.svelte`, `Device.remembersPorts`), since a Web MIDI permission already granted needs no gesture; a first visit, with nothing chosen yet, asks for none.
- The ports are listed by the device (`Device.ports`, from `MidiAccess.inputs` and `outputs`, which leave out a port the browser keeps listed as disconnected), read again when a port comes or goes (`MidiAccess`'s `onstatechange`) and when a person presses Refresh ports (`Device.refresh`, `MidiAccess.refresh`).
  Each look resolves each output of the setup again (webmidi's `outputNow`: by id, else by name, since a port plugged in again is a new object and may have a new id) and listens again.
  A device of the setup that isn't plugged in is drawn struck out, its routes kept, and the sound card's summary says "not found".
- Ports under one name are one input to the book, which keeps an input by its name (`in:<name>`), and Android names a multi-port device's every port after the device: the matrix is handed one per name (`onePerName`, `patch.ts`), since a name twice was a row twice, which a keyed list refuses by throwing, and that stopped the whole page redrawing (a lobby's Solo did nothing, the channel picker stayed open, a device plugged in wasn't shown).
- A browser that hasn't answered a request for MIDI after 8 s (`CONNECT_WAIT`: a permission prompt hidden, or one a tablet never shows) is said to be waiting, and Connect can be pressed again.
- An output removed from its device settings goes; the last is left with no device, its routes kept (a setup keeps one output). Reset MIDI settings (`MidiSettings.reset`) forgets every setup and device profile, after asking.
