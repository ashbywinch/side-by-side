import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import PageTurnHint from "@/components/Book/PageTurnHint.vue";

function mountHint(overrides: Record<string, unknown> = {}) {
  return mount(PageTurnHint, {
    props: {
      previous: 352,
      next: 352,
      visible: true,
      coarse: false,
      ...overrides,
    },
  });
}

describe("page turn hint", () => {
  it("stays out of the page until it is shown", () => {
    const wrapper = mountHint({ visible: false });
    expect(wrapper.find(".turn-hint").exists()).toBe(false);
  });

  it("is decorative: hidden from assistive tech and the pointer", () => {
    const wrapper = mountHint();
    expect(wrapper.get(".turn-hint").attributes("aria-hidden")).toBe("true");
  });

  it("teaches a swipe with hint motion and a short caption, not a click target", () => {
    const wrapper = mountHint({ coarse: true });

    expect(wrapper.get(".turn-hint__hand").text()).toBe("touch_app");
    expect(wrapper.get(".turn-hint__caption").text()).toBe("Swipe left for the next page");
    expect(wrapper.find(".turn-hint__mouse").exists()).toBe(false);
    expect(wrapper.findAll(".turn-hint__target")).toHaveLength(0);
  });

  it("teaches the margin with a cursor and words together, and lights the targets", () => {
    const wrapper = mountHint();

    expect(wrapper.get(".turn-hint__mouse").text()).toBe("mouse");
    expect(wrapper.get(".turn-hint__label").text()).toBe("Click the margin to turn the page");
    expect(wrapper.find(".turn-hint__hand").exists()).toBe(false);

    const targets = wrapper.findAll(".turn-hint__target");
    expect(targets).toHaveLength(2);
    expect((targets[0].element as HTMLElement).style.width).toBe("352px");
    expect((targets[1].element as HTMLElement).style.width).toBe("352px");
  });

  it("only lights the margins the reader can actually use", () => {
    const atTheEnd = mountHint({ next: null });
    expect(atTheEnd.findAll(".turn-hint__target")).toHaveLength(1);
    expect(atTheEnd.find(".turn-hint__target--previous").exists()).toBe(true);

    const atTheStart = mountHint({ previous: null });
    expect(atTheStart.findAll(".turn-hint__target")).toHaveLength(1);
    expect(atTheStart.find(".turn-hint__target--next").exists()).toBe(true);
  });

  it("does not teach a forward swipe when there is no next page", () => {
    const wrapper = mountHint({ coarse: true, next: null, previous: 352 });
    expect(wrapper.find(".turn-hint").exists()).toBe(false);
  });
});
