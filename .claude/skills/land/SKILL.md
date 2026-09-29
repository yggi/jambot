---
name: land
description: Land a Jambot pull request that has been reviewed and approved. Verifies, merges into main, runs the deploy and checks the live site. Use when asked to merge a pull request, or after a merge that has not been deployed yet.
---

# Land a pull request

Whoever merges into `main` deploys it (`AGENTS.md`, "Deploy after merging").
Do the steps in order and stop at the first that fails.

1. **The pull request is ready.**
   Its head passes `pnpm verify`, and `pnpm e2e` if it touches what the app plays or when.
   The PR's checks section says at which commit.
   Conflicts with `main` are resolved and pushed.
2. **Merge it.**
   Squash by default, with the pull request's title and summary as the message; a merge commit only where `AGENTS.md`, "Branches and merging", allows it and the pull request says why.
   Use GitHub's merge, never "Update branch".
3. **Update `main`.**
   `git fetch origin main && git checkout main && git merge --ff-only origin/main`.
4. **Deploy.**
   `pnpm pages deploy` from `main`.
   It refuses a commit that is not on `origin/main`, runs `pnpm verify`, pushes `gh-pages` if the build changed, and checks the live site at <https://yggi.github.io/jambot/> once Pages serves it.
5. **Say so.**
   Tick "After merging" in the pull request, with what the deploy printed.
   Close the issues it closes if GitHub did not.

If the deploy fails, the merge stands: fix forward on a new branch, and say that `main` and the site differ.
