import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { checkCorpus } from "../scripts/check-corpus.mjs";

const created: string[] = [];

async function makeFixture(files: Record<string, string>) {
  const root = await mkdtemp(path.join(tmpdir(), "corpus-check-"));
  created.push(root);
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
  }
  return root;
}

function segment(text: string, translation: string) {
  return JSON.stringify({ title: "Book", author: "Author", start: 0, end: 1, text, translation });
}

function entry(
  title: string,
  author = "Author",
  translated = true,
  extra: Record<string, unknown> = {},
) {
  return JSON.stringify({ lang: "ru", title, author, translated, ...extra });
}

afterEach(async () => {
  while (created.length) {
    const dir = created.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

describe("checkCorpus", () => {
  it("passes a valid corpus", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n${entry("Second")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n${segment("Пока", "Bye")}\n`,
      "ru/Author/Second.jsonl": `${segment("Ещё", "More")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors).toEqual([]);
    expect(result.books).toBe(2);
    expect(result.segments).toBe(3);
  });

  it("fails on a blank source card even when it carries a translation", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n${segment("\n", "orphaned text")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/blank source/i);
  });

  it("fails on a card that is blank in both source and translation", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n${segment("\n", "\n")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/blank source/i);
  });

  it("fails when a book listed in the index has no file", async () => {
    const root = await makeFixture({ "ru/index.jsonl": `${entry("Missing")}\n` });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/missing file/i);
  });

  it("fails on a book file that is not in the index", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
      "ru/Author/Orphan.jsonl": `${segment("Пока", "Bye")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/not in the index/i);
  });

  it("fails when real source text has no translation", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", " ")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/missing translation/i);
  });

  it("honours an explicit allowlist for known-empty translations", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", " ")}\n`,
    });

    const result = await checkCorpus({
      root,
      allowlist: new Set(["ru/Author/Book:1"]),
    });

    expect(result.errors).toEqual([]);
  });

  it("fails on malformed JSON", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `not json\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/invalid JSON/i);
  });

  it("fails on duplicate index entries", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book")}\n${entry("Book")}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/duplicate/i);
  });

  it("fails when an index entry is not flagged as translated", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book", "Author", false)}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/not marked translated/i);
  });

  it("fails on a numeric Vocab Level", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book", "Author", true, {
        "Word Count": 500,
        "Vocab Level": 2,
      })}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/invalid Vocab Level/i);
  });

  it("fails on an unknown Vocab Level", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book", "Author", true, {
        "Word Count": 500,
        "Vocab Level": "B3",
      })}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/invalid Vocab Level/i);
  });

  it("fails on a rated book below the analysis cutoff", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book", "Author", true, {
        "Word Count": 100,
        "Vocab Level": "C2",
      })}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/must be empty below 250 words/i);
  });

  it("accepts an unrated book below the analysis cutoff", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book", "Author", true, {
        "Word Count": 100,
        "Vocab Level": "",
      })}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors).toEqual([]);
  });

  it("accepts a rated book at the analysis cutoff", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Book", "Author", true, {
        "Word Count": 250,
        "Vocab Level": "C2",
      })}\n`,
      "ru/Author/Book.jsonl": `${segment("Привет", "Hello")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors).toEqual([]);
  });

  it("fails on a book with no source segments", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Empty", "Author", true, {
        "Word Count": 0,
        "Vocab Level": "",
      })}\n`,
      "ru/Author/Empty.jsonl": "\n",
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/no readable source segments/i);
  });

  it("fails when every source segment is blank", async () => {
    const root = await makeFixture({
      "ru/index.jsonl": `${entry("Blank", "Author", true, {
        "Word Count": 0,
        "Vocab Level": "",
      })}\n`,
      "ru/Author/Blank.jsonl": `${segment("\n", "translated")}\n`,
    });

    const result = await checkCorpus({ root });

    expect(result.errors.join("\n")).toMatch(/blank source/i);
    expect(result.errors.join("\n")).toMatch(/no readable source segments/i);
  });
});
