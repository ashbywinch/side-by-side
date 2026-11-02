<script setup lang="ts">
import { computed, ref } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import { useCardMinWidth } from "./useCardMinWidth";

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required:true},
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
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
  props.books.map((book) => ({ book, entry: entryFor(book) })),
)

// A floor that keeps the narrowest card looking like a book rather than a strip.
const row = ref<HTMLElement | null>(null)
const minWidth = useCardMinWidth(row)
</script>
<template>
  <div
    ref="row"
    class="row flex"
    :style="minWidth ? { '--card-min': `${minWidth}px` } : undefined">
    <template v-for="{ book, entry } in cards" :key="book.author + ': ' + book.title">
      <BookOverviewCard
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="entry ? progressFraction(entry) : null" />
    </template>
  </div>
</template>

<style scoped>
/* Each card is only as wide as its own content: the link is not allowed to
   grow and fill the row, which otherwise gave every card the same width and
   left the slack as a gutter beside it. */
.row {
  gap: 1rem;
  /* Widths stay content-driven; heights equalise within each wrapped row. */
  align-items: stretch;
}
.row > * {
  flex: 0 0 auto;
  min-width: 0;
}
</style>
