import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FIXTURES } from "@/pages/Dev/shelfFixtures";
import type { Book } from "@/types/bookshelf";

const root = process.cwd();

function corpusFile(book: Book): string {
  return path.join(root, "corpus", "books", book.lang, book.author, `${book.title}.jsonl`);
}

function segmentCount(book: Book): number {
  const file = corpusFile(book);
  return readFileSync(file, "utf8").trim().split("\n").length;
}

describe("shelf fixtures", () => {
  const entries = Object.values(FIXTURES).flat();
  const books = new Map(entries.map((entry) => [JSON.stringify(entry.book), entry.book]));

  it("offers the states the comparison needs", () => {
    expect(FIXTURES.none).toHaveLength(0);
    expect(FIXTURES.reading.length).toBeGreaterThan(0);
    expect(FIXTURES.reading.some((entry) => entry.finishedAt)).toBe(true);
    expect(FIXTURES.full.length).toBeGreaterThan(4);
    expect(FIXTURES.stale).toHaveLength(2);
  });

  it("is built from real corpus books with their real length", () => {
    // The `stale` fixture is deliberately a book that is not in the corpus.
    const deliberatelyMissing = "Удалённая книга";
    for (const book of books.values()) {
      if (book.title === deliberatelyMissing) continue;
      const file = corpusFile(book);
      expect(existsSync(file), `fixture book missing from the corpus: ${book.title}`).toBe(true);
      expect(segmentCount(book), `segments wrong for ${book.title}`).toBe(book.segments);
    }
  });

  it("keeps every position inside its book", () => {
    for (const entry of entries) {
      expect(entry.position).toBeGreaterThanOrEqual(0);
      expect(entry.position).toBeLessThan(Math.max(entry.book.segments, 1));
      expect(entry.revealedThrough).toBeGreaterThanOrEqual(-1);
      expect(entry.revealedThrough).toBeLessThan(entry.book.segments);
    }
  });

  it("orders deterministically", () => {
    for (const name of Object.keys(FIXTURES)) {
      const times = FIXTURES[name].map((entry) => entry.updatedAt.getTime());
      expect(new Set(times).size, `${name} has duplicate timestamps`).toBe(times.length);
    }
  });
});
