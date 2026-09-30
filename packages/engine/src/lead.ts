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
 * Each phrase starts from the degree of its scale nearest the chord tone
 * nearest where the lead left off.
 * Where a chord starts, and on the strong steps the harmony leaves (every
 * beat for a vamp, the half bar below rich harmony), it lands on a chord tone,
 * and the phrase grammar closes it: bar 2 ends open, on the third or the
 * fifth, and bar 4 on the root. Notes stay within 60–86: the phrase moves
 * by the octave that fits it best, and a note that still doesn't fit
 * folds by octaves on its own.
 *
 * The style reaches the lead's phrases in one place, `phraseParams`.
 * From the bar's energy, its chords, the plan's key and melodic scale, and the style's sync, entropy, harmony and swing, it gives every parameter a shape, a variation and its realization read: the rhythm's density, groove and pulse, the scale its contour walks, the contour's span and weights, the rates of turns, leaps and nudges, the variations' weights, where notes go to chord tones, and the range.
 * The scale is the plan's melodic scale over its key (#209): the key's seven degrees, its pentatonic or its blues, which the style's harmony reaches and the players pick within.
 * Only the lead's own phrases walk it: the chord tones they land on and the cadence stay the chords', so ♭6 over VI stands in a pentatonic, and a player's motif plays on the key's own degrees, as heard.
 * The harmony leans the contour from an arch toward a wave, and thins the strong steps a note lands on a chord tone at; the swing lifts the off-beat eighths, the pickups a swung line leans on (#168).
 * The articulation doesn't reach the phrases: it is how a note is played, the performer's gate (T4), not how it is written.
 * What the lead writes over every preset is recorded in `lead.fixture.json`, so a change to it is a deliberate one.
 *
 * A theme's melody comes back with its harmony: the shape a theme was
 * first played with returns while the syncopation and the energy stay near
 * it. The lead rests in an intro, a breakdown and below energy 0.4. A note
 * is written to the next one, or to the end of the bar; the performance
 * gates it by the articulation, and accents the beat (`performer.ts`).
 *
 * A motif the Muse offers (#79) is a standing target: the lead takes it as
 * its phrase at once, whatever the phase, and plays it while it stands,
 * even where it would rest. A player's notes are not moved to chord tones,
 * but the phrase grammar still closes bars 2 and 4, and the variations still
 * vary it. When the offer goes, the lead goes back to its own phrases at
 * once, and a motif never becomes a theme's melody. These are the
 * prototype's rules and weights.
 *
 * It is written on the bar's meter (#260): its steps, its pulses and the
 * accent tree give the grooves, the strong steps, the pickups and the
 * snapping steps; the syncopated groove, written on 4/4's 16 steps, is read
 * by the rule (`regroup.ts`); a chord's slot is read on the meter
 * (`chordsOn`). A motif has a cycle of its own, and is read in a bar of
 * another length as the drums' patterns are, by the cycle: its notes run
 * through the bars (`motifInBar`). In 4/4 every bar is what it was.
 */

import {
  type Chord,
  type Helix,
  type Meter,
  type Motif,
  accentsOf,
  alteredHeight,
  even,
  joinChord,
  meterOnSteps,
  positions,
  snap,
  stepsOf,
  wrap,
} from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { chordAt, chordsOn } from './chords.ts';
import { type WrittenNote, halfOf } from './events.ts';
import type { SectionType } from './form.ts';
import { keyHelix, melodicHelix } from './key.ts';
import type { Machine } from './machine.ts';
import { chance, draw, pick, quantize } from './random.ts';
import { readOnMeter } from './regroup.ts';
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
  cycle: number,
): LeadShape {
  const rest = steps[0]! > 0;
  return {
    cycle,
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

/**
 * A motif read in a bar of `steps` steps, bar number `bar`: its notes run
 * through the bars by the cycle, as the drums' patterns do, the bar a window
 * of `steps` on the motif repeated from its start, so a motif of the bar's
 * own length is itself, bar after bar, and one of another length phases
 * against the bar. A bar whose window starts between two notes starts
 * with a rest.
 */
export function motifInBar(motif: Motif, steps: number, bar: number): Motif {
  const { cycle, onsets, degrees, accidentals, accents } = motif;
  const from = (bar * steps) % cycle;
  const notes: { at: number; i: number }[] = [];
  for (let turn = 0; turn * cycle < from + steps; turn++)
    onsets.forEach((onset, i) => {
      const at = turn * cycle + onset - from;
      if (at >= 0 && at < steps) notes.push({ at, i });
    });
  const rest = notes.length > 0 && notes[0]!.at > 0;
  return {
    cycle: steps,
    onsets: [...(rest ? [0] : []), ...notes.map((n) => n.at)],
    degrees: [...(rest ? [null] : []), ...notes.map((n) => degrees[n.i]!)],
    accidentals: [...(rest ? [0] : []), ...notes.map((n) => accidentals[n.i]!)],
    ...(accents ? { accents: [...(rest ? [0] : []), ...notes.map((n) => accents[n.i]!)] } : {}),
  };
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

/** Where the lead plays syncopated, written on 4/4's 16 steps; the straight groove is the pulses' and the half's. */
const GROOVE_SYNCOPATED = [
  0.5, 0.2, 0.4, 0.8, 0.2, 0.4, 0.8, 0.5, 0.3, 0.2, 0.8, 0.6, 0.2, 0.4, 0.9, 0.4,
];

/**
 * Where the lead plays straight, on a meter's steps: the downbeat, the half
 * with four pulses or more, the other pulses, the eighths between them, and
 * the sixteenths, a little more after an eighth between pulses than after a
 * pulse.
 */
export function straightGroove(meter: Meter): number[] {
  const starts = new Set(meterOnSteps(meter).heights);
  const accents = accentsOf(meter);
  return Array.from({ length: stepsOf(meter) }, (_, s) => {
    if (s % 2 !== 0) return starts.has(s - 1) ? 0.1 : 0.15;
    if (s === 0) return 1;
    if (!starts.has(s)) return 0.4;
    return accents[s / 2] === 'half' && starts.size >= 4 ? 0.9 : 0.8;
  });
}

/** The contours a shape follows, over 0 to 1. */
const CONTOURS = [
  (u: number) => Math.sin(Math.PI * u),
  (u: number) => -u,
  (u: number) => u,
  (u: number) => Math.sin(2 * Math.PI * u) * 0.6,
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Everything the lead's phrases take from the style and the bar: how a
 * shape's rhythm fills, how far and how its contour moves, how a variation
 * varies it, where its notes go to chord tones and the range it plays in.
 */
export interface PhraseParams {
  /** How much of the grooves a shape's rhythm plays, 0.25 at energy 0 to 0.75 at 1. */
  readonly density: number;
  /** How far the grooves lean from straight (0) to syncopated (1): the style's sync. */
  readonly grooveMix: number;
  /**
   * What each step's chance of a note gains from the swing: the off-beat
   * eighths (steps 2, 6, 10, 14), the pickups a swung line leans on, by 0.3
   * times the swing; nothing when straight.
   */
  readonly pickups: readonly number[];
  /**
   * The Euclidean pulse a rhythm is blended with: 3 hits at energy 0 to 8 at
   * 1, rotated by the sync.
   */
  readonly pulse: readonly number[];
  /**
   * The scale the contour walks: the plan's melodic scale over its key
   * (`melodicHelix`, #209), seven degrees, or five or six.
   */
  readonly scale: Helix;
  /** How many degrees of the scale the contour reaches from the first note, 2 to 8, with energy and entropy. */
  readonly span: number;
  /**
   * The weight of each contour: an arch, a fall, a rise and a wave. A static
   * vamp arches (`harm` 0: twice the others, the wave a quarter), rich
   * harmony waves (`harm` 1: the wave 1.75, the arch as the others), and
   * entropy evens the arch's lead out.
   */
  readonly contours: readonly number[];
  /** How likely a step of the contour turns a degree aside, with entropy. */
  readonly turn: number;
  /** How likely a step leaps a fourth aside: none up to entropy 0.5. */
  readonly leap: number;
  /** The weight of each variation: turned over, lifted, its last note bent, its last note dropped. */
  readonly variations: readonly number[];
  /** How likely a variation nudges one note a degree, with entropy. */
  readonly nudge: number;
  /**
   * The steps where a note of the lead's own goes to a chord tone: each
   * chord's start, and strong steps that thin as the harmony grows, so rich
   * harmony lets a passing or neighbour tone stand where a vamp would not.
   */
  readonly snap: readonly number[];
  /** The lowest and highest note. */
  readonly range: readonly [number, number];
}

/**
 * The strong steps a note of the lead's own lands on a chord tone at: every
 * beat for a static vamp (below harm 0.25), the half bar up to harm 0.6,
 * and above it only the downbeat, which a chord always starts on.
 */
function strongSteps(harm: number, meter: Meter): readonly number[] {
  return harm < 0.25 ? meterOnSteps(meter).heights : harm < 0.6 ? [0, halfOf(stepsOf(meter))] : [0];
}

/**
 * The one place the style reaches the lead's phrases: every parameter of a
 * shape, a variation and its realization, from the bar's energy, its chords,
 * the plan's key and melodic scale, and the style's sync, entropy, harmony
 * and swing.
 */
export function phraseParams({
  style,
  barEnergy: energy,
  chords: written,
  plan,
  meter,
}: Pick<BarEnv, 'style' | 'barEnergy' | 'chords' | 'plan' | 'meter'>): PhraseParams {
  const steps = stepsOf(meter);
  const starts = new Set(meterOnSteps(meter).heights);
  const chords = chordsOn(written, meter);
  return {
    density: 0.25 + 0.5 * energy,
    grooveMix: style.sync,
    pickups: Array.from({ length: steps }, (_, s) =>
      s % 2 === 0 && !starts.has(s) ? 0.3 * style.swing : 0,
    ),
    pulse: positions(even(Math.round(3 + 5 * energy), steps, Math.round(style.sync * 3))),
    scale: melodicHelix(plan.key, plan.melodic),
    span: 2 + Math.round((energy + style.entropy) * 3),
    contours: [1 + (1 - style.harm) * (1 - style.entropy), 1, 1, 0.25 + 1.5 * style.harm],
    turn: 0.2 + 0.3 * style.entropy,
    leap: style.entropy > 0.5 ? style.entropy - 0.5 : 0,
    variations: [0.3, 0.25, 0.25, 0.2],
    nudge: style.entropy * 0.5,
    snap: Array.from({ length: steps }, (_, s) => s).filter(
      (s) => strongSteps(style.harm, meter).includes(s) || chords.some((c) => c.slot.step === s),
    ),
    range: LEAD_RANGE,
  };
}

/** A new shape for a phrase: its draws are keyed by the section and the half of it. */
function shapeOf(env: BarEnv): LeadShape {
  const { seed, plan, style, barEnergy: energy, barInSection, meter, bar } = env;
  const { density, grooveMix, pickups, pulse, span, contours, turn, leap } = phraseParams(env);
  const steps = stepsOf(meter);
  const straight = straightGroove(meter);
  const syncopated = readOnMeter(GROOVE_SYNCOPATED, meter, 'cycle', bar);
  const section = plan.section.index;
  const half = barInSection >> 2;
  let n = 0;
  const next = () => draw(seed, 'leadShape', section, half, n++);

  const euclid = new Set(pulse);
  const onsets: number[] = [];
  for (let s = 0; s < steps; s++) {
    const groove = Math.min(
      1,
      lerp(straight[s]!, syncopated[s]!, grooveMix) * density + pickups[s]!,
    );
    const p = lerp(groove, euclid.has(s) ? 0.9 : 0, 0.5);
    if (chance(draw(seed, 'leadRhythm', section, half, s), p)) onsets.push(s);
  }
  // Too few notes: the downbeat, the half and the pulses make it three.
  for (const s of [0, halfOf(steps), ...meterOnSteps(meter).heights, 2, 4, 6]) {
    if (onsets.length >= 3) break;
    if (!onsets.includes(s) && s < steps) onsets.push(s);
  }
  onsets.sort((a, b) => a - b);

  const contour = CONTOURS[pick(next(), contours)]!;
  const degrees = [0];
  let move = 0;
  for (let i = 1; i < onsets.length; i++) {
    // Quantised before rounding: \`Math.sin\` may differ in its last bit
    // across engines, and sin(π/6) · 3 lies one ulp from 1.5.
    const target = Math.round(quantize(contour(i / Math.max(1, onsets.length - 1)) * span));
    const here = degrees[i - 1]!;
    let m = Math.sign(target - here) * (Math.abs(target - here) > 2 ? 2 : 1);
    if (Math.abs(move) >= 3) m = -Math.sign(move);
    else if (chance(next(), turn)) m += chance(next(), 0.5) ? -1 : 1;
    if (leap > 0 && chance(next(), leap)) m += chance(next(), 0.5) ? -3 : 3;
    degrees.push(here + m);
    move = m;
  }
  return shapeFrom(onsets, degrees, style.sync, energy, steps);
}

/**
 * A variation of a shape, drawn per bar: turned over, lifted, its last note
 * bent, or its last note dropped, the note before it then held to the bar's
 * end. At some entropy one note is nudged a degree.
 */
function varied(shape: LeadShape, env: BarEnv): LeadShape {
  const { seed, bar } = env;
  const { variations, nudge } = phraseParams(env);
  let n = 0;
  const next = () => draw(seed, 'leadVariation', bar, n++);
  const notes = notesOf(shape);
  let degrees = notes.degrees;
  const onsets = notes.steps;
  // Turn it over, lift it, bend its last note, or drop it.
  const way = pick(next(), variations);
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
  if (chance(next(), nudge) && onsets.length > 1) {
    const i =
      1 +
      pick(
        next(),
        onsets.slice(1).map(() => 1),
      );
    degrees[i]! += chance(next(), 0.5) ? -1 : 1;
  }
  return shapeFrom(onsets, degrees, shape.sync, shape.energy, shape.cycle);
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
 * A phrase moved into a range: by the octave that puts the most notes in
 * range (the smallest move on a tie), then any note still outside folded
 * by octaves on its own. The lead's range, 60–86, is over an octave wide,
 * so every note fits, and folding by octaves keeps each note's pitch class.
 */
function intoRange(notes: readonly number[], [low, high]: PhraseParams['range']): number[] {
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
 * degree of its scale nearest the chord tone nearest where the lead left
 * off, each note altered as written and held to the next onset, a rest
 * silent, and the last note to the bar's end. (A motif that didn't start on
 * the bar's first step would hold its last note on over the bar line; the
 * lead's own and the Muse's always start there, with a rest if the bar starts
 * silent.) The lead's `own` motif walks its phrase parameters' scale, and a
 * note on a step they snap goes to the nearest chord tone; a player's motif
 * is written in the key's degrees and accidentals (U4), so it is played on
 * the key's own as it was heard, each note with its accent, which the
 * performance plays on the lead's level. Bars 2 and 4 close as the phrase
 * grammar says, and the phrase moves into the lead's range.
 */
function realize(motif: Motif, env: BarEnv, last: number, own: boolean) {
  const { plan, barInSection, meter, bar } = env;
  const chords = chordsOn(env.chords, meter);
  const steps = stepsOf(meter);
  const params = phraseParams(env);
  const { snap: snapped, range } = params;
  const { onsets, degrees, accidentals, accents } = motifInBar(motif, steps, bar);
  const scale = own ? params.scale : keyHelix(plan.key);
  const heard = onsets.flatMap((step, i) => (degrees[i] === null ? [] : [{ step, i }]));
  if (heard.length === 0) return { written: [], last };
  const first = snap(scale, nearestTone(chordAt(chords, heard[0]!.step).chord, last));
  let notes = heard.map(({ step, i }) => {
    const note = alteredHeight(scale, first + degrees[i]!, accidentals[i]!);
    return own && snapped.includes(step) ? nearestTone(chordAt(chords, step).chord, note) : note;
  });
  notes = intoRange(cadence(notes, heard.at(-1)!.step, chords, barInSection % 4), range);
  const written: WrittenNote[] = heard.map(({ step, i }, j) => ({
    part: 'lead',
    step,
    note: notes[j]!,
    length: (onsets[i + 1] ?? steps) - step,
    // An offered motif's every note carries an accent, 0 included: `perform`
    // plays a note with one on the lead's level, and one without on the
    // beat's, so leaving out a 0 would change how it plays.
    ...(own ? {} : { accent: accents?.[i] ?? 0 }),
  }));
  return { written, last: notes.at(-1)! };
}

export const lead: Machine<BarEnv, LeadCarried, null, WrittenNote[]> = {
  initial: { last: 69, phrase: null, melodies: {}, offered: null },
  advance(env, carried) {
    const { plan, style, barEnergy: energy, barInSection, offer } = env;
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
    else shape = varied(phrase, env);

    const { written, last } = realize(shape, env, carried.last, true);
    return { carried: { last, phrase, melodies, offered: null }, output: written };
  },
};
