<script setup lang="ts">
import { computed, nextTick, ref } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import { useCardMinWidth } from "./useCardMinWidth";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const VISIBLE = 3;
const STEP = 12;

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
})

const cards = computed(() => shelfCards(props.books, props.entries))
const limit = ref(VISIBLE)
const shown = computed(() => cards.value.slice(0, limit.value))
const expanded = computed(
  () => cards.value.length > VISIBLE && limit.value > VISIBLE,
)
const remaining = computed(() =>
  Math.max(cards.value.length - shown.value.length, 0),
)
const nextStep = computed(() => Math.min(STEP, remaining.value))

const stack = ref<HTMLElement | null>(null)
const section = ref<HTMLElement | null>(null)
const headerToggle = ref<HTMLButtonElement | null>(null)
const bottomCollapse = ref<HTMLButtonElement | null>(null)

const minWidth = useCardMinWidth(stack)

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

function scrollToShelf(): void {
  section.value?.scrollIntoView?.({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  })
}

function toggle(): void {
  if (expanded.value) {
    collapse()
    return
  }
  limit.value = Math.min(cards.value.length, STEP)
  void nextTick(scrollToShelf)
}

function showMore(): void {
  const atEnd = limit.value + STEP >= cards.value.length
  limit.value = Math.min(cards.value.length, limit.value + STEP)
  if (atEnd) {
    // The control is removed once the last book is shown; keep the keyboard
    // user on a control that still exists.
    void nextTick(() => bottomCollapse.value?.focus())
  }
}

function collapse(): void {
  limit.value = VISIBLE
  void nextTick(() => {
    headerToggle.value?.focus()
    scrollToShelf()
  })
}
</script>

<template>
  <section
    v-if="cards.length"
    ref="section"
    class="shelf"
    aria-labelledby="shelf-title">
    <div class="shelf__head">
      <h2 id="shelf-title" class="shelf__title">You&rsquo;re reading&hellip;</h2>
      <button
        v-if="cards.length > VISIBLE"
        ref="headerToggle"
        type="button"
        class="text-action shelf__toggle"
        :aria-expanded="expanded"
        aria-controls="shelf-grid"
        @click="toggle">
        {{ expanded ? "Show less" : `See all ${cards.length} books` }}
      </button>
    </div>
    <div
      id="shelf-grid"
      ref="stack"
      class="stack"
      :style="minWidth ? { '--card-min': `${minWidth}px` } : undefined">
      <BookOverviewCard
        v-for="{ book, entry } in shown"
        :key="book.author + ': ' + book.title"
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="progressFraction(entry)" />
    </div>
    <div v-if="expanded" class="shelf__foot">
      <button
        v-if="remaining > 0"
        type="button"
        class="text-action shelf__more"
        @click="showMore">
        Show {{ nextStep }} more
      </button>
      <button
        ref="bottomCollapse"
        type="button"
        class="text-action shelf__collapse"
        @click="collapse">
        Show less
      </button>
    </div>
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1rem;
  scroll-margin-top: 1rem;
}
.shelf__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .25rem .75rem;
  margin-bottom: .5rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
.text-action {
  min-height: 2.75rem;
  padding: .25rem 0;
  border: 0;
  background: none;
  color: var(--va-primary);
  font: inherit;
  font-size: .85rem;
  font-weight: 400;
  cursor: pointer;
}
.text-action:hover {
  text-decoration: underline;
}
.text-action:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}
.shelf__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: .25rem 1.5rem;
  margin-top: .75rem;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 1rem;
}
.stack > * {
  flex: 0 0 auto;
  min-width: 0;
}
/* A pointer does not need the phone-sized hit area; keep the header quiet on a
   desktop while leaving the 44px target on touch. */
@media (pointer: fine) {
  .text-action {
    min-height: auto;
    padding-block: .1rem;
  }
}
</style>
