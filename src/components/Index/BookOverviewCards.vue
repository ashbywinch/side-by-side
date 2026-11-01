<script setup lang="ts">
import { computed } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";
import { isFinished, progressFraction } from "@/components/Bookshelf/bookshelf";

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required:true},
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
  portrait: { type: Boolean, default: false },
})

function entryFor(book: BookIndexEntry): BookshelfEntry | undefined {
  return props.entries.find(
    (entry) =>
     entry.book.lang === book.lang &&
      entry.book.author === book.author &&
      entry.book.title === book.title,
  )
}

const cards = computed(() =>
  props.books.map((book) => ({
    book,
    entry: entryFor(book),
  })),
)
</script>
<template>
  <div class="row" :class="{ 'row--portrait': portrait }">
    <template v-for="{ book, entry } in cards" :key="book.author + ': ' + book.title">
      <BookOverviewCard
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="entry ? progressFraction(entry) : null"
        :finished="entry ? isFinished(entry) : false"
        :portrait="portrait" />
    </template>
  </div>
</template>

<style scoped>
/* Every card is the same width: the catalogue is a grid, not a row of
   content-sized boxes, so a long title cannot make one card wider than its
   neighbour and push the word count off the edge. */
.row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: .75rem;
  align-items: stretch;
}
.row--portrait {
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
}
.row > * {
  min-width: 0;
}
</style>
