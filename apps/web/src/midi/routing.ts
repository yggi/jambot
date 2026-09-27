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
  /** The Muse (#2) reads captured notes from here; this only feeds it. */
  readonly humanNoteOn: (note: number, velocity: number, source: string, seconds: number) => void;
  readonly playing: () => boolean;
  /** A `performance.now()`-relative timestamp, as seconds on the player's clock. */
  readonly toOutputSeconds: (performanceMs: number) => number;
  readonly thru: () => boolean;
  readonly thruPort: () => MidiPort | null;
  readonly thruChannel: () => number;
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
  if (on && deps.playing())
    deps.humanNoteOn(note, velocity, source, deps.toOutputSeconds((deps.now ?? performance.now)()));
  if (deps.thru()) {
    const channel = nibble(deps.thruChannel());
    deps.thruPort()?.send(on ? [0x90 | channel, note, velocity] : [0x80 | channel, note, 0]);
  }
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
  settings: { readonly outPortId: string; readonly inPortId: string; outPort: MidiPort | null },
): Promise<ConnectResult> {
  const result = await connect(onNote);
  if (typeof result === 'string') return { access: null, message: result };
  settings.outPort = settings.outPortId === 'none' ? null : result.outputPort(settings.outPortId);
  result.listen(settings.inPortId);
  const { inputs, outputs } = result;
  const message = `MIDI connected: ${inputs.length} input${inputs.length === 1 ? '' : 's'}, ${outputs.length} output${outputs.length === 1 ? '' : 's'}.`;
  return { access: result, message };
}
