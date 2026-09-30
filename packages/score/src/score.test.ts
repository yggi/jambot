import { DIATONIC_MODE_NAMES, parseNumeral } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  BASS_FOLD,
  BASS_TOP,
  DRUM_SOUNDS,
  type DrumSound,
  type ScoreBar,
  STYLE_AXES,
  bassNearest,
  compileBar,
  encodeBar,
  readStyleValue,
  scoreProblems,
  writeStyleValue,
} from './score.ts';

const range = (n: number) => [...Array(n).keys()];

const numeral = (text: string) => parseNumeral(text)!;

const A_BAR: ScoreBar = {
  bar: 186,
  section: 'groove',
  key: { tonic: 0, mode: 'ionian' },
  theme: 'A',
  style: { swing: 1, sync: 0.2, harm: 0.6, artic: 0.3, energy: 0.6, entropy: 0.3, bpm: 148 },
  harm: [
    { step: 0, numeral: numeral('IVmaj9') },
    { step: 12, numeral: numeral('V7/vi') },
  ],
  drums: {},
};

const A_TEXT = [
  'bar 186 groove key=C:ionian theme=A',
  'style swing=1 sync=0.2 harm=0.6 artic=0.3 energy=0.6 entropy=0.3 bpm=148',
  'harm "IVmaj9@3 V7/vi"',
].join('\n');

/** A bar's text with one line replaced. */
const withLine = (kind: string, line: string) =>
  A_TEXT.split('\n')
    .map((l) => (l.startsWith(`${kind} `) ? line : l))
    .join('\n');

