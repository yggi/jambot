/**
 * Reading names: notes, intervals, degrees, chords, scales and rhythms, in
 * their long and short forms, read as the theory's own things; and `nameOf`,
 * which writes a thing's name back.
 *
 * One name can have several readings: "C" is a note and a chord, "E7" is E in
 * octave 7 and E dominant seventh, "C major" is a chord and a scale.
 * `readings` lists them all; `read` returns the one reading and asks for a
 * kind in the context when there is more than one.
 *
 * A name and a thing are not inverses: a thing has many names. `nameOf` picks
 * one, so that `read(nameOf(x))` gives back x.
 */

import { CHORD_QUALITIES, parseChordQuality, qualityOf } from './chords.ts';
import { even } from './even.ts';
import { type Helix, compose, shift } from './helix.ts';
import {
  DEGREE_NAMES,
  GENERIC_INTERVALS,
  INTERVALS,
  type Interval,
  parseDegreeName,
  parseInterval,
} from './intervals.ts';
import { type Note, parseNote } from './notes.ts';
import { RHYTHMS, parseRhythm } from './rhythms.ts';
import { parseScale } from './scales.ts';
import { normalizeWords } from './words.ts';

export type ReadingKind = 'note' | 'interval' | 'degree' | 'chord' | 'scale' | 'rhythm';

export type Reading =
  | { kind: 'note'; note: Note }
  | { kind: 'interval'; generic: number; specific: number[] }
  | { kind: 'degree'; generic: number; specific: number[] }
  | { kind: 'chord'; root?: Note; quality: string; stack: readonly number[] }
  | { kind: 'scale'; tonic?: Note; name: string; helix: Helix }
  | { kind: 'rhythm'; helix: Helix };

export interface ReadContext {
  /** Picks one reading when a name has several. */
  kind?: ReadingKind;
  /** The scale that names like `dia` build their chord on. */
  scale?: Helix;
}

/**
 * Chords built on the scale in context rather than a fixed quality, as the
 * degrees they take: `dia` is every other degree, the triad of a 7-note scale.
 * The inner helix's cycle is the scale's number of degrees, so it builds on
 * any scale.
 */
const SCALE_CHORDS: Record<string, readonly number[]> = { dia: [0, 2, 4] };

/** Every reading of a name, in the order note, interval, degree, chord, scale, rhythm. */
export function readings(text: string, context: ReadContext = {}): Reading[] {
  const found: Reading[] = [];
  const note = parseNote(text);
  if (note) found.push({ kind: 'note', note });
  const interval = parseInterval(text);
  if (interval) found.push({ kind: 'interval', ...interval });
  const degree = parseDegreeName(text);
  if (degree) found.push({ kind: 'degree', ...degree });
  found.push(...chordReadings(text, context));
  found.push(...scaleReadings(text));
  const rhythm = parseRhythm(text);
  if (rhythm) found.push({ kind: 'rhythm', helix: rhythm });
  return context.kind ? found.filter((reading) => reading.kind === context.kind) : found;
}

/** The one reading of a name. Throws when there is none, or more than one. */
export function read<K extends ReadingKind>(
  text: string,
  context: ReadContext & { kind: K },
): Extract<Reading, { kind: K }>;
export function read(text: string, context?: ReadContext): Reading;
export function read(text: string, context: ReadContext = {}): Reading {
  const found = readings(text, context);
  if (found.length === 1) return found[0]!;
  if (found.length === 0) {
    if (normalizeWords(text) in SCALE_CHORDS && !context.scale)
      throw new Error(`"${text}" builds its chord on the scale in context, so it needs a scale`);
    const as = context.kind ? ` as a ${context.kind}` : '';
    throw new Error(`"${text}" has no reading${as}`);
  }
  const kinds = found.map((reading) => reading.kind).join(' or ');
  throw new Error(`"${text}" is ambiguous: ${kinds}. Pass a kind in the context.`);
}

/** The short name of a reading. Throws when it has none. */
export function nameOf(reading: Reading): string {
  const name = findName(reading);
  if (name === undefined) throw new Error(`nameOf: this ${reading.kind} has no name`);
  return name;
}

