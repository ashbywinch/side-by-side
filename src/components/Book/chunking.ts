import corpusConfig from "../../../corpus.config.json";

export interface CorpusConfig {
  chunkSize: number;
  perPage: number;
  lruChunks: number;
}

const config = corpusConfig as CorpusConfig;

export const DEFAULT_CHUNK_SIZE = config.chunkSize;
export const DEFAULT_PER_PAGE = config.perPage;
export const DEFAULT_LRU_CHUNKS = config.lruChunks;

function normalisePage(page: number): number {
  const value = Math.floor(Number(page));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** 1-based chunk number that contains the requested page. */
export function chunkIndexForPage(
  page: number,
  perPage: number = DEFAULT_PER_PAGE,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): number {
  const firstIndex = (normalisePage(page) - 1) * perPage;
  return Math.floor(firstIndex / chunkSize) + 1;
}

/** Chunk number plus the offset of the page's first segment inside that chunk. */
export function pageSlice(
  page: number,
  perPage: number = DEFAULT_PER_PAGE,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): { chunk: number; offset: number } {
  const firstIndex = (normalisePage(page) - 1) * perPage;
  return {
    chunk: Math.floor(firstIndex / chunkSize) + 1,
    offset: firstIndex % chunkSize,
  };
}

export function bookDataBaseUrl(lang: string, author: string, title: string): string {
  return `/api/books/${encodeURIComponent(lang)}/${encodeURIComponent(author)}/${encodeURIComponent(title)}`;
}

export function metaUrl(base: string): string {
  return `${base}/meta.json`;
}

export function chunkUrl(base: string, chunk: number): string {
  return `${base}/chunk-${String(chunk).padStart(4, "0")}.jsonl`;
}
