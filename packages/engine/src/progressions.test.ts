import { METERS, type MeterName } from '@jambot/theory';
import { HARMONY_FRAGMENTS } from '@yggi/cells/repository/harmony';
import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES } from './key.ts';
import {
  type HarmonySlot,
  OFFER,
  composedHarmony,
  fitsHarmony,
  themeOf,
  vampOf,
} from './harmony-query.ts';
import { EMPTY_LAYER } from './layer.ts';
import {
  HARMONY_REPOSITORY,
  harmonyRepository,
  progressionText,
  readProgression,
} from './progressions.ts';
import { PRESETS } from './style.ts';
import { VAMPS, VAMP_HARM, buildTheme } from './themes.ts';

const range = (n: number) => [...Array(n).keys()];
const NAMES = Object.keys(METERS) as MeterName[];

describe("cells' harmonies read into a theme's slots (#425)", () => {
  it('reads each of the five seeds, in every named meter, as its vamp: its first chord four bars, its second four', () => {
    const vamps = HARMONY_FRAGMENTS.map((f) => [
      f.id,
      vampOf(readProgression(f.text, METERS['4/4'])!),
    ]);
    expect(Object.fromEntries(vamps)).toEqual({
      'tonic vamp': [0],
      'vamp to the seventh': [0, 6],
      'vamp to the fourth': [0, 3],
      'vamp to the sixth': [0, 5],
      'vamp to the fifth': [0, 4],
    });
    for (const f of HARMONY_FRAGMENTS)
      for (const name of NAMES)
        expect(readProgression(f.text, METERS[name]), `${f.id} in ${name}`).toEqual(
          readProgression(f.text, METERS['4/4']),
        );
  });

  it('states each seed’s slots as the seed’s own text, character for character (identity)', () => {
    for (const f of HARMONY_FRAGMENTS)
      expect(progressionText(readProgression(f.text, METERS['4/4'])!.notes)).toBe(f.text.trim());
  });

  it('reads back every progression of a chord a bar on degrees 0 to 6, with a half-bar change in bar 2 or none (the round trip)', () => {
    for (let n = 0; n < 7 ** 4; n++) {
      const degrees = range(4).map((k) => Math.floor(n / 7 ** k) % 7);
      const notes: HarmonySlot[] = [...degrees, ...degrees].map((degree, b) => ({
        step: b * 16,
        degree,
      }));
      const half = (degrees[0]! + 3) % 7;
      const split = [...notes.slice(0, 2), { step: 24, degree: half }, ...notes.slice(2)];
      for (const slots of [notes, half === degrees[1] ? notes : split])
        expect(readProgression(progressionText(slots), METERS['4/4'])).toEqual({
          bars: 8,
          notes: slots,
        });
    }
  });

  it('reads no text that isn’t eight bars of triads on the key’s degrees, on a bar’s start or its half', () => {
    for (const text of [
      '&harm over=key step=1m cycle=4 [0,2,4]!4',
      '&harm over=key step=1m cycle=8 [0,2,4]!4 [0,3,4]!4',
      '&harm over=key step=1m cycle=8 [0,2,4]!4 [0,2b,4]!4',
      '&harm over=key step=1m cycle=8 [0,2,4,6]!8',
      '&harm over=key step=4n cycle=32 [0,2,4]!32',
      '&harm over=key step=1m cycle=8 [[0,2,4] [3,5,7] [4,6,8]] [0,2,4]!7',
      'not cells',
    ])
      expect(readProgression(text, METERS['4/4']), text).toBeNull();
  });
});

describe('a seed vamp plays the chords main’s vamp does (#425)', () => {
  it('lays each of the twelve vamps of the four modes as `buildTheme` does, at every harmony under VAMP_HARM, for every kind', () => {
    let covered = 0;
    for (const mode of COMPOSER_MODES)
      VAMPS[mode].forEach((chords) => {
        const seed = HARMONY_FRAGMENTS.find(
          (f) => vampOf(readProgression(f.text, METERS['4/4'])!)?.join(' ') === chords.join(' '),
        )!;
        expect(seed, `${mode} ${chords}`).toBeDefined();
        covered++;
        for (const harm of range(33).map((h) => h / 100))
          for (const kind of ['A', 'B', 'build'] as const) {
            // (a draw that lands on this vamp: buildTheme's first draw, by seed)
            const s = range(400).find(
              (s) =>
                buildTheme({
                  seed: s,
                  index: 0,
                  kind,
                  key: { tonic: 0, mode },
                  harm,
                  entropy: 0,
                  a: null,
                }).vamp === VAMPS[mode].indexOf(chords),
            )!;
            const main = buildTheme({
              seed: s,
              index: 0,
              kind,
              key: { tonic: 0, mode },
              harm,
              entropy: 0,
              a: null,
            });
            const read = HARMONY_REPOSITORY.read(seed.id, METERS['4/4'])!;
            expect(themeOf(read, { kind, index: 0, mode, harm })).toEqual(main);
          }
      });
    expect(covered).toBe(12);
  });
});

