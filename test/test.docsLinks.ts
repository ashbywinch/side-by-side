import { beforeAll, describe, expect, it } from "vitest";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
let documents: string[] = [];

async function listMarkdown(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listMarkdown(absolute)));
    else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(root, absolute));
    }
  }
  return files;
}

function linksIn(markdown: string): string[] {
  const links: string[] = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of markdown.matchAll(pattern)) {
    const target = match[1].trim();
    if (
      target.includes("://") ||
      target.startsWith("#") ||
      target.startsWith("mailto:") ||
      target.includes("{{")
    ) {
      continue;
    }
    links.push(target.split("#")[0]);
  }
  return links;
}

async function exists(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isFile() || (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

beforeAll(async () => {
  documents = ["AGENTS.md", ...(await listMarkdown(path.join(root, "docs")))];
});

describe("documentation links", () => {
  it("every relative markdown link resolves", async () => {
    const broken: string[] = [];
    for (const doc of documents) {
      const absolute = path.join(root, doc);
      const markdown = await readFile(absolute, "utf8");
      for (const link of linksIn(markdown)) {
        const target = path.resolve(path.dirname(absolute), link);
        if (!target.startsWith(root)) {
          broken.push(`${doc}: ${link} escapes the repo`);
        } else if (!(await exists(target))) {
          broken.push(`${doc}: ${link} does not exist`);
        }
      }
    }
    expect(broken).toEqual([]);
  });
});