describe('a bar as score text', () => {
  it('writes the header, the style and the harmony, one line each (Q1a)', () => {
    expect(encodeBar(A_BAR)).toBe(A_TEXT);
    expect(compileBar(A_TEXT)).toEqual(A_BAR);
  });

  it('writes every key of every diatonic mode on every tonic, its tonic spelled as the key spells it, and reads it back (Q1a)', () => {
    const written = new Set<string>();
    for (const mode of DIATONIC_MODE_NAMES)
      for (const tonic of range(12)) {
        const harm = [{ step: 0, numeral: numeral('I') }];
        const text = encodeBar({ ...A_BAR, key: { tonic, mode }, harm });
        written.add(text.split('\n')[0]!.split(' ')[3]!);
        expect(compileBar(text).key).toEqual({ tonic, mode });
      }
    expect(written.size).toBe(84);
    expect(written).toContain('key=Db:ionian');
    expect(written).toContain('key=Eb:aeolian');
    expect(written).toContain('key=F#:ionian');
  });

  it("writes every value of the style's grid and reads it back, and refuses one off it (C7, Q1a)", () => {
    // Each value as the band reads it, a whole number of thousandths: the
    // unit axes' 1001 and bpm's 120,001 as values, and the unit axes' in bars.
    for (const i of range(180_001))
      expect(readStyleValue(writeStyleValue(i / 1000))).toBe(i / 1000);
    for (const i of range(1001)) {
      const style = {
        ...Object.fromEntries(STYLE_AXES.map((axis) => [axis, i / 1000])),
        bpm: 60 + i / 8,
      } as ScoreBar['style'];
      expect(compileBar(encodeBar({ ...A_BAR, style })).style).toEqual(style);
    }
    for (const text of ['.6', '0.600', '6e-1', '-0.6', '0x1', '0.6001', ''])
      expect(readStyleValue(text)).toBe(['.6', '0.600'].includes(text) ? 0.6 : undefined);
    expect(() => encodeBar({ ...A_BAR, style: { ...A_BAR.style, harm: 0.6001 } })).toThrow(
      'harm=0.6001 is off the grid of 3 decimals',
    );
    expect(
      scoreProblems(withLine('style', A_TEXT.split('\n')[1]!.replace('0.6', '0.6001'))),
    ).toEqual(['harm=0.6001 is not a number on the grid of 3 decimals']);
  });

  it('writes every text that compiles in one form: a second pass changes nothing (Q1a, F3)', () => {
    const variants = [
      // Fields in another order, a key spelled another way, numbers written another way.
      'bar 0186 groove theme=A key=B#:ionian',
      'style bpm=148.000 energy=.6 swing=1. sync=0.20 harm=0.6 artic=0.3 entropy=0.3',
      '',
      'harm "IVmaj9@6 V7/vi@2"',
    ].join('\n');
    const once = encodeBar(compileBar(variants));
    expect(once).toBe(A_TEXT);
    expect(encodeBar(compileBar(once))).toBe(once);
    const lines = A_TEXT.split('\n');
    expect(encodeBar(compileBar([lines[2], lines[0], lines[1]].join('\n')))).toBe(A_TEXT);
  });

  it('refuses a text that is not a bar, and says why', () => {
    expect(scoreProblems(A_TEXT)).toEqual([]);
    const cases: [string, string[]][] = [
      ['', ['the bar line is missing', 'the style line is missing', 'the harm line is missing']],
      [`${A_TEXT}\nlead "1"`, ['"lead" is not a line']],
      [`${A_TEXT}\nharm "i"`, ['a bar has one harm line']],
      [
        withLine('bar', 'bar x groove key=C:ionian theme=A'),
        ['"bar x groove key=C:ionian theme=A" is not bar <n> <section> key=… theme=…'],
      ],
      [withLine('bar', 'bar 1 groove key=C:ionian'), ['theme= is missing']],
      [withLine('bar', 'bar 1 groove key=C:ionian theme=A theme=B'), ['theme= is stated twice']],
      [
        withLine('bar', 'bar 1 groove key=c:ionian theme=A'),
        ['key=c:ionian is not a tonic and a mode, such as key=A:aeolian'],
      ],
      [
        withLine('bar', 'bar 1 groove key=C4:ionian theme=A'),
        ['key=C4:ionian is not a tonic and a mode, such as key=A:aeolian'],
      ],
      [
        withLine('bar', 'bar 1 groove key=C:major theme=A'),
        ['key=C:major is not a tonic and a mode, such as key=A:aeolian'],
      ],
      [
        withLine('bar', 'bar 1 groove-2 key=C:ionian theme=A'),
        ['section "groove-2" is not a word'],
      ],
      [
        withLine('style', 'style swing=1'),
        [
          'sync= is missing',
          'harm= is missing',
          'artic= is missing',
          'energy= is missing',
          'entropy= is missing',
          'bpm= is missing',
        ],
      ],
      [withLine('style', `${A_TEXT.split('\n')[1]} tempo=1`), ['"tempo=1" is not a field here']],
      [
        withLine('style', A_TEXT.split('\n')[1]!.replace('bpm=148', 'bpm=fast')),
        ['bpm=fast is not a number on the grid of 3 decimals'],
      ],
      [withLine('harm', 'harm i VI'), ['harm i VI is not a quoted sequence, such as harm "i VI"']],
      [withLine('harm', 'harm "i X"'), ['harm: "X" is not a numeral']],
      [
        withLine('harm', 'harm "i i i"'),
        ['harm: "i" starts between steps, at 5.33', 'harm: "i" starts between steps, at 10.67'],
      ],
    ];
    for (const [text, problems] of cases) {
      expect(scoreProblems(text)).toEqual(problems);
      expect(() => compileBar(text)).toThrow(problems[0]);
    }
  });

  it('refuses a chord that implies no scale, until the score can write scale= (U3)', () => {
    const sus = { ...A_BAR, harm: [{ step: 0, numeral: numeral('Isus4') }] };
    expect(() => encodeBar(sus)).toThrow('Isus4 implies no scale, and needs scale= (U3)');
    expect(scoreProblems(withLine('harm', 'harm "Isus4"'))).toEqual([
      'harm: Isus4 implies no scale, and needs scale= (U3)',
    ]);
    expect(scoreProblems(withLine('harm', 'harm "I"'))).toEqual([]);
  });

  it('refuses to write a bar it could not read back', () => {
    expect(() => encodeBar({ ...A_BAR, bar: -1 })).toThrow('bar -1 is no bar');
    expect(() => encodeBar({ ...A_BAR, section: 'two words' })).toThrow('is not a word');
    expect(() => encodeBar({ ...A_BAR, theme: '' })).toThrow('is not a word');
    expect(() => encodeBar({ ...A_BAR, key: { tonic: 12, mode: 'ionian' } })).toThrow(
      'tonic 12 is not a pitch class',
    );
    expect(() => encodeBar({ ...A_BAR, harm: [] })).toThrow('at least one word');
  });
});

