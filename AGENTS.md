# AGENTS.md

House rules and core structure for anyone working on Jambot, human or agent.
Read this first, then [`docs/MEMORY.md`](docs/MEMORY.md).

## What Jambot is

A cybernetic bandleader for live maker events. Left alone, it plays an endless,
evolving jam. When people join in, it listens, takes their motifs, bends its
style toward theirs, and conducts the result. It produces **MIDI and a score,
not sound**. Hardware synths, grooveboxes or a small built-in Web Audio synth
make the sound.

## Spirit

These principles come from the prototype
([`prototype/README.md`](prototype/README.md#spirit)) and hold for all work:

- **As little hardwired as possible.** Genres are points in a continuous style
  space, not patches.
- **Nothing jumps.** A change of preset, key or slider is a transition, never a
  cut.
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
| `packages/score/`                                      | The score: a bar as text and back, pure TypeScript, no I/O                    |
| `packages/session/`                                    | Host and client mode: pure TypeScript, no I/O                                 |
| `packages/spectrum/`                                   | Audio frames into spectrum, peaks and pitch: pure TypeScript, no I/O          |
| `packages/analyzer/`                                   | The parser: MIDI into the step grid, pure TypeScript, no I/O                  |
| `apps/web/`                                            | The browser app: Svelte 5, Vite, PWA                                          |
| `apps/lobby/`                                          | The lobby server: sessions found by name and relayed over WebSockets          |
| `tooling/`                                             | The repository's own gates and tools: lint rules, hooks, the pawl, the deploy |
| `prototype/`                                           | The original single-file prototype and its README: a baseline for orientation |
| `docs/MEMORY.md`                                       | The cheatsheet and pointers to the topic files: the entry point               |
| `docs/memory/`                                         | Persistent facts, one file per topic, read on demand                          |
| `docs/INDEX.md`                                        | Tree of all docs and code directories                                         |
| `docs/ROADMAP.md`                                      | Where the project is heading                                                  |
| [GitHub issues](https://github.com/yggi/jambot/issues) | The board: concrete work, bugs, blockers                                      |

## House rules

### Laws

- **The law of meaningful tests.** A gate that never fires is worse than no
  gate. Every check has a test that shows it can fail. Finite parts, such as
  every Euclid pair, every mode, or every token over every chord, are tested
  over every case, not over samples.
- **The law of true names.** A bare general word stops being a name once it does
  three jobs. `key` can be a musical key, a map key, a drum key or a keyboard
  key, so each use gets a name that says which.
- **The law of generalization.** A contraction is better than an addition or a
  special case. When something new doesn't fit, look first for the more general
  form that covers both it and what already exists. One operator,
  `even(k, n, shift)`, gives both the rhythms and the scales.
- **The law of recursion and strange loops.** As above, so below. The same forms
  recur at every level (step, bar, phrase, section, song) and in the loop from
  players to Muse to composer and back to players. A structure that works at one
  level is the first candidate at the next.

### Enforced: a check says so

What these say fails a check, usually inside `pnpm verify`; the check's own test shows it firing.

- **`pnpm verify` before pushing.**
  It runs everything but the end-to-end checks (below), and it is the gate: the pull request names the commit that passed it.
  CI runs the same on a ready pull request as a witness, and a run blocked for want of Actions minutes says nothing (`docs/memory/repository-and-ci.md`).
  A checkout without `node_modules`, such as a fresh git worktree, gets `pnpm install --frozen-lockfile` from `pnpm verify` first (seconds): install, never skip the tests.
  Claude Code sessions do this at start through `.claude/hooks/session-start.sh`.
  Git's own pre-push hook, `.githooks/pre-push` (`pnpm install` points `core.hooksPath` at it), runs `pnpm verify` before every push of a branch and blocks one that fails.
  Never bypass it with `--no-verify`.
- **Theory, engine, score, session, spectrum and the analyzer stay pure.**
  `packages/theory`, `packages/engine`, `packages/score`, `packages/session`, `packages/spectrum` and `packages/analyzer` use no DOM, Web Audio, timers or Node APIs, and lint enforces it (`pureSources` in `eslint.config.js`).
  All randomness goes through `random.ts`, keyed by seed and position.
- **The shared memory's own checks** (below): every doc and directory of code in `docs/INDEX.md` and a header on every source file (`tooling/index-coverage.ts`), the boot set under 24 KB (`tooling/reading-list.ts`).
  And a risky `Math` call in a pure package is named in an audit (`tooling/quantized-math.ts`); Prettier owns whitespace, ESLint has no errors, and the packages, the app, the tooling and the experiments typecheck.

### Judgment: you do

Nothing checks these; you and the reviewer hold them.

- **Tests first.** A behaviour gets its test before its code. Tests describe
  behaviour through public functions, not internals, so they survive refactoring
  while features settle. Tests sit next to the code as `*.test.ts`.
- **Build and constrain in parallel.** A track that builds and a track that
  gathers constraints run side by side without waiting for each other. What one
  finds goes to the other, and a test on `main` holds it. See
  [`docs/ratchet.md`](docs/ratchet.md).
- **`pnpm e2e` when what the app plays, or when, changes.** The end-to-end
  checks run the built app in Chromium and measure its audio: the exact time of
  every onset, and whether the band sounds and stops. They take about 20 s and
  need a browser, so they are not part of `pnpm verify`. Run them before pushing
  a change to the transport, the time maps, the style glides, a part's events,
  the player, the audio or the page, and on a pull request that touches those. A
  fresh checkout needs `pnpm exec playwright install chromium` once; Claude Code
  sessions do it at start.
- **The prototype is a baseline, not a source of truth.** It orients the port.
  Where one of its values helps, a test records it as a literal. What is true is
  what the tests and the design say, and a deliberate difference from the
  prototype is fine when it is noted.
- **The score language changes deliberately**: with tests, and after asking.
  It is the contract between composer, compiler, analyzer and later models.
  `packages/score`'s own spelling is frozen: fixes only, no new forms, until the seam (#309) replaces it with cells, since a form grown here would be one more spelling to migrate (D5, cells decision 037).
- **Docs are written one sentence to a line.**
  Prettier keeps the line breaks (`proseWrap: "preserve"`), so a changed word
  touches one line, and two people editing one paragraph seldom conflict.
  Text already wrapped stays as it is until someone edits it.
- **Docs describe the present.** Here and in code comments, write how things are
  and why, not a history of changes. When history explains a choice, it belongs
  in the reason. Update docs in the same commit as the code they describe.
- **Don't speculate in docs.** If something is not known yet, leave the section
  open and say so.
- **Small commits, pull requests into `main`.** No ceremony beyond passing
  checks. See "Branches and merging" below.
- **Deploy after merging.** Whoever merges a pull request into `main` then runs
  `pnpm pages deploy` from `main`, so the site at
  <https://yggi.github.io/jambot/> plays what `main` holds. Nothing else deploys
  (`docs/memory/repository-and-ci.md`). The deploy refuses a commit that
  isn't on `origin/main`, runs `pnpm verify`, and checks the live site once
  Pages has published it. When the build hasn't changed, it pushes nothing and
  only checks.

### What to do with what you find

<!-- Lifted from yggi/cell-studio AGENTS.md @ 5c7c4da: the split above and this ladder, adapted. -->

Climb only as far as the change needs:

- **Just do, no comment:** a stray space, a typo, a stale one-line reference, a local rename, an added test, a check you broke.
  Fix it in the branch under review, or leave it alone: flagging it costs the author a round trip for something that costs less to fix than to describe.
  Save review comments for what needs a decision or a real change.
- **Do, and say so in the pull request:** a fix beside your change that it needs, or a deliberate difference from the prototype.
- **File an issue instead of widening the pull request:** anything out of scope you notice.
- **Stop, push back and recommend:** a change to the score language or to what the band plays beyond the issue, to the purity of the pure packages or the layering, a scope far beyond the issue, and anything irreversible or outward-facing (history on `main`, a permission, a merge nobody asked for).
  Say what you recommend on the issue, and wait for the answer.

### Branches and merging

- **Rebase before review, once.**
  While a branch is yours alone and no review has started, squash its work into coherent commits and rebase it onto `origin/main` at a handoff: before the pull request is opened, or when a change you need has landed.
  Rebase a branch with one writer only, and push it with `--force-with-lease`.
  A rebased tree is verified again by the pre-push hook, which is correct.
- **After review starts, only add commits.**
  Do not rewrite history, since the `review-pr` skill's `--from <commit>` and the review comments' anchors depend on it.
  If `main` conflicts, `git merge origin/main` once, at the end.
  The squash below drops that merge from `main`.
- **Squash into `main` by default.**
  The commit message is the pull request's title and summary, so the title reads as a commit message: present tense, what changes.
  Use GitHub's squash, never its "Update branch" button, which makes the sync merges this rule removes.
- **A merge commit is the exception.**
  Use one when a reader of `git log` needs the branch's steps, such as the parser ladder's rungs, and say why in the pull request.
  Its intermediate commits were never verified, so it gives a readable history, not a bisectable one.
  One sentence describes the change: squash. Otherwise: merge commit.
  The size of the branch does not decide it.
- The `land` skill does the merge, the deploy and the check of the live site.

## Keeping the shared memory current

- A fact that stays true and saves the next person time goes next to what it describes:
  a doc comment in the module, or a line in the module's header.
  A fact that has no module goes to `docs/memory/<topic>.md`, one file per topic, read on demand.
  `docs/MEMORY.md` keeps only the cheatsheet and a pointer to each topic file, so the boot set stays under its cap.
- A new doc or directory of code gets a line in `docs/INDEX.md`.
  A new source file gets a header comment saying what it is instead: `tooling/index-coverage.ts` checks both.
- A change of direction goes into `docs/ROADMAP.md`.
- Concrete work goes into an issue. Epics carry a checklist, labelled `epic`;
  other labels are `bug`, `infra` and `design`.
- An open question about what the score language means or how it is spelled is filed in [yggi/cells](https://github.com/yggi/cells/issues), not here (D5 on #309, cells decision 037).
- An issue meant for an agent states each bound as a number (how many bars, seeds or files, how long, how far a measure may move), or says "choose it and name it", so the agent picks one and names it in the pull request.