describe('the composer’s ask (#425)', () => {
  const bench = { meter: METERS['4/4'], meterFragment: '4/4' };

  it('offers a preset the vamps of its mode in main’s order, and none where main walks the tables', () => {
    const offered = (name: string) => {
      const preset = PRESETS.find((p) => p.name === name)!;
      return range(8).map((k) =>
        composedHarmony(HARMONY_REPOSITORY, preset.style, bench, {
          at: {
            kind: 'A',
            index: 0,
            mode: name === 'Techno' ? 'aeolian' : name === 'Funk' ? 'dorian' : 'ionian',
            harm: preset.style.harm,
          },
          draw: k / 8,
        }),
      );
    };
    expect([...new Set(offered('Techno'))]).toEqual([
      'tonic vamp',
      'vamp to the seventh',
      'vamp to the fourth',
      'vamp to the sixth',
    ]);
    expect([...new Set(offered('Funk'))]).toEqual([
      'vamp to the fourth',
      'tonic vamp',
      'vamp to the seventh',
    ]);
    expect([...new Set(offered('Ambient'))]).toEqual([
      'vamp to the fourth',
      'vamp to the fifth',
      'vamp to the sixth',
    ]);
    for (const p of PRESETS.filter((p) => p.style.harm >= VAMP_HARM))
      expect(offered(p.name), p.name).toEqual(range(8).map(() => undefined));
  });

  it('keeps a seed’s equals on offer however often use raises one, past cells’ cap (OFFER)', () => {
    const ambient = PRESETS.find((p) => p.name === 'Ambient')!;
    let layer = EMPTY_LAYER;
    for (let k = 0; k < 10; k++)
      layer = HARMONY_REPOSITORY.used!(layer, ['vamp to the fifth'], { ...ambient.style });
    const ask = (draw: number) =>
      composedHarmony(HARMONY_REPOSITORY, ambient.style, bench, {
        at: { kind: 'A', index: 0, mode: 'ionian', harm: ambient.style.harm },
        draw,
        layer,
      });
    // (raised to cells' cap, the fifth lies a sixth nearer than its equals: within OFFER)
    expect(OFFER).toBeGreaterThan(1.2);
    expect(new Set(range(3).map((k) => ask(k / 3)))).toEqual(
      new Set(['vamp to the fourth', 'vamp to the fifth', 'vamp to the sixth']),
    );
  });

  it('moves a theme other than A off A’s progression, and misses where A’s is all there is', () => {
    const repository = harmonyRepository([HARMONY_FRAGMENTS[0]!]);
    const techno = PRESETS.find((p) => p.name === 'Techno')!;
    const ask = (kind: 'A' | 'B' | 'build') =>
      composedHarmony(repository, techno.style, bench, {
        at: { kind, index: 0, mode: 'aeolian', harm: 0 },
        draw: 0,
        a: 'tonic vamp',
      });
    expect(ask('A')).toBe('tonic vamp');
    expect(ask('B')).toBeUndefined();
    expect(ask('build')).toBeUndefined();
  });
});

describe('a vamp fits only under the harmony buildTheme lays vamps at (#425)', () => {
  it('fits every seed vamp below `VAMP_HARM` and none at or above it, where a progression of the players fits at any harmony', () => {
    const reads = HARMONY_FRAGMENTS.map((f) => readProgression(f.text, METERS['4/4'])!);
    expect(reads.every((r) => r !== null && vampOf(r) !== null)).toBe(true);
    for (const read of reads) {
      expect(fitsHarmony(read, VAMP_HARM - 0.01)).toBe(true);
      expect(fitsHarmony(read, VAMP_HARM)).toBe(false);
      expect(fitsHarmony(read, 1)).toBe(false);
    }
    // (eight bars that walk the key's degrees: no vamp)
    const walk = readProgression(
      progressionText([0, 3, 4, 0, 5, 1, 4, 0].map((degree, b) => ({ step: b * 16, degree }))),
      METERS['4/4'],
    )!;
    expect(vampOf(walk)).toBeNull();
    expect([0, VAMP_HARM, 1].map((harm) => fitsHarmony(walk, harm))).toEqual([true, true, true]);
  });
});
