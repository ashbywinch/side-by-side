import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import TextSnippet from "@/components/Book/TextSnippet.vue";

function mountSnippet(text: string, translation: string, showTranslation = false) {
  return mount(TextSnippet, {
    props: { text, translation, showTranslation },
    global: {
      stubs: {
        "va-card": { template: "<div v-bind='$attrs'><slot /></div>" },
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
    expect(wrapper.find(".masked").attributes("aria-hidden")).toBe("true");
  });

  it("is a control a keyboard can reach and operate", async () => {
    const wrapper = mountSnippet("Привет", "Hello");
    const card = wrapper.find(".translation");

    expect(card.attributes("role")).toBe("button");
    expect(card.attributes("tabindex")).toBe("0");
    expect(card.attributes("aria-label")).toBe("Show the translation of this passage");

    await card.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("translation-clicked")).toHaveLength(1);
  });

  it("drops the control once the translation is shown", () => {
    const wrapper = mountSnippet("Привет", "Hello", true);

    expect(wrapper.find(".masked").exists()).toBe(false);
    expect(wrapper.find(".translation").attributes("role")).toBeUndefined();
    expect(wrapper.find(".translation").attributes("tabindex")).toBeUndefined();
  });

  it("does not emit when an already shown translation is clicked", async () => {
    const wrapper = mountSnippet("Привет", "Hello", true);
    await wrapper.find(".translation").trigger("click");

    expect(wrapper.emitted("translation-clicked")).toBeUndefined();
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
