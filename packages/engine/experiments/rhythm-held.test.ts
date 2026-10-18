import { describe, expect, it } from 'vitest';
import { LAYER_CAP, layerBytes } from '../src/layer.ts';
import { PRESETS } from '../src/style.ts';
import { COMPOSER } from '../src/plan.ts';
import { drumDistance, drumOverlap, heldRuns, mostUsedRhythm } from './rhythm-radio.ts';

// E40 (#414): E37's runs with each preset held at entropy 0.3, an hour a run: the band as `main` plays it (no layer:
// with a seed rhythm found, nothing is filed and nothing climbs, so a held preset plays its drum bar every section),
// and the band learning, where a seed rhythm climbs the novelty ladder as a groove filed does.
const MAIN = heldRuns(false);
const CLIMBING = heldRuns(true);
if (process.env.E37_REPORT)
  console.log({
    mostUsed: [mostUsedRhythm(MAIN), mostUsedRhythm(CLIMBING)],
    distance: drumDistance(CLIMBING, MAIN),
    overlap: drumOverlap(CLIMBING, MAIN),
    bytes: Math.max(...CLIMBING.map((r) => layerBytes(r.learning!.layer))),
  });

describe('a seed rhythm climbs the novelty ladder while a preset is held (E40, #414)', () => {
  it('plays the run’s most used rhythm in 47 % of 8,450 sections, under 60 %, where main plays the preset’s drum bar in every one', () => {
    expect(CLIMBING).toHaveLength(40);
    expect(mostUsedRhythm(MAIN)).toEqual({ sections: 8450, mostUsed: 8450, share: 1 });
    const { sections, mostUsed, share } = mostUsedRhythm(CLIMBING);
    expect([sections, mostUsed]).toEqual([8450, 3974]);
    expect(share).toBeLessThan(0.6);
  });

  it('plays each preset’s own drum bar for 10 sections, then the composer’s variation of it, filed in the layer as varying it', () => {
    for (const run of CLIMBING) {
      const own = `${run.preset} drums`;
      expect(run.kept.slice(0, 10), `${run.preset} ${run.seed}`).toEqual(
        Array.from({ length: 10 }, () => own),
      );
      const varied = run.kept[10]!;
      const filed = run.learning!.layer.filed.find((f) => f.fragment.id === varied)!;
      expect([filed.meta.source, filed.meta.varies], `${run.preset} ${run.seed}`).toEqual([
        COMPOSER,
        own,
      ]);
      // and the drum bar, varied or not, leaves after 20 sections, and may return once its boredom has faded, 20 more
      const family = (id: string) => id === own || id === varied;
      expect(run.kept.slice(20, 40).some(family), `${run.preset} ${run.seed}`).toBe(false);
      expect(run.kept.slice(40).some(family), `${run.preset} ${run.seed}`).toBe(true);
    }
  });

  it('moves the drummer’s hits a role by section type at most 0.05 from main’s: the variations move hits, the drummer still decides how many', () => {
    expect(drumDistance(CLIMBING, MAIN)).toEqual({
      'Synth-pop': 0,
      Techno: 0,
      'Deep house': 0,
      Ambient: 0,
      'Lo-fi hip hop': 0,
      Funk: 0,
      'Bossa nova': 0,
      'Swing jazz': 0.05,
    });
  });

  it('keeps 69 % to 95 % of the drummer’s hits where main plays them, bar beside bar, against all of them on main', () => {
    expect(drumOverlap(MAIN, MAIN)).toEqual(Object.fromEntries(PRESETS.map((p) => [p.name, 1])));
    expect(drumOverlap(CLIMBING, MAIN)).toEqual({
      'Synth-pop': 0.93,
      Techno: 0.91,
      'Deep house': 0.94,
      Ambient: 0.89,
      'Lo-fi hip hop': 0.95,
      Funk: 0.82,
      'Bossa nova': 0.8,
      'Swing jazz': 0.69,
    });
  });

  it(`keeps a layer of at most 3,147 bytes after an hour, under its cap of ${LAYER_CAP.toLocaleString('en')}`, () => {
    expect(Math.max(...CLIMBING.map((r) => layerBytes(r.learning!.layer)))).toBe(3147);
    expect(Math.max(...CLIMBING.map((r) => r.learning!.layer.filed.length))).toBe(3);
  });
});
