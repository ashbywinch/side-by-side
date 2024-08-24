import { expect, it, beforeAll, afterAll, afterEach } from "vitest";
import BookView from "@/components/BookView.vue";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { setActivePinia, createPinia } from "pinia";
import { createApp } from "vue";
import { flushPromises } from "@vue/test-utils";
import { render, screen } from "@testing-library/vue";

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

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

it("should load books", async () => {
  render(BookView, {
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
