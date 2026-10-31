import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  compareVersions,
  parseVersion,
  runCli,
  validateReleaseVersion,
} from "../scripts/check-version.mjs";

describe("release version validation", () => {
  it("parses strict semver", () => {
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("v1.2.3")).toBeNull();
    expect(parseVersion("1.2")).toBeNull();
    expect(parseVersion("1.2.3-beta")).toBeNull();
  });

  it("compares patch, minor and major versions", () => {
    expect(compareVersions("1.0.1", "1.0.0")).toBeGreaterThan(0);
    expect(compareVersions("1.1.0", "1.0.9")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("0.9.9", "1.0.0")).toBeLessThan(0);
  });

  it("accepts a greater patch, minor or major version", () => {
    for (const version of ["1.0.1", "1.1.0", "2.0.0"]) {
      expect(
        validateReleaseVersion({ version, current: "1.0.0", tags: ["v1.0.0"] }),
      ).toBeNull();
    }
  });

  it("rejects invalid, equal, lower and already-tagged versions", () => {
    expect(
      validateReleaseVersion({ version: "1.1", current: "1.0.0", tags: [] }),
    ).toMatch(/semver/i);
    expect(
      validateReleaseVersion({ version: "1.0.0", current: "1.0.0", tags: [] }),
    ).toMatch(/greater/i);
    expect(
      validateReleaseVersion({ version: "0.9.0", current: "1.0.0", tags: [] }),
    ).toMatch(/greater/i);
    expect(
      validateReleaseVersion({ version: "1.1.0", current: "1.0.0", tags: ["v1.1.0"] }),
    ).toMatch(/already exists/i);
  });
});


describe("release version CLI", () => {
  let cwd: string;
  const script = path.resolve(process.cwd(), "scripts/check-version.mjs");

  beforeAll(() => {
    cwd = mkdtempSync(path.join(tmpdir(), "release-version-"));
    writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
    );
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd, encoding: "utf8" });
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

  function run(version: string) {
    return spawnSync(process.execPath, [script, version], {
      cwd,
      encoding: "utf8",
    });
  }

  it("accepts a greater version", () => {
    const result = run("1.0.1");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("1.0.1 is valid");
  });

  it("runs the in-process check against the fixture", () => {
    expect(runCli({ version: "1.0.1", cwd })).toMatchObject({ ok: true });
    expect(runCli({ version: "1.0.0", cwd })).toMatchObject({ ok: false });
  });

  it("reports an unreadable package.json and an invalid current version", () => {
    const empty = mkdtempSync(path.join(tmpdir(), "release-version-empty-"));
    try {
      expect(runCli({ version: "1.0.1", cwd: empty })).toMatchObject({ ok: false });
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
    expect(
      validateReleaseVersion({ version: "1.0.1", current: "1.0" }),
    ).toMatch(/current/i);
    expect(() => compareVersions("1.0", "1.0.0")).toThrow(/semver/i);
  });

  it("rejects equal, lower, invalid and tagged versions", () => {
    expect(run("1.0.0").status).toBe(1);
    expect(run("0.9.0").status).toBe(1);
    expect(run("1.1").status).toBe(1);

    execFileSync("git", ["tag", "v1.1.0"], { cwd });
    const tagged = run("1.1.0");
    expect(tagged.status).toBe(1);
    expect(tagged.stderr).toMatch(/already exists/i);
  });
});
