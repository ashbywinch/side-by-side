import { beforeEach, describe, expect, it } from "vitest";

import { createBookshelf } from "@/components/Bookshelf/useBookshelf";
import { STORAGE_KEY } from "@/components/Bookshelf/bookshelfStorage";
import type { Book } from "@/types/bookshelf";

const BOOK: Book = { lang: "ru", author: "Блок", title: "Двенадцать", segments: 100 };
const OTHER: Book = { lang: "ru", author: "Чехов", title: "Чайка", segments: 40 };

function at(iso: string) {
  return () => new Date(iso);
}

function makeStore(iso = "2026-01-01T00:00:00.000Z", events: EventTarget | null = null) {
  return createBookshelf({
    storage: window.localStorage,
    now: at(iso),
    debounceMs: 0,
    events,
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("bookshelf store", () => {
  it("adds a book on a page turn and saves its position", () => {
    const store = makeStore();
    store.touch(BOOK, 24);

    expect(store.entries.value).toHaveLength(1);
    expect(store.entryFor(BOOK)?.position).toBe(24);
    expect(store.entryFor(BOOK)?.revealedThrough).toBe(-1);
  });

  it("does not add a book by saving a position alone", () => {
    const store = makeStore();
    store.setPosition(BOOK, 10);

    expect(store.entries.value).toHaveLength(0);
  });

  it("updates an existing position without adding another entry", () => {
    const store = makeStore();
    store.touch(BOOK, 24);
    store.setPosition(BOOK, 48);

    expect(store.entries.value).toHaveLength(1);
    expect(store.entryFor(BOOK)?.position).toBe(48);
  });

  it("does not move the bookmark when a translation is revealed from another page", () => {
    const store = makeStore();
    store.touch(BOOK, 48);
    store.reveal(BOOK, 3, 0);

    expect(store.entryFor(BOOK)?.position).toBe(48);
    expect(store.entryFor(BOOK)?.revealedThrough).toBe(3);
  });

  it("moves the reveal mark forward only", () => {
    const store = makeStore();
    store.reveal(BOOK, 5, 0);
    store.reveal(BOOK, 2, 0);

    expect(store.entryFor(BOOK)?.revealedThrough).toBe(5);
  });

  it("adds the book on the first reveal", () => {
    const store = makeStore();
    store.reveal(BOOK, 0, 0);

    expect(store.entries.value).toHaveLength(1);
  });

  it("finishes when the last segment is revealed, and stays finished", () => {
    const store = makeStore("2026-01-01T00:00:00.000Z");
    store.reveal(BOOK, 99, 99);

    expect(store.entryFor(BOOK)?.finishedAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));

    const later = makeStore("2026-05-05T00:00:00.000Z");
    later.reveal(OTHER, 1, 1);
    expect(later.entryFor(OTHER)?.finishedAt ?? null).toBeNull();
  });

  it("keeps the original finish time when the reader keeps reading", () => {
    const store = makeStore("2026-01-01T00:00:00.000Z");
    store.reveal(BOOK, 99, 99);
    store.reveal(BOOK, 99, 90);

    expect(store.entryFor(BOOK)?.finishedAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
  });

  it("restarts a book without un-finishing it", () => {
    const store = makeStore();
    store.reveal(BOOK, 99, 99);
    store.restart(BOOK);

    const entry = store.entryFor(BOOK);
    expect(entry?.position).toBe(0);
    expect(entry?.revealedThrough).toBe(-1);
    expect(entry?.finishedAt).toBeInstanceOf(Date);
  });

  it("hides a removed book but keeps its progress", () => {
    const store = makeStore();
    store.touch(BOOK, 24);
    store.remove(BOOK);

    expect(store.entries.value).toHaveLength(0);
    expect(store.entryFor(BOOK)?.removedAt).toBeInstanceOf(Date);
    expect(store.entryFor(BOOK)?.position).toBe(24);
  });

  it("restores a removed book by clearing the tombstone", () => {
    const store = makeStore();
    store.touch(BOOK, 24);
    store.remove(BOOK);
    store.restore(BOOK);

    expect(store.entries.value).toHaveLength(1);
    expect(store.entryFor(BOOK)?.removedAt).toBeUndefined();
  });

  it("brings a removed book back when the reader engages with it again", () => {
    const store = makeStore();
    store.touch(BOOK, 24);
    store.remove(BOOK);
    store.reveal(BOOK, 30, 24);

    expect(store.entries.value).toHaveLength(1);
    expect(store.entryFor(BOOK)?.removedAt).toBeUndefined();
    expect(store.entryFor(BOOK)?.position).toBe(24);
  });

  it("does not resurrect a removed book on a stray scroll", () => {
    const store = makeStore();
    store.touch(BOOK, 24);
    store.remove(BOOK);
    store.setPosition(BOOK, 40);

    expect(store.entries.value).toHaveLength(0);
    expect(store.entryFor(BOOK)?.position).toBe(24);
  });

  it("orders the bookshelf by most recently read", () => {
    makeStore("2026-01-01T00:00:00.000Z").touch(OTHER, 0);
    const store = makeStore("2026-02-01T00:00:00.000Z");
    store.touch(BOOK, 0);

    expect(store.entries.value.map((e) => e.book.title)).toEqual([
      "Двенадцать",
      "Чайка",
    ]);
  });

  it("persists on flush and reloads in a second tab", () => {
    const events = new EventTarget();
    const first = makeStore("2026-01-01T00:00:00.000Z", events);
    const second = makeStore("2026-01-01T00:00:00.000Z", events);

    first.touch(BOOK, 24);
    first.flush();
    events.dispatchEvent(new Event("storage"));

    expect(second.entries.value).toHaveLength(1);
    expect(second.entryFor(BOOK)?.position).toBe(24);
  });

  it("never overwrites a newer schema it cannot read", () => {
    const future = JSON.stringify({ version: 2, entries: [] });
    window.localStorage.setItem(STORAGE_KEY, future);

    const store = makeStore();
    store.touch(BOOK, 24);
    store.flush();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(future);
    expect(store.entries.value).toHaveLength(0);
  });

  it("keeps working in memory when storage throws", () => {
    const broken = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("denied");
      },
      removeItem() {
        throw new Error("denied");
      },
      clear() {
        throw new Error("denied");
      },
      key() {
        return null;
      },
      length: 0,
    } as unknown as Storage;

    const store = createBookshelf({ storage: broken, now: at("2026-01-01T00:00:00.000Z"), debounceMs: 0 });
    store.touch(BOOK, 24);

    expect(store.entryFor(BOOK)?.position).toBe(24);
  });
});