describe('a drum line (E16, form (iii): one line per sound, a default role)', () => {
  it('writes no line for a bar with no drum hits', () => {
    expect(encodeBar(A_BAR)).toBe(A_TEXT);
  });

  it("writes one line per sounding drum, in the sounds' own canonical order, and reads it back (Q1a)", () => {
    // Rung 0 (#150): a kick every quarter note.
    const kick = { ...A_BAR, drums: { kick: [0, 4, 8, 12] } };
    const text = `${A_TEXT}\nbd "bd ~@3 bd ~@3 bd ~@3 bd ~@3"`;
    expect(encodeBar(kick)).toBe(text);
    expect(compileBar(text)).toEqual(kick);

    // Two sounds together, written in DRUM_SOUNDS order regardless of key order on the bar.
    const both = { ...A_BAR, drums: { ride: [2, 10], kick: [0, 8] } };
    const bothText = `${A_TEXT}\nbd "bd ~@7 bd ~@7"\nrd "~@2 rd ~@7 rd ~@5"`;
    expect(encodeBar(both)).toBe(bothText);
    expect(compileBar(bothText)).toEqual(both);
  });

  it('holds a hit no longer than one step, even with no gap to the next', () => {
    const solid = { ...A_BAR, drums: { kick: range(16) } };
    const text = `${A_TEXT}\nbd "${range(16)
      .map(() => 'bd')
      .join(' ')}"`;
    expect(encodeBar(solid)).toBe(text);
    expect(compileBar(text)).toEqual(solid);
  });

  it('holds the last hit of the bar to its own end, with no trailing rest', () => {
    const last = { ...A_BAR, drums: { kick: [15] } };
    const text = `${A_TEXT}\nbd "~@15 bd"`;
    expect(encodeBar(last)).toBe(text);
    expect(compileBar(text)).toEqual(last);
  });

  it('writes every text that compiles in one form: a second pass changes nothing (Q1a, F3)', () => {
    const variant = `${A_TEXT}\nbd "bd@1 ~@3 bd@1 ~@3 bd@1 ~@3 bd@1 ~@3"`;
    const canonical = `${A_TEXT}\nbd "bd ~@3 bd ~@3 bd ~@3 bd ~@3"`;
    expect(encodeBar(compileBar(variant))).toBe(canonical);
    expect(encodeBar(compileBar(canonical))).toBe(canonical);
  });

  it('reads and writes every one of its supported sounds, each its own word', () => {
    for (const sound of DRUM_SOUNDS) {
      const bar = { ...A_BAR, drums: { [sound]: [0] } as Record<DrumSound, number[]> };
      const compiled = compileBar(encodeBar(bar));
      expect(compiled.drums).toEqual(bar.drums);
    }
  });

  it('refuses a line whose steps are not rising, or whose hit is another sound’s word', () => {
    expect(() => encodeBar({ ...A_BAR, drums: { kick: [4, 0] } })).toThrow(
      "bd: its steps must rise within the bar's 16",
    );
    expect(() => encodeBar({ ...A_BAR, drums: { kick: [0, 0] } })).toThrow(
      "bd: its steps must rise within the bar's 16",
    );
    expect(scoreProblems(`${A_TEXT}\nbd "sd"`)).toEqual(['bd: "sd" is not bd or ~']);
    expect(scoreProblems(`${A_TEXT}\nbd bd`)).toEqual([
      'bd bd is not a quoted sequence, such as bd "bd ~@3"',
    ]);
    expect(scoreProblems(`${A_TEXT}\nbd "bd"\nbd "bd"`)).toEqual(['a bar has one bd line']);
  });
});

/** The chords of a bass bar, a beat each, `V7` last: every note is relative to the chord in force. */
const BASS_CHORDS = [
  { step: 0, numeral: numeral('I') },
  { step: 4, numeral: numeral('vi') },
  { step: 8, numeral: numeral('IV') },
  { step: 12, numeral: numeral('V7') },
];

/** C2, A1, E2 (the fifth over the vi), F2, G3 (an octave jump) and F2 (the seventh of V7), from the register E2. */
const BASS_BAR: ScoreBar = {
  ...A_BAR,
  harm: BASS_CHORDS,
  bass: {
    register: 40,
    notes: [
      { step: 0, note: 36 },
      { step: 4, note: 33 },
      { step: 7, note: 40 },
      { step: 8, note: 41 },
      { step: 12, note: 55 },
      { step: 14, note: 41 },
    ],
  },
};

const BASS_TEXT = [
  ...A_TEXT.split('\n').slice(0, 2),
  'harm "I vi IV V7"',
  'frame bass=E2',
  'bass 0=0 4=0 7=7 8=0 12=0^ 14=10',
].join('\n');

/** The bass bar's text with one line replaced, or taken out with `undefined`. */
const withBassLine = (kind: string, line: string | undefined) =>
  BASS_TEXT.split('\n')
    .flatMap((l) => (l.startsWith(`${kind} `) ? (line === undefined ? [] : [line]) : [l]))
    .join('\n');

