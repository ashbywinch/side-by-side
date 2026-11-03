import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, ref, type Ref } from "vue";

import { CLICK_GUARD_MS, usePageTurning } from "@/components/Book/usePageTurning";

let onTurn: ReturnType<typeof vi.fn>;
let onDragStart: ReturnType<typeof vi.fn>;
let onDrag: ReturnType<typeof vi.fn>;
let onDragEnd: ReturnType<typeof vi.fn>;
let allow: Ref<boolean>;
let wrapper: VueWrapper | null = null;

const Harness = defineComponent({
  setup() {
    const target = ref<HTMLElement | null>(null);
    usePageTurning({
      target,
      canTurn: () => allow.value,
      onTurn: (turn, source) => onTurn(turn, source),
      onDragStart: () => onDragStart(),
      onDrag: (turn, distance, available) => onDrag(turn, distance, available),
      onDragEnd: (turn, distance, commit) => onDragEnd(turn, distance, commit),
    });
    return { target };
  },
  template: `<div ref="target" class="reader"><button class="inside">inside</button><button class="turn-target">target</button><input class="field" /></div>`,
});

function mountHarness(): VueWrapper {
  wrapper = mount(Harness, { attachTo: document.body });
  return wrapper;
}

function touch(element: Element, x: number, y: number): Touch {
  return new Touch({ identifier: 1, target: element, clientX: x, clientY: y });
}

function start(element: Element, x: number, y: number): void {
  const from = touch(element, x, y);
  element.dispatchEvent(
    new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [from], changedTouches: [from] }),
  );
}

function move(element: Element, x: number, y: number): void {
  const to = touch(element, x, y);
  element.dispatchEvent(
    new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [to], changedTouches: [to] }),
  );
}

function end(element: Element, x: number, y: number): void {
  const to = touch(element, x, y);
  element.dispatchEvent(
    new TouchEvent("touchend", {
      bubbles: true,
      cancelable: true,
      touches: [],
      changedTouches: [to],
    }),
  );
}

function swipe(wrapper: VueWrapper, from: [number, number], to: [number, number]): void {
  const element = wrapper.element;
  start(element, from[0], from[1]);
  move(element, to[0], to[1]);
  end(element, to[0], to[1]);
}

beforeEach(() => {
  vi.useFakeTimers();
  allow = ref(true);
  onTurn = vi.fn();
  onDragStart = vi.fn();
  onDrag = vi.fn();
  onDragEnd = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = "";
});

describe("swipe turning", () => {
  it("turns forward on a left swipe and back on a right one", () => {
    const wrapper = mountHarness();

    swipe(wrapper, [300, 400], [200, 402]);
    swipe(wrapper, [200, 400], [300, 398]);

    expect(onTurn.mock.calls).toEqual([
      ["next", "swipe"],
      ["previous", "swipe"],
    ]);
  });

  it("tracks the finger 1:1 before committing on release", () => {
    const wrapper = mountHarness();

    start(wrapper.element, 300, 400);
    move(wrapper.element, 250, 400);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenLastCalledWith("next", 50, true);

    move(wrapper.element, 200, 400);
    expect(onDrag).toHaveBeenLastCalledWith("next", 100, true);

    end(wrapper.element, 200, 400);
    expect(onDragEnd).toHaveBeenCalledWith("next", 100, true);
    expect(onTurn).toHaveBeenCalledWith("next", "swipe");
  });

  it("settles back after a short drag", () => {
    const wrapper = mountHarness();

    start(wrapper.element, 300, 400);
    move(wrapper.element, 270, 400);
    end(wrapper.element, 270, 400);

    expect(onDrag).toHaveBeenLastCalledWith("next", 30, true);
    expect(onDragEnd).toHaveBeenCalledWith("next", 30, false);
    expect(onTurn).not.toHaveBeenCalled();
  });

  it("resists a direction the book does not have", () => {
    allow.value = false;
    const wrapper = mountHarness();

    start(wrapper.element, 300, 400);
    move(wrapper.element, 200, 400);
    end(wrapper.element, 200, 400);

    expect(onDrag).toHaveBeenLastCalledWith("next", 100, false);
    expect(onDragEnd).toHaveBeenCalledWith("next", 100, false);
    expect(onTurn).not.toHaveBeenCalled();
  });

  it("ignores a short drag, a vertical drag and a two-finger gesture", () => {
    const wrapper = mountHarness();

    swipe(wrapper, [300, 400], [280, 400]);
    swipe(wrapper, [300, 200], [260, 380]);

    const from = touch(wrapper.element, 300, 400);
    const second = new Touch({ identifier: 2, target: wrapper.element, clientX: 320, clientY: 400 });
    wrapper.element.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        touches: [from, second],
        changedTouches: [from, second],
      }),
    );
    end(wrapper.element, 200, 400);

    expect(onTurn).not.toHaveBeenCalled();
  });

  it("cancels a drag that becomes a scroll", () => {
    const wrapper = mountHarness();
    start(wrapper.element, 300, 400);
    move(wrapper.element, 290, 470);
    end(wrapper.element, 200, 500);

    expect(onTurn).not.toHaveBeenCalled();
  });

  it("does not start from a button or a field", () => {
    const wrapper = mountHarness();
    const button = wrapper.get("button.inside").element;

    start(button, 300, 400);
    end(wrapper.element, 200, 400);

    expect(onTurn).not.toHaveBeenCalled();
  });

  it("can start a swipe on a page-turn margin target", () => {
    const wrapper = mountHarness();
    const target = wrapper.get(".turn-target").element;

    start(target, 300, 400);
    move(target, 250, 400);
    move(target, 200, 400);
    end(target, 200, 400);

    expect(onTurn).toHaveBeenCalledWith("next", "swipe");
  });

  it("does nothing at the end of the book", () => {
    allow.value = false;
    const wrapper = mountHarness();
    swipe(wrapper, [300, 400], [200, 400]);

    expect(onTurn).not.toHaveBeenCalled();
  });

  it("swallows the click the browser sends after a swipe, then lets clicks through", () => {
    const wrapper = mountHarness();
    const clicked = vi.fn();
    wrapper.element.addEventListener("click", clicked);

    swipe(wrapper, [300, 400], [200, 400]);
    wrapper.element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicked).not.toHaveBeenCalled();

    vi.advanceTimersByTime(CLICK_GUARD_MS);
    wrapper.element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicked).toHaveBeenCalledTimes(1);
  });
});

describe("keyboard turning", () => {
  it("turns with the arrow keys", () => {
    mountHarness();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true }));

    expect(onTurn.mock.calls).toEqual([
      ["next", "key"],
      ["previous", "key"],
    ]);
  });

  it("ignores modified keys, other keys and typing", () => {
    const wrapper = mountHarness();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", metaKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    wrapper.get("input").element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(onTurn).not.toHaveBeenCalled();
  });

  it("does nothing when the page cannot turn that way", () => {
    allow.value = false;
    mountHarness();
    const event = new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true });
    window.dispatchEvent(event);

    expect(onTurn).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("stops listening when the reader leaves the book", () => {
    const mounted = mountHarness();
    mounted.unmount();
    wrapper = null;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));

    expect(onTurn).not.toHaveBeenCalled();
  });
});
