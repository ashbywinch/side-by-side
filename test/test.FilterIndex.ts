import { describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";

import { Filter } from "@/components/Index/Filter";
import { useFilter } from "@/pages/Index/FilterIndex";
import type { BookIndexEntry } from "@/types/corpus";

function book(title: string, level: unknown): BookIndexEntry {
  return {
    lang: "ru",
    title,
    author: "Author",
    "Word Count": 100,
    "Vocab Level": level as string,
  };
}

describe("useFilter", () => {
  it("filters the index to Unrated books", async () => {
    const index = ref([
      book("unrated", ""),
      book("c1", "C1"),
      book("legacy", 2),
    ]);
    const { set, items } = useFilter(index);

    set(new Filter("unrated", "", ""));
    await nextTick();

    expect(items.value.map((entry) => entry.title)).toEqual(["unrated", "legacy"]);
  });

  it("filters the index to an exact CEFR level", async () => {
    const index = ref([book("unrated", ""), book("c1", "C1"), book("c2", "C2")]);
    const { set, items } = useFilter(index);

    set(new Filter("C1", "", ""));
    await nextTick();

    expect(items.value.map((entry) => entry.title)).toEqual(["c1"]);
  });
});
