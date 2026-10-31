import { describe, expect, it } from "vitest";

import { runSmoke } from "../scripts/smoke.mjs";

const SHA = "abc123";

interface SiteOptions {
  sha?: string;
  htmlInsteadOfJsonl?: boolean;
  compressed?: boolean;
  contentType?: string;
  versionFailures?: number;
  books?: number;
}

function jsonResponse(value: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
}

function makeSite(options: SiteOptions = {}) {
  let versionCalls = 0;
  const state = { versionCalls: 0 };
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const path = new URL(url, "https://example.test").pathname;

    if (path === "/") {
      return new Response('<html><body><div id="app"></div></body></html>', {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }
    if (path === "/ru/books" || path.startsWith("/ru/book/")) {
      return new Response('<html><body><div id="app"></div></body></html>', {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }
    if (path === "/version.json") {
      versionCalls += 1;
      state.versionCalls = versionCalls;
      if (versionCalls <= (options.versionFailures ?? 0)) {
        return new Response("not yet", { status: 404 });
      }
      return jsonResponse({ sha: options.sha ?? SHA, version: "1.0.0" });
    }
    if (path === "/api/books/ru/index.jsonl") {
      if (options.htmlInsteadOfJsonl) {
        return new Response("<html>fallback</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
      const count = options.books ?? 2;
      const lines = Array.from({ length: count }, (_, i) =>
        JSON.stringify({ lang: "ru", title: `B${i}`, author: "A", translated: true }),
      ).join("\n");
      return new Response(lines, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    if (path.endsWith("/meta.json")) {
      return jsonResponse({
        lang: "ru",
        author: "Александр Блок",
        title: "Двенадцать",
        segments: 10,
        chunkSize: 500,
        chunkCount: 1,
      });
    }
    if (path.endsWith("/chunk-0001.jsonl")) {
      if (options.htmlInsteadOfJsonl) {
        return new Response("<html>fallback</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response(
        `${JSON.stringify({ text: "Черный вечер.", translation: "Black evening." })}\n`,
        {
          status: 200,
          headers: {
            "Content-Type": options.contentType ?? "text/plain; charset=utf-8",
            ...(options.compressed === false
              ? {}
              : { "Content-Encoding": init?.headers?.["Accept-Encoding"] === "br" ? "br" : "gzip" }),
          },
        },
      );
    }
    return new Response("unexpected", { status: 500 });
  };
  return { fetchImpl, state };
}

describe("runSmoke", () => {
  it("passes a healthy deployment", async () => {
    const { fetchImpl } = makeSite();

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
    });

    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.attempts).toBe(1);
  });

  it("fails when the deployed SHA is stale", async () => {
    const { fetchImpl } = makeSite({ sha: "old" });

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.failures.join("\n")).toMatch(/sha/i);
  });

  it("rejects an HTML SPA fallback where JSONL is expected", async () => {
    const { fetchImpl } = makeSite({ htmlInsteadOfJsonl: true });

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.failures.join("\n")).toMatch(/content-type|jsonl/i);
  });

  it("fails when the corpus is not compressed", async () => {
    const { fetchImpl } = makeSite({ compressed: false });

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.failures.join("\n")).toMatch(/compress/i);
  });

  it("fails when a chunk is served as octet-stream", async () => {
    const { fetchImpl } = makeSite({ contentType: "application/octet-stream" });

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
    });

    expect(result.ok).toBe(false);
    expect(result.failures.join("\n")).toMatch(/content-type/i);
  });

  it("retries until the deployment is live", async () => {
    const { fetchImpl, state } = makeSite({ versionFailures: 2 });

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
      attempts: 3,
      delayMs: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(3);
    expect(state.versionCalls).toBe(3);
  });

  it("fails after the attempt limit", async () => {
    const { fetchImpl } = makeSite({ versionFailures: 99 });

    const result = await runSmoke({
      base: "https://example.test",
      sha: SHA,
      fetchImpl,
      expectedBooks: 2,
      attempts: 2,
      delayMs: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(2);
  });
});
