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
  // The library dropdown teleports its list to <body> at z-index 1, which puts
  // it behind the sheet: every filter on a phone was invisible when tapped.
  it("uses platform controls, not the library's teleported dropdown", () => {
    const wrapper = mountSheet();

    expect(wrapper.findAll("select")).toHaveLength(2);
    expect(wrapper.findComponent({ name: "VaSelect" }).exists()).toBe(false);
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

    await wrapper.find('input[type="search"]').setValue("Author");
    expect(wrapper.find(".clear").attributes("disabled")).toBeUndefined();
  });
});
