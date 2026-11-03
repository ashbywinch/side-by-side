import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import PageTurnTargets from "@/components/Book/PageTurnTargets.vue";

function mountTargets(overrides: Record<string, unknown> = {}) {
  return mount(PageTurnTargets, {
    props: {
      previous: 352,
      next: 352,
      canPrevious: true,
      canNext: true,
      ...overrides,
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("page turn targets", () => {
  it("offers a labelled control for each margin", () => {
    const wrapper = mountTargets();

    expect(wrapper.get('[aria-label="Previous page"]').isVisible()).toBe(true);
    expect(wrapper.get('[aria-label="Next page"]').isVisible()).toBe(true);
  });

  it("turns forward and back on a margin click", async () => {
    const wrapper = mountTargets();

    await wrapper.get('[aria-label="Next page"]').trigger("click");
    await wrapper.get('[aria-label="Previous page"]').trigger("click");

    expect(wrapper.emitted("turn")).toEqual([["next"], ["previous"]]);
  });

  it("hides a margin that is too narrow to be a target", () => {
    const wrapper = mountTargets({ previous: null, next: null });
    const previous = wrapper.get('[aria-label="Previous page"]').element as HTMLElement;
    const next = wrapper.get('[aria-label="Next page"]').element as HTMLElement;

    expect(previous.style.display).toBe("none");
    expect(next.style.display).toBe("none");
    expect(wrapper.emitted("turn")).toBeUndefined();
  });

  it("does not turn past either end of the book", async () => {
    const wrapper = mountTargets({ canPrevious: false, canNext: false });

    expect(wrapper.get('[aria-label="Previous page"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[aria-label="Next page"]').attributes("disabled")).toBeDefined();
    expect(wrapper.emitted("turn")).toBeUndefined();
  });

  it("leaves a modified click to the browser", async () => {
    const wrapper = mountTargets();

    await wrapper.get('[aria-label="Next page"]').trigger("click", { metaKey: true });
    await wrapper.get('[aria-label="Next page"]').trigger("click", { ctrlKey: true });
    await wrapper.get('[aria-label="Next page"]').trigger("click", { shiftKey: true });
    await wrapper.get('[aria-label="Next page"]').trigger("click", { altKey: true });

    expect(wrapper.emitted("turn")).toBeUndefined();
  });

  it("does not turn while the reader is clearing a selection", async () => {
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "выделенный текст" } as unknown as Selection);
    const wrapper = mountTargets();

    await wrapper.get('[aria-label="Next page"]').trigger("click");

    expect(wrapper.emitted("turn")).toBeUndefined();
  });
});
