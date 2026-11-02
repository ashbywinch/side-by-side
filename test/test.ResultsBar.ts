import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import ResultsBar from "@/components/Index/ResultsBar.vue";

function mountBar(props: Record<string, unknown> = {}) {
  return mount(ResultsBar, {
    props: { count: 2147, ...props },
    global: {},
  })
}

describe("ResultsBar", () => {
  it("says how many books there are, and nothing else by default", () => {
    const wrapper = mountBar()

    expect(wrapper.find(".count").text()).toBe("2,147 books")
    expect(wrapper.findAll(".chip")).toHaveLength(0)
    expect(wrapper.find(".filters").attributes("aria-expanded")).toBe("false")
  })

  it("says one book in the singular", () => {
    expect(mountBar({ count: 1 }).find(".count").text()).toBe("1 book")
  })

  it("shows each active filter as a removable chip", async () => {
    const wrapper = mountBar({ level: "A1", author: "Чехов" })

    const chips = wrapper.findAll(".chip")
    expect(chips.map((chip) => chip.text())).toEqual([
      expect.stringContaining("Level: A1"),
      expect.stringContaining("Author: Чехов"),
    ])
    expect(wrapper.find(".filters__count").text()).toBe("2")

    await chips[0].trigger("click")
    expect(wrapper.emitted("clear")).toEqual([["level"]])
  })

  it("clears everything at once", async () => {
    const wrapper = mountBar({ size: "small", level: "A1" })

    await wrapper.find(".clear-all").trigger("click")
    expect(wrapper.emitted("clear-all")).toHaveLength(1)
  })

  it("reports that the panel is open", () => {
    expect(mountBar({ open: true }).find(".filters").attributes("aria-expanded")).toBe("true")
  })
})
