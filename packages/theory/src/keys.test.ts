import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES, qualityOf } from './chords.ts';
import { type Helix, heightOf, positions, shift, wrap } from './helix.ts';
import { chordScale, parallel, relative, spelledTonic } from './keys.ts';
import { DIATONIC_MODE_NAMES, type DiatonicModeName, diatonicMode } from './modes.ts';
import { type Note, parseNote } from './notes.ts';
import { SCALES } from './scales.ts';
import { spell } from './spelling.ts';

const range = (n: number) => [...Array(n).keys()];
const cMajor = diatonicMode('ionian');
const cMinor = diatonicMode('aeolian');
const shape = (name: string) => SCALES[name]!.helix;

/** The prototype's four modes, by the names its keys use. */
const PROTOTYPE_MODES: Record<string, DiatonicModeName> = {
  minor: 'aeolian',
  dorian: 'dorian',
  major: 'ionian',
  mixolydian: 'mixolydian',
};

/**
 * The prototype's pivotRoot, copied as the reference: the root whose scale
 * shares the most pitch classes with the key, then the fewest fifths away,
 * then the key's own root, then the lowest.
 */
function pivotRoot(root: number, from: readonly number[], to: readonly number[]): number {
  const cur = new Set(from.map((x) => (x + root) % 12));
  let best = root;
  let bs = -1e9;
  for (let r = 0; r < 12; r++) {
    const ov = to.filter((x) => cur.has((x + r) % 12)).length;
    const f = ((((r - root) * 7) % 12) + 12) % 12;
    const fifths = Math.min(f, 12 - f);
    const sc = ov * 100 - fifths * 2 - (r === root ? 0 : 1);
    if (sc > bs) {
      bs = sc;
      best = r;
    }
  }
  return best;
}

describe('parallel', () => {
  it('keeps the tonic and takes the other scale: C major to C minor', () => {
    expect(parallel(cMajor, cMinor)).toEqual(cMinor);
    expect(parallel(shift(cMajor, 7), diatonicMode('dorian')).heights).toEqual([
      7, 9, 10, 12, 14, 16, 17,
    ]);
    expect(parallel(shift(cMajor, 7), shift(diatonicMode('dorian'), 5)).heights[0]).toBe(7);
  });
});

describe('relative', () => {
  it('keeps the notes and moves the tonic: C major to A minor, the nearest A', () => {
    expect(relative(cMajor, cMinor).heights).toEqual([-3, -1, 0, 2, 4, 5, 7]);
    expect(positions(relative(cMajor, diatonicMode('dorian')))).toEqual(positions(cMajor));
    expect(relative(cMajor, diatonicMode('dorian')).heights[0]).toBe(2);
    expect(relative(cMinor, cMajor).heights[0]).toBe(3); // E♭ major
  });

  it('is a mode of the key for every diatonic mode: all seven notes kept', () => {
    for (const from of DIATONIC_MODE_NAMES)
      for (const to of DIATONIC_MODE_NAMES)
        for (const tonic of range(12)) {
          const key = shift(diatonicMode(from), tonic);
          expect(positions(relative(key, diatonicMode(to))), `${tonic} ${from} → ${to}`).toEqual(
            positions(key),
          );
        }
  });

  it("chooses the prototype's root (pivotRoot) for every key and mode it plays", () => {
    const shapes = [
      ...Object.values(PROTOTYPE_MODES).map(diatonicMode),
      shape('harmonic minor'),
      shape('melodic minor'),
      shape('major pentatonic'),
      shape('blues'),
    ];
    for (const from of Object.values(PROTOTYPE_MODES))
      for (const tonic of range(12))
        for (const to of shapes) {
          const key = shift(diatonicMode(from), tonic);
          const moved = relative(key, to);
          expect(wrap(moved.heights[0]!, 12), `${tonic} ${from} → ${to.heights.join()}`).toBe(
            pivotRoot(tonic, diatonicMode(from).heights, to.heights),
          );
          expect(Math.abs(moved.heights[0]! - tonic)).toBeLessThanOrEqual(6);
        }
    expect(relative(cMajor, shape('harmonic minor')).heights[0]).toBe(-3); // A harmonic minor
  });
});

/** The pitch classes of a chord of `quality` on `root`, root first. */
const chordOn = (root: number, quality: string) =>
  CHORD_QUALITIES[quality]!.stack.map((x) => x + root);

/** The implied scale as a scale name, measured from its root. */
const nameOfScale = (scale: Helix | undefined) => {
  if (!scale) return undefined;
  const fromRoot = scale.heights.map((x) => x - scale.heights[0]!).join();
  return Object.entries(SCALES).find(([, s]) => s.helix.heights.join() === fromRoot)?.[0];
};

