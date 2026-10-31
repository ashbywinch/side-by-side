import { describe, expect, it } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (/\.(ts|js|vue)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

function importsIn(source: string): string[] {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

describe("architecture layers", () => {
  it("components do not import pages or the router", async () => {
    const violations: string[] = [];
    for (const file of await filesUnder(path.join(root, "src/components"))) {
      for (const specifier of importsIn(await readFile(file, "utf8"))) {
        if (specifier.startsWith("@/pages") || specifier.includes("../pages")) {
          violations.push(`${path.relative(root, file)} imports ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("build scripts stay independent of the app", async () => {
    const violations: string[] = [];
    for (const file of await filesUnder(path.join(root, "scripts"))) {
      for (const specifier of importsIn(await readFile(file, "utf8"))) {
        if (specifier.startsWith("@/") || specifier.startsWith("../src")) {
          violations.push(`${path.relative(root, file)} imports ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
