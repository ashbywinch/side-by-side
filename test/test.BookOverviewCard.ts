import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import BookOverviewCard from "@/components/Index/BookOverviewCard.vue";

vi.mock("vue-router", () => ({
  RouterLink: { template: "<a><slot /></a>" },
}));

function mountCard(props: Record<string, unknown> = {}) {
  return mount(BookOverviewCard, {
    props: {
      lang: "ru",
      title: "Анна Каренина",
      author: "Лев Толстой",
      level: "C2",
      size: "large",
      words: 271975,
      ...props,
    },
  });
}

describe("BookOverviewCard", () => {
  it("says how far the reader got, in words a person uses", () => {
    const wrapper = mountCard({ progress: 0.26 });
    expect(wrapper.text()).toContain("26% read");
  });

  // The bar alone, three pixels on an edge, reads as a rendering artefact.
  it("keeps the bar and labels it as well", () => {
    const wrapper = mountCard({ progress: 0.26 });
    expect(wrapper.find('[role="progressbar"]').attributes("aria-valuenow")).toBe("26");
    expect(wrapper.text()).toContain("26% read");
  });

  it("says nothing about progress for a book that has not been read", () => {
    const wrapper = mountCard({ progress: null });
    expect(wrapper.text()).not.toContain("% read");
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
  });

  it("marks a finished book without a percentage", () => {
    const wrapper = mountCard({ progress: 1, finished: true });
    expect(wrapper.text()).not.toContain("100% read");
    expect(wrapper.text()).toContain("Finished");
  });

  // A 7rem tile cannot hold "271975 words" without spilling out of the card.
  it("abbreviates the word count on the portrait tile", () => {
    const portrait = mountCard({ portrait: true });
    expect(portrait.text()).toContain("272k words");

    const wide = mountCard();
    expect(wide.text()).toContain("271975 words");
  });

  it("keeps the exact count on a portrait tile below a thousand words", () => {
    const wrapper = mountCard({ portrait: true, words: 517 });
    expect(wrapper.text()).toContain("517 words");
  });
});
