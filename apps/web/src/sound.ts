/**
 * What the sound card says and draws: the summary line of how this device
 * sounds (the built-in synth, and the MIDI setup's ports), and the levels of
 * its equalizer glyph. The card's numbers are read here, apart from the
 * component, so a test can hold each wording and each level.
 */

import { heardOf, type PortOption, type Setup } from '@yggi/webmidi/core';
import { PERFORMERS, type SoundingNotes } from './sounding.ts';

/** How much of the equalizer's height a bar at rest has, 0 to 1: a resting bar is still a bar. */
export const EQUALIZER_FLOOR = 0.15;

/** How many notes sounding at once make a bar full: a chord's three, and the drums' handful. */
const FULL_AT = 4;

/**
 * The equalizer's bars, one per performer in the tracks' order, from
 * `EQUALIZER_FLOOR` at rest to 1: a performer sounding lifts its bar, more
 * notes lift it more, and the master volume (a fader position, 0 to 1)
 * scales how far, so a fader at none is a flat row.
 */
export function equalizerLevels(sounding: SoundingNotes, volume: number): number[] {
  return PERFORMERS.map((performer) => {
    const presence = Math.min(1, sounding[performer].length / FULL_AT);
    return EQUALIZER_FLOOR + (1 - EQUALIZER_FLOOR) * presence * volume;
  });
}

export interface SoundSettings {
  readonly internal: boolean;
  /** The MIDI setup in use: its outputs, and what its inputs play (the inputs it hears, `heardOf`). */
  readonly setup: Setup;
}

/**
 * How this device sounds, in one line: "Synth · MIDI out Launchpad, in Keys",
 * the setup's outputs and the inputs it hears, each joined by "+". A port
 * chosen before that is not plugged in now is "not found".
 */
export function soundSummary(
  settings: SoundSettings,
  ports: { readonly inputs: readonly PortOption[]; readonly outputs: readonly PortOption[] },
  connected: boolean,
): string {
  const synth = settings.internal ? 'Synth' : 'Synth off';
  if (!connected) return `${synth} · MIDI not connected`;
  const named = (list: readonly PortOption[], chosen: PortOption) =>
    list.find((port) => port.id === chosen.id || (!!chosen.name && port.name === chosen.name))
      ?.name ?? (chosen.name ? `${chosen.name} not found` : 'not found');
  const outputs = settings.setup.outputs.filter((o) => o.id !== 'none');
  const heard = heardOf(settings.setup);
  const out = outputs.length
    ? `out ${outputs.map((o) => named(ports.outputs, o)).join(' + ')}`
    : null;
  const inn =
    heard === 'all'
      ? 'in all inputs'
      : heard.length
        ? `in ${heard.map((p) => named(ports.inputs, p)).join(' + ')}`
        : null;
  const midi = [out, inn].filter((part) => part !== null).join(', ');
  return `${synth} · ${midi ? `MIDI ${midi}` : 'MIDI connected, no ports chosen'}`;
}
