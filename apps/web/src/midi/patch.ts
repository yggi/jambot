/**
 * The band's patch, read off webmidi's book of setups (yggi/webmidi decision
 * 002): the rows Jambot hands the patch matrix, what the band sends to each
 * output of the setup in use, where a note played is passed on, and which
 * inputs are listened to. Pure: the book is plain data, and the ports come in.
 *
 * Jambot's routes are the context `band`. Its rows are the five parts, then
 * the keys' row (`KEYS`: the on-screen and computer keys), and webmidi's
 * matrix adds the inputs (`in:<port name>`) and the clock after them. A
 * crossing is a channel 1–16, or for an input `AS_PLAYED` (0): the channel
 * the note came in on.
 */

import type { Part } from '@jambot/engine';
import {
  ANY_INPUT,
  AS_PLAYED,
  DEFAULT_PROFILE,
  KEYS,
  type DeviceProfile,
  type MidiPort,
  type PortOption,
  type Routes,
  type Setup,
  type SetupBook,
  type SetupOutput,
  activeSetup,
  inputRow,
  profileOf,
  withProfile,
} from '@yggi/webmidi/core';
import type { MatrixRow } from '@yggi/webmidi/ui';
import type { DrumNotes, PartChannels } from '../audio/midi-out.ts';
import { drumNotesOf } from './drums.ts';

/** Jambot's context in a setup's routes. */
export const BAND = 'band';

/**
 * The parts, in the order the store before the book kept their channels:
 * `MidiOut` silences its channels in this order, so a migrated store sends
 * its all-notes-off as it did.
 */
export const BAND_PARTS = [
  'lead',
  'bass',
  'pad',
  'stab',
  'drums',
] as const satisfies readonly Part[];

/** The rows Jambot hands the matrix: the parts, then the keys. Seats (#108) would be more rows of the same kind. */
export const BAND_ROWS: readonly MatrixRow[] = [
  { id: 'lead', label: 'Lead', kind: 'voice' },
  { id: 'bass', label: 'Bass', kind: 'voice' },
  { id: 'pad', label: 'Pad', kind: 'voice' },
  { id: 'stab', label: 'Stab', kind: 'voice' },
  { id: 'drums', label: 'Drums', kind: 'kit' },
  { id: KEYS, label: 'Keys', sub: 'you play', kind: 'voice', group: true },
];

/** A value kept under a key of its own (a row named `__proto__` is none). */
const own = <T>(o: Readonly<Record<string, T>>, key: string): T | undefined =>
  Object.hasOwn(o, key) ? o[key] : undefined;

const bandRoutesOf = (setup: Setup): Routes => own(setup.routes, BAND) ?? {};

/** What the band sends to one output of the setup in use. */
export interface BandRoute {
  /** The output's key in the setup. */
  readonly key: string;
  /** Its port now, or null: no device, not plugged in, or not connected. */
  readonly port: MidiPort | null;
  /** The channel each part goes out on here; a part not routed here is absent. */
  readonly channels: PartChannels;
  /** The note each drum sound goes out as, by the device's map. */
  readonly drumNotes: DrumNotes;
  /** Whether it is sent MIDI clock, Start and Stop: the clock row's crossing. */
  readonly clock: boolean;
  /** How much earlier it is sent, in ms: its device's latency. */
  readonly latency: number;
}

/** Each output of the setup in use, as the band sends to it: `portOf` gives the port an output resolves to now. */
export function bandRoutes(
  book: SetupBook,
  portOf: (output: SetupOutput) => MidiPort | null,
): BandRoute[] {
  const setup = activeSetup(book);
  const routes = bandRoutesOf(setup);
  return setup.outputs.map((output) => {
    const channels: Partial<Record<Part, number>> = {};
    for (const part of BAND_PARTS) {
      const crossings = own(routes, part);
      const channel = crossings && own(crossings, output.key);
      if (channel !== undefined && channel >= 1 && channel <= 16) channels[part] = channel;
    }
    const profile = profileOf(book, output.name);
    return {
      key: output.key,
      port: output.id === 'none' ? null : portOf(output),
      channels,
      drumNotes: drumNotesOf(profile.drums),
      clock: setup.clock.includes(output.key),
      latency: profile.latency,
    };
  });
}

/** Whether the setup in use hears an input, by the name its notes come with: its notes reach the Muse and the instruments. */
export const isHeard = (setup: Setup, source: string): boolean =>
  setup.heard === 'all' || setup.heard.some((port) => inputRow(port) === `in:${source}`);

/** The rows a note from an input is sent from: its own, and every input's (`ANY_INPUT`) when it is heard. */
export const rowsOfInput = (setup: Setup, source: string): string[] =>
  isHeard(setup, source) ? [`in:${source}`, ANY_INPUT] : [`in:${source}`];

/** Where a note is passed on: an output's key, and the channel as a status byte's nibble, 0–15. */
export interface Forward {
  readonly key: string;
  readonly channel: number;
}

/**
 * Where a note from `rows` is passed on in the setup in use: each output a
 * row crosses, once, by the first row that does, on the crossing's channel,
 * or for `AS_PLAYED` on `played` (the nibble it came in on).
 */
