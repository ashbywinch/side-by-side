import { describe, expect, it } from "vitest";

import {
  compareVersions,
  parseVersion,
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
