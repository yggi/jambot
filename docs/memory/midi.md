# MIDI

Facts about MIDI in and out of the app.

- MIDI in goes through the family's MIDI layer, [`@yggi/webmidi`](https://github.com/yggi/webmidi) at its tag (`apps/web/package.json`): its parser, the computer's keys, the on-screen keyboard's layout and the drum maps (`@yggi/webmidi/core`), and the Web MIDI connection, `MidiAccess` (`@yggi/webmidi/web`).
  What is Jambot's own stays in `apps/web/src/midi/`: where a note lands (`routing.ts`: `partOf`, channel 10 the pads, and `routeNote`, the Muse, playing along and thru) and what is remembered (`settings.svelte.ts`); the scale-locked keys are `keyboard.ts`.
  The clock offset, the audio clock against `performance.now()` that MIDI timestamps ride on, is webmidi's `clockOffset`: Jambot's output pair lifted, which also follows a jump wider than 50 ms (`OUTPUT.leap`: another device, a resume) from its first reading where Jambot's waited for three.
  It keeps its bound and its count of jumps to itself (yggi/webmidi#9), so the timing panel reads them off its offset (`audio/output-estimate.ts`).
  Note and clock out are still Jambot's (`audio/midi-out.ts`), the next step of yggi/webmidi#3.
  The ports' tests drive webmidi's fake Web MIDI, `@yggi/webmidi/testing`, which only a test imports (`device.test.ts`); the senders' tests keep their own port that records (`{ port, sent }`, a bare `MidiPort`), and the panel's its own connection of spies (`SoundPanel.test.ts`), which the shipped fakes don't match.

- A port chosen before (`MidiSettings.outPortId`/`inPortId`) is reconnected on load without a click (`App.svelte`), since a Web MIDI permission already granted needs no gesture; a first visit, with no port chosen yet, asks for none.
  `MidiOut.panic` (`audio/midi-out.ts`) sends all notes off and forgets what it held; `App.svelte` calls it, through `Player.panicMidi`, on waking from a hidden tab, since a suspended tab's frozen clock can leave a release unscheduled and hardware sounding, and offers it as a button in `SoundPanel.svelte` too, for whatever the automatic case misses (#102).
- Which output note each drum sound sends is configurable (`MidiSettings.drumMap`, webmidi's `DrumMap` from the General MIDI note the engine writes for a `DrumSound`, `packages/engine/src/drums.ts`, to the note sent), not fixed to General MIDI: a Novation Circuit's four Drum tracks (Circuit and Circuit Tracks alike, confirmed identical in both of Novation's Programmer's Reference Guides) never speak GM, only notes 60/62/64/65 on channel 10, each playing whatever sample was loaded onto it.
  `SoundPanel.svelte` offers webmidi's presets (`DRUM_PRESETS`: `GM`, `Novation Circuit`) plus a number per sound to hand-edit from there (`MidiSettings.drumNotes`, the map seen by sound; a map set by sound that sends every sound as a preset does is that preset); `MidiOut.setDrumNotes` (`audio/midi-out.ts`) remaps a drum part's GM note to its configured one before sending, so two sounds aimed at the same pad retrigger like any other shared note (#102).
  A save from before the map (`jambot-midi-v1` with `drumNotes`, one note per sound) is read into the map that sends every sound as it did and written back in the new form (`settings.test.ts`).
- The ports are listed by the device (`Device.ports`, from `MidiAccess.inputs` and `outputs`, which leave out a port the browser keeps listed as disconnected), read again when a port comes or goes (`MidiAccess`'s `onstatechange`) and when a person presses Refresh ports (`Device.refresh`, `MidiAccess.refresh`).
  Each look adopts the ports chosen again (webmidi's `adoptPorts`, from `Device`): the output by its id, none if it is gone, and the input listened to, since a port unplugged and plugged in again is a new object.
  webmidi would also find a port back under a new id by its name, but the settings keep no names, so `Device` adopts by id alone.
  A port chosen before that isn't plugged in shows as "Not connected" in its select, and the sound card's summary says "not found".
