/**
 * Ask music21 (`oracle.py`) and tonal (`tonal.mjs`) the same questions and
 * report where they agree.
 *
 * Run with `node .claude/skills/music-theory/compare.mjs [--all]`. `--all`
 * lists every disagreement, not only the first few per kind. The queries are
 * Jambot's vocabulary: the prototype's Roman numerals in its four modes, and
 * every chord symbol in `CHORD_QUALITIES`, read from the theory package (Node
 * runs its TypeScript directly).
 */

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORD_QUALITIES } from '../../../packages/theory/src/chords.ts';
import { ask } from './tonal.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const showAll = process.argv.includes('--all');

function music21(command, args) {
  let out;
  try {
    out = execFileSync('uv', ['run', '-q', join(here, 'oracle.py'), command, ...args], {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.status !== 2) throw error;
    out = error.stdout; // exit status 2: some items were refused
  }
  return out
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTALS = ['', '#', 'b', '##', 'bb', 'x', '♯', '♭'];
const MODES = ['lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian', 'locrian'];
/** Every chord symbol Jambot reads, from the theory package itself. */
const CHORD_SYMBOLS = Object.values(CHORD_QUALITIES).flatMap((quality) => quality.symbols);
const ROMANS = [
  ...['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  ...['bII', 'bIII', 'bVI', 'bVII', '#IV', 'III+'],
  ...['V7', 'I7', 'IV7', 'Imaj7', 'ii7', 'iiø7', 'vii°7', 'V9', 'Imaj9', 'V7/V', 'V7/iv'],
];

/**
 * Each group: a command, the arguments before the items, the items (one
 * answer each), and the fields to compare. A group is one call to music21.
 */
const NOTES = [
  ...LETTERS.flatMap((letter) =>
    ACCIDENTALS.flatMap((acc) => [`${letter}${acc}`, `${letter}${acc}4`]),
  ),
  ...['C-1', 'G9', 'E7', 'B#3', 'Cb4'],
];
const groups = [
  ['note', [], NOTES, ['pitchClass', 'midi']],
  [
    'chord',
    [],
    ['C', 'Eb', 'F#', 'Bb'].flatMap((root) => CHORD_SYMBOLS.map((symbol) => root + symbol)),
    ['intervals', 'pitches'],
  ],
  ...['C:major', 'A:minor', 'D:dorian', 'G:mixolydian'].map((key) => [
    'roman',
    [key],
    ROMANS,
    ['root', 'intervals'],
  ]),
  ...['C', 'Eb', 'F#', 'Bb'].flatMap((tonic) =>
    MODES.map((mode) => ['scale', [], [`${tonic}:${mode}`], ['pitches', 'set']]),
  ),
  ...[3, 4].map((size) => ['stack', ['--size', String(size)], MODES, ['census']]),
  ...[
    ['60', '64', '67'],
    ['60', '63', '67'],
    ['60', '63', '66'],
    ['60', '64', '68'],
    ['60', '64', '67', '70'],
    ['60', '64', '67', '71'],
    ['60', '63', '67', '70'],
    ['60', '63', '66', '70'],
    ['60', '63', '66', '69'],
    ['60', '64', '67', '74'],
    ['60', '65', '67'],
    ['64', '67', '72'],
  ].map((notes) => ['name', notes, [notes.join(' ')], ['root']]),
];

const octaveless = (value) =>
  Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v.replace(/-?\d+$/, '') : v))
    : value;
const same = (a, b) => JSON.stringify(octaveless(a)) === JSON.stringify(octaveless(b));
const unread = (answer) => 'unreadable' in answer || 'refused' in answer;

const tally = {};
for (const [command, fixed, items, fields] of groups) {
  // `stack` and `name` take no item list: one call answers them all.
  const batch =
    command === 'stack' ? ['all', ...fixed] : command === 'name' ? fixed : [...fixed, ...items];
  const fromMusic21 = music21(command, batch);
  const fromTonal = ask(command, batch);
  if (fromMusic21.length !== items.length || fromTonal.length !== items.length)
    throw new Error(`${command} ${batch.join(' ')}: expected ${items.length} answers each`);
  items.forEach((item, i) => {
    const [m, t] = [fromMusic21[i], fromTonal[i]];
    const row = (tally[command] ??= {
      total: 0,
      agree: 0,
      onlyMusic21: [],
      onlyTonal: [],
      neither: [],
      differ: [],
    });
    row.total++;
    const query = [command, ...(command === 'name' ? [] : fixed), item].join(' ');
    if (unread(m) && unread(t)) row.neither.push(query);
    else if (unread(m)) row.onlyTonal.push(query);
    else if (unread(t)) row.onlyMusic21.push(query);
    else {
      const differing = fields.filter((f) => !same(m[f], t[f]));
      if (differing.length === 0) row.agree++;
      else
        row.differ.push(
          `${query}: ${differing
            .map((f) => `${f} music21 ${JSON.stringify(m[f])} tonal ${JSON.stringify(t[f])}`)
            .join('; ')}`,
        );
    }
  });
}

const list = (label, items) => {
  if (items.length === 0) return;
  console.log(`  ${label}: ${items.length}`);
  for (const item of showAll ? items : items.slice(0, 6)) console.log(`    ${item}`);
  if (!showAll && items.length > 6) console.log(`    … ${items.length - 6} more (--all)`);
};
for (const [command, row] of Object.entries(tally)) {
  console.log(`${command}: ${row.agree} of ${row.total} agree`);
  list('differ', row.differ);
  list('only music21 reads', row.onlyMusic21);
  list('only tonal reads', row.onlyTonal);
  list('neither reads', row.neither);
}
