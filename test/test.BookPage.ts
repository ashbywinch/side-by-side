import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { flushPromises } from "@vue/test-utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/vue";

import { createBookshelf, resetBookshelf, useBookshelf } from "@/components/Bookshelf/useBookshelf";

vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  const route = reactive({ name: "Book", params: {}, query: { page: "1" } });
  const push = vi.fn(async (to: { query?: Record<string, unknown> }) => {
    route.query = { ...route.query, ...(to.query ?? {}) };
  });
  const replace = vi.fn(async (to: { query?: Record<string, unknown> }) => {
    route.query = { ...route.query, ...(to.query ?? {}) };
  });
  return {
    RouterView: {},
    RouterLink: {},
    useRoute: () => route,
    useRouter: () => ({ push, replace }),
    __route: route,
    __push: push,
    __replace: replace,
  };
});

import BookPage from "@/pages/Book/BookPage.vue";

const SEGMENTS = 600;

function segment(index: number) {
  return { text: `s${index}`, translation: `t${index}` };
}

function jsonl(items: unknown[]) {
  return new HttpResponse(items.map((item) => JSON.stringify(item)).join("\n") + "\n", {
    headers: { "Content-Type": "text/plain" },
  });
}

const meta = {
  lang: "en",
  author: "Author",
  title: "Book",
  segments: SEGMENTS,
  chunkSize: 500,
  chunkCount: 2,
};

let metaCalls = 0;
let chunkCalls: Record<number, number> = {};
let fullBookCalls = 0;

function handlersFor(base: string, bookMeta = meta) {
  return [
    http.get(`${base}/meta.json`, () => {
      metaCalls += 1;
      return HttpResponse.json(bookMeta);
    }),
    http.get(`${base}/chunk-0001.jsonl`, () => {
      chunkCalls[1] = (chunkCalls[1] ?? 0) + 1;
      return jsonl(Array.from({ length: Math.min(500, bookMeta.segments) }, (_, i) => segment(i)));
    }),
    http.get(`${base}/chunk-0002.jsonl`, () => {
      chunkCalls[2] = (chunkCalls[2] ?? 0) + 1;
      return jsonl(
        Array.from({ length: Math.max(0, bookMeta.segments - 500) }, (_, i) => segment(500 + i)),
      );
    }),
    http.get(`${base}/Book.jsonl`, () => {
      fullBookCalls += 1;
      return new HttpResponse("full book should not be requested", { status: 500 });
    }),
  ];
}

const server = setupServer(...handlersFor("api/books/en/Author/Book"));
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  window.localStorage.clear();
  resetBookshelf();
});
afterEach(async () => {
  cleanup();
  server.resetHandlers();
  metaCalls = 0;
  chunkCalls = {};
  fullBookCalls = 0;
  const router = (await import("vue-router")) as unknown as {
    __route: { query: Record<string, unknown> };
    __push: { mockClear: () => void };
    __replace: { mockClear: () => void };
  };
  if (router.__route) router.__route.query = { page: "1" };
  if (router.__push) router.__push.mockClear();
  if (router.__replace) router.__replace.mockClear();
});

async function settle() {
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await flushPromises();
}

