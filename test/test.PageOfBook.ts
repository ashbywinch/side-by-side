import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import PageOfBook from "@/components/Book/PageOfBook.vue";

function mountPage(cards: Array<Record<string, unknown>> = []) {
  return mount(PageOfBook, {
    props: {
      title: "Book",
      author: "Author",
      cards,
      page: 1,
      numPages: 1,
    },
    global: {
      stubs: {
        "va-card": { template: "<div><slot /></div>" },
        "va-card-content": { template: "<div><slot /></div>" },
        PageHeader: { template: "<header />" },
        TextSnippet: {
          props: ["text", "translation", "showTranslation"],
          template: "<div class='snippet'>{{ text }}|{{ translation }}</div>",
        },
      },
    },
  });
}

describe("PageOfBook", () => {
  it("removes its keyboard listener when unmounted", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const wrapper = mountPage();
    wrapper.unmount();

    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function), true);
    remove.mockRestore();
  });

  it("marks the text region busy while a page is loading", () => {
    const wrapper = mount(PageOfBook, {
      props: {
        title: "Book",
        author: "Author",
        cards: [],
        page: 1,
        numPages: 2,
        loading: true,
      },
      global: {
        stubs: {
          "va-card": { template: "<div><slot /></div>" },
          "va-card-content": { template: "<div><slot /></div>" },
          PageHeader: { template: "<header />" },
          TextSnippet: { template: "<div />" },
        },
      },
    });

    expect(wrapper.find(".text").attributes("aria-busy")).toBe("true");
  });

  it("uses stable keys for equal-offset segments", () => {
    const warn = vi.spyOn(console, "warn");
    mountPage([
      { text: "a", translation: "A", start: 10 },
      { text: "b", translation: "B", start: 10 },
    ]);

    const duplicateKeyWarnings = warn.mock.calls.filter((call) =>
      String(call[0]).includes("Duplicate keys"),
    );
    expect(duplicateKeyWarnings).toEqual([]);
    warn.mockRestore();
  });

  it("resets the translation reveal when the page changes", async () => {
    const Snippet = {
      props: ["text", "translation", "showTranslation"],
      emits: ["translation-clicked"],
      template: `<button class="snippet" @click="$emit('translation-clicked')">{{ showTranslation ? 'shown' : 'hidden' }}</button>`,
    };
    const wrapper = mount(PageOfBook, {
      props: {
        title: "Book",
        author: "Author",
        cards: [
          { text: "a", translation: "A", start: 0 },
          { text: "b", translation: "B", start: 1 },
        ],
        page: 1,
        numPages: 2,
      },
      global: {
        stubs: {
          "va-card": { template: "<div><slot /></div>" },
          "va-card-content": { template: "<div><slot /></div>" },
          PageHeader: { template: "<header />" },
          TextSnippet: Snippet,
        },
      },
    });

    await wrapper.findAll(".snippet")[0].trigger("click");
    expect(wrapper.findAll(".snippet")[0].text()).toBe("shown");

    await wrapper.setProps({ page: 2 });
    expect(wrapper.findAll(".snippet")[0].text()).toBe("hidden");
  });
});
