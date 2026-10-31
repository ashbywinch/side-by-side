import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { defaultRun, main, openReleasePr, releaseBody, releaseBranch } from "../scripts/release-pr.mjs";

type RunOptions = { cwd?: string };
type Run = (command: string, args: string[], options?: RunOptions) => string;

/**
 * Records every command and answers with the first matching rule. A rule that
 * throws simulates a non-zero exit.
 */
function fakeRun(rules: Record<string, () => string> = {}) {
  const calls: string[] = [];
  const run: Run = (command, args) => {
    const call = [command, ...args].join(" ");
    calls.push(call);
    for (const [prefix, answer] of Object.entries(rules)) {
      if (call === prefix || call.startsWith(`${prefix} `)) return answer();
    }
    return "";
  };
  return { run, calls };
}

function notFound(): string {
  throw new Error("exit 1");
}

const validVersion = () => ({ ok: true, message: "ok" });

describe("release PR planning", () => {
  it("builds the branch name and body from the version", () => {
    expect(releaseBranch("1.2.3")).toBe("release/v1.2.3");
    const body = releaseBody("1.2.3");
    expect(body).toContain("## Release v1.2.3");
    expect(body).toContain("creates `v1.2.3`");
    expect(body).toContain("Do not create tags by hand.");
  });

  it("refuses a missing version without running a single command", () => {
    const { run, calls } = fakeRun();
    expect(openReleasePr({ version: undefined, run, validate: validVersion })).toEqual({
      ok: false,
      error: "usage: node scripts/release-pr.mjs x.y.z",
    });
    expect(calls).toEqual([]);
  });

  it("refuses a dirty worktree", () => {
    const { run } = fakeRun({ "git status --porcelain": () => " M package.json" });
    expect(openReleasePr({ version: "1.0.1", run, validate: validVersion })).toEqual({
      ok: false,
      error: "the worktree must be clean before creating a release PR",
    });
  });

  it("returns the version validation error before touching git history", () => {
    const { run, calls } = fakeRun();
    const result = openReleasePr({
      version: "1.0.0",
      run,
      validate: () => ({ ok: false, error: "Version 1.0.0 must be greater than current 1.0.0" }),
    });
    expect(result).toEqual({ ok: false, error: "Version 1.0.0 must be greater than current 1.0.0" });
    expect(calls).toEqual(["git status --porcelain"]);
  });

  it("refuses a local branch that already exists", () => {
    const { run, calls } = fakeRun({
      "git rev-parse --verify refs/heads/release/v1.0.1": () => "abc123",
    });
    expect(openReleasePr({ version: "1.0.1", run, validate: validVersion })).toEqual({
      ok: false,
      error: "local branch release/v1.0.1 already exists",
    });
    expect(calls).not.toContain("git push -u origin release/v1.0.1");
    expect(calls.some((call) => call.startsWith("git switch"))).toBe(false);
  });

  it("refuses a remote branch that already exists", () => {
    const { run } = fakeRun({
      "git rev-parse --verify refs/heads/release/v1.0.1": notFound,
      "git ls-remote --heads origin release/v1.0.1": () => "abc123\trefs/heads/release/v1.0.1",
    });
    expect(openReleasePr({ version: "1.0.1", run, validate: validVersion })).toEqual({
      ok: false,
      error: "remote branch release/v1.0.1 already exists",
    });
  });

  it("keeps going when ls-remote itself fails", () => {
    const { run } = fakeRun({
      "git ls-remote --heads origin release/v1.0.1": notFound,
      "git rev-parse --verify refs/heads/release/v1.0.1": notFound,
      "gh pr create": () => "https://github.com/ashbywinch/side-by-side/pull/7\n",
    });
    expect(openReleasePr({ version: "1.0.1", run, validate: validVersion })).toEqual({
      ok: true,
      branch: "release/v1.0.1",
      url: "https://github.com/ashbywinch/side-by-side/pull/7",
    });
  });

  it("creates the branch, bumps, commits, pushes and opens the PR in order", () => {
    const { run, calls } = fakeRun({
      "git rev-parse --verify refs/heads/release/v1.0.1": notFound,
      "gh pr create": () => "https://github.com/ashbywinch/side-by-side/pull/7\n",
    });

    const result = openReleasePr({ version: "1.0.1", run, validate: validVersion });

    expect(result).toEqual({
      ok: true,
      branch: "release/v1.0.1",
      url: "https://github.com/ashbywinch/side-by-side/pull/7",
    });
    expect(calls.slice(0, 9)).toEqual([
      "git status --porcelain",
      "git rev-parse --verify refs/heads/release/v1.0.1",
      "git ls-remote --heads origin release/v1.0.1",
      "git fetch origin main",
      "git switch -c release/v1.0.1 origin/main",
      "npm version 1.0.1 --no-git-tag-version",
      "git add package.json package-lock.json",
      "git commit -m chore(release): v1.0.1",
      "git push -u origin release/v1.0.1",
    ]);
    expect(calls[9]).toBe(
      "gh pr create --base main --head release/v1.0.1 --title chore(release): v1.0.1 --body " +
        releaseBody("1.0.1"),
    );
  });
});

describe("release PR CLI", () => {
  let cwd: string;

  beforeAll(() => {
    cwd = mkdtempSync(path.join(tmpdir(), "release-pr-"));
    writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
    );
    const git = (...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
    git("init", "-q");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");
    git("add", "package.json");
    git("commit", "-qm", "init");
    git("tag", "v1.0.0");
  });

  afterAll(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it("executes a command in the given directory and returns its stdout", () => {
    expect(defaultRun("git", ["rev-parse", "--is-inside-work-tree"], { cwd })).toBe("true\n");
  });

  it("uses the real version checker by default", () => {
    const { run } = fakeRun({
      "git rev-parse --verify refs/heads/release/v1.0.1": notFound,
      "gh pr create": () => "https://example.test/pull/1\n",
    });

    expect(openReleasePr({ version: "1.0.1", cwd, run })).toEqual({
      ok: true,
      branch: "release/v1.0.1",
      url: "https://example.test/pull/1",
    });
    expect(openReleasePr({ version: "1.0.0", cwd, run })).toEqual({
      ok: false,
      error: "Version 1.0.0 must be greater than current 1.0.0",
    });
    expect(openReleasePr({ version: "1.1", cwd, run })).toEqual({
      ok: false,
      error: 'Version must be strict semver x.y.z, got "1.1"',
    });
  });

  it("prints the PR URL and returns 0 on success", () => {
    const lines: string[] = [];
    const errors: string[] = [];
    const { run } = fakeRun({
      "git rev-parse --verify refs/heads/release/v1.0.1": notFound,
      "gh pr create": () => "https://example.test/pull/1\n",
    });

    const code = main({
      version: "1.0.1",
      cwd,
      run,
      log: (line: string) => lines.push(line),
      error: (line: string) => errors.push(line),
    });

    expect(code).toBe(0);
    expect(lines[0]).toBe("https://example.test/pull/1");
    expect(lines[1]).toMatch(/Ask a maintainer to review and merge it/);
    expect(errors).toEqual([]);
  });

  it("reports the error and returns 1 on failure", () => {
    const lines: string[] = [];
    const errors: string[] = [];

    const code = main({
      version: undefined,
      run: fakeRun().run,
      log: (line: string) => lines.push(line),
      error: (line: string) => errors.push(line),
    });

    expect(code).toBe(1);
    expect(errors).toEqual(["::error::usage: node scripts/release-pr.mjs x.y.z"]);
    expect(lines).toEqual([]);
  });
});
