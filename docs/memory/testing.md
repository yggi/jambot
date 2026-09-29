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
