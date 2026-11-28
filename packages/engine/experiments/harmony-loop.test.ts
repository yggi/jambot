import { beforeAll, describe, expect, it } from 'vitest';
import { BASS_REPOSITORY } from '../src/bass-lines.ts';
import { EMPTY_LAYER, type LearnedLayer } from '../src/layer.ts';
import { readProgression } from '../src/progressions.ts';
import { PLAYS, asThemes, cost, mostUsedTheme, progressionsFiled } from './harmony-loop.ts';
import { PLAYER, type RhythmRun, lockIn, rhythmRuns } from './rhythm-radio.ts';

// E43 (#425): the harmony in the loop on E37's walks at entropy 0.3: alone, and with a player playing a progression one section in four.
// Played before the tests rather than as the file is imported, so the time is the file's, and run first (the
// engine's `hookTimeout`).
const ALONE = { ...PLAYS, plays: () => null };
let LEARNED: RhythmRun[] = [];
let UNLEARNED: RhythmRun[] = [];
let PLAYED: RhythmRun[] = [];
let PLAYED_UNLEARNED: RhythmRun[] = [];
let FILED: RhythmRun['harmonyFilings'][number][] = [];
let HEAVIEST: LearnedLayer = EMPTY_LAYER;

beforeAll(() => {
  LEARNED = rhythmRuns(undefined, 1, undefined, EMPTY_LAYER, BASS_REPOSITORY, undefined, ALONE);
  UNLEARNED = rhythmRuns(undefined, 1, undefined, undefined, BASS_REPOSITORY, undefined, ALONE);
  PLAYED = rhythmRuns(undefined, 1, undefined, EMPTY_LAYER, BASS_REPOSITORY, undefined, PLAYS);
  PLAYED_UNLEARNED = rhythmRuns(
    undefined,
    1,
    undefined,
    undefined,
    BASS_REPOSITORY,
    undefined,
    PLAYS,
  );
  FILED = PLAYED.flatMap((r) => r.harmonyFilings);
  HEAVIEST = PLAYED.map((r) => r.learning!.layer).reduce((a, b) =>
    progressionsFiled(b).length > progressionsFiled(a).length ? b : a,
  );
  if (process.env.E43_REPORT)
    console.log(
      JSON.stringify(
        {
          alone: mostUsedTheme(LEARNED),
          aloneUnlearned: mostUsedTheme(UNLEARNED),
          lockIn: lockIn(asThemes(UNLEARNED), asThemes(LEARNED)),
          played: mostUsedTheme(PLAYED),
          playedUnlearned: mostUsedTheme(PLAYED_UNLEARNED),
          playedLockIn: lockIn(asThemes(PLAYED_UNLEARNED), asThemes(PLAYED)),
          filed: [
            FILED.length,
            FILED.filter((f) => !f.held).length,
            FILED.filter((f) => f.held).length,
          ],
          cost: cost(HEAVIEST),
        },
        null,
        1,
      ),
    );
});

