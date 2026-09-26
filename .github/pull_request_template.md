## What and why

<!-- What changes, and the reason. Say it in the present tense; the diff is the history. -->

## Issues

<!-- Closes #…, Part of #…, or "none". -->

## Checks

- [ ] `pnpm verify` passes locally (CI does not run while #4 is open)
- [ ] New behaviour has its test, written against public functions
- [ ] `packages/theory` and `packages/engine` stay pure: no DOM, Web Audio,
      timers or Node APIs; randomness goes through `random.ts`
- [ ] Differences from the prototype are deliberate and noted below
- [ ] The score language is unchanged, or the change was asked about first
      (link) and has tests
- [ ] Docs describe the present and are updated in this PR: `docs/MEMORY.md`
      for lasting facts, `docs/INDEX.md` for new docs or code areas,
      `docs/ROADMAP.md` for a change of direction

## Notes for review

<!-- Anything measured, anything left open, anything the reviewer should try. -->