describe('chordScale', () => {
  it('is the key itself, entered at the root, for every diatonic triad and seventh', () => {
    for (const mode of DIATONIC_MODE_NAMES)
      for (const d of range(7)) {
        const key = shift(diatonicMode(mode), 2);
        for (const size of [3, 4]) {
          const chord = range(size).map((i) => heightOf(key, d + 2 * i));
          const scale = chordScale(key, chord)!;
          expect(scale.heights[0], `${mode} ${d}`).toBe(chord[0]);
          expect(positions(scale), `${mode} ${d}`).toEqual(positions(key));
        }
      }
  });

  it('borrows from the parallel mode that changes the fewest notes: the jazz reading of modal interchange', () => {
    const inC = (root: number, quality: string) =>
      nameOfScale(chordScale(cMajor, chordOn(root, quality)));
    expect(inC(3, 'major')).toBe('lydian'); // ♭III: from C dorian
    expect(inC(3, 'maj7')).toBe('lydian');
    expect(inC(8, 'major')).toBe('lydian'); // ♭VI: from C aeolian
    expect(inC(8, 'maj7')).toBe('lydian');
    expect(inC(10, 'major')).toBe('lydian'); // ♭VII: from C mixolydian
    expect(inC(10, 'maj7')).toBe('lydian');
    expect(inC(1, 'major')).toBe('lydian'); // ♭II: from C phrygian
    expect(inC(5, 'minor')).toBe('dorian'); // iv
    expect(inC(5, 'm7')).toBe('dorian');
    expect(inC(2, 'diminished')).toBe('locrian'); // ii°
    expect(inC(0, 'minor')).toBe('dorian'); // i
    expect(inC(10, '7')).toBe('mixolydian'); // ♭VII7: from C aeolian (jazz often says lydian dominant)
  });

  it('takes a dominant of a key degree from the key it points to: harmonic minor for a minor target', () => {
    const inC = (root: number, quality: string) =>
      nameOfScale(chordScale(cMajor, chordOn(root, quality)));
    expect(inC(9, '7')).toBe('phrygian dominant'); // V7/ii
    expect(inC(4, '7')).toBe('phrygian dominant'); // V7/vi
    expect(inC(11, '7')).toBe('phrygian dominant'); // V7/iii
    expect(inC(2, '7')).toBe('mixolydian'); // V7/V
    expect(inC(0, '7')).toBe('mixolydian'); // V7/IV
    const inCMinor = (root: number, quality: string) =>
      nameOfScale(chordScale(cMinor, chordOn(root, quality)));
    expect(inCMinor(7, 'major')).toBe('phrygian dominant'); // V in minor
    expect(inCMinor(7, '7')).toBe('phrygian dominant');
    expect(inCMinor(5, 'major')).toBe('mixolydian'); // IV, from C dorian
    expect(inCMinor(0, 'major')).toBe('mixolydian'); // I: a tie keeps the tonic
  });

  it('gives a scale to every borrowed chord and to every dominant of a major or minor degree', () => {
    for (const mode of Object.values(PROTOTYPE_MODES)) {
      const key = diatonicMode(mode);
      for (const borrowed of DIATONIC_MODE_NAMES)
        for (const d of range(7))
          for (const size of [3, 4]) {
            const lender = parallel(key, diatonicMode(borrowed));
            const chord = range(size).map((i) => heightOf(lender, d + 2 * i));
            expect(chordScale(key, chord), `${mode}: ${borrowed} ${d}, ${size}`).toBeDefined();
          }
      for (const d of range(7)) {
        const target = heightOf(key, d);
        const triad = [0, 2, 4].map((i) => heightOf(key, d + i) - target);
        if (!['major', 'minor'].includes(qualityOf(triad) ?? '')) continue; // no dominant of a ii°
        for (const quality of ['major', '7'])
          expect(
            chordScale(key, chordOn(target + 7, quality)),
            `${mode}: V${quality}/${d}`,
          ).toBeDefined();
      }
    }
  });

  it('falls back to harmonic and melodic minor on the tonic, and has no scale otherwise', () => {
    expect(nameOfScale(chordScale(cMinor, chordOn(3, 'augmented')))).toBe('ionian #5'); // III+
    expect(nameOfScale(chordScale(cMinor, [11, 14, 17, 20]))).toBe('ultralocrian'); // vii°7
    expect(chordScale(cMajor, chordOn(0, 'augmented'))).toBeUndefined(); // I+
  });

  it('holds over every chord of the grammar on every root in the four modes: tones in the scale, 2 4 6 between them', () => {
    const qualities = [
      'major',
      'minor',
      'diminished',
      'augmented',
      '7',
      'maj7',
      'm7',
      'm7b5',
      '9',
      'maj9',
      'm9',
    ];
    let defined = 0;
    const undefinedChords: [string, number, string][] = [];
    for (const [modeName, mode] of Object.entries(PROTOTYPE_MODES)) {
      const key = diatonicMode(mode);
      for (const root of range(12))
        for (const quality of qualities) {
          const chord = chordOn(root, quality);
          const scale = chordScale(key, chord);
          if (!scale) {
            undefinedChords.push([modeName, root, quality]);
            continue;
          }
          defined++;
          const label = `${modeName}: ${root} ${quality}`;
          expect(scale.heights, label).toHaveLength(7);
          expect(scale.heights[0], label).toBe(root);
          // Chord tones 1 3 5 7 9 are degrees 0 2 4 6 8 of the scale.
          chord.forEach((x, i) =>
            expect(wrap(heightOf(scale, 2 * i), 12), label).toBe(wrap(x, 12)),
          );
          // 2 4 6 are degrees 1 3 5: members, distinct, and none of them a chord tone 1 3 5 7.
          const between = [1, 3, 5].map((d) => wrap(heightOf(scale, d), 12));
          const tones = [0, 2, 4, 6].map((d) => wrap(heightOf(scale, d), 12));
          expect(new Set([...between, ...tones]).size, label).toBe(7);
        }
    }
    expect(defined + undefinedChords.length).toBe(4 * 12 * 11);
    // What has no scale: chords on roots no parallel mode, dominant or minor form holds.
    const byQuality: Record<string, number> = {};
    for (const [, , quality] of undefinedChords) byQuality[quality] = (byQuality[quality] ?? 0) + 1;
    expect(defined).toBe(332);
    expect(byQuality).toEqual({
      major: 6,
      minor: 12,
      diminished: 20,
      augmented: 44,
      '7': 14,
      maj7: 16,
      m7: 12,
      m7b5: 20,
      '9': 20,
      maj9: 16,
      m9: 16,
    });
  });

  it("gives a ninth its seventh's scale with the 9 set in 89 of the 92 it finds a scale for; the other 3 change one note more (#38, P7)", () => {
    // Measures the claim: a tension sets its own degree of the scale the
    // chord below it implies. The seventh's scale with degree 1 set to the
    // major ninth, where that is still a scale, against chordScale's search.
    const sevenths: Record<string, string> = { '9': '7', maj9: 'maj7', m9: 'm7' };
    const changed = (key: Helix, scale: Helix) =>
      positions(key).filter((x) => !positions(scale).includes(x)).length;
    const counts = { agree: 0, nearer: 0, gained: 0, none: 0 };
    const nearer: string[] = [];
    const gained: string[] = [];
    for (const [modeName, mode] of Object.entries(PROTOTYPE_MODES)) {
      const key = diatonicMode(mode);
      for (const root of range(12))
        for (const [ninth, seventh] of Object.entries(sevenths)) {
          const label = `${modeName}: ${root} ${ninth}`;
          const searched = chordScale(key, chordOn(root, ninth));
          const below = chordScale(key, chordOn(root, seventh));
          const heights = below && [below.heights[0]!, root + 2, ...below.heights.slice(2)];
          const derived: Helix | undefined =
            heights && heights[1]! > heights[0]! && heights[2]! > heights[1]!
              ? { cycle: 12, heights }
              : undefined;
          if (!searched && !derived) counts.none++;
          else if (!searched) {
            counts.gained++;
            gained.push(label);
          } else if (positions(searched).join() === positions(derived!).join()) counts.agree++;
          else {
            expect(changed(key, derived!), label).toBe(changed(key, searched) - 1);
            counts.nearer++;
            nearer.push(label);
          }
        }
    }
    expect(counts).toEqual({ agree: 89, nearer: 3, gained: 10, none: 42 });
    // D9 in C minor and C dorian, and G9 in C minor: the target's melodic
    // minor, which chordScale doesn't try, holds them one note nearer.
    expect(nearer).toEqual(['minor: 2 9', 'minor: 7 9', 'dorian: 2 9']);
    // Among them every V9 of a minor degree that the prototype plays: A9, B9
    // and E9 in C major, A9 in C dorian, A9 and E9 in C mixolydian.
    expect(gained).toEqual([
      'minor: 11 m9',
      'dorian: 9 9',
      'dorian: 11 m9',
      'major: 4 9',
      'major: 9 9',
      'major: 11 9',
      'major: 11 m9',
      'mixolydian: 4 9',
      'mixolydian: 9 9',
      'mixolydian: 11 m9',
    ]);
  });
});

