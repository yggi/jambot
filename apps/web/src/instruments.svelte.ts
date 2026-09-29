/**
 * The instruments a person plays along with the band: the on-screen keys
 * and pads, the computer's keys and a MIDI keyboard, all through the same
 * two routes, one for the lead and one for the drums (`routeNote`). A note
 * sounds at once, along with the band, and is captured for the Muse.
 * What is held lights the on-screen keys and pads.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Device } from './device.svelte.ts';
import type { NoteHandler } from './midi/access.ts';
import { routeNote } from './midi/routing.ts';
import { COMPUTER_KEY_MAP, DRUM_KEY_MAP, ignoreKeyEvent, partOf } from './midi/surfaces.ts';
import type { AlongPart, Player } from './player.svelte.ts';

type Route = (note: number, velocity: number, on: boolean, source: string) => void;

export class Instruments {
  /** Notes currently held, from any source, so the keyboard and the pads light them too. */
  readonly heldLead = new SvelteSet<number>();
  readonly heldDrums = new SvelteSet<number>();
  readonly toLead: Route;
  readonly toDrums: Route;

  constructor(player: Player, device: Device) {
    const routerFor =
      (part: AlongPart, held: SvelteSet<number>): Route =>
      (note, velocity, on, source) =>
        routeNote(note, velocity, on, source, {
          held,
          humanNoteOn: (n, v, s, seconds) => player.humanNoteOn(part, n, v, s, seconds),
          humanNoteOff: (n, s, seconds) => player.humanNoteOff(part, n, s, seconds),
          playing: () => player.playing,
          toOutputSeconds: (ms) => device.clockOf().offset.fromDeviceMs(ms),
          thru: () => device.settings.thru,
          thruPort: () => device.access?.outputPort(device.settings.outPortId) ?? null,
          thruChannel: () => device.settings.thruChannel,
          playAlong: (n, v) => void player.playAlong(part, n, v),
        });
    this.toLead = routerFor('lead', this.heldLead);
    this.toDrums = routerFor('drums', this.heldDrums);
  }

  /** A note from Web MIDI: channel 10 plays the pads, every other channel the keyboard (`partOf`). */
  readonly onMidiNote: NoteHandler = (note, source) =>
    (partOf(note.channel) === 'drums' ? this.toDrums : this.toLead)(
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
