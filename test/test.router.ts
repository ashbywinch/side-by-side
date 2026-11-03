import { describe, expect, it } from "vitest";

import { scrollBehavior } from "@/router";

const book = { name: "Book" } as never;
const index = { name: "Index" } as never;

describe("route scrolling", () => {
  it("starts other routes at the top", () => {
    expect(scrollBehavior(index, index, null)).toEqual({ top: 0 });
  });

  it("lets a book own its scroll, so a stored position survives", () => {
    // The router's scroll lands after the book restores its place, so scrolling
    // a book here would overwrite the restore.
    expect(scrollBehavior(book, book, null)).toBe(false);
  });

  it("keeps the browser's position on history traversal", () => {
    expect(scrollBehavior(book, book, { left: 0, top: 640 })).toEqual({ left: 0, top: 640 });
  });
});
