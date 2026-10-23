/**
 * The instruments a fragment's sound holes are filled from (yggi/cells#244,
 * cells v0.10.0): a seed rhythm strikes `&bd` and a seed bass line plays
 * through `&bassV`, and neither defines it, so neither compiles alone. Where
 * the band reads one (`readRhythm`, `readLine`), it adds the line that
 * defines each voice the text strikes and doesn't define, from cells' own
 * instrument fragments (`INSTRUMENT_FRAGMENTS`): the core kit first, then
 * the General MIDI kit (the bell's agogô), then `bass`. What is read is the
 * notes cells sends over MIDI (each hit's General MIDI drum note, each bass
 * note in the register `loop=C2` sets), which the instrument's sound doesn't
 * move.
 *
 * A text that defines a voice keeps its own (a groove filed before this pin
 * states `&bd s=white`), and one that strikes a voice no instrument defines
 * is left as it is, for the compile to name.
 */

import { INSTRUMENT_FRAGMENTS } from '@yggi/cells/repository/instruments';

/** The order the instrument fragments fill a voice in: the first that defines it gives its line. */
const INSTRUMENT_ORDER = ['core kit', 'gm kit', 'bass'];

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
