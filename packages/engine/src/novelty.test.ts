import { METERS, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { DRUM_NOTES } from './drums.ts';
import { GROOVE_FEWEST, grooveText } from './muse-groove.ts';
import {
  BORED,
  GROOVE_KEEP,
  GROOVE_RUNGS,
  PULL_AT_REPEAT,
  type Lineage,
  NO_BOREDOM,
  NO_CLAVE_OWNERS,
  VARIES,
  boredAfter,
  familyOf,
  lineageOf,
  pullOf,
  rejectedOf,
  rungOf,
  ownedWith,
  wantsVariation,
} from './novelty.ts';
import type { FragmentHit, RhythmRepository, RhythmVariation } from './rhythm-query.ts';
import { quantize } from './random.ts';
import { readRhythm, rhythmRepository } from './rhythms.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { CO_USE_PULL } from '@yggi/cells/repository/fragments';

const range = (n: number) => [...Array(n).keys()];
const hit = (role: string, note: number, step: number, velocity: number): FragmentHit => ({
  role,
  note,
  step,
  velocity,
});

/** A 5/4 groove of 20 steps: a kick, a backbeat, a ghost and hats on the eighths. */
const FIVE = METERS['5/4'];
const STEPS = stepsOf(FIVE);
const GROOVE: FragmentHit[] = [
  hit('kick', DRUM_NOTES.kick, 0, 110),
  hit('hat', DRUM_NOTES.closedHat, 0, 80),
  hit('hat', DRUM_NOTES.closedHat, 2, 60),
  hit('hat', DRUM_NOTES.closedHat, 4, 80),
  hit('backbeat', DRUM_NOTES.snare, 4, 100),
  hit('hat', DRUM_NOTES.closedHat, 6, 60),
  hit('ghost', DRUM_NOTES.snare, 7, 40),
  hit('kick', DRUM_NOTES.kick, 10, 100),
  hit('backbeat', DRUM_NOTES.snare, 12, 100),
];

const sorted = (hits: readonly FragmentHit[]) =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);
const key = (hits: readonly FragmentHit[]) =>
  JSON.stringify(sorted(hits).map((h) => [h.role, h.note, h.step, h.velocity]));
const lineOf = (hits: readonly FragmentHit[], role: string) => hits.filter((h) => h.role === role);

/** A groove's lines as the bar plays them: its kick and backbeat, which cells finds in its text, and the rest. */
const ANCHORED = ['kick', 'backbeat'];

/** Draws enough to take every variation of a bar, each at least once: a thousand, evenly. */
const DRAWS = range(1000).map((i) => (i + 0.5) / 1000);

/** A repository with a groove filed in it, on the 5/4 bench: the groove's id, and the layer it is filed in. */
function filed(
  hits: readonly FragmentHit[],
  repository: RhythmRepository = rhythmRepository(),
): { repository: RhythmRepository; id: string; layer: LearnedLayer } {
  const { id, layer } = repository.file!(EMPTY_LAYER, {
    hits,
    bench: { meter: FIVE },
    point: { energy: 0.5 },
    source: 'drummer',
    created: 'bar 0',
    tags: ['groove'],
  });
  return { repository, id, layer };
}

/** Every variation the repository gives a groove (`vary`), each once, in the order the draws take them. */
function variationsOf(hits: readonly FragmentHit[]): RhythmVariation[] {
  const { repository, id, layer } = filed(hits);
  const seen = new Map<string, RhythmVariation>();
  for (const d of DRAWS) {
    const v = repository.vary!(id, { meter: FIVE }, d, layer);
    if (v && !seen.has(v.by)) seen.set(v.by, v);
  }
  return [...seen.values()];
}

