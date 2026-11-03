import { describe, expect, it } from "vitest";

import { pageAfter, swipeCommits, swipeTurn } from "@/components/Book/pageTurn";

describe("page turns", () => {
  it("moves one page forward and back", () => {
    expect(pageAfter(2, 10, "next")).toBe(3);
    expect(pageAfter(2, 10, "previous")).toBe(1);
  });

  it("clamps at the first and last page", () => {
    expect(pageAfter(1, 10, "previous")).toBe(1);
    expect(pageAfter(10, 10, "next")).toBe(10);
  });

  it("never leaves a book with a single page", () => {
    expect(pageAfter(1, 1, "next")).toBe(1);
    expect(pageAfter(1, 1, "previous")).toBe(1);
  });

  it("treats a missing or invalid page count as one page", () => {
    expect(pageAfter(1, 0, "next")).toBe(1);
    expect(pageAfter(1, Number.NaN, "next")).toBe(1);
  });

  it("normalises an invalid current page to the first", () => {
    expect(pageAfter(0, 10, "next")).toBe(2);
    expect(pageAfter(Number.NaN, 10, "next")).toBe(2);
    expect(pageAfter(-4, 10, "next")).toBe(2);
    expect(pageAfter(99, 10, "previous")).toBe(9);
  });
});

describe("swipe classification", () => {
  it("reads a leftward swipe as the next page and a rightward as the previous", () => {
    expect(swipeTurn({ x: 300, y: 400 }, { x: 220, y: 402 })).toBe("next");
    expect(swipeTurn({ x: 120, y: 400 }, { x: 200, y: 398 })).toBe("previous");
  });

  it("accepts a swipe at exactly the distance threshold", () => {
    expect(swipeTurn({ x: 300, y: 400 }, { x: 250, y: 400 })).toBe("next");
    expect(swipeTurn({ x: 300, y: 400 }, { x: 251, y: 400 })).toBeNull();
  });

  it("ignores a drag that is mostly vertical", () => {
    expect(swipeTurn({ x: 300, y: 200 }, { x: 260, y: 380 })).toBeNull();
    expect(swipeTurn({ x: 300, y: 200 }, { x: 340, y: 20 })).toBeNull();
  });

  it("ignores an even diagonal, which is a scroll more than a swipe", () => {
    expect(swipeTurn({ x: 300, y: 200 }, { x: 240, y: 260 })).toBeNull();
  });

  it("accepts a horizontal drag that is only slightly diagonal", () => {
    expect(swipeTurn({ x: 300, y: 200 }, { x: 200, y: 240 })).toBe("next");
  });

  it("ignores a gesture that did not move, or cannot be measured", () => {
    expect(swipeTurn({ x: 300, y: 400 }, { x: 300, y: 400 })).toBeNull();
    expect(swipeTurn({ x: Number.NaN, y: 400 }, { x: 200, y: 400 })).toBeNull();
  });
});

describe("swipe commit", () => {
  it("commits a drag past the distance threshold, however slow", () => {
    expect(swipeCommits(50, 0, "next")).toBe(true);
    expect(swipeCommits(120, 0, "previous")).toBe(true);
  });

  it("commits a short flick in the direction of travel", () => {
    expect(swipeCommits(20, -0.6, "next")).toBe(true);
    expect(swipeCommits(20, 0.6, "previous")).toBe(true);
  });

  it("does not commit a short slow drag, or a flick the other way", () => {
    expect(swipeCommits(20, -0.2, "next")).toBe(false);
    expect(swipeCommits(20, 0.6, "next")).toBe(false);
    expect(swipeCommits(20, -0.6, "previous")).toBe(false);
    expect(swipeCommits(0, -1, "next")).toBe(false);
  });
});
