/**
 * The lead: a machine at bar rate that carries its last note, its phrase
 * and its themes' melodies.
 *
 * A phrase is four bars: a shape, a variation of it, the shape again, and
 * another variation. A shape is a motif of one bar (U4), and the lead
 * `realize`s every motif it plays, its own and the Muse's, the same way. A
 * shape is a rhythm, the style's grooves blended with a Euclidean pattern
 * that fills with energy, and a contour over it (an arch, a fall, a rise or
 * a wave) walked in steps of the key, where a leap is followed by a step
 * back and entropy adds turns and leaps. A variation turns the shape over,
 * lifts it, bends its last note or drops it.
 *
 * Each phrase starts from the chord tone nearest where the lead left off.
 * On the half bar and where a chord starts the lead lands on a chord tone,
 * and the phrase grammar closes it: bar 2 ends open, on the third or the
 * fifth, and bar 4 on the root. Notes stay within 60–86: the phrase moves
 * by the octave that fits it best, and a note that still doesn't fit
 * folds by octaves on its own.
 *
 * A theme's melody comes back with its harmony: the shape a theme was
 * first played with returns while the syncopation and the energy stay near
 * it. The lead rests in an intro, a breakdown and below energy 0.4. A note
 * is written to the next one, or to the end of the bar; the performance
 * gates it by the articulation, and accents the beat (`perform.ts`).
 *
 * A motif the Muse offers (#79) is a standing target: the lead takes it as
 * its phrase at once, whatever the phase, and plays it while it stands,
 * even where it would rest. A player's notes are not moved to chord tones,
 * but the phrase grammar still closes bars 2 and 4, and the variations still
 * vary it. When the offer goes, the lead goes back to its own phrases at
 * once, and a motif never becomes a theme's melody. These are the
 * prototype's rules and weights.
 */

import {
  type Chord,
  type Helix,
  type Motif,
  chromaticStep,
  even,
  heightOf,
  joinChord,
  positions,
  wrap,
} from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { chordAt } from './chords.ts';
import type { WrittenNote } from './events.ts';
import type { SectionType } from './form.ts';
import { keyHelix } from './key.ts';
import type { Machine } from './machine.ts';
import { chance, draw, pick, quantize } from './random.ts';
import type { ThemeKind } from './themes.ts';

/** The lowest and highest note the lead plays. */
export const LEAD_RANGE = [60, 86] as const;

/**
 * The lead's own phrase: a motif of one bar (U4), its notes unaltered and
 * each held to the next, the last to the bar's end, and the syncopation and
 * energy it was made at, which a theme's return has to stay near.
 */
export interface LeadShape extends Motif {
  readonly sync: number;
  readonly energy: number;
}

/**
 * A shape from its notes' steps and degrees. A bar that starts silent
 * starts with a rest, so the last note ends at the bar's end rather than
 * running on into the next time round (U4).
 */
function shapeFrom(
  steps: readonly number[],
  degrees: readonly number[],
  sync: number,
  energy: number,
): LeadShape {
  const rest = steps[0]! > 0;
  return {
    cycle: 16,
    onsets: rest ? [0, ...steps] : [...steps],
    degrees: rest ? [null, ...degrees] : [...degrees],
    accidentals: [...(rest ? [0] : []), ...steps.map(() => 0)],
    sync,
    energy,
  };
}

/** A shape's notes: their steps and degrees, its rest left out. */
function notesOf(shape: LeadShape): { steps: number[]; degrees: number[] } {
  const at = shape.degrees.flatMap((d, i) => (d === null ? [] : [i]));
  return { steps: at.map((i) => shape.onsets[i]!), degrees: at.map((i) => shape.degrees[i]!) };
}

export interface LeadCarried {
  /** The last note played. */
  readonly last: number;
  /** The shape of the phrase playing, or none while resting. */
  readonly phrase: LeadShape | null;
  /** Each theme's melody: the theme it belongs to, and its shape. */
  readonly melodies: Partial<
    Record<ThemeKind, { readonly theme: number; readonly shape: LeadShape }>
  >;
  /** The bar the offered motif playing was heard in, or null for the lead's own phrase. */
  readonly offered: number | null;
}

/** Where the lead plays, straight and syncopated. */
const GROOVE_STRAIGHT = [
  1, 0.1, 0.4, 0.15, 0.8, 0.1, 0.4, 0.15, 0.9, 0.1, 0.4, 0.15, 0.8, 0.1, 0.4, 0.15,
];
const GROOVE_SYNCOPATED = [
  0.5, 0.2, 0.4, 0.8, 0.2, 0.4, 0.8, 0.5, 0.3, 0.2, 0.8, 0.6, 0.2, 0.4, 0.9, 0.4,
];

