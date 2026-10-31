import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";

import SimplePagination from "@/components/SimplePagination.vue";

const PaginationStub = defineComponent({
  name: "VaPagination",
  props: {
    modelValue: { type: Number, default: 1 },
    pages: { type: Number, default: 1 },
    visiblePages: { type: Number, default: 5 },
  },
  emits: ["update:modelValue"],
  template: `<div class="pagination-stub" />`,
});

function mountPagination(props: { page: number; pages: number }) {
  return mount(SimplePagination, {
    props: { ...props, visiblePages: 1 },
    global: {
      components: { VaPagination: PaginationStub },
    },
  });
}

describe("SimplePagination", () => {
  it("passes the page count from metadata to the pager", () => {
    const wrapper = mountPagination({ page: 2, pages: 5 });
    const pager = wrapper.findComponent(PaginationStub);

    expect(pager.exists()).toBe(true);
    expect(pager.props("pages")).toBe(5);
    expect(pager.props("modelValue")).toBe(2);
  });

  it("hides the pager for a single page", () => {
    const wrapper = mountPagination({ page: 1, pages: 1 });
    expect(wrapper.find(".pagination-stub").exists()).toBe(false);
  });

  it("emits the selected page", async () => {
    const wrapper = mountPagination({ page: 1, pages: 5 });

    wrapper.findComponent(PaginationStub).vm.$emit("update:modelValue", 3);
    await nextTick();

    expect(wrapper.emitted("update-page-value")?.[0]).toEqual([3]);
  });
});
