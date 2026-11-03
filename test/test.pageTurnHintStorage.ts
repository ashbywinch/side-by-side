import { beforeEach, describe, expect, it } from "vitest";

import {
  loadPageTurnHint,
  MAX_HINT_SHOWS,
  PAGE_TURN_HINT_KEY,
  savePageTurnHint,
} from "@/components/Book/pageTurnHintStorage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("page turn hint storage", () => {
  it("starts fresh and writable when nothing is stored", () => {
    expect(loadPageTurnHint(window.localStorage)).toEqual({
      hint: { version: 1, shown: 0, turned: false },
      canWrite: true,
    });
  });

  it("starts fresh and writable without storage", () => {
    expect(loadPageTurnHint(null)).toEqual({
      hint: { version: 1, shown: 0, turned: false },
      canWrite: true,
    });
  });

  it("round-trips the shown count and the learned flag", () => {
    savePageTurnHint(window.localStorage, { version: 1, shown: 2, turned: true });
    expect(loadPageTurnHint(window.localStorage)).toEqual({
      hint: { version: 1, shown: 2, turned: true },
      canWrite: true,
    });
    expect(window.localStorage.getItem(PAGE_TURN_HINT_KEY)).toContain('"shown":2');
  });

  it("resets unreadable data and may replace it", () => {
    window.localStorage.setItem(PAGE_TURN_HINT_KEY, "{not json");
    expect(loadPageTurnHint(window.localStorage)).toEqual({
      hint: { version: 1, shown: 0, turned: false },
      canWrite: true,
    });
  });

  it("treats a value that is not a record as unreadable", () => {
    window.localStorage.setItem(PAGE_TURN_HINT_KEY, "[]");
    expect(loadPageTurnHint(window.localStorage).canWrite).toBe(true);
  });

  it("never shows or overwrites a newer schema", () => {
    window.localStorage.setItem(PAGE_TURN_HINT_KEY, JSON.stringify({ version: 2, shown: 0, turned: false }));
    const loaded = loadPageTurnHint(window.localStorage);

    expect(loaded.canWrite).toBe(false);
    expect(loaded.hint.shown).toBe(MAX_HINT_SHOWS);
  });

  it("clamps a stored count to the maximum", () => {
    window.localStorage.setItem(PAGE_TURN_HINT_KEY, JSON.stringify({ version: 1, shown: 99, turned: false }));
    expect(loadPageTurnHint(window.localStorage).hint.shown).toBe(MAX_HINT_SHOWS);
  });

  it("ignores a missing or malformed count and flag", () => {
    window.localStorage.setItem(PAGE_TURN_HINT_KEY, JSON.stringify({ version: 1, shown: "two", turned: "yes" }));
    expect(loadPageTurnHint(window.localStorage)).toEqual({
      hint: { version: 1, shown: 0, turned: false },
      canWrite: true,
    });
  });

  it("survives a store that refuses to read or write", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    } as unknown as Storage;

    expect(loadPageTurnHint(broken).hint.shown).toBe(0);
    expect(() => savePageTurnHint(broken, { version: 1, shown: 1, turned: false })).not.toThrow();
  });
});
