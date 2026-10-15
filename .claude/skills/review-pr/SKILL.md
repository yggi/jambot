---
name: review-pr
description: Review a Jambot pull request. Fetches it into its own worktree, installs, runs
  `pnpm verify` there, and walks the house rules (the four laws, purity, the
  prototype baseline, docs) before posting one review with inline comments. Use
  when asked to review a PR by number or branch, or to check that a branch is
  ready to merge.
---

# Review a pull request

## 1. Prepare

```sh
.claude/skills/review-pr/prepare.sh <number | branch> [--from <commit>] [--against <number | branch>] [worktree directory]
```

If your checkout doesn't have the script, your branch is behind `main`; run
`main`'s copy instead:

```sh
git fetch -q origin main
git show origin/main:.claude/skills/review-pr/prepare.sh | sh -s -- <number | branch> …
```

It fetches the pull request and `main`, checks the head out in its own worktree
(put it in your scratchpad if you have one), runs
`pnpm install --frozen-lockfile` and `pnpm verify` there, and prints:

- the commits and every changed file;
- the verify result with its test count and, when the repository has end-to-end
  tests, the result of `pnpm e2e` with theirs;
- when `main` has moved on since the pull request branched, how far, and the
  files a merge would conflict in: say so in the review;
- with `--against`, the files the pull request conflicts in with another one:
  say so in both reviews;
- when a check fails, vitest's block of failed tests, or the end of the output
  where there is none;
- the commands to read the diff, to probe the engine and the theory, and to
  remove the worktree.

To review several pull requests, start them all: each one waits for the one
before, which says so on stderr. Run in parallel, the load times out
timing-sensitive tests, the end-to-end runs share port 4317, so one could test
the other's build, and a fetch fails on a worktree another review is still
adding.

To review part of a pull request, such as the steps after an earlier review,
pass `--from <commit>`. The commits and the diff are then what the pull request
did after `<commit>`, without what came in from `main` since, while verify still
runs on the whole head. When `<commit>` doesn't merge with `main` cleanly, the
diff is limited to the files those commits touched, and the summary names the
files where `main`'s changes may still show.

Read the diff from git, not from the GitHub files API, which returns every patch
as one large JSON blob.

CI is a witness, and may be blocked (`docs/memory/repository-and-ci.md`), so this verify run is the check that counts. Say
in the review which commit you verified and what verify and `pnpm e2e` gave. The
end-to-end run needs Playwright's Chromium, which the session hook installs;
without it, `pnpm e2e` fails, and a pull request that touches what the app plays
or when (see `AGENTS.md`) is then not verified.

## 2. Read against the house rules

Read `AGENTS.md` and the pull request body first. Then, for each change:

- **Meaningful tests.** Every new check has a test that shows it can fail.
  Finite cases are tested over every case, not samples. A behaviour is tested
  through public functions.
- **True names.** No bare general word doing three jobs.
- **Generalization.** Is there a more general form that covers the new case and
  an existing one?
- **Purity.** The pure packages (`AGENTS.md` names them) use no DOM, timers,
  clock or Node APIs, and randomness goes through `random.ts`. Lint enforces most of
  this; look for what it cannot see, such as a choice made with a raw `draw < p`
  instead of `chance`, or a `Math.pow` result compared without quantising.
- **Nothing jumps.** A change of style, key or preset is a transition. Check the
  value and also how it moves: a new glide that restarts from rest stalls a
  slider drag.
- **The prototype is a baseline.** A difference from it is deliberate, noted in
  `docs/prototype.md`, and pinned by a test.
- **Docs describe the present**, and `MEMORY.md`, `docs/memory/`, `INDEX.md` and `ROADMAP.md`
  are updated in the same pull request.
- **Theory claims** get a second opinion from the `music-theory` skill.

Don't stop at reading: probe. Run the new functions with the `Probe:` line
`prepare.sh` printed, and try the input that you think breaks them. It runs from
the worktree's `packages/engine`, since bare `@jambot/*` imports resolve only
inside a package, and starts with an `env` the transport runs over
(`bandEnvAt(env, bar, null)` gives the band's), which a test runs against the
engine. For the app, the `Probe the app:` line runs from `apps/web` the same
way: it imports `./src/*.ts` and the engine alike, with `hudOf` and the bars the
band decides already in hand, so a probe of the view model needs no test file.
Only a `.svelte` or `.svelte.ts` module needs vitest; there, compare in an
assertion, since vitest's reporter can swallow a passing test's `console.log`.
A longer probe goes in a file, removed after. A finding with a measured number
beats one without.

## 3. Post

Post one review: create a pending review, add an inline comment per finding on
the line it is about, then submit it with a summary. Use `COMMENT` unless asked
to approve or request changes. Put the substantive findings first.

Trivial nits (a stray space, a typo, a stale one-line reference) don't get a
review comment at all: fix them directly in the worktree and let them ride the
merge, or leave them alone if you can't push to the branch. A comment for one of
these costs the author a round trip for less than the fix itself would have cost
(AGENTS.md, the ladder's first rung, "Just do, no comment"). Reserve inline comments for
findings that need a decision or a real change.

End every comment with the Claude Code footer.

Then report to the user: the verdict, the findings in order of weight, and any
friction you ran into in the workflow itself, with a concrete fix for each.

## 4. Clean up

Run the `Done:` line that `prepare.sh` printed.
