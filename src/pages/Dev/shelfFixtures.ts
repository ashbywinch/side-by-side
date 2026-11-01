import { BOOKSHELF_VERSION } from "@/types/bookshelf";
import type { Book, Bookshelf, BookshelfEntry } from "@/types/bookshelf";

/**
 * Named bookshelf states for the layout comparison. Every book is a real corpus
 * book and `segments` is the line count of its JSONL file, so the cards, the
 * progress bars and the finished marks are the ones the app produces — a test
 * checks each entry against `corpus/books/` so a corpus change cannot rot them.
 *
 * Timestamps are fixed and minutes apart: ordering must be deterministic.
 */
const BOOK: Record<string, Book> = {
  anna: { lang: "ru", author: "Лев Толстой", title: "Анна Каренина", segments: 19101 },
  chaika: { lang: "ru", author: "Антон Чехов", title: "Чайка", segments: 833 },
  asya: { lang: "ru", author: "Иван Тургенев", title: "Ася", segments: 966 },
  religio: { lang: "ru", author: "Александр Блок", title: "Religio1", segments: 7 },
  zaklyatie: { lang: "ru", author: "Александр Блок", title: "Заклятие огнем и мраком", segments: 14 },
  dvenadtsat: { lang: "ru", author: "Александр Блок", title: "Двенадцать", segments: 23 },
  balaganchik: { lang: "ru", author: "Александр Блок", title: "Балаганчик", segments: 8 },
  vRestorane: { lang: "ru", author: "Александр Блок", title: "В ресторане", segments: 8 },
  vstuplenie: { lang: "ru", author: "Александр Блок", title: "Вступление", segments: 5 },
  dvoyniku: { lang: "ru", author: "Александр Блок", title: "Двойнику", segments: 6 },
};

function entry(
  book: Book,
  position: number,
  revealedThrough: number,
  updatedAt: string,
  finishedAt?: string,
): BookshelfEntry {
  return {
    book: { ...book },
    position,
    revealedThrough,
    updatedAt: new Date(updatedAt),
    ...(finishedAt ? { finishedAt: new Date(finishedAt) } : {}),
  };
}

export const FIXTURES: Record<string, BookshelfEntry[]> = {
  none: [],

  // Three books in the three states a reader sees: partway, just started,
  // finished. Includes a long author/title and a one-page poem.
  reading: [
    entry(BOOK.anna, 5000, 5020, "2026-10-01T09:00:00.000Z"),
    entry(BOOK.chaika, 120, 137, "2026-10-01T08:30:00.000Z"),
    entry(BOOK.religio, 0, 6, "2026-10-01T08:00:00.000Z", "2026-10-01T08:05:00.000Z"),
  ],

  // Eight books, so the section shows "See all" and the rail actually overflows.
  full: [
    entry(BOOK.anna, 5000, 5020, "2026-10-01T09:00:00.000Z"),
    entry(BOOK.chaika, 120, 137, "2026-10-01T08:55:00.000Z"),
    entry(BOOK.asya, 600, 620, "2026-10-01T08:50:00.000Z"),
    entry(BOOK.zaklyatie, 4, 6, "2026-10-01T08:45:00.000Z"),
    entry(BOOK.dvenadtsat, 10, 12, "2026-10-01T08:40:00.000Z"),
    entry(BOOK.balaganchik, 0, 2, "2026-10-01T08:35:00.000Z"),
    entry(BOOK.vRestorane, 0, 0, "2026-10-01T08:30:00.000Z"),
    entry(BOOK.religio, 0, 6, "2026-10-01T08:00:00.000Z", "2026-10-01T08:05:00.000Z"),
  ],

  // An entry whose book has left the corpus: it must render nothing blank.
  stale: [
    entry(BOOK.anna, 5000, 5020, "2026-10-01T09:00:00.000Z"),
    entry(
      { lang: "ru", author: "Нет Такого", title: "Удалённая книга", segments: 10 },
      0,
      0,
      "2026-10-01T08:30:00.000Z",
    ),
  ],
};

export function shelfFor(name: string | null | undefined): Bookshelf | null {
  if (!name || !(name in FIXTURES)) return null;
  return { version: BOOKSHELF_VERSION, entries: FIXTURES[name] };
}