/** A bar of the one chord `I` in C, with its bass from `register`, its first note the nearest C. */
const oneChordBar = (register: number): ScoreBar => ({
  ...A_BAR,
  harm: [{ step: 0, numeral: numeral('I') }],
  bass: { register, notes: [{ step: 0, note: bassNearest(0, register) }] },
});

/** The notes of the bass range's fold with this pitch class, found without `bassNearest`. */
const independentNearest = (pitchClass: number, last: number) =>
  range(BASS_FOLD[1] - BASS_FOLD[0] + 1)
    .map((i) => BASS_FOLD[0] + i)
    .filter((note) => note % 12 === pitchClass)
    .sort((a, b) => Math.abs(a - last) - Math.abs(b - last) || a - b)[0]!;

describe('a bass line (#263: pitch and onset in one line, the register in a key frame)', () => {
  it('writes the register in a frame line and the notes as step=pitch pairs, and reads them back (Q1a, U6)', () => {
    expect(encodeBar(BASS_BAR)).toBe(BASS_TEXT);
    expect(compileBar(BASS_TEXT)).toEqual(BASS_BAR);
  });

  it('writes a bar with no bass exactly as before: no bass line, no frame', () => {
    expect(encodeBar(A_BAR)).toBe(A_TEXT);
    expect(compileBar(A_TEXT).bass).toBeUndefined();
  });

  it('counts the pitch in semitones above the root of the chord in force at the step, so the same pairs over another chord are other notes (U6)', () => {
    const over = (harm: string) =>
      compileBar(
        BASS_TEXT.replace('harm "I vi IV V7"', `harm "${harm}"`).replace(
          'bass 0=0 4=0 7=7 8=0 12=0^ 14=10',
          'bass 0=0 4=0',
        ),
      ).bass!.notes.map((n) => n.note % 12);
    expect(over('I vi IV V7')).toEqual([0, 9]);
    expect(over('IV I IV V7')).toEqual([5, 0]);
    expect(over('I vi IV V7')).not.toEqual(over('IV I IV V7'));
  });

  it('states no length: a note is held to the next onset and the last to the bar’s end', () => {
    // Two bars whose pairs agree on the first notes compile to the same
    // notes there, whatever follows them: no note carries a length.
    const short = compileBar(withBassLine('bass', 'bass 0=0 4=0')).bass!.notes;
    expect(short).toEqual(BASS_BAR.bass!.notes.slice(0, 2));
    expect(Object.keys(short[0]!)).toEqual(['step', 'note']);
  });

  it('takes the octave nearest the register for every pitch on every register, a ^ for the one above, and refuses a ^ past the top (U6)', () => {
    let written = 0;
    let refused = 0;
    for (let register = BASS_FOLD[0]; register <= BASS_FOLD[1]; register++) {
      const base = encodeBar(oneChordBar(register));
      for (let pitch = 0; pitch < 12; pitch++)
        for (const jump of [false, true]) {
          const text = base.replace(/^bass .*$/mu, `bass 0=${pitch}${jump ? '^' : ''}`);
          const near = independentNearest(pitch, register);
          const note = near + (jump ? 12 : 0);
          if (note > BASS_TOP) {
            expect(scoreProblems(text)).toEqual(['bass: step 0 goes above 57']);
            refused++;
            continue;
          }
          const bar = compileBar(text);
          expect(bar.bass).toEqual({ register, notes: [{ step: 0, note }] });
          expect(encodeBar(bar)).toBe(text);
          written++;
        }
    }
    expect(written).toBe(20 * 12 * 2 - refused);
    expect(refused).toBeGreaterThan(0);
  });

  it('puts a pitch class at its nearest octave exactly as the engine folds it, ties down: over every register and pitch class (U6)', () => {
    for (let last = BASS_FOLD[0]; last <= BASS_FOLD[1]; last++)
      for (let pitchClass = 0; pitchClass < 12; pitchClass++)
        expect(bassNearest(pitchClass, last)).toBe(independentNearest(pitchClass, last));
  });

  it('spells the register as the key spells its notes, and reads every register of every key back (Q1a, F3)', () => {
    let spelled = 0;
    for (const mode of DIATONIC_MODE_NAMES)
      for (const tonic of range(12))
        for (let register = BASS_FOLD[0]; register <= BASS_FOLD[1]; register++) {
          const bar: ScoreBar = {
            ...A_BAR,
            key: { tonic, mode },
            harm: [{ step: 0, numeral: numeral('I') }],
            bass: { register, notes: [{ step: 0, note: bassNearest(tonic, register) }] },
          };
          const text = encodeBar(bar);
          expect(compileBar(text)).toEqual(bar);
          spelled++;
        }
    expect(spelled).toBe(84 * 20);
    const frame = (key: string, register: number) =>
      encodeBar({
        ...oneChordBar(register),
        key: { tonic: { C: 0, F: 5, G: 7 }[key]!, mode: 'ionian' },
        harm: [{ step: 0, numeral: numeral('I') }],
        bass: {
          register,
          notes: [{ step: 0, note: bassNearest({ C: 0, F: 5, G: 7 }[key]!, register) }],
        },
      })
        .split('\n')
        .find((l) => l.startsWith('frame'));
    // In the key's own scale by its spelling; off it, flats in a flat key and sharps otherwise.
    expect(frame('F', 46)).toBe('frame bass=Bb2');
    expect(frame('G', 42)).toBe('frame bass=F#2');
    expect(frame('F', 42)).toBe('frame bass=Gb2');
    expect(frame('C', 34)).toBe('frame bass=A#1');
  });

  it('writes every text that compiles in one form: a second pass changes nothing (Q1a, F3)', () => {
    const variant = [
      ...BASS_TEXT.split('\n').slice(0, 3),
      'bass   0=0 4=0  7=7 8=0 12=0^ 14=10',
      'frame bass=D##2',
    ].join('\n');
    expect(encodeBar(compileBar(variant))).toBe(BASS_TEXT);
    expect(encodeBar(compileBar(BASS_TEXT))).toBe(BASS_TEXT);
  });

  it('compiles a bar from its own text, with no state before it: the register is in the frame, so cold equals warm (S2)', () => {
    // The same pairs from another register are other notes. A frame
    // that compile ignored would make both bars read as one.
    const other = compileBar(withBassLine('frame', 'frame bass=E3'));
    expect(other.bass!.register).toBe(52);
    expect(other.bass!.notes).not.toEqual(BASS_BAR.bass!.notes);
    expect(other.bass!.notes.map((n) => n.note % 12)).toEqual(
      BASS_BAR.bass!.notes.map((n) => n.note % 12),
    );
    expect(compileBar(BASS_TEXT)).toEqual(BASS_BAR);
  });

  it('refuses a bass line or a frame that is not one, and says why', () => {
    expect(scoreProblems(BASS_TEXT)).toEqual([]);
    const cases: [string, string[]][] = [
      [withBassLine('frame', undefined), ['a bass line needs a frame line, such as frame bass=E2']],
      [withBassLine('bass', undefined), ['frame bass= has no bass line to carry into']],
      [`${BASS_TEXT}\nbass 0=0`, ['a bar has one bass line']],
      [`${BASS_TEXT}\nframe bass=E2`, ['a bar has one frame line']],
      [withBassLine('bass', 'bass'), ['bass: the line has no notes']],
      [
        withBassLine('frame', 'frame bass=E'),
        ['frame: bass=E is not a note with an octave, such as bass=E2'],
      ],
      [
        withBassLine('frame', 'frame bass=e2'),
        ['frame: bass=e2 is not a note with an octave, such as bass=E2'],
      ],
      [
        withBassLine('frame', 'frame bass=C1'),
        ['frame: bass=C1 is outside 33–52, where the bass register carries'],
      ],
      [
        withBassLine('frame', 'frame bass=F3'),
        ['frame: bass=F3 is outside 33–52, where the bass register carries'],
      ],
      [withBassLine('frame', 'frame'), ['frame: no field, such as bass=E2 or comp=C4,E4,G4']],
      [withBassLine('frame', 'frame bass=E2 lead=E4'), ['"lead=E4" is not a field here']],
      [withBassLine('bass', 'bass 0=0 4'), ['bass: "4" is not step=pitch, such as 4=0 or 12=0^']],
      [withBassLine('bass', 'bass 0=0v'), ['bass: "0=0v" is not step=pitch, such as 4=0 or 12=0^']],
      [withBassLine('bass', 'bass x=0'), ['bass: "x=0" is not step=pitch, such as 4=0 or 12=0^']],
      [withBassLine('bass', 'bass 0=0 0=7'), ["bass: its steps must rise within the bar's 16"]],
      [withBassLine('bass', 'bass 4=0 0=7'), ["bass: its steps must rise within the bar's 16"]],
      [withBassLine('bass', 'bass 16=0'), ["bass: its steps must rise within the bar's 16"]],
      [
        withBassLine('bass', 'bass 0=12'),
        ['bass: pitch 12 is not 0–11 semitones above the chord root'],
      ],
      // What the tree of #275 will write, refused until then.
      [withBassLine('bass', 'bass 0=0 _'), ['bass: "_" is not written yet (#275)']],
      [withBassLine('bass', 'bass 0=~'), ['bass: "0=~" is not written yet (#275)']],
      [withBassLine('bass', 'bass 3=[0,4,6]'), ['bass: "3=[0,4,6]" is not written yet (#275)']],
      [withBassLine('bass', 'bass 0=0*4'), ['bass: "0=0*4" is not written yet (#275)']],
    ];
    for (const [text, problems] of cases) {
      expect(scoreProblems(text)).toEqual(problems);
      if (problems.length) expect(() => compileBar(text)).toThrow(problems[0]);
    }
  });

  it('refuses a ^ that passes the top of the bass’s range, which only a register near the top can reach (U6)', () => {
    const high = withBassLine('frame', 'frame bass=E3').replace('bass 0=0', 'bass 0=0^');
    expect(scoreProblems(high)).toEqual(['bass: step 0 goes above 57']);
  });

  it('refuses to write a bass it could not read back', () => {
    const bar = (notes: { step: number; note: number }[], register = 40): ScoreBar => ({
      ...BASS_BAR,
      bass: { register, notes },
    });
    expect(() => encodeBar(bar([]))).toThrow('bass: a bass line has at least one note');
    expect(() =>
      encodeBar(
        bar([
          { step: 4, note: 33 },
          { step: 0, note: 36 },
        ]),
      ),
    ).toThrow("bass: its steps must rise within the bar's 16");
    expect(() => encodeBar(bar([{ step: 16, note: 36 }]))).toThrow("the bar's 16");
    expect(() => encodeBar(bar([{ step: 0.5, note: 36 }]))).toThrow("the bar's 16");
    expect(() => encodeBar(bar([{ step: 0, note: 36 }], 53))).toThrow(
      'bass: register 53 is outside 33–52',
    );
    expect(() => encodeBar(bar([{ step: 0, note: 36 }], 32))).toThrow(
      'bass: register 32 is outside 33–52',
    );
    expect(() => encodeBar(bar([{ step: 0, note: 36.5 }]))).toThrow('bass: note 36.5 at step 0');
    // Neither the octave nearest the register nor the one above it: no token says it.
    expect(() => encodeBar(bar([{ step: 0, note: 60 }]))).toThrow(
      'bass: note 60 at step 0 cannot be written from register 40',
    );
    expect(() => encodeBar(bar([{ step: 0, note: 24 }]))).toThrow('cannot be written');
    expect(() => encodeBar(bar([{ step: 0, note: 69 }]))).toThrow('cannot be written');
    // An octave above the nearest is a ^; the octave below has no token.
    expect(() => encodeBar(bar([{ step: 0, note: 48 }]))).not.toThrow();
    expect(() => encodeBar(bar([{ step: 4, note: 33 }]))).toThrow('cannot be written');
  });
});

