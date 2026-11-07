/**
 * The band's patch, read off webmidi's book of setups (yggi/webmidi decisions
 * 002 and 003): the rows Jambot hands the patch matrix, what the band sends to
 * each output of the setup in use, and the part an input plays. Where a note
 * is passed on and which inputs are listened to are webmidi's
 * (`forwardsOfInput`, `listenOf`). Pure: the book is plain data, and the
 * ports come in.
 *
 * Jambot's routes are the context `band`. Its rows are the five parts, then
 * the keys' row (`KEYS`: the on-screen and computer keys), and webmidi's
 * matrix adds the inputs (`in:<port name>`) and the clock after them. A
 * crossing is a channel 1–16, or for an input `AS_PLAYED` (0): the channel
 * the note came in on.
 */

import { DRUM_NOTES, type DrumSound, type Part } from '@jambot/engine';
import {
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
  listenOf,
  namePorts,
  playsOf,
  profileOf,
  withProfile,
} from '@yggi/webmidi/core';
import type { MatrixRow } from '@yggi/webmidi/ui';
import type { DrumNotes, PartChannels } from '../audio/midi-out.ts';
import { partOf } from './routing.ts';

/** A part a person plays along on: any of the band's, as the player takes them (#564). */
type AlongPart = Part;
import { DRUM_SOUNDS, drumNotesOf } from './drums.ts';

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

/** How each drum sound is named in the matrix. */
export const DRUM_LABELS: Record<DrumSound, string> = {
  kick: 'Kick',
  rim: 'Rim',
  snare: 'Snare',
  clap: 'Clap',
  closedHat: 'Closed hat',
  pedalHat: 'Pedal hat',
  openHat: 'Open hat',
  ride: 'Ride',
};

/**
 * The rows Jambot hands the matrix: the parts with their roles (what an input
 * that plays one finds it by, and what a preset assigns: yggi/webmidi decision
 * 003), the drum sounds as the kit's members (each output's drum map edited
 * there, note by note), then the keys. An input can play any part (`ALONG`,
 * #564); the keys' row is not one to play (`playable: false`).
 * Seats (#108) would be more rows of the same kind.
 */
export const BAND_ROWS: readonly MatrixRow[] = [
  { id: 'lead', label: 'Lead', kind: 'voice', role: 'lead' },
  { id: 'bass', label: 'Bass', kind: 'voice', role: 'bass' },
  { id: 'pad', label: 'Pad', kind: 'voice', role: 'pad' },
  { id: 'stab', label: 'Stab', kind: 'voice', role: 'stab' },
  { id: 'drums', label: 'Drums', kind: 'kit', role: 'drums' },
  ...DRUM_SOUNDS.map((sound): MatrixRow => ({
    id: `drum:${sound}`,
    label: DRUM_LABELS[sound],
    kind: 'member',
    note: DRUM_NOTES[sound],
  })),
  { id: KEYS, label: 'Keys', sub: 'you play', kind: 'voice', group: true, playable: false },
];

/** The parts an input can play along on: each of the band's, as the player takes them (`AlongPart`, #564). */
const ALONG: readonly { id: AlongPart; role: AlongPart }[] = BAND_PARTS.map((part) => ({
  id: part,
  role: part,
}));

/**
 * The part a note from an input plays (yggi/webmidi#43): the part the setup
 * in use says it plays, by its port's name; playing the default, by its
 * channel, as before (`partOf`: channel 10 the drums, any other the lead);
 * not heard, null, so neither the Muse nor the instruments take it.
 */
export function partPlayed(book: SetupBook, source: string, channel: number): AlongPart | null {
  const plays = playsOf(book, `in:${source}`, ALONG);
  if (plays === null) return null;
  return plays === 'default' ? partOf(channel) : (plays as AlongPart);
}

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

/** Whether the setup in use wants an input at all, heard or routed, plugged in or not: so a load connects again. */
export const wantsInputs = (setup: Setup): boolean => {
  const listen = listenOf(setup);
  return listen === 'all' || listen.length > 0;
};

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
 * migration (webmidi's `fromJambot`) is made before any port is seen.
 * webmidi's `namePorts` names the outputs and the inputs' rows; an output
 * named here also takes the defaults as its device's profile where it has
 * none (they hold the drum map migrated), so the book is as `fromJambot`
 * would have made it with the ports known. Not a person's change, so no
 * custom variant: the same book when there is nothing to name.
 */
export function nameByPorts(
  book: SetupBook,
  ports: { readonly inputs: readonly PortOption[]; readonly outputs: readonly PortOption[] },
): SetupBook {
  const named = namePorts(book, ports);
  if (named === book) return book;
  const fresh = new Set<string>();
  named.setups.forEach((setup, i) =>
    setup.outputs.forEach((output, j) => {
      const before = book.setups[i]?.outputs[j];
      if (output.name && before && !before.name && !Object.hasOwn(book.devices, output.name))
        fresh.add(output.name);
    }),
  );
  if (!fresh.size) return named;
  const devices = {
    ...named.devices,
    ...Object.fromEntries([...fresh].map((name) => [name, book.defaults])),
  };
  return { ...named, devices, defaults: DEFAULT_PROFILE };
}

/**
 * The ports plugged in, one per name, and each name more than one port has,
 * with how many. The book keeps an input by its name (`in:<name>`), so ports
 * under one name are routed and heard alike, and Android names a device's
 * every port after the device; handed to the matrix twice, one name would be
 * a row twice, which a keyed list refuses by throwing.
 */
export function onePerName(ports: readonly PortOption[]): {
  readonly ports: PortOption[];
  readonly shared: { readonly name: string; readonly count: number }[];
} {
  const named = (port: PortOption) => port.name || port.id;
  const counts = new Map<string, number>();
  for (const port of ports) counts.set(named(port), (counts.get(named(port)) ?? 0) + 1);
  return {
    ports: ports.filter((port, i) => ports.findIndex((p) => named(p) === named(port)) === i),
    shared: [...counts].filter(([, count]) => count > 1).map(([name, count]) => ({ name, count })),
  };
}
