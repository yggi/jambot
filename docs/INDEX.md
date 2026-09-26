# Index

Every doc and code area, as a tree. Add a line when you add one.

- [`README.md`](../README.md): what Jambot is and how to run it
- [`AGENTS.md`](../AGENTS.md): house rules and core structure (`CLAUDE.md`
  imports it)
- [`LICENSE`](../LICENSE): MIT
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
  - [`language.md`](language.md): the language design (#7) as a negative
    shape: the catalogue of constraints on Jambot's internal musical
    expression, each a claim with a witness, a counterexample and a test;
    tensions, candidates, experiments, and the names functional programming
    and category theory give its shapes
  - [`quinetic.md`](quinetic.md): #39's catalogue of quinetic properties
    (round trips, machine laws, convergence), each a claim with a test, or
    an alias of the `language.md` entry that already holds it
  - [`ratchet.md`](ratchet.md): how a working track and a negative track
    drive each other, with tests as the pawl (#37 and #7)
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
  - `experiments/`: measurements on the prototype for the language design
    - [`cold-warm.mjs`](../prototype/experiments/cold-warm.mjs): E1, whether
      a bar's text is self-contained
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
    - `src/key.ts`: the four modes the composer knows, and `nextKey`,
      which moves a key toward the players' wish
    - `src/themes.ts`: themes, a section's harmony as degree slots
    - `src/plan.ts`: the section plan (form, key and theme), the machine
      at section rate
    - `src/bar.ts`: `BarEnv`, what every part reads for a bar
    - `src/drums.ts`: the drums, a function of the bar
    - `src/band.ts`: the band, the machine at bar rate
    - `src/transport.ts`: the transport, the machine at tick rate: it
      composes a beat before each bar and schedules on a clock
- `tooling/`: tests for the repository's own gates
  - `lint.test.ts`: each rule that keeps the pure packages pure, shown
    firing
  - `hooks.test.ts`: the pre-push hook, blocking and letting through
  - `review-pr.test.ts`: the review skill's `prepare.sh`, against a
    throwaway origin
  - `pawl.ts`: the ratchet's pawl check, which holds the catalogues'
    statuses, rules, tests, aliases and citations together (#42);
    `pawl.test.ts` shows each rule firing and runs it over the repository
  - `history.ts`: the catalogues read at any version, the gate that
    evidence only rises and rules go only with a reason, and the report
    behind `pnpm ratchet` (#43)
  - `licenses.ts`: the license gate over what the web app ships, and the
    `licenses.txt` it writes; `licenses.test.ts` shows it refusing copyleft
    and unknown licenses
  - `pages.ts`: the GitHub Pages deploy by hand (`pnpm pages`): builds for
    the sub-path, checks that the site resolves there, commits it to
    `gh-pages` and checks the live site; `pages.test.ts` shows the check
    failing on each kind of broken reference
- `apps/`
  - `web/`: the browser app (Svelte 5, Vite, PWA); serves the prototype at
    `/prototype.html`
    - `vite.config.ts`: the build, with the prototype and the license gate
      as plugins
    - `src/player.svelte.ts`: runs the transport on the audio clock and
      plays its events; the screen follows what is heard. Starting, playing
      and stopped, with a stop that cancels a pending start
    - `src/heard.ts`: the positions waiting to be heard, bounded
    - `src/audio/output.ts`: what the player plays on, and the Web Audio
      one
    - `src/conductor.ts`: intents (presets, sliders) into glides on the
      style track
    - `src/audio/drums.ts`: the built-in drum kit
    - `src/ticker.ts`: the scheduler's tick, from a Worker
    - `e2e/band.e2e.ts`, `playwright.config.ts`: the end-to-end checks, the
      built app in Chromium with its audio measured
    - `e2e/pages.e2e.ts`: the app and the prototype on the Pages sub-path,
      online and offline
- `.github/workflows/ci.yml`: lint, format check, typecheck, tests, e2e,
  build; started by hand while #4 is open
- `.claude/settings.json`: the session-start and pre-push hooks, and the checks agents
  may run without a prompt
  - `.claude/hooks/session-start.sh`: installs dependencies, warms
    music21 and fetches `origin/main` when an agent session starts or
    resumes
  - `.claude/hooks/verify-before-push.sh`: runs `pnpm verify` before an
    agent's `git push`, and blocks the push if it fails
- `.claude/skills/`: project skills for agents
  - [`music-theory/`](../.claude/skills/music-theory/SKILL.md): checks
    theory claims against music21 (`oracle.py`) and tonal (`tonal.mjs`), and
    compares the two (`compare.mjs`)
  - [`ratchet/`](../.claude/skills/ratchet/SKILL.md): claims in the
    Dialectica form and the moves both sides of a ratchet pair make (#41)
  - [`review-pr/`](../.claude/skills/review-pr/SKILL.md): reviews a pull
    request against the house rules; `prepare.sh` fetches it into its own
    worktree and runs `pnpm verify` there
- [`.github/pull_request_template.md`](../.github/pull_request_template.md):
  the checklist every pull request fills in
