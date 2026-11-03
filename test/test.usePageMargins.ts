import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";

import { usePageMargins } from "@/components/Book/usePageMargins";

let rect = { left: 352, right: 1088 };
const originalRect = Element.prototype.getBoundingClientRect;
const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");

const Harness = defineComponent({
  setup() {
    const content = ref<HTMLElement | null>(null);
    const { previous, next } = usePageMargins(content);
    return { content, previous, next };
  },
  template: `<div><div ref="content" class="content" /></div>`,
});

const ReaderHarness = defineComponent({
  setup() {
    const content = ref<HTMLElement | null>(null);
    const reader = ref<HTMLElement | null>(null);
    const { previous, next } = usePageMargins(content, reader);
    return { content, reader, previous, next };
  },
  template: `<div ref="reader" class="reader"><div ref="content" class="content" /></div>`,
});

beforeEach(() => {
  rect = { left: 352, right: 1088 };
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 1440 });
  Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
    if ((this as HTMLElement).classList?.contains("content")) {
      return { ...rect, top: 0, bottom: 0, width: rect.right - rect.left, height: 0, x: rect.left, y: 0 } as DOMRect;
    }
    return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 } as DOMRect;
  };
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect;
  if (originalClientWidth) Object.defineProperty(document.documentElement, "clientWidth", originalClientWidth);
  vi.unstubAllGlobals();
});

describe("usePageMargins", () => {
  it("measures both margins around the text", () => {
    const wrapper = mount(Harness);
    expect(wrapper.vm.previous).toBe(352);
    expect(wrapper.vm.next).toBe(352);
  });

  it("re-measures when the window resizes", async () => {
    const wrapper = mount(Harness);
    rect = { left: 28, right: 362 };
    Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 390 });
    window.dispatchEvent(new Event("resize"));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.previous).toBe(28);
    expect(wrapper.vm.next).toBe(28);
  });

  it("ignores a transform on the reader when measuring", () => {
    const original = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
      if ((element as HTMLElement).classList?.contains("reader")) {
        return { transform: "matrix(1, 0, 0, 1, 240, 0)" } as CSSStyleDeclaration;
      }
      return original(element);
    });

    const wrapper = mount(ReaderHarness);

    expect(wrapper.vm.previous).toBe(112);
    expect(wrapper.vm.next).toBe(592);
    vi.mocked(window.getComputedStyle).mockRestore();
  });
});
