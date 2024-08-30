import { expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import IndexPage from "@/pages/IndexPage.vue";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createApp } from "vue";
import { flushPromises } from "@vue/test-utils";
import { render, screen } from "@testing-library/vue";

createApp({});

export const handlers = [
  http.get("api/books/en/index.jsonl", () => {
    return HttpResponse.json({
      title: "Test title",
      author: "Test author",
      "Word Count": "20",
      size: "small",
      level: "B2",
      lang: "en",
    });
  }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

const mockRoutePush = vi.fn();
vi.mock("vue-router", async () => {
  return {
    RouterView: {},
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
  render(IndexPage, {
    props: {
      lang: "en",
    },
  });
  await flushPromises();

  expect(await screen.queryByText("Test author")).toBeTruthy();
  expect(await screen.queryByText("Test title")).toBeTruthy();
});
