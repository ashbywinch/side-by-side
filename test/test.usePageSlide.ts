import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { createPageSlide, PAGE_SLIDE_MS } from "@/components/Book/usePageSlide";

const TOTAL = PAGE_SLIDE_MS + 80;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

function rect(): DOMRect {
  return {
    left: 40,
    top: -120,
    width: 800,
    height: 4000,
    right: 840,
    bottom: 3880,
    x: 40,
    y: -120,
    toJSON: () => ({}),
  } as DOMRect;
}

function setup({ reducedMotion = false } = {}) {
  const ghost = document.createElement("div");
  const reader = document.createElement("div");
  const card = document.createElement("section");
  card.id = "page";
  card.innerHTML = '<p id="passage">the page being left</p>';
  card.getBoundingClientRect = () => rect();

  const slide = createPageSlide({
    ghost: ref(ghost),
    reader: ref(reader),
    card: () => card,
    reducedMotion: () => reducedMotion,
  });

  return { ghost, reader, card, slide };
}

let animate: ReturnType<typeof vi.fn>;

function keyframes(call: number): Array<{ transform: string }> {
  return animate.mock.calls[call][0] as Array<{ transform: string }>;
}

function options(call: number): KeyframeAnimationOptions {
  return animate.mock.calls[call][1] as KeyframeAnimationOptions;
}

const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 1200 });
  animate = vi.fn(() => ({
    cancel: vi.fn(),
    playState: "running",
    finished: Promise.resolve(),
  }));
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
});

afterEach(() => {
  vi.useRealTimers();
  delete (Element.prototype as { animate?: unknown }).animate;
  if (originalClientWidth) Object.defineProperty(document.documentElement, "clientWidth", originalClientWidth);
});

describe("page slide", () => {
  it("freezes the page being left at its exact viewport position", () => {
    const { ghost, slide } = setup();

    slide.begin();

    expect(ghost.childElementCount).toBe(1);
    const snapshot = ghost.firstElementChild as HTMLElement;
    expect(snapshot.textContent).toContain("the page being left");
    expect(snapshot.id).toBe("");
    expect(snapshot.querySelector("#passage")).toBeNull();
    expect(snapshot.style.position).toBe("absolute");
    expect(snapshot.style.left).toBe("40px");
    expect(snapshot.style.top).toBe("-120px");
    expect(snapshot.style.width).toBe("800px");
    expect(snapshot.style.height).toBe("4000px");
    expect(snapshot.style.margin).toBe("0px");
  });

  it("freezes the page where the finger left it, not at rest", () => {
    const { ghost, reader, card, slide } = setup();
    // A dragged page is laid out under the reader's transform, so the card's
    // box has already moved by the drag distance when the snapshot is taken.
    reader.style.transform = "translateX(-140px)";
    card.getBoundingClientRect = () => {
      const drag = Number(/translateX\((-?[\d.]+)px\)/.exec(reader.style.transform)?.[1] ?? 0);
      const box = rect();
      return { ...box, left: box.left + drag, x: box.x + drag } as DOMRect;
    };

    slide.begin(140);

    const snapshot = ghost.firstElementChild as HTMLElement;
    expect(snapshot.style.left).toBe("-100px");
    // Until the row takes over, the live page must stay under the finger
    // instead of snapping back to rest behind the snapshot.
    expect(reader.style.transform).toBe("translateX(-140px)");
  });

  it("moves the row left with literal transform keyframes for a forward turn", () => {
    const { ghost, reader, slide } = setup();
    slide.begin();

    slide.play("next");

    expect(keyframes(0)).toEqual([
      { transform: "translateX(0px)" },
      { transform: "translateX(-1200px)" },
    ]);
    expect(keyframes(1)).toEqual([
      { transform: "translateX(1200px)" },
      { transform: "translateX(0px)" },
    ]);
    expect(options(0)).toMatchObject({ duration: PAGE_SLIDE_MS, easing: EASING, fill: "both" });
    expect(ghost.classList.contains("page-ghost--out")).toBe(true);
    expect(reader.classList.contains("reader--turn-next")).toBe(true);

    vi.advanceTimersByTime(TOTAL);
    expect(ghost.classList.contains("page-ghost--out")).toBe(false);
    expect(ghost.childElementCount).toBe(0);
    expect(reader.classList.contains("reader--turn-next")).toBe(false);
  });

  it("moves the row right for a backward turn", () => {
    const { ghost, reader, slide } = setup();
    slide.begin();

    slide.play("previous");

    expect(keyframes(0)).toEqual([
      { transform: "translateX(0px)" },
      { transform: "translateX(1200px)" },
    ]);
    expect(keyframes(1)).toEqual([
      { transform: "translateX(-1200px)" },
      { transform: "translateX(0px)" },
    ]);
    expect(ghost.classList.contains("page-ghost--out")).toBe(true);
    expect(reader.classList.contains("reader--turn-previous")).toBe(true);
  });

  it("brings the new page in from the peek position after a committed drag", () => {
    const { reader, slide } = setup();
    slide.begin(120);

    slide.play("next");

    expect(keyframes(0)).toEqual([
      { transform: "translateX(0px)" },
      { transform: "translateX(-1080px)" },
    ]);
    expect(keyframes(1)).toEqual([
      { transform: "translateX(1080px)" },
      { transform: "translateX(0px)" },
    ]);
    expect(reader.classList.contains("reader--turn-next")).toBe(true);

    vi.advanceTimersByTime(TOTAL);
    expect(reader.classList.contains("reader--turn-next")).toBe(false);
  });

  it("does nothing when the reader prefers reduced motion", () => {
    const { ghost, slide } = setup({ reducedMotion: true });

    slide.begin();
    slide.play("next");

    expect(ghost.childElementCount).toBe(0);
    expect(ghost.className).toBe("");
    expect(animate).not.toHaveBeenCalled();
  });

  it("does not animate without a snapshot", () => {
    const { ghost, slide } = setup();

    slide.play("next");

    expect(ghost.className).toBe("");
    expect(animate).not.toHaveBeenCalled();
  });

  it("cancels the animations and clears the snapshot on demand", () => {
    const { ghost, slide } = setup();
    slide.begin();
    slide.play("next");
    const ghostAnimation = animate.mock.results[0].value as { cancel: ReturnType<typeof vi.fn> };

    slide.end();

    expect(ghostAnimation.cancel).toHaveBeenCalled();
    expect(ghost.childElementCount).toBe(0);
    expect(ghost.className).toBe("");
  });
});
