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
    rendering nodes), timing
  - [`development.md`](development.md): setup, toolchain and why it was
    chosen
  - [`prototype.md`](prototype.md): what the port keeps and changes, and how
    the port is checked
  - `briefs/`: task briefs, kept verbatim
    - [`analyzer.md`](briefs/analyzer.md): the MIDI → score analyzer (#3)
  - `log/`: dated reports, kept as written
    - [`2026-09-26-sister-projects.md`](log/2026-09-26-sister-projects.md):
      play-aeiou, lib-aeiou and quintenzirkel as input for the score
      language (#7), with measurements against Strudel
- `prototype/`: the reference for the port
  - [`README.md`](../prototype/README.md): concept, spirit, prototype
    architecture, the score language, the plan for learned models, open
    threads
  - [`jambot-prototype.html`](../prototype/jambot-prototype.html): the
    playable single-file prototype
- `packages/`
  - `engine/`: the musical engine, pure TypeScript
    - `src/random.ts`: keyed deterministic randomness
- `apps/`
  - `web/`: the browser app (Svelte 5, Vite, PWA); serves the prototype at
    `/prototype.html`
- `.github/workflows/ci.yml`: lint, format check, typecheck, tests, build;
  deploys `main` to GitHub Pages
- [`.github/pull_request_template.md`](../.github/pull_request_template.md):
  the checklist every pull request fills in
