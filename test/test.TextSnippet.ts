import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import TextSnippet from "@/components/Book/TextSnippet.vue";

function mountSnippet(text: string, translation: string, showTranslation = false) {
  return mount(TextSnippet, {
    props: { text, translation, showTranslation },
    global: {
      stubs: {
        "va-card": { template: "<div><slot /></div>" },
        "va-card-content": { template: "<div><slot /></div>" },
      },
    },
  });
}

describe("TextSnippet", () => {
  it("renders the source and a masked translation", () => {
    const wrapper = mountSnippet("Привет", "Hello");

    expect(wrapper.find(".original").text()).toContain("Привет");
    expect(wrapper.find(".translation").text()).toContain("Hello");
    expect(wrapper.find(".masked").exists()).toBe(true);
  });

  it("renders an orphaned translation without an empty source card", () => {
    const wrapper = mountSnippet("\n", "Orphaned translation");

    expect(wrapper.find(".original").exists()).toBe(false);
    expect(wrapper.find(".translation").text()).toContain("Orphaned translation");
    expect(wrapper.find(".masked").exists()).toBe(false);
  });

  it("renders nothing when both sides are blank", () => {
    const wrapper = mountSnippet(" ", "\n");
    expect(wrapper.find(".original").exists()).toBe(false);
    expect(wrapper.find(".translation").exists()).toBe(false);
  });
});
