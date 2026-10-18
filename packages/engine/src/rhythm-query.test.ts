import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { SONG_METER } from './events.ts';
import { sectionRhythm } from './plan.ts';
import {
  type FragmentRead,
  type FoundRhythm,
  LAYER_DISTANCE,
  RHYTHM_HOLD,
  RHYTHM_MISS,
  type RhythmRepository,
  composedRhythm,
  sectionHits,
} from './rhythm-query.ts';
import { INITIAL_STYLE } from './style.ts';

const ranked = (distances: Record<string, number>): FoundRhythm[] =>
  Object.entries(distances)
    .map(([id, distance]) => ({ id, distance }))
    .sort((x, y) => x.distance - y.distance);

/** A drum bar `d…` reads as a kick on 0; a clave `c…` as a clave line over two bars; `x…` as a hat line. */
const reads = (id: string): FragmentRead =>
  id.startsWith('c')
    ? {
        bars: 2,
        hits: [
          { role: 'clave', note: 37, step: 0, velocity: 90 },
          { role: 'clave', note: 37, step: 20, velocity: 90 },
        ],
      }
    : {
        bars: 1,
        hits: [{ role: id.startsWith('x') ? 'hat' : 'kick', note: 36, step: 0, velocity: 100 }],
      };

/** A repository that finds each rhythm, and each line layered with any, at the distances given. */
const at = (
  rhythms: Record<string, number>,
  layered: Record<string, number> = {},
): RhythmRepository & { asked: unknown[] } => {
  const asked: unknown[] = [];
  return {
    asked,
    query: (point, bench) => {
      asked.push(bench);
      return ranked(rhythms);
    },
    layered: (_point, _bench, chosen) => ranked(layered).filter((f) => f.id !== chosen),
    read: (id) => reads(id),
  };
};

const bench = { meter: SONG_METER, meterFragment: '4/4' };

describe('the composer asks the repository for a rhythm (#397)', () => {
  it('takes the nearest that fits, and none past the miss distance or where none fits: the drummer invents', () => {
    expect(composedRhythm(at({ d1: 0.1, d2: 0.2 }), INITIAL_STYLE, bench, null)).toEqual({
      rhythmFragment: 'd1',
    });
    expect(composedRhythm(at({ d1: RHYTHM_MISS }), INITIAL_STYLE, bench, null)).toEqual({
      rhythmFragment: 'd1',
    });
    expect(composedRhythm(at({ d1: RHYTHM_MISS + 1e-9 }), INITIAL_STYLE, bench, null)).toEqual({});
    expect(composedRhythm(at({}), INITIAL_STYLE, bench, null)).toEqual({});
  });

  it('asks with the section’s meter and its fragment as the bench', () => {
    const repository = at({ d1: 0 });
    composedRhythm(repository, INITIAL_STYLE, bench, null);
    expect(repository.asked).toEqual([bench]);
  });

  it('holds the rhythm playing unless another is nearer by more than the margin, and not past the miss distance', () => {
    const holds = (by: number) =>
      composedRhythm(at({ d2: 0.1, d1: 0.1 + by }), INITIAL_STYLE, bench, { rhythmFragment: 'd1' })
        .rhythmFragment;
    expect([holds(RHYTHM_HOLD * 0.99), holds(RHYTHM_HOLD * 1.01)]).toEqual(['d1', 'd2']);
    expect(
      composedRhythm(
        at({ d2: RHYTHM_MISS - 0.01, d1: RHYTHM_MISS + 0.005 }),
        INITIAL_STYLE,
        bench,
        {
          rhythmFragment: 'd1',
        },
      ).rhythmFragment,
    ).toBe('d2');
  });

  it('chooses a line of its own with it, the nearest that layers within the layer distance, never one that names a role of the drummer’s', () => {
    expect(
      composedRhythm(at({ d1: 0 }, { x1: 0.01, c1: 0.05 }), INITIAL_STYLE, bench, null),
    ).toEqual({ rhythmFragment: 'd1', claveFragment: 'c1' });
    expect(
      composedRhythm(at({ d1: 0 }, { c1: LAYER_DISTANCE + 1e-9 }), INITIAL_STYLE, bench, null),
    ).toEqual({ rhythmFragment: 'd1' });
    const held = (by: number) =>
      composedRhythm(at({ d1: 0 }, { c2: 0.05, c1: 0.05 + by }), INITIAL_STYLE, bench, {
        rhythmFragment: 'd1',
        claveFragment: 'c1',
      }).claveFragment;
    expect([held(RHYTHM_HOLD * 0.99), held(RHYTHM_HOLD * 1.01)]).toEqual(['c1', 'c2']);
  });

  it('holds the clave playing a margin past the layer distance, where it takes no new one', () => {
    const edge = (distance: number, playing?: string) =>
      composedRhythm(at({ d1: 0 }, { c1: distance }), INITIAL_STYLE, bench, {
        rhythmFragment: 'd1',
        ...(playing ? { claveFragment: playing } : {}),
      }).claveFragment;
    const past = LAYER_DISTANCE + RHYTHM_HOLD / 2;
    expect([edge(past, 'c1'), edge(past), edge(LAYER_DISTANCE + RHYTHM_HOLD * 1.01, 'c1')]).toEqual(
      ['c1', undefined, undefined],
    );
  });

  it('takes the margins a repository names in place of its own, as an experiment does', () => {
    const repository = { ...at({ d2: 0.1, d1: 0.11 }), margins: { miss: 0.05, hold: 0, layer: 0 } };
    expect(composedRhythm(repository, INITIAL_STYLE, bench, { rhythmFragment: 'd1' })).toEqual({});
  });

  it('asks nothing with no repository, as before #397', () => {
    expect(
      sectionRhythm({ style: INITIAL_STYLE }, { meter: SONG_METER, swing: '16n' }, null),
    ).toEqual({});
  });
});

describe("a section's fragments in its bars (#397)", () => {
  const repository = at({});
  it('plays each fragment’s bar of its lap: a clave of two bars alternates from the section’s start', () => {
    const hits = (barInSection: number) =>
      sectionHits(
        repository,
        { rhythmFragment: 'd1', claveFragment: 'c1' },
        METERS['4/4'],
        barInSection,
        16,
      ).map((h) => `${h.role}${h.step}`);
    expect(hits(0)).toEqual(['kick0', 'clave0']);
    expect(hits(1)).toEqual(['kick0', 'clave4']);
    expect(hits(6)).toEqual(['kick0', 'clave0']);
    expect(sectionHits(repository, {}, METERS['4/4'], 0, 16)).toEqual([]);
  });
});
