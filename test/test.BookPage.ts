import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { flushPromises } from "@vue/test-utils";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/vue";

import { swipe, touchEnd, touchMove, touchStart } from "./helpers/touch";

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
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => ({ cancel: vi.fn(), playState: "running", finished: Promise.resolve() })),
  });
});
afterEach(async () => {
  cleanup();
  server.resetHandlers();
  vi.unstubAllGlobals();
  delete (Element.prototype as { animate?: unknown }).animate;
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

/**
 * Wait for the post-turn URL sync, which deliberately follows the row. Poll
 * rather than sleep a fixed time: the row is 360ms plus a paint, and a loaded
 * CI runner must not turn that into a flaky failure.
 */
async function settleUrl(expected: number) {
  const router = (await import("vue-router")) as unknown as {
    __route: { query: Record<string, unknown> };
  };
  await vi.waitFor(
    () => expect(Number(router.__route.query.page)).toBe(expected),
    { timeout: 3000, interval: 20 },
  );
  await settle();
}

/** Give the turn more than enough time to (wrongly) sync, without polling. */
async function pastUrlSync() {
  await new Promise((resolve) => setTimeout(resolve, 900));
  await settle();
}

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
    expect(screen.getByText(/translations are hidden/i)).toBeTruthy();
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
    expect(screen.queryByText(/translations are hidden/i)).toBeNull();
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
    expect(screen.getByText("t0").className).not.toContain("masked");
    expect(screen.queryByText(/translations are hidden/i)).toBeNull();
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

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
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

describe("BookPage page turns", () => {
  function reader(): HTMLElement {
    const element = document.querySelector(".reader");
    if (!element) throw new Error("the reader surface is missing");
    return element as HTMLElement;
  }

  async function routeState() {
    return (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
      __push: ReturnType<typeof vi.fn>;
    };
  }

  async function mountBook() {
    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();
  }

  it("turns forward on a left swipe and back on a right swipe", async () => {
    await mountBook();
    const router = await routeState();

    swipe(reader(), [300, 400], [200, 400]);
    await settle();
    expect(router.__route.query.page).toBe("1");
    await settleUrl(2);
    expect(router.__route.query.page).toBe(2);
    expect(screen.queryByText("s24")).toBeTruthy();

    swipe(reader(), [200, 400], [300, 400]);
    await settleUrl(1);
    expect(router.__route.query.page).toBe(1);
  });

  it("does not go back from the first page", async () => {
    await mountBook();
    const router = await routeState();

    swipe(reader(), [200, 400], [300, 400]);
    await settle();

    await pastUrlSync();
    expect(Number(router.__route.query.page)).toBe(1);
    expect(router.__push).not.toHaveBeenCalled();
  });

  it("turns on a margin click and stops at the ends of the book", async () => {
    await mountBook();
    const router = await routeState();

    await fireEvent.click(screen.getByLabelText("Next page"));
    await settleUrl(2);
    expect(router.__route.query.page).toBe(2);

    await fireEvent.click(screen.getByLabelText("Previous page"));
    await settleUrl(1);
    expect(router.__route.query.page).toBe(1);
    expect(router.__push).toHaveBeenCalledTimes(2);

    // Nothing left to turn to: no turn, and therefore no URL sync.
    await fireEvent.click(screen.getByLabelText("Previous page"));
    await pastUrlSync();
    expect(router.__route.query.page).toBe(1);
    expect(router.__push).toHaveBeenCalledTimes(2);
  });

  it("ignores a vertical drag", async () => {
    await mountBook();
    const router = await routeState();
    const element = reader();

    touchStart(element, 300, 200);
    touchMove(element, 290, 300);
    touchEnd(element, 200, 400);
    await settle();

    expect(Number(router.__route.query.page)).toBe(1);
  });

  it("turns with the arrow keys", async () => {
    await mountBook();
    const router = await routeState();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }));
    await settleUrl(2);
    expect(router.__route.query.page).toBe(2);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true }));
    await settleUrl(1);
    expect(router.__route.query.page).toBe(1);
  });

  it("does not reveal a translation when the swipe ends on it", async () => {
    await mountBook();
    const element = reader();
    const translation = screen.getByText("t0");

    swipe(element, [300, 400], [200, 400]);
    await fireEvent.click(translation);
    await settle();

    const entry = useBookshelf().entryFor({ lang: "en", author: "Author", title: "Book" });
    expect(entry?.revealedThrough).toBe(-1);
    expect(within(reader()).queryByText("t0")).toBeNull();
  });

  it("records the lesson as learned only when a swipe or a margin click turns the page", async () => {
    await mountBook();

    await fireEvent.click(screen.getByLabelText("Next page"));
    await settle();
    expect(JSON.parse(window.localStorage.getItem("sbs:page-turn-hint:v1") ?? "{}").turned).toBe(true);

    window.localStorage.clear();
    resetBookshelf();
    cleanup();
    await mountBook();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }));
    await settle();
    expect(JSON.parse(window.localStorage.getItem("sbs:page-turn-hint:v1") ?? "{}").turned).not.toBe(true);
  });

  it("teaches the turn on a fresh book and on a book with history", async () => {
    vi.useFakeTimers();
    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();

      expect(screen.queryByText("s0")).toBeTruthy();
      expect(document.querySelector(".turn-hint")).toBeNull();

      await vi.advanceTimersByTimeAsync(1200);
      await flushPromises();
      expect(document.querySelector(".turn-hint")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }

    cleanup();
    resetBookshelf();
    window.localStorage.clear();

    const store = createBookshelf({ storage: window.localStorage, debounceMs: 0 });
    store.reveal({ lang: "en", author: "Author", title: "Book", segments: SEGMENTS }, 75, 72);
    store.flush();
    store.dispose();
    resetBookshelf();

    const router = await routeState();
    router.__route.query = {};

    vi.useFakeTimers();
    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();

      expect(screen.queryByText("s72")).toBeTruthy();
      await vi.advanceTimersByTimeAsync(1200);
      await flushPromises();
      expect(document.querySelector(".turn-hint")).not.toBeNull();
    } finally {
      vi.useRealTimers();
      router.__route.query = { page: "1" };
    }
  });
});

