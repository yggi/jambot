/**
 * The novelty ladder (#411, #414; yggi/cells decision 043:
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
 * then leaves it a while. A bass line climbs it the same way (#423, the loop
 * of `facet.ts`), its lineage beside the drums' in one boredom: varied by
 * cells' pitched operators (transpose by a degree of its chord, invert,
 * reverse), never its anchor, the root on a chord change's downbeat.
 *
 * **The clave climbs with the drum bar** (#414): a line chosen with the
 * rhythm (`claveFragment`) is never varied, and it is the drum bar's it was
 * first chosen to layer on (`ClaveOwners`, #430), so it is rejected with that
 * drum bar's lineage alone and returns with it. A clave is chosen for the
 * drum bar it layers on (cells decision 046's use together), so the two tire
 * together, as a pair; layering on another rhythm meanwhile, once its own has
 * faded, doesn't make it that one's, so a drum bar that returns finds its
 * clave free. The variation keeps it, as it keeps the kick and the backbeat,
 * so what a section varies is the drum bar's own lines.
 *
 * **Boredom** (until the homeostat's controller drives the ladder from the
 * share of bars recognised, #237, which `recognised.ts` measures and nothing
 * here reads yet, E44): the composer keeps, for each rhythm it played lately and its family (a
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
 *   playing by one operator (`RhythmRepository.vary`), files the variation (`plan.ts`)
 *   and plays it, where the family holds no variation yet and the rhythm is
 *   one bar long (a rhythm of two bars isn't varied, and only repeats until
 *   it is rejected); so a family that returns is not varied
 *   again, and the layer grows by one variation a rhythm the band played
 *   long enough;
 * - past `GROOVE_RUNGS`, **rejected**: the composer leaves every rhythm of
 *   the lineage, and the claves that are its own, out of what the repository returns
 *   (decision 043: it may reject what it is given), so it takes the next
 *   nearest, and where none lies near enough, the drummer invents. A
 *   rejected lineage is out until its boredom has faded, as many sections
 *   as it played, then it may be found again.
 *
 * The rungs between vary and fetch (recombining the workbench, fetching
 * far) are not climbed here: a rhythm rejected is the composer asking the
 * repository again without it, which is fetching nearby.
 *
 * **The operators** are cells' (#442, yggi/cells decision 052), asked of
 * the repository (`RhythmRepository.vary`), which reads the rhythm's text:
 * each acts on one line of it, never on the kick or the backbeat, which
 * carry the meter and which cells finds in the text (its anchors), nor on
 * the fill, which the drummer plays its own of (`groove.ts`), so a
 * variation of a fragment's fill would sound as the fragment does
 * (`GROOVE_KEEP`, this repository's policy):
 *
 * - **rotate**: every hit of the line a step later, the last step wrapping
 *   to the first;
 * - **drop**: one of its hits left out, where the bar keeps `GROOVE_FEWEST`;
 * - **add**: one hit of the sound the line strikes first, on a step that
 *   sound is silent on, at the line's loudest, so the drummer, who plays a
 *   fragment's loudest hits first (`groove.ts`), plays it among its first.
 *
 * None strikes one sound twice on a step, and each plays notes the one
 * varied doesn't, nor any variation before it (cells tells them apart by
 * the notes they play, so a rotation that only moves levels is none); a
 * draw picks one of all of them, and the filing names it (`by`, beside
 * `varies`).
 */

import type { LearnedLayer } from './layer.ts';
import type { SectionRhythm } from './rhythm-query.ts';
import { quantize } from './random.ts';

/** A rhythm the composer played lately, the variations it made of it, and how bored it is with them. */
export interface Lineage {
  /** The rhythm found first, a seed rhythm or a groove filed, then each variation made of it, by id. */
  readonly grooves: readonly string[];
  /** The entropy of each section it played, less that of each it didn't, on the draws' grid. */
  readonly boredom: number;
  /** Whether it climbed past the last rung: out of what the repository returns until its boredom fades, its own claves too. */
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
 * nearby and far), which entropy sets until the homeostat's controller
 * drives the ladder from the share recognised (#237, E44): from `PULL_AT_REPEAT` at entropy 0 down to none at 1,
 * in a line, so entropy 0.5 pulls as cells does where it is told nothing;
 * on the draws' grid.
 */
export const pullOf = (entropy: number): number =>
  quantize(PULL_AT_REPEAT * Math.min(1, Math.max(0, 1 - entropy)));

/** The lines no operator touches beside cells' anchors (the kick's and the backbeat's): the fill, which the drummer plays its own of (`groove.ts`). */
export const GROOVE_KEEP: readonly string[] = ['fill'];

/** The rung a boredom stands on: 0 to repeat, 1 to vary, `GROOVE_RUNGS` and past it rejected. */
export const rungOf = (boredom: number): number => Math.floor(boredom / BORED);

/**
 * The drum bar each clave was first chosen to layer on, by id (#430): the
 * clave is that one's, climbs with its lineage, and is rejected with it alone.
 */
export type ClaveOwners = Readonly<Record<string, string>>;

/** No clave chosen yet: a song's start. */
export const NO_CLAVE_OWNERS: ClaveOwners = {};

/** The claves' drum bars with a section's: its clave the drum bar's it layers on, where it was no drum bar's yet. */
export const ownedWith = (
  owners: ClaveOwners,
  { rhythmFragment, claveFragment }: SectionRhythm,
): ClaveOwners =>
  rhythmFragment === undefined || claveFragment === undefined || claveFragment in owners
    ? owners
    : { ...owners, [claveFragment]: rhythmFragment };

/** Every rhythm the composer has rejected, and every clave whose drum bar is among them, by id. */
export function rejectedOf(boredom: Boredom, owners: ClaveOwners = NO_CLAVE_OWNERS): string[] {
  const grooves = boredom.filter((l) => l.rejected).flatMap((l) => l.grooves);
  return [...grooves, ...Object.keys(owners).filter((clave) => grooves.includes(owners[clave]!))];
}

/** The metadata key a variation names the groove it varies by, in the layer (`GrooveFiling.varies`). */
export const VARIES = 'varies';

/** The metadata key a variation names how it varies that groove by, in the layer (`GrooveFiling.by`; cells decision 052, point 6). */
export const BY = 'by';

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
    : { grooves: [...family], boredom: 0, rejected: false };
}

/** Whether the composer varies the lineage's groove now: on a rung past repeat it hasn't made a variation on. */
export function wantsVariation({ grooves, boredom }: Lineage): boolean {
  const rung = rungOf(boredom);
  return rung >= 1 && rung < GROOVE_RUNGS && grooves.length - 1 < rung;
}

/**
 * The boredom a section later: each lineage it played (with any variation it
 * made; one a member, the drums' and the bass's, `facet.ts`) the section's
 * entropy more, rejected where that takes it past the last rung; every other
 * the entropy less, forgotten at none.
 */
export function boredAfter(
  boredom: Boredom,
  playing: readonly Lineage[],
  entropy: number,
): Boredom {
  const step = quantize(entropy);
  const plays = (l: Lineage) => playing.some((p) => l.grooves.some((id) => p.grooves.includes(id)));
  const others = boredom
    .filter((l) => !plays(l))
    .map((l) => ({ ...l, boredom: l.boredom - step }))
    .filter((l) => l.boredom > 0);
  return [
    ...others,
    ...playing.map(({ grooves, boredom: was }) => {
      const grown = was + step;
      return { grooves, boredom: grown, rejected: rungOf(grown) >= GROOVE_RUNGS };
    }),
  ];
}
