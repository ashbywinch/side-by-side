import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import PageOfBook from "@/components/Book/PageOfBook.vue";

function mountPage(overrides: Record<string, unknown> = {}) {
  return mount(PageOfBook, {
    props: {
      title: "Book",
      author: "Author",
      cards: [
        { text: "a", translation: "A" },
        { text: "b", translation: "B" },
        { text: "c", translation: "C" },
      ],
      page: 4,
      numPages: 5,
      firstSegment: 72,
      ...overrides,
    },
    global: {
      stubs: {
        "va-card": { template: "<div><slot /></div>" },
        "va-card-content": { template: "<div><slot /></div>" },
        PageHeader: { template: "<header />" },
        TextSnippet: { template: "<div class='snippet' />" },
      },
    },
  });
}

afterEach(() => {
  // @ts-expect-error happy-dom does not implement scrollIntoView; the test defines it.
  delete Element.prototype.scrollIntoView;
});

describe("PageOfBook viewport", () => {
  it("scrolls the segment the reader left at into view", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const wrapper = mountPage();

    (wrapper.vm as unknown as { scrollToSegment: (segment: number) => void })
      .scrollToSegment(74);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("ignores a segment that is not on the page", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const wrapper = mountPage();

    (wrapper.vm as unknown as { scrollToSegment: (segment: number) => void })
      .scrollToSegment(1);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
