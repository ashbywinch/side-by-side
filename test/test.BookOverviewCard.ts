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
  // Progress is a bar on the card's bottom edge and nothing else: no
  // percentage, which would claim a precision our pagination does not have.
  it("shows how far the reader got as a bar, without a number", () => {
    const wrapper = mountCard({ progress: 0.26 });
    expect(wrapper.find('[role="progressbar"]').attributes("aria-valuenow")).toBe("26");
    expect(wrapper.text()).not.toContain("% read");
  });

  it("says nothing about progress for a book that has not been read", () => {
    const wrapper = mountCard({ progress: null });
    expect(wrapper.text()).not.toContain("% read");
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
  });

  it("shows a finished book as a full bar and no label", () => {
    const wrapper = mountCard({ progress: 1 });
    expect(wrapper.find('[role="progressbar"]').attributes("aria-valuenow")).toBe("100");
    expect(wrapper.text()).not.toContain("Finished");
  });

  // A 7rem tile cannot hold "271975 words" without spilling out of the card.
  it("abbreviates the word count on the portrait tile", () => {
    const portrait = mountCard({ portrait: true });
    expect(portrait.html()).toContain('text="272k words"');

    const wide = mountCard();
    expect(wide.html()).toContain('text="271975 words"');
  });

  it("keeps the exact count on a portrait tile below a thousand words", () => {
    const wrapper = mountCard({ portrait: true, words: 517 });
    expect(wrapper.html()).toContain('text="517 words"');
  });
});
