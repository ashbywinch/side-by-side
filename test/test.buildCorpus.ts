import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildCorpus } from "../scripts/build-corpus.mjs";

const created: string[] = [];

async function makeFixture(files: Record<string, string>) {
  const root = await mkdtemp(path.join(tmpdir(), "corpus-build-"));
  created.push(root);
  const source = path.join(root, "source");
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(source, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
  }
  return { source, out: path.join(root, "out", "books") };
}

function segment(index: number, text = `text ${index}`, translation = `translation ${index}`) {
  return JSON.stringify({
    title: "Book",
    author: "Author",
    start: index * 10,
    end: index * 10 + 10,
    text,
    translation,
  });
}

function book(lines: string[]) {
  return `${lines.join("\n")}\n`;
}

function indexEntry(title: string, author = "Author") {
  return JSON.stringify({ lang: "ru", title, author, translated: true });
}

afterEach(async () => {
  while (created.length) {
    const dir = created.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

describe("buildCorpus", () => {
  it("splits a book into chunks and writes accurate metadata", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Book"),
      "ru/Author/Book.jsonl": book(Array.from({ length: 1001 }, (_, i) => segment(i))),
    });

    const stats = await buildCorpus({ source, out, config: { chunkSize: 500 } });

    expect(stats).toMatchObject({ skipped: false, books: 1, segments: 1001, chunks: 3 });
    const chunk1 = await readFile(path.join(out, "ru/Author/Book/chunk-0001.jsonl"), "utf8");
    const chunk2 = await readFile(path.join(out, "ru/Author/Book/chunk-0002.jsonl"), "utf8");
    const chunk3 = await readFile(path.join(out, "ru/Author/Book/chunk-0003.jsonl"), "utf8");
    expect(chunk1.trimEnd().split("\n")).toHaveLength(500);
    expect(chunk2.trimEnd().split("\n")).toHaveLength(500);
    expect(chunk3.trimEnd().split("\n")).toHaveLength(1);

    const meta = JSON.parse(await readFile(path.join(out, "ru/Author/Book/meta.json"), "utf8"));
    expect(meta).toMatchObject({
      lang: "ru",
      author: "Author",
      title: "Book",
      segments: 1001,
      chunkSize: 500,
      chunkCount: 3,
    });
  });

  it("rejects a blank source card instead of shipping it", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Book"),
      "ru/Author/Book.jsonl": book([
        segment(0),
        segment(1, "\n", "orphan translation that must not ship"),
      ]),
    });

    await expect(
      buildCorpus({ source, out, config: { chunkSize: 500 } }),
    ).rejects.toThrow(/blank source/i);
  });

  it("copies the language index unchanged", async () => {
    const index = `${indexEntry("Book")}\n`;
    const { source, out } = await makeFixture({
      "ru/index.jsonl": index,
      "ru/Author/Book.jsonl": book([segment(0)]),
    });

    await buildCorpus({ source, out, config: { chunkSize: 500 } });

    expect(await readFile(path.join(out, "ru/index.jsonl"), "utf8")).toBe(index);
  });

  it("removes output for books that no longer exist", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Book"),
      "ru/Author/Book.jsonl": book([segment(0)]),
      "ru/Author/Gone.jsonl": book([segment(0)]),
    });
    await buildCorpus({ source, out, config: { chunkSize: 500 } });
    expect(await readdir(path.join(out, "ru/Author"))).toContain("Gone");

    await rm(path.join(source, "ru/Author/Gone.jsonl"));
    await buildCorpus({ source, out, config: { chunkSize: 500 }, force: true });

    expect(await readdir(path.join(out, "ru/Author"))).not.toContain("Gone");
  });

  it("skips a warm rebuild but rebuilds when forced or when the source changes", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Book"),
      "ru/Author/Book.jsonl": book([segment(0)]),
    });

    const first = await buildCorpus({ source, out, config: { chunkSize: 500 } });
    const metaPath = path.join(out, "ru/Author/Book/meta.json");
    const firstMtime = (await stat(metaPath)).mtimeMs;

    const warm = await buildCorpus({ source, out, config: { chunkSize: 500 } });
    expect(first.skipped).toBe(false);
    expect(warm.skipped).toBe(true);
    expect((await stat(metaPath)).mtimeMs).toBe(firstMtime);

    const forced = await buildCorpus({ source, out, config: { chunkSize: 500 }, force: true });
    expect(forced.skipped).toBe(false);

    await writeFile(
      path.join(source, "ru/Author/Book.jsonl"),
      book([segment(0), segment(1)]),
      "utf8",
    );
    const changed = await buildCorpus({ source, out, config: { chunkSize: 500 } });
    expect(changed.skipped).toBe(false);
    expect(changed.segments).toBe(2);
  });

  it("reports malformed JSON with the file and line number", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Book"),
      "ru/Author/Book.jsonl": `${segment(0)}\nnot json\n`,
    });

    await expect(buildCorpus({ source, out, config: { chunkSize: 500 } })).rejects.toThrow(
      /Book\.jsonl:2: invalid JSON/,
    );
  });

  it("handles Cyrillic author and title names", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Двенадцать", "Александр Блок"),
      "ru/Александр Блок/Двенадцать.jsonl": book([segment(0)]),
    });

    await buildCorpus({ source, out, config: { chunkSize: 500 } });

    const meta = JSON.parse(
      await readFile(path.join(out, "ru/Александр Блок/Двенадцать/meta.json"), "utf8"),
    );
    expect(meta.author).toBe("Александр Блок");
    expect(meta.title).toBe("Двенадцать");
  });

  it("handles an empty book without writing chunk files", async () => {
    const { source, out } = await makeFixture({
      "ru/index.jsonl": indexEntry("Empty"),
      "ru/Author/Empty.jsonl": "\n\n",
    });

    const stats = await buildCorpus({ source, out, config: { chunkSize: 500 } });

    expect(stats.segments).toBe(0);
    const files = await readdir(path.join(out, "ru/Author/Empty"));
    expect(files).toEqual(["meta.json"]);
    const meta = JSON.parse(await readFile(path.join(out, "ru/Author/Empty/meta.json"), "utf8"));
    expect(meta).toMatchObject({ segments: 0, chunkCount: 0, chunkSize: 500 });
  });
});
