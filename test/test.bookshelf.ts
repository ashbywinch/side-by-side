import { describe, expect, it } from "vitest";

import {
  bookKey,
  emptyBookshelf,
  findEntry,
  isFinished,
  progressFraction,
  sameBook,
  visibleEntries,
} from "@/components/Bookshelf/bookshelf";
import type { BookshelfEntry } from "@/types/bookshelf";

function entry(overrides: Partial<BookshelfEntry> = {}): BookshelfEntry {
  return {
    book: { lang: "ru", author: "Блок", title: "Двенадцать", segments: 100 },
    position: 0,
    furthest: 0,
    revealedThrough: -1,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("bookshelf", () => {
  it("gives equal books the same key and different books different keys", () => {
    expect(bookKey(entry().book)).toBe(bookKey({ ...entry().book }));
    expect(bookKey(entry().book)).not.toBe(
      bookKey({ ...entry().book, title: "Другой" }),
    );
    expect(sameBook(entry().book, { ...entry().book })).toBe(true);
    expect(sameBook(entry().book, { ...entry().book, lang: "en" })).toBe(false);
  });

  it("starts empty", () => {
    expect(emptyBookshelf()).toEqual({ version: 1, entries: [] });
  });

  it("finds an entry by book identity, not by object identity", () => {
    const found = findEntry([entry()], { ...entry().book });
    expect(found).toBeDefined();
    expect(findEntry([entry()], { ...entry().book, author: "Чехов" })).toBeUndefined();
  });

  it("hides removed entries and orders the rest by most recent", () => {
    const older = entry({ updatedAt: new Date("2026-01-01T00:00:00.000Z") });
    const newer = entry({
      book: { ...entry().book, title: "Новее" },
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    });
    const gone = entry({
      book: { ...entry().book, title: "Удалено" },
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      removedAt: new Date("2026-03-02T00:00:00.000Z"),
    });

    expect(visibleEntries([older, gone, newer]).map((e) => e.book.title)).toEqual([
      "Новее",
      "Двенадцать",
    ]);
  });

  it("breaks ties deterministically", () => {
    const a = entry({ book: { ...entry().book, title: "А" } });
    const b = entry({ book: { ...entry().book, title: "Б" } });
    expect(visibleEntries([b, a]).map((e) => e.book.title)).toEqual(["А", "Б"]);
  });

  it("reports finished only from the stored finish event", () => {
    expect(isFinished(entry({ revealedThrough: 99 }))).toBe(false);
    expect(
      isFinished(entry({ revealedThrough: 99, finishedAt: new Date() })),
    ).toBe(true);
  });

  it("measures progress by position over length, and full when finished", () => {
    expect(progressFraction(entry({ position: 0, book: { ...entry().book, segments: 100 } }))).toBe(0.01);
    expect(progressFraction(entry({ position: 49, book: { ...entry().book, segments: 100 } }))).toBe(0.5);
    expect(progressFraction(entry({ position: 0, book: { ...entry().book, segments: 0 } }))).toBe(0);
    expect(progressFraction(entry({ position: 999 }))).toBe(1);
    expect(
      progressFraction(
        entry({ position: 10, finishedAt: new Date("2026-01-02T00:00:00.000Z") }),
      ),
    ).toBe(1);
  });

  // "How far did I get" is not "where am I looking": scrolling back to the
  // start to re-read must not make the book look untouched.
  it("keeps progress at the furthest point reached", () => {
    const book = { ...entry().book, segments: 100 };
    expect(progressFraction(entry({ position: 60, furthest: 60, book }))).toBe(0.61);
    expect(progressFraction(entry({ position: 2, furthest: 60, book }))).toBe(0.61);
    expect(progressFraction(entry({ position: 2, furthest: 2, book }))).toBe(0.03);
  });
});
