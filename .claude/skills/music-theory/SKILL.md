---
name: music-theory
description: Check a music-theory claim against music21 before it goes into a test, a doc, a PR or an answer. Use when writing or reviewing code in packages/theory, the engine's harmony and pitch, or the analyzer's key and chord stages; when a table of chords, scales, intervals, spellings or Roman numerals needs expected values; or when someone asks whether a theory statement is true ("every mode has 3 major triads", "E♭ harmonic minor has a C♭", "V7/iv in A minor").
---

# Music theory: check claims with a second opinion

Jambot derives its theory from one primitive, `even(k, n, rotation)`. A test
that checks the primitive against values derived from the primitive proves
little. music21 (BSD-3-Clause, MIT's toolkit for computer musicology) derives
the same facts in a different way, from spelled pitches and named scales, so
it serves as an independent second opinion.

It is a second opinion, not the truth. What is true for Jambot is what the
tests and the design say (see `AGENTS.md`). music21 is never a dependency of
`packages/*` or `apps/*`. It runs only here, as a Python tool outside the pnpm
toolchain.

## Running it

```sh
uv run .claude/skills/music-theory/oracle.py selftest     # run this first, once per session
uv run .claude/skills/music-theory/oracle.py chord Bb7 F#m7b5 Csus4
uv run .claude/skills/music-theory/oracle.py roman A:minor i7 V7/iv bVI
uv run .claude/skills/music-theory/oracle.py scale Eb:minor
uv run .claude/skills/music-theory/oracle.py stack --size 4     # qualities per mode
uv run .claude/skills/music-theory/oracle.py name 60 63 66 70   # name a set of notes
uv run .claude/skills/music-theory/oracle.py note Eb4 Fx3 Cb4
uv run .claude/skills/music-theory/oracle.py key song.mid       # five key profiles
```

`uv` reads the pinned version (`music21==10.5.0`) from the script header.
Without `uv`, run `pip install music21==10.5.0` and then
`python .claude/skills/music-theory/oracle.py …`.

Input is written the way Jambot writes it: `Eb`, `Bb7`, `A:minor`,
`D:dorian`. Each answer is printed as one line of JSON, ready to paste into a
test as a literal. If the script cannot translate an input without guessing,
it answers `{"refused": …}` and exits with status 2.

`selftest` checks the translation layer and the traps listed below. When it
fails, music21 has changed behaviour: fix the script before trusting any
other answer.

## Checking a claim

1. **State the claim exactly**, including its domain. "Every diatonic mode
   has 3 major, 3 minor and 1 diminished triad" is a claim over 7 modes × 7
   degrees.
2. **If the domain is finite, the TypeScript test enumerates all of it**, as
   the law of meaningful tests requires. The oracle provides the expected
   values; it does not replace the test.
3. **Ask the oracle** and compare its answer with Jambot's.
4. **Sort each disagreement** into one of these kinds before acting on it:
   - _notation_: the two sides write the same thing differently (music21
     uses `-` for a flat);
   - _vocabulary_: music21 cannot read a name Jambot accepts (`Δ`, `maj9`,
     `°`, `mMaj7`). For names, the sister projects and the design are the
     source of truth, not music21;
   - _label_: music21's pitches are right but its label is wrong (`m7b5`
     is labelled `minor-seventh`). Trust `intervals` and `pitches`, not
     `kind` or `name`;
   - _convention_: both are consistent, but they follow different rules. Note
     the convention in the test;
   - _error_: one side is wrong. Only this kind is a bug.
5. **Record the result.** The expected values go into the test as literals.
   Add a comment saying where they come from when that is not obvious
   ("checked with music21 10.5.0"). Only write that a claim was checked if
   you ran the check.

music21 has no maximal evenness, Euclidean rhythms or mini-notation. Claims
about those are checked by exhaustive enumeration in the test itself.

## Traps (the selftest covers each)

- **`-` is a flat in music21.** `C-7` is C♭7, not Cm7, so the script refuses
  it. `key.Key('eb')` is E♭ minor: lower case means minor.
- **`Bb7` read directly by music21 is B major with a flat seventh**
  (`B D♯ F♯ A`), with no error. The script translates roots before music21
  sees them. Never pass Jambot's chord symbols to `harmony.ChordSymbol`
  yourself.
- **`b` on a Roman numeral lowers the mode's own degree**, in music21 and in
  the prototype's `parseRoman` alike: `bVI` in A minor is F♭ major, and
  `bVII` in G mixolydian is F♭ major (the mode's own F major is `VII`). Pop
  usage, which measures from the major scale, differs.
- **Labels are narrower than pitches.** `name 60 64 67 74` answers
  "major-second major tetrachord", not "add9", and `m7b5` gets the kind
  `minor-seventh`.
- **Chords without octaves** get default octaves in music21. That changes
  which note is in the bass, and with it the inversion figures from
  `roman.romanNumeralFromChord`. Pass notes with octaves.
