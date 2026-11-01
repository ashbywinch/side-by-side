/** One corpus book: identity plus the length the progress indicator needs. */
export interface Book {
  lang: string;
  author: string;
  title: string;
  segments: number;
}

/**
 * The reader's relationship to one book: where they are, what they have
 * uncovered, when, and whether they removed it from the bookshelf.
 *
 * `position` and `revealedThrough` are segment indices. A page is derived from
 * the page size and never stored.
 */
export interface BookshelfEntry {
  book: Book;
  position: number;
  revealedThrough: number;
  updatedAt: Date;
  finishedAt?: Date;
  removedAt?: Date;
}

export const BOOKSHELF_VERSION = 1;

export interface Bookshelf {
  version: typeof BOOKSHELF_VERSION;
  entries: BookshelfEntry[];
}
