/**
 * Where a played note lands, and how a connection is adopted: pulled out
 * of `App.svelte` so this wiring has a test that can fail if it breaks.
 */

import { nibble } from '../audio/midi-out.ts';
import type { MidiPort } from '../audio/midi-out.ts';
import type { MidiAccess, NoteHandler } from './access.ts';

export interface RouteDeps {
  /** Mutated in place: added on, removed off, as the on-screen keyboard lights it. */
  readonly held: { add(note: number): unknown; delete(note: number): unknown };
  /** The Muse (#79) reads captured notes from here; this only feeds it. */
  readonly humanNoteOn: (note: number, velocity: number, source: string, seconds: number) => void;
  /** Where a captured note is released. */
  readonly humanNoteOff: (note: number, source: string, seconds: number) => void;
  readonly playing: () => boolean;
  /** A `performance.now()`-relative timestamp, as seconds on the player's clock. */
  readonly toOutputSeconds: (performanceMs: number) => number;
  readonly thru: () => boolean;
  readonly thruPort: () => MidiPort | null;
  readonly thruChannel: () => number;
  /** Heard at once, along with the band, whenever a note is struck. */
  readonly playAlong: (note: number, velocity: number) => void;
  readonly now?: () => number;
}

/** A note from any source: the on-screen keys, the computer keys, or Web MIDI in. */
export function routeNote(
  note: number,
  velocity: number,
  on: boolean,
  source: string,
  deps: RouteDeps,
): void {
  if (on) deps.held.add(note);
  else deps.held.delete(note);
  if (on) deps.playAlong(note, velocity);
  if (deps.playing()) {
    // `performance.now` read off its object throws, so it is called on it.
    const seconds = deps.toOutputSeconds(deps.now ? deps.now() : performance.now());
    if (on) deps.humanNoteOn(note, velocity, source, seconds);
    else deps.humanNoteOff(note, source, seconds);
  }
  if (deps.thru()) {
    const channel = nibble(deps.thruChannel());
    deps.thruPort()?.send(on ? [0x90 | channel, note, velocity] : [0x80 | channel, note, 0]);
  }
}

/** The ports chosen, as settings keep them: ids, and the live output they resolve to. */
export interface ChosenPorts {
  readonly outPortId: string;
  readonly inPortId: string;
  outPort: MidiPort | null;
}

/**
 * Adopt the ports chosen from the connection as it is now: the output by its
 * id, none if it is gone or was never chosen, and the input listened to. A
 * port unplugged and plugged in again is a new object, so this runs whenever
 * the ports may have changed.
 */
export function adoptPorts(
  access: Pick<MidiAccess, 'outputPort' | 'listen'>,
  settings: ChosenPorts,
): void {
  settings.outPort = settings.outPortId === 'none' ? null : access.outputPort(settings.outPortId);
  access.listen(settings.inPortId);
}

/** What was found, in a line: "MIDI connected: 1 input, 2 outputs." */
export function portsMessage(ports: {
  readonly inputs: readonly unknown[];
  readonly outputs: readonly unknown[];
}): string {
  const count = (list: readonly unknown[], noun: string) =>
    `${list.length} ${noun}${list.length === 1 ? '' : 's'}`;
  return `MIDI connected: ${count(ports.inputs, 'input')}, ${count(ports.outputs, 'output')}.`;
}

export interface ConnectResult {
  readonly access: MidiAccess | null;
  readonly message: string;
}

/**
 * Connects, then adopts the output port and input already chosen
 * (`settings.outPortId`, `settings.inPortId`), reporting what was found or
 * why it couldn't connect.
 */
export async function connectMidi(
  connect: (onNote: NoteHandler) => Promise<MidiAccess | string>,
  onNote: NoteHandler,
  settings: ChosenPorts,
): Promise<ConnectResult> {
  const result = await connect(onNote);
  if (typeof result === 'string') return { access: null, message: result };
  adoptPorts(result, settings);
  return { access: result, message: portsMessage(result) };
}
