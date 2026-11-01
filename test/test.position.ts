import { describe, expect, it } from "vitest";

import {
  clampPosition,
  isRevealed,
  nextRevealedThrough,
  pageForPosition,
  positionForPage,
  topSegment,
} from "@/components/Bookshelf/position";

describe("position", () => {
  it("derives the page from the segment at the top of the viewport", () => {
    expect(pageForPosition(0, 24)).toBe(1);
    expect(pageForPosition(23, 24)).toBe(1);
    expect(pageForPosition(24, 24)).toBe(2);
    expect(pageForPosition(479, 24)).toBe(20);
  });

  it("derives the first segment of a page", () => {
    expect(positionForPage(1, 24)).toBe(0);
    expect(positionForPage(3, 24)).toBe(48);
  });

  it("clamps nonsense to the first page", () => {
    expect(pageForPosition(-5, 24)).toBe(1);
    expect(pageForPosition(Number.NaN, 24)).toBe(1);
    expect(positionForPage(0, 24)).toBe(0);
    expect(positionForPage(Number.NaN, 24)).toBe(0);
  });

  it("clamps a position to the book's segments", () => {
    expect(clampPosition(150, 100)).toBe(99);
    expect(clampPosition(-2, 100)).toBe(0);
    expect(clampPosition(3, 0)).toBe(0);
    expect(clampPosition(Number.NaN, 10)).toBe(0);
  });

  it("reveals a segment at or before the high-water mark", () => {
    expect(isRevealed(-1, 0)).toBe(false);
    expect(isRevealed(3, 0)).toBe(true);
    expect(isRevealed(3, 3)).toBe(true);
    expect(isRevealed(3, 4)).toBe(false);
  });

  it("only ever moves the high-water mark forward", () => {
    expect(nextRevealedThrough(-1, 5)).toBe(5);
    expect(nextRevealedThrough(5, 2)).toBe(5);
    expect(nextRevealedThrough(5, 5)).toBe(5);
  });

  it("finds the card at the top of the viewport", () => {
    expect(topSegment([])).toBe(0);
    expect(topSegment([-500, -20, 40, 300])).toBe(1);
    expect(topSegment([-500, -20, -2, 300])).toBe(2);
    expect(topSegment([40, 300, 600])).toBe(0);
    expect(topSegment([-500, Number.NEGATIVE_INFINITY])).toBe(1);
  });
});
