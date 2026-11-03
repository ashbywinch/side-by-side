import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  scrollBehaviorFor,
  scrollToTop,
  SMOOTH_SCROLL_FALLBACK_MS,
} from "@/components/Book/scrollToTop";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true, writable: true });
}

let scrollTo: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  setScrollY(0);
});

afterEach(() => {
  scrollTo.mockRestore();
  vi.useRealTimers();
});

describe("scroll behaviour after a page turn", () => {
  it("smooth-scrolls a turn within one viewport", () => {
    expect(scrollBehaviorFor(120, 800, false)).toBe("smooth");
    expect(scrollBehaviorFor(800, 800, false)).toBe("smooth");
  });

  it("snaps when the page is longer than a viewport, so a long turn never waits", () => {
    expect(scrollBehaviorFor(801, 800, false)).toBe("auto");
    expect(scrollBehaviorFor(4000, 800, false)).toBe("auto");
  });

  it("snaps when reduced motion is requested or there is nowhere to scroll", () => {
    expect(scrollBehaviorFor(100, 800, true)).toBe("auto");
    expect(scrollBehaviorFor(0, 800, false)).toBe("auto");
    expect(scrollBehaviorFor(100, 0, false)).toBe("auto");
  });
});

describe("scrollToTop", () => {
  it("asks for a smooth scroll and falls back to a snap if it stalls", () => {
    setScrollY(300);
    scrollToTop({ distance: 300, viewportHeight: 800, reducedMotion: false });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    vi.advanceTimersByTime(SMOOTH_SCROLL_FALLBACK_MS);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });
  });

  it("does not snap when the smooth scroll arrived", () => {
    setScrollY(300);
    scrollToTop({ distance: 300, viewportHeight: 800, reducedMotion: false });
    setScrollY(0);
    vi.advanceTimersByTime(SMOOTH_SCROLL_FALLBACK_MS);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("snaps immediately beyond a viewport and schedules no fallback", () => {
    setScrollY(3000);
    scrollToTop({ distance: 3000, viewportHeight: 800, reducedMotion: false });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    vi.advanceTimersByTime(SMOOTH_SCROLL_FALLBACK_MS);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("snaps immediately when reduced motion is requested", () => {
    setScrollY(200);
    scrollToTop({ distance: 200, viewportHeight: 800, reducedMotion: true });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("cancels a pending fallback", () => {
    setScrollY(300);
    const cancel = scrollToTop({ distance: 300, viewportHeight: 800, reducedMotion: false });
    cancel();
    vi.advanceTimersByTime(SMOOTH_SCROLL_FALLBACK_MS);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
