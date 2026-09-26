#!/bin/sh
# Runs `pnpm verify` before an agent's `git push`, and blocks the push if it
# fails. CI does not run while #4 is open, so this is the check that counts.
# A PreToolUse hook on Bash (see .claude/settings.json): it reads the tool
# call as JSON on stdin, and exit code 2 blocks the call and hands stderr to
# the agent. It verifies the working tree, so commit before pushing.
# JAMBOT_VERIFY replaces the check, for tooling/hooks.test.ts.
cd "$CLAUDE_PROJECT_DIR" || exit 1

# Whether any command in the line is `git … push`: split on ; & | and
# newlines, then allow leading VAR=value and git's own options.
if ! node -e '
  let input = "";
  process.stdin.on("data", (d) => (input += d)).on("end", () => {
    const command = JSON.parse(input).tool_input?.command ?? "";
    const push = /^(\w+=\S*\s+)*git(\s+(-[Cc]\s+\S+|-\S+))*\s+push(\s|$)/;
    process.exit(command.split(/[;&|\n]/).some((part) => push.test(part.trim())) ? 0 : 1);
  });
'; then
  exit 0
fi

log=$(mktemp)
if ! sh -c "${JAMBOT_VERIFY:-pnpm verify}" >"$log" 2>&1; then
  tail -40 "$log" >&2
  rm -f "$log"
  echo 'verify-before-push: pnpm verify failed, so the push was blocked. Fix it, commit, and push again.' >&2
  exit 2
fi
rm -f "$log"
exit 0
