# The ratchet

Facts about the ratchet method, its catalogues and its pawl check.

## The ratchet

- The ratchet ([`ratchet.md`](../ratchet.md)) is the method for pairs of tracks: a working track that builds and a negative track that catalogues constraints, coupled only by claims with tests.
  The pairs are on the map, #41.
  The `ratchet` skill writes an entry as a witness, a counterexample and a decidable test; its `Status:` is the evidence, and a rule the owner took is a separate `Decided: <where>, <how>` field.
  The skill files a counterexample against the layer it refutes.
  The pawl check (`tooling/pawl.ts`, #42) runs in `pnpm verify`.
  A test holds an entry by citing its id at the end of its description, as in `(T4, Q1c)`, and the entry then names the test's file.
  Where two packages have a test file of the same name, the entry names it by its path (`packages/engine/src/chords.test.ts`); a quoted test name is the whole name, with no ellipsis; and only `#` followed by a space starts a heading, so an entry may wrap onto a line that starts with an issue number.
  The catalogues are the layer files `language-*.md` (#7, indexed in `language.md`) and `quinetic.md` (#39), with one id space; a property a layer file already holds is an alias there.
- An experiment's number is held by its catalogue entry, not by its file's header: catalogue it in the pull request that adds it, or the next experiment takes the number (#201's lead-style called itself E17 uncatalogued, and #204's H0 catalogued its own E17; lead-style is E18).
- An epic's own step ids take a letter no catalogue uses, such as #204's H0–H7 (the hand) and #207's M0–M6, since the pawl reads an id in a test's name as the catalogue's: #204's steps were once A0–A7, beside the catalogue's A1–A6 that mean other things.
