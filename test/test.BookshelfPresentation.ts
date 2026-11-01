import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import BookOverviewCard from "@/components/Index/BookOverviewCard.vue";
import BookshelfRail from "@/components/Index/BookshelfRail.vue";
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

describe("BookshelfRail", () => {
  const books = [indexBook("Первая"), indexBook("Вторая"), indexBook("Третья")]
  const entries = books.map((book) => shelfEntry(book))

  it("draws every entry, most recent first, in a scrollable row", () => {
    const wrapper = mount(BookshelfRail, {
      props: { books, entries },
      global: { stubs },
    })

    const titles = wrapper.findAll(".rail__item").map((item) => item.text())
    expect(titles[0]).toContain("Первая")
    expect(titles[2]).toContain("Третья")
    expect(wrapper.find(".rail").exists()).toBe(true)
  })

  it("draws nothing when the bookshelf is empty", () => {
    const wrapper = mount(BookshelfRail, {
      props: { books, entries: [] },
      global: { stubs },
    })

    expect(wrapper.find("section").exists()).toBe(false)
  })
})

describe("BookshelfSection", () => {
  const books = Array.from({ length: 6 }, (_, index) => indexBook(`Книга ${index + 1}`))
  const entries = books.map((book) => shelfEntry(book))

  it("shows three entries and a way to the rest", () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries },
      global: { stubs },
    })

    expect(wrapper.findAll(".card")).toHaveLength(3)
    expect(wrapper.find(".see-all").text()).toContain("See all 6")
  })

  it("hides the link when everything fits", () => {
    const wrapper = mount(BookshelfSection, {
      props: { books, entries: entries.slice(0, 3) },
      global: { stubs },
    })

    expect(wrapper.findAll(".card")).toHaveLength(3)
    expect(wrapper.find(".see-all").exists()).toBe(false)
  })
})