export function forwardsOf(setup: Setup, rows: readonly string[], played: number): Forward[] {
  const routes = bandRoutesOf(setup);
  const sent = new Map<string, number>();
  for (const row of rows) {
    const crossings = own(routes, row);
    if (!crossings) continue;
    for (const output of setup.outputs) {
      const crossing = own(crossings, output.key);
      if (crossing === undefined || sent.has(output.key)) continue;
      sent.set(output.key, crossing === AS_PLAYED ? played & 15 : (crossing - 1) & 15);
    }
  }
  return [...sent].map(([key, channel]) => ({ key, channel }));
}

/** The inputs the setup in use wants: every one heard and every one routed, by row (`in:<name>`), or all. */
function wantedInputs(setup: Setup): 'all' | Set<string> {
  if (setup.heard === 'all') return 'all';
  const rows = new Set(setup.heard.map(inputRow));
  for (const [row, crossings] of Object.entries(bandRoutesOf(setup)))
    if (row.startsWith('in:') && row !== ANY_INPUT && Object.keys(crossings).length) rows.add(row);
  return rows;
}

/** Whether the setup in use hears or routes any input, plugged in or not. */
export const wantsInputs = (setup: Setup): boolean => {
  const wanted = wantedInputs(setup);
  return wanted === 'all' || wanted.size > 0;
};

/**
 * Which inputs to listen to, as webmidi's connection takes it (an id,
 * `'all'` or `'none'`): every input heard and every input routed. One input
 * is listened to alone, so no other port is opened, and none while it isn't
 * plugged in (the device listens again when the ports change, and finds it by
 * name); more are listened to all, and what isn't heard or routed is let go by
 * the page.
 */
export function listenTo(setup: Setup, inputs: readonly PortOption[]): string {
  const wanted = wantedInputs(setup);
  if (wanted === 'all') return 'all';
  if (wanted.size === 0) return 'none';
  if (wanted.size > 1) return 'all';
  const [row] = wanted;
  return inputs.find((port) => inputRow(port) === row)?.id ?? 'none';
}

/** How many of the setup's devices aren't plugged in, by id or by name as webmidi finds them. */
export const missingOutputs = (setup: Setup, plugged: readonly PortOption[]): number =>
  setup.outputs.filter(
    (o) =>
      o.id !== 'none' && !plugged.some((p) => p.id === o.id || (!!o.name && p.name === o.name)),
  ).length;

/** The channels the band and the keys send on to an output, for the inspector's meter. */
export const channelsTo = (setup: Setup, key: string): number[] => [
  ...new Set(
    Object.values(bandRoutesOf(setup)).flatMap((crossings) => {
      const channel = own(crossings, key);
      return channel !== undefined && channel > 0 ? [channel] : [];
    }),
  ),
];

/** Whether the drums are routed to an output, so its drum map matters. */
export const drumsTo = (setup: Setup, key: string): boolean => {
  const drums = own(bandRoutesOf(setup), 'drums');
  return !!drums && own(drums, key) !== undefined;
};

/**
 * A device's profile changed: by its port's name, or, for an output kept by
 * id alone (a store migrated before its ports were seen), the book's
 * defaults, which a device with none of its own takes.
 */
export function withOutputProfile(
  book: SetupBook,
  output: SetupOutput,
  change: Partial<DeviceProfile>,
): SetupBook {
  if (output.name) return withProfile(book, output.name, change);
  const defaults = profileOf(withProfile(book, '', change), '');
  return { ...book, defaults };
}

/**
 * The ports a book keeps by id alone given their names, now that the ports
 * plugged in say them: Jambot's store before the book kept no names, so its
 * migration (webmidi's `fromJambot`) is made before any port is seen. An
 * output named takes the defaults as its device's profile where it has none
 * (they hold the drum map migrated), and an input named moves its rows' routes to
 * its name, so the book is as `fromJambot` would have made it with the ports
 * known. Not a person's change, so no custom variant: the same book when
 * there is nothing to name.
 */
export function nameByPorts(
  book: SetupBook,
  ports: { readonly inputs: readonly PortOption[]; readonly outputs: readonly PortOption[] },
): SetupBook {
  let changed = false;
  const devices: Record<string, DeviceProfile> = { ...book.devices };
  let moved = false;
  const nameOf = (list: readonly PortOption[], port: PortOption) =>
    port.name || port.id === 'none' || port.id === 'all'
      ? port.name
      : (list.find((p) => p.id === port.id)?.name ?? '');
  const setups = book.setups.map((setup) => {
    const outputs = setup.outputs.map((output) => {
      const name = nameOf(ports.outputs, output);
      if (name === output.name) return output;
      changed = true;
      if (name && !Object.hasOwn(devices, name)) {
        devices[name] = book.defaults;
        moved = true;
      }
      return { ...output, name };
    });
    const renamed = new Map<string, string>();
    const heard =
      setup.heard === 'all'
        ? setup.heard
        : setup.heard.map((port) => {
            const name = nameOf(ports.inputs, port);
            if (name === port.name) return port;
            changed = true;
            renamed.set(inputRow(port), inputRow({ ...port, name }));
            return { ...port, name };
          });
    const routes = renamed.size
      ? Object.fromEntries(
          Object.entries(setup.routes).map(([context, rows]) => [
            context,
            Object.fromEntries(
              Object.entries(rows).map(([row, c]) => [renamed.get(row) ?? row, c]),
            ),
          ]),
        )
      : setup.routes;
    return { ...setup, outputs, heard, routes };
  });
  if (!changed) return book;
  return { ...book, devices, defaults: moved ? DEFAULT_PROFILE : book.defaults, setups };
}
