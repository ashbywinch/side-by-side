import { beforeEach, describe, expect, it } from "vitest";

import {
  loadBookshelf,
  saveBookshelf,
  STORAGE_KEY,
} from "@/components/Bookshelf/bookshelfStorage";
import type { Bookshelf, BookshelfEntry } from "@/types/bookshelf";

function entry(overrides: Partial<BookshelfEntry> = {}): BookshelfEntry {
  return {
    book: { lang: "ru", author: "Блок", title: "Двенадцать", segments: 100 },
    position: 12,
    revealedThrough: 20,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function shelf(entries: BookshelfEntry[] = [entry()]): Bookshelf {
  return { version: 1, entries };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("bookshelf storage", () => {
  it("starts empty when nothing is stored", () => {
    expect(loadBookshelf(window.localStorage)).toEqual({ shelf: shelf([]), canWrite: true });
  });

  it("starts empty and stays writable when storage is unavailable", () => {
    expect(loadBookshelf(null)).toEqual({ shelf: shelf([]), canWrite: true });
  });

  it("round-trips entries with real dates", () => {
    saveBookshelf(window.localStorage, shelf());

    const loaded = loadBookshelf(window.localStorage);
    expect(loaded.canWrite).toBe(true);
    expect(loaded.shelf).toEqual(shelf());
    expect(loaded.shelf.entries[0].updatedAt).toBeInstanceOf(Date);
  });

  it("writes timestamps as ISO 8601 text", () => {
    saveBookshelf(window.localStorage, shelf());

    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw.version).toBe(1);
    expect(raw.entries[0].updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("keeps the removal tombstone", () => {
    const removedAt = new Date("2026-02-02T00:00:00.000Z");
    saveBookshelf(window.localStorage, shelf([entry({ removedAt })]));

    expect(loadBookshelf(window.localStorage).shelf.entries[0].removedAt).toEqual(removedAt);
  });

  it("starts empty over corrupt data and is allowed to replace it", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadBookshelf(window.localStorage)).toEqual({ shelf: shelf([]), canWrite: true });
  });

  it("refuses to write over a newer schema", () => {
    const future = JSON.stringify({ version: 2, entries: [{ anything: true }] });
    window.localStorage.setItem(STORAGE_KEY, future);

    expect(loadBookshelf(window.localStorage)).toEqual({ shelf: shelf([]), canWrite: false });
  });

  it("keeps the valid entries when one is malformed", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        entries: [
          { book: { lang: "ru" }, position: 1 },
          {
            book: { lang: "ru", author: "Блок", title: "Двенадцать", segments: 100 },
            position: 3,
            revealedThrough: 4,
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    const loaded = loadBookshelf(window.localStorage);
    expect(loaded.shelf.entries).toHaveLength(1);
    expect(loaded.shelf.entries[0].position).toBe(3);
  });

  it("clamps a position past the end of a shortened book", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        entries: [
          {
            book: { lang: "ru", author: "Блок", title: "Двенадцать", segments: 10 },
            position: 900,
            revealedThrough: 900,
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    const loaded = loadBookshelf(window.localStorage);
    expect(loaded.shelf.entries[0].position).toBe(9);
    expect(loaded.shelf.entries[0].revealedThrough).toBe(9);
  });
});
