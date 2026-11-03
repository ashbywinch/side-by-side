import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPageTurnHint, HINT_DELAY_MS, HINT_HOLD_MS } from "@/components/Book/usePageTurnHint";
import { loadPageTurnHint } from "@/components/Book/pageTurnHintStorage";

function open(overrides: { delayMs?: number; holdMs?: number } = {}) {
  return createPageTurnHint({ storage: window.localStorage, ...overrides });
}

/** Open a book, let the hint decide and appear, then close it. */
function showOnce() {
  const hint = open();
  hint.consider({ total: 5 });
  vi.advanceTimersByTime(HINT_DELAY_MS);
  const shown = hint.visible.value;
  vi.advanceTimersByTime(HINT_HOLD_MS);
  hint.dispose();
  return shown;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
});

describe("page turn hint", () => {
  it("waits before showing, then hides itself", () => {
    const hint = open();
    hint.consider({ total: 5 });

    vi.advanceTimersByTime(HINT_DELAY_MS - 1);
    expect(hint.visible.value).toBe(false);

    vi.advanceTimersByTime(1);
    expect(hint.visible.value).toBe(true);

    vi.advanceTimersByTime(HINT_HOLD_MS);
    expect(hint.visible.value).toBe(false);
  });

  it("counts a showing only when it actually appears", () => {
    const hint = open();
    hint.consider({ total: 5 });
    hint.hide();
    vi.advanceTimersByTime(HINT_DELAY_MS);

    expect(hint.visible.value).toBe(false);
    expect(loadPageTurnHint(window.localStorage).hint.shown).toBe(0);
  });

  it("never shows for a single-page book", () => {
    const single = open();
    single.consider({ total: 1 });
    vi.advanceTimersByTime(HINT_DELAY_MS);
    expect(single.visible.value).toBe(false);
  });

  it("stops for good once the reader turns a page by swipe or margin", () => {
    expect(showOnce()).toBe(true);

    const second = open();
    second.consider({ total: 5 });
    vi.advanceTimersByTime(HINT_DELAY_MS);
    expect(second.visible.value).toBe(true);

    second.learned();
    expect(second.visible.value).toBe(false);
    expect(loadPageTurnHint(window.localStorage).hint.turned).toBe(true);

    const third = open();
    third.consider({ total: 5 });
    vi.advanceTimersByTime(HINT_DELAY_MS);
    expect(third.visible.value).toBe(false);
  });

  it("shows at most three times on a device", () => {
    expect(showOnce()).toBe(true);
    expect(showOnce()).toBe(true);
    expect(showOnce()).toBe(true);
    expect(showOnce()).toBe(false);

    expect(loadPageTurnHint(window.localStorage).hint.shown).toBe(3);
  });

  it("decides once per open", () => {
    const hint = open();
    hint.consider({ total: 5 });
    hint.consider({ total: 5 });
    vi.advanceTimersByTime(HINT_DELAY_MS);

    expect(hint.visible.value).toBe(true);
    expect(loadPageTurnHint(window.localStorage).hint.shown).toBe(1);
  });

  it("can be forced for a demo without spending one of the device's showings", () => {
    window.localStorage.setItem(
      "sbs:page-turn-hint:v1",
      JSON.stringify({ version: 1, shown: 3, turned: true }),
    );
    const hint = open();

    hint.consider({ total: 5, force: true });
    vi.advanceTimersByTime(HINT_DELAY_MS);
    expect(hint.visible.value).toBe(true);

    hint.learned();
    const stored = loadPageTurnHint(window.localStorage).hint;
    expect(stored.shown).toBe(3);
    expect(stored.turned).toBe(true);
  });

  it("does not show when the stored schema is newer", () => {
    window.localStorage.setItem("sbs:page-turn-hint:v1", JSON.stringify({ version: 9, shown: 0, turned: false }));
    const hint = open();
    hint.consider({ total: 5 });
    vi.advanceTimersByTime(HINT_DELAY_MS);

    expect(hint.visible.value).toBe(false);
    expect(window.localStorage.getItem("sbs:page-turn-hint:v1")).toContain('"version":9');
  });

  it("forgets the show when storage is unavailable, but still shows once per open", () => {
    const hint = createPageTurnHint({ storage: null });
    hint.consider({ total: 5 });
    vi.advanceTimersByTime(HINT_DELAY_MS);

    expect(hint.visible.value).toBe(true);
  });

  it("cancels pending work when closed", () => {
    const hint = open();
    hint.consider({ total: 5 });
    hint.dispose();
    vi.advanceTimersByTime(HINT_DELAY_MS + HINT_HOLD_MS);

    expect(hint.visible.value).toBe(false);
  });
});
