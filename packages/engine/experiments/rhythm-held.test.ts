import { describe, expect, it } from 'vitest';
import { LAYER_CAP, layerBytes } from '../src/layer.ts';
import { PRESETS } from '../src/style.ts';
import { COMPOSER } from '../src/facet.ts';
import {
  aloneByPreset,
  claveLost,
  drumDistance,
  drumOverlap,
  heldRuns,
  mostUsedRhythm,
} from './rhythm-radio.ts';

// E40 (#414): E37's runs with each preset held at entropy 0.3, an hour a run: the band as `main` plays it (no layer:
// with a seed rhythm found, nothing is filed and nothing climbs, so a held preset plays its drum bar every section),
// and the band learning, where a seed rhythm climbs the novelty ladder as a groove filed does.
const MAIN = heldRuns(false);
const CLIMBING = heldRuns(true);
if (process.env.E37_REPORT)
  console.log({
    mostUsed: [mostUsedRhythm(MAIN), mostUsedRhythm(CLIMBING)],
    alone: aloneByPreset(CLIMBING),
    claveLost: claveLost(CLIMBING),
    distance: drumDistance(CLIMBING, MAIN),
    overlap: drumOverlap(CLIMBING, MAIN),
    bytes: Math.max(...CLIMBING.map((r) => layerBytes(r.learning!.layer))),
  });

describe('a seed rhythm climbs the novelty ladder while a preset is held (E40, #414)', () => {
  it('plays the run’s most used rhythm in 47 % of 8,450 sections, under 60 %, where main plays the preset’s drum bar in every one', () => {
    expect(CLIMBING).toHaveLength(40);
    expect(mostUsedRhythm(MAIN)).toEqual({ sections: 8450, mostUsed: 8450, share: 1 });
    const { sections, mostUsed, share } = mostUsedRhythm(CLIMBING);
    expect([sections, mostUsed]).toEqual([8450, 3939]);
    expect(share).toBeLessThan(0.6);
  });

  it('plays no clave alone in any section: a line of its own only layers on a drum bar (#428; on main at 9e26a40, 95 sections an hour at Funk, 120 at Bossa nova)', () => {
    expect(aloneByPreset(CLIMBING)).toEqual(Object.fromEntries(PRESETS.map((p) => [p.name, 0])));
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

  it('brings a drum bar back with the clave chosen with it, and the drummer’s groove back without the one it was lent (#430; on main at 09ec1be, 100 sections lost their own)', () => {
    // Funk's variation returns with the rumba clave in each of its 5 runs; the drummer's variation, which the rumba clave
    // layered on at one section while Funk's lineage had faded, returns without it, out with Funk's lineage, 20 sections a run
    expect(claveLost(MAIN)).toEqual({ lost: 0, lent: 0 });
    expect(claveLost(CLIMBING)).toEqual({ lost: 0, lent: 100 });
  });

  it('moves the drummer’s hits a role by section type at most 0.05 from main’s: the variations move hits, the drummer still decides how many', () => {
    expect(drumDistance(CLIMBING, MAIN)).toEqual({
      'Synth-pop': 0,
      Techno: 0,
      'Deep house': 0,
      Ambient: 0,
      'Lo-fi hip hop': 0,
      Funk: 0.03,
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
      Funk: 0.74,
      'Bossa nova': 0.91,
      'Swing jazz': 0.69,
    });
  });

  it(`keeps a layer of at most 3,844 bytes after an hour, each variation naming its operator (by, #442), under its cap of ${LAYER_CAP.toLocaleString('en')}`, () => {
    expect(Math.max(...CLIMBING.map((r) => layerBytes(r.learning!.layer)))).toBe(3844);
    expect(Math.max(...CLIMBING.map((r) => r.learning!.layer.filed.length))).toBe(3);
  });
});
