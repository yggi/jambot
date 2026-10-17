# Testing the engine

How a gate is shown to fire, and the checks that back the house rules.

## Testing the engine

- A gate is shown to fire by breaking the rule on purpose and watching the test fail: a threshold moved, a range widened, a tie turned.
  Every part's tests were written that way (#56, #64); a mutant that survives means a missing test, not a lucky one.
- The preset tour rarely comes near a style threshold or an extreme style.
  A threshold is tested on both sides by restyling real bars (`bass.test.ts`), and a range over a grid of styles (`lead.test.ts`, where the prototype's octave fold left the range at high energy and entropy).
- Where the prototype's function is the reference, paste it into the test and compare over every case: `pivotRoot` (`key.test.ts`), `voice` (`comp.test.ts`).
- A refactor that must not change the music: hash the band's events over a few hundred bars and seeds before and after, in a throwaway test.
- A test that swaps a global (`Math.sin`) restores it in a `finally`.
- Four house rules that only a reviewer held now have their own check (#45): a raw comparison against a draw is refused by lint, in favour of `chance`/`pick` (`no-restricted-syntax`, `tooling/lint.test.ts`); every risky `Math` call in the pure packages is named in `tooling/quantized-math.ts`'s audit, with why it's safe; and every directory of source under a package's, the app's, `tooling/`'s or `.claude/`'s own tree has a line in `docs/INDEX.md`, every doc is linked from it, and every source file opens with a header comment (`tooling/index-coverage.ts`).
  Two rules stay a reviewer's job: whether a slider drag keeps moving (already held by `style.test.ts`'s continuity tests), and prototype differences noted in `docs/prototype.md` (the `review-pr` skill's).
- A recorded fixture that a change moves on purpose (`lead.fixture.json`) is re-recorded after a diff per preset and seed, so only the presets meant to move do: #226 moved Lo-fi hip hop and Swing jazz and left six note for note.
- A port that must not change the music is gated by a hash of every bar the band writes and plays, recorded from `main` before the port and checked event for event, written and played, naming the run and the first bar that differs (#260 did this over 2,880 bars: 5 seeds, each preset held and the tour).
  The gate is deleted once the port has landed: what it held stays in each part's own test, as the literals of its 4/4 tables and `lead.fixture.json`, `history.fixture.json`.
  A test that takes the code under test as its own oracle (`snap` checking `snap`) pins nothing; find the answer by brute force instead, and show it fire by mutation.
- A test's time is the CPU's, not the clock's, and so the machine's load: three full runs on 4 cores (a load of 12 to 16) make a test of 1.5 s alone take past 5 s (#325).
  So each project whose tests take every case has a measured `testTimeout` in its `vitest.config.ts`: its slowest test alone over 5 runs, times about eight, both said in a comment above it (#325, #353): theory and engine 60 s, web (which `web-node` shares) and tooling 30 s, score and spectrum 20 s.
  Session and lobby keep Vitest's 5 s: their slowest test takes under 0.7 s alone.
  A test takes a timeout of its own only where it needs more than its project's, and a test that would is first made to do less work.
  Fake timers change nothing there, since the player's tests already drive their own clock.
- A sweep of two axes on a grid of 60ths against every style of `EVERY` is more work than a check needs: sweep the plane over the presets' styles, and show that nothing else is read over `EVERY` once (`licence.test.ts`).

## Experiments

- An experiment is a script under a package's `experiments/`, outside its pure `src/`, with its entry and E number in [`language-experiments.md`](../language-experiments.md).
- `pnpm verify` typechecks every `packages/*/experiments/*.ts`: tooling's `check` runs `tooling/tsconfig.experiments.json`, with the base config's strictness and Node's types (`tooling/experiments.test.ts`).
  Node's `--experimental-strip-types` drops types without checking them, so a stale experiment runs on without this.
- An experiment that reads two packages lives in the `experiments/` of the package whose question it answers, imports that package from `../src/` and the other by its name, and the home package lists the other in its `devDependencies`.
  E31 states the band's drums in the score's language, so it lives in `packages/score/experiments/` and reads `@jambot/engine`.
- A test name that ends in a parenthesised id, as `(U1)`, cites a catalogue entry, and the pawl then fails until that entry names the test's file ([ratchet](ratchet.md)); an experiment that only mentions an id writes it inside the name, not at its end.

## Running the checks beside agents

- Agents started with `isolation: worktree` work under `.claude/worktrees/`, which the checks leave out (#192, #199).
  Remove a finished agent's worktree once its branch is pushed: `git worktree remove --force --force <path>`, `git worktree prune`, and delete its local branch.
  The stop hook checks the shell's directory, which after inspecting an agent's worktree is that worktree: its changes are the agent's to commit, not the session's.
- Heavy checks run one at a time: two `pnpm verify` or `pnpm e2e` runs at once time out the load-sensitive tests (#199, #203).
  Wait on the machine's load (`/proc/loadavg`) or a port, never on `pgrep -f` or a loop over `/proc/*/cmdline`: both match their own command line, and a kill loop kills itself.
  The cloud container has no `ss` or `netstat`; Node checks a port anywhere, exiting 0 while it is taken: `node -e "require('net').connect(4317,'localhost').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"`.
- `pnpm e2e` refuses to start while port 4317 is taken, as by a `vite preview` left running from a manual check: find it by the port (`lsof -ti :4317` prints its PID) and stop it by that PID.
