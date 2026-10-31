import type { BookIndexEntry } from "@/types/corpus";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];
export type Level = CefrLevel | "";
export type LevelFilter = CefrLevel | "unrated";

const CEFR_LEVEL_SET = new Set<string>(CEFR_LEVELS);

/** Keep only real CEFR strings; numbers and unknown tags are unrated. */
export function normaliseLevel(value: unknown): Level {
  return typeof value === "string" && CEFR_LEVEL_SET.has(value)
    ? (value as CefrLevel)
    : "";
}

export function levelLabel(value: unknown): string {
  return normaliseLevel(value) || "Unrated";
}

/** Normalise a level coming from a filter, including the Unrated sentinel. */
export function normaliseLevelFilter(value: unknown): LevelFilter | "" {
  if (value === "unrated") return "unrated";
  return normaliseLevel(value);
}

export interface LevelOption {
  text: string;
  value: LevelFilter;
}

/**
 * Levels that can actually match a book, in CEFR order, with Unrated last.
 * Seeing a dead option that can only produce an empty list is worse than
 * hiding it.
 */
export function levelOptions(books: readonly BookIndexEntry[]): LevelOption[] {
  const present = new Set(books.map((book) => normaliseLevel(book["Vocab Level"])));
  const options: LevelOption[] = CEFR_LEVELS.filter((level) =>
    present.has(level),
  ).map((level) => ({ text: level, value: level }));

  if (present.has("")) {
    options.push({ text: "Unrated", value: "unrated" });
  }

  return options;
}

const levelColors: Record<CefrLevel, string> = {
  A1: "#4d8",
  A2: "#ed0",
  B1: "#e94",
  B2: "#c66",
  C1: "#a35",
  C2: "#817",
};

export const UNRATED_COLOR = "#8a8a8a";

export function levelColorFor(value: unknown): string {
  const level = normaliseLevel(value);
  return level ? levelColors[level] : UNRATED_COLOR;
}
