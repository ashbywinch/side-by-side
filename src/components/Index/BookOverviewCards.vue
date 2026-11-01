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
  <div class="row flex">
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
.row {
  gap: .75rem;
}
</style>
