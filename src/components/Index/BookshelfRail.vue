<script setup lang="ts">
import { computed } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { isFinished, progressFraction } from "@/components/Bookshelf/bookshelf";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
  portrait: { type: Boolean, default: false },
})

const cards = computed(() => shelfCards(props.books, props.entries))
</script>

<template>
  <section v-if="cards.length" class="shelf" aria-label="You are reading">
    <h2 class="shelf__title">You&rsquo;re reading&hellip;</h2>
    <ul class="rail" :class="{ 'rail--portrait': portrait }">
      <li v-for="{ book, entry } in cards" :key="book.author + ': ' + book.title" class="rail__item">
        <BookOverviewCard
          :lang="book.lang"
          :title="book.title"
          :author="book.author"
          :level="levelLabel(book['Vocab Level'])"
          :words="book['Word Count']"
          :size="book.size ?? ''"
          :progress="progressFraction(entry)"
          :finished="isFinished(entry)"
          :portrait="portrait" />
      </li>
    </ul>
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
.rail--portrait .rail__item {
  width: 7rem;
}
</style>