describe('the operators that vary a groove, cells’ (#411, #442; yggi/cells decision 052)', () => {
  const varied = variationsOf(GROOVE);
  const all = varied.map((v) => v.hits);

  it('rotates a line a step later, drops one of its hits, or adds one at its loudest on a step its sound is silent on', () => {
    // the ghost: 1 rotation, 1 drop, 17 steps to add on (its sound strikes 4, 7 and 12); the hats: 1, 4 and 16
    expect(all).toHaveLength(1 + 1 + 17 + (1 + 4 + 16));
    const hatsRotated = all.filter(
      (v) =>
        key(lineOf(v, 'hat').map((h) => ({ ...h, step: h.step - 1 }))) ===
        key(lineOf(GROOVE, 'hat')),
    );
    expect(hatsRotated).toHaveLength(1);
    expect(lineOf(hatsRotated[0]!, 'ghost')).toEqual(lineOf(GROOVE, 'ghost'));
    const ghostRotated = all.find(
      (v) =>
        key(lineOf(v, 'hat')) === key(lineOf(GROOVE, 'hat')) && lineOf(v, 'ghost')[0]?.step === 8,
    );
    expect(ghostRotated).toBeDefined();
    const added = all.filter((v) => v.length === GROOVE.length + 1);
    expect(added).toHaveLength(17 + 16);
    for (const v of added) {
      const [extra] = v.filter((h) => !GROOVE.some((g) => key([g]) === key([h])));
      expect(extra!.velocity).toBe(Math.max(...lineOf(GROOVE, extra!.role).map((h) => h.velocity)));
    }
  });

  it('names each as cells’ vary does, for the filing’s `by`: its operator, its line and its step, in the order the draws take them (the hats first, the line the bar first plays past its anchors, then the ghost)', () => {
    const by = varied.map((v) => v.by);
    expect(by.slice(0, 3)).toEqual(['rotate &hat', 'drop &hat 0', 'drop &hat 2']);
    expect(by.slice(21, 23)).toEqual(['rotate &ghost', 'drop &ghost 7']);
    expect(by.every((b) => /^(rotate|drop|add) &(ghost|hat)( \d+)?$/.test(b))).toBe(true);
  });

  it('never touches the kick or the backbeat, which carry the meter and which cells finds in the text', () => {
    for (const v of all)
      for (const role of ANCHORED) expect(key(lineOf(v, role))).toBe(key(lineOf(GROOVE, role)));
  });

  it('gives grooves that differ from the one varied and from each other, with no two strikes of one sound on a step and at least as many hits as a groove holds', () => {
    const keys = new Set(all.map(key));
    expect(keys.size).toBe(all.length);
    expect(keys.has(key(GROOVE))).toBe(false);
    for (const v of all) {
      expect(new Set(v.map((h) => `${h.step}:${h.note}`)).size).toBe(v.length);
      expect(v.length).toBeGreaterThanOrEqual(GROOVE_FEWEST);
      expect(v.every((h) => h.step >= 0 && h.step < STEPS)).toBe(true);
    }
  });

  it('reads each back as cells plays its whole text, though only its varied line is read', () => {
    const { repository, id, layer } = filed(GROOVE);
    const text = layer.filed.find((f) => f.fragment.id === id)!.fragment.text;
    for (const d of [0, 0.3, 0.6, 0.99]) {
      const v = repository.vary!(id, { meter: FIVE }, d, layer)!;
      expect(text).not.toBe(grooveText(v.hits, STEPS));
      expect(readRhythm(grooveText(v.hits, STEPS), FIVE)!.hits).toEqual(sorted(v.hits));
    }
  });

  it('reads back from cells hit for hit, every variation stated as a groove is (the round trip filing relies on)', () => {
    for (const v of all) expect(readRhythm(grooveText(v, STEPS), FIVE)!.hits).toEqual(sorted(v));
  });

  it('drops no hit where the bar would hold fewer than a groove, and gives none where only the anchors play', () => {
    const three = [GROOVE[0]!, GROOVE[4]!, GROOVE[6]!];
    expect(variationsOf(three).every((v) => v.hits.length >= GROOVE_FEWEST)).toBe(true);
    expect(variationsOf(three).filter((v) => v.hits.length < three.length)).toEqual([]);
    const anchors = GROOVE.filter((h) => ANCHORED.includes(h.role));
    const { repository, id, layer } = filed(anchors);
    expect(DRAWS.map((d) => repository.vary!(id, { meter: FIVE }, d, layer))).toEqual(
      DRAWS.map(() => null),
    );
  });

  it('never touches the fill, which the drummer plays its own of: a variation of it would sound as the groove does', () => {
    expect(GROOVE_KEEP).toEqual(['fill']);
    const withFill = [
      ...GROOVE,
      hit('fill', DRUM_NOTES.snare, 17, 60),
      hit('fill', DRUM_NOTES.snare, 18, 80),
    ];
    const withIt = variationsOf(withFill).map((v) => v.hits);
    // the others as without it, but for the ghost's two adds on the steps the fill's snare strikes
    expect(withIt).toHaveLength(all.length - 2);
    for (const v of withIt) expect(key(lineOf(v, 'fill'))).toBe(key(lineOf(withFill, 'fill')));
  });

  it('varies a groove filed only with the layer that filed it, and no rhythm it doesn’t hold', () => {
    const { repository, id, layer } = filed(GROOVE);
    expect(repository.vary!(id, { meter: FIVE }, 0.5, layer)).not.toBeNull();
    expect(repository.vary!(id, { meter: FIVE }, 0.5)).toBeNull();
    expect(repository.vary!('no such groove', { meter: FIVE }, 0.5, layer)).toBeNull();
  });
});

