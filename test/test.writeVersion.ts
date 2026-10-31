import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { writeVersion } from "../scripts/write-version.mjs";

const created: string[] = [];

async function makeDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "version-"));
  created.push(dir);
  return dir;
}

afterEach(async () => {
  while (created.length) {
    const dir = created.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

describe("writeVersion", () => {
  it("writes the commit and version metadata", async () => {
    const outDir = await makeDir();

    const result = await writeVersion({
      outDir,
      sha: "abc123",
      version: "1.0.0",
      builtAt: "2026-10-31T10:00:00.000Z",
    });

    expect(result).toEqual({
      sha: "abc123",
      version: "1.0.0",
      builtAt: "2026-10-31T10:00:00.000Z",
    });
    expect(JSON.parse(await readFile(path.join(outDir, "version.json"), "utf8"))).toEqual(result);
  });

  it("creates the output directory and defaults builtAt to now", async () => {
    const outDir = path.join(await makeDir(), "nested", "dist");

    const result = await writeVersion({ outDir, sha: "def456", version: "0.1.0" });

    expect(result.sha).toBe("def456");
    expect(result.builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await readFile(path.join(outDir, "version.json"), "utf8")).toContain("def456");
  });

  it("requires a commit SHA", async () => {
    const outDir = await makeDir();
    await expect(writeVersion({ outDir, sha: "", version: "1.0.0" })).rejects.toThrow(/sha/i);
  });
});
