<script setup lang="ts">
import { computed } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
})

const cards = computed(() => shelfCards(props.books, props.entries))

/**
 * A vertical wheel over a horizontal rail does nothing by default, so on a
 * desktop the row looks stuck. Translate it, and only when the rail can
 * actually move that way — otherwise the page keeps its scroll.
 */
function onWheel(event: WheelEvent) {
  const rail = event.currentTarget as HTMLElement | null
  if (!rail || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  const max = rail.scrollWidth - rail.clientWidth
  if (max <= 0) return
  const next = Math.min(Math.max(rail.scrollLeft + event.deltaY, 0), max)
  if (next === rail.scrollLeft) return
  rail.scrollLeft = next
  event.preventDefault()
}
</script>

<template>
  <section v-if="cards.length" class="shelf" aria-label="You are reading">
    <h2 class="shelf__title">You&rsquo;re reading&hellip;</h2>
    <div class="rail-wrap">
      <ul class="rail" @wheel="onWheel">
      <li v-for="{ book, entry } in cards" :key="book.author + ': ' + book.title" class="rail__item">
        <BookOverviewCard
          :lang="book.lang"
          :title="book.title"
          :author="book.author"
          :level="levelLabel(book['Vocab Level'])"
          :words="book['Word Count']"
          :size="book.size ?? ''"
          :progress="progressFraction(entry)" />
      </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1.5rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 .5rem;
}
.rail-wrap {
  position: relative;
}
.rail-wrap::after {
  content: "";
  position: absolute;
  inset-block: 0;
  right: 0;
  width: 2.5rem;
  background: linear-gradient(to right, transparent, var(--va-background-primary, #fff));
  pointer-events: none;
}
.rail {
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0 0 .5rem;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
.rail__item {
  display: flex;
  flex: 0 0 auto;
  width: 14rem;
  scroll-snap-align: start;
}
.rail__item :deep(a) {
  display: flex;
  flex: 1;
  min-width: 0;
}
</style>
