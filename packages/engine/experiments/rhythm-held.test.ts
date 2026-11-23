import { beforeAll, describe, expect, it } from 'vitest';
import { LAYER_CAP, layerBytes } from '../src/layer.ts';
import { PROTOTYPE_PRESETS } from '../src/style.ts';
import { COMPOSER } from '../src/facet.ts';
import {
  type RhythmRun,
  aloneByPreset,
  claveLost,
  drumDistance,
  drumOverlap,
  heldRuns,
  mostUsedRhythm,
} from './rhythm-radio.ts';
import { wordOf } from '@yggi/cells/repository';

// E40 (#414): E37's runs with each preset held at entropy 0.3, an hour a run: the band as `main` plays it (no layer:
// with a seed rhythm found, nothing is filed and nothing climbs, so a held preset plays its drum bar every section),
// and the band learning, where a seed rhythm climbs the novelty ladder as a groove filed does.
// Played before the tests rather than as the file is imported, so the time is the file's, and run first (the
// engine's `hookTimeout`).
let MAIN: RhythmRun[] = [];
let CLIMBING: RhythmRun[] = [];
beforeAll(() => {
  MAIN = heldRuns(false);
  CLIMBING = heldRuns(true);
  if (process.env.E37_REPORT)
    console.log({
      mostUsed: [mostUsedRhythm(MAIN), mostUsedRhythm(CLIMBING)],
      alone: aloneByPreset(CLIMBING),
      claveLost: claveLost(CLIMBING),
      distance: drumDistance(CLIMBING, MAIN),
      overlap: drumOverlap(CLIMBING, MAIN),
      bytes: Math.max(...CLIMBING.map((r) => layerBytes(r.learning!.layer))),
    });
});

