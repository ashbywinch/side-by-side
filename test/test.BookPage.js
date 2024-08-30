import { expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import BookPage from "@/pages/BookPage.vue";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createApp } from "vue";
import { flushPromises } from "@vue/test-utils";
import { render, screen } from "@testing-library/vue";

const app = createApp({});

export const handlers = [
  http.get("api/books/en/testauthor/testtitle.jsonl", () => {
    return HttpResponse.json({
      text: "Test text",
      translation: "Test translation",
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

it("should load books", async () => {
  render(BookPage, {
    props: {
      lang: "en",
      author: "TestAuthor",
      title: "TestTitle",
    },
  });
  await flushPromises();
  expect(await screen.queryByText("TestAuthor")).toBeTruthy();
  expect(await screen.queryByText("TestTitle")).toBeTruthy();
  expect(await screen.queryByText("Test text")).toBeTruthy();
  expect(await screen.queryByText("Test translation")).toBeTruthy();
});
