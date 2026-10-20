/**
 * The novelty ladder for rhythms (#411, #414; yggi/cells decision 043:
 * repeat → vary with operators → recombine the workbench → fetch nearby →
 * fetch far, bored climbing it): how the composer tires of a rhythm it
 * plays, varies it, and past that rejects it, so the next nearest plays, or
 * the drummer invents and the Muse files that in turn.
 *
 * A rhythm here is any the repository gives a section: one of cells' seed
 * drum bars (#414; a clave is never a section's rhythm alone, #428), or a
 * groove the learned layer filed (the drummer's, a player's, or a variation the
 * composer made, `muse-groove.ts`). A preset's drum bar climbs as a groove
 * filed does, so a preset held plays its drum bar, then a variation of it,
 * then leaves it a while.
 *
 * **The clave climbs with the drum bar** (#414): a line chosen with the
 * rhythm (`claveFragment`) is never varied, and the lineage of the rhythm it
 * played with keeps it (`claves`), so it is rejected with that rhythm and
 * returns with it. A clave is chosen for the drum bar it layers on (cells
 * decision 046's use together), so the two tire together, as a pair; and the
 * variation keeps it, as it keeps the kick and the backbeat, so what a
 * section varies is the drum bar's own lines.
 *
 * **Boredom** (until the homeostat measures recognition, #237): the
 * composer keeps, for each rhythm it played lately and its family (a
 * `Lineage`: the rhythm it varies, named in the layer under `varies`,
 * followed back to the first, a seed rhythm or a groove filed, and every
 * variation of that one, `familyOf`), how bored it is. A section the
 * lineage plays adds the style's entropy, and a section it doesn't takes it
 * away, so boredom fades as fast as it grew, and a lineage at none is
 * forgotten. Counted on the draws' grid (`quantize`), so ten sections at 0.3
 * make 3.
 *
 * **The rungs**, each `BORED` of boredom (3 sections at entropy 1, 10 at
 * 0.3; none at 0, where the rhythm holds):
 *
 * - rung 0, **repeat**: the rhythm plays as found;
 * - rung 1, **vary**: on reaching it, the composer varies the rhythm
 *   playing by one operator (`variations`), files the variation (`plan.ts`)
 *   and plays it, where the family holds no variation yet and the rhythm is
 *   one bar long (a rhythm of two bars isn't varied, and only repeats until
 *   it is rejected); so a family that returns is not varied
 *   again, and the layer grows by one variation a rhythm the band played
 *   long enough;
 * - past `GROOVE_RUNGS`, **rejected**: the composer leaves every rhythm of
 *   the lineage, and its claves, out of what the repository returns
 *   (decision 043: it may reject what it is given), so it takes the next
 *   nearest, and where none lies near enough, the drummer invents. A
 *   rejected lineage is out until its boredom has faded, as many sections
 *   as it played, then it may be found again.
 *
 * The rungs between vary and fetch (recombining the workbench, fetching
 * far) are not climbed here: a rhythm rejected is the composer asking the
 * repository again without it, which is fetching nearby.
 *
 * **The operators** act on one line of the rhythm (a role's hits), never on
 * the kick or the backbeat (`GROOVE_ANCHORS`), which carry the meter, nor on
 * the fill, which the drummer plays its own of (`groove.ts`), so a variation
 * of a fragment's fill would sound as the fragment does:
 *
 * - **rotate**: every hit of the line a step later, the last step wrapping
 *   to the first;
 * - **drop**: one of its hits left out, where the bar keeps `GROOVE_FEWEST`;
 * - **add**: one hit of the sound the line strikes first, on a step that
 *   sound is silent on, at the line's loudest, so the drummer, who plays a
 *   fragment's loudest hits first (`groove.ts`), plays it among its first.
 *
 * None strikes one sound twice on a step, and each gives a rhythm the one
 * varied isn't; a draw picks one of all of them.
 */

import type { LearnedLayer } from './layer.ts';
import type { FragmentHit } from './rhythm-query.ts';
import { GROOVE_FEWEST } from './muse-groove.ts';
import { pick, quantize } from './random.ts';

