import { describe, expect, it } from "vitest";

import { scrollBehavior } from "@/router";

const route = { name: "Book" } as never;

describe("route scrolling", () => {
  it("starts every route at the top", () => {
    // A book must not inherit the index's scroll offset: it opens at the top
    // and scrolls to a stored position itself when it has one.
    expect(scrollBehavior(route, route, null)).toEqual({ top: 0 });
  });

  it("keeps the browser's position on history traversal", () => {
    expect(scrollBehavior(route, route, { left: 0, top: 640 })).toEqual({ left: 0, top: 640 });
  });
});
