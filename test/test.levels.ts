import { describe, expect, it } from "vitest";

import { FilterRefs } from "@/components/Index/Filter";
import {
  CEFR_LEVELS,
  UNRATED_COLOR,
  levelColorFor,
  levelLabel,
  levelOptions,
  normaliseLevel,
  normaliseLevelFilter,
} from "@/components/Index/levels";
import type { BookIndexEntry } from "@/types/corpus";

function book(level: unknown): BookIndexEntry {
  return {
    lang: "ru",
    title: "Title",
    author: "Author",
    "Word Count": 100,
    "Vocab Level": level as string,
  };
}

describe("levels", () => {
  it("normalises only valid CEFR strings", () => {
    expect(normaliseLevel("C1")).toBe("C1");
    expect(normaliseLevel("")).toBe("");
    expect(normaliseLevel(2)).toBe("");
    expect(normaliseLevel("B3")).toBe("");
    expect(normaliseLevel(undefined)).toBe("");
  });

  it("labels an absent or invalid level as Unrated", () => {
    expect(levelLabel("C2")).toBe("C2");
    expect(levelLabel("")).toBe("Unrated");
    expect(levelLabel(2)).toBe("Unrated");
  });

  it("keeps valid filter values and rejects numeric artefacts", () => {
    expect(normaliseLevelFilter("c1")).toBe("");
    expect(normaliseLevelFilter("C1")).toBe("C1");
    expect(normaliseLevelFilter("unrated")).toBe("unrated");
    expect(normaliseLevelFilter("2")).toBe("");
    expect(normaliseLevelFilter(null)).toBe("");
  });

  it("lists only levels that can match, in CEFR order, with Unrated last", () => {
    const options = levelOptions([
      book("C2"),
      book(2),
      book(""),
      book("A1"),
      book("C1"),
      book("B3"),
    ]);

    expect(options).toEqual([
      { text: "A1", value: "A1" },
      { text: "C1", value: "C1" },
      { text: "C2", value: "C2" },
      { text: "Unrated", value: "unrated" },
    ]);
  });

  it("omits Unrated when every book is rated", () => {
    expect(levelOptions([book("C1"), book("C2")]).map((option) => option.value)).toEqual([
      "C1",
      "C2",
    ]);
  });

  it("defines a badge colour for every visible level", () => {
    for (const level of CEFR_LEVELS) {
      expect(levelColorFor(level)).toMatch(/^#[0-9a-f]{3}$/i);
    }
    expect(levelColorFor("")).toBe(UNRATED_COLOR);
    expect(levelColorFor(2)).toBe(UNRATED_COLOR);
  });
});

describe("level filtering", () => {
  function refs(level: string, size = "", author = "") {
    const filter = new FilterRefs();
    filter.level.value = level;
    filter.size.value = size;
    filter.author.value = author;
    return filter;
  }

  it("matches an exact CEFR level", () => {
    const filter = refs("C1");

    expect(filter.matches("C1", "small", "Author")).toBe(true);
    expect(filter.matches("C2", "small", "Author")).toBe(false);
  });

  it("matches unrated books, including numeric and unknown values", () => {
    const filter = refs("unrated");

    expect(filter.matches("", "small", "Author")).toBe(true);
    expect(filter.matches(normaliseLevel(2), "small", "Author")).toBe(true);
    expect(filter.matches(normaliseLevel("B3"), "small", "Author")).toBe(true);
    expect(filter.matches("C1", "small", "Author")).toBe(false);
  });

  it("treats a legacy numeric filter value as no filter", () => {
    const filter = refs("2");

    expect(filter.matches("C1", "small", "Author")).toBe(true);
  });

  it("keeps size and author filters", () => {
    const filter = refs("C1", "small", "Author");

    expect(filter.matches("C1", "small", "Author")).toBe(true);
    expect(filter.matches("C1", "large", "Author")).toBe(false);
    expect(filter.matches("C1", "small", "Other")).toBe(false);
  });
});
