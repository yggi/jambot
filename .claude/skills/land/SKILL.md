---
name: land
description: Land a Jambot pull request that has been reviewed and approved. Verifies, merges into main, puts its issues right, runs the deploy and checks the live site. Use when asked to merge a pull request, or after a merge that has not been deployed yet.
---

# Land a pull request

Whoever merges into `main` deploys it (`AGENTS.md`, "Deploy after merging").
Do the steps in order and stop at the first that fails.

1. **The pull request is ready.**
   Its head passes `pnpm verify`, and `pnpm e2e` if it touches what the app plays or when.
   The PR's _Verified_ section says at which commit.
   Conflicts with `main` are resolved and pushed.
2. **Merge it.**
   Squash by default, with the pull request's title and summary as the message; a merge commit only where `AGENTS.md`, "Branches and merging", allows it and the pull request says why.
   Use GitHub's merge, never "Update branch".
3. **Update `main`.**
   `git fetch origin main && git checkout main && git merge --ff-only origin/main`.
4. **Put its issues right.**
   Through the REST API (`gh api repos/yggi/<repo>/issues/<n>`; GraphQL may be refused), and each comment ends with the footer the session gives.
   1. **Closed as said:** every `Closes #n` in the merged pull request closed its issue.
      One that didn't (a reference to another repository, a typo) is closed by hand with a comment naming the pull request.
   2. **Ticked:** a `Part of #n` epic's checklist line for this pull request is ticked (`- [x] … (#PR)`).
      If the epic has no line for it, it gets one comment naming what landed.
   3. **Follow-ups filed:** each line of the pull request's _Not done / follow-ups_ that names work becomes an issue, or is linked to the one that already holds it, in the repository where it belongs: a question about what the score language means or how it is spelled in yggi/cells.
   4. **References right:** an issue or pull request in another repository that the merged pull request names by a bare number is written `yggi/<repo>#n`, in its body and in the issues it closed or ticked.
5. **Deploy.**
   `pnpm pages deploy` from `main`.
   It refuses a commit that is not on `origin/main`, runs `pnpm verify`, pushes `gh-pages` if the build changed, and checks the live site at <https://yggi.github.io/jambot/> once Pages serves it.
6. **Say so.**
   A comment on the pull request with what the deploy printed, and what step 4 closed, ticked and filed.

If the deploy fails, the merge stands: fix forward on a new branch, and say that `main` and the site differ.
