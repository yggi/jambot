/**
 * The instruments a person plays along with the band: the on-screen keys
 * and pads, the computer's keys and a MIDI keyboard, all through the same
 * two routes, one for the lead and one for the drums (`routeNote`). A note
 * sounds at once, along with the band, and is captured for the Muse.
 * What is held lights the on-screen keys and pads. A note on this device's
 * own keys is passed on where the patch sends the keys' row; a MIDI input's
 * notes are passed on by the device, heard or not, before they get here.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Device } from './device.svelte.ts';
import {
  COMPUTER_KEY_MAP,
  DRUM_KEY_MAP,
  type ParsedNote,
  ignoreKeyEvent,
} from '@yggi/webmidi/core';
import { DRUM_CHANNEL, partOf, routeNote } from './midi/routing.ts';
import type { AlongPart, Player } from './player.svelte.ts';

type Route = (note: number, velocity: number, on: boolean, source: string) => void;

export class Instruments {
  /** Notes currently held, from any source, so the keyboard and the pads light them too. */
  readonly heldLead = new SvelteSet<number>();
  readonly heldDrums = new SvelteSet<number>();
  /** How many notes have been struck, on any instrument, since the page opened: what the lobby's solo glyph pings on. */
  struck = $state(0);
  /** The on-screen and computer keys' routes, which pass what is played on as the keys' row. */
  readonly toLead: Route;
  readonly toDrums: Route;
  /** MIDI in's routes, which pass nothing on: the device did. */
  readonly #midiLead: Route;
  readonly #midiDrums: Route;

  constructor(player: Player, device: Device) {
    const routerFor =
      (part: AlongPart, held: SvelteSet<number>, keys: boolean): Route =>
      (note, velocity, on, source) => {
        // The keys' channel as played: the keyboard's 1, the pads' 10.
        const played = part === 'drums' ? DRUM_CHANNEL : 0;
        if (on && velocity > 0) this.struck++;
        routeNote(note, velocity, on, source, {
          held,
          humanNoteOn: (n, v, s, seconds) => player.humanNoteOn(part, n, v, s, seconds),
          humanNoteOff: (n, s, seconds) => player.humanNoteOff(part, n, s, seconds),
          playing: () => player.playing,
          toOutputSeconds: (ms) => device.clockOf().offset.fromDeviceMs(ms),
          playAlong: (n, v) => void player.playAlong(part, n, v),
          ...(keys
            ? { forward: (n: number, v: number, o: boolean) => device.forwardKeys(n, v, o, played) }
            : {}),
        });
      };
    this.toLead = routerFor('lead', this.heldLead, true);
    this.toDrums = routerFor('drums', this.heldDrums, true);
    this.#midiLead = routerFor('lead', this.heldLead, false);
    this.#midiDrums = routerFor('drums', this.heldDrums, false);
  }

  /**
   * A note from Web MIDI, on the part its input plays (yggi/webmidi#43): the
   * device's `partPlayed`, else as by its channel (`partOf`: channel 10 the
   * pads, every other the keyboard).
   */
  readonly onMidiNote = (note: ParsedNote, source: string, part = partOf(note.channel)) =>
    (part === 'drums' ? this.#midiDrums : this.#midiLead)(
      note.note,
      note.velocity,
      note.on,
      source,
    );

  /** Listen to the computer's keys, until the returned function is called. */
  listen(): () => void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (ignoreKeyEvent(e.target, e.repeat, e.metaKey || e.ctrlKey || e.altKey)) return;
      const lead = COMPUTER_KEY_MAP[e.key.toLowerCase()];
      if (lead !== undefined) return this.toLead(lead, 100, true, 'the computer keys');
      const drum = DRUM_KEY_MAP[e.key];
      if (drum !== undefined) this.toDrums(drum, 100, true, 'the computer keys');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lead = COMPUTER_KEY_MAP[e.key.toLowerCase()];
      if (lead !== undefined) return this.toLead(lead, 0, false, 'the computer keys');
      const drum = DRUM_KEY_MAP[e.key];
      if (drum !== undefined) this.toDrums(drum, 0, false, 'the computer keys');
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }
}