describe("BookPage", () => {
  it("renders the first page from meta + chunk data", async () => {
    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    expect(metaCalls).toBe(1);
    expect(chunkCalls[1]).toBe(1);
    expect(fullBookCalls).toBe(0);
    expect(screen.queryByText("Author")).toBeTruthy();
    expect(screen.queryByText("Book")).toBeTruthy();
    expect(screen.queryByText("s0")).toBeTruthy();
    expect(screen.queryByText("t0")).toBeTruthy();
    expect(screen.queryByText("s24")).toBeNull();
  });

  it("loads only the next chunk for a page beyond the first chunk", async () => {
    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = { page: "22" };
    await settle();

    expect(chunkCalls[2]).toBe(1);
    expect(chunkCalls[1]).toBe(1);
    expect(screen.queryByText("s504")).toBeTruthy();
    expect(screen.queryByText("s0")).toBeNull();
    expect(fullBookCalls).toBe(0);
  });

  it("clamps an out-of-range page and replaces the URL", async () => {
    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    const router = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
      __replace: ReturnType<typeof vi.fn>;
    };
    router.__route.query = { page: "999" };
    await settle();

    expect(router.__replace).toHaveBeenCalled();
    expect(router.__route.query.page).toBe(25);
    expect(screen.queryByText("s576")).toBeTruthy();
  });

  it("requests the encoded Cyrillic data path", async () => {
    const base =
      "api/books/ru/%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B0%D0%BD%D0%B4%D1%80%20%D0%91%D0%BB%D0%BE%D0%BA/%D0%94%D0%B2%D0%B5%D0%BD%D0%B0%D0%B4%D1%86%D0%B0%D1%82%D1%8C";
    server.use(
      ...handlersFor(base, {
        lang: "ru",
        author: "Александр Блок",
        title: "Двенадцать",
        segments: 600,
        chunkSize: 500,
        chunkCount: 2,
      }),
    );

    render(BookPage, {
      props: { lang: "ru", author: "Александр Блок", title: "Двенадцать" },
    });
    await settle();

    expect(metaCalls).toBe(1);
    expect(screen.queryByText("s0")).toBeTruthy();
  });

  it("shows an error when the book metadata is missing", async () => {
    server.use(
      http.get("api/books/en/Author/Book/meta.json", () => new HttpResponse(null, { status: 404 })),
    );
    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    expect(screen.queryByText(/not found/i)).toBeTruthy();
  });

  it("resumes at the saved page with the translations already uncovered", async () => {
    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = {};

    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    expect(screen.queryByText("s72")).toBeTruthy();
    expect(screen.queryByText("Picked up where you left off")).toBeTruthy();
    expect(screen.getByText("t72").className).not.toContain("masked");
    expect(screen.getByText("t76").className).toContain("masked");
  });

  it("adds the book to the bookshelf when the reader turns a page", async () => {
    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    const book = { lang: "en", author: "Author", title: "Book" };
    expect(useBookshelf().entryFor(book)).toBeUndefined();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = { page: "2" };
    await settle();

    expect(useBookshelf().entryFor(book)?.position).toBe(24);
  });

  it("puts the book on the shelf when the reader uncovers a translation", async () => {
    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    await fireEvent.click(screen.getByText("t0"));
    await settle();

    const entry = useBookshelf().entryFor({ lang: "en", author: "Author", title: "Book" });
    expect(entry?.revealedThrough).toBe(0);
  });

  it("restores the place on the page when the URL already names it", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 74);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = { page: "4" };

    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    expect(screen.queryByText("s72")).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalled();

    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("puts a fresh book at the top of the page", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    scrollTo.mockRestore();
  });

  it("keeps the bookmark while the reader looks at an earlier page", async () => {
    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = {};

    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();

    route.__route.query = { page: "3" };
    await settle();

    expect(
      useBookshelf().entryFor({ lang: "en", author: "Author", title: "Book" })?.position,
    ).toBe(72);
    expect(screen.getByRole("status").textContent).toContain("Bookmark on page 4");
  });

  it("returns to the bookmark on request", async () => {
    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = {};

    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();

    route.__route.query = { page: "3" };
    await settle();

    await fireEvent.click(screen.getByText("Return"));
    await settle();

    expect(route.__route.query.page).toBe(4);
    expect(screen.queryByText("s72")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("moves the bookmark when the reader chooses to stay", async () => {
    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = {};

    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();

    route.__route.query = { page: "3" };
    await settle();
    await fireEvent.click(screen.getByText("Stay here"));
    await settle();

    expect(
      useBookshelf().entryFor({ lang: "en", author: "Author", title: "Book" })?.position,
    ).toBe(48);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the bookmark when the reader jumps forward past it", async () => {
    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = {};

    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();

    route.__route.query = { page: "6" };
    await settle();

    expect(
      useBookshelf().entryFor({ lang: "en", author: "Author", title: "Book" })?.position,
    ).toBe(72);
  });

  it("starts again from the beginning on request", async () => {
    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const route = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    route.__route.query = {};

    render(BookPage, {
      props: { lang: "en", author: "Author", title: "Book" },
    });
    await settle();

    await fireEvent.click(screen.getByText("Start from the beginning"));
    await settle();

    const entry = useBookshelf().entryFor({ lang: "en", author: "Author", title: "Book" });
    expect(entry?.revealedThrough).toBe(-1);
    expect(entry?.position).toBe(0);
    expect(route.__route.query.page).toBe(1);
    expect(screen.queryByText("s0")).toBeTruthy();
    expect(screen.queryByText("s72")).toBeNull();
  });
});
