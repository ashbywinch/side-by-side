import { afterEach, describe, expect, it } from "vitest";

import {
  isLabVariant,
  layoutFor,
  rememberedVariant,
  rememberVariant,
} from "@/pages/Dev/labVariant";

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("lab variant", () => {
  it("maps each variant to one presentation, and only presentation", () => {
    expect(layoutFor("a")).toEqual({ shelfLayout: "section", portrait: false });
    expect(layoutFor("b")).toEqual({ shelfLayout: "rail", portrait: false });
    expect(layoutFor("c")).toEqual({ shelfLayout: "rail", portrait: true });
  });

  it("only knows the three variants", () => {
    expect(isLabVariant("a")).toBe(true);
    expect(isLabVariant("d")).toBe(false);
    expect(isLabVariant(null)).toBe(false);
  });

  // A walker opens a book and comes back through the home link, which is the
  // plain index: the presentation they were walked through must survive that.
  it("remembers the variant across a book and back", () => {
    rememberVariant("c");
    expect(rememberedVariant()).toBe("c");
  });

  it("ignores junk instead of remembering it", () => {
    rememberVariant("d");
    expect(rememberedVariant()).toBe(null);
  });
});
