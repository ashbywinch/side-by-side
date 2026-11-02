import type { Bookshelf, BookshelfEntry } from "@/types/bookshelf";
import { BOOKSHELF_VERSION } from "@/types/bookshelf";

import { clampPosition, clampRevealedThrough } from "./position";


export const STORAGE_KEY = "sbs:bookshelf:v1";

export interface LoadResult {
  shelf: Bookshelf;
  /** False when the stored data belongs to a newer schema we must not overwrite. */
  canWrite: boolean;
}

interface StoredEntry {
  book: { lang: string; author: string; title: string; segments: number };
  position: number;
  furthest: number;
  revealedThrough: number;
  updatedAt: string;
  finishedAt?: string;
  removedAt?: string;
}

function empty(): Bookshelf {
  return { version: BOOKSHELF_VERSION, entries: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function index(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function date(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toEntry(value: unknown): BookshelfEntry | null {
  if (!isRecord(value) || !isRecord(value.book)) return null;

  const lang = text(value.book.lang);
  const author = text(value.book.author);
  const title = text(value.book.title);
  const segments = count(value.book.segments);
  const position = index(value.position);
  const revealedThrough = index(value.revealedThrough);
  const updatedAt = date(value.updatedAt);

  if (
    lang === null ||
    author === null ||
    title === null ||
    segments === null ||
    position === null ||
    revealedThrough === null ||
    updatedAt === null
  ) {
    return null;
  }

  const finishedAt = date(value.finishedAt);
  const removedAt = date(value.removedAt);
  const bounded = clampPosition(position, segments);
  const furthest = clampPosition(index(value.furthest) ?? bounded, segments);

  return {
    book: { lang, author, title, segments },
    position: bounded,
    furthest: Math.max(furthest, bounded),
    revealedThrough: clampRevealedThrough(revealedThrough, segments),
    updatedAt,
    ...(finishedAt ? { finishedAt } : {}),
    ...(removedAt ? { removedAt } : {}),
  };
}

function toStored(entry: BookshelfEntry): StoredEntry {
  return {
    book: entry.book,
    position: entry.position,
    furthest: entry.furthest,
    revealedThrough: entry.revealedThrough,
    updatedAt: entry.updatedAt.toISOString(),
    ...(entry.finishedAt ? { finishedAt: entry.finishedAt.toISOString() } : {}),
    ...(entry.removedAt ? { removedAt: entry.removedAt.toISOString() } : {}),
  };
}

export function loadBookshelf(storage: Storage | null): LoadResult {
  if (!storage) return { shelf: empty(), canWrite: true };

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { shelf: empty(), canWrite: true };
  }
  if (!raw) return { shelf: empty(), canWrite: true };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Unreadable data cannot be repaired; let the next write replace it.
    return { shelf: empty(), canWrite: true };
  }
  if (!isRecord(parsed) || parsed.version !== BOOKSHELF_VERSION) {
    // Unknown or newer: leave it alone rather than destroy someone's data.
    return { shelf: empty(), canWrite: false };
  }

  const entries = Array.isArray(parsed.entries)
    ? parsed.entries.map(toEntry).filter((entry): entry is BookshelfEntry => entry !== null)
    : [];

  return { shelf: { version: BOOKSHELF_VERSION, entries }, canWrite: true };
}

export function saveBookshelf(storage: Storage | null, shelf: Bookshelf): void {
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: BOOKSHELF_VERSION,
        entries: shelf.entries.map(toStored),
      }),
    );
  } catch {
    // A full or denied store must never break reading.
  }
}
