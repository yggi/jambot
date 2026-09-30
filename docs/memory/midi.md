# MIDI

Facts about MIDI in and out of the app.

- A port chosen before (`MidiSettings.outPortId`/`inPortId`) is reconnected on load without a click (`App.svelte`), since a Web MIDI permission already granted needs no gesture; a first visit, with no port chosen yet, asks for none.
  `MidiOut.panic` (`audio/midi-out.ts`) sends all notes off and forgets what it held; `App.svelte` calls it, through `Player.panicMidi`, on waking from a hidden tab, since a suspended tab's frozen clock can leave a release unscheduled and hardware sounding, and offers it as a button in `SoundPanel.svelte` too, for whatever the automatic case misses (#102).
- Which output note each drum sound sends is configurable (`MidiSettings.drumNotes`, a `DrumNotes` — one number per `DrumSound`, `packages/engine/src/drums.ts`), not fixed to General MIDI: a Novation Circuit's four Drum tracks (Circuit and Circuit Tracks alike, confirmed identical in both of Novation's Programmer's Reference Guides) never speak GM, only notes 60/62/64/65 on channel 10, each playing whatever sample was loaded onto it.
  `SoundPanel.svelte` offers named presets (`midi/drum-presets.ts`: `GM`, `Novation Circuit`) plus a number per sound to hand-edit from there; `MidiOut.setDrumNotes` (`audio/midi-out.ts`) remaps a drum part's GM note to its configured one before sending, so two sounds aimed at the same pad retrigger like any other shared note (#102).
- The ports are listed by the device (`Device.ports`, from `MidiAccess.inputs` and `outputs`), read again when a port comes or goes (`MidiAccess`'s `onstatechange`) and when a person presses Refresh ports (`Device.refresh`, `MidiAccess.refresh`).
  Each look adopts the ports chosen again (`adoptPorts`, `midi/routing.ts`): the output by its id, none if it is gone, and the input listened to, since a port unplugged and plugged in again is a new object.
  A port chosen before that isn't plugged in shows as "Not connected" in its select, and the sound card's summary says "not found".
