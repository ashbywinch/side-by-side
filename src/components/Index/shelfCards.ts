import type { BookIndexEntry } from "@/types/corpus";
import type { Book, BookshelfEntry } from "@/types/bookshelf";

export interface ShelfCard {
  book: BookIndexEntry;
  entry: BookshelfEntry;
}

/** A book's identity on the shelf; the corpus has no ids. */
export type ShelfBook = Pick<Book, "lang" | "author" | "title">;

function key(book: { lang: string; author: string; title: string }): string {
  return [book.lang, book.author, book.title].join("\u001f");
}

/**
 * The bookshelf in recency order, joined to the index entries the cards need.
 * A book that has left the corpus is skipped rather than rendered blank.
 */
export function shelfCards(
  books: BookIndexEntry[],
  entries: BookshelfEntry[],
): ShelfCard[] {
  const index = new Map(books.map((book) => [key(book), book]));
  const cards: ShelfCard[] = [];
  for (const entry of entries) {
    if (entry.removedAt) continue;
    const book = index.get(key(entry.book));
    if (!book) continue;
    cards.push({ book, entry });
  }
  return cards;
}