function findName(reading: Reading): string | undefined {
  switch (reading.kind) {
    case 'note':
      return spell(reading.note) + (reading.note.octave ?? '');
    case 'interval':
      return (
        Object.values(INTERVALS).find((named) => sameInterval(named, reading))?.symbols[0] ??
        Object.entries(GENERIC_INTERVALS).find(
          ([word, generic]) => generic === reading.generic && sameInterval(parse(word), reading),
        )?.[0]
      );
    case 'degree':
      return Object.entries(DEGREE_NAMES).find(([, named]) => sameInterval(named, reading))?.[0];
    case 'chord': {
      const quality = CHORD_QUALITIES[reading.quality];
      if (!quality) return undefined;
      const root = reading.root ? spell(reading.root) : '';
      const symbol = quality.symbols.find((s) => s !== '' || root !== '');
      return symbol === undefined ? [root, quality.words[0]].join(' ').trim() : root + symbol;
    }
    case 'scale':
      return reading.tonic ? `${spell(reading.tonic)} ${reading.name}` : reading.name;
    case 'rhythm': {
      const same = (helix: Helix) => helix.heights.join() === reading.helix.heights.join();
      const { cycle, heights } = reading.helix;
      const named = Object.entries(RHYTHMS).find(
        ([, rhythm]) => rhythm.helix.cycle === cycle && same(rhythm.helix),
      );
      if (named) return named[0];
      const [k, by] = [heights.length, heights[0] ?? 0];
      if (k === 0 || !same(even(k, cycle, by))) return undefined;
      return by === 0 ? `E(${k},${cycle})` : `E(${k},${cycle},${by})`;
    }
  }
}

const parse = (word: string) => parseInterval(word)!;

const sameInterval = (a: Interval, b: Interval) =>
  a.generic === b.generic && a.specific.join() === b.specific.join();

const SIGNS: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 0: '', 1: '#', 2: '##' };

/** A note's letter and accidental, without an octave. */
function spell(note: Note): string {
  return note.letter + SIGNS[note.alteration]!;
}

/** A root without octave, then a quality: "G7", "Bbmaj7", "F sharp minor seventh", or a quality alone. */
function chordReadings(text: string, context: ReadContext): Reading[] {
  const trimmed = text.trim();
  const built = SCALE_CHORDS[normalizeWords(trimmed)];
  if (built !== undefined) {
    if (!context.scale) return [];
    const inner = { cycle: context.scale.heights.length, heights: built };
    const { heights } = compose(inner, context.scale);
    const stack = heights.map((x) => x - heights[0]!);
    return [{ kind: 'chord', quality: qualityOf(stack) ?? trimmed, stack }];
  }
  const found: Reading[] = [];
  const seen = new Set<string>();
  for (let split = 0; split <= trimmed.length; split++) {
    const rootText = trimmed.slice(0, split);
    const qualityText = trimmed.slice(split);
    const root = rootText === '' ? undefined : parseNote(rootText);
    if (rootText !== '' && (!root || root.octave !== undefined)) continue;
    if (!root && qualityText.trim() === '') continue;
    const quality = parseChordQuality(qualityText);
    if (quality === undefined) continue;
    const identity = `${root?.letter}${root?.alteration}:${quality}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const stack = CHORD_QUALITIES[quality]!.stack;
    found.push(root ? { kind: 'chord', root, quality, stack } : { kind: 'chord', quality, stack });
  }
  return found;
}

/**
 * An optional tonic without octave, then a scale or a numbered mode of one:
 * "C blues", "D dorian", "major", "A harmonic minor 5". A colon may stand for
 * the space, as keys are written in the score ("Db:major"). The tonic moves
 * the helix: D dorian's degree 0 stands at 2.
 */
function scaleReadings(text: string): Reading[] {
  const trimmed = text.trim().replace(/^([^:]+):\s*/, '$1 ');
  const whole = parseScale(trimmed);
  if (whole) return [{ kind: 'scale', ...whole }];
  for (let split = trimmed.indexOf(' '); split > 0; split = trimmed.indexOf(' ', split + 1)) {
    const tonic = parseNote(trimmed.slice(0, split));
    const scale = parseScale(trimmed.slice(split + 1));
    if (tonic && tonic.octave === undefined && scale)
      return [
        { kind: 'scale', tonic, name: scale.name, helix: shift(scale.helix, tonic.pitchClass) },
      ];
  }
  return [];
}