/** C major, A minor, F major and G7, each a beat, from a voicing of C: the comp voices each from the one before. */
const COMP_FRAME = [60, 64, 67];
const VOICED = [
  [60, 64, 67],
  [60, 64, 69],
  [60, 65, 69],
  [59, 62, 65, 67],
];

/** A pad on each chord, a stab between, the last leading into the G major of the next bar, which is in another key. */
const COMP_BAR: ScoreBar = {
  ...A_BAR,
  harm: BASS_CHORDS,
  voicing: COMP_FRAME,
  pad: BASS_CHORDS.map(({ step }, i) => ({ step, notes: VOICED[i]! })),
  stab: [
    { step: 2, notes: VOICED[0]! },
    { step: 6, notes: VOICED[1]! },
    { step: 10, notes: VOICED[2]! },
    { step: 14, notes: [59, 62, 67] },
  ],
  next: { key: { tonic: 7, mode: 'ionian' }, numeral: numeral('I') },
};

const COMP_TEXT = [
  ...A_TEXT.split('\n').slice(0, 2),
  'harm "I vi IV V7"',
  'frame comp=C4,E4,G4',
  'pad 0=ch 4=ch 8=ch 12=ch',
  'stab 2=ch 6=ch 10=ch 14=nx',
  'next I key=G:ionian',
].join('\n');