describe('spelledTonic', () => {
  const name = (n: Note) =>
    n.letter + (n.alteration > 0 ? '♯'.repeat(n.alteration) : '♭'.repeat(-n.alteration));
  /** Sharps minus flats in the key, spelled from this tonic: its key signature. */
  const signature = (tonic: Note, key: Helix) =>
    spell(tonic, key.heights).reduce((sum, n) => sum + n.alteration, 0);
  const tonicsOf = (mode: DiatonicModeName) =>
    range(12)
      .map((pc) => name(spelledTonic(shift(diatonicMode(mode), pc))))
      .join(' ');

  it('names each diatonic key by its fewest accidentals: every tonic in every mode', () => {
    // Checked with music21 10.5.0: each name has the smallest key signature
    // of any spelling of its tonic (key.Key(tonic, mode).sharps).
    const expected: Record<DiatonicModeName, string> = {
      lydian: 'C D♭ D E♭ E F G♭ G A♭ A B♭ B',
      ionian: 'C D♭ D E♭ E F F♯ G A♭ A B♭ B',
      mixolydian: 'C C♯ D E♭ E F F♯ G A♭ A B♭ B',
      dorian: 'C C♯ D E♭ E F F♯ G A♭ A B♭ B',
      aeolian: 'C C♯ D E♭ E F F♯ G G♯ A B♭ B',
      phrygian: 'C C♯ D D♯ E F F♯ G G♯ A B♭ B',
      locrian: 'C C♯ D D♯ E F F♯ G G♯ A A♯ B',
    };
    for (const mode of DIATONIC_MODE_NAMES) {
      expect(tonicsOf(mode), mode).toBe(expected[mode]);
      for (const pc of range(12)) {
        const key = shift(diatonicMode(mode), pc);
        const tonic = spelledTonic(key);
        expect(tonic.pitchClass, `${mode} on ${pc}`).toBe(pc);
        expect(Math.abs(signature(tonic, key)), `${mode} on ${pc}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('breaks a tie of 6 sharps and 6 flats by the fewest accidentals over the parallel scales', () => {
    // F♯ major's borrowed chords need no double accidental, G♭ major's need
    // B♭♭, E♭♭, A♭♭ and D♭♭; E♭ minor raises to D♮, D♯ minor to C𝄪. So a
    // major tonic takes the sharp and a minor one the flat, as in practice.
    expect(name(spelledTonic(shift(cMajor, 6)))).toBe('F♯');
    expect(name(spelledTonic(shift(cMinor, 3)))).toBe('E♭');
    expect(signature(parseNote('F♯')!, shift(cMajor, 6))).toBe(6);
    expect(signature(parseNote('G♭')!, shift(cMajor, 6))).toBe(-6);
    expect(signature(parseNote('D♯')!, shift(cMinor, 3))).toBe(6);
    expect(signature(parseNote('E♭')!, shift(cMinor, 3))).toBe(-6);
    // A natural tonic wins a tie with a sharp or flat one: B lydian, not C♭.
    expect(name(spelledTonic(shift(diatonicMode('lydian'), 11)))).toBe('B');
    expect(name(spelledTonic(shift(diatonicMode('locrian'), 5)))).toBe('F');
  });

  it('names a key of any scale by the same rule', () => {
    expect(name(spelledTonic(shift(shape('harmonic minor'), 8)))).toBe('A♭');
    expect(name(spelledTonic(shift(shape('harmonic minor'), 1)))).toBe('C♯');
    expect(name(spelledTonic(shift(shape('major pentatonic'), 6)))).toBe('F♯');
    expect(name(spelledTonic(shift(shape('altered'), 0)))).toBe('C');
    for (const [scaleName, { helix }] of Object.entries(SCALES))
      for (const pc of range(12))
        expect(spelledTonic(shift(helix, pc)).pitchClass, `${scaleName} on ${pc}`).toBe(pc);
  });
});

describe('spelling an implied scale', () => {
  it('spells the chord tones as the chord spells them, for every chord of the grammar from every spelling of its root', () => {
    // A 7-note scale takes one letter per degree, and the chord tones are its
    // degrees 0 2 4 6 8, so the scale and the chord agree note for note.
    const qualities = [
      'major',
      'minor',
      'diminished',
      'augmented',
      '7',
      'maj7',
      'm7',
      'm7b5',
      '9',
      'maj9',
      'm9',
    ];
    const spellings = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap((l) => [l + '♭', l, l + '♯']);
    let checked = 0;
    for (const mode of Object.values(PROTOTYPE_MODES))
      for (const root of range(12))
        for (const quality of qualities) {
          const chord = CHORD_QUALITIES[quality]!.stack.map((x) => x + root);
          const scale = chordScale(diatonicMode(mode), chord);
          if (!scale) continue;
          for (const text of spellings) {
            const tonic = parseNote(text)!;
            if (tonic.pitchClass !== wrap(root, 12)) continue;
            const ofScale = spell(tonic, scale.heights);
            spell(tonic, chord).forEach((n, i) =>
              expect(ofScale[(2 * i) % 7], `${text} ${quality} in ${mode}`).toEqual(n),
            );
            checked++;
          }
        }
    expect(checked).toBe(566);
  });
});