describe('a seed rhythm climbs the novelty ladder while a preset is held (E40, #414)', () => {
  it('plays the run’s most used rhythm in 42 % of 8,450 sections, under 60 %, where main plays the preset’s drum bar in 89 %, its groove mixes the next nearest', () => {
    expect(CLIMBING).toHaveLength(40);
    // (in every one before the station's mixes, #547 step 2: a groove mix of a song plays the next nearest drum bar)
    expect(mostUsedRhythm(MAIN)).toEqual({
      sections: 8450,
      mostUsed: 7528,
      share: 7528 / 8450,
    });
    const { sections, mostUsed, share } = mostUsedRhythm(CLIMBING);
    // (3,944 before #651 held Salsa drums, which Funk's runs turn to once tired of their own; 3,969 before cells v0.29.0,
    // whose breathing drums the drummer holds and whose three accented grooves it reads with their levels, yggi/cells#799
    // and #890; 3,975 before the station's mixes, #547 step 2)
    expect([sections, mostUsed]).toEqual([8450, 3534]);
    expect(share).toBeLessThan(0.6);
  });

  it('plays no clave alone in any section: a line of its own only layers on a drum bar (#428; on main at 9e26a40, 95 sections an hour at Funk, 120 at Bossa nova)', () => {
    expect(aloneByPreset(CLIMBING)).toEqual(
      Object.fromEntries(PROTOTYPE_PRESETS.map((p) => [p.name, 0])),
    );
  });

  it('plays each preset’s own drum bar for 10 sections, then the composer’s variation of it, filed in the layer as varying it', () => {
    for (const run of CLIMBING) {
      const own = wordOf(`${run.preset} drums`);
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

  it('brings a drum bar back with the clave chosen with it, and lends it to no groove of the drummer’s (#430; on main at 09ec1be, 100 sections lost their own)', () => {
    // Funk's variation returns with the rumba clave in each of its 5 runs. Before #651 held Salsa drums, Funk's tired
    // runs had no drum bar near, the drummer invented, and its variation, which the rumba clave layered on at one section
    // while Funk's lineage had faded, returned without it, 20 sections a run (100 lent); now those sections play Salsa
    // drums, which plays its own clave, and the drummer invents nothing there to lend it to
    expect(claveLost(MAIN)).toEqual({ lost: 0, lent: 0 });
    expect(claveLost(CLIMBING)).toEqual({ lost: 0, lent: 0 });
  });

  // (the roles the drummer writes of its own, `OWN_ROLES`: Salsa drums' ostinato, which Funk's runs play once tired,
  // plays as written, #651; Funk 0.03 before, where the drummer's own groove played past the drum bar; Deep house 0.01,
  // Bossa nova 0.02 and Swing jazz 0.05 before #655's song forms; Bossa nova 0.02 before cells v0.29.0; Lo-fi hip hop
  // 0.01 before the station's mixes, #547 step 2)
  it('moves the drummer’s hits a role by section type at most 0.05 from main’s: the variations move hits, the drummer still decides how many', () => {
    expect(drumDistance(CLIMBING, MAIN)).toEqual({
      'Synth-pop': 0,
      Techno: 0,
      'Deep house': 0,
      Ambient: 0,
      'Lo-fi hip hop': 0,
      Funk: 0,
      'Bossa nova': 0.01,
      'Swing jazz': 0.01,
    });
  });

  // (since cells v0.23.0 the next nearest drum bar is Electro swing drums at Lo-fi hip hop and Bossa nova, on sync harm
  // bite mood, and Acid drums at Techno, where the drummer invented, until cells v0.24.0's March drums, nearer: each
  // plays the drums further from main's; Techno 59 % with Acid drums; Lo-fi hip hop 67 % before cells v0.27.1; Ambient 90 %,
  // Lo-fi hip hop 66 % and Bossa nova 63 % before cells v0.29.0; 65 % to 95 % before #655's song forms: Synth-pop
  // 0.92, Techno 0.82, Deep house 0.95, Ambient 0.89, Lo-fi hip hop 0.67, Funk 0.74, Bossa nova 0.65, Swing jazz 0.78;
  // before the station's mixes, #547 step 2, which hold a song's drum bar through its play: Synth-pop 0.87, Techno 0.79,
  // Ambient 0.89, Bossa nova 0.62, Swing jazz 0.74)
  it('keeps 63 % to 92 % of the drummer’s hits where main plays them, bar beside bar, against all of them on main', () => {
    expect(drumOverlap(MAIN, MAIN)).toEqual(
      Object.fromEntries(PROTOTYPE_PRESETS.map((p) => [p.name, 1])),
    );
    expect(drumOverlap(CLIMBING, MAIN)).toEqual({
      'Synth-pop': 0.88,
      Techno: 0.82,
      'Deep house': 0.92,
      Ambient: 0.9,
      'Lo-fi hip hop': 0.65,
      Funk: 0.72,
      'Bossa nova': 0.63,
      'Swing jazz': 0.78,
    });
  });

  // (3,682 bytes before cells v0.24.0, whose grooves' lines write their roles, `role=kick`, and whose March drums Techno
  // turns to)
  it(`keeps a layer of at most 2,086 bytes after an hour, each variation naming its operator (by, #442), under its cap of ${LAYER_CAP.toLocaleString('en')}`, () => {
    // (3,860 before the layer kept the composer's groove variations by reference, as a host keeps it, #553; 2,577
    // before the ostinato on top of cells v0.25.1, #651, where Funk's drummer no longer files its own once tired of Funk's, which now plays Salsa drums; 1,954 before #655's song forms; 1,866 before cells v0.27.1; 1,867 before cells v0.29.0; 1,869 before the station's mixes, #547 step 2, whose groove mixes leave a song's drum bar for the next nearest, which the composer varies in turn)
    expect(Math.max(...CLIMBING.map((r) => layerBytes(r.learning!.layer)))).toBe(2086);
    // (3 grooves filed at most before cells v0.29.0)
    expect(Math.max(...CLIMBING.map((r) => r.learning!.layer.filed.length))).toBe(2);
  });
});
