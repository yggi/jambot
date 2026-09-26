/**
 * A second opinion on music-theory claims, from tonal.
 *
 * Run with `node .claude/skills/music-theory/tonal.mjs <command> ...`. The
 * commands and the JSON they print match `oracle.py`, so the two can be
 * compared answer by answer (`compare.mjs` does that).
 */

import { Chord, Mode, Note, Progression, RomanNumeral, Scale } from 'tonal';

const MODES = ['lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian', 'locrian'];
const TONAL_MODE = { major: 'ionian', minor: 'aeolian' };

const semitones = (from, to) => (((Note.chroma(to) - Note.chroma(from)) % 12) + 12) % 12;
const relative = (notes, root) =>
  [...new Set(notes.map((n) => semitones(root, n)))].sort((a, b) => a - b);
const normal = (name) => name.replace('♯', '#').replace('♭', 'b').replace(/x/g, '##');

/** `A:minor`, `D:dorian` or `f#` (lower case is minor), as in `oracle.py`. */
function parseKey(text) {
  const [tonic, mode = tonic[0] === tonic[0].toLowerCase() ? 'minor' : 'major'] = text.split(':');
  const canonical = { ionian: 'major', aeolian: 'minor' }[mode] ?? mode;
  if (!MODES.includes(canonical)) throw new Refused(`'${mode}' is not a diatonic mode`);
  const note = Note.get(normal(tonic[0].toUpperCase() + tonic.slice(1)));
  if (note.empty || note.oct !== undefined) throw new Refused(`'${text}' is not a key`);
  return { tonic: note.pc, mode: canonical };
}

class Refused extends Error {}

const commands = {
  *note(items) {
    for (const text of items) {
      const note = Note.get(normal(text));
      if (note.empty) throw new Refused(`'${text}' is not a note name`);
      yield {
        note: text,
        pitchClass: note.chroma,
        ...(note.midi === null || note.midi === undefined ? {} : { midi: note.midi }),
      };
    }
  },
  *chord(items) {
    for (const text of items) {
      const chord = Chord.get(text);
      if (chord.empty || !chord.tonic) {
        yield { chord: text, unreadable: 'tonal has no chord by this name' };
        continue;
      }
      yield {
        chord: text,
        kind: chord.type,
        intervals: relative(chord.notes, chord.tonic),
        pitches: chord.notes,
      };
    }
  },
  /**
   * tonal reads a numeral from the tonic's major scale and ignores its case:
   * only the suffix sets the quality. The key's mode is therefore ignored.
   */
  *roman([keyText, ...items]) {
    const { tonic } = parseKey(keyText);
    for (const figure of items) {
      const [symbol] = RomanNumeral.get(figure).empty
        ? ['']
        : Progression.fromRomanNumerals(tonic, [figure]);
      const chord = Chord.get(symbol);
      if (!symbol || chord.empty) {
        yield { roman: figure, key: keyText, unreadable: 'tonal cannot read this numeral' };
        continue;
      }
      yield {
        roman: figure,
        key: keyText,
        root: chord.tonic,
        intervals: relative(chord.notes, chord.tonic),
        pitches: chord.notes,
        name: chord.type,
      };
    }
  },
  *scale([keyText]) {
    const { tonic, mode } = parseKey(keyText);
    const notes = Scale.get(`${tonic} ${TONAL_MODE[mode] ?? mode}`).notes;
    yield { key: keyText, pitches: notes, set: relative(notes, notes[0]) };
  },
  *stack(args) {
    const at = args.indexOf('--size');
    const size = at < 0 ? 3 : Number(args[at + 1]);
    const mode = args.find((_, i) => at < 0 || (i !== at && i !== at + 1)) ?? 'all';
    for (const name of mode === 'all' ? MODES : [mode]) {
      const notes = Mode.notes(TONAL_MODE[name] ?? name, 'C');
      const census = {};
      for (let d = 0; d < 7; d++) {
        const chord = Array.from({ length: size }, (_, i) => notes[(d + 2 * i) % 7]);
        const key = relative(chord, chord[0]).join(',');
        census[key] = (census[key] ?? 0) + 1;
      }
      yield { mode: name, size, census: Object.fromEntries(Object.entries(census).sort()) };
    }
  },
  *name(items) {
    const notes = items.map((t) => (/^\d+$/.test(t) ? Note.fromMidi(Number(t)) : normal(t)));
    const [symbol] = Chord.detect(notes);
    const chord = Chord.get(symbol ?? '');
    yield {
      notes: items,
      name: symbol ?? '',
      root: chord.empty ? '' : chord.tonic,
      quality: chord.empty ? '' : chord.quality.toLowerCase(),
    };
  },
};

/** Answers this script must keep giving; a failure means tonal moved. */
const SELFTEST = [
  [['chord', 'Bb7'], { intervals: [0, 4, 7, 10], pitches: ['Bb', 'D', 'F', 'Ab'] }],
  [['chord', 'C-7'], { intervals: [0, 3, 7, 10] }],
  [['chord', 'Cø7'], { unreadable: 'tonal has no chord by this name' }],
  [['note', 'C-1'], { midi: 0 }],
  // Roman numerals: case is ignored and degrees count from the major scale.
  [['roman', 'C:major', 'ii'], { root: 'D', intervals: [0, 4, 7] }],
  [['roman', 'A:minor', 'bVI'], { root: 'F' }],
  [['roman', 'A:minor', 'V7/iv'], { unreadable: 'tonal cannot read this numeral' }],
  // Chord detection prefers the bass as root: E G C is "Em#5" before "CM/E".
  [['name', 'E4', 'G4', 'C5'], { root: 'E' }],
];

commands.selftest = function* () {
  for (const [[command, ...args], expected] of SELFTEST) {
    const [answer] = ask(command, args);
    const wrong = Object.keys(expected).filter(
      (field) => JSON.stringify(answer[field]) !== JSON.stringify(expected[field]),
    );
    yield {
      selftest: [command, ...args].join(' '),
      ok: wrong.length === 0,
      ...(wrong.length ? { got: Object.fromEntries(wrong.map((f) => [f, answer[f]])) } : {}),
    };
  }
};

export function ask(command, args) {
  try {
    return [...commands[command](args)];
  } catch (error) {
    if (error instanceof Refused) return [{ refused: error.message }];
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...args] = process.argv.slice(2);
  if (!(command in commands)) {
    console.error(`usage: tonal.mjs {${Object.keys(commands).join(',')}} ...`);
    process.exit(2);
  }
  let failed = false;
  for (const answer of ask(command, args)) {
    console.log(JSON.stringify(answer));
    failed ||= answer.ok === false || 'refused' in answer;
  }
  if (failed) process.exit(command === 'selftest' ? 1 : 2);
}
