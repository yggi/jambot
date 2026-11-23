/**
 * The section kinds, read from cells' section fragments (yggi/cells#814, `fragments/sections/` @ v0.27.0; #655): for
 * each of the chain's six kinds, how far it moves a bar's energy from the style's, and which of the band's parts play
 * in it. A kind is two heads there, `&breakdown [&song + -.45]` (its intensity, the song's plus its offset, yggi/cells
 * decision 096) and `&breakdownPlays [0,1,2]` (who plays, the band's entries in its order: the drums, the bass, the pad,
 * the stab, the lead); a build's offset ramps by the bar, a line by its weight (`&buildRise`, 0 to 1 over its bars).
 *
 * This is the one place a section's kind decides who plays: the lead rests where its kind leaves it out (an intro, a
 * breakdown), and the comp plays no stab where its kind leaves the stab out (a breakdown). How a part plays in a kind (a
 * breakdown's hats alone and held roots, a build's fill) is its composer's, as cells' fragments say, and stays with it.
 *
 * Pure: it reads cells' seed library and parser, no I/O.
 */

import { parse } from '@yggi/cells';
import { FEEL_PARTS, resolveSeed, LIBRARY, SECTION_KINDS } from '@yggi/cells/library';
import type { SectionType } from './form.ts';
import { createRepository } from '@yggi/cells/repository';
import { MISS_DISTANCE, type QueriedStyle, stylePoint } from './meter-query.ts';

/** The band's entries, in its order (cells' `&band &drums &bass &pad &stab &lead`, its `FEEL_PARTS`): what a kind's `Plays` indexes. */
export const BAND_ORDER = FEEL_PARTS;
export type BandPart = (typeof BAND_ORDER)[number];

/** A kind as its fragment says it. */
export interface SectionKind {
  /** Its offset from the song's intensity, the sum's number. */
  readonly offset: number;
  /** A ramp by the bar: its weight, and how many bars it climbs 0 to 1 over; null where it holds. */
  readonly ramp: { readonly weight: number; readonly bars: number } | null;
  /** The parts that play in it. */
  readonly plays: readonly BandPart[];
}

type Decl = ReturnType<typeof parse>['cells'][number];
type Expr = Extract<Decl['braid'], { kind: 'list' }>['tokens'][number]['atom'];

/** A kind read from its fragment, `&<kind>` and `&<kind>Plays`; an error where the fragment says what this can't read. */
function kindOf(type: SectionType): SectionKind {
  const text = resolveSeed(type);
  if (text === null) throw new Error(`cells has no section kind ${type}`);
  const cells = new Map(parse(text).cells.map((c) => [c.name, c]));
  const atom = (name: string): Expr | undefined => {
    const d = cells.get(name);
    return d?.braid.kind === 'list' ? d.braid.tokens[0]?.atom : undefined;
  };
  const sum = atom(type);
  if (sum?.kind !== 'mix' || sum.exprs.length !== 1)
    throw new Error(`${type}: its intensity is no sum`);
  const top = sum.exprs[0]!;
  const items = top.k === 'sum' ? top.items : [{ e: top, sign: 1 as const }];
  let offset = 0;
  let ramp: SectionKind['ramp'] = null;
  for (const { e, sign } of items) {
    if (e.k === 'num') offset += sign * e.value;
    else if (e.k === 'ref' && e.ref.name === 'song') continue;
    else if (e.k === 'prod' && e.factors.length === 2) {
      const [by, weight] = e.factors as [(typeof e.factors)[number], (typeof e.factors)[number]];
      if (by.k !== 'ref' || weight.k !== 'num')
        throw new Error(`${type}: a term of its intensity this can't read`);
      const line = cells.get(by.ref.name);
      const steps =
        line?.braid.kind === 'list'
          ? line.braid.tokens.map((t) => (t.atom.kind === 'note' ? t.atom.value : NaN))
          : [];
      // (a ramp is a line by the bar from 0 to 1, k/(n − 1) at its k-th bar, as the fragment writes it to twelve places)
      if (steps.length < 2 || steps.some((v, k) => Math.abs(v - k / (steps.length - 1)) > 1e-9))
        throw new Error(`${type}: its ramp is no line from 0 to 1 by the bar`);
      ramp = { weight: sign * weight.value, bars: steps.length };
    } else throw new Error(`${type}: a term of its intensity this can't read`);
  }
  const plays = atom(`${type}Plays`);
  const entries =
    plays?.kind === 'chord' ? plays.notes : plays?.kind === 'note' ? [plays.value] : null;
  if (!entries || entries.some((i) => !BAND_ORDER[i]))
    throw new Error(`${type}: who plays is no chord of the band's entries`);
  return { offset, ramp, plays: BAND_ORDER.filter((_, i) => entries.includes(i)) };
}

const KINDS = new Map<SectionType, SectionKind>();
/** A kind as cells' fragment says it, read once. */
export function sectionKind(type: SectionType): SectionKind {
  let kind = KINDS.get(type);
  if (!kind) KINDS.set(type, (kind = kindOf(type)));
  return kind;
}

/** Whether a part plays in a section of a kind. */
export const kindPlays = (type: SectionType, part: BandPart): boolean =>
  sectionKind(type).plays.includes(part);

/**
 * How far a kind moves a bar's energy from its style's: its offset, and a build's ramp by its weight at the bar,
 * `offset + (weight · bar) / (bars − 1)`, the order Jambot's ramp was summed in.
 */
export function kindOffset(type: SectionType, barInSection: number): number {
  const { offset, ramp } = sectionKind(type);
  return ramp ? offset + (ramp.weight * barInSection) / (ramp.bars - 1) : offset;
}

/** Cells' song forms (yggi/cells#815, `fragments/songs/`): the library's fragments of the facet `song`, a repository of their own. */
const SONGS = createRepository(
  LIBRARY.filter((f) => f.association.some((p) => p.facet === 'song')),
);

const FOUND = new Map<string, string | null>();
/**
 * The song form cells finds first at a style, by id, within the composer's reach (`MISS_DISTANCE`); null on a miss,
 * where the chain plays. Each of cells' 23 styles finds one at its own point (yggi/cells#815).
 */
export function songFormAt(style: QueriedStyle): string | null {
  const point = stylePoint(style);
  const key = JSON.stringify(point);
  if (!FOUND.has(key)) {
    const [first] = SONGS.query(point, 1, {}, { facet: 'song' });
    FOUND.set(key, first && first.distance <= MISS_DISTANCE ? first.fragment.id : null);
  }
  return FOUND.get(key)!;
}

const FORMS = new Map<string, readonly SectionType[]>();
/** A song form's sections, in order, as its head's line splices the kinds (`&verseChorus &intro &verse …`). */
export function songSections(id: string): readonly SectionType[] {
  let sections = FORMS.get(id);
  if (!sections) {
    const text = resolveSeed(id);
    const head = text === null ? undefined : /^&(\w+),/.exec(text)?.[1];
    const line = head === undefined ? undefined : parse(text!).cells.find((c) => c.name === head);
    const refs =
      line?.braid.kind === 'list'
        ? line.braid.tokens.map((t) => (t.atom.kind === 'ref' ? t.atom.name : ''))
        : [];
    if (!refs.length || refs.some((r) => !KNOWN.has(r)))
      throw new Error(`${id}: no song form of the section kinds`);
    FORMS.set(id, (sections = refs as SectionType[]));
  }
  return sections;
}
/** The kinds a song form may name: cells' library's (`SECTION_KINDS`), each a `SectionType` (`form.test.ts`). */
const KNOWN = new Set<string>(SECTION_KINDS);