/** A rhythm the composer played lately, the variations it made of it, and how bored it is with them. */
export interface Lineage {
  /** The rhythm found first, a seed rhythm or a groove filed, then each variation made of it, by id. */
  readonly grooves: readonly string[];
  /** The lines chosen with them, a line of their own each (the claves), by id: they climb with the rhythm (#414). */
  readonly claves: readonly string[];
  /** The entropy of each section it played, less that of each it didn't, on the draws' grid. */
  readonly boredom: number;
  /** Whether it climbed past the last rung: out of what the repository returns until its boredom fades, its claves too. */
  readonly rejected: boolean;
}

/** The composer's boredom: each lineage it played lately. */
export type Boredom = readonly Lineage[];

/** Nothing played yet: a song's start. */
export const NO_BOREDOM: Boredom = [];

/** The boredom a rung lasts: 3 sections at entropy 1, so a groove found varies at its fourth (#411's bound: within 4). */
export const BORED = 3;

/** The rungs a groove climbs before it is rejected: repeat, then vary. */
export const GROOVE_RUNGS = 2;

/**
 * How strongly use together pulls the composer's queries (cells' `pull`,
 * decision 046) at the foot of the ladder, entropy 0, where it repeats:
 * twice cells' default (`CO_USE_PULL`, 0.1), so a group used together ten
 * times (known) pulls 0.02 in distance there, the meter's and the rhythm's
 * hold (`METER_HOLD`).
 */
export const PULL_AT_REPEAT = 0.2;

/**
 * The pull of use together from the composer's place on the ladder (#389,
 * decision 043's point 5: strong to repeat and vary, weak or none to fetch
 * nearby and far), which entropy sets until the homeostat measures
 * recognition (#237): from `PULL_AT_REPEAT` at entropy 0 down to none at 1,
 * in a line, so entropy 0.5 pulls as cells does where it is told nothing;
 * on the draws' grid.
 */
export const pullOf = (entropy: number): number =>
  quantize(PULL_AT_REPEAT * Math.min(1, Math.max(0, 1 - entropy)));

/** The lines no operator touches: they carry the meter. */
export const GROOVE_ANCHORS: readonly string[] = ['kick', 'backbeat'];

/** The line no operator touches beside the anchors: the fill, which the drummer plays its own of (`groove.ts`). */
const UNVARIED: readonly string[] = [...GROOVE_ANCHORS, 'fill'];

/** The rung a boredom stands on: 0 to repeat, 1 to vary, `GROOVE_RUNGS` and past it rejected. */
export const rungOf = (boredom: number): number => Math.floor(boredom / BORED);

/** Every rhythm the composer has rejected, and every clave with them, by id. */
export const rejectedOf = (boredom: Boredom): string[] =>
  boredom.filter((l) => l.rejected).flatMap((l) => [...l.grooves, ...l.claves]);

/** The metadata key a variation names the groove it varies by, in the layer (`GrooveFiling.varies`). */
export const VARIES = 'varies';

/**
 * A rhythm's family in the layer: the rhythm it varies, followed back to the
 * first, and every groove the layer filed from that one, in the layer's
 * order, the first ahead of them where the layer didn't file it (a seed
 * rhythm, #414); the rhythm alone where the layer files none of it.
 */
export function familyOf(layer: LearnedLayer, id: string): string[] {
  const variesOf = (of: string) => {
    const varies = layer.filed.find((f) => f.fragment.id === of)?.meta[VARIES];
    return typeof varies === 'string' ? varies : undefined;
  };
  const rootOf = (of: string) => {
    const seen = new Set([of]);
    let root = of;
    for (let up = variesOf(root); up !== undefined && !seen.has(up); up = variesOf(root)) {
      seen.add(up);
      root = up;
    }
    return root;
  };
  const root = rootOf(id);
  const filed = layer.filed.map((f) => f.fragment.id).filter((other) => rootOf(other) === root);
  const family = filed.includes(root) ? filed : [root, ...filed];
  return family.includes(id) ? family : [id];
}

/** The lineage a family of rhythms belongs to (`familyOf`), with each of them, or a new one at no boredom. */
export function lineageOf(boredom: Boredom, family: readonly string[]): Lineage {
  const known = boredom.find((l) => l.grooves.some((id) => family.includes(id)));
  return known
    ? {
        ...known,
        grooves: [...known.grooves, ...family.filter((id) => !known.grooves.includes(id))],
      }
    : { grooves: [...family], claves: [], boredom: 0, rejected: false };
}

