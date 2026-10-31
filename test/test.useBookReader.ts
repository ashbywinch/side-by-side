import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import { useBookReader } from "@/components/Book/useBookReader";

const META = { lang: "en", author: "Author", title: "Book", segments: 100, chunkSize: 5, chunkCount: 20 };

function segment(index: number) {
  return { text: `s${index}`, translation: `t${index}` };
}

function jsonl(items: unknown[]) {
  return new HttpResponse(items.map((item) => JSON.stringify(item)).join("\n") + "\n", {
    headers: { "Content-Type": "text/plain" },
  });
}

let metaCalls = 0;
let chunkCalls: Record<number, number> = {};

const handlers = [
  http.get("api/books/en/Author/Book/meta.json", () => {
    metaCalls += 1;
    return HttpResponse.json(META);
  }),
  ...Array.from({ length: 20 }, (_, i) => {
    const chunk = i + 1;
    return http.get(`api/books/en/Author/Book/chunk-${String(chunk).padStart(4, "0")}.jsonl`, () => {
      chunkCalls[chunk] = (chunkCalls[chunk] ?? 0) + 1;
      const start = i * 5;
      return jsonl(Array.from({ length: 5 }, (_, j) => segment(start + j)));
    });
  }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  metaCalls = 0;
  chunkCalls = {};
});

function makeReader(overrides = {}) {
  return useBookReader({
    lang: "en",
    author: "Author",
    title: "Book",
    autoPrefetch: false,
    options: { perPage: 2, chunkSize: 5, lruChunks: 2 },
    ...overrides,
  });
}

describe("useBookReader", () => {
  it("loads meta and the first chunk in parallel", async () => {
    let releaseMeta!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseMeta = resolve;
    });
    server.use(
      http.get("api/books/en/Author/Book/meta.json", async () => {
        metaCalls += 1;
        await gate;
        return HttpResponse.json(META);
      }),
    );

    const reader = makeReader();
    const loading = reader.setPage(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(chunkCalls[1]).toBe(1);

    releaseMeta();
    await loading;

    expect(metaCalls).toBe(1);
    expect(reader.meta.value?.segments).toBe(100);
    expect(reader.numPages.value).toBe(50);
    expect(reader.pageItems.value.map((item) => item.text)).toEqual(["s0", "s1"]);
  });

  it("loads only the chunk containing the requested page", async () => {
    const reader = makeReader();

    await reader.setPage(22);

    expect(chunkCalls[9]).toBe(1);
    expect(chunkCalls[1]).toBeUndefined();
    expect(reader.pageItems.value.map((item) => item.text)).toEqual(["s42", "s43"]);
  });

  it("caches chunks across page turns", async () => {
    const reader = makeReader();

    await reader.setPage(1);
    await reader.setPage(2);
    await reader.setPage(1);

    expect(chunkCalls[1]).toBe(1);
    expect(reader.pageItems.value.map((item) => item.text)).toEqual(["s0", "s1"]);
  });

  it("prefetches the next chunk once", async () => {
    const reader = makeReader();

    await reader.setPage(1);
    await reader.prefetch();
    await reader.prefetch();

    expect(chunkCalls[2]).toBe(1);
  });

  it("skips prefetching when Save-Data is on", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true },
    });
    const reader = makeReader();

    await reader.setPage(1);
    await reader.prefetch();

    expect(chunkCalls[2]).toBeUndefined();
    delete (navigator as { connection?: unknown }).connection;
  });

  it("reports a missing book", async () => {
    server.use(
      http.get("api/books/en/Author/Book/meta.json", () => new HttpResponse(null, { status: 404 })),
    );
    const reader = makeReader();

    await reader.setPage(1);

    expect(reader.loading.value).toBe(false);
    expect(reader.error.value).toMatch(/not found/i);
    expect(reader.pageItems.value).toEqual([]);
  });

  it("treats an HTML SPA fallback as not found", async () => {
    server.use(
      http.get(
        "api/books/en/Author/Book/meta.json",
        () =>
          new HttpResponse("<html><body>app</body></html>", {
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );
    const reader = makeReader();

    await reader.setPage(1);

    expect(reader.error.value).toMatch(/not found/i);
  });

  it("ignores a stale response after a rapid page change", async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    server.use(
      http.get("api/books/en/Author/Book/chunk-0001.jsonl", async () => {
        chunkCalls[1] = (chunkCalls[1] ?? 0) + 1;
        await firstGate;
        return jsonl([segment(0), segment(1)]);
      }),
    );

    const reader = makeReader();
    const first = reader.setPage(1);
    const second = reader.setPage(22);
    await second;
    releaseFirst();
    await first;

    expect(reader.page.value).toBe(22);
    expect(reader.pageItems.value.map((item) => item.text)).toEqual(["s42", "s43"]);
  });

  it("clamps pages beyond the end and below the start", async () => {
    server.use(
      http.get("api/books/en/Author/Book/meta.json", () =>
        HttpResponse.json({ ...META, segments: 10, chunkCount: 2 }),
      ),
    );
    const reader = makeReader();

    await reader.setPage(999);
    expect(reader.page.value).toBe(5);
    expect(reader.pageItems.value.map((item) => item.text)).toEqual(["s8", "s9"]);

    await reader.setPage(-4);
    expect(reader.page.value).toBe(1);
  });

  it("evicts the least recently used chunk", async () => {
    const reader = makeReader();

    await reader.setPage(1); // chunk 1
    await reader.setPage(4); // chunk 2
    await reader.setPage(7); // chunk 3, evicts chunk 1
    await reader.setPage(1); // chunk 1 again

    expect(chunkCalls[1]).toBe(2);
  });

  it("aborts outstanding work on dispose", async () => {
    const reader = makeReader();
    reader.dispose();
    await reader.setPage(1);
    expect(reader.error.value).toMatch(/abort/i);
  });
});
