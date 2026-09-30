/**
 * Reading chords from notes, and `harm` from the chords (#15, the critic).
 *
 * `harm` is the one axis the notes say only through the chords: how often
 * they change and how rich they are. So there are two steps. The first
 * reads a bar's chords back from what the comp sounds, a root and a quality
 * for each half of the bar, since a theme's chord starts on step 0 or 8. The
 * second turns those chords into a number. The first is the analyzer's chord
 * stage in miniature (brief, stage 5), and is tested on the composer's own
 * chords (E25) before anything is read from it.
 *
 * A chord is the pitch classes the pad and stab sound in its half, matched
 * to the named qualities (`CHORD_QUALITIES`): a quality holds when every
 * sounding pitch class is one of its tones and at most its fifth is missing,
 * as the comp drops the fifth of a ninth. The bass settles the root where the
 * notes leave it open. A stab on the last two steps is left out: it
 * anticipates the next bar's chord.
 *
 * Pure: it counts pitch classes and knows no clock, file or key.
 */

import { CHORD_QUALITIES } from '@jambot/theory';
import type { Sounding } from './style-reading.ts';

/** A chord as the notes say it: the pitch class of its root, and the name of its quality. */
export interface ReadChord {
  readonly root: number;
  readonly quality: string;
}

/** The comp's notes count from step 0 of a half to this step, not the anticipated chord. */
const ANTICIPATION_FROM = 14;
const HALF = 8;

/** A reading needs a pitch, which a `Sounding` lacks. */
type Pitched = Sounding & { readonly note: number };

const pc = (note: number) => ((note % 12) + 12) % 12;

/** The qualities a chord can be read as: the named ones, but the harmonic series. */
const QUALITIES = Object.entries(CHORD_QUALITIES)
  .filter(([name]) => name !== 'harmonics')
  .map(([name, { stack }]) => ({
    name,
    tones: new Set(stack.map((x) => x % 12)),
    size: stack.length,
  }));

/**
 * The chord a set of pitch classes is: every root (the bass's first) against
 * every quality that holds it. The fewest tones missing wins, so a triad is
 * not read as a sixth chord without its fifth; then the bass's root, then the
 * largest quality.
 */
function chordOf(pcs: ReadonlySet<number>, bass: number | null): ReadChord | null {
  const roots = [
    ...(bass !== null && pcs.has(bass) ? [bass] : []),
    ...[...pcs].filter((r) => r !== bass),
  ];
  let best: { chord: ReadChord; missing: number; size: number; order: number } | null = null;
  roots.forEach((root, order) => {
    const offsets = new Set([...pcs].map((x) => pc(x - root)));
    for (const { name, tones, size } of QUALITIES) {
      if ([...offsets].some((x) => !tones.has(x))) continue;
      const absent = [...tones].filter((x) => !offsets.has(x));
      if (absent.some((x) => x !== 7)) continue;
      const found = { chord: { root, quality: name }, missing: absent.length, size, order };
      if (
        !best ||
        found.missing < best.missing ||
        (found.missing === best.missing &&
          (found.order < best.order || (found.order === best.order && found.size > best.size)))
      )
        best = found;
    }
  });
  return best ? (best as { chord: ReadChord }).chord : null;
}

/**
 * The chord in each half of a bar, from the pad and stab, null where none
 * sounds or the notes are none. A half with no new notes of its own holds the
 * chord before it.
 */
export function readChords(notes: readonly (Sounding & { note?: number })[]): (ReadChord | null)[] {
  const pitched = notes.filter((n): n is Pitched => n.note !== undefined);
  const chords: (ReadChord | null)[] = [];
  for (const half of [0, 1]) {
    const inHalf = (n: Pitched) => Math.floor(n.step / HALF) === half;
    const comp = pitched.filter(
      (n) => (n.part === 'pad' || n.part === 'stab') && inHalf(n) && n.step < ANTICIPATION_FROM,
    );
    if (comp.length === 0) {
      chords.push(half === 1 ? (chords[0] ?? null) : null);
      continue;
    }
    const bass = pitched
      .filter((n) => n.part === 'bass' && inHalf(n))
      .sort((a, b) => a.step - b.step)[0];
    chords.push(chordOf(new Set(comp.map((n) => pc(n.note))), bass ? pc(bass.note) : null));
  }
  return chords;
}

/** What `readHarm` found: the reading, and the chords it read it from. */
export interface HarmReading {
  readonly harm: number;
  readonly chords: readonly ReadChord[];
}

/** Changes per bar at which the rate is full: a chord to a chord in each half of the bar. */
const FULL_RATE = 2;

/** How many tones a quality has: a triad 3, a seventh 4, a ninth 5. */
const sizeOf = (quality: string) => CHORD_QUALITIES[quality]!.stack.length;

/**
 * The `harm` a bar's chords read as: the mean of two shares, each 0 to 1.
 * The rate is the chord changes in the bar (from the chord before it, if
 * given) over `FULL_RATE`. The richness is the mean of how far each chord's
 * tones run past a triad: a triad 0, a seventh a half, a ninth a whole.
 * Absent where no chord is read.
 */
export function readHarm(
  notes: readonly (Sounding & { note?: number })[],
  previous?: ReadChord,
): HarmReading | undefined {
  const chords = readChords(notes).filter((c): c is ReadChord => c !== null);
  if (chords.length === 0) return undefined;
  const line = previous ? [previous, ...chords] : chords;
  const changes = line
    .slice(1)
    .filter((c, i) => c.root !== line[i]!.root || c.quality !== line[i]!.quality);
  const rate = Math.min(1, changes.length / FULL_RATE);
  const richness =
    chords.reduce((sum, c) => sum + Math.min(1, (sizeOf(c.quality) - 3) / 2), 0) / chords.length;
  return { harm: (rate + richness) / 2, chords };
}
