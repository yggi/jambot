/**
 * Lookup by name: notes, intervals, chords, scales and rhythms, in their long
 * and short forms, resolved to the theory's own representations.
 *
 * One name can have several readings: "C" is a note and a chord, "E7" is E in
 * octave 7 and E dominant seventh, "C major" is a chord and a scale.
 * `readings` lists them all; `lookup` returns the one reading and asks for a
 * kind in the context when there is more than one.
 */

import { CHORD_QUALITIES, parseChordQuality, qualityOf, stack } from './chords.ts';
import { normalizeWords, parseInterval } from './intervals.ts';
import { type Note, parseNote } from './notes.ts';
import { parseRhythm } from './rhythms.ts';
import { SCALES, parseScaleName } from './scales.ts';

export type Kind = 'note' | 'interval' | 'chord' | 'scale' | 'rhythm';

export type Reading =
  | { kind: 'note'; note: Note }
  | { kind: 'interval'; steps: number; semitones: number[] }
  | { kind: 'chord'; root?: Note; quality: string; intervals: readonly number[] }
  | { kind: 'scale'; tonic?: Note; name: string; set: readonly number[] }
  | { kind: 'rhythm'; steps: number; onsets: number[] };

export interface LookupContext {
  /** Picks one reading when a name has several. */
  kind?: Kind;
  /** The scale that names like `dia` stack their chord from. */
  scale?: readonly number[];
}

/** Chords that are a way of stacking the scale in context rather than a fixed quality. */
const STACKED_CHORDS: Record<string, number> = { dia: 3 };

/** Every reading of a name, in the order note, interval, chord, scale, rhythm. */
export function readings(text: string, context: LookupContext = {}): Reading[] {
  const found: Reading[] = [];
  const note = parseNote(text);
  if (note) found.push({ kind: 'note', note });
  const interval = parseInterval(text);
  if (interval) found.push({ kind: 'interval', ...interval });
  found.push(...chordReadings(text, context));
  found.push(...scaleReadings(text));
  const rhythm = parseRhythm(text);
  if (rhythm) found.push({ kind: 'rhythm', ...rhythm });
  return context.kind ? found.filter((reading) => reading.kind === context.kind) : found;
}

/** The one reading of a name. Throws when there is none, or more than one. */
export function lookup(text: string, context: LookupContext = {}): Reading {
  const found = readings(text, context);
  if (found.length === 1) return found[0]!;
  if (found.length === 0) {
    if (normalizeWords(text) in STACKED_CHORDS && !context.scale)
      throw new Error(`"${text}" stacks the scale in context, so it needs a scale`);
    const as = context.kind ? ` as a ${context.kind}` : '';
    throw new Error(`"${text}" has no reading${as}`);
  }
  const kinds = found.map((reading) => reading.kind).join(' or ');
  throw new Error(`"${text}" is ambiguous: ${kinds}. Pass a kind in the context.`);
}

/** A root without octave, then a quality: "G7", "Bbmaj7", "F sharp minor seventh", or a quality alone. */
function chordReadings(text: string, context: LookupContext): Reading[] {
  const trimmed = text.trim();
  const stacked = STACKED_CHORDS[normalizeWords(trimmed)];
  if (stacked !== undefined) {
    if (!context.scale) return [];
    const intervals = stack(context.scale, 0, stacked);
    return [{ kind: 'chord', quality: qualityOf(intervals) ?? trimmed, intervals }];
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
    const intervals = CHORD_QUALITIES[quality]!.intervals;
    found.push(
      root ? { kind: 'chord', root, quality, intervals } : { kind: 'chord', quality, intervals },
    );
  }
  return found;
}

/** An optional tonic without octave, then a scale name: "C blues", "D dorian", "major". */
function scaleReadings(text: string): Reading[] {
  const trimmed = text.trim();
  const whole = parseScaleName(trimmed);
  if (whole) return [{ kind: 'scale', name: whole, set: SCALES[whole]!.set }];
  for (let split = trimmed.indexOf(' '); split > 0; split = trimmed.indexOf(' ', split + 1)) {
    const tonic = parseNote(trimmed.slice(0, split));
    const name = parseScaleName(trimmed.slice(split + 1));
    if (tonic && tonic.octave === undefined && name)
      return [{ kind: 'scale', tonic, name, set: SCALES[name]!.set }];
  }
  return [];
}
