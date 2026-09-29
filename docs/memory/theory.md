# Theory, music21, tonal and Strudel

Facts about `packages/theory` and the libraries checked against it.

- To try the theory without a test, run its TypeScript source from the repository root, where `tonal` resolves too: `node --experimental-strip-types --no-warnings --input-type=module -e "import { read } from './packages/theory/src/index.ts'; console.log(read('C blues'))"`.
- To resolve a musical name, use `read` from `@jambot/theory`: `read('C blues')`, `read('G7', { kind: 'chord' })`, `read('clave')`, `read('second')`, `read('harm minor 5')`.
  `readings(name)` lists every reading of an ambiguous name, and `nameOf(reading)` writes one back.
  The sister projects' names are all in `sister-names.test.ts`; a new one goes there first.
- The theory's core relations, and the test that holds each, are in [`theory.md`](../theory.md).
  A new relation gets its test and its line there.
- In the theory, a set is a `Helix`, `{ cycle, heights }`: the heights of degrees 0 to k − 1, with degree 0 wherever it stands.
  `positions(helix)` is the sorted view from the circle.
  `shift` moves heights (transposition) and `mode` moves degrees (same positions, another tonic).

## Strudel and the sister projects

- Strudel (`@strudel/*`) is AGPL-3.0-or-later.
  `@strudel/core` 1.2.6 does not load under Node 22 (a missing `@kabelsalat/web` export); 1.2.5 does.
- Jambot's Euclid is the prototype's form, `even(k, n)`, shared exactly with play-aeiou, quintenzirkel and tonal; that is decided (#8).
  Strudel's differs for 46 of the 120 `(k,n)` pairs with `k < n ≤ 16`, always by a rotation, so a Strudel export compensates with a shift or writes the pattern out.
- Strudel's `rev`, `late` and `scaleTranspose` (also `strans`) are the motif operators of those names (U5), so an export writes them as they are.
  Its `seq` concatenates, its `inv` swaps onsets and rests, and its `take` stretches the notes kept over the cycle, so the score doesn't use those words for motifs.
- The sister projects (play-aeiou, lib-aeiou, quintenzirkel) are read-only from here, and they share conventions with Jambot, not code.
  See [architecture](../architecture.md#related-projects).

## music21 and tonal

- Two libraries give second opinions on theory claims, through the `music-theory` skill ([`SKILL.md`](../../.claude/skills/music-theory/SKILL.md)): music21 (Python, BSD-3-Clause, pinned to 10.5.0) and tonal (MIT, a dev dependency).
  Lint keeps tonal to tests, and music21 is never a dependency of a package.
- They agree on note names, diatonic scales and the triads and sevenths of every mode.
  On chord symbols they never disagree when both can read one, but each reads names the other can't.
- tonal's Euclid, `RhythmPattern.euclid(n, k)`, is exactly `even(k, n)`, with the same rotation, for every 1 ≤ k ≤ n ≤ 16.
  Strudel's is not (#8).
- Roman numerals follow three conventions.
  Jambot's is the prototype's, decided as U1 on #7: the degree and `b`/`#` from the mode and the quality from the case, as music21 does, and `7`, `maj7` and `9` as fixed intervals, as tonal does.
  So `bVII` in G mixolydian is F♭ major (the mode's own F major is `VII`), and `I7` in C is C E G B♭. music21 differs in one more place: it raises the seventh degree of a minor key for `vii`.
  `parseNumeral` and `chordOfNumeral` in `@jambot/theory` read numerals.
  `alteredDegree` is the rule that writes a note off the key, for a numeral's root and a motif's note alike: as the parallel major has it, otherwise flat, so blue notes are ♭3, ♭5 and ♭7.
- music21 reads `-` as a flat (`C-7` is C♭7), reads `Bb7` as B major with a flat seventh without any error, and ignores `maj` in a numeral.
  tonal ignores a numeral's case.
  The skill's scripts guard against all of these.