/** The contours a shape follows, over 0 to 1. */
const CONTOURS = [
  (u: number) => Math.sin(Math.PI * u),
  (u: number) => -u,
  (u: number) => u,
  (u: number) => Math.sin(2 * Math.PI * u) * 0.6,
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A new shape for a phrase: its draws are keyed by the section and the half of it. */
function shapeOf(env: BarEnv): LeadShape {
  const { seed, plan, style, barEnergy: energy, barInSection } = env;
  const section = plan.section.index;
  const half = barInSection >> 2;
  let n = 0;
  const next = () => draw(seed, 'leadShape', section, half, n++);

  const density = 0.25 + 0.5 * energy;
  const euclid = new Set(
    positions(even(Math.round(3 + 5 * energy), 16, Math.round(style.sync * 3))),
  );
  const steps: number[] = [];
  for (let s = 0; s < 16; s++) {
    const groove = lerp(GROOVE_STRAIGHT[s]!, GROOVE_SYNCOPATED[s]!, style.sync) * density;
    const p = lerp(groove, euclid.has(s) ? 0.9 : 0, 0.5);
    if (chance(draw(seed, 'leadRhythm', section, half, s), p)) steps.push(s);
  }
  for (const s of [0, 8, 4, 12, 6, 10]) {
    if (steps.length >= 3) break;
    if (!steps.includes(s)) steps.push(s);
  }
  steps.sort((a, b) => a - b);

  const span = 2 + Math.round((energy + style.entropy) * 3);
  const contour = CONTOURS[pick(next(), [1, 1, 1, 1])]!;
  const degrees = [0];
  let move = 0;
  for (let i = 1; i < steps.length; i++) {
    // Quantised before rounding: \`Math.sin\` may differ in its last bit
    // across engines, and sin(π/6) · 3 lies one ulp from 1.5.
    const target = Math.round(quantize(contour(i / Math.max(1, steps.length - 1)) * span));
    const here = degrees[i - 1]!;
    let m = Math.sign(target - here) * (Math.abs(target - here) > 2 ? 2 : 1);
    if (Math.abs(move) >= 3) m = -Math.sign(move);
    else if (chance(next(), 0.2 + 0.3 * style.entropy)) m += chance(next(), 0.5) ? -1 : 1;
    if (style.entropy > 0.5 && chance(next(), style.entropy - 0.5))
      m += chance(next(), 0.5) ? -3 : 3;
    degrees.push(here + m);
    move = m;
  }
  return shapeFrom(steps, degrees, style.sync, energy);
}

/**
 * A variation of a shape, drawn per bar: turned over, lifted, its last note
 * bent, or its last note dropped, the note before it then held to the bar's
 * end. At some entropy one note is nudged a degree.
 */
function varied(shape: LeadShape, seed: number, bar: number, entropy: number): LeadShape {
  let n = 0;
  const next = () => draw(seed, 'leadVariation', bar, n++);
  const notes = notesOf(shape);
  let degrees = notes.degrees;
  const onsets = notes.steps;
  // Turn it over, lift it, bend its last note, or drop it.
  const way = pick(next(), [0.3, 0.25, 0.25, 0.2]);
  if (way === 0) degrees = degrees.map((d) => -d);
  else if (way === 1) degrees = degrees.map((d) => d + 2);
  else if (way === 2) {
    const i = degrees.length - 1;
    if (i > 0)
      degrees[i] = degrees[i - 1]! + (chance(next(), 0.5) ? -1 : 1) * (1 + pick(next(), [1, 1]));
  } else if (onsets.length > 2) {
    onsets.pop();
    degrees.pop();
  }
  if (chance(next(), entropy * 0.5) && onsets.length > 1) {
    const i =
      1 +
      pick(
        next(),
        onsets.slice(1).map(() => 1),
      );
    degrees[i]! += chance(next(), 0.5) ? -1 : 1;
  }
  return shapeFrom(onsets, degrees, shape.sync, shape.energy);
}

/** The nearest note to `near` among a chord's tones, within a tritone; ties go down. */
const nearestTone = (chord: Chord, near: number) =>
  nearestOf(
    joinChord(chord).map((x) => wrap(x, 12)),
    near,
  );

/** The note nearest `near` among `classes`, within a tritone; ties go down. */
function nearestOf(classes: readonly number[], near: number): number {
  for (let d = 0; d <= 6; d++)
    for (const note of [near - d, near + d]) if (classes.includes(wrap(note, 12))) return note;
  return near;
}

/**
 * A phrase moved into 60–86: by the octave that puts the most notes in
 * range (the smallest move on a tie), then any note still outside folded
 * by octaves on its own. The range is over an octave wide, so every note
 * fits, and folding by octaves keeps each note's pitch class.
 */
function intoRange(notes: readonly number[]): number[] {
  const [low, high] = LEAD_RANGE;
  const inside = (shift: number) =>
    notes.filter((n) => n + shift >= low && n + shift <= high).length;
  let best = 0;
  for (let octaves = -4; octaves <= 4; octaves++) {
    const shift = 12 * octaves;
    const better = inside(shift) - inside(best);
    if (better > 0 || (better === 0 && Math.abs(shift) < Math.abs(best))) best = shift;
  }
  return notes.map((n) => {
    let note = n + best;
    while (note > high) note -= 12;
    while (note < low) note += 12;
    return note;
  });
}

/** Whether the lead rests in a bar: in an intro, a breakdown, and below energy 0.4. */
export function leadRests(section: SectionType, barEnergy: number): boolean {
  return barEnergy < 0.4 || section === 'breakdown' || section === 'intro';
}

/** The degree of the key nearest a note: where a phrase starts from. */
function degreeNear(scale: Helix, note: number): number {
  const octave = Math.floor((note - scale.heights[0]!) / 12);
  const within = wrap(note - scale.heights[0]!, 12);
  let degree = 0;
  scale.heights.forEach((h, i) => {
    if (
      Math.abs(h - scale.heights[0]! - within) <
      Math.abs(scale.heights[degree]! - scale.heights[0]! - within)
    )
      degree = i;
  });
  return octave * 7 + degree;
}

/** The phrase's cadence: bar 2 ends open, on the third or fifth, and bar 4 closes on the root. */
function cadence(notes: number[], lastStep: number, chords: BarEnv['chords'], phase: number) {
  if (phase !== 1 && phase !== 3) return notes;
  const tones = joinChord(chordAt(chords, lastStep).chord);
  const allowed = phase === 3 ? [tones[0]!] : [tones[1]!, tones[2]!];
  return [
    ...notes.slice(0, -1),
    nearestOf(
      allowed.map((x) => wrap(x, 12)),
      notes.at(-1)!,
    ),
  ];
}

/**
 * A motif of one bar realized as the lead's notes: its first note on the
 * degree of the key nearest the chord tone nearest where the lead left
 * off, each note altered as written and held to the next onset, a rest
 * silent, and the last note to the bar's end. (A motif that didn't start
 * on the bar's first step would hold its last note on over the bar line;
 * the lead's own and the Muse's always start there, with a rest if the
 * bar starts silent.) Where `fit`, a note on the half bar or where a chord starts goes
 * to the nearest chord tone, as the lead's own sketches do; a player's
 * motif is played as it was heard. Bars 2 and 4 close as the phrase grammar
 * says, and the phrase moves into the lead's range.
 */
function realize(motif: Motif, env: BarEnv, last: number, fit: boolean) {
  const { plan, chords, barInSection } = env;
  const { onsets, degrees, accidentals } = motif;
  const scale = keyHelix(plan.key);
  const heard = onsets.flatMap((step, i) => (degrees[i] === null ? [] : [{ step, i }]));
  const first = degreeNear(scale, nearestTone(chordAt(chords, heard[0]!.step).chord, last));
  const alteration = chromaticStep(scale);
  let notes = heard.map(({ step, i }) => {
    const note = heightOf(scale, first + degrees[i]!) + accidentals[i]! * alteration;
    const onChord = step % 8 === 0 || chords.some((c) => c.slot.step === step);
    return fit && onChord ? nearestTone(chordAt(chords, step).chord, note) : note;
  });
  notes = intoRange(cadence(notes, heard.at(-1)!.step, chords, barInSection % 4));
  const written: WrittenNote[] = heard.map(({ step, i }, j) => ({
    part: 'lead',
    step,
    note: notes[j]!,
    length: (onsets[i + 1] ?? motif.cycle) - step,
  }));
  return { written, last: notes.at(-1)! };
}

export const lead: Machine<BarEnv, LeadCarried, null, WrittenNote[]> = {
  initial: { last: 69, phrase: null, melodies: {}, offered: null },
  advance(env, carried) {
    const { seed, bar, plan, style, barEnergy: energy, barInSection, offer } = env;
    // A motif the Muse offers is played whole while it stands, even where
    // the lead would rest, and the lead's own phrase starts afresh after it.
    if (offer) {
      const { written, last } = realize(offer.motif, env, carried.last, false);
      return {
        carried: { ...carried, last, phrase: null, offered: offer.bar },
        output: written,
      };
    }
    const { section, theme } = plan;
    if (leadRests(section.type, energy))
      return { carried: { ...carried, phrase: null, offered: null }, output: [] };

    const phase = barInSection % 4;
    let { phrase, melodies } = carried;
    let shape: LeadShape;
    if (phase === 0 || !phrase) {
      const kept = melodies[theme.kind];
      const returns =
        kept &&
        kept.theme === theme.index &&
        Math.abs(kept.shape.sync - style.sync) < 0.25 &&
        Math.abs(kept.shape.energy - energy) < 0.3;
      if (returns) shape = kept.shape;
      else {
        shape = shapeOf(env);
        melodies = { ...melodies, [theme.kind]: { theme: theme.index, shape } };
      }
      phrase = shape;
    } else if (phase === 2) shape = phrase;
    else shape = varied(phrase, seed, bar, style.entropy);

    const { written, last } = realize(shape, env, carried.last, true);
    return { carried: { last, phrase, melodies, offered: null }, output: written };
  },
};
