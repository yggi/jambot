/**
 * The instruments a fragment's sound holes are filled from (yggi/cells#244,
 * cells v0.10.0): a seed rhythm strikes `&bd` and a seed bass line plays
 * through `&bassV`, and neither defines it, so neither compiles alone. Where
 * the band reads one (`readRhythm`, `readLine`), it adds the line that
 * defines each voice the text strikes and doesn't define, from cells' own
 * instrument fragments (`INSTRUMENT_FRAGMENTS`): the General MIDI kit
 * first, `gm_kit` (the drums and the bell's agogô; cells v0.12 retired the
 * core kit into it, yggi/cells#338), then `bass`. What is read is the
 * notes cells sends over MIDI (each hit's General MIDI drum note, each bass
 * note in the register `loop=C2` sets), which the instrument's sound doesn't
 * move.
 *
 * A text that defines a voice keeps its own (a groove filed before this pin
 * states `&bd s=white`), and one that strikes a voice no instrument defines
 * is left as it is, for the compile to name. The performers' own instruments
 * (`bass`, `keys`, `pad`, `lead`) fill a hole before any other that defines
 * its voice: a preset's instrument is found by style (`instrumentsAt`).
 *
 * The instruments a section's performers play are part of its style
 * (#497): at the style's point, cells' query on the facet `instrument`
 * ranks them, and each performer's voice is the first that defines it
 * (`instrumentsAt`). At the eight presets that is the performer's own, which
 * holds a register and no sound, so the band sounds as the style colours it;
 * at Electro swing's point a clarinet, at Spooky's a theremin, each with a
 * sound of its own (yggi/cells#350) that the built-in synth plays. Every one
 * holds its default's register, so MIDI out sends the same notes.
 */

import type { Fragment } from '@yggi/cells/repository/fragments';
import { createRepository } from '@yggi/cells/repository/fragments';
import { INSTRUMENT_FRAGMENTS } from '@yggi/cells/repository/instruments';
import { type QueriedStyle, stylePoint } from './meter-query.ts';

/** The order the instrument fragments fill a voice in: the first that defines it gives its line. */
const INSTRUMENT_ORDER = ['gm_kit', 'bass', 'keys', 'pad', 'lead'];

/** The voice each pitched performer plays (cells' seed performers, decision 058), and the instrument it takes it from. */
export const PERFORMER_VOICES = {
  bass: { voice: 'bassV', own: 'bass' },
  pad: { voice: 'padV', own: 'pad' },
  stab: { voice: 'keysV', own: 'keys' },
  lead: { voice: 'leadV', own: 'lead' },
} as const;

/** A pitched performer: one of `PERFORMER_VOICES`. */
export type VoicedPart = keyof typeof PERFORMER_VOICES;

/** An instrument a performer plays in place of its own: the fragment's id and the line that defines the voice. */
export interface FoundInstrument {
  readonly id: string;
  readonly line: string;
}

const repositories = new WeakMap<readonly Fragment[], ReturnType<typeof createRepository>>();

/**
 * The instrument each pitched performer plays at a style's point, where it
 * isn't the performer's own: the first that defines the performer's voice in
 * cells' ranking on the facet `instrument`. A performer whose own instrument
 * ranks first is left out, and plays as its fragment says.
 */
export function instrumentsAt(
  style: QueriedStyle,
  fragments: readonly Fragment[] = INSTRUMENT_FRAGMENTS,
): Partial<Record<VoicedPart, FoundInstrument>> {
  let repository = repositories.get(fragments);
  if (!repository) repositories.set(fragments, (repository = createRepository(fragments)));
  const ranked = repository.query(stylePoint(style), fragments.length, {}, { facet: 'instrument' });
  const found: Partial<Record<VoicedPart, FoundInstrument>> = {};
  for (const [part, { voice, own }] of Object.entries(PERFORMER_VOICES) as [
    VoicedPart,
    (typeof PERFORMER_VOICES)[VoicedPart],
  ][]) {
    for (const { fragment } of ranked) {
      const line = fragment.text.split('\n').find((l) => l.startsWith(`&${voice} `));
      if (line === undefined) continue;
      if (fragment.id !== own) found[part] = { id: fragment.id, line };
      break;
    }
  }
  return found;
}

/** Each voice an instrument fragment defines, by its name, and the line that defines it. */
export const INSTRUMENT_LINES: ReadonlyMap<string, string> = (() => {
  const lines = new Map<string, string>();
  const ordered = [...INSTRUMENT_FRAGMENTS].sort(
    (a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id),
  );
  for (const fragment of ordered)
    for (const line of fragment.text.split('\n')) {
      const voice = /^&(\w+)\s/.exec(line)?.[1];
      if (voice !== undefined && !lines.has(voice)) lines.set(voice, line);
    }
  return lines;
})();

function rank(id: string): number {
  const at = INSTRUMENT_ORDER.indexOf(id);
  return at === -1 ? INSTRUMENT_ORDER.length : at;
}

/** The names a text defines: each line's first cell. */
const definedIn = (text: string): Set<string> =>
  new Set(text.split('\n').flatMap((line) => /^&(\w+)/.exec(line)?.[1] ?? []));

/** The names a text reads: every `&name` but those a line starts with. */
const readIn = (text: string): Set<string> =>
  new Set(
    text
      .split('\n')
      .flatMap((line) => [...line.replace(/^&\w+/, '').matchAll(/&(\w+)/g)].map((m) => m[1]!)),
  );

/** The line of each instrument voice a text reads and doesn't define, in the order the instruments write them. */
export function instrumentsFor(text: string): string[] {
  const defined = definedIn(text);
  const read = readIn(text);
  return [...INSTRUMENT_LINES].flatMap(([voice, line]) =>
    read.has(voice) && !defined.has(voice) ? [line] : [],
  );
}

/** A text with its instruments appended (`instrumentsFor`); the text itself where it lacks none. */
export function withInstruments(text: string): string {
  const lines = instrumentsFor(text);
  return lines.length ? `${text}\n${lines.join('\n')}` : text;
}