describe('the composer’s boredom with a groove: the novelty ladder (#411; cells decision 043)', () => {
  /** The lineage a groove plays over sections at one entropy, varied as the ladder says: each section's rung. */
  function climb(entropy: number, sections: number) {
    let boredom = NO_BOREDOM;
    const rungs: { rung: number; varies: boolean; rejected: boolean }[] = [];
    for (const section of range(sections)) {
      if (rejectedOf(boredom).includes('g')) {
        rungs.push({ rung: -1, varies: false, rejected: true });
        boredom = boredAfter(boredom, [], entropy);
        continue;
      }
      let playing: Lineage = lineageOf(boredom, ['g']);
      const varies = wantsVariation(playing);
      if (varies) playing = { ...playing, grooves: [...playing.grooves, `v${section}`] };
      rungs.push({ rung: rungOf(playing.boredom), varies, rejected: false });
      boredom = boredAfter(boredom, [playing], entropy);
    }
    return { rungs, boredom };
  }

  it('climbs a rung each BORED of boredom, a section’s entropy a section: repeat, vary, then reject', () => {
    expect([BORED, GROOVE_RUNGS]).toEqual([3, 2]);
    const { rungs } = climb(1, 8);
    // at entropy 1 the groove plays 3 sections, its variation the 4th to 6th, and the 7th rejects it
    expect(rungs.map((r) => (r.rejected ? 'x' : r.varies ? 'v' : String(r.rung)))).toEqual([
      '0',
      '0',
      '0',
      'v',
      '1',
      '1',
      'x',
      'x',
    ]);
  });

  it('holds the groove at entropy 0: never bored, never varied', () => {
    const { rungs, boredom } = climb(0, 200);
    expect(rungs.every((r) => r.rung === 0 && !r.varies && !r.rejected)).toBe(true);
    expect(boredom).toEqual([{ grooves: ['g'], boredom: 0, rejected: false }]);
  });

  it('varies after 10 sections at entropy 0.3 and rejects after 20, the boredom counted on a grid so 0.3 ten times is 3', () => {
    const { rungs } = climb(0.3, 22);
    expect(rungs.findIndex((r) => r.varies)).toBe(10);
    expect(rungs.findIndex((r) => r.rejected)).toBe(20);
  });

  it('lets a rejected groove go as it grew: it returns after as many sections as it played', () => {
    // at entropy 1: rejected after 6 sections, out for the next 6
    const { rungs, boredom } = climb(1, 13);
    expect(rungs.map((r) => r.rejected)).toEqual([
      ...range(6).map(() => false),
      ...range(6).map(() => true),
      false,
    ]);
    expect(boredom).toEqual([{ grooves: ['g'], boredom: 1, rejected: false }]);
  });

  it('fades a lineage it no longer plays by the entropy a section, and forgets it at none', () => {
    const one = boredAfter(NO_BOREDOM, [{ grooves: ['g'], boredom: 0, rejected: false }], 0.5);
    expect(one).toEqual([{ grooves: ['g'], boredom: 0.5, rejected: false }]);
    expect(boredAfter(one, [], 0.25)).toEqual([{ grooves: ['g'], boredom: 0.25, rejected: false }]);
    expect(boredAfter(boredAfter(one, [], 0.25), [], 0.25)).toEqual([]);
    // a lineage fades as another plays
    const two = boredAfter(one, [{ grooves: ['h'], boredom: 0, rejected: false }], 0.5);
    expect(two).toEqual([{ grooves: ['h'], boredom: 0.5, rejected: false }]);
  });

  it('finds the lineage a groove’s family belongs to, with every groove of the family, a new one at no boredom for a family it has not played', () => {
    const boredom = [{ grooves: ['g', 'v'], boredom: 2, rejected: false }];
    expect(lineageOf(boredom, ['v'])).toEqual(boredom[0]);
    expect(lineageOf(boredom, ['g', 'v', 'w'])).toEqual({
      ...boredom[0],
      grooves: ['g', 'v', 'w'],
    });
    expect(lineageOf(boredom, ['h'])).toEqual({
      grooves: ['h'],
      boredom: 0,
      rejected: false,
    });
    expect(rejectedOf([{ grooves: ['g', 'v'], boredom: 6, rejected: true }, ...boredom])).toEqual([
      'g',
      'v',
    ]);
  });

  it('reads a groove’s family from the layer: the groove it varies, followed back to the first, and every groove filed from that one', () => {
    const filing = (hits: readonly FragmentHit[], created: string, varies?: string) => ({
      hits,
      bench: { meter: FIVE },
      point: { energy: 0.5 },
      source: varies === undefined ? 'drummer' : 'composer',
      created,
      tags: ['groove'],
      varies,
    });
    const repository = rhythmRepository();
    let layer = EMPTY_LAYER;
    const fileIt = (hits: readonly FragmentHit[], created: string, varies?: string) => {
      const filed = repository.file!(layer, filing(hits, created, varies));
      layer = filed.layer;
      return filed.id;
    };
    const all = variationsOf(GROOVE).map((v) => v.hits);
    const g = fileIt(GROOVE, 'bar 0');
    const h = fileIt(all[0]!, 'bar 8');
    const v = fileIt(all[1]!, 'bar 16', g);
    const w = fileIt(all[2]!, 'bar 24', v);
    expect(layer.filed.find((f) => f.fragment.id === v)!.meta).toMatchObject({ [VARIES]: g });
    expect(familyOf(layer, w)).toEqual([g, v, w]);
    expect(familyOf(layer, g)).toEqual([g, v, w]);
    expect(familyOf(layer, h)).toEqual([h]);
    expect(familyOf(layer, 'Funk drums')).toEqual(['Funk drums']);
  });

  it('reads a seed rhythm’s family from the layer too: the seed rhythm first, which the layer didn’t file, then every groove filed from it (#414)', () => {
    const repository = rhythmRepository();
    const varyFunk = (d: number) =>
      repository.vary!('Funk drums', { meter: METERS['4/4'] }, d, EMPTY_LAYER)!.hits;
    const [one, two] = [varyFunk(0), varyFunk(0.5)];
    let layer = EMPTY_LAYER;
    const fileIt = (hits: readonly FragmentHit[], created: string, varies: string) => {
      const filed = repository.file!(layer, {
        hits,
        bench: { meter: METERS['4/4'] },
        point: { energy: 0.5 },
        source: 'composer',
        created,
        tags: ['groove'],
        varies,
      });
      layer = filed.layer;
      return filed.id;
    };
    const v = fileIt(one!, 'bar 80', 'Funk drums');
    const w = fileIt(two!, 'bar 160', v);
    expect(familyOf(layer, 'Funk drums')).toEqual(['Funk drums', v, w]);
    expect(familyOf(layer, w)).toEqual(['Funk drums', v, w]);
    expect(familyOf(layer, 'Techno drums')).toEqual(['Techno drums']);
  });

  it('keeps each clave the drum bar’s it was first chosen to layer on, and rejects it with that one’s lineage alone: the clave climbs with the drum bar (#414, #430)', () => {
    const RUMBA = 'rumba clave 3-2';
    const owners = ownedWith(NO_CLAVE_OWNERS, {
      rhythmFragment: 'Funk drums',
      claveFragment: RUMBA,
    });
    expect(owners).toEqual({ [RUMBA]: 'Funk drums' });
    // layering on another rhythm meanwhile doesn't make it that one's, and a section with no clave or no drum bar adds none
    for (const section of [
      { rhythmFragment: 'drummer g', claveFragment: RUMBA },
      { rhythmFragment: 'drummer g' },
      { claveFragment: 'son clave 3-2' },
    ])
      expect(ownedWith(owners, section)).toBe(owners);
    // carried section to section, and out with the drum bar's lineage once it climbs past the last rung
    let boredom = NO_BOREDOM;
    for (let section = 0; section < 6; section++)
      boredom = boredAfter(boredom, [lineageOf(boredom, ['Funk drums'])], 1);
    expect(rejectedOf(boredom, owners)).toEqual(['Funk drums', RUMBA]);
    expect(rejectedOf(boredom)).toEqual(['Funk drums']);
    // a lineage it layered on meanwhile is rejected without it, and once the drum bar's has faded, it is free again
    const other: Lineage = { grooves: ['drummer g'], boredom: 6, rejected: true };
    expect(rejectedOf([other], owners)).toEqual(['drummer g']);
    let faded = boredom;
    for (let section = 0; section < 6; section++) faded = boredAfter(faded, [], 1);
    expect(faded).toEqual([]);
    expect(rejectedOf([...faded, other], owners)).toEqual(['drummer g']);
  });
});

describe('how strongly the composer keeps a group: the pull of use together from its place on the ladder (#389)', () => {
  it('pulls twice cells’ default at entropy 0 (repeat), cells’ default at 0.5, and not at all at 1 (fetch far): linear between, on the draws’ grid', () => {
    expect(PULL_AT_REPEAT).toBe(2 * CO_USE_PULL);
    expect([pullOf(0), pullOf(0.5), pullOf(1)]).toEqual([quantize(0.2), quantize(CO_USE_PULL), 0]);
    expect(pullOf(0.3)).toBe(quantize(0.14));
    const pulls = range(101).map((i) => pullOf(i / 100));
    expect(pulls.every((p, i) => i === 0 || p <= pulls[i - 1]!)).toBe(true);
    expect(pulls.every((p) => p >= 0)).toBe(true);
  });
});
