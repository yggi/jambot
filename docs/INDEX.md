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
    (circle, helix, generator, modes, composition), each relation
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
    - `src/helix.ts`: the `Helix`, its two views (`positions`, `heightOf`,
      `wrap`, `lift`), the adjoints and `snap`, and `shift`, `gaps`,
      `compose`, `mirror` and `complement`
    - `src/even.ts`: `even(k, n, shift)`, the maximally even set, `isEven`
      and `generator`
    - `src/modes.ts`: `mode`, `modes`, `brightness`, and the diatonic modes
      by name
    - `src/notes.ts`, `src/intervals.ts`: note names (spelling, octaves),
      intervals, generic and specific, `sizes`, degree names and partials
    - `src/chords.ts`: the named chord qualities, each a stack above the
      root
    - `src/scales.ts`, `src/rhythms.ts`: named scales and rhythms
    - `src/words.ts`: how names in words compare (case, ordinals,
      accidentals, abbreviations)
    - `src/spelling.ts`: `spell` and `genericsOf`, the letter and accidental
      of each note from a spelled tonic
    - `src/keys.ts`: `relative` and `parallel` keys, and `chordScale`, the
      scale a chord implies in a key (#10)
    - `src/read.ts`: `read`, `readings` and `nameOf`, across all of these
    - `src/sister-names.test.ts`: every theory name play-aeiou, lib-aeiou
      and quintenzirkel use, checked to mean the same here
    - `src/second-opinion.test.ts`: the primitive, the names and the
      spelling checked against tonal
  - `engine/`: the musical engine, pure TypeScript
    - `src/machine.ts`: the contract every level keeps,
      `advance(env, carried, input)`, and `lawBreaks`, which checks it
    - `src/events.ts`: the note events the engine writes, and
      `eventProblems`
    - `src/random.ts`: keyed deterministic randomness, and quantised
      `chance` and `pick`
    - `src/style.ts`: the style axes, their ranges and glide spaces, the
      presets, and glides (`glideTo`, `styleAt`)
    - `src/swing.ts`: time maps, and swing as one (`swingMap`, and
      `swingOf` a style track, per beat)
    - `src/tempo.ts`: tempo as a time map from positions to seconds
    - `src/form.ts`: the section chain as a machine, and `barEnergy`
    - `src/bar.ts`: `BarEnv`, what every part reads for a bar
    - `src/drums.ts`: the drums, a function of the bar
    - `src/band.ts`: the band, the machine at bar rate
    - `src/transport.ts`: the transport, the machine at tick rate: it
      composes a bar ahead and schedules on a clock
- `apps/`
  - `web/`: the browser app (Svelte 5, Vite, PWA); serves the prototype at
    `/prototype.html`
    - `src/player.svelte.ts`: runs the transport on the audio clock and
      plays its events; the screen follows what is heard
    - `src/conductor.ts`: intents (presets, sliders) into glides on the
      style track
    - `src/audio/drums.ts`: the built-in drum kit
    - `src/ticker.ts`: the scheduler's tick, from a Worker
- `.github/workflows/ci.yml`: lint, format check, typecheck, tests, build;
  deploys `main` to GitHub Pages
- `.claude/settings.json`: the session-start hook, and the checks agents
  may run without a prompt
  - `.claude/hooks/session-start.sh`: installs dependencies and warms
    music21 when an agent session starts or resumes
- `.claude/skills/`: project skills for agents
  - [`music-theory/`](../.claude/skills/music-theory/SKILL.md): checks
    theory claims against music21 (`oracle.py`) and tonal (`tonal.mjs`), and
    compares the two (`compare.mjs`)
- [`.github/pull_request_template.md`](../.github/pull_request_template.md):
  the checklist every pull request fills in
