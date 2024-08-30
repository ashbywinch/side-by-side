import { expect, it, beforeAll, afterAll, afterEach } from "vitest";
import BookOverviewCards from "@/components/BookOverviewCards.vue";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createApp } from "vue";
import { flushPromises } from "@vue/test-utils";
import { render, screen } from "@testing-library/vue";

const app = createApp({});

export const handlers = [
  http.get("api/books/en/index.jsonl", () => {
    return HttpResponse.json({
      title: "Test title",
      author: "Test author",
      "Word Count": "20",
    });
  }),
];
/*
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
*/
it("should load index", async () => {
  render(BookOverviewCards, {
    props: {
      books: [
        {
          title: "Test title",
          author: "Test author",
          "Word Count": 20,
          size: "small",
          level: "B2",
          lang: "en",
        },
      ],
    },
  });
  await flushPromises();

  expect(await screen.queryByText("Test author")).toBeTruthy();
  expect(await screen.queryByText("Test title")).toBeTruthy();
});
