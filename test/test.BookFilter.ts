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

describe("BookFilter", () => {
  it("offers only valid levels in CEFR order plus Unrated", () => {
    const wrapper = mountFilter([book("C2"), book("C1"), book(""), book(2), book("B3")]);

    const options = wrapper
      .findAll("select")[0]
      .findAll("option")
      .map((option) => ({ text: option.text(), value: option.attributes("value") }));

    expect(options).toEqual([
      { text: "Any level", value: "" },
      { text: "C1", value: "C1" },
      { text: "C2", value: "C2" },
      { text: "Unrated", value: "unrated" },
    ]);
  });

  it("emits the level and the size when chosen", async () => {
    const wrapper = mountFilter([book("C2")]);
    await wrapper.findAll("select")[0].setValue("C2");
    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      level: "C2",
    });

    await wrapper.findAll("select")[1].setValue("small");
    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      size: "small",
    });
  });

  // The library dropdown never rendered, so the reader had no suggestions at
  // all: typing now filters a list we draw ourselves.
  it("suggests authors as the reader types, and applies the one they pick", async () => {
    const wrapper = mountFilter([
      book("C2", "one", "Антон Чехов"),
      book("C2", "two", "Лев Толстой"),
    ]);

    await wrapper.find("#author-filter").setValue("Чех");
    expect(wrapper.findAll(".combo__option").map((option) => option.text())).toEqual([
      "Антон Чехов",
    ]);

    await wrapper.find(".combo__option").trigger("mousedown");

    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      author: "Антон Чехов",
    });
    expect(wrapper.findAll(".combo__option")).toHaveLength(0);
  });

  it("sorts the suggestions by surname", async () => {
    const wrapper = mountFilter([
      book("C2", "one", "Лев Толстой"),
      book("C2", "two", "Антон Чехов"),
    ]);

    await wrapper.find("#author-filter").setValue("о");

    // Surnames: Толстой before Чехов (Т before Ч), not first-name order.
    expect(wrapper.findAll(".combo__option").map((option) => option.text())).toEqual([
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
    await wrapper.find("select").setValue("C2");
    await nextTick();

    expect(wrapper.findAll("li").map((item) => item.text())).toEqual(["c2"]);
  });
});
