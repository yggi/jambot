## What and why

<!-- What changes, and the reason. Say it in the present tense; the diff is the history. -->

## Issues

<!-- Closes #…, Part of #…, or "none". -->

## Findings

<!--
What this change found that a catalogue (#7's docs/language-*.md, #39)
doesn't hold yet: a law it needed, a limit it hit, a baseline claim that
was false. Or "none". The ratchet skill gives the form.
-->

**What could this dissolve?** <!-- A rule, a special case or a source of truth
this change makes unnecessary or could contract into one form (the law of
generalization), or "nothing seen". -->

## Checks

Lint, the wrap of prose, the purity of the pure packages and the index of docs
are checked by `pnpm verify`; tick only what nothing checks for you.

- [ ] `pnpm verify` passes at the head commit: <!-- short SHA, test count -->
      (the gate: `.githooks/pre-push` runs it before a push; CI is a witness, and a run blocked
      for minutes says nothing, see `docs/memory/repository-and-ci.md`)
- [ ] `pnpm e2e` passes, if the change touches what the app plays or when
      (`AGENTS.md`): <!-- short SHA, or "not needed" and why -->
- [ ] New behaviour has its test, written against public functions, and a new
      check has a test that shows it firing
- [ ] A random choice in the pure packages goes through `random.ts`
- [ ] Differences from the prototype are deliberate and noted below
- [ ] The score language is unchanged, or the change was asked about first
      (link) and has tests
- [ ] Docs describe the present and are updated in this PR: the cheatsheet in `docs/MEMORY.md` and topic facts in
      `docs/memory/`, next to the code they describe where they fit; `docs/ROADMAP.md` for a change of direction

## After merging

- [ ] `pnpm pages deploy` run from `main` and the live site checked, or "not
      needed" and why (`AGENTS.md`, "Deploy after merging")
- [ ] Conflicts with other open pull requests:
      <!-- numbers and files, or "none" -->

## Notes for review

<!-- Anything measured, anything left open, anything the reviewer should try. -->