describe('the harmony on the radio’s walk, learning (E43, #425)', () => {
  it('plays its run’s most used theme in under 60 % of its sections, over 40 runs of an hour at entropy 0.3', () => {
    expect(LEARNED).toHaveLength(40);
    const { sections, mostUsed, share, fromRepository } = mostUsedTheme(LEARNED);
    // (8,459, 1,759 and 2,419 before cells v0.24.0, whose new progressions and vamps' points lie along the walk; 1,872
    // and 2,675 before v0.25.0, whose harmonies placed at the presets that had none, and its progressions of four bars
    // read twice, lie along it too; 8,408, 3,191 and 5,360 before 2/4 and 2/2 were among the band's meters on top of
    // v0.25.0, #652, where 250 sections now play 2/4, which lasts half a 4/4, and none plays 2/2; 3,182 and 5,460
    // before #655's song forms; 3,411 and 6,852 before the station's rotation, #547 rung 5, whose songs keep their themes;
    // 3,793 and 6,688 before a worn song rested, step 3, a new song made in its place; 3,569 and 6,742 before cells v0.30.0, whose jazz song form plays its solos hotter and without the pad, Salsa's `son_montuno` and Ambient straight;
    // 3,587 and 6,782 before cells v0.31.0, whose four seed progressions, Pop's two among them, lie along the walk, yggi/cells#947, #764)
    // (3,490 and 7,045 before the found parts, #540, #643, #644, #646)
    expect([sections, mostUsed, fromRepository]).toEqual([8533, 3153, 7919]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share of sections among a run’s 3 most used themes within 5 points, with twice its error (cells decision 048)', () => {
    const { added, error } = lockIn(asThemes(UNLEARNED), asThemes(LEARNED));
    // (0.54 and 0.32 before cells v0.24.0; 2.01 and 0.83 before v0.25.0; −0.99 and 0.44 before 2/4 and 2/2 were among
    // the band's meters on top of v0.25.0, #652; −0.99 and 0.43 before #655's song forms; 0.13 and 0.72 before
    // the station's rotation, #547 rung 5, whose songs keep their themes; −1.65 and 1.14 before a worn song rested, step 3;
    // −1.20 and 0.91 before cells v0.30.0; −1.03 and 0.91 before cells v0.31.0)
    // (−1.06 and 0.98 before the found parts, #540, #643, #644, #646)
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['0.63', '0.96']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });
});

describe('the harmony on the radio’s walk, a player playing progressions one section in four (E43, #425)', () => {
  it('plays its run’s most used theme in under 60 % of its sections', () => {
    const { sections, mostUsed, share } = mostUsedTheme(PLAYED);
    // (8,459 and 2,455 before cells v0.24.0; 2,442 before v0.25.0; 8,408 and 2,559 before 2/4 and 2/2 were among the
    // band's meters on top of v0.25.0, #652; 2,596 before #655's song forms; 2,553 before the station's rotation, #547 rung 5, whose songs keep their themes; 3,549 before a worn song rested, step 3; 3,140 before cells v0.30.0; 3,147 before cells v0.31.0)
    // (3,195 before the found parts, #540, #643, #644, #646)
    expect([sections, mostUsed]).toEqual([8533, 3320]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share among a run’s 3 most used themes −2.4 points (2.4 error) with the player’s progressions filed: cells’ harmonies placed above VAMP_HARM outrank them, the player’s taken first where on offer', () => {
    // (until cells v0.25.0 the player's progressions, filed, were the only fits above VAMP_HARM but where the walk came
    // near Spooky's haunted progression, yggi/cells#409, and each section that played one was a use: the share rose
    // 12.93 points (2.66), 13.42 (2.69) before v0.24.0, what was heard returning, the loop doing its job, as the owner
    // ruled on #484, 2026-10-23; since v0.25.0 a harmony of cells' lies at every preset's point, yggi/cells#540, nearer
    // than a progression filed while the walk passed near it, so the walk plays cells' and the player's less: #660;
    // −5.69 and 1.36 before 2/4 and 2/2 were among the band's meters on top of v0.25.0, #652; −5.67 and 1.35 before
    // #655's song forms; −6.61 and 2.80 before the station's rotation, #547 rung 5, whose songs keep their themes, which plays a song's themes again and so a run's
    // most used more alike played or not; −1.70 and 1.56 before a worn song rested, step 3, a new song in its place;
    // −4.27 and 1.48 before cells v0.30.0; −3.81 and 1.51 before cells v0.31.0, two of whose seeds, I V vi IV and I IV
    // V I, Pop's, the player plays, filed as none since and heard as the seeds)
    const { added, error } = lockIn(asThemes(PLAYED_UNLEARNED), asThemes(PLAYED));
    // (−4.97 and 1.26 before the found parts, #540, #643, #644, #646)
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['-2.36', '2.37']);
  });

  it('files the player’s progressions under the player’s name, each reading back as filed', () => {
    const fresh = FILED.filter((f) => !f.held);
    // (1,768 held before cells v0.24.0, over its 8,459 sections; 320 and 1,754 before v0.25.0, whose dark cadence, i VI
    // iv V read twice, is one of the player's eight, known now as the seed; 1,794 held before 2/4 and 2/2 were among
    // the band's meters on top of v0.25.0, #652, over its 8,408; 280 and 1,827 before cells v0.31.0, whose Pop's two seeds,
    // I V vi IV and I IV V I, are two of the player's eight, known now as the seeds, yggi/cells#947)
    expect([fresh.length, FILED.length - fresh.length]).toEqual([200, 1907]);
    for (const { filing, id } of fresh) {
      expect(filing.source).toBe(PLAYER);
      const layer = PLAYED.find((r) => r.harmonyFilings.some((f) => f.id === id))!.learning!.layer;
      const text = layer.filed.find((f) => f.fragment.id === id)!.fragment.text;
      expect(readProgression(text, filing.bench.meter)!.notes, id).toEqual(filing.notes);
    }
  });
});