describe("BookPage page transition", () => {
  const cardRect = {
    left: 40,
    top: -120,
    width: 800,
    height: 4000,
    right: 840,
    bottom: 3880,
    x: 40,
    y: -120,
    toJSON: () => ({}),
  } as DOMRect;
  const emptyRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
  const textRect = {
    left: 352,
    top: 0,
    width: 736,
    height: 2000,
    right: 1088,
    bottom: 2000,
    x: 352,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
  const originalRect = Element.prototype.getBoundingClientRect;
  const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");

  beforeEach(() => {
    Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
      const element = this as HTMLElement;
      if (element.classList?.contains("page")) return cardRect;
      if (element.classList?.contains("text")) return textRect;
      return emptyRect;
    };
    Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 1440 });
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalRect;
    if (originalClientWidth) {
      Object.defineProperty(document.documentElement, "clientWidth", originalClientWidth);
    }
  });

  it("freezes the outgoing page and wipes it aside while the next page is revealed", async () => {
    vi.useFakeTimers();
    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();

      await fireEvent.click(screen.getByLabelText("Next page"));
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();

      const ghost = document.querySelector(".page-ghost") as HTMLElement;
      expect(ghost.childElementCount).toBe(1);
      expect(ghost.firstElementChild?.textContent).toContain("s0");
      expect(ghost.classList.contains("page-ghost--out")).toBe(true);

      await vi.advanceTimersByTimeAsync(500);
      expect(ghost.childElementCount).toBe(0);
      expect(ghost.classList.contains("page-ghost--out")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("turns without a slide when the reader prefers reduced motion", async () => {
    const originalMatchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );

    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await settle();

      await fireEvent.click(screen.getByLabelText("Next page"));
      await settle();

      const ghost = document.querySelector(".page-ghost") as HTMLElement;
      expect(Number(((await import("vue-router")) as unknown as { __route: { query: Record<string, unknown> } }).__route.query.page)).toBe(2);
      expect(ghost.childElementCount).toBe(0);
      expect(ghost.className).toBe("page-ghost");
    } finally {
      vi.mocked(window.matchMedia).mockRestore();
      window.matchMedia = originalMatchMedia;
    }
  });

  it("can force the lesson from the URL, even after the device has learned it", async () => {
    window.localStorage.setItem(
      "sbs:page-turn-hint:v1",
      JSON.stringify({ version: 1, shown: 3, turned: true }),
    );
    const router = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    router.__route.query = { page: "1", "turn-hint": "1" };

    vi.useFakeTimers();
    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();

      expect(document.querySelector(".turn-hint")).toBeNull();
      await vi.advanceTimersByTimeAsync(1200);
      await flushPromises();
      expect(document.querySelector(".turn-hint")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("can show the laptop click hint on a touch device through the URL", async () => {
    const router = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    router.__route.query = { page: "1", "turn-hint": "click" };

    vi.useFakeTimers();
    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();
      await vi.advanceTimersByTimeAsync(1200);
      await flushPromises();

      expect(document.querySelector(".turn-hint__mouse")).not.toBeNull();
      expect(document.querySelector(".turn-hint__hand")).toBeNull();
      expect(document.querySelector(".reader--hint-next")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the swipe hint with hint motion when the URL forces it", async () => {
    const router = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    router.__route.query = { page: "1", "turn-hint": "swipe" };

    vi.useFakeTimers();
    try {
      render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
      await flushPromises();
      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();
      await vi.advanceTimersByTimeAsync(1200);
      await flushPromises();

      expect(document.querySelector(".turn-hint__hand")).not.toBeNull();
      expect(document.querySelector(".turn-hint__mouse")).toBeNull();
      const hintPeek = document.querySelector(".page-peek--hint") as HTMLElement;
      expect(hintPeek).not.toBeNull();
      expect(hintPeek.classList.contains("page-peek--next")).toBe(true);
      expect(hintPeek.style.width).toBe("800px");
      expect(hintPeek.style.left).toBe("1480px");
      const live = document.querySelector(".reader") as HTMLElement;
      expect(live.classList.contains("reader--hint-next")).toBe(true);

      await vi.advanceTimersByTimeAsync(2000);
      expect(live.classList.contains("reader--hint-next")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("moves the page with the finger and completes the turn on release", async () => {
    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();

    const live = document.querySelector(".reader") as HTMLElement;
    touchStart(live, 300, 400);
    touchMove(live, 250, 400);
    await flushPromises();

    expect(live.style.transform).toContain("translateX(-50px)");
    const peek = document.querySelector(".page-peek--next") as HTMLElement;
    expect(peek).not.toBeNull();
    expect(peek.style.width).toBe("800px");
    expect(peek.style.left).toBe("1430px");
    // Aligned to the page's document top, not the viewport: the turn scrolls
    // to the top, and an unaligned peek loses its top edge at the release.
    expect(peek.style.top).toBe("-120px");

    touchMove(live, 220, 400);
    await flushPromises();
    expect(live.style.transform).toContain("translateX(-80px)");
    expect(peek.style.left).toBe("1400px");

    touchEnd(live, 220, 400);
    await settle();

    const router = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    expect(document.querySelector(".page-peek")).toBeNull();
    expect(live.classList.contains("reader--turn-next")).toBe(true);
    expect(live.style.transform).toBe("");
    expect(document.querySelector(".page")?.classList.contains("page--turn-in")).toBe(true);
    // The row runs first; the URL follows once it has finished.
    expect(Number(router.__route.query.page)).toBe(1);
    await settleUrl(2);
    expect(Number(router.__route.query.page)).toBe(2);
  });

  it("springs back when the drag is short and slow", async () => {
    render(BookPage, { props: { lang: "en", author: "Author", title: "Book" } });
    await settle();

    const live = document.querySelector(".reader") as HTMLElement;
    touchStart(live, 300, 400);
    touchMove(live, 280, 400);
    await flushPromises();

    expect(live.style.transform).toContain("translateX(-20px)");
    const peek = document.querySelector(".page-peek--next") as HTMLElement;
    expect(peek.style.width).toBe("800px");
    expect(peek.style.left).toBe("1460px");

    touchEnd(live, 280, 400);
    await settle();
    await new Promise((resolve) => setTimeout(resolve, 260));

    const router = (await import("vue-router")) as unknown as {
      __route: { query: Record<string, unknown> };
    };
    expect(Number(router.__route.query.page)).toBe(1);
    expect(document.querySelector(".page-peek")).toBeNull();
    expect(live.style.transform).toBe("");
  });
});
