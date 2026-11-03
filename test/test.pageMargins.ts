import { describe, expect, it } from "vitest";

import { MIN_TARGET, pageMargins } from "@/components/Book/pageMargins";

describe("page margins", () => {
  it("measures a desktop gutter on both sides", () => {
    expect(pageMargins({ left: 352, right: 1088 }, 1440)).toEqual({
      previous: 352,
      next: 352,
    });
  });

  it("measures the phone edge: the container gutter plus the card padding", () => {
    expect(pageMargins({ left: 28, right: 362 }, 390)).toEqual({
      previous: 28,
      next: 28,
    });
  });

  it("hides a margin narrower than the minimum target", () => {
    expect(pageMargins({ left: 8, right: 812 }, 820)).toEqual({
      previous: null,
      next: null,
    });
  });

  it("keeps a margin that meets the minimum exactly", () => {
    expect(pageMargins({ left: MIN_TARGET, right: 600 - MIN_TARGET }, 600)).toEqual({
      previous: MIN_TARGET,
      next: MIN_TARGET,
    });
  });

  it("rounds a fractional margin down before applying the floor", () => {
    expect(pageMargins({ left: 23.9, right: 600 }, 600)).toEqual({
      previous: null,
      next: null,
    });
  });

  it("treats each side independently", () => {
    expect(pageMargins({ left: 30, right: 990 }, 1024)).toEqual({
      previous: 30,
      next: 34,
    });
  });

  it("hides margins that cannot be measured", () => {
    expect(pageMargins({ left: Number.NaN, right: Number.NaN }, 1024)).toEqual({
      previous: null,
      next: null,
    });
    expect(pageMargins({ left: 0, right: 0 }, 0)).toEqual({
      previous: null,
      next: null,
    });
  });
});
