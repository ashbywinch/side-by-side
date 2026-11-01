import type { Book, Bookshelf, BookshelfEntry } from "@/types/bookshelf";
import { BOOKSHELF_VERSION } from "@/types/bookshelf";

/** Identity of a book. The corpus has no ids, so identity is its address. */
export function bookKey(book: Pick<Book, "lang" | "author" | "title">): string {
  return [book.lang, book.author, book.title].join("\u001f");
}

export function sameBook(
  a: Pick<Book, "lang" | "author" | "title">,
  b: Pick<Book, "lang" | "author" | "title">,
): boolean {
  return bookKey(a) === bookKey(b);
}

export function emptyBookshelf(): Bookshelf {
  return { version: BOOKSHELF_VERSION, entries: [] };
}

export function findEntry(
  entries: BookshelfEntry[],
  book: Pick<Book, "lang" | "author" | "title">,
): BookshelfEntry | undefined {
  return entries.find((entry) => sameBook(entry.book, book));
}

/** The bookshelf as the reader sees it: no removed entries, most recent first. */
export function visibleEntries(entries: BookshelfEntry[]): BookshelfEntry[] {
  return entries
    .filter((entry) => !entry.removedAt)
    .slice()
    .sort(
      (a, b) =>
        b.updatedAt.getTime() - a.updatedAt.getTime() ||
        bookKey(a.book).localeCompare(bookKey(b.book)),
    );
}

export function isFinished(entry: BookshelfEntry): boolean {
  return entry.finishedAt !== undefined;
}

/** Fraction of the book behind the reader's viewport; full once finished. */
export function progressFraction(entry: BookshelfEntry): number {
  if (isFinished(entry)) return 1;
  const segments = entry.book.segments;
  if (!Number.isFinite(segments) || segments <= 0) return 0;
  const behind = Math.min(Math.max(entry.position + 1, 0), segments);
  return behind / segments;
}
