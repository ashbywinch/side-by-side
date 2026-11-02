import { describe, expect, it } from "vitest";

import { cardFloor } from "@/components/Index/useCardMinWidth";

describe("cardFloor", () => {
  it("keeps a book's proportion when there is room", () => {
    expect(cardFloor(240, 1240)).toBe(160);
  });

  it("never forces a phone below two across", () => {
    // 390 wide, 16 gap: two cards are 187 each at most.
    expect(cardFloor(300, 366)).toBe(175);
    expect(cardFloor(280, 366)).toBe(175);
  });

  it("gives up rather than return a negative width", () => {
    expect(cardFloor(0, 0)).toBe(0);
    expect(cardFloor(100, 10)).toBe(0);
  });
});
