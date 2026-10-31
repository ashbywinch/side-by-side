import { afterAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const SOURCE_FILE = /\.(ts|js|mjs|cjs|vue)$/;

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...(await filesUnder(absolute)));
    } else if (SOURCE_FILE.test(entry.name)) files.push(absolute);
  }
  return files;
}

function importsIn(source: string): string[] {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

describe("layer scanner", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "layer-scan-"));

  afterAll(() => {
    rmSync(fixture, { recursive: true, force: true });
  });

  it("scans every source extension and skips node_modules", async () => {
    writeFileSync(path.join(fixture, "keep.mjs"), "export {};\n");
    writeFileSync(path.join(fixture, "keep.ts"), "export {};\n");
    mkdirSync(path.join(fixture, "node_modules/pkg"), { recursive: true });
    writeFileSync(path.join(fixture, "node_modules/pkg/index.js"), "export {};\n");

    const found = (await filesUnder(fixture)).map((file) => path.relative(fixture, file)).sort();

    expect(found).toEqual(["keep.mjs", "keep.ts"]);
  });
});

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
