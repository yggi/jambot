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
  // (cells' Kinderlied, a preset since #596: its twinkle's major)
  Kinderlied: 'ionian',
};

/** A fragment of the key, its tonic its main parameter where it reads one (`&key from &tonic`), as cells writes a mode (decision 075). */
const fragment = (id: string, text: string, point = PRESETS[0]!.style): Fragment => ({
  id,
  text: text.includes('&tonic') && !text.includes(' from ') ? `&key from &tonic\n${text}` : text,
  association: [{ point: stylePoint(point), weight: 1, facet: 'mode' }],
});

describe("cells' mode fragments, as the band reads them", () => {
  it('reads each mode as its own (cells v0.17.0: the seven from one `diatonic`, yggi/cells#455), the bell and scale as ionian, and harmonic minor as aeolian (#516)', () => {
    expect(MODE_READINGS).toEqual([
      // (the seven modes, each `diatonic` with its mode, cells v0.17.0: yggi/cells#455; the other three since v0.12.1, #355)
      ...['aeolian', 'dorian', 'ionian', 'mixolydian', 'phrygian', 'lydian', 'locrian'].map(
        (mode) => ({
          id: `diatonic(mode=${mode})`,
          read: { id: `diatonic(mode=${mode})`, mode },
        }),
      ),
      { id: 'bell_and_scale', read: { id: 'bell_and_scale', mode: 'ionian' } },
      { id: 'harmonic_minor', read: { id: 'harmonic_minor', mode: 'aeolian' } },
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
    // (a tonic read by its name, with no signature that declares it, is no parameter: decision 075, #562)
    expect(
      readModeFragment({ ...fragment('by name', ''), text: '&key scale(dorian, &tonic)' }),
    ).toMatch(/tonic is fixed/);
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
