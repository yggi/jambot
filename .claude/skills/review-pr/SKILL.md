---
name: review-pr
description: Review a Jambot pull request. Fetches it into its own worktree, installs, runs `pnpm verify` there, and walks the house rules (the four laws, purity, the prototype baseline, docs) before posting one review with inline comments. Use when asked to review a PR by number or branch, or to check that a branch is ready to merge.
---

# Review a pull request

## 1. Prepare

```sh
.claude/skills/review-pr/prepare.sh <number | branch> [worktree directory]
```

It fetches the pull request and `main`, checks the head out in its own
worktree (put it in your scratchpad if you have one), runs
`pnpm install --frozen-lockfile` and `pnpm verify` there, and prints the
commits, the diff stat, the verify result with the test count, and the
commands to read the diff and to remove the worktree. Read the diff from
git, not from the GitHub files API, which returns every patch as one large
JSON blob.

CI does not run while #4 is open, so this verify run is the check that
counts. Say in the review which commit you verified and what it gave.

If the pull request touches what the app plays or when (the transport, the
time maps, the style glides, a part's events, the player, the audio or the
page; see `AGENTS.md`), also run `pnpm e2e` in the worktree, and say what
it gave. It needs Playwright's Chromium, which the session hook installs.

## 2. Read against the house rules

Read `AGENTS.md` and the pull request body first. Then, for each change:

- **Meaningful tests.** Every new check has a test that shows it can fail.
  Finite cases are tested over every case, not samples. A behaviour is
  tested through public functions.
- **True names.** No bare general word doing three jobs.
- **Generalization.** Is there a more general form that covers the new
  case and an existing one?
- **Purity.** `packages/theory` and `packages/engine` use no DOM, timers,
  clock or Node APIs, and randomness goes through `random.ts`. Lint
  enforces most of this; look for what it cannot see, such as a choice
  made with a raw `draw < p` instead of `chance`, or a `Math.pow` result
  compared without quantising.
- **Nothing jumps.** A change of style, key or preset is a transition.
  Check the value and also how it moves: a new glide that restarts from
  rest stalls a slider drag.
- **The prototype is a baseline.** A difference from it is deliberate,
  noted in `docs/prototype.md`, and pinned by a test.
- **Docs describe the present**, and `MEMORY.md`, `INDEX.md` and
  `ROADMAP.md` are updated in the same pull request.
- **Theory claims** get a second opinion from the `music-theory` skill.

Don't stop at reading: probe. Run the new functions from the worktree with
`node --experimental-strip-types --no-warnings --input-type=module -e "…"`,
and try the input that you think breaks them. A finding with a measured
number beats one without.

## 3. Post

Post one review: create a pending review, add an inline comment per
finding on the line it is about, then submit it with a summary. Use
`COMMENT` unless asked to approve or request changes. Put the substantive
findings first and mark nits as nits. End every comment with the Claude
Code footer.

Then report to the user: the verdict, the findings in order of weight, and
any friction you ran into in the workflow itself, with a concrete fix for
each.

## 4. Clean up

Run the `Done:` line that `prepare.sh` printed.
