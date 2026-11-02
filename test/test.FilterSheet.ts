import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import FilterSheet from "@/components/Index/FilterSheet.vue";
import { FilterRefs } from "@/components/Index/Filter";
import type { BookIndexEntry } from "@/types/corpus";

function book(level: string, author = "Author"): BookIndexEntry {
  return {
    lang: "ru",
    title: `Title ${level}`,
    author,
    "Word Count": 100,
    "Vocab Level": level,
  };
}

function mountSheet(open = true) {
  return mount(FilterSheet, {
    props: { open, books: [book("C2"), book("")], filter: new FilterRefs() },
    global: {
      stubs: {
        Teleport: true,
      },
    },
  });
}

describe("FilterSheet", () => {
  it("carries the author autocomplete into the sheet", () => {
    const wrapper = mountSheet();

    expect(wrapper.find("#filter-Author").exists()).toBe(true);
  });

  it("shows the live count of the draft, not the applied filter", async () => {
    const wrapper = mountSheet();
    const filters = wrapper.findAllComponents({ name: "BookFilter" });
    expect(filters).toHaveLength(1);

    wrapper.findComponent({ name: "BookFilter" }).vm.$emit("update-filter-value", {
      level: "C2",
      size: "",
      author: "",
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Show 1 book");
  });

  it("offers Clear all only when something is chosen", async () => {
    const wrapper = mountSheet();
    const clear = wrapper.find(".clear");
    expect(clear.attributes("disabled")).toBeDefined();

    wrapper.findComponent({ name: "BookFilter" }).vm.$emit("update-filter-value", {
      level: "",
      size: "",
      author: "Author",
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".clear").attributes("disabled")).toBeUndefined();
  });
});
