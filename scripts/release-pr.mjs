/* istanbul ignore file -- CLI orchestration: git/npm/gh side effects; exercised via make release */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCli } from "./check-version.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

if (!version) fail("usage: node scripts/release-pr.mjs x.y.z");

const status = run("git", ["status", "--porcelain"]).trim();
if (status) fail("the worktree must be clean before creating a release PR");

const validation = runCli({ version, cwd: root });
if (!validation.ok) fail(validation.error);

const branch = `release/v${version}`;
try {
  run("git", ["rev-parse", "--verify", `refs/heads/${branch}`]);
  fail(`local branch ${branch} already exists`);
} catch {
  // Expected: the branch does not exist.
}

try {
  const remote = run("git", ["ls-remote", "--heads", "origin", branch]).trim();
  if (remote) fail(`remote branch ${branch} already exists`);
} catch {
  // ls-remote failure is handled by the operations below.
}

run("git", ["fetch", "origin", "main"]);
run("git", ["switch", "-c", branch, "origin/main"]);
run("npm", ["version", version, "--no-git-tag-version"]);
run("git", ["add", "package.json", "package-lock.json"]);
run("git", ["commit", "-m", `chore(release): v${version}`]);
run("git", ["push", "-u", "origin", branch]);

const body = `## Release v${version}

Version bump only: \`package.json\` and \`package-lock.json\`.

Merging this PR triggers the gated release:

1. CI builds and stages a green Worker version and smoke-tests it.
2. A maintainer approves the \`production\` deployment.
3. CI promotes atomically, smoke-tests production, and rolls back on failure.
4. CI moves the \`production\` tag and creates \`v${version}\` if it does not exist.

Do not create tags by hand.`;

const url = run("gh", [
  "pr",
  "create",
  "--base",
  "main",
  "--head",
  branch,
  "--title",
  `chore(release): v${version}`,
  "--body",
  body,
]).trim();
console.log(url);
console.log(
  "Release PR created. Ask a maintainer to review and merge it; then the gated CI run starts.",
);