/** A lineage with a clave played with it (#414): one more it keeps, where it didn't. */
export const withClave = (lineage: Lineage, clave: string | undefined): Lineage =>
  clave === undefined || lineage.claves.includes(clave)
    ? lineage
    : { ...lineage, claves: [...lineage.claves, clave] };

/** Whether the composer varies the lineage's groove now: on a rung past repeat it hasn't made a variation on. */
export function wantsVariation({ grooves, boredom }: Lineage): boolean {
  const rung = rungOf(boredom);
  return rung >= 1 && rung < GROOVE_RUNGS && grooves.length - 1 < rung;
}

/**
 * The boredom a section later: the lineage it played (with any variation it
 * made) the section's entropy more, rejected where that takes it past the
 * last rung; every other the entropy less, forgotten at none.
 */
export function boredAfter(boredom: Boredom, playing: Lineage | null, entropy: number): Boredom {
  const step = quantize(entropy);
  const others = boredom
    .filter((l) => !playing || !l.grooves.some((id) => playing.grooves.includes(id)))
    .map((l) => ({ ...l, boredom: l.boredom - step }))
    .filter((l) => l.boredom > 0);
  if (!playing) return others;
  const grown = playing.boredom + step;
  return [
    ...others,
    {
      grooves: playing.grooves,
      claves: playing.claves,
      boredom: grown,
      rejected: rungOf(grown) >= GROOVE_RUNGS,
    },
  ];
}

/** Hits in the order a bar plays them: by step, then note. */
const inOrder = (hits: readonly FragmentHit[]): FragmentHit[] =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);

/** A groove's pattern, its velocities too, to tell two apart. */
const patternOf = (hits: readonly FragmentHit[]) =>
  inOrder(hits)
    .map((h) => `${h.role}:${h.note}:${h.step}:${h.velocity}`)
    .join(' ');

/**
 * Every variation of a bar of `steps` by one operator on one line: for each
 * line but the anchors and the fill, in the order the bar first plays them, its rotation,
 * each of its hits dropped, and a hit added on each step its sound is
 * silent on; each in the order a bar plays its hits, none twice, none the
 * groove itself, none striking a sound twice on a step, none of fewer than
 * `GROOVE_FEWEST` hits.
 */
export function variations(hits: readonly FragmentHit[], steps: number): FragmentHit[][] {
  const bar = inOrder(hits);
  const seen = new Set([patternOf(bar)]);
  const out: FragmentHit[][] = [];
  const keep = (varied: readonly FragmentHit[]) => {
    if (varied.length < GROOVE_FEWEST) return;
    const strikes = new Set(varied.map((h) => `${h.step}:${h.note}`));
    if (strikes.size < varied.length) return;
    const pattern = patternOf(varied);
    if (seen.has(pattern)) return;
    seen.add(pattern);
    out.push(inOrder(varied));
  };
  const roles = [...new Set(bar.map((h) => h.role))].filter((r) => !UNVARIED.includes(r));
  for (const role of roles) {
    const line = bar.filter((h) => h.role === role);
    const rest = bar.filter((h) => h.role !== role);
    keep([...rest, ...line.map((h) => ({ ...h, step: (h.step + 1) % steps }))]);
    for (const dropped of line) keep(bar.filter((h) => h !== dropped));
    const { note } = line[0]!;
    const loudest = Math.max(...line.map((h) => h.velocity));
    for (let step = 0; step < steps; step++)
      if (!bar.some((h) => h.note === note && h.step === step))
        keep([...bar, { role, note, step, velocity: loudest }]);
  }
  return out;
}

/** One variation of a bar (`variations`), picked by a draw; null where no operator applies. */
export function variedGroove(
  hits: readonly FragmentHit[],
  steps: number,
  draw: number,
): FragmentHit[] | null {
  const all = variations(hits, steps);
  return all.length
    ? all[
        pick(
          draw,
          all.map(() => 1),
        )
      ]!
    : null;
}
