/**
 * What the sound card says and draws: the summary line of how this device
 * sounds (the built-in synth, and the MIDI ports chosen), and the levels of
 * its equalizer glyph. The card's numbers are read here, apart from the
 * component, so a test can hold each wording and each level.
 */

import type { PortOption } from '@yggi/webmidi/core';
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
  readonly outPortId: string;
  readonly inPortId: string;
}

/**
 * How this device sounds, in one line: "Synth · MIDI out Launchpad, in Keys".
 * A port chosen before that is not plugged in now is "not found".
 */
export function soundSummary(
  settings: SoundSettings,
  ports: { readonly inputs: readonly PortOption[]; readonly outputs: readonly PortOption[] },
  connected: boolean,
): string {
  const synth = settings.internal ? 'Synth' : 'Synth off';
  if (!connected) return `${synth} · MIDI not connected`;
  const named = (list: readonly PortOption[], id: string) =>
    list.find((port) => port.id === id)?.name ?? 'not found';
  const out =
    settings.outPortId === 'none' ? null : `out ${named(ports.outputs, settings.outPortId)}`;
  const inn =
    settings.inPortId === 'none'
      ? null
      : `in ${settings.inPortId === 'all' ? 'all inputs' : named(ports.inputs, settings.inPortId)}`;
  const midi = [out, inn].filter((part) => part !== null).join(', ');
  return `${synth} · ${midi ? `MIDI ${midi}` : 'MIDI connected, no ports chosen'}`;
}
