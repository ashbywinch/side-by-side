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
    global: { stubs: { "va-icon": { template: "<span class='icon' />" } } },
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

  // The count is the number a reader uses to judge length, so it is exact.
  it("shows the exact word count", () => {
    expect(mountCard().html()).toContain('text="271975 words"');
    expect(mountCard({ words: 517 }).html()).toContain('text="517 words"');
  });

  it("offers a remove control instead of a link in edit mode", () => {
    const wrapper = mountCard({ editing: true });
    const remove = wrapper.find(".remove");

    expect(wrapper.find(".tile").element.tagName).toBe("DIV");
    expect(remove.attributes("aria-label")).toBe(
      "Remove Анна Каренина from your shelf",
    );
    expect(wrapper.find(".remove__disc").exists()).toBe(true);
  });

  it("overlays the remove control instead of adding a row to the card", () => {
    const wrapper = mountCard({ editing: true });
    const remove = wrapper.find(".remove");

    expect(wrapper.find(".remove-row").exists()).toBe(false);
    expect(remove.element.parentElement?.classList.contains("tile")).toBe(true);
    expect(remove.element.closest(".va-card-content")).toBeNull();
  });

  it("shows no remove control outside edit mode", () => {
    expect(mountCard().find(".remove-row").exists()).toBe(false);
  });
});
