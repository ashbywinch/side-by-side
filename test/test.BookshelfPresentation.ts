import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";

import BookOverviewCard from "@/components/Index/BookOverviewCard.vue";
import BookshelfSection from "@/components/Index/BookshelfSection.vue";
import { shelfCards } from "@/components/Index/shelfCards";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const stubs = {
  RouterLink: { props: ["to"], template: "<a><slot /></a>" },
  "va-card": { template: "<div class='card'><slot /></div>" },
  "va-card-title": { template: "<div><slot /></div>" },
  "va-card-content": { template: "<div><slot /></div>" },
  "va-badge": { props: ["text"], template: "<span class='badge'>{{ text }}</span>" },
  "va-icon": { props: ["name", "size"], template: "<span class='icon' />" },
}

function indexBook(title: string, author = "Author"): BookIndexEntry {
  return { lang: "ru", author, title, "Word Count": 100, size: "small", "Vocab Level": "A1" }
}

function shelfEntry(book: BookIndexEntry, overrides: Partial<BookshelfEntry> = {}): BookshelfEntry {
  return {
    book: { lang: book.lang, author: book.author, title: book.title, segments: 100 },
    position: 0,
    revealedThrough: -1,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

describe("shelfCards", () => {
  it("keeps the bookshelf order and skips books that are gone or removed", () => {
    const first = indexBook("Первый")
    const second = indexBook("Второй")
    const removed = indexBook("Удалённый")
    const missing = indexBook("Не в индексе")

    const cards = shelfCards([first, second, removed], [
      shelfEntry(first),
      shelfEntry(removed, { removedAt: new Date("2026-01-02T00:00:00.000Z") }),
      shelfEntry(missing),
      shelfEntry(second),
    ])

    expect(cards.map((card) => card.book.title)).toEqual(["Первый", "Второй"])
  })
})

describe("BookOverviewCard", () => {
  function mountCard(props: Record<string, unknown> = {}) {
    return mount(BookOverviewCard, {
      props: { lang: "ru", title: "Книга", author: "Автор", level: "A1", size: "small", words: 100, ...props },
      global: { stubs },
    })
  }

  it("leaves an unread book looking untouched", () => {
    const wrapper = mountCard()

    expect(wrapper.find(".progress").exists()).toBe(false)
    expect(wrapper.find(".finished").exists()).toBe(false)
    expect(wrapper.text()).not.toContain("Translated")
    expect(wrapper.text()).toContain("A1")
  })

  it("shows how far a read book has got, on its bottom edge", () => {
    const wrapper = mountCard({ progress: 0.45 })
    const bar = wrapper.find(".progress")

    expect(bar.attributes("role")).toBe("progressbar")
    expect(bar.attributes("aria-valuenow")).toBe("45")
    expect(wrapper.find(".progress__fill").attributes("style")).toContain("45%")
    expect(wrapper.find(".finished").exists()).toBe(false)
  })

  it("shows a finished book as a full bar", () => {
    const wrapper = mountCard({ progress: 1 })

    expect(wrapper.text()).not.toContain("Finished")
    expect(wrapper.find(".progress__fill").attributes("style")).toContain("100%")
  })
})

describe("BookshelfSection", () => {
  const books = Array.from({ length: 20 }, (_, index) => indexBook(`Книга ${index + 1}`))
  const entries = books.map((book) => shelfEntry(book))

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("shows one preview row on a desktop and a way to the rest", () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
    })

    expect(wrapper.findAll(".card")).toHaveLength(6)
    expect(wrapper.find(".shelf__toggle").text()).toContain("See all 20")
    expect(wrapper.find(".shelf__toggle").attributes("aria-expanded")).toBe("false")
  })

  it("shows two preview rows on a phone", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))

    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
    })

    expect(wrapper.findAll(".card")).toHaveLength(4)
    expect(wrapper.find(".shelf__toggle").text()).toContain("See all 20")
  })

  it("hides the toggle when everything fits", () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries: entries.slice(0, 3) },
      global: { stubs },
    })

    expect(wrapper.findAll(".card")).toHaveLength(3)
    expect(wrapper.find(".shelf__toggle").exists()).toBe(false)
  })

  it("expands twelve at a time and collapses back to the preview", async () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
    })
    const toggle = wrapper.find(".shelf__toggle")

    await toggle.trigger("click")

    expect(wrapper.findAll(".card")).toHaveLength(12)
    expect(toggle.attributes("aria-expanded")).toBe("true")
    expect(toggle.text()).toBe("Show less")
    expect(wrapper.find(".shelf__more").text()).toBe("Show 8 more")

    await wrapper.find(".shelf__more").trigger("click")

    expect(wrapper.findAll(".card")).toHaveLength(20)
    expect(wrapper.find(".shelf__more").exists()).toBe(false)
    expect(wrapper.find(".shelf__collapse").exists()).toBe(true)

    await wrapper.find(".shelf__collapse").trigger("click")

    expect(wrapper.findAll(".card")).toHaveLength(6)
    expect(wrapper.find(".shelf__toggle").attributes("aria-expanded")).toBe("false")
  })

  it("collapses from the heading as well as the foot", async () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
    })
    const toggle = wrapper.find(".shelf__toggle")

    await toggle.trigger("click")
    await toggle.trigger("click")

    expect(wrapper.findAll(".card")).toHaveLength(6)
    expect(wrapper.find(".shelf__foot").exists()).toBe(false)
  })

  it("switches to edit mode, removes, and undoes through the toast", async () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
      attachTo: document.body,
    })

    await wrapper.find(".shelf__edit").trigger("click")

    expect(wrapper.find(".shelf__edit").text()).toBe("Done")
    expect(wrapper.find(".tile").element.tagName).toBe("DIV")
    expect(wrapper.find("a").exists()).toBe(false)

    const remove = wrapper.findAll(".remove")[0]
    expect(remove.attributes("aria-label")).toBe("Remove Книга 1 from your shelf")

    await remove.trigger("click")
    await nextTick()

    expect(wrapper.emitted("remove")?.[0]?.[0]).toEqual({
      lang: "ru",
      author: "Author",
      title: "Книга 1",
    })

    const toast = [...document.querySelectorAll(".shelf-undo-toast")].at(-1)
    expect(toast?.getAttribute("aria-live")).toBe("polite")
    expect(toast?.textContent).toContain("Removed")
    expect(toast?.textContent).toContain("Книга 1")
    expect(toast?.textContent).toContain("Undo")

    toast?.querySelector<HTMLButtonElement>(".undo__action")?.click()
    await nextTick()

    expect(wrapper.emitted("restore")?.[0]?.[0]).toEqual({
      lang: "ru",
      author: "Author",
      title: "Книга 1",
    })
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Remove Книга 1 from your shelf",
    )

    wrapper.unmount()
  })

  it("keeps the shelf and its undo bar when the last book is removed", async () => {
    const wrapper = mount(BookshelfSection, {
      props: { books: [books[0]], entries: [entries[0]] },
      global: { stubs },
      attachTo: document.body,
    })

    await wrapper.find(".shelf__edit").trigger("click")
    await wrapper.find(".remove").trigger("click")
    await wrapper.setProps({ entries: [] })
    await nextTick()

    expect(wrapper.find(".shelf").exists()).toBe(true)
    expect(wrapper.find(".shelf__empty").text()).toContain("Your shelf is empty")
    expect(wrapper.find(".shelf__edit").text()).toBe("Done")
    expect(wrapper.find(".shelf--undo").exists()).toBe(true)
    expect([...document.querySelectorAll(".shelf-undo-toast")].at(-1)?.textContent).toContain("Removed")

    await wrapper.find(".shelf__edit").trigger("click")

    expect(wrapper.find(".shelf").exists()).toBe(false)
    wrapper.unmount()
  })

  it("keeps the latest removal in the toast and unwinds the stack", async () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
      attachTo: document.body,
    })

    await wrapper.find(".shelf__edit").trigger("click")
    const buttons = wrapper.findAll(".remove")

    await buttons[0].trigger("click")
    await buttons[1].trigger("click")
    await nextTick()

    const latest = [...document.querySelectorAll(".shelf-undo-toast")].at(-1)
    expect(latest?.textContent).toContain("Книга 2")

    latest?.querySelector<HTMLButtonElement>(".undo__action")?.click()
    await nextTick()
    expect(latest?.textContent).toContain("Книга 1")

    latest?.querySelector<HTMLButtonElement>(".undo__action")?.click()
    await nextTick()

    const restores = wrapper.emitted("restore")
    expect(restores?.[0]?.[0]).toMatchObject({ title: "Книга 2" })
    expect(restores?.[1]?.[0]).toMatchObject({ title: "Книга 1" })

    wrapper.unmount()
  })
})
