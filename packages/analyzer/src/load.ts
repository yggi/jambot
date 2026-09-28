/**
 * The top of the parser's smallest slice (analyzer brief steps 1–2): load
 * and normalise a file's tracks, split it into meter spans, and quantise
 * every 4/4 span onto the step grid. Everything else — other meters, roles,
 * key, chords, encoding to score text — is later work (#3 steps 3–8), and
 * this stage only ever reports what it doesn't reach, never guesses at it.
 */
import { meterSpans, type TimeSignatureEvent } from './meter.ts';
import { quantiseSection, type SectionResult } from './swing.ts';
import type { TempoEvent } from './tempo.ts';
import { normaliseTracks, type RawTrack } from './tracks.ts';

/** A parsed Standard MIDI File, in the subset this package reads. Reading the bytes off disk is a loader outside this package. */
export interface RawMidi {
  readonly ppq: number;
  readonly tempos: readonly TempoEvent[];
  readonly timeSignatures: readonly TimeSignatureEvent[];
  readonly tracks: readonly RawTrack[];
}

/** How many notes fell in a span of a meter this stage doesn't quantise. */
export interface MeterCount {
  readonly numerator: number;
  readonly denominator: number;
  readonly noteCount: number;
}

export interface LoadResult {
  readonly droppedEmptyTracks: number;
  readonly droppedDuplicateTracks: number;
  readonly otherMeters: readonly MeterCount[];
  readonly sections: readonly SectionResult[];
  readonly confidence: number;
  readonly log: readonly string[];
}

/** Analyzer brief steps 1–2: load, normalise, and quantise every 4/4 span (A6). */
export function loadMidi(raw: RawMidi): LoadResult {
  const { tracks, droppedEmpty, droppedDuplicate } = normaliseTracks(raw.tracks);
  const notes = tracks.flatMap((track) => track.notes);
  const endTicks = notes.reduce((max, note) => Math.max(max, note.ticks + note.durationTicks), 0);
  const spans = meterSpans(raw.timeSignatures, endTicks);

  const log: string[] = [];
  if (droppedEmpty) log.push(`dropped ${droppedEmpty} empty track(s)`);
  if (droppedDuplicate) log.push(`dropped ${droppedDuplicate} duplicate track(s)`);

  const otherMeters = new Map<string, MeterCount>();
  const sections: SectionResult[] = [];
  for (const span of spans) {
    const inSpan = notes.filter(
      (note) => note.ticks >= span.startTicks && note.ticks < span.endTicks,
    );
    if (inSpan.length === 0) continue;
    if (span.isFourFour) {
      sections.push(quantiseSection(raw.ppq, span.startTicks, inSpan));
      continue;
    }
    const key = `${span.numerator}/${span.denominator}`;
    const found = otherMeters.get(key) ?? {
      numerator: span.numerator,
      denominator: span.denominator,
      noteCount: 0,
    };
    otherMeters.set(key, { ...found, noteCount: found.noteCount + inSpan.length });
    log.push(`${inSpan.length} note(s) in a ${key} span left unquantised (#122)`);
  }

  const confidence = sections.length
    ? sections.reduce((sum, section) => sum + section.confidence, 0) / sections.length
    : 0;

  return {
    droppedEmptyTracks: droppedEmpty,
    droppedDuplicateTracks: droppedDuplicate,
    otherMeters: [...otherMeters.values()],
    sections,
    confidence,
    log,
  };
}
