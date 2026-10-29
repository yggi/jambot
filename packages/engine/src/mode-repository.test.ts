import { describe, expect, it } from 'vitest';
import type { Fragment } from '@yggi/cells/repository/fragments';
import { MODE_FRAGMENTS } from '@yggi/cells/repository/modes';
import { COMPOSER_MODES, INITIAL_KEY, type ComposerMode } from './key.ts';
import { stylePoint } from './meter-query.ts';
import {
  MODE_READINGS,
  MODE_REPOSITORY,
  modeRepository,
  presetMode,
  readModeFragment,
} from './mode-repository.ts';
import { INITIAL_STYLE, PRESETS } from './style.ts';

/** Each preset's mode as `PRESETS` named it by hand before the repository found it (#420, rung 3), as a literal. */
const HAND_MODE: Readonly<Record<string, ComposerMode>> = {
  'Synth-pop': 'aeolian',
  Techno: 'aeolian',
  'Deep house': 'dorian',
  Ambient: 'ionian',
  'Lo-fi hip hop': 'aeolian',
  Funk: 'dorian',
  'Bossa nova': 'ionian',
  'Swing jazz': 'ionian',
  // (cells' harmonic minor, read as aeolian: #516)
  'Electro swing': 'aeolian',
  Spooky: 'aeolian',
};

const fragment = (id: string, text: string, point = PRESETS[0]!.style): Fragment => ({
  id,
  text,
  association: [{ point: stylePoint(point), weight: 1, facet: 'mode' }],
});

describe("cells' mode fragments, as the band reads them", () => {
  it('reads each mode as its own, the bell and scale as ionian, and harmonic minor as aeolian (#516)', () => {
    expect(MODE_READINGS).toEqual([
      { id: 'aeolian', read: { id: 'aeolian', mode: 'aeolian' } },
      { id: 'dorian', read: { id: 'dorian', mode: 'dorian' } },
      { id: 'ionian', read: { id: 'ionian', mode: 'ionian' } },
      { id: 'mixolydian', read: { id: 'mixolydian', mode: 'mixolydian' } },
      { id: 'bell and scale', read: { id: 'bell and scale', mode: 'ionian' } },
      { id: 'harmonic minor', read: { id: 'harmonic minor', mode: 'aeolian' } },
      // (the other three of the seven, cells v0.12.1: yggi/cells#355)
      { id: 'phrygian', read: { id: 'phrygian', mode: 'phrygian' } },
      { id: 'lydian', read: { id: 'lydian', mode: 'lydian' } },
      { id: 'locrian', read: { id: 'locrian', mode: 'locrian' } },
    ]);
    expect([...MODE_REPOSITORY.fragments.keys()]).toEqual(MODE_FRAGMENTS.map((f) => f.id));
  });

  it('reads each of the seven diatonic modes as its own, as cells writes them (yggi/cells#355)', () => {
    for (const mode of COMPOSER_MODES)
      expect(readModeFragment(fragment(mode, `&key scale(${mode}, &tonic)`))).toEqual({
        id: mode,
        mode,
      });
  });

  it("leaves out a scale that is no mode the composer plays, a tonic fixed, a fragment with no key, and one that doesn't compile, and says why", () => {
    expect(readModeFragment(fragment('melodic', '&key scale(melodic, &tonic)'))).toMatch(
      /none of the composer's/,
    );
    expect(readModeFragment(fragment('fixed', '&key scale(dorian, D)'))).toMatch(/tonic/);
    expect(readModeFragment(fragment('no key', '&tune step=4n 0 1 2'))).toMatch(/no key/);
    expect(readModeFragment(fragment('broken', '&key scale(dorian, &tonic'))).toMatch(
      /doesn't compile/,
    );
  });

  it('ranks only what it can play', () => {
    const repository = modeRepository([
      fragment('melodic', '&key scale(melodic, &tonic)'),
      ...MODE_FRAGMENTS,
    ]);
    const found = repository.query(stylePoint(PRESETS[0]!.style));
    expect(found.map((f) => f.id)).not.toContain('melodic');
    expect(found).toHaveLength(MODE_FRAGMENTS.length);
  });
});

describe("a preset's mode, found at its point (#420, rung 3)", () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))(
    '%s finds the mode it was named by hand, at distance 0',
    (name, preset) => {
      const found = MODE_REPOSITORY.query(stylePoint(preset.style))[0]!;
      expect(found.distance).toBe(0);
      expect(presetMode(preset)).toBe(HAND_MODE[name]);
    },
  );

  it('finds none where every mode lies past the miss', () => {
    const far = modeRepository([fragment('dorian', MODE_FRAGMENTS[1]!.text, PRESETS[5]!.style)]);
    expect(presetMode(PRESETS[3]!, far)).toBeNull();
    expect(presetMode(PRESETS[5]!, far)).toBe('dorian');
  });

  it("opens in the mode found at the opening style's point", () => {
    expect(presetMode({ style: INITIAL_STYLE })).toBe(INITIAL_KEY.mode);
  });
});
