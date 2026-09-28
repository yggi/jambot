import { DIATONIC_MODE_NAMES, parseNumeral } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  DRUM_SOUNDS,
  type DrumSound,
  type ScoreBar,
  STYLE_AXES,
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
      [`${A_TEXT}\nbass "1"`, ['"bass" is not a line']],
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
