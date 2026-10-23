import { describe, expect, it } from 'vitest';
import { BASS_REPOSITORY } from '../src/bass-lines.ts';
import { EMPTY_LAYER } from '../src/layer.ts';
import { readProgression } from '../src/progressions.ts';
import { PLAYS, asThemes, cost, mostUsedTheme, progressionsFiled } from './harmony-loop.ts';
import { PLAYER, lockIn, rhythmRuns } from './rhythm-radio.ts';

// E43 (#425): the harmony in the loop on E37's walks at entropy 0.3: alone, and with a player playing a progression one section in four.
const ALONE = { ...PLAYS, plays: () => null };
const LEARNED = rhythmRuns(undefined, 1, undefined, EMPTY_LAYER, BASS_REPOSITORY, undefined, ALONE);
const UNLEARNED = rhythmRuns(undefined, 1, undefined, undefined, BASS_REPOSITORY, undefined, ALONE);
const PLAYED = rhythmRuns(undefined, 1, undefined, EMPTY_LAYER, BASS_REPOSITORY, undefined, PLAYS);
const PLAYED_UNLEARNED = rhythmRuns(
  undefined,
  1,
  undefined,
  undefined,
  BASS_REPOSITORY,
  undefined,
  PLAYS,
);
const FILED = PLAYED.flatMap((r) => r.harmonyFilings);
const HEAVIEST = PLAYED.map((r) => r.learning!.layer).reduce((a, b) =>
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

describe('the harmony on the radio’s walk, learning (E43, #425)', () => {
  it('plays its run’s most used theme in under 60 % of its sections, over 40 runs of an hour at entropy 0.3', () => {
    expect(LEARNED).toHaveLength(40);
    const { sections, mostUsed, share, fromRepository } = mostUsedTheme(LEARNED);
    expect([sections, mostUsed, fromRepository]).toEqual([8508, 1759, 2340]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share of sections among a run’s 3 most used themes within 5 points, with twice its error (cells decision 048)', () => {
    const { added, error } = lockIn(asThemes(UNLEARNED), asThemes(LEARNED));
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['0.07', '0.21']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });
});

describe('the harmony on the radio’s walk, a player playing progressions one section in four (E43, #425)', () => {
  it('plays its run’s most used theme in under 60 % of its sections', () => {
    const { sections, mostUsed, share } = mostUsedTheme(PLAYED);
    expect([sections, mostUsed]).toEqual([8508, 2507]);
    expect(share).toBeLessThan(0.6);
  });

  it('brings the player’s progressions back: the share among a run’s 3 most used themes rises 13.9 points (3.0 error), past 5', () => {
    // (the player's progressions, filed, are the only fits above VAMP_HARM, and each section that plays one is a use: a
    // measure of what was heard returning, which the owner rules on, #425)
    const { added, error } = lockIn(asThemes(PLAYED_UNLEARNED), asThemes(PLAYED));
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['13.87', '2.98']);
  });

  it('files the player’s progressions under the player’s name, each reading back as filed', () => {
    const fresh = FILED.filter((f) => !f.held);
    expect([fresh.length, FILED.length - fresh.length]).toEqual([320, 1781]);
    for (const { filing, id } of fresh) {
      expect(filing.source).toBe(PLAYER);
      const layer = PLAYED.find((r) => r.harmonyFilings.some((f) => f.id === id))!.learning!.layer;
      const text = layer.filed.find((f) => f.fragment.id === id)!.fragment.text;
      expect(readProgression(text, filing.bench.meter)!.notes, id).toEqual(filing.notes);
    }
  });
});
