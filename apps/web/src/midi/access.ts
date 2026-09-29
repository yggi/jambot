/**
 * Web MIDI access: connecting, listing ports, and turning what a listened
 * input plays into notes for `surfaces.ts` to parse.
 */

import type { MidiPort } from '../audio/midi-out.ts';
import { type ParsedNote, parseMidiMessage } from './surfaces.ts';

export interface PortOption {
  readonly id: string;
  readonly name: string;
}

/** Port entries for a picker, in the order the device gives them. */
export function portOptions(
  ports: ReadonlyMap<string, { readonly name: string | null }>,
): PortOption[] {
  return [...ports].map(([id, port]) => ({ id, name: port.name ?? 'MIDI' }));
}

/**
 * A note read from a listened input, the port's name it came from, and the
 * message's own timestamp, milliseconds on the page's clock: when the port
 * saw it, not when the page got to it.
 */
export type NoteHandler = (note: ParsedNote, source: string, timeStamp?: number) => void;

/** A live Web MIDI connection: the ports plugged in, and which input is listened to. */
export class MidiAccess {
  #access: MIDIAccess;
  #onNote: NoteHandler;
  #listening = 'none';

  private constructor(access: MIDIAccess, onNote: NoteHandler) {
    this.#access = access;
    this.#onNote = onNote;
    access.onstatechange = () => this.listen(this.#listening);
  }

  /**
   * Ask for Web MIDI access. The result is the connection, or the browser's
   * reason it couldn't be had: no Web MIDI at all, or access blocked here.
   */
  static async connect(onNote: NoteHandler): Promise<MidiAccess | string> {
    if (!navigator.requestMIDIAccess)
      return 'This browser has no Web MIDI. Chrome and Edge on desktop or Android have it.';
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      return new MidiAccess(access, onNote);
    } catch (err) {
      const name = err instanceof Error ? err.name : 'error';
      return `MIDI access was blocked here (${name}). Allow MIDI for this site, or open the page in its own tab.`;
    }
  }

  get inputs(): PortOption[] {
    return portOptions(this.#access.inputs);
  }

  get outputs(): PortOption[] {
    return portOptions(this.#access.outputs);
  }

  outputPort(id: string): MidiPort | null {
    return this.#access.outputs.get(id) ?? null;
  }

  /** Which input is listened to, refreshed on `onstatechange` as ports come and go. */
  get listening(): string {
    return this.#listening;
  }

  /** Listen to one input by id, `'all'` of them, or `'none'`. */
  listen(id: string) {
    this.#listening = id;
    for (const [portId, input] of this.#access.inputs)
      input.onmidimessage =
        id === 'all' || id === portId
          ? (event) => {
              const note = event.data && parseMidiMessage(event.data);
              if (note) this.#onNote(note, input.name ?? 'MIDI', event.timeStamp);
            }
          : null;
  }
}
