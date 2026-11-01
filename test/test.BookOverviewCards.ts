import { expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import IndexPage from "@/pages/Index/IndexPage.vue";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createApp } from "vue";
import { flushPromises } from "@vue/test-utils";
import { fireEvent, render, screen } from "@testing-library/vue";

createApp({});

const booksJsonl = `{"title":"Test title","author":"Test author 1","Word Count":20,"size":"small","Vocab Level":"A1","lang":"en"}
{"title": "Test title 2", "author": "Test author 2", "Word Count": 20, "size": "medium", "Vocab Level": "B2", "lang": "en"}
{"title": "Test title 3", "author": "Test author 3", "Word Count": 20, "size": "large", "Vocab Level": "C2", "lang": "en"}
{"title": "Test title 4", "author": "Test author 4", "Word Count": 20, "size": "small", "Vocab Level": 2, "lang": "en"}`;

export const handlers = [
  http.get("api/books/en/index.jsonl", () => {
    return new HttpResponse(booksJsonl, {
      headers: {
        "Content-Type": "application/jsonl",
      },
    });
  }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

afterEach(() => {
  vi.clearAllMocks();
});

const mockRoutePush = vi.fn();
vi.mock("vue-router", async () => {
  return {
    RouterView: {},
    RouterLink: {},
    useRouter: () => {
      return {
        push: mockRoutePush,
      };
    },
    useRoute: () => {
      return {
        query: { page: 1 },
      };
    },
  };
});

it("should load index", async () => {
  const { container } = render(IndexPage, {
    props: {
      lang: "en",
    },
  });
  await flushPromises();

  expect(await screen.queryByText("Test author 1")).toBeTruthy();
  expect(await screen.queryByText("Test title")).toBeTruthy();
  expect(container.innerHTML).toContain('text="Unrated"');
  expect(container.innerHTML).not.toContain('text="2"');
});

it("collapses the filters behind a results bar until asked", async () => {
  const { container } = render(IndexPage, {
    props: {
      lang: "en",
    },
  });
  await flushPromises();

  expect(container.querySelectorAll("va-select")).toHaveLength(0);
  expect(screen.getByText("4 books")).toBeTruthy();

  await fireEvent.click(screen.getByText("Filters"));
  await flushPromises();

  expect(container.querySelectorAll("va-select")).toHaveLength(3);
});

it("uses the same filter bar in every shelf layout", async () => {
  const layouts: Array<[string, boolean]> = [
    ["section", false],
    ["rail", false],
    ["rail", true],
  ];
  const bars: Array<string | null> = [];
  for (const [shelfLayout, portrait] of layouts) {
    const { container } = render(IndexPage, {
      props: { lang: "en", shelfLayout, portrait },
    });
    await flushPromises();
    bars.push(container.querySelector(".results-bar")?.outerHTML ?? null);
  }

  expect(bars[0]).toBeTruthy();
  expect(bars[0]).toBe(bars[1]);
  expect(bars[1]).toBe(bars[2]);
});
