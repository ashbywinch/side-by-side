import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runCli } from "./check-version.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const USAGE = "usage: node scripts/release-pr.mjs x.y.z";

export function defaultRun(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function gitRefExists(run, args, cwd) {
  try {
    run("git", args, { cwd });
    return true;
  } catch {
    // A non-zero exit is the expected "does not exist" answer.
    return false;
  }
}

function remoteBranchExists(run, branch, cwd) {
  try {
    return run("git", ["ls-remote", "--heads", "origin", branch], { cwd }).trim() !== "";
  } catch {
    // A failed ls-remote is not proof the branch exists; the push below reports
    // the real error if it does.
    return false;
  }
}

export function releaseBranch(version) {
  return `release/v${version}`;
}

export function releaseBody(version) {
  return `## Release v${version}

Version bump only: \`package.json\` and \`package-lock.json\`.

Merging this PR triggers the gated release:

1. CI builds and stages a green Worker version and smoke-tests it.
2. A maintainer approves the \`production\` deployment.
3. CI promotes atomically, smoke-tests production, and rolls back on failure.
4. CI moves the \`production\` tag and creates \`v${version}\` if it does not exist.

Do not create tags by hand.`;
}

/**
 * Validates the version, then creates the bump branch, commits it, pushes it
 * and opens the release PR. Returns `{ ok, branch, url }` or `{ ok: false,
 * error }`; nothing is mutated unless every check passes.
 *
 * `run` and `validate` are injected so the checks and the command sequence can
 * be exercised without touching a repository.
 */
export function openReleasePr({ version, cwd = process.cwd(), run = defaultRun, validate = runCli } = {}) {
  if (!version) return { ok: false, error: USAGE };

  if (run("git", ["status", "--porcelain"], { cwd }).trim()) {
    return { ok: false, error: "the worktree must be clean before creating a release PR" };
  }

  const validation = validate({ version, cwd });
  if (!validation.ok) return { ok: false, error: validation.error };

  const branch = releaseBranch(version);
  if (gitRefExists(run, ["rev-parse", "--verify", `refs/heads/${branch}`], cwd)) {
    return { ok: false, error: `local branch ${branch} already exists` };
  }
  if (remoteBranchExists(run, branch, cwd)) {
    return { ok: false, error: `remote branch ${branch} already exists` };
  }

  const options = { cwd };
  run("git", ["fetch", "origin", "main"], options);
  run("git", ["switch", "-c", branch, "origin/main"], options);
  run("npm", ["version", version, "--no-git-tag-version"], options);
  run("git", ["add", "package.json", "package-lock.json"], options);
  run("git", ["commit", "-m", `chore(release): v${version}`], options);
  run("git", ["push", "-u", "origin", branch], options);
  const url = run(
    "gh",
    [
      "pr",
      "create",
      "--base",
      "main",
      "--head",
      branch,
      "--title",
      `chore(release): v${version}`,
      "--body",
      releaseBody(version),
    ],
    options,
  ).trim();

  return { ok: true, branch, url };
}

/** Prints one line per outcome and returns the process exit code. */
export function main({
  version,
  cwd = process.cwd(),
  run = defaultRun,
  validate = runCli,
  log = console.log,
  error = console.error,
} = {}) {
  const result = openReleasePr({ version, cwd, run, validate });
  if (!result.ok) {
    error(`::error::${result.error}`);
    return 1;
  }
  log(result.url);
  log("Release PR created. Ask a maintainer to review and merge it; then the gated CI run starts.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main({ version: process.argv[2], cwd: root });
}
