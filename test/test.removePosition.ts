import { describe, expect, it } from "vitest";

import { REMOVE_GAP, removeTop } from "@/components/Index/removePosition";

describe("removeTop", () => {
  it("sits below the lowest author line in the row", () => {
    expect(
      removeTop([
        { top: 0, bottom: 80 },
        { top: 0, bottom: 104 },
        { top: 0, bottom: 92 },
      ]),
    ).toBe(104 + REMOVE_GAP);
  });

  it("returns zero before the cards have been measured", () => {
    expect(removeTop([])).toBe(0);
  });
});
