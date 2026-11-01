import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";

import BookFilter from "@/components/Index/BookFilter.vue";
import { Filter, FilterRefs } from "@/components/Index/Filter";
import { useFilter } from "@/pages/Index/FilterIndex";
import type { BookIndexEntry } from "@/types/corpus";

function book(level: unknown, title = "Title", author = "Author"): BookIndexEntry {
  return {
    lang: "ru",
    title,
    author,
    "Word Count": 100,
    "Vocab Level": level as string,
  };
}

function mountFilter(books: BookIndexEntry[]) {
  return mount(BookFilter, { props: { filter: new FilterRefs(), books } });
}

async function chooseOption(
  wrapper: ReturnType<typeof mountFilter>,
  label: string,
  option: string,
) {
  await wrapper.find(`#filter-${label}`).trigger("click");
  const item = wrapper
    .findAll(".list__option")
    .find((candidate) => candidate.text() === option);
  if (!item) throw new Error(`no ${option} in the ${label} list`);
  await item.trigger("mousedown");
}

describe("BookFilter", () => {
  it("offers only valid levels in CEFR order plus Unrated", async () => {
    const wrapper = mountFilter([book("C2"), book("C1"), book(""), book(2), book("B3")]);
    await wrapper.find("#filter-Level").trigger("click");

    // "Any level" is the empty state, cleared with the field's ×, not a row.
    expect(wrapper.findAll(".list__option").map((option) => option.text())).toEqual([
      "C1",
      "C2",
      "Unrated",
    ]);
  });

  it("emits the level and the size when chosen", async () => {
    const wrapper = mountFilter([book("C2")]);
    await chooseOption(wrapper, "Level", "C2");
    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      level: "C2",
    });

    await chooseOption(wrapper, "Size", "small");
    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      size: "small",
    });
  });

  // The library select never drew its list, so the reader had no suggestions at
  // all. Typing now lists matches, and only a chosen author filters.
  it("suggests authors as the reader types, and applies the one they pick", async () => {
    const wrapper = mountFilter([
      book("C2", "one", "Антон Чехов"),
      book("C2", "two", "Лев Толстой"),
    ]);

    await wrapper.find("#filter-Author").setValue("Чех");
    expect(wrapper.findAll(".list__option").map((option) => option.text())).toEqual([
      "Антон Чехов",
    ]);
    expect(wrapper.emitted("update-filter-value")).toBeUndefined();

    await wrapper.find(".list__option").trigger("mousedown");

    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      author: "Антон Чехов",
    });
    expect(wrapper.findAll(".list__option")).toHaveLength(0);
  });

  it("sorts the suggestions by surname", async () => {
    const wrapper = mountFilter([
      book("C2", "one", "Лев Толстой"),
      book("C2", "two", "Антон Чехов"),
    ]);

    await wrapper.find("#filter-Author").setValue("о");

    // Surnames: Толстой before Чехов (Т before Ч).
    expect(wrapper.findAll(".list__option").map((option) => option.text())).toEqual([
      "Лев Толстой",
      "Антон Чехов",
    ]);
  });

  it("filters the displayed books through the emitted filter", async () => {
    const books = [book("C2", "c2"), book("", "unrated")];
    const index = ref(books);
    const { filter, set, items } = useFilter(index);
    const Harness = defineComponent({
      setup() {
        return () =>
          h("div", [
            h(BookFilter, {
              books,
              filter,
              onUpdateFilterValue: (next: Filter) => set(next),
            }),
            h(
              "ul",
              items.value.map((entry) => h("li", { key: entry.title }, entry.title)),
            ),
          ]);
      },
    });

    const wrapper = mount(Harness);
    await wrapper.find("#filter-Level").trigger("click");
    const level = wrapper
      .findAll(".list__option")
      .find((option) => option.text() === "C2");
    await level?.trigger("mousedown");
    await nextTick();

    expect(wrapper.findAll("li").map((item) => item.text())).toEqual(["c2"]);
  });
});
