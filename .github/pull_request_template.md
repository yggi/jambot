## What and why

<!-- What changes, and the reason. Say it in the present tense; the diff is the history. -->

## Issues

<!-- Closes #…, Part of #…, or "none". -->

## Checks

- [ ] `pnpm verify` passes at the head commit: <!-- short SHA, test count -->
      (CI runs only by hand while #4 is open; agents' pushes run it through
      `.claude/hooks/verify-before-push.sh`)
- [ ] New behaviour has its test, written against public functions, and a
      new check has a test that shows it firing
- [ ] `packages/theory` and `packages/engine` stay pure. Lint refuses the
      DOM, Web Audio, timers, the clock, Node APIs and `Math.random`; by
      eye, a random choice goes through `random.ts` (#45)
- [ ] Differences from the prototype are deliberate and noted below
- [ ] The score language is unchanged, or the change was asked about first
      (link) and has tests
- [ ] Docs describe the present and are updated in this PR: `docs/MEMORY.md`
      for lasting facts, `docs/INDEX.md` for new docs or code areas,
      `docs/ROADMAP.md` for a change of direction; prose wraps at 80
      columns (#45)

## Notes for review

<!-- Anything measured, anything left open, anything the reviewer should try. -->
