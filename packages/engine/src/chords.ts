/**
 * Chords: what a bar's theme slots sound as, in the section's key.
 *
 * A slot on a degree is stacked thirds on that degree of the key: a triad
 * at low harmony, a seventh as harmony rises past 0.25 (all of them from
 * 0.75), and above 0.75 sometimes a ninth, a tension over the seventh
 * (#38), where the key gives a major one. A slot toward a degree is its
 * secondary dominant, a dominant seventh a fifth above it, sometimes with
 * its ninth. In aeolian and dorian a dominant before the tonic is raised to
 * major above harmony 0.4, as harmonic minor does.
 *
 * Whether a chord takes its seventh and ninth is drawn once per theme, bar
 * and slot, so raising the harmony only adds tones, and a theme that returns
 * brings its chords back. These are the prototype's rules.
 */

import {
  type Chord,
  type Note,
  compose,
  formatNumeral,
  heightOf,
  joinChord,
  type Meter,
  nameOf,
  numeralOf,
  qualityOf,
  spell,
  spelledTonic,
  stepsOf,
  wrap,
} from '@jambot/theory';
import { type Key, keyHelix } from './key.ts';
import { chance, draw } from './random.ts';
import type { Slot, Theme } from './themes.ts';

export interface ChordEnv {
  readonly seed: number;
  readonly barInSection: number;
  readonly key: Key;
  readonly theme: Theme;
  /** The harmony it is coloured at: where the bar before it starts (`band.ts`). */
  readonly harm: number;
}

export interface BarChord {
  /** The theme's slot it sounds: its step, and its degree or the degree it leads to. */
  readonly slot: Slot;
  /** A dominant raised to major before the tonic: the one degree chord outside the key. */
  readonly raised: boolean;
  /** Heights in the key's register: the root within a turn above the tonic. */
  readonly chord: Chord;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** The chords of one bar, one per slot of the theme's bar. */
export function barChords({ seed, barInSection, key, theme, harm }: ChordEnv): BarChord[] {
  const scale = keyHelix(key);
  const slots = theme.bars[barInSection]!;
  const seventh = smooth((harm - 0.25) / 0.5);
  const ninth = clamp01((harm - 0.75) / 0.25) * 0.7;
  const color = (slot: number, which: number) =>
    draw(seed, 'chordColor', theme.index, barInSection, slot, which);

  return slots.map((slot, j) => {
    const withNinth = chance(color(j, 1), ninth);
    if ('dominantOf' in slot) {
      const target = heightOf(scale, slot.dominantOf);
      const root = scale.heights[0]! + wrap(target + 7 - scale.heights[0]!, 12);
      return {
        slot,
        raised: false,
        chord: {
          helix: { cycle: 12, heights: [root, root + 4, root + 7, root + 10] },
          tensions: withNinth ? [root + 14] : [],
        },
      };
    }
    const d = slot.degree;
    const size = chance(color(j, 0), seventh) ? 4 : 3;
    const heights = compose(
      { cycle: 7, heights: [d, d + 2, d + 4, d + 6].slice(0, size) },
      scale,
    ).heights;
    const root = heights[0]!;
    const next = j + 1 < slots.length ? slots[j + 1]! : theme.bars[barInSection + 1]?.[0];
    const nextDegree = next === undefined ? 0 : 'degree' in next ? next.degree : null;
    const minor = key.mode === 'aeolian' || key.mode === 'dorian';
    if (minor && d === 4 && nextDegree === 0 && harm > 0.4) {
      const raised = [root, root + 4, root + 7, root + 10].slice(0, size);
      return { slot, raised: true, chord: { helix: { cycle: 12, heights: raised }, tensions: [] } };
    }
    const tension = heightOf(scale, d + 8);
    const tensions = size === 4 && withNinth && tension - root === 14 ? [tension] : [];
    return { slot, raised: false, chord: { helix: { cycle: 12, heights }, tensions } };
  });
}

/**
 * A theme's slot steps are 4/4's: the downbeat, 0, and the bar's half, 8. On a
 * meter a slot keeps its place in the bar, scaled to its steps, and its
 * parity: an eighth stays on an eighth, so the half is the meter's (6 of
 * 6/8's 12, 10 of 5/4's 20, 6 of 7/8's 14). A step of 4/4 is itself.
 */
export function slotStepOn(meter: Meter, step: number): number {
  const scaled = Math.floor((step * stepsOf(meter)) / 16);
  return scaled % 2 === step % 2 ? scaled : scaled - 1;
}

/** A bar's chords with their slots on the meter's steps, the same chords in 4/4. */
export function chordsOn(chords: readonly BarChord[], meter: Meter): BarChord[] {
  return chords.map((c) => ({ ...c, slot: { ...c.slot, step: slotStepOn(meter, c.slot.step) } }));
}

/** The chord sounding at a step of the bar: the last to start at or before it. */
export function chordAt(chords: readonly BarChord[], step: number): BarChord {
  return chords.findLast((c) => c.slot.step <= step) ?? chords[0]!;
}

/** A chord's root, its stack above the root, and the quality that stack names. */
function rootAndQuality(chord: Chord): { root: number; stack: number[]; quality: string } {
  const heights = joinChord(chord);
  const stack = heights.map((x) => x - heights[0]!);
  const quality = qualityOf(stack);
  if (!quality) throw new Error(`chords: no quality for ${stack.join(' ')}`);
  return { root: heights[0]!, stack, quality };
}

/** A chord's root, spelled in the key: its degree's note, or for a secondary dominant the fifth above the degree it leads to. */
function rootIn(slot: Slot, key: Key): Note {
  const scale = keyHelix(key);
  const notes = spell(spelledTonic(scale), scale.heights);
  return 'degree' in slot ? notes[slot.degree]! : spell(notes[slot.dominantOf]!, [0, 7])[1]!;
}

/** A chord's lead-sheet symbol, its root spelled in the key: `Am`, `E7`, `B♭maj9`. */
export function chordName({ slot, chord }: BarChord, key: Key): string {
  const { stack, quality } = rootAndQuality(chord);
  return nameOf({ kind: 'chord', root: rootIn(slot, key), quality, stack });
}

/** A chord's notes from its root up, spelled from the root the key gives it: `A C E`, `E G♯ B D`. */
export function chordNotes({ slot, chord }: BarChord, key: Key): Note[] {
  return spell(rootIn(slot, key), rootAndQuality(chord).stack);
}

/**
 * A chord's Roman numeral in the key, by the mode (U1): `i`, `VI`, `V7`,
 * `iiø7`. A secondary dominant names the degree it leads to, read in the
 * major or minor key its triad makes there: `V7/iv`, `V9/V`.
 */
export function chordNumeral({ slot, chord }: BarChord, key: Key): string {
  const scale = keyHelix(key);
  const { root, quality } = rootAndQuality(chord);
  const target =
    'dominantOf' in slot
      ? {
          degree: slot.dominantOf,
          accidental: 0 as const,
          minor: heightOf(scale, slot.dominantOf + 2) - heightOf(scale, slot.dominantOf) === 3,
        }
      : undefined;
  const numeral = numeralOf(scale, { root: wrap(root, 12), quality }, target);
  if (!numeral) throw new Error(`chordNumeral: no numeral for ${quality} on ${root}`);
  return formatNumeral(numeral);
}
