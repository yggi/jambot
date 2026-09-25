# Jambot

A generative backing band in the browser. See `README.md` and `docs/`.

- `pnpm verify` runs everything CI runs. Run it before pushing.
- Tests first. Tests sit next to the code as `*.test.ts` and test behaviour
  through public functions.
- `packages/engine` stays pure: no DOM, Web Audio, timers or Node APIs. All
  randomness is keyed by seed and position.
- Code ported from `prototype/jambot-prototype.html` matches it. Pin
  behaviour with values recorded from the prototype, and change them only
  deliberately, saying why.
- Docs and comments describe how things are now and why, not how they
  changed. Update them in the same commit as the code.
- Keep commits small and the output lean. Avoid ceremony.