/** The comp bar's text with one line replaced, or taken out with `undefined`. */
const withCompLine = (kind: string, line: string | undefined) =>
  COMP_TEXT.split('\n')
    .flatMap((l) => (l.startsWith(`${kind} `) ? (line === undefined ? [] : [line]) : [l]))
    .join('\n');

describe('a pad and a stab (#264: two lines, the voicing in the key frame, the next chord stated)', () => {
  it('writes the voicing in the frame, the onsets as step=ch or step=nx, and the next chord, and reads them back (Q1a, U6)', () => {
    expect(encodeBar(COMP_BAR)).toBe(COMP_TEXT);
    expect(compileBar(COMP_TEXT)).toEqual(COMP_BAR);
  });

  it('voices each chord close from the one before it, the first from the frame: the same chords from another voicing are other notes (S2)', () => {
    const from = (frame: string) =>
      compileBar(withCompLine('frame', frame === '' ? undefined : `frame comp=${frame}`)).pad!.map(
        (hit) => hit.notes,
      );
    expect(from('C4,E4,G4')).toEqual(VOICED);
    // A C major a close voicing lower: other notes, the same pitch classes.
    const lower = from('G3,C4,E4');
    expect(lower).not.toEqual(VOICED);
    expect(lower.map((notes) => new Set(notes.map((n) => n % 12)))).toEqual(
      VOICED.map((notes) => new Set(notes.map((n) => n % 12))),
    );
    // With no frame there is nothing to lead from: the first chord sits nearest the middle.
    expect(from('')[0]).toEqual([60, 64, 67]);
  });

  it('states no length: a pad lasts to the next chord and a stab one step, so a line is steps and chords only', () => {
    const one = compileBar(withCompLine('pad', 'pad 0=ch'));
    expect(one.pad).toEqual([{ step: 0, notes: VOICED[0]! }]);
    expect(Object.keys(one.pad![0]!)).toEqual(['step', 'notes']);
  });

  it('plays the next bar’s first chord on nx, in the key the next line states, and in the bar’s own key where it states none (U6)', () => {
    const inG = compileBar(COMP_TEXT).stab!.at(-1)!.notes;
    const inC = compileBar(withCompLine('next', 'next I')).stab!.at(-1)!.notes;
    expect(inG).toEqual([59, 62, 67]);
    expect(inC).toEqual([60, 64, 67]);
    expect(encodeBar(compileBar(withCompLine('next', 'next I')))).toMatch(/\nnext I$/u);
  });

  it('writes a bar with no pad and no stab exactly as before: no comp frame, no next', () => {
    expect(encodeBar(A_BAR)).toBe(A_TEXT);
    const both = encodeBar({ ...BASS_BAR, pad: COMP_BAR.pad!, voicing: COMP_FRAME });
    expect(both).toContain('\nframe bass=E2 comp=C4,E4,G4\nbass ');
    expect(compileBar(both).bass).toEqual(BASS_BAR.bass);
    expect(compileBar(both).voicing).toEqual(COMP_FRAME);
  });

  it('writes every text that compiles in one form: a second pass changes nothing (Q1a, F3)', () => {
    const variant = COMP_TEXT.replace('comp=C4,E4,G4', 'comp=B#3,E4,G4').replace(
      'pad 0=ch 4=ch',
      'pad  0=ch   4=ch',
    );
    expect(encodeBar(compileBar(variant))).toBe(COMP_TEXT);
    // A next chord in the bar's own key states no key, and a stab that never leads into it needs none.
    const same = withCompLine('next', 'next I key=C:ionian');
    expect(encodeBar(compileBar(same))).toBe(withCompLine('next', 'next I'));
  });

  it('refuses a pad, a stab, a next line or a voicing that is not one, and says why', () => {
    expect(scoreProblems(COMP_TEXT)).toEqual([]);
    const cases: [string, string[]][] = [
      [withCompLine('pad', 'pad'), ['pad: the line has no chords']],
      [
        withCompLine('pad', 'pad 0=nx'),
        ['pad: "0=nx" is not ch: only the chord in force starts a pad'],
      ],
      [withCompLine('stab', 'stab 2=x'), ['stab: "2=x" is not step=ch or step=nx']],
      [withCompLine('stab', 'stab 4=ch 0=ch'), ["stab: its steps must rise within the bar's 16"]],
      [withCompLine('stab', 'stab 16=ch'), ["stab: its steps must rise within the bar's 16"]],
      [withCompLine('pad', 'pad 0=ch 0=ch'), ["pad: its steps must rise within the bar's 16"]],
      [withCompLine('stab', 'stab 2=[ch'), ['stab: "2=[ch" is not written yet (#275)']],
      [
        withCompLine('next', undefined),
        ['a stab plays nx, which needs a next line, such as next V7'],
      ],
      [
        withCompLine('stab', 'stab 2=ch'),
        ['a next line with no nx in the stab has nothing to voice'],
      ],
      [
        withCompLine('stab', undefined),
        ['a next line with no nx in the stab has nothing to voice'],
      ],
      [`${COMP_TEXT}\nnext V7`, ['a bar has one next line']],
      [withCompLine('next', 'next X'), ['next: "X" is not a numeral']],
      [
        withCompLine('next', 'next I key=g:ionian'),
        ['key=g:ionian is not a tonic and a mode, such as key=A:aeolian'],
      ],
      [withCompLine('next', 'next'), ['next: "" is not <numeral> or <numeral> key=…']],
      [
        withCompLine('next', 'next I key=G:ionian extra'),
        ['next: "I key=G:ionian extra" is not <numeral> or <numeral> key=…'],
      ],
      [
        withCompLine('frame', 'frame comp=C4,X'),
        ['frame: comp=C4,X is not notes with octaves, such as comp=C4,E4,G4'],
      ],
      [
        withCompLine('frame', 'frame comp=G4,E4'),
        ['frame: comp=G4,E4 must rise within 50–79, where the comp plays'],
      ],
      [
        withCompLine('frame', 'frame comp=C1,E4'),
        ['frame: comp=C1,E4 must rise within 50–79, where the comp plays'],
      ],
      [withCompLine('frame', 'frame comp=C4,E4 comp=C4'), ['comp= is stated twice']],
      [
        [0, 1, 2, 3].map((i) => COMP_TEXT.split('\n')[i]).join('\n'),
        ['frame comp= has no pad or stab line to carry into'],
      ],
    ];
    for (const [text, problems] of cases) {
      expect(scoreProblems(text)).toEqual(problems);
      expect(() => compileBar(text)).toThrow(problems[0]);
    }
  });

  it('refuses to write a pad or a stab it could not read back', () => {
    const bar = (over: Partial<ScoreBar>, ...omit: (keyof ScoreBar)[]): ScoreBar =>
      Object.fromEntries(
        Object.entries({ ...COMP_BAR, ...over }).filter(
          ([key]) => !omit.includes(key as keyof ScoreBar),
        ),
      ) as unknown as ScoreBar;
    expect(() => encodeBar(bar({ pad: [] }))).toThrow('pad: a pad line has at least one chord');
    expect(() => encodeBar(bar({ stab: [] }))).toThrow('stab: a stab line has at least one chord');
    expect(() => encodeBar(bar({ pad: [{ step: 0, notes: [60, 64, 68] }] }))).toThrow(
      "pad: the notes at step 0 are not the chord's voicing from the frame",
    );
    expect(() => encodeBar(bar({ stab: [{ step: 2, notes: [60, 64, 68] }] }))).toThrow(
      "stab: the notes at step 2 are not the chord's voicing or the next chord's from the frame",
    );
    expect(() =>
      encodeBar(
        bar({
          pad: [
            { step: 4, notes: VOICED[1]! },
            { step: 0, notes: VOICED[0]! },
          ],
        }),
      ),
    ).toThrow("pad: its steps must rise within the bar's 16");
    expect(() => encodeBar(bar({ voicing: [55, 60, 64] }))).toThrow('the notes at step 0');
    expect(() => encodeBar(bar({ voicing: [64, 60] }))).toThrow(
      'comp: a voicing rises within 50–79',
    );
    expect(() => encodeBar(bar({ voicing: [60, 64, 80] }))).toThrow('comp: a voicing rises within');
    expect(() => encodeBar(bar({}, 'pad', 'stab', 'next'))).toThrow(
      'comp: a voicing needs a pad or a stab line to carry into',
    );
    expect(() => encodeBar(bar({}, 'next'))).toThrow('the notes at step 14');
    expect(() => encodeBar(bar({ stab: [{ step: 2, notes: VOICED[0]! }] }))).toThrow(
      'next: no stab plays the next chord',
    );
    expect(() => encodeBar(bar({}, 'stab'))).toThrow('next: no stab plays the next chord');
    expect(() =>
      encodeBar(bar({ next: { key: { tonic: 12, mode: 'ionian' }, numeral: numeral('I') } })),
    ).toThrow('next: tonic 12 is not a pitch class');
  });
});
