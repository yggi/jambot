---
name: music-theory
description: Check a music-theory claim against two independent libraries, music21 and
  tonal, before it goes into a test, a doc, a PR or an answer. Use when writing
  or reviewing code in packages/theory, the engine's harmony and pitch, or the
  analyzer's key and chord stages; when a table of chords, scales, intervals,
  spellings or Roman numerals needs expected values; or when someone asks
  whether a theory statement is true ("every mode has 3 major triads", "E♭
  harmonic minor has a C♭", "V7/iv in A minor").
---

# Music theory: check claims with a second opinion

Jambot derives its theory from one primitive, `even(k, n, shift)`. A test that
checks the primitive against values derived from the primitive proves little.
Two libraries derive the same facts in other ways, from spelled notes, named
scales and chord dictionaries:

- **music21** (Python, BSD-3-Clause, pinned to 10.5.0): MIT's musicology
  toolkit. It is the broadest of the two: Roman numerals with secondaries, key
  finding on MIDI files, and naming any set of notes.
- **tonal** (JavaScript, MIT, a dev dependency): lighter, and it reads more of
  the chord symbols Jambot uses. `packages/theory/src/second-opinion.test.ts`
  checks the primitive against it inside `pnpm verify`.

They are second opinions, not the truth. What is true for Jambot is what the
tests and the design say (see `AGENTS.md`). Neither library is imported by a
package's own code. Lint keeps tonal to tests, and music21 runs only here.

## Running them

The two scripts take the same commands and print the same JSON, one answer per
line, ready to paste into a test as a literal. Input is written the way Jambot
writes it: `Eb`, `Bb7`, `A:minor`, `D:dorian`.

```sh
M=".claude/skills/music-theory/oracle.py"; T=".claude/skills/music-theory/tonal.mjs"
uv run $M selftest; node $T selftest   # run first, once per session
uv run $M chord Bb7 F#m7b5 Csus4       # node $T chord …  as well, for every command but key
uv run $M roman A:minor i7 V7/iv bVI
uv run $M scale Eb:minor
uv run $M stack --size 4               # interval sets of stacked thirds, per mode
uv run $M name C4 Eb4 Gb4 Bb4          # name a set of notes (spelled, or MIDI numbers)
uv run $M note Eb4 Fx3 C-1
uv run $M key song.mid                 # music21 only: five key profiles
node .claude/skills/music-theory/compare.mjs [--all]   # both, over Jambot's vocabulary
```

`uv` reads music21's pinned version from the script header. Without `uv`, run
`pip install music21==10.5.0` and then `python $M …`. tonal comes with
`pnpm install`.

A script answers `{"refused": …}` and exits with status 2 when it cannot
translate an input without guessing, and `{"unreadable": …}` when the library
does not know the name. A failing `selftest` means a library changed behaviour:
fix the script before trusting any other answer.

## Where they agree, and where they don't

`compare.mjs` asks both libraries the same questions. Its current result:

| Question                                   | Agree     | Why the rest differ                       |
| ------------------------------------------ | --------- | ----------------------------------------- |
| Note names, with octaves (C4 = 60)         | 117 / 117 |                                           |
| Diatonic scales, 4 tonics × 7 modes        | 28 / 28   |                                           |
| Stacked thirds per mode (triads, sevenths) | 14 / 14   |                                           |
| Chord symbols, 55 symbols × 4 roots        | 108 / 220 | only one side reads the rest; none differ |
| Roman numerals, 31 figures × 4 keys        | 56 / 124  | three conventions, below                  |
| Root of a set of notes                     | 8 / 12    | inversions, sus chords, diminished chords |

On chord symbols the two cover each other: of the 55 symbols Jambot names
(`CHORD_QUALITIES`), 27 are read by both, 13 only by tonal (`-`, `°`, `Δ`, `ø`,
`maj9`, `mMaj7`, …), 7 only by music21 (`dom7`, `min6`, `ø7`, `M9`, …), and 8 by
neither (`maj6`, `Δ7`, `m(maj7)`, `minMaj7`, `m7♭5`, and the classical `Mm7`,
`mm7`, `MM7`).

**Roman numerals follow three conventions**, and Jambot's prototype
(`parseRoman`) matches neither library throughout:

| Rule                  | Prototype       | music21                     | tonal                     |
| --------------------- | --------------- | --------------------------- | ------------------------- |
| Degree and `b`/`#`    | from the mode   | from the mode               | from the major scale      |
| Case sets the quality | yes             | yes                         | no: `ii` is a major triad |
| `7`, `maj7`, `9`      | fixed intervals | from the key; `maj` ignored | fixed intervals           |
| `V7/iv`, `ø7`         | read            | read                        | not read                  |

So check a Roman numeral's root and case against music21 and its extensions
against tonal. For example, `bVI` in A minor is F♭ in the prototype and in
music21, and F in tonal. `I7` in C is C E G B♭ in the prototype and in tonal,
and C E G B in music21.

## Checking a claim

1. **State the claim exactly**, including its domain. "Every diatonic mode has 3
   major, 3 minor and 1 diminished triad" is a claim over 7 modes × 7 degrees.
2. **If the domain is finite, the TypeScript test enumerates all of it**, as the
   law of meaningful tests requires. The libraries provide the expected values;
   they do not replace the test. Where tonal covers the domain, the check can
   live in `second-opinion.test.ts`.
3. **Ask both** and compare their answers with Jambot's.
4. **Sort each disagreement** into one of these kinds before acting on it:
   - _notation_: the sides write the same thing differently (music21 uses `-`
     for a flat);
   - _vocabulary_: a library cannot read a name Jambot accepts. For names, the
     sister projects and the design are the source of truth;
   - _label_: the pitches are right but the label is wrong. Trust `intervals`
     and `pitches`, not `kind` or `name`;
   - _convention_: both are consistent, but they follow different rules (the
     Roman numeral table above). Note the convention in the test;
   - _error_: one side is wrong. Only this kind is a bug.
5. **Record the result.** The expected values go into the test as literals. Add
   a comment saying where they come from when that is not obvious ("checked with
   music21 10.5.0 and tonal 6.4"). Only write that a claim was checked if you
   ran the check.

Neither library knows maximal evenness or mini-notation. tonal's
`RhythmPattern.euclid(n, k)` gives exactly `even(k, n)`, with the same rotation,
for every 1 ≤ k ≤ n ≤ 16, which the test checks. For anything else about
evenness, the test enumerates it.

## Traps (the selftests cover each)

- **music21 reads `-` as a flat.** `C-7` is C♭7, not Cm7, so `oracle.py` refuses
  it, and `C-1` would be C♭ in octave 1 if the octave were not passed
  separately. tonal reads `C-7` as Cm7.
- **music21 reads `Bb7` as B major with a flat seventh** (`B D♯ F♯ A`), with no
  error. `oracle.py` translates roots before music21 sees them. Never pass
  Jambot's chord symbols to `harmony.ChordSymbol` yourself.
- **music21 takes a numeral's seventh and ninth from the key** and ignores
  `maj`: `Imaj7` in A minor is A C♯ E G.
- **tonal ignores the case of a numeral** and counts degrees from the major
  scale: `ii` in C is D major, and `bVI` in A minor is F.
- **Naming a set of notes is interpretation.** tonal prefers the bass as the
  root (E G C is "Em#5" before "C/E"). music21 spells MIDI numbers with sharps,
  so C E♭ G♭ given as `60 63 66` gets the root F♯. Pass spelled notes.
- **Labels are narrower than pitches.** music21 calls C E G D a "major-second
  major tetrachord" and gives `m7b5` the kind `minor-seventh`.
