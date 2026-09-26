# Index

Every doc and code area, as a tree. Add a line when you add one.

- [`README.md`](../README.md): what Jambot is and how to run it
- [`AGENTS.md`](../AGENTS.md): house rules and core structure (`CLAUDE.md`
  imports it)
- `docs/`
  - [`MEMORY.md`](MEMORY.md): persistent facts and the cheatsheet, the entry
    point
  - [`INDEX.md`](INDEX.md): this tree
  - [`ROADMAP.md`](ROADMAP.md): where the project is heading
  - [`architecture.md`](architecture.md): layers (engine, transport,
    renderers, UI), languages, nodes (web clients, root node,
    rendering nodes), related projects, timing
  - [`development.md`](development.md): setup, toolchain and why it was
    chosen
  - [`prototype.md`](prototype.md): what the port keeps and changes, and how
    the port is checked
  - [`theory.md`](theory.md): the mathematics under `packages/theory`
    (cycle, ladder, helix, generator, modes, composition), each relation
    with the test that holds it
  - `briefs/`: task briefs, kept verbatim
    - [`analyzer.md`](briefs/analyzer.md): the MIDI → score analyzer (#3)
- `prototype/`: the baseline the port is oriented by
  - [`README.md`](../prototype/README.md): concept, spirit, prototype
    architecture, the score language, the plan for learned models, open
    threads
  - [`jambot-prototype.html`](../prototype/jambot-prototype.html): the
    playable single-file prototype
- `packages/`
  - `theory/`: music theory on one primitive, pure TypeScript (#28)
    - `src/even.ts`: `even(k, n, rotation)`, the maximally even set, and its
      checks
    - `src/modes.ts`: modes as rotations, along the generator (`modes`) or
      in scale order (`rotate`)
    - `src/notes.ts`, `src/intervals.ts`: note names (spelling, octaves),
      intervals, generic and specific, degree names and partials
    - `src/degrees.ts`, `src/chords.ts`: counting degrees through a set, and
      chords as stacks of every other degree, with the named qualities
    - `src/scales.ts`, `src/rhythms.ts`: named scales and rhythms
    - `src/words.ts`: how names in words compare (case, ordinals,
      accidentals, abbreviations)
    - `src/lookup.ts`: lookup by name across all of these
    - `src/sister-names.test.ts`: every theory name play-aeiou, lib-aeiou
      and quintenzirkel use, checked to mean the same here
  - `engine/`: the musical engine, pure TypeScript
    - `src/random.ts`: keyed deterministic randomness
- `apps/`
  - `web/`: the browser app (Svelte 5, Vite, PWA); serves the prototype at
    `/prototype.html`
- `.github/workflows/ci.yml`: lint, format check, typecheck, tests, build;
  deploys `main` to GitHub Pages
- [`.github/pull_request_template.md`](../.github/pull_request_template.md):
  the checklist every pull request fills in
