import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { VaDropdownPlugin, VaSelect, createVuesticEssential } from "vuestic-ui";

import BookFilter from "@/components/Index/BookFilter.vue";
import { Filter, FilterRefs } from "@/components/Index/Filter";
import { useFilter } from "@/pages/Index/FilterIndex";
import type { BookIndexEntry } from "@/types/corpus";

function book(level: unknown, title = "Title"): BookIndexEntry {
  return {
    lang: "ru",
    title,
    author: "Author",
    "Word Count": 100,
    "Vocab Level": level as string,
  };
}

function mountFilter(books: BookIndexEntry[]) {
  return mount(BookFilter, {
    props: { filter: new FilterRefs(), books },
    global: {
      plugins: [
        createVuesticEssential({
          components: { VaSelect },
          plugins: { VaDropdownPlugin },
        }),
      ],
    },
  });
}




describe("BookFilter", () => {
  it("offers only valid levels in CEFR order plus Unrated", () => {
    const wrapper = mountFilter([
      book("C2"),
      book("C1"),
      book(""),
      book(2),
      book("B3"),
    ]);

    const options = wrapper.findComponent(VaSelect).props("options") as Array<{
      text: string;
      value: string;
    }>;

    expect(options).toEqual([
      { text: "C1", value: "C1" },
      { text: "C2", value: "C2" },
      { text: "Unrated", value: "unrated" },
    ]);
    expect(options.some((option) => option.value === "0" || option.value === "2")).toBe(
      false,
    );
  });

  it("emits the Unrated sentinel when it is selected", async () => {
    const wrapper = mountFilter([book("C2"), book("")]);
    const select = wrapper.findComponent(VaSelect);

    await select.setValue("unrated");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      level: "unrated",
    });
  });

  it("emits no filter when the level is cleared", async () => {
    const wrapper = mountFilter([book("C2"), book("")]);
    const select = wrapper.findComponent(VaSelect);

    await select.setValue(null);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("update-filter-value")?.at(-1)?.[0]).toMatchObject({
      level: "",
    });
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

    const wrapper = mount(Harness, {
      global: {
        plugins: [
          createVuesticEssential({
            components: { VaSelect },
            plugins: { VaDropdownPlugin },
          }),
        ],
      },
    });

    expect(wrapper.findAll("li").map((item) => item.text())).toEqual([
      "c2",
      "unrated",
    ]);

    await wrapper.findComponent(VaSelect).setValue("unrated");
    await nextTick();

    expect(wrapper.findAll("li").map((item) => item.text())).toEqual(["unrated"]);
  });
});
