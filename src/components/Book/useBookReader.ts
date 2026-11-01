import { computed, ref, type Ref } from "vue";

import {
  bookDataBaseUrl,
  chunkUrl,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_LRU_CHUNKS,
  DEFAULT_PER_PAGE,
  metaUrl,
  pageSlice,
} from "./chunking";

export interface BookSegment {
  text: string;
  translation: string;
  title?: string;
  author?: string;
  start?: number;
  end?: number;
  [key: string]: unknown;
}

export interface BookMeta {
  lang: string;
  author: string;
  title: string;
  segments: number;
  chunkSize: number;
  chunkCount: number;
}

export interface ReaderOptions {
  perPage: number;
  chunkSize: number;
  lruChunks: number;
}

export interface UseBookReaderArgs {
  lang: string;
  author: string;
  title: string;
  fetchImpl?: typeof fetch;
  autoPrefetch?: boolean;
  options?: Partial<ReaderOptions>;
}

export class ReaderError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ReaderError";
    this.status = status;
  }
}

function shouldSkipPrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return false;
  return (
    connection.saveData === true ||
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g"
  );
}

function toMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "request aborted";
  }
  if (error instanceof ReaderError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useBookReader({
  lang,
  author,
  title,
  fetchImpl = fetch,
  autoPrefetch = false,
  options = {},
}: UseBookReaderArgs) {
  const perPage = options.perPage ?? DEFAULT_PER_PAGE;
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const lruChunks = options.lruChunks ?? DEFAULT_LRU_CHUNKS;
  const base = bookDataBaseUrl(lang, author, title);

  const meta: Ref<BookMeta | null> = ref(null);
  const page = ref(1);
  const pageItems = ref<BookSegment[]>([]);
  const loading = ref(false);
  const error = ref("");

  const numPages = computed(() =>
    meta.value ? Math.max(1, Math.ceil(meta.value.segments / perPage)) : 0,
  );

  const cache = new Map<number, BookSegment[]>();
  const inFlight = new Map<number, Promise<BookSegment[]>>();
  const controllers = new Map<string, AbortController>();

  let metaPromise: Promise<BookMeta> | null = null;
  let metaRequested = false;
  let requestToken = 0;
  let disposed = false;

  function recall(chunk: number): BookSegment[] | undefined {
    const items = cache.get(chunk);
    if (!items) return undefined;
    cache.delete(chunk);
    cache.set(chunk, items);
    return items;
  }

  function remember(chunk: number, items: BookSegment[]): void {
    cache.set(chunk, items);
    while (cache.size > lruChunks) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }

  async function fetchJsonl(url: string, signal: AbortSignal): Promise<BookSegment[]> {
    const response = await fetchImpl(url, { signal });
    if (!response.ok) {
      throw new ReaderError(`not found (${response.status})`, response.status);
    }
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (contentType.includes("text/html")) {
      throw new ReaderError("not found (SPA fallback)", 404);
    }

    const text = await response.text();
    const items: BookSegment[] = [];
    for (const line of text.split("\n")) {
      if (line.trim() === "") continue;
      try {
        items.push(JSON.parse(line) as BookSegment);
      } catch {
        throw new ReaderError("invalid book data");
      }
    }
    return items;
  }

  async function fetchMeta(signal: AbortSignal): Promise<BookMeta> {
    const response = await fetchImpl(metaUrl(base), { signal });
    if (!response.ok) {
      throw new ReaderError(`not found (${response.status})`, response.status);
    }
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (contentType.includes("text/html")) {
      throw new ReaderError("not found (SPA fallback)", 404);
    }
    return (await response.json()) as BookMeta;
  }

  function ensureMeta(): Promise<BookMeta> {
    if (meta.value) return Promise.resolve(meta.value);
    if (metaPromise) return metaPromise;

    const controller = new AbortController();
    controllers.set("meta", controller);
    metaPromise = fetchMeta(controller.signal)
      .then((value) => {
        meta.value = value;
        return value;
      })
      .catch((cause) => {
        metaPromise = null;
        throw cause;
      })
      .finally(() => {
        controllers.delete("meta");
      });
    metaRequested = true;
    return metaPromise;
  }

  function ensureChunk(chunk: number): Promise<BookSegment[]> {
    const cached = recall(chunk);
    if (cached) return Promise.resolve(cached);
    const pending = inFlight.get(chunk);
    if (pending) return pending;

    const controller = new AbortController();
    controllers.set(`chunk-${chunk}`, controller);
    const promise = fetchJsonl(chunkUrl(base, chunk), controller.signal)
      .then((items) => {
        remember(chunk, items);
        return items;
      })
      .finally(() => {
        inFlight.delete(chunk);
        controllers.delete(`chunk-${chunk}`);
      });
    inFlight.set(chunk, promise);
    return promise;
  }

  async function prefetch(): Promise<void> {
    if (disposed || !meta.value || shouldSkipPrefetch()) return;
    const current = pageSlice(page.value, perPage, chunkSize).chunk;
    const next = current + 1;
    if (next > meta.value.chunkCount) return;
    try {
      await ensureChunk(next);
    } catch {
      // Prefetch is best effort: a failure must not disturb the current page.
    }
  }

  async function setPage(requested: number): Promise<number> {
    if (disposed) {
      error.value = "reader aborted";
      loading.value = false;
      return page.value;
    }

    const token = (requestToken += 1);
    const wanted = Math.max(1, Math.floor(Number(requested)) || 1);
    loading.value = true;
    error.value = "";

    try {
      let loadedMeta: BookMeta;
      let loadedChunk: number;
      let items: BookSegment[];

      if (meta.value) {
        loadedMeta = meta.value;
        const total = Math.max(1, Math.ceil(loadedMeta.segments / perPage));
        const slice = pageSlice(Math.min(wanted, total), perPage, chunkSize);
        loadedChunk = slice.chunk;
        items = await ensureChunk(loadedChunk);
      } else if (wanted === 1) {
        // The common entry point: fetch metadata and the first chunk together.
        const [value, chunkItems] = await Promise.all([
          ensureMeta(),
          ensureChunk(1),
        ]);
        loadedMeta = value;
        loadedChunk = 1;
        items = chunkItems;
      } else {
        // A deep link: we need the metadata to clamp the page before deciding
        // which chunk to fetch, so invalid page numbers never request a
        // non-existent chunk.
        loadedMeta = await ensureMeta();
        const total = Math.max(1, Math.ceil(loadedMeta.segments / perPage));
        const slice = pageSlice(Math.min(wanted, total), perPage, chunkSize);
        loadedChunk = slice.chunk;
        items = await ensureChunk(loadedChunk);
      }

      if (token !== requestToken) return page.value;

      const total = Math.max(1, Math.ceil(loadedMeta.segments / perPage));
      const effective = Math.min(wanted, total);
      const slice = pageSlice(effective, perPage, chunkSize);

      if (slice.chunk !== loadedChunk) {
        items = await ensureChunk(slice.chunk);
        if (token !== requestToken) return page.value;
      }

      meta.value = loadedMeta;
      page.value = effective;
      pageItems.value = items.slice(slice.offset, slice.offset + perPage);

      if (autoPrefetch) void prefetch();
      return effective;
    } catch (cause) {
      if (token === requestToken) {
        error.value = toMessage(cause);
        pageItems.value = [];
      }
      return page.value;
    } finally {
      if (token === requestToken) loading.value = false;
    }
  }

  function dispose(): void {
    disposed = true;
    requestToken += 1;
    for (const controller of controllers.values()) controller.abort();
    controllers.clear();
    inFlight.clear();
    metaPromise = null;
  }

  return {
    meta,
    page,
    pageItems,
    loading,
    error,
    numPages,
    perPage,
    setPage,
    prepare: ensureMeta,
    prefetch,
    dispose,
    metaRequested: () => metaRequested,
  };
}
