import { describe, expect, it } from "vitest";

import {
  bookDataBaseUrl,
  chunkIndexForPage,
  chunkUrl,
  metaUrl,
  pageSlice,
} from "@/components/Book/chunking";

describe("chunking", () => {
  it("maps pages to chunk numbers at the boundaries", () => {
    expect(chunkIndexForPage(1, 24, 500)).toBe(1);
    expect(chunkIndexForPage(20, 24, 500)).toBe(1);
    expect(chunkIndexForPage(21, 24, 500)).toBe(1);
    expect(chunkIndexForPage(22, 24, 500)).toBe(2);
    expect(chunkIndexForPage(42, 24, 500)).toBe(2);
  });

  it("returns the chunk and the offset inside it", () => {
    expect(pageSlice(1, 24, 500)).toEqual({ chunk: 1, offset: 0 });
    expect(pageSlice(21, 24, 500)).toEqual({ chunk: 1, offset: 480 });
    expect(pageSlice(22, 24, 500)).toEqual({ chunk: 2, offset: 4 });
  });

  it("clamps invalid pages to the first page", () => {
    expect(pageSlice(0, 24, 500)).toEqual({ chunk: 1, offset: 0 });
    expect(pageSlice(-3, 24, 500)).toEqual({ chunk: 1, offset: 0 });
    expect(chunkIndexForPage(Number.NaN, 24, 500)).toBe(1);
  });

  it("builds encoded book URLs without double-encoding", () => {
    const base = bookDataBaseUrl("ru", "Александр Блок", "Двенадцать");
    expect(base).toBe(
      "/api/books/ru/%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B0%D0%BD%D0%B4%D1%80%20%D0%91%D0%BB%D0%BE%D0%BA/%D0%94%D0%B2%D0%B5%D0%BD%D0%B0%D0%B4%D1%86%D0%B0%D1%82%D1%8C",
    );
    expect(metaUrl(base)).toBe(`${base}/meta.json`);
  });

  it("zero-pads chunk file names", () => {
    expect(chunkUrl("/base", 1)).toBe("/base/chunk-0001.jsonl");
    expect(chunkUrl("/base", 42)).toBe("/base/chunk-0042.jsonl");
    expect(chunkUrl("/base", 1234)).toBe("/base/chunk-1234.jsonl");
  });
});
