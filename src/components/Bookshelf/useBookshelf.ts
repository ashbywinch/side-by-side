import { computed, ref, type ComputedRef } from "vue";

import type { Book, BookshelfEntry } from "@/types/bookshelf";
import { BOOKSHELF_VERSION } from "@/types/bookshelf";

import { findEntry, sameBook, visibleEntries } from "./bookshelf";
import { loadBookshelf, saveBookshelf, STORAGE_KEY } from "./bookshelfStorage";
import { clampPosition, nextRevealedThrough } from "./position";

const DEFAULT_DEBOUNCE_MS = 400;

export interface BookshelfOptions {
  storage?: Storage | null;
  now?: () => Date;
  debounceMs?: number;
  events?: EventTarget | null;
}

export interface BookshelfStore {
  /** The bookshelf as the reader sees it: most recent first, removed entries hidden. */
  entries: ComputedRef<BookshelfEntry[]>;
  /** The stored entry, removed or not, so the UI can offer undo. */
  entryFor(book: Pick<Book, "lang" | "author" | "title">): BookshelfEntry | undefined;
  /** A page turn: adds the book if it is new. Never reveals anything. */
  touch(book: Book, position: number): void;
  /** A scroll within a book: moves the position but never adds a book. */
  setPosition(book: Book, position: number): void;
  /** The reader uncovered a translation, at a known position. */
  reveal(book: Book, segment: number, position: number): void;
  /** Start the book again: back to the first segment, nothing uncovered. */
  restart(book: Pick<Book, "lang" | "author" | "title">): void;
  remove(book: Pick<Book, "lang" | "author" | "title">): void;
  restore(book: Pick<Book, "lang" | "author" | "title">): void;
  flush(): void;
  dispose(): void;
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createBookshelf(options: BookshelfOptions = {}): BookshelfStore {
  const storage = options.storage === undefined ? safeStorage() : options.storage;
  const clock = options.now ?? (() => new Date());
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const events =
    options.events === undefined
      ? typeof window === "undefined"
        ? null
        : window
      : options.events;

  const loaded = loadBookshelf(storage);
  const entries = ref<BookshelfEntry[]>(loaded.shelf.entries);
  let writable = loaded.canWrite;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function save(): void {
    if (!writable) return;
    saveBookshelf(storage, { version: BOOKSHELF_VERSION, entries: entries.value });
  }

  function schedule(): void {
    if (!writable) return;
    if (debounceMs <= 0) {
      save();
      return;
    }
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      save();
    }, debounceMs);
  }

  function flush(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    save();
  }

  function entryFor(
    book: Pick<Book, "lang" | "author" | "title">,
  ): BookshelfEntry | undefined {
    return findEntry(entries.value, book);
  }

  /**
   * Replace (or insert) one entry. Every mutation goes through here so the
   * array stays a fresh value and two tabs cannot share a half-updated object.
   */
  function replace(
    book: Pick<Book, "lang" | "author" | "title">,
    update: (current: BookshelfEntry | undefined) => BookshelfEntry | undefined,
  ): void {
    const list = entries.value.slice();
    const index = list.findIndex((entry) => sameBook(entry.book, book));
    const current = index >= 0 ? list[index] : undefined;
    const next = update(current);
    if (!next) return;
    if (index >= 0) list[index] = next;
    else list.push(next);
    entries.value = list;
  }

  function touch(book: Book, position: number): void {
    if (!writable) return;
    const at = clock();
    replace(book, (current) => {
      const bounded = clampPosition(position, book.segments);
      return {
        book,
        position: bounded,
        furthest: Math.max(current?.furthest ?? -1, bounded),
        revealedThrough: current?.revealedThrough ?? -1,
        updatedAt: at,
        ...(current?.finishedAt ? { finishedAt: current.finishedAt } : {}),
      };
    });
    schedule();
  }

  function setPosition(book: Book, position: number): void {
    if (!writable) return;
    const current = entryFor(book);
    if (!current || current.removedAt) return;
    const bounded = clampPosition(position, book.segments);
    if (bounded === current.position) return;
    replace(book, (entry) =>
      entry
        ? {
            ...entry,
            book,
            position: bounded,
            furthest: Math.max(entry.furthest ?? -1, bounded),
            updatedAt: clock(),
          }
        : undefined,
    );
    schedule();
  }

  function reveal(book: Book, segment: number, position: number): void {
    if (!writable) return;
    const at = clock();
    replace(book, (current) => {
      const revealedThrough = nextRevealedThrough(current?.revealedThrough ?? -1, segment);
      const finishedAt =
        current?.finishedAt ??
        (book.segments > 0 && revealedThrough >= book.segments - 1 ? at : undefined);
      return {
        book,
        // The bookmark only moves by reading; revealing while browsing must not
        // drag it to the page being browsed.
        position: current?.position ?? clampPosition(position, book.segments),
        furthest: Math.max(
          current?.furthest ?? -1,
          clampPosition(position, book.segments),
        ),
        revealedThrough,
        updatedAt: at,
        ...(finishedAt ? { finishedAt } : {}),
      };
    });
    schedule();
  }

  function restart(book: Pick<Book, "lang" | "author" | "title">): void {
    if (!writable) return;
    replace(book, (current) =>
      current
        ? {
            ...current,
            position: 0,
            furthest: 0,
            revealedThrough: -1,
            updatedAt: clock(),
          }
        : undefined,
    );
    schedule();
  }

  function remove(book: Pick<Book, "lang" | "author" | "title">): void {
    if (!writable) return;
    const at = clock();
    replace(book, (current) => (current ? { ...current, removedAt: at } : undefined));
    schedule();
  }

  function restore(book: Pick<Book, "lang" | "author" | "title">): void {
    if (!writable) return;
    replace(book, (current) =>
      current ? { ...current, removedAt: undefined } : undefined,
    );
    schedule();
  }

  function reload(): void {
    const result = loadBookshelf(storage);
    entries.value = result.shelf.entries;
    writable = result.canWrite;
  }

  function onStorage(event: Event): void {
    const key = (event as StorageEvent).key;
    if (key !== undefined && key !== null && key !== STORAGE_KEY) return;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    reload();
  }

  events?.addEventListener("storage", onStorage);

  return {
    entries: computed(() => visibleEntries(entries.value)),
    entryFor,
    touch,
    setPosition,
    reveal,
    restart,
    remove,
    restore,
    flush,
    dispose() {
      events?.removeEventListener("storage", onStorage);
    },
  };
}

let shared: BookshelfStore | null = null;

/** The app's bookshelf. Tests build their own with `createBookshelf`. */
export function useBookshelf(): BookshelfStore {
  if (!shared) shared = createBookshelf();
  return shared;
}

/** Drop the shared instance so the next caller reloads from storage. */
export function resetBookshelf(): void {
  shared?.dispose();
  shared = null;
}
