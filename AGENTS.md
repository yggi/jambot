# AGENTS.md

House rules and core structure for anyone working on Jambot, human or agent.
Read this first, then [`docs/MEMORY.md`](docs/MEMORY.md).

## What Jambot is

A cybernetic bandleader for live maker events. Left alone, it plays an
endless, evolving jam. When people join in, it listens, takes their motifs,
bends its style toward theirs, and conducts the result. It produces **MIDI
and a score, not sound**. Hardware synths, grooveboxes or a small built-in
Web Audio synth make the sound.

## Spirit

These principles come from the prototype
([`prototype/README.md`](prototype/README.md#spirit)) and hold for all work:

- **As little hardwired as possible.** Genres are points in a continuous
  style space, not patches.
- **Nothing jumps.** A change of preset, key or slider is a transition,
  never a cut.
- **Legible all the way down.** The band plays from a human-readable score.
- **Time is absolute.** The clock never waits for rendering, the network or a
  model.
- **Honest about claims.** Every stage is measurable. Speculative threads stay
  labelled as speculative until something measures them.

## Where things are

| Path                                                   | What                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `packages/theory/`                                     | Music theory on one primitive, `even(k, n, shift)`: pure TypeScript           |
| `packages/engine/`                                     | The musical engine: pure TypeScript, no I/O                                   |
| `apps/web/`                                            | The browser app: Svelte 5, Vite, PWA                                          |
| `tooling/`                                             | Tests for the repository's own gates: lint rules and agent hooks              |
| `prototype/`                                           | The original single-file prototype and its README: a baseline for orientation |
| `docs/MEMORY.md`                                       | Persistent facts and a cheatsheet: the entry point                            |
| `docs/INDEX.md`                                        | Tree of all docs and code areas                                               |
| `docs/ROADMAP.md`                                      | Where the project is heading                                                  |
| [GitHub issues](https://github.com/yggi/jambot/issues) | The board: concrete work, bugs, blockers                                      |

## House rules

### Laws

- **The law of meaningful tests.** A gate that never fires is worse than no
  gate. Every check has a test that shows it can fail. Finite parts, such as
  every Euclid pair, every mode, or every token over every chord, are tested
  over every case, not over samples.
- **The law of true names.** A bare general word stops being a name once it
  does three jobs. `key` can be a musical key, a map key, a drum key or a
  keyboard key, so each use gets a name that says which.
- **The law of generalization.** A contraction is better than an addition or
  a special case. When something new doesn't fit, look first for the more
  general form that covers both it and what already exists. One operator,
  `even(k, n, shift)`, gives both the rhythms and the scales.
- **The law of recursion and strange loops.** As above, so below. The same
  forms recur at every level (step, bar, phrase, section, song) and in the
  loop from players to Muse to composer and back to players. A structure that
  works at one level is the first candidate at the next.

### Practice

- **Tests first.** A behaviour gets its test before its code. Tests describe
  behaviour through public functions, not internals, so they survive
  refactoring while features settle. Tests sit next to the code as
  `*.test.ts`.
- **Build and constrain in parallel.** A track that builds and a track that
  gathers constraints run side by side without waiting for each other. What
  one finds goes to the other, and a test on `main` holds it. See
  [`docs/ratchet.md`](docs/ratchet.md).
- **`pnpm verify` before pushing.** It runs everything CI runs. A fresh
  checkout needs `pnpm install --frozen-lockfile` first (seconds): install,
  never skip the tests. Claude Code sessions do this at start through
  `.claude/hooks/session-start.sh`, and `.claude/hooks/verify-before-push.sh`
  runs `pnpm verify` before each of their `git push`es and blocks one that
  fails.
- **Theory and engine stay pure.** `packages/theory` and `packages/engine`
  use no DOM, Web Audio, timers or Node APIs, and lint enforces it. All
  randomness goes through `random.ts`, keyed by seed and position.
- **The prototype is a baseline, not a source of truth.** It orients the
  port. Where one of its values helps, a test records it as a literal. What
  is true is what the tests and the design say, and a deliberate difference
  from the prototype is fine when it is noted.
- **The score language changes deliberately**: with tests, and after asking.
  It is the contract between composer, compiler, analyzer and later models.
- **Docs describe the present.** Here and in code comments, write how things
  are and why, not a history of changes. When history explains a choice, it
  belongs in the reason. Update docs in the same commit as the code they
  describe.
- **Don't speculate in docs.** If something is not known yet, leave the
  section open and say so.
- **Small commits, pull requests into `main`.** No ceremony beyond passing
  checks.

## Keeping the shared memory current

- A fact that stays true and saves the next person time goes into
  `docs/MEMORY.md`.
- A new doc or code area gets a line in `docs/INDEX.md`.
- A change of direction goes into `docs/ROADMAP.md`.
- Concrete work goes into an issue. Epics carry a checklist, labelled `epic`;
  other labels are `bug`, `infra` and `design`.
